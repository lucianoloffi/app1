-- Lovi — painel admin, aba Usuários
--
-- As filas do painel (Moderação, Verificação, Fotos) mostram só quem espera
-- uma decisão. Não havia como achar uma conta qualquer para conferir o perfil:
-- o perfil impróprio que ninguém denunciou ainda, ou quem acabou de entrar.
-- Duas funções novas, as duas security definer conferindo is_admin(), como o
-- resto do painel:
--
--   painel_usuarios   a lista, uma pessoa por linha, com busca, filtro, ordem
--                     e páginas de 50.
--   perfil_para_admin o perfil completo de qualquer pessoa, no mesmo formato
--                     do perfil_publico, para a aba que o "Ver perfil" abre.
--                     A perfil_do_match não serve: só devolve quem deu match
--                     com a conta logada, e esconde quem está sob sanção.
--
-- Nenhuma tabela muda: tudo já estava gravado (0013, 0015, 0021).

-- ───────────────────────── painel_usuarios ─────────────────────────
--
-- Filtros ('todos' deixa de fora os perfis de teste do `npm run popular`,
-- e-mail @lovi.test, como o funil; os outros também, exceto 'teste'):
--   com_denuncia  denúncia que não está resolvida
--   suspensos     suspensão em vigor (a vencida já é conta ativa, sob_sancao)
--   banidos
--   sem_foto      nenhuma foto aprovada: a pessoa não aparece na fila (0023)
--   incompletos   não concluiu o cadastro
--   teste         só os perfis de teste
--
-- Colunas de números:
--   curtidas_dadas / curtidas_recebidas  swipes 'like' que existem hoje.
--     Desfazer o match apaga os dois swipes, então essas curtidas saem da
--     conta.
--   matches    historico_matches: todos os que já aconteceram, inclusive os
--              desfeitos (decisão do Lu em 25/09). Quem deu 20 matches e
--              desfez 19 é sinal que a contagem de hoje esconderia.
--   conversas  os mesmos matches em que houve ao menos uma mensagem
--              (primeira_mensagem_em). Também sobrevive ao match desfeito,
--              que apaga as mensagens mas não o histórico.

create or replace function public.painel_usuarios(
  p_busca  text default '',
  p_filtro text default 'todos',
  p_ordem  text default 'recentes',
  p_pagina integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_busca text := lower(btrim(coalesce(p_busca, '')));
  v_res   jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel admin.' using errcode = '42501';
  end if;
  if p_filtro not in ('todos','com_denuncia','suspensos','banidos','sem_foto','incompletos','teste') then
    raise exception 'Filtro inválido.';
  end if;
  if p_ordem not in ('recentes','acesso','denuncias') then
    raise exception 'Ordem inválida.';
  end if;

  with base as (
    select p.id,
           coalesce(nullif(btrim(coalesce(p.nome, '')), ''), 'Sem nome') as nome,
           u.email,
           case when p.data_nascimento is null then null
                else extract(year from age(p.data_nascimento))::int end as idade,
           p.cidade,
           p.criado_em,
           p.onboarding_completo,
           p.visivel,
           -- Suspensão vencida é conta ativa (0015): sem isso a lista diria
           -- "suspenso até ontem" para quem já voltou.
           case when p.status_moderacao = 'suspenso'
                     and not public.sob_sancao(p.status_moderacao, p.suspensao_termina_em)
                then 'ativo' else p.status_moderacao end as status_moderacao,
           p.suspensao_termina_em,
           p.verificacao_status,
           coalesce(u.email ilike '%@lovi.test', false) as teste
      from public.profiles p
      join auth.users u on u.id = p.id
     -- strpos e não ilike: um "_" ou "%" digitado na busca é letra, não curinga.
     where v_busca = ''
        or strpos(lower(coalesce(p.nome, '')), v_busca) > 0
        or strpos(lower(coalesce(u.email, '')), v_busca) > 0
        or strpos(lower(coalesce(p.cidade, '')), v_busca) > 0
  ),
  numeros as (
    select b.*,
           f.fotos, f.fotos_reprovadas, f.fotos_aprovadas, f.capa_path, f.capa_status,
           (select max(a.dia) from public.atividade_diaria a where a.user_id = b.id) as ultimo_acesso,
           (select count(*) from public.reports r
             where r.denunciado_id = b.id and r.status <> 'resolvida') as denuncias_abertas,
           (select count(*) from public.reports r where r.denunciado_id = b.id) as denuncias_total
      from base b
      cross join lateral (
        select count(*) as fotos,
               count(*) filter (where ph.status_moderacao = 'rejeitada') as fotos_reprovadas,
               count(*) filter (where ph.status_moderacao = 'aprovada') as fotos_aprovadas,
               -- A capa é a principal, na ordem em que o perfil mostra as
               -- fotos. Reprovada aparece mesmo assim, com o anel vermelho.
               (array_agg(ph.storage_path order by ph.principal desc, ph.ordem, ph.criado_em))[1] as capa_path,
               (array_agg(ph.status_moderacao order by ph.principal desc, ph.ordem, ph.criado_em))[1] as capa_status
          from public.photos ph
         where ph.user_id = b.id
      ) f
  ),
  com_filtro as (
    select n.*,
           case p_filtro
             when 'todos'        then not n.teste
             when 'com_denuncia' then not n.teste and n.denuncias_abertas > 0
             when 'suspensos'    then not n.teste and n.status_moderacao = 'suspenso'
             when 'banidos'      then not n.teste and n.status_moderacao = 'banido'
             when 'sem_foto'     then not n.teste and n.fotos_aprovadas = 0
             when 'incompletos'  then not n.teste and not n.onboarding_completo
             when 'teste'        then n.teste
           end as no_filtro
      from numeros n
  ),
  pagina as (
    select c.*
      from com_filtro c
     where c.no_filtro
     order by
       case when p_ordem = 'acesso' then c.ultimo_acesso end desc nulls last,
       case when p_ordem = 'denuncias' then c.denuncias_abertas end desc,
       case when p_ordem = 'denuncias' then c.denuncias_total end desc,
       c.criado_em desc,
       c.id
     limit 50 offset greatest(p_pagina, 0) * 50
  )
  select jsonb_build_object(
    'total', (select count(*) from com_filtro where no_filtro),
    -- Com a busca aplicada, para o número de cada botão bater com o que ele
    -- mostra ao ser tocado.
    'contagens', jsonb_build_object(
      'todos',        (select count(*) from numeros where not teste),
      'com_denuncia', (select count(*) from numeros where not teste and denuncias_abertas > 0),
      'suspensos',    (select count(*) from numeros where not teste and status_moderacao = 'suspenso'),
      'banidos',      (select count(*) from numeros where not teste and status_moderacao = 'banido'),
      'sem_foto',     (select count(*) from numeros where not teste and fotos_aprovadas = 0),
      'incompletos',  (select count(*) from numeros where not teste and not onboarding_completo),
      'teste',        (select count(*) from numeros where teste)
    ),
    'itens', coalesce((
      select jsonb_agg(jsonb_build_object(
               'id', pg.id,
               'nome', pg.nome,
               'email', pg.email,
               'idade', pg.idade,
               'cidade', pg.cidade,
               'entrou_em', pg.criado_em,
               'ultimo_acesso', pg.ultimo_acesso,
               'capa_path', pg.capa_path,
               'capa_status', pg.capa_status,
               'fotos', pg.fotos,
               'fotos_reprovadas', pg.fotos_reprovadas,
               -- Os quatro números só para as 50 da página, não para a base
               -- inteira: é a parte cara da consulta.
               'curtidas_dadas', (select count(*) from public.swipes s
                                   where s.de_user_id = pg.id and s.acao = 'like'),
               'curtidas_recebidas', (select count(*) from public.swipes s
                                       where s.para_user_id = pg.id and s.acao = 'like'),
               'matches', (select count(*) from public.historico_matches h
                            where h.user_a = pg.id or h.user_b = pg.id),
               'conversas', (select count(*) from public.historico_matches h
                              where (h.user_a = pg.id or h.user_b = pg.id)
                                and h.primeira_mensagem_em is not null),
               'cadastro_completo', pg.onboarding_completo,
               'visivel', pg.visivel,
               'teste', pg.teste,
               'status_moderacao', pg.status_moderacao,
               'suspensao_termina_em', pg.suspensao_termina_em,
               'verificacao_status', pg.verificacao_status,
               'denuncias_abertas', pg.denuncias_abertas
             ) order by
               case when p_ordem = 'acesso' then pg.ultimo_acesso end desc nulls last,
               case when p_ordem = 'denuncias' then pg.denuncias_abertas end desc,
               case when p_ordem = 'denuncias' then pg.denuncias_total end desc,
               pg.criado_em desc,
               pg.id)
        from pagina pg
    ), '[]'::jsonb)
  ) into v_res;

  return v_res;
end;
$$;

revoke all on function public.painel_usuarios(text, text, text, integer) from public, anon;
grant execute on function public.painel_usuarios(text, text, text, integer) to authenticated;

-- ───────────────────────── perfil_para_admin ─────────────────────────
--
-- As mesmas colunas do perfil_publico que a perfil_do_match (0030, a última
-- que a define) devolve, com os mesmos nomes, para o app passar pelo mesmo
-- mapeamento (paraPerfis) e a tela ser a mesma. Diferenças, de propósito:
--   · qualquer pessoa, sem exigir match nem esconder quem está sob sanção:
--     é justamente quem o admin precisa ver;
--   · distance_km sempre nulo: distância é de quem olha, e o admin não é
--     ninguém na fila;
--   · só fotos aprovadas, como os outros veem, e fotos_fora_do_perfil conta
--     as que não aparecem, para a faixa do painel avisar;
--   · mais e-mail, sanção, denúncias abertas e visibilidade, para a faixa.
-- Devolve null se a conta não existe (excluída depois de a lista abrir).

create or replace function public.perfil_para_admin(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_res jsonb;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel admin.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'id', o.id,
    'name', o.nome,
    'age', extract(year from age(o.data_nascimento))::int,
    'gender', o.genero,
    'profession', o.profissao,
    'city', o.cidade,
    'distance_km', null,
    'intention', o.intencao,
    'interests', coalesce((select array_agg(i.interesse order by i.interesse)
                             from public.profile_interests i where i.user_id = o.id), '{}'::text[]),
    'bio', o.bio,
    'photos', coalesce((select array_agg(f.storage_path order by f.principal desc, f.ordem, f.criado_em)
                          from public.photos f
                         where f.user_id = o.id and f.status_moderacao = 'aprovada'), '{}'::text[]),
    'bebida', o.bebida,
    'atividade', o.atividade,
    'filhos', o.filhos,
    'relationship_status', o.status_relacionamento,
    'height', o.altura_m,
    'verificado', o.verificacao_status = 'aprovada',
    'alimentacao', o.alimentacao,
    'religiao', o.religiao,
    'politica', o.politica,
    'fumo', o.fumo,
    'tempo_livre', o.tempo_livre,
    'o_que_valoriza', o.o_que_valoriza,
    'email', (select u.email from auth.users u where u.id = o.id),
    'status_moderacao', case when o.status_moderacao = 'suspenso'
                              and not public.sob_sancao(o.status_moderacao, o.suspensao_termina_em)
                             then 'ativo' else o.status_moderacao end,
    'suspensao_termina_em', o.suspensao_termina_em,
    'denuncias_abertas', (select count(*) from public.reports r
                           where r.denunciado_id = o.id and r.status <> 'resolvida'),
    'visivel', o.visivel,
    'fotos_fora_do_perfil', (select count(*) from public.photos f
                              where f.user_id = o.id and f.status_moderacao <> 'aprovada')
  )
  into v_res
  from public.profiles o
  where o.id = p_user_id;

  return v_res;
end;
$$;

revoke all on function public.perfil_para_admin(uuid) from public, anon;
grant execute on function public.perfil_para_admin(uuid) to authenticated;

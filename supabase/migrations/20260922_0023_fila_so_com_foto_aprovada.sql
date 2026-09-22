-- Lovi — perfil sem nenhuma foto aprovada sai da fila
--
-- A 0021 deu ao painel o botão de reprovar foto, e a foto reprovada some para
-- os outros (fila_descobrir só junta as 'aprovada'). Mas o PERFIL continuava
-- na fila: quem tinha todas as fotos reprovadas — ou tinha apagado todas pela
-- tela de Fotos — aparecia para os outros como um card sem foto nenhuma,
-- curtível. Pior que sumir: a moderação reprovava a foto e a pessoa continuava
-- ali, só que em branco.
--
-- Agora a fila exige ao menos uma foto aprovada, e o app avisa a dona disso
-- (RejectedPhotoNotice): "enquanto você não tiver nenhuma foto aprovada, seu
-- perfil não aparece para ninguém na fila". Volta sozinho quando ela envia uma
-- foto nova (que entra 'aprovada') — nada a desfazer.
--
-- distancia_do_mais_proximo (0020) ganha a mesma linha: ela diz a que
-- distância está a pessoa mais próxima QUE PASSARIA na fila. Sem a linha, ela
-- contaria um perfil sem foto que a fila não mostra, e a tela mandaria ajustar
-- o filtro por causa de alguém que nunca apareceria.
--
-- Corpos copiados das ÚLTIMAS migrations que definem cada função
-- (fila_descobrir da 0022, distancia_do_mais_proximo da 0020), conferidos por
-- diff: a nova é a antiga mais as duas linhas do "exists", nada além.
--
-- Ordem do deploy: não muda o formato de nada que o cliente lê. Pode ser
-- aplicada antes do push.

create or replace function public.fila_descobrir(p_limit int default 20, p_offset int default 0)
returns setof public.perfil_publico
language sql
security definer
stable
set search_path = public, extensions
as $$
  with eu as (
    select p.id, p.localizacao,
           pr.interesse_em, pr.intencao_filtro, pr.distancia_max_km,
           pr.idade_min, pr.idade_max
      from public.profiles p
      join public.profile_preferences pr on pr.user_id = p.id
     where p.id = auth.uid()
       and not public.sob_sancao(p.status_moderacao, p.suspensao_termina_em)
  )
  select
    o.id,
    o.nome,
    extract(year from age(o.data_nascimento))::int,
    o.genero,
    o.profissao,
    o.cidade,
    case
      when not o.mostrar_distancia then null
      when o.localizacao_aproximada then null
      when eu.localizacao is null or o.localizacao is null then null
      else round(st_distance(eu.localizacao, o.localizacao) / 1000.0)::int
    end,
    o.intencao,
    coalesce((select array_agg(i.interesse order by i.interesse)
                from public.profile_interests i where i.user_id = o.id), '{}'::text[]),
    o.bio,
    coalesce((select array_agg(f.storage_path order by f.principal desc, f.ordem, f.criado_em)
                from public.photos f
               where f.user_id = o.id and f.status_moderacao = 'aprovada'), '{}'::text[]),
    o.bebida, o.atividade, o.filhos, o.status_relacionamento, o.altura_m,
    o.verificacao_status = 'aprovada'
  from public.profiles o
  cross join eu
  where o.id <> eu.id
    and o.visivel
    and o.onboarding_completo
    and o.data_nascimento is not null
    and not public.sob_sancao(o.status_moderacao, o.suspensao_termina_em)
    and exists (select 1 from public.photos f
                 where f.user_id = o.id and f.status_moderacao = 'aprovada')
    and (eu.interesse_em is null or eu.interesse_em = 'todos' or o.genero = eu.interesse_em)
    and (eu.intencao_filtro is null or o.intencao = any(eu.intencao_filtro))
    and extract(year from age(o.data_nascimento))::int between eu.idade_min and eu.idade_max
    and not exists (select 1 from public.swipes s
                     where s.de_user_id = eu.id and s.para_user_id = o.id)
    and not exists (select 1 from public.blocks b
                     where (b.bloqueador_id = eu.id and b.bloqueado_id = o.id)
                        or (b.bloqueador_id = o.id and b.bloqueado_id = eu.id))
    and (
      eu.localizacao is null
      or o.localizacao is null
      or st_dwithin(eu.localizacao, o.localizacao, eu.distancia_max_km * 1000)
    )
  order by
    o.localizacao_aproximada asc,
    case
      when eu.localizacao is null or o.localizacao is null then 1e9
      else st_distance(eu.localizacao, o.localizacao)
    end asc,
    o.criado_em desc
  limit greatest(p_limit, 1) offset greatest(p_offset, 0);
$$;

create or replace function public.distancia_do_mais_proximo()
returns integer
language sql
stable
security definer
set search_path = public, extensions
as $$
  with eu as (
    select p.id, p.localizacao,
           pr.interesse_em, pr.intencao_filtro,
           pr.idade_min, pr.idade_max
      from public.profiles p
      join public.profile_preferences pr on pr.user_id = p.id
     where p.id = auth.uid()
       and not public.sob_sancao(p.status_moderacao, p.suspensao_termina_em)
       and p.localizacao is not null
  )
  select round(min(st_distance(eu.localizacao, o.localizacao)) / 1000.0)::int
    from public.profiles o
    cross join eu
   where o.id <> eu.id
     and o.localizacao is not null
     and o.visivel
     and o.onboarding_completo
     and o.data_nascimento is not null
     and not public.sob_sancao(o.status_moderacao, o.suspensao_termina_em)
     and exists (select 1 from public.photos f
                  where f.user_id = o.id and f.status_moderacao = 'aprovada')
     and (eu.interesse_em is null or eu.interesse_em = 'todos' or o.genero = eu.interesse_em)
     and (eu.intencao_filtro is null or o.intencao = any(eu.intencao_filtro))
     and extract(year from age(o.data_nascimento))::int between eu.idade_min and eu.idade_max
     and not exists (select 1 from public.swipes s
                      where s.de_user_id = eu.id and s.para_user_id = o.id)
     and not exists (select 1 from public.reports d
                      where d.denunciante_id = eu.id and d.denunciado_id = o.id)
     and not exists (select 1 from public.blocks b
                      where (b.bloqueador_id = eu.id and b.bloqueado_id = o.id)
                         or (b.bloqueador_id = o.id and b.bloqueado_id = eu.id));
$$;

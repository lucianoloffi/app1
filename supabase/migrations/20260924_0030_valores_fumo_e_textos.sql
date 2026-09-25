-- Lovi — valores, fumo e dois textos novos no perfil
--
-- O cadastro ganhou duas telas e uma pergunta:
--   · "Seus valores" (antes de "Do que você gosta?"): alimentação, religião ou
--     crença e a importância da política num relacionamento;
--   · "Você fuma?", no grupo Estilo de vida, junto de bebida e filhos;
--   · "Conte mais sobre você" (depois de "Do que você gosta?"): o que a pessoa
--     gosta de fazer no tempo livre e o que ela valoriza em uma pessoa.
--
-- Tudo opcional. Sem resposta é null, como nos campos de estilo de vida: não
-- existe valor "prefiro não responder" (decisão do Lu em 24/09). As chaves
-- são as mesmas de src/types.ts; mudar a lista pede migration nova com o
-- mesmo conjunto no check.
--
-- Religião e opinião política são dado pessoal SENSÍVEL na LGPD (art. 5º, II).
-- Entram sob o consentimento de dados sensíveis que o cadastro já registra, e
-- estão na política de privacidade desde a 1.8.
--
-- ── Quem vê ──
-- As seis colunas entram no perfil_publico: aparecem para quem cruza com o
-- perfil na fila e para os matches, como bebida e filhos. É o motivo de
-- existirem ("Suas respostas ajudam a iniciar conversas"). Nada disso entra
-- nos filtros da fila.
--
-- Ordem do deploy: só acrescenta (colunas, permissão, campos no fim do tipo).
-- O cliente antigo ignora as colunas a mais. Aplicar ANTES do push: o cliente
-- novo grava nas colunas e, sem elas, o cadastro falharia no último passo.

-- ───────────────────── 1. as colunas ─────────────────────
alter table public.profiles
  add column if not exists alimentacao text,
  add column if not exists religiao text,
  add column if not exists politica text,
  add column if not exists fumo text,
  add column if not exists tempo_livre text,
  add column if not exists o_que_valoriza text;

-- Nomes fixos: é por eles que src/lib/errors.ts reconhece o erro de tamanho.
alter table public.profiles drop constraint if exists profiles_alimentacao_check;
alter table public.profiles
  add constraint profiles_alimentacao_check
  check (alimentacao in ('como_de_tudo','vegetariano','vegano','outra'));

alter table public.profiles drop constraint if exists profiles_religiao_check;
alter table public.profiles
  add constraint profiles_religiao_check
  check (religiao in ('catolica','evangelica','espirita','umbanda_candomble','judaica',
                      'outra','agnostico','ateu','sem_religiao'));

alter table public.profiles drop constraint if exists profiles_politica_check;
alter table public.profiles
  add constraint profiles_politica_check
  check (politica in ('muito_importante','importante','pouco_importante','nao_faz_diferenca'));

alter table public.profiles drop constraint if exists profiles_fumo_check;
alter table public.profiles
  add constraint profiles_fumo_check
  check (fumo in ('sim','nao','as_vezes'));

-- O mesmo número de TEXTO_LIVRE_MAXIMO em src/onboarding/constants.ts.
alter table public.profiles drop constraint if exists profiles_tempo_livre_tamanho;
alter table public.profiles
  add constraint profiles_tempo_livre_tamanho check (char_length(tempo_livre) <= 200);

alter table public.profiles drop constraint if exists profiles_o_que_valoriza_tamanho;
alter table public.profiles
  add constraint profiles_o_que_valoriza_tamanho check (char_length(o_que_valoriza) <= 200);

-- ───────────────────── 2. o cliente pode escrever ─────────────────────
-- Coluna nova nasce somente-leitura (0010). Estas são da própria pessoa.
grant update (alimentacao, religiao, politica, fumo, tempo_livre, o_que_valoriza)
  on public.profiles to authenticated;

-- ───────────────────── 3. o tipo ganha os campos ─────────────────────
-- No fim, na mesma ordem do select das funções abaixo (ver 0022).
do $$
declare
  campo text;
begin
  foreach campo in array array['alimentacao','religiao','politica','fumo','tempo_livre','o_que_valoriza']
  loop
    if not exists (
      select 1 from pg_attribute a
       where a.attrelid = 'public.perfil_publico'::regclass
         and a.attname = campo
         and not a.attisdropped
    ) then
      execute format('alter type public.perfil_publico add attribute %I text cascade', campo);
    end if;
  end loop;
end;
$$;

-- ───────────────────── 4. as duas funções que devolvem o tipo ─────────────────────
-- Corpos copiados das ÚLTIMAS migrations que definem cada uma (fila_descobrir
-- da 0023, perfil_do_match da 0022), conferidos por diff: a nova é a antiga
-- mais a linha das seis colunas no fim do select, nada além.
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
    o.verificacao_status = 'aprovada',
    o.alimentacao, o.religiao, o.politica, o.fumo, o.tempo_livre, o.o_que_valoriza
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

create or replace function public.perfil_do_match(p_user_id uuid)
returns setof public.perfil_publico
language sql
security definer
stable
set search_path = public, extensions
as $$
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
    o.verificacao_status = 'aprovada',
    o.alimentacao, o.religiao, o.politica, o.fumo, o.tempo_livre, o.o_que_valoriza
  from public.profiles o
  cross join (select id, localizacao from public.profiles where id = auth.uid()) eu
  where o.id = p_user_id
    and not public.sob_sancao(o.status_moderacao, o.suspensao_termina_em)
    and exists (
      select 1 from public.matches m
       where m.ativo
         and m.user_a = least(auth.uid(), p_user_id)
         and m.user_b = greatest(auth.uid(), p_user_id)
    )
    and not exists (
      select 1 from public.blocks b
       where (b.bloqueador_id = auth.uid() and b.bloqueado_id = p_user_id)
          or (b.bloqueador_id = p_user_id and b.bloqueado_id = auth.uid())
    );
$$;

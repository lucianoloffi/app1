-- Lovi — Fase 1: schema base
-- Extensões, tabelas, índices e triggers.

create extension if not exists postgis;
create extension if not exists pgcrypto;

-- ───────────────────────── cidades ─────────────────────────
-- Usadas só como lista fechada de CITY_OPTIONS e para o fallback
-- de localização (centro do município) quando a pessoa nega o GPS.
create table if not exists public.cities (
  id         serial primary key,
  nome       text not null unique,      -- exatamente o valor de CITY_OPTIONS
  uf         text not null,
  centro     geography(Point, 4326) not null,
  criado_em  timestamptz not null default now()
);

-- ───────────────────────── profiles ─────────────────────────
-- nome e data_nascimento são preenchidos no passo 3 do cadastro, depois da
-- criação da conta — por isso nascem nulos e a completude é garantida por
-- onboarding_completo (ver trigger valida_onboarding_completo).
create table if not exists public.profiles (
  id                        uuid primary key references auth.users(id) on delete cascade,
  nome                      text,
  telefone                  text,
  telefone_verificado       boolean not null default false,
  data_nascimento           date,
  bio                       text,
  genero                    text check (genero in ('homem','mulher','outros')),
  cidade                    text references public.cities(nome),
  localizacao               geography(Point, 4326),
  localizacao_atualizada_em timestamptz,
  localizacao_aproximada    boolean not null default false,
  profissao                 text,
  altura_m                  numeric(3,2),
  status_relacionamento     text check (status_relacionamento in
                              ('solteiro','namorando','divorciado','separado','viuvo')),
  intencao                  text check (intencao in ('serio','conhecer','amizade')),
  bebida                    text check (bebida in ('nao-bebo','socialmente','frequentemente')),
  atividade                 text check (atividade in ('todo-dia','algumas-vezes','raramente')),
  filhos                    text check (filhos in ('tenho','nao-tenho','quero-ter','nao-quero')),
  visivel                   boolean not null default true,
  mostrar_distancia         boolean not null default true,
  verificacao_status        text not null default 'nao_solicitada'
                              check (verificacao_status in
                                ('nao_solicitada','pendente','aprovada','rejeitada')),
  onboarding_completo       boolean not null default false,
  criado_em                 timestamptz not null default now(),
  atualizado_em             timestamptz not null default now()
);

comment on column public.profiles.localizacao is
  'GPS arredondado para 2 casas decimais no dispositivo. Nunca exposto a terceiros.';
comment on column public.profiles.cidade is
  'Valor de CITY_OPTIONS. Só exibição — não participa do cálculo de distância.';

-- ──────────────────── preferências e interesses ────────────────────
create table if not exists public.profile_preferences (
  user_id          uuid primary key references public.profiles(id) on delete cascade,
  interesse_em     text check (interesse_em in ('homem','mulher','todos')),
  intencao_filtro  text not null default 'todas'
                     check (intencao_filtro in ('serio','conhecer','amizade','todas')),
  distancia_max_km int not null default 25 check (distancia_max_km between 1 and 500),
  idade_min        int not null default 25 check (idade_min >= 18),
  idade_max        int not null default 45,
  constraint idade_coerente check (idade_max >= idade_min)
);

comment on column public.profile_preferences.interesse_em is
  'DADO SENSÍVEL (orientação sexual). Nunca exposto a terceiros.';

create table if not exists public.profile_interests (
  user_id   uuid not null references public.profiles(id) on delete cascade,
  interesse text not null,
  primary key (user_id, interesse)
);

-- ───────────────────────── fotos ─────────────────────────
create table if not exists public.photos (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  storage_path     text not null unique,
  ordem            int not null default 0,
  principal        boolean not null default false,
  status_moderacao text not null default 'aprovada'
                     check (status_moderacao in ('pendente','aprovada','rejeitada')),
  criado_em        timestamptz not null default now()
);

create unique index if not exists photos_uma_principal
  on public.photos (user_id) where principal;

create table if not exists public.verificacoes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  selfie_path  text not null,
  status       text not null default 'pendente'
                 check (status in ('pendente','aprovada','rejeitada')),
  criado_em    timestamptz not null default now(),
  analisado_em timestamptz
);

-- ──────────────────── swipes, matches, mensagens ────────────────────
create table if not exists public.swipes (
  id           uuid primary key default gen_random_uuid(),
  de_user_id   uuid not null references public.profiles(id) on delete cascade,
  para_user_id uuid not null references public.profiles(id) on delete cascade,
  acao         text not null check (acao in ('like','dislike')),
  criado_em    timestamptz not null default now(),
  unique (de_user_id, para_user_id),
  constraint swipe_nao_em_si check (de_user_id <> para_user_id)
);

create table if not exists public.matches (
  id         uuid primary key default gen_random_uuid(),
  user_a     uuid not null references public.profiles(id) on delete cascade,
  user_b     uuid not null references public.profiles(id) on delete cascade,
  criado_em  timestamptz not null default now(),
  ativo      boolean not null default true,
  finalizada boolean not null default false,
  unique (user_a, user_b),
  constraint match_normalizado check (user_a < user_b)
);

comment on column public.matches.ativo is 'false = match desfeito (irreversível pela tela).';
comment on column public.matches.finalizada is 'true = "Conversa finalizada", reversível pelos dois lados.';

create table if not exists public.messages (
  id        uuid primary key default gen_random_uuid(),
  match_id  uuid not null references public.matches(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  conteudo  text not null check (length(btrim(conteudo)) > 0),
  criado_em timestamptz not null default now(),
  lida_em   timestamptz
);

-- ──────────────────── segurança da comunidade ────────────────────
create table if not exists public.blocks (
  id            uuid primary key default gen_random_uuid(),
  bloqueador_id uuid not null references public.profiles(id) on delete cascade,
  bloqueado_id  uuid not null references public.profiles(id) on delete cascade,
  criado_em     timestamptz not null default now(),
  unique (bloqueador_id, bloqueado_id),
  constraint block_nao_em_si check (bloqueador_id <> bloqueado_id)
);

create table if not exists public.reports (
  id             uuid primary key default gen_random_uuid(),
  denunciante_id uuid references public.profiles(id) on delete set null,
  denunciado_id  uuid not null references public.profiles(id) on delete cascade,
  motivo         text not null,
  descricao      text,
  status         text not null default 'aberta'
                   check (status in ('aberta','em_analise','resolvida')),
  criado_em      timestamptz not null default now()
);

-- ──────────────────── ajustes e consentimentos ────────────────────
create table if not exists public.settings (
  user_id         uuid primary key references public.profiles(id) on delete cascade,
  notif_match     boolean not null default true,
  notif_mensagem  boolean not null default true,
  notif_novidades boolean not null default true
);

create table if not exists public.consents (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  tipo      text not null check (tipo in ('termos','privacidade','diretrizes','dados_sensiveis')),
  versao    text not null,
  aceito_em timestamptz not null default now()
);

-- ───────────────────────── índices ─────────────────────────
create index if not exists profiles_localizacao_idx on public.profiles using gist (localizacao);
create index if not exists profiles_cidade_idx      on public.profiles (cidade);
create index if not exists profiles_fila_idx        on public.profiles (visivel, onboarding_completo);
create index if not exists swipes_para_idx          on public.swipes (para_user_id);
create index if not exists messages_match_idx       on public.messages (match_id, criado_em);
create index if not exists blocks_bloqueador_idx    on public.blocks (bloqueador_id);
create index if not exists blocks_bloqueado_idx     on public.blocks (bloqueado_id);
create index if not exists photos_user_idx          on public.photos (user_id, ordem);
create index if not exists matches_user_a_idx       on public.matches (user_a) where ativo;
create index if not exists matches_user_b_idx       on public.matches (user_b) where ativo;

-- ───────────────────────── triggers ─────────────────────────

-- (e) atualizado_em
create or replace function public.tg_atualiza_timestamp()
returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists profiles_atualizado_em on public.profiles;
create trigger profiles_atualizado_em
  before update on public.profiles
  for each row execute function public.tg_atualiza_timestamp();

-- (b) data de nascimento imutável depois de preenchida + (4.2) gate de 18 anos.
-- O gate não pode ser CHECK: o Postgres exige funções IMMUTABLE em CHECK e
-- current_date é STABLE. Fica como trigger, igualmente no servidor.
create or replace function public.tg_valida_nascimento()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE'
     and old.data_nascimento is not null
     and new.data_nascimento is distinct from old.data_nascimento then
    raise exception 'A data de nascimento não pode ser alterada.';
  end if;

  if new.data_nascimento is not null
     and new.data_nascimento > (current_date - interval '18 years') then
    raise exception 'É preciso ter 18 anos ou mais para usar o Lovi.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_valida_nascimento on public.profiles;
create trigger profiles_valida_nascimento
  before insert or update on public.profiles
  for each row execute function public.tg_valida_nascimento();

-- (a) cria perfil, preferências e ajustes junto com o usuário do auth
create or replace function public.tg_novo_usuario()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, telefone)
  values (new.id, nullif(new.raw_user_meta_data ->> 'telefone', ''))
  on conflict (id) do nothing;

  insert into public.profile_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.settings (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tg_novo_usuario();

-- (c) match por curtida mútua
create or replace function public.tg_match_por_curtida()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_a uuid;
  v_b uuid;
begin
  if new.acao <> 'like' then
    return new;
  end if;

  if not exists (
    select 1 from public.swipes s
    where s.de_user_id = new.para_user_id
      and s.para_user_id = new.de_user_id
      and s.acao = 'like'
  ) then
    return new;
  end if;

  v_a := least(new.de_user_id, new.para_user_id);
  v_b := greatest(new.de_user_id, new.para_user_id);

  insert into public.matches (user_a, user_b)
  values (v_a, v_b)
  on conflict (user_a, user_b) do update
    set ativo = true, finalizada = false, criado_em = now();

  return new;
end;
$$;

drop trigger if exists swipes_match on public.swipes;
create trigger swipes_match
  after insert on public.swipes
  for each row execute function public.tg_match_por_curtida();

-- (d) bloquear desativa o match existente
create or replace function public.tg_block_desativa_match()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.matches
     set ativo = false
   where user_a = least(new.bloqueador_id, new.bloqueado_id)
     and user_b = greatest(new.bloqueador_id, new.bloqueado_id);
  return new;
end;
$$;

drop trigger if exists blocks_desativa_match on public.blocks;
create trigger blocks_desativa_match
  after insert on public.blocks
  for each row execute function public.tg_block_desativa_match();

-- Máximo de 6 interesses e de 6 fotos por pessoa
create or replace function public.tg_limite_interesses()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.profile_interests where user_id = new.user_id) > 6 then
    raise exception 'Máximo de 6 interesses.';
  end if;
  return null;
end;
$$;

drop trigger if exists interests_limite on public.profile_interests;
create constraint trigger interests_limite
  after insert on public.profile_interests
  deferrable initially immediate
  for each row execute function public.tg_limite_interesses();

create or replace function public.tg_limite_fotos()
returns trigger language plpgsql as $$
begin
  if (select count(*) from public.photos where user_id = new.user_id) > 6 then
    raise exception 'Máximo de 6 fotos.';
  end if;
  return null;
end;
$$;

drop trigger if exists photos_limite on public.photos;
create constraint trigger photos_limite
  after insert on public.photos
  deferrable initially immediate
  for each row execute function public.tg_limite_fotos();

-- Só deixa marcar o cadastro como completo com o mínimo exigido pelas telas
create or replace function public.tg_valida_onboarding_completo()
returns trigger language plpgsql as $$
begin
  if new.onboarding_completo and not coalesce(old.onboarding_completo, false) then
    if new.nome is null or btrim(new.nome) = '' then
      raise exception 'Informe seu nome antes de concluir o cadastro.';
    end if;
    if new.data_nascimento is null then
      raise exception 'Informe sua data de nascimento antes de concluir o cadastro.';
    end if;
    if new.genero is null or new.cidade is null or new.intencao is null then
      raise exception 'Complete gênero, cidade e intenção antes de concluir o cadastro.';
    end if;
    if (select count(*) from public.profile_interests where user_id = new.id) < 3 then
      raise exception 'Escolha pelo menos 3 interesses.';
    end if;
    if (select count(*) from public.photos where user_id = new.id) < 3 then
      raise exception 'Envie pelo menos 3 fotos.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_valida_onboarding on public.profiles;
create trigger profiles_valida_onboarding
  before update on public.profiles
  for each row execute function public.tg_valida_onboarding_completo();

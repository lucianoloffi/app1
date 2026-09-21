-- Lovi — registros para o painel admin
--
-- O painel (V0: novos usuários, usuários ativos, % de ativos com match,
-- conversas iniciadas, cidades com mais usuários; completo: funil, retenção
-- D7, contas excluídas) precisa de informação que o banco não guardava:
--   * quando cada pessoa usou o app — nada registrava isso;
--   * matches do passado — desfazer_match apaga o match, as curtidas e (em
--     cascata) as mensagens, então o número de ontem diminuía hoje;
--   * contas excluídas — a conta some inteira, inclusive o fato de ter existido.
--
-- Quatro tabelas novas, só do servidor: RLS ligada e nenhuma policy, então o
-- app não lê nem escreve nelas. Quem escreve são gatilhos e o RPC
-- registrar_atividade (security definer); quem vai ler é o painel admin, por
-- funções próprias, numa etapa seguinte.
--
-- Privacidade: excluir a conta apaga os registros da pessoa (cascade a partir
-- de profiles), como o resto dos dados dela. Fica só a CONTAGEM diária de
-- contas excluídas, sem nada que identifique alguém. O custo é pequeno: quem
-- apaga a conta deixa de contar nos números do passado.
--
-- "Dia" é o dia em São Paulo: o painel pergunta "quantos usaram hoje" no
-- horário de Brasília, e em UTC o dia vira às 21h.

create or replace function public.dia_local(p_momento timestamptz)
returns date language sql stable
set search_path = public
as $$ select (p_momento at time zone 'America/Sao_Paulo')::date $$;

-- ───────────────────── 1. dias de uso ─────────────────────
create table if not exists public.atividade_diaria (
  user_id uuid not null references public.profiles(id) on delete cascade,
  dia     date not null,
  primary key (user_id, dia)
);
create index if not exists atividade_diaria_dia_idx on public.atividade_diaria (dia);

-- Chamado pelo app ao abrir e ao voltar para ele. Um registro por pessoa por
-- dia: chamar de novo no mesmo dia não faz nada.
create or replace function public.registrar_atividade()
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.atividade_diaria (user_id, dia)
  select p.id, public.dia_local(now())
    from public.profiles p
   where p.id = auth.uid()
  on conflict do nothing;
$$;

revoke all on function public.registrar_atividade() from public, anon;
grant execute on function public.registrar_atividade() to authenticated;

-- ───────────────────── 2. histórico de matches ─────────────────────
-- Uma linha por match que aconteceu, inclusive o que depois foi desfeito, e
-- uma nova quando o mesmo par volta a dar match. match_id não é chave
-- estrangeira de propósito: o match pode deixar de existir, o histórico não.
create table if not exists public.historico_matches (
  id                   uuid primary key default gen_random_uuid(),
  match_id             uuid not null,
  user_a               uuid not null references public.profiles(id) on delete cascade,
  user_b               uuid not null references public.profiles(id) on delete cascade,
  criado_em            timestamptz not null default now(),
  primeira_mensagem_em timestamptz,
  primeiro_remetente   uuid,
  -- primeira mensagem de quem NÃO mandou a primeira: a conversa teve resposta
  resposta_em          timestamptz
);
create index if not exists historico_matches_criado_idx on public.historico_matches (criado_em);
create index if not exists historico_matches_match_idx on public.historico_matches (match_id, criado_em desc);

-- ───────────────────── 3. marcos de cada pessoa ─────────────────────
-- Para o funil: a primeira vez que a pessoa passou por cada etapa. Uma vez
-- gravado, o marco não muda (coalesce), mesmo que depois desfaça tudo.
create table if not exists public.marcos_do_usuario (
  user_id               uuid primary key references public.profiles(id) on delete cascade,
  cadastro_concluido_em timestamptz,
  primeira_curtida_em   timestamptz,
  primeiro_match_em     timestamptz,
  primeira_conversa_em  timestamptz,
  primeira_resposta_em  timestamptz
);

-- ───────────────────── 4. contas excluídas ─────────────────────
create table if not exists public.contas_excluidas (
  dia        date primary key,
  quantidade integer not null default 0
);

-- Só o servidor: nenhuma policy, e sem permissão de tabela para o app.
alter table public.atividade_diaria  enable row level security;
alter table public.historico_matches enable row level security;
alter table public.marcos_do_usuario enable row level security;
alter table public.contas_excluidas  enable row level security;
revoke all on public.atividade_diaria, public.historico_matches,
              public.marcos_do_usuario, public.contas_excluidas
  from anon, authenticated;

-- ───────────────────── gatilhos ─────────────────────
-- Todos security definer: disparam pela ação de uma pessoa logada, que não tem
-- (nem deve ter) permissão nestas tabelas.

create or replace function public.tg_marco_cadastro()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.onboarding_completo and not coalesce(old.onboarding_completo, false) then
    insert into public.marcos_do_usuario (user_id, cadastro_concluido_em)
    values (new.id, now())
    on conflict (user_id) do update
      set cadastro_concluido_em = coalesce(marcos_do_usuario.cadastro_concluido_em, excluded.cadastro_concluido_em);
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_marco_cadastro on public.profiles;
create trigger profiles_marco_cadastro
  after update of onboarding_completo on public.profiles
  for each row execute function public.tg_marco_cadastro();

create or replace function public.tg_marco_curtida()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.acao = 'like' then
    insert into public.marcos_do_usuario (user_id, primeira_curtida_em)
    values (new.de_user_id, now())
    on conflict (user_id) do update
      set primeira_curtida_em = coalesce(marcos_do_usuario.primeira_curtida_em, excluded.primeira_curtida_em);
  end if;
  return new;
end;
$$;

drop trigger if exists swipes_marco_curtida on public.swipes;
create trigger swipes_marco_curtida
  after insert or update of acao on public.swipes
  for each row execute function public.tg_marco_curtida();

-- Match novo, ou o mesmo par voltando a dar match (tg_match_por_curtida
-- reativa a linha existente em vez de criar outra).
create or replace function public.tg_historico_match()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and not (new.ativo and not old.ativo) then
    return new;
  end if;

  insert into public.historico_matches (match_id, user_a, user_b, criado_em)
  values (new.id, new.user_a, new.user_b, now());

  insert into public.marcos_do_usuario (user_id, primeiro_match_em)
  values (new.user_a, now()), (new.user_b, now())
  on conflict (user_id) do update
    set primeiro_match_em = coalesce(marcos_do_usuario.primeiro_match_em, excluded.primeiro_match_em);
  return new;
end;
$$;

drop trigger if exists matches_historico on public.matches;
create trigger matches_historico
  after insert or update of ativo on public.matches
  for each row execute function public.tg_historico_match();

create or replace function public.tg_historico_mensagem()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_h public.historico_matches%rowtype;
begin
  select * into v_h
    from public.historico_matches
   where match_id = new.match_id
   order by criado_em desc
   limit 1;
  if not found then
    return new;
  end if;

  if v_h.primeira_mensagem_em is null then
    update public.historico_matches
       set primeira_mensagem_em = new.criado_em, primeiro_remetente = new.sender_id
     where id = v_h.id;
    insert into public.marcos_do_usuario (user_id, primeira_conversa_em)
    values (v_h.user_a, new.criado_em), (v_h.user_b, new.criado_em)
    on conflict (user_id) do update
      set primeira_conversa_em = coalesce(marcos_do_usuario.primeira_conversa_em, excluded.primeira_conversa_em);
  elsif v_h.resposta_em is null and new.sender_id <> v_h.primeiro_remetente then
    update public.historico_matches set resposta_em = new.criado_em where id = v_h.id;
    insert into public.marcos_do_usuario (user_id, primeira_resposta_em)
    values (v_h.user_a, new.criado_em), (v_h.user_b, new.criado_em)
    on conflict (user_id) do update
      set primeira_resposta_em = coalesce(marcos_do_usuario.primeira_resposta_em, excluded.primeira_resposta_em);
  end if;
  return new;
end;
$$;

drop trigger if exists messages_historico on public.messages;
create trigger messages_historico
  after insert on public.messages
  for each row execute function public.tg_historico_mensagem();

-- Conta apagada (o delete em auth.users desce em cascata até profiles).
create or replace function public.tg_conta_excluida()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.contas_excluidas (dia, quantidade)
  values (public.dia_local(now()), 1)
  on conflict (dia) do update set quantidade = contas_excluidas.quantidade + 1;
  return old;
end;
$$;

drop trigger if exists profiles_conta_excluida on public.profiles;
create trigger profiles_conta_excluida
  after delete on public.profiles
  for each row execute function public.tg_conta_excluida();

-- Funções de gatilho não são chamadas por fora (e o Postgres recusa), mas sem
-- isto o Security Advisor as lista como "executáveis por qualquer um".
revoke execute on function public.tg_marco_cadastro()     from public, anon, authenticated;
revoke execute on function public.tg_marco_curtida()      from public, anon, authenticated;
revoke execute on function public.tg_historico_match()    from public, anon, authenticated;
revoke execute on function public.tg_historico_mensagem() from public, anon, authenticated;
revoke execute on function public.tg_conta_excluida()     from public, anon, authenticated;

-- ───────────────────── histórico que já dá para recuperar ─────────────────────
-- O que ainda está no banco vira ponto de partida, para os números não
-- começarem do zero. É um piso, não o total: o que já foi apagado (matches
-- desfeitos, contas excluídas) não volta. Seguro de rodar de novo: cada insert
-- pula o que já existe.

-- Usou o app no dia em que: criou a conta, curtiu ou dispensou alguém, mandou
-- mensagem.
insert into public.atividade_diaria (user_id, dia)
select id, public.dia_local(criado_em) from public.profiles
union
select de_user_id, public.dia_local(criado_em) from public.swipes
union
select sender_id, public.dia_local(criado_em) from public.messages
on conflict do nothing;

-- Matches que ainda existem, com a primeira mensagem e a primeira resposta.
insert into public.historico_matches (match_id, user_a, user_b, criado_em, primeira_mensagem_em, primeiro_remetente, resposta_em)
select m.id, m.user_a, m.user_b, m.criado_em, pm.criado_em, pm.sender_id,
       (select min(r.criado_em) from public.messages r
         where r.match_id = m.id and r.sender_id <> pm.sender_id)
  from public.matches m
  left join lateral (
    select x.criado_em, x.sender_id from public.messages x
     where x.match_id = m.id order by x.criado_em limit 1
  ) pm on true
 where not exists (select 1 from public.historico_matches h where h.match_id = m.id);

-- Marcos. O cadastro concluído não tinha data: usa a criação do perfil (o
-- cadastro costuma ser feito no mesmo dia).
insert into public.marcos_do_usuario (user_id, cadastro_concluido_em, primeira_curtida_em,
                                      primeiro_match_em, primeira_conversa_em, primeira_resposta_em)
select p.id,
       case when p.onboarding_completo then p.criado_em end,
       (select min(s.criado_em) from public.swipes s where s.de_user_id = p.id and s.acao = 'like'),
       (select min(h.criado_em) from public.historico_matches h where p.id in (h.user_a, h.user_b)),
       (select min(h.primeira_mensagem_em) from public.historico_matches h where p.id in (h.user_a, h.user_b)),
       (select min(h.resposta_em) from public.historico_matches h where p.id in (h.user_a, h.user_b))
  from public.profiles p
on conflict (user_id) do nothing;

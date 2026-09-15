-- Lovi — Fase 1: Row Level Security
-- Regra geral: cada pessoa só enxerga os próprios registros. Tudo que envolve
-- ver OUTRA pessoa passa obrigatoriamente pelas funções do arquivo 0003.

alter table public.cities              enable row level security;
alter table public.profiles            enable row level security;
alter table public.profile_preferences enable row level security;
alter table public.profile_interests   enable row level security;
alter table public.photos              enable row level security;
alter table public.verificacoes        enable row level security;
alter table public.swipes              enable row level security;
alter table public.matches             enable row level security;
alter table public.messages            enable row level security;
alter table public.blocks              enable row level security;
alter table public.reports             enable row level security;
alter table public.settings            enable row level security;
alter table public.consents            enable row level security;

-- cities: lista pública de leitura (não contém dado pessoal)
drop policy if exists cities_leitura on public.cities;
create policy cities_leitura on public.cities
  for select to authenticated using (true);

-- profiles: só a própria linha, em qualquer operação
drop policy if exists profiles_seleciona_propria on public.profiles;
create policy profiles_seleciona_propria on public.profiles
  for select to authenticated using (id = auth.uid());

drop policy if exists profiles_insere_propria on public.profiles;
create policy profiles_insere_propria on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_atualiza_propria on public.profiles;
create policy profiles_atualiza_propria on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- preferências (dado sensível) e interesses
drop policy if exists preferences_proprias on public.profile_preferences;
create policy preferences_proprias on public.profile_preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists interests_proprios on public.profile_interests;
create policy interests_proprios on public.profile_interests
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- fotos: o dono administra as suas; fotos de terceiros só via função
drop policy if exists photos_proprias on public.photos;
create policy photos_proprias on public.photos
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- verificações: ninguém vê a selfie de ninguém
drop policy if exists verificacoes_proprias on public.verificacoes;
create policy verificacoes_proprias on public.verificacoes
  for select to authenticated using (user_id = auth.uid());

drop policy if exists verificacoes_insere_propria on public.verificacoes;
create policy verificacoes_insere_propria on public.verificacoes
  for insert to authenticated with check (user_id = auth.uid());

-- swipes: cada um lê apenas os próprios; ninguém descobre quem curtiu quem
drop policy if exists swipes_proprios on public.swipes;
create policy swipes_proprios on public.swipes
  for select to authenticated using (de_user_id = auth.uid());

drop policy if exists swipes_insere_proprio on public.swipes;
create policy swipes_insere_proprio on public.swipes
  for insert to authenticated with check (de_user_id = auth.uid());

drop policy if exists swipes_apaga_proprio on public.swipes;
create policy swipes_apaga_proprio on public.swipes
  for delete to authenticated using (de_user_id = auth.uid());

-- matches: só os dois participantes
drop policy if exists matches_participantes on public.matches;
create policy matches_participantes on public.matches
  for select to authenticated using (user_a = auth.uid() or user_b = auth.uid());

-- mensagens: leitura pelos dois participantes; envio só pelo autor,
-- e só com o match ativo e não finalizado
drop policy if exists messages_participantes on public.messages;
create policy messages_participantes on public.messages
  for select to authenticated using (
    exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

drop policy if exists messages_envia on public.messages;
create policy messages_envia on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and m.ativo
        and not m.finalizada
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  );

-- marcar como lida: só quem recebeu
drop policy if exists messages_marca_lida on public.messages;
create policy messages_marca_lida on public.messages
  for update to authenticated using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and (m.user_a = auth.uid() or m.user_b = auth.uid())
    )
  ) with check (sender_id <> auth.uid());

-- bloqueios e denúncias: cada um lê apenas os seus
drop policy if exists blocks_proprios on public.blocks;
create policy blocks_proprios on public.blocks
  for all to authenticated using (bloqueador_id = auth.uid()) with check (bloqueador_id = auth.uid());

drop policy if exists reports_proprios on public.reports;
create policy reports_proprios on public.reports
  for select to authenticated using (denunciante_id = auth.uid());

drop policy if exists reports_insere_proprio on public.reports;
create policy reports_insere_proprio on public.reports
  for insert to authenticated with check (denunciante_id = auth.uid());

-- ajustes e consentimentos
drop policy if exists settings_proprios on public.settings;
create policy settings_proprios on public.settings
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists consents_proprios on public.consents;
create policy consents_proprios on public.consents
  for select to authenticated using (user_id = auth.uid());

drop policy if exists consents_insere_proprio on public.consents;
create policy consents_insere_proprio on public.consents
  for insert to authenticated with check (user_id = auth.uid());

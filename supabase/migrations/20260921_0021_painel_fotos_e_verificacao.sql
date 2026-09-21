-- Lovi — fotos e verificação no painel (entrega 3 do painel admin)
--
-- Fecha a pendência 1 do CLAUDE.md. Até aqui as duas coisas eram feitas à mão
-- no Table Editor — e a de verificação não era feita de jeito nenhum: quem
-- pedia o selo ficava 'pendente' para sempre, porque a selfie mora num bucket
-- privado que NINGUÉM além do dono conseguia abrir. A policy de leitura das
-- fotos já liberava o admin desde a 0015; a de verificação ficou para trás.
--
-- Decisões de produto tomadas junto com esta entrega (Lu, 21/09/2026):
--
--  1. A selfie é APAGADA DE VERDADE assim que a análise termina. A tela de
--     verificação promete isso ao usuário, com essas palavras: "A selfie não
--     vai para o seu perfil e é apagada depois da análise." Quem apaga é o
--     painel, pela API de Storage, logo depois de decidir — apagar a linha de
--     storage.objects por SQL daqui deixaria o arquivo órfão no bucket, que
--     não é apagar. Por isso o admin ganha DELETE no bucket, e por isso existe
--     selfie_apagada_em: sem a marca, um apagamento que falhasse sumia em
--     silêncio e a promessa quebrava sem ninguém saber. A tela mostra o que
--     sobrou e oferece tentar de novo.
--
--  2. A foto continua ENTRANDO APROVADA. O contrário (nascer 'pendente') faria
--     o perfil de quem acabou de se cadastrar ficar sem foto nenhuma até
--     alguém olhar — e a fila filtra justamente por foto aprovada. Sem plantão
--     de moderação, seria um app quebrado à espera de uma equipe que não
--     existe. A moderação de foto é reativa: o painel lista o que chegou e o
--     admin derruba o que for abusivo.
--
--     Mas reativo não quer dizer sem fila: photos.moderada_em diz se aquela
--     foto já passou por olho humano. Foto sem marca é foto nova, e é isso que
--     a aba Fotos mostra. Tanto "Aprovar" quanto "Rejeitar" marcam, então a
--     foto sai da fila pelos dois caminhos — inclusive quando a decisão é
--     "não há nada de errado com ela".
--
--  3. Recusar a verificação de quem JÁ TEM o selo é como se tira um selo dado
--     por engano. Não existe ação 'revogar' separada: seria um terceiro estado
--     para dizer a mesma coisa, e 'rejeitada' é o que o app já sabe mostrar
--     ("Precisamos de outra selfie").
--
-- Vocabulário, de novo, porque são três coisas parecidas: profiles.status_moderacao
-- ('ativo','suspenso','banido') é sanção; photos.status_moderacao
-- ('pendente','aprovada','rejeitada') é foto; profiles.verificacao_status
-- ('nao_solicitada','pendente','aprovada','rejeitada') é selo. E profiles.visivel
-- não é nenhuma das três: é escolha da própria pessoa.
--
-- Esta migration só ADICIONA (colunas, funções) e AMPLIA policies de leitura.
-- Nada que o cliente antigo usa é retirado: pode ser aplicada antes do push.

-- ───────────────────── 1. o que a análise deixa registrado ─────────────────────
alter table public.verificacoes
  add column if not exists analisado_por     uuid references auth.users(id) on delete set null,
  add column if not exists selfie_apagada_em timestamptz;

comment on column public.verificacoes.analisado_por is
  'Quem decidiu. Fica null se a conta do administrador for apagada; admin_actions guarda o e-mail.';
comment on column public.verificacoes.selfie_apagada_em is
  'Quando o arquivo saiu do bucket. null = a selfie ainda está lá — o painel avisa e oferece apagar de novo.';

create index if not exists verificacoes_fila_idx on public.verificacoes (status, criado_em desc);
create index if not exists verificacoes_user_idx on public.verificacoes (user_id, criado_em desc);

-- ───────────────────── 2. o que a moderação de foto registra ─────────────────────
-- Sem grant: a 0010 revogou update da tabela e concedeu só (ordem, principal),
-- então coluna nova já nasce somente-leitura para o app, que é o certo aqui.
alter table public.photos
  add column if not exists moderada_em  timestamptz,
  add column if not exists moderada_por uuid references auth.users(id) on delete set null;

comment on column public.photos.moderada_em is
  'Quando alguém olhou esta foto. null = foto nova, ainda na fila da aba Fotos. '
  'Aprovar e rejeitar marcam os dois: a foto sai da fila mesmo quando não há nada de errado com ela.';

-- "Nova" é não olhada E no ar. A segunda metade não é detalhe: foto rejeitada à
-- mão pelo Table Editor, antes desta migration, ficou com moderada_em nulo. Sem
-- esta condição ela cairia na fila de novas com as outras, e o botão "marcar
-- todas como vistas" — que aprova — devolveria ao ar justamente a foto que
-- alguém tinha derrubado de propósito.
create index if not exists photos_fila_moderacao_idx
  on public.photos (criado_em desc)
  where moderada_em is null and status_moderacao <> 'rejeitada';
create index if not exists photos_rejeitadas_idx
  on public.photos (moderada_em desc) where status_moderacao = 'rejeitada';

-- ───────────────────── 3. o painel abre a selfie ─────────────────────
-- Acesso novo a dado pessoal, e dos mais delicados: está declarado na política
-- de privacidade (seção 6.2), junto com o prazo — que aqui é "até o fim da
-- análise", não "enquanto houver conta".
--
-- Copiadas da 0004 (última migration que define as duas) com o `or is_admin()`
-- a mais, e nada além disso.
drop policy if exists verificacoes_le on storage.objects;
create policy verificacoes_le on storage.objects
  for select to authenticated using (
    bucket_id = 'verificacoes'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- O admin apaga porque é ele quem termina a análise. A pessoa continua podendo
-- apagar a própria selfie a qualquer momento, como antes.
drop policy if exists verificacoes_apaga on storage.objects;
create policy verificacoes_apaga on storage.objects
  for delete to authenticated using (
    bucket_id = 'verificacoes'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- ───────────────────── 4. a auditoria aceita as ações novas ─────────────────────
-- Acha o check pelo catálogo em vez de chutar o nome: se o nome não batesse,
-- o drop não faria nada, o add criaria um SEGUNDO check e o antigo continuaria
-- recusando as ações novas — a migration passaria e a tela quebraria depois.
do $$
declare
  v_constraint text;
begin
  for v_constraint in
    select c.conname from pg_constraint c
     where c.conrelid = 'public.admin_actions'::regclass
       and c.contype = 'c'
       and pg_get_constraintdef(c.oid) like '%acao%'
  loop
    execute format('alter table public.admin_actions drop constraint %I', v_constraint);
  end loop;
end;
$$;

alter table public.admin_actions
  add constraint admin_actions_acao_check
  check (acao in ('arquivar','suspender','banir','reativar',
                  'aprovar_foto','rejeitar_foto',
                  'aprovar_verificacao','recusar_verificacao'));

-- ───────────────────── 5. a ficha de quem está sendo analisado ─────────────────────
-- Fotos e Verificação mostram a mesma ficha (nome, idade, cidade, selos de
-- sanção, quantas denúncias). Fica numa função só para as duas não divergirem
-- com o tempo — e porque decidir sobre uma foto sem saber que a pessoa tem
-- quatro denúncias abertas é decidir no escuro.
--
-- A denúncia NÃO usa esta função: lá a pessoa pode não existir mais (a conta
-- foi excluída e a denúncia ficou, desde a 0015), e a ficha vem do que foi
-- copiado dentro da denúncia. Juntar as duas obrigaria a devolver uma ficha
-- vazia para um id que não existe, que é justamente o que esta função não faz.
--
-- Só o painel usa, e ela devolve dado de terceiro: confere is_admin como
-- qualquer outra função daqui.
create or replace function public.ficha_do_painel(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when not public.is_admin() then null::jsonb else (
    select jsonb_build_object(
      'id', p.id,
      'nome', coalesce(nullif(btrim(coalesce(p.nome, '')), ''), 'Sem nome'),
      'idade', case when p.data_nascimento is null then null
                    else extract(year from age(p.data_nascimento))::int end,
      'cidade', p.cidade,
      'profissao', p.profissao,
      'bio', p.bio,
      'entrou_em', p.criado_em,
      'visivel', p.visivel,
      'status_moderacao', p.status_moderacao,
      'suspensao_termina_em', p.suspensao_termina_em,
      'verificacao_status', p.verificacao_status,
      'denuncias_abertas', (select count(*) from public.reports r
                             where r.denunciado_id = p.id and r.status <> 'resolvida'),
      'denuncias_total', (select count(*) from public.reports r
                           where r.denunciado_id = p.id)
    )
    from public.profiles p where p.id = p_user_id
  ) end;
$$;

revoke all on function public.ficha_do_painel(uuid) from public, anon;
grant execute on function public.ficha_do_painel(uuid) to authenticated;

-- ───────────────────── 6. a fila de verificação ─────────────────────
-- Uma linha por PESSOA, não por pedido. solicitar_verificacao insere uma linha
-- a cada selfie enviada e não impede a segunda: quem chamasse a API direto
-- encheria a fila com a mesma pessoa repetida. Agrupando por pessoa, as várias
-- selfies viram material a mais para comparar — que é o que o admin quer — em
-- vez de cinco cartões idênticos.
--
-- p_filtro: 'pendentes' (o que espera decisão) ou 'decididas' (o último
-- veredito de cada pessoa já analisada).
create or replace function public.painel_verificacoes(p_filtro text default 'pendentes')
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
  if p_filtro not in ('pendentes','decididas') then
    raise exception 'Filtro inválido.';
  end if;

  select jsonb_build_object(
    'pendentes', (select count(distinct user_id) from public.verificacoes where status = 'pendente'),
    'itens', coalesce((
      select jsonb_agg(item order by item_ordem desc)
        from (
          select lista.ordem as item_ordem,
                 coalesce(public.ficha_do_painel(lista.user_id), '{}'::jsonb)
                   || jsonb_build_object(
                        'pedido_em', lista.pedido_em,
                        'decidido_em', lista.decidido_em,
                        'decisao', lista.decisao,
                        'decidido_por', (select u.email from auth.users u
                                          where u.id = lista.analisado_por),
                        -- Só as selfies que ainda estão no bucket: as apagadas
                        -- não têm arquivo para assinar, e pedir URL para elas
                        -- devolveria link quebrado.
                        'selfies', (select coalesce(jsonb_agg(v.selfie_path order by v.criado_em), '[]'::jsonb)
                                      from public.verificacoes v
                                     where v.user_id = lista.user_id
                                       and v.selfie_apagada_em is null
                                       and case when p_filtro = 'pendentes'
                                                then v.status = 'pendente' else true end),
                        -- As fotos do perfil, para comparar com a selfie. De
                        -- qualquer status: uma foto rejeitada continua sendo
                        -- material de comparação.
                        'fotos', (select coalesce(jsonb_agg(f.storage_path
                                            order by f.principal desc, f.ordem, f.criado_em), '[]'::jsonb)
                                    from public.photos f where f.user_id = lista.user_id)
                      ) as item
            from (
              select v.user_id,
                     min(v.criado_em) filter (where v.status = 'pendente') as pedido_em,
                     max(v.analisado_em) as decidido_em,
                     -- Em 'decididas' a linha é uma só por pessoa; estes três
                     -- campos descrevem o último veredito dela.
                     (array_agg(v.status order by v.criado_em desc))[1] as decisao,
                     (array_agg(v.analisado_por order by v.criado_em desc))[1] as analisado_por,
                     case when p_filtro = 'pendentes' then min(v.criado_em) filter (where v.status = 'pendente')
                          else max(v.analisado_em) end as ordem
                from public.verificacoes v
               group by v.user_id
              having case when p_filtro = 'pendentes'
                          then count(*) filter (where v.status = 'pendente') > 0
                          else count(*) filter (where v.status = 'pendente') = 0 end
               order by ordem desc nulls last
               limit 50
            ) lista
        ) agrupada
    ), '[]'::jsonb)
  ) into v_res;

  return v_res;
end;
$$;

revoke all on function public.painel_verificacoes(text) from public, anon;
grant execute on function public.painel_verificacoes(text) to authenticated;

-- Só o número, para o aviso na aba — mesmo motivo de painel_denuncias_abertas:
-- a fila traz 50 pessoas com selfies e fotos, e o aviso precisa estar certo
-- desde que o painel abre, inclusive na tela de Números.
create or replace function public.painel_verificacoes_pendentes()
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel admin.' using errcode = '42501';
  end if;
  return (select count(distinct user_id)::int from public.verificacoes where status = 'pendente');
end;
$$;

revoke all on function public.painel_verificacoes_pendentes() from public, anon;
grant execute on function public.painel_verificacoes_pendentes() to authenticated;

-- ───────────────────── 7. decidir a verificação ─────────────────────
-- Decide sobre a PESSOA, não sobre um pedido: se houver mais de um pedido
-- pendente (duas selfies enviadas), os dois são resolvidos pelo mesmo veredito.
-- Deixar um para trás manteria a pessoa na fila com a decisão já tomada.
--
-- 'recusar' sobre quem já tem o selo é como se tira um selo dado por engano —
-- e é por isso que a função não exige que exista pedido pendente. Nesse caso
-- não há linha 'pendente' para marcar, então ela carimba o último pedido da
-- pessoa: sem isso o perfil diria 'rejeitada' e o histórico diria 'aprovada'.
--
-- Devolve as selfies que continuam no bucket para o painel apagar em seguida
-- (ver decisão 1, no topo). Inclui as de análises anteriores que não foram
-- apagadas — é a chance de limpar o que ficou para trás.
create or replace function public.analisar_verificacao(p_user_id uuid, p_acao text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin  uuid := auth.uid();
  v_email  text;
  v_nome   text;
  v_status text;
  v_marcadas int;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel admin.' using errcode = '42501';
  end if;
  if p_acao not in ('aprovar','recusar') then
    raise exception 'Ação inválida.';
  end if;

  v_status := case p_acao when 'aprovar' then 'aprovada' else 'rejeitada' end;

  select p.nome into v_nome from public.profiles p where p.id = p_user_id;
  if not found then
    raise exception 'Esta conta não existe mais.';
  end if;

  select u.email into v_email from auth.users u where u.id = v_admin;

  update public.profiles
     set verificacao_status = v_status
   where id = p_user_id;

  update public.verificacoes
     set status = v_status,
         analisado_em = now(),
         analisado_por = v_admin
   where user_id = p_user_id
     and status = 'pendente';
  get diagnostics v_marcadas = row_count;

  if v_marcadas = 0 then
    update public.verificacoes
       set status = v_status,
           analisado_em = now(),
           analisado_por = v_admin
     where id = (select v.id from public.verificacoes v
                  where v.user_id = p_user_id
                  order by v.criado_em desc
                  limit 1);
  end if;

  insert into public.admin_actions (admin_id, admin_email, acao, report_id,
                                    alvo_id, alvo_nome, detalhe)
  values (v_admin, coalesce(v_email, 'desconhecido'),
          case p_acao when 'aprovar' then 'aprovar_verificacao'
                      else 'recusar_verificacao' end,
          null, p_user_id, v_nome,
          case when v_marcadas = 0 then 'selo revisto sem pedido pendente'
               when v_marcadas > 1 then v_marcadas::text || ' pedidos pendentes' end);

  return jsonb_build_object(
    'acao', p_acao,
    'nome', coalesce(nullif(btrim(coalesce(v_nome, '')), ''), 'a pessoa'),
    'selfies', coalesce((select jsonb_agg(v.selfie_path order by v.criado_em)
                           from public.verificacoes v
                          where v.user_id = p_user_id
                            and v.selfie_apagada_em is null), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.analisar_verificacao(uuid, text) from public, anon;
grant execute on function public.analisar_verificacao(uuid, text) to authenticated;

-- Carimba o que o painel já apagou do bucket. Separado da decisão de propósito:
-- quem apaga o arquivo é a API de Storage, no navegador, DEPOIS do commit desta
-- transação. Juntar as duas coisas faria a marca existir para arquivo que
-- continua lá — exatamente o silêncio que selfie_apagada_em existe para evitar.
create or replace function public.marcar_selfies_apagadas(p_paths text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_marcadas int;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel admin.' using errcode = '42501';
  end if;

  update public.verificacoes
     set selfie_apagada_em = now()
   where selfie_path = any(coalesce(p_paths, '{}'::text[]))
     and selfie_apagada_em is null;
  get diagnostics v_marcadas = row_count;
  return v_marcadas;
end;
$$;

revoke all on function public.marcar_selfies_apagadas(text[]) from public, anon;
grant execute on function public.marcar_selfies_apagadas(text[]) to authenticated;

-- ───────────────────── 8. a fila de fotos ─────────────────────
-- p_filtro: 'novas' (tem ao menos uma foto que ninguém olhou ainda) ou
-- 'rejeitadas' (o que já foi derrubado, para poder voltar atrás).
--
-- O cartão é da PESSOA e mostra TODAS as fotos dela, não só as novas: "esta
-- foto é de outra pessoa" é uma conclusão que só aparece comparando com as
-- outras. As novas vêm marcadas para o admin saber o que falta olhar.
create or replace function public.painel_fotos(p_filtro text default 'novas')
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
  if p_filtro not in ('novas','rejeitadas') then
    raise exception 'Filtro inválido.';
  end if;

  select jsonb_build_object(
    'novas', (select count(distinct user_id) from public.photos
                where moderada_em is null and status_moderacao <> 'rejeitada'),
    'itens', coalesce((
      select jsonb_agg(item order by item_ordem desc)
        from (
          select lista.ordem as item_ordem,
                 coalesce(public.ficha_do_painel(lista.user_id), '{}'::jsonb)
                   || jsonb_build_object(
                        'fotos', (select coalesce(jsonb_agg(jsonb_build_object(
                                            'id', f.id,
                                            'path', f.storage_path,
                                            'status', f.status_moderacao,
                                            'principal', f.principal,
                                            'criado_em', f.criado_em,
                                            'moderada_em', f.moderada_em,
                                            'moderada_por', (select u.email from auth.users u
                                                              where u.id = f.moderada_por))
                                            order by f.principal desc, f.ordem, f.criado_em), '[]'::jsonb)
                                    from public.photos f where f.user_id = lista.user_id)
                      ) as item
            from (
              select f.user_id,
                     case when p_filtro = 'novas'
                          then max(f.criado_em) filter (where f.moderada_em is null
                                                          and f.status_moderacao <> 'rejeitada')
                          else max(f.moderada_em) filter (where f.status_moderacao = 'rejeitada') end as ordem
                from public.photos f
               group by f.user_id
              having case when p_filtro = 'novas'
                          then count(*) filter (where f.moderada_em is null
                                                  and f.status_moderacao <> 'rejeitada') > 0
                          else count(*) filter (where f.status_moderacao = 'rejeitada') > 0 end
               order by ordem desc nulls last
               limit 30
            ) lista
        ) agrupada
    ), '[]'::jsonb)
  ) into v_res;

  return v_res;
end;
$$;

revoke all on function public.painel_fotos(text) from public, anon;
grant execute on function public.painel_fotos(text) to authenticated;

-- Recebe uma LISTA de fotos porque as duas ações do painel precisam disso:
-- "Rejeitar" manda uma, "Marcar todas como vistas" manda as que sobraram do
-- cartão. Todas têm de ser da mesma pessoa — é uma decisão sobre alguém, e é
-- assim que ela cabe em uma linha de admin_actions.
--
-- Rejeitar não apaga nada: a foto some da fila e do perfil dos outros (quem
-- decide isso é fotos_le, pelo status_moderacao), mas continua no bucket, à
-- vista da moderação e de quem é dona dela. Uma denúncia sobre aquela foto
-- ainda precisa da foto.
create or replace function public.moderar_fotos(p_ids uuid[], p_acao text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin  uuid := auth.uid();
  v_email  text;
  v_status text;
  v_dono   uuid;
  v_nome   text;
  v_donos  int;
  v_total  int;
begin
  if not public.is_admin() then
    raise exception 'Acesso restrito ao painel admin.' using errcode = '42501';
  end if;
  if p_acao not in ('aprovar','rejeitar') then
    raise exception 'Ação inválida.';
  end if;
  if p_ids is null or array_length(p_ids, 1) is null then
    raise exception 'Nenhuma foto escolhida.';
  end if;

  select count(distinct f.user_id), (array_agg(f.user_id))[1], count(*)
    into v_donos, v_dono, v_total
    from public.photos f where f.id = any(p_ids);

  if v_total = 0 then
    raise exception 'Estas fotos não existem mais.';
  end if;
  if v_donos > 1 then
    raise exception 'As fotos são de pessoas diferentes.';
  end if;

  v_status := case p_acao when 'aprovar' then 'aprovada' else 'rejeitada' end;
  select p.nome into v_nome from public.profiles p where p.id = v_dono;
  select u.email into v_email from auth.users u where u.id = v_admin;

  update public.photos
     set status_moderacao = v_status,
         moderada_em = now(),
         moderada_por = v_admin
   where id = any(p_ids);

  insert into public.admin_actions (admin_id, admin_email, acao, report_id,
                                    alvo_id, alvo_nome, detalhe)
  values (v_admin, coalesce(v_email, 'desconhecido'),
          case p_acao when 'aprovar' then 'aprovar_foto' else 'rejeitar_foto' end,
          null, v_dono, v_nome,
          v_total::text || case when v_total = 1 then ' foto' else ' fotos' end);

  return jsonb_build_object(
    'acao', p_acao,
    'fotos', v_total,
    'nome', coalesce(nullif(btrim(coalesce(v_nome, '')), ''), 'a pessoa'),
    -- Rejeitar a última foto aprovada deixa a pessoa na fila dos outros sem
    -- foto nenhuma. Não é motivo para impedir a rejeição (a foto pode ser o
    -- problema), mas a tela precisa dizer, porque é o momento de pensar em
    -- suspender em vez de só derrubar a foto.
    'sem_foto_aprovada', not exists (
      select 1 from public.photos f
       where f.user_id = v_dono and f.status_moderacao = 'aprovada')
  );
end;
$$;

revoke all on function public.moderar_fotos(uuid[], text) from public, anon;
grant execute on function public.moderar_fotos(uuid[], text) to authenticated;

-- ───────────────────── 9. derrubar a foto de dentro da denúncia ─────────────────────
-- Corpo copiado da 0015 (última migration que define painel_moderacao) com uma
-- mudança só: 'fotos' passa de lista de caminhos para lista de objetos com id
-- e status, que é o que a tela precisa para ter o botão de rejeitar ali mesmo.
-- Conferido por diff contra a versão em vigor antes de entrar aqui.
create or replace function public.painel_moderacao(p_filtro text default 'abertas')
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
  if p_filtro not in ('abertas','resolvidas') then
    raise exception 'Filtro inválido.';
  end if;

  select jsonb_build_object(
    'abertas', (select count(*) from public.reports where status <> 'resolvida'),
    'itens', coalesce((
      select jsonb_agg(item order by item_ordem desc)
        from (
          select coalesce(r.analisado_em, r.criado_em) as item_ordem,
                 jsonb_build_object(
                   'id', r.id,
                   'criado_em', r.criado_em,
                   'motivo', r.motivo,
                   'descricao', r.descricao,
                   'status', r.status,
                   'resolucao', r.resolucao,
                   'analisado_em', r.analisado_em,
                   'analisado_por', (select u.email from auth.users u where u.id = r.analisado_por),
                   'conversa_copiada', r.conversa_copiada,
                   'denunciado', jsonb_build_object(
                     'id', r.denunciado_id,
                     'nome', coalesce(nullif(btrim(coalesce(p.nome, r.denunciado_nome, '')), ''), 'Sem nome'),
                     'conta_excluida', r.denunciado_id is null,
                     'idade', case when p.data_nascimento is null then null
                                   else extract(year from age(p.data_nascimento))::int end,
                     'cidade', p.cidade,
                     'bio', p.bio,
                     'profissao', p.profissao,
                     'status_moderacao', p.status_moderacao,
                     'suspensao_termina_em', p.suspensao_termina_em,
                     'verificacao_status', p.verificacao_status,
                     'visivel', p.visivel,
                     'entrou_em', p.criado_em,
                     'denuncias_abertas', (select count(*) from public.reports r2
                                            where r2.denunciado_id = r.denunciado_id
                                              and r2.status <> 'resolvida'),
                     'denuncias_total', (select count(*) from public.reports r2
                                          where r2.denunciado_id = r.denunciado_id),
                     -- Todas as fotos, de qualquer status: a moderação precisa
                     -- ver inclusive a que já foi rejeitada.
                     --
                     -- Desde a 0021 vêm com id e status, e não só o caminho:
                     -- "fotos falsas ou de outra pessoa" é motivo de denúncia,
                     -- e derrubar a foto tinha de ser feito em outra tela, sem
                     -- busca por nome — ou seja, na prática não era feito.
                     'fotos', (select coalesce(jsonb_agg(jsonb_build_object(
                                        'id', f.id,
                                        'path', f.storage_path,
                                        'status', f.status_moderacao,
                                        'principal', f.principal,
                                        'criado_em', f.criado_em,
                                        'moderada_em', f.moderada_em,
                                        'moderada_por', (select u.email from auth.users u
                                                          where u.id = f.moderada_por))
                                        order by f.principal desc, f.ordem, f.criado_em), '[]'::jsonb)
                                 from public.photos f where f.user_id = r.denunciado_id)
                   ),
                   'conversa', (select coalesce(jsonb_agg(jsonb_build_object(
                                         'autor', rm.autor,
                                         'conteudo', rm.conteudo,
                                         'enviada_em', rm.enviada_em) order by rm.ordem), '[]'::jsonb)
                                  from public.report_mensagens rm where rm.report_id = r.id)
                 ) as item
            from public.reports r
            left join public.profiles p on p.id = r.denunciado_id
           where case when p_filtro = 'abertas' then r.status <> 'resolvida'
                      else r.status = 'resolvida' end
           order by coalesce(r.analisado_em, r.criado_em) desc
           limit 50
        ) lista
    ), '[]'::jsonb)
  ) into v_res;

  return v_res;
end;
$$;

revoke all on function public.painel_moderacao(text) from public, anon;
grant execute on function public.painel_moderacao(text) to authenticated;

comment on table public.verificacoes is
  'Pedidos de selo. A selfie é apagada do bucket quando a análise termina (selfie_apagada_em); '
  'a linha fica, para o histórico de quem decidiu o quê.';

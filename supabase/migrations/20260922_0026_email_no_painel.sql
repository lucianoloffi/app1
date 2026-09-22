-- Lovi — o e-mail da pessoa aparece no painel
--
-- A ficha no painel mostrava nome, idade, cidade e bio, e nada que ligasse o
-- perfil a uma CONTA. Testando com duas contas, não dava para saber qual
-- conta do Supabase (Authentication → Users) era a "Ddds" denunciada — e é
-- por lá que se confere uma exclusão, se responde a uma contestação ou se
-- acha a pasta da pessoa no Storage. Nome de perfil não serve: é livre, se
-- repete e pode ser qualquer coisa.
--
-- Decisão do Lu em 22/09: mostrar o e-mail. Isso contradizia a política de
-- privacidade, que prometia "a moderação NÃO vê seu e-mail" (seção 6.1); a
-- política passa para a 1.4 no mesmo commit, dizendo que a moderação vê o
-- e-mail e para quê. O e-mail continua fora de tudo que OUTRO usuário vê
-- (perfil_publico não muda).
--
-- Duas funções, porque a ficha chega ao painel por dois caminhos:
-- ficha_do_painel (telas de Fotos e Verificação) e o objeto 'denunciado' de
-- painel_moderacao. Corpos copiados da ÚLTIMA migration que define cada uma
-- (as duas da 0021), conferidos por diff: a nova é a antiga mais a linha do
-- e-mail, nada além. Continuam security definer e conferindo is_admin() — só
-- o admin chega a auth.users por aqui.
--
-- Conta excluída: denunciado_id é null e o e-mail vem null. O e-mail não é
-- copiado para a denúncia como o nome foi (0015): quem excluiu a conta pediu
-- que os dados sumissem, e o nome já basta para ler a denúncia.
--
-- Ordem do deploy: só acrescenta um campo ao json; o cliente antigo ignora.
-- Pode ser aplicada antes do push.

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
      'email', (select u.email from auth.users u where u.id = p.id),
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
                     'email', (select u.email from auth.users u where u.id = r.denunciado_id),
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

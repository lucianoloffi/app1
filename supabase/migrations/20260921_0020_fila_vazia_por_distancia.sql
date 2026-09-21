-- Lovi — saber se a fila vazia é culpa do filtro ou da distância
--
-- Com a fila vazia, o app sempre dizia a mesma coisa: "Seus filtros estão bem
-- estreitos: até 25 km e 22–45 anos", e oferecia Ajustar filtros. Só que existe
-- um caso em que mexer no filtro não adianta nada — quando não há ninguém do
-- Lovi na região. Quem viaja, ou quem se cadastra fora do Sul, mexe nos
-- filtros, não acontece nada, e conclui que o app está quebrado.
--
-- Apareceu numa pergunta do Lu (21/09): "e se eu pedir para um amigo de
-- Portugal testar?". Liberando o GPS em Lisboa, a coordenada gravada fica a
-- ~8.700 km de Joinville. A fila chega vazia e a tela culpa o filtro de 25 km.
--
-- Esta função responde a distância até a pessoa mais próxima que passa em
-- TODOS os outros filtros (gênero, intenção, idade, já vistos, denunciados,
-- bloqueados, sancionados) e falha só na distância. null = não há ninguém,
-- nem ignorando a distância; aí o filtro é mesmo o problema.
--
-- Não vaza nada útil: devolve um número, nunca quem é a pessoa, e a tela só o
-- usa quando ele é MAIOR que o raio escolhido — ou seja, sempre sobre alguém
-- que a fila já mostraria se o raio fosse aumentado.
--
-- O corpo é o WHERE da fila_descobrir em vigor (0017) sem a condição de
-- distância. Se a fila mudar, esta função muda junto.
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

revoke all on function public.distancia_do_mais_proximo() from public, anon;
grant execute on function public.distancia_do_mais_proximo() to authenticated;

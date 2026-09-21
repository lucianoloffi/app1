-- Lovi — sugerir a cidade a partir da localização
--
-- No cadastro, a pessoa digitava a cidade e, ao terminar, o app pedia a
-- localização assim mesmo: na prática perguntava a mesma coisa duas vezes, e
-- ainda podia mostrar a tela de "ative sua localização" logo na estreia.
--
-- Com esta função, o passo da cidade pode oferecer "Usar minha localização" e
-- já preencher a cidade mais próxima da lista. A coordenada chega arredondada
-- para ~1 km (o app arredonda antes de enviar, ver src/lib/geo.ts), o que é de
-- sobra para escolher entre municípios.
--
-- O raio de 100 km existe para não sugerir absurdo: sem ele, quem se cadastra
-- em Recife receberia "Curitiba" preenchido, a 1.300 km de distância. Fora do
-- raio a função não devolve nada, e a tela pede para escolher na lista.
--
-- Sem security definer de propósito: public.cities é a lista pública de
-- cidades (policy cities_leitura), então a função enxerga o mesmo que quem a
-- chama. Não há o que proteger aqui.
create or replace function public.cidade_mais_proxima(
  p_lat     double precision,
  p_lng     double precision,
  p_raio_km integer default 100
)
returns jsonb
language sql
stable
set search_path = public, extensions
as $$
  select jsonb_build_object(
           'nome', c.nome,
           'uf', c.uf,
           'distancia_km', round(st_distance(c.centro, eu.ponto) / 1000.0)::int
         )
    from public.cities c
    cross join (
      select st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography as ponto
    ) eu
   where p_lat is not null
     and p_lng is not null
     and st_dwithin(c.centro, eu.ponto, greatest(p_raio_km, 1) * 1000)
   order by c.centro <-> eu.ponto
   limit 1;
$$;

revoke all on function public.cidade_mais_proxima(double precision, double precision, integer)
  from public, anon;
grant execute on function public.cidade_mais_proxima(double precision, double precision, integer)
  to authenticated;

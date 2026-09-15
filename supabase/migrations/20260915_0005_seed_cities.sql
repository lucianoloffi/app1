-- Lovi — Fase 1: seed das cidades de CITY_OPTIONS
-- Coordenadas = centro aproximado do município, usadas SOMENTE como fallback
-- quando a pessoa recusa a localização do dispositivo.

insert into public.cities (nome, uf, centro) values
  ('Joinville, SC',              'SC', st_setsrid(st_makepoint(-48.8456, -26.3044), 4326)::geography),
  ('Jaraguá do Sul, SC',         'SC', st_setsrid(st_makepoint(-49.0671, -26.4851), 4326)::geography),
  ('São Francisco do Sul, SC',   'SC', st_setsrid(st_makepoint(-48.6383, -26.2433), 4326)::geography),
  ('São José, SC',               'SC', st_setsrid(st_makepoint(-48.6366, -27.6136), 4326)::geography),
  ('São João Batista, SC',       'SC', st_setsrid(st_makepoint(-48.8489, -27.2764), 4326)::geography),
  ('São Bento do Sul, SC',       'SC', st_setsrid(st_makepoint(-49.3783, -26.2508), 4326)::geography),
  ('Balneário Camboriú, SC',     'SC', st_setsrid(st_makepoint(-48.6349, -26.9906), 4326)::geography),
  ('Florianópolis, SC',          'SC', st_setsrid(st_makepoint(-48.5480, -27.5954), 4326)::geography),
  ('Curitiba, PR',               'PR', st_setsrid(st_makepoint(-49.2733, -25.4284), 4326)::geography),
  ('São João do Triunfo, PR',    'PR', st_setsrid(st_makepoint(-50.3097, -25.6797), 4326)::geography),
  ('Blumenau, SC',               'SC', st_setsrid(st_makepoint(-49.0661, -26.9194), 4326)::geography),
  ('Itajaí, SC',                 'SC', st_setsrid(st_makepoint(-48.6619, -26.9078), 4326)::geography),
  ('Araquari, SC',               'SC', st_setsrid(st_makepoint(-48.7219, -26.3706), 4326)::geography)
on conflict (nome) do update set uf = excluded.uf, centro = excluded.centro;

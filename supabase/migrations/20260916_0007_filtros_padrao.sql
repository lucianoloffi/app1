-- Lovi — faixa etária padrão passa de 25–45 para 25–35
--
-- Vale para quem se cadastrar daqui em diante. Quem já tem conta mantém o que
-- escolheu; só quem nunca mexeu nos filtros (ainda no 45 de fábrica) acompanha
-- a mudança.

alter table public.profile_preferences alter column idade_max set default 35;

update public.profile_preferences
   set idade_max = 35
 where idade_max = 45
   and idade_min = 25
   and distancia_max_km = 25
   and intencao_filtro = 'todas';

-- Fotos e interesses passam a ser opcionais no cadastro: a tela de fotos já
-- libera com 1, e a de intenção e interesses não trava mais no mínimo de 3.
-- O gatilho que valida o "concluir cadastro" ainda exigia o mínimo antigo
-- (3 fotos, 3 interesses), então o cadastro continuava recusado no banco.
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
    if (select count(*) from public.photos where user_id = new.id) < 1 then
      raise exception 'Envie pelo menos 1 foto.';
    end if;
  end if;
  return new;
end;
$$;

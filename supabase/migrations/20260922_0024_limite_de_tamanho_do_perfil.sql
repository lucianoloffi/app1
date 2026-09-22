-- Lovi — limite de tamanho nos textos do perfil
--
-- nome, profissao, bio e os interesses não tinham limite nenhum no banco. O
-- app mostrava o que viesse, e pela API (a chave anon é pública) dava para
-- gravar uma bio de um megabyte — que desceria inteira para a fila de todo
-- mundo que cruzasse com o perfil, a cada abertura.
--
-- Os números são os mesmos de src/onboarding/constants.ts (NOME_MAXIMO,
-- PROFISSAO_MAXIMA, BIO_MAXIMA, INTERESSE_MAXIMO). Mudar um lado sem o outro:
-- se o app deixar passar mais do que o banco aceita, quem digita até o fim
-- recebe erro ao salvar (traduzido em src/lib/errors.ts pelo nome da
-- constraint, com o campo certo).
--
-- ── E as linhas que já passam do limite? ──
-- Cortadas aqui mesmo, antes de a constraint entrar. A alternativa seria
-- `not valid` (a constraint vale só para o que for gravado daqui em diante),
-- mas no Postgres uma check `not valid` é conferida em QUALQUER update da
-- linha, não só quando a coluna muda: quem tivesse uma bio antiga de 600
-- caracteres não conseguiria mais nem trocar a visibilidade do perfil, nem
-- mudar a cidade, nem concluir nada que grave em profiles — com um erro sobre
-- um campo em que não mexeu. Cortar o excesso é perder o fim de um texto que
-- o app nunca deveria ter aceitado; travar o perfil inteiro é pior.
--
-- Interesse longo demais é apagado, não cortado: o app só oferece os da lista
-- (o maior tem 17 caracteres), então um de mais de 30 só entrou pela API, e
-- cortá-lo deixaria um interesse pela metade — ou colidiria com a chave
-- (user_id, interesse) se o corte desse igual a outro que a pessoa já tem.
--
-- Ordem do deploy: só restringe o que o cliente antigo não produz (ele não
-- tinha campo que gerasse texto maior sem a pessoa colar um texto enorme).
-- Pode ser aplicada antes do push.

-- ───────────────────── 1. o que já passou do limite ─────────────────────
-- `where` para tocar só nas linhas que precisam: update em profiles dispara
-- os gatilhos da tabela, e não há por que acordá-los para todo mundo.
update public.profiles set nome = left(nome, 40)           where char_length(nome) > 40;
update public.profiles set profissao = left(profissao, 60) where char_length(profissao) > 60;
update public.profiles set bio = left(bio, 500)            where char_length(bio) > 500;

delete from public.profile_interests where char_length(interesse) > 30;

-- ───────────────────── 2. os limites ─────────────────────
-- Nome de constraint fixo e descritivo: é por ele que o app reconhece o erro.
-- null passa (char_length(null) é null, e check com null não recusa) — campo
-- vazio continua sendo decisão das outras regras, não desta.
alter table public.profiles drop constraint if exists profiles_nome_tamanho;
alter table public.profiles
  add constraint profiles_nome_tamanho check (char_length(nome) <= 40);

alter table public.profiles drop constraint if exists profiles_profissao_tamanho;
alter table public.profiles
  add constraint profiles_profissao_tamanho check (char_length(profissao) <= 60);

alter table public.profiles drop constraint if exists profiles_bio_tamanho;
alter table public.profiles
  add constraint profiles_bio_tamanho check (char_length(bio) <= 500);

alter table public.profile_interests drop constraint if exists profile_interests_interesse_tamanho;
alter table public.profile_interests
  add constraint profile_interests_interesse_tamanho check (char_length(interesse) <= 30);

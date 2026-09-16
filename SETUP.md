# Lovi — configuração do Supabase (Fase 1)

Passo a passo do que precisa ser feito no painel, na ordem. Leva uns 20 minutos.

## 1. Criar o projeto

1. Em [supabase.com](https://supabase.com) → **New project**.
2. Região: **South America (São Paulo)** — menor latência para o público do app.
3. Guarde a senha do banco em lugar seguro; ela não é usada pelo app.

## 2. Rodar as migrations

No painel, **SQL Editor** → **New query**. Cole e execute **na ordem**, um arquivo por vez:

1. `supabase/migrations/20260915_0001_schema.sql` — extensões, tabelas, índices e triggers
2. `supabase/migrations/20260915_0002_rls.sql` — Row Level Security de todas as tabelas
3. `supabase/migrations/20260915_0003_functions.sql` — funções de leitura e escrita
4. `supabase/migrations/20260915_0004_storage_realtime.sql` — buckets e realtime
5. `supabase/migrations/20260915_0005_seed_cities.sql` — as 13 cidades e suas coordenadas

> O arquivo 1 cria um trigger em `auth.users`. Se o SQL Editor recusar por
> permissão, execute-o pelo **Supabase CLI** (`supabase db push`) com a service role.

Depois de rodar, confira em **Table Editor** que as 13 tabelas aparecem com o
cadeado de RLS ativo, e em **Storage** que existem os buckets `fotos` e
`verificacoes`, ambos **privados**.

## 3. Autenticação

**Authentication → Providers → Email**:

- **Enable Email provider**: ligado
- **Confirm email**: **desligado** nesta fase de testes. Ligado, a pessoa só
  consegue entrar depois de clicar no link do e-mail, e o cadastro em 7 passos
  seria interrompido no meio. Antes de abrir ao público, ligue.
- **Minimum password length**: 8

**Authentication → URL Configuration**:

- **Site URL**: `https://lucianoloffi.github.io/app1/`
- **Redirect URLs**: acrescente `https://lucianoloffi.github.io/app1/` e
  `http://localhost:5173/` (recuperação de senha volta para cá)

## 4. Edge Function de exclusão de conta

A exclusão definitiva precisa da service role, que nunca pode ficar no app.

```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU-PROJECT-REF
supabase functions deploy delete-account
```

A função lê `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`,
que o Supabase já injeta automaticamente. Nada a cadastrar.

## 5. Variáveis do app

Copie a chave no painel (**Project Settings → API Keys**, aba *Legacy anon,
service_role*, linha `anon public`, botão de copiar) e rode:

```bash
cd app1
npm run configurar
```

O comando lê a chave da área de transferência, tira qualquer sujeira que
tenha vindo junto e descobre o endereço do projeto pela própria chave.

Colar a chave à mão funciona, mas é onde tudo costuma dar errado: são mais de
200 caracteres em uma linha só, e basta um "…" de uma cópia truncada ou um
espaço não separável para o navegador recusar todas as requisições com um erro
que não explica nada. Se preferir escrever o `.env` na mão, ele é assim:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

A chave anon é pública por desenho — ela vai no bundle do navegador. Quem
protege os dados é o RLS, não o segredo da chave. A **service role** nunca
entra no `.env` do app.

Para o deploy no GitHub Pages, cadastre as duas em
**Settings → Secrets and variables → Actions** do repositório, como
`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

## 6. Conferir

```bash
cd app1
npm install
npm run dev
```

Crie uma conta de teste e confira no painel:

- **Table Editor → profiles**: a linha nasceu junto com o usuário
- **Table Editor → consents**: dois registros (termos e dados sensíveis)
- **Storage → fotos**: os arquivos ficam em uma pasta com o id do usuário

## 7. Popular o app com perfis de teste

Com o banco vazio a fila do Descobrir fica vazia também. O script cria 20
perfis — 10 mulheres que buscam homens e 10 homens que buscam mulheres —, cada
um com foto, bio, profissão, interesses, estilo de vida e localização.

```bash
npm run popular -- --simular    # mostra os 20 perfis, sem tocar no banco
npm run popular                 # cria (pede a service role e a chave do Pexels)
npm run popular -- --limpar     # apaga tudo o que o script criou
```

**Service role.** Criar usuário no `auth` é a única coisa que a chave anon não
faz; o resto o script grava entrando como cada perfil, pelo mesmo caminho do
app e com o RLS ligado. Passe a chave só na hora de rodar, nunca no `.env`:

```bash
SUPABASE_SERVICE_ROLE_KEY=cole_aqui npm run popular
```

**Fotos.** Por padrão vêm do [Pexels](https://www.pexels.com/api/), que é banco
de imagens de licença livre e dá uma chave gratuita na hora:

```bash
PEXELS_API_KEY=cole_aqui SUPABASE_SERVICE_ROLE_KEY=cole_aqui npm run popular
```

As três fotos de um perfil são três enquadramentos da mesma imagem — três
rostos diferentes no mesmo perfil fariam o app parecer quebrado. Sem chave do
Pexels, `npm run popular -- --fotos=cores` gera as imagens aqui mesmo (degradê
com silhueta): feias, mas não dependem de rede nem de licença.

**O que aparece na fila.** Quem acabou de criar conta começa com os filtros em
25 km e 25–45 anos, e a intenção que escolheu no cadastro. Com isso, de
Joinville aparecem uns 10 a 13 dos 20 perfis; os de Blumenau, Itajaí e Jaraguá
do Sul ficam de fora até você abrir **Filtros de busca** e aumentar a
distância. É de propósito: serve para testar o filtro.

**Antes de abrir o app para outras pessoas**, rode `npm run popular -- --limpar`.
São contas de verdade no seu projeto, e o build publicado no GitHub Pages fala
com o mesmo banco — para quem chega de fora elas parecem gente real. As fotos
do Pexels são de pessoas reais, e a licença não cobre esse tipo de uso fora de
teste.

## 8. Moderação (manual, por enquanto)

- **Fotos**: nascem com `status_moderacao = 'aprovada'`. Para tirar uma foto do
  ar, mude para `'rejeitada'` no Table Editor — ela some dos perfis na hora.
- **Verificação de perfil**: a selfie fica no bucket privado `verificacoes`.
  Para aprovar, mude `verificacoes.status` e `profiles.verificacao_status`
  para `'aprovada'`. O selo só aparece depois disso.
- **Denúncias**: `reports`, com `status` `aberta` → `em_analise` → `resolvida`.

## 9. O que já foi testado

As cinco migrations foram aplicadas em um PostgreSQL 16 local (com stubs no
lugar do PostGIS e do schema `auth`) antes da entrega. Confirmado:

- os três registros (perfil, preferências, ajustes) nascem junto com o usuário
- o gate de 18 anos e a imutabilidade da data de nascimento barram o update
- "cadastro completo" só passa com nome, nascimento, gênero, cidade, intenção,
  3 interesses e 3 fotos
- curtida unilateral não cria match; curtida mútua cria com `user_a < user_b`
- bloquear desativa o match
- desfazer match apaga os dois swipes e o perfil volta para a fila
- a distância vem nula com `mostrar_distancia = false`, com localização
  aproximada e quando falta o GPS de quem está olhando
- a fila exclui perfil invisível, cadastro incompleto, quem bloqueou e quem já
  recebeu swipe, e aplica gênero, intenção e faixa etária
- com RLS ligado, um terceiro lê só o próprio perfil e nenhuma mensagem, match,
  swipe ou preferência de outra pessoa
- não dá para escrever em conversa finalizada nem em match desfeito
- a exportação de dados traz o perfil e não traz a coordenada

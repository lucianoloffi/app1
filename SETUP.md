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

Copie `.env.example` para `.env` e preencha com **Project Settings → API**:

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

## 7. Moderação (manual, por enquanto)

- **Fotos**: nascem com `status_moderacao = 'aprovada'`. Para tirar uma foto do
  ar, mude para `'rejeitada'` no Table Editor — ela some dos perfis na hora.
- **Verificação de perfil**: a selfie fica no bucket privado `verificacoes`.
  Para aprovar, mude `verificacoes.status` e `profiles.verificacao_status`
  para `'aprovada'`. O selo só aparece depois disso.
- **Denúncias**: `reports`, com `status` `aberta` → `em_analise` → `resolvida`.

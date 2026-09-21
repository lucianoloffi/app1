# Lovi

App de relacionamento com match por intenção e interesses. React + Vite +
TypeScript no navegador, Supabase no servidor (Postgres com RLS, Storage e Edge
Functions). Mobile-first (390×844) e instalável como PWA (manifest e ícones);
a versão para iOS, via Capacitor, é um plano — o código já foi preparado para
ela.

## Rodando localmente

Você precisa de um projeto Supabase com as migrations aplicadas — o passo a
passo está em [`SETUP.md`](SETUP.md). Com o projeto pronto:

```bash
npm install
npm run configurar   # lê a chave anon da área de transferência e cria o .env
npm run dev
```

Sem `.env`, o app abre numa tela avisando que a configuração está faltando.

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — typecheck (`tsc -b`) + build de produção
- `npm run lint` — lint (oxlint)
- `npm run preview` — pré-visualiza o build
- `npm run configurar` — cria o `.env` a partir da chave copiada no painel
- `npm run popular` — cria 20 perfis de teste no Supabase (`--simular` mostra o
  que seria criado sem tocar em nada; veja o cabeçalho de
  `scripts/popular-perfis.mjs` para as demais opções)

Não há testes automatizados. Antes de qualquer push: `npm run lint` e
`npm run build`; depois, conferir a tela de verdade.

## Estrutura

- `src/lib/api/` — a **única** camada que fala com o Supabase; telas e hooks só
  falam com ela
- `src/lib/errors.ts` — tradução dos erros do Supabase para mensagens em
  português, com o campo do formulário a que cada erro pertence
- `src/onboarding/` — cadastro e login (`constants.ts` concentra listas e limites)
- `src/screens/` — uma tela por arquivo, com o CSS Module ao lado
- `src/components/` — componentes compartilhados (navegação, sheets, ícones)
- `src/discover/`, `src/chats/` — hooks e regras do Descobrir e das conversas
- `src/legal/` — termos, privacidade e diretrizes (Markdown) e as versões
  registradas no consentimento
- `src/styles/tokens.css` — design tokens (cor, tipografia, espaçamento)
- `supabase/migrations/` — schema, RLS e funções, versionados por data e
  sequência e nunca editados depois de aplicados
- `supabase/functions/delete-account/` — Edge Function de exclusão de conta
- `admin/index.html` e `src/admin/` — painel admin, em `/app1/admin/` (acesso e
  como marcar um administrador: [`SETUP.md`](SETUP.md), seção Painel admin)
- `scripts/` — utilitários locais (configurar `.env`, popular perfis de teste)

## Deploy

GitHub Pages, pelo workflow `deploy-pages.yml`: push na `fase1-supabase`
publica sozinho (menos quando só mudam `supabase/**` ou arquivos `.md`), e dá
para rodar à mão em Actions → Deploy to GitHub Pages → Run workflow. O build
precisa dos secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

As migrations **não** vão no deploy: são aplicadas à mão no SQL Editor do
Supabase, na ordem da lista em [`SETUP.md`](SETUP.md).

## Mais documentação

- [`SETUP.md`](SETUP.md) — montar o Supabase do zero, passo a passo
- [`CLAUDE.md`](CLAUDE.md) — arquitetura, convenções do código e pendências

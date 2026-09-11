# Lovi

App de relacionamento com match por intenção e interesses. React + Vite + TypeScript, mobile-first (390×844).

## Rodando localmente

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — typecheck + build de produção
- `npm run lint` — lint (oxlint)
- `npm run preview` — pré-visualiza o build

## Estrutura

- `src/styles/tokens.css` — design tokens (cor, tipografia, espaçamento, raios, sombras)
- `src/styles/motion.css` — keyframes de animação
- `src/components/` — componentes compartilhados (marca, navegação, ícones)
- `src/screens/` — uma tela por arquivo
- `src/data/mockProfiles.ts` — perfis de exemplo (fotos via `i.pravatar.cc`, apenas placeholder)
- `src/types.ts` — tipos do domínio (perfil, chat, onboarding, filtros)

## Telas entregues

- [x] Navegação inferior
- [x] Descobrir
- [ ] Demais telas do onboarding, chat, perfil e detalhes — entregues em arquivos separados

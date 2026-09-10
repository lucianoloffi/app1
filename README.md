# Finder — Protótipo navegável (MVP)

Protótipo clicável do app de relacionamento **Finder**, feito em React + TypeScript + Tailwind, baseado no documento de especificação (`App_Menta.pdf`).

## O que é (e o que não é)

- **É** um app web navegável, com dados fictícios (mock) em memória — dá pra clicar, dar like/dislike, dar match, conversar, editar perfil e ajustar configurações, exatamente como nas telas do documento.
- **Não é** um app pronto para publicar: não tem backend, banco de dados, autenticação real, upload de fotos, verificação de idade/identidade, moderação ou push notification de verdade. Os dados somem ao recarregar a página.

Serve para validar fluxo e UX com o time/stakeholders antes de investir no desenvolvimento real (nativo ou com backend).

## Rodando localmente

```bash
npm install
npm run dev
```

Abra o endereço exibido no terminal (por padrão `http://localhost:5173`).

## Telas implementadas

- **Descobrir**: pilha de cards com like/dislike, múltiplas fotos por perfil (toque nos lados da foto para trocar), tela de "sem mais perfis".
- **Match**: animação de "Deu match!" ao curtir um perfil que também curtiu você.
- **Conversas**: lista de matches (com destaque de "novo match"), tela de conversa com envio de mensagens e opção de desfazer o match.
- **Perfil**: edição de foto, nome, bio, localidade, data de nascimento e gênero.
- **Configurações**: interesse (gênero), faixa etária, notificações e ocultar perfil.

## Regras de negócio simuladas

- Like/dislike ficam registrados em memória e o perfil não volta a aparecer.
- Match só ocorre quando o perfil "já tinha curtido você" (simulado nos dados mock em `src/data/profiles.ts`, campo `willMatch`).
- Trocar as configurações não refiltra perfis nesta versão (fica como próximo passo).

## Próximos passos para virar um app de verdade

Ver a lista de requisitos discutida com o time: backend/banco de dados, autenticação, verificação de idade, moderação, denúncia/bloqueio, LGPD, geolocalização real e decisão de stack mobile (nativo vs. cross-platform).

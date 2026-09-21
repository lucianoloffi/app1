# Lovi

App de relacionamento com match por intenção e interesses. React + Vite + TypeScript,
mobile-first (390×844), backend Supabase (Postgres + RLS + Storage + Edge Functions).
Hoje roda como web/PWA; o plano é virar app iOS via Capacitor.

Todo o texto de interface é em português do Brasil.

## Comandos

```bash
npm run dev      # servidor de desenvolvimento
npm run lint     # oxlint
npm run build    # tsc -b + build de produção
npm run popular  # popula perfis de teste (precisa de .env com service role)
```

**Antes de qualquer push:** `npm run lint` e `npm run build`. Não há testes
automatizados — a rede de segurança é lint + typecheck + conferir a tela de verdade.
O padrão do projeto é abrir a tela num Chromium (Playwright) e confirmar o
comportamento, inclusive nos casos de erro.

Para renderizar telas sem backend real, um `.env` falso basta (`VITE_SUPABASE_URL=https://exemplo.supabase.co`
e qualquer `VITE_SUPABASE_ANON_KEY`): sem ele o app cai na `ConfigErrorScreen`, e
nada de rede acontece antes do primeiro submit. Apagar o `.env` antes de commitar —
o `.gitignore` já cobre, mas não deixe sobrando.

## Arquitetura

- **`src/lib/api/`** — única camada que importa o `supabaseClient`. Telas e hooks
  falam apenas com ela. Isso é proposital: mantém a futura troca por Capacitor
  restrita a esta camada. Não importe o cliente do Supabase em componentes.
- **`src/lib/storage.ts` e `src/lib/geo.ts`** — abstrações finas sobre localStorage e
  geolocalização, pelo mesmo motivo (viram `@capacitor/preferences` e
  `@capacitor/geolocation` sem tocar no resto).
- **`src/lib/errors.ts`** — tradução centralizada dos erros do Supabase. `ErroDeApp`
  carrega o campo do formulário a que o erro pertence (`"email" | "senha" |
  "telefone"`), `erroNoFormulario()` traduz por regex e `lancaSeErro()` é o guarda
  padrão depois de toda chamada. **Telas nunca mostram texto cru do Supabase.**
- **`supabase/migrations/`** — schema, RLS e funções. A lógica sensível (fila de
  descoberta, swipes, matches) mora em funções `security definer` no banco, não em
  queries no cliente. RLS é "só o dono" em todas as tabelas — mas a RLS só decide
  *linhas*. Quem decide *colunas* são os privilégios de coluna (migration `0010`): o
  cliente só escreve as colunas listadas em `grant insert/update (...)`, e coluna nova
  nasce somente-leitura até haver um grant explícito. Status de verificação, de
  moderação e de denúncia são do servidor; o cliente pede por RPC
  (`solicitar_verificacao`) e a moderação escreve com service role.
  Cuidado com policy que consulta outra tabela: a consulta roda sob o RLS *daquela*
  tabela, com os olhos de quem está logado. Quem foi bloqueado não enxerga o bloqueio,
  ninguém enxerga a foto do outro — a checagem "passa" ou "falha" em silêncio. Nesses
  casos a policy chama uma função `security definer` que devolve só sim/não
  (`foto_visivel`, `bloqueio_no_match`). Aconteceu duas vezes (0006 e 0011).
- **`supabase/functions/`** — Edge Functions para o que a chave anon não pode fazer
  (ex.: `delete-account`, que apaga usuário do auth e arquivos do storage). O id do
  usuário vem sempre do JWT, nunca do corpo da requisição.
- **`src/screens/`** e **`src/onboarding/screens/`** — uma tela por arquivo.
- **`src/components/`** — componentes compartilhados.

## Convenções

**Idioma.** Português no domínio: funções (`cadastrar`, `bloquear`, `denunciar`),
variáveis (`erroDaSenha`, `senhaTocada`, `ocupado`), colunas (`nome`, `criado_em`),
funções SQL (`fila_descobrir`, `meus_matches`). Inglês só no que é estrutura: nomes
de tabelas (`profiles`, `matches`, `reports`), props de React (`onChangeEmail`,
`acceptedTerms`) e tipos de domínio (`OnboardingStep`).

**Comentários** explicam o *porquê*, não o *quê*, e costumam citar o caso real que
motivou a regra. Veja o comentário sobre chave do Supabase copiada truncada em
`src/lib/supabaseClient.ts` como exemplo do tom.

**Estilo.** CSS Modules irmãos de cada componente (`X.tsx` + `X.module.css`). O que é
comum vive em `src/styles/tokens.css` (cor, tipografia, espaçamento, raios, sombras),
`src/styles/motion.css` e `src/onboarding/fields.module.css`. Não escrever valores de
cor ou espaçamento direto no componente quando existe token.

**Constantes em um lugar só.** `src/onboarding/constants.ts` (`MAX_INTERESTS`,
`MIN_ONBOARDING_PHOTOS`, `CITY_OPTIONS`, `INTEREST_OPTIONS`) e `SENHA_MINIMA` em
`src/lib/api/auth.ts`. Nunca repetir o número no texto da tela — interpole a
constante, para mensagem e validação não divergirem.

**Migrations** são versionadas por data + sequência (`20260917_0009_nome.sql`) e
nunca editadas depois de aplicadas. Mudou de ideia? Nova migration.
Ao criar coluna numa tabela que o cliente escreve (`profiles`, `photos`, `reports`,
`consents`, `messages`), decida se o cliente pode escrevê-la: se sim, `grant update
(coluna)` ou `grant insert (coluna)` na mesma migration; sem grant, a API recusa com
`permission denied` — o que é o certo para colunas de status.

**Commits** em português, no imperativo, descrevendo o efeito para quem usa o app
("Avisar na hora que a senha é curta demais", "Fazer a lupa das Conversas buscar de
verdade") — nunca "fix", "update AccountScreen". O corpo explica qual era o problema
anterior.

## Padrão de validação de formulário

`src/onboarding/screens/AccountScreen.tsx` é o modelo. Ao adicionar um campo:

1. O erro vindo do servidor tem **precedência** sobre a checagem local
   (`erroDoCampo("senha") ?? checagemLocal`).
2. A checagem local só acusa **depois do blur** (estado `xTocado`) — validar a cada
   tecla acusa erro no primeiro caractere.
3. **Campo vazio nunca reclama**: ainda não foi preenchido, só não foi usado.
4. Existe uma **nota permanente** embaixo do campo dizendo o requisito, que vira erro
   vermelho quando a validação falha. Não deixe o requisito só no placeholder — ele
   some justo quando passa a importar.
5. `aria-invalid` acompanha o erro e `aria-describedby` aponta para a nota quando não
   há erro, para o erro quando há. Mensagem de erro com `role="alert"`.

Nunca deixe o botão desabilitado ser a única pista de que algo está errado.

## Deploy

GitHub Pages pelo `deploy-pages.yml`. Push na `fase1-supabase` publica sozinho,
exceto quando só mudam `supabase/**` ou arquivos `.md` (não há bundle novo). Também
dá para rodar à mão: Actions → Deploy to GitHub Pages → Run workflow.

As migrations continuam **manuais** (SQL Editor do Supabase): o push não as aplica.
Quando cliente e migration dependem um do outro, o push publica o cliente em cerca de
um minuto. Se a migration só adiciona (coluna, função), aplique-a **antes** do push. Se
ela tira permissão ou algo que o cliente antigo usa (como a `0010`), aplique-a logo
**depois** do deploy e saiba que o fluxo afetado falha nessa janela curta.

O workflow fixa `ubuntu-24.04` (o `ubuntu-latest` passa a ser o Ubuntu 26 em
19/10/2026) e Node 22 (o 20 saiu de suporte em 30/04/2026). Migrar para o Ubuntu 26
é uma decisão a testar, não algo a deixar o calendário decidir.

Branch principal: **`fase1-supabase`**, também a branch padrão no GitHub (o botão
Run workflow só aparece quando o workflow existe na branch padrão).

As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` viram texto no bundle no
momento do build; ficam em Settings → Secrets and variables → Actions. Isso é o
esperado (a chave anon é pública por design) — quem protege os dados é a RLS.

## Pendências

Em ordem de importância:

1. **Moderação/admin.** Hoje `reports.status` e `verificacoes.status` são gravados e
   nunca lidos: denúncia entra e fica parada. Plano decidido: app admin **separado**
   do app do usuário (não uma rota escondida — o bundle público é lido por qualquer
   um), papel de admin em `app_metadata` (nunca `user_metadata`, que o próprio
   usuário edita), função SQL `is_admin()` + políticas RLS de admin, ações
   destrutivas via Edge Function com service role (**nunca** service role no
   navegador), coluna `profiles.status_moderacao` ('ativo','suspenso','banido')
   separada do `visivel` atual (que é escolha do usuário e seria devolvida por ele),
   `reports.analisado_por` + resolução, e tabela `admin_actions` para auditoria.
   Cuidado com nomes: `photos.status_moderacao` ('pendente','aprovada','rejeitada',
   default `'aprovada'`, e é ele que libera a foto para terceiros) e
   `profiles.verificacao_status` já existem, com vocabulários diferentes do de
   `profiles.status_moderacao`. Colunas de status novas já nascem protegidas pela
   migration `0010`: o cliente não as escreve.
2. **Guardar provas de assédio** (decidir junto com a moderação). Auditoria de 20/09:
   `desfazer_match` apaga todas as mensagens da conversa (cascade do match), e excluir a
   conta apaga as denúncias feitas contra a pessoa (`reports.denunciado_id` em cascade).
   Quem assediou pode sumir com as provas. Pede decisão de produto e de LGPD: o que
   reter, por quanto tempo e com que base legal (e entrar na política de privacidade).
   O resto da auditoria de RLS foi feito e fechado nas migrations `0010` e `0011`.
3. **iOS via Capacitor.** Depois do empacotamento vêm: plugins nativos (Preferences,
   Geolocation, Camera) com as strings de permissão no `Info.plist`, deep link para a
   confirmação de e-mail (hoje o `redirectTo` usa `window.location.origin`), push via
   APNs, e as exigências da App Store para app de namoro (18+, moderação com resposta
   em 24h, exclusão de conta no app — essa já existe).
4. **Limpar branches já mescladas** no repositório (as `claude/*`).
5. **Detalhes da auditoria que ficaram para depois:** a Edge Function `delete-account`
   lista no máximo 100 arquivos por pasta (quem pediu muitas verificações deixa selfies
   para trás) e precisa de novo deploy quando for corrigida; `nome`, `bio`, `profissao`
   e interesses não têm limite de tamanho no banco (colocar junto com a nota do limite
   na tela); qualquer pessoa logada consegue listar as fotos dos perfis visíveis — o
   mesmo que veria rolando a fila, mas facilita copiar em massa (pede limite de uso).

## Pontos de atenção

- **Security Advisor do Supabase:** o erro "RLS Disabled in Public" em
  `public.spatial_ref_sys` é esperado. É tabela do PostGIS (sistemas de coordenadas, sem
  dado de usuário) e ligar RLS nela exige ser o dono. A `0011` tira a escrita pela API se
  tiver permissão para isso.
- **Sem testes automatizados.** Em um app com RLS, matches e exclusão de conta, isso
  é frágil. Nada impede uma regra de validação de voltar a ficar silenciosa.
- **Data dos documentos legais (25/09/2026) é de exemplo** (confirmado pelo Lu em 20/09):
  o lançamento ainda não tem data. Trocar nos três `.md` de `src/legal/` quando houver.
  `LEGAL_UPDATED_AT` não é lida por nenhum código; o que o usuário vê é o texto dos
  `.md`, e o consentimento registra só a `versao`. Antes de lançar, os **textos** (não
  só a data) precisam de revisão jurídica: o app trata dado sensível sob a LGPD.
- **Validação no cliente é UX, não segurança.** O mínimo de senha real é o do Supabase
  Auth; o cliente só antecipa a mensagem.
- **Dado sensível.** Interesse (indica orientação sexual), cidade, fotos e telefone
  são tratados sob consentimento explícito registrado na tabela `consents`, com os
  documentos versionados em `src/legal/versions.ts`. Qualquer acesso novo a esses
  dados — moderação inclusive — precisa entrar na política de privacidade.

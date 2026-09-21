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

**Conferir uma tela que depende do banco, sem banco.** Telas que recebem tudo por
props (`FiltersScreen`, `DiscoverScreen`, `ReportSheet`) montam direto numa página de
prévia temporária: `sed 's#/src/main.tsx#/src/__previewX.tsx#' index.html >
preview-x.html` e um `src/__previewX.tsx` que renderiza o componente com dados
inventados — o Vite serve qualquer `.html` da raiz em dev, sem tocar no
`vite.config.ts`. Para telas que falam com o servidor (painel admin, passo da cidade),
trocar `globalThis.fetch` no início do arquivo de prévia e responder às rotas
`/rest/v1/rpc/<funcao>` cobre o caminho inteiro — inclusive o mapeamento em
`src/lib/api/` — sem nada sair da máquina. `navigator.geolocation.getCurrentPosition`
se troca do mesmo jeito. **Apagar a prévia depois** (`src/__preview*.tsx`,
`preview-*.html`) e conferir com `git status` que não sobrou nada.

Foi assim que apareceram, entre outros, a lista do filtro antigo continuando na tela
sob o filtro novo depois de um erro, e o retângulo cinza em volta das ilustrações.

## Arquitetura

- **`src/lib/api/`** — única camada que importa o `supabaseClient`. Telas e hooks
  falam apenas com ela. Isso é proposital: mantém a futura troca por Capacitor
  restrita a esta camada. Não importe o cliente do Supabase em componentes.
- **Cidade** (`CITY_OPTIONS` + tabela `cities`): lista fechada, com o centro de cada
  município gravado. Ela é **só exibição** — quem decide a fila é a distância em
  quilômetros, pelo GPS. Por isso abrir a lista para o Brasil inteiro não traz mais
  gente para ninguém: só deixa alguém se cadastrar onde não há ninguém por perto, e
  a fila chega vazia. Crescer a lista é decisão de até onde divulgar, não de tela.
  No cadastro, o passo da cidade oferece "Usar minha localização"
  (`sugerirCidadePelaLocalizacao` + RPC `cidade_mais_proxima`, migration `0019`), que
  grava a coordenada e preenche a cidade mais próxima dentro de 100 km — sem o raio,
  quem se cadastrasse em Recife receberia Curitiba. Foi escolhido em lugar de
  geolocalização por IP: no Brasil o IP costuma resolver para a capital ou para São
  Paulo, exigiria serviço externo e entrada nova na política de privacidade, e o app
  já pede o GPS de qualquer forma.
- **Fila vazia longe da região.** A fila filtra por distância, então quem está fora
  do Sul (ou viajando) recebe fila vazia. A tela culpava sempre o filtro, e mexer
  nele não resolvia nada. `distancia_do_mais_proximo` (migration `0020`) diz a que
  distância está a pessoa mais próxima que passa em todos os outros filtros: dentro
  de `DISTANCIA_MAX_KM` a tela manda ajustar o filtro; além dele, avisa que o app
  ainda não chegou ali e oferece trocar a posição pelo centro da cidade do perfil.
  Sem esse botão não havia volta: a tela que oferece a cidade só aparece para quem
  ainda não tem posição gravada, e desligar a permissão não apaga a coordenada. Por
  isso também, `atualizarLocalizacaoNaAbertura` **não roda** para quem está em modo
  cidade (`approximateLocation`) — senão o GPS devolveria a posição no próximo abrir
  e a escolha sumiria sozinha. Para voltar ao GPS existe Ajustes › Permissões.
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
- **Painel admin** (`admin/index.html` + `src/admin/`): segunda página do mesmo build
  (`vite.config.ts`, `build.rollupOptions.input`), publicada em `/app1/admin/`, com
  bundle próprio — nada do painel vai para o app. Usa a mesma camada `src/lib/api/`
  (`admin.ts`) e o mesmo login. Quem decide o acesso é o banco: `is_admin()` (lê
  `auth.users.raw_app_meta_data.papel`, vale na hora) dentro de cada função do painel,
  que devolve só números somados. Esconder o endereço não protege nada.
- **Registros para o painel admin** (migration `0013`): `atividade_diaria` (um registro
  por pessoa por dia de uso, gravado pelo RPC `registrar_atividade`, que o app chama ao
  entrar e ao voltar para a frente), `historico_matches` (não some quando o match é
  desfeito), `marcos_do_usuario` (primeira vez em cada etapa do funil) e
  `contas_excluidas` (só a contagem por dia). Todas só do servidor: RLS sem policy e
  sem permissão para o app; gatilhos `security definer` escrevem. Excluir a conta apaga
  os registros da pessoa. "Dia" é o de São Paulo (`dia_local`).
- **Moderação** (migrations `0013`→`0016`): `profiles.status_moderacao`
  ('ativo','suspenso','banido') + `suspensao_termina_em`, escritos só pelo RPC
  `moderar` (que confere `is_admin()`). A suspensão **vence sozinha**: a função
  `sob_sancao(status, termina_em)` trata prazo vencido como conta ativa, então
  não há nada a rodar no vencimento. A sanção morde em três lugares no banco —
  `fila_descobrir` (some da fila dos outros e não recebe fila), `registrar_swipe`
  e a policy `messages_envia` — porque a tela do app é aviso, não tranca.
  A denúncia entra pelo RPC `denunciar`, que copia as 200 últimas mensagens da
  conversa para `report_mensagens` no mesmo instante: desfazer o match apaga as
  mensagens, e quem assediou sumia com a prova. `reports.denunciado_id` virou
  `on delete set null` (com `denunciado_nome` copiado), então excluir a conta
  não apaga mais as denúncias contra a pessoa. Toda decisão fica em
  `admin_actions`. Sem service role e sem Edge Function: nada sai do Postgres.
  No app, `src/lib/moderacao.ts` lê o próprio status do perfil e `App.tsx` mostra a
  `ModerationBlockedScreen` antes de qualquer outra tela. Quem já estava com o app
  aberto quando foi sancionado não via nada mudar até recarregar, então `App.tsx`
  relê o status (consulta de uma linha, `carregarSituacaoDeModeracao`) em três
  momentos: ao voltar para o app, em qualquer erro da fila ou das conversas, e quando
  a fila vem vazia — para quem está sob sanção o servidor devolve fila vazia **sem
  erro**, e sem esse gatilho a pessoa veria "acabaram os perfis" e nenhuma explicação.
  Derrubar a sessão foi descartado: exige service role, ela entraria de novo (o login
  não sabe de moderação) e cairia na mesma tela — só que sem entender o que houve, e
  a App Store exige motivo e caminho de contestação visíveis — e desliga a fila, as
  conversas, a localização e o registro de atividade: quem está bloqueado não conta
  como usuário ativo nos números do painel.
  A `0017` fechou o outro lado, que a `0015` esqueceu: sanção que só morde quem foi
  sancionado não aparece para mais ninguém. Agora `meus_matches` e `perfil_do_match`
  escondem quem está suspenso ou banido (volta sozinho quando o prazo vence — nada é
  apagado) e `sancao_no_match` substituiu `estou_sob_sancao` na policy `messages_envia`,
  para pegar os dois lados. Na mesma migration, denunciar passou a tirar o perfil da
  fila de quem denunciou, para sempre: antes a denúncia só mostrava um aviso e o
  perfil continuava ali, curtível.
  Na `0018` a regra virou **denunciar bloqueia**, em qualquer lugar de onde se
  denuncie, e o bloqueio é feito pelo próprio RPC `denunciar` (uma chamada só, não
  duas que falham pela metade). A regra anterior ("denunciar não bloqueia, a conversa
  continua") durou uma tarde: testando com duas contas, denunciar pelo chat deixava a
  conversa aberta e os dois escrevendo. Junto veio o índice
  `reports_uma_aberta_por_par` — dava para abrir a mesma denúncia repetidas vezes e
  encher a fila de cópias. Para quem foi denunciado nada revela a denúncia: vê
  exatamente o que veria num bloqueio comum. Ao fechar a conversa denunciada no app,
  **nunca** usar `removeChat` — ele chama `desfazer_match`, que apaga as mensagens,
  justo as que viraram prova; recarregar a lista basta, porque `meus_matches` já pula
  par com bloqueio.
  **Não confundir** `profiles.status_moderacao` com `photos.status_moderacao`
  ('pendente','aprovada','rejeitada'), com `profiles.verificacao_status` nem
  com `profiles.visivel` — esta última é escolha da própria pessoa, e por isso
  banir não mexe nela.
- **Verificação e fotos no painel** (migration `0021`): as duas filas que faltavam.
  A de **verificação** é por PESSOA, não por pedido: `solicitar_verificacao` insere
  uma linha por selfie enviada e não impede a segunda, então agrupar evita a mesma
  pessoa cinco vezes na fila e transforma as selfies extras em material a mais para
  comparar. `analisar_verificacao(user_id, acao)` decide todos os pedidos pendentes
  de uma vez; recusar quem já tem o selo é como se tira um selo dado por engano, e
  por isso a função não exige pedido pendente — sem linha 'pendente' para marcar,
  ela carimba o último pedido, senão o perfil diria 'rejeitada' e o histórico
  'aprovada'.
  **A selfie é apagada de verdade quando a análise termina** — a tela de verificação
  promete isso a quem a envia. Quem apaga é o painel, pela API de Storage (por isso
  o admin ganhou DELETE no bucket, além do SELECT que faltava): apagar a linha de
  `storage.objects` por SQL deixaria o arquivo órfão no bucket, que não é apagar. O
  apagamento é um passo separado do commit da decisão, e `verificacoes.selfie_apagada_em`
  registra o que saiu — sem essa marca, um apagamento que falhasse quebraria a
  promessa em silêncio. O que sobrou aparece em Decididas com botão para apagar de novo.
  A de **fotos** é reativa: a foto continua entrando `'aprovada'` e aparecendo na
  hora. Nascer 'pendente' deixaria quem acabou de se cadastrar sem foto nenhuma até
  alguém olhar (a fila filtra por foto aprovada) — app quebrado à espera de uma
  equipe que não existe. Mas reativo não é sem fila: `photos.moderada_em` diz se
  aquela foto já passou por olho humano, e foto sem marca é o que a aba Fotos
  mostra. Aprovar e rejeitar marcam os dois, então a foto sai da fila inclusive
  quando a decisão é "não há nada de errado com ela". Rejeitar **não apaga**: a foto
  sai da vista dos outros (quem decide é `fotos_le`, pelo status) e continua no
  bucket, porque uma denúncia sobre aquela foto ainda precisa dela.
  `moderar_fotos` recebe uma lista, e as fotos têm de ser da mesma pessoa: é uma
  decisão sobre alguém, e é assim que cabe em uma linha de `admin_actions`.
  A mesma ação existe **dentro da denúncia** (`painel_moderacao` passou a devolver id
  e status de cada foto): "fotos falsas ou de outra pessoa" é motivo de denúncia, e
  mandar procurar a pessoa noutra tela sem busca por nome era o mesmo que não ter a
  ação.
- **`supabase/functions/`** — Edge Functions para o que a chave anon não pode fazer
  (ex.: `delete-account`, que apaga usuário do auth e arquivos do storage). O id do
  usuário vem sempre do JWT, nunca do corpo da requisição.
- **`src/screens/`** e **`src/onboarding/screens/`** — uma tela por arquivo.
- **`src/components/`** — componentes compartilhados.
- **Foto de perfil nova** (cadastro e edição): arquivo escolhido → `validaFotoEscolhida`
  → `PhotoCropSheet` (recorte 4:5, `PROPORCAO_DA_FOTO`, com a biblioteca
  `react-easy-crop`) → `recortaImagem` (recorta e comprime num passo, JPEG até 1280px)
  → `enviarFoto(blob)`, que sobe o arquivo como chega. O caminho inteiro, com o
  carregando sobre a prévia, está em `src/hooks/useEscolhaDeFoto.ts`. A selfie de
  verificação não passa por recorte (`enviarSelfieDeVerificacao`).

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

**`create or replace function` copia da ÚLTIMA migration que define a função, nunca
da que a criou.** Na `0015`, o corpo de `fila_descobrir` foi copiado da `0003` para
receber a checagem de sanção — só que a `0008` já tinha trocado `intencao_filtro` de
texto para lista. O Postgres recusou na hora (`malformed array literal`) e desfez a
migration inteira; se o erro fosse silencioso em vez de fatal, teria voltado um
filtro antigo sem ninguém perceber. Ache a versão em vigor com
`grep -l "create or replace function public.<nome>" supabase/migrations/*.sql | tail -1`,
copie de lá, e confira por diff que a nova é a antiga MAIS as linhas pretendidas,
nada além.

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

1. **A pessoa não fica sabendo que a foto dela foi reprovada.** A `0021` deu ao
   painel o botão de rejeitar, mas no app a foto reprovada continua aparecendo
   normalmente em Fotos para quem é dona dela — `PhotosManageScreen` recebe
   `photos: string[]`, só as URLs, e `MyProfile.photos` também. Quem tem uma foto
   derrubada some da fila dos outros sem entender por quê. Fazer isso é levar o
   status por essa cadeia (`minhasFotos` já devolve, é de lá para baixo que se
   perde) e escrever o aviso. A App Store exige moderação com resposta em 24h para
   app de namoro, e "reprovamos sua foto sem avisar" não é resposta.
2. **Painel admin completo:** funil, retenção D7, ranking de 10 cidades e contas
   excluídas. Os registros já existem desde a `0013`; falta só consultar e desenhar.
3. **Provas de assédio: o que ainda falta.** A denúncia já guarda cópia da conversa
   e sobrevive à exclusão da conta do denunciado (`0015`). O que continua em aberto:
   `desfazer_match` apaga as mensagens de conversas que **nunca** foram denunciadas,
   e a cópia pega só as 200 últimas mensagens. Também não há prazo de descarte
   automático — a decisão de 21/09 foi guardar sem prazo fixo, enquanto houver conta
   envolvida, e está escrita na política de privacidade (seção 8). Se um dia virar
   prazo fixo, vai precisar de agendamento no banco (pg_cron), que hoje não existe.
4. **iOS via Capacitor.** Depois do empacotamento vêm: plugins nativos (Preferences,
   Geolocation, Camera) com as strings de permissão no `Info.plist`, deep link para a
   confirmação de e-mail (hoje o `redirectTo` usa `window.location.origin`), push via
   APNs, e as exigências da App Store para app de namoro (18+, moderação com resposta
   em 24h, exclusão de conta no app — essa já existe).
5. **Limpar branches já mescladas** no repositório (as `claude/*`).
6. **Detalhes da auditoria que ficaram para depois:** a Edge Function `delete-account`
   lista no máximo 100 arquivos por pasta (quem pediu muitas verificações deixa selfies
   para trás — a `0021` alivia, porque a selfie some ao fim da análise, mas não
   resolve para quem excluir a conta com pedido ainda pendente) e precisa de novo
   deploy quando for corrigida; `nome`, `bio`, `profissao`
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
- **Privacidade está na 1.2 e diretrizes na 1.1.** A 1.1 (21/09) trouxe a moderação:
  cópia da conversa na denúncia, o que o admin enxerga, e a denúncia que sobrevive à
  exclusão da conta. A 1.2 (21/09, junto da `0021`) trouxe a selfie de verificação —
  que ela é coletada, que uma pessoa a compara com as fotos do perfil, que não passa
  por reconhecimento facial e que é apagada ao fim da análise — e a moderação de
  fotos. **Não existe fluxo de reconsentimento**: quem aceitou antes tem `1.0`
  gravado em `consents` e nunca vê o texto novo. Pré-lançamento isso passa; antes de
  abrir ao público, decidir se é preciso pedir o aceite de novo — e aí a tela de
  reconsentimento é trabalho novo.
- **Validação no cliente é UX, não segurança.** O mínimo de senha real é o do Supabase
  Auth; o cliente só antecipa a mensagem.
- **Dado sensível.** Interesse (indica orientação sexual), cidade, fotos e telefone
  são tratados sob consentimento explícito registrado na tabela `consents`, com os
  documentos versionados em `src/legal/versions.ts`. Qualquer acesso novo a esses
  dados — moderação inclusive — precisa entrar na política de privacidade.

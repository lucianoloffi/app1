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
6. `supabase/migrations/20260916_0006_fix_leitura_fotos.sql` — terceiros passam a ver as fotos aprovadas
7. `supabase/migrations/20260916_0007_status_casado.sql` — "casado" entre os estados civis
8. `supabase/migrations/20260917_0008_intencao_filtro_multipla.sql` — intenção do filtro vira múltipla escolha
9. `supabase/migrations/20260917_0009_onboarding_minimo_opcional.sql` — cadastro passa a exigir só 1 foto e nenhum interesse (antes eram 3 e 3)
10. `supabase/migrations/20260920_0010_colunas_so_do_servidor.sql` — o app deixa de escrever colunas de status (verificação, moderação, denúncia, mensagens); a verificação passa a ser pedida pelo RPC `solicitar_verificacao`
11. `supabase/migrations/20260921_0011_bloqueio_e_fotos.sql` — bloqueio não pode mais ser desfeito pelo bloqueado; fotos só abrem para quem pode ver o perfil; foto aprovada não troca de imagem
12. `supabase/migrations/20260921_0012_recuperar_telefone.sql` — devolve o telefone a quem o perdeu no fim do cadastro e tira dos avisos do Security Advisor as três funções de gatilho
13. `supabase/migrations/20260921_0013_registros_para_o_painel.sql` — começa a registrar dias de uso, histórico de matches, marcos de cada pessoa e contas excluídas, para o painel admin
14. `supabase/migrations/20260921_0014_painel_numeros.sql` — quem é administrador (`is_admin`) e a consulta da tela de Números do painel admin

> Sempre que chegar uma migration nova, rode a que falta — pela data no nome dá
> para saber onde você parou. Todas são seguras de rodar de novo.
>
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
npm run popular -- --conferir   # diz o que está no lugar e o que falta
npm run popular -- --limpar     # apaga tudo o que o script criou
```

Se algo não sair como esperado, `--conferir` é o primeiro comando a rodar: ele
diz se as chaves são as certas (o engano mais comum é passar a anon no lugar da
service role), quantos perfis existem, quantos ficaram com cadastro completo,
interesses, fotos e localização, e o que há de errado na pasta de fotos. Ele
imprime o papel de cada chave, nunca a chave.

**Service role.** Criar usuário no `auth` é a única coisa que a chave anon não
faz; o resto o script grava entrando como cada perfil, pelo mesmo caminho do
app e com o RLS ligado. Passe a chave só na hora de rodar, nunca no `.env`:

```bash
SUPABASE_SERVICE_ROLE_KEY=cole_aqui npm run popular
```

**Fotos.** Três origens possíveis:

`--fotos=pasta` — as suas, uma por pessoa, e é o que dá o resultado mais
realista. Monte a pasta assim (ela está no `.gitignore`, então não vai para o
repositório):

```
fotos-de-teste/
  mulheres/   ana.jpg, camila.jpg, …
  homens/     rodrigo.jpg, felipe.jpg, …
```

```bash
SUPABASE_SERVICE_ROLE_KEY=cole_aqui npm run popular -- --fotos=pasta
```

Um arquivo por pessoa: o script gera os três enquadramentos (retrato inteiro,
fechado no alto e quadrado) recortando a mesma foto. **A quantidade de perfis é
a quantidade de fotos** — 6 fotos em `mulheres/` e 4 em `homens/` criam 6 e 4
perfis. Use `.jpg`: só nele o recorte funciona (PNG e WEBP entram repetidos três
vezes).

**Foto deitada com a pessoa de lado** precisa dizer de que lado ela está, senão
o recorte 3:4 sai pelo meio e corta o rosto. Diga no nome do arquivo:

```
bruno-direita.jpg     pessoa à direita do quadro
lucas-esquerda.jpg    pessoa à esquerda
marcelo.jpg           no meio (o padrão)
```

Foto em pé, com a pessoa no meio, não precisa de sufixo.

Com menos fotos que perfis, `--repetir` fecha os 20 reaproveitando cada uma:

```bash
SUPABASE_SERVICE_ROLE_KEY=cole_aqui npm run popular -- --fotos=pasta --repetir
```

Na segunda volta a foto sai espelhada, com o tom mais quente e com outro
enquadramento na capa — de relance não parece a mesma imagem. Mas continua
sendo o mesmo rosto: em duas telas lado a lado dá para perceber. Com 5 fotos de
cada lado saem os 20 perfis, cada rosto aparecendo duas vezes.

`--fotos=pexels` (padrão) — banco de imagens de licença livre, com chave
gratuita que sai na hora em [pexels.com/api](https://www.pexels.com/api/):

```bash
PEXELS_API_KEY=cole_aqui SUPABASE_SERVICE_ROLE_KEY=cole_aqui npm run popular
```

`--fotos=cores` — imagens geradas pelo próprio script (degradê com silhueta).
Feias, mas não dependem de rede, de chave nem de licença.

Nos três casos as fotos de um perfil são da mesma pessoa: três rostos
diferentes no mesmo perfil fariam o app parecer quebrado.

**O que aparece na fila.** Quem acabou de criar conta começa com os filtros em
25 km e 25–45 anos, e a intenção que escolheu no cadastro. Com isso, de
Joinville aparecem uns 10 a 13 dos 20 perfis; os de Blumenau, Itajaí e Jaraguá
do Sul ficam de fora até você abrir **Filtros de busca** e aumentar a
distância. É de propósito: serve para testar o filtro.

**Antes de abrir o app para outras pessoas**, rode `npm run popular -- --limpar`.
São contas de verdade no seu projeto, e o build publicado no GitHub Pages fala
com o mesmo banco — para quem chega de fora elas parecem gente real. Vale
principalmente para fotos de pessoas reais, suas ou do Pexels: nenhuma licença
de banco de imagens cobre rosto de gente de verdade em perfil de app de namoro
fora de teste.

## 8. Moderação (manual, por enquanto)

- **Fotos**: nascem com `status_moderacao = 'aprovada'`. Para tirar uma foto do
  ar, mude para `'rejeitada'` no Table Editor — ela some dos perfis na hora.
- **Verificação de perfil**: a selfie fica no bucket privado `verificacoes`.
  Para aprovar, mude `verificacoes.status` e `profiles.verificacao_status`
  para `'aprovada'`. O selo só aparece depois disso.
- **Denúncias**: `reports`, com `status` `aberta` → `em_analise` → `resolvida`.

> O Table Editor e o SQL Editor rodam com o papel administrativo do painel, que
> a migration 0010 não limita — moderar por aqui continua funcionando. O que
> mudou é que o app (papel `authenticated`) não consegue mais escrever esses
> campos, nem pela API.

## 9. O que já foi testado

As migrations 0001 a 0005 foram aplicadas em um PostgreSQL 16 local (com stubs
no lugar do PostGIS e do schema `auth`) antes da entrega. Confirmado:

- os três registros (perfil, preferências, ajustes) nascem junto com o usuário
- o gate de 18 anos e a imutabilidade da data de nascimento barram o update
- "cadastro completo" só passa com nome, nascimento, gênero, cidade, intenção e
  ao menos 1 foto (até a migration 0009 eram 3 interesses e 3 fotos)
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

A migration 0010 foi testada em um PostgreSQL 16 com PostGIS local, com os papéis
do Supabase (`anon`, `authenticated`, `service_role`) simulados. Treze tentativas de
uma pessoa logada escrever colunas que são do servidor (status de verificação,
moderação e denúncia, texto e remetente de mensagem recebida, data de
consentimento) passavam antes e são recusadas depois; as operações que o app faz
seguem funcionando e o `service_role` continua com acesso total.

A migration 0011 foi testada do mesmo jeito, com o banco recriado do zero (0001 a 0011).
Recusado depois dela: quem foi bloqueado reativar a conversa e escrever de novo; quem foi
bloqueado, ou um estranho, abrir fotos de perfil oculto ou de quem o bloqueou; trocar a
imagem de uma foto aprovada (sobrescrevendo, ou apagando e reenviando com o mesmo nome);
mensagem com mais de 2000 caracteres. Segue funcionando: curtir, dar match, conversar,
desfazer match, ver fotos na fila, nas conversas (mesmo de perfil oculto) e na lista de
bloqueados, enviar e apagar fotos.

## Painel admin

O painel fica em `https://<usuário>.github.io/app1/admin/` (no ar, publicado junto
com o app) e em `http://localhost:5173/app1/admin/` rodando `npm run dev`. Entra-se
com uma conta do próprio Lovi, mas só abre para contas marcadas como administradoras.

Para marcar uma conta, rode no SQL Editor, trocando o e-mail:

```sql
update auth.users
   set raw_app_meta_data = raw_app_meta_data || '{"papel": "admin"}'::jsonb
 where email = 'seu-email@exemplo.com';
```

Vale na hora, sem sair e entrar de novo. Para desmarcar:

```sql
update auth.users
   set raw_app_meta_data = raw_app_meta_data - 'papel'
 where email = 'seu-email@exemplo.com';
```

A marcação fica em `app_metadata`, que só o servidor altera — nunca em
`user_metadata`, que o próprio usuário consegue mudar pela API.

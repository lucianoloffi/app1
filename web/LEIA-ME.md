# Site lovidates.com

## O que tem aqui

- `public/` — as páginas do site. Cada pasta vira um endereço:
  - `public/index.html` → lovidates.com
  - `public/termos/index.html` → lovidates.com/termos/
  - `public/privacidade/index.html` → lovidates.com/privacidade/
  - `public/diretrizes/index.html` → lovidates.com/diretrizes/
- `src/index.js` — o código da Worker (o que decide o que responder em cada endereço)
- `wrangler.jsonc` — a configuração usada para publicar

O app **não** está aqui: ele continua no repositório app1, publicado no
GitHub Pages. A Worker só busca o conteúdo de lá quando alguém acessa
lovidates.com/app1.

## Como publicar uma alteração

No Terminal, dentro desta pasta:

    npx wrangler deploy

## Como acrescentar um idioma (exemplo: espanhol)

1. Crie a pasta `public/es/` e repita dentro dela a mesma estrutura do
   português: `public/es/index.html`, `public/es/terminos/index.html`, e assim
   por diante.
2. Em cada página nova, troque `lang="pt-BR"` por `lang="es"` no começo do
   arquivo, e ajuste os links internos para apontarem para dentro de `/es/`.
3. Em `src/index.js`, acrescente o código do idioma na lista `IDIOMAS`:

       const IDIOMAS = ['es'];

   É isso que faz quem tem o navegador em espanhol cair automaticamente em
   lovidates.com/es/ ao abrir a raiz do site.
4. Em `wrangler.jsonc`, acrescente `"/"` na lista `run_worker_first`:

       "run_worker_first": ["/", "/app1", "/app1/*"]

   Sem isso o redirecionamento automático não chega a acontecer: a Cloudflare
   serve a página em português direto, sem passar pelo código. Enquanto você
   não tiver um segundo idioma, deixe como está — é mais rápido assim.
5. Acrescente os endereços novos em `public/sitemap.xml`.
6. Publique com `npx wrangler deploy`.

Enquanto um idioma não estiver na lista `IDIOMAS`, ninguém é redirecionado
para ele — mas o endereço continua funcionando se a pessoa digitar direto.

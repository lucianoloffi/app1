// Worker do lovidates.com
//
// Responsabilidades:
// 1. /app1 e tudo dentro dele -> busca o app no GitHub Pages e devolve como
//    se fosse deste domínio (o app continua publicado lá, sem alteração).
// 2. Qualquer outro caminho -> serve as páginas do site (pasta public/).
//
// Multi-idioma: o site vive em pastas por idioma. O português é a raiz
// (/, /termos/...) e cada outro idioma ganha um prefixo (/es/, /en/...).
// Quem chega na raiz com o navegador em outro idioma é levado para a pasta
// correspondente, desde que ela já exista em IDIOMAS.

const IDIOMAS = ['es']; // acrescente aqui quando publicar um novo idioma

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // --- 1. o app ---
    if (url.pathname === '/app1' || url.pathname.startsWith('/app1/')) {
      const enderecoOrigem = 'https://lucianoloffi.github.io' + url.pathname + url.search;
      const respostaOrigem = await fetch(enderecoOrigem);
      return new Response(respostaOrigem.body, respostaOrigem);
    }

    // --- 2. idioma do visitante, só na primeira visita à raiz ---
    if (url.pathname === '/' && IDIOMAS.length > 0) {
      const preferido = idiomaPreferido(request.headers.get('Accept-Language'));
      if (preferido && IDIOMAS.includes(preferido)) {
        return Response.redirect(url.origin + '/' + preferido + '/', 302);
      }
    }

    // --- 3. o site ---
    return env.ASSETS.fetch(request);
  },
};

// Lê o cabeçalho que o navegador manda com os idiomas do usuário
// (ex.: "es-AR,es;q=0.9,pt-BR;q=0.8") e devolve o primeiro código de duas
// letras. Sem cabeçalho, devolve null e o visitante fica no português.
function idiomaPreferido(cabecalho) {
  if (!cabecalho) return null;
  const primeiro = cabecalho.split(',')[0].trim().toLowerCase();
  return primeiro.slice(0, 2) || null;
}

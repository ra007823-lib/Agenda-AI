/* =========================================================
   Conecta+ — Layout compartilhado e rotas entre páginas
   Cada página (Index.html e pages/*.html) tem só um <main id="main"
   data-page="..."> e carrega este arquivo + data.js + app.js.
   Header, rodapé e logo ficam AQUI (um único lugar para manter).
   ========================================================= */
(() => {
  /* Raiz do projeto, descoberta pelo caminho deste script (funciona em file:// e http) */
  const ROOT = document.currentScript.src.replace(/js\/layout\.js.*$/, "");
  const PAGES = ["vagas", "vaga", "empresas", "perfil", "contato", "whatsapp", "entrar", "cadastro-candidato", "cadastro-empresa", "painel", "nova-vaga"];

  /* "#/vaga/j1?x=1" -> ".../pages/vaga.html?id=j1&x=1" ; "#/" -> ".../Index.html" */
  const url = (r) => {
    if (typeof r !== "string" || !r.startsWith("#/")) return r;
    const [path, qs = ""] = r.slice(2).split("?");
    const [name, arg] = path.split("/");
    if (!name) return ROOT + "Index.html" + (qs ? "?" + qs : "");
    const q = [arg ? "id=" + arg : "", qs].filter(Boolean).join("&");
    return ROOT + "pages/" + (PAGES.includes(name) ? name : "vagas") + ".html" + (q ? "?" + q : "");
  };
  const go = (r) => { location.href = url(r); };
  /* Rota atual no formato "#/nome[/id]" (usada para voltar após o login) */
  const current = () => {
    const name = document.getElementById("main").dataset.page || "home";
    const p = new URLSearchParams(location.search), id = p.get("id");
    if (name === "vaga" && id) return "#/vaga/" + id;
    p.delete("id"); const qs = p.toString();
    return (name === "home" ? "#/" : "#/" + name) + (qs ? "?" + qs : "");
  };
  const fix = (el) => {
    if (el.nodeType !== 1) return;
    const list = el.matches("a[href^='#/']") ? [el] : [];
    el.querySelectorAll("a[href^='#/']").forEach((a) => list.push(a));
    list.forEach((a) => a.setAttribute("href", url(a.getAttribute("href"))));
  };
  window.Route = { ROOT, url, go, current };

  const main = document.getElementById("main");
  main.insertAdjacentHTML("beforebegin", `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs><g id="logo-full"><g class="lg-n" fill="none" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"><path d="M350 435L295 375C270 348 245 345 215 345A82 82 0 0 0 215 509H236"/></g>
<g class="lg-g" fill="none" stroke-width="52" stroke-linecap="round" stroke-linejoin="round" transform="rotate(180 312 427)"><path d="M350 435L295 375C270 348 245 345 215 345A82 82 0 0 0 215 509H236"/></g><g class="lg-n" fill="none" stroke-width="38" stroke-linecap="round" stroke-linejoin="round">
<path d="M692 390A56 56 0 1 0 692 462"/><circle cx="777" cy="426" r="56"/>
<path d="M877 482V415A45 45 0 0 1 967 415V482"/>
<path d="M1010 426H1121A56 56 0 1 0 1105 466"/>
<path d="M1250 390A56 56 0 1 0 1250 462"/>
<path d="M1293 340V446A36 36 0 0 0 1329 482H1334M1293 374H1332"/>
<circle cx="1420" cy="426" r="56"/><path d="M1476 372V482"/></g>
<path class="lg-g" fill="none" stroke-width="50" stroke-linecap="round" d="M1545 424H1659M1601 366V484"/></g></defs></svg>
  <a class="skip-link" href="#main">Pular para o conteúdo</a>
  <header class="site-header" id="header">
    <div class="container header-inner">
      <a href="#/" class="brand" aria-label="Conecta+ — página inicial">
        <svg class="logo" viewBox="91 309 1603 236" role="img" aria-label="Conecta+"><use href="#logo-full"/></svg>
      </a>
      <nav id="nav" class="nav" aria-label="Principal"><!-- links montados por js/app.js (updateNav) --></nav>
      <button class="menu-toggle" id="menuToggle" aria-expanded="false" aria-controls="nav" aria-label="Abrir menu" type="button"><span></span><span></span><span></span></button>
    </div>
  </header>`);
  main.insertAdjacentHTML("afterend", `
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <svg class="logo logo-light" viewBox="91 309 1603 236" role="img" aria-label="Conecta+"><use href="#logo-full"/></svg>
        <p class="muted">Conectando talentos a boas oportunidades. Protótipo visual com dados fictícios.</p>
      </div>
      <div>
        <h4>Plataforma</h4>
        <a href="#/vagas">Todas as vagas</a>
        <a href="#/empresas">Empresas</a>
        <a href="#/perfil" data-auth="candidate" hidden>Meu perfil</a>
      </div>
      <div>
        <h4>Institucional</h4>
        <a href="#/entrar">Área da empresa</a>
        <a href="#/whatsapp">Triagem pelo WhatsApp</a>
        <a href="#/contato" data-auth hidden>Fale conosco</a>
        <a href="#/contato" data-auth hidden>Sobre a Conecta+</a>
        <a href="#/contato" data-auth hidden>Privacidade</a>
      </div>
      <div data-auth hidden>
        <h4>Atendimento</h4>
        <p class="muted" id="footContact"></p>
      </div>
    </div>
    <div class="container footer-bottom">© 2026 Conecta+. Todos os direitos reservados. Dados exibidos são fictícios.</div>
  </footer>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

  /* Converte todo href="#/..." (inclusive os criados depois, como no chat) em link real */
  fix(document.body);
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(fix))).observe(document.body, { childList: true, subtree: true });
})();

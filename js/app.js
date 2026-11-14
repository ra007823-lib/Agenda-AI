/* =========================================================
   Conecta+ — App (roteamento por hash + componentes)
   Funciona 100% local (file://), sem backend ou APIs.
   ========================================================= */
(() => {
  const { platform, categories, modalities, contracts, companies, jobs, profile, accounts, sampleLeads } = window.DATA;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const main = $("#main");

  /* ---------- Utilidades ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = (n) => "R$ " + n.toLocaleString("pt-BR");
  const salary = (j) => `${money(j.salaryMin)} – ${money(j.salaryMax)}`;
  const ago = (d) => (d <= 1 ? "Hoje/ontem" : `Há ${d} dias`);
  const company = (id) => companies.find((c) => c.id === id);
  const job = (id) => jobs.find((j) => j.id === id);
  const locationsList = () => [...new Set(jobs.map((j) => j.location))].sort();
  const openCount = (cid) => jobs.filter((j) => j.company === cid).length;
  const modClass = (m) => ({ Remoto: "remoto", Híbrido: "hibrido" }[m] || "");

  let favs = new Set();
  const loadFavs = () => { const c = getCandidate(); favs = new Set(c ? store.get("conecta-favs-" + c.id, []) : []); };
  const saveFavs = () => { const c = getCandidate(); if (c) store.set("conecta-favs-" + c.id, [...favs]); };
  let nextRoute = null; // rota pedida antes do login

  /* ---------- Armazenamento local (vagas das empresas, candidatos, sessão) ---------- */
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  /* Sessão guardada só no navegador: localStorage ("manter conectado") ou sessionStorage (até fechar a aba) */
  let memUser = null;
  const readUser = () => {
    for (const s of ["localStorage", "sessionStorage"]) {
      try { const v = JSON.parse(window[s].getItem("conecta-session")); if (v && v.type && v.id) return v; } catch (e) {}
    }
    return memUser;
  };
  const setUser = (type, id, remember = true) => {
    memUser = { type, id };
    ["localStorage", "sessionStorage"].forEach((s) => { try { window[s].removeItem("conecta-session"); } catch (e) {} });
    try { window[remember ? "localStorage" : "sessionStorage"].setItem("conecta-session", JSON.stringify({ type, id })); } catch (e) {}
    loadFavs();
  };
  const clearUser = () => {
    memUser = null;
    ["localStorage", "sessionStorage"].forEach((s) => { try { window[s].removeItem("conecta-session"); } catch (e) {} });
    loadFavs();
  };
  const candidates = store.get("conecta-candidates", []);
  if (!candidates.some((c) => c.id === "mariana")) candidates.unshift({ id: "mariana", password: "demo123", phone: "(11) 98888-7777", ...profile });
  const saveCandidates = () => store.set("conecta-candidates", candidates);
  const getCandidate = () => { const u = readUser(); return (u && u.type === "candidate" && candidates.find((c) => c.id === u.id)) || null; };
  const getSession = () => { const u = readUser(); return u && u.type === "company" && companies.some((c) => c.id === u.id) ? u.id : null; };
  loadFavs();
  const customJobs = store.get("conecta-custom-jobs", []);
  const customCompanies = store.get("conecta-custom-companies", []);
  const customAccounts = store.get("conecta-custom-accounts", []);
  companies.push(...customCompanies);
  jobs.push(...customJobs);
  const allAccounts = () => [...accounts, ...customAccounts];
  const sha256 = async (s) => {
    try {
      const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
      return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
    } catch (e) { return "plain:" + btoa(unescape(encodeURIComponent(s))); }
  };
  const checkPass = async (acc, pass) => (acc.password !== undefined ? acc.password === pass : acc.hash === (await sha256((acc.company || acc.id) + pass)));
  const validCnpj = (raw) => {
    const c = raw.replace(/\D/g, "");
    if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false;
    for (const t of [12, 13]) {
      let s = 0, w = t - 7;
      for (let i = 0; i < t; i++) { s += +c[i] * w--; if (w < 2) w = 9; }
      if (((s * 10) % 11) % 10 !== +c[t]) return false;
    }
    return true;
  };
  const maskDigits = (v, pattern) => { let i = 0; const d = v.replace(/\D/g, ""); return pattern.replace(/#/g, () => d[i++] ?? "").replace(/[^\d]+$/, ""); };
  const applyRules = (f, rules) => {
    let ok = true;
    Object.entries(rules).forEach(([k, m]) => {
      const el = f.elements[k], sp = $(`[data-err="${k}"]`, f);
      if (sp) sp.textContent = m || "";
      if (el && el.classList) { el.classList.toggle("invalid", !!m); el.setAttribute("aria-invalid", !!m); }
      if (m) ok = false;
    });
    if (!ok) f.querySelector(".invalid")?.focus();
    return ok;
  };
  const sectorOptions = [...new Set([...window.DATA.categories, "Varejo", "Indústria", "Serviços", "Outros"])];
  const benefitOptions = ["Vale-refeição", "Vale-alimentação", "Vale-transporte", "Plano de saúde", "Plano odontológico", "PLR / bônus", "Home office", "Auxílio educação", "Gympass / Wellhub", "Seguro de vida"];
  const allLeads = () => [...sampleLeads, ...store.get("conecta-leads", [])];
  const saveLead = (lead) => store.set("conecta-leads", [...store.get("conecta-leads", []), lead]);
  const norm = (s) => String(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const validCpf = (raw) => {
    const c = raw.replace(/\D/g, "");
    if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
    for (let t = 9; t < 11; t++) {
      let s = 0;
      for (let i = 0; i < t; i++) s += +c[i] * (t + 1 - i);
      if (((s * 10) % 11) % 10 !== +c[t]) return false;
    }
    return true;
  };
  const maskCpf = (raw) => { const d = raw.replace(/\D/g, ""); return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`; };
  const fmtDate = (iso) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

  /* ---------- Ícones ---------- */
  const I = (p, extra = "") => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;
  const icons = {
    pin: I('<path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'),
    briefcase: I('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18"/>'),
    clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    cash: I('<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/>'),
    home: I('<path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z"/>'),
    search: I('<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>'),
    eye: I('<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    compass: I('<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>'),
    heart: I('<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.8-8 11-8 11z"/>'),
    arrow: I('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    mail: I('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    phone: I('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/>'),
    filter: I('<path d="M3 5h18M6 12h12M10 19h4"/>'),
    wa: `<svg class="icon" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16.04 3C9.4 3 4 8.38 4 15.02c0 2.12.55 4.18 1.6 6L4 29l8.15-1.57a12.03 12.03 0 003.89.65C22.68 28.08 28 22.7 28 16.06 28 9.4 22.68 3 16.04 3zm0 22.04c-1.2 0-2.38-.24-3.48-.7l-.5-.2-4.84.93.97-4.7-.22-.5a9.95 9.95 0 01-1.52-5.27c0-5.5 4.5-9.97 10.03-9.97 5.54 0 10.04 4.47 10.04 9.97s-4.5 9.44-10.5 10.44zm5.5-7.45c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.95 1.18-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5a9.1 9.1 0 01-1.68-2.1c-.17-.3 0-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.62-.92-2.22-.24-.58-.5-.5-.67-.5h-.58c-.2 0-.52.08-.8.38-.27.3-1.04 1.02-1.04 2.5s1.07 2.9 1.22 3.1c.15.2 2.1 3.2 5.08 4.5.7.3 1.26.48 1.69.62.7.22 1.35.2 1.86.12.57-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.07-.13-.27-.2-.57-.35z"/></svg>`,
  };

  /* ---------- Componentes reutilizáveis ---------- */
  const logoBadge = (c, lg = false) => `<span class="logo-badge ${lg ? "lg" : ""}" style="background:${c.color}" aria-hidden="true">${c.initials}</span>`;
  const waBtn = (kind, label, cls = "") => `<button type="button" class="btn btn-wa ${cls}" data-wa="${kind}">${icons.wa}${label}</button>`;

  const jobCard = (j) => {
    const c = company(j.company);
    const fav = favs.has(j.id);
    return `
    <article class="card clickable" data-go="#/vaga/${j.id}">
      <div class="job-top">
        ${logoBadge(c)}
        <div>
          <h3><a href="#/vaga/${j.id}">${esc(j.title)}</a></h3>
          <div class="muted small">${esc(c.name)}</div>
        </div>
        <button class="fav" type="button" data-fav="${j.id}" aria-pressed="${fav}" aria-label="${fav ? "Remover dos favoritos" : "Salvar vaga"}">${icons.heart}</button>
      </div>
      <div class="meta">
        <span>${icons.pin}${esc(j.location)}</span>
        <span>${icons.clock}${ago(j.daysAgo)}</span>
      </div>
      <div class="tags">
        <span class="tag ${modClass(j.modality)}">${j.modality}</span>
        <span class="tag">${j.contract}</span>
        <span class="tag">${j.category}</span>
      </div>
      <div class="card-foot">
        <span class="salary">${salary(j)}</span>
        <div class="actions">
          <a class="btn btn-outline btn-sm" href="#/vaga/${j.id}">Ver detalhes</a>
          <button type="button" class="btn btn-wa btn-sm" data-wa="job:${j.id}">${icons.wa}Tenho interesse</button>
        </div>
      </div>
    </article>`;
  };

  const companyCard = (c) => `
    <article class="card clickable company-card" data-go="#/vagas?empresa=${c.id}">
      ${logoBadge(c, true)}
      <h3>${esc(c.name)}</h3>
      <div class="tags" style="margin-bottom:.75rem"><span class="tag">${c.sector}</span><span class="tag">${c.size}</span></div>
      <p class="muted">${esc(c.description)}</p>
      <div class="meta"><span>${icons.pin}${esc(c.city)}</span></div>
      <div class="card-foot">
        <span class="open-jobs">${icons.briefcase}${openCount(c.id)} vagas abertas</span>
        <div class="actions">
          <a class="btn btn-outline btn-sm" href="#/vagas?empresa=${c.id}">Ver vagas</a>
          <button type="button" class="btn btn-wa btn-sm" data-wa="company:${c.id}">${icons.wa}Contato</button>
        </div>
      </div>
    </article>`;

  const options = (arr, sel, first) => `<option value="">${first}</option>` + arr.map((o) => `<option ${o === sel ? "selected" : ""}>${esc(o)}</option>`).join("");

  /* ---------- Filtros / busca ---------- */
  const emptyFilters = () => ({ q: "", cat: "", loc: "", modality: [], contract: [], salary: "", empresa: "", sort: "recent" });
  let F = emptyFilters();

  const salaryRanges = { "": "Qualquer faixa", "0-3000": "Até R$ 3.000", "3000-6000": "R$ 3.000 a 6.000", "6000-99999": "Acima de R$ 6.000" };

  const filterJobs = () => {
    const q = F.q.trim().toLowerCase();
    let list = jobs.filter((j) => {
      const c = company(j.company);
      if (q && !`${j.title} ${c.name} ${j.category} ${j.location}`.toLowerCase().includes(q)) return false;
      if (F.cat && j.category !== F.cat) return false;
      if (F.loc && j.location !== F.loc) return false;
      if (F.modality.length && !F.modality.includes(j.modality)) return false;
      if (F.contract.length && !F.contract.includes(j.contract)) return false;
      if (F.empresa && j.company !== F.empresa) return false;
      if (F.salary) {
        const [a, b] = F.salary.split("-").map(Number);
        if (j.salaryMax < a || j.salaryMin > b) return false;
      }
      return true;
    });
    const sorters = { recent: (a, b) => a.daysAgo - b.daysAgo, salary: (a, b) => b.salaryMax - a.salaryMax };
    return list.sort(sorters[F.sort]);
  };

  /* ---------- Páginas ---------- */
  const pages = {
    home() {
      const featured = jobs.filter((j) => j.featured).slice(0, 4);
      return `
      <section class="hero">
        <div class="container">
          <h1>Encontre a vaga certa e <em>conecte-se</em> com a empresa.</h1>
          <p class="lead">Pesquise oportunidades, conheça empresas e demonstre interesse direto pelo WhatsApp, de forma simples e rápida.</p>
          <form class="search-card" id="heroSearch" role="search">
            <div class="field"><label for="hq">O que você procura?</label><input class="input" id="hq" name="q" placeholder="Cargo, empresa ou palavra-chave" autocomplete="off"></div>
            <div class="field"><label for="hc">Categoria</label><select class="select" id="hc" name="cat">${options(categories, "", "Todas")}</select></div>
            <div class="field"><label for="hl">Localização</label><select class="select" id="hl" name="loc">${options(locationsList(), "", "Todas")}</select></div>
            <button class="btn btn-green" type="submit">${icons.search}Buscar vagas</button>
          </form>
          <div class="chips" aria-label="Buscas populares">
            ${["Tecnologia", "Saúde", "Vendas", "Logística"].map((c) => `<button class="chip" type="button" data-go="#/vagas?cat=${encodeURIComponent(c)}">${c}</button>`).join("")}
            <button class="chip" type="button" data-go="#/vagas?modality=Remoto">Remoto</button>
          </div>
        </div>
      </section>
      <div class="container stats">
        <div class="stat"><strong>${jobs.length}</strong><span>Vagas abertas</span></div>
        <div class="stat"><strong>${companies.length}</strong><span>Empresas contratando</span></div>
        <div class="stat"><strong>${categories.length}</strong><span>Áreas profissionais</span></div>
        <div class="stat"><strong>WhatsApp</strong><span>Contato direto</span></div>
      </div>
      <section class="section">
        <div class="container">
          <div class="section-head"><h2>Vagas em destaque</h2><a class="btn btn-outline btn-sm" href="#/vagas">Ver todas ${icons.arrow}</a></div>
          <div class="grid grid-2">${featured.map(jobCard).join("")}</div>
          <p style="text-align:center;margin-top:1.75rem"><a class="btn btn-primary" href="#/vagas">Visualizar todas as vagas</a></p>
        </div>
      </section>
      <section class="section" style="padding-top:0">
        <div class="container">
          <div class="section-head"><h2>Empresas contratantes</h2><a class="btn btn-outline btn-sm" href="#/empresas">Ver empresas ${icons.arrow}</a></div>
          <div class="company-strip">${companies.map((c) => `<a href="#/vagas?empresa=${c.id}">${logoBadge(c)}<span>${esc(c.name)}</span></a>`).join("")}</div>
        </div>
      </section>
      <section class="section" style="padding-top:0">
        <div class="container"><div class="cta">
          <div><h2>Quer ajuda para encontrar sua vaga?</h2><p>Nossos recrutadores respondem pelo WhatsApp em horário comercial.</p></div>
          ${waBtn("recruiter", "Falar com recrutador")}
        </div>
        <div class="cta cta-alt" style="margin-top:1rem">
          <div><h2>Sua empresa quer contratar?</h2><p>Entre na área da empresa, cadastre vagas e receba candidatos já triados.</p></div>
          <a class="btn btn-outline-light" href="#/entrar">Área da empresa</a>
        </div></div>
      </section>`;
    },

    vagas() {
      const list = filterJobs();
      const active = [];
      if (F.q) active.push(["q", `“${F.q}”`]);
      if (F.cat) active.push(["cat", F.cat]);
      if (F.loc) active.push(["loc", F.loc]);
      if (F.salary) active.push(["salary", salaryRanges[F.salary]]);
      if (F.empresa) active.push(["empresa", company(F.empresa).name]);
      F.modality.forEach((m) => active.push(["modality:" + m, m]));
      F.contract.forEach((m) => active.push(["contract:" + m, m]));
      const checks = (name, arr) => arr.map((o) => `<label class="check"><input type="checkbox" data-f="${name}" value="${o}" ${F[name].includes(o) ? "checked" : ""}>${o}</label>`).join("");
      return `
      <div class="page-head"><div class="container">
        <div class="crumbs"><a href="#/">Início</a> / Vagas</div>
        <h1 style="font-size:clamp(1.6rem,4vw,2.3rem)">Vagas de emprego</h1>
        <p>Encontre oportunidades por área, cidade, modalidade e faixa salarial.</p>
      </div></div>
      <div class="container jobs-layout">
        <aside class="filters" id="filters" aria-label="Filtros">
          <h3>Filtros <button class="btn btn-sm btn-outline" type="button" id="clearF">Limpar</button></h3>
          <div class="filter-group field"><label for="fcat">Categoria</label><select class="select" id="fcat" data-f="cat">${options(categories, F.cat, "Todas")}</select></div>
          <div class="filter-group field"><label for="floc">Localização</label><select class="select" id="floc" data-f="loc">${options(locationsList(), F.loc, "Todas")}</select></div>
          <div class="filter-group field"><label for="fsal">Faixa salarial</label><select class="select" id="fsal" data-f="salary">${Object.entries(salaryRanges).map(([v, l]) => `<option value="${v}" ${v === F.salary ? "selected" : ""}>${l}</option>`).join("")}</select></div>
          <div class="filter-group"><strong>Modalidade</strong>${checks("modality", modalities)}</div>
          <div class="filter-group"><strong>Tipo de contratação</strong>${checks("contract", contracts)}</div>
        </aside>
        <section aria-live="polite">
          <div class="search-card" style="margin:0 0 1rem;grid-template-columns:1fr">
            <div class="field"><label for="vq">Pesquisar vagas</label><input class="input" id="vq" type="search" data-f="q" value="${esc(F.q)}" placeholder="Cargo, empresa, cidade…"></div>
          </div>
          <div class="toolbar">
            <strong>${list.length} ${list.length === 1 ? "vaga encontrada" : "vagas encontradas"}</strong>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap">
              <button type="button" class="btn btn-outline btn-sm" id="filterToggle" aria-expanded="false" aria-controls="filters">${icons.filter}Filtros${active.length ? ` (${active.length})` : ""}</button>
              <label class="sr" style="position:absolute;left:-999px" for="vsort">Ordenar</label>
              <select class="select" id="vsort" data-f="sort"><option value="recent" ${F.sort === "recent" ? "selected" : ""}>Mais recentes</option><option value="salary" ${F.sort === "salary" ? "selected" : ""}>Maior salário</option></select>
            </div>
          </div>
          ${active.length ? `<div class="active-filters">${active.map(([k, l]) => `<button class="pill" type="button" data-remove="${k}" aria-label="Remover filtro ${esc(l)}">${esc(l)} <span aria-hidden="true">×</span></button>`).join("")}</div>` : ""}
          <div class="list">${list.length ? list.map(jobCard).join("") : `<div class="empty"><div class="big">${icons.search}</div><h3>Nenhuma vaga encontrada</h3><p class="muted">Tente remover alguns filtros ou buscar outro termo.</p><button class="btn btn-primary" type="button" id="clearF2">Limpar filtros</button></div>`}</div>
        </section>
      </div>`;
    },

    vaga(id) {
      const j = job(id);
      if (!j) return pages.notFound();
      const c = company(j.company);
      const similar = jobs.filter((x) => x.id !== j.id && (x.category === j.category || x.company === j.company)).slice(0, 2);
      return `
      <div class="page-head"><div class="container">
        <div class="crumbs"><a href="#/">Início</a> / <a href="#/vagas">Vagas</a> / ${esc(j.title)}</div>
        <div class="detail-head">
          ${logoBadge(c, true)}
          <div>
            <h1>${esc(j.title)}</h1>
            <p><a href="#/vagas?empresa=${c.id}"><strong>${esc(c.name)}</strong></a> · ${esc(j.location)} · ${ago(j.daysAgo)}</p>
          </div>
        </div>
        <div class="tags" style="margin-top:1rem"><span class="tag ${modClass(j.modality)}">${j.modality}</span><span class="tag">${j.contract}</span><span class="tag">${j.category}</span></div>
      </div></div>
      <div class="container detail-layout">
        <div class="card">
          <h2>Descrição da vaga</h2><p>${esc(j.summary)} ${esc(j.description)}</p>
          <h2>Requisitos</h2><ul class="ticks">${j.requirements.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
          <h2>Benefícios</h2><ul class="ticks">${j.benefits.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
          <h2>Sobre a contratação</h2><p>${esc(j.hiring)}</p>
          <h2>Sobre a empresa</h2><p class="muted">${esc(c.description)}</p>
        </div>
        <aside class="card side-card">
          <div><div class="muted small">Faixa salarial</div><div class="salary" style="font-size:1.4rem">${salary(j)}</div></div>
          ${waBtn("job:" + j.id, "Tenho interesse", "btn-block")}
          <button type="button" class="btn btn-outline btn-block" data-fav="${j.id}" aria-pressed="${favs.has(j.id)}">${icons.heart}<span>${favs.has(j.id) ? "Vaga salva" : "Salvar vaga"}</span></button>
          <dl class="kv">
            <div><dt>Localização</dt><dd>${esc(j.location)}</dd></div>
            <div><dt>Modalidade</dt><dd>${j.modality}</dd></div>
            <div><dt>Contratação</dt><dd>${j.contract}</dd></div>
            <div><dt>Categoria</dt><dd>${j.category}</dd></div>
            <div><dt>Publicada</dt><dd>${ago(j.daysAgo)}</dd></div>
            ${j.openings ? `<div><dt>Nº de vagas</dt><dd>${j.openings}</dd></div>` : ""}
            ${j.workload ? `<div><dt>Jornada</dt><dd>${esc(j.workload)}</dd></div>` : ""}
            ${j.education ? `<div><dt>Escolaridade</dt><dd>${esc(j.education)}</dd></div>` : ""}
            ${j.experience ? `<div><dt>Experiência</dt><dd>${esc(j.experience)}</dd></div>` : ""}
            ${j.deadline ? `<div><dt>Inscrições até</dt><dd>${new Date(j.deadline + "T12:00").toLocaleDateString("pt-BR")}</dd></div>` : ""}
          </dl>
          <button type="button" class="btn btn-wa btn-block" data-wa="company:${c.id}">${icons.wa}Contato com a empresa</button>
        </aside>
      </div>
      ${similar.length ? `<div class="container section" style="padding-top:0"><h2>Vagas relacionadas</h2><div class="grid grid-2">${similar.map(jobCard).join("")}</div></div>` : ""}`;
    },

    empresas() {
      return `
      <div class="page-head"><div class="container">
        <div class="crumbs"><a href="#/">Início</a> / Empresas</div>
        <h1 style="font-size:clamp(1.6rem,4vw,2.3rem)">Empresas contratantes</h1>
        <p>Conheça quem está contratando agora na plataforma.</p>
      </div></div>
      <div class="container section"><div class="grid grid-3">${companies.map(companyCard).join("")}</div></div>`;
    },

    perfil() {
      const p = getCandidate();
      const myLeads = store.get("conecta-leads", []).filter((l) => l.candidateId === p.id).sort((x, y) => y.at.localeCompare(x.at));
      return `
      <div class="page-head"><div class="container">
        <div class="crumbs"><a href="#/">Início</a> / Meu perfil</div>
        <div class="profile-hero">
          <div class="avatar" role="img" aria-label="Foto de perfil de ${esc(p.name)}">${esc(p.initials)}</div>
          <div style="flex:1;min-width:220px">
            <h1 style="font-size:clamp(1.6rem,4vw,2.3rem);margin-bottom:.15rem">${esc(p.name)}</h1>
            <p style="color:var(--text);font-weight:700;margin-bottom:.25rem">${esc(p.role || "Profissional em busca de oportunidades")}</p>
            <span class="status">${esc(p.availability)}</span>
          </div>
          <a class="btn btn-wa" href="#/whatsapp">${icons.wa}Fazer triagem</a>
          <button type="button" class="btn btn-outline" data-logout>Sair</button>
        </div>
      </div></div>
      <div class="container profile-grid">
        <div class="grid">
          <div class="card"><h3>Informações profissionais</h3>
            <dl class="kv"><div><dt>Localização</dt><dd>${esc(p.location || "—")}</dd></div><div><dt>E-mail</dt><dd>${esc(p.email)}</dd></div><div><dt>WhatsApp</dt><dd>${esc(p.phone || "—")}</dd></div></dl></div>
          <div class="card"><h3>Áreas de interesse</h3>${p.interests && p.interests.length ? `<div class="tags">${p.interests.map((i) => `<span class="tag remoto">${esc(i)}</span>`).join("")}</div>` : `<p class="muted">Nenhuma área informada.</p>`}</div>
          <div class="card"><h3>Habilidades</h3>${p.skills && p.skills.length ? `<div class="tags">${p.skills.map((i) => `<span class="tag">${esc(i)}</span>`).join("")}</div>` : `<p class="muted">Adicione suas habilidades em "Editar perfil".</p>`}</div>
          <div class="card"><h3>Vagas salvas (${favs.size})</h3>${favs.size ? `<ul class="ticks">${[...favs].map(job).filter(Boolean).map((j) => `<li><a href="#/vaga/${j.id}">${esc(j.title)}</a></li>`).join("")}</ul>` : `<p class="muted">Você ainda não salvou nenhuma vaga. Toque no coração em uma vaga para salvá-la.</p>`}</div>
          <div class="card"><h3>Minhas triagens (${myLeads.length})</h3>${myLeads.length ? `<ul class="rows">${myLeads.map((l) => `<li><div><strong>${esc(l.area)}</strong><div class="muted small">${l.jobId && job(l.jobId) ? esc(job(l.jobId).title) : "Triagem geral"}</div></div><span class="muted small">${fmtDate(l.at)}</span></li>`).join("")}</ul>` : `<p class="muted">Nenhuma triagem ainda. <a href="#/whatsapp">Inicie pelo WhatsApp</a>.</p>`}</div>
        </div>
        <div class="grid">
          <div class="card"><h3>Sobre</h3><p class="muted" style="margin:0">${esc(p.about || "Conte um pouco sobre você em \"Editar perfil\".")}</p></div>
          <div class="card"><h3>Experiência profissional</h3>
            ${p.experience.length ? `<ul class="timeline">${p.experience.map((e, n) => `<li><strong>${esc(e.role)}</strong><span class="muted small">${esc(e.org)} · ${esc(e.period)}</span>${e.text ? `<p style="margin:.3rem 0 0">${esc(e.text)}</p>` : ""}<button type="button" class="link-btn" data-rm-exp="${n}">Remover</button></li>`).join("")}</ul>` : `<p class="muted">Nenhuma experiência cadastrada.</p>`}
            <details class="add"><summary>+ Adicionar experiência</summary>
              <form class="form" id="expForm" novalidate>
                <div class="field"><label for="xr">Cargo</label><input class="input" id="xr" name="role"><span class="err" data-err="role"></span></div>
                <div class="field"><label for="xo">Empresa</label><input class="input" id="xo" name="org"><span class="err" data-err="org"></span></div>
                <div class="field"><label for="xp">Período</label><input class="input" id="xp" name="period" placeholder="2022 — 2024"></div>
                <div class="field"><label for="xt">Descrição</label><textarea class="textarea" id="xt" name="text" style="min-height:80px"></textarea></div>
                <button class="btn btn-primary btn-sm" type="submit">Adicionar</button>
              </form></details></div>
          <div class="card"><h3>Formação acadêmica</h3>
            ${p.education.length ? `<ul class="timeline">${p.education.map((e, n) => `<li><strong>${esc(e.course)}</strong><span class="muted small">${esc(e.org)} · ${esc(e.period)}</span><button type="button" class="link-btn" data-rm-edu="${n}">Remover</button></li>`).join("")}</ul>` : `<p class="muted">Nenhuma formação cadastrada.</p>`}
            <details class="add"><summary>+ Adicionar formação</summary>
              <form class="form" id="eduForm" novalidate>
                <div class="field"><label for="ec">Curso</label><input class="input" id="ec" name="course"><span class="err" data-err="course"></span></div>
                <div class="field"><label for="eo">Instituição</label><input class="input" id="eo" name="org"><span class="err" data-err="org"></span></div>
                <div class="field"><label for="ep">Período</label><input class="input" id="ep" name="period" placeholder="2021 — 2024"></div>
                <button class="btn btn-primary btn-sm" type="submit">Adicionar</button>
              </form></details></div>
          <div class="card"><details class="add" style="margin:0"><summary><strong>Editar perfil</strong></summary>
            <form class="form" id="profileForm" novalidate>
              <div class="field"><label for="pn">Nome completo</label><input class="input" id="pn" name="name" value="${esc(p.name)}"><span class="err" data-err="name"></span></div>
              <div class="field"><label for="pr">Cargo / profissão</label><input class="input" id="pr" name="role" value="${esc(p.role || "")}"></div>
              <div class="field"><label for="pl">Cidade / UF</label><input class="input" id="pl" name="location" value="${esc(p.location || "")}"></div>
              <div class="field"><label for="pph">WhatsApp</label><input class="input" id="pph" name="phone" value="${esc(p.phone || "")}"></div>
              <div class="field"><label for="pa">Disponibilidade</label><select class="select" id="pa" name="availability">${["Disponível para novas oportunidades", "Aberto(a) a propostas", "Não estou procurando no momento"].map((o) => `<option ${o === p.availability ? "selected" : ""}>${o}</option>`).join("")}</select></div>
              <div class="field"><span class="lbl">Áreas de interesse</span><div class="check-grid">${categories.map((c) => `<label class="check"><input type="checkbox" name="interest" value="${c}" ${(p.interests || []).includes(c) ? "checked" : ""}>${c}</label>`).join("")}</div></div>
              <div class="field"><label for="ps">Habilidades (separadas por vírgula)</label><input class="input" id="ps" name="skills" value="${esc((p.skills || []).join(", "))}"></div>
              <div class="field"><label for="pab">Sobre você</label><textarea class="textarea" id="pab" name="about">${esc(p.about || "")}</textarea></div>
              <button class="btn btn-green" type="submit">Salvar alterações</button>
            </form></details></div>
        </div>
      </div>`;
    },

    contato() {
      const P = platform;
      return `
      <div class="page-head"><div class="container">
        <div class="crumbs"><a href="#/">Início</a> / Contato</div>
        <h1 style="font-size:clamp(1.6rem,4vw,2.3rem)">Fale com a Conecta+</h1>
        <p>Dúvidas, sugestões ou parcerias? Estamos prontos para ajudar.</p>
      </div></div>
      <div class="container contact-grid">
        <div class="card">
          <h3>Informações da plataforma</h3>
          <ul class="info-list">
            <li><span class="info-ico">${icons.phone}</span><div><strong>WhatsApp</strong><br><span class="muted">${P.whatsappLabel}</span></div></li>
            <li><span class="info-ico">${icons.mail}</span><div><strong>E-mail</strong><br><span class="muted">${P.email}</span></div></li>
            <li><span class="info-ico">${icons.pin}</span><div><strong>Endereço</strong><br><span class="muted">${P.address}</span></div></li>
            <li><span class="info-ico">${icons.clock}</span><div><strong>Atendimento</strong><br><span class="muted">${P.hours}</span></div></li>
          </ul>
          ${waBtn("general", "Atendimento via WhatsApp", "btn-block")}
          <hr style="border:0;border-top:1px solid var(--border);margin:1.5rem 0">
          <h3>Institucional</h3>
          <p class="muted"><strong>Missão:</strong> aproximar pessoas e empresas com transparência e simplicidade.<br><strong>Valores:</strong> confiança, acessibilidade, tecnologia e respeito.</p>
          <p class="muted small" style="margin:0">Protótipo visual com dados fictícios, sem envio real de informações.</p>
        </div>
        <div class="card">
          <h3>Envie uma mensagem</h3>
          <form class="form" id="contactForm" novalidate>
            <div class="field"><label for="cn">Nome</label><input class="input" id="cn" name="nome" autocomplete="name"><span class="err" data-err="nome"></span></div>
            <div class="field"><label for="ce">E-mail</label><input class="input" id="ce" name="email" type="email" autocomplete="email"><span class="err" data-err="email"></span></div>
            <div class="field"><label for="cs">Assunto</label><select class="select" id="cs" name="assunto"><option>Dúvidas sobre vagas</option><option>Quero divulgar vagas</option><option>Suporte</option><option>Outros</option></select></div>
            <div class="field"><label for="cm">Mensagem</label><textarea class="textarea" id="cm" name="msg"></textarea><span class="err" data-err="msg"></span></div>
            <button class="btn btn-primary" type="submit">Enviar mensagem</button>
            <div id="formOk" class="success" role="status" hidden>Mensagem enviada (demonstração). Obrigado pelo contato!</div>
          </form>
        </div>
      </div>`;
    },

    entrar() {
      return `
      <div class="page-head"><div class="container">
        <div class="crumbs"><a href="#/">Início</a> / Entrar</div>
        <h1 style="font-size:clamp(1.6rem,4vw,2.3rem)">Entrar na Conecta+</h1>
        <p>Acesse sua conta de candidato ou de empresa para ver seu perfil, o contato e muito mais.</p>
      </div></div>
      <div class="container auth-grid">
        <div class="card">
          <h3>Acesse sua conta</h3>
          <form class="form" id="loginForm" novalidate>
            <div class="seg" role="radiogroup" aria-label="Tipo de conta">
              <label class="seg-opt"><input type="radio" name="type" value="candidate" checked><span>Sou candidato</span></label>
              <label class="seg-opt"><input type="radio" name="type" value="company"><span>Sou empresa</span></label>
            </div>
            <div class="field"><label for="le">E-mail</label><input class="input" id="le" name="email" type="email" autocomplete="username" placeholder="voce@email.com"><span class="err" data-err="email"></span></div>
            <div class="field"><label for="lp">Senha</label>
              <div class="pass-wrap"><input class="input" id="lp" name="password" type="password" autocomplete="current-password"><button type="button" class="pass-toggle" data-pass="lp" aria-label="Mostrar senha">${icons.eye}</button></div>
              <span class="err" data-err="password"></span></div>
            <label class="check"><input type="checkbox" name="remember" checked> Manter conectado neste navegador</label>
            <button class="btn btn-primary" type="submit">Entrar</button>
            <div class="err" id="loginErr" role="alert"></div>
          </form>
          <p class="muted" style="margin:1.25rem 0 0">Ainda não tem conta? <a href="#/cadastro-candidato" id="signupLink"><strong>Criar conta de candidato</strong></a></p>
        </div>
        <div class="card"><div id="demoBox"></div></div>
      </div>`;
    },

    "cadastro-candidato"() {
      return `
      <div class="page-head"><div class="container">
        <div class="crumbs"><a href="#/">Início</a> / <a href="#/entrar">Entrar</a> / Cadastro de candidato</div>
        <h1 style="font-size:clamp(1.6rem,4vw,2.3rem)">Crie seu perfil de candidato</h1>
        <p>Salve vagas, acompanhe suas triagens e deixe seu perfil pronto para as empresas.</p>
      </div></div>
      <div class="container narrow section" style="padding-top:1.5rem">
        <form class="card form" id="candForm" novalidate>
          <fieldset class="fs"><legend>Seus dados</legend>
            <div class="form-grid">
              <div class="field span2"><label for="kn">Nome completo</label><input class="input" id="kn" name="name" autocomplete="name"><span class="err" data-err="name"></span></div>
              <div class="field"><label for="kp">WhatsApp</label><input class="input" id="kp" name="phone" inputmode="tel" placeholder="(11) 99999-0000"><span class="err" data-err="phone"></span></div>
              <div class="field"><label for="kc">Cidade / UF</label><input class="input" id="kc" name="city" placeholder="São Paulo, SP"><span class="err" data-err="city"></span></div>
              <div class="field"><label for="kr">Profissão / cargo</label><input class="input" id="kr" name="role" placeholder="Ex.: Auxiliar administrativo"></div>
              <div class="field"><label for="ka">Área de interesse</label><select class="select" id="ka" name="area">${categories.map((o) => `<option>${esc(o)}</option>`).join("")}</select></div>
            </div>
          </fieldset>
          <fieldset class="fs"><legend>Acesso</legend>
            <div class="form-grid">
              <div class="field span2"><label for="ke">E-mail</label><input class="input" id="ke" name="email" type="email" autocomplete="email"><span class="err" data-err="email"></span></div>
              <div class="field"><label for="kw">Senha</label><div class="pass-wrap"><input class="input" id="kw" name="password" type="password" autocomplete="new-password"><button type="button" class="pass-toggle" data-pass="kw" aria-label="Mostrar senha">${icons.eye}</button></div><span class="err" data-err="password"></span><span class="muted small">Mínimo de 8 caracteres, com letras e números.</span></div>
              <div class="field"><label for="kw2">Confirmar senha</label><input class="input" id="kw2" name="confirm" type="password" autocomplete="new-password"><span class="err" data-err="confirm"></span></div>
            </div>
          </fieldset>
          <label class="check"><input type="checkbox" name="terms"> Li e aceito os termos de uso e a política de privacidade (fictícios).</label>
          <span class="err" data-err="terms"></span>
          <button class="btn btn-green" type="submit">Criar minha conta</button>
          <p class="muted" style="margin:0">É uma empresa? <a href="#/cadastro-empresa"><strong>Cadastre sua empresa</strong></a></p>
        </form>
      </div>`;
    },

    "cadastro-empresa"() {
      return `
      <div class="page-head"><div class="container">
        <div class="crumbs"><a href="#/">Início</a> / <a href="#/entrar">Entrar</a> / Cadastro de empresa</div>
        <h1 style="font-size:clamp(1.6rem,4vw,2.3rem)">Cadastre sua empresa</h1>
        <p>Crie sua conta gratuita e comece a divulgar vagas na Conecta+.</p>
      </div></div>
      <div class="container narrow section" style="padding-top:1.5rem">
        <form class="card form" id="signupForm" novalidate>
          <fieldset class="fs"><legend>Dados da empresa</legend>
            <div class="form-grid">
              <div class="field span2"><label for="sn">Nome fantasia</label><input class="input" id="sn" name="name" autocomplete="organization"><span class="err" data-err="name"></span></div>
              <div class="field"><label for="sc">CNPJ</label><input class="input" id="sc" name="cnpj" inputmode="numeric" placeholder="00.000.000/0000-00"><span class="err" data-err="cnpj"></span><span class="muted small">CNPJ de teste: 11.222.333/0001-81</span></div>
              <div class="field"><label for="ss">Área de atuação</label><select class="select" id="ss" name="sector">${sectorOptions.map((o) => `<option>${esc(o)}</option>`).join("")}</select></div>
              <div class="field"><label for="sci">Cidade / UF</label><input class="input" id="sci" name="city" placeholder="São Paulo, SP"><span class="err" data-err="city"></span></div>
              <div class="field"><label for="sz">Porte</label><select class="select" id="sz" name="size"><option>1–50 colaboradores</option><option>50–100 colaboradores</option><option>100–500 colaboradores</option><option>500+ colaboradores</option></select></div>
              <div class="field span2"><label for="sd">Sobre a empresa</label><textarea class="textarea" id="sd" name="description" style="min-height:100px" placeholder="Conte em poucas linhas o que a empresa faz e sua cultura."></textarea><span class="err" data-err="description"></span></div>
            </div>
          </fieldset>
          <fieldset class="fs"><legend>Responsável e acesso</legend>
            <div class="form-grid">
              <div class="field"><label for="sr">Nome do responsável</label><input class="input" id="sr" name="owner" autocomplete="name"><span class="err" data-err="owner"></span></div>
              <div class="field"><label for="sp">WhatsApp</label><input class="input" id="sp" name="phone" inputmode="tel" placeholder="(11) 99999-0000"><span class="err" data-err="phone"></span></div>
              <div class="field span2"><label for="se">E-mail de acesso</label><input class="input" id="se" name="email" type="email" autocomplete="email"><span class="err" data-err="email"></span></div>
              <div class="field"><label for="sw">Senha</label><div class="pass-wrap"><input class="input" id="sw" name="password" type="password" autocomplete="new-password"><button type="button" class="pass-toggle" data-pass="sw" aria-label="Mostrar senha">${icons.eye}</button></div><span class="err" data-err="password"></span><span class="muted small">Mínimo de 8 caracteres, com letras e números.</span></div>
              <div class="field"><label for="sw2">Confirmar senha</label><input class="input" id="sw2" name="confirm" type="password" autocomplete="new-password"><span class="err" data-err="confirm"></span></div>
            </div>
          </fieldset>
          <label class="check"><input type="checkbox" name="terms"> Li e aceito os termos de uso e a política de privacidade (fictícios).</label>
          <span class="err" data-err="terms"></span>
          <button class="btn btn-green" type="submit" id="signupBtn">Criar conta da empresa</button>
        </form>
      </div>`;
    },

    painel() {
      const cid = getSession();
      const c = company(cid);
      const acc = allAccounts().find((x) => x.company === cid);
      const mine = jobs.filter((j) => j.company === cid);
      const myLeads = allLeads().filter((l) => l.companyIds.includes(cid)).sort((x, y) => y.at.localeCompare(x.at));
      return `
      <div class="page-head"><div class="container">
        <div class="crumbs"><a href="#/">Início</a> / Painel da empresa</div>
        <div class="profile-hero">
          ${logoBadge(c, true)}
          <div style="flex:1;min-width:220px">
            <h1 style="font-size:clamp(1.5rem,4vw,2.2rem);margin-bottom:.15rem">${esc(c.name)}</h1>
            <p>Painel de recrutamento · ${esc(acc ? acc.email : "")}</p>
          </div>
          <a class="btn btn-green" href="#/nova-vaga">+ Nova vaga</a>
          <button type="button" class="btn btn-outline" data-logout>Sair</button>
        </div>
      </div></div>
      <div class="container panel-grid">
        <div class="stats flat" style="grid-column:1/-1">
          <div class="stat"><strong>${mine.length}</strong><span>Vagas publicadas</span></div>
          <div class="stat"><strong>${myLeads.length}</strong><span>Candidatos interessados</span></div>
          <div class="stat"><strong>${mine.filter((j) => j.custom).length}</strong><span>Cadastradas por você</span></div>
        </div>
        <section class="card">
          <h3>Candidatos interessados (${myLeads.length})</h3>
          ${myLeads.length ? `<ul class="rows">${myLeads.map((l) => `<li><div><strong>${esc(l.name)}</strong><div class="muted small">CPF ${esc(l.cpf)} · ${esc(l.area)}${l.jobId && job(l.jobId) ? " · " + esc(job(l.jobId).title) : ""}</div></div><span class="muted small">${fmtDate(l.at)}</span></li>`).join("")}</ul>` : `<p class="muted">Nenhum candidato ainda. Faça uma <a href="#/whatsapp">triagem pelo WhatsApp</a> como candidato para ver aparecer aqui.</p>`}
        </section>
        <section class="card">
          <h3>Minhas vagas (${mine.length})</h3>
          ${mine.length ? `<ul class="rows">${mine.map((j) => `<li><div><a href="#/vaga/${j.id}"><strong>${esc(j.title)}</strong></a><div class="muted small">${j.modality} · ${j.contract} · ${salary(j)}</div></div>${j.custom ? `<button type="button" class="btn btn-outline btn-sm" data-del="${j.id}" aria-label="Excluir vaga ${esc(j.title)}">Excluir</button>` : `<span class="tag">Exemplo</span>`}</li>`).join("")}</ul>` : `<p class="muted">Nenhuma vaga publicada. <a href="#/nova-vaga">Cadastre a primeira vaga</a>.</p>`}
        </section>
      </div>`;
    },

    "nova-vaga"() {
      const c = company(getSession());
      const opts = (arr) => arr.map((o) => `<option>${esc(o)}</option>`).join("");
      const today = new Date().toISOString().slice(0, 10);
      return `
      <div class="page-head"><div class="container">
        <div class="crumbs"><a href="#/">Início</a> / <a href="#/painel">Painel</a> / Nova vaga</div>
        <h1 style="font-size:clamp(1.6rem,4vw,2.3rem)">Cadastrar nova vaga</h1>
        <p>Preencha as informações abaixo. Campos com <span aria-hidden="true">*</span> são obrigatórios.</p>
      </div></div>
      <div class="container narrow section" style="padding-top:1.5rem">
        <form class="card form" id="jobForm" novalidate>
          <fieldset class="fs"><legend>1. Informações básicas</legend>
            <div class="form-grid">
              <div class="field span2"><label for="jt">Título da vaga *</label><input class="input" id="jt" name="title" placeholder="Ex.: Analista de Marketing"><span class="err" data-err="title"></span></div>
              <div class="field"><label for="jc">Área / categoria *</label><select class="select" id="jc" name="category">${opts(categories)}</select></div>
              <div class="field"><label for="jo">Quantidade de vagas *</label><input class="input" id="jo" name="openings" type="number" min="1" value="1" inputmode="numeric"><span class="err" data-err="openings"></span></div>
              <div class="field span2"><label for="jsu">Resumo curto *</label><input class="input" id="jsu" name="summary" maxlength="140" placeholder="Uma frase que aparece no card da vaga"><span class="err" data-err="summary"></span></div>
            </div>
          </fieldset>
          <fieldset class="fs"><legend>2. Contratação</legend>
            <div class="form-grid">
              <div class="field"><label for="jl">Localização *</label><input class="input" id="jl" name="location" value="${esc(c.city)}"><span class="err" data-err="location"></span></div>
              <div class="field"><label for="jm">Modalidade *</label><select class="select" id="jm" name="modality">${opts(modalities)}</select></div>
              <div class="field"><label for="jk">Tipo de contratação *</label><select class="select" id="jk" name="contract">${opts(contracts)}</select></div>
              <div class="field"><label for="jw">Jornada</label><select class="select" id="jw" name="workload">${opts(["40h semanais", "44h semanais", "30h semanais", "20h semanais", "Escala 12x36", "Flexível"])}</select></div>
              <div class="field"><label for="je">Escolaridade mínima</label><select class="select" id="je" name="education">${opts(["Não exigida", "Ensino fundamental", "Ensino médio", "Técnico", "Superior (cursando)", "Superior completo", "Pós-graduação"])}</select></div>
              <div class="field"><label for="jx">Experiência</label><select class="select" id="jx" name="experience">${opts(["Sem experiência", "Até 1 ano", "1 a 3 anos", "3 a 5 anos", "Mais de 5 anos"])}</select></div>
              <div class="field"><label for="jdl">Inscrições até</label><input class="input" id="jdl" name="deadline" type="date" min="${today}"><span class="err" data-err="deadline"></span></div>
            </div>
          </fieldset>
          <fieldset class="fs"><legend>3. Remuneração e benefícios</legend>
            <div class="form-grid">
              <div class="field"><label for="js1">Salário mínimo (R$) *</label><input class="input" id="js1" name="salaryMin" type="number" min="0" step="100" inputmode="numeric"><span class="err" data-err="salaryMin"></span></div>
              <div class="field"><label for="js2">Salário máximo (R$) *</label><input class="input" id="js2" name="salaryMax" type="number" min="0" step="100" inputmode="numeric"><span class="err" data-err="salaryMax"></span></div>
            </div>
            <div class="field"><span class="lbl">Benefícios oferecidos</span>
              <div class="check-grid">${benefitOptions.map((b) => `<label class="check"><input type="checkbox" name="benefit" value="${esc(b)}">${esc(b)}</label>`).join("")}</div></div>
            <div class="field"><label for="jbx">Outros benefícios (um por linha)</label><textarea class="textarea" id="jbx" name="benefitsExtra" style="min-height:80px"></textarea><span class="err" data-err="benefitsExtra"></span></div>
          </fieldset>
          <fieldset class="fs"><legend>4. Descrição e requisitos</legend>
            <div class="field"><label for="jd">Descrição das atividades *</label><textarea class="textarea" id="jd" name="description" placeholder="Principais responsabilidades e rotina da posição."></textarea><span class="err" data-err="description"></span></div>
            <div class="field"><label for="jr">Requisitos (um por linha) *</label><textarea class="textarea" id="jr" name="requirements" placeholder="Ex.: Experiência com atendimento&#10;Pacote Office"></textarea><span class="err" data-err="requirements"></span></div>
            <div class="field"><label for="jh">Etapas do processo seletivo</label><textarea class="textarea" id="jh" name="hiring" style="min-height:80px" placeholder="Ex.: triagem pelo WhatsApp, entrevista e proposta"></textarea></div>
          </fieldset>
          <div class="info-note">Candidatos que demonstrarem interesse passam pela triagem automática do WhatsApp (nome, CPF e área) e aparecem no seu painel.</div>
          <div class="form-actions"><button class="btn btn-green" type="submit">Publicar vaga</button><a class="btn btn-outline" href="#/painel">Cancelar</a></div>
        </form>
      </div>`;
    },

    whatsapp(arg, params) {
      const jid = params.get("vaga"), cid = params.get("empresa");
      const j = jid && job(jid), cp = j ? company(j.company) : cid && company(cid);
      chat.ctx = j ? { jobId: j.id, companyId: j.company } : cp ? { companyId: cp.id } : {};
      const title = cp ? cp.name : "Recrutador Conecta+", ini = cp ? cp.initials : "C+";
      const back = j ? `#/vaga/${j.id}` : "#/vagas";
      return `
      <div class="page-head"><div class="container">
        <div class="crumbs"><a href="#/">Início</a> / Triagem pelo WhatsApp</div>
        <h1 style="font-size:clamp(1.6rem,4vw,2.3rem)">Triagem pelo WhatsApp</h1>
        <p>Converse com nosso assistente virtual e demonstre interesse nas vagas.</p>
      </div></div>
      <div class="container wa-page">
        <aside class="card wa-info">
          <h3>Como funciona</h3>
          <ol class="steps">
            <li><strong>Nome completo</strong><span class="muted small">Para a empresa saber quem você é.</span></li>
            <li><strong>CPF</strong><span class="muted small">Validado e guardado de forma parcial.</span></li>
            <li><strong>Área de interesse</strong><span class="muted small">Mostramos as vagas disponíveis nela.</span></li>
            <li><strong>Contato da empresa</strong><span class="muted small">A empresa responde pelo WhatsApp em até 2 dias úteis.</span></li>
          </ol>
          ${j ? `<div class="demo-box"><div class="muted small">Você está se candidatando a</div><a href="#/vaga/${j.id}"><strong>${esc(j.title)}</strong></a><div class="muted small">${esc(cp.name)} · ${esc(j.location)}</div></div>` : ""}
          <div class="info-note">Simulação: nenhuma mensagem real é enviada. CPF de teste: <code>529.982.247-25</code></div>
        </aside>
        <section class="chat-card" aria-label="Conversa simulada no WhatsApp">
          <header class="wa-head">
            <a class="wa-icon-btn" href="${back}" aria-label="Voltar"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></a>
            <span class="wa-avatar">${esc(ini)}</span>
            <div><strong>${esc(title)}</strong><small id="waStatus">online</small></div>
            <button class="wa-icon-btn" id="waRestart" type="button" aria-label="Reiniciar conversa"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8M3 3v5h5"/></svg></button>
          </header>
          <div class="wa-chat" id="waChat" role="log" aria-live="polite"></div>
          <div class="wa-quick" id="waQuick"></div>
          <form class="wa-input" id="waForm" autocomplete="off">
            <input class="input" id="waText" aria-label="Digite sua mensagem" placeholder="Digite uma mensagem" disabled>
            <button class="wa-send" id="waSendBtn" type="submit" aria-label="Enviar" disabled><svg class="icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4l17.5-7.5a1 1 0 000-1.8L3.4 3.6a.7.7 0 00-1 .8L4 10.5l9 1.5-9 1.5-1.6 6.1a.7.7 0 001 .8z"/></svg></button>
          </form>
        </section>
      </div>`;
    },

    notFound() {
      return `<div class="container section"><div class="empty"><div class="big">${icons.compass}</div><h2>Página não encontrada</h2><p class="muted">O endereço não existe neste protótipo.</p><a class="btn btn-primary" href="#/">Voltar ao início</a></div></div>`;
    },
  };

  /* ---------- Roteador ---------- */
  const parseHash = () => {
    const raw = location.hash.replace(/^#\/?/, "");
    const [path, qs = ""] = raw.split("?");
    const [name = "", arg] = path.split("/");
    return { name: name || "home", arg, params: new URLSearchParams(qs) };
  };

  let lastName = null;
  const render = () => {
    const { name, arg, params } = parseHash();
    chat.run++; // cancela qualquer conversa em andamento ao trocar de página
    const cand = getCandidate(), comp = getSession(), logged = !!(cand || comp);
    const deny = (msg) => { nextRoute = location.hash; toast(msg); location.hash = "#/entrar"; };
    if (name === "perfil" && !cand) { if (comp) { location.hash = "#/painel"; return; } return deny("Entre como candidato para ver seu perfil."); }
    if (name === "contato" && !logged) return deny("Entre na sua conta para acessar o contato.");
    if (["painel", "nova-vaga"].includes(name) && !comp) { if (cand) { location.hash = "#/perfil"; return; } return deny("Entre como empresa para acessar o painel."); }
    if (["entrar", "cadastro-empresa", "cadastro-candidato"].includes(name) && logged) { location.hash = comp ? "#/painel" : "#/perfil"; return; }
    if (name === "vagas") {
      // links externos (chips, empresas) aplicam filtros; navegação normal preserva o estado
      if ([...params.keys()].length) {
        F = emptyFilters();
        F.q = params.get("q") || ""; F.cat = params.get("cat") || ""; F.loc = params.get("loc") || "";
        F.empresa = params.get("empresa") || "";
        if (params.get("modality")) F.modality = [params.get("modality")];
        history.replaceState(null, "", "#/vagas");
      }
    }
    const fn = pages[name] || pages.notFound;
    main.innerHTML = `<div class="view">${fn(arg, params)}</div>`;
    closeMenu();
    updateNav(name);
    if (name !== lastName || name === "vaga") { window.scrollTo({ top: 0 }); }
    lastName = name;
    document.title = (name === "vaga" && job(arg) ? job(arg).title + " | " : "") + "Conecta+ | Vagas de emprego";
    bindPage(name);
  };

  /* Re-renderiza apenas a página de vagas preservando foco na busca */
  const refreshJobs = (keepFocus) => {
    const pos = keepFocus ? $("#vq")?.selectionStart : null;
    const open = $("#filters")?.classList.contains("open");
    const y = window.scrollY;
    main.innerHTML = `<div class="view">${pages.vagas()}</div>`;
    if (open) { $("#filters").classList.add("open"); $("#filterToggle").setAttribute("aria-expanded", "true"); }
    bindPage("vagas");
    window.scrollTo({ top: y });
    if (keepFocus) { const el = $("#vq"); el.focus(); el.setSelectionRange(pos, pos); }
  };

  const bindPage = (name) => {
    if (name === "home") {
      $("#heroSearch").addEventListener("submit", (e) => {
        e.preventDefault();
        const d = new FormData(e.target);
        const p = new URLSearchParams();
        ["q", "cat", "loc"].forEach((k) => d.get(k) && p.set(k, d.get(k)));
        p.set("go", "1");
        location.hash = "#/vagas?" + p.toString();
      });
    }
    if (name === "vagas") {
      $("#clearF")?.addEventListener("click", () => { F = emptyFilters(); refreshJobs(); });
      $("#clearF2")?.addEventListener("click", () => { F = emptyFilters(); refreshJobs(); });
      $("#filterToggle")?.addEventListener("click", (e) => {
        const open = $("#filters").classList.toggle("open");
        e.currentTarget.setAttribute("aria-expanded", open);
      });
      $$("[data-f]").forEach((el) => {
        const key = el.dataset.f;
        el.addEventListener(el.type === "search" ? "input" : "change", () => {
          if (el.type === "checkbox") F[key] = $$(`[data-f="${key}"]:checked`).map((c) => c.value);
          else F[key] = el.value;
          refreshJobs(el.type === "search");
        });
      });
      $$("[data-remove]").forEach((b) => b.addEventListener("click", () => {
        const [k, v] = b.dataset.remove.split(":");
        if (v) F[k] = F[k].filter((x) => x !== v); else F[k] = "";
        refreshJobs();
      }));
    }
    $$("[data-pass]").forEach((b) => b.addEventListener("click", () => {
      const inp = $("#" + b.dataset.pass), show = inp.type === "password";
      inp.type = show ? "text" : "password";
      b.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
    }));
    if (name === "whatsapp") bindChat();
    if (name === "entrar") {
      const box = $("#demoBox"), f = $("#loginForm");
      const demoHtml = (type) => type === "company"
        ? `<h3>Contas de demonstração (empresa)</h3><p class="muted small">Login simulado, guardado apenas neste navegador. Senha: <code>demo123</code></p><div class="grid" style="gap:.4rem">${accounts.map((x) => `<button type="button" class="btn btn-outline btn-sm" data-demo="company:${x.company}">${esc(company(x.company).name)}</button>`).join("")}</div>`
        : `<h3>Conta de demonstração (candidato)</h3><p class="muted small">Login simulado, guardado apenas neste navegador. Senha: <code>demo123</code></p><div class="grid" style="gap:.4rem"><button type="button" class="btn btn-outline btn-sm" data-demo="candidate:mariana">Mariana Souza</button></div><hr style="border:0;border-top:1px solid var(--border);margin:1.25rem 0"><ul class="ticks" style="margin:0"><li>Salve vagas e acompanhe triagens</li><li>Monte seu perfil profissional</li><li>Acesse a página de contato</li></ul>`;
      const setType = (type) => {
        box.innerHTML = demoHtml(type);
        const s = $("#signupLink");
        s.href = type === "company" ? "#/cadastro-empresa" : "#/cadastro-candidato";
        s.innerHTML = `<strong>${type === "company" ? "Cadastre sua empresa" : "Criar conta de candidato"}</strong>`;
        $("#loginErr").textContent = "";
      };
      setType("candidate");
      $$('[name="type"]', f).forEach((r) => r.addEventListener("change", () => setType(r.value)));
      box.addEventListener("click", (e) => {
        const b = e.target.closest("[data-demo]"); if (!b) return;
        const [type, id] = b.dataset.demo.split(":");
        const acc = type === "company" ? accounts.find((x) => x.company === id) : candidates.find((x) => x.id === id);
        f.elements.email.value = acc.email; f.elements.password.value = acc.password || "demo123"; $("#loginErr").textContent = "";
        toast("Credenciais de demonstração preenchidas.");
      });
      let fails = 0, lockedUntil = 0;
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const err = $("#loginErr");
        if (Date.now() < lockedUntil) { err.textContent = `Muitas tentativas. Aguarde ${Math.ceil((lockedUntil - Date.now()) / 1000)}s.`; return; }
        const type = f.elements.type.value, email = f.elements.email.value.trim().toLowerCase(), pass = f.elements.password.value;
        if (!applyRules(f, { email: !/^\S+@\S+\.\S+$/.test(email) && "Informe um e-mail válido.", password: !pass && "Informe sua senha." })) return;
        const acc = type === "company" ? allAccounts().find((x) => x.email.toLowerCase() === email) : candidates.find((x) => x.email.toLowerCase() === email);
        if (!acc || !(await checkPass(acc, pass))) {
          fails++;
          if (fails >= 5) { lockedUntil = Date.now() + 30000; fails = 0; err.textContent = "Muitas tentativas. Aguarde 30s para tentar novamente."; }
          else err.textContent = "E-mail ou senha incorretos para este tipo de conta.";
          return;
        }
        setUser(type, type === "company" ? acc.company : acc.id, f.elements.remember.checked);
        toast("Bem-vindo(a), " + (type === "company" ? company(acc.company).name : acc.name.split(" ")[0]) + "!");
        const go = nextRoute || (type === "company" ? "#/painel" : "#/perfil");
        nextRoute = null; location.hash = go;
      });
    }
    if (name === "cadastro-candidato") {
      const f = $("#candForm");
      f.elements.phone.addEventListener("input", (e) => (e.target.value = maskDigits(e.target.value, "(##) #####-####")));
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const v = (k) => f.elements[k].value.trim();
        const email = v("email").toLowerCase(), pass = f.elements.password.value;
        const ok = applyRules(f, {
          name: v("name").split(/\s+/).filter(Boolean).length < 2 && "Informe nome e sobrenome.",
          phone: v("phone").replace(/\D/g, "").length < 10 && "Informe um WhatsApp com DDD.",
          city: v("city").length < 3 && "Informe cidade e UF.",
          email: (!/^\S+@\S+\.\S+$/.test(email) && "Informe um e-mail válido.") || (candidates.some((x) => x.email.toLowerCase() === email) && "Este e-mail já possui cadastro."),
          password: (pass.length < 8 || !/[A-Za-z]/.test(pass) || !/\d/.test(pass)) && "A senha precisa ter 8+ caracteres, com letras e números.",
          confirm: f.elements.confirm.value !== pass && "As senhas não conferem.",
          terms: !f.elements.terms.checked && "É necessário aceitar os termos.",
        });
        if (!ok) return;
        const id = "k" + Date.now().toString(36), name = v("name");
        candidates.push({
          id, email, hash: await sha256(id + pass), name, initials: name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase(),
          role: v("role"), location: v("city"), phone: v("phone"), availability: "Disponível para novas oportunidades", about: "",
          interests: [v("area")], skills: [], experience: [], education: [],
        });
        saveCandidates(); setUser("candidate", id, true);
        toast("Conta criada! Complete seu perfil.");
        location.hash = "#/perfil";
      });
    }
    if (name === "perfil") {
      const p = getCandidate();
      $("#profileForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const f = e.target, v = (k) => f.elements[k].value.trim();
        if (!applyRules(f, { name: v("name").split(/\s+/).filter(Boolean).length < 2 && "Informe nome e sobrenome." })) return;
        Object.assign(p, {
          name: v("name"), role: v("role"), location: v("location"), phone: v("phone"), availability: v("availability"), about: v("about"),
          skills: v("skills").split(",").map((s) => s.trim()).filter(Boolean),
          interests: $$('[name="interest"]:checked', f).map((c) => c.value),
          initials: v("name").split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase(),
        });
        saveCandidates(); toast("Perfil atualizado."); render();
      });
      const addItem = (id, key, rules, build) => $(id).addEventListener("submit", (e) => {
        e.preventDefault();
        const f = e.target, v = (k) => f.elements[k].value.trim();
        if (!applyRules(f, rules(v))) return;
        p[key].push(build(v)); saveCandidates(); toast("Item adicionado."); render();
      });
      addItem("#expForm", "experience", (v) => ({ role: !v("role") && "Informe o cargo.", org: !v("org") && "Informe a empresa." }), (v) => ({ role: v("role"), org: v("org"), period: v("period") || "—", text: v("text") }));
      addItem("#eduForm", "education", (v) => ({ course: !v("course") && "Informe o curso.", org: !v("org") && "Informe a instituição." }), (v) => ({ course: v("course"), org: v("org"), period: v("period") || "—" }));
      $$("[data-rm-exp]").forEach((b) => b.addEventListener("click", () => { p.experience.splice(+b.dataset.rmExp, 1); saveCandidates(); render(); }));
      $$("[data-rm-edu]").forEach((b) => b.addEventListener("click", () => { p.education.splice(+b.dataset.rmEdu, 1); saveCandidates(); render(); }));
    }
    if (name === "cadastro-empresa") {
      const f = $("#signupForm");
      f.elements.cnpj.addEventListener("input", (e) => (e.target.value = maskDigits(e.target.value, "##.###.###/####-##")));
      f.elements.phone.addEventListener("input", (e) => (e.target.value = maskDigits(e.target.value, "(##) #####-####")));
      f.addEventListener("submit", async (e) => {
        e.preventDefault();
        const v = (k) => f.elements[k].value.trim();
        const email = v("email").toLowerCase(), pass = f.elements.password.value;
        const ok = applyRules(f, {
          name: v("name").length < 2 && "Informe o nome fantasia.",
          cnpj: !validCnpj(v("cnpj")) && "Informe um CNPJ válido.",
          city: v("city").length < 3 && "Informe cidade e UF.",
          description: v("description").length < 20 && "Descreva a empresa com ao menos 20 caracteres.",
          owner: v("owner").split(/\s+/).filter(Boolean).length < 2 && "Informe nome e sobrenome.",
          phone: v("phone").replace(/\D/g, "").length < 10 && "Informe um WhatsApp com DDD.",
          email: (!/^\S+@\S+\.\S+$/.test(email) && "Informe um e-mail válido.") || (allAccounts().some((x) => x.email.toLowerCase() === email) && "Este e-mail já possui cadastro."),
          password: (pass.length < 8 || !/[A-Za-z]/.test(pass) || !/\d/.test(pass)) && "A senha precisa ter 8+ caracteres, com letras e números.",
          confirm: f.elements.confirm.value !== pass && "As senhas não conferem.",
          terms: !f.elements.terms.checked && "É necessário aceitar os termos.",
        });
        if (!ok) return;
        const name = v("name");
        const colors = ["#1F3A5F", "#2D8C68", "#B45309", "#7C3AED", "#0E7490", "#BE185D", "#4D7C0F"];
        const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
        const id = "c" + Date.now().toString(36);
        const comp = { id, name, initials, color: colors[companies.length % colors.length], sector: v("sector"), city: v("city"), size: v("size"), description: v("description"), custom: true };
        const acc = { company: id, email, hash: await sha256(id + pass), owner: v("owner"), phone: v("phone") };
        companies.push(comp); customCompanies.push(comp); customAccounts.push(acc);
        store.set("conecta-custom-companies", customCompanies); store.set("conecta-custom-accounts", customAccounts);
        setUser("company", id, true);
        toast("Conta criada! Bem-vindo(a) à Conecta+.");
        location.hash = "#/painel";
      });
    }
    if (name === "painel") {
      $$("[data-del]").forEach((b) => b.addEventListener("click", () => {
        const id = b.dataset.del;
        if (!confirm("Excluir esta vaga?")) return;
        jobs.splice(jobs.findIndex((j) => j.id === id), 1);
        customJobs.splice(customJobs.findIndex((j) => j.id === id), 1);
        store.set("conecta-custom-jobs", customJobs);
        toast("Vaga excluída."); render();
      }));
    }
    if (name === "nova-vaga") {
      const f = $("#jobForm");
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const v = (k) => f.elements[k].value.trim();
        const lines = (k) => v(k).split("\n").map((s) => s.trim()).filter(Boolean);
        const min = Number(v("salaryMin")), max = Number(v("salaryMax")), openings = Number(v("openings"));
        const checked = $$('[name="benefit"]:checked', f).map((c) => c.value);
        const ok = applyRules(f, {
          title: v("title").length < 5 && "Informe um título com ao menos 5 caracteres.",
          openings: !(openings >= 1) && "Informe ao menos 1 vaga.",
          summary: v("summary").length < 10 && "Escreva um resumo de ao menos 10 caracteres.",
          location: !v("location") && "Informe a localização.",
          deadline: v("deadline") && v("deadline") < new Date().toISOString().slice(0, 10) && "A data não pode estar no passado.",
          salaryMin: !(min > 0) && "Informe o salário mínimo.",
          salaryMax: (!(max > 0) || max < min) && "O máximo deve ser maior ou igual ao mínimo.",
          description: v("description").length < 20 && "Descreva a vaga com ao menos 20 caracteres.",
          requirements: !lines("requirements").length && "Informe ao menos um requisito.",
        });
        if (!ok) return;
        const benefits = [...checked, ...lines("benefitsExtra")];
        const j = {
          id: "u" + Date.now().toString(36), title: v("title"), company: getSession(), category: v("category"), location: v("location"),
          modality: v("modality"), contract: v("contract"), salaryMin: min, salaryMax: max, daysAgo: 0, featured: false, custom: true,
          openings, workload: v("workload"), education: v("education"), experience: v("experience"), deadline: v("deadline"),
          summary: v("summary"), description: v("description"), requirements: lines("requirements"),
          benefits: benefits.length ? benefits : ["A combinar com a empresa"],
          hiring: v("hiring") || "Processo seletivo conduzido pela empresa. Candidatos aprovados na triagem serão contatados pelo WhatsApp.",
        };
        jobs.push(j); customJobs.push(j); store.set("conecta-custom-jobs", customJobs);
        toast("Vaga publicada! Ela já aparece na lista de vagas.");
        location.hash = "#/painel";
      });
    }
    if (name === "contato") {
      const who = getCandidate() || (getSession() && { name: company(getSession()).name, email: (allAccounts().find((x) => x.company === getSession()) || {}).email });
      if (who) { $("#cn").value = who.name || ""; $("#ce").value = who.email || ""; }
      $("#contactForm").addEventListener("submit", (e) => {
        e.preventDefault();
        const f = e.target;
        const rules = {
          nome: (v) => (v.trim().length < 3 ? "Informe seu nome completo." : ""),
          email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? "" : "Informe um e-mail válido."),
          msg: (v) => (v.trim().length < 10 ? "Escreva ao menos 10 caracteres." : ""),
        };
        let ok = true;
        Object.entries(rules).forEach(([k, fn]) => {
          const el = f.elements[k]; const m = fn(el.value);
          $(`[data-err="${k}"]`).textContent = m;
          el.classList.toggle("invalid", !!m);
          el.setAttribute("aria-invalid", !!m);
          if (m) ok = false;
        });
        if (ok) { f.reset(); $("#formOk").hidden = false; toast("Mensagem enviada (demonstração)."); }
        else { $("#formOk").hidden = true; f.querySelector(".invalid")?.focus(); }
      });
    }
  };

  /* ---------- Simulador de WhatsApp: chatbot de triagem ---------- */
  let chatEl, quickEl, textEl, sendBtn;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const tickSvg = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="#53bdeb" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 13l4 4L15 7M10 15l2 2L21 7"/></svg>`;
  const chat = { run: 0, step: "", data: {}, ctx: {}, busy: false };

  const hhmm = () => new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const setStatus = (t) => ($("#waStatus").textContent = t);
  const wait = (ms) => new Promise((res, rej) => {
    const my = chat.run;
    setTimeout(() => (my === chat.run ? res() : rej("cancel")), reduceMotion ? 80 : ms);
  });
  const scrollChat = () => { chatEl.scrollTop = chatEl.scrollHeight; };
  const addMsg = (html, who) => {
    const d = document.createElement("div");
    d.className = "wa-msg " + who;
    d.innerHTML = `<div class="wa-bubble">${html}<span class="wa-time">${hhmm()}${who === "me" ? tickSvg : ""}</span></div>`;
    chatEl.appendChild(d); scrollChat(); return d;
  };
  const botSay = async (html, delay = 900) => {
    chat.busy = true; setStatus("digitando…");
    const t = document.createElement("div");
    t.className = "wa-msg bot";
    t.innerHTML = `<div class="wa-bubble wa-typing" aria-label="Digitando"><i></i><i></i><i></i></div>`;
    chatEl.appendChild(t); scrollChat();
    try { await wait(delay); } finally { t.remove(); }
    addMsg(html, "bot"); setStatus("online"); chat.busy = false;
  };
  const setInput = (on, placeholder) => {
    textEl.disabled = sendBtn.disabled = !on;
    textEl.placeholder = placeholder || "Digite uma mensagem";
    textEl.inputMode = chat.step === "cpf" ? "numeric" : "text";
    if (on) textEl.focus();
  };
  const setQuick = (items) => {
    quickEl.innerHTML = items.map((i) => `<button type="button" class="wa-chipq" data-q="${esc(i.value)}">${esc(i.label)}</button>`).join("");
  };

  const jobsHtml = (list) => list.slice(0, 4).map((j) => `<a class="wa-job" href="#/vaga/${j.id}" data-chat-link><strong>${esc(j.title)}</strong><small>${esc(company(j.company).name)} · ${esc(j.location)}<br>${salary(j)} · ${j.modality}</small></a>`).join("");

  const finish = async (cat) => {
    const d = chat.data, first = d.name.split(" ")[0];
    const found = jobs.filter((j) => j.category === cat);
    if (found.length) {
      await botSay(`Perfeito, ${esc(first)}! Encontrei <strong>${found.length}</strong> ${found.length === 1 ? "vaga disponível" : "vagas disponíveis"} em <strong>${esc(cat)}</strong>:${jobsHtml(found)}${found.length > 4 ? `<br>E mais ${found.length - 4} no site.` : ""}`, 1200);
    } else {
      await botSay(`${esc(first)}, no momento não há vagas abertas em <strong>${esc(cat)}</strong>, mas seu perfil ficará no nosso banco de talentos.`, 1000);
    }
    const companyIds = new Set(found.map((j) => j.company));
    if (chat.ctx.companyId) companyIds.add(chat.ctx.companyId);
    saveLead({ id: "l" + Date.now().toString(36), name: d.name, cpf: d.cpf, area: cat, jobId: chat.ctx.jobId || (found[0] && found[0].id) || null, companyIds: [...companyIds], candidateId: (getCandidate() || {}).id || null, at: new Date().toISOString() });
    await botSay("Seu cadastro foi registrado. <strong>A empresa entrará em contato com você por aqui</strong> em até 2 dias úteis. Obrigado por usar a Conecta+!", 1000);
    chat.step = "done";
    setInput(false, "Conversa finalizada");
    setQuick([{ label: "Ver vagas no site", value: "__site" }, { label: "Nova triagem", value: "__restart" }]);
  };

  const startChat = async () => {
    const my = ++chat.run;
    chat.step = ""; chat.data = {}; chat.busy = false;
    chatEl.innerHTML = ""; setQuick([]); setInput(false); setStatus("online");
    const x = chat.ctx;
    try {
      await botSay("Olá! Sou o assistente virtual da <strong>Conecta+</strong>.", 700);
      if (x.jobId) await botSay(`Vi que você tem interesse na vaga <strong>${esc(job(x.jobId).title)}</strong> da <strong>${esc(company(job(x.jobId).company).name)}</strong>.`, 800);
      else if (x.companyId) await botSay(`Você está falando com a triagem da <strong>${esc(company(x.companyId).name)}</strong>.`, 800);
      const me = getCandidate();
      if (me) {
        chat.data.name = me.name;
        await botSay(`Olá, <strong>${esc(me.name.split(" ")[0])}</strong>! Já temos seu nome do seu perfil. Vou fazer uma triagem rápida com 2 perguntas. Primeiro: informe seu <strong>CPF</strong> (somente números).`, 1000);
        if (my !== chat.run) return;
        chat.step = "cpf"; setInput(true, "CPF (11 números)");
      } else {
        await botSay("Vou fazer uma triagem rápida com 3 perguntas. Primeiro: <strong>qual é o seu nome completo?</strong>", 900);
        if (my !== chat.run) return;
        chat.step = "name"; setInput(true, "Seu nome completo");
      }
    } catch (e) { if (e !== "cancel") throw e; }
  };

  const onUser = async (text) => {
    text = text.trim();
    if (!text || chat.busy || !chat.step || chat.step === "done") return;
    const my = chat.run, step = chat.step;
    try {
      if (step === "name") {
        addMsg(esc(text), "me");
        if (text.length < 5 || !/\S+\s+\S+/.test(text)) { await botSay("Pode me informar nome e sobrenome, por favor?", 600); return; }
        chat.data.name = text; chat.step = ""; setInput(false);
        await botSay(`Prazer, ${esc(text.split(" ")[0])}! Agora informe o seu <strong>CPF</strong> (somente números).`, 800);
        chat.step = "cpf"; setInput(true, "CPF (11 números)");
      } else if (step === "cpf") {
        if (!validCpf(text)) { addMsg(esc(text), "me"); await botSay("Esse CPF não parece válido. Digite os 11 números, por favor.", 700); return; }
        chat.data.cpf = maskCpf(text);
        addMsg(esc(chat.data.cpf), "me"); chat.step = ""; setInput(false);
        await botSay("Recebido. Por segurança, guardamos apenas parte do número. Por último: <strong>qual é a sua área de interesse?</strong>", 900);
        const cats = [...categories];
        const pref = chat.ctx.jobId && job(chat.ctx.jobId).category;
        if (pref) cats.sort((a, b) => (b === pref) - (a === pref));
        setQuick(cats.map((c) => ({ label: c, value: c })));
        chat.step = "area"; setInput(true, "Escolha ou digite a área");
      } else if (step === "area") {
        addMsg(esc(text), "me");
        const t = norm(text);
        const cat = categories.find((c) => norm(c) === t) || categories.find((c) => norm(c).includes(t) || t.includes(norm(c)));
        if (!cat) { await botSay("Não encontrei essa área. Toque em uma das opções abaixo.", 600); return; }
        chat.step = ""; setInput(false); setQuick([]);
        await finish(cat);
      }
    } catch (e) { if (e !== "cancel") throw e; }
  };

  const openWa = (kind) => {
    const [type, id] = kind.split(":");
    location.hash = "#/whatsapp" + (type === "job" ? `?vaga=${id}` : type === "company" ? `?empresa=${id}` : "");
  };

  const bindChat = () => {
    chatEl = $("#waChat"); quickEl = $("#waQuick"); textEl = $("#waText"); sendBtn = $("#waSendBtn");
    quickEl.addEventListener("click", (e) => {
      const q = e.target.closest("[data-q]");
      if (!q) return;
      const v = q.dataset.q;
      if (v === "__restart") return startChat();
      if (v === "__site") { location.hash = "#/vagas"; return; }
      if (chat.step === "area" && !chat.busy) { setQuick([]); onUser(v); }
    });
    $("#waRestart").addEventListener("click", startChat);
    $("#waForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = textEl.value; if (!v.trim() || chat.busy) return;
      textEl.value = ""; onUser(v);
    });
    textEl.addEventListener("input", () => {
      if (chat.step !== "cpf") return;
      textEl.value = maskDigits(textEl.value, "###.###.###-##");
    });
    startChat();
  };
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

  /* ---------- Toast ---------- */
  let tt;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 3200);
  }

  /* ---------- Menu mobile ---------- */
  const toggle = $("#menuToggle"), nav = $("#nav");
  function updateNav(name) {
    const cand = getCandidate(), comp = getSession(), logged = !!(cand || comp);
    const key = name === "vaga" ? "vagas" : ["entrar", "cadastro-empresa", "cadastro-candidato"].includes(name) ? "login" : ["painel", "nova-vaga"].includes(name) ? "company" : name;
    const links = [["home", "#/", "Início"], ["vagas", "#/vagas", "Vagas"], ["empresas", "#/empresas", "Empresas"]];
    if (cand) links.push(["perfil", "#/perfil", "Meu perfil"]);
    if (comp) links.push(["company", "#/painel", "Painel"]);
    if (logged) links.push(["contato", "#/contato", "Contato"]); else links.push(["login", "#/entrar", "Entrar"]);
    nav.innerHTML = links.map(([k, href, label]) => `<a href="${href}" ${k === key ? 'aria-current="page"' : ""}>${label}</a>`).join("")
      + (logged ? `<button type="button" class="nav-out" data-logout>Sair</button>` : "")
      + `<button class="btn btn-wa nav-cta" data-wa="recruiter" type="button">${icons.wa}Falar com recrutador</button>`;
    $$("[data-auth]").forEach((el) => { el.hidden = !(el.dataset.auth === "candidate" ? cand : logged); });
  }
  function closeMenu() { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Abrir menu"); }
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open); toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  });

  /* ---------- Delegação de eventos globais ---------- */
  document.addEventListener("click", (e) => {
    const wa = e.target.closest("[data-wa]");
    if (wa) { e.preventDefault(); e.stopPropagation(); return openWa(wa.dataset.wa); }
    const out = e.target.closest("[data-logout]");
    if (out) {
      clearUser(); toast("Você saiu da sua conta.");
      parseHash().name === "home" ? render() : (location.hash = "#/");
      return;
    }
    const fav = e.target.closest("[data-fav]");
    if (fav) {
      e.stopPropagation();
      if (!getCandidate()) {
        if (getSession()) return toast("Apenas candidatos podem salvar vagas.");
        nextRoute = location.hash; toast("Entre como candidato para salvar vagas."); location.hash = "#/entrar"; return;
      }
      const id = fav.dataset.fav;
      favs.has(id) ? favs.delete(id) : favs.add(id); saveFavs();
      const on = favs.has(id);
      fav.setAttribute("aria-pressed", on);
      const lbl = $("span", fav); if (lbl) lbl.textContent = on ? "Vaga salva" : "Salvar vaga";
      fav.setAttribute("aria-label", on ? "Remover dos favoritos" : "Salvar vaga");
      fav.classList.add("pop"); setTimeout(() => fav.classList.remove("pop"), 200);
      return toast(on ? "Vaga salva no seu perfil." : "Vaga removida dos favoritos.");
    }
    const t = e.target.closest("[data-toast]");
    if (t) return toast(t.dataset.toast);
    if (e.target.closest("a, button, input, select, label")) {
      const g = e.target.closest("[data-go]:is(button)"); if (g) location.hash = g.dataset.go;
      return;
    }
    const card = e.target.closest("[data-go]");
    if (card) location.hash = card.dataset.go;
  });

  /* ---------- Init ---------- */
  $("#footContact").innerHTML = `${platform.whatsappLabel}<br>${platform.email}<br>${platform.hours}`;
  window.addEventListener("hashchange", render);
  render();
})();

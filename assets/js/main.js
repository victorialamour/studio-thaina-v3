/* ==========================================================================
   STUDIO THAINÁ, movimento e interação
   GSAP + ScrollTrigger + Lenis. Tudo degrada: sem CDN, sem JS ou com
   "reduzir movimento" o site aparece inteiro e estático.
   ========================================================================== */

const REDUCED  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HAS_GSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
const ANIMATE  = HAS_GSAP && !REDUCED;
const FINE     = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

if (HAS_GSAP) gsap.registerPlugin(ScrollTrigger);
window.__ready = true;
if (!ANIMATE) document.documentElement.classList.remove('js-anim');

/* ---- 1 · Rolagem suave ---------------------------------------------------- */
let lenis = null;
function initSmoothScroll () {
  if (!ANIMATE || typeof window.Lenis === 'undefined') return;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault(); closeMenu(); lenis.scrollTo(target, { offset: -20 });
  }));
}

/* ---- 2 · Títulos palavra por palavra (preserva <b>) ------------------------ */
function splitWords (el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    if (!node.nodeValue.trim()) return;
    const frag = document.createDocumentFragment();
    node.nodeValue.split(/(\s+)/).forEach(tok => {
      if (!tok) return;
      if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
      const w = document.createElement('span'); w.className = 'w';
      const i = document.createElement('i'); i.textContent = tok; w.appendChild(i); frag.appendChild(w);
    });
    node.parentNode.replaceChild(frag, node);
  });
  return el.querySelectorAll('.w > i');
}

/* ---- 3 · Entrada da hero ---------------------------------------------------- */
function initHero () {
  if (!ANIMATE) return;
  // hero sem texto visível: vídeo aproxima, barra desce, botão e cards sobem
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero__media', { scale: 1.18, duration: 2 }, 0)
    .from('.bar > *', { y: -20, opacity: 0, duration: .9, stagger: .06 }, .2)
    .to('[data-hero]', { opacity: 1, y: 0, duration: .9, stagger: .1 }, .6);
}

/* ---- 4 · Revelações ao rolar ------------------------------------------------ */
function initReveals () {
  if (!ANIMATE) return;
  document.querySelectorAll('[data-split]').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.to(splitWords(el), { y: '0%', duration: 1, ease: 'expo.out', stagger: .035,
      scrollTrigger: { trigger: el, start: 'top 88%' } });
  });
  document.querySelectorAll('[data-reveal]').forEach(el => gsap.to(el, {
    opacity: 1, y: 0, duration: .9, ease: 'expo.out', delay: parseFloat(el.dataset.delay || 0),
    scrollTrigger: { trigger: el, start: 'top 90%' } }));
  document.querySelectorAll('[data-reveal-stagger]').forEach(g => gsap.to(g.children, {
    opacity: 1, y: 0, duration: .8, ease: 'expo.out', stagger: .07,
    scrollTrigger: { trigger: g, start: 'top 88%' } }));
  // ferramentas entram deslizando da borda direita e depois flutuam com a rolagem
  const tools = document.querySelector('.how__tools');
  if (tools) {
    gsap.from(tools, { xPercent: 60, opacity: 0, rotate: -6, duration: 1.6, ease: 'expo.out',
      scrollTrigger: { trigger: tools, start: 'top 85%' } });
    gsap.to(tools, { y: -60, ease: 'none',
      scrollTrigger: { trigger: '.how', start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  // contadores: sem JS o HTML já mostra o número final
  document.querySelectorAll('[data-count]').forEach(el => {
    const end = parseInt(el.dataset.count, 10), obj = { n: 0 };
    el.textContent = '0';
    // conta de 0 até o número, segura 3s e recomeça (só roda quando está na tela)
    gsap.to(obj, { n: end, duration: 2.2, ease: 'power3.out', repeat: -1, repeatDelay: 3,
      onUpdate: () => { el.textContent = Math.round(obj.n); },
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 10%', toggleActions: 'play pause resume pause' } });
  });
  document.querySelectorAll('[data-reveal-img]').forEach(el => gsap.to(el, {
    clipPath: 'inset(0% 0% 0% 0% round 8px)', opacity: 1, duration: 1.3, ease: 'expo.out',
    scrollTrigger: { trigger: el, start: 'top 88%' } }));
}

/* ---- 5 · Parallax ----------------------------------------------------------- */
function initParallax () {
  if (!ANIMATE) return;
  document.querySelectorAll('[data-parallax]').forEach(el => {
    const f = parseFloat(el.dataset.parallax) || .1;
    gsap.fromTo(el, { yPercent: -f * 40 }, { yPercent: f * 40, ease: 'none',
      scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

/* ---- 6 · Vídeos só tocam quando aparecem ----------------------------------- */
function initVideos () {
  const io = new IntersectionObserver(entries => entries.forEach(({ target, isIntersecting }) => {
    if (target.closest('[hidden]')) return;
    isIntersecting ? target.play().catch(() => {}) : target.pause();
  }), { rootMargin: '120px 0px' });
  document.querySelectorAll('video:not(.hero__video)').forEach(v => { if (!v.closest('.media-replay')) io.observe(v); });
}

/* ---- 7 · Abas genéricas (serviços, cursos, resultados) ----------------------- */
function makeTabs (buttons, panels, { onClass, offClass } = {}) {
  const select = (i, focus) => {
    buttons.forEach((b, k) => {
      const on = k === i;
      b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1;
      if (onClass) { b.classList.toggle(onClass, on); b.classList.toggle(offClass, !on); }
      if (on && focus) b.focus();
    });
    panels.forEach((p, k) => {
      const on = k === i; p.hidden = !on; p.classList.toggle('is-on', on);
      p.querySelectorAll('video').forEach(v => on ? v.play().catch(() => {}) : v.pause());
      if (on && ANIMATE) gsap.fromTo(p.children, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .6, stagger: .06, ease: 'expo.out', clearProps: 'opacity,transform' });
    });
    if (HAS_GSAP) ScrollTrigger.refresh();
  };
  buttons.forEach((b, i) => {
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (d) { e.preventDefault(); select((i + d + buttons.length) % buttons.length, true); }
    });
  });
  return select;
}

function initTabs () {
  makeTabs([...document.querySelectorAll('.svc')], [...document.querySelectorAll('.svc-panel')]);

  const cBtns = [...document.querySelectorAll('[data-course]')];
  const cSel = makeTabs(cBtns, [...document.querySelectorAll('.course')], { onClass: 'pill--dark', offClass: 'pill--line' });
  let ci = 0;
  document.querySelector('[data-course-next]')?.addEventListener('click', () => cSel(ci = (ci + 1) % cBtns.length));
  document.querySelector('[data-course-prev]')?.addEventListener('click', () => cSel(ci = (ci - 1 + cBtns.length) % cBtns.length));
  cBtns.forEach((b, i) => b.addEventListener('click', () => { ci = i; }));

  const rBtns = [...document.querySelectorAll('.results .tabs [role="tab"]')];
  makeTabs(rBtns, rBtns.map(b => document.getElementById(b.getAttribute('aria-controls'))), { onClass: 'pill--dark', offClass: 'pill--line' });
}

/* ---- 8 · Carrossel inclinado ------------------------------------------------ */
function initSkewCarousel () {
  const section = document.querySelector('.skew'); if (!section || !ANIMATE) return;
  const track = section.querySelector('.skew__track');
  const SPEED = 0.05;                 // px por ms (~50px/s), constante
  let x = 0, visible = false;
  gsap.ticker.add((t, dt) => {
    if (!visible) return;
    const half = track.scrollWidth / 2;
    x -= SPEED * dt; if (x <= -half) x += half;
    gsap.set(track, { x });
  });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px 0px' }).observe(section);
}

/* ---- 8a · Caixa de preço: seletor Iniciante / Aperfeiçoamento ------------- */
/* Troca só os textos do card; os [ ] são pendências a confirmar com a Thainá. */
const PLANS = [
  { name: 'Design de Sobrancelhas', desc: 'Pra quem está começando do zero e quer entrar na profissão com base sólida.', value: '997', terms: 'ou 10x de R$ 99,70 sem juros', spots: 'Turma pequena · data combinada com as alunas', dur: '[DURAÇÃO]' },
  { name: 'Aperfeiçoamento em Design', desc: 'Pra quem já atende e quer elevar o nível dos resultados.', value: '597', terms: 'ou 10x de R$ 59,70 sem juros', spots: 'Turma pequena · data combinada com as alunas', dur: '[DURAÇÃO]' },
];
function initPrice () {
  const card = document.querySelector('.price__card'); if (!card) return;
  const tabs = [...card.querySelectorAll('[data-plan]')];
  const fields = [...card.querySelectorAll('[data-f]')];
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    const plan = PLANS[+tab.dataset.plan];
    fields.forEach(f => { f.textContent = plan[f.dataset.f]; });
    if (HAS_GSAP && !REDUCED) gsap.fromTo(fields, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: .45, stagger: .03, ease: 'power2.out' });
  }));
}

/* ---- 8b · Depoimentos: uma fala por vez ------------------------------------ */
/* Troca sozinha a cada 7s (pausa com mouse/foco; não troca com "reduzir
   movimento"). Leitor de tela só anuncia quando a pessoa escolhe pela bolinha. */
function initTestimonials () {
  const box = document.querySelector('.testi'); if (!box) return;
  const items = [...box.querySelectorAll('.testi__item')];
  const dots  = [...box.querySelectorAll('.testi__dots button')];
  const stage = box.querySelector('.testi__stage');
  let i = 0, timer = null;

  const show = (n, manual) => {
    stage.setAttribute('aria-live', manual ? 'polite' : 'off');
    items.forEach((it, k) => { it.hidden = k !== n; it.classList.toggle('is-on', k === n); });
    dots.forEach((d, k) => k === n ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current'));
    if (ANIMATE) gsap.fromTo(items[n].children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .8, stagger: .08, ease: 'expo.out' });
    i = n;
  };
  const stop  = () => clearInterval(timer);
  const start = () => { stop(); if (!REDUCED) timer = setInterval(() => show((i + 1) % items.length, false), 7000); };

  dots.forEach((d, k) => d.addEventListener('click', () => { show(k, true); start(); }));
  box.addEventListener('mouseenter', stop);
  box.addEventListener('mouseleave', start);
  box.addEventListener('focusin', stop);
  box.addEventListener('focusout', start);
  start();
}

/* ---- 9 · Botões magnéticos -------------------------------------------------- */
function initMagnetic () {
  if (!ANIMATE || !FINE) return;
  document.querySelectorAll('[data-magnetic]').forEach(el => {
    const sx = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3' }), sy = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3' });
    el.addEventListener('mousemove', e => { const r = el.getBoundingClientRect(); sx((e.clientX - r.left - r.width / 2) * .3); sy((e.clientY - r.top - r.height / 2) * .3); });
    el.addEventListener('mouseleave', () => { sx(0); sy(0); });
  });
}

/* ---- 10 · Menu mobile e WhatsApp flutuante --------------------------------- */
const menu = document.getElementById('menu'), burger = document.getElementById('burger');
function openMenu () {
  menu.hidden = false; burger.setAttribute('aria-expanded', 'true'); lenis && lenis.stop();
  if (ANIMATE) gsap.fromTo(menu, { clipPath: 'circle(0% at 40px 40px)' }, { clipPath: 'circle(150% at 40px 40px)', duration: .8, ease: 'expo.out' });
  menu.querySelector('a').focus({ preventScroll: true });
}
function closeMenu () {
  if (menu.hidden) return;
  burger.setAttribute('aria-expanded', 'false'); lenis && lenis.start();
  const done = () => { menu.hidden = true; };
  ANIMATE ? gsap.to(menu, { clipPath: 'circle(0% at 40px 40px)', duration: .5, ease: 'expo.in', onComplete: done }) : done();
}
function initNav () {
  burger.addEventListener('click', openMenu);
  document.getElementById('menu-close').addEventListener('click', () => { closeMenu(); burger.focus(); });
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  const wa = document.getElementById('wa');
  const onScroll = () => wa.classList.toggle('is-off', window.scrollY < window.innerHeight * .7);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
}

/* ---- Vídeo dos cursos: o arquivo fica branco depois de 9,2s; volta ao início antes */
function initCourseVideo () {
  const v = document.querySelector('.courses__photo video'); if (!v) return;
  const END = 9.1;
  const tick = () => { if (v.currentTime >= END) { v.currentTime = 0; v.play(); } requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}

/* ---- Vídeos de serviço: no fim aparece o botão de play pra ver de novo */
function initReplay () {
  document.querySelectorAll('.media-replay').forEach(fig => {
    const v = fig.querySelector('video'), b = fig.querySelector('.replay'); if (!v || !b) return;
    v.addEventListener('ended', () => { b.hidden = false; });
    v.addEventListener('play', () => { b.hidden = true; });
    b.addEventListener('click', () => { v.currentTime = 0; v.play(); });
    // navegador não deixa começar com som: o botão liga o áudio e recomeça do início
    const s = fig.querySelector('.sound');
    const setSound = on => { v.muted = !on; s.setAttribute('aria-pressed', String(on)); s.querySelector('span').textContent = on ? 'Som ligado' : 'Ativar som'; s.setAttribute('aria-label', on ? 'Desligar som' : 'Ativar som'); };
    if (s) s.addEventListener('click', () => {
      const on = v.muted;
      if (!on) v.dataset.userMuted = '1'; else delete v.dataset.userMuted;
      if (on) { document.querySelectorAll('.media-replay video').forEach(o => { if (o !== v && !o.muted) { o.muted = true; const ob = o.parentElement.querySelector('.sound'); ob && ob.click && (ob.setAttribute('aria-pressed','false'), ob.querySelector('span').textContent = 'Ativar som'); } });
        if (!v.dataset.heard) { v.currentTime = 0; v.dataset.heard = '1'; } v.play(); }
      setSound(on);
    });
    fig._setSound = setSound;
    // ao aparecer na tela: tenta tocar com som; se o navegador bloquear, toca mudo
    // e o som liga no primeiro toque/clique da pessoa na página
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        if (v.ended) return;
        if (v.dataset.userMuted) { v.play().catch(() => {}); return; }
        const others = [...document.querySelectorAll('.media-replay video')].filter(o => o !== v && !o.muted);
        if (others.length) { v.play().catch(() => {}); return; }
        v.muted = false;
        v.play().then(() => setSound(true)).catch(() => { setSound(false); v.play().catch(() => {}); window.__wantSound = fig; });
      } else { v.pause(); if (!v.muted) setSound(false); }
    }, { threshold: 0.5 }).observe(v);
  });
}

const unlockSound = e => {
  const fig = window.__wantSound; if (!fig || (e.target.closest && e.target.closest('.sound'))) return;
  const v = fig.querySelector('video'); window.__wantSound = null;
  if (v.dataset.userMuted) return;
  v.muted = false; v.play().then(() => fig._setSound(true)).catch(() => { v.muted = true; });
};
['pointerdown', 'keydown', 'touchstart'].forEach(t => document.addEventListener(t, unlockSound, { passive: true }));

/* ---- Vídeos pesados: o arquivo só é baixado quando o vídeo chega perto da tela */
function initLazyVideos () {
  const vids = document.querySelectorAll('video[data-src]');
  const load = v => { if (v.src) return; v.src = v.dataset.src; v.preload = 'auto'; if (v.hasAttribute('data-autoloop')) { v.loop = true; v.play().catch(() => {}); } };
  if (!('IntersectionObserver' in window)) { vids.forEach(load); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { load(e.target); io.unobserve(e.target); } }), { rootMargin: '300px 0px' });
  vids.forEach(v => io.observe(v));
  // o vídeo dos cursos pausa fora da tela
  document.querySelectorAll('video[data-autoloop]').forEach(v => new IntersectionObserver(([e]) => { if (!v.src) return; e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }, { threshold: 0.2 }).observe(v));
}

/* ---- Boot ------------------------------------------------------------------- */
document.getElementById('year').textContent = new Date().getFullYear();
initNav();
initTabs();
initVideos();
// initSmoothScroll(); // desligado no refino (menos movimento)
initHero();
initReveals();
// initParallax(); // desligado no refino (menos movimento)
initSkewCarousel();
initTestimonials();
initPrice();
initLazyVideos();
initCourseVideo();
initReplay();
// initMagnetic(); // desligado no refino (menos movimento)
window.addEventListener('load', () => HAS_GSAP && ScrollTrigger.refresh());
// fotos com loading="lazy" mudam a altura da página quando chegam (mosaicos);
// recalcula os gatilhos de rolagem uma vez por rajada de carregamentos
if (HAS_GSAP) {
  let t;
  document.querySelectorAll('img[loading="lazy"]').forEach(img => img.addEventListener('load', () => {
    clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 200);
  }));
}
if (document.fonts) document.fonts.ready.then(() => HAS_GSAP && ScrollTrigger.refresh());

;(function(){
const HOURS = { 0: null, 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [9, 13] };
const WA_NUMBER = '5581992901559';
const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const DAY_FULL  = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const fmtH = h => { const m = Math.round((h % 1) * 60); return Math.floor(h) + 'h' + (m ? String(m).padStart(2, '0') : ''); };
const cap  = s => s.charAt(0).toUpperCase() + s.slice(1);
function initBooking () {
  const form = document.getElementById('book'); if (!form) return;
  const svc = document.getElementById('bkSvc'), date = document.getElementById('bkDate'),
        time = document.getElementById('bkTime'), go = document.getElementById('bkGo'), msg = document.getElementById('bkMsg');
  const NOON = 12;
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const parse = v => { const p = v.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  date.min = iso(today);
  // sugestão: o próximo dia em que o studio abre
  const first = new Date(today); first.setDate(first.getDate() + 1);
  for (let k = 0; k < 7 && !HOURS[first.getDay()]; k++) first.setDate(first.getDate() + 1);
  date.value = iso(first);

  const say = (text, err) => { msg.textContent = text; msg.classList.toggle('is-err', !!err); go.disabled = !!err; return !err; };
  const check = () => {
    if (!date.value) return say('Escolha um dia.', true);
    const d = parse(date.value), h = HOURS[d.getDay()];
    if (d < today) return say('Esse dia já passou. Escolha a partir de hoje.', true);
    if (!h) return say('O studio não abre ' + (d.getDay() === 0 ? 'aos domingos' : 'nesse dia') + '. Escolha outro dia.', true);
    if (time.value === 'manhã' && h[0] >= NOON) return say('Nesse dia o atendimento começa às ' + fmtH(h[0]) + '. Escolha a tarde.', true);
    if (time.value === 'tarde' && h[1] <= NOON) return say('Nesse dia o studio fecha às ' + fmtH(h[1]) + '. Escolha a manhã.', true);
    return say('Eu confirmo o horário com você pelo WhatsApp.');
  };
  // como no Espaço Fancy: a barra fica branca depois que a pessoa mexe nela
  [svc, date, time].forEach(el => el.addEventListener('change', () => { form.classList.add('touched'); check(); }));
  check();

  form.addEventListener('submit', e => {
    e.preventDefault(); if (!check()) return;
    const d = parse(date.value), dm = String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0');
    const what = svc.value === 'uma avaliação' ? 'uma avaliação' : svc.value;
    const text = 'Oi Thainá, vim pelo site e queria saber se tem horário para ' + what + (d.getDay() % 6 === 0 ? ' no ' : ' na ') + DAY_FULL[d.getDay()] + ', ' + dm + ', pela ' + time.value + '.';
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });
}
initBooking();
})();

/* ---- Cursos · investimento: seletor Iniciante / Aperfeiçoamento */
(function initInvest () {
  const tabs = [...document.querySelectorAll('.cinv__seg [role="tab"]')]; if (!tabs.length) return;
  const select = (i, focus) => tabs.forEach((t, k) => {
    const on = k === i;
    t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    if (on && focus) t.focus();
  });
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (d) { e.preventDefault(); select((i + d + tabs.length) % tabs.length, true); }
    });
  });
})();

/* ---- Contador estilo odômetro (alunas): os algarismos rolam até o número,
   seguram alguns segundos e rolam de novo, só enquanto estão na tela */
(function initOdometer () {
  document.querySelectorAll('[data-odo]').forEach(el => {
    const target = String(el.dataset.odo);
    el.classList.add('odo'); el.textContent = '';
    const strip = Array.from({ length: 30 }, (_, i) => `<span>${i % 10}</span>`).join('');
    const cols = [...target].map(() => { const d = document.createElement('span'); d.className = 'odo__d'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = `<span class="odo__s">${strip}</span>`; el.appendChild(d); return d.firstChild; });
    const H = () => cols[0].firstChild.getBoundingClientRect().height;
    const set = (lap, anim) => cols.forEach((s, i) => {
      const n = +target[i] + lap * 10;
      s.style.transition = anim ? `transform ${1.6 + i * .35}s cubic-bezier(.16,1,.3,1) ${i * .08}s` : 'none';
      s.style.transform = `translateY(${-n * H()}px)`;
    });
    if (REDUCED) { set(0, false); return; }
    let timer = null, lap = 0;
    const cycle = () => { set(0, false); void el.offsetWidth; lap = 2; set(lap, true); timer = setTimeout(cycle, 5200); };
    set(0, false);
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (!timer) cycle(); }
      else { clearTimeout(timer); timer = null; }
    }, { threshold: .4 }).observe(el);
    addEventListener('resize', () => set(lap, false));
  });
})();


/* ---- Antes e depois: arrastar para comparar ---- */
(function initCompare () {
  const root = document.querySelector('.cmp'); if (!root) return;
  const stage = root.querySelector('.cmp__stage'), range = root.querySelector('.cmp__range');
  const before = root.querySelector('.cmp__img--before'), after = root.querySelector('.cmp__img--after');
  const set = v => stage.style.setProperty('--pos', v + '%');
  range.addEventListener('input', () => set(range.value));
  const base = 'assets/img/resultados/split/';
  const thumbs = [...root.querySelectorAll('.cmp__th')];
  thumbs.forEach(t => t.addEventListener('click', () => {
    thumbs.forEach(x => x.setAttribute('aria-selected', String(x === t)));
    before.src = base + t.dataset.id + '-antes.webp';
    after.src = base + t.dataset.id + '-depois.webp';
    after.alt = 'Depois: ' + t.dataset.alt;
    range.value = 50; set(50);
  }));
  // dica: uma vez, quando aparece, a barra vai e volta sozinha
  if (REDUCED || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => { if (!es[0].isIntersecting) return; io.disconnect();
    const t0 = performance.now(), dur = 1800;
    const tick = now => { const p = Math.min(1, (now - t0) / dur); const v = 50 + 28 * Math.sin(p * Math.PI * 2) * (1 - p * .15);
      range.value = v; set(v); if (p < 1) requestAnimationFrame(tick); else { range.value = 50; set(50); } };
    requestAnimationFrame(tick);
  }, { threshold: .6 });
  io.observe(stage);
})();

/* ---- Quiz em forma de conversa (WhatsApp) ---- */
(function initChat () {
  const feed = document.getElementById('waFeed'), st = document.getElementById('waSt'); if (!feed) return;
  const LINK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/></svg>';
  const AGAIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5"/></svg>';
  const TICKS = '<svg viewBox="0 0 16 11" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 6l3.2 3.2L10.5 1.5M6.2 8.2l.9.9L14 1.5"/></svg>';
  const R = [
    { a: 'Tenho falhas ou poucos fios', n: 'Micropigmentação fio a fio', d: 'Pra quem tem falhas ou poucos fios e quer um resultado natural, que parece fio de verdade.', m: 'Dura de 6 meses a 1 ano\nR$ 670, em até 10x de R$ 67', w: 'micropigmentação fio a fio' },
    { a: 'Quero acordar com a sobrancelha pronta', n: 'Micropigmentação shadow', d: 'Pra quem quer acordar com a sobrancelha pronta, com efeito sombreado parecido com henna.', m: 'Dura de 8 a 18 meses\nR$ 670, em até 10x de R$ 67', w: 'micropigmentação shadow' },
    { a: 'Meus fios são rebeldes ou caídos', n: 'Brow lamination', d: 'Pra quem tem fios rebeldes ou caídos e quer a sobrancelha mais cheia e alinhada.', m: 'Dura até 4 semanas\nR$ 145, ou 2x de R$ 72,50', w: 'brow lamination' },
    { a: 'Quero preencher e definir, sem compromisso longo', n: 'Design com henna', d: 'Pra quem quer preencher e definir com efeito de maquiagem, sem compromisso longo.', m: 'Dura até 7 dias\nR$ 55', w: 'design com henna' },
    { a: 'Tenho fios brancos ou a cor não combina com o cabelo', n: 'Design com tintura', d: 'Pra quem tem fios brancos ou sente que a cor da sobrancelha não combina com o cabelo.', m: 'Dura até 30 dias\nR$ 55', w: 'design com tintura' },
    { a: 'Quero cílios curvados, sem rímel', n: 'Lash lifting', d: 'Pra quem quer cílios curvados todo dia, sem rímel e sem extensão.', m: 'Dura até 30 dias\nR$ 160, ou 2x de R$ 80', w: 'lash lifting' },
  ];
  let busy = false, mins = 0;
  const hhmm = add => { const d = new Date(Date.now() + add * 60000); return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false }); };
  const msg = (html, cls, ticks) => { const x = document.createElement('div'); x.className = 'wa__m ' + cls;
    x.innerHTML = html + '<span class="wa__time">' + hhmm(mins) + (ticks ? TICKS : '') + '</span>'; feed.appendChild(x); return x; };
  const group = () => { const g = document.createElement('div'); g.className = 'wa__btns'; feed.appendChild(g); return g; };
  const btn = (g, label, onclick, icon) => { const b = document.createElement(onclick ? 'button' : 'a'); b.className = 'wa__btn'; if (onclick) { b.type = 'button'; b.addEventListener('click', onclick); } b.innerHTML = (icon || '') + '<span>' + label + '</span>'; g.appendChild(b); return b; };
  const start = () => {
    feed.innerHTML = ''; busy = false; mins = 0; st.textContent = 'online'; st.classList.remove('is-typing');
    const day = document.createElement('span'); day.className = 'wa__day'; day.textContent = 'HOJE'; feed.appendChild(day);
    msg('<span class="wa__t">Oi! Eu sou a Thainá. O que mais te incomoda nas suas sobrancelhas hoje?</span>', 'in');
    const g = group(); R.forEach(r => btn(g, r.a, () => pick(r, g)));
  };
  const pick = (r, g) => {
    if (busy) return; busy = true; g.remove(); mins = 1;
    msg('<span class="wa__t">' + r.a + '</span>', 'out', true);
    st.textContent = 'digitando...'; st.classList.add('is-typing');
    const t = msg('<span class="wa__dots" role="img" aria-label="Thainá está digitando"><i></i><i></i><i></i></span>', 'in');
    t.querySelector('.wa__time').remove();
    setTimeout(() => {
      mins = 1; st.textContent = 'online'; st.classList.remove('is-typing');
      const href = 'https://wa.me/5581992901559?text=' + encodeURIComponent('Oi Thainá, fiz o quiz do site e quero agendar uma avaliação para ' + r.w);
      t.innerHTML = '<span class="wa__t">Eu indico <b>' + r.n + '</b>.</span><span class="wa__t wa__sec">' + r.d + '</span><span class="wa__t wa__sec">' + r.m + '</span><span class="wa__time">' + hhmm(mins) + '</span>';
      const g2 = group(); const a = btn(g2, 'Continuar no WhatsApp', null, LINK); a.href = href; a.target = '_blank'; a.rel = 'noopener';
      btn(g2, 'Refazer o quiz', start, AGAIN);
    }, REDUCED ? 0 : 1400);
  };
  start();
})();

/* ---- Horário do studio + "Aberto agora" (igual ao site 2) ---- */
;(function(){
const HOURS = { 0: null, 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [9, 13] };
const WA_NUMBER = '5581992901559';
const DAY_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const DAY_FULL  = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const fmtH = h => { const m = Math.round((h % 1) * 60); return Math.floor(h) + 'h' + (m ? String(m).padStart(2, '0') : ''); };
const cap  = s => s.charAt(0).toUpperCase() + s.slice(1);
/* agora no fuso de Recife (mesmo se a pessoa estiver em outro fuso) */
function nowRecife () {
  try {
    const o = {};
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Recife', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false })
      .formatToParts(new Date()).forEach(p => { o[p.type] = p.value; });
    const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday);
    if (d < 0) return null;
    return { day: d, h: (+o.hour % 24) + (+o.minute) / 60 };
  } catch (e) { return null; }
}

function initHours () {
  // lista: junta dias seguidos com o mesmo horário ("Segunda a sexta")
  const list = document.getElementById('hoursList');
  if (list) {
    const order = [1, 2, 3, 4, 5, 6, 0], groups = [];
    order.forEach(d => {
      const key = HOURS[d] ? HOURS[d].join('-') : 'x', last = groups[groups.length - 1];
      if (last && last.key === key) last.days.push(d); else groups.push({ key, days: [d] });
    });
    list.innerHTML = groups.map(g => {
      const a = g.days[0], b = g.days[g.days.length - 1];
      const label = g.days.length === 1 ? cap(DAY_NAMES[a]) : cap(DAY_NAMES[a]) + (g.days.length === 2 ? ' e ' : ' a ') + DAY_NAMES[b];
      const h = HOURS[a];
      return '<dt>' + label + '</dt><dd>' + (h ? fmtH(h[0]) + ' às ' + fmtH(h[1]) : 'Fechado') + '</dd>';
    }).join('');
  }

  // aviso "Aberto agora / Fechado"
  const el = document.getElementById('openNow'), now = nowRecife();
  if (!el || !now) return;
  const today = HOURS[now.day];
  let text, open = false;
  if (today && now.h >= today[0] && now.h < today[1]) {
    open = true;
    const left = Math.round((today[1] - now.h) * 60);
    text = left <= 60 ? 'Aberto agora · fecha em ' + left + ' min' : 'Aberto agora · até ' + fmtH(today[1]);
  } else if (today && now.h < today[0]) {
    text = 'Fechado agora · abre hoje às ' + fmtH(today[0]);
  } else {
    let k = 1; while (k < 7 && !HOURS[(now.day + k) % 7]) k++;
    const d = (now.day + k) % 7;
    text = 'Fechado agora · abre ' + (k === 1 ? 'amanhã' : DAY_NAMES[d]) + ' às ' + fmtH(HOURS[d][0]);
  }
  el.textContent = text; el.classList.toggle('is-off', !open); el.hidden = false;
}
initHours();
})();

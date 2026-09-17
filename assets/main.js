/* 조수안 Portfolio — interactions */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Loader → hero intro ---------- */
  const loader = $('#loader');
  const hero = $('#hero');
  const loadedAt = performance.now();
  const MIN_LOADER = reduceMotion ? 0 : 1700;
  let loadDone = false;
  function finishLoad() {
    if (loadDone) return;
    loadDone = true;
    loader.classList.add('is-done');
    hero.classList.add('is-in');
    // stagger hero words
    $$('.hero__title .word').forEach((w, i) => { w.style.animationDelay = (0.15 + i * 0.09) + 's'; });
  }
  function scheduleFinish() {
    const wait = Math.max(0, MIN_LOADER - (performance.now() - loadedAt));
    setTimeout(finishLoad, wait);
  }
  if (document.readyState === 'complete') scheduleFinish();
  else window.addEventListener('load', scheduleFinish);
  setTimeout(finishLoad, 3500); // safety net

  /* ---------- Scroll progress + nav state + to-top ---------- */
  const progress = $('#progress');
  const nav = $('#nav');
  const totop = $('#totop');
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const y = h.scrollTop || document.body.scrollTop;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    nav.classList.toggle('is-scrolled', y > 20);
    totop.classList.toggle('is-show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  totop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  /* ---------- Mobile menu ---------- */
  const burger = $('#burger');
  const navLinks = $('#navLinks');
  burger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('a', navLinks).forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- Active nav link ---------- */
  const navMap = {};
  $$('[data-nav]').forEach(a => { navMap[a.dataset.nav] = a; });
  const dotMap = {};
  $$('[data-dot]').forEach(a => { dotMap[a.dataset.dot] = a; });
  const sections = ['about', 'project-1', 'project-2', 'project-3', 'contact'].map(id => $('#' + id)).filter(Boolean);
  function updateActive() {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = null;
    sections.forEach(s => { const top = s.getBoundingClientRect().top + window.scrollY; if (top <= y) current = s.id; });
    // project sections span their cover + following cases until the next cover
    Object.keys(navMap).forEach(k => navMap[k].classList.toggle('is-active', k === current));
    Object.keys(dotMap).forEach(k => dotMap[k].classList.toggle('is-active', k === (current || 'hero')));
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();

  /* ---------- Text reveal (mask rise, word by word) ---------- */
  function splitText(el) {
    if (el.dataset.split) return;
    el.dataset.split = '1';
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      const text = node.nodeValue;
      if (!text.trim()) return;
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.className = 'w';
        const inner = document.createElement('span'); inner.className = 'in'; inner.textContent = part;
        w.appendChild(inner);
        frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
    $$('.in', el).forEach((inner, i) => { inner.style.transitionDelay = Math.min(i * 0.07, 0.6).toFixed(2) + 's'; });
  }
  function revealText(el) {
    if (el.dataset.fxDone) return;
    el.dataset.fxDone = '1';
    el.classList.add(reduceMotion ? 'is-instant' : 'is-on');
  }
  $$('.fx-text').forEach(splitText);
  function animateText(root) {
    if (root.matches('.fx-text')) revealText(root);
    $$('.fx-text', root).forEach(revealText);
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          animateText(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
    $$('.fx-text').forEach(el => { if (!el.closest('.reveal')) io.observe(el); });
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
    $$('.fx-text').forEach(el => el.classList.add('is-instant'));
  }

  /* ---------- Case filter (B2B / B2C) ---------- */
  const filterBtns = $$('.filter__btn');
  const cases = $$('.case');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.toggle('is-active', b === btn));
    const f = btn.dataset.filter;
    cases.forEach(c => {
      const show = f === 'all' || c.dataset.type === f;
      c.classList.toggle('is-hidden', !show);
      if (show) $$('.reveal', c).forEach(r => { r.classList.add('is-visible'); animateText(r); });
    });
    updateActive();
  }));

  /* ---------- Phone tilt (pointer) ---------- */
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    $$('.phones').forEach(group => {
      const phones = $$('.phone', group);
      group.addEventListener('pointermove', (e) => {
        const r = group.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        phones.forEach((p, i) => {
          const dir = i === 0 ? 1 : -1;
          p.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 10}deg) translateY(-6px) translateX(${dir * px * 6}px)`;
        });
      });
      group.addEventListener('pointerleave', () => phones.forEach(p => { p.style.transform = ''; }));
    });
  }

  /* ---------- Cover number parallax ---------- */
  const covers = $$('.cover__num');
  let ticking = false;
  function parallax() {
    ticking = false;
    const vh = window.innerHeight;
    covers.forEach(n => {
      const r = n.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const center = (r.top + r.height / 2 - vh / 2) / vh; // -0.5 .. 0.5
      n.style.setProperty('--py', (center * -50).toFixed(1) + 'px');
    });
  }
  if (!reduceMotion) {
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });
    parallax();
  }

  /* ---------- Hero pointer parallax ---------- */
  const heroInner = $('.hero__inner');
  const heroGlow = $('.hero__glow');
  if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('pointermove', (e) => {
      const px = e.clientX / window.innerWidth - 0.5;
      const py = e.clientY / window.innerHeight - 0.5;
      heroInner.style.transform = `translate(${px * -8}px, ${py * -6}px)`;
      heroGlow.style.translate = `${px * 40}px ${py * 30}px`;
    });
    hero.addEventListener('pointerleave', () => { heroInner.style.transform = ''; heroGlow.style.translate = ''; });
  }

  /* ---------- Lightbox ---------- */
  const lb = $('#lightbox');
  const lbImg = $('#lightboxImg');
  const lbCap = $('#lightboxCap');
  function openLb(src, alt) {
    lbImg.src = src; lbImg.alt = alt || ''; lbCap.textContent = alt || '';
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
  }
  function closeLb() {
    lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    setTimeout(() => { if (!lb.classList.contains('is-open')) lbImg.src = ''; }, 300);
  }
  $$('[data-lightbox]').forEach(img => {
    img.addEventListener('click', () => openLb(img.currentSrc || img.src, img.alt));
    img.setAttribute('tabindex', '0');
    img.setAttribute('role', 'button');
    img.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(img.src, img.alt); } });
  });
  $('#lightboxClose').addEventListener('click', closeLb);
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && lb.classList.contains('is-open')) closeLb(); });

  /* ---------- Copy to clipboard + toast ---------- */
  const toast = $('#toast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg; toast.classList.add('is-show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-show'), 1800);
  }
  $$('.copy').forEach(btn => btn.addEventListener('click', async () => {
    const text = btn.dataset.copy;
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
      }
      showToast('복사되었습니다: ' + text);
    } catch (_) { showToast('복사에 실패했어요. 길게 눌러 복사해 주세요.'); }
  }));

  /* ---------- Smooth anchor offset for fixed nav ---------- */
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const navH = nav.offsetHeight;
    const top = target.getBoundingClientRect().top + window.scrollY - (id === 'top' ? 0 : navH - 1);
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#' + id);
  }));
})();

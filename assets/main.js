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

  /* ---------- Text scramble ("드르륵") ---------- */
  const KO_POOL = '가나다라마바사아자차카타파하거너더러머버서어저처커터퍼허고노도로모보소오조초코토포호구누두루무부수우주추쿠투푸후';
  const EN_POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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
        Array.from(part).forEach(chr => {
          const c = document.createElement('span'); c.className = 'ch'; c.textContent = chr; c.dataset.f = chr;
          w.appendChild(c);
        });
        frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  function isKo(ch) { const c = ch.charCodeAt(0); return c >= 0xAC00 && c <= 0xD7A3; }
  function isEn(ch) { return /[A-Za-z0-9]/.test(ch); }
  function scramble(el) {
    if (el.dataset.fxDone) return;
    el.dataset.fxDone = '1';
    const chars = $$('.ch', el);
    if (!chars.length) return;
    if (reduceMotion) { el.classList.add('is-instant'); return; }
    const per = Math.min(38, Math.max(14, 900 / chars.length));
    const lead = 220;
    const t0 = performance.now();
    chars.forEach(c => c.classList.add('is-on'));
    let lastFlip = 0;
    function frame(now) {
      const t = now - t0;
      let pending = false;
      const flip = now - lastFlip > 45;
      chars.forEach((c, i) => {
        if (c.classList.contains('is-set')) return;
        const f = c.dataset.f;
        if (t >= lead + i * per) { c.textContent = f; c.classList.add('is-set'); return; }
        pending = true;
        if (!flip) return;
        if (isKo(f)) c.textContent = KO_POOL[Math.floor(Math.random() * KO_POOL.length)];
        else if (isEn(f)) c.textContent = (f === f.toLowerCase() && /[a-z]/.test(f)) ? EN_POOL[Math.floor(Math.random() * 26)].toLowerCase() : EN_POOL[Math.floor(Math.random() * EN_POOL.length)];
      });
      if (flip) lastFlip = now;
      if (pending) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  $$('.fx-text').forEach(splitText);
  function animateText(root) {
    if (root.matches('.fx-text')) scramble(root);
    $$('.fx-text', root).forEach(scramble);
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          runCounters(e.target);
          animateText(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
    $$('.fx-text').forEach(el => { if (!el.closest('.reveal')) io.observe(el); });
  } else {
    revealEls.forEach(el => { el.classList.add('is-visible'); runCounters(el, true); });
    $$('.fx-text').forEach(el => el.classList.add('is-instant'));
  }

  /* ---------- Counters ---------- */
  function formatNum(n, decimals) {
    return decimals ? n.toFixed(decimals) : Math.round(n).toLocaleString('ko-KR');
  }
  function runCounters(root, instant) {
    $$('[data-count]', root).forEach(el => {
      if (el.dataset.done) return;
      el.dataset.done = '1';
      const target = parseFloat(el.dataset.count);
      const decimals = parseInt(el.dataset.decimals || '0', 10);
      if (instant || reduceMotion) { el.textContent = formatNum(target, decimals); return; }
      const dur = 1400;
      const start = performance.now();
      const ease = t => 1 - Math.pow(1 - t, 3);
      function tick(now) {
        const p = Math.min(1, (now - start) / dur);
        el.textContent = formatNum(target * ease(p), decimals);
        if (p < 1) requestAnimationFrame(tick);
      }
      el.textContent = formatNum(0, decimals);
      requestAnimationFrame(tick);
    });
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
      if (show) $$('.reveal', c).forEach(r => { r.classList.add('is-visible'); runCounters(r); animateText(r); });
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
      n.style.setProperty('--py', (center * -90).toFixed(1) + 'px');
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
      heroInner.style.transform = `translate(${px * -14}px, ${py * -10}px)`;
      heroGlow.style.translate = `${px * 60}px ${py * 40}px`;
    });
    hero.addEventListener('pointerleave', () => { heroInner.style.transform = ''; heroGlow.style.translate = ''; });
  }

  /* ---------- Custom cursor ---------- */
  const cursor = $('#cursor');
  if (cursor && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let cx = -100, cy = -100, tx = -100, ty = -100, raf = null;
    function loop() {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) raf = requestAnimationFrame(loop); else raf = null;
    }
    window.addEventListener('pointermove', (e) => {
      tx = e.clientX; ty = e.clientY; cursor.classList.add('is-on');
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
    window.addEventListener('pointerdown', () => cursor.classList.add('is-down'));
    window.addEventListener('pointerup', () => cursor.classList.remove('is-down'));
    const hoverSel = 'a, button, [data-lightbox], .role, .result, .filter__btn';
    document.addEventListener('pointerover', (e) => { if (e.target.closest(hoverSel)) cursor.classList.add('is-hover'); });
    document.addEventListener('pointerout', (e) => { if (e.target.closest(hoverSel)) cursor.classList.remove('is-hover'); });
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

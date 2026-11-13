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
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const y = h.scrollTop || document.body.scrollTop;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
    nav.classList.toggle('is-scrolled', y > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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
  const sections = ['about', 'project-1', 'project-2', 'project-3', 'project-4', 'project-5', 'contact'].map(id => $('#' + id)).filter(Boolean);
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

  /* ---------- Fit each page to the viewport: scale the content (not the backgrounds) until it fits ---------- */
  const fitSecs = $$('.cover, .overview, .case, .match, .contact');
  function fitAll() {
    const navH = nav.offsetHeight, avail = window.innerHeight - navH;
    fitSecs.forEach(sec => {
      const kids = Array.from(sec.children).filter(k => getComputedStyle(k).position !== 'absolute');
      if (window.innerWidth <= 1100) { kids.forEach(k => { k.style.transform = ''; }); return; }
      const cs = getComputedStyle(sec);
      const box = avail - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
      const natural = Math.max(...kids.map(k => k.offsetHeight));
      const z = Math.min(1, box / natural);
      kids.forEach(k => { const dy = (k.classList.contains('case__left') || k.classList.contains('mag__main')) ? 0 : (box - k.offsetHeight * z) / 2; k.style.transform = `translateY(${dy.toFixed(1)}px) scale(${z.toFixed(4)})`; });
    });
  }
  let fitTimer;
  const scheduleFit = () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitAll, 60); };
  window.addEventListener('resize', scheduleFit);
  window.addEventListener('load', scheduleFit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleFit);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(scheduleFit);
    fitSecs.forEach(sec => Array.from(sec.children).forEach(k => ro.observe(k)));
  }
  fitAll();
  [300, 1200, 3000].forEach(ms => setTimeout(fitAll, ms));
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  // block trackpad pinch-zoom on desktop: it zooms the visual viewport, sticks to the tab across reloads,
  // and leaves the fixed nav, dots and page snapping offset from the screen
  window.addEventListener('wheel', e => { if (e.ctrlKey && window.innerWidth > 1100) e.preventDefault(); }, { passive: false });
  ['gesturestart', 'gesturechange'].forEach(ev => document.addEventListener(ev, e => { if (window.innerWidth > 1100) e.preventDefault(); }));
  if (!location.hash) { window.scrollTo(0, 0); window.addEventListener('load', () => { if (!location.hash) window.scrollTo(0, 0); }); }
  setInterval(() => { void nav.getBoundingClientRect(); void document.body.offsetHeight; }, 500);
  // keep layout flushed while scrolling (cheap, and avoids stale paints of the fixed nav in some builds)
  let flushQueued = false;
  window.addEventListener('scroll', () => {
    if (flushQueued) return; flushQueued = true;
    requestAnimationFrame(() => { flushQueued = false; void nav.getBoundingClientRect(); void document.body.offsetHeight; });
  }, { passive: true });

  /* ---------- Magazine carousels: auto-advance while on screen ---------- */
  $$('.phone--car').forEach(ph => {
    const track = $('.car__track', ph), dots = $$('.car__dots i', ph), n = +ph.dataset.n;
    let i = 0, timer = null;
    const show = () => { track.style.transform = `translateX(${-i * 100}%)`; dots.forEach((d, k) => d.classList.toggle('is-on', k === i)); };
    const start = () => { if (timer || reduceMotion) return; timer = setInterval(() => { i = (i + 1) % n; show(); }, 2800); };
    const stop = () => { clearInterval(timer); timer = null; };
    show();
    if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0.3 }).observe(ph);
    else start();
    document.addEventListener('visibilitychange', () => { document.hidden ? stop() : null; });
  });

  /* ---------- Reel in the phone: play only while its page is on screen ---------- */
  $$('.phone--video video').forEach(v => {
    v.muted = true;
    const tryPlay = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => entries.forEach(en => { en.isIntersecting ? tryPlay() : v.pause(); }), { threshold: 0.35 }).observe(v);
    } else { tryPlay(); }
    document.addEventListener('visibilitychange', () => { if (document.hidden) v.pause(); });
  });

  /* ---------- ?debug=1 : on-screen diagnostics ---------- */
  if (location.search.indexOf('debug') > -1) {
    const box = document.createElement('pre');
    box.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:9999;background:rgba(11,27,77,.92);color:#fff;font:12px/1.5 monospace;padding:14px 18px;border-radius:12px;max-width:90vw;white-space:pre-wrap;pointer-events:none';
    document.body.appendChild(box);
    const rect = s => { const e = document.querySelector(s); if (!e) return s + ': none'; const r = e.getBoundingClientRect(); return `${s}: L${Math.round(r.left)} R${Math.round(innerWidth - r.right)} T${Math.round(r.top)} B${Math.round(r.bottom)} W${Math.round(r.width)} H${Math.round(r.height)}`; };
    const upd = () => {
      const vv = window.visualViewport;
      box.textContent = [
        `inner ${innerWidth}x${innerHeight}  client ${document.documentElement.clientWidth}x${document.documentElement.clientHeight}  outer ${outerWidth}x${outerHeight}  dpr ${devicePixelRatio}`,
        vv ? `visualViewport ${Math.round(vv.width)}x${Math.round(vv.height)} scale ${vv.scale.toFixed(3)} offset ${Math.round(vv.offsetLeft)},${Math.round(vv.offsetTop)} page ${Math.round(vv.pageLeft)},${Math.round(vv.pageTop)}` : 'no visualViewport',
        `scroll ${Math.round(scrollX)},${Math.round(scrollY)}  docW ${document.documentElement.scrollWidth}  snap ${getComputedStyle(document.documentElement).scrollSnapType}`,
        rect('.nav'), rect('.dots'), rect('.match'), rect('.match__inner'), rect('#project-1'), rect('.cover__inner'), rect('#case-1'), rect('#case-1 .case__left'), rect('#case-1 .case__right'),
        `match__inner transform: ${document.querySelector('.match__inner').style.transform || '-'}  origin: ${getComputedStyle(document.querySelector('.match__inner')).transformOrigin}`,
        `fit-pad ${getComputedStyle(document.documentElement).getPropertyValue('--fit-pad')}  nav-h ${getComputedStyle(document.documentElement).getPropertyValue('--nav-h')}`,
        navigator.userAgent
      ].join(String.fromCharCode(10));
    };
    if (location.search.indexOf('debug=2') > -1) { setTimeout(upd, 4000); let st; window.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(upd, 800); }, { passive: true }); } else { upd(); setInterval(upd, 500); }
  }

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

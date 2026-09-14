/* 조수안 Portfolio — interactions */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Loader → hero intro ---------- */
  const loader = $('#loader');
  const hero = $('#hero');
  function finishLoad() {
    loader.classList.add('is-done');
    hero.classList.add('is-in');
    // stagger hero words
    $$('.hero__title .word').forEach((w, i) => { w.style.animationDelay = (0.15 + i * 0.09) + 's'; });
  }
  if (document.readyState === 'complete') setTimeout(finishLoad, 350);
  else window.addEventListener('load', () => setTimeout(finishLoad, 350));
  setTimeout(finishLoad, 2500); // safety net

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
  const sections = ['about', 'project-1', 'project-2', 'project-3', 'contact'].map(id => $('#' + id)).filter(Boolean);
  function updateActive() {
    const y = window.scrollY + window.innerHeight * 0.35;
    let current = null;
    sections.forEach(s => { const top = s.getBoundingClientRect().top + window.scrollY; if (top <= y) current = s.id; });
    // project sections span their cover + following cases until the next cover
    Object.keys(navMap).forEach(k => navMap[k].classList.toggle('is-active', k === current));
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  window.addEventListener('resize', updateActive);
  updateActive();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          runCounters(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => { el.classList.add('is-visible'); runCounters(el, true); });
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
      if (show) $$('.reveal', c).forEach(r => { r.classList.add('is-visible'); runCounters(r); });
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

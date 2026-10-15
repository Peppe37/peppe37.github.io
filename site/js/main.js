(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- Translations ---------------- */
  var T = window.PORTFOLIO_I18N;

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* Saved choice first, then the system language (any language in the list that we have), English by default */
  function detect() {
    // A link can force a language: peppe37.github.io/?lang=it
    var asked = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
    if (asked === 'en' || asked === 'it') return asked;
    var saved = safeGet('gl-lang');
    if (saved === 'en' || saved === 'it') return saved;
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || 'en'];
    for (var i = 0; i < list.length; i++) {
      var c = String(list[i]).toLowerCase().slice(0, 2);
      if (c === 'it') return 'it';
      if (c === 'en') return 'en';
    }
    return 'en';
  }
  var lang = detect();

  function applyLang() {
    var d = T[lang];
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(function (el) { var v = d[el.getAttribute('data-i18n')]; if (v != null) el.textContent = v; });
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    $$('.cv-link').forEach(function (a) { a.href = 'assets/cv/Giuseppe-Lapietra-CV-' + lang + '.pdf'; });
    var sub = lang === 'it' ? 'Progetto%20sito%20web' : 'Website%20project';
    $('#mailHire').href = 'mailto:lapietra.giu@gmail.com?subject=' + sub;
    document.title = lang === 'it' ? 'Giuseppe Lapietra – Sviluppatore software' : 'Giuseppe Lapietra – Software developer';
    restartTyping();
  }

  /* ---------------- Typing roles ---------------- */
  var typedEl = $('#typed'), tTimer = null, reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function restartTyping() {
    clearTimeout(tTimer);
    var roles = T[lang].roles, i = 0;
    if (reduce) { typedEl.textContent = roles[0]; return; }
    var text = '', del = false;
    (function tick() {
      var full = roles[i];
      text = del ? full.slice(0, text.length - 1) : full.slice(0, text.length + 1);
      typedEl.textContent = text;
      var wait = del ? 28 : 55;
      if (!del && text === full) { del = true; wait = 1700; }
      else if (del && text === '') { del = false; i = (i + 1) % roles.length; wait = 350; }
      tTimer = setTimeout(tick, wait);
    })();
  }

  /* ---------------- Language buttons ---------------- */
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { lang = b.dataset.lang; safeSet('gl-lang', lang); applyLang(); }); });

  /* ---------------- Nav ---------------- */
  var nav = $('#nav'), toTop = $('#totop');
  function onScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 12);
    toTop.classList.toggle('show', window.scrollY > 700);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  var menuBtn = $('#menuBtn'), links = $('#links');
  menuBtn.addEventListener('click', function () { var o = links.classList.toggle('open'); menuBtn.setAttribute('aria-expanded', String(o)); });
  $$('#links a').forEach(function (a) { a.addEventListener('click', function () { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }); });

  /* Highlight the section on screen */
  var navLinks = $$('#links a');
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'work', 'opensource', 'experience', 'skills', 'contact'].forEach(function (id) { var s = document.getElementById(id); if (s) secObs.observe(s); });
  }

  /* ---------------- Reveal and counters ---------------- */
  function countUp(el) {
    var target = el.hasAttribute('data-count-years') ? Math.max(1, Math.floor((Date.now() - new Date(2022, 9, 1)) / 31557600000))
               : el.hasAttribute('data-count-oss') ? $$('.oss').length
               : Number(el.getAttribute('data-count'));
    if (reduce) { el.textContent = target; return; }
    var start = null;
    (function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / 1100), eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        $$('[data-count],[data-count-years],[data-count-oss]', e.target).forEach(countUp);
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    $$('.rv').forEach(function (el) { obs.observe(el); });
  } else {
    $$('.rv').forEach(function (el) { el.classList.add('in'); });
    $$('[data-count],[data-count-years],[data-count-oss]').forEach(countUp);
  }

  /* ---------------- Card tilt (pointer devices only) ---------------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    $$('.card').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = 'perspective(900px) rotateY(' + (x * 5).toFixed(2) + 'deg) rotateX(' + (-y * 5).toFixed(2) + 'deg) translateY(-4px)';
      });
      c.addEventListener('pointerleave', function () { c.style.transform = ''; });
    });
  }

  /* ---------------- Skill marquee ---------------- */
  var tech = ['Python', 'TypeScript', 'React', 'FastAPI', 'Django', 'Swift', 'Rust', 'C++', 'SQL', 'AWS', 'Docker', 'Qdrant', 'Neo4j', 'PostgreSQL', 'Ollama', 'MCP', 'Tauri', 'Fusion 360'];
  $('#marq').innerHTML = tech.concat(tech).map(function (t) { return '<span>' + t + '</span>'; }).join('');

  /* ---------------- GitHub stars (one light request, cached for an hour) ---------------- */
  function showStars(map) {
    $$('.oss').forEach(function (card) {
      var r = map[card.getAttribute('data-repo')];
      var el = $('.star', card);
      if (r && el && r.stars > 0) el.textContent = '★ ' + r.stars;
    });
  }
  (function stars() {
    var cached = safeGet('gl-stars'), now = Date.now();
    if (cached) { try { var c = JSON.parse(cached); if (now - c.t < 3600000) { showStars(c.m); return; } } catch (e) {} }
    fetch('https://api.github.com/users/Peppe37/repos?per_page=100&type=owner').then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (list) {
      var m = {}; list.forEach(function (r) { m[r.name] = { stars: r.stargazers_count }; });
      safeSet('gl-stars', JSON.stringify({ t: now, m: m })); showStars(m);
    }).catch(function () {});
  })();

  $('#yr').textContent = new Date().getFullYear();
  applyLang();
})();

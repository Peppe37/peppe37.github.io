(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- Translations ---------------- */
  var T = window.PORTFOLIO_I18N;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    document.title = lang === 'it' ? 'Giuseppe Lapietra – Sviluppatore software' : 'Giuseppe Lapietra – Software developer';
  }

  /* ---------------- Theme: the system by default, the button saves a choice ---------------- */
  var root = document.documentElement;
  function isDark() {
    var t = root.getAttribute('data-theme');
    return t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  $('#themeBtn').addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next); safeSet('gl-theme', next);
  });

  /* ---------------- Contact dialog ---------------- */
  var EMAIL = 'lapietra.giu@gmail.com';
  var dlg = $('#mailDialog'), note = $('#mdNote');
  function openMail(kind) {
    var d = T[lang], subject = kind === 'project' ? d.subjProject : d.subjHello;
    $('#mdGmail').href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(EMAIL) + '&su=' + encodeURIComponent(subject);
    $('#mdApp').href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject);
    note.textContent = '';
    if (typeof dlg.showModal === 'function') dlg.showModal();
    else window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject);
  }
  $$('[data-mail]').forEach(function (a) {
    a.addEventListener('click', function (e) { e.preventDefault(); openMail(a.getAttribute('data-mail')); });
  });
  $('#mdClose').addEventListener('click', function () { dlg.close(); });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });   // a tap outside closes it
  $('#mdCopy').addEventListener('click', function () {
    function done(okay) { note.textContent = okay ? T[lang].mCopied : T[lang].mCopyFail; }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(EMAIL).then(function () { done(true); }, function () { done(legacyCopy()); });
    } else { done(legacyCopy()); }
  });
  function legacyCopy() {
    var t = document.createElement('textarea');
    t.value = EMAIL; t.setAttribute('readonly', ''); t.style.position = 'fixed'; t.style.opacity = '0';
    document.body.appendChild(t); t.select();
    var ok = false; try { ok = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(t); return ok;
  }

  /* ---------------- Language buttons ---------------- */
  $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { lang = b.dataset.lang; safeSet('gl-lang', lang); applyLang(); }); });

  /* ---------------- Nav and scroll progress ---------------- */
  var nav = $('#nav'), toTop = $('#totop'), progress = $('#progress');
  function onScroll() {
    var h = document.documentElement.scrollHeight - window.innerHeight;
    nav.classList.toggle('scrolled', window.scrollY > 12);
    toTop.classList.toggle('show', window.scrollY > 700);
    progress.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0).toFixed(4) + ')';
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

  /* ---------------- Reveal on scroll ---------------- */
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    $$('.rv').forEach(function (el) { obs.observe(el); });
  } else {
    $$('.rv').forEach(function (el) { el.classList.add('in'); });
  }

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

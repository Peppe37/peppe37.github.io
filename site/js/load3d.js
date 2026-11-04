/* The 3D bits (logo badge and the car) need Three.js, which is big. Load it after the page is done,
   so the first paint never waits for it: the flat logo shows first, the 3D one takes over when ready. */
(function () {
  'use strict';
  function add(src, next) {
    var s = document.createElement('script');
    s.src = src; s.async = false; s.onload = next || null;
    document.body.appendChild(s);
  }
  function go() { add('js/vendor/three.min.js', function () { add('js/glmark.js'); add('js/car.js'); }); }
  function later() { (window.requestIdleCallback || function (f) { setTimeout(f, 600); })(go, { timeout: 2500 }); }
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
})();

/* The 3D bits (logo badge and the car) need Three.js, which is big. It loads on the first sign of a real
   visitor (a scroll, a mouse move, a touch, a key), or after a few seconds anyway. So the first paint never
   waits for it: the flat logo shows first and the 3D one takes over. */
(function () {
  'use strict';
  var started = false, events = ['scroll', 'pointermove', 'touchstart', 'keydown'];
  function add(src, next) {
    var s = document.createElement('script');
    s.src = src; s.async = false; s.onload = next || null;
    document.body.appendChild(s);
  }
  function go() {
    if (started) return; started = true;
    events.forEach(function (e) { window.removeEventListener(e, go); });
    add('js/vendor/three.min.js', function () { add('js/f1.js', function () { add('js/glmark.js'); add('js/car.js'); }); });
  }
  events.forEach(function (e) { window.addEventListener(e, go, { passive: true }); });
  window.addEventListener('load', function () { setTimeout(go, 6000); });
})();

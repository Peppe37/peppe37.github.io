/* The racer drives along the bottom of the page while you scroll. */
(function () {
  'use strict';
  var road = document.getElementById('road'), canvas = document.getElementById('car'), trail = document.getElementById('trail');
  if (!road || !canvas || !window.THREE || !window.buildF1) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { road.hidden = true; return; }
  var THREE = window.THREE;

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { road.hidden = true; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-3.2, 3.2, 1.5, -0.05, 0.1, 50);
  camera.position.set(0, 0, 20);

  var f1 = window.buildF1(THREE), car = f1.group;
  car.position.x = -0.35;
  var pivot = new THREE.Group(); pivot.add(car); pivot.rotation.y = -0.38;   /* a three-quarter look */
  scene.add(pivot);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  var key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(4, 8, 10); scene.add(key);

  var W = 0, H = 0, last = window.scrollY, speed = 0;
  function size() {
    W = Math.round(Math.min(260, Math.max(160, window.innerWidth * 0.3))); H = Math.round(W * 1.55 / 6.4);
    renderer.setSize(W, H, false); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  }
  size(); window.addEventListener('resize', size);

  function tick() {
    var y = window.scrollY, d = y - last; last = y;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var prog = max > 0 ? Math.min(1, y / max) : 0;
    speed += (Math.abs(d) - speed) * 0.2;
    f1.wheels.forEach(function (w) { w.obj.rotation.z -= d / (w.r * 38); });
    pivot.position.y = Math.sin(y * 0.06) * 0.012 * Math.min(1, speed);
    car.rotation.z = Math.min(0.03, speed * 0.0015);
    var x = prog * (window.innerWidth - W - 12) + 6;
    road.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    trail.style.width = Math.min(150, speed * 5).toFixed(0) + 'px'; trail.style.opacity = Math.min(1, speed / 14).toFixed(2);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

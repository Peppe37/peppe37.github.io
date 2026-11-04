/* The GL monogram as a 3D object you can drag around. Falls back to the flat SVG when WebGL is not there. */
(function () {
  'use strict';
  var box = document.getElementById('gl3d');
  if (!box || !window.THREE) return;
  var THREE = window.THREE;

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  box.appendChild(renderer.domElement);
  box.classList.add('live');

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
  camera.position.set(0, 0, 185);

  /* Same path as the SVG logo (120 x 80 box, y down), centred and flipped */
  function P(x, y) { return new THREE.Vector3(x - 60, 40 - y, 0); }
  var gPts = [], a0 = -39.9 * Math.PI / 180, a1 = -320.1 * Math.PI / 180, n = 60, i, t;
  for (i = 0; i <= n; i++) { t = a0 + (a1 - a0) * i / n; gPts.push(P(36 + 24 * Math.cos(t), 40 + 24 * Math.sin(t))); }
  gPts.push(P(54.4, 41), P(38, 41));
  var lPts = [P(78, 16), P(78, 64), P(104, 64)];

  /* Inflated vinyl: glossy, no metal. G in powder blue, L in racing orange, like a livery */
  function vinyl(c) { return new THREE.MeshPhysicalMaterial({ color: c, metalness: 0, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.2 }); }
  var matG = vinyl(0xa8c9c8), matL = vinyl(0xf45b0b);
  var group = new THREE.Group();
  var RADIUS = 6.4;
  function tube(pts, corners, mat) {
    var curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', corners ? 0.02 : 0.5);
    var g = new THREE.TubeGeometry(curve, 220, RADIUS, 20, false);
    group.add(new THREE.Mesh(g, mat));
    [pts[0], pts[pts.length - 1]].forEach(function (p) {
      var s = new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 20, 14), mat); s.position.copy(p); group.add(s);
    });
  }
  tube(gPts, true, matG); tube(lPts, true, matL);
  scene.add(group);

  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  var key = new THREE.DirectionalLight(0xffffff, 0.8); key.position.set(40, 60, 90); scene.add(key);
  var rim = new THREE.DirectionalLight(0xffffff, 0.35); rim.position.set(-70, -30, -40); scene.add(rim);

  function resize() {
    var s = box.clientWidth || 300;
    renderer.setSize(s, s, false);
    renderer.domElement.style.width = s + 'px'; renderer.domElement.style.height = s + 'px';
    camera.aspect = 1; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  /* Drag to rotate, keeps spinning a bit after you let go, drifts back to a gentle sway */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rx = -0.15, ry = 0.5, vx = 0, vy = 0, drag = false, lx = 0, ly = 0, hover = { x: 0, y: 0 }, tx = 0, ty = 0;
  var el = renderer.domElement;
  el.style.touchAction = 'pan-y';
  el.addEventListener('pointerdown', function (e) { drag = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); box.classList.add('grab'); });
  el.addEventListener('pointermove', function (e) {
    var r = el.getBoundingClientRect();
    hover.x = (e.clientX - r.left) / r.width - 0.5; hover.y = (e.clientY - r.top) / r.height - 0.5;
    if (!drag) return;
    vy = (e.clientX - lx) * 0.012; vx = (e.clientY - ly) * 0.012; ry += vy; rx += vx; lx = e.clientX; ly = e.clientY;
  });
  function up() { drag = false; box.classList.remove('grab'); }
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', function () { hover.x = 0; hover.y = 0; });

  var visible = true, start = performance.now();
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(box);

  /* Draws itself in: scale up and spin once on load */
  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    var age = (now - start) / 1000, intro = reduce ? 1 : Math.min(1, age / 1.6), e = 1 - Math.pow(1 - intro, 3);
    if (!drag) {
      ry += vy; rx += vx; vy *= 0.94; vx *= 0.94;
      if (Math.abs(vy) < 0.0008 && Math.abs(vx) < 0.0008) {
        // idle: ease the tilt back and sway slowly
        rx += (-0.12 + hover.y * 0.5 - rx) * 0.04;
        if (!reduce) ry += 0.004;
      }
    }
    group.rotation.x = rx + (1 - e) * 0.6;
    group.rotation.y = ry + (1 - e) * Math.PI * 1.5 + hover.x * 0.35;
    var breathe = reduce ? 1 : 1 + Math.sin(age * 1.6) * 0.018;
    var s = (0.35 + 0.65 * e) * breathe; group.scale.set(s, s, s);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
})();

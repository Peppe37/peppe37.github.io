/* A little endurance racer that drives along the bottom of the page while you scroll. */
(function () {
  'use strict';
  var road = document.getElementById('road'), canvas = document.getElementById('car'), trail = document.getElementById('trail');
  if (!road || !canvas || !window.THREE) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { road.hidden = true; return; }
  var THREE = window.THREE;

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); } catch (e) { road.hidden = true; return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-6.3, 6.3, 2.75, -0.1, 0.1, 50);
  camera.position.set(0, 0, 20);

  var car = new THREE.Group();
  function std(c, r, m) { return new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }); }

  /* side view of the body, x is forward, y is up */
  var s = new THREE.Shape();
  s.moveTo(-5, 0.28); s.lineTo(-5, 0.95);
  s.bezierCurveTo(-4.4, 1.45, -3.4, 1.5, -2.6, 1.25);
  s.lineTo(0.2, 1.02); s.lineTo(1.2, 0.95);
  s.bezierCurveTo(2.4, 0.92, 3.6, 0.78, 4.5, 0.52);
  s.bezierCurveTo(5.0, 0.42, 5.1, 0.3, 4.9, 0.26);
  s.lineTo(-5, 0.28);
  var bodyGeo = new THREE.ExtrudeGeometry(s, { depth: 1.7, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.12, bevelSegments: 3, curveSegments: 24 });
  bodyGeo.translate(0, 0, -0.85);
  car.add(new THREE.Mesh(bodyGeo, std(0xa8c9c8, 0.35, 0.2)));

  var c = new THREE.Shape();
  c.moveTo(-1.0, 0.98); c.bezierCurveTo(-0.7, 1.75, 0.3, 1.85, 0.9, 1.45); c.lineTo(1.5, 0.96); c.lineTo(-1.0, 0.98);
  var canGeo = new THREE.ExtrudeGeometry(c, { depth: 1.0, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 2 });
  canGeo.translate(0, 0, -0.5);
  car.add(new THREE.Mesh(canGeo, std(0x0f1212, 0.15, 0.6)));

  /* livery: an orange side stripe and a white roundel with the number */
  var stripe = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 0.16), std(0xf45b0b, 0.5, 0));
  stripe.position.set(-0.3, 0.52, 1.0); car.add(stripe);
  var tex = document.createElement('canvas'); tex.width = tex.height = 128;
  var g = tex.getContext('2d');
  g.fillStyle = '#fff'; g.beginPath(); g.arc(64, 64, 62, 0, 7); g.fill();
  g.fillStyle = '#111'; g.font = '700 70px -apple-system, Helvetica, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('37', 64, 70);
  var roundel = new THREE.Mesh(new THREE.CircleGeometry(0.36, 32), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tex), transparent: true }));
  roundel.position.set(0.1, 0.68, 1.01); car.add(roundel);

  /* wheels: tyre, orange rim, a spoke so you can see them turn */
  var wheels = [];
  function wheel(x, z) {
    var w = new THREE.Group();
    var tyre = new THREE.CylinderGeometry(0.62, 0.62, 0.5, 28); tyre.rotateX(Math.PI / 2);
    w.add(new THREE.Mesh(tyre, std(0x151717, 0.8, 0)));
    var rim = new THREE.CylinderGeometry(0.4, 0.4, 0.52, 20); rim.rotateX(Math.PI / 2);
    w.add(new THREE.Mesh(rim, std(0xf45b0b, 0.4, 0.3)));
    var spoke = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.54), std(0xf4f1ee, 0.5, 0)); w.add(spoke);
    var spoke2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.7, 0.54), std(0xf4f1ee, 0.5, 0)); w.add(spoke2);
    w.position.set(x, 0.62, z); car.add(w); wheels.push(w);
  }
  wheel(-3.1, 1.0); wheel(3.0, 1.0); wheel(-3.1, -1.0); wheel(3.0, -1.0);

  car.rotation.y = -0.22;
  scene.add(car);
  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  var key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(4, 8, 10); scene.add(key);

  var W = 0, H = 0, last = window.scrollY, prog = 0, speed = 0;
  function size() {
    W = Math.round(Math.min(250, Math.max(150, window.innerWidth * 0.3))); H = Math.round(W * 2.85 / 12.6);
    renderer.setSize(W, H, false); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  }
  size(); window.addEventListener('resize', size);

  function tick() {
    var y = window.scrollY, d = y - last; last = y;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    prog = max > 0 ? Math.min(1, y / max) : 0;
    speed += (Math.abs(d) - speed) * 0.2;
    wheels.forEach(function (w) { w.rotation.z -= d * 0.025; });
    car.position.y = Math.sin(y * 0.05) * 0.02 * Math.min(1, speed);
    car.rotation.z = Math.min(0.03, speed * 0.002);     /* nose lifts a hair under speed */
    var x = prog * (window.innerWidth - W - 12) + 6;
    road.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    trail.style.width = Math.min(150, speed * 5).toFixed(0) + 'px'; trail.style.opacity = Math.min(1, speed / 14).toFixed(2);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

/* The GL monogram as a sharp 3D badge, slanted like racing italics. Drag to turn it. Flat SVG if WebGL is missing. */
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
  var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 500);
  camera.position.set(0, 0, 210);

  /* The logo box is 120 x 80, y down. Centre it and flip y. */
  function V(x, y) { return new THREE.Vector2(x - 60, 40 - y); }
  function poly(pts) { return new THREE.Shape(pts.map(function (p) { return V(p[0], p[1]); })); }

  /* G: a ring with a gap on the right, plus the bar */
  var ring = [], R1 = 29, R0 = 19, cx = 36, cy = 40, a0 = -39.9, a1 = -320.1, steps = 48, i, a;
  for (i = 0; i <= steps; i++) { a = (a0 + (a1 - a0) * i / steps) * Math.PI / 180; ring.push([cx + R1 * Math.cos(a), cy + R1 * Math.sin(a)]); }
  for (i = steps; i >= 0; i--) { a = (a0 + (a1 - a0) * i / steps) * Math.PI / 180; ring.push([cx + R0 * Math.cos(a), cy + R0 * Math.sin(a)]); }
  var shapesG = [poly(ring), poly([[38, 36], [59.4, 36], [59.4, 56], [49.4, 56], [49.4, 46], [38, 46]])];
  /* L */
  var shapesL = [poly([[73, 11], [83, 11], [83, 59], [109, 59], [109, 69], [73, 69]])];

  var slant = new THREE.Matrix4().set(1, 0.22, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  var opts = { depth: 11, bevelEnabled: true, bevelThickness: 1.1, bevelSize: 0.9, bevelSegments: 2, curveSegments: 24 };
  function mesh(shapes, color) {
    var g = new THREE.ExtrudeGeometry(shapes, opts);
    g.translate(0, 0, -opts.depth / 2); g.applyMatrix4(slant); g.computeVertexNormals();
    return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: color, roughness: 0.42, metalness: 0.12 }));
  }
  var group = new THREE.Group();
  group.add(mesh(shapesG, 0xa8c9c8)); group.add(mesh(shapesL, 0xf45b0b));
  scene.add(group);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  var key = new THREE.DirectionalLight(0xffffff, 0.9); key.position.set(60, 80, 120); scene.add(key);
  var rim = new THREE.DirectionalLight(0xffffff, 0.45); rim.position.set(-90, -20, -60); scene.add(rim);

  function resize() {
    var s = box.clientWidth || 300;
    renderer.setSize(s, s, false);
    renderer.domElement.style.width = s + 'px'; renderer.domElement.style.height = s + 'px';
  }
  resize(); window.addEventListener('resize', resize);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rx = -0.12, ry = -0.5, vx = 0, vy = 0, drag = false, lx = 0, ly = 0, hover = { x: 0, y: 0 };
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

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) return;
    var age = (now - start) / 1000, intro = reduce ? 1 : Math.min(1, age / 1.2), e = 1 - Math.pow(1 - intro, 4);
    if (!drag) {
      ry += vy; rx += vx; vy *= 0.94; vx *= 0.94;
      if (Math.abs(vy) < 0.0008 && Math.abs(vx) < 0.0008) {
        /* idle: settle at a three-quarter view and follow the mouse a little */
        rx += (-0.12 + hover.y * 0.5 - rx) * 0.05;
        ry += ((-0.5 + hover.x * 0.7) - ry) * 0.05;
      }
    }
    /* comes in fast from the left, like a car entering the frame */
    group.position.x = (1 - e) * -140;
    group.rotation.x = rx;
    group.rotation.y = ry + (1 - e) * 0.9;
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
})();

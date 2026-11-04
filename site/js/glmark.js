/* The GL monogram drawn as a race circuit: asphalt, kerbs, centre line, a chequered start line,
   and a racer doing laps of it. Drag to turn it. The flat SVG logo shows when WebGL is missing. */
(function () {
  'use strict';
  var box = document.getElementById('gl3d');
  if (!box || !window.THREE || !window.buildF1) return;
  var THREE = window.THREE;

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  box.appendChild(renderer.domElement);
  box.classList.add('live');

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(28, 1, 1, 800);
  camera.position.set(0, 0, 250);

  var ROAD = 15, TH = 1.6, STEP = 1.1;

  /* ---------- the two paths, y up ---------- */
  function seg(a, b, out) {                                   // straight piece, sampled
    var n = Math.max(1, Math.round(a.distanceTo(b) / STEP));
    for (var i = 0; i < n; i++) out.push(a.clone().lerp(b, i / n));
  }
  function rounded(ctrl, r) {                                  // polyline with rounded corners
    var out = [], cur = ctrl[0].clone(), i, p, a, b, c, t, k;
    for (i = 1; i < ctrl.length - 1; i++) {
      p = ctrl[i]; a = p.clone().sub(ctrl[i - 1]).normalize(); b = ctrl[i + 1].clone().sub(p).normalize();
      var s = p.clone().addScaledVector(a, -r), e = p.clone().addScaledVector(b, r);
      seg(cur, s, out);
      for (k = 0; k < 12; k++) {                               // quadratic bend
        t = k / 12; c = new THREE.Vector3().addScaledVector(s, (1 - t) * (1 - t)).addScaledVector(p, 2 * t * (1 - t)).addScaledVector(e, t * t);
        out.push(c);
      }
      cur = e;
    }
    seg(cur, ctrl[ctrl.length - 1], out); out.push(ctrl[ctrl.length - 1].clone());
    return out;
  }
  /* G: a true circle with a gap on the right, then up and in with a rounded corner */
  var RG = 26, G = [], i, a;
  for (i = 0; i <= 150; i++) { a = (42 + (318 - 42) * i / 150) * Math.PI / 180; G.push(new THREE.Vector3(RG * Math.cos(a), RG * Math.sin(a), 0)); }
  var end = G[G.length - 1];
  var tail = rounded([end, new THREE.Vector3(end.x, 0, 0), new THREE.Vector3(3, 0, 0)], 7);
  tail.shift(); G = G.concat(tail);
  var L = rounded([new THREE.Vector3(50, 28, 0), new THREE.Vector3(50, -28, 0), new THREE.Vector3(80, -28, 0)], 8);

  /* ---------- geometry helpers ---------- */
  function frames(pts) {
    return pts.map(function (p, i) {
      var t = pts[Math.min(pts.length - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize();
      return { p: p, t: t, n: new THREE.Vector3(-t.y, t.x, 0) };
    });
  }
  function curve(fr, d, z) { return fr.map(function (f) { return new THREE.Vector3(f.p.x + f.n.x * d, f.p.y + f.n.y * d, z); }); }
  function strip(A, B, color, every, keep) {                    // quads between two curves
    var pos = [], col = [], k, q, c, cc;
    for (k = 0; k < A.length - 1; k++) {
      if (keep && !keep(k)) continue;
      c = typeof color === 'function' ? color(k) : color; cc = new THREE.Color(c);
      [A[k], B[k], B[k + 1], A[k], B[k + 1], A[k + 1]].forEach(function (v) { pos.push(v.x, v.y, v.z); col.push(cc.r, cc.g, cc.b); });
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, side: THREE.DoubleSide }));
  }
  var ASPHALT = 0x2b2f31, ORANGE = 0xf45b0b, WHITE = 0xf4f1ee;
  var track = new THREE.Group();
  function build(pts) {
    var fr = frames(pts), h = ROAD / 2, g = new THREE.Group();
    g.add(strip(curve(fr, -h, TH), curve(fr, h, TH), ASPHALT));                         // surface
    g.add(strip(curve(fr, -h, 0), curve(fr, -h, TH), 0x1d2022));                        // walls
    g.add(strip(curve(fr, h, 0), curve(fr, h, TH), 0x1d2022));
    var kerb = function (k) { return Math.floor(k / 4) % 2 ? WHITE : ORANGE; };
    g.add(strip(curve(fr, -h, TH + 0.2), curve(fr, -h + 2.4, TH + 0.2), kerb));          // kerbs
    g.add(strip(curve(fr, h - 2.4, TH + 0.2), curve(fr, h, TH + 0.2), kerb));
    g.add(strip(curve(fr, -0.45, TH + 0.06), curve(fr, 0.45, TH + 0.06), WHITE, 0, function (k) { return k % 10 < 5; }));   // dashes
    return { group: g, fr: fr };
  }
  var tg = build(G), tl = build(L);
  track.add(tg.group); track.add(tl.group);

  /* chequered start / finish line across the road */
  var cv = document.createElement('canvas'); cv.width = 128; cv.height = 32;
  var cx = cv.getContext('2d');
  for (var xx = 0; xx < 16; xx++) for (var yy = 0; yy < 4; yy++) { cx.fillStyle = (xx + yy) % 2 ? '#111' : '#f4f1ee'; cx.fillRect(xx * 8, yy * 8, 8, 8); }
  var ctex = new THREE.CanvasTexture(cv);
  function flag(f) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, ROAD - 4.8), new THREE.MeshBasicMaterial({ map: ctex }));
    var b = new THREE.Matrix4().makeBasis(f.t, f.n, new THREE.Vector3(0, 0, 1));
    m.quaternion.setFromRotationMatrix(b); m.position.set(f.p.x, f.p.y, TH + 0.12); track.add(m);
  }
  flag(tg.fr[3]); flag(tl.fr[tl.fr.length - 4]);

  /* centre it */
  var bb = new THREE.Box3().setFromObject(track), ctr = bb.getCenter(new THREE.Vector3());
  track.position.set(-ctr.x, -ctr.y, -TH / 2);
  var pivot = new THREE.Group(); pivot.add(track); scene.add(pivot);

  /* ---------- the racer ---------- */
  var f1 = window.buildF1(THREE), racer = new THREE.Group(), SC = 3.4;
  racer.add(f1.group); f1.group.position.x = -0.4; racer.scale.set(SC, SC, SC);
  track.add(racer);
  function lengths(pts) { var s = [0]; for (var k = 1; k < pts.length; k++) s.push(s[k - 1] + pts[k].distanceTo(pts[k - 1])); return s; }
  var sG = lengths(G), sL = lengths(L), lenG = sG[sG.length - 1], lenL = sL[sL.length - 1];
  var SPEED = 46, PAUSE = 0.9, CYCLE = (lenG + lenL) / SPEED + PAUSE;
  function place(fr, s, arr) {
    var k = 1; while (k < arr.length - 1 && arr[k] < s) k++;
    var f0 = fr[k - 1], f1_ = fr[k], u = (s - arr[k - 1]) / Math.max(1e-6, arr[k] - arr[k - 1]);
    var p = f0.p.clone().lerp(f1_.p, u), t = f0.t.clone().lerp(f1_.t, u).normalize();
    var b = new THREE.Matrix4().makeBasis(t, new THREE.Vector3(0, 0, 1), new THREE.Vector3(t.y, -t.x, 0));
    racer.quaternion.setFromRotationMatrix(b); racer.position.set(p.x, p.y, TH + 0.5);
  }

  scene.add(new THREE.AmbientLight(0xffffff, 0.65));
  var key = new THREE.DirectionalLight(0xffffff, 0.95); key.position.set(60, 90, 140); scene.add(key);
  var fill = new THREE.DirectionalLight(0xffffff, 0.3); fill.position.set(-80, -40, 60); scene.add(fill);

  function resize() {
    var s = box.clientWidth || 300;
    renderer.setSize(s, s, false);
    renderer.domElement.style.width = s + 'px'; renderer.domElement.style.height = s + 'px';
  }
  resize(); window.addEventListener('resize', resize);

  /* ---------- turning it ---------- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rx = -0.32, ry = -0.22, vx = 0, vy = 0, drag = false, lx = 0, ly = 0, hover = { x: 0, y: 0 };
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

  var visible = true, t0 = performance.now(), prev = t0;
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(box);

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible) { prev = now; return; }
    var dt = Math.min(0.05, (now - prev) / 1000); prev = now;
    var age = (now - t0) / 1000, intro = reduce ? 1 : Math.min(1, age / 1.1), e = 1 - Math.pow(1 - intro, 4);
    if (!drag) {
      ry += vy; rx += vx; vy *= 0.94; vx *= 0.94;
      if (Math.abs(vy) < 0.0008 && Math.abs(vx) < 0.0008) {
        rx += ((-0.32 + hover.y * 0.5) - rx) * 0.05;
        ry += ((-0.22 + hover.x * 0.8) - ry) * 0.05;
      }
    }
    pivot.rotation.x = rx; pivot.rotation.y = ry; pivot.scale.setScalar(0.85 + 0.15 * e);

    /* laps: G, then L, then a short pause on the grid */
    var d = reduce ? 0 : (age * SPEED) % (CYCLE * SPEED), moving = Math.min(d, lenG + lenL);
    if (moving < lenG) { place(tg.fr, moving, sG); }
    else { place(tl.fr, moving - lenG, sL); }
    var fade = d > lenG + lenL ? 0 : 1; racer.visible = !!fade;
    var dist = SPEED * dt; f1.wheels.forEach(function (w) { w.obj.rotation.z -= dist / (w.r * SC); });
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
})();

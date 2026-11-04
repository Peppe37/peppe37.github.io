/* A stylised open-wheel racer, built from simple shapes. x is forward, y is up, z is sideways. Length is about 5 units. */
window.buildF1 = function (THREE) {
  'use strict';
  var BODY = 0xa8c9c8, ACC = 0xf45b0b, DARK = 0x151717, WHITE = 0xf4f1ee;
  var car = new THREE.Group(), wheels = [];
  function std(c, r, m) { return new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m }); }
  function box(w, h, d, color, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(color, 0.45, 0.15));
    m.position.set(x, y, z); car.add(m); return m;
  }

  /* monocoque and engine cover, from a side profile */
  var s = new THREE.Shape();
  s.moveTo(-1.7, 0.2); s.lineTo(-1.7, 0.48);
  s.bezierCurveTo(-1.3, 0.62, -1.0, 0.74, -0.7, 0.78);
  s.lineTo(-0.15, 0.8); s.lineTo(0.25, 0.56); s.lineTo(0.85, 0.5);
  s.bezierCurveTo(1.6, 0.48, 2.3, 0.36, 2.95, 0.26);
  s.lineTo(2.95, 0.17); s.lineTo(-1.7, 0.2);
  var g = new THREE.ExtrudeGeometry(s, { depth: 0.46, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 18 });
  g.translate(0, 0, -0.23);
  car.add(new THREE.Mesh(g, std(BODY, 0.35, 0.25)));

  box(1.5, 0.3, 0.3, BODY, -0.2, 0.36, 0.42); box(1.5, 0.3, 0.3, BODY, -0.2, 0.36, -0.42);   // sidepods
  box(4.3, 0.04, 1.15, DARK, -0.1, 0.14, 0);                                                   // floor
  box(0.5, 0.05, 1.5, ACC, 2.72, 0.12, 0);                                                     // front wing
  box(0.5, 0.15, 0.03, WHITE, 2.72, 0.18, 0.75); box(0.5, 0.15, 0.03, WHITE, 2.72, 0.18, -0.75);
  box(0.45, 0.05, 1.3, ACC, -1.85, 0.98, 0); box(0.4, 0.04, 1.3, BODY, -1.83, 0.82, 0);        // rear wing
  box(0.6, 0.5, 0.03, WHITE, -1.85, 0.8, 0.66); box(0.6, 0.5, 0.03, WHITE, -1.85, 0.8, -0.66);
  box(0.1, 0.5, 0.06, DARK, -1.7, 0.6, 0);
  var helmet = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), std(ACC, 0.3, 0.2)); helmet.position.set(0.5, 0.62, 0); car.add(helmet);

  /* race number on both sidepods and the nose */
  var tex = document.createElement('canvas'); tex.width = tex.height = 128;
  var c = tex.getContext('2d');
  c.fillStyle = '#f4f1ee'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill();
  c.fillStyle = '#111'; c.font = '800 72px -apple-system, Helvetica, Arial, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('37', 64, 70);
  var t = new THREE.CanvasTexture(tex);
  [1, -1].forEach(function (side) {
    var m = new THREE.Mesh(new THREE.CircleGeometry(0.15, 28), new THREE.MeshBasicMaterial({ map: t, transparent: true }));
    m.position.set(-0.2, 0.37, side * 0.572); if (side < 0) m.rotation.y = Math.PI; car.add(m);
  });

  /* wheels: tyre, white rim, an orange mark so the turning shows */
  function wheel(x, r, w, z) {
    var grp = new THREE.Group();
    var tyre = new THREE.CylinderGeometry(r, r, w, 28); tyre.rotateX(Math.PI / 2);
    grp.add(new THREE.Mesh(tyre, std(DARK, 0.8, 0)));
    var rim = new THREE.CylinderGeometry(r * 0.58, r * 0.58, w + 0.01, 20); rim.rotateX(Math.PI / 2);
    grp.add(new THREE.Mesh(rim, std(WHITE, 0.4, 0.3)));
    var mark = new THREE.Mesh(new THREE.BoxGeometry(r * 0.9, r * 0.14, w + 0.02), std(ACC, 0.4, 0.2)); grp.add(mark);
    grp.position.set(x, r, z); car.add(grp); wheels.push({ obj: grp, r: r });
  }
  wheel(1.85, 0.3, 0.32, 0.78); wheel(1.85, 0.3, 0.32, -0.78);
  wheel(-1.25, 0.35, 0.46, 0.8); wheel(-1.25, 0.35, 0.46, -0.8);
  box(0.05, 0.05, 0.55, DARK, 1.85, 0.3, 0.5); box(0.05, 0.05, 0.55, DARK, 1.85, 0.3, -0.5);
  box(0.05, 0.05, 0.55, DARK, -1.25, 0.34, 0.5); box(0.05, 0.05, 0.55, DARK, -1.25, 0.34, -0.5);

  return { group: car, wheels: wheels };
};

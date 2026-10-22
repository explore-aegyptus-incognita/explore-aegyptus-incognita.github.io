/* Aegyptus Incognita · estilo
   El kit de dibujo de todo el arte, sacado de las cuatro referencias de Pau (herramientas/referencias, contrato en
   herramientas/encargos/contrato-estilo.md): vector pulido sin contornos, cada forma con un degradado suave, oro con
   brillo, cornalina, collares de bandas, piel terracota, lino plisado y el negro azulado de Anubis y los gatos, sobre
   papiro gastado con jeroglíficos de línea ocre. AE.estilo (ES). */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, TAU = Math.PI * 2;
  var h = U.hex;

  var P = {
    papiro: h('#f7e2b8'), papiro2: h('#efcf94'), papiro3: h('#e3b06a'), ocre: h('#d9984a'), tinta: h('#3a2614'),
    lapis: h('#2f4fa6'), lapis2: h('#1f3478'), egipcio: h('#3d7fc4'), turquesa: h('#3fb8a5'), verde: h('#58b06a'),
    cornalina: h('#e2502a'), rojo: h('#c8452c'),
    oro1: h('#ffe98a'), oro2: h('#f6b733'), oro3: h('#c87a16'), oro4: h('#8a4a0c'),
    piel: h('#d86f2e'), piel2: h('#b5521c'), pielM: h('#e89a52'),
    lino: h('#fbf4e4'), lino2: h('#d9cdb4'), negro: h('#1d2233'), negro2: h('#3b4560'),
    arena: h('#e9c27a'), arena2: h('#d6a456'), piedra: h('#e6c48c'), piedra2: h('#c99a5c'),
    blanco: [255, 252, 240]
  };
  var ES = AE.estilo = { p: P };

  /* ---------- color ---------- */
  ES.aclarar = function (c, k) { return U.mezcla(c, [255, 255, 255], k); };
  ES.oscurecer = function (c, k) { return U.mezcla(c, [20, 12, 6], k); };
  // hacia el papiro (lo lejano: la perspectiva de un friso pintado es ir perdiendo color hacia el fondo)
  ES.lejos = function (c, k) { return U.mezcla(c, P.papiro, k); };
  ES.css = function (c, a) { return U.rgba(c, a == null ? 1 : a); };

  /* ---------- degradados ---------- */
  // lineal con paradas [[t, color, a?], …]
  ES.lin = function (x, x0, y0, x1, y1, paradas) {
    var g = x.createLinearGradient(x0, y0, x1, y1);
    for (var i = 0; i < paradas.length; i++) { var s = paradas[i]; g.addColorStop(s[0], U.rgba(s[1], s[2] == null ? 1 : s[2])); }
    return g;
  };
  ES.rad = function (x, cx, cy, r0, r1, paradas, fx, fy) {
    var g = x.createRadialGradient(fx == null ? cx : fx, fy == null ? cy : fy, r0, cx, cy, r1);
    for (var i = 0; i < paradas.length; i++) { var s = paradas[i]; g.addColorStop(s[0], U.rgba(s[1], s[2] == null ? 1 : s[2])); }
    return g;
  };
  // el relleno de casi todo: el color, algo más claro en (x0, y0) y algo más oscuro en (x1, y1)
  ES.relleno = function (x, c, x0, y0, x1, y1, k) {
    k = k == null ? 0.16 : k;
    return ES.lin(x, x0, y0, x1, y1, [[0, ES.aclarar(c, k)], [0.55, c], [1, ES.oscurecer(c, k * 1.3)]]);
  };
  // el oro: amarillo claro, naranja, oro oscuro, con una banda de luz casi blanca
  ES.oro = function (x, x0, y0, x1, y1, luz) {
    luz = luz == null ? 0.3 : luz;
    return ES.lin(x, x0, y0, x1, y1, [[0, P.oro1], [Math.max(0.02, luz - 0.12), P.oro2], [luz, [255, 248, 196]], [Math.min(0.98, luz + 0.14), P.oro2], [0.78, P.oro3], [1, P.oro4]]);
  };
  // el negro azulado de Anubis y los gatos, con su reflejo gris azulado
  ES.negro = function (x, x0, y0, x1, y1) {
    return ES.lin(x, x0, y0, x1, y1, [[0, P.negro2], [0.35, U.mezcla(P.negro, P.negro2, 0.35)], [1, P.negro]]);
  };

  /* ---------- formas ---------- */
  ES.camino = function (x, fn) { x.beginPath(); fn(x); };
  ES.rellenar = function (x, fn, estilo) { x.beginPath(); fn(x); x.fillStyle = estilo; x.fill(); };
  // un brillo suave sobre una forma: se recorta a la forma y se pinta una cuña de luz que se desvanece
  ES.brillo = function (x, fn, x0, y0, x1, y1, a, col) {
    x.save(); x.beginPath(); fn(x); x.clip();
    x.fillStyle = ES.lin(x, x0, y0, x1, y1, [[0, col || [255, 255, 255], 0], [0.45, col || [255, 255, 255], a == null ? 0.35 : a], [1, col || [255, 255, 255], 0]]);
    var mx = Math.min(x0, x1) - 2000, my = Math.min(y0, y1) - 2000; x.fillRect(mx, my, 4000 + Math.abs(x1 - x0), 4000 + Math.abs(y1 - y0));
    x.restore();
  };
  // una sombra interior suave hacia un lado (para dar volumen sin contorno)
  ES.sombra = function (x, fn, x0, y0, x1, y1, a, col) {
    x.save(); x.beginPath(); fn(x); x.clip();
    x.fillStyle = ES.lin(x, x0, y0, x1, y1, [[0, col || [40, 20, 6], 0], [1, col || [40, 20, 6], a == null ? 0.25 : a]]);
    x.fillRect(Math.min(x0, x1) - 2000, Math.min(y0, y1) - 2000, 4000 + Math.abs(x1 - x0), 4000 + Math.abs(y1 - y0));
    x.restore();
  };
  // un rectángulo redondeado (en el camino actual)
  ES.redondo = function (x, rx, ry, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    x.moveTo(rx + r, ry); x.lineTo(rx + w - r, ry); x.quadraticCurveTo(rx + w, ry, rx + w, ry + r); x.lineTo(rx + w, ry + h - r);
    x.quadraticCurveTo(rx + w, ry + h, rx + w - r, ry + h); x.lineTo(rx + r, ry + h); x.quadraticCurveTo(rx, ry + h, rx, ry + h - r);
    x.lineTo(rx, ry + r); x.quadraticCurveTo(rx, ry, rx + r, ry); x.closePath();
  };

  /* ---------- piezas pequeñas que usa todo ---------- */
  // un disco de cornalina con su aro de oro (r = radio del disco)
  ES.gema = function (x, cx, cy, r, col, aro) {
    col = col || P.cornalina;
    if (aro !== false) { x.beginPath(); x.arc(cx, cy, r * 1.16, 0, TAU); x.fillStyle = ES.oro(x, cx - r, cy - r, cx + r, cy + r, 0.25); x.fill(); }
    x.beginPath(); x.arc(cx, cy, r, 0, TAU);
    x.fillStyle = ES.rad(x, cx, cy, 0, r, [[0, ES.aclarar(col, 0.35)], [0.55, col], [1, ES.oscurecer(col, 0.3)]], cx - r * 0.35, cy - r * 0.4); x.fill();
    // el reflejo: una media luna clara arriba
    x.beginPath(); x.ellipse(cx - r * 0.12, cy - r * 0.5, r * 0.55, r * 0.22, -0.25, 0, TAU); x.fillStyle = U.rgba([255, 230, 200], 0.38); x.fill();
  };
  // una estrella de cinco puntas de brazos finos, como las de los techos de las tumbas
  ES.estrella = function (x, cx, cy, r, rot) {
    rot = rot || 0; x.beginPath();
    for (var i = 0; i < 10; i++) { var a = rot - Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.3 : r; i ? x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    x.closePath();
  };
  // el ankh de oro (h = alto; (cx, y) = arriba en el centro)
  ES.ankh = function (x, cx, y, hgt) {
    var w = hgt * 0.58, lazoH = hgt * 0.4, br = hgt * 0.07, palo = hgt * 0.12;
    function forma(k) {
      // el lazo (un óvalo con su agujero: el de dentro va en sentido contrario y queda hueco), los brazos y el palo
      k.ellipse(cx, y + lazoH * 0.5, w * 0.3, lazoH * 0.5, 0, 0, TAU);
      k.moveTo(cx + w * 0.15, y + lazoH * 0.52); k.ellipse(cx, y + lazoH * 0.52, w * 0.15, lazoH * 0.31, 0, 0, TAU, true);
      k.moveTo(cx - w * 0.5, y + lazoH * 0.94); k.lineTo(cx + w * 0.5, y + lazoH * 0.94); k.lineTo(cx + w * 0.5, y + lazoH * 0.94 + br * 2); k.lineTo(cx - w * 0.5, y + lazoH * 0.94 + br * 2); k.closePath();
      k.moveTo(cx - palo * 0.5, y + lazoH * 0.9); k.lineTo(cx + palo * 0.5, y + lazoH * 0.9); k.lineTo(cx + palo * 0.75, y + hgt); k.lineTo(cx - palo * 0.75, y + hgt); k.closePath();
    }
    x.beginPath(); forma(x); x.fillStyle = ES.oro(x, cx - w * 0.5, y, cx + w * 0.4, y + hgt, 0.32); x.fill();
    // el canto: un filo oscuro abajo a la derecha
    ES.sombra(x, forma, cx - w * 0.2, y, cx + w * 0.5, y + hgt * 0.4, 0.25);
  };
  // el ojo de Horus (wedjat), plano y en lapislázuli como en las cenefas de la referencia 1 (w = ancho)
  ES.ojoHorus = function (x, cx, cy, w, col) {
    col = col || P.lapis; var s = w / 100;
    x.save(); x.translate(cx - 50 * s, cy - 30 * s); x.scale(s, s);
    x.fillStyle = U.rgba(col, 1); x.strokeStyle = U.rgba(col, 1); x.lineCap = 'round'; x.lineJoin = 'round';
    // la ceja
    x.lineWidth = 6; x.beginPath(); x.moveTo(8, 10); x.quadraticCurveTo(45, -2, 88, 12); x.stroke();
    // el ojo (almendra) con la pupila
    x.lineWidth = 5; x.beginPath(); x.moveTo(14, 30); x.quadraticCurveTo(44, 10, 74, 26); x.quadraticCurveTo(46, 44, 14, 30); x.stroke();
    x.beginPath(); x.arc(46, 28, 8.5, 0, TAU); x.fill();
    // la raya hacia atrás
    x.lineWidth = 5; x.beginPath(); x.moveTo(74, 26); x.lineTo(96, 28); x.stroke();
    // la espiral de abajo y la gota
    x.lineWidth = 5; x.beginPath(); x.moveTo(52, 38); x.quadraticCurveTo(60, 58, 74, 60); x.quadraticCurveTo(84, 58, 82, 50); x.quadraticCurveTo(78, 44, 72, 50); x.stroke();
    x.beginPath(); x.moveTo(36, 38); x.lineTo(30, 60); x.lineTo(24, 62); x.stroke();
    x.restore();
  };
  // el escarabajo alado con el sol (referencia 4): w = ancho de ala a ala; (cx, cy) = el centro del cuerpo
  ES.escarabajo = function (x, cx, cy, w, op) {
    op = op || {}; var s = w / 200;
    x.save(); x.translate(cx, cy); x.scale(s, s);
    // las alas: una hoz que sale del cuerpo y se curva hacia arriba, en bandas (lapislázuli por fuera; azul egipcio,
    // turquesa, verde y oro hacia la raíz), con las plumas en rayas finas de oro que salen de la raíz
    function ala(k, e) {   // la forma del ala derecha, encogida hacia la raíz (16, 4) en e
      var rx = 16, ry = 4, q = function (px, py) { return [rx + (px - rx) * e, ry + (py - ry) * e]; };
      var a = q(16, -6), b1 = q(34, -44), b2 = q(72, -66), t = q(104, -54), c1 = q(110, -28), c2 = q(96, 4), m = q(72, 24), d1 = q(52, 40), d2 = q(30, 30), z = q(16, 14);
      k.moveTo(a[0], a[1]); k.bezierCurveTo(b1[0], b1[1], b2[0], b2[1], t[0], t[1]);
      k.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], m[0], m[1]); k.bezierCurveTo(d1[0], d1[1], d2[0], d2[1], z[0], z[1]); k.closePath();
    }
    for (var lado = -1; lado <= 1; lado += 2) {
      x.save(); x.scale(lado, 1);
      var bandas = [[P.lapis, 1], [P.egipcio, 0.8], [P.turquesa, 0.62], [P.verde, 0.47], [P.oro2, 0.33]];
      for (var b = 0; b < bandas.length; b++) {
        x.beginPath(); ala(x, bandas[b][1]); x.fillStyle = ES.relleno(x, bandas[b][0], 20, -60, 100, 30, 0.14); x.fill();
      }
      // las plumas, recortadas al ala
      x.save(); x.beginPath(); ala(x, 1); x.clip();
      x.strokeStyle = U.rgba(P.oro2, 0.9); x.lineWidth = 1.5;
      for (var f = 0; f < 13; f++) { var an = -1.05 + f * 0.135; x.beginPath(); x.moveTo(16, 4); x.lineTo(16 + Math.cos(an) * 130, 4 + Math.sin(an) * 130); x.stroke(); }
      x.restore();
      // el canto de arriba, en oro
      x.strokeStyle = ES.oro(x, 16, -60, 100, -40, 0.4); x.lineWidth = 3;
      x.beginPath(); x.moveTo(16, -6); x.bezierCurveTo(34, -44, 72, -66, 104, -54); x.stroke();
      x.restore();
    }
    // el sol arriba y el disco de abajo
    if (op.sol !== false) ES.gema(x, 0, -58, 24);
    ES.gema(x, 0, 52, 12);
    // el cuerpo: cabeza, coselete y élitros de oro
    var cuerpo = function (k) { k.ellipse(0, 10, 22, 30, 0, 0, TAU); };
    ES.rellenar(x, cuerpo, ES.oro(x, -22, -20, 22, 40, 0.3));
    x.strokeStyle = U.rgba(P.oro4, 0.5); x.lineWidth = 1.6; x.beginPath(); x.moveTo(0, 0); x.lineTo(0, 38); x.moveTo(-20, 2); x.quadraticCurveTo(0, 6, 20, 2); x.stroke();
    ES.rellenar(x, function (k) { k.ellipse(0, -22, 14, 9, 0, 0, TAU); }, ES.oro(x, -14, -31, 14, -13, 0.35));
    ES.rellenar(x, function (k) { k.ellipse(0, -33, 10, 5, 0, 0, TAU); }, ES.oro(x, -10, -38, 10, -28, 0.4));
    // las patas delanteras que sostienen el sol
    x.strokeStyle = ES.oro(x, -30, -40, 30, 0, 0.3); x.lineWidth = 4; x.lineCap = 'round';
    x.beginPath(); x.moveTo(-10, -26); x.quadraticCurveTo(-26, -34, -16, -44); x.moveTo(10, -26); x.quadraticCurveTo(26, -34, 16, -44); x.stroke();
    // los ojos de turquesa
    x.fillStyle = U.rgba(P.turquesa, 1); x.beginPath(); x.arc(-7, -34, 2.6, 0, TAU); x.arc(7, -34, 2.6, 0, TAU); x.fill();
    x.restore();
  };

  /* ---------- el papiro gastado ----------
     Una tesela de textura que se repite (manchas claras y oscuras con borde rasgado, fibras cruzadas del papiro y grano),
     pintada una vez; ES.papiro(x, x0, y0, w, h, ox) la extiende por un rectángulo con su desfase en el mundo. */
  var texPapiro = null, TEX = 640;
  // ruido de valor en 2D que se repite cada TEX px (para que la tesela case consigo misma): octavas de rejillas de G × G
  function campo(semilla, G0, oct, gan) {
    var v = new Float32Array(TEX * TEX), amp = 1, tot = 0, r = U.azar(semilla);
    for (var o = 0; o < oct; o++) {
      var G = G0 << o, red = new Float32Array(G * G), i, px, py;
      for (i = 0; i < G * G; i++) red[i] = r();
      for (py = 0; py < TEX; py++) {
        var fy = py / TEX * G, iy = Math.floor(fy), ty = fy - iy; ty = ty * ty * (3 - 2 * ty);
        var f0 = iy * G, f1 = ((iy + 1) % G) * G;
        for (px = 0; px < TEX; px++) {
          var fx = px / TEX * G, ix = Math.floor(fx), tx = fx - ix; tx = tx * tx * (3 - 2 * tx);
          var ix1 = (ix + 1) % G, a = red[f0 + ix] + (red[f0 + ix1] - red[f0 + ix]) * tx, b = red[f1 + ix] + (red[f1 + ix1] - red[f1 + ix]) * tx;
          v[py * TEX + px] += (a + (b - a) * ty) * amp;
        }
      }
      tot += amp; amp *= gan || 0.5;
    }
    for (var k = 0; k < v.length; k++) v[k] /= tot;
    return v;
  }
  function texturaPapiro() {
    if (texPapiro) return texPapiro;
    var L = U.lienzo(TEX, TEX), x = L.x, r = U.azar(1977), i;
    x.fillStyle = U.rgba(P.papiro); x.fillRect(0, 0, TEX, TEX);
    // las fibras del papiro: tiras horizontales y verticales cruzadas, muy suaves (repetidas: cruzan el borde)
    for (i = 0; i < 80; i++) {
      var fy = r() * TEX, an2 = 0.1 + r() * 0.12, cl = r() < 0.5;
      x.fillStyle = U.rgba(cl ? [255, 246, 226] : P.papiro2, an2 * 0.6); x.fillRect(0, fy, TEX, 1 + r() * 2.5);
    }
    for (i = 0; i < 50; i++) { var fx = r() * TEX, an3 = 0.07 + r() * 0.1; x.fillStyle = U.rgba(r() < 0.5 ? [255, 246, 226] : P.papiro2, an3 * 0.5); x.fillRect(fx, 0, 1 + r() * 2, TEX); }
    // lo gastado (referencia 4): dos campos de ruido; donde uno sube mucho, la pintura se ha caído y queda más clara, con el
    // borde irregular; donde baja, una mancha ocre de suciedad. Por encima, grano fino
    var A = campo(31, 5, 5, 0.55), B = campo(77, 4, 4, 0.5), im = x.getImageData(0, 0, TEX, TEX), d = im.data;
    var claro = [254, 245, 226], oscuro = P.papiro3, medio = P.papiro2;
    for (var q = 0, n = 0; q < d.length; q += 4, n++) {
      var a = A[n], b = B[n];
      var kc = U.clamp((a - 0.6) / 0.035, 0, 1) * 0.62, ko = U.clamp((0.37 - a) / 0.03, 0, 1) * 0.22, km = U.clamp((b - 0.5) * 1.6, 0, 1) * 0.22;
      var R = d[q], Gc = d[q + 1], Bc = d[q + 2];
      R += (medio[0] - R) * km; Gc += (medio[1] - Gc) * km; Bc += (medio[2] - Bc) * km;
      R += (oscuro[0] - R) * ko; Gc += (oscuro[1] - Gc) * ko; Bc += (oscuro[2] - Bc) * ko;
      R += (claro[0] - R) * kc; Gc += (claro[1] - Gc) * kc; Bc += (claro[2] - Bc) * kc;
      var g = (r() - 0.5) * 9; d[q] = R + g; d[q + 1] = Gc + g; d[q + 2] = Bc + g * 0.8;
    }
    x.putImageData(im, 0, 0);
    // motas finas (polvo)
    for (i = 0; i < 700; i++) { x.fillStyle = U.rgba(r() < 0.5 ? P.papiro3 : [255, 248, 230], 0.1 + r() * 0.22); x.fillRect(r() * TEX, r() * TEX, 1 + r() * 1.4, 1 + r() * 1.1); }
    texPapiro = L.c;
    return texPapiro;
  }
  ES.texturaPapiro = texturaPapiro;
  // pinta papiro en (x0, y0, w, h) del contexto; ox, oy = de dónde sale la textura (para que case entre teselas)
  ES.papiro = function (x, x0, y0, w, hh, ox, oy, escala) {
    var t = texturaPapiro(), pat = x.createPattern(t, 'repeat'), s = escala || 1;
    x.save(); x.beginPath(); x.rect(x0, y0, w, hh); x.clip();
    x.translate(x0 - ((ox || 0) % (TEX * s)), y0 - ((oy || 0) % (TEX * s))); x.scale(s, s);
    x.fillStyle = pat; x.fillRect(-TEX, -TEX, (w / s) + TEX * 3, (hh / s) + TEX * 3);
    x.restore();
  };

  /* ---------- los jeroglíficos de fondo ----------
     Fórmulas y nombres de verdad (comprobados en herramientas/datos-comprobados.md), repetidos y mezclados, en columnas
     separadas por rayas, como en las paredes de las tumbas. Se dibujan con la fuente Noto Sans Egyptian Hieroglyphs
     recortada (herramientas/recortar_fuentes.py): un relleno muy suave y el contorno en ocre fino. */
  var TEXTOS = [
    '𓋹𓍑𓋴',          // ꜥnḫ wḏꜣ snb · vida, prosperidad, salud
    '𓇓𓏏𓊵𓏙',         // ḥtp dj nswt · una ofrenda que da el rey
    '𓂞𓋹',            // dj ꜥnḫ · dotado de vida
    '𓇋𓏠𓈖',          // Imn · Amón
    '𓂋𓂝𓇳',          // Rꜥ · Ra
    '𓊨𓁹',            // Wsir · Osiris
    '𓊨𓏏𓁐',          // Ꜣst · Isis
    '𓊪𓏏𓎛',          // Ptḥ · Ptah
    '𓇋𓈖𓊪𓅱𓃢',      // Inpw · Anubis
    '𓊹𓄤',            // nṯr nfr · el dios bueno
    '𓎟𓇿𓇿',          // nb tꜣwj · señor de las Dos Tierras
    '𓇓𓏏𓆤𓏏',        // nswt-bjtj · rey del Alto y del Bajo Egipto
    '𓅭𓇳',            // zꜣ Rꜥ · hijo de Ra
    '𓆣', '𓂀', '𓅃', '𓋹', '𓄤', '𓇳'
  ];
  var LETRAS = '𓄿𓇋𓂝𓅱𓃀𓊪𓆑𓅓𓈖𓂋𓉔𓎛𓐍𓋴𓈙𓈎𓎡𓏏𓂧𓆓𓀀𓁐𓊖𓏤𓏥𓈗𓇯𓆛𓃭';
  ES.TEXTOS = TEXTOS;
  ES.JERO = '"Jeroglificos", "Noto Sans Egyptian Hieroglyphs", "Segoe UI Historic", sans-serif';
  // una secuencia de signos para la columna n (siempre la misma para la misma columna)
  function secuencia(n, cuantos) {
    var r = U.azar(9001 + n * 7919), out = [];
    while (out.length < cuantos) {
      if (r() < 0.72) { var t = Array.from(TEXTOS[Math.floor(r() * TEXTOS.length)]); out.push.apply(out, t); }
      else { var l = Array.from(LETRAS); out.push(l[Math.floor(r() * l.length)]); }
    }
    return out.slice(0, cuantos);
  }
  ES.secuencia = secuencia;
  // signos anchos y bajos: van de dos en dos, uno encima del otro, como en los cuadrados de la escritura
  var PLANOS = { '𓈖': 1, '𓏏': 1, '𓂋': 1, '𓈗': 1, '𓇯': 1, '𓂝': 1, '𓊪': 1, '𓈙': 1, '𓆑': 1, '𓏙': 1, '𓊵': 1, '𓂞': 1, '𓎟': 1, '𓇿': 1, '𓏥': 1, '𓍑': 1 };
  // las columnas de jeroglíficos de un tramo del friso: x0u…x1u (u del mundo); y entre yA y yB (px de pantalla); s = px por u
  // op: { col: ancho de columna (u), tam: tamaño del signo (u), a: opacidad, raya: true, xOrigen: px de xu = 0, p }
  ES.columnas = function (x, x0u, x1u, yA, yB, s, op) {
    op = op || {};
    var cw = (op.col || 0.062), tam = (op.tam || 0.04) * s, a = op.a == null ? 0.5 : op.a, ox = op.xOrigen || 0, p = op.p || 1;
    var c0 = Math.floor(x0u / cw) - 1, c1 = Math.ceil(x1u / cw) + 1, col = op.color || P.ocre;
    x.save();
    x.font = Math.round(tam) + 'px ' + ES.JERO; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.lineJoin = 'round';
    for (var c = c0; c <= c1; c++) {
      var cx = ox + (c + 0.5) * cw * s * p, paso = tam * 1.12, n = Math.ceil((yB - yA) / paso) + 1, sig = secuencia(c, n + 4);
      // la raya que separa las columnas
      if (op.raya !== false) { x.fillStyle = U.rgba(col, a * 0.55); x.fillRect(Math.round(cx - cw * s * p / 2), yA, Math.max(1, s * 0.0016), yB - yA); }
      var y = yA + tam * 1.05, i = 0;
      while (y < yB + tam && i < sig.length) {
        var g = sig[i];
        if (PLANOS[g] && PLANOS[sig[i + 1]]) {   // dos planos en un cuadrado
          dibujarSigno(x, sig[i], cx, y - tam * 0.5, tam * 0.62, a, col); dibujarSigno(x, sig[i + 1], cx, y, tam * 0.62, a, col); i += 2;
        } else { dibujarSigno(x, g, cx, y, tam, a, col); i++; }
        y += paso;
      }
    }
    x.restore();
  };
  /* Las columnas, en tiras guardadas: pintar cientos de signos con relleno y contorno en cada tesela era lo más caro del
     taller (unos 40 ms por tesela). Cada tira se pinta una vez, a la resolución de la tesela, y luego solo se estampa. Hay
     TIRAS distintas (la columna c usa la c mod TIRAS): se repiten cada unas 2,5 u, y no se nota. */
  var TIRAS = 40, tiras = {}, nTiras = 0;
  function tira(idx, tam, alto, a, col, esc) {
    var clave = idx + '|' + Math.round(tam * 10) + '|' + Math.round(alto) + '|' + a + '|' + col.join(',') + '|' + esc, t = tiras[clave];
    if (t) return t;
    if (nTiras > 320) { tiras = {}; nTiras = 0; }
    var w = Math.ceil(tam * 1.7), L = U.lienzo(w * esc, (alto + tam * 0.4) * esc), x = L.x;
    x.scale(esc, esc); x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.lineJoin = 'round';
    var paso = tam * 1.12, n = Math.ceil(alto / paso) + 1, sig = secuencia(idx, n + 4), y = tam * 1.05, i = 0, cx = w / 2;
    while (y < alto + tam * 0.3 && i < sig.length) {
      var g = sig[i];
      if (PLANOS[g] && PLANOS[sig[i + 1]]) { dibujarSigno(x, sig[i], cx, y - tam * 0.5, tam * 0.62, a, col); dibujarSigno(x, sig[i + 1], cx, y, tam * 0.62, a, col); i += 2; }
      else { dibujarSigno(x, g, cx, y, tam, a, col); i++; }
      y += paso;
    }
    t = tiras[clave] = { c: L.c, w: w, h: alto + tam * 0.4, nueva: true }; nTiras++;
    return t;
  }
  ES.olvidarTiras = function () { tiras = {}; nTiras = 0; };
  // una columna del fondo, estampada desde su tira; devuelve true si la tira se acaba de pintar (para que el taller haga
  // una pausa). op: como en ES.columnas, más esc (la resolución del lienzo respecto a los px CSS)
  ES.columna = function (x, c, yA, yB, s, op) {
    var cw = (op.col || 0.062), tam = (op.tam || 0.04) * s, a = op.a == null ? 0.5 : op.a, ox = op.xOrigen || 0, p = op.p || 1, col = op.color || P.ocre;
    var cx = ox + (c + 0.5) * cw * s * p;
    if (op.raya !== false) { x.fillStyle = U.rgba(col, a * 0.55); x.fillRect(Math.round(cx - cw * s * p / 2), yA, Math.max(1, s * 0.0016), yB - yA); }
    var t = tira(((c % TIRAS) + TIRAS) % TIRAS, tam, yB - yA, a, col, op.esc || 1), nueva = t.nueva;
    t.nueva = false;
    x.drawImage(t.c, cx - t.w / 2, yA, t.w, t.h);
    return nueva;
  };
  ES.rangoColumnas = function (x0u, x1u, op) { var cw = (op.col || 0.062); return [Math.floor(x0u / cw) - 1, Math.ceil(x1u / cw) + 1]; };
  function dibujarSigno(x, g, cx, y, tam, a, col) {
    x.font = Math.round(tam) + 'px ' + ES.JERO;
    x.fillStyle = U.rgba(ES.aclarar(P.papiro, 0.35), a * 0.55); x.fillText(g, cx, y);
    x.lineWidth = Math.max(0.7, tam * 0.03); x.strokeStyle = U.rgba(col, a); x.strokeText(g, cx, y);
  }
  ES.signo = dibujarSigno;
})();

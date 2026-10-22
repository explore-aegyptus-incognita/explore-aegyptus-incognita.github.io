/* Aegyptus Incognita · arte · figuras
   Los dioses y los personajes del friso, al modo egipcio (cabeza y piernas de perfil, hombros y ojo de frente) y con el
   acabado de las referencias 2 y 4 de Pau: sin contornos, piel terracota con su degradado, lino blanco plisado, collares
   usej de bandas, oro con brillo y las cabezas animales negras con reflejos o con plumas pintadas.
   Cada pieza: AE.arte.<nombre> = { ancho, alto, abajo, dibujar(ctx, x, y, s, op) }; (x, y) = entre los pies, en el suelo.
   Por dentro todo se dibuja en «milésimas de u» (1 = 0,001 u), mirando a la derecha; op.espejo lo da la vuelta.
   Sobre el contexto que llega solo se usa save/translate/scale/rotate/clip/restore y source-over. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, TAU = Math.PI * 2;
  AE.arte = AE.arte || {};

  /* =====================================================================================================================
     1. Herramientas
     ===================================================================================================================== */
  var DEV = AE.arte._dev = {};   // (para medir: apagar partes)
  var X = null;     // el contexto donde se dibuja ahora
  var DIR = 1;      // 1: mira a la derecha; −1: en espejo (los degradados se giran para que la luz siga arriba a la izquierda)

  // una curva suave que pasa por los puntos [[x, y], …] (Catmull-Rom con tangentes según la cuerda, pasada a Bézier);
  // un punto [x, y, 1] es una esquina
  function curva(k, p, cerrado) {
    var n = p.length, i;
    if (n < 2) return;
    k.moveTo(p[0][0], p[0][1]);
    var tramos = cerrado ? n : n - 1;
    for (i = 0; i < tramos; i++) {
      var a = p[i], b = p[(i + 1) % n];
      var pa = cerrado ? p[(i - 1 + n) % n] : p[Math.max(0, i - 1)];
      var pb = cerrado ? p[(i + 2) % n] : p[Math.min(n - 1, i + 2)];
      var dab = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6;
      var c1x, c1y, c2x, c2y;
      if (a[2] || pa === a) { c1x = a[0] + (b[0] - a[0]) / 3; c1y = a[1] + (b[1] - a[1]) / 3; }
      else {
        var dpa = Math.hypot(a[0] - pa[0], a[1] - pa[1]) || 1e-6, fa = dab / (dpa + dab) / 3;
        c1x = a[0] + (b[0] - pa[0]) * fa; c1y = a[1] + (b[1] - pa[1]) * fa;
      }
      if (b[2] || pb === b) { c2x = b[0] - (b[0] - a[0]) / 3; c2y = b[1] - (b[1] - a[1]) / 3; }
      else {
        var dbp = Math.hypot(pb[0] - b[0], pb[1] - b[1]) || 1e-6, fb = dab / (dab + dbp) / 3;
        c2x = b[0] - (pb[0] - a[0]) * fb; c2y = b[1] - (pb[1] - a[1]) * fb;
      }
      k.bezierCurveTo(c1x, c1y, c2x, c2y, b[0], b[1]);
    }
    if (cerrado) k.closePath();
  }
  // el camino de una forma (con su caja pegada, para que las luces y sombras solo pinten donde hace falta)
  function camino(p) { var fn = function (k) { curva(k, p, true); }; fn.caja = caja(p); return fn; }
  function rellena(p, estilo) { X.beginPath(); curva(X, p, true); X.fillStyle = estilo; X.fill(); }
  function caja(p) {
    var a = 1e9, b = 1e9, c = -1e9, d = -1e9;
    for (var i = 0; i < p.length; i++) { var q = p[i]; if (q[0] < a) a = q[0]; if (q[0] > c) c = q[0]; if (q[1] < b) b = q[1]; if (q[1] > d) d = q[1]; }
    return [a, b, c, d];
  }
  function recortar(fn) { X.save(); X.beginPath(); fn(X); if (!DEV.sinClip) X.clip(); }
  function soltar() { X.restore(); }
  function col(c, a) { return U.rgba(c, a == null ? 1 : a); }

  /* ---------- degradados que siguen la luz (arriba a la izquierda, también en espejo) ---------- */
  function gx(x0, x1) { return DIR > 0 ? [x0, x1] : [x1, x0]; }
  function rel(c, x0, y0, x1, y1, k) { var g = gx(x0, x1); return ES.relleno(X, c, g[0], y0, g[1], y1, k); }
  // el relleno de una forma según su caja: más claro arriba a la izquierda ('v' solo de arriba abajo, 'h' de izquierda a derecha)
  function relP(c, p, k, modo) {
    var b = caja(p);
    if (modo === 'v') return rel(c, (b[0] + b[2]) / 2, b[1], (b[0] + b[2]) / 2, b[3], k);
    if (modo === 'h') return rel(c, b[0], (b[1] + b[3]) / 2, b[2], (b[1] + b[3]) / 2, k);
    return rel(c, b[0], b[1], b[2], b[3], k);
  }
  function oro(x0, y0, x1, y1, luz) { var g = gx(x0, x1); return ES.oro(X, g[0], y0, g[1], y1, luz); }
  function negro(x0, y0, x1, y1) { var g = gx(x0, x1); return ES.negro(X, g[0], y0, g[1], y1); }
  function lin(x0, y0, x1, y1, paradas) { var g = gx(x0, x1); return ES.lin(X, g[0], y0, g[1], y1, paradas); }
  /* el brillo y la sombra interior de ES (estilo.js), pero rellenando solo la caja de la forma: ES.brillo rellena 4000 × 4000
     unidades recortadas, y en una figura con cien formas eso es lo que más cuesta */
  function rectDe(fn, x0, y0, x1, y1) {
    var b = fn.caja;
    if (b) return [b[0] - 1, b[1] - 1, b[2] - b[0] + 2, b[3] - b[1] + 2];
    var m = 160; return [Math.min(x0, x1) - m, Math.min(y0, y1) - m, Math.abs(x1 - x0) + 2 * m, Math.abs(y1 - y0) + 2 * m];
  }
  function brillo(fn, x0, y0, x1, y1, a, c) {
    if (DEV.sinBrillo) return;
    var g = gx(x0, x1), cc = c || [255, 255, 255], r = rectDe(fn, x0, y0, x1, y1);
    X.save(); X.beginPath(); fn(X); X.clip();
    X.fillStyle = ES.lin(X, g[0], y0, g[1], y1, [[0, cc, 0], [0.45, cc, a == null ? 0.35 : a], [1, cc, 0]]);
    X.fillRect(r[0], r[1], r[2], r[3]);
    X.restore();
  }
  function sombra(fn, x0, y0, x1, y1, a, c) {
    if (DEV.sinSombra) return;
    var g = gx(x0, x1), cc = c || [40, 20, 6], r = rectDe(fn, x0, y0, x1, y1);
    X.save(); X.beginPath(); fn(X); X.clip();
    X.fillStyle = ES.lin(X, g[0], y0, g[1], y1, [[0, cc, 0], [1, cc, a == null ? 0.25 : a]]);
    X.fillRect(r[0], r[1], r[2], r[3]);
    X.restore();
  }
  // un radial con el foco arriba a la izquierda
  function radial(cx, cy, r, paradas) { return ES.rad(X, cx, cy, 0, r, paradas, cx - DIR * r * 0.35, cy - r * 0.4); }
  // un color en tres tonos (luz, medio, sombra) a lo largo de un eje
  function tono(c, x0, y0, x1, y1, k) { return rel(c, x0, y0, x1, y1, k == null ? 0.18 : k); }

  // un haz de líneas finas recortado a una forma (pliegues, mechones, rayas)
  function lineas(fnClip, segs, c, a, ancho, cap) {
    if (DEV.sinLineas) return;
    if (fnClip) recortar(fnClip);
    X.strokeStyle = col(c, a); X.lineWidth = ancho; X.lineCap = cap || 'round';
    X.beginPath();
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (s.length === 4) { X.moveTo(s[0], s[1]); X.lineTo(s[2], s[3]); }
      else if (s.length === 6) { X.moveTo(s[0], s[1]); X.quadraticCurveTo(s[2], s[3], s[4], s[5]); }
      else { X.moveTo(s[0], s[1]); X.bezierCurveTo(s[2], s[3], s[4], s[5], s[6], s[7]); }
    }
    X.stroke();
    if (fnClip) soltar();
  }

  /* ---------- los colores (todos mezclados de la paleta) ---------- */
  var C = {
    pielLejos: U.mezcla(P.piel, P.piel2, 0.5),
    pielMLejos: U.mezcla(P.pielM, P.piel, 0.5),
    luzPiel: [255, 206, 158],
    labio: U.mezcla(P.piel2, P.cornalina, 0.35),
    pliegue: U.mezcla(P.lino2, P.tinta, 0.22),
    reflejo: U.mezcla(P.negro2, P.egipcio, 0.35),
    kohl: U.mezcla(P.negro, P.tinta, 0.3),
    blancoOjo: U.mezcla(P.lino, [255, 255, 255], 0.4),
    iris: U.mezcla(P.tinta, P.negro, 0.45),
    verde: U.mezcla(P.verde, P.turquesa, 0.22), verde2: U.mezcla(P.verde, P.negro, 0.4),
    lapisClaro: U.mezcla(P.lapis, P.egipcio, 0.55),
    lavanda: U.mezcla(P.egipcio, P.lino, 0.28),
    menta: U.mezcla(P.turquesa, P.lino, 0.6),
    gris: U.mezcla(P.negro2, P.lino2, 0.45),
    canto: U.mezcla(P.piedra2, P.tinta, 0.2)
  };
  // la piel: el tono, su sombra y su luz
  var PIEL = { c: P.piel, c2: P.piel2, luz: C.luzPiel };
  var PIEL_M = { c: P.pielM, c2: U.mezcla(P.pielM, P.piel2, 0.5), luz: [255, 220, 176] };
  var PIEL_V = { c: C.verde, c2: C.verde2, luz: [210, 255, 214] };

  /* ---------- la transformación de cada pieza ---------- */
  // abre el dibujo: (x, y) el ancla, s px por u; dentro, 1 unidad = 0,001 u y +x es hacia donde mira
  function empezar(ctx, x, y, s, op) {
    X = ctx; DIR = op && op.espejo ? -1 : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(s / 1000 * DIR, s / 1000);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  }
  function acabar() { X.restore(); }

  /* =====================================================================================================================
     2. Miembros: el contorno a lo largo de los huesos
     hu = [[x, y], …] las articulaciones; g = [[f, izq, der], …]: a la fracción f del largo, lo que sale a cada lado
     (izq = a la izquierda del sentido de avance: en una pierna que baja mirando a +x, es la espinilla)
     ===================================================================================================================== */
  function huesos(hu) {
    var L = [0];
    for (var i = 1; i < hu.length; i++) L.push(L[i - 1] + Math.hypot(hu[i][0] - hu[i - 1][0], hu[i][1] - hu[i - 1][1]));
    return { hu: hu, L: L, tot: L[L.length - 1] || 1 };
  }
  function enHueso(H, f) {
    var d = U.clamp(f, 0, 1) * H.tot, i = 1, n = H.hu.length;
    while (i < n - 1 && H.L[i] < d) i++;
    var a = H.hu[i - 1], b = H.hu[i], seg = (H.L[i] - H.L[i - 1]) || 1e-6, t = (d - H.L[i - 1]) / seg;
    var dx = (b[0] - a[0]) / seg, dy = (b[1] - a[1]) / seg, R = 7, w;
    // cerca de una articulación, la dirección se mezcla con la del hueso de al lado (el contorno no se quiebra)
    if (i > 1 && d - H.L[i - 1] < R) {
      var a0 = H.hu[i - 2], s0 = (H.L[i - 1] - H.L[i - 2]) || 1e-6; w = 0.5 * (1 - (d - H.L[i - 1]) / R);
      dx = dx * (1 - w) + (a[0] - a0[0]) / s0 * w; dy = dy * (1 - w) + (a[1] - a0[1]) / s0 * w;
    }
    if (i < n - 1 && H.L[i] - d < R) {
      var b1 = H.hu[i + 1], s1 = (H.L[i + 1] - H.L[i]) || 1e-6; w = 0.5 * (1 - (H.L[i] - d) / R);
      dx = dx * (1 - w) + (b1[0] - b[0]) / s1 * w; dy = dy * (1 - w) + (b1[1] - b[1]) / s1 * w;
    }
    var m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, dx: dx, dy: dy, nx: dy, ny: -dx };
  }
  function contornoMiembro(H, g) {
    var iz = [], de = [];
    for (var j = 0; j < g.length; j++) {
      var e = enHueso(H, g[j][0]);
      iz.push([e.x + e.nx * g[j][1], e.y + e.ny * g[j][1]]);
      de.push([e.x - e.nx * g[j][2], e.y - e.ny * g[j][2]]);
    }
    iz[0][2] = 1; iz[iz.length - 1][2] = 1; de[0][2] = 1; de[de.length - 1][2] = 1;
    return iz.concat(de.reverse());
  }
  function anchoEn(g, f) {
    for (var j = 1; j < g.length; j++) if (g[j][0] >= f) { var t = (f - g[j - 1][0]) / ((g[j][0] - g[j - 1][0]) || 1); return [U.lerp(g[j - 1][1], g[j][1], t), U.lerp(g[j - 1][2], g[j][2], t)]; }
    return [g[g.length - 1][1], g[g.length - 1][2]];
  }
  // una banda (brazalete, tobillera) alrededor de un miembro, entre f0 y f1; abomba un poco hacia abajo
  function bandaMiembro(H, g, f0, f1, extra) {
    var a = enHueso(H, f0), b = enHueso(H, f1), wa = anchoEn(g, f0), wb = anchoEn(g, f1), cur = (f1 - f0) * H.tot * 0.3, e = extra == null ? 0.45 : extra;
    var A1 = [a.x + a.nx * (wa[0] + e), a.y + a.ny * (wa[0] + e)], A2 = [a.x - a.nx * (wa[1] + e), a.y - a.ny * (wa[1] + e)];
    var B1 = [b.x + b.nx * (wb[0] + e), b.y + b.ny * (wb[0] + e)], B2 = [b.x - b.nx * (wb[1] + e), b.y - b.ny * (wb[1] + e)];
    return function (k) {
      k.moveTo(A1[0], A1[1]);
      k.quadraticCurveTo((A1[0] + A2[0]) / 2 + a.dx * cur, (A1[1] + A2[1]) / 2 + a.dy * cur, A2[0], A2[1]);
      k.lineTo(B2[0], B2[1]);
      k.quadraticCurveTo((B1[0] + B2[0]) / 2 + b.dx * cur, (B1[1] + B2[1]) / 2 + b.dy * cur, B1[0], B1[1]);
      k.closePath();
    };
  }

  // perfiles de grosor (en unidades)
  var G_PIERNA = [[0, 11.5, 12.5], [0.15, 9.6, 10.2], [0.3, 7.4, 7.6], [0.37, 7.6, 6.4], [0.43, 6.4, 6.6], [0.55, 5.5, 8.4], [0.68, 4.9, 7.2], [0.82, 3.9, 4.8], [0.93, 3.4, 3.6], [1, 3.9, 4]];
  var G_BRAZO = [[0, 7.2, 7.2], [0.12, 7.2, 6.6], [0.36, 5.6, 5.3], [0.48, 4.7, 4.7], [0.58, 5.1, 5.2], [0.78, 4.1, 4.2], [0.93, 3.4, 3.5], [1, 3.3, 3.4]];
  var G_BRAZO_M = [[0, 5.8, 5.8], [0.12, 5.8, 5.3], [0.36, 4.4, 4.2], [0.48, 3.8, 3.8], [0.58, 4, 4.1], [0.78, 3.3, 3.4], [0.93, 2.8, 2.9], [1, 2.7, 2.8]];

  // el color base de un relleno de piel (los degradados de piel llevan su color pegado: g.base)
  function basePiel(estilo, pl, oscuro) { return (estilo && estilo.base) || (oscuro ? U.mezcla(pl.c, pl.c2, 0.5) : pl.c); }
  function tonoPiel(c, x0, y0, x1, y1, k) { var g = rel(c, x0, y0, x1, y1, k); g.base = c; return g; }
  // la dirección de la luz en el marco de la figura (arriba a la izquierda de la pantalla)
  function luzLocal() { return [-DIR * 0.7071, -0.7071]; }
  /* un miembro de piel: un solo degradado de lado a lado, perpendicular al hueso: la luz en el filo que mira a la luz (como
     las piernas de la ref. 4), el tono en medio y la sombra en el otro filo. Sin recortes: es lo que más se repite */
  function miembroPiel(H, g, estilo, pl, op) {
    op = op || {};
    var p = contornoMiembro(H, g), fn = camino(p), c = basePiel(estilo, pl, op.oscuro);
    var h0 = H.hu[0], h1 = H.hu[H.hu.length - 1], dx = h1[0] - h0[0], dy = h1[1] - h0[1], m = Math.hypot(dx, dy) || 1;
    var nx = -dy / m, ny = dx / m, L = luzLocal();
    if (nx * L[0] + ny * L[1] < 0) { nx = -nx; ny = -ny; }
    var w = 0; for (var i = 0; i < g.length; i++) w = Math.max(w, g[i][1], g[i][2]);
    // el centro: a media altura del miembro (en una pierna doblada, el punto medio de la rodilla)
    var e = enHueso(H, 0.5), cx = e.x, cy = e.y;
    var luz = U.mezcla(c, pl.luz, op.oscuro ? 0.16 : 0.3), som = U.mezcla(c, pl.c2, op.oscuro ? 0.42 : 0.34);
    X.beginPath(); fn(X);
    X.fillStyle = ES.lin(X, cx + nx * w, cy + ny * w, cx - nx * w, cy - ny * w, [[0, luz], [0.3, c], [0.62, c], [1, som]]);
    X.fill();
    return p;
  }

  /* ---------- el pie, de perfil, mirando a +x: (xT = el talón, en el suelo), en cuña como en la ref. 4 ---------- */
  function pie(xT, largo, estilo, pl, op) {
    op = op || {}; var L = largo / 40, y0 = op.y || 0;
    var p = [[xT + 2.4 * L, y0, 1], [xT + 38.8 * L, y0], [xT + 40.6 * L, y0 - 1 * L], [xT + 39.4 * L, y0 - 2.4 * L], [xT + 35.4 * L, y0 - 3 * L], [xT + 24 * L, y0 - 6.2 * L],
      [xT + 14 * L, y0 - 10.2 * L], [xT + 11.4 * L, y0 - 14 * L, 1], [xT + 3.6 * L, y0 - 14 * L, 1], [xT + 2.2 * L, y0 - 8.6 * L], [xT + 0.1 * L, y0 - 4 * L], [xT + 0.6 * L, y0 - 1.2 * L]];
    var c = basePiel(estilo, pl, op.oscuro), luz = U.mezcla(c, pl.luz, op.oscuro ? 0.18 : 0.34), som = U.mezcla(c, pl.c2, 0.38);
    X.beginPath(); curva(X, p, true);
    X.fillStyle = lin(xT, y0 - 15 * L, xT + 30 * L, y0 + 4 * L, [[0, luz], [0.35, c], [1, som]]); X.fill();
    // la planta: un filo oscuro; el dedo gordo, una línea finísima
    X.strokeStyle = col(pl.c2, 0.5); X.lineWidth = 0.9; X.lineCap = 'round';
    X.beginPath(); X.moveTo(xT + 3 * L, y0 - 0.45); X.lineTo(xT + 38 * L, y0 - 0.45); X.stroke();
    X.strokeStyle = col(pl.c2, 0.4); X.lineWidth = 0.5; X.beginPath(); X.moveTo(xT + 33 * L, y0 - 2.9 * L); X.quadraticCurveTo(xT + 36 * L, y0 - 1.6 * L, xT + 39.5 * L, y0 - 1.5 * L); X.stroke();
    return p;
  }

  /* ---------- las manos ---------- */
  // mano en su marco: el origen en la muñeca, +x hacia los dedos, lado = ±1 (de qué lado queda el pulgar)
  var MANOS = {
    abierta: { forma: [[-0.5, -3.3, 1], [4, -3.8], [9.4, -4], [14.4, -3.7], [17.8, -2.7], [19.2, -1.1], [19, 0.7], [17.2, 2], [12.4, 3.1], [8, 3.8], [3.5, 3.6], [-0.5, 3.3, 1]],
      pulgar: [[2.4, -3], [5, -5.6], [7.8, -8], [9.6, -8.6], [10.2, -7.6], [8.6, -5.3], [6.8, -3.2]],
      rayas: [[10.6, -1.7, 17.6, -1.4], [10.8, 0, 18.4, 0.1], [10.6, 1.6, 17, 1.6]] },
    // la mano que sujeta algo fino (el cálamo, una cuerda): dedos doblados a medias, el índice estirado
    pinza: { forma: [[-0.5, -3.4, 1], [4.4, -4.2], [9.4, -4.4], [13.6, -3.9], [16.2, -3.2], [16.6, -2], [14.8, -1.4], [13.2, -0.4], [12.6, 2], [10.4, 3.6], [6, 4.2], [1.4, 3.8], [-0.5, 3.4, 1]],
      pulgar: [[3, -3.6], [6.4, -6], [10.4, -6.6], [12.8, -5.6], [12.6, -4.6], [9.4, -4], [6.6, -3.4]],
      rayas: [[10, -1.6, 12.6, -0.2], [9.2, 1, 11.4, 2.6]] }
  };
  MANOS.senala = { forma: [[-0.5, -3.4, 1], [4.4, -4.2], [9.4, -4.4], [13.4, -3.8], [20.4, -3.4], [22.4, -2.4], [21.6, -1.2], [14, -0.8], [13.6, 2], [11, 3.8], [6, 4.2], [1.4, 3.8], [-0.5, 3.4, 1]],
    pulgar: [[3, -3.6], [6.6, -6], [10.6, -6.4], [12.6, -5], [10.6, -4], [7.4, -3.4]],
    rayas: [[13.6, -2.2, 13.6, 2.4], [10, -0.6, 12, 3.2]] };
  function mano(tipo, wx, wy, ang, lado, estilo, pl, escala) {
    var M = MANOS[tipo], k = escala || 1;
    X.save(); X.translate(wx, wy); X.rotate(ang); X.scale(k, k * (lado || 1));
    var fn = camino(M.forma), fp = camino(M.pulgar), c = basePiel(estilo, pl);
    var g = ES.lin(X, 0, -5, 0, 5, [[0, U.mezcla(c, pl.luz, 0.22)], [0.45, c], [1, U.mezcla(c, pl.c2, 0.4)]]);
    X.beginPath(); fn(X); X.fillStyle = g; X.fill();
    X.beginPath(); fp(X); X.fillStyle = g; X.fill();
    X.strokeStyle = col(pl.c2, 0.5); X.lineWidth = 0.5; X.beginPath();
    for (var i = 0; i < M.rayas.length; i++) { var r = M.rayas[i]; X.moveTo(r[0], r[1]); X.lineTo(r[2], r[3]); }
    X.stroke();
    // la separación del pulgar
    X.strokeStyle = col(pl.c2, 0.45); X.lineWidth = 0.6; X.beginPath(); X.moveTo(M.pulgar[0][0] + 0.6, M.pulgar[0][1] + 0.4); X.quadraticCurveTo(M.pulgar[5][0], M.pulgar[5][1] + 0.6, M.pulgar[4][0] - 0.6, M.pulgar[4][1] + 0.8); X.stroke();
    X.restore();
  }
  /* el puño que agarra una vara que lo cruza en (gx, gy): la mano une la muñeca (wx, wy) con el puño; el pulgar, arriba;
     las falanges, por delante. abajo = true si el puño cuelga (el pulgar queda delante) */
  function puno(gx, gy, wx, wy, estilo, pl, op) {
    op = op || {};
    var k = op.k || 1;
    X.save(); X.translate(gx, gy); X.scale(k, k);
    var dx = (wx - gx) / k, dy = (wy - gy) / k, m = Math.hypot(dx, dy) || 1, nx = -dy / m * 3.2, ny = dx / m * 3.2;
    // el dorso: de la muñeca al puño
    var dorso = [[dx + nx, dy + ny, 1], [dx * 0.4 + nx * 1.5, dy * 0.4 + ny * 1.5], [-1, -4.6], [3, -5.2], [5.4, -3], [5.8, 0.8], [4.6, 4.6], [0.6, 5.8], [-4.2, 4.8], [dx * 0.4 - nx * 1.5, dy * 0.4 - ny * 1.5], [dx - nx, dy - ny, 1]];
    var fn = camino(dorso), c = basePiel(estilo, pl, op.oscuro);
    X.beginPath(); fn(X); X.fillStyle = ES.lin(X, -6, -6, 6, 6, [[0, U.mezcla(c, pl.luz, 0.26)], [0.5, c], [1, U.mezcla(c, pl.c2, 0.32)]]); X.fill();
    // las falanges: tres dedos doblados por delante
    X.strokeStyle = col(pl.c2, 0.55); X.lineWidth = 0.55;
    X.beginPath(); X.moveTo(1.6, -2); X.quadraticCurveTo(4, -2.6, 5.6, -1.7); X.moveTo(1.4, 0.8); X.quadraticCurveTo(4, 0.2, 5.8, 1.1); X.moveTo(1, 3.4); X.quadraticCurveTo(3.4, 3, 5.2, 3.7); X.stroke();
    // el pulgar, encima, que se cierra sobre la vara
    var pul = op.abajo ? [[-3.6, -3.2], [0.4, -5.6], [4.6, -5.6], [6.6, -3.6], [5.6, -2.2], [2.2, -3.2], [-1.6, -1.6]]
      : [[-4.4, -3.4], [-1.4, -6.4], [3, -7.2], [5.6, -6], [5, -4.4], [1.6, -4.4], [-2, -2.6]];
    rellena(pul, ES.lin(X, -4, -7, 5, -2, [[0, U.mezcla(c, pl.luz, 0.3)], [1, c]]));
    X.strokeStyle = col(pl.c2, 0.5); X.lineWidth = 0.5; X.beginPath(); X.moveTo(pul[6][0], pul[6][1]); X.quadraticCurveTo(pul[5][0] - 1, pul[5][1] + 0.4, pul[4][0], pul[4][1]); X.stroke();
    X.restore();
  }

  /* =====================================================================================================================
     3. Joyas, telas y objetos
     ===================================================================================================================== */
  // un brazalete de oro en un miembro (f0…f1 a lo largo); con una franja de color (ref. 4: lapislázuli, cornalina)
  function brazalete(H, g, f0, f1, op) {
    op = op || {};
    if (DEV.sinBrazaletes) return;
    var fn = bandaMiembro(H, g, f0, f1), a = enHueso(H, f0), b = enHueso(H, f1), w = 8;
    X.beginPath(); fn(X); X.fillStyle = oro(a.x - w, a.y - w, b.x + w, b.y + w, 0.36); X.fill();
    if (op.color) {
      var fm = bandaMiembro(H, g, U.lerp(f0, f1, 0.3), U.lerp(f0, f1, 0.7), 0.5);
      X.beginPath(); fm(X); X.fillStyle = lin(a.x - w, a.y, b.x + w, b.y, [[0, ES.aclarar(op.color, 0.25)], [1, ES.oscurecer(op.color, 0.15)]]); X.fill();
    }
    // los filos y las rayas del oro batido, sin salirse (líneas dentro de la banda), y el reflejo
    var c = enHueso(H, (f0 + f1) / 2), wa = anchoEn(g, (f0 + f1) / 2), d0 = U.lerp(f0, f1, 0.1), d1 = U.lerp(f0, f1, 0.9);
    var e0 = enHueso(H, d0), e1 = enHueso(H, d1), w0 = anchoEn(g, d0), w1 = anchoEn(g, d1);
    X.strokeStyle = col(P.oro4, 0.45); X.lineWidth = 0.45; X.beginPath();
    X.moveTo(e0.x + e0.nx * w0[0], e0.y + e0.ny * w0[0]); X.lineTo(e0.x - e0.nx * w0[1], e0.y - e0.ny * w0[1]);
    X.moveTo(e1.x + e1.nx * w1[0], e1.y + e1.ny * w1[0]); X.lineTo(e1.x - e1.nx * w1[1], e1.y - e1.ny * w1[1]);
    if (!op.color) {
      var tot = wa[0] + wa[1], n = Math.max(3, Math.round(tot / 2.2));
      for (var i = 1; i < n; i++) { var o = -wa[1] + tot * i / n; X.moveTo(e0.x + e0.nx * o, e0.y + e0.ny * o); X.lineTo(e1.x + e1.nx * o, e1.y + e1.ny * o); }
    }
    X.stroke();
    var oL = wa[0] * 0.45;
    X.strokeStyle = col([255, 252, 220], 0.7); X.lineWidth = 0.7; X.beginPath();
    X.moveTo(e0.x + e0.nx * oL, e0.y + e0.ny * oL); X.lineTo(e1.x + e1.nx * oL, e1.y + e1.ny * oL); X.stroke();
  }

  // una gema de cornalina con su aro de oro
  function gema(cx, cy, r, c, aro) {
    c = c || P.cornalina;
    if (aro !== false) { X.beginPath(); X.arc(cx, cy, r * 1.18, 0, TAU); X.fillStyle = oro(cx - r, cy - r, cx + r, cy + r, 0.28); X.fill(); }
    X.beginPath(); X.arc(cx, cy, r, 0, TAU);
    X.fillStyle = radial(cx, cy, r, [[0, ES.aclarar(c, 0.38)], [0.55, c], [1, ES.oscurecer(c, 0.3)]]); X.fill();
    X.beginPath(); X.ellipse(cx - DIR * r * 0.15, cy - r * 0.48, r * 0.5, r * 0.2, -0.25 * DIR, 0, TAU); X.fillStyle = col([255, 232, 205], 0.4); X.fill();
  }

  /* el collar usej: bandas de color separadas por rayas de oro y cuentas en gota (de los hombros de frente)
     (cx, cy) el centro del cuello; rx, ry el radio de fuera; rIn la fracción del hueco; bandas de dentro afuera */
  function collar(cx, cy, rx, ry, rIn, bandas, op) {
    op = op || {};
    if (DEV.sinCollar) return;
    var n = bandas.length, paso = (1 - rIn) / n, i;
    function anillo(k, f0, f1) {
      k.ellipse(cx, cy, rx * f1, ry * f1, 0, 0, Math.PI, false);
      k.ellipse(cx, cy, rx * f0, ry * f0, 0, Math.PI, 0, true);
      k.closePath();
    }
    // las cuentas en gota del borde, agrupadas por color (un relleno por color)
    if (op.gotas !== false) {
      var ng = op.ngotas || 17, L = op.gota || 3, wg = L * 0.42, cols = op.colGotas || [P.cornalina, 'oro', P.turquesa, 'oro'];
      for (var cg = 0; cg < cols.length; cg++) {
        if (cols.indexOf(cols[cg]) !== cg) continue;   // cada color una vez
        X.beginPath();
        for (i = 0; i < ng; i++) {
          if (cols[i % cols.length] !== cols[cg]) continue;
          var an = (i + 0.5) / ng * Math.PI, g0x = cx + Math.cos(an) * rx * 0.985, g0y = cy + Math.sin(an) * ry * 0.985;
          var nx = Math.cos(an) / rx, ny = Math.sin(an) / ry, m = Math.hypot(nx, ny); nx /= m; ny /= m;
          X.moveTo(g0x - ny * wg * 0.7, g0y + nx * wg * 0.7);
          X.bezierCurveTo(g0x + nx * L * 0.7 - ny * wg * 1.3, g0y + ny * L * 0.7 + nx * wg * 1.3, g0x + nx * L * 1.1 - ny * wg * 0.4, g0y + ny * L * 1.1 + nx * wg * 0.4, g0x + nx * L * 1.15, g0y + ny * L * 1.15);
          X.bezierCurveTo(g0x + nx * L * 1.1 + ny * wg * 0.4, g0y + ny * L * 1.1 - nx * wg * 0.4, g0x + nx * L * 0.7 + ny * wg * 1.3, g0y + ny * L * 0.7 - nx * wg * 1.3, g0x + ny * wg * 0.7, g0y - nx * wg * 0.7);
          X.closePath();
        }
        X.fillStyle = cols[cg] === 'oro' ? oro(cx - rx, cy, cx + rx, cy + ry + L, 0.35) : lin(cx - rx, cy, cx + rx, cy + ry + L, [[0, ES.aclarar(cols[cg], 0.25)], [1, ES.oscurecer(cols[cg], 0.15)]]);
        X.fill();
      }
    }
    for (i = 0; i < n; i++) {
      var f0 = rIn + i * paso, f1 = f0 + paso, c = bandas[i];
      X.beginPath(); anillo(X, f0, f1);
      if (c === 'oro') X.fillStyle = oro(cx - rx, cy - 2, cx + rx * 0.4, cy + ry, 0.42);
      else X.fillStyle = lin(cx - rx, cy, cx + rx, cy + ry, [[0, ES.aclarar(c, 0.22)], [0.6, c], [1, ES.oscurecer(c, 0.2)]]);
      X.fill();
      // cuentas: puntitos en las bandas de color
      if (op.cuentas && c !== 'oro') {
        var rr = (f0 + f1) / 2, nb = Math.round((op.densidad || 1) * (12 + rr * 22));
        X.fillStyle = col(op.cuentas, 0.8);
        X.beginPath();
        for (var j = 0; j < nb; j++) { var a2 = (j + 0.5) / nb * Math.PI, px = cx + Math.cos(a2) * rx * rr, py = cy + Math.sin(a2) * ry * rr; X.moveTo(px + paso * ry * 0.2, py); X.arc(px, py, paso * ry * 0.2, 0, TAU); }
        X.fill();
      }
    }
    // las rayas finas de oro entre las bandas
    X.strokeStyle = oro(cx - rx, cy, cx + rx, cy + ry, 0.4); X.lineWidth = Math.max(0.4, paso * ry * 0.13);
    X.beginPath();
    for (i = 0; i <= n; i++) { var f = rIn + i * paso; X.moveTo(cx + rx * f, cy); X.ellipse(cx, cy, rx * f, ry * f, 0, 0, Math.PI, false); }
    X.stroke();
    // la luz arriba a la izquierda y la sombra abajo a la derecha, en un solo recorte
    X.save(); X.beginPath(); anillo(X, rIn, 1); X.clip();
    var gl = gx(cx - rx, cx - rx * 0.1), gs = gx(cx, cx + rx * 0.7);
    X.fillStyle = ES.lin(X, gl[0], cy - 2, gl[1], cy + ry, [[0, [255, 255, 255], 0], [0.45, [255, 255, 255], 0.2], [1, [255, 255, 255], 0]]); X.fillRect(cx - rx, cy - 1, rx * 2, ry + 1);
    X.fillStyle = ES.lin(X, gs[0], cy, gs[1], cy + ry, [[0, [40, 20, 6], 0], [1, [40, 20, 6], 0.2]]); X.fillRect(cx - rx, cy - 1, rx * 2, ry + 1);
    X.restore();
  }

  // la peluca: una forma con mechones (rayas claras con su sombra), luz arriba y sombra abajo, todo en un solo recorte
  function peluca(pts, rayas, c1, c2, op) {
    op = op || {};
    if (DEV.sinMechones) rayas = null;
    var fn = camino(pts), b = caja(pts), i, r;
    X.beginPath(); fn(X); X.fillStyle = op.estilo || rel(c1, b[0], b[1], b[2], b[3], 0.2); X.fill();
    X.save(); X.beginPath(); fn(X); X.clip();
    if (rayas && rayas.length) {
      var w = op.ancho || 1.6, d = w * 0.95;
      X.lineCap = 'butt';
      X.strokeStyle = col(c2, op.aRaya || 0.55); X.lineWidth = w; X.beginPath();
      for (i = 0; i < rayas.length; i++) { r = rayas[i]; X.moveTo(r[0], r[1]); X.quadraticCurveTo(r[2], r[3], r[4], r[5]); }
      X.stroke();
      X.strokeStyle = col(ES.oscurecer(c1, 0.4), op.aOscura || 0.45); X.lineWidth = w * 0.42; X.beginPath();
      for (i = 0; i < rayas.length; i++) { r = rayas[i]; X.moveTo(r[0] + d, r[1]); X.quadraticCurveTo(r[2] + d, r[3], r[4] + d, r[5]); }
      X.stroke();
      X.lineCap = 'round';
    }
    var cb = op.colBrillo || [205, 218, 245], cs = op.colSombra || [10, 12, 30], ab = op.brillo == null ? 0.22 : op.brillo;
    var g = gx(b[0], b[0] + (b[2] - b[0]) * 0.7);
    X.fillStyle = ES.lin(X, g[0], b[1], g[1], b[1] + (b[3] - b[1]) * 0.5, [[0, cb, 0], [0.45, cb, ab], [1, cb, 0]]);
    X.fillRect(b[0] - 1, b[1] - 1, b[2] - b[0] + 2, b[3] - b[1] + 2);
    X.fillStyle = ES.lin(X, 0, b[1] + (b[3] - b[1]) * 0.45, 0, b[3], [[0, cs, 0], [1, cs, 0.28]]);
    X.fillRect(b[0] - 1, b[1] - 1, b[2] - b[0] + 2, b[3] - b[1] + 2);
    if (op.punta) {   // la punta de los mechones: una banda de color (ref. 1 y 4)
      var y = b[3] - op.punta[1];
      X.fillStyle = rel(op.punta[0], b[0], y, b[2], b[3], 0.2); X.fillRect(b[0] - 2, y, b[2] - b[0] + 4, op.punta[1] + 2);
      X.fillStyle = col([255, 255, 255], 0.25); X.fillRect(b[0] - 2, y, b[2] - b[0] + 4, 0.6);
    }
    X.restore();
  }
  // rayas verticales (mechones) cada «paso» entre x0 y x1, de y0 a y1, que se curvan (curv)
  function mechones(x0, x1, paso, y0, y1, curv) {
    var r = [];
    for (var x = x0; x <= x1 + 0.01; x += paso) r.push([x, y0, x + (curv || 0), (y0 + y1) / 2, x + (curv || 0) * 0.4, y1]);
    return r;
  }

  // el cetro uas: vara recta con la cabeza del animal de Set arriba y la horquilla abajo (x, yA arriba, yB el suelo)
  function uas(x, yA, yB, c, op) {
    op = op || {}; var w = op.grosor || 2.6;
    var vara = [[x - w / 2, yA + 8, 1], [x + w / 2, yA + 8, 1], [x + w / 2, yB - 7, 1], [x - w / 2, yB - 7, 1]];
    var tonos = [[0, ES.aclarar(c, 0.4)], [0.4, c], [1, ES.oscurecer(c, 0.32)]];
    rellena(vara, lin(x - w / 2, 0, x + w / 2, 0, tonos));
    // la cabeza: la nuca, el hocico largo y curvo del animal de Set y las orejas cuadradas
    var cab = [[x - w * 0.5, yA + 9, 1], [x - w * 0.55, yA + 1], [x + 0.4, yA - 2.4], [x + 4, yA - 3.6], [x + 9, yA - 4.4], [x + 10.8, yA - 3], [x + 9.4, yA - 1.4], [x + 4.6, yA + 0.4], [x + w * 0.5, yA + 3.4], [x + w * 0.5, yA + 9, 1]];
    rellena(cab, lin(x - 2, yA - 5, x + 10, yA + 9, tonos));
    rellena([[x - w * 0.45, yA - 0.6], [x - 2.6, yA - 7.4], [x - 1, yA - 7.8], [x + 1.4, yA - 2.4]], col(ES.oscurecer(c, 0.12)));
    // la horquilla de abajo
    var hor = [[x - w / 2, yB - 8, 1], [x + w / 2, yB - 8, 1], [x + w * 0.5, yB - 6], [x + 3.4, yB - 3.2], [x + 3.2, yB, 1], [x + 2.2, yB, 1], [x + 2, yB - 2.6], [x, yB - 4.2], [x - 2, yB - 2.6], [x - 2.2, yB, 1], [x - 3.2, yB, 1], [x - 3.4, yB - 3.2], [x - w * 0.5, yB - 6]];
    rellena(hor, lin(x - 4, yB - 8, x + 4, yB, tonos));
    var an = op.anillos || [];
    for (var i = 0; i < an.length; i++) {
      var y = an[i];
      X.beginPath(); ES.redondo(X, x - w * 0.9, y - 1.4, w * 1.8, 2.8, 0.8); X.fillStyle = oro(x - w, y - 1.4, x + w, y + 1.4, 0.35); X.fill();
    }
  }

  // el ankh de oro: (cx, y) arriba en el centro
  function ankh(cx, y, hgt, ang) {
    X.save(); X.translate(cx, y); if (ang) X.rotate(ang);
    var w = hgt * 0.6, lazoH = hgt * 0.42, br = hgt * 0.07, palo = hgt * 0.12;
    forma.caja = [-w * 0.5, 0, w * 0.5, hgt];
    function forma(k) {
      k.ellipse(0, lazoH * 0.5, w * 0.26, lazoH * 0.5, 0, 0, TAU);
      k.moveTo(w * 0.13, lazoH * 0.54); k.ellipse(0, lazoH * 0.54, w * 0.13, lazoH * 0.3, 0, 0, TAU, true);
      k.moveTo(-w * 0.5, lazoH * 0.93); k.lineTo(w * 0.5, lazoH * 0.93); k.lineTo(w * 0.5, lazoH * 0.93 + br * 2); k.lineTo(-w * 0.5, lazoH * 0.93 + br * 2); k.closePath();
      k.moveTo(-palo * 0.5, lazoH * 0.88); k.lineTo(palo * 0.5, lazoH * 0.88); k.lineTo(palo * 0.78, hgt); k.lineTo(-palo * 0.78, hgt); k.closePath();
    }
    X.beginPath(); forma(X); X.fillStyle = oro(-w * 0.5, 0, w * 0.4, hgt, 0.3); X.fill();
    sombra(forma, -w * 0.2, 0, w * 0.5, hgt * 0.4, 0.22);
    X.restore();
  }

  // un patrón de red de cuentas (el vestido de Ra, el corpiño de Thot): filas de cuentas al tresbolillo
  function redCuentas(fn, b, cFondo, cCuenta, paso, op) {
    op = op || {};
    X.beginPath(); fn(X); X.fillStyle = rel(cFondo, b[0], b[1], b[2], b[3], 0.18); X.fill();
    recortar(fn);
    var r = paso * 0.3, fila = 0;
    if (op.bandas) {   // bandas horizontales finas (como el corpiño de Thot en la ref. 4)
      X.fillStyle = col(op.bandas, 0.5);
      for (var yb = b[1]; yb < b[3]; yb += paso * 2) X.fillRect(b[0] - 2, yb, b[2] - b[0] + 4, paso * 0.55);
    }
    X.fillStyle = col(cCuenta, op.a || 0.8); X.beginPath();
    for (var y = b[1] + paso * 0.5; y < b[3] + paso; y += paso * 0.86, fila++) {
      for (var x = b[0] + (fila % 2 ? paso / 2 : 0); x < b[2] + paso; x += paso) { X.moveTo(x + r, y); X.arc(x, y, r, 0, TAU); }
    }
    X.fill();
    soltar();
    brillo(fn, b[0], b[1], b[0] + (b[2] - b[0]) * 0.6, b[1] + (b[3] - b[1]) * 0.5, 0.18);
    sombra(fn, b[0] + (b[2] - b[0]) * 0.4, b[1], b[2], b[3], 0.2);
  }

  /* =====================================================================================================================
     4. El cuerpo de pie (hombre), de perfil mirando a +x, con el torso centrado en x = 0
     Canon de 18 cuadros hasta el nacimiento del pelo (q = 13 unidades): rodilla a 6, cadera a 9, codo a 12, hombro a 16.
     ===================================================================================================================== */
  var HOMBRO_ATRAS = [-30.5, -198], HOMBRO_DELANTE = [30.5, -198];
  var TORSO = [[-7, -213], [-17, -210.6], [-26.4, -207.8], [-32.8, -205.4], [-36.8, -200.8], [-38, -194.4], [-36.6, -188.2], [-32, -183.4], [-30.2, -180],
    [-28.2, -172], [-25, -160], [-21.6, -150], [-21.4, -143], [-24.6, -130], [-27, -118], [-25.5, -108, 1],
    [10.5, -108, 1], [11.6, -122], [11, -136], [10, -148], [12.4, -160], [17.6, -171], [22.6, -178], [27.4, -182.4],
    [31.4, -183.6], [35.8, -188.4], [37.4, -194.6], [36.2, -201], [32.4, -205.4], [26.4, -207.8], [17, -210.6], [8, -213]];
  // las piernas en paso: la de atrás (cerca) y la de delante (lejos, adelantada)
  var PIERNA_ATRAS = [[-9, -122], [-13.4, -77], [-19, -11.6]], PIERNA_DELANTE = [[4, -122], [22.6, -72], [38.2, -11.6]];
  var TALON_ATRAS = -26.5, TALON_DELANTE = 30.6, MEDIO_PASO = 22.5;

  function piernasEnPaso(pl, op) {
    op = op || {};
    var pz = tonoPiel(pl.c, -40, -215, 75, 0, 0.14), pzL = tonoPiel(U.mezcla(pl.c, pl.c2, 0.5), -40, -215, 75, 0, 0.12);
    var hD = huesos(PIERNA_DELANTE), hA = huesos(PIERNA_ATRAS);
    miembroPiel(hD, G_PIERNA, pzL, pl, { oscuro: true });
    pie(TALON_DELANTE, 40, pzL, pl);
    miembroPiel(hA, G_PIERNA, pz, pl);
    pie(TALON_ATRAS, 40, pz, pl);
    if (op.tobilleras !== false) { brazalete(hD, G_PIERNA, 0.905, 0.955, { color: op.tobilleras }); brazalete(hA, G_PIERNA, 0.905, 0.955, { color: op.tobilleras }); }
    return { hD: hD, hA: hA };
  }
  function torsoHombre(estilo, pl, desnudo) {
    var fn = camino(TORSO);
    X.beginPath(); fn(X); X.fillStyle = estilo; X.fill();
    recortar(fn);
    X.fillStyle = lin(-38, 0, 0, 0, [[0, pl.luz, 0.3], [1, pl.luz, 0]]); X.fillRect(-40, -215, 40, 110);
    X.fillStyle = lin(4, 0, 38, 0, [[0, pl.c2, 0], [1, pl.c2, 0.3]]); X.fillRect(0, -215, 40, 110);
    soltar();
    if (desnudo) {
      // el pecho de perfil: una curva suave bajo el pectoral, el pezón; el ombligo
      X.strokeStyle = col(pl.c2, 0.45); X.lineWidth = 0.8;
      X.beginPath(); X.moveTo(6, -177.5); X.quadraticCurveTo(15, -172, 24, -177.5); X.stroke();
      X.fillStyle = col(ES.oscurecer(pl.c2, 0.15), 0.7); X.beginPath(); X.arc(21, -179.2, 1.05, 0, TAU); X.fill();
      X.fillStyle = col(pl.c2, 0.6); X.beginPath(); X.ellipse(7.4, -150.5, 0.8, 1.4, 0.2, 0, TAU); X.fill();
      X.strokeStyle = col(pl.c2, 0.22); X.lineWidth = 0.8; X.beginPath(); X.moveTo(2, -168); X.quadraticCurveTo(4.5, -160, 6.5, -153.5); X.stroke();
    }
    return fn;
  }
  // el cuello de perfil (de la cabeza a los hombros)
  function cuello(estilo, pl, x0, x1) {
    x0 = x0 == null ? -7 : x0; x1 = x1 == null ? 9.5 : x1;
    var p = [[x0, -224], [x0 + 0.2, -212], [x0 + 1.4, -206, 1], [x1 - 0.4, -206, 1], [x1 + 0.4, -213], [x1 + 1, -219], [x1, -224]];
    rellena(p, estilo);
    sombra(camino(p), 0, -224, 0, -206, 0.3, pl.c2);
  }

  /* la falda shendyt, de lino plisado: op = { bajo, forro, cenefa, pliegues ('abanico' | 'rectos' | false), color } */
  function falda(op) {
    op = op || {};
    var yb = op.bajo || -86, cl = op.color || P.lino;
    var todo = [[-23.6, -151, 1], [12.4, -151, 1], [15.5, -138], [22, -118], [30, yb - 6], [34.8, yb - 2.8, 1], [8, yb + 1.6], [-12, yb + 1.4], [-26.2, yb, 1], [-28.4, yb + 12], [-29.2, -118], [-27, -134], [-23.4, -146]];
    var fT = camino(todo), b = caja(todo);
    X.beginPath(); fT(X); X.fillStyle = lin(b[0], b[1], b[2], b[3], [[0, ES.aclarar(op.forro || cl, 0.3)], [0.6, op.forro || cl], [1, ES.oscurecer(op.forro || P.lino2, 0.08)]]); X.fill();
    var fE = fT;
    if (op.forro) {
      // la capa de encima: de la espalda a una curva que baja hacia delante (el cruce de la tela, ref. 1 y 2)
      var enc = [[-23.6, -151, 1], [3, -151, 1], [9, -134], [17, -114], [27, yb - 3.4], [31, yb - 1.4, 1], [8, yb + 1.6], [-12, yb + 1.4], [-26.2, yb, 1], [-28.4, yb + 12], [-29.2, -118], [-27, -134], [-23.4, -146]];
      fE = camino(enc);
      X.beginPath(); fE(X); X.fillStyle = lin(b[0], b[1], b[2], b[3], [[0, ES.aclarar(cl, 0.45)], [0.55, cl], [1, P.lino2]]); X.fill();
      // el canto de la capa, con luz
      X.strokeStyle = col([255, 255, 255], 0.75); X.lineWidth = 0.7;
      X.beginPath(); X.moveTo(3, -150.5); X.bezierCurveTo(9, -134, 17, -114, 27, yb - 3.6); X.stroke();
    }
    // los pliegues
    var segs = [], i;
    if (op.pliegues !== false) {
      if (op.pliegues === 'rectos') {
        for (i = 0; i < 22; i++) { var xr = -27 + i * 2.8; segs.push([xr, -151, xr + 0.6, (yb - 151) / 2, xr + 1.4, yb + 2]); }
      } else {
        // abanico: líneas que salen de la cintura y se curvan hacia delante abajo, como la tela cruzada de la ref. 2
        for (i = 0; i < 19; i++) {
          var t = i / 18, x0 = -26 + t * 26, x1 = -30 + t * 62;
          segs.push([x0, -150, (x0 + x1) / 2 + 4 + t * 5, (-150 + yb) / 2 - 3, x1, yb + 3]);
        }
      }
    }
    X.save(); X.beginPath(); fE(X); X.clip();
    if (segs.length) lineas(null, segs, op.colPliegue || C.pliegue, 0.6, 0.5);
    var gs1 = gx(20, -28), gb1 = gx(-20, 30);
    X.fillStyle = ES.lin(X, gs1[0], -150, gs1[1], yb, [[0, P.piedra2, 0], [1, P.piedra2, 0.14]]); X.fillRect(-32, -152, 72, yb + 156);
    X.fillStyle = ES.lin(X, gb1[0], -150, gb1[1], yb + 10, [[0, [255, 255, 255], 0], [0.45, [255, 255, 255], 0.22], [1, [255, 255, 255], 0]]); X.fillRect(-32, -152, 72, yb + 156);
    X.restore();
    if (op.cenefa) {
      var cen = [[-26.4, yb - 3, 1], [-11, yb - 1.6], [8, yb - 1.6], [33.4, yb - 5.6, 1], [34.8, yb - 2.8, 1], [8, yb + 1.6], [-12, yb + 1.4], [-26.2, yb, 1]];
      rellena(cen, rel(op.cenefa, -26, yb - 6, 35, yb + 2, 0.22));
      lineas(camino(cen), [[-30, yb - 0.6, 40, yb - 3.2]], [255, 255, 255], 0.25, 0.5);
    }
    return { fn: fT };
  }
  // el delantal de delante (cuelga del cinturón): redondeado abajo, con rayas finas (ref. 4)
  function delantal(c, op) {
    op = op || {};
    var y0 = -146, y1 = op.bajo || -92;
    var p = [[-6, y0, 1], [13, y0, 1], [17.2, -132], [20.6, -116], [20.4, y1 + 12], [15, y1 + 2], [6, y1], [-2.6, y1 + 6], [-6.6, -118], [-6.8, -132]];
    var fn = camino(p), b = caja(p);
    X.beginPath(); fn(X); X.fillStyle = op.oro ? oro(b[0], b[1], b[2], b[3], 0.32) : lin(b[0], b[1], b[2], b[3], [[0, ES.aclarar(c, 0.25)], [0.5, c], [1, ES.oscurecer(c, 0.25)]]); X.fill();
    var segs = [];
    if (op.rayas !== false) {
      for (var i = 0; i < 16; i++) { var x = -6 + i * 1.75; segs.push(op.diagonal ? [x - 6, y0, x + 2, (y0 + y1) / 2, x + 10, y1 + 4] : [x, y0, x + i * 0.12, (y0 + y1) / 2, x + i * 0.3, y1 + 6]); }
      lineas(fn, segs, op.colRaya || ES.oscurecer(c, 0.25), 0.5, 0.45);
    }
    brillo(fn, b[0], b[1], b[0] + 14, b[1] + 30, 0.3);
    sombra(fn, b[0], b[1] + 20, b[2], b[3], 0.25);
    return fn;
  }
  // el cinturón: una banda con bloques de color separados por oro
  function cinturon(colores, op) {
    op = op || {};
    var p = [[-24.6, -154, 1], [13.6, -154, 1], [14.4, -145.4, 1], [-24.2, -145.4, 1]];
    var fn = camino(p);
    X.beginPath(); fn(X); X.fillStyle = oro(-25, -154, -25, -145, 0.4); X.fill();
    if (colores) {
      recortar(fn);
      var w = op.paso || 2.4, i = 0;
      for (var x0 = -24.6; x0 < 14; x0 += w, i++) {
        var c = colores[i % colores.length]; if (!c) continue;
        X.fillStyle = rel(c, x0, -152.6, x0 + w, -147, 0.22); X.fillRect(x0 + 0.35, -152.5, w - 0.7, 5.6);
      }
      soltar();
    }
    brillo(fn, -25, -154, -25, -149, 0.3);
  }
  // la cola de toro que cuelga del cinturón, detrás
  function cola(estilo, largo) {
    var L = largo || 100;
    var p = [[-22.4, -150, 1], [-27.2, -150, 1], [-29.4, -120], [-31.6, -150 + L * 0.72], [-32.6, -150 + L], [-31.2, -150 + L * 0.72], [-27.4, -122]];
    rellena(p, estilo);
  }

  /* =====================================================================================================================
     5. Las cabezas
     Marco de la cabeza: el origen es el centro de la oreja; la cara mira a +x. Un hombre: de la barbilla (y = +14) a lo alto
     del cráneo (y = −19); la nariz llega a x = +22.
     ===================================================================================================================== */

  /* el ojo egipcio, de frente, con la raya de kohl que se alarga hacia atrás: (cx, cy) el centro; L el largo
     op: { iris, pupila, ceja, colKohl, blanco, ext (lo que se alarga), altCeja } */
  function ojo(cx, cy, L, op) {
    op = op || {};
    if (DEV.sinOjo) return;
    var h = L * 0.36, kohl = op.colKohl || C.kohl;
    var del = [cx + L * 0.5, cy + h * 0.14], atr = [cx - L * 0.5, cy - h * 0.06];
    function almendra(k) {
      k.moveTo(atr[0], atr[1]);
      k.bezierCurveTo(cx - L * 0.22, cy - h * 0.98, cx + L * 0.25, cy - h * 1.02, del[0], del[1]);
      k.bezierCurveTo(cx + L * 0.2, cy + h * 0.8, cx - L * 0.22, cy + h * 0.66, atr[0], atr[1]);
      k.closePath();
    }
    X.beginPath(); almendra(X); X.fillStyle = op.blanco ? col(op.blanco) : lin(cx, cy - h, cx, cy + h, [[0, P.lino2], [0.45, C.blancoOjo], [1, C.blancoOjo]]); X.fill();
    recortar(almendra);
    var ir = h * 0.95, ix = cx + L * 0.07, iy = cy - h * 0.06, ci = op.iris || C.iris;
    X.beginPath(); X.arc(ix, iy, ir, 0, TAU);
    X.fillStyle = ES.rad(X, ix, iy, 0, ir, [[0, ES.aclarar(ci, 0.3)], [0.65, ci], [1, ES.oscurecer(ci, 0.35)]]); X.fill();
    if (op.pupila !== false) { X.beginPath(); X.arc(ix, iy, ir * 0.46, 0, TAU); X.fillStyle = col(P.negro); X.fill(); }
    X.fillStyle = col(P.tinta, 0.22); X.fillRect(cx - L, cy - h * 1.3, L * 2, h * 0.62);
    soltar();
    X.beginPath(); X.arc(ix - DIR * ir * 0.32, iy - ir * 0.36, ir * 0.22, 0, TAU); X.fillStyle = col([255, 255, 255], 0.9); X.fill();
    // la raya de kohl: el párpado de arriba (gruesa) se alarga hacia atrás; la de abajo, fina, se le junta
    var ext = op.ext == null ? L * 0.9 : op.ext, gk = L * 0.13;
    X.fillStyle = col(kohl);
    X.beginPath();
    X.moveTo(del[0] + L * 0.05, del[1] + h * 0.06);
    X.bezierCurveTo(cx + L * 0.25, cy - h * 1.16, cx - L * 0.22, cy - h * 1.12, atr[0], atr[1] - gk * 0.62);
    X.quadraticCurveTo(atr[0] - ext * 0.5, atr[1] - gk * 0.62, atr[0] - ext, atr[1] + h * 0.1);
    X.quadraticCurveTo(atr[0] - ext * 0.5, atr[1] + gk * 0.55, atr[0], atr[1] + gk * 0.3);
    X.bezierCurveTo(cx - L * 0.22, cy - h * 0.98 + gk * 0.92, cx + L * 0.25, cy - h * 1.02 + gk * 0.92, del[0] - L * 0.03, del[1] - gk * 0.1);
    X.closePath(); X.fill();
    X.beginPath();
    X.moveTo(del[0], del[1]);
    X.bezierCurveTo(cx + L * 0.2, cy + h * 0.8, cx - L * 0.22, cy + h * 0.66, atr[0], atr[1]);
    X.quadraticCurveTo(atr[0] - ext * 0.45, atr[1] + h * 0.34, atr[0] - ext * 0.9, atr[1] + h * 0.18);
    X.quadraticCurveTo(atr[0] - ext * 0.45, atr[1] + h * 0.56, atr[0] + L * 0.04, atr[1] + h * 0.42 + gk * 0.22);
    X.bezierCurveTo(cx - L * 0.22, cy + h * 0.66 + gk * 0.5, cx + L * 0.2, cy + h * 0.8 + gk * 0.45, del[0] - L * 0.05, del[1] + gk * 0.28);
    X.closePath(); X.fill();
    // el lagrimal
    X.beginPath(); X.moveTo(del[0] - L * 0.04, del[1] - gk * 0.2); X.quadraticCurveTo(del[0] + L * 0.09, del[1] + h * 0.2, del[0] + L * 0.03, del[1] + h * 0.48); X.lineTo(del[0] - L * 0.03, del[1] + h * 0.2); X.closePath(); X.fill();
    // la ceja pintada
    if (op.ceja !== false) {
      var cy0 = cy - h * (op.altCeja || 2.3), gc = L * 0.12;
      X.fillStyle = col(op.colCeja || kohl);
      X.beginPath();
      X.moveTo(cx + L * 0.55, cy0 + h * 0.6);
      X.bezierCurveTo(cx + L * 0.3, cy0 - h * 0.45, cx - L * 0.35, cy0 - h * 0.55, cx - L * 0.5 - ext * 0.85, cy0 + h * 0.4);
      X.bezierCurveTo(cx - L * 0.35, cy0 - h * 0.55 + gc * 1.3, cx + L * 0.28, cy0 - h * 0.4 + gc * 1.35, cx + L * 0.55, cy0 + h * 0.6);
      X.closePath(); X.fill();
    }
  }

  /* la cabeza de hombre de perfil. op: { pl (piel), barba ('dios' | 'real' | 'perilla' | 'griega' | 'bigote'),
     oreja (true/false), nariz ('aguilena'), mejilla } */
  var CARA = [[-7.5, 22, 1], [-7.8, 12], [-12, 6], [-16.5, -2], [-16.5, -11], [-11, -18], [-2, -21.5], [8, -20.5], [14.5, -15.5], [16.6, -10], [17.6, -6.4], [17.3, -4.6],
    [19.4, -0.8], [21.6, 2.4], [21.9, 3.6], [20.6, 4.6], [19.3, 5], [19.2, 6.2], [19.9, 7.3], [18.6, 8.3], [19.3, 9.5], [18.2, 10.9], [17.6, 11.4], [18.4, 13.2], [16.8, 15.1],
    [12.5, 15.8], [9.5, 16.8], [8.6, 22, 1]];
  var CARA_AGUILENA = [[-7.5, 22, 1], [-7.8, 12], [-12, 6], [-16.5, -2], [-16.5, -11], [-11, -18], [-2, -21.5], [8, -20.5], [14.5, -15.5], [16.6, -10], [17.4, -6.6], [17.7, -5.2],
    [20, -2.4], [22.2, 1.4], [22.4, 3.4], [21, 4.8], [19.3, 5], [19.2, 6.2], [19.9, 7.3], [18.6, 8.3], [19.3, 9.5], [18.2, 10.9], [17.6, 11.4], [18.4, 13.2], [16.8, 15.1],
    [12.5, 15.8], [9.5, 16.8], [8.6, 22, 1]];
  function cabezaHumana(op) {
    op = op || {};
    var pl = op.pl || PIEL, perfil = op.nariz === 'aguilena' ? CARA_AGUILENA : CARA;
    var fn = camino(perfil);
    X.beginPath(); fn(X); X.fillStyle = rel(pl.c, -16, -21, 22, 22, 0.14); X.fill();
    recortar(fn);
    // la mejilla, algo más clara (ref. 4); la mandíbula y el cuello en sombra
    X.fillStyle = ES.rad(X, 11, 3, 0, 8.5, [[0, op.mejilla || pl.luz, 0.32], [1, op.mejilla || pl.luz, 0]]); X.fillRect(0, -6, 23, 19);
    X.fillStyle = lin(0, 12, 0, 22, [[0, pl.c2, 0], [1, pl.c2, 0.45]]); X.fillRect(-10, 12, 22, 10);
    X.fillStyle = lin(16, 0, 23, 0, [[0, pl.luz, 0], [1, pl.luz, 0.22]]); X.fillRect(15, -18, 9, 34);
    soltar();
    sombra(fn, 4, -10, -16, 6, 0.2, pl.c2);
    if (op.oreja !== false && op.oreja !== 'despues') oreja(pl);
    // la aleta de la nariz y los labios
    X.strokeStyle = col(ES.oscurecer(pl.c2, 0.1), 0.6); X.lineWidth = 0.65;
    X.beginPath(); X.moveTo(19.8, 3.6); X.quadraticCurveTo(18.2, 2.8, 18.7, 1.2); X.stroke();
    X.fillStyle = col(op.labio || U.mezcla(pl.c2, P.cornalina, 0.3), 0.5);
    X.beginPath(); X.moveTo(19.3, 6.3); X.quadraticCurveTo(20, 7.3, 18.6, 8.2); X.quadraticCurveTo(19.4, 9.4, 18.3, 10.7); X.lineTo(16.6, 9.3); X.lineTo(16.8, 7.4); X.closePath(); X.fill();
    X.strokeStyle = col(ES.oscurecer(pl.c2, 0.35), 0.75); X.lineWidth = 0.5;
    X.beginPath(); X.moveTo(18.8, 8.25); X.quadraticCurveTo(17.6, 8.6, 16.5, 8.3); X.stroke();
    ojo(11.4, -3.4, 8.4, { iris: op.iris, ext: op.extKohl, colKohl: op.kohl });
    if (op.barba) barba(op.barba, op);
  }
  // la oreja, de perfil (algo de frente, como en las pinturas)
  function oreja(pl) {
    var o = [[-1.4, -5.6], [2.2, -6.4], [3.9, -3.4], [3.4, 0.6], [2.5, 3.8], [0.1, 5.8], [-2, 4.6], [-2.7, 0]];
    rellena(o, rel(pl.c, -3, -6, 4, 6, 0.14));
    X.strokeStyle = col(ES.oscurecer(pl.c2, 0.1), 0.6); X.lineWidth = 0.8;
    X.beginPath(); X.moveTo(1.7, -3.8); X.quadraticCurveTo(2.7, -1, 1.5, 1.6); X.quadraticCurveTo(0.7, 3.1, -0.6, 2.5); X.stroke();
  }
  // las barbas: la del dios (larga, trenzada, con la punta hacia delante), la del rey (recta, de bandas), la perilla
  function barba(tipo, op) {
    var cb = op.colBarba || P.negro;
    if (tipo === 'dios') {
      var p = [[14.4, 14.2], [17.8, 14.6], [18.4, 22], [19.4, 32], [21.8, 38.4], [25, 40], [22.8, 41.8], [17.8, 40.6], [15, 33], [14, 22]];
      rellena(p, negro(14, 14, 24, 42));
      lineas(camino(p), [[13, 19, 21, 18.4], [13, 24, 21, 23.4], [13, 29, 22, 28.4], [14, 34, 23, 33.2], [15, 38, 25, 37]], C.reflejo, 0.8, 0.55);
      X.strokeStyle = col(cb, 0.8); X.lineWidth = 0.7; X.beginPath(); X.moveTo(15, 15); X.quadraticCurveTo(5.4, 16.6, 1.4, 6.2); X.stroke();
    } else if (tipo === 'real') {
      var r = [[14.6, 14.4], [18.2, 14.6], [18.8, 27], [19.2, 29.6], [15.4, 29.6], [14.6, 25]];
      rellena(r, rel(P.lapis2, 14, 14, 19, 30, 0.25));
      lineas(camino(r), [[13, 18, 21, 18], [13, 21.6, 21, 21.6], [13, 25.2, 21, 25.2]], P.oro2, 0.9, 0.85);
      X.strokeStyle = col(P.oro3, 0.8); X.lineWidth = 0.7; X.beginPath(); X.moveTo(15, 15); X.quadraticCurveTo(5.4, 16.6, 1.4, 6.2); X.stroke();
    } else if (tipo === 'perilla') {
      rellena([[15.6, 12.4], [18.6, 13.1], [18.4, 16.4], [16.8, 18.4], [15.2, 15.6]], negro(15, 12, 19, 18));
    }
  }

  /* ---------- la cabeza de chacal (Anubis): negra con reflejos, orejas altas con el dentro de oro (ref. 2) ---------- */
  function cabezaChacal() {
    var oL = [[-6, -10], [-4.6, -26], [-2.6, -44], [-0.8, -45.6, 1], [3.6, -31], [6.4, -16], [3, -9]];
    rellena(oL, negro(-6, -46, 6, -9));
    var cab = [[-12, 13, 1], [-12.6, -2], [-9, -11], [-2, -16.4], [7, -16.6], [13.6, -13.6], [18.6, -9.8], [26, -7.8], [34, -5.6], [38.6, -3.6], [40, -1.4], [39.2, 1.2],
      [35, 2.4], [28, 3.4], [22, 5.6], [17, 9.4], [12.4, 13.6], [10.4, 24, 1], [-11, 24, 1]];
    var fn = camino(cab);
    X.beginPath(); fn(X); X.fillStyle = negro(-12, -17, 30, 20); X.fill();
    // el reflejo gris azulado (ref. 2): a lo largo del hocico, la frente y la mejilla
    recortar(fn);
    X.fillStyle = lin(14, -9, 39, -4, [[0, C.reflejo, 0], [0.25, C.reflejo, 0.55], [0.85, C.reflejo, 0.4], [1, C.reflejo, 0]]);
    X.beginPath(); X.moveTo(13, -12.8); X.quadraticCurveTo(26, -9.6, 38.8, -3.8); X.quadraticCurveTo(28, -5.2, 15, -7.2); X.closePath(); X.fill();
    X.fillStyle = ES.rad(X, 4, -10, 0, 10, [[0, C.reflejo, 0.5], [1, C.reflejo, 0]]); X.fillRect(-8, -20, 24, 20);
    X.fillStyle = ES.rad(X, 8, 4, 0, 9, [[0, C.reflejo, 0.3], [1, C.reflejo, 0]]); X.fillRect(-4, -6, 24, 20);
    soltar();
    // la boca y el belfo
    X.strokeStyle = col(C.reflejo, 0.75); X.lineWidth = 0.55;
    X.beginPath(); X.moveTo(38.6, 1); X.quadraticCurveTo(30, 2.2, 21.2, 2.6); X.quadraticCurveTo(19.6, 2.8, 19, 4); X.stroke();
    // la trufa
    rellena([[36.6, -4], [39.8, -3.4], [40.9, -1.3], [39.8, 0.6], [37, 0.4], [36, -1.7]], col(ES.oscurecer(P.negro, 0.45)));
    X.fillStyle = col([200, 214, 240], 0.6); X.beginPath(); X.ellipse(38.5, -2.8, 1.1, 0.5, 0.2, 0, TAU); X.fill();
    // la oreja de cerca, con el dentro de oro y cornalina
    var oC = [[-2, -12], [0.4, -28], [3.4, -46.6], [5, -47.6, 1], [9.6, -33], [12.6, -17], [8.6, -11]];
    rellena(oC, negro(-2, -47, 12, -11));
    var oD = [[1.7, -14.4], [3.2, -29], [4.9, -42.6], [8, -31], [10, -18], [7.4, -13.2]];
    rellena(oD, lin(2, -42, 10, -14, [[0, P.oro1], [0.3, P.oro2], [0.72, P.cornalina], [1, P.oro3]]));
    lineas(camino(oD), [[4.2, -15, 5, -38], [6.2, -15, 6.5, -36], [8.2, -16, 7.8, -30]], P.oro4, 0.45, 0.4);
    brillo(camino(oC), -2, -47, 6, -30, 0.35, C.reflejo);
    // el ojo de oro con su kohl y las rayas de oro de encima y de debajo (ref. 2)
    X.strokeStyle = oro(10, -12, 22, -4, 0.4); X.lineWidth = 1.1;
    X.beginPath(); X.moveTo(9.4, -9.8); X.quadraticCurveTo(15.6, -12.8, 21.6, -9); X.stroke();
    X.beginPath(); X.moveTo(10.6, -2.4); X.quadraticCurveTo(15.6, -2.8, 20.8, -5.4); X.stroke();
    ojo(15.6, -6.6, 7.2, { iris: P.oro2, ext: 3.4, ceja: false, blanco: P.oro1 });
  }

  /* ---------- la cabeza de halcón (Horus, Ra): la capucha oscura, la cara blanca con la bigotera, el ojo grande ----------
     op: { capucha (color), iris, anillo (color del aro del ojo), pico, cera } */
  function cabezaHalcon(op) {
    op = op || {};
    var cap = op.capucha || P.negro, oscura = cap === P.negro;
    var cab = [[-12.5, 16, 1], [-14, 4], [-13.6, -6], [-9, -14], [-1, -18], [8, -17.4], [14, -13.6], [17.6, -8.4], [18.6, -3], [17.4, 2.6], [14.2, 8.6], [12.6, 16], [12.4, 24, 1], [-11.6, 24, 1]];
    var fn = camino(cab);
    X.beginPath(); fn(X); X.fillStyle = oscura ? negro(-13, -18, 18, 24) : lin(-13, -18, 18, 24, [[0, ES.aclarar(cap, 0.3)], [0.5, cap], [1, ES.oscurecer(cap, 0.3)]]); X.fill();
    // las plumas pintadas de la capucha: escamas finas en filas
    recortar(fn);
    X.strokeStyle = col(oscura ? C.reflejo : ES.aclarar(cap, 0.35), 0.55); X.lineWidth = 0.42; X.beginPath();
    for (var fy = -16, fila = 0; fy < 24; fy += 2.9, fila++) {
      for (var fx = -14 + (fila % 2 ? 1.45 : 0); fx < 8; fx += 2.9) { X.moveTo(fx - 1.3, fy); X.quadraticCurveTo(fx, fy + 1.7, fx + 1.3, fy); }
    }
    X.stroke();
    soltar();
    brillo(fn, -13, -18, 2, -6, 0.32, oscura ? C.reflejo : [220, 230, 255]);
    // la cara blanca: rodea el ojo, baja por la mejilla y la garganta
    var cara = [[17.8, -8.8], [14.6, -12.8], [9, -13.6], [4.2, -11.4], [1.4, -6.4], [0.6, 0], [1.6, 7], [3.2, 15], [3, 24, 1], [12.4, 24, 1], [12.6, 16], [14.2, 8.6], [17.4, 2.6], [18.6, -3]];
    var fc = camino(cara);
    X.beginPath(); fc(X); X.fillStyle = lin(4, -12, 16, 22, [[0, [255, 253, 246]], [0.45, P.lino], [1, P.lino2]]); X.fill();
    lineas(fc, [[4.4, 7, 9.6, 6.2], [4.8, 10.6, 10.4, 9.8], [5, 14.2, 11, 13.4], [5.2, 17.8, 11.4, 17], [5.4, 21.4, 11.6, 20.6], [2.6, 2, 6.4, 1.4]], C.gris, 0.4, 0.45);
    sombra(fc, 4, 0, 4, 24, 0.22, C.canto);
    // la bigotera negra que baja del ojo y se curva (la marca del halcón peregrino, como en el ojo de Horus)
    var big = [[13.8, -3.6], [13.4, 0.4], [11.8, 4.2], [11.6, 7.4], [13.6, 8.8], [12.8, 10.8], [9.8, 10.4], [8.6, 7], [9.4, 2.2], [11, -2]];
    rellena(big, negro(8, -4, 14, 11));
    // el pico ganchudo, con la cera de color en la base
    var pico = [[16.8, -8.4], [20, -9.4], [23.6, -8.6], [26.4, -6.2], [27.4, -2.8], [26.4, 0.6], [25.4, -1.2], [23.6, -2.4], [20.4, -2.2], [17.4, -1.4]];
    rellena(pico, lin(17, -10, 27, 1, [[0, ES.aclarar(op.pico || P.negro2, 0.32)], [0.5, op.pico || P.negro2], [1, P.negro]]));
    X.fillStyle = col([225, 235, 255], 0.38); X.beginPath(); X.moveTo(19, -8.9); X.quadraticCurveTo(23.6, -8.9, 26, -5.6); X.quadraticCurveTo(22.6, -7.2, 19, -7.4); X.closePath(); X.fill();
    X.strokeStyle = col(P.negro, 0.5); X.lineWidth = 0.45; X.beginPath(); X.moveTo(18, -3.6); X.quadraticCurveTo(22, -4.2, 25.4, -1.6); X.stroke();
    X.strokeStyle = col(op.cera || P.turquesa); X.lineWidth = 1.2; X.beginPath(); X.moveTo(17.2, -8.8); X.quadraticCurveTo(16.2, -5.2, 17.4, -1.6); X.stroke();
    // el ojo: grande y redondo, con su aro de color, el iris de oro y la pupila
    var ox = 11.2, oy = -5.6;
    X.beginPath(); X.arc(ox, oy, 4.3, 0, TAU); X.fillStyle = col(op.anillo || P.turquesa); X.fill();
    X.beginPath(); X.arc(ox, oy, 3.2, 0, TAU); X.fillStyle = radial(ox, oy, 3.2, [[0, P.oro1], [0.6, op.iris || P.oro2], [1, ES.oscurecer(op.iris || P.oro3, 0.2)]]); X.fill();
    X.beginPath(); X.arc(ox + 0.35, oy, 1.55, 0, TAU); X.fillStyle = col(P.negro); X.fill();
    X.beginPath(); X.arc(ox - DIR * 0.5, oy - 1.1, 0.62, 0, TAU); X.fillStyle = col([255, 255, 255], 0.92); X.fill();
    // la raya de detrás del ojo y la «ceja» de la capucha
    X.fillStyle = col(P.negro);
    X.beginPath(); X.moveTo(7.2, -6.8); X.quadraticCurveTo(3.6, -7.4, 0.4, -6); X.quadraticCurveTo(3.8, -4.8, 7, -4.4); X.closePath(); X.fill();
  }

  /* ---------- la cabeza de ibis (Thot): blanca con plumas pintadas y el pico largo y curvo, negro ---------- */
  function cabezaIbis() {
    var cab = [[-9, 10, 1], [-10.4, -2], [-7, -10], [0, -13.6], [7.6, -12.4], [12.6, -8.4], [13.6, -4.6], [12, -1], [8.6, 3], [6.6, 10], [6.2, 26, 1], [-6.4, 26, 1], [-7, 18]];
    var fn = camino(cab);
    X.beginPath(); fn(X); X.fillStyle = lin(-10, -14, 12, 24, [[0, [255, 253, 246]], [0.45, P.lino], [1, C.gris]]); X.fill();
    recortar(fn);
    // las plumas pintadas: escamas muy finas
    X.strokeStyle = col(C.gris, 0.22); X.lineWidth = 0.38; X.beginPath();
    for (var fy = -12; fy < 25; fy += 2.8) {
      for (var fx = -10 + (Math.round(fy / 2.8) % 2 ? 1.4 : 0); fx < 10; fx += 2.8) { X.moveTo(fx - 1.2, fy); X.quadraticCurveTo(fx, fy + 1.5, fx + 1.2, fy); }
    }
    X.stroke();
    soltar();
    sombra(fn, -4, -4, 8, 24, 0.22, C.canto);
    brillo(fn, -10, -14, 4, -2, 0.3);
    // el pico: largo, fino, curvado hacia abajo; negro con un reflejo
    var pico = [[11.2, -8], [17, -8.4], [25, -7.2], [33, -3.6], [40, 2.6], [44.4, 8.6], [44.2, 10.2], [42.6, 9.6], [37.6, 4.6], [31, 0], [23.6, -2.6], [16, -3], [12, -2.2]];
    rellena(pico, negro(11, -9, 44, 10));
    X.strokeStyle = col(C.reflejo, 0.7); X.lineWidth = 0.7; X.beginPath(); X.moveTo(14, -7.4); X.bezierCurveTo(24, -7, 33, -3, 41, 4.6); X.stroke();
    X.strokeStyle = col([10, 12, 20], 0.6); X.lineWidth = 0.4; X.beginPath(); X.moveTo(13, -5); X.bezierCurveTo(22, -5, 31, -2, 38, 3.4); X.stroke();
    // el ojo pequeño y redondo, con su kohl
    var ox = 6.6, oy = -6.2;
    X.beginPath(); X.ellipse(ox, oy, 2.6, 1.9, 0, 0, TAU); X.fillStyle = col(P.negro); X.fill();
    X.beginPath(); X.ellipse(ox, oy, 1.7, 1.2, 0, 0, TAU); X.fillStyle = col(P.lino); X.fill();
    X.beginPath(); X.arc(ox + 0.3, oy, 0.85, 0, TAU); X.fillStyle = col(P.negro); X.fill();
    X.fillStyle = col(P.negro); X.beginPath(); X.moveTo(4.2, -6.6); X.quadraticCurveTo(1, -6.6, -2, -5.4); X.quadraticCurveTo(1, -5.2, 4.2, -5.4); X.closePath(); X.fill();
  }

  /* =====================================================================================================================
     6. Las coronas (en el marco del cuerpo)
     ===================================================================================================================== */
  // la doble corona (pschent): la roja (deshret) con su espiga detrás y su espiral, y la blanca (hedjet) que sale de dentro
  function pschent(bx, by, k) {
    X.save(); X.translate(bx, by); X.scale(k, k);
    var roja = [[-17.4, 1.6, 1], [14.6, 1.6, 1], [15, -6], [14.6, -14.6, 1], [-5.4, -14.6, 1], [-6, -54], [-7.6, -56, 1], [-10.8, -56, 1], [-11.4, -52], [-11.8, -15], [-16.4, -10], [-18, -3]];
    var fr = camino(roja);
    var blanca = [[-5.4, -13, 1], [13.6, -13, 1], [13.6, -24], [11.6, -36], [8.6, -46], [7, -52], [7.6, -56.4], [5.4, -61.4], [1, -63], [-3, -61.4], [-4.6, -56.6], [-3.8, -51], [-4.6, -40], [-5.4, -26]];
    var fb = camino(blanca);
    X.beginPath(); fb(X); X.fillStyle = lin(-5, -63, 14, -13, [[0, [255, 255, 250]], [0.4, P.lino], [1, P.lino2]]); X.fill();
    sombra(fb, 0, -56, 14, -16, 0.25, C.canto);
    brillo(fb, -5, -62, 4, -30, 0.55);
    X.beginPath(); fr(X); X.fillStyle = lin(-18, -52, 13, 2, [[0, ES.aclarar(P.cornalina, 0.28)], [0.45, P.cornalina], [1, ES.oscurecer(P.rojo, 0.28)]]); X.fill();
    brillo(fr, -18, -40, -8, -14, 0.22);
    sombra(fr, -8, -14, 13, 2, 0.22);
    // la diadema de oro de abajo
    X.beginPath(); ES.redondo(X, -17.8, -1.6, 32.8, 3.6, 1); X.fillStyle = oro(-18, -2, -18, 2, 0.4); X.fill();
    // la espiral (khabet): un hilo que sale delante de la espiga, sube hacia delante y se enrosca
    X.strokeStyle = lin(-6, -30, 14, -40, [[0, ES.aclarar(P.cornalina, 0.1)], [1, P.rojo]]); X.lineWidth = 1.25;
    X.beginPath(); X.moveTo(-5.4, -15.4); X.bezierCurveTo(2, -19, 12, -23, 16.4, -30.6); X.bezierCurveTo(18.6, -34.6, 17, -39.2, 14, -38.4); X.bezierCurveTo(11.8, -37.6, 12.6, -34.4, 14.8, -35.2); X.stroke();
    X.restore();
  }

  // el disco solar con el ureo: la cobra de oro se enrosca abajo y levanta la capucha delante del disco
  function discoSolar(cx, cy, r) {
    // la cola de la cobra, detrás del disco
    X.strokeStyle = oro(cx - r, cy, cx + r, cy + r, 0.35); X.lineWidth = r * 0.12; X.lineCap = 'round';
    X.beginPath(); X.moveTo(cx + r * 0.3, cy + r * 0.98); X.bezierCurveTo(cx - r * 0.6, cy + r * 1.08, cx - r * 1.06, cy + r * 0.62, cx - r * 1.04, cy + r * 0.1); X.stroke();
    // el disco: rojo de cornalina, con bandas de brillo (ref. 4)
    X.beginPath(); X.arc(cx, cy, r, 0, TAU);
    X.fillStyle = radial(cx, cy, r, [[0, ES.aclarar(P.cornalina, 0.32)], [0.55, P.cornalina], [0.9, ES.oscurecer(P.rojo, 0.12)], [1, ES.oscurecer(P.rojo, 0.3)]]); X.fill();
    X.save(); X.beginPath(); X.arc(cx, cy, r, 0, TAU); X.clip();
    X.fillStyle = col([255, 196, 120], 0.32); X.beginPath(); X.ellipse(cx, cy + r * 0.12, r * 0.88, r * 0.26, 0, 0, TAU); X.fill();
    X.fillStyle = col([255, 238, 214], 0.45); X.beginPath(); X.ellipse(cx - DIR * r * 0.1, cy - r * 0.58, r * 0.58, r * 0.17, -0.12 * DIR, 0, TAU); X.fill();
    X.restore();
    // el aro de oro del disco, finísimo
    X.strokeStyle = oro(cx - r, cy - r, cx + r, cy + r, 0.3); X.lineWidth = r * 0.05; X.beginPath(); X.arc(cx, cy, r * 0.985, 0, TAU); X.stroke();
    // el cuerpo de la cobra delante del disco, abajo, que sube hacia la capucha
    X.strokeStyle = oro(cx - r, cy + r * 0.6, cx + r, cy + r, 0.35); X.lineWidth = r * 0.14;
    X.beginPath(); X.moveTo(cx - r * 0.45, cy + r * 0.92); X.bezierCurveTo(cx + r * 0.2, cy + r * 1.06, cx + r * 0.78, cy + r * 1.0, cx + r * 0.9, cy + r * 0.62); X.stroke();
    // la capucha, de perfil: alta y estrecha, con su incrustación de lapislázuli y cornalina
    var cap = [[cx + r * 0.84, cy + r * 0.66], [cx + r * 0.8, cy + r * 0.3], [cx + r * 0.84, cy - r * 0.06], [cx + r * 0.98, cy - r * 0.3], [cx + r * 1.16, cy - r * 0.36], [cx + r * 1.24, cy - r * 0.12], [cx + r * 1.2, cy + r * 0.28], [cx + r * 1.06, cy + r * 0.62]];
    rellena(cap, oro(cx + r * 0.8, cy - r * 0.4, cx + r * 1.3, cy + r * 0.7, 0.32));
    var inc = [[cx + r * 0.92, cy + r * 0.52], [cx + r * 0.9, cy + r * 0.18], [cx + r * 0.98, cy - r * 0.1], [cx + r * 1.1, cy - r * 0.16], [cx + r * 1.14, cy + r * 0.14], [cx + r * 1.06, cy + r * 0.5]];
    rellena(inc, lin(cx + r * 0.9, cy - r * 0.2, cx + r * 1.1, cy + r * 0.5, [[0, C.lapisClaro], [1, P.lapis2]]));
    X.fillStyle = col(P.cornalina); X.beginPath(); X.ellipse(cx + r * 1.02, cy + r * 0.02, r * 0.05, r * 0.09, 0, 0, TAU); X.fill();
    // la cabeza de la cobra, arriba, mirando hacia delante
    rellena([[cx + r * 0.98, cy - r * 0.3], [cx + r * 1.04, cy - r * 0.5], [cx + r * 1.2, cy - r * 0.56], [cx + r * 1.32, cy - r * 0.48], [cx + r * 1.28, cy - r * 0.38], [cx + r * 1.14, cy - r * 0.34]], oro(cx + r, cy - r * 0.6, cx + r * 1.3, cy - r * 0.3, 0.4));
    X.fillStyle = col(P.negro); X.beginPath(); X.arc(cx + r * 1.14, cy - r * 0.46, r * 0.03, 0, TAU); X.fill();
  }
  // el disco lunar de Thot sobre la media luna: la luna llena, pálida y plana, con su filo de oro, y la media luna de oro debajo
  function discoLunar(cx, cy, r) {
    X.beginPath();
    X.arc(cx, cy + r * 0.12, r * 1.2, 0.1 * Math.PI, 0.9 * Math.PI, false);
    X.arc(cx, cy - r * 0.1, r * 1.02, 0.88 * Math.PI, 0.12 * Math.PI, true);
    X.closePath();
    X.fillStyle = oro(cx - r, cy, cx + r, cy + r * 1.3, 0.35); X.fill();
    X.beginPath(); X.arc(cx, cy, r, 0, TAU);
    X.fillStyle = lin(cx - r, cy - r, cx + r, cy + r, [[0, [255, 253, 240]], [0.55, U.mezcla(P.lino, P.oro1, 0.35)], [1, U.mezcla(P.lino2, P.oro2, 0.3)]]); X.fill();
    // las manchas de la luna, muy suaves
    X.fillStyle = col(U.mezcla(P.lino2, P.oro2, 0.3), 0.35);
    X.beginPath(); X.ellipse(cx - r * 0.25, cy - r * 0.15, r * 0.28, r * 0.2, 0.4, 0, TAU); X.ellipse(cx + r * 0.3, cy + r * 0.25, r * 0.22, r * 0.16, -0.3, 0, TAU); X.fill();
    X.strokeStyle = oro(cx - r, cy - r, cx + r, cy + r, 0.3); X.lineWidth = r * 0.09; X.beginPath(); X.arc(cx, cy, r * 0.96, 0, TAU); X.stroke();
  }

  /* =====================================================================================================================
     7. Los dioses de pie
     ===================================================================================================================== */
  var CAB_ANIMAL = [-2.5, -231];   // dónde va la cabeza animal (el centro de su «oreja»)

  // la peluca tripartita de los dioses con cabeza animal: la masa de detrás y el mechón de delante
  function pelucaAtras(c1, c2, op) {
    op = op || {};
    var g = op.grande ? 1 : 0;
    var p = [[-5, -263 - g * 3], [-20, -260.6 - g * 3], [-33.6, -251 - g * 2], [-42.4 - g * 2, -234], [-46.4 - g * 2, -212], [-46.6 - g * 2, -190], [-45.4 - g, -174], [-44 - g, -164 + g * 2, 1], [-14, -164 + g * 2, 1], [-11, -184], [-7, -204], [-3, -226], [-1.4, -248]];
    peluca(p, mechones(-48, -6, 3.5, -266, -160, -2.4), c1, c2, { aRaya: 0.6, ancho: 1.7, punta: op.punta });
  }
  function pelucaDelante(c1, c2, x0, x1, op) {
    op = op || {};
    var y1 = op.bajo || -166;
    var p = [[x0, -224], [x1 - 1, -223.6], [x1 + 0.6, -206], [x1 + 1, -184], [x1 + 1, y1, 1], [x0 - 1, y1, 1], [x0 - 1.4, -190], [x0 - 0.8, -210]];
    peluca(p, mechones(x0 + 1.2, x1 - 1, 2.8, -226, y1 + 1, 0.5), c1, c2, { aRaya: 0.6, ancho: 1.3, punta: op.punta });
  }
  // los brazos estándar: el de atrás cuelga; el de delante, adelantado, sujeta un cetro largo en (58.4, −127)
  var BRAZO_CUELGA = [HOMBRO_ATRAS, [-34.6, -152], [-33, -106]];
  var BRAZO_CETRO = [HOMBRO_DELANTE, [44.4, -160], [54.4, -125]];
  function brazoConAnkh(pzL, pl) {
    var bA = huesos(BRAZO_CUELGA);
    miembroPiel(bA, G_BRAZO, pzL, pl, { oscuro: true });
    ankh(-31, -102, 32);
    puno(-31, -98, -33, -106, pzL, pl, { abajo: true, k: 1.12 });
    return bA;
  }
  function brazoConCetro(pz, pl, cetro) {
    var bD = huesos(BRAZO_CETRO);
    cetro();
    miembroPiel(bD, G_BRAZO, pz, pl);
    puno(59.8, -120.6, 54.4, -125, pz, pl, { k: 1.12 });
    return bD;
  }
  function pieles(pl) { return { pz: tonoPiel(pl.c, -40, -215, 75, 0, 0.14), pzL: tonoPiel(U.mezcla(pl.c, pl.c2, 0.5), -40, -215, 75, 0, 0.12) }; }

  /* ---------- Anubis: cabeza de chacal negro, cetro uas y ankh (ref. 2) ---------- */
  function dibujarAnubis(ctx, x, y, s, op) {
    empezar(ctx, x, y, s, op);
    X.translate(-MEDIO_PASO, 0);
    var pl = PIEL, t = pieles(pl);
    pelucaAtras(P.negro, P.negro2, { grande: true });
    cola(negro(-34, -150, -26, -40), 140);
    piernasEnPaso(pl, { tobilleras: P.lapis });
    torsoHombre(t.pz, pl, false);
    // el corpiño de lapislázuli, con sus tirantes (ref. 2)
    var corp = [[-30.2, -180, 1], [-28.2, -172], [-25, -160], [-21.6, -150], [-21.4, -146, 1], [10.4, -146, 1], [10, -148], [12.4, -160], [17.6, -171], [22.6, -178], [27.4, -182.4, 1]];
    var fC = camino(corp);
    X.beginPath(); fC(X); X.fillStyle = lin(-30, -184, 28, -146, [[0, C.lapisClaro], [0.5, P.lapis], [1, P.lapis2]]); X.fill();
    brillo(fC, -30, -186, 4, -160, 0.3, [200, 216, 255]);
    rellena([[-24, -205, 1], [-20.4, -205, 1], [-17.4, -181, 1], [-21.6, -181, 1]], col(P.lapis2));
    rellena([[19.6, -205, 1], [23.2, -205, 1], [20.8, -182, 1], [16.4, -182, 1]], col(P.lapis2));
    falda({ forro: C.menta, cenefa: P.lapis });
    cinturon([C.lavanda, P.turquesa, C.lavanda, C.menta, C.lavanda, P.lapis2]);
    var bA = brazoConAnkh(t.pzL, pl);
    X.save(); X.translate(CAB_ANIMAL[0], CAB_ANIMAL[1] + 1); X.scale(1.52, 1.52); cabezaChacal(); X.restore();
    collar(1.5, -210, 32, 23, 0.32, [P.turquesa, 'oro', P.cornalina, P.lapis, 'oro', P.turquesa], { ngotas: 19, gota: 3.2 });
    pelucaDelante(P.negro, P.negro2, -19, -5, { punta: [P.oro2, 3.4] });
    var bD = brazoConCetro(t.pz, pl, function () { uas(59.8, -284, 0, P.lapis2, { anillos: [-216, -38], grosor: 2.8 }); });
    brazalete(bA, G_BRAZO, 0.2, 0.28, { color: P.lapis }); brazalete(bD, G_BRAZO, 0.2, 0.28, { color: P.lapis });
    brazalete(bA, G_BRAZO, 0.87, 0.95); brazalete(bD, G_BRAZO, 0.87, 0.95);
    acabar();
  }

  /* ---------- Horus: cabeza de halcón, la doble corona roja y blanca, cetro uas (ref. 4) ---------- */
  function dibujarHorus(ctx, x, y, s, op) {
    empezar(ctx, x, y, s, op);
    X.translate(-MEDIO_PASO, 0);
    var pl = PIEL, t = pieles(pl);
    pelucaAtras(P.negro, P.negro2, { punta: [C.lavanda, 4] });
    cola(oro(-34, -150, -26, -10, 0.3), 136);
    piernasEnPaso(pl, { tobilleras: P.lapis });
    torsoHombre(t.pz, pl, true);
    falda({ pliegues: 'rectos', bajo: -88 });
    delantal(P.cornalina, { diagonal: true, colRaya: P.rojo });
    cinturon([P.oro2, P.rojo, P.verde, P.rojo, P.oro2, P.lapis]);
    var bA = huesos(BRAZO_CUELGA);
    miembroPiel(bA, G_BRAZO, t.pzL, pl, { oscuro: true });
    puno(-31.8, -99.6, -33, -106, t.pzL, pl, { abajo: true, k: 1.12 });
    cuello(rel(P.lino, -7, -224, 10, -206, 0.12), { c2: P.lino2 });
    X.save(); X.translate(CAB_ANIMAL[0], CAB_ANIMAL[1]); X.scale(1.52, 1.52); cabezaHalcon({ capucha: P.negro, anillo: P.turquesa }); X.restore();
    collar(1.5, -210, 33, 23.5, 0.3, [P.verde, 'oro', P.cornalina, P.turquesa, 'oro', P.lapis], { ngotas: 19, gota: 3.2, cuentas: P.oro1 });
    pelucaDelante(P.negro, P.negro2, 7, 20, { punta: [C.lavanda, 4.6] });
    var bD = brazoConCetro(t.pz, pl, function () { uas(59.8, -276, 0, C.lapisClaro, { anillos: [-38], grosor: 2.6 }); });
    brazalete(bA, G_BRAZO, 0.2, 0.28, { color: C.lavanda }); brazalete(bD, G_BRAZO, 0.2, 0.28, { color: C.lavanda });
    brazalete(bA, G_BRAZO, 0.87, 0.95, { color: C.lavanda }); brazalete(bD, G_BRAZO, 0.87, 0.95, { color: C.lavanda });
    pschent(-4.6, -258, 0.94);
    acabar();
  }

  /* ---------- Ra: cabeza de halcón con el disco solar y el ureo, cetro uas y ankh (ref. 4) ---------- */
  function dibujarRa(ctx, x, y, s, op) {
    empezar(ctx, x, y, s, op);
    X.translate(-MEDIO_PASO, 0);
    var pl = PIEL, t = pieles(pl);
    pelucaAtras(P.lapis, C.lapisClaro, { punta: [P.turquesa, 4] });
    cola(oro(-34, -150, -26, -10, 0.3), 140);
    piernasEnPaso(pl, {});
    torsoHombre(t.pz, pl, true);
    // el vestido de red de cuentas (de las axilas a la rodilla), con tirantes
    var vest = [[-30.2, -180, 1], [-28.2, -172], [-25, -160], [-21.6, -150], [-23, -140], [-27.4, -124], [-29, -106], [-27, -90, 1], [33.4, -94, 1], [20, -118], [12, -138], [10, -148], [12.4, -160], [17.6, -171], [22.6, -178], [27.4, -182.4, 1]];
    var fv = camino(vest);
    redCuentas(fv, caja(vest), U.mezcla(P.lino2, P.lino, 0.3), U.mezcla(P.lino2, P.piedra2, 0.5), 2.6, { a: 0.75 });
    rellena([[-23.4, -205, 1], [-20.4, -205, 1], [-17.6, -181, 1], [-21.2, -181, 1]], col(U.mezcla(P.lino2, P.piedra2, 0.3)));
    rellena([[19.4, -205, 1], [22.4, -205, 1], [20.4, -182, 1], [16.8, -182, 1]], col(U.mezcla(P.lino2, P.piedra2, 0.3)));
    rellena([[-27.4, -94, 1], [33, -98, 1], [33.4, -94, 1], [-27, -90, 1]], col(U.mezcla(P.piedra2, P.tinta, 0.2), 0.8));
    // el faldellín de oro, cruzado delante (ref. 4)
    var sash = [[-6, -146, 1], [12, -146, 1], [16, -134], [22, -120], [28, -104], [31.4, -96], [27, -98], [14, -110], [2, -124], [-5, -136]];
    rellena(sash, oro(-6, -146, 31, -96, 0.32));
    brillo(camino(sash), -6, -146, 10, -120, 0.4);
    cinturon(null);
    rellena([[-6, -154.6, 1], [2.6, -154.6, 1], [2.6, -144.6, 1], [-6, -144.6, 1]], oro(-6, -155, 2.6, -144, 0.5));
    var bA = brazoConAnkh(t.pzL, pl);
    cuello(rel(P.lino, -7, -224, 10, -206, 0.12), { c2: P.lino2 });
    X.save(); X.translate(CAB_ANIMAL[0], CAB_ANIMAL[1]); X.scale(1.52, 1.52); cabezaHalcon({ capucha: P.lapis, anillo: P.negro2, iris: P.cornalina, pico: C.lavanda, cera: P.lino2 }); X.restore();
    collar(1.5, -210, 33, 23.5, 0.3, [P.oro2, P.turquesa, 'oro', P.turquesa, 'oro'], { ngotas: 19, gota: 3.2, cuentas: P.lino });
    pelucaDelante(P.lapis, C.lapisClaro, 7, 20, { punta: [P.turquesa, 4.6] });
    var bD = brazoConCetro(t.pz, pl, function () { uas(59.8, -276, 0, C.lavanda, { anillos: [], grosor: 2.5 }); });
    brazalete(bA, G_BRAZO, 0.2, 0.3); brazalete(bD, G_BRAZO, 0.2, 0.3);
    brazalete(bA, G_BRAZO, 0.86, 0.95); brazalete(bD, G_BRAZO, 0.86, 0.95);
    discoSolar(-3.4, -278, 18);
    acabar();
  }

  /* ---------- Thot: cabeza de ibis, el disco lunar con la media luna; escribe en una paleta con un cálamo (ref. 4) ---------- */
  function dibujarThot(ctx, x, y, s, op) {
    empezar(ctx, x, y, s, op);
    X.translate(-MEDIO_PASO, 0);
    var pl = PIEL, t = pieles(pl);
    // la peluca grande de lapislázuli claro (ref. 4)
    var pel = [[-2, -264], [-18, -263], [-33, -255], [-44, -240], [-49, -218], [-49.6, -196], [-48, -174], [-46.4, -162, 1], [-12, -162, 1], [-9, -184], [-5.6, -204], [-2.4, -224], [-0.6, -246]];
    peluca(pel, mechones(-50, -2, 3.5, -266, -160, -3), C.lapisClaro, C.lavanda, { aRaya: 0.55, ancho: 1.6, punta: [P.oro2, 3], colBrillo: [220, 230, 255] });
    cola(oro(-34, -150, -26, -10, 0.3), 136);
    piernasEnPaso(pl, {});
    torsoHombre(t.pz, pl, false);
    // el corpiño de red de cuentas (ref. 4: pardo con rayas)
    var corp = [[-30.2, -180, 1], [-28.2, -172], [-25, -160], [-21.6, -150], [-21.4, -146, 1], [10.4, -146, 1], [10, -148], [12.4, -160], [17.6, -171], [22.6, -178], [27.4, -182.4, 1]];
    redCuentas(camino(corp), caja(corp), U.mezcla(P.piedra2, P.tinta, 0.35), P.piedra, 2.2, { bandas: P.tinta, a: 0.6 });
    falda({ pliegues: false, bajo: -88 });
    delantal(P.oro2, { oro: true, colRaya: P.oro3, bajo: -94 });
    // el colgante del ankh de turquesa sobre el delantal
    X.save(); X.translate(7, -136); X.scale(0.5, 0.5);
    X.beginPath(); X.ellipse(0, 5, 4.4, 5.4, 0, 0, TAU); X.moveTo(2.4, 5.4); X.ellipse(0, 5.4, 2.2, 3.4, 0, 0, TAU, true);
    X.rect(-7, 10, 14, 3.2); X.moveTo(-1.6, 12); X.lineTo(1.6, 12); X.lineTo(2.4, 30); X.lineTo(-2.4, 30); X.closePath();
    X.fillStyle = col(P.turquesa); X.fill(); X.restore();
    cinturon([P.turquesa, P.rojo, P.turquesa, P.oro2]);
    // el brazo de delante: el antebrazo levantado sujeta la paleta de escriba
    var bD = huesos([HOMBRO_DELANTE, [45, -165], [57, -183]]);
    miembroPiel(bD, G_BRAZO, t.pzL, pl, { oscuro: true });
    paletaEscriba(61.2, -214, 6, 58);
    puno(64.2, -184, 57, -183, t.pzL, pl);
    // la cabeza de ibis, el collar
    X.save(); X.translate(CAB_ANIMAL[0] - 1, CAB_ANIMAL[1] - 4); X.scale(1.55, 1.55); cabezaIbis(); X.restore();
    collar(1.5, -210, 32, 23, 0.32, [C.menta, P.turquesa, 'oro', P.turquesa, C.menta], { ngotas: 17, gota: 3, cuentas: P.lino, colGotas: [P.turquesa, 'oro'] });
    // el brazo de atrás cruza el pecho con el cálamo
    var bA = huesos([HOMBRO_ATRAS, [-8, -165], [30, -184]]);
    miembroPiel(bA, G_BRAZO, t.pz, pl);
    calamo(38.6, -196.8, 62.4, -190.6);
    mano('pinza', 30, -184, -0.6, 1, t.pz, pl, 1.05);
    brazalete(bA, G_BRAZO, 0.22, 0.32); brazalete(bD, G_BRAZO, 0.22, 0.32);
    brazalete(bA, G_BRAZO, 0.86, 0.95); brazalete(bD, G_BRAZO, 0.86, 0.95);
    discoLunar(-7, -271, 11.5);
    acabar();
  }
  // la paleta de escriba: una tablilla larga de madera dorada con los dos pocillos (rojo y negro) y la ranura de los cálamos
  function paletaEscriba(x0, y0, w, h) {
    var p = [[x0, y0, 1], [x0 + w, y0, 1], [x0 + w, y0 + h, 1], [x0, y0 + h, 1]];
    var fn = camino(p);
    X.beginPath(); ES.redondo(X, x0, y0, w, h, 1.2); X.fillStyle = oro(x0, y0, x0 + w, y0 + h * 0.4, 0.3); X.fill();
    X.fillStyle = col(P.oro4, 0.45); X.beginPath(); ES.redondo(X, x0 + w / 2 - 0.9, y0 + 12, 1.8, h - 18, 0.9); X.fill();
    X.beginPath(); X.arc(x0 + w / 2, y0 + 3.6, 1.35, 0, TAU); X.fillStyle = col(P.rojo); X.fill();
    X.beginPath(); X.arc(x0 + w / 2, y0 + 7.8, 1.35, 0, TAU); X.fillStyle = col(P.negro); X.fill();
    sombra(fn, x0, y0, x0 + w, y0 + h, 0.2);
  }
  // el cálamo: un junco fino con la punta mojada de tinta
  function calamo(x0, y0, x1, y1) {
    X.strokeStyle = lin(x0, y0, x1, y1, [[0, P.oro1], [0.5, P.oro2], [1, P.oro3]]); X.lineWidth = 1.2; X.lineCap = 'round';
    X.beginPath(); X.moveTo(x0, y0); X.lineTo(x1, y1); X.stroke();
    X.strokeStyle = col(P.negro); X.beginPath(); X.moveTo(x1 - (x1 - x0) * 0.06, y1 - (y1 - y0) * 0.06); X.lineTo(x1, y1); X.stroke();
  }

  /* =====================================================================================================================
     8. Osiris: piel verde, corona atef, cayado y mayal cruzados, el cuerpo envuelto como una momia (ref. 4)
     ===================================================================================================================== */
  // la corona atef: la corona blanca con las dos plumas de avestruz que se rizan arriba
  function atef(bx, by, k) {
    X.save(); X.translate(bx, by); X.scale(k, k);
    // las plumas: una delante y otra detrás, pegadas a la corona, que se rizan hacia fuera arriba (ref. 4: a cuadros, filo de oro)
    function pluma(lado) {
      var p = lado > 0
        ? [[7.6, 2, 1], [15.4, 2, 1], [15.6, -14], [16.6, -30], [18.4, -44], [21.4, -53], [24.8, -56], [25.8, -60.2], [22.6, -62.4], [17.4, -60.6], [12.6, -54], [9.6, -42], [8, -26], [7.4, -12]]
        : [[-15.4, 2, 1], [-7.6, 2, 1], [-7.4, -12], [-8, -26], [-9.6, -42], [-12.6, -54], [-17.4, -60.6], [-22.6, -62.4], [-25.8, -60.2], [-24.8, -56], [-21.4, -53], [-18.4, -44], [-16.6, -30], [-15.6, -14]];
      var fn = camino(p), b = caja(p);
      X.beginPath(); fn(X); X.fillStyle = oro(b[0], b[1], b[2], b[3], 0.3); X.fill();
      // el dentro, a cuadros, algo más pequeño que el filo de oro
      var q = []; for (var i = 0; i < p.length; i++) q.push([p[i][0] - lado * 1.1 + (p[i][0] - (b[0] + b[2]) / 2) * -0.12, p[i][1] * 0.97 - 0.4, p[i][2]]);
      var fq = camino(q);
      X.beginPath(); fq(X); X.fillStyle = col(P.lino); X.fill();
      recortar(fq);
      for (var yy = -64, k2 = 0; yy < 4; yy += 3, k2++) {
        X.fillStyle = col(k2 % 3 === 0 ? P.turquesa : k2 % 3 === 1 ? C.gris : P.lino2, 0.8);
        X.fillRect(b[0], yy, b[2] - b[0], 1.4);
      }
      X.strokeStyle = col(P.negro2, 0.3); X.lineWidth = 0.4; X.beginPath();
      for (var xx = b[0] - 6; xx < b[2] + 6; xx += 2.2) { X.moveTo(xx, -66); X.lineTo(xx + lado * 4, 4); }
      X.stroke();
      soltar();
      sombra(fn, b[0], b[1], b[2], b[3], 0.18);
    }
    pluma(-1);
    // la corona blanca (hedjet) con su red fina y el bulbo arriba
    var bl = [[-10.4, 2, 1], [10.4, 2, 1], [10.2, -12], [8.4, -26], [5.6, -38], [4.6, -44], [5.6, -48.6], [3.6, -53.8], [-0.4, -55.6], [-4.4, -53.6], [-5.6, -48.6], [-4.8, -44], [-6.2, -36], [-9, -22], [-10.4, -10]];
    var fb = camino(bl), bb = caja(bl);
    X.beginPath(); fb(X); X.fillStyle = lin(-10, -55, 10, 2, [[0, [255, 255, 250]], [0.45, P.lino], [1, P.lino2]]); X.fill();
    recortar(fb);
    X.strokeStyle = col(C.canto, 0.22); X.lineWidth = 0.35; X.beginPath();
    for (var d = -70; d < 30; d += 2.4) { X.moveTo(-12, d); X.lineTo(12, d + 14); X.moveTo(-12, d + 14); X.lineTo(12, d); }
    X.stroke();
    soltar();
    sombra(fb, -2, -50, 10, -10, 0.24, C.canto);
    brillo(fb, -10, -55, 0, -24, 0.5);
    pluma(1);
    // la diadema de abajo
    X.beginPath(); ES.redondo(X, -16, -1.6, 32.4, 3.6, 1); X.fillStyle = oro(-16, -2, -16, 2, 0.4); X.fill();
    X.restore();
  }
  // el cayado (heqa): la vara con el gancho arriba, a bandas de lapislázuli y oro
  function cayado(x0, y0, x1, y1, r) {
    // la vara de (x0, y0) (abajo) a (x1, y1) (arriba) y el gancho que se curva hacia delante
    var ang = Math.atan2(y1 - y0, x1 - x0), L = Math.hypot(x1 - x0, y1 - y0);
    X.save(); X.translate(x0, y0); X.rotate(ang);
    var w = 2.8;
    function forma(k) {
      k.moveTo(0, -w / 2); k.lineTo(L, -w / 2);
      k.bezierCurveTo(L + r * 0.9, -w / 2, L + r * 1.3, r * 0.9, L + r * 0.6, r * 1.2);
      k.bezierCurveTo(L + r * 0.2, r * 1.4, L - r * 0.25, r * 1.1, L - r * 0.2, r * 0.6);
      k.lineTo(L - r * 0.2 + w * 0.9, r * 0.62);
      k.bezierCurveTo(L - r * 0.1 + w * 0.6, r * 0.9, L + r * 0.4, r * 0.96, L + r * 0.6, r * 0.7);
      k.bezierCurveTo(L + r * 0.84, r * 0.36, L + r * 0.5, w / 2, L, w / 2);
      k.lineTo(0, w / 2); k.closePath();
    }
    X.beginPath(); forma(X); X.fillStyle = col(P.lapis); X.fill();
    recortar(forma);
    for (var d = 2; d < L + r * 3; d += 5.2) { X.fillStyle = oro(d, -3, d + 2.6, 3, 0.4); X.fillRect(d, -r * 2, 2.6, r * 4); }
    X.fillStyle = lin(0, -w, 0, w, [[0, [255, 255, 255], 0.3], [0.5, [255, 255, 255], 0], [1, [0, 0, 0], 0.25]]); X.fillRect(-2, -w, L + 2, w * 2);
    soltar();
    X.restore();
  }
  // el mayal (nekhakha): el mango de oro, en diagonal, y las tres tiras de cuentas que cuelgan de su punta
  function mayal(x0, y0, x1, y1, largo) {
    // las tiras primero (quedan detrás del mango)
    for (var i = 0; i < 3; i++) {
      var dx = -2.4 + i * 2.4, cols = [P.oro2, P.cornalina, P.oro2, P.lapis];
      for (var j = 0; j < 7; j++) {
        var yy = y1 + 2.4 + j * (largo / 7), xx = x1 + dx - j * 0.45 * (i - 1);
        X.fillStyle = j % 2 ? col(cols[(j + i) % 4]) : oro(xx - 1, yy, xx + 1, yy + 3, 0.4);
        X.beginPath(); X.ellipse(xx, yy + largo / 14, 1.05, largo / 15, 0.06 * (i - 1), 0, TAU); X.fill();
      }
    }
    X.strokeStyle = oro(x0, y0, x1, y1, 0.4); X.lineWidth = 2.6; X.lineCap = 'round';
    X.beginPath(); X.moveTo(x0, y0); X.lineTo(x1, y1); X.stroke();
    X.strokeStyle = col(P.lapis); X.lineWidth = 2.7; X.lineCap = 'butt';
    for (var k = 0.25; k < 0.95; k += 0.22) { var px = U.lerp(x0, x1, k), py = U.lerp(y0, y1, k), ux = (x1 - x0) / 60, uy = (y1 - y0) / 60; X.beginPath(); X.moveTo(px, py); X.lineTo(px + ux * 2.6, py + uy * 2.6); X.stroke(); }
    X.lineCap = 'round';
    X.fillStyle = oro(x1 - 3, y1 - 3, x1 + 3, y1 + 3, 0.4); X.beginPath(); X.ellipse(x1, y1 + 1, 3.6, 2.2, 0, 0, TAU); X.fill();
  }
  function dibujarOsiris(ctx, x, y, s, op) {
    empezar(ctx, x, y, s, op);
    var pl = PIEL_V;
    // las tiras del mayal cuelgan por detrás del hombro de atrás
    // los pies verdes, juntos (el de lejos un poco adelantado)
    var pv = tonoPiel(pl.c, -20, -20, 30, 0, 0.14), pvL = tonoPiel(U.mezcla(pl.c, pl.c2, 0.5), -20, -20, 30, 0, 0.12);
    pie(-10, 40, pvL, pl);
    pie(-17, 40, pv, pl);
    // el cuerpo envuelto: el sudario blanco, ceñido, que se abre un poco abajo (ref. 4)
    var cu = [[-8, -212], [-22, -209.4], [-31.6, -205.4], [-36.6, -198.6], [-37, -188], [-34.4, -172], [-31, -155], [-28.6, -138], [-30, -120], [-29.6, -100], [-27, -74], [-26, -52], [-26.6, -30], [-28.4, -16], [-30.6, -8.4, 1],
      [28.2, -8.4, 1], [25.6, -16], [23.2, -30], [22, -52], [22.4, -74], [23, -98], [21.8, -120], [22.4, -140], [25, -160], [30, -174], [35.4, -187], [37, -198.6], [32.4, -205.4], [22, -209.4], [9, -212]];
    var fc = camino(cu), b = caja(cu);
    X.beginPath(); fc(X); X.fillStyle = lin(b[0], b[1], b[2], b[3], [[0, [255, 253, 246]], [0.4, P.lino], [1, P.lino2]]); X.fill();
    lineas(fc, [[-20, -196, -17, -120, -20, -12], [-12, -186, -10, -110, -11, -10], [-3, -140, -1, -80, -2, -9], [6, -140, 8, -76, 7, -9], [14, -140, 15, -70, 17, -10]], C.pliegue, 0.4, 0.5);
    sombra(fc, 12, -190, 36, -60, 0.18, P.piedra2);
    sombra(fc, -10, -150, -31, -150, 0.12, P.piedra2);
    brillo(fc, -37, -200, -6, -120, 0.3);
    X.strokeStyle = col(P.lino2); X.lineWidth = 0.8; X.beginPath(); X.moveTo(-30.4, -8.6); X.lineTo(28, -8.6); X.stroke();
    // el fajín rojo con el nudo y las dos cintas largas
    var faja = [[-30, -152, 1], [23.4, -152, 1], [23.8, -144, 1], [-29.8, -144, 1]];
    rellena(faja, rel(P.rojo, -30, -152, 24, -144, 0.2));
    lineas(camino(faja), [[-32, -148, 26, -148]], P.oro2, 0.7, 0.6);
    function cinta(x0, dx) {
      var p = [[x0, -146, 1], [x0 + 4, -146, 1], [x0 + 4.6 + dx, -82, 1], [x0 + 0.4 + dx, -82, 1]];
      rellena(p, rel(P.cornalina, x0, -146, x0 + 5, -82, 0.2));
      var r = []; for (var yy = -144; yy < -82; yy += 3) r.push([x0 - 2, yy, x0 + 8, yy]);
      lineas(camino(p), r, P.oro2, 0.7, 0.55, 'butt');
    }
    cinta(5, 0.6); cinta(11.4, 1.4);
    gema(10.6, -148, 3, P.cornalina);
    // la cabeza verde
    X.save(); X.translate(-3, -226); cabezaHumana({ pl: pl, mejilla: [190, 255, 200], labio: U.mezcla(pl.c2, P.lapis, 0.2), kohl: P.negro }); X.restore();
    collar(1.2, -210, 32, 23, 0.32, [P.oro2, P.turquesa, 'oro', C.lavanda, P.verde, 'oro'], { ngotas: 19, gota: 3.2, colGotas: [P.cornalina, 'oro', P.turquesa, 'oro'] });
    // la barba de dios, encima del collar
    X.save(); X.translate(-3, -226); barba('dios', {}); X.restore();
    // los antebrazos envueltos en el lino, cruzados, y las manos verdes con el cayado (delante) y el mayal (detrás)
    var mA = [[-30, -184], [-16, -180.4], [-2, -175.6], [6, -173.4], [6.6, -167.4], [-2, -168.4], [-16, -171.6], [-30, -174]];
    rellena(mA, lin(-30, -184, 6, -167, [[0, P.lino], [1, P.lino2]]));
    sombra(camino(mA), 0, -184, 0, -167, 0.16, P.piedra2);
    mayal(5, -176.6, -26, -214, 36);
    var hv = tonoPiel(pl.c, 0, -186, 20, -164, 0.16), Gm = [[0, 3, 3], [1, 2.9, 2.9]];
    var muA = huesos([[-2, -174], [5.2, -176]]);
    brazalete(muA, Gm, 0.1, 0.6);
    puno(8.6, -176.2, 4.4, -176, hv, pl, { k: 0.95 });
    var mD = [[-22, -173], [-8, -170], [6, -166.4], [13.6, -164.4], [14, -158.6], [6, -159.4], [-8, -162.6], [-22, -165]];
    rellena(mD, lin(-22, -173, 14, -158, [[0, ES.aclarar(P.lino, 0.3)], [1, P.lino2]]));
    sombra(camino(mD), 0, -173, 0, -158, 0.16, P.piedra2);
    cayado(3, -142, 26, -219, 5.6);
    var muD = huesos([[7, -165], [13.2, -166.6]]);
    brazalete(muD, Gm, 0.1, 0.62);
    puno(16.8, -166.8, 12.6, -166.6, hv, pl, { k: 0.95 });
    atef(-3.4, -244, 1.04);
    acabar();
  }

  /* =====================================================================================================================
     9. Isis: de rodillas, con las alas abiertas y el trono jeroglífico sobre la cabeza (ref. 1)
     ===================================================================================================================== */
  var CARA_M = [[-7, 21, 1], [-7.4, 12], [-11.6, 6], [-16, -2], [-16, -11], [-10.6, -17.6], [-2, -21], [7.6, -20], [14, -15.4], [16.2, -10], [17.2, -6.6], [17, -4.8], [18.8, -1.2],
    [20.6, 1.8], [20.8, 3], [19.6, 4], [18.6, 4.4], [18.6, 5.6], [19.8, 6.8], [18.5, 8], [19.4, 9.3], [18, 10.7], [17.2, 11.1], [17.6, 12.8], [15.6, 14.6], [11.6, 15], [8.8, 16], [8, 21, 1]];
  function cabezaMujer(op) {
    op = op || {};
    var pl = op.pl || PIEL_M, fn = camino(CARA_M);
    X.beginPath(); fn(X); X.fillStyle = rel(pl.c, -16, -21, 21, 21, 0.14); X.fill();
    recortar(fn);
    X.fillStyle = ES.rad(X, 11, 3, 0, 8.5, [[0, [255, 214, 186], 0.4], [1, [255, 214, 186], 0]]); X.fillRect(0, -6, 23, 19);
    X.fillStyle = lin(0, 12, 0, 21, [[0, pl.c2, 0], [1, pl.c2, 0.4]]); X.fillRect(-10, 12, 22, 10);
    soltar();
    sombra(fn, 4, -10, -16, 6, 0.18, pl.c2);
    X.strokeStyle = col(pl.c2, 0.6); X.lineWidth = 0.6; X.beginPath(); X.moveTo(19.2, 3.2); X.quadraticCurveTo(17.8, 2.4, 18.3, 1); X.stroke();
    X.fillStyle = col(U.mezcla(P.cornalina, pl.c, 0.4), 0.75);
    X.beginPath(); X.moveTo(18.8, 5.8); X.quadraticCurveTo(20, 6.9, 18.5, 8); X.quadraticCurveTo(19.6, 9.3, 18.1, 10.8); X.lineTo(16.4, 9.2); X.lineTo(16.6, 7); X.closePath(); X.fill();
    X.strokeStyle = col(ES.oscurecer(pl.c2, 0.35), 0.7); X.lineWidth = 0.5; X.beginPath(); X.moveTo(18.6, 8); X.quadraticCurveTo(17.4, 8.3, 16.4, 8.1); X.stroke();
    ojo(11, -3.4, 8.6, { ext: 6.4, altCeja: 2.4 });
  }
  // el trono jeroglífico (st): el asiento visto de perfil con su respaldo y el cuadradito del costado
  function trono(bx, by, k) {
    X.save(); X.translate(bx, by); X.scale(k, k);
    var p = [[-10, 0, 1], [11, 0, 1], [11, -9, 1], [-2, -9, 1], [-2, -26, 1], [-10, -26, 1]];
    var fn = camino(p);
    X.beginPath(); fn(X); X.fillStyle = oro(-10, -26, 11, 0, 0.3); X.fill();
    // las incrustaciones de lapislázuli
    X.fillStyle = lin(-8, -24, -4, -12, [[0, C.lapisClaro], [1, P.lapis2]]); X.fillRect(-8.2, -24, 4.4, 12.4);
    X.fillStyle = lin(0, -7, 9, -2, [[0, C.lapisClaro], [1, P.lapis2]]); X.fillRect(0.2, -7.2, 9, 5.2);
    // el cuadradito de abajo del respaldo (como en el signo)
    X.fillStyle = col(P.cornalina); X.fillRect(-8.2, -9.6, 4.4, 7.6);
    X.fillStyle = col([255, 255, 255], 0.35); X.fillRect(-10, -26, 1.2, 26);
    X.restore();
  }
  /* un ala abierta: un abanico centrado en el hombro (cx, cy) entre los ángulos a0 (el borde de arriba, el del brazo)
     y a1; R0 el radio arriba y R1 abajo. Bandas de dentro afuera: oro (las coberteras, en escamas), turquesa,
     lapislázuli y las plumas largas de cornalina (ref. 1) */
  function ala(cx, cy, a0, a1, R0, R1) {
    var n = 22, i, sent = a1 > a0 ? 1 : -1;
    function R(t) { return U.lerp(R0, R1, 0.5 - 0.5 * Math.cos(Math.PI * t)); }
    function punto(t, f) { var a = a0 + (a1 - a0) * t, r = R(t) * f; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }
    function banda(f0, f1) {
      return function (k) {
        var q = punto(0, f0); k.moveTo(q[0], q[1]);
        for (i = 0; i <= n; i++) { q = punto(i / n, f1); k.lineTo(q[0], q[1]); }
        for (i = n; i >= 0; i--) { q = punto(i / n, f0); k.lineTo(q[0], q[1]); }
        k.closePath();
      };
    }
    var bb = [cx - R0, cy - R0, cx + R0, cy + R0];
    // las plumas largas, con la punta redondeada: las pares y las impares, cada grupo en un solo relleno (degradado radial:
    // más oscuras en la raíz y más claras en la punta); los raquis, en un solo trazo
    var np = 15, gr;
    for (var par = 0; par < 2; par++) {
      X.beginPath();
      for (i = par; i < np; i += 2) {
        var ta = i / np, tb = (i + 1) / np, tm = (ta + tb) / 2;
        var p1 = punto(ta, 0.66), p2 = punto(tb, 0.66), p3 = punto(tb, 0.97), p4 = punto(ta, 0.97), pt = punto(tm, 1.04);
        X.moveTo(p1[0], p1[1]); X.lineTo(p4[0], p4[1]); X.quadraticCurveTo(pt[0] + (p4[0] - p3[0]) * 0.1, pt[1] + (p4[1] - p3[1]) * 0.1, pt[0], pt[1]);
        X.quadraticCurveTo(pt[0] - (p4[0] - p3[0]) * 0.1, pt[1] - (p4[1] - p3[1]) * 0.1, p3[0], p3[1]); X.lineTo(p2[0], p2[1]); X.closePath();
      }
      var cp = par ? P.cornalina : U.mezcla(P.cornalina, P.rojo, 0.55);
      gr = X.createRadialGradient(cx, cy, Math.min(R0, R1) * 0.6, cx, cy, Math.max(R0, R1) * 1.04);
      gr.addColorStop(0, col(ES.oscurecer(cp, 0.14))); gr.addColorStop(0.5, col(cp)); gr.addColorStop(1, col(ES.aclarar(cp, 0.16)));
      X.fillStyle = gr; X.fill();
    }
    X.strokeStyle = col(ES.aclarar(P.cornalina, 0.35), 0.6); X.lineWidth = 0.5; X.beginPath();
    for (i = 0; i < np; i++) { var r1 = punto((i + 0.5) / np, 0.7), r2 = punto((i + 0.5) / np, 0.98); X.moveTo(r1[0], r1[1]); X.lineTo(r2[0], r2[1]); }
    X.stroke();
    // lapislázuli y turquesa, en plumas cortas
    X.beginPath(); banda(0.5, 0.7)(X); X.fillStyle = lin(bb[0], bb[1], bb[2], bb[3], [[0, C.lapisClaro], [0.5, P.lapis], [1, P.lapis2]]); X.fill();
    X.beginPath(); banda(0.4, 0.52)(X); X.fillStyle = lin(bb[0], bb[1], bb[2], bb[3], [[0, C.menta], [0.5, P.turquesa], [1, ES.oscurecer(P.turquesa, 0.2)]]); X.fill();
    X.strokeStyle = col(P.lapis2, 0.6); X.lineWidth = 0.5; X.beginPath();
    for (i = 1; i < 30; i++) { var q0 = punto(i / 30, 0.5), q1 = punto(i / 30, 0.7); X.moveTo(q0[0], q0[1]); X.lineTo(q1[0], q1[1]); }
    X.stroke();
    // las puntas redondeadas de las plumas cortas (una fila de escamas en el borde de cada banda)
    X.fillStyle = col(P.lapis); X.beginPath();
    for (i = 0; i < 30; i++) { var qq = punto((i + 0.5) / 30, 0.7); X.moveTo(qq[0] + 1.6, qq[1]); X.arc(qq[0], qq[1], 1.6, 0, TAU); }
    X.fill();
    X.fillStyle = col(P.turquesa); X.beginPath();
    for (i = 0; i < 26; i++) { var qt = punto((i + 0.5) / 26, 0.52); X.moveTo(qt[0] + 1.4, qt[1]); X.arc(qt[0], qt[1], 1.4, 0, TAU); }
    X.fill();
    // las coberteras de oro, en escamas
    var fo = banda(0.1, 0.42);
    X.beginPath(); fo(X); X.fillStyle = oro(bb[0], bb[1], bb[2], bb[3], 0.35); X.fill();
    recortar(fo);
    X.strokeStyle = col(P.oro4, 0.45); X.lineWidth = 0.45; X.beginPath();
    for (var f = 0.16; f < 0.44; f += 0.055) {
      var m = Math.round(8 + f * 30);
      for (i = 0; i < m; i++) {
        var e0 = punto(i / m, f), e1 = punto((i + 1) / m, f), em = punto((i + 0.5) / m, f + 0.045);
        X.moveTo(e0[0], e0[1]); X.quadraticCurveTo(em[0], em[1], e1[0], e1[1]);
      }
    }
    X.stroke();
    soltar();
    // rayas finas de oro entre las bandas
    X.strokeStyle = oro(bb[0], bb[1], bb[2], bb[3], 0.4); X.lineWidth = 0.7; X.beginPath();
    [0.42, 0.5, 0.7].forEach(function (fb) { var q = punto(0, fb); X.moveTo(q[0], q[1]); for (var j = 1; j <= n; j++) { q = punto(j / n, fb); X.lineTo(q[0], q[1]); } });
    X.stroke();
  }
  function dibujarIsis(ctx, x, y, s, op) {
    empezar(ctx, x, y, s, op);
    var pl = PIEL_M, pz = tonoPiel(pl.c, -60, -170, 60, 0, 0.14), pzL = tonoPiel(U.mezcla(pl.c, pl.c2, 0.45), -60, -170, 60, 0, 0.12);
    var HA = [-24, -115], HD = [24, -115];
    // el ala de atrás y su brazo, detrás de todo
    ala(HA[0], HA[1], -Math.PI + 0.88, -Math.PI - 0.62, 152, 88);
    var bA = huesos([HA, [-49, -142], [-71, -165]]);
    miembroPiel(bA, G_BRAZO_M, pzL, pl, { oscuro: true });
    mano('abierta', -71, -165, -Math.PI + 0.82, 1, pzL, pl, 0.95);
    brazalete(bA, G_BRAZO_M, 0.86, 0.95, { color: P.cornalina });
    // los pies, detrás, con los dedos doblados en el suelo
    var pies = [[-14, -13.4], [-21.6, -17.4], [-29.6, -15.6], [-36.4, -8.4], [-39.6, -2.4], [-38, 0, 1], [-24, 0, 1], [-15, -3.8]];
    rellena(pies, rel(pl.c, -40, -16, -15, 0, 0.16));
    // el cuerpo: torso, brazos de piel y el vestido ceñido de las axilas a los tobillos (ref. 1: azul con ondas)
    var torso = [[-6, -128], [-14, -126], [-22, -123.4], [-27.4, -119.6], [-28.6, -114], [-25, -109], [-22, -100], [22, -100], [24.4, -108], [28.4, -114], [27.2, -119.6], [22, -123.4], [14, -126], [6, -128]];
    rellena(torso, pz);
    var vest = [[-23, -112], [-21.4, -100], [-18.2, -86], [-18.6, -72], [-21.4, -58], [-23.6, -44], [-24, -32], [-22, -21], [-17.6, -12.6], [-10.6, -5], [-4, -1.6], [2, 0, 1], [43, 0, 1], [49.6, -1.8], [53.6, -7.4],
      [54, -16], [51.6, -24.4], [44, -30.6], [30, -35], [17.6, -38.6], [11.4, -46], [9.4, -60], [9.6, -80], [12, -88], [18.4, -94], [22.4, -100], [21.6, -107], [23.6, -112]];
    var fv = camino(vest), bv = caja(vest);
    X.beginPath(); fv(X); X.fillStyle = lin(bv[0], bv[1], bv[2], bv[3], [[0, ES.aclarar(C.lavanda, 0.25)], [0.5, C.lavanda], [1, ES.oscurecer(C.lapisClaro, 0.1)]]); X.fill();
    // las ondas del vestido (como el agua de la ref. 1) y la sombra
    recortar(fv);
    X.strokeStyle = col(P.lapis, 0.55); X.lineWidth = 0.7; X.beginPath();
    for (var yy = -108; yy < 2; yy += 5.4) {
      for (var xx = -32; xx < 60; xx += 6) { X.moveTo(xx, yy); X.quadraticCurveTo(xx + 1.5, yy - 1.4, xx + 3, yy); X.quadraticCurveTo(xx + 4.5, yy + 1.4, xx + 6, yy); }
    }
    X.stroke();
    soltar();
    brillo(fv, -30, -112, 10, -40, 0.25, [235, 242, 255]);
    sombra(fv, 0, -60, 30, 0, 0.22, P.lapis2);
    // la luz a lo largo del muslo y, debajo, la sombra fina que lo separa de la pantorrilla
    X.save(); X.beginPath(); fv(X); X.clip();
    X.translate(30, -33); X.scale(1, 0.22);
    X.fillStyle = ES.rad(X, 0, 0, 0, 30, [[0, [255, 255, 255], 0.24], [1, [255, 255, 255], 0]]); X.fillRect(-32, -32, 64, 64);
    X.restore();
    X.strokeStyle = col(P.lapis2, 0.45); X.lineWidth = 0.9; X.beginPath(); X.moveTo(51, -12.4); X.bezierCurveTo(36, -14.6, 8, -15, -17, -14.4); X.stroke();
    // el cinturón: una cinta roja
    rellena([[-18.6, -86, 1], [11.6, -86, 1], [11, -81, 1], [-18.2, -81, 1]], rel(P.rojo, -18, -86, 12, -81, 0.2));
    // la cabeza: el cuello, la cara y la peluca negra con la cinta, y el trono
    rellena([[-6.6, -140], [-6, -126], [7, -126], [8.4, -136]], rel(pl.c, -7, -140, 8, -126, 0.14));
    var pelI = [[-3, -164], [-14, -163], [-21, -157], [-24.4, -146], [-25, -132], [-24.2, -118], [-22.4, -110, 1], [-10, -110, 1], [-8, -122], [-5.4, -134], [-2.4, -146], [0.6, -156]];
    peluca(pelI, mechones(-25, -2, 3, -166, -108, -1.6), P.negro, P.negro2, { aRaya: 0.55, ancho: 1.4 });
    X.save(); X.translate(-1, -141); X.scale(0.96, 0.96); cabezaMujer({ pl: pl }); X.restore();
    // el pelo sobre la frente y la cinta (diadema) con su lazo detrás
    var flequillo = [[-4, -162.6], [4, -162], [10, -159.4], [14.6, -153.6], [15.4, -151.2], [8, -152.6], [0, -152.2], [-4, -150]];
    peluca(flequillo, [], P.negro, P.negro2, { brillo: 0.25 });
    X.strokeStyle = lin(-20, -156, 16, -152, [[0, P.turquesa], [1, ES.oscurecer(P.turquesa, 0.2)]]); X.lineWidth = 2.2;
    X.beginPath(); X.moveTo(-20, -154.6); X.quadraticCurveTo(-4, -158.6, 15.2, -152.6); X.stroke();
    X.fillStyle = col(P.turquesa); X.beginPath(); X.moveTo(-19, -155); X.quadraticCurveTo(-27, -152, -28, -146); X.quadraticCurveTo(-24, -149, -18, -153); X.closePath(); X.fill();
    X.beginPath(); X.moveTo(-19, -155); X.quadraticCurveTo(-25, -160, -29, -158); X.quadraticCurveTo(-25, -156, -19.4, -153.4); X.closePath(); X.fill();
    gema(-19.4, -154.4, 1.6, P.cornalina);
    collar(0.6, -125, 21, 15.5, 0.36, [P.turquesa, 'oro', P.cornalina, P.lapis, 'oro'], { ngotas: 15, gota: 2.4 });
    // el mechón de delante
    var mechI = [[-9.4, -138], [-2.4, -137.4], [-1.6, -126], [-1.4, -113], [-1.4, -108, 1], [-10, -108, 1], [-10.4, -120], [-10.2, -132]];
    peluca(mechI, mechones(-9, -2, 2.4, -140, -107, 0.4), P.negro, P.negro2, { aRaya: 0.55, ancho: 1.1 });
    trono(-3, -161.2, 1.05);
    // el ala de delante y su brazo, delante de todo
    ala(HD[0], HD[1], -0.88, 0.62, 152, 88);
    var bD = huesos([HD, [49, -142], [71, -165]]);
    miembroPiel(bD, G_BRAZO_M, pz, pl);
    mano('abierta', 71, -165, -0.82, -1, pz, pl, 0.95);
    brazalete(bD, G_BRAZO_M, 0.86, 0.95, { color: P.cornalina });
    brazalete(bA, G_BRAZO_M, 0.2, 0.28); brazalete(bD, G_BRAZO_M, 0.2, 0.28);
    acabar();
  }

  /* =====================================================================================================================
     10. El faraón: Ramsés II con la corona azul (jepresh), falda plisada, collar y cetro
     ===================================================================================================================== */
  // la corona azul (jepresh), en el marco de la cabeza: azul con anillitos de oro, el ureo delante y las cintas detrás
  function jepresh() {
    var p = [[15.4, -9.2], [16.8, -16], [16.4, -26], [14, -34.4], [8.4, -40.8], [0, -43.4], [-8.8, -42], [-15.8, -36.4], [-19.8, -28.4], [-22.4, -18.6], [-24.8, -9.6], [-24.4, -3.6], [-21.6, -1.4],
      [-17.4, -4.2], [-12.6, -7.8], [-6.2, -10.4], [1.4, -10.8], [8, -9.8], [12, -10.6]];
    var fn = camino(p), b = caja(p);
    // las cintas que cuelgan detrás
    rellena([[-20.6, -3], [-17.4, -3.4], [-15.6, 14], [-16.6, 26], [-19.2, 26.4], [-19.4, 12]], rel(P.cornalina, -21, -3, -15, 26, 0.2));
    rellena([[-23.6, -3], [-20.6, -3], [-20.8, 12], [-22.6, 22], [-25.2, 22], [-24.6, 10]], rel(P.oro2, -25, -3, -20, 22, 0.25));
    X.beginPath(); fn(X); X.fillStyle = lin(b[0], b[1], b[2], b[3], [[0, ES.aclarar(P.egipcio, 0.15)], [0.45, P.lapis], [1, P.lapis2]]); X.fill();
    // los anillitos de oro, al tresbolillo
    recortar(fn);
    X.strokeStyle = col(P.oro2, 0.95); X.lineWidth = 0.55; X.beginPath();
    for (var yy = -42, f = 0; yy < 0; yy += 3.1, f++) {
      for (var xx = -26 + (f % 2 ? 1.6 : 0); xx < 18; xx += 3.2) { X.moveTo(xx + 0.85, yy); X.arc(xx, yy, 0.85, 0, TAU); }
    }
    X.stroke();
    soltar();
    brillo(fn, b[0], b[1], b[0] + 22, b[1] + 22, 0.35, [200, 220, 255]);
    sombra(fn, b[0], b[1] + 20, b[2], b[3], 0.25, [8, 12, 40]);
    // la banda de delante, sobre la frente
    X.strokeStyle = oro(-6, -12, 16, -8, 0.4); X.lineWidth = 1.2; X.beginPath(); X.moveTo(15.2, -9.6); X.quadraticCurveTo(8, -10.2, 1.4, -11.2); X.stroke();
    // el ureo: la cobra de oro que se levanta en la frente, con el cuerpo que sube por la corona
    X.strokeStyle = oro(10, -34, 20, -12, 0.4); X.lineWidth = 1.3;
    X.beginPath(); X.moveTo(16.8, -14.6); X.bezierCurveTo(17.6, -20, 15, -24, 12.2, -28); X.bezierCurveTo(10.6, -30.4, 11.6, -33, 13.6, -33.8); X.stroke();
    var ur = [[15.6, -10.8], [16.4, -15.4], [18, -19.4], [19.8, -21.6], [21.4, -20.6], [21.2, -17.4], [19.6, -13.6], [18.4, -10.6]];
    rellena(ur, oro(15, -22, 22, -10, 0.35));
    X.fillStyle = lin(16, -20, 20, -12, [[0, C.lapisClaro], [1, P.lapis2]]); X.beginPath(); X.ellipse(18.4, -15.4, 1, 2.6, 0.35, 0, TAU); X.fill();
    X.fillStyle = col(P.cornalina); X.beginPath(); X.arc(18.6, -12.4, 0.7, 0, TAU); X.fill();
  }
  // la falda real plisada (shendyt) con el delantal central decorado
  function faldaReal() {
    falda({ pliegues: 'abanico', bajo: -84, colPliegue: U.mezcla(P.lino2, P.oro3, 0.3) });
    // el delantal central: bandas de oro y lapislázuli y una fila de ureos abajo
    var p = [[-2, -146, 1], [12, -146, 1], [13.6, -96, 1], [-1, -96, 1]];
    var fn = camino(p);
    X.beginPath(); fn(X); X.fillStyle = oro(-2, -146, 14, -96, 0.3); X.fill();
    recortar(fn);
    for (var yy = -144, i = 0; yy < -100; yy += 5, i++) { X.fillStyle = col(i % 2 ? P.cornalina : P.lapis, 0.9); X.fillRect(-2, yy, 16, 2.2); }
    // los ureos: gotitas de oro con la cabeza arriba
    for (var k = 0; k < 4; k++) { var ux = 0.6 + k * 3.4; X.fillStyle = oro(ux - 1.4, -100, ux + 1.4, -96, 0.3); X.beginPath(); X.ellipse(ux, -98, 1.3, 2.4, 0, 0, TAU); X.fill(); X.fillStyle = col(P.lapis2); X.beginPath(); X.arc(ux, -99, 0.5, 0, TAU); X.fill(); }
    soltar();
    sombra(fn, -2, -146, 14, -96, 0.2);
    brillo(fn, -2, -146, 6, -120, 0.3);
  }
  function dibujarFaraon(ctx, x, y, s, op) {
    empezar(ctx, x, y, s, op);
    X.translate(-MEDIO_PASO, 0);
    var pl = PIEL, t = pieles(pl);
    cola(lin(-34, -150, -26, -10, [[0, P.oro2], [0.5, P.cornalina], [1, P.oro3]]), 138);
    piernasEnPaso(pl, {});
    torsoHombre(t.pz, pl, true);
    faldaReal();
    cinturon([P.lapis, P.oro2, P.cornalina, P.oro2], { paso: 2 });
    // el brazo de atrás cuelga, con el puño cerrado (lleva un paño doblado)
    var bA = huesos(BRAZO_CUELGA);
    miembroPiel(bA, G_BRAZO, t.pzL, pl, { oscuro: true });
    rellena([[-34, -97], [-29.2, -97], [-29.8, -89.6], [-33.2, -89.6]], lin(-34, -97, -29, -89, [[0, P.lino], [1, P.lino2]]));
    puno(-31.8, -99.6, -33, -106, t.pzL, pl, { abajo: true });
    // la cabeza: el rostro de Ramsés (la nariz aguileña), la barba real y la jepresh
    X.save(); X.translate(-3, -226); cabezaHumana({ pl: pl, barba: 'real', nariz: 'aguilena' }); jepresh(); X.restore();
    collar(1.2, -210, 32, 23, 0.3, [P.cornalina, 'oro', P.turquesa, P.lapis, 'oro', P.turquesa], { ngotas: 19, gota: 3.2 });
    // el brazo de delante, doblado, sujeta el cayado (heqa) contra el pecho
    var bD = huesos([HOMBRO_DELANTE, [38, -158], [56, -150]]);
    miembroPiel(bD, G_BRAZO, t.pz, pl);
    cayado(60.4, -112, 60.4, -214, 6.4);
    puno(60.4, -150, 56, -150, t.pz, pl);
    brazalete(bA, G_BRAZO, 0.2, 0.28, { color: P.lapis }); brazalete(bD, G_BRAZO, 0.2, 0.28, { color: P.lapis });
    brazalete(bA, G_BRAZO, 0.86, 0.95, { color: P.cornalina }); brazalete(bD, G_BRAZO, 0.86, 0.95, { color: P.cornalina });
    acabar();
  }

  /* =====================================================================================================================
     11. Cachés: lo que no se mueve de una pieza animada se pinta una vez en un lienzo aparte (por tamaño y por lado)
     ===================================================================================================================== */
  function escalaDe(ctx) {
    try { if (ctx.getTransform) { var m = ctx.getTransform(), e = Math.sqrt(m.a * m.a + m.b * m.b); if (e > 0) return e; } } catch (err) { /* nada */ }
    return Math.min(2, window.devicePixelRatio || 1);
  }
  var CACHES = {}, ORDEN = [], TENIDOS = {};
  // devuelve (y pinta si no estaba) un lienzo con fn() dibujado en unidades de figura dentro de la caja [x0, y0, x1, y1]
  // (si el lienzo saldría demasiado grande —una lámina muy ampliada— o no se puede crear, devuelve null y se dibuja directo)
  var MAX_PX = 3.5e6;
  function cacheFig(nombre, caja, px, fn) {
    var q = Math.round(px * 500) / 500, clave = nombre + '|' + q + '|' + DIR, c = CACHES[clave];
    if (c) return c;
    var w = Math.ceil((caja[2] - caja[0]) * q) + 4, h = Math.ceil((caja[3] - caja[1]) * q) + 4;
    if (w * h > MAX_PX) return null;
    var L = U.lienzo(w, h), antes = X;
    if (!L.x) return null;
    X = L.x;
    X.save(); X.translate(2, 2); X.scale(q, q); X.translate(-caja[0], -caja[1]);
    X.lineCap = 'round'; X.lineJoin = 'round';
    try { fn(); } catch (err) { console.error(err); }
    X.restore();
    X = antes;
    c = CACHES[clave] = { c: L.c, x0: caja[0] - 2 / q, y0: caja[1] - 2 / q, w: w / q, h: h / q };
    ORDEN.push(clave);
    if (ORDEN.length > 160) delete CACHES[ORDEN.shift()];
    return c;
  }
  function ponerCache(c) { if (c) X.drawImage(c.c, c.x0, c.y0, c.w, c.h); }
  // ¿está ya pintada esa caché? (sin pintarla)
  function hayCache(nombre, px) { return !!CACHES[nombre + '|' + Math.round(px * 500) / 500 + '|' + DIR]; }
  // dibuja fn desde su caché (o directamente, si no hay caché posible)
  function conCache(nombre, caja, px, fn) { var c = px ? cacheFig(nombre, caja, px, fn) : null; if (c) ponerCache(c); else fn(); }
  // px de dispositivo por unidad en el marco actual (después de empezar(): ya lleva s y la escala del lienzo)
  function pxUnidad() { return escalaDe(X); }

  /* =====================================================================================================================
     12. El escriba: arrodillado, con el papiro en el regazo; la mano del cálamo escribe (op.t). Alto ≈ 0,2 u
     ===================================================================================================================== */
  var ESC_K = 1.16;   // el escriba se dibuja a 1,16 (arrodillado mide 0,2 u)
  // lo que se escribe: fórmulas de verdad de estilo.js (ES.TEXTOS), de derecha a izquierda como en los papiros
  var ESC_TEXTO = Array.from('𓇓𓏏𓊵𓏙𓋹𓍑𓋴𓊨𓁹');
  var ESC_CAJA = [-62, -178, 70, 4];
  function escribaQuieto() {
    var pl = PIEL, pz = tonoPiel(pl.c, -40, -170, 60, 0, 0.14), pzL = tonoPiel(U.mezcla(pl.c, pl.c2, 0.5), -40, -170, 60, 0, 0.12);
    // los pies, detrás, con los dedos doblados
    rellena([[-12, -13.4], [-20, -17.6], [-29, -15.8], [-36.4, -8.4], [-39.6, -2.4], [-38, 0, 1], [-22, 0, 1], [-13, -3.8]], rel(pl.c, -40, -18, -12, 0, 0.16));
    // el brazo de atrás: sujeta el rollo del papiro sobre el regazo
    var bA = huesos([[-24, -116], [-14, -82], [10, -66]]);
    miembroPiel(bA, G_BRAZO, pzL, pl, { oscuro: true });
    // el cuerpo envuelto en el manto de lino, sentado sobre los talones (ref. 4)
    var manto = [[-8, -127], [-20, -124.6], [-30, -119.4], [-35.4, -111], [-34, -98], [-28.6, -84], [-26.2, -66], [-29.6, -46], [-31.4, -30], [-29, -18], [-23, -10.6], [-14, -4.6], [-5, -1.4], [2, 0, 1],
      [44, 0, 1], [51.4, -2], [55.4, -8.4], [55.6, -17.6], [52, -25.6], [43, -31.4], [30, -35.4], [18, -38.6], [12, -48], [12.6, -70], [16, -90], [22, -104], [26, -114], [24.6, -121], [15, -125.4], [6, -127]];
    var fm = camino(manto), bm = caja(manto);
    X.beginPath(); fm(X); X.fillStyle = lin(bm[0], bm[1], bm[2], bm[3], [[0, [255, 253, 246]], [0.45, P.lino], [1, P.lino2]]); X.fill();
    // los pliegues en abanico: los del hombro, que caen hacia delante, y los de las piernas, que salen de la rodilla (ref. 4)
    var segs = [], i;
    for (i = 0; i < 14; i++) { var a0 = -2.1 + i * 0.1; segs.push([-14, -122, -14 + Math.cos(a0) * 40, -122 - Math.sin(a0) * 40 * 0.2 + 30, -14 + Math.cos(a0) * 60, -122 + 60]); }
    for (i = 0; i < 16; i++) { var a1 = Math.PI * 0.62 + i * 0.075; segs.push([48, -16, 48 + Math.cos(a1) * 30, -16 - Math.sin(a1) * 30, 48 + Math.cos(a1) * 80, -16 - Math.sin(a1) * 80]); }
    lineas(fm, segs, C.pliegue, 0.5, 0.45);
    sombra(fm, 10, -120, 30, -40, 0.12, P.piedra2);
    sombra(fm, 0, -30, 0, 0, 0.2, P.piedra2);
    brillo(fm, -36, -126, 0, -80, 0.3);
    // el canto del manto sobre el hombro de delante
    X.strokeStyle = col([255, 255, 255], 0.8); X.lineWidth = 0.7; X.beginPath(); X.moveTo(6, -127); X.quadraticCurveTo(20, -118, 24, -104); X.stroke();
    // el papiro: el rollo (cerca del cuerpo) y la hoja abierta sobre el regazo, inclinada hacia los ojos
    var hoja = [[8, -46, 1], [52, -54, 1], [53.6, -46.4, 1], [10, -38.6, 1]];
    rellena(hoja, lin(8, -54, 54, -38, [[0, [255, 250, 232]], [0.6, P.papiro], [1, P.papiro2]]));
    lineas(null, [[10, -38.6, 53.6, -46.4]], P.papiro3, 0.8, 0.6);
    X.beginPath(); X.ellipse(8.6, -42.4, 3.6, 4.6, -0.18, 0, TAU); X.fillStyle = lin(5, -47, 12, -38, [[0, [255, 246, 220]], [0.5, P.papiro2], [1, P.papiro3]]); X.fill();
    X.strokeStyle = col(P.papiro3, 0.8); X.lineWidth = 0.5; X.beginPath(); X.ellipse(8.6, -42.4, 1.8, 2.4, -0.18, 0, TAU); X.stroke();
    // la mano de atrás sobre el rollo
    mano('pinza', 10, -66, 1.45, 1, pzL, pl, 1);
    // la paleta a su lado, en el suelo
    var pal = [[-48, -3, 1], [-12, -3, 1], [-12, 0, 1], [-48, 0, 1]];
    rellena(pal, oro(-48, -3, -12, 0, 0.3));
    X.fillStyle = col(P.rojo); X.beginPath(); X.ellipse(-44.4, -2.6, 1.6, 0.7, 0, 0, TAU); X.fill();
    X.fillStyle = col(P.negro); X.beginPath(); X.ellipse(-40, -2.6, 1.6, 0.7, 0, 0, TAU); X.fill();
    // la cabeza, algo inclinada hacia el papiro: la peluca gris (detrás y encima), el cono de ungüento y la perilla (ref. 4)
    X.save(); X.translate(-1, -141); X.rotate(0.12);
    var pel = [[-2, -23.4], [-12, -22.4], [-19.2, -16], [-21.6, -4], [-22, 10], [-21, 24], [-20, 30, 1], [-7.4, 30, 1], [-6.4, 18], [-6, 8], [-5.6, -2], [-3, -12]];
    peluca(pel, mechones(-21.6, -4, 2.3, -26, 32, -0.8), C.gris, [214, 220, 232], { aRaya: 0.5, ancho: 1.2, colBrillo: [255, 255, 255], brillo: 0.3 });
    cabezaHumana({ pl: pl, oreja: 'despues' });
    // el casco de la peluca: cubre el cráneo hasta el nacimiento del pelo y baja por detrás de la oreja
    var casco = [[-17.6, -10], [-15.6, -17.6], [-9.4, -22.6], [0, -24.4], [8.4, -22.6], [14.2, -17.6], [16.6, -11.6], [15.8, -10], [10.4, -12.6], [4.6, -13], [1.6, -10.6], [0.4, -5], [-0.4, 2], [-2.6, 9], [-5.4, 16], [-7.6, 24, 1], [-19.6, 24, 1], [-20.6, 10], [-19.8, -2]];
    peluca(casco, mechones(-20, 15, 2.3, -25, 26, -0.4), C.gris, [214, 220, 232], { aRaya: 0.45, ancho: 1.1, colBrillo: [255, 255, 255], brillo: 0.35 });
    oreja(pl);
    // el cono de ungüento, encima
    rellena([[-6.6, -23.6], [-5.6, -29.6], [-3, -33], [0.6, -33.2], [3, -30], [3.8, -24]], lin(-7, -33, 4, -23, [[0, ES.aclarar(P.cornalina, 0.3)], [0.6, P.cornalina], [1, P.rojo]]));
    rellena([[-7.4, -24.6, 1], [4.6, -24.6, 1], [4.4, -22.6, 1], [-7.2, -22.6, 1]], col(P.lino));
    X.restore();
    collar(-0.4, -126, 22, 16, 0.34, [P.oro1, P.lapis, P.turquesa, P.verde, P.oro2], { gotas: false });
    X.save(); X.translate(-1, -141); X.rotate(0.12); barba('perilla', {}); X.restore();
    return bA;
  }
  // el brazo que escribe (desde el codo) y el cálamo, y lo escrito, en el instante t
  function escribaMueve(t) {
    var pl = PIEL, pz = tonoPiel(pl.c, -40, -170, 60, 0, 0.14);
    var ciclo = 7000, k = (t % ciclo) / ciclo, n = ESC_TEXTO.length;
    // escribe de derecha a izquierda (0–80 %), luego levanta la mano y vuelve (80–100 %)
    var avance = k < 0.8 ? k / 0.8 : 1 - U.inOut((k - 0.8) / 0.2);
    var escritos = k < 0.8 ? Math.floor(avance * n + 0.6) : Math.max(0, Math.round(n * (1 - (k - 0.8) / 0.08)));
    // lo escrito: los signos, en tinta, sobre la hoja (de derecha a izquierda: mirando a la derecha, de donde empieza la línea)
    if (escritos > 0) {
      var xCorte = 48.6 - Math.min(escritos, n) * 4.4 + 2.2;
      X.save(); X.beginPath(); X.rect(xCorte, -60, 60, 30); X.clip();
      conCache('escribaTexto', [8, -58, 54, -36], ESC_PX, textoEscriba);
      X.restore();
    }
    // la mano: la punta del cálamo sigue la línea, con trazos cortos (sube y baja un poco)
    var punta = 50 - avance * 38, ondita = Math.sin(t / 95) * 0.7 + Math.sin(t / 37) * 0.35, levanta = k < 0.8 ? Math.max(0, Math.sin(t / 260)) * 0.8 : 4 * Math.sin(Math.PI * (k - 0.8) / 0.2);
    var tx = punta + ondita * 0.4, ty = -45.4 - (punta - 10) * 0.18 + 3 - levanta + ondita * 0.3;
    // el cálamo sale de la mano hacia arriba y atrás
    var wx = tx - 9.6, wy = ty - 8.4;
    var bD = huesos([[8, -88], [wx, wy]]);
    miembroPiel(bD, [[0, 4.4, 4.6], [0.6, 3.8, 3.9], [1, 3, 3.1]], pz, pl);
    brazalete(bD, [[0, 4.4, 4.6], [0.6, 3.8, 3.9], [1, 3, 3.1]], 0.8, 0.92);
    // el pliegue del manto que cae sobre el codo (tapa el arranque del antebrazo)
    var pli = [[4, -98], [14, -96], [19.4, -88], [17.6, -80.4], [11, -79.6], [5, -84]];
    rellena(pli, lin(4, -98, 19, -80, [[0, [255, 253, 246]], [0.6, P.lino], [1, P.lino2]]));
    X.strokeStyle = col(C.pliegue, 0.5); X.lineWidth = 0.45; X.beginPath(); X.moveTo(8, -96); X.lineTo(15, -82); X.moveTo(11, -97); X.lineTo(18, -86); X.stroke();
    calamo(tx - 15.6, ty - 21.4, tx, ty);
    mano('pinza', wx, wy, 0.66, -1, pz, pl, 1);
  }
  var ESC_PX = 0;
  function textoEscriba() {
    var n = ESC_TEXTO.length;
    X.fillStyle = col(P.tinta, 0.85);
    X.font = '5px ' + ES.JERO; X.textAlign = 'center'; X.textBaseline = 'alphabetic';
    for (var i = 0; i < n; i++) {
      var px = 48.6 - i * 4.4, py = -44.4 - (px - 10) * 0.18 + 4.6;
      X.save(); X.translate(px, py); X.transform(1, -0.18, 0, 1, 0, 0); X.scale(-1, 1); X.fillText(ESC_TEXTO[i], 0, 0); X.restore();
    }
  }
  function dibujarEscriba(ctx, x, y, s, op) {
    op = op || {};
    empezar(ctx, x, y, s, op);
    X.translate(-6 * ESC_K, 0); X.scale(ESC_K, ESC_K);
    if (op.t == null) {   // quieto (en teselas): todo directamente
      ESC_PX = 0; escribaQuieto(); escribaMueve(0);
    } else {
      ESC_PX = pxUnidad();   // (ya dentro del X.scale(ESC_K))
      conCache('escriba', ESC_CAJA, ESC_PX, escribaQuieto);
      escribaMueve(op.t);
    }
    acabar();
  }

  /* =====================================================================================================================
     13. Gente sencilla (campesinos, porteadores): el mismo cuerpo, más pequeño (alto ≈ 0,2 u), con falda corta y peluca corta
     Se dibuja en las unidades del cuerpo de los dioses dentro de un X.scale(GK).
     ===================================================================================================================== */
  var GK = 0.81;
  // dos huesos (cadera-rodilla-tobillo, hombro-codo-muñeca) que llegan a un punto: el codo o la rodilla hacia «lado»
  function ik(A, B, a, b, lado) {
    var dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy) || 1e-6, dd = Math.min(d, a + b - 0.01), ux = dx / d, uy = dy / d;
    var ca = U.clamp((a * a + dd * dd - b * b) / (2 * a * dd), -1, 1), sa = Math.sqrt(1 - ca * ca) * (lado || 1);
    var ex = A[0] + (ux * ca - uy * sa) * a, ey = A[1] + (uy * ca + ux * sa) * a;
    return [ex, ey, A[0] + ux * dd, A[1] + uy * dd];
  }
  // el torso, el cuello y la cabeza de un campesino (origen en la cadera, mirando a +x)
  function torsoGente(op) {
    op = op || {};
    var pl = PIEL;
    X.save(); X.translate(0, 120);
    torsoHombre(tonoPiel(pl.c, -40, -215, 40, -110, 0.14), pl, true);
    X.save(); X.translate(-3, -226);
    // la peluca corta y redonda (o el pelo rapado con un casquete de lino)
    var pel = op.casquete
      ? [[-15.4, -6], [-15.6, -15], [-9.6, -21.4], [0, -23.2], [9, -21.4], [14.8, -15.6], [16.6, -10.6], [12, -12.2], [4, -12.8], [-2, -11.6], [-4.4, -6], [-6, 2], [-10, 3.6], [-14, 1]]
      : [[-16.6, 8], [-18, -4], [-16.4, -15], [-10, -21.6], [0, -23.6], [9, -21.6], [14.8, -15.6], [16.6, -10.6], [12, -12.2], [4, -12.8], [-1.4, -11.4], [-3.4, -5], [-4.4, 4], [-6.4, 10.4], [-12, 11.6]];
    var mech = op.casquete ? [] : mechones(-17.6, 15, 2.2, -25, 12, 0);
    cabezaHumana({ pl: pl, oreja: !!op.casquete || true });
    peluca(pel, mech, op.casquete ? P.lino : P.negro, op.casquete ? P.lino2 : P.negro2, { aRaya: 0.5, ancho: 1.1, colBrillo: op.casquete ? [255, 255, 255] : null });
    X.restore();
    if (op.collar !== false) collar(1.2, -210, 22, 15, 0.42, [P.turquesa, 'oro', P.cornalina], { gotas: false });
    X.restore();
  }
  // la falda corta de lino de un trabajador (de la cintura a medio muslo), atada delante
  function faldaGente(H, inc) {
    X.save(); X.translate(H[0], H[1]); X.rotate(inc || 0);
    var p = [[-23.4, -31, 1], [12, -31, 1], [16, -18], [21, 4], [24, 14, 1], [-4, 16], [-24, 12, 1], [-27, 0], [-26.4, -18]];
    var fn = camino(p);
    X.beginPath(); fn(X); X.fillStyle = lin(-27, -31, 24, 16, [[0, ES.aclarar(P.lino, 0.4)], [0.5, P.lino], [1, P.lino2]]); X.fill();
    lineas(fn, [[-18, -30, -20, 12], [-10, -30, -10, 14], [-2, -30, 0, 15], [6, -30, 10, 15], [12, -28, 18, 12]], C.pliegue, 0.5, 0.5);
    X.fillStyle = col(P.lino2); X.fillRect(-23.4, -33, 35.4, 3);
    X.restore();
  }
  // una pierna de campesino de la cadera (H) al tobillo (T), con la rodilla hacia delante, y su pie
  function piernaGente(H, T, oscuro, talonAlto) {
    var k = ik(H, T, 47, 64, -1), hu = huesos([H, [k[0], k[1]], [k[2], k[3]]]);
    miembroPiel(hu, G_PIERNA, null, PIEL, { oscuro: oscuro });
    var ang = talonAlto || 0;
    X.save(); X.translate(k[2], k[3]); X.rotate(-ang); pie(-7.4, 38, null, PIEL, { oscuro: oscuro, y: 11.6 }); X.restore();
  }
  // un brazo de campesino del hombro (S) a la mano (M), con el codo hacia abajo, y la mano que agarra
  function brazoGente(S, M, oscuro, lado) {
    var k = ik(S, M, 36, 34, lado || 1), hu = huesos([S, [k[0], k[1]], [k[2], k[3]]]);
    miembroPiel(hu, G_BRAZO, null, PIEL, { oscuro: oscuro });
    return k;
  }

  /* =====================================================================================================================
     14. El cigoñal (shaduf): el campesino baja el cubo al río (0,06 u bajo el suelo), lo sube lleno y lo vacía en la
     acequia; ciclo de 5 s con op.t. Abajo: 0,08 u. Todo lo que no se mueve, en cachés (por tamaño): los postes y la
     acequia, la pértiga con su contrapeso (se gira), el cubo (lleno y vacío), el torso del campesino y sus piernas en 9 pasos.
     ===================================================================================================================== */
  var SH = { P: [-60, -192], L1: 210, L2: 96, cuerda: 166, rio: 60, pila: [166, 190], gira: 22 * Math.PI / 180, hombre: 62 };
  var SH_CAJA_FIJA = [-84, -210, 204, 12], SH_CAJA_PERTIGA = [-116, -28, 214, 28], SH_CAJA_CUBO = [-12, -2, 12, 22];
  // lo quieto: los dos postes con su travesaño, la acequia (una pila de barro con agua) y el canal que se va
  function shadufFijo() {
    var madera = P.piedra2, madera2 = U.mezcla(P.piedra2, P.tinta, 0.4), x0 = SH.pila[0], x1 = SH.pila[1], px = SH.P[0], py = SH.P[1];
    // el canal de la acequia: sale de la pila hacia la izquierda por el suelo, entre dos caballones de barro
    rellena([[x1 - 2, -2.6, 1], [202, -2.6, 1], [202, 0, 1], [x1 - 2, 0, 1]], lin(0, -2.6, 0, 0, [[0, C.lapisClaro], [1, P.lapis]]));
    X.strokeStyle = col([225, 238, 255], 0.75); X.lineWidth = 0.55; X.beginPath(); X.moveTo(x1, -2.2); X.lineTo(201, -2.2); X.stroke();
    // la pila de barro, con el agua dentro
    var pila = [[x0 - 2, 0, 1], [x0 - 2.6, -12], [x0 - 0.6, -15.6], [x0 + 3, -14.8], [x0 + 3.6, -6], [x1 - 3.6, -6], [x1 - 3, -14.8], [x1 + 0.6, -15.6], [x1 + 2.6, -12], [x1 + 2, 0, 1]];
    rellena(pila, lin(x0, -16, x1, 0, [[0, ES.aclarar(P.arena2, 0.12)], [0.5, U.mezcla(P.arena2, P.piedra2, 0.55)], [1, U.mezcla(P.piedra2, P.tinta, 0.3)]]));
    rellena([[x0 + 3.4, -11.6, 1], [x1 - 3.4, -11.6, 1], [x1 - 3.4, -6, 1], [x0 + 3.4, -6, 1]], lin(0, -11.6, 0, -6, [[0, C.lapisClaro], [1, P.lapis]]));
    X.strokeStyle = col([225, 238, 255], 0.8); X.lineWidth = 0.6; X.beginPath(); X.moveTo(x0 + 4, -11); X.lineTo(x1 - 4, -11); X.stroke();
    // los dos postes (uno detrás de otro, en perspectiva), ahorquillados arriba, y el travesaño donde gira la pértiga
    function poste(x, c, c2) {
      var p = [[x - 4.4, 0, 1], [x - 3.4, py + 18], [x - 6.4, py + 6], [x - 4.6, py - 4], [x - 2, py + 4], [x + 2, py + 4], [x + 4.6, py - 4], [x + 6.4, py + 6], [x + 3.4, py + 18], [x + 4.4, 0, 1]];
      var fn = camino(p);
      rellena(p, lin(x - 5, 0, x + 5, 0, [[0, ES.aclarar(c, 0.28)], [0.45, c], [1, c2]]));
      lineas(fn, [[x - 1.4, py + 30, x - 1.8, -14], [x + 1.6, py + 60, x + 1.2, -30]], c2, 0.4, 0.45);
    }
    poste(px - 8, madera2, U.mezcla(madera2, P.negro, 0.3));
    X.beginPath(); X.arc(px, py, 4.4, 0, TAU); X.fillStyle = radial(px, py, 4.4, [[0, madera], [1, madera2]]); X.fill();
    poste(px + 7, madera, madera2);
    rellena([[px - 20, 0, 1], [px - 18, -5], [px - 10, -7.6], [px - 2, -5.4], [px + 8, -7.6], [px + 17, -4.6], [px + 20, 0, 1]], lin(0, -7.6, 0, 0, [[0, P.piedra], [1, P.piedra2]]));
  }
  // la pértiga (horizontal en su caché, se gira al dibujarla): el palo y el contrapeso de barro al final del brazo corto
  function shadufPertiga() {
    var L1 = SH.L1, L2 = SH.L2;
    var palo = [[-L2, -3.4], [-L2 * 0.4, -4.4], [0, -4.6], [L1 * 0.6, -3.4], [L1, -2, 1], [L1, 2, 1], [L1 * 0.6, 3.4], [0, 4.6], [-L2 * 0.4, 4.4], [-L2, 3.4]];
    rellena(palo, lin(0, -4.6, 0, 4.6, [[0, ES.aclarar(P.piedra2, 0.32)], [0.45, P.piedra2], [1, U.mezcla(P.piedra2, P.tinta, 0.45)]]));
    X.strokeStyle = col([255, 240, 210], 0.35); X.lineWidth = 0.6; X.beginPath(); X.moveTo(-L2 + 4, -2.6); X.lineTo(L1 - 6, -1.4); X.stroke();
    // el contrapeso: un terrón de barro grande, atado al palo
    var cp = [[-L2 - 15, 2], [-L2 - 17.4, 13], [-L2 - 11, 23], [-L2 + 2, 25], [-L2 + 13, 20], [-L2 + 15.4, 9], [-L2 + 9, 1.4], [-L2 - 4, -1.6]];
    var fc = camino(cp);
    X.beginPath(); fc(X); X.fillStyle = lin(-L2 - 17, -2, -L2 + 15, 25, [[0, U.mezcla(P.arena2, P.piedra2, 0.45)], [0.5, U.mezcla(P.piedra2, P.tinta, 0.3)], [1, U.mezcla(P.tinta, P.negro, 0.25)]]); X.fill();
    lineas(fc, [[-L2 - 8, 6, -L2 - 4, 13, -L2 - 6, 20], [-L2 + 5, 5, -L2 + 3, 12], [-L2 - 13, 15, -L2 - 6, 16.4]], P.tinta, 0.35, 0.55);
    X.strokeStyle = col(P.tinta, 0.75); X.lineWidth = 1.1; X.beginPath(); X.moveTo(-L2 - 6, -3.6); X.lineTo(-L2 - 8, 6); X.moveTo(-L2 + 6, -3.6); X.lineTo(-L2 + 8, 4.4); X.stroke();
  }
  // el cubo de cuero (origen en el asa, donde se ata la cuerda); lleno o vacío
  function cubo(lleno) {
    X.strokeStyle = col(P.tinta, 0.8); X.lineWidth = 0.7; X.beginPath(); X.moveTo(-8, 6.4); X.lineTo(0, 0); X.lineTo(8, 6.4); X.stroke();
    var c = [[-9.4, 6, 1], [9.4, 6, 1], [7.2, 21, 1], [-7.2, 21, 1]];
    rellena(c, lin(-9, 6, 9, 21, [[0, U.mezcla(P.oro3, P.piedra2, 0.4)], [0.5, U.mezcla(P.oro4, P.piedra2, 0.4)], [1, U.mezcla(P.oro4, P.tinta, 0.45)]]));
    X.fillStyle = col(U.mezcla(P.oro4, P.tinta, 0.5)); X.fillRect(-9.6, 5.2, 19.2, 2);
    X.strokeStyle = col(P.tinta, 0.35); X.lineWidth = 0.45; X.beginPath(); X.moveTo(-8.4, 12.4); X.lineTo(8.4, 12.4); X.moveTo(-7.6, 17); X.lineTo(7.6, 17); X.stroke();
    if (lleno) { X.fillStyle = lin(-8, 5, 8, 8, [[0, ES.aclarar(C.lapisClaro, 0.3)], [1, P.lapis]]); X.beginPath(); X.ellipse(0, 6.2, 8.6, 1.5, 0, 0, TAU); X.fill(); }
  }
  // la pose en el instante t (ms): ángulo de la pértiga, el cubo, las manos y el paso del campesino
  function poseShaduf(t) {
    var k = ((t % 5000) + 5000) % 5000 / 5000, th, al = 0, inc = 0, lleno = 0, fase, G = SH.gira;
    if (k < 0.3) { fase = 'baja'; th = U.lerp(-G, G, U.inOut(k / 0.3)); }
    else if (k < 0.4) { fase = 'llena'; th = G + Math.sin((k - 0.3) / 0.1 * Math.PI) * 0.025; lleno = U.tramo(k, 0.32, 0.37); }
    else if (k < 0.7) { fase = 'sube'; th = U.lerp(G, -G, U.inOut((k - 0.4) / 0.3)); lleno = 1; }
    else if (k < 0.9) { fase = 'vacia'; th = -G; var q = (k - 0.7) / 0.2; al = 0.255 * U.suave(Math.min(1, q * 2.4)); inc = -1.25 * U.suave(U.tramo(q, 0.3, 0.6)); lleno = 1 - U.tramo(q, 0.4, 0.95); }
    else { fase = 'vuelve'; th = -G; var r = (k - 0.9) / 0.1; al = 0.255 * (1 - U.suave(r)); inc = -1.25 * (1 - U.suave(r)); }
    var E = [SH.P[0] + SH.L1 * Math.cos(th), SH.P[1] + SH.L1 * Math.sin(th)];
    var B = [E[0] + SH.cuerda * Math.sin(al), E[1] + SH.cuerda * Math.cos(al)];
    // dónde agarra: la cuerda, a 82 bajo la punta (arriba) y a 10 (abajo); al vaciar, el borde del cubo
    var agarre, bajo;
    if (fase === 'vacia' || fase === 'vuelve') agarre = [B[0] - 1.6, B[1] - 9];
    else { bajo = fase === 'baja' ? 82 - 72 * U.inOut(k / 0.3) : fase === 'llena' ? 10 : 10 + 72 * U.inOut((k - 0.4) / 0.3); agarre = [E[0] + SH.cuerda * Math.sin(al) * bajo / SH.cuerda, E[1] + bajo]; }
    var paso = fase === 'baja' ? U.suave(k / 0.3) : fase === 'llena' ? 1 : fase === 'sube' ? 1 - 0.7 * U.suave((k - 0.4) / 0.3) : fase === 'vacia' ? 0.3 + 0.7 * U.suave(Math.min(1, (k - 0.7) / 0.12)) : 1 - U.suave((k - 0.9) / 0.1);
    return { k: k, fase: fase, th: th, al: al, inc: inc, E: E, B: B, lleno: lleno, agarre: agarre, paso: paso };
  }
  // una mano de campesino, rápida: el puño y el pulgar en un solo relleno
  function manoGente(wx, wy, ang, lado, oscuro) {
    var M = MANOS.pinza, c = oscuro ? U.mezcla(P.piel, P.piel2, 0.5) : P.piel;
    X.save(); X.translate(wx, wy); X.rotate(ang); X.scale(1, lado || 1);
    X.beginPath(); curva(X, M.forma, true); curva(X, M.pulgar, true);
    X.fillStyle = ES.lin(X, 0, -5, 0, 5, [[0, U.mezcla(c, C.luzPiel, 0.22)], [0.5, c], [1, U.mezcla(c, P.piel2, 0.4)]]); X.fill();
    X.restore();
  }
  // las piernas y la falda del campesino en el paso i (0…8): la de atrás fija, la de delante avanza
  function piernasCampesino(i) {
    var paso = i / 8, H = [30 + paso * 8, -118];
    piernaGente([H[0] + 4, H[1]], [58 + paso * 9, -11.6], true);
    piernaGente([H[0] - 8, H[1]], [5.4, -11.6], false);
    faldaGente(H, 0.06 * paso);
  }
  function campesino(ps) {
    X.save(); X.translate(SH.hombre, 0); X.scale(GK, GK);
    var G = [(ps.agarre[0] - SH.hombre) / GK, ps.agarre[1] / GK];
    var ip = Math.round(ps.paso * 8), H = [30 + ip, -118];
    // se inclina lo justo para que la mano llegue
    var lam = 0;
    for (var a = 0; a <= 0.85; a += 0.025) { lam = a; var Sx = H[0] + Math.sin(a) * 78 + 30.5 * Math.cos(a), Sy = H[1] - Math.cos(a) * 78 + 30.5 * Math.sin(a); if (Math.hypot(G[0] - Sx, G[1] - Sy) < 66) break; }
    function hombro(dx) { return [H[0] + Math.sin(lam) * 78 + dx * Math.cos(lam), H[1] - Math.cos(lam) * 78 + dx * Math.sin(lam)]; }
    conCache('campesinoPiernas' + ip, [-36, -150, 104, 2], SH_PX * GK, function () { piernasCampesino(ip); });
    var SA = hombro(-30.5), SD = hombro(30.5);
    // el brazo de delante (el de lejos) va detrás del torso; el de atrás cruza por delante del pecho
    var kD = brazoGente(SD, [G[0] + 1, G[1] - 7], true, 1);
    manoGente(kD[2], kD[3], Math.atan2(kD[3] - kD[1], kD[2] - kD[0]), -1, true);
    X.save(); X.translate(H[0], H[1]); X.rotate(lam);
    conCache('campesinoTorso', [-46, -134, 46, 14], SH_PX * GK, function () { torsoGente({}); });
    X.restore();
    // la mano de atrás agarra la cuerda más abajo (una mano encima de la otra), sin pasar por delante de la cara
    var GA = ps.fase === 'vacia' || ps.fase === 'vuelve' ? [G[0] - 4, G[1] + 12] : [G[0] + (ps.B[0] - ps.E[0]) * 0.18 / GK, Math.min(G[1] + 34, ps.B[1] / GK - 4, H[1] - 30)];
    if (GA[1] < G[1]) GA[1] = G[1] + 6;
    var kA = brazoGente(SA, GA, false, 1);
    manoGente(kA[2], kA[3], Math.atan2(kA[3] - kA[1], kA[2] - kA[0]), 1, false);
    X.restore();
  }
  var SH_PX = 0;
  function shadufMueve(t) {
    var ps = poseShaduf(t), rio = SH.rio;
    X.save(); X.translate(SH.P[0], SH.P[1]); X.rotate(ps.th);
    conCache('pertiga', SH_CAJA_PERTIGA, SH_PX, shadufPertiga);
    X.restore();
    X.strokeStyle = col(U.mezcla(P.piedra2, P.tinta, 0.5), 0.9); X.lineWidth = 0.9; X.beginPath(); X.moveTo(ps.E[0], ps.E[1]); X.lineTo(ps.B[0], ps.B[1]); X.stroke();
    // al llenarse, anillos en el río; al subir, gotas
    if (ps.fase === 'llena' || (ps.fase === 'sube' && ps.k < 0.5)) {
      var q = ps.fase === 'llena' ? (ps.k - 0.3) / 0.1 : 1 + (ps.k - 0.4) / 0.1;
      X.strokeStyle = col([225, 238, 255], 0.75 * (1 - q / 2)); X.lineWidth = 0.7; X.beginPath();
      X.ellipse(ps.B[0], rio, 10 + q * 10, 1.6 + q, 0, 0, TAU); X.moveTo(ps.B[0] + 6 + q * 18, rio); X.ellipse(ps.B[0], rio, 6 + q * 18, 1 + q * 1.6, 0, 0, TAU); X.stroke();
    }
    if (ps.fase === 'sube' && ps.B[1] < rio - 6) {
      X.fillStyle = col(C.lapisClaro, 0.85); X.beginPath();
      for (var g = 0; g < 3; g++) { var gy = ps.B[1] + 23 + ((ps.k * 9000 + g * 37) % 34); X.moveTo(ps.B[0] - 4 + g * 4 + 0.8, gy); X.ellipse(ps.B[0] - 4 + g * 4, gy, 0.8, 1.5, 0, 0, TAU); }
      X.fill();
    }
    // el cubo (de su caché, lleno o vacío) y, al vaciarlo, el chorro hasta la pila
    X.save(); X.translate(ps.B[0], ps.B[1]); X.rotate(ps.inc);
    var lleno = ps.lleno > 0.5 ? 1 : 0;
    conCache('cubo' + lleno, SH_CAJA_CUBO, SH_PX, function () { cubo(lleno); });
    X.restore();
    if (ps.fase === 'vacia' && ps.inc < -0.55 && ps.lleno > 0.04) {
      var ca = Math.cos(ps.inc), sa = Math.sin(ps.inc), bx = ps.B[0] + (-9.4 * ca - 6 * sa), by = ps.B[1] + (-9.4 * sa + 6 * ca);
      var fy = -10, w0 = 3 * ps.lleno + 0.8, ond = Math.sin(ps.k * 300) * 0.8;
      X.fillStyle = lin(bx, by, bx, fy, [[0, C.lapisClaro, 0.95], [1, P.lapis, 0.85]]);
      X.beginPath(); X.moveTo(bx - w0 * 0.6, by); X.quadraticCurveTo(bx - 2.2 + ond, (by + fy) / 2, bx - 1.7, fy); X.lineTo(bx + 1.3, fy); X.quadraticCurveTo(bx + 1 + ond, (by + fy) / 2, bx + w0 * 0.4, by); X.closePath(); X.fill();
      X.strokeStyle = col([230, 240, 255], 0.75); X.lineWidth = 0.6; X.beginPath(); X.ellipse(bx, -11.2, 5 + Math.sin(ps.k * 200) * 1.4, 1, 0, 0, TAU); X.stroke();
    }
    campesino(ps);
  }
  function dibujarShaduf(ctx, x, y, s, op) {
    op = op || {};
    empezar(ctx, x, y, s, op);
    X.translate(-18, 0);
    if (op.t == null) { SH_PX = 0; shadufFijo(); }
    else { SH_PX = pxUnidad(); conCache('shadufFijo', SH_CAJA_FIJA, SH_PX, shadufFijo); }
    shadufMueve(op.t || 0);
    acabar();
  }

  /* =====================================================================================================================
     15. Los porteadores: siete hombres arrastran un gran bloque de piedra sobre un trineo de madera, tirando de la cuerda;
     el aguador, en la proa del trineo, echa agua delante para que resbale (tumba de Djehutihotep, Deir el-Bersha; un
     estudio de la Universidad de Ámsterdam lo comprobó en 2014: la arena mojada reduce el rozamiento a la mitad).
     op.fase (0–1, se repite) mueve el andar; ancho ≈ 0,78 u. Las piernas, en 12 fases en caché (se pintan poco a poco: una
     nueva por fotograma, o todas con .preparar); los torsos, 2 variantes; el trineo, el bloque y el aguador, quietos en caché.
     ===================================================================================================================== */
  var PO = { n: 7, x0: -116, paso: 71, inc: 0.3, fases: 12, cuerda: [-170, -64] };
  var PO_CAJA_FIJA = [-382, -244, -126, 6];
  // el bloque de piedra y el trineo, con el aguador en la proa y la arena mojada delante
  function porteadoresFijo() {
    // la arena mojada delante de los patines
    rellena([[-162, 0, 1], [-158, -1.8], [-140, -2.6], [-124, -2], [-118, 0, 1]], col(U.mezcla(P.arena2, P.piedra2, 0.65), 0.8));
    // el trineo: dos patines con la punta curvada hacia arriba y travesaños
    var patin = [[-376, -2, 1], [-376, -14, 1], [-190, -14], [-176, -16.6], [-168, -24], [-165, -30], [-161.6, -29], [-163.4, -20], [-170, -8], [-182, -2, 1]];
    rellena(patin, lin(0, -30, 0, 0, [[0, ES.aclarar(P.piedra2, 0.3)], [0.5, P.piedra2], [1, U.mezcla(P.piedra2, P.tinta, 0.45)]]));
    lineas(camino(patin), [[-372, -8, -180, -7]], U.mezcla(P.piedra2, P.tinta, 0.5), 0.5, 0.6);
    for (var i = 0; i < 5; i++) { var tx = -366 + i * 40; rellena([[tx, -22, 1], [tx + 8, -22, 1], [tx + 8, -13, 1], [tx, -13, 1]], lin(tx, -22, tx + 8, -13, [[0, P.piedra2], [1, U.mezcla(P.piedra2, P.tinta, 0.5)]])); }
    // el bloque: tallado a grandes golpes (la cara de delante, la de arriba con luz y la de la derecha en sombra)
    // (granito rosa de Asuán, el de la Cámara del Rey y del revestimiento de Micerinos: la caliza blanca se confundía con
    // el muro de Saqqara, que queda justo detrás)
    var cara = U.mezcla(U.mezcla(P.piedra, P.cornalina, 0.34), P.lino, 0.12), sombraP = U.mezcla(U.mezcla(P.piedra2, P.cornalina, 0.3), P.tinta, 0.2);
    var bl = [[-364, -22, 1], [-366, -152, 1], [-206, -156, 1], [-202, -22, 1]];
    var fb = camino(bl);
    X.beginPath(); fb(X); X.fillStyle = lin(-366, -156, -202, -22, [[0, ES.aclarar(cara, 0.22)], [0.5, cara], [1, U.mezcla(cara, P.piedra2, 0.55)]]); X.fill();
    rellena([[-366, -152, 1], [-356, -162, 1], [-197, -166, 1], [-206, -156, 1]], lin(0, -166, 0, -152, [[0, ES.aclarar(P.piedra, 0.5)], [1, ES.aclarar(P.piedra, 0.2)]]));
    rellena([[-206, -156, 1], [-197, -166, 1], [-193, -32, 1], [-202, -22, 1]], lin(-206, 0, -193, 0, [[0, U.mezcla(P.piedra2, P.lino, 0.2)], [1, sombraP]]));
    // las marcas del cincel (al azar, pero siempre las mismas) y los cantos
    var r = U.azar(4321); X.strokeStyle = col(P.piedra2, 0.55); X.lineWidth = 0.7; X.beginPath();
    for (i = 0; i < 80; i++) { var mx = -360 + r() * 150, my = -150 + r() * 124, ml = 3 + r() * 6, ma = -0.5 + r() * 0.3; X.moveTo(mx, my); X.lineTo(mx + Math.cos(ma) * ml, my + Math.sin(ma) * ml); }
    X.stroke();
    // el moteado del granito: granos oscuros y alguno claro
    X.fillStyle = col(U.mezcla(P.tinta, P.piedra2, 0.3), 0.45); for (i = 0; i < 140; i++) { X.beginPath(); X.arc(-362 + r() * 158, -150 + r() * 126, 0.7 + r() * 1.3, 0, TAU); X.fill(); }
    X.fillStyle = col([255, 244, 230], 0.5); for (i = 0; i < 50; i++) { X.beginPath(); X.arc(-362 + r() * 158, -150 + r() * 126, 0.5 + r() * 0.8, 0, TAU); X.fill(); }
    X.strokeStyle = col([255, 248, 230], 0.6); X.lineWidth = 0.8; X.beginPath(); X.moveTo(-365.6, -151.6); X.lineTo(-206.4, -155.6); X.stroke();
    sombra(fb, -300, -156, -202, -22, 0.2, P.piedra2);
    // las cuerdas que atan el bloque al trineo
    X.strokeStyle = col(U.mezcla(P.piedra2, P.tinta, 0.4)); X.lineWidth = 2;
    X.beginPath(); [-334, -284, -234].forEach(function (cx) { X.moveTo(cx, -14); X.lineTo(cx + 1, -158); X.moveTo(cx + 4.4, -14); X.lineTo(cx + 5.4, -158); }); X.stroke();
    X.strokeStyle = col(P.arena, 0.45); X.lineWidth = 0.6; X.beginPath(); [-334, -284, -234].forEach(function (cx) { for (var yy = -154; yy < -18; yy += 4) { X.moveTo(cx - 0.8, yy); X.lineTo(cx + 5.8, yy + 2.4); } }); X.stroke();
    // el poste de la proa, donde se ata la cuerda de tiro
    rellena([[-180, -14, 1], [-180, -68, 1], [-172, -68, 1], [-172, -14, 1]], lin(-180, 0, -172, 0, [[0, ES.aclarar(P.piedra2, 0.3)], [1, U.mezcla(P.piedra2, P.tinta, 0.4)]]));
    // el aguador, de pie en la proa, con la jarra inclinada
    aguador();
  }
  function aguador() {
    X.save(); X.translate(-212, -14); X.scale(GK, GK);
    var pl = PIEL;
    X.save(); X.translate(18, 0);
    piernaGente([-4, -118], [-20, -11.6], true);
    piernaGente([6, -118], [14, -11.6], false);
    X.restore();
    X.save(); X.translate(19, -118); X.rotate(0.22); torsoGente({ casquete: true }); faldaGente([0, 0], 0); X.restore();
    // la jarra de barro, inclinada hacia delante; las dos manos la sujetan
    X.save(); X.translate(78, -150); X.rotate(1.05);
    var ja = [[-10, -12], [-4, -16], [4, -16], [10, -12], [13, 0], [10, 14], [4, 20], [-4, 20], [-10, 14], [-13, 0]];
    rellena(ja, lin(-13, -16, 13, 20, [[0, ES.aclarar(P.cornalina, 0.25)], [0.5, U.mezcla(P.rojo, P.piedra2, 0.3)], [1, U.mezcla(P.rojo, P.tinta, 0.4)]]));
    rellena([[-5.4, -15], [5.4, -15], [6, -20], [-6, -20]], lin(-6, -20, 6, -15, [[0, U.mezcla(P.rojo, P.piedra2, 0.2)], [1, U.mezcla(P.rojo, P.tinta, 0.3)]]));
    X.strokeStyle = col(P.lino, 0.5); X.lineWidth = 0.8; X.beginPath(); X.moveTo(-12, -2); X.quadraticCurveTo(0, 2, 12, -2); X.stroke();
    X.restore();
    var hD = [44, -196], hA = [36, -205];
    var kA = brazoGente([hA[0] - 6, hA[1] + 2], [70, -138], true, 1); manoGente(kA[2], kA[3], Math.atan2(kA[3] - kA[1], kA[2] - kA[0]), 1, true);
    var kD = brazoGente([hD[0] + 6, hD[1] + 4], [86, -164], false, 1); manoGente(kD[2], kD[3], Math.atan2(kD[3] - kD[1], kD[2] - kD[0]), -1, false);
    X.restore();
  }
  // las piernas de un porteador en la fase f (0…1): andar inclinado, el pie que avanza se levanta un poco
  function piernasPorteador(f) {
    var a = f * TAU, H = [0, -114 + Math.cos(a * 2) * 1.6];
    var p1 = [Math.cos(a) * 24 + 8, -11.6 - Math.max(0, Math.sin(a)) * 9], p2 = [Math.cos(a + Math.PI) * 24 + 8, -11.6 - Math.max(0, Math.sin(a + Math.PI)) * 9];
    var t1 = Math.max(0, Math.sin(a)) * 0.35, t2 = Math.max(0, Math.sin(a + Math.PI)) * 0.35;
    piernaGente([H[0] + 4, H[1]], p1, true, -t1);
    piernaGente([H[0] - 6, H[1]], p2, false, -t2);
  }
  // el torso inclinado de un porteador, con la falda y los dos brazos que agarran la cuerda (manos en «manos»)
  var PO_MANOS = [[70, -100], [58, -96]];
  function torsoPorteador(v) {
    var lam = PO.inc;
    faldaGente([0, -114], lam * 0.5);
    function hombro(dx) { return [Math.sin(lam) * 78 + dx * Math.cos(lam), -114 - Math.cos(lam) * 78 + dx * Math.sin(lam)]; }
    var kD = brazoGente(hombro(30.5), PO_MANOS[0], true, 1);
    manoGente(kD[2], kD[3], Math.atan2(kD[3] - kD[1], kD[2] - kD[0]), -1, true);
    X.save(); X.translate(0, -114); X.rotate(lam); torsoGente({ casquete: v % 3 === 1 }); X.restore();
    var kA = brazoGente(hombro(-30.5), PO_MANOS[1], false, 1);
    manoGente(kA[2], kA[3], Math.atan2(kA[3] - kA[1], kA[2] - kA[0]), 1, false);
  }
  var PO_PX = 0, PO_NUEVAS = 0, PREPARANDO = false, PO_QUIETO = false;
  // la fase que se dibuja: la pedida si ya está pintada; si no, se pinta (dos como mucho por fotograma, para que el primer
  // ciclo no dé tirones) o se usa la más cercana que ya esté
  function fasePintada(n) {
    var px = PO_PX * GK;
    if (!PO_PX || PREPARANDO || PO_QUIETO || hayCache('porteadorPiernas' + n, px)) return n;
    if (PO_NUEVAS < 1) { PO_NUEVAS++; return n; }
    for (var d = 1; d < PO.fases; d++) {
      var a = (n - d + PO.fases) % PO.fases, b = (n + d) % PO.fases;
      if (hayCache('porteadorPiernas' + a, px)) return a;
      if (hayCache('porteadorPiernas' + b, px)) return b;
    }
    return n;
  }
  function porteadoresMueve(fase, t) {
    // las piernas y el torso de cada hombre, y la cuerda que pasa por sus manos
    var cuerda = [PO.cuerda.slice()];
    PO_NUEVAS = 0;
    for (var i = 0; i < PO.n; i++) {
      var v = i % 2, x0 = PO.x0 + i * PO.paso, f = ((fase + i * 0.07) % 1 + 1) % 1, n = fasePintada(Math.round(f * PO.fases) % PO.fases), bob = Math.cos(n / PO.fases * TAU * 2) * 1.6;
      X.save(); X.translate(x0, 0); X.scale(GK, GK);
      conCache('porteadorPiernas' + n, [-48, -128, 52, 2], PO_PX * GK, function () { piernasPorteador(n / PO.fases); });
      X.translate(0, bob);
      conCache('porteadorTorso' + v, [-46, -230, 92, -74], PO_PX * GK, function () { torsoPorteador(v); });
      X.restore();
      cuerda.push([x0 + PO_MANOS[1][0] * GK, (PO_MANOS[1][1] + bob) * GK - 1]);
      cuerda.push([x0 + PO_MANOS[0][0] * GK, (PO_MANOS[0][1] + bob) * GK - 1]);
    }
    // la cuerda: de la proa a la mano del último, combándose un poco entre hombres, y el cabo que cuelga
    X.strokeStyle = col(U.mezcla(P.piedra2, P.tinta, 0.35)); X.lineWidth = 2.2; X.lineCap = 'round';
    X.beginPath(); X.moveTo(cuerda[0][0], cuerda[0][1]);
    for (var j = 1; j < cuerda.length; j++) { var a = cuerda[j - 1], b = cuerda[j]; X.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + Math.min(6, Math.abs(b[0] - a[0]) * 0.06), b[0], b[1]); }
    var u = cuerda[cuerda.length - 1]; X.quadraticCurveTo(u[0] + 12, u[1] + 6, u[0] + 16, u[1] + 22);
    X.stroke();
    // el agua: el chorro que sale de la boca de la jarra y cae a la arena, temblando, y las salpicaduras
    var bo = [-212 + (78 + Math.cos(1.05 - Math.PI / 2) * 19) * GK, -14 + (-150 + Math.sin(1.05 - Math.PI / 2) * 19) * GK];
    bo = [-212 + (78 + 19 * Math.sin(1.05)) * GK, -14 + (-150 - 19 * Math.cos(1.05)) * GK];
    var w = Math.sin(t / 70) * 1.4, w2 = Math.sin(t / 53) * 1, fy = -1.6, ox = bo[0], oy = bo[1];
    X.fillStyle = lin(ox, oy, ox + 16, fy, [[0, ES.aclarar(C.lapisClaro, 0.35), 0.95], [0.6, C.lapisClaro, 0.9], [1, P.lapis, 0.8]]);
    X.beginPath(); X.moveTo(ox - 1, oy - 1.6); X.bezierCurveTo(ox + 9, oy + 2, ox + 12 + w, oy + 30, ox + 13 + w2, fy); X.lineTo(ox + 19.6 + w2, fy); X.bezierCurveTo(ox + 17 + w, oy + 30, ox + 13, oy + 4, ox + 1.6, oy + 2.4); X.closePath(); X.fill();
    X.strokeStyle = col([235, 244, 255], 0.75); X.lineWidth = 0.6; X.beginPath(); X.moveTo(ox + 2, oy); X.bezierCurveTo(ox + 10, oy + 4, ox + 13 + w, oy + 28, ox + 15 + w2, fy - 1); X.stroke();
    X.strokeStyle = col([225, 238, 255], 0.8); X.lineWidth = 0.7; X.beginPath(); X.ellipse(ox + 16, -1.4, 7 + Math.sin(t / 90) * 1.6, 1.2, 0, 0, TAU); X.stroke();
    X.fillStyle = col(C.lapisClaro, 0.8); X.beginPath();
    for (var g = 0; g < 4; g++) { var gq = ((t / 260 + g * 0.25) % 1), gxx = ox + 16 + (g % 2 ? 1 : -1) * (3 + gq * 8), gyy = -2 - Math.sin(gq * Math.PI) * 7; X.moveTo(gxx + 0.8, gyy); X.arc(gxx, gyy, 0.8, 0, TAU); }
    X.fill();
  }
  function dibujarPorteadores(ctx, x, y, s, op) {
    op = op || {};
    empezar(ctx, x, y, s, op);
    var fase = op.fase || 0, t = op.t == null ? fase * 1600 : op.t;
    // quieta (en teselas) no hay límite de cachés nuevas: cada tesela tiene que pintar exactamente lo mismo
    PO_QUIETO = op.fase == null && op.t == null;
    // (también quieto se dibuja desde las cachés: son las mismas para el mismo tamaño y salen siempre iguales)
    PO_PX = pxUnidad(); conCache('porteadoresFijo', PO_CAJA_FIJA, PO_PX, porteadoresFijo);
    porteadoresMueve(fase, t);
    acabar();
  }

  /* =====================================================================================================================
     16. La procesión: un relieve pintado de un muro de templo (≈ 0,22 × 0,08 u): cinco figuras pequeñas en fila —el
     faraón Tutmosis III delante, portadores de ofrendas y, la tercera, Hatshepsut como faraón (nemes, barba postiza y falda
     de hombre)—. Hatshepsut está borrada a cincel: solo queda su silueta picada. op.revelar (0–1) la devuelve de abajo arriba.
     Cada figura se pinta una vez en su lienzo y se compone con su bisel (luz arriba a la izquierda, sombra abajo a la derecha).
     ===================================================================================================================== */
  var PR = { k: 0.23, xs: [84, 42, 0, -42, -84], suelo: -7, caja: [-112, -82, 112, 2] };
  // una figura del relieve, sencilla (pocos rellenos, colores de pintura algo gastados), en unidades de dios
  function pintura(c) { return U.mezcla(c, P.piedra, 0.18); }
  function figuraRelieve(tipo) {
    var pl = { c: pintura(P.piel), c2: pintura(P.piel2), luz: [255, 214, 170] };
    function rel1(p, c) { rellena(p, rel(c, caja(p)[0], caja(p)[1], caja(p)[2], caja(p)[3], 0.12)); }
    // piernas en paso y pies
    [[PIERNA_DELANTE, TALON_DELANTE, true], [PIERNA_ATRAS, TALON_ATRAS, false]].forEach(function (q) {
      var hu = huesos(q[0]), p = contornoMiembro(hu, G_PIERNA);
      rellena(p, col(q[2] ? U.mezcla(pl.c, pl.c2, 0.4) : pl.c));
      rellena([[q[1] + 2.4, 0, 1], [q[1] + 38.8, 0], [q[1] + 40.6, -1], [q[1] + 39.4, -2.4], [q[1] + 24, -6.2], [q[1] + 14, -10.2], [q[1] + 11.4, -14, 1], [q[1] + 3.6, -14, 1], [q[1] + 0.1, -4]], col(q[2] ? U.mezcla(pl.c, pl.c2, 0.4) : pl.c));
    });
    // torso
    rellena(TORSO, col(pl.c));
    // falda
    var yb = tipo === 'hatshepsut' || tipo === 'tutmosis' ? -84 : -88;
    rel1([[-23.6, -151, 1], [12.4, -151, 1], [15.5, -138], [22, -118], [30, yb - 6], [34.8, yb - 2.8, 1], [8, yb + 1.6], [-12, yb + 1.4], [-26.2, yb, 1], [-28.4, yb + 12], [-29.2, -118], [-27, -134], [-23.4, -146]], pintura(P.lino));
    X.strokeStyle = col(P.lino2, 0.9); X.lineWidth = 1.6; X.beginPath();
    for (var i = 0; i < 6; i++) { X.moveTo(-22 + i * 9, -148); X.lineTo(-24 + i * 11, yb - 1); }
    X.stroke();
    if (tipo === 'hatshepsut' || tipo === 'tutmosis') {   // el delantal real, de oro y lapislázuli
      rel1([[-2, -146, 1], [12, -146, 1], [13.6, -98, 1], [-1, -98, 1]], pintura(P.oro2));
      X.fillStyle = col(pintura(P.lapis)); for (var j = 0; j < 4; j++) X.fillRect(-1.6, -140 + j * 11, 15, 4);
    }
    rellena([[-24.6, -154, 1], [13.6, -154, 1], [14.4, -145.4, 1], [-24.2, -145.4, 1]], col(pintura(P.oro2)));
    // la cabeza
    X.save(); X.translate(-3, -226);
    rellena(CARA, col(pl.c));
    X.fillStyle = col(P.negro); X.beginPath(); X.ellipse(11.4, -3.4, 4.2, 1.8, 0.05, 0, TAU); X.fill();
    X.fillRect(2, -4, 9, 1.4);
    X.fillStyle = col(P.lino); X.beginPath(); X.ellipse(12.2, -3.4, 2.6, 1, 0.05, 0, TAU); X.fill();
    X.fillStyle = col(P.negro); X.beginPath(); X.arc(12.8, -3.5, 0.9, 0, TAU); X.fill();
    if (tipo === 'hatshepsut') {
      // el nemes: el paño a rayas de oro y lapislázuli, con su cola detrás y los faldones delante del hombro
      var nm = [[16.4, -11], [15, -17], [8, -22.4], [-2, -24], [-12, -21], [-18, -12], [-20.6, 4], [-26, 30], [-16, 30], [-12, 14], [-8, 10], [-6, 2], [-3, -6], [4, -10.4], [12, -12]];
      rellena(nm, col(pintura(P.oro2)));
      X.save(); X.beginPath(); curva(X, nm, true); X.clip();
      X.fillStyle = col(pintura(P.lapis)); for (var r = -26; r < 32; r += 4.4) X.fillRect(-30, r, 50, 2);
      X.restore();
      rellena([[-2, 4], [4, 4], [6, 30], [-4, 30]], col(pintura(P.oro2)));
      X.fillStyle = col(pintura(P.lapis)); for (var r2 = 6; r2 < 30; r2 += 4.4) X.fillRect(-4, r2, 10, 2);
      // el ureo y la barba postiza real
      rellena([[15.6, -11.4], [17.6, -15.6], [19.6, -15], [18.4, -11]], col(pintura(P.oro2)));
    } else if (tipo === 'tutmosis') {
      // la corona blanca (hedjet), con su ureo
      var hj = [[16, -10], [15.6, -20], [11, -34], [7.4, -44], [6.4, -50], [2, -54], [-3, -51], [-4, -44], [-8, -32], [-14, -18], [-16.6, -8], [-6, -9], [6, -11]];
      rellena(hj, rel(pintura(P.lino), -16, -54, 16, -8, 0.15));
      rellena([[15.6, -11.4], [17.6, -15.6], [19.6, -15], [18.4, -11]], col(pintura(P.oro2)));
    } else {
      // la peluca corta de los portadores
      rellena([[-16.6, 8], [-18, -4], [-16.4, -15], [-10, -21.6], [0, -23.6], [9, -21.6], [14.8, -15.6], [16.6, -10.6], [12, -12.2], [4, -12.8], [-1.4, -11.4], [-3.4, -5], [-4.4, 4], [-6.4, 10.4], [-12, 11.6]], col(pintura(P.negro)));
    }
    X.restore();
    // el collar y, encima, la barba postiza de los reyes
    X.fillStyle = col(pintura(P.turquesa)); X.beginPath(); X.ellipse(1.2, -210, 22, 15, 0, 0, Math.PI); X.fill();
    X.fillStyle = col(pintura(P.oro2)); X.beginPath(); X.ellipse(1.2, -210, 15, 10, 0, 0, Math.PI); X.fill();
    if (tipo === 'hatshepsut' || tipo === 'tutmosis') {
      rellena([[11.6, -211.6], [15.2, -211.4], [15.8, -198], [12.2, -197.4]], col(pintura(P.lapis2)));
      X.fillStyle = col(pintura(P.oro2)); X.fillRect(11.8, -207, 3.8, 1.2); X.fillRect(12, -202.6, 3.8, 1.2);
    }
    // los brazos y lo que llevan
    function brazo(hu, c) { rellena(contornoMiembro(huesos(hu), G_BRAZO), col(c)); }
    var cA = U.mezcla(pl.c, pl.c2, 0.4);
    if (tipo === 'hatshepsut') {
      // ofrece dos vasos nu (de vino), con los brazos adelantados
      brazo([HOMBRO_ATRAS, [-6, -168], [36, -160]], cA); brazo([HOMBRO_DELANTE, [44, -170], [62, -178]], pl.c);
      [[42, -164], [66, -183]].forEach(function (v) { rellena([[v[0] - 5.6, v[1] - 3], [v[0] + 5.6, v[1] - 3], [v[0] + 5, v[1] + 4], [v[0], v[1] + 7], [v[0] - 5, v[1] + 4]], col(pintura(P.cornalina))); rellena([[v[0] - 3, v[1] - 5.6, 1], [v[0] + 3, v[1] - 5.6, 1], [v[0] + 3, v[1] - 2.6, 1], [v[0] - 3, v[1] - 2.6, 1]], col(pintura(P.oro2))); });
    } else if (tipo === 'tutmosis') {
      // el bastón largo y la maza
      rellena([[60, -246, 1], [63, -246, 1], [63, 0, 1], [60, 0, 1]], col(pintura(P.piedra2)));
      brazo([HOMBRO_DELANTE, [44, -166], [56, -138]], pl.c);
      brazo(BRAZO_CUELGA, cA);
      rellena([[-34, -112, 1], [-30, -112, 1], [-30, -86, 1], [-34, -86, 1]], col(pintura(P.piedra2)));
      X.fillStyle = col(pintura(P.lino)); X.beginPath(); X.ellipse(-32, -84, 5, 7, 0, 0, TAU); X.fill();
    } else if (tipo === 'panes') {
      // una bandeja de panes y frutas sobre la mano levantada
      brazo([HOMBRO_DELANTE, [52, -196], [44, -238]], pl.c);
      rellena([[18, -246, 1], [74, -246, 1], [72, -240, 1], [20, -240, 1]], col(pintura(P.oro3)));
      [[26, -252, 6, 7, P.oro2], [38, -256, 7, 10, P.cornalina], [52, -254, 6, 8, P.oro2], [64, -252, 6, 7, P.verde]].forEach(function (b) { X.fillStyle = col(pintura(b[4])); X.beginPath(); X.ellipse(b[0], b[1], b[2], b[3], 0, 0, TAU); X.fill(); });
      brazo(BRAZO_CUELGA, cA);
      rellena([[-40, -112], [-24, -112], [-22, -92], [-32, -84], [-42, -92]], col(pintura(P.rojo)));
    } else if (tipo === 'jarra') {
      // una jarra de vino de dos asas, al hombro, sujeta por la mano levantada
      X.save(); X.translate(30, -236); X.rotate(-0.35);
      rellena([[-5, -30], [5, -30], [4.6, -24], [10, -18], [13, -6], [12, 8], [6, 20], [0, 26], [-6, 20], [-12, 8], [-13, -6], [-10, -18], [-4.6, -24]], col(pintura(P.rojo)));
      X.strokeStyle = col(pintura(P.rojo)); X.lineWidth = 2.4; X.beginPath(); X.moveTo(-5, -24); X.quadraticCurveTo(-15, -26, -12, -14); X.moveTo(5, -24); X.quadraticCurveTo(15, -26, 12, -14); X.stroke();
      X.fillStyle = col(pintura(P.lino), 0.8); X.fillRect(-12, -6, 24, 3);
      X.restore();
      brazo([HOMBRO_DELANTE, [48, -184], [40, -222]], pl.c);
      brazo([HOMBRO_ATRAS, [-30, -158], [10, -150]], cA);
    } else if (tipo === 'flores') {
      // un ramo de lotos y un pato
      brazo([HOMBRO_DELANTE, [48, -170], [62, -172]], pl.c);
      X.strokeStyle = col(pintura(P.verde)); X.lineWidth = 2.4; X.beginPath(); X.moveTo(64, -170); X.lineTo(70, -232); X.moveTo(64, -170); X.lineTo(82, -226); X.moveTo(64, -170); X.lineTo(60, -236); X.stroke();
      [[70, -236], [83, -230], [59, -240]].forEach(function (f) { rellena([[f[0] - 6, f[1] + 2], [f[0] - 4, f[1] - 8], [f[0], f[1] - 12], [f[0] + 4, f[1] - 8], [f[0] + 6, f[1] + 2]], col(pintura(P.egipcio))); });
      brazo(BRAZO_CUELGA, cA);
      // un pato, que cuelga de la mano por las alas: el cuerpo, el cuello, la cabeza verde y el pico
      rellena([[-40, -112], [-28, -112], [-22, -104], [-24, -92], [-32, -86], [-40, -90], [-44, -100]], col(pintura(P.piedra2)));
      rellena([[-30, -92], [-28, -84], [-24, -76], [-27, -74], [-32, -82], [-34, -90]], col(pintura(P.piedra2)));
      rellena([[-27, -78], [-22, -76], [-21, -70], [-26, -69], [-29, -73]], col(pintura(P.verde)));
      rellena([[-21.4, -72.4], [-16, -71], [-21.4, -69.6]], col(pintura(P.oro2)));
      X.strokeStyle = col(pintura(P.lino), 0.8); X.lineWidth = 1.2; X.beginPath(); X.moveTo(-40, -104); X.quadraticCurveTo(-32, -100, -26, -104); X.moveTo(-40, -98); X.quadraticCurveTo(-32, -94, -26, -98); X.stroke();
    }
  }
  // el lienzo de una figura del relieve, con sus siluetas teñidas para el bisel (y la picada, para Hatshepsut)
  function spritesRelieve(tipo, px) {
    return cacheFig('relieve-' + tipo, [-60, -275, 90, 4], px * PR.k, function () { figuraRelieve(tipo); });
  }
  // tiñe un lienzo (su silueta) de un color: en un lienzo nuevo, con source-in (es un lienzo propio, no el del mundo)
  function tenido(c, color, a) {
    var L = U.lienzo(c.c.width, c.c.height);
    L.x.drawImage(c.c, 0, 0); L.x.globalCompositeOperation = 'source-in'; L.x.fillStyle = col(color, a == null ? 1 : a); L.x.fillRect(0, 0, L.w, L.h);
    return { c: L.c, x0: c.x0, y0: c.y0, w: c.w, h: c.h };
  }
  var BISEL = [[0.55, U.mezcla(P.piedra2, P.tinta, 0.35), 0.9], [-0.44, [255, 246, 222], 0.95]];   // [desplazamiento, color, opacidad]
  // la figura de Hatshepsut: su pintura, su silueta picada y (solo cuando se revela) su luz y su sombra teñidas
  function biselado(tipo, px) {
    var clave = tipo + '|' + Math.round(px * PR.k * 500) + '|' + DIR, b = TENIDOS[clave];
    if (b) return b;
    var c = spritesRelieve(tipo, px);
    if (!c) return { tipo: tipo };   // (sin caché posible: se pinta directo, sin bisel)
    b = TENIDOS[clave] = { tipo: tipo, pintura: c };
    if (tipo === 'hatshepsut') b.picada = picada(c);
    return b;
  }
  function tenidos(b) {
    if (b.pintura && !b.luz) { b.sombra = tenido(b.pintura, BISEL[0][1], BISEL[0][2]); b.luz = tenido(b.pintura, BISEL[1][1], BISEL[1][2]); }
    return b;
  }
  // la silueta picada a cincel: la forma algo agrandada e irregular, piedra más clara y rugosa, con golpes de cincel
  function picada(c) {
    var w = c.c.width, h = c.c.height, L = U.lienzo(w, h), k = L.x, r = U.azar(1479), sx = w / c.w, i;
    for (i = 0; i < 10; i++) { var an = i / 10 * TAU, d = (1.4 + r() * 1.2) * sx * 3.2; k.drawImage(c.c, Math.cos(an) * d, Math.sin(an) * d); }
    k.globalCompositeOperation = 'source-in';
    k.fillStyle = col(U.mezcla(P.piedra, [255, 250, 236], 0.18)); k.fillRect(0, 0, w, h);
    k.globalCompositeOperation = 'source-atop';
    // los golpes del cincel: muescas cortas, en la misma dirección, algo más oscuras y algo más claras (dos trazos, uno por tono)
    var oscuros = [], claros = [];
    for (i = 0; i < Math.round(w * h / 90); i++) {
      var x = r() * w, y = r() * h, l = (1 + r() * 2) * sx * 2.4, ang = -0.6 + r() * 0.5;
      (r() < 0.55 ? oscuros : claros).push([x, y, x + Math.cos(ang) * l, y + Math.sin(ang) * l]);
    }
    k.lineWidth = Math.max(0.6, sx * 1.6); k.lineCap = 'round';
    [[oscuros, U.mezcla(P.piedra, P.piedra2, 0.6), 0.4], [claros, [255, 250, 236], 0.4]].forEach(function (q) {
      k.strokeStyle = col(q[1], q[2]); k.beginPath();
      q[0].forEach(function (g) { k.moveTo(g[0], g[1]); k.lineTo(g[2], g[3]); });
      k.stroke();
    });
    // la sombra del borde de arriba a la izquierda (está hundida): en un lienzo de trabajo
    var S = U.auxiliar('procesionPicada', w, h); S.x.drawImage(L.c, 0, 0); S.x.globalCompositeOperation = 'destination-out'; S.x.drawImage(L.c, 1.4 * sx * 3, 1.4 * sx * 3);
    S.x.globalCompositeOperation = 'source-in'; S.x.fillStyle = col(U.mezcla(P.piedra2, P.tinta, 0.3), 0.75); S.x.fillRect(0, 0, w, h);
    S.x.globalCompositeOperation = 'source-over';
    k.globalCompositeOperation = 'source-over'; k.drawImage(S.c, 0, 0, w, h, 0, 0, w, h);
    return { c: L.c, x0: c.x0, y0: c.y0, w: c.w, h: c.h };
  }
  // el muro: caliza con su grano, las juntas de los sillares, el cielo (pt) arriba y la línea de suelo
  function muroProcesion(pxl) {
    var b = PR.caja;
    rellena([[b[0], b[1], 1], [b[2], b[1], 1], [b[2], b[3] - 2.6, 1], [b[0], b[3] - 2.6, 1]], lin(b[0], b[1], b[2], b[3], [[0, ES.aclarar(P.piedra, 0.25)], [0.5, P.piedra], [1, U.mezcla(P.piedra, P.piedra2, 0.45)]]));
    var r = U.azar(808);
    X.fillStyle = col(P.piedra2, 0.35); X.beginPath();
    for (var i = 0; i < 260; i++) { var x = b[0] + r() * (b[2] - b[0]), y = b[1] + r() * (b[3] - b[1] - 2), rr = 0.25 + r() * 0.5; X.moveTo(x + rr, y); X.arc(x, y, rr, 0, TAU); }
    X.fill();
    X.strokeStyle = col(P.piedra2, 0.55); X.lineWidth = 0.5; X.beginPath();
    X.moveTo(b[0], -44); X.lineTo(b[2], -44); X.moveTo(-60, b[1]); X.lineTo(-60, -44); X.moveTo(38, -44); X.lineTo(38, b[3] - 2); X.moveTo(96, b[1]); X.lineTo(96, -44); X.stroke();
    // el cielo (el signo pt): una banda de lapislázuli con estrellas de oro
    rellena([[b[0], b[1], 1], [b[2], b[1], 1], [b[2], b[1] + 6, 1], [b[0], b[1] + 6, 1]], lin(0, b[1], 0, b[1] + 6, [[0, pintura(C.lapisClaro)], [1, pintura(P.lapis2)]]));
    X.fillStyle = col(pintura(P.oro2));
    for (var e = b[0] + 8; e < b[2]; e += 14) { ES.estrella(X, e, b[1] + 3, 1.9, 0); X.fill(); }
    // la línea de suelo del registro
    rellena([[b[0], PR.suelo, 1], [b[2], PR.suelo, 1], [b[2], PR.suelo + 2.4, 1], [b[0], PR.suelo + 2.4, 1]], col(pintura(P.lapis)));
    // el bisel del marco
    X.fillStyle = col([255, 248, 230], 0.6); X.fillRect(b[0], b[1] + 6, b[2] - b[0], 0.7);
    X.fillStyle = col(P.piedra2, 0.8); X.fillRect(b[0], b[3] - 3.2, b[2] - b[0], 0.6);
  }
  // una figura del relieve con su bisel (luz arriba a la izquierda, sombra abajo a la derecha): para Hatshepsut al revelarla
  function ponerFigura(b, x) {
    X.save(); X.translate(x, PR.suelo); X.scale(PR.k, PR.k);
    if (!b.pintura) { figuraRelieve(b.tipo); X.restore(); return; }
    tenidos(b);
    var d = BISEL[0][0] / PR.k, dl = BISEL[1][0] / PR.k;
    X.save(); X.translate(d * DIR, d); ponerCache(b.sombra); X.restore();
    X.save(); X.translate(dl * DIR, dl); ponerCache(b.luz); X.restore();
    ponerCache(b.pintura);
    X.restore();
  }
  var PR_TIPOS = ['tutmosis', 'panes', 'hatshepsut', 'jarra', 'flores'];
  /* el muro con las cuatro figuras que no se borraron. Se pinta en la caché del muro (un lienzo propio): la sombra y la luz
     del bisel de las cuatro se hacen de una vez, en un lienzo de trabajo con la misma transformación, teñido y compuesto */
  function procesionFija(px) {
    muroProcesion(px);
    var figs = [], i;
    for (i = 0; i < 5; i++) if (i !== 2) figs.push([spritesRelieve(PR_TIPOS[i], px), PR.xs[i], PR_TIPOS[i]]);
    var propio = X.canvas && X.canvas !== PR_CTX_MUNDO && X.getTransform;
    if (!propio || figs.some(function (f) { return !f[0]; })) {   // (sin cachés: cada figura con su bisel, o directa)
      figs.forEach(function (f) { ponerFigura(biselado(f[2], px), f[1]); });
      return;
    }
    var m = X.getTransform(), cv = X.canvas, A = U.auxiliar('procesionBisel', cv.width, cv.height), k = A.x;
    BISEL.forEach(function (capa) {
      k.setTransform(1, 0, 0, 1, 0, 0); k.globalCompositeOperation = 'source-over'; k.clearRect(0, 0, A.w + 2, A.h + 2);
      k.setTransform(m.a, m.b, m.c, m.d, m.e, m.f);
      var d = capa[0] / PR.k;
      figs.forEach(function (f) { k.save(); k.translate(f[1], PR.suelo); k.scale(PR.k, PR.k); k.translate(d * DIR, d); k.drawImage(f[0].c, f[0].x0, f[0].y0, f[0].w, f[0].h); k.restore(); });
      k.setTransform(1, 0, 0, 1, 0, 0); k.globalCompositeOperation = 'source-in'; k.fillStyle = col(capa[1], capa[2]); k.fillRect(0, 0, A.w + 2, A.h + 2);
      k.globalCompositeOperation = 'source-over';
      X.save(); X.setTransform(1, 0, 0, 1, 0, 0); X.drawImage(A.c, 0, 0, A.w, A.h, 0, 0, A.w, A.h); X.restore();
    });
    figs.forEach(function (f) { X.save(); X.translate(f[1], PR.suelo); X.scale(PR.k, PR.k); ponerCache(f[0]); X.restore(); });
  }
  var PR_CTX_MUNDO = null;   // el lienzo que llega a dibujar (en ese no se usa setTransform)
  function dibujarProcesion(ctx, x, y, s, op) {
    op = op || {};
    empezar(ctx, x, y, s, op);
    var px = pxUnidad(), rv = U.clamp(op.revelar || 0, 0, 1);
    PR_CTX_MUNDO = ctx.canvas;
    conCache('procesionMuro', [PR.caja[0] - 1, PR.caja[1] - 1, PR.caja[2] + 1, PR.caja[3] + 1], px, function () { procesionFija(px); });
    var hb = biselado('hatshepsut', px), xh = PR.xs[2];
    // la silueta picada (se va desvaneciendo al final de la revelación)
    if (rv < 1 && hb.picada) { X.save(); X.translate(xh, PR.suelo); X.scale(PR.k, PR.k); X.globalAlpha *= 1 - U.tramo(rv, 0.8, 1); ponerCache(hb.picada); X.restore(); }
    if (rv > 0) {
      // la pintura vuelve de abajo arriba: la figura, recortada por debajo de la línea que sube, y un filo de luz dorada encima
      var yTop = PR.suelo - 64, yBot = PR.suelo + 1, yw = U.lerp(yBot, yTop - 2, U.inOut(rv));
      X.save(); X.beginPath(); X.rect(xh - 20, yw, 40, yBot - yw + 2); X.clip();
      ponerFigura(hb, xh);
      X.restore();
      if (rv < 1) {
        var brillo1 = Math.sin(Math.PI * Math.min(1, rv * 1.08));
        X.fillStyle = ES.lin(X, 0, yw - 3.4, 0, yw + 3.4, [[0, P.oro1, 0], [0.5, [255, 250, 214], 0.85 * brillo1], [1, P.oro1, 0]]);
        X.fillRect(xh - 19, yw - 3.4, 38, 6.8);
      }
    }
    acabar();
  }

  /* =====================================================================================================================
     17. Los tres descubridores, pintados al modo egipcio (perfil, hombros y ojo de frente, el mismo acabado). Alto ≈ 0,26 u.
     ===================================================================================================================== */
  // un miembro de tela (pernera, manga): el color con su luz y su sombra de lado a lado, y una raya de plancha opcional
  function miembroTela(H, g, c, op) {
    op = op || {};
    var p = contornoMiembro(H, g), fn = camino(p);
    var h0 = H.hu[0], h1 = H.hu[H.hu.length - 1], dx = h1[0] - h0[0], dy = h1[1] - h0[1], m = Math.hypot(dx, dy) || 1;
    var nx = -dy / m, ny = dx / m, L = luzLocal(); if (nx * L[0] + ny * L[1] < 0) { nx = -nx; ny = -ny; }
    var w = 0; for (var i = 0; i < g.length; i++) w = Math.max(w, g[i][1], g[i][2]);
    var e = enHueso(H, 0.5);
    X.beginPath(); fn(X);
    X.fillStyle = ES.lin(X, e.x + nx * w, e.y + ny * w, e.x - nx * w, e.y - ny * w, [[0, ES.aclarar(c, op.oscuro ? 0.06 : 0.16)], [0.35, c], [1, ES.oscurecer(c, op.oscuro ? 0.32 : 0.22)]]);
    X.fill();
    if (op.raya) {   // la raya del pantalón, de la rodilla abajo
      X.strokeStyle = col(ES.aclarar(c, 0.22), 0.6); X.lineWidth = 0.6; X.beginPath();
      var a0 = enHueso(H, 0.1), a1 = enHueso(H, 0.97); X.moveTo(a0.x + a0.nx * 1.5, a0.y + a0.ny * 1.5); X.lineTo(a1.x + a1.nx * 1.5, a1.y + a1.ny * 1.5); X.stroke();
    }
    return p;
  }
  // un zapato de cuero (en vez del pie): (xT el talón), con su tacón y la suela
  function zapato(xT, c, op) {
    op = op || {};
    var y0 = op.y || 0, L = op.largo || 40;
    var p = [[xT, y0, 1], [xT + L * 0.95, y0, 1], [xT + L * 1.04, y0 - 2.4], [xT + L * 1.02, y0 - 6], [xT + L * 0.88, y0 - 9.4], [xT + L * 0.62, y0 - 11.6], [xT + L * 0.34, y0 - 14.4], [xT + L * 0.28, y0 - 17, 1], [xT + L * 0.06, y0 - 17, 1], [xT - L * 0.02, y0 - 10], [xT - 0.6, y0 - 3]];
    rellena(p, lin(xT, y0 - 17, xT + L, y0, [[0, ES.aclarar(c, 0.25)], [0.5, c], [1, ES.oscurecer(c, 0.35)]]));
    X.fillStyle = col(ES.oscurecer(c, 0.5)); X.fillRect(xT, y0 - 1.6, L * 0.98, 1.6);
    X.fillStyle = col([255, 255, 255], 0.3); X.beginPath(); X.ellipse(xT + L * 0.8, y0 - 7.4, L * 0.12, 1.1, -0.3, 0, TAU); X.fill();
    if (op.cordones) { X.strokeStyle = col(ES.oscurecer(c, 0.5), 0.8); X.lineWidth = 0.5; X.beginPath(); X.moveTo(xT + L * 0.36, y0 - 13); X.lineTo(xT + L * 0.56, y0 - 10.6); X.stroke(); }
  }
  // la cara de un hombre moderno (pelo, bigote, patillas) sobre la cabeza egipcia
  function peloCorto(c, op) {
    op = op || {};
    var p = op.rizos
      ? [[-15.4, 4], [-17.6, -6], [-17, -15], [-12.6, -21], [-5, -24.6], [3, -25.2], [10, -23.6], [15.6, -18], [17.4, -12], [14, -14], [8, -15.6], [2, -15], [-1.4, -12], [-2.6, -4], [-3.6, 4.4], [-1.8, 9.6], [-4.4, 12], [-8.6, 10]]
      : [[-14.6, 0], [-16.6, -8], [-15.4, -16], [-10, -21.4], [-1, -23.4], [8, -22.4], [14, -18.6], [16.4, -13], [12, -14.4], [6, -15], [0, -14], [-2.4, -9.4], [-3.6, -5.6], [-6, -2.4], [-9.6, 1.6], [-12.6, 2.6]];
    var fn = camino(p), b = caja(p);
    X.beginPath(); fn(X); X.fillStyle = rel(c, b[0], b[1], b[2], b[3], 0.22); X.fill();
    if (op.rizos) {
      X.strokeStyle = col(ES.aclarar(c, 0.3), 0.6); X.lineWidth = 0.7; X.beginPath();
      [[-12, -16], [-7, -21], [0, -22.6], [7, -21], [-15, -8], [-14, 0], [-10, -12], [-4, -16], [3, -18]].forEach(function (r) { X.moveTo(r[0] + 2.2, r[1]); X.arc(r[0], r[1], 2.2, 0, Math.PI * 1.4); });
      X.stroke();
    } else {
      lineas(fn, [[-14, -8, -6, -19], [-10, -4, 0, -20], [-6, 0, 6, -19]], ES.aclarar(c, 0.3), 0.45, 0.6);
    }
    brillo(fn, b[0], b[1], b[0] + 14, b[1] + 10, 0.3);
  }
  function bigote(c) {
    rellena([[19.6, 5], [17, 5.4], [14.6, 6.6], [13.4, 8.4], [15.6, 7.8], [18.2, 7.4], [20.4, 6.8]], lin(13, 5, 21, 8, [[0, ES.aclarar(c, 0.2)], [1, c]]));
  }

  /* ---------- Howard Carter, 1922: traje de tres piezas, pajarita, sombrero homburg y bigote, con una vela, asomándose ---------- */
  var CA = { traje: U.mezcla(P.piedra2, P.tinta, 0.42), chaleco: U.mezcla(P.piedra2, P.tinta, 0.62), som: U.mezcla(P.negro2, P.tinta, 0.5), zap: U.mezcla(P.tinta, P.negro, 0.45), inc: 0.16 };
  var CA_VELA = [70, -233];   // la mano de la vela (antes de inclinarse)
  function carterQuieto() {
    var pl = PIEL, inc = CA.inc;
    // las piernas (pantalón) y los zapatos: la de delante adelantada y algo doblada
    var hD = huesos([[2, -116], [20, -66], [26, -14]]), hA = huesos([[-12, -116], [-16, -66], [-22, -14]]);
    var GP = [[0, 13, 13], [0.3, 11, 11.4], [0.5, 9.6, 9.6], [0.8, 8.4, 8.6], [1, 8, 8.2]];
    miembroTela(hD, GP, ES.oscurecer(CA.traje, 0.12), { oscuro: true, raya: true });
    zapato(15, CA.zap, { cordones: true });
    miembroTela(hA, GP, CA.traje, { raya: true });
    zapato(-33, CA.zap, { cordones: true });
    // el cuerpo, inclinado hacia delante desde la cadera
    X.save(); X.translate(-5, -116); X.rotate(inc); X.translate(5, 116);
    // la manga de atrás (cuelga algo doblada)
    var bA = huesos([HOMBRO_ATRAS, [-36, -156], [-28, -118]]);
    miembroTela(bA, [[0, 8.2, 8.2], [0.5, 6.6, 6.6], [0.92, 6, 6], [1, 6, 6]], ES.oscurecer(CA.traje, 0.1), { oscuro: true });
    rellena([[-34.6, -121], [-22.6, -120], [-23.4, -114.6], [-34.4, -115.6]], col(P.lino));
    puno(-28.6, -108.8, -28, -118, null, pl, { abajo: true, oscuro: true });
    // la chaqueta: hombros anchos, cintura entallada y los faldones hasta la cadera
    var ch = [[-8, -213], [-20, -211], [-32, -207.6], [-39, -201], [-39.6, -190], [-35.4, -180], [-32, -164], [-29, -146], [-31.6, -126], [-33, -106, 1], [24, -104, 1], [21.4, -124], [16.6, -146], [18, -164], [24, -178], [31, -186], [38, -192], [39.4, -200], [33.6, -207], [22, -211], [9, -213]];
    var fch = camino(ch), bc = caja(ch);
    X.beginPath(); fch(X); X.fillStyle = lin(bc[0], bc[1], bc[2], bc[3], [[0, ES.aclarar(CA.traje, 0.18)], [0.5, CA.traje], [1, ES.oscurecer(CA.traje, 0.25)]]); X.fill();
    // el tweed: rayitas cruzadas muy suaves
    lineas(fch, (function () { var r = [], i; for (i = -60; i < 60; i += 3.2) r.push([i - 30, -215, i + 30, -100]); for (i = -60; i < 60; i += 3.2) r.push([i + 30, -215, i - 30, -100]); return r; })(), ES.oscurecer(CA.traje, 0.25), 0.18, 0.5);
    // el chaleco en la abertura, con sus botones, la camisa y la pajarita
    var v = [[-4, -206], [6, -206], [14, -186], [14, -150], [10, -142, 1], [-2, -142, 1], [-6, -160], [-8, -190]];
    rellena(v, lin(-8, -206, 14, -142, [[0, ES.aclarar(CA.chaleco, 0.15)], [1, ES.oscurecer(CA.chaleco, 0.2)]]));
    X.fillStyle = col(P.oro3); [-186, -174, -162, -150].forEach(function (yy) { X.beginPath(); X.arc(6.4, yy, 1.1, 0, TAU); X.fill(); });
    // la cadena del reloj, de oro
    X.strokeStyle = oro(-2, -166, 14, -160, 0.4); X.lineWidth = 0.7; X.beginPath(); X.moveTo(6.4, -162); X.quadraticCurveTo(0, -158, -4, -164); X.stroke();
    // las solapas
    rellena([[-6, -209], [2, -205], [-1, -176], [-6, -150], [-10, -170], [-12, -200]], lin(-12, -209, 2, -150, [[0, ES.aclarar(CA.traje, 0.24)], [1, ES.oscurecer(CA.traje, 0.1)]]));
    rellena([[8, -209], [16, -203], [20, -184], [14, -164], [12, -186]], lin(8, -209, 20, -164, [[0, CA.traje], [1, ES.oscurecer(CA.traje, 0.28)]]));
    X.fillStyle = col(ES.oscurecer(CA.traje, 0.4)); X.beginPath(); X.arc(13.4, -142, 1.4, 0, TAU); X.fill();
    // el bolsillo del pecho, con el pañuelo
    rellena([[-30, -172, 1], [-18, -172, 1], [-18, -169.6, 1], [-30, -169.6, 1]], col(ES.oscurecer(CA.traje, 0.3)));
    rellena([[-28, -172], [-24, -176], [-20, -172]], col(P.lino));
    // el cuello de la camisa y la pajarita
    rellena([[-6, -218], [9, -218], [11, -209], [2, -205], [-7, -209]], lin(-7, -218, 11, -205, [[0, [255, 255, 255]], [1, P.lino2]]));
    rellena([[-3, -213], [1.6, -210.4], [6.4, -213.4], [6.6, -206.6], [1.6, -209], [-3.2, -206.2]], lin(-3, -214, 7, -206, [[0, P.negro2], [1, P.negro]]));
    // la cabeza: perfil egipcio, el ojo de frente con su raya, el pelo corto, el bigote, y el homburg
    X.save(); X.translate(-3, -230);
    cabezaHumana({ pl: pl, extKohl: 4.6, kohl: U.mezcla(P.negro, P.tinta, 0.5) });
    peloCorto(U.mezcla(P.tinta, P.negro, 0.3));
    bigote(U.mezcla(P.tinta, P.negro, 0.3));
    homburg(CA.som);
    X.restore();
    X.restore();
  }
  // el sombrero homburg: la copa con la hendidura a lo largo, la cinta, y el ala con el borde levantado
  function homburg(c) {
    var copa = [[-15.6, -15], [-15.6, -26], [-12.4, -33.6], [-6, -35.2], [-1.6, -32.6], [2.6, -35.6], [9.6, -34.4], [13.6, -27], [14, -15]];
    rellena(copa, lin(-16, -36, 14, -15, [[0, ES.aclarar(c, 0.22)], [0.5, c], [1, ES.oscurecer(c, 0.3)]]));
    X.strokeStyle = col(ES.oscurecer(c, 0.35), 0.8); X.lineWidth = 0.6; X.beginPath(); X.moveTo(-6, -34.6); X.quadraticCurveTo(-1.6, -30, 2.6, -35); X.stroke();
    brillo(camino(copa), -16, -36, -6, -20, 0.3);
    rellena([[-15.8, -21, 1], [14.2, -21, 1], [14.1, -16.4, 1], [-15.8, -16.4, 1]], lin(0, -21, 0, -16, [[0, ES.oscurecer(c, 0.25)], [1, ES.oscurecer(c, 0.45)]]));
    // el ala: fina, con los bordes curvados hacia arriba
    var ala = [[-24, -18.6], [-21, -15.2], [-12, -13.2], [0, -12.8], [12, -13.2], [20.6, -15], [23.4, -18.4], [22, -17], [12, -15.6], [0, -15.2], [-12, -15.6], [-22.4, -17.2]];
    rellena(ala, lin(-24, -19, 24, -12, [[0, ES.aclarar(c, 0.2)], [1, ES.oscurecer(c, 0.3)]]));
  }
  // la vela en la mano y su llama (la llama tiembla con t)
  function carterVela(t, inc) {
    var pl = PIEL;
    X.save(); X.translate(-5, -116); X.rotate(inc); X.translate(5, 116);
    var bD = huesos([HOMBRO_DELANTE, [52, -186], [CA_VELA[0] - 4, CA_VELA[1] + 6]]);
    miembroTela(bD, [[0, 8.2, 8.2], [0.5, 6.6, 6.6], [0.92, 6, 6], [1, 6, 6]], CA.traje);
    // el puño de la camisa
    var e = enHueso(bD, 0.96);
    rellena([[e.x - 5, e.y + 3], [e.x + 1, e.y - 4.6], [e.x + 5.6, e.y - 1], [e.x - 0.6, e.y + 6.4]], col(P.lino));
    // la vela, blanca, y el plato del candelero
    var vx = CA_VELA[0] + 3, vy = CA_VELA[1];
    rellena([[vx - 2.2, vy + 6, 1], [vx + 2.2, vy + 6, 1], [vx + 2.2, vy - 16, 1], [vx - 2.2, vy - 16, 1]], lin(vx - 2.2, 0, vx + 2.2, 0, [[0, [255, 255, 250]], [1, P.lino2]]));
    X.fillStyle = col(P.lino); X.beginPath(); X.ellipse(vx - 1, vy - 15.6, 1.6, 1.2, 0, 0, TAU); X.fill();
    puno(vx, vy, CA_VELA[0] - 4, CA_VELA[1] + 6, null, pl, {});
    // la llama: núcleo claro, oro y un borde de cornalina, con su halo
    var temb = t == null ? 0 : Math.sin(t / 83) * 0.6 + Math.sin(t / 37) * 0.35, alto = 9 + (t == null ? 0 : Math.sin(t / 61) * 0.9);
    var fx = vx, fy = vy - 17;
    X.fillStyle = ES.rad(X, fx, fy - 4, 0, 16, [[0, [255, 236, 160], 0.45], [0.5, [255, 210, 120], 0.16], [1, [255, 200, 100], 0]]);
    X.beginPath(); X.arc(fx, fy - 4, 16, 0, TAU); X.fill();
    function llama(k, a) {
      X.beginPath(); X.moveTo(fx, fy + 0.6);
      X.bezierCurveTo(fx - 3.2 * k, fy - 1, fx - 2.6 * k + temb, fy - alto * k * 0.6, fx + temb * 1.4, fy - alto * k);
      X.bezierCurveTo(fx + 2.6 * k + temb, fy - alto * k * 0.6, fx + 3.2 * k, fy - 1, fx, fy + 0.6);
      X.fillStyle = a; X.fill();
    }
    llama(1, lin(fx, fy, fx, fy - alto, [[0, P.cornalina], [0.4, P.oro2], [1, P.oro1]]));
    llama(0.55, col([255, 252, 226], 0.95));
    X.strokeStyle = col(P.negro); X.lineWidth = 0.6; X.beginPath(); X.moveTo(fx, fy + 0.6); X.lineTo(fx, fy - 1.6); X.stroke();
    X.restore();
  }
  var CA_CAJA = [-60, -280, 100, 4];
  function dibujarCarter(ctx, x, y, s, op) {
    op = op || {};
    empezar(ctx, x, y, s, op);
    X.translate(-12, 0);
    if (op.t == null) carterQuieto(); else conCache('carter', CA_CAJA, pxUnidad(), carterQuieto);
    carterVela(op.t, CA.inc);
    acabar();
  }

  /* ---------- Jean-François Champollion, 1822: joven, levita, chaleco y pañuelo al cuello, corriendo con unos papeles ---------- */
  var CH = { levita: U.mezcla(P.lapis2, P.negro, 0.45), chaleco: U.mezcla(P.oro2, P.lino, 0.35), pantalon: U.mezcla(P.arena, P.lino2, 0.4), bota: U.mezcla(P.negro, P.tinta, 0.3), inc: 0.2 };
  function dibujarChampollion(ctx, x, y, s, op) {
    empezar(ctx, x, y, s, op);
    X.translate(-4, 6);
    var pl = PIEL, inc = CH.inc;
    // la pierna de atrás (estirada, empujando con la punta) y la de delante (doblada, que pisa de talón)
    var GP = [[0, 12, 12.4], [0.3, 10, 10.6], [0.5, 8.6, 8.6], [0.8, 7, 7.2], [1, 6.6, 6.8]];
    var hD = huesos([[6, -112], [44, -82], [42, -22]]), hA = huesos([[-8, -112], [-34, -70], [-62, -32]]);
    miembroTela(hA, GP, ES.oscurecer(CH.pantalon, 0.12), { oscuro: true });
    X.save(); X.translate(-62, -32); X.rotate(-0.95); zapato(-6, CH.bota, { y: 16, largo: 36 }); X.restore();
    miembroTela(hD, GP, CH.pantalon);
    X.save(); X.translate(42, -22); X.rotate(-0.24); zapato(-8, CH.bota, { y: 14, largo: 36 }); X.restore();
    X.save(); X.translate(0, -112); X.rotate(inc); X.translate(0, 112);
    // los faldones de la levita, que vuelan detrás
    rellena([[-24, -132], [-30, -116], [-44, -98], [-62, -84], [-68, -86], [-54, -104], [-40, -126]], lin(-68, -132, -24, -84, [[0, ES.aclarar(CH.levita, 0.12)], [1, ES.oscurecer(CH.levita, 0.2)]]));
    rellena([[-26, -130], [-36, -112], [-52, -96], [-58, -100], [-44, -118]], lin(-58, -130, -26, -96, [[0, CH.levita], [1, ES.oscurecer(CH.levita, 0.3)]]));
    // el brazo de atrás, que se balancea hacia atrás
    var bA = huesos([HOMBRO_ATRAS, [-48, -170], [-62, -146]]);
    miembroTela(bA, [[0, 7.8, 7.8], [0.5, 6.2, 6.2], [1, 5.6, 5.6]], ES.oscurecer(CH.levita, 0.1), { oscuro: true });
    puno(-65, -141, -62, -146, null, pl, { oscuro: true });
    // la levita: hombros, cintura, solapas grandes y el cuello alto; el chaleco y el pañuelo
    var lv = [[-8, -213], [-20, -211], [-31, -207.6], [-37, -201], [-37.4, -190], [-33, -180], [-29.6, -164], [-26.6, -146], [-27.4, -130], [-24, -126, 1], [14, -128, 1], [14.6, -146], [17, -164], [24, -178], [31, -186], [36, -192], [37, -200], [32, -207], [22, -211], [9, -213]];
    var flv = camino(lv), bl = caja(lv);
    X.beginPath(); flv(X); X.fillStyle = lin(bl[0], bl[1], bl[2], bl[3], [[0, ES.aclarar(CH.levita, 0.2)], [0.5, CH.levita], [1, ES.oscurecer(CH.levita, 0.25)]]); X.fill();
    var ve = [[-4, -206], [8, -206], [15, -184], [15.6, -146], [13, -132, 1], [-2, -132, 1], [-6, -160], [-8, -190]];
    rellena(ve, lin(-8, -206, 16, -132, [[0, ES.aclarar(CH.chaleco, 0.2)], [1, ES.oscurecer(CH.chaleco, 0.18)]]));
    X.fillStyle = col(P.oro3); [-182, -170, -158, -146].forEach(function (yy) { X.beginPath(); X.arc(8.6, yy, 1, 0, TAU); X.fill(); });
    rellena([[-6, -212], [2, -206], [-2, -178], [-8, -150], [-12, -176], [-13, -204]], lin(-13, -212, 2, -150, [[0, ES.aclarar(CH.levita, 0.3)], [1, CH.levita]]));
    rellena([[10, -212], [18, -205], [22, -186], [16, -166], [13, -188]], lin(10, -212, 22, -166, [[0, CH.levita], [1, ES.oscurecer(CH.levita, 0.3)]]));
    // el pañuelo blanco, alto, anudado al cuello
    rellena([[-6, -224], [9, -224], [11, -212], [6, -204], [2, -196], [-1, -204], [-7, -212]], lin(-7, -224, 11, -196, [[0, [255, 255, 255]], [1, P.lino2]]));
    lineas(camino([[-6, -224], [9, -224], [11, -212], [6, -204], [2, -196], [-1, -204], [-7, -212]]), [[-6, -219, 10, -219], [-6, -215, 10, -214]], P.lino2, 0.8, 0.5);
    // la cabeza: perfil egipcio, joven, con el pelo rizado y las patillas
    X.save(); X.translate(-3, -232);
    cabezaHumana({ pl: pl, extKohl: 4.6, kohl: U.mezcla(P.negro, P.tinta, 0.5) });
    peloCorto(U.mezcla(P.tinta, P.negro, 0.2), { rizos: true });
    rellena([[-1.4, -10], [1.4, -10], [1, 4], [-1.6, 3]], col(U.mezcla(P.tinta, P.negro, 0.2)));
    X.restore();
    // el brazo de delante, adelantado y en alto, con los papeles
    var bD = huesos([HOMBRO_DELANTE, [52, -194], [70, -216]]);
    miembroTela(bD, [[0, 7.8, 7.8], [0.5, 6.2, 6.2], [1, 5.6, 5.6]], CH.levita);
    // los papeles: tres hojas abiertas, una con el óvalo de un cartucho
    [[0.5, 0], [0.18, 1], [-0.12, 2]].forEach(function (h) {
      X.save(); X.translate(76, -222); X.rotate(h[0]);
      rellena([[-2, -2, 1], [18, -2, 1], [19, 24, 1], [-1, 25, 1]], lin(-2, -2, 19, 25, [[0, [255, 253, 244]], [1, P.lino2]]));
      if (h[1] === 2) { X.strokeStyle = col(P.tinta, 0.7); X.lineWidth = 0.7; X.beginPath(); X.ellipse(8.6, 11, 4, 8, 0, 0, TAU); X.moveTo(3.6, 20.4); X.lineTo(13.6, 20.4); X.stroke(); }
      else { X.strokeStyle = col(P.tinta, 0.35); X.lineWidth = 0.5; X.beginPath(); for (var yy = 4; yy < 22; yy += 3.4) { X.moveTo(1.4, yy); X.lineTo(15.4, yy); } X.stroke(); }
      X.restore();
    });
    puno(74, -221, 70, -216, null, pl, {});
    X.restore();
    acabar();
  }

  /* ---------- Eratóstenes: un sabio griego con quitón e himatión y barba, con un gnomon clavado en el suelo y su sombra.
     La sombra es la del mediodía del solsticio de verano en Alejandría: 7,2° (1/50 de círculo), con su rayo de sol ---------- */
  var ER = { himation: U.mezcla(P.lapis, P.egipcio, 0.25), barba: U.mezcla(P.lino2, C.gris, 0.5), gnomon: [104, -126] };
  function dibujarEratostenes(ctx, x, y, s, op) {
    empezar(ctx, x, y, s, op);
    X.translate(-16.8, 0);   // el ancla, entre los pies (el gnomon queda delante, dentro de la caja)
    var pl = PIEL;
    // el gnomon: una vara de bronce clavada en un montoncito de arena, y su sombra corta (7,2°) en el suelo
    var gx0 = ER.gnomon[0], gH = -ER.gnomon[1], somb = gH * Math.tan(7.2 * Math.PI / 180);
    rellena([[gx0 + 0.6, 0, 1], [gx0 + somb + 1, -0.2], [gx0 + somb + 1, 0.9], [gx0 + 0.6, 1.6, 1]], col(U.mezcla(P.tinta, P.piedra2, 0.3), 0.7));
    rellena([[gx0 - 10, 0, 1], [gx0 - 6, -3.4], [gx0, -4.4], [gx0 + 6, -3.2], [gx0 + 10, 0, 1]], lin(0, -4.4, 0, 0, [[0, P.arena], [1, P.arena2]]));
    rellena([[gx0 - 1.3, -2, 1], [gx0 + 1.3, -2, 1], [gx0 + 1, -gH, 1], [gx0 - 1, -gH, 1]], lin(gx0 - 1.3, 0, gx0 + 1.3, 0, [[0, P.oro2], [0.5, P.oro3], [1, P.oro4]]));
    X.beginPath(); X.arc(gx0, -gH - 1, 1.6, 0, TAU); X.fillStyle = oro(gx0 - 2, -gH - 3, gx0 + 2, -gH + 1, 0.4); X.fill();
    // el rayo de sol que roza la punta y el ángulo (un arco de oro)
    var ang = 7.2 * Math.PI / 180;
    X.save(); X.strokeStyle = col(P.oro3, 0.75); X.lineWidth = 0.7;
    if (X.setLineDash) X.setLineDash([3, 2.4]);
    X.beginPath(); X.moveTo(gx0 - Math.sin(ang) * 70, -gH - Math.cos(ang) * 70); X.lineTo(gx0 + somb, 0); X.stroke();
    if (X.setLineDash) X.setLineDash([]);
    X.beginPath(); X.arc(gx0, -gH, 26, Math.PI / 2, Math.PI / 2 - ang, true); X.stroke();
    X.restore();
    // las piernas (bajo el quitón asoman las pantorrillas) y las sandalias
    var hD = huesos([[4, -122], [20, -72], [32, -12]]), hA = huesos([[-8, -122], [-14, -76], [-20, -12]]);
    var pz = tonoPiel(pl.c, -40, -215, 75, 0, 0.14);
    miembroPiel(hD, G_PIERNA, null, pl, { oscuro: true }); pie(22, 40, null, pl, { oscuro: true });
    miembroPiel(hA, G_PIERNA, pz, pl); pie(-29, 40, pz, pl);
    [[22, true], [-29, false]].forEach(function (q) {
      X.fillStyle = col(U.mezcla(P.oro4, P.tinta, 0.3)); X.fillRect(q[0] + 1, -1.4, 38, 1.4);
      X.strokeStyle = col(U.mezcla(P.oro3, P.tinta, 0.2)); X.lineWidth = 1.1; X.beginPath(); X.moveTo(q[0] + 30, -2); X.lineTo(q[0] + 12, -12); X.moveTo(q[0] + 3, -12.6); X.lineTo(q[0] + 12, -12); X.stroke();
    });
    // el quitón: la túnica de lino, larga, de los hombros a media pantorrilla, con pliegues verticales
    var qt = [[-8, -212], [-22, -209.6], [-33, -205], [-38, -197], [-37, -186], [-32, -172], [-29, -150], [-31, -120], [-31, -90], [-29.6, -54, 1], [36, -54, 1], [33, -86], [26, -118], [18, -146], [20, -164], [28, -180], [35.6, -190], [37.6, -198], [33, -205], [22, -209.6], [8, -212]];
    var fq = camino(qt), bq = caja(qt);
    X.beginPath(); fq(X); X.fillStyle = lin(bq[0], bq[1], bq[2], bq[3], [[0, [255, 253, 246]], [0.45, P.lino], [1, P.lino2]]); X.fill();
    lineas(fq, [[-24, -190, -26, -56], [-16, -180, -18, -56], [-8, -150, -8, -56], [0, -140, 2, -56], [8, -130, 12, -56], [16, -120, 22, -56], [24, -110, 30, -56]], C.pliegue, 0.5, 0.5);
    // el himatión: el manto azul que cae del hombro de atrás, cruza el cuerpo en diagonal y envuelve las piernas
    var hi = [[-34, -206], [-22, -210], [-10, -206], [4, -186], [20, -160], [30, -134], [34, -104], [35.4, -68], [32, -60, 1], [-30, -62, 1], [-33, -94], [-34, -126], [-37, -160], [-40, -190]];
    var fh = camino(hi), bh = caja(hi);
    X.beginPath(); fh(X); X.fillStyle = lin(bh[0], bh[1], bh[2], bh[3], [[0, ES.aclarar(ER.himation, 0.22)], [0.5, ER.himation], [1, ES.oscurecer(ER.himation, 0.28)]]); X.fill();
    lineas(fh, [[-30, -196, 24, -128], [-30, -178, 30, -110], [-31, -160, 32, -92], [-31, -142, 34, -76], [-31, -122, 34, -64], [-31, -104, 20, -62]], ES.oscurecer(ER.himation, 0.35), 0.5, 0.6);
    X.strokeStyle = col(ES.aclarar(ER.himation, 0.4), 0.8); X.lineWidth = 0.8; X.beginPath(); X.moveTo(-10, -206); X.bezierCurveTo(4, -186, 20, -160, 30, -134); X.stroke();
    // la cenefa de oro del manto
    rellena([[-30, -62, 1], [32, -60, 1], [32.6, -64, 1], [-30.4, -66, 1]], oro(-30, -66, 32, -60, 0.4));
    // el brazo de atrás sujeta un rollo de papiro a la cintura
    var bA = huesos([HOMBRO_ATRAS, [-34, -158], [-10, -142]]);
    miembroPiel(bA, G_BRAZO, null, pl, { oscuro: true });
    X.save(); X.translate(-4, -144); X.rotate(-0.25);
    rellena([[-3, -14, 1], [3, -14, 1], [3, 14, 1], [-3, 14, 1]], lin(-3, 0, 3, 0, [[0, [255, 246, 220]], [1, P.papiro3]]));
    X.fillStyle = col(P.papiro2); X.beginPath(); X.ellipse(0, -14, 3, 1.2, 0, 0, TAU); X.fill();
    X.restore();
    puno(-6, -142, -10, -142, null, pl, { oscuro: true });
    // la cabeza del sabio: el pelo y la barba canosos, con la cinta
    X.save(); X.translate(-3, -226);
    cabezaHumana({ pl: pl, extKohl: 4.6, kohl: U.mezcla(P.negro, P.tinta, 0.5) });
    peloCorto(ER.barba);
    var bb = [[-2, 4], [3, 9], [9, 13.6], [16, 14], [19, 12], [18.6, 16], [16, 22], [11, 25.4], [4, 24], [-1, 18], [-3, 10]];
    rellena(bb, lin(-3, 4, 19, 25, [[0, ES.aclarar(ER.barba, 0.25)], [1, ES.oscurecer(ER.barba, 0.2)]]));
    lineas(camino(bb), [[2, 10, 4, 22], [7, 14, 9, 24], [12, 15, 13, 24]], ES.oscurecer(ER.barba, 0.25), 0.6, 0.5);
    bigote(ER.barba);
    X.strokeStyle = col(P.cornalina); X.lineWidth = 1.6; X.beginPath(); X.moveTo(-15.6, -12); X.quadraticCurveTo(0, -20.4, 15.4, -12.6); X.stroke();
    X.restore();
    // el brazo de delante, estirado, señala la punta del gnomon con el índice
    var bD = huesos([HOMBRO_DELANTE, [56, -184], [82, -192]]);
    miembroPiel(bD, G_BRAZO, pz, pl);
    mano('senala', 82, -192, -0.28, -1, pz, pl, 1);
    acabar();
  }

  /* ---------- preparar: las cachés de una pieza animada, de antemano ----------
     AE.arte.<pieza>.preparar(s, escala): pinta todas sus cachés para ese tamaño (s = px por u; escala = la del lienzo donde se
     dibujará, normalmente el devicePixelRatio), para llamarlo en la pantalla de carga y que el primer fotograma no dé tirones.
     Dibuja muy lejos de un lienzo de 2 × 2 px: solo se llenan las cachés. */
  function preparador(nombre, ops) {
    return function (s, escala) {
      var L = U.lienzo(2, 2), e = escala || Math.min(2, window.devicePixelRatio || 1);
      L.x.setTransform(e, 0, 0, e, 0, 0);
      PREPARANDO = true;
      try { for (var i = 0; i < ops.length; i++) AE.arte[nombre].dibujar(L.x, -1e5, -1e5, s, ops[i]); } finally { PREPARANDO = false; }
    };
  }
  function tiempos(t0, t1, paso) { var r = []; for (var t = t0; t <= t1; t += paso) r.push({ t: t }); return r; }
  function fases(n) { var r = []; for (var i = 0; i < n; i++) r.push({ fase: i / n }); return r; }
  // (para el laboratorio: olvidar todas las cachés y medir el arranque en frío)
  DEV.limpiar = function () { CACHES = {}; ORDEN = []; TENIDOS = {}; };

  AE.arte.anubis = { ancho: 0.15, alto: 0.31, abajo: 0.002, dibujar: dibujarAnubis };
  AE.arte.horus = { ancho: 0.145, alto: 0.32, abajo: 0.002, dibujar: dibujarHorus };
  AE.arte.ra = { ancho: 0.145, alto: 0.3, abajo: 0.002, dibujar: dibujarRa };
  AE.arte.thot = { ancho: 0.15, alto: 0.29, abajo: 0.002, dibujar: dibujarThot };
  AE.arte.osiris = { ancho: 0.08, alto: 0.315, abajo: 0.002, dibujar: dibujarOsiris };
  AE.arte.isis = { ancho: 0.32, alto: 0.24, abajo: 0.002, dibujar: dibujarIsis };
  AE.arte.faraon = { ancho: 0.13, alto: 0.275, abajo: 0.002, dibujar: dibujarFaraon };
  AE.arte.escriba = { ancho: 0.13, alto: 0.21, abajo: 0.002, dibujar: dibujarEscriba };
  AE.arte.shaduf = { ancho: 0.39, alto: 0.28, abajo: 0.08, dibujar: dibujarShaduf };
  AE.arte.porteadores = { ancho: 0.78, alto: 0.22, abajo: 0.002, dibujar: dibujarPorteadores };
  AE.arte.procesion = { ancho: 0.23, alto: 0.086, abajo: 0.002, dibujar: dibujarProcesion };
  // dónde está la figura borrada (Hatshepsut), en u respecto al ancla (dy negativo es hacia arriba)
  AE.arte.procesion.hueco = { dx: 0.004, dy: -0.036, w: 0.03, h: 0.062 };
  AE.arte.carter = { ancho: 0.2, alto: 0.27, abajo: 0.002, dibujar: dibujarCarter };
  AE.arte.champollion = { ancho: 0.23, alto: 0.26, abajo: 0.002, dibujar: dibujarChampollion };
  AE.arte.eratostenes = { ancho: 0.21, alto: 0.255, abajo: 0.003, dibujar: dibujarEratostenes };
  AE.arte.escriba.preparar = preparador('escriba', [{ t: 0 }]);
  AE.arte.shaduf.preparar = preparador('shaduf', tiempos(0, 5000, 100));
  AE.arte.porteadores.preparar = preparador('porteadores', fases(24));
  AE.arte.procesion.preparar = preparador('procesion', [{ revelar: 0 }, { revelar: 0.5 }]);
  AE.arte.carter.preparar = preparador('carter', [{ t: 0 }]);
})();

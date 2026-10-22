/* Aegyptus Incognita · arte · la naturaleza del Nilo
   Las plantas (la palmera datilera, la palmera dum, los papiros, los lotos azules y la acacia), los animales del río
   (el ibis, la garza, el halcón, los gansos de Meidum, los patos, el cocodrilo, el hipopótamo, la tilapia y el escarabajo
   pelotero) y las barcas (la de vela, que va al sur; la de remos, que va al norte; el esquife de papiro y la barca solar
   de Ra), al modo de las referencias 2 y 4 de Pau: vector pulido sin contornos, degradados suaves y la luz arriba a la
   izquierda (contratos en herramientas/encargos).

   Todas las piezas se dibujan en milésimas de u («mu»: 1 u = 1000 mu), con el origen en el ancla (el centro de la base,
   sobre la línea del suelo, que es también la superficie del Nilo) y la y hacia abajo.

   Las piezas (AE.arte.*) y sus opciones (todas opcionales):
   · palmera, palmeraDum: semilla (forma, alto, inclinación), t y viento (0…1) para mecerse, quieta (sin animar).
     palmera.copa(semilla) da dónde está el nudo de la corona.
   · papiros: alto (0,08…0,32 u; 0,24), semilla, t y viento (se mecen), quieta.   · lotos, acacia: semilla.
   · ibis: t (pasea por la orilla, se para y hurga), semilla, dir; quieto: pica (0…1), paso (0…1).
   · ibisVuelo: fase (aleteo, 0…1), dir (mira a la izquierda; 1, a la derecha).
   · garza: t (al acecho; de vez en cuando lanza el pico y a veces saca un pez), semilla, dir; quieta: lance (0…1).
   · halcon: angulo (el de su vuelta: vuela por la tangente) o rumbo (directo), fase (mece alas y cola).
   · gansos: t (vaivén), dir.   · patos: fase, dir (miran a la izquierda).
   · cocodrilo: agua (flota: asoman los ojos, el hocico y la cresta), t (parpadea), semilla, dir.
   · hipopotamo: t (orejas y resoplidos), fayenza (el «William» del Met), agua = false (de pie y entero), resoplido (0…1).
   · pez: k (0…1, el salto), semilla, dir.   · escarabajo: t (empuja la bola, se sube a ella y vuelve), semilla.
   · barcaVela (va a la izquierda, al sur), barcaRemos (a la derecha, al norte; palada con t), esquife (el pescador lanza la
     fisga con t; lance 0…1 en quieto), barcaSolar: t (se balancean), semilla. Las de vela, remos y la solar llevan su
     jeroglífico en .signo (P2 «ir al sur», P1 «ir al norte», P3 «la barca sagrada»).
   Lo que se mueve (op.t en ms) se pinta desde cachés: lienzos aparte, a la resolución del contexto, de lo que no cambia
   (troncos, hojas, cuerpos, cascos); en cada fotograma solo se colocan y giran, y se pinta a mano lo poco que cambia. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, TAU = Math.PI * 2, PI = Math.PI;
  var A = AE.arte = AE.arte || {};
  var M = 1000;
  var mez = U.mezcla, cla = ES.aclarar, osc = ES.oscurecer, rgba = U.rgba;

  /* ------------------------------------------------------------------ los colores (mezclas de la paleta) */
  var C = {
    // las hojas: un verde algo cálido, la luz amarillenta y la sombra azulada
    palma: mez(P.verde, P.oro3, 0.12),
    palmaLuz: mez(P.verde, P.oro1, 0.46),
    palmaSombra: mez(mez(P.verde, P.negro, 0.4), P.oro4, 0.08),
    raquis: mez(P.oro2, P.verde, 0.42),
    // el tronco de la palmera (las bases de las hojas viejas)
    tronco: mez(P.oro3, P.piedra2, 0.5),
    troncoLuz: mez(P.piedra, P.oro1, 0.25),
    troncoSombra: mez(P.oro4, P.negro, 0.3),
    // los dátiles
    datil: mez(P.oro2, P.cornalina, 0.42),
    datilOscuro: mez(P.cornalina, P.oro4, 0.55),
    // la palmera dum: hojas verde glauco, tronco gris pardo, frutos pardos brillantes
    dum: mez(mez(P.verde, P.turquesa, 0.35), P.lino2, 0.22),
    dumLuz: mez(mez(P.verde, P.oro1, 0.3), P.lino, 0.25),
    dumSombra: mez(mez(P.verde, P.negro, 0.45), P.lapis2, 0.2),
    dumTronco: mez(P.piedra2, P.negro2, 0.35),
    dumFruto: mez(P.oro3, P.piel2, 0.5),
    seco: mez(P.arena2, P.oro4, 0.35),
    // el papiro
    papiro: mez(P.verde, P.oro3, 0.08),
    papiroLuz: mez(P.verde, P.oro1, 0.55),
    papiroSombra: mez(P.verde, P.negro, 0.45),
    vaina: mez(mez(P.oro4, P.piel2, 0.4), P.verde, 0.15),
    // el loto azul
    petalo: cla(P.egipcio, 0.5),
    petaloPunta: mez(P.egipcio, P.lapis, 0.55),
    nenufar: mez(P.verde, P.negro, 0.22),
    nenufarLuz: mez(P.verde, P.oro1, 0.3),
    enves: mez(P.rojo, P.lapis2, 0.45),
    // la acacia: verde oliva
    acacia: mez(P.verde, P.arena2, 0.38),
    acaciaLuz: mez(mez(P.verde, P.oro1, 0.45), P.arena, 0.2),
    acaciaSombra: mez(mez(P.verde, P.negro, 0.5), P.lapis2, 0.15),
    corteza: mez(P.oro4, P.negro2, 0.45),
    cortezaLuz: mez(P.piedra2, P.oro4, 0.3),
    // el agua (para lo que queda debajo)
    agua: mez(P.lapis, P.egipcio, 0.45),
    aguaLuz: cla(P.egipcio, 0.45)
  };
  A.colores = A.colores || {};
  A.colores.naturaleza = C;

  /* ------------------------------------------------------------------ utilidades */
  // la escala del contexto (px del lienzo por unidad del contexto): las cachés se pintan a esa resolución
  function escalaCtx(ctx) {
    try { var m = ctx.getTransform(); var k = Math.sqrt(m.a * m.a + m.b * m.b); return k > 0 ? k : 1; } catch (err) { return 1; }
  }
  // punto y tangente unitaria de una cuadrática en t
  function cuad(x0, y0, cx, cy, x1, y1, t) {
    var mt = 1 - t, px = mt * mt * x0 + 2 * mt * t * cx + t * t * x1, py = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    var dx = 2 * mt * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * mt * (cy - y0) + 2 * t * (y1 - cy), d = Math.sqrt(dx * dx + dy * dy) || 1;
    return [px, py, dx / d, dy / d];
  }
  // sigue un camino suave por los puntos (el primero es el punto actual del camino)
  function curvaPor(k, xs, ys) {
    var n = xs.length;
    if (n < 3) { for (var j = 1; j < n; j++) k.lineTo(xs[j], ys[j]); return; }
    for (var i = 1; i < n - 1; i++) k.quadraticCurveTo(xs[i], ys[i], (xs[i] + xs[i + 1]) / 2, (ys[i] + ys[i + 1]) / 2);
    k.lineTo(xs[n - 1], ys[n - 1]);
  }
  // una tira que adelgaza a lo largo de una cuadrática (de ancho w0 a w1), con los extremos redondeados
  function tira(k, x0, y0, cx, cy, x1, y1, w0, w1, n) {
    n = n || 10;
    var ax = [], ay = [], bx = [], by = [], i, q, w;
    for (i = 0; i <= n; i++) {
      q = cuad(x0, y0, cx, cy, x1, y1, i / n); w = (w0 + (w1 - w0) * i / n) / 2;
      ax.push(q[0] + q[3] * w); ay.push(q[1] - q[2] * w); bx.push(q[0] - q[3] * w); by.push(q[1] + q[2] * w);
    }
    var qe = cuad(x0, y0, cx, cy, x1, y1, 1), qs = cuad(x0, y0, cx, cy, x1, y1, 0);
    k.moveTo(ax[0], ay[0]); curvaPor(k, ax, ay);
    k.quadraticCurveTo(qe[0] + qe[2] * w1 * 0.7, qe[1] + qe[3] * w1 * 0.7, bx[n], by[n]);
    bx.reverse(); by.reverse(); curvaPor(k, bx, by);
    k.quadraticCurveTo(qs[0] - qs[2] * w0 * 0.7, qs[1] - qs[3] * w0 * 0.7, ax[0], ay[0]);
    k.closePath();
  }
  // una tira por una lista de puntos [x, y, ancho, …] (para cuellos, patas, colas)
  function tiraPor(k, pts, redonda) {
    var n = pts.length / 3, ax = [], ay = [], bx = [], by = [], i;
    for (i = 0; i < n; i++) {
      var i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1);
      var dx = pts[i1 * 3] - pts[i0 * 3], dy = pts[i1 * 3 + 1] - pts[i0 * 3 + 1], d = Math.sqrt(dx * dx + dy * dy) || 1, w = pts[i * 3 + 2] / 2;
      ax.push(pts[i * 3] + dy / d * w); ay.push(pts[i * 3 + 1] - dx / d * w); bx.push(pts[i * 3] - dy / d * w); by.push(pts[i * 3 + 1] + dx / d * w);
    }
    k.moveTo(ax[0], ay[0]); curvaPor(k, ax, ay);
    var ex = pts[(n - 1) * 3] - pts[(n - 2) * 3], ey = pts[(n - 1) * 3 + 1] - pts[(n - 2) * 3 + 1], ed = Math.sqrt(ex * ex + ey * ey) || 1, we = pts[(n - 1) * 3 + 2] * 0.7;
    if (redonda !== false) k.quadraticCurveTo(pts[(n - 1) * 3] + ex / ed * we, pts[(n - 1) * 3 + 1] + ey / ed * we, bx[n - 1], by[n - 1]);
    else k.lineTo(bx[n - 1], by[n - 1]);
    bx.reverse(); by.reverse(); curvaPor(k, bx, by);
    var sx = pts[3] - pts[0], sy = pts[4] - pts[1], sd = Math.sqrt(sx * sx + sy * sy) || 1, ws = pts[2] * 0.7;
    if (redonda !== false) k.quadraticCurveTo(pts[0] - sx / sd * ws, pts[1] - sy / sd * ws, ax[0], ay[0]);
    k.closePath();
  }
  // una hoja estrecha o un pétalo, de (x0, y0) a la punta (x1, y1), de ancho w; b la arquea hacia el lado izquierdo
  // del sentido de avance (en mu)
  function hoja(k, x0, y0, x1, y1, w, b, base) {
    var dx = x1 - x0, dy = y1 - y0, d = Math.sqrt(dx * dx + dy * dy) || 1, nx = dy / d, ny = -dx / d;
    var mx = x0 + dx * 0.5 + nx * (b || 0), my = y0 + dy * 0.5 + ny * (b || 0), h = w / 2, hb = base == null ? h : base / 2;
    k.moveTo(x0 + nx * hb, y0 + ny * hb);
    k.quadraticCurveTo(mx + nx * h * 1.15, my + ny * h * 1.15, x1, y1);
    k.quadraticCurveTo(mx - nx * h * 1.15, my - ny * h * 1.15, x0 - nx * hb, y0 - ny * hb);
    k.closePath();
  }
  function elipse(k, cx, cy, rx, ry, rot) { k.moveTo(cx + Math.cos(rot || 0) * rx, cy + Math.sin(rot || 0) * rx); k.ellipse(cx, cy, rx, ry, rot || 0, 0, TAU); }
  function relleno(k, fn, estilo) { k.beginPath(); fn(k); k.fillStyle = estilo; k.fill(); }
  // un brillo o una sombra recortados a una forma (como ES.brillo y ES.sombra, pero en el sistema local)
  function luz(k, fn, x0, y0, x1, y1, a, col) { ES.brillo(k, fn, x0, y0, x1, y1, a, col); }
  function sombra(k, fn, x0, y0, x1, y1, a, col) { ES.sombra(k, fn, x0, y0, x1, y1, a, col); }

  /* ---------- la caché de piezas ----------
     Un lienzo aparte por pieza, tamaño y resolución. caja = [x0, y0, x1, y1] en mu respecto al ancla. Se olvidan las más
     viejas cuando hay demasiadas (por número o por píxeles). */
  var CACHE = {}, ORDEN = [], PIXELES = 0, MAX_PIXELES = 28e6;
  function enCache(clave, s, k, caja, pintar) {
    var id = clave + '|' + s.toFixed(2) + '|' + k.toFixed(3), c = CACHE[id];
    if (c) return c;
    var e = s / M * k, w = Math.max(1, Math.ceil((caja[2] - caja[0]) * e) + 4), h = Math.max(1, Math.ceil((caja[3] - caja[1]) * e) + 4);
    var L = U.lienzo(w, h);
    L.x.setTransform(e, 0, 0, e, 2 - caja[0] * e, 2 - caja[1] * e);
    pintar(L.x);
    c = CACHE[id] = { c: L.c, x0: caja[0] - 2 / e, y0: caja[1] - 2 / e, w: w / e, h: h / e, px: w * h, e: e };
    ORDEN.push(id); PIXELES += w * h;
    while ((PIXELES > MAX_PIXELES || ORDEN.length > 220) && ORDEN.length > 1) { var v = ORDEN.shift(); if (CACHE[v]) { PIXELES -= CACHE[v].px; delete CACHE[v]; } }
    return c;
  }
  // la versión «bajo el agua» de una caché: la misma, azulada (para lo que queda por debajo de la superficie)
  function enCacheAgua(c, clave, s, k, yAgua) {
    var id = clave + '|agua|' + (yAgua == null ? '' : yAgua) + '|' + s.toFixed(2) + '|' + k.toFixed(3), d = CACHE[id];
    if (d) return d;
    var L = U.lienzo(c.c.width, c.c.height);
    L.x.drawImage(c.c, 0, 0);
    L.x.globalCompositeOperation = 'source-atop';
    var g = L.x.createLinearGradient(0, 0, 0, c.c.height);
    g.addColorStop(0, rgba(C.agua, 0.55)); g.addColorStop(1, rgba(osc(C.agua, 0.2), 0.75));
    L.x.fillStyle = g; L.x.fillRect(0, 0, c.c.width, c.c.height);
    if (yAgua != null) {
      // (en este lienzo nuestro) lo más hondo se pierde en el agua: la opacidad baja con la profundidad
      var y0 = (yAgua - c.y0) * c.e, m = L.x.createLinearGradient(0, y0, 0, y0 + 70 * c.e);
      m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(0.3, 'rgba(0,0,0,0.5)'); m.addColorStop(1, 'rgba(0,0,0,0.08)');
      L.x.globalCompositeOperation = 'destination-in'; L.x.fillStyle = m; L.x.fillRect(0, 0, c.c.width, c.c.height);
    }
    d = CACHE[id] = { c: L.c, x0: c.x0, y0: c.y0, w: c.w, h: c.h, px: c.px, e: c.e };
    ORDEN.push(id); PIXELES += c.px;
    return d;
  }
  A.olvidarNaturaleza = function () { CACHE = {}; ORDEN = []; PIXELES = 0; };
  function poner(ctx, c, dx, dy) { ctx.drawImage(c.c, c.x0 + (dx || 0), c.y0 + (dy || 0), c.w, c.h); }
  // sin giro: casa los píxeles de la caché con los del contexto (para lo quieto: nítido, sin remuestrear)
  function ponerNitido(ctx, c) {
    var m = ctx.getTransform(), dx = m.a * c.x0 + m.e, dy = m.d * c.y0 + m.f;
    ctx.drawImage(c.c, c.x0 + (Math.round(dx) - dx) / m.a, c.y0 + (Math.round(dy) - dy) / m.d, c.w, c.h);
  }
  // una caché que flota: por encima de la superficie (y < 0) tal cual y por debajo, azulada y medio transparente.
  // (dy, giro): el balanceo; (px, py): el punto sobre el que gira
  function ponerFlotando(ctx, c, cAgua, dy, giro, px, py, nitido) {
    var x0 = c.x0 - 60, x1 = c.x0 + c.w + 60, y0 = c.y0 - 60, y1 = c.y0 + c.h + 60;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, -y0); ctx.clip();
    ctx.save(); ctx.translate(px, py + dy); ctx.rotate(giro); ctx.translate(-px, -py);
    if (nitido && !giro && !dy) ponerNitido(ctx, c); else poner(ctx, c);
    ctx.restore(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, y1); ctx.clip(); ctx.globalAlpha *= 0.62;
    ctx.save(); ctx.translate(px, py + dy); ctx.rotate(giro); ctx.translate(-px, -py);
    if (nitido && !giro && !dy) ponerNitido(ctx, cAgua); else poner(ctx, cAgua);
    ctx.restore(); ctx.restore();
  }
  // dibuja algo dos veces: encima del agua tal cual y debajo velado (para lo que se pinta a mano en cada fotograma)
  function enDosAguas(ctx, fn, ancho, a) {
    ctx.save(); ctx.beginPath(); ctx.rect(-ancho, -ancho * 2, ancho * 2, ancho * 2); ctx.clip(); fn(ctx, false); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(-ancho, 0, ancho * 2, ancho); ctx.clip(); ctx.globalAlpha *= (a == null ? 0.45 : a); fn(ctx, true); ctx.restore();
  }
  // las ondas de la superficie donde algo corta el agua: unas rayas claras, cortas, a los dos lados (x0…x1, en mu)
  function ondas(k, x0, x1, t, fuerza) {
    var f = fuerza == null ? 1 : fuerza, fase = (t || 0) * 0.002;
    k.save(); k.lineCap = 'round';
    for (var i = 0; i < 3; i++) {
      var abre = 4 + i * 7 + Math.sin(fase + i * 1.7) * 1.5, a = (0.55 - i * 0.15) * f, y = 1.2 + i * 2.2;
      k.strokeStyle = rgba(C.aguaLuz, a); k.lineWidth = 1.6 - i * 0.3;
      k.beginPath(); k.moveTo(x0 - abre - 8 + i * 2, y); k.lineTo(x0 - abre, y); k.moveTo(x1 + abre, y); k.lineTo(x1 + abre + 8 - i * 2, y); k.stroke();
    }
    // la línea de flotación, clara, a lo largo de lo que corta el agua
    k.strokeStyle = rgba(C.aguaLuz, 0.7 * f); k.lineWidth = 1.4;
    k.beginPath(); k.moveTo(x0, 0.6); k.lineTo(x1, 0.6); k.stroke();
    k.restore();
  }
  // mide de verdad lo que cuesta (Safari pinta en otro proceso: hay que esperar a que acabe)
  A.medirNaturaleza = function (fn) { U.vaciar(); var t0 = performance.now(); fn(); U.vaciar(); return performance.now() - t0; };

  // una pieza: el contexto pasa a mu con el origen en el ancla; k = la escala del contexto que llega
  function pieza(def) {
    var dib = def.dibujar;
    def.dibujar = function (ctx, x, y, s, op) {
      op = op || {};
      var k = escalaCtx(ctx);
      ctx.save(); ctx.translate(x, y); ctx.scale(s / M, s / M);
      try { dib(ctx, s, k, op); } finally { ctx.restore(); }
    };
    return def;
  }

  /* ================================================================== LAS PLANTAS */

  // la caja ajustada de unos puntos vistos girados -fi (para que las cachés de las hojas largas no tengan aire de sobra)
  function cajaGirada(pts, fi, margen) {
    var co = Math.cos(-fi), si = Math.sin(-fi), x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (var i = 0; i < pts.length; i += 2) {
      var rx = pts[i] * co - pts[i + 1] * si, ry = pts[i] * si + pts[i + 1] * co;
      if (rx < x0) x0 = rx; if (rx > x1) x1 = rx; if (ry < y0) y0 = ry; if (ry > y1) y1 = ry;
    }
    return [x0 - margen, y0 - margen, x1 + margen, y1 + margen];
  }
  var GEO = {};

  /* ---------- la palmera datilera ----------
     Tronco de escamas (las bases de las frondas cortadas, en filas alternas), corona de frondas pinnadas que se arquean y
     caen, con los foliolos en V hacia la punta, y racimos de dátiles naranjas colgando bajo la corona.
     Animada: el tronco, el nudo de la corona y los racimos van en caché, y cada fronda es una pieza que gira sobre su base
     con el viento (las frondas son unas pocas formas que comparten todas las palmeras). */
  var FRONDAS = [
    { L: 176, arco: 0.8, caida: 0.6, n: 20 },
    { L: 166, arco: 1.0, caida: 0.42, n: 19 },
    { L: 158, arco: 0.65, caida: 0.85, n: 19 },
    { L: 150, arco: 0.85, caida: 1.05, n: 18 },
    { L: 128, arco: 1.25, caida: 0.14, n: 16 },    // las jóvenes de arriba, tiesas
    { L: 140, arco: 0.4, caida: 1.45, n: 17 }      // las viejas, que cuelgan
  ];
  // la geometría de una fronda que apunta hacia +x desde su base en el origen: el raquis (una cuadrática) y los foliolos
  // [x0, y0, x1, y1, ancho, curva] de arriba (sup) y de abajo (inf)
  function foliolos(f) {
    if (f.fol) return f.fol;
    var L = f.L, cx = L * 0.48, cy = -L * 0.1 * f.arco, x1 = L * 0.96, y1 = L * 0.34 * f.caida, n = f.n, sup = [], inf = [], pts = [0, 0, x1, y1], i;
    for (i = 0; i < n; i++) {
      var t = 0.1 + 0.88 * i / (n - 1), q = cuad(0, 0, cx, cy, x1, y1, t);
      var env = Math.pow(Math.sin(PI * (0.05 + 0.95 * t)), 0.6), len = L * 0.235 * env + 4, w = 3.6 - 1.5 * t;
      var au = -(0.66 - 0.2 * t) + ((i % 2) ? 0.06 : 0), al = 0.74 - 0.18 * t + ((i % 2) ? 0 : 0.07);
      var ux = q[2] * Math.cos(au) - q[3] * Math.sin(au), uy = q[2] * Math.sin(au) + q[3] * Math.cos(au);
      var lx = q[2] * Math.cos(al) - q[3] * Math.sin(al), ly = q[2] * Math.sin(al) + q[3] * Math.cos(al);
      var a = [q[0], q[1], q[0] + ux * len, q[1] + uy * len + len * 0.14, w, -len * 0.06];
      var b = [q[0], q[1], q[0] + lx * len * 1.05, q[1] + ly * len * 1.05 + len * 0.22, w * 0.95, -len * 0.05];
      sup.push(a); inf.push(b); pts.push(a[2], a[3], b[2], b[3], q[0], q[1]);
    }
    f.fi = Math.atan2(y1, x1);
    f.caja = cajaGirada(pts, f.fi, 7);
    f.fol = { sup: sup, inf: inf, cx: cx, cy: cy, x1: x1, y1: y1 };
    return f.fol;
  }
  // tono 0: de delante, a la luz; 1: de atrás, en sombra
  function pintarFronda(k, f, tono) {
    var g = foliolos(f), L = f.L, i, h;
    var luzC = tono ? mez(C.palmaLuz, C.palma, 0.62) : C.palmaLuz, medio = tono ? mez(C.palma, C.palmaSombra, 0.42) : C.palma;
    var somb = tono ? osc(C.palmaSombra, 0.1) : C.palmaSombra;
    // los foliolos de abajo, en sombra
    k.beginPath();
    for (i = 0; i < g.inf.length; i++) { h = g.inf[i]; hoja(k, h[0], h[1], h[2], h[3], h[4], h[5]); }
    k.fillStyle = ES.lin(k, 0, 0, L * 0.6, L * 0.55, [[0, mez(medio, somb, 0.5)], [0.55, somb], [1, osc(somb, 0.12)]]);
    k.fill();
    // el raquis (el nervio central), claro y amarillento, con su filo de luz
    k.beginPath(); tira(k, -2, 0, g.cx, g.cy, g.x1, g.y1, 6.2, 1, 14);
    k.fillStyle = ES.lin(k, 0, -6, 0, 6, [[0, tono ? mez(C.raquis, medio, 0.3) : cla(C.raquis, 0.3)], [0.5, tono ? mez(C.raquis, somb, 0.35) : C.raquis], [1, mez(C.raquis, somb, 0.45)]]); k.fill();
    // los de arriba, a la luz
    k.beginPath();
    for (i = 0; i < g.sup.length; i++) { h = g.sup[i]; hoja(k, h[0], h[1], h[2], h[3], h[4], h[5]); }
    k.fillStyle = ES.lin(k, L * 0.05, -L * 0.3, L * 0.85, L * 0.3, [[0, cla(luzC, 0.14)], [0.4, luzC], [1, mez(medio, somb, 0.15)]]);
    k.fill();
  }
  function geomPalmera(sem) {
    var id = 'pal' + sem; if (GEO[id]) return GEO[id];
    var r = U.azar(sem * 7919 + 101), g = { sem: sem };
    g.H = 278 + r() * 56;
    var incl = (r() - 0.5) * 0.24;
    g.tx = Math.sin(incl) * g.H * 0.9; g.ty = -g.H;
    g.cx = Math.sin(incl) * g.H * 0.6 + (r() - 0.5) * 16; g.cy = -g.H * 0.5;
    g.w0 = 24 + r() * 3; g.w1 = 16 + r() * 2;
    // la corona: frondas de atrás (más oscuras) y de delante; ang en radianes (0 = hacia fuera, negativo = arriba)
    var atras = [-0.9, -0.42, 0.04], delante = [-1.12, -0.66, -0.22, 0.24, 0.66];
    g.frondas = [{ v: 4, esc: 0.95, ang: -1.52 + (r() - 0.5) * 0.1, lado: 1, capa: 0, fase: r() * TAU, fase2: r() * TAU }];
    function pon(lista, capa) {
      for (var i = 0; i < lista.length; i++) for (var lado = -1; lado <= 1; lado += 2) {
        var a = lista[i] + (r() - 0.5) * 0.14, v = a < -0.95 ? 4 : a > 0.5 ? (r() < 0.5 ? 5 : 3) : Math.floor(r() * 3);
        g.frondas.push({ v: v, esc: 0.9 + r() * 0.18, ang: a, lado: lado, capa: capa, fase: r() * TAU, fase2: r() * TAU });
      }
    }
    pon(atras, 0); pon(delante, 1);
    // los racimos de dátiles, colgando bajo la corona
    g.racimos = [];
    var nr = 2 + (r() < 0.5 ? 1 : 0);
    for (var j = 0; j < nr; j++) {
      var lado = j === 2 ? (r() < 0.5 ? -1 : 1) : (j ? 1 : -1), rc = { lado: lado, ax: g.tx + lado * (4 + r() * 4), ay: g.ty + 7 };
      rc.ex = rc.ax + lado * (17 + r() * 9); rc.ey = rc.ay + 27 + r() * 9;
      rc.d = [];
      var nd = 26 + Math.floor(r() * 8);
      for (var m = 0; m < nd; m++) {
        var u = r(), an = (r() - 0.5) * 2.2, rad = 4 + u * 16;
        var px = rc.ex + Math.sin(an) * rad * 0.75 + lado * 2, py = rc.ey + 4 + Math.cos(an) * rad;
        rc.d.push([px, py, 3.6 + r() * 0.8, (r() - 0.5) * 0.5 + an * 0.2, (Math.cos(an) > 0.2 && r() < 0.7) ? 1 : 0]);
      }
      rc.d.sort(function (a, b) { return a[4] - b[4] || a[1] - b[1]; });
      g.racimos.push(rc);
    }
    g.cajaTronco = [Math.min(-g.w0 * 1.2, g.tx - 30), g.ty - 16, Math.max(g.w0 * 1.2, g.tx + 30), 4];
    GEO[id] = g;
    return g;
  }
  function contornoTronco(k, g) {
    var n = 16, ax = [], ay = [], bx = [], by = [], i;
    for (i = 0; i <= n; i++) {
      var t = i / n, q = cuad(0, 0, g.cx, g.cy, g.tx, g.ty, t);
      var w = (g.w0 + (g.w1 - g.w0) * Math.pow(t, 0.8)) / 2 + g.w0 * 0.42 * Math.pow(1 - t, 7);
      ax.push(q[0] + q[3] * w); ay.push(q[1] - q[2] * w); bx.push(q[0] - q[3] * w); by.push(q[1] + q[2] * w);
    }
    k.moveTo(ax[0], 1.5); k.lineTo(ax[0], ay[0]); curvaPor(k, ax, ay);
    k.quadraticCurveTo(g.tx, g.ty - g.w1 * 0.35, bx[n], by[n]);
    bx.reverse(); by.reverse(); curvaPor(k, bx, by); k.lineTo(bx[n], 1.5); k.closePath();
  }
  function pintarTroncoPalmera(k, g) {
    var forma = function (c) { contornoTronco(c, g); }, i, j, xm = g.cx * 0.3;
    var cil = [[0, cla(C.tronco, 0.2)], [0.32, C.tronco], [0.72, mez(C.tronco, C.troncoSombra, 0.45)], [1, C.troncoSombra]];
    relleno(k, forma, ES.lin(k, xm - g.w0 * 0.6, 0, xm + g.w0 * 0.6, 0, cil));
    // las escamas: filas de medias lunas alternas, con su sombra debajo y su luz encima, recortadas al tronco
    k.save(); k.beginPath(); forma(k); k.clip();
    var filas = Math.floor(g.H / 10.5), sombras = new Path2D(), luces = new Path2D();
    for (j = 1; j < filas; j++) {
      var t = j / filas, q = cuad(0, 0, g.cx, g.cy, g.tx, g.ty, t), w = (g.w0 + (g.w1 - g.w0) * Math.pow(t, 0.8)) / 2;
      var rx = -q[3], ry = q[2], ux = q[2], uy = q[3];    // (rx, ry) hacia la derecha; (ux, uy) hacia arriba del tronco
      var ws = w * 0.56, off = (j % 2) ? 0.5 : 0;
      for (i = -2; i <= 2; i++) {
        var u = (i + off) * ws * 1.02; if (Math.abs(u) > w * 1.25) continue;
        var cx = q[0] + rx * u, cy = q[1] + ry * u, hh = 5.4;
        sombras.moveTo(cx - rx * ws * 0.55, cy - ry * ws * 0.55);
        sombras.quadraticCurveTo(cx - ux * hh * 1.9, cy - uy * hh * 1.9, cx + rx * ws * 0.55, cy + ry * ws * 0.55);
        sombras.quadraticCurveTo(cx - ux * hh * 0.7, cy - uy * hh * 0.7, cx - rx * ws * 0.55, cy - ry * ws * 0.55);
        var lx = cx + ux * 1.8, ly = cy + uy * 1.8;
        luces.moveTo(lx - rx * ws * 0.5, ly - ry * ws * 0.5);
        luces.quadraticCurveTo(lx - ux * hh * 1.5, ly - uy * hh * 1.5, lx + rx * ws * 0.5, ly + ry * ws * 0.5);
        luces.quadraticCurveTo(lx - ux * hh * 1.05, ly - uy * hh * 1.05, lx - rx * ws * 0.5, ly - ry * ws * 0.5);
      }
    }
    k.fillStyle = rgba(C.troncoSombra, 0.5); k.fill(sombras);
    k.fillStyle = rgba(C.troncoLuz, 0.42); k.fill(luces);
    // el volumen otra vez por encima (el lado derecho sigue en sombra y el izquierdo recibe un brillo)
    k.fillStyle = ES.lin(k, xm - g.w0 * 0.6, 0, xm + g.w0 * 0.6, 0, [[0, P.blanco, 0.14], [0.3, P.blanco, 0], [0.6, C.troncoSombra, 0], [1, C.troncoSombra, 0.5]]);
    k.fillRect(-200, g.ty - 10, 400, -g.ty + 20);
    k.restore();
    // las raíces: unos dedos cortos al pie
    k.beginPath();
    for (i = -3; i <= 3; i++) { var bx = i * g.w0 * 0.2; hoja(k, bx * 0.6, -7, bx * 1.25 + (i < 0 ? -3 : 3), 1.5, 4.2, 0, 5); }
    k.fillStyle = ES.lin(k, -g.w0, 0, g.w0, 0, [[0, cla(C.tronco, 0.1)], [1, C.troncoSombra]]); k.fill();
  }
  // el nudo de la corona: las bases fibrosas de las frondas
  function pintarCorona(k, g) {
    var x = g.tx, y = g.ty;
    k.beginPath();
    for (var i = 0; i < 7; i++) { var a = -PI * 0.5 + (i - 3) * 0.42; hoja(k, x, y + 5, x + Math.cos(a) * 17, y + 5 + Math.sin(a) * 13, 7, 0, 9); }
    k.fillStyle = ES.lin(k, x - 16, y - 10, x + 16, y + 10, [[0, mez(C.tronco, C.raquis, 0.45)], [1, C.troncoSombra]]); k.fill();
    relleno(k, function (c) { elipse(c, x, y + 4, 11, 7.5); }, ES.lin(k, x - 10, y, x + 10, y + 8, [[0, mez(C.tronco, C.troncoSombra, 0.25)], [1, osc(C.troncoSombra, 0.2)]]));
  }
  function pintarRacimo(k, rc) {
    // el tallo, naranja dorado
    k.beginPath(); tira(k, rc.ax, rc.ay, rc.ax + rc.lado * 3, rc.ey - 6, rc.ex, rc.ey + 1, 3.4, 2.2, 8);
    k.fillStyle = ES.lin(k, rc.ax, rc.ay, rc.ex, rc.ey, [[0, P.oro3], [1, P.oro2]]); k.fill();
    // los dátiles: los de atrás, más oscuros; los de delante, con un degradado común y su brillo
    var atras = new Path2D(), delante = new Path2D(), luces = new Path2D(), i, d;
    for (i = 0; i < rc.d.length; i++) {
      d = rc.d[i];
      var p = d[4] ? delante : atras; p.moveTo(d[0] + Math.cos(d[3]) * d[2] * 0.82, d[1] + Math.sin(d[3]) * d[2] * 0.82); p.ellipse(d[0], d[1], d[2] * 0.82, d[2] * 1.18, d[3], 0, TAU);
      if (d[4]) { luces.moveTo(d[0] - d[2] * 0.3 + d[2] * 0.25, d[1] - d[2] * 0.5); luces.ellipse(d[0] - d[2] * 0.3, d[1] - d[2] * 0.5, d[2] * 0.25, d[2] * 0.4, -0.4, 0, TAU); }
    }
    k.fillStyle = ES.lin(k, rc.ex - 14, rc.ey - 4, rc.ex + 14, rc.ey + 26, [[0, mez(C.datil, C.datilOscuro, 0.5)], [1, osc(C.datilOscuro, 0.3)]]); k.fill(atras);
    k.fillStyle = ES.rad(k, rc.ex, rc.ey + 8, 2, 22, [[0, cla(C.datil, 0.18)], [0.6, C.datil], [1, mez(C.datil, C.datilOscuro, 0.6)]], rc.ex - rc.lado * 6, rc.ey + 2); k.fill(delante);
    k.fillStyle = rgba([255, 240, 205], 0.55); k.fill(luces);
  }
  function frondaEn(k, g, f, giro, cacheF) {
    var fr = FRONDAS[f.v];
    k.save(); k.translate(g.tx, g.ty); k.scale(f.lado * f.esc, f.esc); k.rotate(f.ang + giro);
    if (cacheF) { k.rotate(fr.fi); poner(k, cacheF); } else pintarFronda(k, fr, f.capa ? 0 : 1);
    k.restore();
  }
  function cacheFronda(s, k, v, tono) {
    var fr = FRONDAS[v]; foliolos(fr);
    return enCache('palmera-fronda|' + v + '|' + tono, s, k, fr.caja, function (c) { c.rotate(-fr.fi); pintarFronda(c, fr, tono); });
  }
  A.palmera = pieza({
    ancho: 0.44, alto: 0.46, abajo: 0.008,
    dibujar: function (ctx, s, k, op) {
      var g = geomPalmera(op.semilla || 1), anim = op.t != null && !op.quieta, i, f;
      var t = op.t || 0, v = op.viento == null ? 0.25 : U.clamp(op.viento, 0, 1);
      // el viento del norte empuja las frondas hacia la izquierda (el sur); cada una con su compás
      var w = 0.0016 + v * 0.0011, amp = 0.035 + v * 0.1, sesgo = -v * 0.07;
      function giro(f) {
        if (!anim) return 0;
        var o = Math.sin(t * w + f.fase) * 0.65 + Math.sin(t * w * 2.3 + f.fase2) * 0.35;
        return f.lado * (sesgo + amp * o) * (f.v === 5 ? 1.35 : f.v === 4 ? 0.55 : 1);
      }
      if (anim) poner(ctx, enCache('palmera-tronco|' + g.sem, s, k, g.cajaTronco, function (c) { pintarTroncoPalmera(c, g); }));
      else pintarTroncoPalmera(ctx, g);
      for (i = 0; i < g.frondas.length; i++) { f = g.frondas[i]; if (!f.capa) frondaEn(ctx, g, f, giro(f), anim ? cacheFronda(s, k, f.v, 1) : null); }
      if (anim) poner(ctx, enCache('palmera-corona|' + g.sem, s, k, [g.tx - 22, g.ty - 16, g.tx + 22, g.ty + 16], function (c) { pintarCorona(c, g); }));
      else pintarCorona(ctx, g);
      for (i = 0; i < g.racimos.length; i++) {
        var rc = g.racimos[i];
        if (!anim) { pintarRacimo(ctx, rc); continue; }
        var sw = Math.sin(t * w * 1.4 + i * 2) * (0.03 + v * 0.06) - v * 0.04;
        var cr = enCache('palmera-racimo|' + g.sem + '|' + i, s, k, [Math.min(rc.ax, rc.ex) - 22, rc.ay - 6, Math.max(rc.ax, rc.ex) + 22, rc.ey + 30], (function (rc) { return function (c) { pintarRacimo(c, rc); }; })(rc));
        ctx.save(); ctx.translate(rc.ax, rc.ay); ctx.rotate(sw); ctx.translate(-rc.ax, -rc.ay); poner(ctx, cr); ctx.restore();
      }
      for (i = 0; i < g.frondas.length; i++) { f = g.frondas[i]; if (f.capa) frondaEn(ctx, g, f, giro(f), anim ? cacheFronda(s, k, f.v, 0) : null); }
    }
  });
  // dónde queda la copa (el nudo de la corona) respecto al ancla, en u (por si algo tiene que posarse en ella)
  A.palmera.copa = function (sem) { var g = geomPalmera(sem || 1); return { dx: g.tx / M, dy: g.ty / M }; };

  /* ---------- la palmera dum (Hyphaene thebaica) ----------
     La palmera del Alto Egipto que se ramifica en horquilla: un tronco gris pardo con anillos que se parte en dos (a veces
     una rama vuelve a partirse), y en cada rama una corona de hojas en abanico, plegadas, de verde glauco, con alguna hoja
     seca colgando y un racimo de frutos pardos y brillantes (el «pan de jengibre» de los egipcios). */
  var ABANICOS = [
    { Lp: 40, R: 60, n: 17, abre: 1.32, q: 0.84 },
    { Lp: 34, R: 55, n: 16, abre: 1.18, q: 0.7 },
    { Lp: 30, R: 52, n: 15, abre: 1.45, q: 0.94 }
  ];
  // el contorno de un abanico (peciolo hacia +x; el centro del abanico, la hástula, en (Lp, 0)): los segmentos, con
  // las puntas que caen, y las escotaduras entre ellos
  function geomAbanico(f) {
    if (f.g) return f.g;
    var n = f.n, hx = f.Lp, R = f.R, puntas = [], muescas = [], pts = [0, 0], i;
    for (i = 0; i < n; i++) {
      var a = -f.abre + 2 * f.abre * i / (n - 1), lat = Math.abs(Math.sin(a)), rr = R * (0.95 + 0.05 * Math.cos(i * 2.3));
      var cae = R * (0.06 + 0.2 * lat) * (a > 0 ? 1.3 : 0.75);
      puntas.push([hx + Math.cos(a) * rr, Math.sin(a) * rr * f.q + cae]);
      if (i < n - 1) {
        var am = a + f.abre / (n - 1), rm = R * 0.64;
        muescas.push([hx + Math.cos(am) * rm, Math.sin(am) * rm * f.q + cae * 0.45]);
      }
    }
    puntas.forEach(function (p) { pts.push(p[0], p[1]); });
    f.g = { puntas: puntas, muescas: muescas, hx: hx };
    f.fi = Math.atan2(puntas[(n - 1) >> 1][1], puntas[(n - 1) >> 1][0]);
    f.caja = cajaGirada(pts, f.fi, 6);
    return f.g;
  }
  function pintarAbanico(k, f, tono, seco) {
    var g = geomAbanico(f), hx = g.hx, R = f.R, i, p, P0 = g.puntas, Mu = g.muescas;
    var base = seco ? C.seco : tono ? mez(C.dum, C.dumSombra, 0.45) : C.dum;
    var luzC = seco ? cla(C.seco, 0.22) : tono ? mez(C.dumLuz, C.dum, 0.6) : C.dumLuz, somb = seco ? osc(C.seco, 0.35) : C.dumSombra;
    // el peciolo, con sus espinas
    k.beginPath(); tira(k, 0, 0, hx * 0.5, -2.5, hx + 2, 0, 4.4, 3, 8);
    for (i = 1; i < 5; i++) { var px = hx * i / 5.2; k.moveTo(px, 1.6); k.lineTo(px + 2.4, 3.6); k.lineTo(px + 2.6, 1.4); }
    k.fillStyle = ES.lin(k, 0, -3, 0, 4, [[0, cla(base, 0.18)], [1, somb]]); k.fill();
    // la hoja: de la hástula por el borde del primer segmento, punta, escotadura, punta… y de vuelta
    var forma = function (c) {
      c.moveTo(hx, 0); c.lineTo(P0[0][0], P0[0][1]);
      for (var j = 1; j < P0.length; j++) {
        var m = Mu[j - 1], a = P0[j - 1], b = P0[j];
        c.quadraticCurveTo((a[0] + m[0]) / 2 + (a[0] - hx) * 0.05, (a[1] + m[1]) / 2, m[0], m[1]);
        c.quadraticCurveTo((b[0] + m[0]) / 2 + (b[0] - hx) * 0.05, (b[1] + m[1]) / 2, b[0], b[1]);
      }
      c.closePath();
    };
    relleno(k, forma, ES.rad(k, hx - R * 0.15, -R * 0.2, R * 0.08, R * 1.1, [[0, cla(luzC, 0.1)], [0.4, luzC], [0.78, base], [1, mez(base, somb, 0.55)]]));
    // los pliegues: crestas claras hacia las puntas y valles oscuros hacia las escotaduras
    k.beginPath();
    for (i = 0; i < Mu.length; i++) { p = Mu[i]; k.moveTo(hx, 0); k.lineTo(hx + (p[0] - hx) * 0.98, (p[1]) * 0.98); }
    k.lineCap = 'butt'; k.strokeStyle = rgba(somb, seco ? 0.4 : 0.42); k.lineWidth = 1.2; k.stroke();
    k.beginPath();
    for (i = 0; i < P0.length; i++) { p = P0[i]; k.moveTo(hx + (p[0] - hx) * 0.12, p[1] * 0.12); k.lineTo(hx + (p[0] - hx) * 0.9, p[1] * 0.9); }
    k.strokeStyle = rgba(cla(luzC, 0.35), seco ? 0.25 : 0.45); k.lineWidth = 0.9; k.stroke();
  }
  function geomDum(sem) {
    var id = 'dum' + sem; if (GEO[id]) return GEO[id];
    var r = U.azar(sem * 5381 + 33), g = { sem: sem, ramas: [] };
    g.h1 = 150 + r() * 34; g.fx = (r() - 0.5) * 14; g.fy = -g.h1;
    g.w0 = 23; g.w1 = 16;
    var dosVeces = r() < 0.45;
    var aIz = -0.4 - r() * 0.12, aDe = 0.34 + r() * 0.14, lIz = 126 + r() * 28, lDe = 118 + r() * 32;
    g.ramas.push({ x0: g.fx, y0: g.fy, x1: g.fx + Math.sin(aIz) * lIz, y1: g.fy - Math.cos(aIz) * lIz, w0: 15, w1: 12 });
    g.ramas.push({ x0: g.fx, y0: g.fy, x1: g.fx + Math.sin(aDe) * lDe, y1: g.fy - Math.cos(aDe) * lDe, w0: 15, w1: 12 });
    if (dosVeces) {   // la de la derecha se vuelve a partir
      var R0 = g.ramas[1], mx = R0.x0 + (R0.x1 - R0.x0) * 0.55, my = R0.y0 + (R0.y1 - R0.y0) * 0.55;
      R0.x1 = mx; R0.y1 = my; R0.corta = true;
      g.ramas.push({ x0: mx, y0: my, x1: mx - 16 - r() * 10, y1: my - 68 - r() * 12, w0: 11.5, w1: 10 });
      g.ramas.push({ x0: mx, y0: my, x1: mx + 30 + r() * 12, y1: my - 58 - r() * 12, w0: 11.5, w1: 10 });
    }
    g.coronas = [];
    for (var i = 0; i < g.ramas.length; i++) {
      var rm = g.ramas[i]; if (rm.corta) continue;
      var co = { x: rm.x1, y: rm.y1, hojas: [], frutos: [], i: g.coronas.length };
      var angs = dosVeces ? [-1.2, -0.58, 0.05] : [-1.25, -0.72, -0.2, 0.32];
      co.hojas.push({ v: 1, ang: -1.57 + (r() - 0.5) * 0.15, lado: 1, esc: 0.85, capa: 0, fase: r() * TAU });
      for (var j = 0; j < angs.length; j++) for (var lado = -1; lado <= 1; lado += 2) {
        co.hojas.push({ v: Math.floor(r() * 3), ang: angs[j] + (r() - 0.5) * 0.16, lado: lado, esc: 0.78 + r() * 0.2, capa: (j + (lado > 0 ? 1 : 0)) % 2, fase: r() * TAU });
      }
      // la hoja seca que cuelga
      co.hojas.unshift({ v: 1, ang: 1.25, lado: r() < 0.5 ? -1 : 1, esc: 0.72, capa: 0, fase: r() * TAU, seca: true });
      var nf = 6 + Math.floor(r() * 3), lf = -co.hojas[0].lado;
      for (var m = 0; m < nf; m++) co.frutos.push([co.x + lf * (5 + r() * 12), co.y + 13 + r() * 14, 4.4 + r() * 0.8, (r() - 0.5) * 0.6, r() < 0.55 ? 1 : 0]);
      co.frutos.sort(function (a, b) { return a[4] - b[4]; });
      g.coronas.push(co);
    }
    var xs = [0, g.fx], ys = [0, g.fy];
    g.ramas.forEach(function (b) { xs.push(b.x1); ys.push(b.y1); });
    g.cajaTronco = [Math.min.apply(null, xs) - 30, Math.min.apply(null, ys) - 16, Math.max.apply(null, xs) + 30, 4];
    GEO[id] = g;
    return g;
  }
  function pintarTroncoDum(k, g) {
    var i, rm, todo = function (c) {
      tira(c, 0, -14, g.fx * 0.5, g.fy * 0.5, g.fx, g.fy - 4, g.w0, g.w1, 10);
      for (var j = 0; j < g.ramas.length; j++) { var b = g.ramas[j]; c.moveTo(b.x0, b.y0); tira(c, b.x0, b.y0 + 7, (b.x0 + b.x1) / 2 + (b.x1 - b.x0) * 0.08, (b.y0 + b.y1) / 2, b.x1, b.y1, b.w0, b.w1, 8); }
    };
    var cil = [[0, cla(C.dumTronco, 0.25)], [0.4, C.dumTronco], [1, osc(C.dumTronco, 0.32)]];
    // el pie, que se ensancha suave hacia el suelo
    relleno(k, function (c) { c.moveTo(-g.w0 * 1.0, 1.5); c.bezierCurveTo(-g.w0 * 0.62, -2, -g.w0 * 0.5, -10, -g.w0 * 0.49, -30); c.lineTo(g.w0 * 0.49, -30); c.bezierCurveTo(g.w0 * 0.5, -10, g.w0 * 0.62, -2, g.w0 * 1.0, 1.5); c.closePath(); },
      ES.lin(k, -g.w0, 0, g.w0, 0, cil));
    k.beginPath(); todo(k); k.fillStyle = ES.lin(k, -40, 0, 40, 0, cil); k.fill();
    // los anillos de las cicatrices de las hojas
    k.save(); k.beginPath(); todo(k); k.clip();
    var anillos = new Path2D(), luces = new Path2D();
    function aros(x0, y0, x1, y1, w) {
      var L = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(L / 8.5), ux = (x1 - x0) / L, uy = (y1 - y0) / L, rx = -uy, ry = ux;
      for (var j = 1; j < n; j++) {
        var cx = x0 + ux * j * 8.5, cy = y0 + uy * j * 8.5;
        anillos.moveTo(cx - rx * w, cy - ry * w); anillos.quadraticCurveTo(cx - ux * 3.2, cy - uy * 3.2, cx + rx * w, cy + ry * w);
        anillos.quadraticCurveTo(cx - ux * 1.9, cy - uy * 1.9, cx - rx * w, cy - ry * w);
      }
      // una luz a lo largo del lado izquierdo
      luces.moveTo(x0 - rx * w * 0.55, y0 - ry * w * 0.55); luces.lineTo(x1 - rx * w * 0.5, y1 - ry * w * 0.5); luces.lineTo(x1 - rx * w * 0.2, y1 - ry * w * 0.2); luces.lineTo(x0 - rx * w * 0.25, y0 - ry * w * 0.25); luces.closePath();
    }
    aros(0, 0, g.fx, g.fy, g.w0 * 0.6);
    for (i = 0; i < g.ramas.length; i++) { rm = g.ramas[i]; aros(rm.x0, rm.y0, rm.x1, rm.y1, rm.w0 * 0.6); }
    k.fillStyle = rgba(osc(C.dumTronco, 0.4), 0.42); k.fill(anillos);
    k.fillStyle = rgba(cla(C.dumTronco, 0.5), 0.22); k.fill(luces);
    k.restore();
  }
  function pintarFrutosDum(k, co) {
    var tallos = new Path2D(), atras = new Path2D(), delante = new Path2D(), luces = new Path2D(), i, d;
    for (i = 0; i < co.frutos.length; i++) {
      d = co.frutos[i];
      tallos.moveTo(co.x, co.y + 4); tallos.quadraticCurveTo((co.x + d[0]) / 2, co.y + 6, d[0], d[1] - d[2]);
      var p = d[4] ? delante : atras; p.moveTo(d[0] + d[2] * 0.86 * Math.cos(d[3]), d[1] + d[2] * 0.86 * Math.sin(d[3])); p.ellipse(d[0], d[1], d[2] * 0.86, d[2] * 1.1, d[3], 0, TAU);
      if (d[4]) { luces.moveTo(d[0] - d[2] * 0.3 + d[2] * 0.28, d[1] - d[2] * 0.45); luces.ellipse(d[0] - d[2] * 0.3, d[1] - d[2] * 0.45, d[2] * 0.28, d[2] * 0.42, -0.4, 0, TAU); }
    }
    k.strokeStyle = rgba(C.seco, 1); k.lineWidth = 1.4; k.stroke(tallos);
    k.fillStyle = rgba(osc(C.dumFruto, 0.25), 1); k.fill(atras);
    k.fillStyle = ES.rad(k, co.x, co.y + 18, 2, 18, [[0, cla(C.dumFruto, 0.25)], [0.6, C.dumFruto], [1, osc(C.dumFruto, 0.2)]], co.x - 4, co.y + 10); k.fill(delante);
    k.fillStyle = rgba([255, 236, 200], 0.5); k.fill(luces);
  }
  function pintarNudoDum(k, co) {
    relleno(k, function (c) { elipse(c, co.x, co.y + 2, 9, 6.5); }, ES.lin(k, co.x - 9, co.y - 4, co.x + 9, co.y + 8, [[0, C.dumTronco], [1, osc(C.dumTronco, 0.45)]]));
    pintarFrutosDum(k, co);
  }
  function abanicoEn(k, co, h, giro, cacheF) {
    var f = ABANICOS[h.v]; geomAbanico(f);
    k.save(); k.translate(co.x, co.y); k.scale(h.lado * h.esc, h.esc); k.rotate(h.ang + giro);
    if (cacheF) { k.rotate(f.fi); poner(k, cacheF); } else pintarAbanico(k, f, h.capa ? 0 : 1, h.seca);
    k.restore();
  }
  A.palmeraDum = pieza({
    ancho: 0.46, alto: 0.44, abajo: 0.008,
    dibujar: function (ctx, s, k, op) {
      var g = geomDum(op.semilla || 1), anim = op.t != null && !op.quieta, t = op.t || 0, v = op.viento == null ? 0.25 : U.clamp(op.viento, 0, 1);
      var i, j, co, h, w = 0.0015 + v * 0.001, amp = 0.03 + v * 0.085, sesgo = -v * 0.06;
      function giro(h) { return anim ? h.lado * (sesgo + amp * (Math.sin(t * w + h.fase) * 0.7 + Math.sin(t * w * 2.1 + h.fase * 1.3) * 0.3)) * (h.seca ? 0.6 : 1) : 0; }
      function cAb(h) {
        if (!anim) return null;
        var f = ABANICOS[h.v], tono = h.capa ? 0 : 1; geomAbanico(f);
        return enCache('dum-abanico|' + h.v + '|' + tono + '|' + (h.seca ? 1 : 0), s, k, f.caja, function (c) { c.rotate(-f.fi); pintarAbanico(c, f, tono, h.seca); });
      }
      if (anim) poner(ctx, enCache('dum-tronco|' + g.sem, s, k, g.cajaTronco, function (c) { pintarTroncoDum(c, g); }));
      else pintarTroncoDum(ctx, g);
      for (j = 0; j < g.coronas.length; j++) {
        co = g.coronas[j];
        for (i = 0; i < co.hojas.length; i++) { h = co.hojas[i]; if (!h.capa) abanicoEn(ctx, co, h, giro(h), cAb(h)); }
        if (anim) poner(ctx, enCache('dum-nudo|' + g.sem + '|' + j, s, k, [co.x - 30, co.y - 10, co.x + 30, co.y + 36], (function (co) { return function (c) { pintarNudoDum(c, co); }; })(co)));
        else pintarNudoDum(ctx, co);
        for (i = 0; i < co.hojas.length; i++) { h = co.hojas[i]; if (h.capa) abanicoEn(ctx, co, h, giro(h), cAb(h)); }
      }
    }
  });

  /* ---------- los papiros ----------
     Una mata de Cyperus papyrus: tallos altos de sección triangular (una cara clara y otra en sombra), con las vainas pardas
     al pie y, arriba, la umbela: un pompón de hilos verdes finísimos que se abren en todas direcciones, con las
     espiguillas doradas en la punta. Animada, cada tallo con su umbela es una pieza en caché que se mece sobre su pie. */
  function rayosUmbela(R, sem) {
    var r = U.azar(sem * 131 + 7), out = [], n = 70;
    for (var i = 0; i < n; i++) {
      var a = -PI / 2 + (i / (n - 1) - 0.5) * 2 * 2.4 + (r() - 0.5) * 0.1, prof = r();
      var len = R * (0.4 + 0.6 * Math.sqrt(prof)), ex = Math.cos(a) * len, ey = Math.sin(a) * len * 0.9;
      var cae = Math.cos(a) * Math.cos(a) * len * 0.16 + (ey > 0 ? len * 0.08 : 0);
      out.push([ex, ey + cae, ex * 0.5, ey * 0.5 - len * 0.07, prof]);
    }
    out.sort(function (a, b) { return a[4] - b[4]; });
    return out;
  }
  function pintarUmbela(k, R, sem, tono) {
    var rayos = rayosUmbela(R, sem), i, q;
    var luzC = tono ? mez(C.papiroLuz, C.papiro, 0.55) : C.papiroLuz, medio = tono ? mez(C.papiro, C.papiroSombra, 0.4) : C.papiro, somb = C.papiroSombra;
    // el corazón, más denso y oscuro (los hilos de atrás)
    relleno(k, function (c) { c.moveTo(R * 0.58, -R * 0.1); c.ellipse(0, -R * 0.1, R * 0.58, R * 0.5, 0, 0, TAU); }, ES.rad(k, 0, -R * 0.1, 0, R * 0.6, [[0, somb, 0.55], [1, somb, 0]]));
    var atras = new Path2D(), delante = new Path2D(), puntas = new Path2D();
    for (i = 0; i < rayos.length; i++) {
      q = rayos[i]; var p = q[4] < 0.5 ? atras : delante;
      p.moveTo(q[2] * 0.25, q[3] * 0.25); p.lineTo(q[2], q[3]); p.lineTo(q[0], q[1]);
      if (q[4] >= 0.5 && i % 2) { puntas.moveTo(q[0] + 1.4, q[1]); puntas.ellipse(q[0], q[1], 1.4, 1, Math.atan2(q[1], q[0]), 0, TAU); }
    }
    k.lineCap = 'butt'; k.lineJoin = 'miter';
    k.strokeStyle = rgba(mez(medio, somb, 0.4), 1); k.lineWidth = 0.85; k.stroke(atras);
    k.strokeStyle = rgba(mez(luzC, medio, 0.25), 1); k.lineWidth = 1.0; k.stroke(delante);
    k.lineJoin = 'round';
    k.fillStyle = rgba(mez(P.oro3, C.papiroLuz, 0.45), 0.95); k.fill(puntas);
    // las brácteas al pie de la umbela
    k.beginPath();
    for (i = 0; i < 5; i++) { var ab = -PI / 2 + (i - 2) * 0.6; hoja(k, 0, 2, Math.cos(ab) * R * 0.36, Math.sin(ab) * R * 0.28 + 2, 2.8, (i - 2) * 0.5); }
    k.fillStyle = ES.lin(k, 0, -R * 0.3, 0, 3, [[0, mez(medio, P.oro3, 0.25)], [1, somb]]); k.fill();
  }
  function geomPapiros(sem, alto) {
    var id = 'pap' + sem + '|' + Math.round(alto); if (GEO[id]) return GEO[id];
    var r = U.azar(sem * 6151 + 7), n = 9 + Math.floor(r() * 4), tallos = [];
    for (var i = 0; i < n; i++) {
      var f = (i + 0.5) / n - 0.5, h = alto * (0.62 + 0.38 * r()) * (1 - Math.abs(f) * 0.28);
      tallos.push({ i: i, bx: f * 28 + (r() - 0.5) * 6, tx: f * alto * 0.5 + (r() - 0.5) * alto * 0.1, h: h, R: alto * (0.09 + r() * 0.025),
        capa: r() < 0.45 ? 0 : 1, fase: r() * TAU, v: Math.floor(r() * 5), curva: (r() - 0.5) * 0.3 });
    }
    tallos.sort(function (a, b) { return a.capa - b.capa; });
    var g = { sem: sem, alto: alto, tallos: tallos };
    GEO[id] = g; return g;
  }
  function pintarTallo(k, tl, tono) {
    var x0 = tl.bx, x1 = tl.tx, y1 = -tl.h, cx = x0 + (x1 - x0) * 0.35 + tl.curva * tl.h * 0.2, cy = -tl.h * 0.5;
    var c0 = tono ? mez(C.papiro, C.papiroSombra, 0.5) : C.papiro;
    k.beginPath(); tira(k, x0, 0, cx, cy, x1, y1, 4.4, 2.1, 10);
    k.fillStyle = ES.lin(k, 0, 0, 0, -tl.h, [[0, osc(c0, 0.25)], [1, c0]]); k.fill();
    // la cara clara del tallo triangular
    k.beginPath(); tira(k, x0 - 0.9, 0, cx - 0.9, cy, x1 - 0.6, y1, 1.7, 0.8, 10);
    k.fillStyle = rgba(tono ? C.papiro : C.papiroLuz, tono ? 0.5 : 0.75); k.fill();
    var q = cuad(x0, 0, cx, cy, x1, y1, 1);
    k.save(); k.translate(q[0], q[1]); k.rotate(Math.atan2(q[3], q[2]) + PI / 2); pintarUmbela(k, tl.R, tl.v + tl.i * 7, tono); k.restore();
  }
  function pintarVainas(k, g) {
    k.beginPath();
    for (var i = 0; i < g.tallos.length; i++) {
      var tl = g.tallos[i], hv = 7 + (tl.i % 3) * 2.5;
      hoja(k, tl.bx - 1, 1, tl.bx + (tl.tx - tl.bx) * 0.04 - 1.5, -hv, 5.2, 1.2, 5.5);
      hoja(k, tl.bx + 1, 1, tl.bx + (tl.tx - tl.bx) * 0.04 + 2.5, -hv * 0.7, 4.5, -1, 5);
    }
    k.fillStyle = ES.lin(k, -30, -18, 30, 2, [[0, cla(C.vaina, 0.2)], [0.5, C.vaina], [1, osc(C.vaina, 0.3)]]); k.fill();
  }
  A.papiros = pieza({
    ancho: 0.32, alto: 0.38, abajo: 0.006,
    dibujar: function (ctx, s, k, op) {
      var alto = U.clamp(op.alto == null ? 0.24 : op.alto, 0.08, 0.32) * M, g = geomPapiros(op.semilla || 1, alto), anim = op.t != null && !op.quieta;
      var t = op.t || 0, v = op.viento == null ? 0.25 : U.clamp(op.viento, 0, 1), i, tl;
      if (!anim) {
        for (i = 0; i < g.tallos.length; i++) pintarTallo(ctx, g.tallos[i], g.tallos[i].capa ? 0 : 1);
        pintarVainas(ctx, g);
        return;
      }
      // cada tallo con su umbela, entero, gira sobre su pie (de vez en cuando una racha)
      var racha = Math.max(0, Math.sin(t * 0.00031) * Math.sin(t * 0.00077)) * v;
      for (i = 0; i < g.tallos.length; i++) {
        tl = g.tallos[i];
        var c = enCache('papiro-tallo|' + g.sem + '|' + Math.round(alto) + '|' + tl.i, s, k, [Math.min(tl.bx, tl.tx) - tl.R * 1.3 - 6, -tl.h - tl.R * 1.2, Math.max(tl.bx, tl.tx) + tl.R * 1.3 + 6, 3],
          (function (tl) { return function (c2) { pintarTallo(c2, tl, tl.capa ? 0 : 1); }; })(tl));
        var a = (Math.sin(t * (0.0013 + v * 0.0009) + tl.fase) * (0.012 + v * 0.03) - v * 0.02 - racha * 0.05) * (alto / tl.h);
        ctx.save(); ctx.translate(tl.bx, 0); ctx.rotate(a); ctx.translate(-tl.bx, 0); poner(ctx, c); ctx.restore();
      }
      poner(ctx, enCache('papiro-vainas|' + g.sem + '|' + Math.round(alto), s, k, [-40, -24, 40, 3], function (c2) { pintarVainas(c2, g); }));
    }
  });

  /* ---------- los lotos azules (Nymphaea caerulea) ----------
     Hojas redondas que flotan en la superficie (con su escotadura y el envés morado asomando por el borde), flores
     abiertas de pétalos puntiagudos, blancos azulados por dentro y azules en la punta, con el corazón dorado, y capullos
     cerrados. Los tallos bajan al agua. El ancla es el centro de la mata en la superficie. */
  function geomLotos(sem) {
    var id = 'lot' + sem; if (GEO[id]) return GEO[id];
    var r = U.azar(sem * 4421 + 3), g = { hojas: [], flores: [] }, i;
    var nh = 4 + Math.floor(r() * 2);
    for (i = 0; i < nh; i++) {
      var x = (i / (nh - 1) - 0.5) * 156 + (r() - 0.5) * 16;
      g.hojas.push({ x: x, w: 40 + r() * 22, esc: -PI / 2 + (r() - 0.5) * 1.6, atras: i % 2 });
    }
    g.hojas.sort(function (a, b) { return b.atras - a.atras; });
    var nf = 3 + Math.floor(r() * 2);
    for (i = 0; i < nf; i++) {
      var fx = (i / (nf - 1) - 0.5) * 130 + (r() - 0.5) * 16, abierta = i % 3 !== 1;
      g.flores.push({ x0: fx + (r() - 0.5) * 24, x: fx, y: -(abierta ? 34 + r() * 26 : 26 + r() * 18), tam: abierta ? 27 + r() * 5 : 16 + r() * 3, abierta: abierta, incl: (r() - 0.5) * 0.3 });
    }
    GEO[id] = g; return g;
  }
  function pintarNenufar(k, h) {
    var rx = h.w / 2, ry = h.w * 0.14, x = h.x, y = -1.2, a0 = h.esc;
    // el envés, morado, asoma por debajo del borde
    relleno(k, function (c) { c.moveTo(x + rx, y + 1.6); c.ellipse(x, y + 1.6, rx * 1.005, ry, 0, 0, TAU); }, ES.lin(k, x - rx, 0, x + rx, 0, [[0, cla(C.enves, 0.15)], [1, osc(C.enves, 0.3)]]));
    var forma = function (c) { c.moveTo(x, y); c.ellipse(x, y, rx, ry, 0, a0 + 0.16, a0 - 0.16 + TAU); c.closePath(); };
    relleno(k, forma, ES.lin(k, x - rx, y - ry, x + rx * 0.8, y + ry, [[0, cla(C.nenufarLuz, 0.12)], [0.45, mez(C.nenufar, C.nenufarLuz, 0.4)], [1, osc(C.nenufar, 0.25)]]));
    // los nervios, finos, desde el centro, y la luz arriba a la izquierda
    k.save(); k.beginPath(); forma(k); k.clip();
    k.beginPath();
    for (var i = 0; i < 11; i++) { var a = a0 + 0.45 + i * (TAU - 0.9) / 10; k.moveTo(x, y); k.lineTo(x + Math.cos(a) * rx, y + Math.sin(a) * ry); }
    k.strokeStyle = rgba(osc(C.nenufar, 0.35), 0.28); k.lineWidth = 0.8; k.stroke();
    k.fillStyle = ES.lin(k, x - rx, y - ry, x, y + ry, [[0, cla(C.nenufarLuz, 0.4), 0], [0.5, cla(C.nenufarLuz, 0.4), 0.32], [1, cla(C.nenufarLuz, 0.4), 0]]);
    k.fillRect(x - rx, y - ry, rx * 2, ry * 2);
    k.restore();
  }
  // la flor abierta, de perfil (la base en el origen, abierta hacia arriba), como los abanicos de loto de la referencia 1
  // pero con el acabado de la 2 y la 4: los pétalos de atrás en abanico, el corazón dorado, los de delante, y los sépalos
  function pintarLoto(k, tam, abierta) {
    var i, a, L;
    if (!abierta) {   // el capullo: una gota apuntada de sépalos verdes con la punta azul
      relleno(k, function (c) { c.moveTo(0, 0); c.bezierCurveTo(-tam * 0.55, -tam * 0.25, -tam * 0.3, -tam * 0.9, 0, -tam * 1.3); c.bezierCurveTo(tam * 0.3, -tam * 0.9, tam * 0.55, -tam * 0.25, 0, 0); },
        ES.lin(k, -tam * 0.4, -tam, tam * 0.4, 0, [[0, cla(C.petalo, 0.25)], [0.45, C.petalo], [1, C.petaloPunta]]));
      k.beginPath();
      hoja(k, -1, 0, -tam * 0.1, -tam * 1.06, tam * 0.5, tam * 0.1, tam * 0.3); hoja(k, 1, 0, tam * 0.12, -tam * 1.0, tam * 0.46, -tam * 0.12, tam * 0.3);
      k.fillStyle = ES.lin(k, -tam * 0.4, -tam, tam * 0.4, 0, [[0, C.nenufarLuz], [0.6, C.nenufar], [1, osc(C.nenufar, 0.3)]]); k.fill();
      k.beginPath(); for (i = 0; i < 3; i++) { k.moveTo(-tam * 0.14 + i * tam * 0.1, -tam * 0.2); k.lineTo(-tam * 0.1 + i * tam * 0.07, -tam * 0.64); }
      k.strokeStyle = rgba(osc(C.nenufar, 0.5), 0.4); k.lineWidth = 0.9; k.stroke();
      return;
    }
    // los pétalos de atrás, en abanico
    k.beginPath();
    for (i = 0; i < 7; i++) { a = -PI / 2 + (i - 3) * 0.29; L = tam * (1.04 - Math.abs(i - 3) * 0.05); hoja(k, 0, -tam * 0.12, Math.cos(a) * L, -tam * 0.12 + Math.sin(a) * L, tam * 0.25, 0, tam * 0.05); }
    k.fillStyle = ES.rad(k, 0, -tam * 0.1, tam * 0.15, tam * 1.05, [[0, cla(C.petalo, 0.3)], [0.55, mez(C.petalo, C.petaloPunta, 0.45)], [1, osc(C.petaloPunta, 0.1)]]); k.fill();
    k.beginPath();
    for (i = 0; i < 7; i++) { a = -PI / 2 + (i - 3) * 0.29; L = tam * (0.9 - Math.abs(i - 3) * 0.05); k.moveTo(Math.cos(a) * tam * 0.3, -tam * 0.12 + Math.sin(a) * tam * 0.3); k.lineTo(Math.cos(a) * L, -tam * 0.12 + Math.sin(a) * L); }
    k.strokeStyle = rgba(cla(C.petalo, 0.5), 0.55); k.lineWidth = tam * 0.03; k.lineCap = 'butt'; k.stroke();
    // el corazón: estambres dorados
    k.beginPath();
    for (i = 0; i < 9; i++) { a = -PI / 2 + (i - 4) * 0.16; k.moveTo(Math.cos(a) * tam * 0.12, -tam * 0.16 + Math.sin(a) * tam * 0.1); k.lineTo(Math.cos(a) * tam * 0.4, -tam * 0.16 + Math.sin(a) * tam * 0.38); }
    k.strokeStyle = ES.lin(k, 0, -tam * 0.52, 0, -tam * 0.15, [[0, P.oro1], [1, P.oro3]]); k.lineWidth = tam * 0.055; k.lineCap = 'round'; k.stroke();
    // los pétalos de delante, más claros
    k.beginPath();
    for (i = 0; i < 4; i++) { a = -PI / 2 + (i - 1.5) * 0.43; L = tam * (0.86 - Math.abs(i - 1.5) * 0.05); hoja(k, 0, -tam * 0.06, Math.cos(a) * L, -tam * 0.06 + Math.sin(a) * L * 0.92, tam * 0.28, 0, tam * 0.06); }
    k.fillStyle = ES.lin(k, 0, -tam * 0.05, 0, -tam * 0.85, [[0, P.lino], [0.45, cla(C.petalo, 0.35)], [1, C.petaloPunta]]); k.fill();
    // los sépalos, verdes, a los lados
    k.beginPath();
    hoja(k, -1, 0, -tam * 0.64, -tam * 0.5, tam * 0.24, tam * 0.08, tam * 0.1); hoja(k, 1, 0, tam * 0.64, -tam * 0.5, tam * 0.24, -tam * 0.08, tam * 0.1);
    hoja(k, 0, 0, -tam * 0.1, -tam * 0.44, tam * 0.24, 0, tam * 0.12);
    k.fillStyle = ES.lin(k, -tam * 0.6, -tam * 0.5, tam * 0.6, 0, [[0, C.nenufarLuz], [0.5, C.nenufar], [1, osc(C.nenufar, 0.3)]]); k.fill();
    relleno(k, function (c) { elipse(c, 0, -tam * 0.04, tam * 0.13, tam * 0.08); }, rgba(osc(C.nenufar, 0.2), 1));
  }
  A.lotos = pieza({
    ancho: 0.26, alto: 0.1, abajo: 0.03,
    dibujar: function (ctx, s, k, op) {
      var g = geomLotos(op.semilla || 1), i;
      // los tallos suben del fondo; lo que queda bajo el agua, velado
      enDosAguas(ctx, function (c) {
        c.beginPath();
        for (var j = 0; j < g.flores.length; j++) { var f = g.flores[j]; tira(c, f.x0, 28, (f.x0 + f.x) / 2 - f.incl * 20, f.y * 0.4, f.x, f.y, 2.6, 2.2, 8); }
        c.fillStyle = ES.lin(c, 0, 28, 0, -40, [[0, osc(C.nenufar, 0.3)], [1, C.nenufar]]); c.fill();
      }, 140, 0.4);
      for (i = 0; i < g.hojas.length; i++) if (g.hojas[i].atras) pintarNenufar(ctx, g.hojas[i]);
      for (i = 0; i < g.flores.length; i++) {
        var f = g.flores[i];
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.incl * 0.6); pintarLoto(ctx, f.tam, f.abierta); ctx.restore();
      }
      for (i = 0; i < g.hojas.length; i++) if (!g.hojas[i].atras) pintarNenufar(ctx, g.hojas[i]);
    }
  });

  /* ---------- la acacia del desierto ----------
     Copa plana en sombrilla (Vachellia tortilis), verde oliva, con la luz por arriba y la sombra por debajo; dos troncos
     que se abren desde abajo en ramas que suben a la copa. */
  function geomAcacia(sem) {
    var id = 'aca' + sem; if (GEO[id]) return GEO[id];
    var r = U.azar(sem * 3329 + 11), g = { ramas: [] }, i;
    g.H = 300 + r() * 30; g.ancho = 360 + r() * 50; g.cx = (r() - 0.5) * 30;
    var t1 = { x0: -6, y0: 0, x1: -24 - r() * 12, y1: -118 - r() * 20 }, t2 = { x0: 6, y0: 0, x1: 22 + r() * 14, y1: -100 - r() * 24 };
    g.troncos = [t1, t2];
    var nr = 7;
    for (i = 0; i < nr; i++) {
      var de = i % 2 ? t2 : t1, u = (i + 0.5) / nr - 0.5, ex = g.cx + u * g.ancho * 0.8 + (r() - 0.5) * 20;
      g.ramas.push({ x0: de.x1 + (r() - 0.5) * 6, y0: de.y1 + 6, x1: ex, y1: -g.H + 32 + r() * 10, w: 5.5 + r() * 2.5 });
    }
    g.alto2 = r() < 0.6;
    g.x2 = g.cx + (r() - 0.5) * g.ancho * 0.3;
    GEO[id] = g; return g;
  }
  // el borde de una copa plana: de izquierda a derecha por los bultos de arriba y de vuelta por abajo, casi recto
  function copa(k, cx, yBase, ancho, alto, nb, sem, fondo) {
    var r = U.azar(sem), i, x0 = cx - ancho / 2, x1 = cx + ancho / 2, xs = [], ys = [];
    for (i = 0; i <= nb; i++) {
      var u = i / nb, h = alto * Math.pow(Math.sin(PI * (0.04 + 0.92 * u)), 0.5) * (0.85 + r() * 0.3);
      xs.push(x0 + ancho * u); ys.push(yBase - h);
    }
    k.moveTo(x0, yBase);
    k.quadraticCurveTo(x0 - 4, ys[0] + (yBase - ys[0]) * 0.2, xs[0] + 2, ys[0]);
    for (i = 1; i <= nb; i++) {
      var mx = (xs[i - 1] + xs[i]) / 2, my = Math.min(ys[i - 1], ys[i]) - alto * 0.3 * (0.8 + r() * 0.4);
      k.quadraticCurveTo(mx, my, xs[i], ys[i]);
    }
    k.quadraticCurveTo(x1 + 4, ys[nb] + (yBase - ys[nb]) * 0.2, x1, yBase);
    var nbb = Math.round(nb * 1.5);
    for (i = nbb - 1; i >= 0; i--) {
      var xb = x0 + ancho * i / nbb, xm = x0 + ancho * (i + 0.5) / nbb;
      k.quadraticCurveTo(xm, yBase + (fondo || 6) * (0.6 + r() * 0.8), xb, yBase);
    }
    k.closePath();
  }
  A.acacia = pieza({
    ancho: 0.46, alto: 0.4, abajo: 0.01,
    dibujar: function (ctx, s, k, op) {
      var sem = op.semilla || 1, g = geomAcacia(sem), i, H = g.H, cx = g.cx, an = g.ancho, sm = sem * 17;
      var grad = ES.lin(ctx, -an / 2, 0, an / 2, 0, [[0, cla(C.corteza, 0.25)], [0.4, C.corteza], [1, osc(C.corteza, 0.35)]]);
      // las ramas (detrás de la copa) y los troncos
      ctx.beginPath();
      for (i = 0; i < g.ramas.length; i++) { var rm = g.ramas[i]; tira(ctx, rm.x0, rm.y0, rm.x0 + (rm.x1 - rm.x0) * 0.25, rm.y1 + (rm.y0 - rm.y1) * 0.45, rm.x1, rm.y1, rm.w, rm.w * 0.45, 8); }
      for (i = 0; i < 2; i++) { var tr = g.troncos[i]; tira(ctx, tr.x0, tr.y0 + 1, tr.x0 + (tr.x1 - tr.x0) * 0.2, tr.y1 * 0.55, tr.x1, tr.y1, 15, 10, 8); }
      ctx.fillStyle = grad; ctx.fill();
      // la luz de la corteza por la izquierda
      ctx.beginPath();
      for (i = 0; i < 2; i++) { var t2 = g.troncos[i]; tira(ctx, t2.x0 - 4, t2.y0, t2.x0 - 4 + (t2.x1 - t2.x0) * 0.2, t2.y1 * 0.55, t2.x1 - 3, t2.y1, 3.5, 2, 8); }
      ctx.fillStyle = rgba(C.cortezaLuz, 0.5); ctx.fill();
      // la copa: la sombra de abajo, el piso de arriba, el cuerpo y la luz arriba a la izquierda
      var yB = -H + 36;
      relleno(ctx, function (c) { copa(c, cx, yB + 6, an * 0.9, 26, 9, sm + 1, 8); }, ES.lin(ctx, 0, yB - 16, 0, yB + 14, [[0, C.acaciaSombra], [1, osc(C.acaciaSombra, 0.25)]]));
      if (g.alto2) relleno(ctx, function (c) { copa(c, g.x2, yB - 30, an * 0.42, 34, 5, sm + 2, 6); }, ES.lin(ctx, 0, yB - 76, 0, yB - 26, [[0, mez(C.acacia, C.acaciaLuz, 0.4)], [1, C.acaciaSombra]]));
      relleno(ctx, function (c) { copa(c, cx, yB, an, 44, 11, sm + 3, 7); }, ES.lin(ctx, 0, yB - 58, 0, yB + 8, [[0, C.acaciaLuz], [0.5, C.acacia], [1, mez(C.acacia, C.acaciaSombra, 0.6)]]));
      relleno(ctx, function (c) { copa(c, cx - an * 0.12, yB - 13, an * 0.62, 32, 7, sm + 4, 4); }, ES.lin(ctx, cx - an * 0.4, yB - 56, cx + an * 0.2, yB - 8, [[0, cla(C.acaciaLuz, 0.15), 0.85], [1, C.acaciaLuz, 0]]));
      // las hojitas: motas claras arriba y oscuras abajo
      var r = U.azar(sm + 9);
      ctx.beginPath();
      for (i = 0; i < 70; i++) { var x = cx + (r() - 0.5) * an * 0.9, yy = yB - 8 - r() * 38 * Math.sin(PI * (0.5 + (x - cx) / an)); elipse(ctx, x, yy, 3 + r() * 2, 1.6 + r(), 0); }
      ctx.fillStyle = rgba(cla(C.acaciaLuz, 0.25), 0.35); ctx.fill();
      ctx.beginPath();
      for (i = 0; i < 40; i++) { var x2 = cx + (r() - 0.5) * an * 0.88; elipse(ctx, x2, yB + 1 + r() * 6, 3 + r() * 3, 1.5 + r(), 0); }
      ctx.fillStyle = rgba(osc(C.acaciaSombra, 0.3), 0.4); ctx.fill();
    }
  });

  /* ================================================================== LOS ANIMALES
     Los de tierra y agua miran a la derecha y op.dir = -1 los da la vuelta; los que vuelan (el ibis en vuelo y los patos)
     miran a la izquierda, que es hacia donde cruzan el cielo, y op.dir = 1 los vuelve. El ancla es el centro de la base de
     su caja: los pies en el suelo (la orilla); lo que flota o asoma, la superficie del agua; lo que vuela, el pie de su caja. */
  var CA = {
    blanco: mez(P.lino, P.blanco, 0.4),
    blancoSombra: mez(P.lino2, P.negro2, 0.18),
    gris: mez(P.negro2, P.lino2, 0.52),
    grisLuz: mez(P.negro2, P.lino, 0.7),
    grisOsc: mez(P.negro2, P.negro, 0.35),
    picoGarza: mez(P.oro2, P.oro3, 0.35),
    pataGarza: mez(P.oro3, P.piedra2, 0.5),
    cafe: mez(P.oro4, P.negro, 0.35),
    ganso: mez(P.piedra2, P.negro2, 0.3),
    gansoLuz: mez(P.piedra, P.lino, 0.35),
    gansoOsc: mez(P.oro4, P.negro, 0.42),
    gansoGris: mez(P.lino2, P.negro2, 0.42),
    pato: mez(P.lino2, P.negro2, 0.35),
    croco: mez(mez(P.verde, P.oro4, 0.52), P.negro, 0.12),
    crocoLuz: mez(P.verde, P.arena, 0.45),
    crocoOsc: mez(mez(P.verde, P.negro, 0.62), P.oro4, 0.15),
    crocoVientre: mez(P.arena, P.lino, 0.25),
    hipo: mez(mez(P.negro2, P.piel2, 0.36), P.lino2, 0.08),
    hipoLuz: mez(mez(P.negro2, P.lino, 0.42), P.pielM, 0.18),
    hipoOsc: mez(P.negro2, P.negro, 0.45),
    hipoRosa: mez(mez(P.pielM, P.rojo, 0.35), P.lino, 0.3),
    fayenza: cla(P.turquesa, 0.08),
    fayenzaLuz: cla(P.turquesa, 0.5),
    fayenzaOsc: mez(P.turquesa, P.lapis, 0.42),
    pez: mez(P.turquesa, P.negro2, 0.45),
    pezLuz: mez(P.lino, P.egipcio, 0.18),
    pezAleta: mez(P.cornalina, P.oro2, 0.25),
    bola: mez(P.oro4, P.piedra2, 0.38)
  };
  A.colores.animales = CA;

  // una pata de ave: de la cadera al pie, con la articulación (el tobillo) hacia atrás; devuelve [cadera, rodilla, pie]
  function ikPata(hx, hy, fx, fy, l1, l2) {
    var dx = fx - hx, dy = fy - hy, d = Math.min(Math.sqrt(dx * dx + dy * dy), l1 + l2 - 0.05), a = Math.atan2(dy, dx);
    var c = U.clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), b = Math.acos(c);
    return [hx, hy, hx + Math.cos(a + b) * l1, hy + Math.sin(a + b) * l1, hx + Math.cos(a) * d, hy + Math.sin(a) * d];
  }
  // la pata pintada: muslo, caña y dedos, de un color liso (el negro del ibis, el pardo amarillento de la garza…)
  function pintarPata(k, p, ancho, col, dedos) {
    k.beginPath(); k.moveTo(p[0], p[1]); k.lineTo(p[2], p[3]); k.lineTo(p[4], p[5]);
    var fx = p[4], fy = p[5], L = dedos || 9;
    k.moveTo(fx - L * 0.45, fy); k.lineTo(fx + L, fy + 0.2); k.moveTo(fx, fy); k.lineTo(fx + L * 0.75, fy - 0.2 + 1.6); k.moveTo(fx, fy); k.lineTo(fx + L * 0.7, fy - 1.4);
    k.strokeStyle = col; k.lineWidth = ancho; k.lineCap = 'round'; k.lineJoin = 'round'; k.stroke();
  }
  function espejo(ctx, dir) { if (dir < 0) ctx.scale(-1, 1); }
  // anillos de agua (ondas que se abren) en (x, 0): r = radio; a = opacidad
  function anillo(k, x, r, a, y) {
    if (a <= 0.01 || r <= 0.5) return;
    k.beginPath(); k.ellipse(x, y || 1.2, r, r * 0.2, 0, 0, TAU);
    k.strokeStyle = rgba(C.aguaLuz, a); k.lineWidth = 1.3; k.stroke();
  }
  // gotas que saltan (una sola forma para todas): lista de [x, y, r]
  function gotas(k, lista, a) {
    if (!lista.length) return;
    k.beginPath();
    for (var i = 0; i < lista.length; i++) { var g = lista[i]; k.moveTo(g[0] + g[2], g[1]); k.ellipse(g[0], g[1], g[2], g[2] * 1.25, 0, 0, TAU); }
    k.fillStyle = rgba(cla(C.aguaLuz, 0.35), a == null ? 0.85 : a); k.fill();
  }

  /* ---------- el ibis sagrado ----------
     Blanco, con la cabeza y el cuello desnudos y negros, el pico largo y curvo, las plumas negras y deshilachadas que le
     caen sobre la cola y las patas negras. De pie anda por la orilla, se para y hurga en el barro con el pico. */
  function formaCuerpoIbis(k) {
    k.moveTo(30, -84);
    k.bezierCurveTo(42, -78, 41, -58, 23, -50);
    k.bezierCurveTo(8, -43, -18, -44, -32, -51);
    k.bezierCurveTo(-42, -55, -52, -59, -60, -62);
    k.bezierCurveTo(-46, -73, -26, -88, -2, -91);
    k.bezierCurveTo(13, -93, 25, -90, 30, -84);
    k.closePath();
  }
  function pintarCuerpoIbis(k) {
    relleno(k, formaCuerpoIbis, ES.lin(k, 0, -93, 8, -44, [[0, CA.blanco], [0.5, mez(CA.blanco, CA.blancoSombra, 0.3)], [1, CA.blancoSombra]]));
    // el ala plegada, apenas más gris, con el borde de las plumas
    var ala = function (c) { c.moveTo(26, -80); c.bezierCurveTo(16, -63, -14, -55, -52, -59); c.bezierCurveTo(-34, -73, -8, -88, 26, -80); c.closePath(); };
    relleno(k, ala, ES.lin(k, 0, -88, 0, -56, [[0, mez(CA.blanco, P.lino2, 0.18)], [1, mez(CA.blancoSombra, P.lino2, 0.35)]]));
    k.beginPath();
    for (var i = 0; i < 4; i++) { var x = 12 - i * 14; k.moveTo(x, -78 + i * 4); k.quadraticCurveTo(x - 9, -68 + i * 2.5, x - 17, -62 + i * 0.6); }
    k.strokeStyle = rgba(CA.blancoSombra, 0.55); k.lineWidth = 1; k.lineCap = 'round'; k.stroke();
    luz(k, formaCuerpoIbis, 10, -96, 22, -70, 0.5, P.blanco);
    // las plumas negras que caen sobre la cola, deshilachadas
    var plumas = function (c) {
      tira(c, -16, -78, -38, -78, -62, -58, 8, 0.8, 9);
      tira(c, -14, -74, -36, -70, -58, -48, 7.5, 0.8, 9);
      tira(c, -12, -70, -32, -62, -52, -44, 7, 0.7, 9);
      tira(c, -22, -76, -46, -72, -66, -52, 6, 0.7, 9);
      tira(c, -18, -72, -40, -64, -60, -42, 6, 0.6, 9);
      tira(c, -26, -80, -48, -80, -68, -64, 5, 0.6, 9);
    };
    relleno(k, plumas, ES.negro(k, -20, -82, -50, -40));
    luz(k, plumas, -30, -82, -40, -60, 0.4, [150, 170, 210]);
  }
  function pintarCuelloIbis(k, x0, y0, cx, cy, x1, y1) {
    k.beginPath(); tira(k, x0, y0, cx, cy, x1, y1, 10.5, 6.5, 10);
    k.fillStyle = ES.negro(k, Math.min(x0, x1) - 6, y1, Math.max(x0, x1) + 6, y0); k.fill();
    // un reflejo gris azulado a lo largo del cuello
    k.beginPath(); tira(k, x0 - 2.2, y0 - 1, cx - 2.2, cy, x1 - 1.5, y1 + 2, 2.6, 1.4, 8);
    k.fillStyle = rgba([140, 160, 200], 0.35); k.fill();
  }
  // la cabeza con el pico (la cabeza en el origen; el pico hacia delante y abajo)
  function pintarCabezaIbis(k) {
    k.beginPath(); tira(k, 3, 0.5, 22, 1.5, 33, 28, 4.8, 1.1, 14);
    k.fillStyle = ES.lin(k, 0, -4, 14, 26, [[0, P.negro2], [0.6, P.negro], [1, osc(P.negro, 0.2)]]); k.fill();
    k.beginPath(); tira(k, 4, -1.4, 21, -0.2, 31, 24, 1.2, 0.3, 10); k.fillStyle = rgba([150, 165, 200], 0.4); k.fill();
    relleno(k, function (c) { elipse(c, 0, 0, 7.6, 6.6, -0.25); }, ES.negro(k, -6, -7, 6, 6));
    relleno(k, function (c) { elipse(c, 1.6, -1.6, 1.7, 1.7); }, rgba(mez(P.rojo, P.negro, 0.45), 1));
    relleno(k, function (c) { elipse(c, 1.1, -2.1, 0.6, 0.6); }, rgba(P.blanco, 0.85));
  }
  // la pose del ibis: dónde está la cabeza, cómo gira y por dónde va el cuello; pica: 0 (erguido) … 1 (el pico en el barro)
  function poseIbis(pica, cabeceo) {
    var e = U.suave(pica), hx = 37 + (63 - 37) * e + (cabeceo || 0), hy = -117 + 76 * e;
    return { x0: 28, y0: -84, cx: 42 + (62 - 42) * e, cy: -102 + (-84 + 102) * e, hx: hx, hy: hy, giro: 0.92 * e };
  }
  // el plan del paseo: andar, parar, hurgar… ida y vuelta, en un ciclo que se repite (en mu y ms)
  var VEL_IBIS = 0.033, ZANCADA = 30;
  function planIbis(sem) {
    var id = 'ibis' + sem; if (GEO[id]) return GEO[id];
    var r = U.azar(sem * 97 + 5), acts = [], x = 0, dir = 1, T = 0, d1 = ZANCADA * (2 + Math.floor(r() * 2)), d2 = ZANCADA * (1 + Math.floor(r() * 2));
    function pon(tipo, dur, dx) { acts.push({ tipo: tipo, t0: T, dur: dur, x0: x, x1: x + dx, dir: dir }); T += dur; x += dx; }
    for (var lado = 0; lado < 2; lado++) {
      pon('anda', d1 / VEL_IBIS, dir * d1); pon('pica', 1500 + r() * 1500, 0); pon('para', 600 + r() * 800, 0);
      pon('anda', d2 / VEL_IBIS, dir * d2); pon('para', 400 + r() * 600, 0); pon('pica', 1200 + r() * 1800, 0); pon('para', 700 + r() * 700, 0);
      dir = -dir;
    }
    var g = { acts: acts, T: T, mitad: (d1 + d2) / 2 };
    GEO[id] = g; return g;
  }
  function estadoIbis(sem, t) {
    var g = planIbis(sem), tt = ((t % g.T) + g.T) % g.T, a = g.acts[0];
    for (var i = 0; i < g.acts.length; i++) if (tt >= g.acts[i].t0) a = g.acts[i];
    var u = (tt - a.t0) / a.dur, x = a.x0 + (a.x1 - a.x0) * u - g.mitad, st = { x: x, dir: a.dir, pica: 0, fase: 0, anda: false, cabeceo: 0 };
    if (a.tipo === 'anda') { st.anda = true; var rec = Math.abs(a.x1 - a.x0) * u; st.fase = (rec / ZANCADA) % 1; st.cabeceo = Math.sin(st.fase * TAU * 2) * 2.2; }
    if (a.tipo === 'pica') {
      var ms = tt - a.t0, baja = U.meseta(ms, 0, 320, a.dur - 380, a.dur);
      var golpe = ms > 320 && ms < a.dur - 380 ? Math.abs(Math.sin((ms - 320) / 260 * PI)) * 0.08 : 0;
      st.pica = baja - golpe;
    }
    return st;
  }
  function pintarIbis(ctx, st, sprites) {
    var i, pies = [], bob = st.anda ? -Math.abs(Math.cos(st.fase * TAU)) * 1.4 + 0.7 : 0;
    // las patas: la de atrás más oscura; con el paso, cada pie apoyado o en el aire
    for (i = 0; i < 2; i++) {
      var f = (st.fase + i * 0.5) % 1, S = 9, fx, alza = 0;
      if (!st.anda) fx = i ? -6 : 6;
      else if (f < 0.6) fx = S - 2 * S * (f / 0.6);
      else { var u = (f - 0.6) / 0.4; fx = -S + 2 * S * u; alza = Math.sin(u * PI) * 8; }
      pies.push(ikPata(i ? -1 : 5, -50 + bob, fx + (i ? -1 : 3), -alza, 25, 27));
    }
    pintarPata(ctx, pies[1], 2.6, rgba(mez(P.negro, P.negro2, 0.2), 1), 8);
    pintarPata(ctx, pies[0], 2.9, rgba(P.negro, 1), 9);
    var ps = poseIbis(st.pica, st.cabeceo);
    ctx.save(); ctx.translate(0, bob);
    if (sprites) poner(ctx, sprites.cuerpo); else pintarCuerpoIbis(ctx);
    pintarCuelloIbis(ctx, ps.x0, ps.y0, ps.cx, ps.cy, ps.hx, ps.hy);
    ctx.save(); ctx.translate(ps.hx, ps.hy); ctx.rotate(ps.giro);
    if (sprites) poner(ctx, sprites.cabeza); else pintarCabezaIbis(ctx);
    ctx.restore(); ctx.restore();
  }
  A.ibis = pieza({
    ancho: 0.34, alto: 0.13, abajo: 0.004,
    dibujar: function (ctx, s, k, op) {
      var sem = op.semilla || 1, st;
      if (op.t == null) st = { x: 0, dir: op.dir || 1, pica: op.pica != null ? op.pica : 0, fase: op.paso || 0, anda: op.paso != null, cabeceo: 0 };
      else { st = estadoIbis(sem, op.t); if (op.dir === -1) st.dir = -st.dir; }
      var sprites = op.t == null ? null : {
        cuerpo: enCache('ibis-cuerpo', s, k, [-74, -98, 46, -38], pintarCuerpoIbis),
        cabeza: enCache('ibis-cabeza', s, k, [-10, -10, 38, 32], pintarCabezaIbis)
      };
      ctx.save(); ctx.translate(st.x, 0); espejo(ctx, st.dir); pintarIbis(ctx, st, sprites); ctx.restore();
    }
  });

  /* ---------- el ibis en vuelo ----------
     El cuello estirado hacia delante, las patas detrás, y las alas blancas con las puntas negras. op.fase (0…1) es el
     ciclo del aleteo: 0, las alas arriba; 0,5, abajo. */
  function formaAlaIbis(k, L) {   // el ala hacia arriba desde el hombro (0, 0); el borde de ataque hacia +x
    k.moveTo(10, 2);
    k.bezierCurveTo(12, -L * 0.35, 6, -L * 0.75, -4, -L);
    k.bezierCurveTo(-10, -L * 0.92, -14, -L * 0.8, -16, -L * 0.62);
    k.bezierCurveTo(-20, -L * 0.42, -26, -L * 0.2, -26, 2);
    k.closePath();
  }
  function pintarAlaIbis(k, L, sombra) {
    var f = function (c) { formaAlaIbis(c, L); };
    relleno(k, f, ES.lin(k, 8, 0, -22, -L * 0.5, sombra ? [[0, mez(CA.blancoSombra, P.lino2, 0.3)], [1, osc(CA.blancoSombra, 0.12)]] : [[0, CA.blanco], [0.6, mez(CA.blanco, CA.blancoSombra, 0.3)], [1, CA.blancoSombra]]));
    // las plumas de la punta, negras, con su filo
    k.save(); k.beginPath(); f(k); k.clip();
    relleno(k, function (c) { c.moveTo(20, -L * 0.7); c.bezierCurveTo(4, -L * 0.62, -14, -L * 0.6, -30, -L * 0.48); c.lineTo(-30, -L - 10); c.lineTo(20, -L - 10); c.closePath(); }, ES.negro(k, 0, -L, -10, -L * 0.5));
    k.beginPath(); for (var i = 0; i < 6; i++) { var y = -L * (0.5 + i * 0.08); k.moveTo(-26, y + 6); k.lineTo(4 - i, y - 4); }
    k.strokeStyle = rgba(sombra ? CA.blancoSombra : P.lino2, 0.5); k.lineWidth = 0.9; k.stroke();
    k.restore();
  }
  function pintarCuerpoIbisVuelo(k) {
    // las patas, detrás
    k.beginPath(); k.moveTo(-14, 5); k.lineTo(-56, 9); k.moveTo(-14, 6); k.lineTo(-52, 13);
    k.strokeStyle = rgba(P.negro, 1); k.lineWidth = 2.4; k.lineCap = 'round'; k.stroke();
    var cuerpo = function (c) { c.moveTo(26, -5); c.bezierCurveTo(18, -16, -14, -16, -30, -8); c.bezierCurveTo(-38, -4, -42, 0, -44, 3); c.bezierCurveTo(-30, 11, -4, 16, 14, 11); c.bezierCurveTo(24, 8, 28, 2, 26, -5); c.closePath(); };
    relleno(k, cuerpo, ES.lin(k, 0, -16, 0, 15, [[0, CA.blanco], [0.6, mez(CA.blanco, CA.blancoSombra, 0.35)], [1, CA.blancoSombra]]));
    luz(k, cuerpo, 0, -18, 4, -4, 0.45, P.blanco);
    // las plumas negras sobre la cola
    relleno(k, function (c) { tira(c, -16, -3, -32, -6, -46, 1, 5, 1, 7); tira(c, -18, 0, -34, 0, -45, 6, 4, 1, 7); }, ES.negro(k, -20, -8, -44, 6));
    pintarCuelloIbis(k, 22, -3, 38, -3, 52, 1);
    k.save(); k.translate(56, 2); k.rotate(-0.15); pintarCabezaIbis(k); k.restore();
  }
  A.ibisVuelo = pieza({
    ancho: 0.19, alto: 0.15, abajo: 0,
    dibujar: function (ctx, s, k, op) {
      var f = op.fase == null ? 0.25 : ((op.fase % 1) + 1) % 1, th = Math.cos(f * TAU) * 1.05, p = Math.sin(th + 0.12), L = 70;
      var bob = -Math.cos(f * TAU) * 3, cache = op.fase != null;
      ctx.save(); ctx.translate(0, -75 + bob); espejo(ctx, op.dir || -1);
      function ala(sombra, dx, dy, esc) {
        ctx.save(); ctx.translate(2 + dx + Math.sin(f * TAU) * 4, -7 + dy); ctx.scale(1, (Math.abs(p) < 0.34 ? (p < 0 ? -0.34 : 0.34) : p) * esc);
        if (cache) poner(ctx, enCache('ibis-ala|' + (sombra ? 1 : 0), s, k, [-30, -L - 4, 14, 4], function (c) { pintarAlaIbis(c, L, sombra); }));
        else pintarAlaIbis(ctx, L, sombra);
        ctx.restore();
      }
      ala(true, 7, -3, 0.92);
      if (cache) poner(ctx, enCache('ibis-vuelo', s, k, [-60, -16, 90, 34], pintarCuerpoIbisVuelo)); else pintarCuerpoIbisVuelo(ctx);
      ala(false, 0, 0, 1);
      ctx.restore();
    }
  });

  /* ---------- la garza real ----------
     De pie en el agua, quieta como una estatua: gris, el cuello blanco con su raya de motas negras, la cabeza blanca con la
     lista negra que acaba en las dos plumas largas de la nuca (la del Benu, el ave de Heliópolis) y el pico de daga
     amarillo. De vez en cuando lanza el pico al agua (op.t), y a veces saca un pececillo. */
  function formaCuerpoGarza(k) {
    k.moveTo(18, -100);
    k.bezierCurveTo(31, -92, 29, -74, 12, -66);
    k.bezierCurveTo(-4, -58, -26, -56, -42, -60);
    k.bezierCurveTo(-50, -62, -56, -64, -62, -64);
    k.bezierCurveTo(-46, -80, -18, -101, 4, -105);
    k.bezierCurveTo(10, -106, 15, -104, 18, -100);
    k.closePath();
  }
  function pintarCuerpoGarza(k) {
    // las patas (pardo amarillento), del vientre al fondo
    pintarPata(k, [-2, -62, 2, -36, -2, 20], 3, rgba(osc(CA.pataGarza, 0.18), 1), 10);
    pintarPata(k, [6, -62, 12, -36, 8, 20], 3.3, rgba(CA.pataGarza, 1), 11);
    relleno(k, formaCuerpoGarza, ES.lin(k, 0, -106, 0, -56, [[0, CA.grisLuz], [0.5, mez(CA.grisLuz, CA.blanco, 0.3)], [1, CA.blancoSombra]]));
    var ala = function (c) { c.moveTo(16, -98); c.bezierCurveTo(10, -78, -20, -64, -64, -63); c.bezierCurveTo(-44, -82, -16, -101, 16, -98); c.closePath(); };
    relleno(k, ala, ES.lin(k, 0, -102, -10, -62, [[0, cla(CA.gris, 0.1)], [0.6, CA.gris], [1, osc(CA.gris, 0.2)]]));
    // las rémiges oscuras al final del ala y la mancha negra del hombro
    k.save(); k.beginPath(); ala(k); k.clip();
    relleno(k, function (c) { c.moveTo(-26, -100); c.bezierCurveTo(-30, -84, -36, -70, -40, -58); c.lineTo(-80, -58); c.lineTo(-80, -100); c.closePath(); }, ES.lin(k, -30, -90, -60, -60, [[0, CA.grisOsc], [1, osc(CA.grisOsc, 0.3)]]));
    k.beginPath(); for (var i = 0; i < 5; i++) { var x = 8 - i * 10; k.moveTo(x, -94 + i * 4); k.quadraticCurveTo(x - 8, -84 + i * 3, x - 16, -78 + i * 2); }
    k.strokeStyle = rgba(cla(CA.gris, 0.35), 0.6); k.lineWidth = 1; k.stroke();
    k.restore();
    relleno(k, function (c) { elipse(c, 13, -88, 5, 9, 0.5); }, ES.negro(k, 8, -96, 18, -80));
    luz(k, formaCuerpoGarza, 4, -108, 14, -86, 0.4, P.blanco);
  }
  // el cuello: de la base (16, -100) a la cabeza; e = 0 encogido en S (al acecho), 1 estirado hasta el agua
  function puntosCuelloGarza(e, hx, hy) {
    var S = [[16, -100], [9, -112], [13, -126], [25, -134], [hx, hy]], R = [[16, -100], [16 + (hx - 16) * 0.25, -100 + (hy + 100) * 0.25], [16 + (hx - 16) * 0.5, -100 + (hy + 100) * 0.5], [16 + (hx - 16) * 0.75, -100 + (hy + 100) * 0.75], [hx, hy]];
    var w = [12.5, 10.5, 9.5, 8.5, 8], pts = [];
    for (var i = 0; i < 5; i++) pts.push(S[i][0] + (R[i][0] - S[i][0]) * e, S[i][1] + (R[i][1] - S[i][1]) * e, w[i]);
    return pts;
  }
  function pintarCuelloGarza(k, pts) {
    k.beginPath(); tiraPor(k, pts);
    k.fillStyle = ES.lin(k, pts[0] - 10, 0, pts[0] + 14, 0, [[0, CA.blanco], [1, mez(CA.blanco, CA.blancoSombra, 0.6)]]); k.fill();
    // la raya de motas negras por delante del cuello
    var d = [], n = pts.length / 3;
    for (var i = 0; i < n; i++) d.push(pts[i * 3] + 2.6, pts[i * 3 + 1] + 1, 2.2);
    k.save(); k.setLineDash([2.4, 2.2]); k.beginPath(); k.moveTo(d[0], d[1]); for (i = 1; i < n; i++) k.lineTo(d[i * 3], d[i * 3 + 1]);
    k.strokeStyle = rgba(P.negro, 0.75); k.lineWidth = 1.8; k.lineCap = 'butt'; k.stroke(); k.restore();
  }
  function pintarCabezaGarza(k) {   // la cabeza en el origen, mirando a la derecha
    // las dos plumas de la nuca
    k.beginPath(); tira(k, -2, -2, -16, -6, -32, 2, 2.6, 0.6, 8); tira(k, -2, -1, -14, -3, -27, 6, 2.2, 0.5, 8);
    k.fillStyle = ES.negro(k, -30, -6, -2, 4); k.fill();
    // el pico de daga
    relleno(k, function (c) { c.moveTo(4, -2.8); c.quadraticCurveTo(20, -3, 36, 1.2); c.quadraticCurveTo(20, 2.6, 4, 3); c.closePath(); }, ES.lin(k, 4, -3, 4, 3, [[0, cla(CA.picoGarza, 0.25)], [0.5, CA.picoGarza], [1, osc(CA.picoGarza, 0.25)]]));
    relleno(k, function (c) { elipse(c, 0, 0, 7.5, 6, -0.1); }, ES.lin(k, 0, -6, 0, 6, [[0, CA.blanco], [1, mez(CA.blanco, CA.blancoSombra, 0.5)]]));
    // la lista negra desde el ojo hacia la nuca
    relleno(k, function (c) { c.moveTo(3, -2.4); c.quadraticCurveTo(-3, -5.8, -8, -2.5); c.quadraticCurveTo(-3, -3.6, 3, -0.8); c.closePath(); }, rgba(P.negro, 1));
    relleno(k, function (c) { elipse(c, 3, -1.6, 1.5, 1.5); }, rgba(P.oro2, 1));
    relleno(k, function (c) { elipse(c, 3.2, -1.6, 0.75, 0.75); }, rgba(P.negro, 1));
  }
  function pintarPececillo(k) {
    relleno(k, function (c) { c.moveTo(7, 0); c.quadraticCurveTo(0, -3.2, -6, -0.4); c.lineTo(-10, -3); c.lineTo(-9, 0); c.lineTo(-10, 3); c.lineTo(-6, 0.4); c.quadraticCurveTo(0, 3.2, 7, 0); c.closePath(); },
      ES.lin(k, 0, -3, 0, 3, [[0, cla(CA.pez, 0.3)], [1, CA.pezLuz]]));
  }
  // el lance: cada tantos segundos (según la semilla), estira el cuello de golpe, mete el pico y vuelve despacio
  function estadoGarza(sem, t) {
    var r = U.azar(sem * 61 + 9), P0 = 6500 + r() * 3500, fase = r() * P0, tt = ((t + fase) % P0 + P0) % P0;
    var n = Math.floor((t + fase) / P0), pesca = U._h(n * 3.1 + sem) < 0.5;
    var e = tt < 140 ? U.sale(tt / 140) : tt < 520 ? 1 : tt < 1250 ? 1 - U.inOut((tt - 520) / 730) : 0;
    return { e: e, tt: tt, pesca: pesca && tt > 400 && tt < 1700, P: P0 };
  }
  A.garza = pieza({
    ancho: 0.25, alto: 0.15, abajo: 0.026,
    dibujar: function (ctx, s, k, op) {
      var st = op.t == null ? { e: op.lance || 0, tt: 9999, pesca: false } : estadoGarza(op.semilla || 1, op.t), e = st.e;
      ctx.save(); espejo(ctx, op.dir || 1);
      // la cabeza: al acecho, quieta; en el lance, al agua
      var hx = 32 + (88 - 32) * e, hy = -138 + (-14 + 138) * e, giro = 0.82 * e;
      if (op.t != null && e === 0 && !st.pesca) {
        // al acecho (casi siempre): la garza entera desde una caché, con lo que queda bajo el agua velado
        var cq = enCache('garza-quieta', s, k, [-68, -150, 82, 28], function (c) { pintarCuerpoGarza(c); pintarCuelloGarza(c, puntosCuelloGarza(0, 32, -138)); c.save(); c.translate(32, -138); pintarCabezaGarza(c); c.restore(); });
        ponerFlotando(ctx, cq, enCacheAgua(cq, 'garza-quieta', s, k, 0), 0, 0, 0, 0);
        ondas(ctx, -2, 10, op.t, 0.7);
        ctx.restore(); return;
      }
      if (op.t == null) {
        // quieta: el cuerpo con las patas bajo el agua veladas
        enDosAguas(ctx, function (c) { pintarCuerpoGarza(c); }, 140, 0.42);
      } else {
        var cu = enCache('garza-cuerpo', s, k, [-68, -110, 34, 28], pintarCuerpoGarza);
        ponerFlotando(ctx, cu, enCacheAgua(cu, 'garza-cuerpo', s, k), 0, 0, 0, 0);
      }
      // las ondas alrededor de las patas (y más fuertes al lanzar)
      ondas(ctx, -2, 10, op.t || 0, 0.7);
      if (st.tt < 1600) { var q = st.tt / 1600; anillo(ctx, hx + 34 * Math.cos(giro), 4 + 22 * q, 0.7 * (1 - q)); anillo(ctx, hx + 34 * Math.cos(giro), 2 + 12 * q, 0.5 * (1 - q)); }
      pintarCuelloGarza(ctx, puntosCuelloGarza(e, hx, hy));
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(giro);
      if (op.t != null) poner(ctx, enCache('garza-cabeza', s, k, [-36, -10, 40, 10], pintarCabezaGarza)); else pintarCabezaGarza(ctx);
      if (st.pesca) { ctx.save(); ctx.translate(33, 1.5); ctx.rotate(0.5 + Math.sin(st.tt * 0.03) * 0.25); pintarPececillo(ctx); ctx.restore(); }
      ctx.restore();
      ctx.restore();
    }
  });

  /* ---------- el halcón ----------
     Planeando en círculos con las alas abiertas, visto desde abajo como lo pintaban los egipcios: el cuerpo y las alas de
     frente, la cabeza de perfil, con la «bigotera» oscura bajo el ojo (la marca del ojo de Horus). op.angulo es el ángulo de
     su vuelta (si da vueltas con x = cos(angulo), y = sin(angulo), vuela por la tangente: el rumbo es angulo + π/2); con
     op.rumbo se le da el rumbo directamente (en radianes, 0 = hacia la derecha). op.fase (0…1) mece las alas y la cola. */
  function formaAlaHalcon(k) {   // el ala derecha del pájaro (hacia +y), desde el costado; el borde de ataque hacia +x
    k.moveTo(14, 4);
    k.bezierCurveTo(20, 18, 18, 40, 6, 62);
    k.bezierCurveTo(2, 68, -2, 72, -6, 74);
    k.bezierCurveTo(-9, 66, -12, 58, -16, 50);
    k.quadraticCurveTo(-20, 47, -21, 42); k.quadraticCurveTo(-24, 38, -24, 33); k.quadraticCurveTo(-27, 28, -26, 22); k.quadraticCurveTo(-28, 16, -26, 10);
    k.quadraticCurveTo(-26, 6, -22, 4);
    k.closePath();
  }
  function pintarAlaHalcon(k) {
    var crema = mez(P.lino, P.papiro2, 0.35), ante = mez(P.papiro2, P.piedra2, 0.45), osc2 = mez(P.negro2, P.oro4, 0.25);
    relleno(k, formaAlaHalcon, ES.lin(k, 16, 0, -26, 30, [[0, crema], [0.5, mez(crema, ante, 0.5)], [1, ante]]));
    k.save(); k.beginPath(); formaAlaHalcon(k); k.clip();
    // las coberteras con sus motas en punta de flecha
    var motas = new Path2D();
    for (var f = 0; f < 3; f++) for (var i = 0; i < 6; i++) { var my = 10 + i * 7.5 + f * 2, mx = 10 - f * 6 - i * 1.3; motas.moveTo(mx + 1.4, my - 1.2); motas.lineTo(mx - 1.2, my); motas.lineTo(mx + 1.4, my + 1.2); motas.closePath(); }
    k.fillStyle = rgba(osc2, 0.55); k.fill(motas);
    // las rémiges barradas y la banda oscura del borde de salida
    k.beginPath(); for (i = 0; i < 12; i++) { var y = 8 + i * 5.6; k.moveTo(-30, y + 3); k.lineTo(-8 - i * 0.4, y - 1.5); }
    k.strokeStyle = rgba(osc2, 0.35); k.lineWidth = 1.5; k.lineCap = 'butt'; k.stroke();
    relleno(k, function (c) { c.moveTo(-30, 6); c.quadraticCurveTo(-22, 30, -16, 54); c.lineTo(-30, 54); c.closePath(); }, rgba(osc2, 0.28));
    // las puntas de las primarias, oscuras
    relleno(k, function (c) { c.moveTo(-20, 56); c.quadraticCurveTo(0, 48, 22, 50); c.lineTo(22, 80); c.lineTo(-20, 80); c.closePath(); }, ES.negro(k, 0, 52, 0, 74));
    k.restore();
    luz(k, formaAlaHalcon, 18, 10, 2, 16, 0.35, P.blanco);
  }
  function pintarCuerpoHalcon(k) {
    var crema = mez(P.lino, P.papiro2, 0.3), ante = mez(P.papiro2, P.piedra2, 0.5), osc2 = mez(P.negro2, P.oro4, 0.25);
    // la cola, larga y barrada, con la punta clara
    var cola = function (c) { c.moveTo(-14, -7); c.lineTo(-50, -12); c.quadraticCurveTo(-56, 0, -50, 12); c.lineTo(-14, 7); c.closePath(); };
    relleno(k, cola, ES.lin(k, -14, 0, -54, 0, [[0, ante], [1, mez(ante, P.negro2, 0.3)]]));
    k.save(); k.beginPath(); cola(k); k.clip();
    k.beginPath(); for (var i = 0; i < 6; i++) { var x = -20 - i * 5.6; k.moveTo(x, -16); k.lineTo(x - 0.6, 16); }
    k.strokeStyle = rgba(osc2, 0.55); k.lineWidth = 2; k.lineCap = 'butt'; k.stroke();
    k.fillStyle = rgba(P.lino, 0.8); k.fillRect(-58, -16, 5.6, 32); k.restore();
    // el cuerpo, de crema con trazos oscuros
    var cuerpo = function (c) { c.moveTo(26, 0); c.bezierCurveTo(24, -13, 2, -15, -18, -9); c.quadraticCurveTo(-25, 0, -18, 9); c.bezierCurveTo(2, 15, 24, 13, 26, 0); c.closePath(); };
    relleno(k, cuerpo, ES.lin(k, 0, -13, 0, 13, [[0, crema], [1, ante]]));
    k.beginPath(); for (i = 0; i < 7; i++) { var bx = 14 - i * 4.6; k.moveTo(bx, -6 + (i % 2)); k.lineTo(bx - 2.6, -4 + (i % 2)); k.moveTo(bx, 4 - (i % 2)); k.lineTo(bx - 2.6, 6 - (i % 2)); k.moveTo(bx - 1, -1); k.lineTo(bx - 3.4, 1); }
    k.strokeStyle = rgba(osc2, 0.6); k.lineWidth = 1.5; k.lineCap = 'round'; k.stroke();
    luz(k, cuerpo, 0, -14, 4, -2, 0.35, P.blanco);
    // la cabeza de perfil, grande: el capirote pizarra, la bigotera, el ojo con su anillo amarillo y el pico ganchudo
    var cab = function (c) { c.moveTo(40, 2); c.bezierCurveTo(41, -10, 30, -15, 22, -11); c.quadraticCurveTo(15, -4, 19, 6); c.bezierCurveTo(25, 11, 37, 11, 40, 2); c.closePath(); };
    relleno(k, cab, ES.lin(k, 20, -12, 24, 10, [[0, crema], [1, mez(crema, ante, 0.6)]]));
    relleno(k, function (c) { c.moveTo(40, -2); c.bezierCurveTo(39, -11, 29, -15, 21, -11); c.quadraticCurveTo(17, -6, 19, -2); c.quadraticCurveTo(29, -7, 40, -2); c.closePath(); }, ES.negro(k, 20, -14, 38, -2));
    relleno(k, function (c) { c.moveTo(32, -3); c.quadraticCurveTo(27.5, 3, 29.5, 10); c.quadraticCurveTo(33.5, 6, 34.5, -2); c.closePath(); }, ES.negro(k, 28, -3, 34, 10));
    relleno(k, function (c) { elipse(c, 34, -4.2, 3.4, 3.1); }, rgba(P.oro2, 1));
    relleno(k, function (c) { elipse(c, 34.3, -4.2, 2.1, 2.1); }, rgba(P.negro, 1));
    relleno(k, function (c) { elipse(c, 33.6, -5, 0.7, 0.7); }, rgba(P.blanco, 0.9));
    relleno(k, function (c) { c.moveTo(39, -5); c.quadraticCurveTo(46.5, -5.6, 48, 0.4); c.quadraticCurveTo(46, 0, 44.6, 3); c.quadraticCurveTo(42, 1.6, 39.6, 2); c.closePath(); }, ES.lin(k, 39, -5, 48, 3, [[0, mez(P.negro2, P.egipcio, 0.3)], [1, P.negro]]));
    relleno(k, function (c) { elipse(c, 39.6, -3.4, 2, 1.6, 0.2); }, rgba(P.oro2, 1));
  }
  A.halcon = pieza({
    ancho: 0.18, alto: 0.18, abajo: 0,
    dibujar: function (ctx, s, k, op) {
      var ang = op.rumbo != null ? op.rumbo : (op.angulo || 0) + PI / 2, f = op.fase == null ? 0 : op.fase, cache = op.fase != null || op.t != null;
      var flex = Math.sin(f * TAU), banco = Math.sin(f * TAU + 1.1);
      ctx.save(); ctx.translate(0, -90); ctx.rotate(ang);
      if (Math.cos(ang) < 0) ctx.scale(1, -1);
      function ala(lado) {
        ctx.save(); ctx.scale(1, lado * (1 + lado * banco * 0.05)); ctx.rotate(-0.04 * flex);
        if (cache) poner(ctx, enCache('halcon-ala', s, k, [-32, 0, 24, 80], pintarAlaHalcon)); else pintarAlaHalcon(ctx);
        ctx.restore();
      }
      ala(-1); ala(1);
      ctx.save(); ctx.translate(-14, 0); ctx.rotate(0.05 * flex); ctx.translate(14, 0);
      if (cache) poner(ctx, enCache('halcon-cuerpo', s, k, [-60, -17, 50, 14], pintarCuerpoHalcon)); else pintarCuerpoHalcon(ctx);
      ctx.restore();
      ctx.restore();
    }
  });

  /* ---------- los gansos de Meidum ----------
     La pintura de la mastaba de Nefermaat e Itet en Meidum (IV dinastía, hoy en el Museo Egipcio de El Cairo): seis
     gansos en dos grupos de tres; en cada grupo, dos con la cabeza alta y uno que pace con la cabeza baja, entre matas
     con flores rojas. Aquí, el grupo que mira a la derecha: los dos gansos de pecho rojo (Branta ruficollis, como el
     ganso de la referencia 4) y, delante, el ganso gris que pace. Quietos, o con un leve vaivén (op.t). */
  function formaCuerpoGanso(k) {
    k.moveTo(30, -66);
    k.bezierCurveTo(45, -60, 45, -37, 26, -29);
    k.bezierCurveTo(10, -23, -22, -25, -36, -33);
    k.bezierCurveTo(-46, -37, -54, -42, -60, -47);
    k.bezierCurveTo(-46, -61, -18, -71, 4, -71);
    k.bezierCurveTo(16, -71, 24, -69, 30, -66);
    k.closePath();
  }
  function pintarPatasGanso(k, col, pace) {
    var c = rgba(col, 1), d = pace ? 4 : 0;
    k.beginPath(); k.moveTo(-6, -28); k.lineTo(-9 - d, -12); k.lineTo(-8 - d, 0); k.moveTo(6, -28); k.lineTo(7, -12); k.lineTo(9 + d, 0);
    k.strokeStyle = c; k.lineWidth = 3.4; k.lineCap = 'round'; k.lineJoin = 'round'; k.stroke();
    // las palmas de los pies
    k.beginPath(); k.moveTo(-14 - d, 0.6); k.quadraticCurveTo(-8 - d, -3, -1 - d, 0.6); k.closePath(); k.moveTo(3 + d, 0.6); k.quadraticCurveTo(10 + d, -3, 17 + d, 0.6); k.closePath();
    k.fillStyle = c; k.fill();
  }
  // el ganso de pecho rojo, de pie: el lomo pardo grisáceo, el vientre claro, el pecho rojo con su filo blanco y azul,
  // la cara blanca con la mancha roja de la mejilla, la cola oscura dentada y las rayas blancas del costado
  function pintarGansoRojo(k) {
    pintarPatasGanso(k, mez(P.lino2, P.negro2, 0.35), false);
    relleno(k, formaCuerpoGanso, ES.lin(k, 0, -72, 0, -24, [[0, mez(CA.ganso, CA.gansoLuz, 0.25)], [0.5, mez(CA.gansoLuz, P.lino, 0.45)], [1, mez(P.lino, P.lino2, 0.6)]]));
    // la cola oscura, dentada
    relleno(k, function (c) { c.moveTo(-40, -50); c.lineTo(-72, -41); for (var i = 0; i < 4; i++) { c.lineTo(-70 + i * 3, -37 + i * 0.4); c.lineTo(-68 + i * 3, -40 + i * 0.6); } c.lineTo(-40, -36); c.closePath(); }, ES.lin(k, -40, -50, -70, -36, [[0, CA.gansoOsc], [1, osc(CA.gansoOsc, 0.25)]]));
    // el ala plegada, parda, con las tres rayas blancas
    var ala = function (c) { c.moveTo(22, -64); c.bezierCurveTo(18, -48, -10, -38, -56, -44); c.bezierCurveTo(-36, -60, -10, -70, 22, -64); c.closePath(); };
    relleno(k, ala, ES.lin(k, 0, -70, -10, -40, [[0, mez(CA.ganso, CA.gansoLuz, 0.35)], [0.55, CA.ganso], [1, osc(CA.ganso, 0.2)]]));
    k.save(); k.beginPath(); ala(k); k.clip();
    k.beginPath(); for (var j = 0; j < 3; j++) { var x0 = -2 - j * 9; tira(k, x0, -50 + j, x0 - 6, -44, x0 - 12, -41, 4, 2, 6); }
    k.fillStyle = rgba(P.lino, 0.92); k.fill();
    k.beginPath(); for (j = 0; j < 4; j++) { var yy = -60 + j * 4.5; k.moveTo(16 - j * 4, yy); k.quadraticCurveTo(-10 - j * 3, yy + 6, -40 - j * 2, yy + 9); }
    k.strokeStyle = rgba(cla(CA.ganso, 0.35), 0.45); k.lineWidth = 1.1; k.stroke();
    k.restore();
    luz(k, formaCuerpoGanso, 0, -76, 8, -60, 0.35, P.blanco);
    // el pecho rojo, con su filo blanco y la raya azul por detrás
    var pecho = function (c) { c.moveTo(24, -66); c.bezierCurveTo(30, -58, 26, -44, 18, -32); c.bezierCurveTo(30, -30, 44, -40, 44, -54); c.bezierCurveTo(44, -62, 38, -68, 32, -70); c.closePath(); };
    relleno(k, function (c) { c.moveTo(21, -66); c.bezierCurveTo(27, -58, 23, -44, 14.6, -31.4); c.lineTo(18, -32); c.bezierCurveTo(26, -44, 30, -58, 24, -66); c.closePath(); }, rgba(P.egipcio, 1));
    relleno(k, function (c) { c.moveTo(22.6, -66); c.bezierCurveTo(28.6, -58, 24.6, -44, 16.4, -31.6); c.lineTo(18, -32); c.bezierCurveTo(26, -44, 30, -58, 24, -66); c.closePath(); }, rgba(P.lino, 1));
    relleno(k, pecho, ES.lin(k, 24, -70, 44, -34, [[0, cla(P.cornalina, 0.15)], [0.6, P.cornalina], [1, osc(P.rojo, 0.15)]]));
    luz(k, pecho, 30, -66, 38, -56, 0.3, [255, 230, 200]);
    // el cuello: blanco por detrás (con su raya azul), rojo por delante
    var cuello = function (c) { tiraPor(c, [28, -64, 15, 32, -76, 11.5, 36, -86, 10, 38, -93, 9.5]); };
    relleno(k, cuello, ES.lin(k, 26, -90, 44, -64, [[0, P.blanco], [1, P.lino2]]));
    k.save(); k.beginPath(); cuello(k); k.clip();
    relleno(k, function (c) { tiraPor(c, [36, -64, 10, 39, -76, 8, 42, -86, 6.6, 44, -94, 6]); }, ES.lin(k, 34, -94, 44, -62, [[0, cla(P.cornalina, 0.1)], [1, P.rojo]]));
    relleno(k, function (c) { tiraPor(c, [21, -64, 3.2, 25.6, -76, 2.6, 30.2, -86, 2.2, 32.6, -93, 2]); }, rgba(P.egipcio, 1));
    k.restore();
    // la cabeza: blanca, con la coronilla gris, la mancha roja de la mejilla y el pico corto oscuro con la punta clara
    relleno(k, function (c) { c.moveTo(47, -98.6); c.lineTo(58.6, -95.6); c.quadraticCurveTo(60.6, -94, 58, -92.8); c.lineTo(47, -92.6); c.closePath(); }, ES.lin(k, 47, -99, 47, -92, [[0, P.negro2], [1, P.negro]]));
    relleno(k, function (c) { c.moveTo(56, -95.6); c.quadraticCurveTo(60.6, -94.4, 58.4, -92.8); c.lineTo(55.6, -93.4); c.closePath(); }, rgba(mez(P.cornalina, P.oro2, 0.5), 1));
    relleno(k, function (c) { elipse(c, 40, -96.4, 9.2, 7.8, -0.15); }, ES.lin(k, 32, -104, 46, -90, [[0, P.blanco], [1, P.lino2]]));
    relleno(k, function (c) { c.moveTo(31.6, -99); c.bezierCurveTo(33.6, -106.4, 45.6, -106.6, 48.6, -99); c.quadraticCurveTo(40, -102, 31.6, -99); c.closePath(); }, ES.lin(k, 31, -105, 49, -99, [[0, CA.gansoGris], [1, osc(CA.gansoGris, 0.2)]]));
    relleno(k, function (c) { elipse(c, 38.4, -93.6, 4.6, 3.4, 0.25); }, ES.rad(k, 37.6, -94.4, 0, 5, [[0, cla(P.cornalina, 0.2)], [1, P.rojo]]));
    relleno(k, function (c) { elipse(c, 43.6, -98.4, 1.6, 1.6); }, rgba(P.negro, 1));
    relleno(k, function (c) { elipse(c, 43.2, -98.9, 0.55, 0.55); }, rgba(P.blanco, 0.9));
  }
  // el ganso gris (el de los extremos de la pintura), paciendo con la cabeza baja: pardo grisáceo con las plumas en
  // escamas, el pico y las patas rosa anaranjado
  function pintarGansoGris(k, cab) {
    cab = cab || 0;
    var naranja = mez(P.cornalina, P.pielM, 0.55);
    pintarPatasGanso(k, naranja, true);
    relleno(k, formaCuerpoGanso, ES.lin(k, 0, -72, 0, -24, [[0, mez(CA.gansoGris, CA.ganso, 0.4)], [0.55, mez(CA.gansoGris, P.lino, 0.35)], [1, mez(P.lino, P.lino2, 0.5)]]));
    relleno(k, function (c) { c.moveTo(-40, -50); c.lineTo(-70, -42); c.quadraticCurveTo(-66, -38, -40, -37); c.closePath(); }, ES.lin(k, -40, -50, -70, -36, [[0, osc(CA.gansoGris, 0.25)], [1, osc(CA.gansoGris, 0.45)]]));
    var ala = function (c) { c.moveTo(24, -64); c.bezierCurveTo(20, -48, -10, -38, -56, -44); c.bezierCurveTo(-36, -60, -10, -70, 24, -64); c.closePath(); };
    relleno(k, ala, ES.lin(k, 0, -70, -10, -40, [[0, mez(CA.gansoGris, P.lino, 0.2)], [0.6, CA.gansoGris], [1, osc(CA.gansoGris, 0.25)]]));
    // las escamas de las plumas: filas de arquitos claros
    k.save(); k.beginPath(); ala(k); k.clip();
    var esc = new Path2D();
    for (var f = 0; f < 4; f++) for (var j = 0; j < 7; j++) { var x = 14 - j * 9 - f * 4, y = -62 + f * 5.5 + j * 1.6; esc.moveTo(x - 4.5, y); esc.quadraticCurveTo(x, y + 4.5, x + 4.5, y); }
    k.strokeStyle = rgba(cla(CA.gansoGris, 0.45), 0.7); k.lineWidth = 1.1; k.stroke(esc);
    k.restore();
    luz(k, formaCuerpoGanso, 0, -76, 8, -60, 0.3, P.blanco);
    // el cuello que baja a la hierba y la cabeza
    k.save(); k.translate(26, -62); k.rotate(cab); k.translate(-26, 62);
    k.beginPath(); tiraPor(k, [22, -62, 15, 36, -60, 12.5, 46, -44, 11, 52, -26, 10, 56, -14, 9.5]);
    k.fillStyle = ES.lin(k, 30, -60, 60, -10, [[0, mez(CA.gansoGris, P.lino, 0.15)], [1, osc(CA.gansoGris, 0.15)]]); k.fill();
    relleno(k, function (c) { c.moveTo(60, -10); c.lineTo(70, -1); c.quadraticCurveTo(69, 1.5, 66, 1); c.lineTo(57, -5); c.closePath(); }, ES.lin(k, 58, -10, 68, 2, [[0, cla(naranja, 0.2)], [1, osc(naranja, 0.2)]]));
    relleno(k, function (c) { elipse(c, 56, -12, 8.5, 7, 0.9); }, ES.lin(k, 50, -18, 62, -6, [[0, mez(CA.gansoGris, P.lino, 0.2)], [1, osc(CA.gansoGris, 0.2)]]));
    relleno(k, function (c) { elipse(c, 56.5, -15, 1.4, 1.4); }, rgba(P.negro, 1));
    k.restore();
  }
  // las matas de la pintura de Meidum: hojas finas y unas flores rojas
  function pintarMata(k, x, h) {
    k.beginPath();
    for (var i = 0; i < 7; i++) { var a = -PI / 2 + (i - 3) * 0.28; hoja(k, x, 0, x + Math.cos(a) * h * (1 - Math.abs(i - 3) * 0.12), Math.sin(a) * h * (1 - Math.abs(i - 3) * 0.12), 2.4, (i - 3) * 0.8, 2.4); }
    k.fillStyle = ES.lin(k, 0, -h, 0, 0, [[0, mez(P.verde, P.oro1, 0.3)], [1, mez(P.verde, P.negro, 0.35)]]); k.fill();
    k.beginPath();
    for (i = 0; i < 4; i++) { var b = -PI / 2 + (i - 1.5) * 0.5, fx = x + Math.cos(b) * h * 0.95, fy = Math.sin(b) * h * 0.95; k.moveTo(fx + 2.2, fy); k.ellipse(fx, fy, 2.2, 2.2, 0, 0, TAU); }
    k.fillStyle = ES.lin(k, 0, -h, 0, -h * 0.6, [[0, cla(P.cornalina, 0.2)], [1, P.rojo]]); k.fill();
  }
  var GANSOS = [{ x: -118, tipo: 'rojo' }, { x: -10, tipo: 'rojo' }, { x: 98, tipo: 'gris' }];
  A.gansos = pieza({
    ancho: 0.38, alto: 0.11, abajo: 0.004,
    dibujar: function (ctx, s, k, op) {
      var t = op.t, anim = t != null;
      ctx.save(); espejo(ctx, op.dir || 1);
      pintarMataCache(ctx, s, k, anim);
      for (var i = 0; i < GANSOS.length; i++) {
        var gz = GANSOS[i], rojo = gz.tipo === 'rojo';
        var cab = anim ? (rojo ? Math.sin(t * 0.0011 + i * 2.3) * 0.012 : Math.max(0, Math.sin(t * 0.0023 + i)) * 0.05) : 0;
        var bal = anim ? Math.sin(t * 0.0017 + i * 1.7) * 0.012 : 0;
        ctx.save(); ctx.translate(gz.x, 0); ctx.rotate(bal);
        if (anim) {
          // con vaivén: cada ganso entero en caché; se mece sobre las patas y el que pace baja y sube la cabeza
          ctx.translate(20, 0); ctx.rotate(cab); ctx.translate(-20, 0);
          poner(ctx, enCache('ganso|' + gz.tipo, s, k, rojo ? [-78, -110, 66, 3] : [-78, -76, 76, 3], rojo ? pintarGansoRojo : pintarGansoGris));
        } else if (rojo) pintarGansoRojo(ctx); else pintarGansoGris(ctx);
        ctx.restore();
      }
      ctx.restore();
    }
  });
  function pintarMataCache(ctx, s, k, anim) {
    var f = function (c) { pintarMata(c, -64, 16); pintarMata(c, 44, 13); pintarMata(c, 150, 15); };
    if (anim) poner(ctx, enCache('gansos-matas', s, k, [-90, -22, 172, 3], f)); else f(ctx);
  }

  /* ---------- los patos ----------
     Una bandada de ánades rabudos (los patos de las escenas de caza en los pantanos): la cabeza parda con la raya blanca
     del cuello, el cuerpo gris, la cola de alfiler negra y el espejuelo verde de las alas. op.fase (0…1) es el aleteo; cada
     pato va un poco desfasado. El ancla es el pie de la bandada. */
  function formaAlaPato(k, L) { k.moveTo(9, 2); k.bezierCurveTo(10, -L * 0.4, 4, -L * 0.8, -6, -L); k.bezierCurveTo(-12, -L * 0.7, -18, -L * 0.35, -19, 2); k.closePath(); }
  function pintarAlaPato(k, L, sombra) {
    var f = function (c) { formaAlaPato(c, L); };
    relleno(k, f, ES.lin(k, 8, 0, -18, -L * 0.5, sombra ? [[0, osc(CA.pato, 0.15)], [1, osc(CA.pato, 0.35)]] : [[0, cla(CA.pato, 0.2)], [0.6, CA.pato], [1, osc(CA.pato, 0.2)]]));
    k.save(); k.beginPath(); f(k); k.clip();
    // el espejuelo verde con su borde blanco, y las primarias oscuras
    relleno(k, function (c) { c.moveTo(-20, -L * 0.12); c.lineTo(-6, -L * 0.14); c.lineTo(-8, -L * 0.42); c.lineTo(-22, -L * 0.4); c.closePath(); }, ES.lin(k, -20, 0, -6, -L * 0.4, [[0, mez(P.verde, P.turquesa, 0.5)], [1, osc(P.verde, 0.35)]]));
    k.beginPath(); k.moveTo(-21, -L * 0.1); k.lineTo(-22, -L * 0.42); k.strokeStyle = rgba(P.lino, 0.9); k.lineWidth = 2; k.stroke();
    relleno(k, function (c) { c.moveTo(-30, -L * 0.62); c.lineTo(14, -L * 0.7); c.lineTo(14, -L - 6); c.lineTo(-30, -L - 6); c.closePath(); }, rgba(osc(CA.pato, 0.45), 1));
    k.restore();
  }
  function pintarCuerpoPato(k) {
    relleno(k, function (c) { c.moveTo(-20, -2); c.lineTo(-46, -5); c.lineTo(-44, -2); c.lineTo(-20, 3); c.closePath(); }, ES.negro(k, -20, -4, -46, 2));
    var cuerpo = function (c) { c.moveTo(22, -3); c.bezierCurveTo(14, -10, -10, -10, -22, -4); c.quadraticCurveTo(-26, 0, -20, 4); c.bezierCurveTo(-6, 9, 14, 8, 22, 2); c.closePath(); };
    relleno(k, cuerpo, ES.lin(k, 0, -9, 0, 8, [[0, cla(CA.pato, 0.25)], [0.6, CA.pato], [1, mez(P.lino, CA.pato, 0.4)]]));
    // el pecho y la raya blanca del cuello, la cabeza parda y el pico
    relleno(k, function (c) { c.moveTo(14, -6); c.quadraticCurveTo(24, -6, 30, -3); c.lineTo(30, 2); c.quadraticCurveTo(22, 6, 12, 5); c.closePath(); }, rgba(P.lino, 1));
    relleno(k, function (c) { elipse(c, 31, -3, 6.5, 5.2, -0.1); c.moveTo(24, -4); c.lineTo(28, -1); c.lineTo(23, 1); c.closePath(); }, ES.lin(k, 26, -8, 34, 2, [[0, mez(CA.cafe, P.oro3, 0.3)], [1, CA.cafe]]));
    relleno(k, function (c) { tira(c, 22, 2, 25, -2, 27, -5, 1.6, 1, 4); }, rgba(P.lino, 1));
    relleno(k, function (c) { c.moveTo(36, -4); c.quadraticCurveTo(43, -3.6, 45, -1); c.quadraticCurveTo(42, 0.6, 36, 0); c.closePath(); }, ES.lin(k, 36, -4, 36, 1, [[0, mez(P.negro2, P.egipcio, 0.4)], [1, P.negro]]));
    relleno(k, function (c) { elipse(c, 33, -4.2, 1, 1); }, rgba(P.negro, 1));
  }
  var BANDADA = [[74, -72, 1.3, 0], [26, -44, 1.22, 0.17], [-20, -84, 1.26, 0.41], [-62, -34, 1.16, 0.63], [-110, -66, 1.2, 0.82]];
  A.patos = pieza({
    ancho: 0.34, alto: 0.13, abajo: 0,
    dibujar: function (ctx, s, k, op) {
      var fase = op.fase == null ? 0.2 : op.fase, cache = op.fase != null, L = 36;
      ctx.save(); espejo(ctx, op.dir || -1);
      for (var i = 0; i < BANDADA.length; i++) {
        var b = BANDADA[i], f = ((fase + b[3]) % 1 + 1) % 1, th = Math.cos(f * TAU) * 1.0, p = Math.sin(th + 0.1);
        ctx.save(); ctx.translate(b[0], b[1] - Math.cos(f * TAU) * 2); ctx.scale(b[2], b[2]);
        var pp = Math.abs(p) < 0.14 ? (p < 0 ? -0.14 : 0.14) : p;
        ctx.save(); ctx.translate(6, -5); ctx.scale(1, pp * 0.9);
        if (cache) poner(ctx, enCache('pato-ala|1', s, k, [-24, -L - 8, 12, 4], function (c) { pintarAlaPato(c, L, true); })); else pintarAlaPato(ctx, L, true);
        ctx.restore();
        if (cache) poner(ctx, enCache('pato-cuerpo', s, k, [-48, -12, 48, 10], pintarCuerpoPato)); else pintarCuerpoPato(ctx);
        ctx.save(); ctx.translate(1, -3); ctx.scale(1, pp);
        if (cache) poner(ctx, enCache('pato-ala|0', s, k, [-24, -L - 8, 12, 4], function (c) { pintarAlaPato(c, L, false); })); else pintarAlaPato(ctx, L, false);
        ctx.restore();
        ctx.restore();
      }
      ctx.restore();
    }
  });

  /* ---------- el cocodrilo del Nilo ----------
     Tumbado en la orilla con la boca entreabierta (así se calientan al sol), con las escamas de la espalda en filas, la
     doble cresta de la cola y las bandas oscuras. Con op.agua flota: solo asoman los ojos, el hocico y la cresta. Parpadea
     de vez en cuando (op.t). */
  function formaCuerpoCroco(k) {
    // el cuerpo, la cola y la mandíbula de abajo (la de arriba va aparte, entreabierta)
    k.moveTo(166, -6);
    k.bezierCurveTo(140, -6, 110, -6, 90, -12);
    k.bezierCurveTo(80, -24, 66, -30, 50, -34);
    k.bezierCurveTo(24, -41, -12, -41, -36, -36);
    k.bezierCurveTo(-70, -30, -120, -18, -186, -6);
    k.quadraticCurveTo(-190, -3, -186, -1);
    k.bezierCurveTo(-120, -2, -70, 0, -40, 0);
    k.lineTo(50, 0);
    k.bezierCurveTo(70, 0, 80, -2, 96, -2);
    k.bezierCurveTo(130, -2, 152, -1, 166, -2);
    k.quadraticCurveTo(170, -4, 166, -6);
    k.closePath();
  }
  function formaCabezaCroco(k) {   // el cráneo y la mandíbula de arriba; gira sobre la bisagra (88, -14)
    k.moveTo(86, -12);
    k.bezierCurveTo(88, -27, 96, -32, 106, -32);
    k.bezierCurveTo(116, -32, 122, -25, 132, -22);
    k.bezierCurveTo(148, -19, 162, -19, 168, -14);
    k.quadraticCurveTo(173, -9, 168, -7);
    k.bezierCurveTo(150, -8, 120, -9, 86, -12);
    k.closePath();
  }
  function pintarCroco(k, bocaAbierta) {
    var i, gradC = ES.lin(k, 0, -42, 0, 0, [[0, cla(CA.croco, 0.12)], [0.55, CA.croco], [0.8, mez(CA.croco, CA.crocoVientre, 0.5)], [1, CA.crocoVientre]]);
    // las patas del otro lado, más oscuras
    k.beginPath(); tiraPor(k, [40, -18, 9, 50, -8, 7, 58, -1, 6]); tiraPor(k, [-46, -20, 11, -30, -10, 9, -48, -1, 7]);
    k.fillStyle = rgba(osc(CA.croco, 0.35), 1); k.fill();
    // la boca por dentro, clara, entre las dos mandíbulas
    relleno(k, function (c) { c.moveTo(88, -12); c.lineTo(166, -7); c.lineTo(166, -4); c.bezierCurveTo(140, -4, 110, -6, 88, -9); c.closePath(); }, rgba(mez(P.pielM, P.lino, 0.4), 1));
    relleno(k, formaCuerpoCroco, gradC);
    luz(k, formaCuerpoCroco, 0, -44, 0, -26, 0.3, CA.crocoLuz);
    // las bandas oscuras de la cola y del lomo
    k.save(); k.beginPath(); formaCuerpoCroco(k); k.clip();
    var bandas = new Path2D();
    for (i = 0; i < 9; i++) { var x = 30 - i * 24, w = 9 - i * 0.4; bandas.moveTo(x, -50); bandas.lineTo(x + w, -50); bandas.lineTo(x + w * 0.6 - 4, 2); bandas.lineTo(x - 4, 2); bandas.closePath(); }
    k.fillStyle = rgba(CA.crocoOsc, 0.32); k.fill(bandas);
    // la línea clara del costado
    k.beginPath(); k.moveTo(80, -10); k.bezierCurveTo(40, -16, -40, -14, -180, -4); k.strokeStyle = rgba(CA.crocoLuz, 0.35); k.lineWidth = 2; k.stroke();
    k.restore();
    // las escamas de la espalda (dos filas de bultos) y la doble cresta de la cola
    var cresta = new Path2D(), luces = new Path2D();
    for (i = 0; i < 16; i++) {
      var u = i / 15, px = 66 - u * 106, py = -33 - Math.sin(u * PI) * 7 - 1;
      cresta.moveTo(px - 3.4, py + 2.4); cresta.quadraticCurveTo(px, py - 4.6, px + 3.4, py + 2.4); cresta.closePath();
      luces.moveTo(px - 1.6, py + 0.5); luces.quadraticCurveTo(px - 0.4, py - 2.5, px + 0.8, py + 0.2);
    }
    for (i = 0; i < 18; i++) {
      var v = i / 17, cx = -44 - v * 136, cy = -35 + v * 28, hh = 7 - v * 4.5;
      cresta.moveTo(cx - 4, cy + 1.5); cresta.lineTo(cx, cy - hh); cresta.lineTo(cx + 3.4, cy + 1.5); cresta.closePath();
    }
    k.fillStyle = ES.lin(k, 0, -48, 0, -28, [[0, CA.crocoOsc], [1, CA.croco]]); k.fill(cresta);
    k.strokeStyle = rgba(CA.crocoLuz, 0.5); k.lineWidth = 0.9; k.stroke(luces);
    // las patas de este lado: la de delante, con los dedos abiertos, y la de atrás, plegada
    var patas = function (c) { tiraPor(c, [60, -20, 12, 70, -9, 9, 76, -1, 7]); tiraPor(c, [-30, -24, 15, -8, -15, 11, -22, -2, 8]); };
    relleno(k, patas, ES.lin(k, 0, -24, 0, 0, [[0, CA.croco], [1, osc(CA.croco, 0.25)]]));
    k.beginPath();
    for (i = 0; i < 4; i++) { k.moveTo(76, -1); k.lineTo(78 + i * 4, 0.6); }
    for (i = 0; i < 3; i++) { k.moveTo(-22, -1); k.lineTo(-30 - i * 5, 0.6); }
    k.strokeStyle = rgba(osc(CA.croco, 0.3), 1); k.lineWidth = 2.2; k.lineCap = 'round'; k.stroke();
    // la cabeza, entreabierta
    // los dientes de abajo, que asoman
    k.beginPath(); for (i = 0; i < 8; i++) { var dx2 = 104 + i * 7.6; k.moveTo(dx2, -5.6); k.lineTo(dx2 + 1.6, -9.4); k.lineTo(dx2 + 3.2, -5.6); }
    k.fillStyle = rgba(P.lino, 1); k.fill();
    k.save(); k.translate(88, -14); k.rotate(bocaAbierta ? -0.13 : -0.02); k.translate(-88, 14);
    relleno(k, formaCabezaCroco, ES.lin(k, 0, -32, 0, -6, [[0, cla(CA.croco, 0.15)], [0.7, CA.croco], [1, mez(CA.croco, CA.crocoVientre, 0.4)]]));
    // los dientes de arriba
    k.beginPath(); for (i = 0; i < 9; i++) { var tx = 100 + i * 7.4; k.moveTo(tx, -9.2 + i * 0.25); k.lineTo(tx + 1.6, -4.6 + i * 0.3); k.lineTo(tx + 3.2, -9 + i * 0.25); }
    k.fillStyle = rgba(P.lino, 1); k.fill();
    // el ojo sobre su órbita alta, con la pupila de rendija, y la nariz en la punta
    relleno(k, function (c) { elipse(c, 106, -28, 7, 4.6, -0.1); }, ES.lin(k, 100, -32, 112, -24, [[0, cla(CA.croco, 0.2)], [1, CA.croco]]));
    relleno(k, function (c) { elipse(c, 107, -28.6, 3.6, 2.6); }, ES.rad(k, 106, -29.5, 0, 3.6, [[0, mez(P.oro1, P.verde, 0.2)], [1, mez(P.oro3, P.verde, 0.3)]]));
    relleno(k, function (c) { elipse(c, 107.6, -28.6, 0.7, 2.2); }, rgba(P.negro, 1));
    relleno(k, function (c) { elipse(c, 162, -15, 3.4, 2.2); }, rgba(CA.crocoOsc, 0.7));
    k.restore();
  }
  function pintarParpadoCroco(k, bocaAbierta) {
    k.save(); k.translate(88, -14); k.rotate(bocaAbierta ? -0.13 : -0.02); k.translate(-88, 14);
    relleno(k, function (c) { elipse(c, 107, -28.6, 4, 3); }, ES.lin(k, 103, -32, 111, -25, [[0, cla(CA.croco, 0.25)], [1, CA.croco]]));
    k.restore();
  }
  // el parpadeo: de vez en cuando (según la semilla), 160 ms
  function parpadeo(sem, t) { var P0 = 3800 + U._h(sem * 7.7) * 3000, tt = ((t + sem * 977) % P0 + P0) % P0; return tt < 160; }
  A.cocodrilo = pieza({
    ancho: 0.4, alto: 0.05, abajo: 0.09,
    dibujar: function (ctx, s, k, op) {
      var agua = !!op.agua, anim = op.t != null, t = op.t || 0, sem = op.semilla || 1;
      ctx.save(); espejo(ctx, op.dir || 1);
      // en el agua: la cabeza un poco levantada y todo hundido salvo los ojos, el hocico y la cresta
      var pose = function (c) { if (agua) { c.translate(0, 26); c.translate(106, -28); c.rotate(-0.2); c.translate(-106, 28); } };
      var caja = agua ? [-196, -60, 180, 70] : [-196, -50, 180, 4];
      var pinta = function (c) { c.save(); pose(c); pintarCroco(c, !agua); c.restore(); };
      if (agua) {
        var bob = anim ? Math.sin(t * 0.0012 + sem) * 1.6 : 0;
        var cc = enCache('croco|agua', s, k, caja, pinta);
        ponerFlotando(ctx, cc, enCacheAgua(cc, 'croco|agua', s, k, 0), bob, 0, 0, 0, !anim);
        ondas(ctx, 70, 168, t, 0.8);
        if (anim && parpadeo(sem, t)) { ctx.save(); ctx.translate(0, bob); pose(ctx); pintarParpadoCroco(ctx, false); ctx.restore(); }
      } else {
        if (anim) poner(ctx, enCache('croco|orilla', s, k, caja, pinta)); else pinta(ctx);
        if (anim && parpadeo(sem, t)) pintarParpadoCroco(ctx, true);
      }
      ctx.restore();
    }
  });

  /* ---------- el hipopótamo ----------
     En el agua asoma la cabeza (los ojos, las orejas y la nariz arriba, como un periscopio) y el lomo; mueve las orejas y
     de vez en cuando resopla (op.t). Con op.fayenza es el hipopótamo de fayenza azul turquesa del Imperio Medio, el
     «William» del Met (Meir, h. 1961-1878 a. C.), con los lotos (flores, capullos y hojas) pintados en negro encima.
     Con op.agua = false, de pie y entero, como la figurilla. */
  function formaHipo(k) {
    k.moveTo(-100, -44);
    k.bezierCurveTo(-102, -72, -74, -92, -40, -94);
    k.bezierCurveTo(-8, -96, 16, -92, 32, -86);
    k.bezierCurveTo(38, -91, 44, -95, 50, -95);
    k.bezierCurveTo(53, -107, 70, -108, 74, -96);
    k.bezierCurveTo(80, -90, 90, -89, 97, -91);
    k.bezierCurveTo(100, -101, 112, -101, 115, -91);
    k.bezierCurveTo(129, -85, 132, -61, 126, -45);
    k.bezierCurveTo(123, -33, 113, -26, 98, -26);
    k.bezierCurveTo(84, -26, 72, -28, 60, -30);
    k.bezierCurveTo(48, -28, 40, -24, 34, -22);
    k.lineTo(34, -2); k.quadraticCurveTo(34, 0, 30, 0); k.lineTo(12, 0); k.quadraticCurveTo(9, 0, 9, -3); k.lineTo(9, -18);
    k.bezierCurveTo(-10, -16, -30, -16, -50, -18);
    k.lineTo(-50, -3); k.quadraticCurveTo(-50, 0, -54, 0); k.lineTo(-72, 0); k.quadraticCurveTo(-76, 0, -76, -3); k.lineTo(-76, -22);
    k.bezierCurveTo(-90, -26, -100, -32, -100, -44);
    k.closePath();
  }
  function pintarOrejaHipo(k, col, colIn) {   // la oreja en el origen, hacia arriba
    relleno(k, function (c) { c.moveTo(-3.4, 1); c.bezierCurveTo(-4.6, -6, -2, -10, 0, -10); c.bezierCurveTo(2, -10, 4.6, -6, 3.4, 1); c.closePath(); }, rgba(col, 1));
    relleno(k, function (c) { c.moveTo(-1.6, 0); c.bezierCurveTo(-2.4, -5, -1, -7.4, 0, -7.4); c.bezierCurveTo(1, -7.4, 2.4, -5, 1.6, 0); c.closePath(); }, rgba(colIn, 1));
  }
  // los lotos de William, en línea negra: flores en abanico, capullos y hojas redondas
  function lotosPintados(k) {
    var p = new Path2D();
    function giro(x, y, a) { var ca = Math.cos(a), sa = Math.sin(a); return function (px, py) { return [x + px * ca - py * sa, y + px * sa + py * ca]; }; }
    function petalo(q, a, L, w) {
      var b = q(0, 0), t = q(Math.cos(a) * L, Math.sin(a) * L), n = [-Math.sin(a), Math.cos(a)];
      var m1 = q(Math.cos(a) * L * 0.5 + n[0] * w, Math.sin(a) * L * 0.5 + n[1] * w), m2 = q(Math.cos(a) * L * 0.5 - n[0] * w, Math.sin(a) * L * 0.5 - n[1] * w);
      p.moveTo(b[0], b[1]); p.quadraticCurveTo(m1[0], m1[1], t[0], t[1]); p.quadraticCurveTo(m2[0], m2[1], b[0], b[1]);
    }
    // la flor abierta: tres pétalos en abanico y dos sépalos, con su tallo
    function flor(x, y, h, a) {
      var q = giro(x, y, a);
      petalo(q, -PI / 2, h, h * 0.2); petalo(q, -PI / 2 - 0.42, h * 0.92, h * 0.18); petalo(q, -PI / 2 + 0.42, h * 0.92, h * 0.18);
      petalo(q, -PI / 2 - 0.95, h * 0.62, h * 0.14); petalo(q, -PI / 2 + 0.95, h * 0.62, h * 0.14);
      var b = q(0, 0), c1 = q(h * 0.2, h * 0.8), t = q(-h * 0.1, h * 1.6); p.moveTo(b[0], b[1]); p.quadraticCurveTo(c1[0], c1[1], t[0], t[1]);
    }
    function capullo(x, y, h, a) {
      var q = giro(x, y, a), b = q(0, 0), t = q(0, -h), l = q(-h * 0.38, -h * 0.42), r = q(h * 0.38, -h * 0.42), c1 = q(-h * 0.15, h * 0.7), tal = q(h * 0.1, h * 1.4);
      p.moveTo(b[0], b[1]); p.quadraticCurveTo(l[0], l[1], t[0], t[1]); p.quadraticCurveTo(r[0], r[1], b[0], b[1]);
      var s1 = q(-h * 0.16, -h * 0.5); p.moveTo(b[0], b[1]); p.quadraticCurveTo(q(-h * 0.05, -h * 0.25)[0], q(-h * 0.05, -h * 0.25)[1], s1[0], s1[1]);
      p.moveTo(b[0], b[1]); p.quadraticCurveTo(c1[0], c1[1], tal[0], tal[1]);
    }
    function hojaR(x, y, r) {
      p.moveTo(x, y); p.lineTo(x + Math.cos(-0.35) * r, y + Math.sin(-0.35) * r * 0.75); p.ellipse(x, y, r, r * 0.75, 0, -0.35, -PI * 2 + 0.35, true); p.closePath();
      p.moveTo(x, y); p.lineTo(x - r * 0.8, y - r * 0.1); p.moveTo(x, y); p.lineTo(x - r * 0.3, y + r * 0.6); p.moveTo(x, y); p.lineTo(x - r * 0.3, y - r * 0.62);
    }
    flor(-46, -74, 15, -0.12); flor(4, -78, 14, 0.1); flor(-80, -54, 11, -0.45); flor(50, -66, 11, 0.32);
    capullo(-20, -64, 11, -0.25); capullo(28, -64, 10, 0.2); capullo(-66, -78, 9, -0.25);
    hojaR(-30, -40, 7); hojaR(20, -42, 6.5); hojaR(-86, -36, 5.5); hojaR(56, -44, 5);
    k.save(); k.beginPath(); formaHipo(k); k.clip();
    k.strokeStyle = rgba(P.negro, 0.82); k.lineWidth = 1.3; k.lineCap = 'round'; k.lineJoin = 'round'; k.stroke(p);
    k.restore();
  }
  function pintarHipo(k, fay) {
    var base = fay ? CA.fayenza : CA.hipo, luzC = fay ? CA.fayenzaLuz : CA.hipoLuz, oscC = fay ? CA.fayenzaOsc : CA.hipoOsc;
    // la oreja de atrás
    k.save(); k.translate(43, -94); k.rotate(-0.4); pintarOrejaHipo(k, osc(base, 0.25), fay ? osc(base, 0.4) : mez(CA.hipoRosa, base, 0.5)); k.restore();
    relleno(k, formaHipo, ES.lin(k, 0, -100, 0, 0, [[0, luzC], [0.42, base], [1, oscC]]));
    // el morro, más claro y rosado en el de verdad; la boca larga; la papada
    if (!fay) relleno(k, function (c) { c.moveTo(94, -90); c.bezierCurveTo(120, -88, 132, -62, 126, -45); c.bezierCurveTo(123, -33, 113, -26, 98, -26); c.bezierCurveTo(86, -26, 80, -36, 82, -52); c.closePath(); }, ES.lin(k, 90, -84, 118, -30, [[0, mez(base, CA.hipoRosa, 0.12)], [1, mez(base, CA.hipoRosa, 0.55)]]));
    k.beginPath(); k.moveTo(126, -46); k.bezierCurveTo(114, -41, 96, -40, 78, -45); k.strokeStyle = rgba(oscC, 0.75); k.lineWidth = 1.8; k.lineCap = 'round'; k.stroke();
    k.beginPath(); k.moveTo(40, -40); k.quadraticCurveTo(56, -36, 66, -44); k.strokeStyle = rgba(oscC, 0.35); k.lineWidth = 1.4; k.stroke();
    // la nariz sobre su bulto, el ojo sobre el suyo (con el párpado) y la oreja
    relleno(k, function (c) { elipse(c, 108, -96.5, 4.4, 2.2, 0.3); }, rgba(fay ? P.negro : oscC, 0.9));
    relleno(k, function (c) { elipse(c, 63.4, -100, 5.6, 4.6); }, ES.lin(k, 58, -105, 70, -95, [[0, luzC], [1, base]]));
    relleno(k, function (c) { elipse(c, 64.4, -100, 2.7, 2.3); }, rgba(fay ? P.negro : mez(P.negro, P.oro4, 0.3), 1));
    if (!fay) relleno(k, function (c) { elipse(c, 63.8, -100.8, 0.8, 0.6); }, rgba(P.blanco, 0.8));
    k.beginPath(); k.moveTo(58.4, -102.6); k.quadraticCurveTo(64, -105.8, 69.4, -102.4); k.strokeStyle = rgba(oscC, 0.6); k.lineWidth = 1.1; k.stroke();
    if (fay) lotosPintados(k);
    // el brillo del vidriado (fayenza) o de la piel mojada
    luz(k, formaHipo, -40, -104, -30, -76, fay ? 0.55 : 0.32, P.blanco);
    luz(k, formaHipo, 62, -110, 68, -94, fay ? 0.45 : 0.25, P.blanco);
  }
  A.hipopotamo = pieza({
    ancho: 0.3, alto: 0.11, abajo: 0.075,
    dibujar: function (ctx, s, k, op) {
      var fay = !!op.fayenza, agua = op.agua !== false, anim = op.t != null, t = op.t || 0, sem = op.semilla || 1, i;
      var clave = 'hipo|' + (fay ? 'f' : 'n'), caja = [-104, -110, 134, 4];
      ctx.save(); espejo(ctx, op.dir || 1);
      // las orejas: cada pocos segundos, un sacudido rápido (dos idas y vueltas en un tercio de segundo)
      var PO = 2600 + U._h(sem * 5.1) * 1800, to = ((t + sem * 577) % PO + PO) % PO, oreja = anim && to < 340 ? Math.sin(to / 340 * PI * 4) * Math.sin(to / 340 * PI) : 0;
      function orejaDelante(c) { c.save(); c.translate(49, -95); c.rotate(-0.15 - oreja * 0.55); pintarOrejaHipo(c, fay ? osc(CA.fayenza, 0.12) : CA.hipo, fay ? osc(CA.fayenza, 0.4) : CA.hipoRosa); c.restore(); }
      if (!agua) {
        if (anim) poner(ctx, enCache(clave, s, k, caja, function (c) { pintarHipo(c, fay); })); else pintarHipo(ctx, fay);
        orejaDelante(ctx);
        ctx.restore(); return;
      }
      // en el agua: hundido hasta la mitad de la cabeza, y se mece un poco
      var hunde = 66, bob = anim ? Math.sin(t * 0.0011 + sem) * 1.8 : 0;
      var c0 = enCache(clave, s, k, caja, function (c) { pintarHipo(c, fay); });
      ponerFlotandoDesplazado(ctx, c0, enCacheAgua(c0, clave, s, k, -hunde), hunde + bob);
      ctx.save(); ctx.translate(0, hunde + bob); orejaDelante(ctx); ctx.restore();
      ondas(ctx, -66, 124, t, 0.8);
      // el resoplido: cada pocos segundos, un chorro de gotas y vaho desde la nariz (op.resoplido, de 0 a 1, lo fuerza)
      if (anim || op.resoplido != null) {
        var P0 = 5200 + U._h(sem * 3.3) * 2600, tt = op.resoplido != null ? U.clamp(op.resoplido, 0, 0.999) * 900 : ((t + sem * 1733) % P0 + P0) % P0;
        if (tt < 900) {
          var q = tt / 900, nx = 108, ny = -97 + hunde + bob, lista = [], r = U.azar((op.resoplido != null ? 3 : Math.floor((t + sem * 1733) / P0)) * 31 + 7);
          for (i = 0; i < 16; i++) { var vx = (r() - 0.35) * 34, vy = -26 - r() * 36, gy = ny + vy * q * 1.5 + 70 * q * q; if (gy < hunde * 0) lista.push([nx + vx * q * 1.5, gy, 1.2 + r() * 1.3]); }
          ctx.beginPath(); ctx.ellipse(nx + 6 * q, ny - 12 - 22 * q, 6 + 14 * q, 5 + 9 * q, 0, 0, TAU); ctx.fillStyle = rgba(P.lino, 0.5 * (1 - q) * Math.min(1, q * 6)); ctx.fill();
          gotas(ctx, lista, 0.95 * (1 - q * 0.8));
          anillo(ctx, nx, 6 + 26 * q, 0.6 * (1 - q));
        }
      }
      ctx.restore();
    }
  });
  // una caché metida en el agua hasta «hunde» mu: por encima de la superficie tal cual, por debajo velada
  function ponerFlotandoDesplazado(ctx, c, cAgua, hunde) {
    ctx.save(); ctx.translate(0, hunde);
    var x0 = c.x0 - 10, w = c.w + 20;
    ctx.save(); ctx.beginPath(); ctx.rect(x0, c.y0 - 10, w, -hunde - (c.y0 - 10)); ctx.clip(); poner(ctx, c); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(x0, -hunde, w, c.y0 + c.h + 10 + hunde); ctx.clip(); ctx.globalAlpha *= 0.62; poner(ctx, cAgua); ctx.restore();
    ctx.restore();
  }

  /* ---------- la tilapia del Nilo ----------
     El pez «inet», símbolo de renacer (incuba los huevos en la boca y los alevines «renacen» de ella): alta de cuerpo,
     gris azulada con bandas, la aleta dorsal larga de radios espinosos, la cola con rayas y los bordes rojizos. Salta
     del agua describiendo un arco: op.k va de 0 (sale) a 1 (vuelve a entrar). El ancla es el centro del salto en la
     superficie. */
  function pintarTilapia(k) {
    // las aletas de atrás: dorsal, anal y cola
    var dorsal = function (c) { c.moveTo(14, -11); c.bezierCurveTo(8, -19, -6, -21, -18, -19); c.quadraticCurveTo(-26, -16, -22, -6); c.lineTo(10, -10); c.closePath(); };
    var cola = function (c) { c.moveTo(-21, -5); c.lineTo(-34, -13); c.quadraticCurveTo(-37, 0, -34, 13); c.lineTo(-21, 5); c.closePath(); };
    var anal = function (c) { c.moveTo(-4, 10); c.quadraticCurveTo(-14, 19, -22, 15); c.lineTo(-18, 5); c.closePath(); };
    var gAl = ES.lin(k, 0, -20, 0, 20, [[0, mez(CA.pez, CA.pezAleta, 0.45)], [0.5, mez(CA.pez, P.lino2, 0.3)], [1, mez(CA.pez, CA.pezAleta, 0.45)]]);
    relleno(k, function (c) { dorsal(c); cola(c); anal(c); }, gAl);
    k.save(); k.beginPath(); dorsal(k); cola(k); anal(k); k.clip();
    k.beginPath();
    for (var i = 0; i < 8; i++) { var x = 12 - i * 4.2; k.moveTo(x, -10); k.lineTo(x - 3, -20); }
    for (i = 0; i < 6; i++) { var y = -10 + i * 4; k.moveTo(-21, y * 0.45); k.lineTo(-35, y); }
    k.strokeStyle = rgba(osc(CA.pez, 0.3), 0.45); k.lineWidth = 0.9; k.stroke();
    k.beginPath(); k.moveTo(14, -12); k.bezierCurveTo(8, -20, -6, -22, -19, -20); k.moveTo(-34, -13); k.quadraticCurveTo(-37.5, 0, -34, 13);
    k.strokeStyle = rgba(CA.pezAleta, 0.8); k.lineWidth = 2; k.stroke();
    k.restore();
    // el cuerpo alto, con el lomo azulado y el vientre plateado, y las bandas
    var cuerpo = function (c) { c.moveTo(28, 1); c.bezierCurveTo(26, -8, 18, -13, 2, -13); c.bezierCurveTo(-12, -13, -20, -8, -22, -4); c.lineTo(-22, 4); c.bezierCurveTo(-18, 9, -6, 13, 6, 12); c.bezierCurveTo(18, 11, 26, 7, 28, 1); c.closePath(); };
    relleno(k, cuerpo, ES.lin(k, 0, -13, 0, 12, [[0, osc(CA.pez, 0.15)], [0.45, CA.pez], [0.75, CA.pezLuz], [1, P.lino]]));
    k.save(); k.beginPath(); cuerpo(k); k.clip();
    k.beginPath(); for (i = 0; i < 6; i++) { var bx = 12 - i * 6.2; k.moveTo(bx, -14); k.lineTo(bx - 2, 8); }
    k.strokeStyle = rgba(osc(CA.pez, 0.35), 0.28); k.lineWidth = 2.6; k.lineCap = 'butt'; k.stroke();
    // las escamas: una trama fina
    k.beginPath(); for (i = 0; i < 7; i++) for (var j = 0; j < 4; j++) { var ex = 14 - i * 5.4, ey = -8 + j * 5 + (i % 2) * 2.5; k.moveTo(ex - 2.4, ey); k.quadraticCurveTo(ex, ey + 2.4, ex + 2.4, ey); }
    k.strokeStyle = rgba(cla(CA.pez, 0.5), 0.35); k.lineWidth = 0.7; k.stroke();
    k.restore();
    luz(k, cuerpo, 8, -14, 10, -4, 0.4, P.blanco);
    // el opérculo con su mancha, la aleta pectoral, el ojo y la boca
    k.beginPath(); k.moveTo(16, -9); k.quadraticCurveTo(11, 0, 16, 9); k.strokeStyle = rgba(osc(CA.pez, 0.25), 0.6); k.lineWidth = 1.1; k.stroke();
    relleno(k, function (c) { elipse(c, 13.5, -4, 1.8, 1.6); }, rgba(P.negro, 0.6));
    relleno(k, function (c) { c.moveTo(12, 2); c.quadraticCurveTo(2, 2, -2, 8); c.quadraticCurveTo(6, 8, 12, 4); c.closePath(); }, rgba(mez(CA.pezLuz, CA.pezAleta, 0.35), 0.85));
    relleno(k, function (c) { elipse(c, 21, -3.5, 2.8, 2.8); }, ES.rad(k, 20.5, -4, 0, 3, [[0, P.oro1], [1, P.oro3]]));
    relleno(k, function (c) { elipse(c, 21.3, -3.5, 1.5, 1.5); }, rgba(P.negro, 1));
    relleno(k, function (c) { elipse(c, 20.8, -4.1, 0.5, 0.5); }, rgba(P.blanco, 0.9));
    k.beginPath(); k.moveTo(28, 1.5); k.lineTo(25, 2.2); k.strokeStyle = rgba(osc(CA.pez, 0.4), 0.8); k.lineWidth = 1; k.stroke();
  }
  A.pez = pieza({
    ancho: 0.18, alto: 0.1, abajo: 0.045,
    dibujar: function (ctx, s, k, op) {
      var q = op.k == null ? 0.5 : U.clamp(op.k, 0, 1), H = 78, X = 62, sem = op.semilla || 1;
      var x = -X + 2 * X * q, y = 10 - 4 * H * q * (1 - q), dx = 2 * X, dy = -4 * H * (1 - 2 * q), ang = Math.atan2(dy, dx);
      ctx.save(); espejo(ctx, op.dir || 1);
      var c = enCache('tilapia', s, k, [-38, -24, 31, 20], pintarTilapia), cA = enCacheAgua(c, 'tilapia', s, k);
      // por encima del agua, tal cual; por debajo, velado
      ctx.save(); ctx.beginPath(); ctx.rect(-130, -120, 260, 120); ctx.clip();
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); poner(ctx, c); ctx.restore(); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(-130, 0, 260, 40); ctx.clip(); ctx.globalAlpha *= 0.55;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang); poner(ctx, cA); ctx.restore(); ctx.restore();
      // las salpicaduras al salir y al entrar
      var r = U.azar(sem * 13 + 1), lista = [], i, se, sx;
      for (var lado = 0; lado < 2; lado++) {
        se = lado ? U.tramo(q, 0.86, 1) : U.tramo(q, 0, 0.2); sx = lado ? X - 4 : -X + 4;
        if (se <= 0 || se >= 1) { if (lado ? q >= 0.86 : q <= 0.2) {} }
        if (se > 0 && se < 1) {
          for (i = 0; i < 13; i++) { var vx = (r() - 0.5) * 40 + (lado ? 10 : -10), vy = -20 - r() * 32, gy = vy * se + 38 * se * se; if (gy < 0) lista.push([sx + vx * se, gy, 1.3 + r() * 1.3]); }
          anillo(ctx, sx, 5 + 26 * se, 0.8 * (1 - se)); anillo(ctx, sx, 2 + 13 * se, 0.6 * (1 - se));
          ctx.beginPath(); ctx.ellipse(sx, 0.5, 9 * (1 - se * 0.5), 2.4, 0, PI, TAU); ctx.fillStyle = rgba(P.lino, 0.7 * (1 - se)); ctx.fill();
        }
      }
      gotas(ctx, lista, 0.85);
      ctx.restore();
    }
  });

  /* ---------- el escarabajo pelotero ----------
     Jepri, el sol de la mañana: un escarabajo negro azulado que empuja su bola de estiércol hacia atrás, con la cabeza
     abajo y las patas de atrás sobre la bola. De vez en cuando se sube a la bola y da una vuelta encima (así se orientan
     de verdad, mirando el cielo) y sigue empujando hacia el otro lado. Muy pequeño: unos 0,03 u. */
  var BOLA = 7;
  function pintarBola(k, giro) {
    relleno(k, function (c) { elipse(c, 0, 0, BOLA, BOLA); }, ES.rad(k, -2.4, -2.6, 0.5, BOLA * 1.2, [[0, cla(CA.bola, 0.3)], [0.55, CA.bola], [1, osc(CA.bola, 0.4)]]));
    k.save(); k.beginPath(); k.arc(0, 0, BOLA, 0, TAU); k.clip(); k.rotate(giro);
    k.beginPath(); for (var i = 0; i < 6; i++) { var a = i * 1.7, rr = (i % 3) * 2.2 + 1.2; k.moveTo(Math.cos(a) * rr + 0.9, Math.sin(a) * rr); k.ellipse(Math.cos(a) * rr, Math.sin(a) * rr, 0.9, 0.6, a, 0, TAU); }
    k.fillStyle = rgba(osc(CA.bola, 0.45), 0.6); k.fill(); k.restore();
  }
  // el escarabajo de lado, empujando: el trasero contra la bola (a la derecha), la cabeza abajo a la izquierda; p = paso
  function pintarEscarabajo(k, p, sobre) {
    var a = p * TAU, i, sw = Math.sin(a), cw = Math.cos(a);
    k.save();
    // empujando: el cuerpo inclinado, la cabeza abajo y el trasero contra la bola; encima de la bola: de pie, plano
    if (!sobre) { k.translate(-BOLA - 5.4, -4.2); k.rotate(-0.62); } else { k.translate(0, -BOLA - 4.4); }
    var negro = rgba(P.negro, 1), patas = new Path2D();
    if (!sobre) {
      // las de delante y las de en medio, en el suelo (dan pasitos); las de atrás, largas, sobre la bola
      patas.moveTo(-5, 2); patas.lineTo(-7.6 + sw * 1.2, 5.6); patas.lineTo(-10.4 + sw * 1.2, 6.4);
      patas.moveTo(-1, 2.6); patas.lineTo(-2.2 - sw * 1.2, 6.6); patas.lineTo(-3.6 - sw * 1.2, 8.6);
      patas.moveTo(4, -1.8); patas.lineTo(7.8, -5.6 + cw * 0.8); patas.lineTo(10.4, -3.6 + cw * 0.8);
      patas.moveTo(5, 1.6); patas.lineTo(9.6, 0.4 - cw * 0.8); patas.lineTo(11.4, 3 - cw * 0.8);
    } else {
      for (i = 0; i < 3; i++) { var lx = -4 + i * 4, s2 = Math.sin(a + i * 2) * 1.2; patas.moveTo(lx, 2); patas.lineTo(lx - 1.6 + s2, 4.4); patas.lineTo(lx - 1 + s2, 5.6); }
    }
    k.strokeStyle = negro; k.lineWidth = 1.25; k.lineCap = 'round'; k.lineJoin = 'round'; k.stroke(patas);
    // el cuerpo: los élitros redondos, el pronoto ancho y la cabeza en pala con sus dientes
    var cuerpo = function (c) {
      elipse(c, 2, -0.2, 5.8, 4.4, 0);
      elipse(c, -3.8, 0.2, 3.6, 3.5, 0);
      c.moveTo(-6, -1.8); c.lineTo(-8.6, -2); c.lineTo(-8.2, -1); c.lineTo(-9.2, -0.2); c.lineTo(-8.4, 0.6); c.lineTo(-9.2, 1.4); c.lineTo(-8, 2.2); c.lineTo(-5.6, 2.6); c.closePath();
    };
    relleno(k, cuerpo, ES.negro(k, -8, -4.6, 6, 4.4));
    // la línea entre los élitros y los reflejos azulados del lomo
    k.beginPath(); k.moveTo(-0.6, -4); k.quadraticCurveTo(-0.9, 0, -0.6, 4); k.strokeStyle = rgba(P.negro, 0.9); k.lineWidth = 0.5; k.stroke();
    k.beginPath(); k.moveTo(-0.2, -3.4); k.bezierCurveTo(2.4, -4.6, 5.6, -3.8, 7, -1.4); k.moveTo(-6, -2.2); k.quadraticCurveTo(-4.4, -3.6, -2.4, -3);
    k.strokeStyle = rgba([150, 178, 225], 0.8); k.lineWidth = 0.75; k.stroke();
    k.restore();
  }
  // el plan: empuja hacia la derecha, se sube a la bola y se orienta, baja por el otro lado y empuja hacia la izquierda…
  var EMPUJA = 5200, SUBE = 1800, RECORRIDO = 56;
  function estadoEscarabajo(t, sem) {
    var T = (EMPUJA + SUBE) * 2, tt = ((t + sem * 911) % T + T) % T, lado = tt < EMPUJA + SUBE ? 1 : -1, u = tt % (EMPUJA + SUBE);
    var x0 = lado > 0 ? -RECORRIDO : RECORRIDO, st = { dir: lado, sobre: false, p: 0, x: x0, giro: 0, salto: 0 };
    if (u < EMPUJA) {
      // a tirones: avanza, se para un poco, avanza
      var e = u / EMPUJA, av = e + Math.sin(e * TAU * 4) * 0.025;
      st.x = x0 + lado * 2 * RECORRIDO * U.clamp(av, 0, 1); st.p = u / 420; st.giro = lado * (st.x - x0) * lado / BOLA;
    } else {
      st.x = x0 + lado * 2 * RECORRIDO; st.giro = 2 * RECORRIDO / BOLA;
      var v = (u - EMPUJA) / SUBE; st.sobre = v > 0.2 && v < 0.85; st.salto = v; st.p = u / 300;
      if (v > 0.5) st.dir = -lado;   // ya se ha dado la vuelta encima de la bola
    }
    return st;
  }
  A.escarabajo = pieza({
    ancho: 0.15, alto: 0.03, abajo: 0.003,
    dibujar: function (ctx, s, k, op) {
      var st = op.t == null ? { dir: op.dir || 1, sobre: false, p: 0, x: 0, giro: 0 } : estadoEscarabajo(op.t, op.semilla || 1);
      ctx.save(); ctx.translate(st.x, -BOLA);
      pintarBola(ctx, st.giro);
      espejo(ctx, st.dir);
      pintarEscarabajo(ctx, st.p, st.sobre);
      ctx.restore();
    }
  });

  /* ================================================================== LAS FIGURAS
     De perfil al modo egipcio: la cabeza y las piernas de perfil, los hombros de frente y el ojo de frente, con su raya de
     kohl. Miran a la izquierda. Unidades: 100 = del pie a la coronilla (se escalan con la H de figuraEn, en mu), con las
     proporciones del canon: la cabeza, un octavo; los hombros en 80; la cintura en 57; las rodillas en 28. */
  var CF = {
    piel: P.piel, pielS: P.piel2, pielM: P.pielM, pielMS: mez(P.pielM, P.piel2, 0.45),
    pelucaDios: mez(P.egipcio, P.lino, 0.42), pelucaDiosS: mez(P.egipcio, P.lapis, 0.3),
    lino: P.lino, linoS: P.lino2, cara: mez(P.lino, P.lino2, 0.2)
  };
  // un brazo de dos tramos del hombro a la mano; el codo, de las dos soluciones, la de abajo (o la de arriba si se pide)
  function ikBrazo(sx, sy, hx, hy, l1, l2, arriba) {
    var dx = hx - sx, dy = hy - sy, d = Math.min(Math.sqrt(dx * dx + dy * dy), l1 + l2 - 0.05), a = Math.atan2(dy, dx);
    var b = Math.acos(U.clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
    var s = (Math.sin(a + b) > Math.sin(a - b)) !== !!arriba ? 1 : -1;
    return [sx, sy, sx + Math.cos(a + s * b) * l1, sy + Math.sin(a + s * b) * l1, sx + Math.cos(a) * d, sy + Math.sin(a) * d];
  }
  // el brazo como forma: adelgaza del hombro a la muñeca, y la mano cerrada al final
  function formaBrazo(k, b, g) {
    g = g || 1;
    tiraPor(k, [b[0], b[1], 6.4 * g, b[2], b[3], 4.4 * g, b[4], b[5], 3.4 * g]);
    var dx = b[4] - b[2], dy = b[5] - b[3], d = Math.sqrt(dx * dx + dy * dy) || 1;
    elipse(k, b[4] + dx / d * 1.8 * g, b[5] + dy / d * 1.8 * g, 2.9 * g, 2.3 * g, Math.atan2(dy, dx));
  }
  function pintarBrazo(k, b, estilo, g) { k.beginPath(); formaBrazo(k, b, g); k.fillStyle = estilo; k.fill(); }
  // la cabeza humana de perfil, con el cuello; peluca: 'corta', 'larga' (de mujer, con la cinta) o 'nada'
  function cabezaHumana(k, peluca, mujer) {
    var piel = mujer ? CF.pielM : CF.piel, pielS = mujer ? CF.pielMS : CF.pielS;
    if (peluca === 'larga') relleno(k, function (c) { c.moveTo(-4.6, -97.6); c.bezierCurveTo(-3, -102.4, 6.6, -102.8, 8.8, -96.6); c.bezierCurveTo(10.2, -90, 10.4, -80, 10, -72.6); c.lineTo(2.4, -72.6); c.lineTo(1.4, -86); c.closePath(); }, ES.negro(k, -2, -102, 10, -72));
    relleno(k, function (c) { c.moveTo(-3.4, -88); c.lineTo(3, -88); c.lineTo(3.6, -79.6); c.lineTo(-3.8, -79.6); c.closePath(); }, ES.lin(k, -3, -88, 3, -80, [[0, piel], [1, pielS]]));
    var cara = function (c) {
      c.moveTo(2.4, -87.2); c.lineTo(-3.4, -87.2); c.quadraticCurveTo(-6, -87.4, -6.6, -88.6);
      c.quadraticCurveTo(-6.9, -89.5, -7.3, -89.8); c.quadraticCurveTo(-6.9, -90.3, -7.5, -90.8); c.lineTo(-7.4, -91.5);
      c.quadraticCurveTo(-8, -91.6, -8.6, -92.4); c.quadraticCurveTo(-7.9, -93.5, -7, -94.5); c.quadraticCurveTo(-6.9, -95.7, -6.2, -97.1);
      c.bezierCurveTo(-3.8, -100.7, 4.8, -100.7, 6.6, -95.9); c.bezierCurveTo(7.4, -92.5, 6, -88.6, 2.4, -87.2); c.closePath();
    };
    relleno(k, cara, ES.lin(k, -8, -98, 5, -87, [[0, cla(piel, 0.14)], [0.6, piel], [1, pielS]]));
    if (peluca !== 'nada') {
      var pel = function (c) {
        c.moveTo(-6, -96.5); c.bezierCurveTo(-6.4, -100.9, 0, -102.7, 4.6, -101.5); c.bezierCurveTo(9.6, -100.1, 10.6, -93.1, 9.4, -87.7);
        c.lineTo(8.8, -84.7); c.lineTo(1.6, -85.5); c.quadraticCurveTo(1.2, -90.5, -1.8, -93.3); c.quadraticCurveTo(-4, -95.1, -6, -96.5); c.closePath();
      };
      relleno(k, pel, ES.negro(k, -4, -102, 9, -85));
      luz(k, pel, -3, -103, 3, -96, 0.4, [150, 172, 215]);
      if (peluca === 'larga') relleno(k, function (c) { c.moveTo(-5.4, -98.2); c.quadraticCurveTo(2, -100.6, 9.4, -97.6); c.lineTo(9.6, -96.2); c.quadraticCurveTo(2, -99, -5.6, -96.8); c.closePath(); }, rgba(P.turquesa, 1));
    } else relleno(k, function (c) { elipse(c, 1.6, -92.6, 1.3, 2); }, rgba(pielS, 1));
    // el ojo de frente con el kohl que se alarga hacia atrás y la ceja
    relleno(k, function (c) { c.moveTo(-6, -94.1); c.quadraticCurveTo(-4.5, -95.2, -3, -94.2); c.quadraticCurveTo(-4.5, -93.3, -6, -94.1); c.closePath(); }, rgba(P.lino, 1));
    relleno(k, function (c) { elipse(c, -4.7, -94.2, 0.72, 0.72); }, rgba(P.negro, 1));
    k.beginPath(); k.moveTo(-6.1, -94.2); k.quadraticCurveTo(-4.4, -95.5, -2.8, -94.3); k.lineTo(-0.6, -94.6); k.moveTo(-6.2, -96); k.quadraticCurveTo(-4.4, -97.1, -2, -96.2);
    k.strokeStyle = rgba(P.negro, 1); k.lineWidth = 0.5; k.lineCap = 'round'; k.stroke();
  }
  // la cabeza de un dios: la peluca tripartita azul lavanda con sus rayas y la cara de animal, 'halcon' (Ra-Horajti) o
  // 'ibis' (Thot), como en la referencia 4
  function cabezaDios(k, tipo) {
    var blanco = CF.cara;
    relleno(k, function (c) { c.moveTo(-3.2, -90); c.lineTo(3, -90); c.lineTo(3.6, -79.6); c.lineTo(-3.8, -79.6); c.closePath(); }, ES.lin(k, -3, -90, 3, -80, [[0, CF.piel], [1, CF.pielS]]));
    // la cabeza de los dioses pesa más (como en la referencia 4): un tercio más grande, sobre la base del cuello
    k.save(); k.translate(0, -82); k.scale(1.32, 1.32); k.translate(0, 82);
    var cara;
    if (tipo === 'ibis') {
      // el pico negro, largo y curvo
      k.beginPath(); tira(k, -5.6, -96.6, -17, -97.6, -26, -82.5, 3.4, 0.7, 14); k.fillStyle = ES.negro(k, -26, -98, -5, -82); k.fill();
      k.beginPath(); tira(k, -6.6, -97.4, -16.6, -98.4, -24.6, -85.2, 0.9, 0.2, 10); k.fillStyle = rgba([150, 170, 210], 0.45); k.fill();
      cara = function (c) { c.moveTo(1, -88); c.bezierCurveTo(-4, -89, -7.4, -94, -6.2, -97.6); c.bezierCurveTo(-5.2, -101, 0, -102, 2.4, -99.6); c.lineTo(2.6, -88); c.closePath(); };
    } else {
      cara = function (c) { c.moveTo(1, -87.6); c.bezierCurveTo(-4.6, -88.2, -7.6, -92, -7.4, -96.4); c.bezierCurveTo(-7, -100.6, -1.6, -102.4, 2.4, -100); c.lineTo(2.6, -87.6); c.closePath(); };
    }
    relleno(k, cara, ES.lin(k, -7, -101, 2, -88, [[0, P.blanco], [0.6, blanco], [1, CF.linoS]]));
    if (tipo !== 'ibis') {
      // el pico ganchudo, azulado; la cera clara; la bigotera oscura bajo el ojo
      relleno(k, function (c) { c.moveTo(-6.8, -98.2); c.quadraticCurveTo(-11.2, -98.6, -12.2, -94.4); c.quadraticCurveTo(-11.6, -93.2, -10.8, -93.6); c.quadraticCurveTo(-10.4, -95.2, -9, -95.4); c.lineTo(-6.8, -94.6); c.closePath(); }, ES.lin(k, -12, -98, -7, -94, [[0, mez(P.egipcio, P.negro2, 0.35)], [1, P.negro2]]));
      relleno(k, function (c) { elipse(c, -7.4, -97.2, 1.3, 1.1); }, rgba(P.oro2, 1));
      relleno(k, function (c) { c.moveTo(-3.6, -96); c.quadraticCurveTo(-5.4, -92.4, -3.2, -89.2); c.quadraticCurveTo(-2.2, -92.6, -2.2, -95.6); c.closePath(); }, ES.lin(k, -4, -96, -2, -89, [[0, P.negro2], [1, P.negro]]));
    }
    // el ojo
    var ex = tipo === 'ibis' ? -3.4 : -4.1, ey = tipo === 'ibis' ? -98 : -97.4;
    relleno(k, function (c) { elipse(c, ex, ey, 1.55, 1.4); }, rgba(tipo === 'ibis' ? P.lino2 : P.oro2, 1));
    relleno(k, function (c) { elipse(c, ex - 0.2, ey, 0.75, 0.75); }, rgba(P.negro, 1));
    relleno(k, function (c) { elipse(c, ex - 0.45, ey - 0.4, 0.28, 0.28); }, rgba(P.blanco, 0.9));
    // la peluca: la masa de detrás, que cae a la espalda, y la falda de delante sobre el hombro
    var pelAt = function (c) { c.moveTo(-1.8, -101.8); c.bezierCurveTo(5, -105.2, 13.4, -102.6, 13.6, -94.6); c.lineTo(13.4, -79.4); c.lineTo(4.4, -78.6); c.lineTo(3.4, -86.4); c.quadraticCurveTo(0.6, -92, -0.6, -96.6); c.quadraticCurveTo(-1.4, -99.6, -1.8, -101.8); c.closePath(); };
    var lapD = function (c) { c.moveTo(-2.6, -91.2); c.quadraticCurveTo(0.8, -92.8, 4, -91.2); c.lineTo(3.8, -77.2); c.lineTo(-3, -77.2); c.closePath(); };
    var grad = ES.lin(k, -2, -104, 12, -72, [[0, cla(CF.pelucaDios, 0.18)], [0.55, CF.pelucaDios], [1, CF.pelucaDiosS]]);
    relleno(k, pelAt, grad); relleno(k, lapD, grad);
    k.save(); k.beginPath(); pelAt(k); lapD(k); k.clip();
    k.beginPath(); for (var i = 0; i < 9; i++) { var y = -100 + i * 3.3; k.moveTo(-4, y); k.lineTo(14, y + 1.2); }
    k.strokeStyle = rgba(CF.pelucaDiosS, 0.6); k.lineWidth = 0.55; k.lineCap = 'butt'; k.stroke();
    k.fillStyle = ES.lin(k, -2, 0, 12, 0, [[0, P.blanco, 0.25], [0.4, P.blanco, 0], [1, CF.pelucaDiosS, 0.3]]); k.fillRect(-4, -105, 18, 34);
    k.restore();
    // los remates de oro de la peluca
    relleno(k, function (c) { c.moveTo(-3, -78.6); c.lineTo(3.8, -78.6); c.lineTo(3.8, -77); c.lineTo(-3, -77); c.closePath(); c.moveTo(4.4, -80.6); c.lineTo(13.4, -81.2); c.lineTo(13.4, -79.4); c.lineTo(4.4, -78.8); c.closePath(); }, ES.oro(k, 0, -82, 0, -77, 0.4));
    k.restore();
  }
  // el disco sobre la cabeza: 'sol' (cornalina, con el uraeus delante) o 'luna' (el disco con su creciente de oro)
  function disco(k, tipo) {
    var cx = 3.6, cy = -114.4, r = tipo === 'luna' ? 7.2 : 9.4;
    if (tipo === 'luna') cy = -112.6;
    if (tipo === 'luna') relleno(k, function (c) { c.moveTo(cx - 10.6, cy - 2); c.quadraticCurveTo(cx, cy + 17, cx + 10.6, cy - 2); c.quadraticCurveTo(cx, cy + 10.4, cx - 10.6, cy - 2); c.closePath(); }, ES.oro(k, cx - 10, cy, cx + 10, cy + 12, 0.35));
    ES.gema(k, cx, cy, r, P.cornalina, tipo !== 'luna');
    k.save(); k.beginPath(); k.arc(cx, cy, r, 0, TAU); k.clip();
    k.fillStyle = rgba([255, 222, 175], 0.3); k.fillRect(cx - r, cy - r * 0.55, r * 2, r * 0.22); k.fillRect(cx - r, cy + r * 0.08, r * 2, r * 0.13);
    k.restore();
    if (tipo !== 'luna') {   // el uraeus: la cobra que se enrosca al disco y se alza delante
      k.beginPath(); k.moveTo(cx + r * 0.2, cy + r * 1.02); k.bezierCurveTo(cx - r * 0.8, cy + r * 1.1, cx - r * 1.32, cy + r * 0.2, cx - r * 1.08, cy - r * 0.5);
      k.strokeStyle = rgba(P.turquesa, 1); k.lineWidth = 1.5; k.lineCap = 'round'; k.stroke();
      relleno(k, function (c) { c.moveTo(cx - r * 1.1, cy + r * 1.05); c.quadraticCurveTo(cx - r * 1.5, cy + r * 0.7, cx - r * 1.2, cy + r * 0.3); c.quadraticCurveTo(cx - r * 0.95, cy + r * 0.7, cx - r * 0.85, cy + r * 1.05); c.closePath(); }, ES.lin(k, cx - r * 1.5, cy, cx - r * 0.8, cy + r, [[0, cla(P.turquesa, 0.25)], [1, osc(P.turquesa, 0.2)]]));
    }
  }
  // el collar ancho (usej): bandas de oro, turquesa y lapislázuli, con las cuentas en gota del borde
  function collar(k) {
    var bandas = [[P.oro2, 4.2], [P.turquesa, 6], [P.oro1, 6.8], [P.lapis, 8.4], [P.oro2, 9.4]], i;
    for (i = bandas.length - 1; i >= 0; i--) {
      var r = bandas[i][1];
      relleno(k, function (c) { c.moveTo(-r * 1.46, -80.8); c.ellipse(0, -80.8, r * 1.46, r * 0.95, 0, PI, 0, true); c.closePath(); }, rgba(bandas[i][0], 1));
    }
    k.beginPath(); for (i = 0; i < 11; i++) { var a = 0.16 + (PI - 0.32) * i / 10, gx = Math.cos(a) * 14.2, gy = -80.8 + Math.sin(a) * 9.4; elipse(k, gx, gy, 0.9, 1.2, a - PI / 2); }
    k.fillStyle = rgba(P.cornalina, 1); k.fill();
  }
  // la figura entera. op: { piel: 'h'|'m', peluca, cabeza: 'humana'|'halcon'|'ibis', disco, falda: 'blanca'|'oro', collar,
  // piernas: 'paso'|'juntas'|'arrodillado'|'sentado'|'nada', manoCerca, manoLejos (dónde van las manos, en unidades de la
  // figura), codoArriba, inclina (el torso, en radianes, sobre la cadera) }. Devuelve los brazos [hombro, codo, mano].
  function figura(k, op) {
    var mujer = op.piel === 'm', piel = mujer ? CF.pielM : CF.piel, pielS = mujer ? CF.pielMS : CF.pielS;
    var dios = op.cabeza === 'halcon' || op.cabeza === 'ibis', pi = op.piernas || 'juntas';
    var cadY = pi === 'sentado' ? -44 : pi === 'arrodillado' ? -36 : -55, dy = cadY + 55;
    var gPiel = ES.lin(k, -12, -100 + dy, 10, -30 + dy, [[0, cla(piel, 0.14)], [0.55, piel], [1, pielS]]);
    var gLejos = rgba(osc(pielS, 0.1), 1);
    // las piernas: muslo, rodilla, pantorrilla, tobillo y el pie largo
    function pierna(c, hx, kx, ax, ky) {
      tiraPor(c, [hx, -56, 8.6, kx, ky, 5.6, (kx + ax) / 2 - 0.6, (ky - 4) / 2, 5.4, ax, -4.4, 3.6], false);
      c.moveTo(ax + 2.4, -5.4); c.quadraticCurveTo(ax + 2.8, -0.6, ax + 1.6, 0); c.lineTo(ax - 9.6, 0); c.quadraticCurveTo(ax - 10.6, -1.6, ax - 7.6, -2.6); c.quadraticCurveTo(ax - 3, -3.6, ax - 1.6, -5.8); c.closePath();
    }
    if (pi === 'paso' || pi === 'juntas') {
      var p = pi === 'paso' ? 1 : 0.3;
      relleno(k, function (c) { pierna(c, 2.6, 2.4 + 1.5 * p, 3.6 + 4 * p, -28); }, gLejos);
      relleno(k, function (c) { pierna(c, -2.4, -3.2 - 3.4 * p, -4 - 8 * p, -28); }, gPiel);
    } else if (pi === 'arrodillado') {
      // una rodilla en el suelo y la otra levantada; sentado sobre el talón
      relleno(k, function (c) { tiraPor(c, [3, -36, 12, 13, -14, 8, 12, -3.4, 6.6]); c.moveTo(16, -2); c.lineTo(23, -1); c.lineTo(22, 0.6); c.lineTo(11, 0.6); c.closePath(); }, gLejos);
      relleno(k, function (c) { tiraPor(c, [-1, -38, 12.4, -15, -41, 9, -16.4, -18, 6.4, -15.6, -3.6, 5.2]); c.moveTo(-13.6, -4.4); c.lineTo(-25, -1.2); c.lineTo(-24.4, 0.6); c.lineTo(-12, 0.6); c.closePath(); }, gPiel);
    } else if (pi === 'sentado') {
      relleno(k, function (c) { tiraPor(c, [4, -44, 13, -18, -46, 9.4, -20, -24, 6.4, -20.6, -4, 5.2]); c.moveTo(-18.4, -4.8); c.lineTo(-30, -1.2); c.lineTo(-29.4, 0.6); c.lineTo(-17, 0.6); c.closePath(); }, gPiel);
    }
    k.save(); k.translate(0, cadY); k.rotate(op.inclina || 0); k.translate(0, -cadY);
    k.save(); k.translate(0, dy);
    var hL = op.manoLejos ? [op.manoLejos[0], op.manoLejos[1] - dy] : null, hC = op.manoCerca ? [op.manoCerca[0], op.manoCerca[1] - dy] : null, bL = null, bC = null;
    // el brazo de detrás, más oscuro
    if (hL) { bL = ikBrazo(10.2, -76.4, hL[0], hL[1], 16.4, 14.6, op.codoArriba); pintarBrazo(k, bL, gLejos); }
    // el torso: los hombros de frente, el pecho de perfil, la cintura estrecha
    var torso = function (c) {
      c.moveTo(-3.8, -80.6); c.quadraticCurveTo(-8.8, -80.4, -12.4, -79.2); c.bezierCurveTo(-15.2, -78.2, -15.4, -73.8, -13.2, -71.6);
      c.quadraticCurveTo(-13.6, -66.8, -11.4, -64.2); c.quadraticCurveTo(-8.8, -61, -6.8, -57); c.lineTo(6.6, -57);
      c.quadraticCurveTo(8.6, -63, 11.6, -70.4); c.bezierCurveTo(14.4, -73, 15, -78, 12.2, -79.2); c.quadraticCurveTo(8.6, -80.4, 3.6, -80.6); c.closePath();
    };
    relleno(k, torso, ES.lin(k, -13, -80, 12, -58, [[0, cla(piel, 0.14)], [0.55, piel], [1, pielS]]));
    // el pecho de perfil y el ombligo, apenas marcados
    k.beginPath(); k.moveTo(-12.2, -68.8); k.quadraticCurveTo(-9.6, -67.2, -7.8, -68.4); k.moveTo(-3.4, -60.6); k.lineTo(-3, -59.8);
    k.strokeStyle = rgba(pielS, 0.8); k.lineWidth = 0.55; k.stroke();
    if (op.collar || dios) collar(k);
    k.restore();
    // la falda (shendyt): lino blanco plisado con su cinturón; la de los dioses, con el delantal de oro
    if (pi !== 'nada') {
      var falda = pi === 'sentado' || pi === 'arrodillado'
        ? function (c) { c.moveTo(-7.4, -57 + dy); c.lineTo(7.2, -57 + dy); c.lineTo(9.4, cadY + 6); c.quadraticCurveTo(-2, cadY + 10, -21, cadY + 6); c.lineTo(-18, cadY - 1); c.closePath(); }
        : function (c) { c.moveTo(-7.4, -57); c.lineTo(7.2, -57); c.lineTo(9.6, -35); c.quadraticCurveTo(0, -32.6, -13.4, -35.6); c.closePath(); };
      relleno(k, falda, ES.lin(k, -12, -57 + dy, 9, -34 + dy, [[0, CF.lino], [0.6, mez(CF.lino, CF.linoS, 0.3)], [1, CF.linoS]]));
      k.save(); k.beginPath(); falda(k); k.clip();
      k.beginPath(); for (var i = 0; i < 7; i++) { k.moveTo(-6.4 + i * 2.2, -56 + dy); k.lineTo(-12.4 + i * 3.4, -31 + dy); }
      k.strokeStyle = rgba(CF.linoS, 0.9); k.lineWidth = 0.45; k.lineCap = 'butt'; k.stroke();
      if (op.falda === 'oro') relleno(k, function (c) { c.moveTo(-5.2, -56 + dy); c.lineTo(0.6, -56 + dy); c.lineTo(-1.6, -32 + dy); c.lineTo(-11.6, -33.6 + dy); c.closePath(); }, ES.oro(k, -12, -57 + dy, 1, -33 + dy, 0.32));
      k.restore();
      relleno(k, function (c) { c.moveTo(-7.6, -58.4 + dy); c.lineTo(7.4, -58.4 + dy); c.lineTo(7.6, -55.6 + dy); c.lineTo(-7.8, -55.6 + dy); c.closePath(); }, dios || op.falda === 'oro' ? ES.oro(k, 0, -58.4 + dy, 0, -55.6 + dy, 0.4) : rgba(CF.linoS, 1));
    }
    // la cabeza y el disco
    k.save(); k.translate(0, dy);
    if (dios) cabezaDios(k, op.cabeza); else cabezaHumana(k, op.peluca || 'corta', mujer);
    if (op.disco) disco(k, op.disco);
    // el brazo de delante, con su brazalete de oro si es un dios o lleva collar
    if (hC) {
      bC = ikBrazo(-10.4, -76.4, hC[0], hC[1], 16.4, 14.6, op.codoArriba); pintarBrazo(k, bC, gPiel);
      if (dios || op.collar) { var wx = bC[4] + (bC[2] - bC[4]) * 0.2, wy = bC[5] + (bC[3] - bC[5]) * 0.2; k.beginPath(); tiraPor(k, [wx + (bC[2] - bC[4]) * 0.06, wy + (bC[3] - bC[5]) * 0.06, 4.4, wx - (bC[2] - bC[4]) * 0.06, wy - (bC[3] - bC[5]) * 0.06, 4.2], false); k.fillStyle = ES.oro(k, wx - 3, wy - 3, wx + 3, wy + 3, 0.4); k.fill(); }
    }
    k.restore();
    k.restore();
    function a_mu(b) { return b ? [b[0], b[1] + dy, b[2], b[3] + dy, b[4], b[5] + dy] : null; }
    return { cerca: a_mu(bC), lejos: a_mu(bL), cad: cadY };
  }
  // una figura a escala: H en mu, los pies en (x, y); devuelve los brazos en unidades de la figura
  function figuraEn(k, x, y, H, op) {
    k.save(); k.translate(x, y); k.scale(H / 100, H / 100); var r = figura(k, op); k.restore(); return r;
  }

  /* ================================================================== LAS BARCAS
     Todas flotan: el ancla es el centro de la línea de flotación (la superficie, que es la línea de suelo); la quilla
     queda un poco por debajo y lo que está bajo el agua se ve azulado y medio transparente. Con op.t se balancean
     (cabeceo y vaivén), dibujadas desde la caché. */
  var CB = {
    madera: mez(P.piel, P.arena, 0.45),
    maderaLuz: mez(P.arena, P.oro1, 0.35),
    maderaOsc: mez(P.piel2, P.oro4, 0.45),
    cuerda: mez(P.oro4, P.negro, 0.2),
    vela: mez(P.lino, P.papiro, 0.35),
    velaS: mez(P.lino2, P.piedra2, 0.35),
    juncoLuz: mez(P.arena, P.oro1, 0.3),
    junco: mez(mez(P.arena, P.verde, 0.22), P.oro3, 0.12),
    juncoOsc: mez(mez(P.arena2, P.verde, 0.3), P.oro4, 0.3)
  };
  // el balanceo: cuánto sube y baja y cuánto cabecea (en mu y radianes)
  function vaiven(t, sem, fuerza) {
    var f = fuerza == null ? 1 : fuerza;
    return { dy: (Math.sin(t * 0.0013 + sem) * 1.6 + Math.sin(t * 0.0029 + sem * 2) * 0.6) * f, giro: (Math.sin(t * 0.0011 + sem * 3) * 0.008 + Math.sin(t * 0.0023 + sem) * 0.003) * f };
  }
  // un casco de madera en media luna: de proa (x0) a popa (x1); yB = el fondo (bajo el agua), yG = la borda en el centro;
  // pR y sR: cuánto suben la proa y la popa
  function formaCasco(k, x0, x1, yB, yG, pR, sR) {
    var L = x1 - x0;
    k.moveTo(x0, yG - pR);
    k.bezierCurveTo(x0 + L * 0.06, yG - pR * 0.3, x0 + L * 0.12, yB, x0 + L * 0.3, yB);
    k.lineTo(x1 - L * 0.3, yB);
    k.bezierCurveTo(x1 - L * 0.12, yB, x1 - L * 0.06, yG - sR * 0.3, x1, yG - sR);
    k.bezierCurveTo(x1 - L * 0.08, yG - sR * 0.6, x1 - L * 0.16, yG, x1 - L * 0.3, yG);
    k.lineTo(x0 + L * 0.3, yG);
    k.bezierCurveTo(x0 + L * 0.16, yG, x0 + L * 0.08, yG - pR * 0.6, x0, yG - pR);
    k.closePath();
  }
  function pintarCascoMadera(k, x0, x1, yB, yG, pR, sR, banda) {
    var f = function (c) { formaCasco(c, x0, x1, yB, yG, pR, sR); };
    relleno(k, f, ES.lin(k, 0, yG - 10, 0, yB, [[0, cla(CB.madera, 0.12)], [0.45, CB.madera], [1, CB.maderaOsc]]));
    k.save(); k.beginPath(); f(k); k.clip();
    // las tablas: líneas a lo largo, que siguen la curva
    k.beginPath();
    for (var i = 1; i < 5; i++) { var yy = yG + (yB - yG) * i / 5; k.moveTo(x0 - 10, yy - pR * (1 - i / 5) * 0.9); k.bezierCurveTo(x0 + (x1 - x0) * 0.2, yy + 2, x1 - (x1 - x0) * 0.2, yy + 2, x1 + 10, yy - sR * (1 - i / 5) * 0.9); }
    k.strokeStyle = rgba(CB.maderaOsc, 0.45); k.lineWidth = 1.1; k.stroke();
    // la banda pintada bajo la borda
    if (banda) {
      k.beginPath(); k.moveTo(x0 - 10, yG - pR + 4); k.bezierCurveTo(x0 + (x1 - x0) * 0.15, yG + 3, x1 - (x1 - x0) * 0.15, yG + 3, x1 + 10, yG - sR + 4);
      k.strokeStyle = rgba(banda, 0.95); k.lineWidth = 4.6; k.stroke();
      k.beginPath(); k.moveTo(x0 - 10, yG - pR + 8); k.bezierCurveTo(x0 + (x1 - x0) * 0.15, yG + 7.5, x1 - (x1 - x0) * 0.15, yG + 7.5, x1 + 10, yG - sR + 8);
      k.strokeStyle = rgba(P.oro2, 0.95); k.lineWidth = 1.6; k.stroke();
    }
    k.restore();
    luz(k, f, 0, yG - 6, 0, yG + 8, 0.35, P.oro1);
  }
  // las bandas rojas y blancas que atan los extremos
  function atadura(k, x, y, ang, w) {
    k.save(); k.translate(x, y); k.rotate(ang);
    k.fillStyle = rgba(P.rojo, 1); k.fillRect(-w / 2, -1.8, w, 3.6); k.fillRect(-w / 2, 5.4, w, 3.6);
    k.fillStyle = rgba(P.lino, 1); k.fillRect(-w / 2, 1.8, w, 3.6);
    k.restore();
  }
  // un remo: de la pala (bx, by) al puño (px, py); la pala, ancha
  function pintarRemo(k, px, py, bx, by, col, ancho, pala) {
    var dx = bx - px, dy = by - py, d = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / d, uy = dy / d, nx = -uy, ny = ux;
    k.beginPath(); k.moveTo(px, py); k.lineTo(bx - ux * pala * 0.8, by - uy * pala * 0.8);
    k.strokeStyle = col; k.lineWidth = ancho; k.lineCap = 'round'; k.stroke();
    k.beginPath(); k.moveTo(bx - ux * pala + nx * 0.5, by - uy * pala + ny * 0.5);
    k.quadraticCurveTo(bx - ux * pala * 0.5 + nx * pala * 0.32, by - uy * pala * 0.5 + ny * pala * 0.32, bx + nx * pala * 0.14, by + ny * pala * 0.14);
    k.quadraticCurveTo(bx + ux * 1.5, by + uy * 1.5, bx - nx * pala * 0.14, by - ny * pala * 0.14);
    k.quadraticCurveTo(bx - ux * pala * 0.5 - nx * pala * 0.32, by - uy * pala * 0.5 - ny * pala * 0.32, bx - ux * pala - nx * 0.5, by - uy * pala - ny * 0.5);
    k.closePath(); k.fillStyle = col; k.fill();
  }
  function cuerda(k, pts, a) { k.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) k.lineTo(pts[i], pts[i + 1]); }

  /* ---------- la barca de vela (va al sur) ----------
     En jeroglífico, «ir al sur, remontar el río» (ḫnti) se escribe con un barco con la vela izada (𓊝, P2): se sube el
     Nilo con el viento del norte. Barca de madera del Imperio Medio: la vela alta y rectangular, hinchada, entre la verga y
     la botavara, en un mástil con sus estays; la cabina con los escudos pintados; dos remos de timón a popa; el vigía con
     la pértiga de sondar a proa, un marinero con la escota, el dueño sentado y el timonel. Va hacia la izquierda. */
  var VELA = { x0: -200, x1: 196, yB: 12, yG: -24, pR: 44, sR: 70, mastil: -34, tope: -318, verga: -296, bota: -78, ancho: 150 };
  function pintarVela(k, hinchado) {
    var V = VELA, xm = V.mastil, a = V.ancho / 2, h = hinchado == null ? 1 : hinchado;
    var vela = function (c) {
      c.moveTo(xm - a, V.verga + 6); c.quadraticCurveTo(xm, V.verga + 12, xm + a, V.verga + 6);
      c.quadraticCurveTo(xm + a - 14 * h, (V.verga + V.bota) / 2, xm + a, V.bota - 6);
      c.quadraticCurveTo(xm, V.bota - 14, xm - a, V.bota - 6);
      c.quadraticCurveTo(xm - a - 22 * h, (V.verga + V.bota) / 2, xm - a, V.verga + 6); c.closePath();
    };
    relleno(k, vela, ES.lin(k, xm - a - 20, 0, xm + a, 0, [[0, cla(CB.vela, 0.25)], [0.35, CB.vela], [0.8, mez(CB.vela, CB.velaS, 0.6)], [1, CB.velaS]]));
    k.save(); k.beginPath(); vela(k); k.clip();
    // las costuras (paños verticales que siguen el hinchado) y los refuerzos horizontales
    k.beginPath();
    for (var i = 1; i < 6; i++) { var x = xm - a + V.ancho * i / 6, b = -22 * h * (1 - i / 6) - 6 * h * (i / 6); k.moveTo(x, V.verga + 8); k.quadraticCurveTo(x + b, (V.verga + V.bota) / 2, x, V.bota - 8); }
    k.strokeStyle = rgba(CB.velaS, 0.6); k.lineWidth = 1; k.stroke();
    k.beginPath(); for (i = 1; i < 4; i++) { var y = V.verga + (V.bota - V.verga) * i / 4; k.moveTo(xm - a - 30, y); k.quadraticCurveTo(xm, y + 5, xm + a + 10, y); }
    k.strokeStyle = rgba(CB.velaS, 0.35); k.lineWidth = 1.6; k.stroke();
    // la sombra del vientre de la vela, a la derecha
    k.fillStyle = ES.lin(k, xm - a, 0, xm + a, 0, [[0, P.blanco, 0.18], [0.3, P.blanco, 0], [0.7, CB.velaS, 0], [1, CB.velaS, 0.45]]); k.fillRect(xm - a - 30, V.verga, V.ancho + 40, V.bota - V.verga);
    k.restore();
    // la verga y la botavara, curvadas
    k.beginPath(); tira(k, xm - a - 10, V.verga + 9, xm, V.verga - 2, xm + a + 10, V.verga + 9, 4.4, 4.4, 12); tira(k, xm - a - 8, V.bota - 9, xm, V.bota + 1, xm + a + 8, V.bota - 9, 4, 4, 12);
    k.fillStyle = ES.lin(k, 0, V.verga - 4, 0, V.verga + 6, [[0, CB.maderaLuz], [1, CB.maderaOsc]]); k.fill();
  }
  function pintarBarcaVela(k) {
    var V = VELA, i;
    // el remo de timón de detrás (más oscuro) y su poste
    pintarRemo(k, 150, -86, 214, 16, rgba(osc(CB.madera, 0.3), 1), 3.4, 26);
    // el mástil
    relleno(k, function (c) { c.moveTo(V.mastil - 3.2, V.yG + 2); c.lineTo(V.mastil - 2.2, V.tope); c.lineTo(V.mastil + 2.2, V.tope); c.lineTo(V.mastil + 3.2, V.yG + 2); c.closePath(); }, ES.lin(k, V.mastil - 3, 0, V.mastil + 3, 0, [[0, CB.maderaLuz], [1, CB.maderaOsc]]));
    // la jarcia: estay de proa y de popa, y los amantillos de la verga y la botavara
    k.beginPath();
    cuerda(k, [V.mastil, V.tope + 4, V.x0 + 14, V.yG - V.pR + 6]); cuerda(k, [V.mastil, V.tope + 4, V.x1 - 40, V.yG - 30]);
    for (i = 0; i < 4; i++) { var u = (i + 0.5) / 4; cuerda(k, [V.mastil, V.tope + 2, V.mastil - V.ancho / 2 + V.ancho * u, V.bota - 9 + Math.abs(u - 0.5) * 6]); }
    cuerda(k, [V.mastil - V.ancho / 2 - 6, V.bota - 8, V.mastil - 96, V.yG + 2]); cuerda(k, [V.mastil + V.ancho / 2 + 6, V.bota - 8, 62, V.yG - 26]);
    k.strokeStyle = rgba(CB.cuerda, 0.75); k.lineWidth = 0.9; k.stroke();
    pintarVela(k, 1);
    // la cabina: techo de tablas y los costados con escudos pintados de piel de vaca
    relleno(k, function (c) { c.moveTo(60, V.yG + 2); c.lineTo(60, V.yG - 42); c.lineTo(122, V.yG - 42); c.lineTo(122, V.yG + 2); c.closePath(); }, ES.lin(k, 60, 0, 122, 0, [[0, cla(CB.madera, 0.2)], [1, CB.maderaOsc]]));
    var escudo = new Path2D(), manchas = new Path2D();
    for (i = 0; i < 4; i++) {
      var ex = 63 + i * 15; escudo.moveTo(ex, V.yG - 36); escudo.lineTo(ex + 12, V.yG - 36); escudo.lineTo(ex + 12, V.yG - 8); escudo.quadraticCurveTo(ex + 6, V.yG - 2, ex, V.yG - 8); escudo.closePath();
      manchas.moveTo(ex + 3 + 2.4, V.yG - 30); manchas.ellipse(ex + 3, V.yG - 30, 2.4, 3, 0.4, 0, TAU); manchas.moveTo(ex + 8 + 2, V.yG - 20); manchas.ellipse(ex + 8, V.yG - 20, 2, 2.6, -0.3, 0, TAU); manchas.moveTo(ex + 4 + 1.8, V.yG - 13); manchas.ellipse(ex + 4, V.yG - 13, 1.8, 2, 0, 0, TAU);
    }
    k.fillStyle = ES.lin(k, 60, V.yG - 36, 120, V.yG - 4, [[0, P.lino], [1, P.lino2]]); k.fill(escudo);
    k.fillStyle = rgba(mez(P.oro4, P.negro, 0.4), 0.85); k.fill(manchas);
    relleno(k, function (c) { c.moveTo(56, V.yG - 42); c.lineTo(126, V.yG - 42); c.lineTo(124, V.yG - 48); c.lineTo(58, V.yG - 48); c.closePath(); }, ES.lin(k, 0, V.yG - 48, 0, V.yG - 42, [[0, P.verde], [1, osc(P.verde, 0.3)]]));
    // la tripulación, de pie dentro de la barca (la borda les tapa los pies): el timonel con la caña, el marinero con
    // la escota y el vigía de proa con la pértiga de sondar
    // el timonel mira al remo de timón (hacia popa) y agarra la caña
    k.save(); k.translate(118, V.yG + 12); k.scale(-1, 1); figuraEn(k, 0, 0, 96, { piernas: 'paso', manoCerca: [-14, -64], manoLejos: [-12, -72] }); k.restore();
    var mar = figuraEn(k, 34, V.yG + 12, 94, { piernas: 'paso', manoCerca: [-16, -70], manoLejos: [-9, -79] });
    k.beginPath(); k.moveTo(34 + mar.cerca[4] * 0.94 - 2, V.yG + 12 + mar.cerca[5] * 0.94); k.lineTo(V.mastil + V.ancho / 2 + 6, V.bota - 8); k.strokeStyle = rgba(CB.cuerda, 0.85); k.lineWidth = 1; k.stroke();
    var vig = figuraEn(k, -150, V.yG + 4, 94, { piernas: 'paso', manoCerca: [-17, -66], manoLejos: [-10, -77] });
    // el casco, con la banda pintada
    pintarCascoMadera(k, V.x0, V.x1, V.yB, V.yG, V.pR, V.sR, P.turquesa);
    // la proa recta y la popa que se curva hacia dentro, acabada en una umbela de papiro
    relleno(k, function (c) { tira(c, V.x1 - 6, V.yG - V.sR + 6, V.x1 + 6, V.yG - V.sR - 24, V.x1 - 12, V.yG - V.sR - 38, 9, 5.5, 10); }, ES.lin(k, V.x1 - 12, 0, V.x1 + 8, 0, [[0, CB.madera], [1, CB.maderaOsc]]));
    k.save(); k.translate(V.x1 - 14, V.yG - V.sR - 40); k.rotate(-2.3);
    relleno(k, function (c) { c.moveTo(0, 0); c.lineTo(-11, -16); c.quadraticCurveTo(0, -22, 11, -16); c.closePath(); }, ES.lin(k, 0, -20, 0, 0, [[0, cla(P.verde, 0.2)], [1, osc(P.verde, 0.25)]]));
    k.restore();
    atadura(k, V.x1 - 8, V.yG - V.sR + 14, -0.9, 10); atadura(k, V.x0 + 8, V.yG - V.pR + 10, 0.75, 9);
    // el poste del timón y el remo de timón de delante, con su caña
    relleno(k, function (c) { c.moveTo(146, V.yG - 2); c.lineTo(148, -98); c.lineTo(153, -98); c.lineTo(152, V.yG - 2); c.closePath(); }, ES.lin(k, 146, 0, 153, 0, [[0, CB.maderaLuz], [1, CB.maderaOsc]]));
    pintarRemo(k, 140, -96, 208, 18, rgba(CB.madera, 1), 3.8, 28);
    k.beginPath(); k.moveTo(146, -86); k.lineTo(133, -64); k.strokeStyle = rgba(CB.maderaOsc, 1); k.lineWidth = 2.4; k.lineCap = 'round'; k.stroke();
    // la pértiga del vigía: pasa por sus dos manos y baja al agua por delante de la proa
    var ax = -150 + vig.cerca[4] * 0.94, ay = V.yG + 4 + vig.cerca[5] * 0.94, bx = -150 + vig.lejos[4] * 0.94, by = V.yG + 4 + vig.lejos[5] * 0.94;
    var pdx = ax - bx, pdy = ay - by, pd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
    pintarRemo(k, bx - pdx / pd * 30, by - pdy / pd * 30, ax + pdx / pd * ((24 - ay) / (pdy / pd)), 24, rgba(CB.maderaLuz, 1), 2.2, 0.1);
  }
  A.barcaVela = pieza({
    ancho: 0.45, alto: 0.34, abajo: 0.03,
    dibujar: function (ctx, s, k, op) {
      var anim = op.t != null, t = op.t || 0, sem = op.semilla || 1, v = anim ? vaiven(t, sem) : { dy: 0, giro: 0 };
      var caja = [-216, -330, 222, 44], c = enCache('barca-vela', s, k, caja, pintarBarcaVela);
      ponerFlotando(ctx, c, enCacheAgua(c, 'barca-vela', s, k), v.dy, v.giro, 0, -40, !anim);
      // el banderín del tope, al viento del norte (hacia la izquierda)
      ctx.save(); ctx.translate(0, v.dy); ctx.rotate(v.giro);
      var bx = VELA.mastil, by = VELA.tope, ond = anim ? Math.sin(t * 0.008) : 0.3;
      relleno(ctx, function (cc) { cc.moveTo(bx, by + 1); cc.quadraticCurveTo(bx - 12, by - 2 + ond * 3, bx - 26, by + 2 + ond * 2); cc.quadraticCurveTo(bx - 12, by + 4 - ond * 2, bx, by + 7); cc.closePath(); }, ES.lin(ctx, bx, by, bx - 26, by, [[0, P.rojo], [1, cla(P.cornalina, 0.2)]]));
      ctx.restore();
      ondas(ctx, VELA.x0 + 50, VELA.x1 - 60, t, 0.9);
    }
  });
  // el jeroglífico de «ir al sur» (P2, barco con la vela izada)
  A.barcaVela.signo = '𓊝';
  // el centro de la vela (en u, respecto al ancla: el centro de la línea de flotación)
  A.barcaVela.vela = { dx: VELA.mastil / M, dy: (VELA.verga + VELA.bota) / 2 / M, w: VELA.ancho / M, h: (VELA.bota - VELA.verga) / M };

  /* ---------- la barca de remos (va al norte) ----------
     «Ir al norte, bajar el río» (ḫdi) se escribe con un barco sin vela (𓊛, P1): se baja con la corriente, remando. La
     vela va recogida (la verga bajada sobre la botavara y el paño atado entre las dos), y cuatro remeros sentados de cara a
     popa reman a compás (op.t); a popa el timonel y a proa el vigía con la pértiga. Va hacia la derecha. */
  var REMOS = { x0: -198, x1: 198, yB: 12, yG: -24, pR: 66, sR: 40, mastil: 12, tope: -250, remeros: [-104, -54, -4, 46], T: 1700 };
  function pintarBarcaRemosQuieta(k) {
    var R = REMOS, i;
    // el mástil con la vela recogida
    relleno(k, function (c) { c.moveTo(R.mastil - 3, R.yG + 2); c.lineTo(R.mastil - 2, R.tope); c.lineTo(R.mastil + 2, R.tope); c.lineTo(R.mastil + 3, R.yG + 2); c.closePath(); }, ES.lin(k, R.mastil - 3, 0, R.mastil + 3, 0, [[0, CB.maderaLuz], [1, CB.maderaOsc]]));
    k.beginPath(); cuerda(k, [R.mastil, R.tope + 4, R.x1 - 18, R.yG - R.sR + 6]); cuerda(k, [R.mastil, R.tope + 4, R.x0 + 40, R.yG - 34]);
    for (i = 0; i < 4; i++) cuerda(k, [R.mastil, R.tope + 3, R.mastil - 70 + i * 46, -112]);
    k.strokeStyle = rgba(CB.cuerda, 0.75); k.lineWidth = 0.9; k.stroke();
    // la verga y la botavara juntas, con el paño enrollado y atado
    relleno(k, function (c) { c.moveTo(R.mastil - 82, -110); c.quadraticCurveTo(R.mastil, -122, R.mastil + 82, -110); c.quadraticCurveTo(R.mastil + 84, -104, R.mastil + 80, -98); c.quadraticCurveTo(R.mastil, -106, R.mastil - 80, -98); c.quadraticCurveTo(R.mastil - 84, -104, R.mastil - 82, -110); c.closePath(); }, ES.lin(k, 0, -120, 0, -98, [[0, cla(CB.vela, 0.25)], [0.5, CB.vela], [1, CB.velaS]]));
    k.beginPath(); for (i = 0; i < 7; i++) { var ax = R.mastil - 66 + i * 22; k.moveTo(ax, -117 + Math.abs(i - 3) * 1.2); k.lineTo(ax + 2, -100 + Math.abs(i - 3) * 0.6); }
    k.strokeStyle = rgba(CB.cuerda, 0.9); k.lineWidth = 1.3; k.stroke();
    k.beginPath(); tira(k, R.mastil - 90, -112, R.mastil, -124, R.mastil + 90, -112, 3.6, 3.6, 10); tira(k, R.mastil - 88, -98, R.mastil, -104, R.mastil + 88, -98, 3.4, 3.4, 10);
    k.fillStyle = ES.lin(k, 0, -120, 0, -96, [[0, CB.maderaLuz], [1, CB.maderaOsc]]); k.fill();
    // el timonel de popa y el vigía de proa (miran a la derecha), dentro de la barca
    figuraEn(k, -132, R.yG + 12, 96, { piernas: 'paso', manoCerca: [-17, -66], manoLejos: [-12, -74] });
    k.save(); k.translate(156, R.yG + 6); k.scale(-1, 1); var vig = figuraEn(k, 0, 0, 94, { piernas: 'paso', manoCerca: [-17, -66], manoLejos: [-10, -77] }); k.restore();
    // el casco
    pintarCascoMadera(k, R.x0, R.x1, R.yB, R.yG, R.pR, R.sR, P.verde);
    relleno(k, function (c) { tira(c, R.x0 + 6, R.yG - R.pR + 6, R.x0 - 8, R.yG - R.pR - 26, R.x0 + 12, R.yG - R.pR - 40, 9, 5.5, 10); }, ES.lin(k, R.x0 - 8, 0, R.x0 + 12, 0, [[0, CB.madera], [1, CB.maderaOsc]]));
    k.save(); k.translate(R.x0 + 14, R.yG - R.pR - 42); k.rotate(2.3);
    relleno(k, function (c) { c.moveTo(0, 0); c.lineTo(-11, -16); c.quadraticCurveTo(0, -22, 11, -16); c.closePath(); }, ES.lin(k, 0, -20, 0, 0, [[0, cla(P.verde, 0.2)], [1, osc(P.verde, 0.25)]]));
    k.restore();
    atadura(k, R.x0 + 8, R.yG - R.pR + 14, 0.9, 10); atadura(k, R.x1 - 8, R.yG - R.sR + 10, -0.75, 9);
    // el remo de timón de popa, que el timonel sujeta, y la pértiga del vigía, entre sus manos
    pintarRemo(k, -144, -88, -206, 20, rgba(CB.madera, 1), 3.8, 28);
    var ax = 156 - vig.cerca[4] * 0.94, ay = R.yG + 6 + vig.cerca[5] * 0.94, bx = 156 - vig.lejos[4] * 0.94, by = R.yG + 6 + vig.lejos[5] * 0.94;
    var pdx = ax - bx, pdy = ay - by, pd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
    pintarRemo(k, bx - pdx / pd * 30, by - pdy / pd * 30, ax + pdx / pd * ((24 - ay) / (pdy / pd)), 24, rgba(CB.maderaLuz, 1), 2.2, 0.1);
  }
  // un remero sentado (mira a popa, a la izquierda): solo el torso y la cabeza, que se inclinan; los brazos van aparte
  function pintarTorsoRemero(k) { figura(k, { piernas: 'nada', peluca: 'corta' }); }
  // el ciclo de la palada (f de 0 a 1): el remo gira sobre su escálamo, en diagonal como en las pinturas; en el empuje la
  // pala barre el agua hacia popa y el remero se echa atrás; en la vuelta la pala sale del agua y él se inclina hacia delante
  function golpeRemo(f) {
    var empuje = f < 0.45, u = empuje ? U.inOut(f / 0.45) : U.inOut((f - 0.45) / 0.55);
    return { th: empuje ? 0.84 + 0.4 * u : 1.24 - 0.4 * u, alza: empuje ? 0 : Math.sin(u * PI) * 14, inclina: empuje ? -0.28 + 0.46 * u : 0.18 - 0.46 * u };
  }
  var LREMO = 66, LPUNO = 44;
  // dónde están el escálamo, el puño y la pala de cada remo
  function remosDe(f) {
    var R = REMOS, g = golpeRemo(f), out = [], sx = Math.sin(g.th), cx = Math.cos(g.th);
    for (var i = 0; i < R.remeros.length; i++) {
      var px = R.remeros[i] - 22, py = R.yG - 1;
      out.push({ px: px, py: py, hx: px + sx * LPUNO, hy: py - cx * LPUNO + g.alza * LPUNO / LREMO, bx: px - sx * LREMO, by: py + cx * LREMO - g.alza, g: g });
    }
    return out;
  }
  // los remos: un camino para los astiles y otro para las palas (las hojas anchas del final)
  function caminoRemos(remos) {
    var astil = new Path2D(), pala = new Path2D();
    for (var i = 0; i < remos.length; i++) {
      var r = remos[i], dx = r.bx - r.hx, dy = r.by - r.hy, d = Math.sqrt(dx * dx + dy * dy), ux = dx / d, uy = dy / d, nx = -uy, ny = ux, L = 24, W = 4.2;
      astil.moveTo(r.hx, r.hy); astil.lineTo(r.bx - ux * L * 0.7, r.by - uy * L * 0.7);
      pala.moveTo(r.bx - ux * L, r.by - uy * L);
      pala.quadraticCurveTo(r.bx - ux * L * 0.45 + nx * W, r.by - uy * L * 0.45 + ny * W, r.bx + nx * W * 0.6, r.by + ny * W * 0.6);
      pala.quadraticCurveTo(r.bx + ux * 1.6, r.by + uy * 1.6, r.bx - nx * W * 0.6, r.by - ny * W * 0.6);
      pala.quadraticCurveTo(r.bx - ux * L * 0.45 - nx * W, r.by - uy * L * 0.45 - ny * W, r.bx - ux * L, r.by - uy * L);
      pala.closePath();
    }
    return { astil: astil, pala: pala };
  }
  function pintarCaminoRemos(k, cr) {
    k.lineCap = 'butt'; k.strokeStyle = rgba(CB.maderaLuz, 1); k.lineWidth = 2.6; k.stroke(cr.astil);
    k.fillStyle = rgba(mez(CB.maderaLuz, CB.madera, 0.4), 1); k.fill(cr.pala);
  }
  // los remeros (el torso en caché, que se inclina) con sus brazos hasta el puño del remo
  function pintarRemeros(k, f, sprite, remos, cr) {
    var R = REMOS, H = 84, e = H / 100, lejos = new Path2D(), cerca = new Path2D(), g = remos[0].g, ang = g.inclina, ca = Math.cos(ang), sa = Math.sin(ang), i;
    var torsos = [];
    for (i = 0; i < R.remeros.length; i++) {
      var r = remos[i], cadX = r.px + 48, cadY = R.yG + 2;
      var hombro = function (sx, sy) { var lx = sx * e, ly = (sy + 55) * e; return [cadX + lx * ca - ly * sa, cadY + lx * sa + ly * ca]; };
      var sL = hombro(10.2, -76.4), sC = hombro(-10.4, -76.4);
      formaBrazoEn(lejos, ikBrazo(sL[0], sL[1], r.hx + 4, r.hy - 1.5, 16.4 * e, 14.6 * e, false), e);
      formaBrazoEn(cerca, ikBrazo(sC[0], sC[1], r.hx + 1, r.hy + 1.5, 16.4 * e, 14.6 * e, false), e);
      torsos.push([cadX, cadY]);
    }
    k.fillStyle = rgba(osc(CF.pielS, 0.1), 1); k.fill(lejos);
    for (i = 0; i < torsos.length; i++) { k.save(); k.translate(torsos[i][0], torsos[i][1]); k.rotate(ang); k.scale(e, e); k.translate(0, 55); if (sprite) poner(k, sprite); else pintarTorsoRemero(k); k.restore(); }
    pintarCaminoRemos(k, cr);
    k.fillStyle = rgba(CF.piel, 1); k.fill(cerca);
  }
  // el brazo en un Path2D (para juntar todos los de un color en un solo relleno)
  function formaBrazoEn(p, b, g) {
    var pts = [b[0], b[1], 6.4 * g, b[2], b[3], 4.4 * g, b[4], b[5], 3.4 * g], n = 3, ax = [], ay = [], bx = [], by = [], i;
    for (i = 0; i < n; i++) {
      var i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), dx = pts[i1 * 3] - pts[i0 * 3], dy = pts[i1 * 3 + 1] - pts[i0 * 3 + 1], d = Math.sqrt(dx * dx + dy * dy) || 1, w = pts[i * 3 + 2] / 2;
      ax.push(pts[i * 3] + dy / d * w); ay.push(pts[i * 3 + 1] - dx / d * w); bx.push(pts[i * 3] - dy / d * w); by.push(pts[i * 3 + 1] + dx / d * w);
    }
    p.moveTo(ax[0], ay[0]); p.quadraticCurveTo(ax[1], ay[1], ax[2], ay[2]); p.lineTo(bx[2], by[2]); p.quadraticCurveTo(bx[1], by[1], bx[0], by[0]); p.closePath();
    p.moveTo(b[0] + 3.2 * g, b[1]); p.arc(b[0], b[1], 3.2 * g, 0, TAU);
    var ex = b[4] - b[2], ey = b[5] - b[3], ed = Math.sqrt(ex * ex + ey * ey) || 1, hx = b[4] + ex / ed * 1.8 * g, hy = b[5] + ey / ed * 1.8 * g, rot = Math.atan2(ey, ex);
    p.moveTo(hx + Math.cos(rot) * 2.9 * g, hy + Math.sin(rot) * 2.9 * g); p.ellipse(hx, hy, 2.9 * g, 2.3 * g, rot, 0, TAU);
  }
  A.barcaRemos = pieza({
    ancho: 0.45, alto: 0.28, abajo: 0.05,
    dibujar: function (ctx, s, k, op) {
      var anim = op.t != null, t = op.t || 0, sem = op.semilla || 1, v = anim ? vaiven(t, sem, 0.8) : { dy: 0, giro: 0 };
      var R = REMOS, f = anim ? ((t / R.T) % 1 + 1) % 1 : (op.palada == null ? 0.25 : op.palada), caja = [-216, -262, 214, 40];
      var c = enCache('barca-remos', s, k, caja, pintarBarcaRemosQuieta);
      // a cada palada, la barca da un pequeño empujón hacia delante
      var emp = anim ? Math.sin(f * TAU) * 0.6 : 0;
      ponerFlotando(ctx, c, enCacheAgua(c, 'barca-remos', s, k), v.dy, v.giro, 0, -40, !anim);
      var torso = enCache('remero-torso', s, k, [-17, -103, 17, -52], pintarTorsoRemero), remos = remosDe(f), cr = caminoRemos(remos);
      ctx.save(); ctx.translate(emp, v.dy); ctx.rotate(v.giro);
      // por encima del agua, los remeros y los remos; por debajo, solo las palas, veladas
      ctx.save(); ctx.beginPath(); ctx.rect(-230, -300, 460, 300 - v.dy); ctx.clip(); pintarRemeros(ctx, f, torso, remos, cr); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(-230, -v.dy, 460, 80); ctx.clip(); ctx.globalAlpha *= 0.45; pintarCaminoRemos(ctx, cr); ctx.restore();
      // la borda de delante de los remeros (para que queden dentro de la barca)
      relleno(ctx, function (c2) { c2.moveTo(-150, R.yG - 1); c2.quadraticCurveTo(0, R.yG + 3, 150, R.yG - 1); c2.lineTo(150, R.yG + 7); c2.quadraticCurveTo(0, R.yG + 10, -150, R.yG + 7); c2.closePath(); }, ES.lin(ctx, 0, R.yG - 2, 0, R.yG + 9, [[0, cla(CB.madera, 0.25)], [0.45, CB.madera], [0.5, P.verde], [1, osc(P.verde, 0.2)]]));
      ctx.restore();
      // las ondas: a lo largo del casco y donde entran las palas
      ondas(ctx, R.x0 + 60, R.x1 - 50, t, 0.9);
      if (anim && f < 0.45) for (var j = 0; j < remos.length; j++) { var q = f / 0.45; if (remos[j].by > 0) anillo(ctx, remos[j].bx - Math.sin(remos[j].g.th) * remos[j].by + emp, 3 + 9 * q, 0.6 * (1 - q)); }
    }
  });
  A.barcaRemos.signo = '𓊛';
  A.barcaRemos.mastil = { dx: REMOS.mastil / M, dy: (REMOS.tope - 24) / 2 / M, w: 0.012, h: (-REMOS.tope - 24) / M };

  /* ---------- el esquife de papiro ----------
     Una barquita de haces de papiro atados con cuerdas, con las puntas que suben y se abren; de pie, un pescador que
     levanta la fisga de dos puntas y la clava en el agua (op.t). Unos 0,22 u. */
  var ESQ = { x0: -112, x1: 112, yB: 8, yG: -12 };
  function formaEsquife(k) {
    var E = ESQ;
    k.moveTo(E.x0 - 4, -44);
    k.bezierCurveTo(E.x0 + 8, -26, E.x0 + 26, E.yB, E.x0 + 60, E.yB);
    k.lineTo(E.x1 - 60, E.yB);
    k.bezierCurveTo(E.x1 - 26, E.yB, E.x1 - 8, -26, E.x1 + 4, -44);
    k.bezierCurveTo(E.x1 - 4, -36, E.x1 - 20, E.yG, E.x1 - 54, E.yG);
    k.lineTo(E.x0 + 54, E.yG);
    k.bezierCurveTo(E.x0 + 20, E.yG, E.x0 + 4, -36, E.x0 - 4, -44);
    k.closePath();
  }
  function pintarEsquife(k) {
    var E = ESQ, i;
    relleno(k, formaEsquife, ES.lin(k, 0, E.yG - 4, 0, E.yB, [[0, CB.juncoLuz], [0.5, CB.junco], [1, CB.juncoOsc]]));
    k.save(); k.beginPath(); formaEsquife(k); k.clip();
    // los tallos del haz, a lo largo
    k.beginPath();
    for (i = 1; i < 6; i++) { var yy = E.yG + (E.yB - E.yG) * i / 6; k.moveTo(E.x0 - 20, yy - 30 * (1 - i / 6)); k.bezierCurveTo(E.x0 + 40, yy + 2, E.x1 - 40, yy + 2, E.x1 + 20, yy - 30 * (1 - i / 6)); }
    k.strokeStyle = rgba(CB.juncoOsc, 0.5); k.lineWidth = 0.9; k.stroke();
    // las ataduras: bandas de cuerda a intervalos
    var at = new Path2D();
    for (i = 0; i < 9; i++) { var x = E.x0 + 34 + i * 20; at.moveTo(x - 3.5, E.yG - 20); at.lineTo(x + 2.5, E.yG - 20); at.lineTo(x + 3.5, E.yB + 4); at.lineTo(x - 2.5, E.yB + 4); at.closePath(); }
    k.fillStyle = rgba(mez(CB.cuerda, CB.juncoLuz, 0.45), 0.9); k.fill(at);
    k.restore();
    // las puntas: los tallos que se abren en abanico
    for (var lado = -1; lado <= 1; lado += 2) {
      var px = lado < 0 ? E.x0 - 4 : E.x1 + 4;
      k.beginPath();
      for (i = 0; i < 5; i++) { var a = -PI / 2 + lado * (0.25 + i * 0.16); hoja(k, px, -40, px + Math.cos(a) * 12, -40 + Math.sin(a) * 12, 3, 0, 2.4); }
      k.fillStyle = ES.lin(k, px, -54, px, -40, [[0, cla(CB.juncoLuz, 0.2)], [1, CB.junco]]); k.fill();
      k.save(); k.translate(px - lado * 8, -34); k.rotate(lado * 0.85);
      k.fillStyle = rgba(mez(CB.cuerda, CB.juncoLuz, 0.4), 1); k.fillRect(-5, -1.2, 10, 2.4); k.fillRect(-5, 3, 10, 2.4);
      k.restore();
    }
    luz(k, formaEsquife, 0, E.yG - 4, 0, E.yG + 6, 0.4, P.oro1);
  }
  // el lance de la fisga: arriba, preparado; de golpe, al agua; se queda; vuelve
  function lanceFisga(t, sem) {
    var P0 = 3600, tt = ((t + sem * 701) % P0 + P0) % P0, e;
    if (tt < 1500) e = -0.15 * U.suave(tt / 1500);
    else if (tt < 1700) e = -0.15 + 1.15 * U.sale((tt - 1500) / 200);
    else if (tt < 2300) e = 1;
    else e = 1 - U.inOut((tt - 2300) / 1300);
    return { e: e, tt: tt, pez: U._h(Math.floor((t + sem * 701) / P0) * 1.7 + sem) < 0.35 && tt > 2300 };
  }
  // el pescador: el cuerpo sin brazos va en caché; los brazos y la fisga se pintan en cada fotograma
  var PESC = { x: 4, H: 96 };
  function pintarCuerpoPescador(k) { figuraEn(k, PESC.x, ESQ.yG + 4, PESC.H, { piernas: 'paso' }); }
  function fisgaDe(e) {
    var ax = -2 + (-30 + 2) * Math.max(0, e), ay = -104 + (-58 + 104) * Math.max(0, e) + (e < 0 ? e * 50 : 0);
    var ang = 0.9 + 0.4 * e, L = 150, ux = -Math.cos(ang), uy = Math.sin(ang);
    return { ax: ax, ay: ay, ux: ux, uy: uy, tx: ax + ux * L * 0.62, ty: ay + uy * L * 0.62, bx: ax - ux * L * 0.38, by: ay - uy * L * 0.38, fx: ax - ux * 18, fy: ay - uy * 18 };
  }
  function pintarFisga(k, fg, conPez) {
    k.beginPath(); k.moveTo(fg.bx, fg.by); k.lineTo(fg.tx, fg.ty);
    var nx = -fg.uy, ny = fg.ux;
    k.moveTo(fg.tx, fg.ty); k.lineTo(fg.tx + fg.ux * 10 + nx * 3, fg.ty + fg.uy * 10 + ny * 3); k.moveTo(fg.tx, fg.ty); k.lineTo(fg.tx + fg.ux * 10 - nx * 3, fg.ty + fg.uy * 10 - ny * 3);
    k.strokeStyle = rgba(CB.maderaLuz, 1); k.lineWidth = 2.2; k.lineCap = 'round'; k.stroke();
    if (conPez) { k.save(); k.translate(fg.tx + fg.ux * 8, fg.ty + fg.uy * 8); k.rotate(Math.atan2(fg.uy, fg.ux) + PI / 2); k.scale(1.4, 1.4); pintarPececillo(k); k.restore(); }
  }
  function pintarBrazosPescador(k, fg, cerca) {
    var e = PESC.H / 100, x0 = PESC.x, y0 = ESQ.yG + 4;
    var h = cerca ? [fg.ax, fg.ay] : [fg.fx, fg.fy], sx = x0 + (cerca ? -10.4 : 10.2) * e, sy = y0 - 76.4 * e;
    var b = ikBrazo(sx, sy, h[0], h[1], 16.4 * e, 14.6 * e, false), pth = new Path2D(); formaBrazoEn(pth, b, e);
    k.fillStyle = cerca ? ES.lin(k, 0, y0 - 80 * e, 0, y0 - 50 * e, [[0, cla(CF.piel, 0.12)], [1, CF.piel]]) : rgba(osc(CF.pielS, 0.1), 1); k.fill(pth);
  }
  A.esquife = pieza({
    ancho: 0.26, alto: 0.17, abajo: 0.045,
    dibujar: function (ctx, s, k, op) {
      var anim = op.t != null, t = op.t || 0, sem = op.semilla || 1, v = anim ? vaiven(t, sem, 1.4) : { dy: 0, giro: 0 }, L = anim ? lanceFisga(t, sem) : { e: op.lance || 0, tt: 0, pez: false };
      ctx.save(); espejo(ctx, op.dir || 1);
      var c = enCache('esquife', s, k, [-124, -60, 124, 14], pintarEsquife);
      ponerFlotando(ctx, c, enCacheAgua(c, 'esquife', s, k), v.dy, v.giro, 0, -10, !anim);
      ctx.save(); ctx.translate(0, v.dy); ctx.rotate(v.giro);
      var fg = fisgaDe(L.e);
      // el brazo de detrás, el cuerpo (en caché), la fisga (con su parte bajo el agua velada) y el brazo de delante
      pintarBrazosPescador(ctx, fg, false);
      if (anim) poner(ctx, enCache('pescador', s, k, [-24, -100, 30, 0], pintarCuerpoPescador)); else pintarCuerpoPescador(ctx);
      ctx.save(); ctx.beginPath(); ctx.rect(-200, -300, 400, 300 - v.dy); ctx.clip(); pintarFisga(ctx, fg, L.pez); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(-200, -v.dy, 400, 80); ctx.clip(); ctx.globalAlpha *= 0.45; pintarFisga(ctx, fg, false); ctx.restore();
      pintarBrazosPescador(ctx, fg, true);
      ctx.restore();
      ondas(ctx, ESQ.x0 + 40, ESQ.x1 - 40, t, 0.8);
      if (anim && L.tt > 1650 && L.tt < 2600) { var q = (L.tt - 1650) / 950, px = fg.tx + fg.ux * 10 - fg.ux * (fg.ty + v.dy) / (fg.uy || 1); anillo(ctx, px, 3 + 16 * q, 0.7 * (1 - q)); }
      ctx.restore();
    }
  });

  /* ---------- la barca solar de Ra ----------
     Como la de la referencia 4: el casco curvo de madera dorada y anaranjada, con la proa que sube y se abre en una gran
     umbela de papiro (el borde de oro con cuentas de cornalina y lapislázuli, rayos de turquesa, verde y azul, y la
     estrella azul en el centro) y la popa que se curva hacia atrás y acaba en una flor de loto, con las cintas de oro;
     las bandas rojas y blancas en los cuellos; la banda de cuadraditos con su punto rojo, la raya de oro y el panel rojo.
     En el centro, la capilla con el disco solar y el uraeus; Ra con cabeza de halcón y el disco, Thot con cabeza de ibis
     y el disco lunar, que escribe en su paleta, y el timonel arrodillado con el remo. Va hacia la izquierda. */
  var SOL = { x0: -300, x1: 300, yB: 14, yG: -26 };
  function cascoSolar(k) {
    // el cuerpo del casco: sube a proa en un cuello alto (la umbela) y a popa en un cuello que se curva hacia atrás
    k.moveTo(-226, -60);
    k.bezierCurveTo(-210, -20, -170, SOL.yB, -100, SOL.yB);
    k.lineTo(100, SOL.yB);
    k.bezierCurveTo(170, SOL.yB, 214, -14, 232, -60);
    k.lineTo(222, -64);
    k.bezierCurveTo(206, -36, 170, SOL.yG, 110, SOL.yG);
    k.lineTo(-110, SOL.yG);
    k.bezierCurveTo(-164, SOL.yG, -200, -36, -214, -64);
    k.closePath();
  }
  function cuellosSolar(k) {
    // el cuello de proa: sube y se abre hacia fuera; el de popa: sube y se curva hacia atrás (cuello de cisne)
    tiraPor(k, [-220, -58, 20, -236, -100, 18, -258, -150, 16, -268, -176, 14]);
    tiraPor(k, [226, -58, 20, 246, -110, 18, 248, -160, 15, 232, -196, 13, 210, -204, 12]);
  }
  function pintarUmbelaSolar(k) {
    // la gran umbela de papiro de la proa, abierta hacia fuera (hacia la izquierda), como en la referencia 4
    k.save(); k.translate(-268, -176); k.rotate(0.5);
    var R = 50, A0 = 1.0, i;
    function abanico(c, r0, r1) {
      c.moveTo(Math.cos(PI - A0) * r1, Math.sin(PI - A0) * r1); c.arc(0, 0, r1, PI - A0, PI + A0, false);
      c.lineTo(Math.cos(PI + A0) * r0, Math.sin(PI + A0) * r0); c.arc(0, 0, r0, PI + A0, PI - A0, true); c.closePath();
    }
    // el borde de oro con sus cuentas de cornalina y lapislázuli
    relleno(k, function (c) { abanico(c, R * 0.78, R + 7.5); }, ES.oro(k, -R, -R, -R * 0.5, R, 0.3));
    // las cuentas: cornalina y lapislázuli alternas, con su brillo (un camino por color)
    var cuC = new Path2D(), cuL = new Path2D(), cuB = new Path2D();
    for (i = 0; i < 12; i++) {
      var th = PI - A0 + 2 * A0 * (i + 0.5) / 12, gx = Math.cos(th) * (R + 3.6), gy = Math.sin(th) * (R + 3.6), pc = i % 2 ? cuL : cuC;
      pc.moveTo(gx + 3.1, gy); pc.arc(gx, gy, 3.1, 0, TAU); cuB.moveTo(gx - 0.4 + 1.3, gy - 1.3); cuB.ellipse(gx - 0.4, gy - 1.3, 1.3, 0.7, -0.3, 0, TAU);
    }
    k.fillStyle = ES.rad(k, -R, -R * 0.3, 0, R * 1.3, [[0, cla(P.cornalina, 0.25)], [1, osc(P.cornalina, 0.2)]]); k.fill(cuC);
    k.fillStyle = ES.rad(k, -R, -R * 0.3, 0, R * 1.3, [[0, cla(P.lapis, 0.3)], [1, osc(P.lapis, 0.2)]]); k.fill(cuL);
    k.fillStyle = rgba([255, 235, 210], 0.45); k.fill(cuB);
    // los rayos: turquesa, verde, azul claro y oro, alternados (un camino por color)
    var cols = [P.turquesa, P.verde, cla(P.egipcio, 0.3), P.oro2], rayos = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    for (i = 0; i < 18; i++) {
      var b0 = PI - A0 + 2 * A0 * i / 18, b1 = PI - A0 + 2 * A0 * (i + 1) / 18, pr = rayos[i % 4];
      pr.moveTo(Math.cos(b0) * R * 0.5, Math.sin(b0) * R * 0.5); pr.lineTo(Math.cos(b0) * R * 0.79, Math.sin(b0) * R * 0.79); pr.lineTo(Math.cos(b1) * R * 0.79, Math.sin(b1) * R * 0.79); pr.lineTo(Math.cos(b1) * R * 0.5, Math.sin(b1) * R * 0.5); pr.closePath();
    }
    for (i = 0; i < 4; i++) { k.fillStyle = rgba(cols[i], 1); k.fill(rayos[i]); }
    // la banda naranja y, en el centro, el loto azul de pétalos puntiagudos
    relleno(k, function (c) { abanico(c, R * 0.36, R * 0.51); }, ES.lin(k, -R * 0.5, 0, 0, 0, [[0, P.cornalina], [1, osc(P.cornalina, 0.2)]]));
    relleno(k, function (c) { abanico(c, 0.01, R * 0.37); }, ES.lin(k, -R * 0.37, 0, 0, 0, [[0, cla(P.egipcio, 0.35)], [1, P.egipcio]]));
    k.beginPath();
    for (i = 0; i < 3; i++) { var pa = PI + (i - 1) * 0.62; hoja(k, -2, 0, Math.cos(pa) * R * 0.33, Math.sin(pa) * R * 0.33, 7, 0, 3); }
    k.fillStyle = ES.lin(k, -R * 0.3, 0, 0, 0, [[0, P.lapis], [1, P.lapis2]]); k.fill();
    relleno(k, function (c) { elipse(c, -3, 0, 3.2, 3.2); }, rgba(P.lapis2, 1));
    k.restore();
  }
  function pintarLotoPopa(k) {
    k.save(); k.translate(208, -204); k.rotate(-0.2);
    // las cintas de oro que cuelgan
    k.beginPath(); for (var i = 0; i < 3; i++) { tira(k, 4, 6 + i * 6, 14, 30 + i * 6, 30, 46 + i * 7, 3.4, 3.4, 6); }
    k.fillStyle = ES.oro(k, 0, 10, 30, 60, 0.4); k.fill();
    // la flor: el creciente azul y los pétalos de oro
    relleno(k, function (c) { c.moveTo(-2, -10); c.quadraticCurveTo(-26, -18, -26, 0); c.quadraticCurveTo(-26, 18, -2, 10); c.quadraticCurveTo(-14, 0, -2, -10); c.closePath(); }, ES.lin(k, -26, 0, -2, 0, [[0, cla(P.egipcio, 0.3)], [1, P.lapis]]));
    relleno(k, function (c) { c.moveTo(0, -6); c.lineTo(-18, -12); c.lineTo(-10, -3); c.lineTo(-22, 0); c.lineTo(-10, 3); c.lineTo(-18, 12); c.lineTo(0, 6); c.closePath(); }, ES.oro(k, -20, -10, 0, 10, 0.35));
    atadura(k, 4, -4, PI / 2, 12);
    k.restore();
  }
  function pintarCapilla(k) {
    // la capilla (un quiosco de oro con dos columnas papiriformes y la cornisa de gola), con el disco solar dentro
    var x0 = 30, x1 = 118, y0 = SOL.yG - 2, y1 = -178;
    relleno(k, function (c) { c.moveTo(x0, y0); c.lineTo(x0, y1 + 20); c.lineTo(x1, y1 + 20); c.lineTo(x1, y0); c.closePath(); }, ES.lin(k, 0, y1, 0, y0, [[0, mez(P.lapis, P.lapis2, 0.4)], [1, P.lapis2]]));
    // las estrellas del cielo de la capilla
    k.beginPath(); for (var i = 0; i < 6; i++) { ES.estrella(k, x0 + 14 + (i % 3) * 30, y1 + 36 + Math.floor(i / 3) * 74, 3.4); }
    k.fillStyle = ES.oro(k, 0, y1, 0, y0, 0.4); k.fill();
    // el disco solar con el uraeus
    var cx = (x0 + x1) / 2, cy = -108, r = 30;
    ES.gema(k, cx, cy, r, P.cornalina, true);
    k.save(); k.beginPath(); k.arc(cx, cy, r, 0, TAU); k.clip();
    k.fillStyle = rgba([255, 220, 170], 0.3); k.fillRect(cx - r, cy - r * 0.6, r * 2, r * 0.22); k.fillRect(cx - r, cy + r * 0.05, r * 2, r * 0.12); k.restore();
    k.beginPath(); k.moveTo(cx - r * 0.95, cy + r * 0.62); k.bezierCurveTo(cx - r * 1.32, cy - r * 0.1, cx - r * 1.2, cy - r * 1.15, cx - r * 0.45, cy - r * 1.2);
    k.strokeStyle = rgba(P.turquesa, 1); k.lineWidth = 3.4; k.lineCap = 'round'; k.stroke();
    relleno(k, function (c) { elipse(c, cx - r * 1.08, cy + r * 0.62, 3.6, 5.4, 0.3); }, rgba(P.turquesa, 1));
    // las columnas, el dintel y la cornisa con los uraei
    var col = function (c, x) { c.moveTo(x - 4, y0); c.lineTo(x - 3, y1 + 34); c.lineTo(x - 8, y1 + 22); c.lineTo(x + 8, y1 + 22); c.lineTo(x + 3, y1 + 34); c.lineTo(x + 4, y0); c.closePath(); };
    relleno(k, function (c) { col(c, x0 + 2); col(c, x1 - 2); }, ES.oro(k, x0 - 8, y1, x1, y0, 0.3));
    relleno(k, function (c) { c.moveTo(x0 - 10, y1 + 22); c.lineTo(x1 + 10, y1 + 22); c.lineTo(x1 + 10, y1 + 12); c.lineTo(x0 - 10, y1 + 12); c.closePath(); }, ES.oro(k, 0, y1 + 10, 0, y1 + 22, 0.4));
    relleno(k, function (c) { c.moveTo(x0 - 10, y1 + 12); c.quadraticCurveTo(x0 - 12, y1 + 2, x0 - 18, y1); c.lineTo(x1 + 18, y1); c.quadraticCurveTo(x1 + 12, y1 + 2, x1 + 10, y1 + 12); c.closePath(); }, ES.lin(k, 0, y1, 0, y1 + 12, [[0, P.turquesa], [0.5, P.lapis], [1, P.oro2]]));
    k.beginPath(); for (i = 0; i < 9; i++) { var ux = x0 - 10 + i * 13.5; k.moveTo(ux, y1); k.quadraticCurveTo(ux - 2, y1 - 6, ux + 1, y1 - 9); k.quadraticCurveTo(ux + 4, y1 - 6, ux + 3, y1); k.closePath(); }
    k.fillStyle = ES.oro(k, 0, y1 - 10, 0, y1, 0.4); k.fill();
  }
  function pintarBarcaSolar(k) {
    var i;
    // el remo del timonel, largo, de oro, hasta el agua por detrás de la popa
    pintarRemo(k, 196, -96, 262, 30, ES.oro(k, 190, -100, 262, 30, 0.35), 4, 34);
    // los cuellos y el casco, de madera dorada y anaranjada, con sus rayas finas a lo largo
    var gradM = ES.lin(k, 0, -70, 0, SOL.yB, [[0, mez(P.oro2, CB.madera, 0.5)], [0.4, CB.madera], [1, mez(CB.maderaOsc, P.rojo, 0.3)]]);
    relleno(k, cuellosSolar, ES.lin(k, -260, -180, 260, -60, [[0, mez(P.oro2, CB.madera, 0.35)], [0.5, CB.madera], [1, CB.maderaOsc]]));
    k.save(); k.beginPath(); cuellosSolar(k); k.clip();
    k.beginPath();
    for (i = -2; i <= 2; i++) { var o = i * 3.6; k.moveTo(-220 + o, -58); k.bezierCurveTo(-236 + o, -100, -258 + o, -150, -268 + o, -176); k.moveTo(226 + o, -58); k.bezierCurveTo(246 + o, -110, 248 + o, -160, 210 + o, -204); }
    k.strokeStyle = rgba(CB.maderaOsc, 0.45); k.lineWidth = 1; k.stroke(); k.restore();
    relleno(k, cascoSolar, gradM);
    k.save(); k.beginPath(); cascoSolar(k); k.clip();
    k.beginPath(); for (i = 1; i < 6; i++) { var yy = SOL.yG + (SOL.yB - SOL.yG) * i / 6; k.moveTo(-240, yy - 30 * (1 - i / 6)); k.bezierCurveTo(-140, yy + 2, 140, yy + 2, 240, yy - 30 * (1 - i / 6)); }
    k.strokeStyle = rgba(CB.maderaOsc, 0.35); k.lineWidth = 1; k.stroke();
    // las bandas blanca y roja junto a los cuellos
    for (var lado = -1; lado <= 1; lado += 2) { k.fillStyle = rgba(P.lino, 1); k.fillRect(lado * 188 - 8, -80, 9, 100); k.fillStyle = rgba(P.rojo, 1); k.fillRect(lado * 188 + 2, -80, 5, 100); k.fillRect(lado * 188 - 14, -80, 5, 100); }
    k.restore();
    // el panel del centro: la banda de cuadraditos blancos con su punto rojo, la raya de oro y el panel rojo
    var px0 = -130, px1 = 130, py0 = SOL.yG - 1, py1 = py0 + 13, py2 = py1 + 4, py3 = SOL.yB - 2;
    relleno(k, function (c) { c.moveTo(px0 + 10, py2); c.lineTo(px1 - 10, py2); c.lineTo(px1 - 26, py3); c.lineTo(px0 + 26, py3); c.closePath(); }, ES.lin(k, px0, 0, px1, 0, [[0, osc(P.cornalina, 0.2)], [0.5, cla(P.cornalina, 0.18)], [1, osc(P.cornalina, 0.25)]]));
    relleno(k, function (c) { c.moveTo(px0 + 2, py0); c.lineTo(px1 - 2, py0); c.lineTo(px1 - 6, py1); c.lineTo(px0 + 6, py1); c.closePath(); }, rgba(mez(P.cornalina, P.oro3, 0.4), 1));
    var cuad = new Path2D(), pts = new Path2D();
    for (i = 0; i < 20; i++) { var qx = px0 + 9 + i * 12.6; cuad.rect(qx, py0 + 2, 8, 9.5); pts.moveTo(qx + 4 + 1.4, py0 + 6.8); pts.arc(qx + 4, py0 + 6.8, 1.4, 0, TAU); }
    k.fillStyle = ES.lin(k, 0, py0, 0, py1, [[0, P.lino], [1, P.lino2]]); k.fill(cuad);
    k.fillStyle = rgba(P.rojo, 1); k.fill(pts);
    relleno(k, function (c) { c.moveTo(px0 + 6, py1); c.lineTo(px1 - 6, py1); c.lineTo(px1 - 8, py2); c.lineTo(px0 + 8, py2); c.closePath(); }, ES.oro(k, 0, py1, 0, py2, 0.4));
    luz(k, cascoSolar, 0, -60, 0, -20, 0.35, P.oro1);
    // la proa (umbela) y la popa (loto)
    atadura(k, -264, -168, -0.4, 16); atadura(k, 238, -150, 0.2, 14);
    pintarUmbelaSolar(k);
    pintarLotoPopa(k);
    // la capilla con el disco, Ra delante de ella, Thot a proa y el timonel arrodillado a popa
    pintarCapilla(k);
    // el cetro uas de Ra (por detrás de su mano de delante): un palo de oro con la cabeza de animal arriba y la horquilla abajo
    var rx = -10, ry = SOL.yG - 1, rh = 172 / 100, ux = rx - 22 * rh, uy0 = ry - 92 * rh, uy1 = ry - 2;
    k.beginPath(); k.moveTo(ux, uy0); k.lineTo(ux, uy1 - 6); k.moveTo(ux, uy1 - 6); k.lineTo(ux - 3, uy1); k.moveTo(ux, uy1 - 6); k.lineTo(ux + 3, uy1);
    k.strokeStyle = ES.oro(k, ux - 4, uy0, ux + 4, uy1, 0.4); k.lineWidth = 2.8; k.lineCap = 'round'; k.stroke();
    relleno(k, function (c) { c.moveTo(ux + 1, uy0 + 1); c.lineTo(ux - 9, uy0 - 2); c.lineTo(ux - 8, uy0 - 6); c.lineTo(ux + 2, uy0 - 3); c.closePath(); }, ES.oro(k, ux - 9, uy0 - 6, ux + 2, uy0 + 1, 0.4));
    figuraEn(k, rx, ry, 172, { piernas: 'juntas', cabeza: 'halcon', disco: 'sol', falda: 'oro', manoCerca: [-22, -58], manoLejos: [-12, -48] });
    figuraEn(k, -150, SOL.yG - 1, 164, { piernas: 'juntas', cabeza: 'ibis', disco: 'luna', falda: 'blanca', manoCerca: [-20, -66], manoLejos: [-14, -72] });
    // la paleta de escriba de Thot
    relleno(k, function (c) { c.moveTo(-150 - 38, SOL.yG - 1 - 164 * 0.8); c.lineTo(-150 - 33, SOL.yG - 1 - 164 * 0.81); c.lineTo(-150 - 31, SOL.yG - 1 - 164 * 0.56); c.lineTo(-150 - 36, SOL.yG - 1 - 164 * 0.55); c.closePath(); }, ES.oro(k, -190, -150, -180, -100, 0.4));
    figuraEn(k, 196, SOL.yG - 1, 124, { piernas: 'arrodillado', piel: 'm', peluca: 'larga', collar: true, manoCerca: [-6, -56], manoLejos: [2, -70], codoArriba: false });
  }
  A.barcaSolar = pieza({
    ancho: 0.66, alto: 0.32, abajo: 0.05,
    dibujar: function (ctx, s, k, op) {
      var anim = op.t != null, t = op.t || 0, sem = op.semilla || 1, v = anim ? vaiven(t, sem, 0.7) : { dy: 0, giro: 0 };
      var c = enCache('barca-solar', s, k, [-330, -300, 330, 50], pintarBarcaSolar);
      ponerFlotando(ctx, c, enCacheAgua(c, 'barca-solar', s, k), v.dy, v.giro, 0, -60, !anim);
      ondas(ctx, -170, 170, t, 0.9);
    }
  });

  /* ---------- sitios exportados (en u, respecto al ancla; dy negativo es hacia arriba) ---------- */
  A.barcaSolar.signo = '𓊞';   // P3, la barca sagrada
  A.barcaSolar.disco = { dx: 0.074, dy: -0.108, w: 0.064, h: 0.064 };     // el disco solar de la capilla
  A.barcaSolar.ra = { dx: -0.03, dy: -0.12, w: 0.06, h: 0.2 };            // Ra con cabeza de halcón
  A.barcaSolar.thot = { dx: -0.165, dy: -0.11, w: 0.06, h: 0.19 };        // Thot con cabeza de ibis
  A.esquife.pescador = { dx: 0.004, dy: -0.06, w: 0.035, h: 0.1 };
})();

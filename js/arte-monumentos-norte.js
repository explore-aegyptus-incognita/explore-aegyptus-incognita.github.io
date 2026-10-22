/* Aegyptus Incognita · arte · los monumentos del norte, de Amarna al Mediterráneo
   Dendera, Amarna, Saqqara, las pirámides de Guiza (Keops, Kefrén y Micerinos con sus reinas), la Gran Esfinge, el Faro
   de Alejandría (entero o en ruinas) y las piezas para salpicar el camino (obelisco, aldea y Alejandría).
   Piezas quietas: se pintan una vez en teselas (contrato en herramientas/encargos/contrato-arte.md). Todo va en u (el alto
   del friso); (x, y) es el centro de la base, sobre el suelo, y s son los px por u. La luz viene de arriba a la izquierda:
   la cara de la izquierda al sol y la de la derecha en sombra. Sin contornos: las formas se separan por el color y por
   degradados suaves, como en las referencias 2 y 4.
   Lo que exportan (en u, respecto al ancla; dy negativo es hacia arriba):
   · AE.arte.keops.entrada = { dx, dy, w, h }: los chevrones y la boca de la entrada original (unos 17 m sobre el suelo).
   · AE.arte.esfinge.estela = { dx, dy, w, h } (la Estela del Sueño) y AE.arte.esfinge.sombra = { dx, dy, w } (el sitio a la
     sombra de la cabeza, delante de las patas, para el gato tumbado).
   · AE.arte.faro.fuego = { dx, dy }: el centro de la linterna, vacía y oscura.
   · AE.arte.amarna.altar = { dx, dy }: el centro del gran altar, donde pueden llegar los rayos del Atón.
   · obelisco y faro tienen caja(op): su caja depende de op.alto (obelisco) y de op.ruina (faro).
   · letra: true en las piezas que usan la fuente de jeroglíficos (dendera, obelisco, alejandria): hay que repintarlas si
     se pintaron antes de que cargara.
   Rendimiento: sin recortes (clip) donde se puede, que en Safari es lo más caro; lo repetido (columnas de Dendera, mesas
   de ofrendas) se pinta una vez en un sello y se estampa alineado al píxel. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, TAU = Math.PI * 2;
  AE.arte = AE.arte || {};
  var A = AE.arte;

  /* ------------------------------------------------------------------ ayudas */
  var mez = U.mezcla, aclarar = ES.aclarar, oscurecer = ES.oscurecer, css = U.rgba;
  var BLANCO = [255, 250, 236], OSCURO = [52, 30, 14];

  // los tonos de la piedra (todos mezclados de la paleta)
  var CAL = {                                   // caliza
    luz: aclarar(P.piedra, 0.34), sol: aclarar(P.piedra, 0.14), medio: P.piedra,
    sombra: mez(P.piedra, P.piedra2, 0.8), sombra2: oscurecer(P.piedra2, 0.12), honda: oscurecer(P.piedra2, 0.34)
  };
  var TURA = { sol: aclarar(P.piedra, 0.5), medio: aclarar(P.piedra, 0.3), sombra: mez(P.piedra2, P.piedra, 0.45) };   // caliza fina de Tura
  var ARENISCA = {                              // la arenisca de Dendera, más anaranjada
    luz: aclarar(mez(P.piedra, P.arena2, 0.4), 0.26), sol: aclarar(mez(P.piedra, P.arena2, 0.45), 0.08),
    medio: mez(P.piedra, P.arena2, 0.5), sombra: mez(P.arena2, P.piedra2, 0.6), honda: oscurecer(P.piedra2, 0.3)
  };
  ARENISCA.sombra2 = mez(ARENISCA.sombra, ARENISCA.honda, 0.5);
  var ADOBE = { sol: mez(P.arena2, P.tinta, 0.18), medio: mez(P.arena2, P.tinta, 0.3), sombra: mez(P.arena2, P.tinta, 0.45), honda: mez(P.arena2, P.tinta, 0.62) };
  var MARMOL = { luz: aclarar(P.lino, 0.35), sol: P.lino, medio: mez(P.lino, P.lino2, 0.45), sombra: mez(P.lino2, P.piedra2, 0.35), sombra2: mez(P.lino2, P.piedra2, 0.55), honda: mez(P.lino2, P.piedra2, 0.75) };
  var TEJA = { sol: mez(P.cornalina, P.oro2, 0.35), medio: mez(P.rojo, P.oro3, 0.3), sombra: oscurecer(mez(P.rojo, P.oro3, 0.3), 0.3) };
  var OSCURIDAD = mez(P.negro, P.tinta, 0.45);  // lo que está dentro: puertas, ventanas, la linterna del faro

  // un polígono a partir de [x0, y0, x1, y1, …] (en el camino actual)
  function poli(k, pts) { k.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) k.lineTo(pts[i], pts[i + 1]); k.closePath(); }
  function relleno(k, fn, estilo) { k.beginPath(); fn(k); k.fillStyle = estilo; k.fill(); }
  // un degradado vertical de tres paradas
  function vertical(k, y0, y1, c0, c1, c2) { return ES.lin(k, 0, y0, 0, y1, [[0, c0], [0.55, c1], [1, c2]]); }
  function horizontal(k, x0, x1, c0, c1, c2) { return ES.lin(k, x0, 0, x1, 0, [[0, c0], [0.5, c1], [1, c2]]); }

  // lotes de rectángulos: se juntan en un solo camino y se pintan de una vez (mil bloques cuestan como uno)
  function Lote() { this.r = []; }
  Lote.prototype.rect = function (a, b, c, d) { this.r.push(a, b, c, d); };
  Lote.prototype.pintar = function (k, estilo) {
    var r = this.r; if (!r.length) return;
    k.beginPath(); for (var i = 0; i < r.length; i += 4) k.rect(r[i], r[i + 1], r[i + 2], r[i + 3]);
    k.fillStyle = estilo; k.fill();
  };

  /* un sello: lo que se repite igual (una columna, una mesa de ofrendas) se pinta una vez en un lienzo aparte, a la escala
     de verdad del contexto, y se estampa alineado al píxel: seis columnas cuestan como una. caja = { x0, x1, y0, y1 } en u
     respecto al ancla de la figura (y hacia arriba); pintar(ctx, x, y, s) la dibuja con su ancla en (x, y). Si el contexto
     está girado o no se puede leer su transformación, se dibuja directamente. */
  var sellos = {}, nSellos = 0;
  function estampar(k, nombre, x, y, s, caja, pintar) {
    var m = k.getTransform ? k.getTransform() : null;
    if (!m || m.b || m.c || m.a <= 0 || Math.abs(m.a - m.d) > 1e-6) { pintar(k, x, y, s); return; }
    var e = m.a, clave = nombre + '|' + s.toFixed(3) + '|' + e.toFixed(4), L = sellos[clave];
    if (!L) {
      if (nSellos > 40) { sellos = {}; nSellos = 0; }
      L = U.lienzo((caja.x1 - caja.x0) * s * e + 4, (caja.y1 - caja.y0) * s * e + 4);
      L.x.setTransform(e, 0, 0, e, 0, 0);   // (un lienzo propio)
      pintar(L.x, -caja.x0 * s + 2 / e, caja.y1 * s + 2 / e, s);
      sellos[clave] = L; nSellos++;
    }
    // la esquina del sello, en píxeles del dispositivo, redondeada: así se estampa 1:1, nítido
    var dx = Math.round((x + caja.x0 * s) * e + m.e - 2), dy = Math.round((y - caja.y1 * s) * e + m.f - 2);
    k.save(); k.imageSmoothingEnabled = false;
    k.drawImage(L.c, (dx - m.e) / e, (dy - m.f) / e, L.c.width / e, L.c.height / e);
    k.restore();
  }

  // una pluma en u: X a la derecha e Y hacia arriba desde el ancla (x, y)
  function pluma(k, x, y, s) {
    var p = {
      m: function (X, Y) { k.moveTo(x + X * s, y - Y * s); return p; },
      l: function (X, Y) { k.lineTo(x + X * s, y - Y * s); return p; },
      q: function (a, b, X, Y) { k.quadraticCurveTo(x + a * s, y - b * s, x + X * s, y - Y * s); return p; },
      c: function (a, b, c, d, X, Y) { k.bezierCurveTo(x + a * s, y - b * s, x + c * s, y - d * s, x + X * s, y - Y * s); return p; },
      z: function () { k.closePath(); return p; },
      px: function (X) { return x + X * s; }, py: function (Y) { return y - Y * s; }
    };
    return p;
  }

  // un bloque de piedra suelto (caído o de escombro): cara al sol, cara en sombra y canto de arriba
  function bloque(k, bx, by, w, h, tono, inclina) {
    inclina = inclina || 0; var t = h * 0.28, dx = w * 0.22;
    k.save(); k.translate(bx, by); k.rotate(inclina);
    relleno(k, function (c) { poli(c, [-w / 2, 0, -w / 2, -h, w / 2 - dx, -h, w / 2 - dx, 0]); }, ES.lin(k, -w / 2, -h, w / 2, 0, [[0, aclarar(tono.sol, 0.1)], [1, tono.medio]]));
    relleno(k, function (c) { poli(c, [w / 2 - dx, 0, w / 2 - dx, -h, w / 2, -h + t * 0.6, w / 2, 0]); }, css(tono.sombra));
    relleno(k, function (c) { poli(c, [-w / 2, -h, -w / 2 + dx * 0.6, -h - t * 0.5, w / 2 - dx * 0.2, -h - t * 0.5, w / 2 - dx, -h]); }, css(aclarar(tono.sol, 0.25)));
    k.restore();
  }

  // arena a los pies de una pieza: un montón suave con la cresta clara (de xa a xb, alto máximo hm, en px)
  function arena(k, xa, xb, y, hm, semilla, op) {
    op = op || {}; var n = Math.max(8, Math.round((xb - xa) / 6)), sem = semilla || 1, i;
    var alturas = [];
    for (i = 0; i <= n; i++) {
      var t = i / n, borde = Math.min(1, t / 0.12, (1 - t) / 0.12);
      alturas.push(hm * U.suave(borde) * (0.45 + 0.55 * U.fbm(t * (op.ondas || 5) + sem * 3.1, sem, 3)));
    }
    var forma = function (c) {
      c.moveTo(xa, y);
      for (var j = 0; j <= n; j++) c.lineTo(xa + (xb - xa) * j / n, y - alturas[j]);
      c.lineTo(xb, y); c.closePath();
    };
    relleno(k, forma, ES.lin(k, 0, y - hm, 0, y, [[0, aclarar(P.arena, 0.22)], [0.5, P.arena], [1, mez(P.arena, P.arena2, 0.7)]]));
    // la luz rasante de la cresta (el mismo montón otra vez, con un degradado de luz: sin recorte)
    relleno(k, forma, ES.lin(k, 0, y - hm, 0, y, [[0, [255, 246, 220], 0.3], [0.5, [255, 246, 220], 0.08], [1, [255, 246, 220], 0]]));
    return forma;
  }

  /* ------------------------------------------------------------------ las pirámides de Guiza
     Un friso: cada pirámide es un triángulo partido por la arista de delante, como vista un poco desde la esquina: la cara
     de la izquierda al sol y la de la derecha, algo más estrecha, en sombra. Sin el revestimiento se ven las hiladas: el
     borde es una escalera, cada hilada tiene su junta oscura y su canto claro, y faltan bloques en las esquinas. */
  function hiladas(n, alto, r) {
    var w = [], tot = 0, i, hs = [0], acc = 0;
    for (i = 0; i < n; i++) { var v = (1.3 - 0.6 * i / (n - 1)) * (0.84 + 0.32 * r()); w.push(v); tot += v; }
    for (i = 0; i < n; i++) { acc += w[i] / tot * alto; hs.push(acc); }
    return hs;
  }
  // cfg: base y alto (u; alto = el vértice ideal), pie (fracción de la base donde baja la arista), n (hiladas), tope (u: hasta
  // dónde llegan las hiladas, si falta la punta), semilla, bloque (ancho medio de un bloque, en hiladas), tono.
  // Sin recortes (clip): en Safari cada recorte de un camino complejo cuesta más que todo lo demás. Cada hilada sabe dónde
  // empieza y acaba en cada cara (la escalera del borde y la arista), y todo se calcula ya ajustado a ella.
  function piramide(k, x, y, s, cfg) {
    var r = U.azar(cfg.semilla), B = cfg.base * s, H = cfg.alto * s, m = (B / 2) / H, n = cfg.n, i, q;
    var xL = x - B / 2, xR = x + B / 2, xF = xL + B * cfg.pie, tope = (cfg.tope || cfg.alto) * s;
    var hs = hiladas(n, tope, r);
    function bI(h) { return xL + h * m; }
    function bD(h) { return xR - h * m; }
    function ar(h) { return xF + (x - xF) * h / H; }
    // la erosión: cada hilada entra algo más o menos en los bordes (faltan bloques en las esquinas), y la arista tiembla
    var eI = [], eD = [], eA = [];
    for (i = 0; i < n; i++) {
      var c0 = hs[i + 1] - hs[i], abajo = i < n * 0.25 ? 1.5 : 1;
      eI.push(r() < 0.24 ? r() * c0 * 1.7 * abajo : r() * c0 * 0.3);
      eD.push(r() < 0.24 ? r() * c0 * 1.4 * abajo : r() * c0 * 0.25);
      eA.push((r() - 0.5) * c0 * 0.55);
    }
    function aX(j2) { return ar(hs[j2]) + (j2 > 0 && j2 < n ? eA[j2] : 0); }
    // los límites de cada hilada q (1…n): [borde izquierdo, arista por dentro de la cara al sol, arista por dentro de la
    // cara en sombra, borde derecho]
    var ext = [];
    for (q = 1; q <= n; q++) { var a0 = aX(q - 1), a1 = aX(q); ext.push(bI(hs[q]) + eI[q - 1], Math.min(a0, a1), Math.max(a0, a1), bD(hs[q]) - eD[q - 1]); }
    function escaleraI(c2) { for (var j = 0; j < n; j++) { var xa = bI(hs[j + 1]) + eI[j]; c2.lineTo(xa, y - hs[j]); c2.lineTo(xa, y - hs[j + 1]); } }
    function escaleraD(c2) { for (var j = n - 1; j >= 0; j--) { var xa = bD(hs[j + 1]) - eD[j]; c2.lineTo(xa, y - hs[j + 1]); c2.lineTo(xa, y - hs[j]); } }
    var g = { x: x, y: y, s: s, B: B, H: H, xL: xL, xR: xR, xF: xF, hs: hs, n: n, ext: ext, bI: bI, bD: bD, ar: ar, r: r };
    g.silueta = function (c2) { c2.moveTo(bI(hs[1]) + eI[0], y); escaleraI(c2); escaleraD(c2); c2.closePath(); };
    g.caraD = function (c2) { c2.moveTo(xF, y); for (var j = 0; j <= n; j++) c2.lineTo(aX(j), y - hs[j]); escaleraD(c2); c2.closePath(); };

    // 1. las dos caras: la de la izquierda al sol, la de la derecha en sombra (con algo de luz rebotada de la arena abajo)
    var cl = cfg.tono || CAL;
    relleno(k, g.silueta, ES.lin(k, xL + B * 0.15, y - H, xF + B * 0.05, y, [[0, cl.luz], [0.45, cl.sol], [1, mez(cl.medio, cl.sombra, 0.35)]]));
    relleno(k, g.caraD, ES.lin(k, x, y - H, xR, y, [[0, mez(cl.sombra, cl.medio, 0.3)], [0.55, cl.sombra], [0.9, cl.sombra2], [1, mez(cl.sombra2, P.arena2, 0.3)]]));

    // 2. las hiladas, en lotes: la junta oscura de cada hilada y el canto claro de la de abajo; pocas juntas verticales (de
    // lejos casi no se ven); manchas de intemperie de varias hiladas; algún bloque que falta. 3. la luz: el canto de la
    // izquierda brilla, la arista tiene un filo claro del lado del sol y el pie de cada cara se oscurece
    var hp = 0.13 * H;
    function textura(luz) {
      var esc = luz ? 1 : 0.72, i0 = luz ? 0 : 2, i1 = luz ? 1 : 3;
      var junta = new Lote(), canto = new Lote(), vert = new Lote(), claros = new Lote(), oscuros = new Lote(), huecos = new Lote(), bordeHueco = new Lote(), pieL = new Lote(), rim = new Lote(), filo = new Lote();
      var wRim = 0.06 * s, wFilo = 0.05 * s;
      for (q = 1; q <= n; q++) {
        var h0 = hs[q - 1], h1 = hs[q], c = h1 - h0, yy = y - h1, gj = Math.max(0.8, c * 0.11), o = (q - 1) * 4, xa = ext[o + i0], xb = ext[o + i1];
        if (xb - xa < 1) continue;
        if (q < n) {
          var xa2 = ext[q * 4 + i0], xb2 = ext[q * 4 + i1];
          if (xb2 > xa2) junta.rect(xa2, yy - gj * 0.5, xb2 - xa2, gj);
          canto.rect(xa, yy + gj * 0.5, xb - xa, Math.max(0.7, c * 0.13));
        }
        var bx = xa + r() * c * 2 * esc;
        while (bx < xb - 1) {
          var bw = c * esc * (cfg.bloque || 2.1) * (0.6 + r() * 0.9), tir = r();
          if (tir < 0.34) vert.rect(bx, yy + gj * 0.5, Math.max(0.55, c * 0.07), c - gj * 0.5);
          else if (tir < 0.355 && q < n - 2) { var hw = Math.min(bw * 0.8, xb - bx); huecos.rect(bx, yy + gj * 0.4, hw, c - gj * 0.4); bordeHueco.rect(bx, y - h0 - c * 0.2, hw, c * 0.2); }
          bx += bw;
        }
        if (h0 < hp) pieL.rect(xa, yy, xb - xa, c);
        if (luz) { rim.rect(xa, yy, Math.min(wRim, xb - xa), c); filo.rect(Math.max(xa, xb - wFilo), yy, Math.min(wFilo, xb - xa), c); }
      }
      var nm = Math.round(n * 0.7);
      for (var mq = 0; mq < nm; mq++) {
        var q0 = Math.floor(r() * (n - 2)), alto = 2 + Math.floor(r() * 5), o0 = q0 * 4, cxm = ext[o0 + i0] + r() * (ext[o0 + i1] - ext[o0 + i0]), wm = (0.02 + r() * 0.06) * s * esc, lote = r() < 0.5 ? claros : oscuros;
        for (var e = 0; e < alto && q0 + e < n; e++) {
          var t = (e + 0.5) / alto, ww = wm * Math.sqrt(1 - (2 * t - 1) * (2 * t - 1)) * (0.75 + r() * 0.5), off = (r() - 0.5) * wm * 0.3, oe = (q0 + e) * 4;
          var ra = Math.max(ext[oe + i0], cxm - ww / 2 + off), rb = Math.min(ext[oe + i1], cxm + ww / 2 + off);
          if (rb > ra) lote.rect(ra, y - hs[q0 + e + 1], rb - ra, hs[q0 + e + 1] - hs[q0 + e]);
        }
      }
      claros.pintar(k, css(BLANCO, luz ? 0.12 : 0.05));
      oscuros.pintar(k, css(OSCURO, luz ? 0.07 : 0.08));
      junta.pintar(k, css(OSCURO, 0.26));
      canto.pintar(k, css(BLANCO, luz ? 0.26 : 0.08));
      vert.pintar(k, css(OSCURO, luz ? 0.17 : 0.15));
      huecos.pintar(k, css(OSCURO, 0.3)); bordeHueco.pintar(k, css(BLANCO, 0.22));
      pieL.pintar(k, ES.lin(k, 0, y - hp, 0, y, [[0, OSCURO, 0], [1, OSCURO, 0.17]]));
      if (luz) {
        // degradados perpendiculares al borde ideal y a la arista: cada rectángulo de hilada toma su trozo de la banda
        var l1 = Math.hypot(H, B / 2), n1x = H / l1, n1y = (B / 2) / l1;
        rim.pintar(k, ES.lin(k, xL, y, xL + n1x * 0.045 * s, y + n1y * 0.045 * s, [[0, [255, 248, 222], 0.26], [0.35, [255, 248, 222], 0.12], [1, [255, 248, 222], 0]]));
        var l2 = Math.hypot(H, x - xF), n2x = -H / l2, n2y = (xF - x) / l2;
        filo.pintar(k, ES.lin(k, xF, y, xF + n2x * 0.04 * s, y + n2y * 0.04 * s, [[0, [255, 244, 214], 0.22], [0.35, [255, 244, 214], 0.1], [1, [255, 244, 214], 0]]));
      }
    }
    textura(true);
    textura(false);
    return g;
  }

  // los escombros y la arena al pie: bloques caídos y un montón de arena que sube por las esquinas
  function pie(k, g, s, ancho, semilla) {
    var r = U.azar(semilla), x = g.x, y = g.y, i;
    arena(k, x - ancho / 2 * s, x + ancho / 2 * s, y, 0.018 * s, semilla, { ondas: 7 });
    for (i = 0; i < 14; i++) {
      var lado = r() < 0.5 ? -1 : 1, bx = x + lado * (g.B / 2 - r() * g.B * 0.12), w = (0.006 + r() * 0.01) * s;
      if (Math.abs(bx - x) > ancho / 2 * s - w) continue;
      bloque(k, bx, y - r() * 0.004 * s, w, w * (0.5 + r() * 0.3), CAL, (r() - 0.5) * 0.3);
    }
  }

  /* ---------- Keops: la Gran Pirámide sin revestimiento (base 230 m, 146,6 m de alto; hoy 138,5 m: le falta la punta) */
  var KEOPS = { base: 0.88, alto: 0.56, pie: 0.585, tope: 0.529, n: 70, semilla: 2560 };
  // la entrada original (en la hilada 19, a unos 17 m) con sus dos pares de bloques en tejadillo (los «chevrones»)
  var M_KEOPS = KEOPS.alto / 146.6;   // u por metro
  var ENTRADA = { dx: -0.172, dy: -(17 * M_KEOPS + 0.015), w: 0.05, h: 0.04 };
  function chevrones(k, x, y, s) {
    var cx = x + ENTRADA.dx * s, cy = y + ENTRADA.dy * s, w = ENTRADA.w * s, h = ENTRADA.h * s, top = cy - h * 0.5, bot = cy + h * 0.5;
    var t1 = h * 0.3, pie1 = cy - h * 0.02, ap2 = top + t1 + h * 0.05, t2 = h * 0.22, pie2 = cy + h * 0.12, HONDO = mez(OSCURIDAD, CAL.honda, 0.3);
    // 1. la sombra de la piedra de alrededor sobre el tejadillo (la mampostería que lo rodea está más adelante)
    relleno(k, function (c) { poli(c, [cx - w * 0.53, pie1 + t1 * 0.2, cx, top - h * 0.07, cx + w * 0.53, pie1 + t1 * 0.2, cx + w * 0.5, pie1 + t1, cx - w * 0.5, pie1 + t1]); }, css(OSCURO, 0.3));
    // 2. el hueco bajo el tejadillo, donde se ha ido la piedra de relleno: casi negro abajo
    // (sus lados bajan en escalones: la mampostería rota alrededor de la entrada)
    relleno(k, function (c) { poli(c, [cx - w * 0.3, bot, cx - w * 0.3, cy + h * 0.38, cx - w * 0.38, cy + h * 0.38, cx - w * 0.38, cy + h * 0.2, cx - w * 0.45, cy + h * 0.2, cx - w * 0.45, pie1 + t1 * 0.8, cx, top + t1 * 0.7,
      cx + w * 0.45, pie1 + t1 * 0.8, cx + w * 0.45, cy + h * 0.24, cx + w * 0.37, cy + h * 0.24, cx + w * 0.37, cy + h * 0.4, cx + w * 0.3, cy + h * 0.4, cx + w * 0.3, bot]); },
      ES.lin(k, 0, top, 0, bot, [[0, CAL.honda], [0.5, HONDO], [1, OSCURIDAD]]));
    // 3. un par de losas en tejadillo: la de la izquierda al sol, la de la derecha en sombra, con la junta en medio
    function par(ap, pX, pY, t, tonoI, tonoD) {
      relleno(k, function (c) { poli(c, [cx, ap, cx - pX, pY, cx - pX, pY + t, cx, ap + t]); }, ES.lin(k, cx - pX, ap, cx, pY + t, [[0, tonoI[0]], [1, tonoI[1]]]));
      relleno(k, function (c) { poli(c, [cx, ap, cx + pX, pY, cx + pX, pY + t, cx, ap + t]); }, ES.lin(k, cx, ap, cx + pX, pY + t, [[0, tonoD[0]], [1, tonoD[1]]]));
      relleno(k, function (c) { poli(c, [cx - pX, pY + t, cx, ap + t, cx + pX, pY + t, cx + pX, pY + t * 1.25, cx, ap + t * 1.25, cx - pX, pY + t * 1.25]); }, css(OSCURO, 0.35));
      k.fillStyle = css(OSCURO, 0.32); k.fillRect(cx - Math.max(0.5, t * 0.03), ap + t * 0.05, Math.max(1, t * 0.06), t * 0.95);
    }
    par(ap2, w * 0.31, pie2, t2, [mez(TURA.medio, CAL.sombra, 0.5), CAL.sombra], [CAL.sombra2, CAL.honda]);
    // 4. la boca del pasillo descendente, negra, con su umbral claro
    relleno(k, function (c) { poli(c, [cx - w * 0.12, pie2 + t2 * 1.3, cx + w * 0.12, pie2 + t2 * 1.3, cx + w * 0.125, bot, cx - w * 0.125, bot]); }, css(OSCURIDAD));
    k.fillStyle = css(TURA.medio); k.fillRect(cx - w * 0.2, bot - h * 0.025, w * 0.4, h * 0.05);
    par(top, w * 0.5, pie1, t1, [aclarar(TURA.sol, 0.1), TURA.sol], [TURA.medio, mez(TURA.sombra, CAL.sombra, 0.4)]);
    // cada losa grande es de dos sillares: su junta, paralela a la pendiente
    k.beginPath(); k.moveTo(cx - w * 0.25, top + (pie1 - top) * 0.5); k.lineTo(cx - w * 0.25, top + (pie1 - top) * 0.5 + t1);
    k.moveTo(cx + w * 0.25, top + (pie1 - top) * 0.5); k.lineTo(cx + w * 0.25, top + (pie1 - top) * 0.5 + t1);
    k.lineWidth = Math.max(0.8, h * 0.03); k.strokeStyle = css(OSCURO, 0.3); k.stroke();
  }
  // el túnel de los ladrones (el de Al-Mamún, por donde se entra hoy): más abajo y a la derecha, un arco de bordes rotos
  function tunel(k, x, y, s) {
    var cx = x - 0.126 * s, cy = y - 7.5 * M_KEOPS * s, w = 0.015 * s, h = 0.0115 * s, r = U.azar(808), i, pts = [cx - w * 0.5, cy + h * 0.5];
    for (i = 0; i <= 10; i++) { var a = Math.PI * (i / 10), rr = 1 + (r() - 0.5) * 0.14; pts.push(cx - Math.cos(a) * w * 0.5 * rr, cy + h * 0.5 - Math.sin(a) * h * rr); }
    pts.push(cx + w * 0.5, cy + h * 0.5);
    relleno(k, function (c) { poli(c, pts); }, ES.lin(k, 0, cy - h * 0.5, 0, cy + h * 0.5, [[0, OSCURIDAD], [1, mez(OSCURIDAD, CAL.honda, 0.4)]]));
    k.fillStyle = css(CAL.sol); k.fillRect(cx - w * 0.62, cy + h * 0.5 - 0.5, w * 1.24, Math.max(1, h * 0.12));
    for (i = 0; i < 3; i++) bloque(k, cx + (r() - 0.3) * w * 1.6, cy + h * 0.5 + h * 0.12, (0.003 + r() * 0.003) * s, (0.002 + r() * 0.0015) * s, CAL);
  }
  A.keops = {
    ancho: 0.92, alto: 0.535, abajo: 0,
    dibujar: function (k, x, y, s, op) {
      var g = piramide(k, x, y, s, KEOPS);
      // la plataforma de arriba: le faltan las últimas hiladas y la punta
      var r = U.azar(77), ht = KEOPS.tope * s, i;
      for (i = 0; i < 5; i++) { var bx = g.bI(ht) + (g.bD(ht) - g.bI(ht)) * (0.12 + i * 0.19), w = (0.006 + r() * 0.004) * s; bloque(k, bx, y - ht + 0.5, w, w * 0.45 * (0.6 + r()), CAL); }
      tunel(k, x, y, s);
      chevrones(k, x, y, s);
      pie(k, g, s, A.keops.ancho, 61);
    }
  };
  A.keops.entrada = { dx: ENTRADA.dx, dy: ENTRADA.dy, w: ENTRADA.w, h: ENTRADA.h };

  /* ---------- Kefrén: conserva arriba el revestimiento liso de caliza clara (base 215 m, 143,5 m de alto, 53°) ---------- */
  var KEFREN = { base: 0.81, alto: 0.54, pie: 0.585, tope: 0.538, n: 68, semilla: 2520, bloque: 2 };
  function revestimiento(k, g, s, desde, semilla) {
    var r = U.azar(semilla), x = g.x, y = g.y, H = g.H, hc = desde * H, i, j, h;
    // el borde de abajo, roto: tramos de bloques a distinta altura (más altos hacia las esquinas, donde se ha roto más)
    var segs = [], xx = g.bI(hc), xfin = g.bD(hc), paso = 0.0085 * s, hMax = 0;
    while (xx < xfin - 0.5) {
      var lado = Math.min(xx - g.bI(hc), xfin - xx) / (xfin - g.bI(hc));
      var hb = hc + ((r() - 0.45) * 0.024 + (lado < 0.12 ? (0.12 - lado) * 0.35 : 0)) * s;
      var xe = Math.min(xfin, xx + paso * (0.6 + r() * 0.9)), xs2 = Math.max(xx, g.bI(hb)), xe2 = Math.min(xe, g.bD(hb));
      if (xe2 > xs2) { segs.push(xs2, xe2, hb); hMax = Math.max(hMax, hb); }
      xx = xe;
    }
    var nS = segs.length;
    function borde(c) { for (var q = 0; q < nS; q += 3) { c.lineTo(segs[q], y - segs[q + 2]); c.lineTo(segs[q + 1], y - segs[q + 2]); } }
    var capa = function (c) { c.moveTo(x, y - H); c.lineTo(g.bI(segs[2]), y - segs[2]); borde(c); c.lineTo(g.bD(segs[nS - 1]), y - segs[nS - 1]); c.closePath(); };
    var capaD = function (c) {
      c.moveTo(x, y - H); var dentro = false;
      for (var q = 0; q < nS; q += 3) {
        var a = g.ar(segs[q + 2]);
        if (!dentro) { if (segs[q + 1] >= a) { c.lineTo(Math.max(a, segs[q]), y - segs[q + 2]); c.lineTo(segs[q + 1], y - segs[q + 2]); dentro = true; } }
        else { c.lineTo(segs[q], y - segs[q + 2]); c.lineTo(segs[q + 1], y - segs[q + 2]); }
      }
      c.lineTo(g.bD(segs[nS - 1]), y - segs[nS - 1]); c.closePath();
    };
    // la sombra que la capa deja sobre el núcleo, justo debajo de su borde roto
    var d = 0.0025 * s;
    relleno(k, function (c) {
      c.moveTo(segs[0] + 2, y - segs[2]); borde(c);
      for (var q = nS - 3; q >= 0; q -= 3) { c.lineTo(Math.min(segs[q + 1], g.bD(segs[q + 2]) - 3), y - segs[q + 2] + d); c.lineTo(Math.max(segs[q], g.bI(segs[q + 2]) + 3), y - segs[q + 2] + d); }
      c.closePath();
    }, css(OSCURO, 0.16));
    relleno(k, capa, ES.lin(k, g.xL + g.B * 0.3, y - H, g.xF, y - hc, [[0, aclarar(TURA.sol, 0.12)], [0.6, TURA.sol], [1, TURA.medio]]));
    relleno(k, capaD, ES.lin(k, x, y - H, g.xR, y - hc, [[0, mez(TURA.sombra, TURA.medio, 0.35)], [1, mez(TURA.sombra, CAL.sombra2, 0.4)]]));
    // hiladas muy finas del revestimiento, manchas verticales de la intemperie y la luz del canto y de la arista
    var fin = new Lote(), manchas = new Lote(), rim = new Lote(), filo = new Lote(), hA = hMax + 0.003 * s, pasoH = 0.0062 * s;
    for (h = hA; h < H - pasoH; h += pasoH) {
      var a2 = g.ar(h);
      fin.rect(g.bI(h), y - h, g.bD(h) - g.bI(h), Math.max(0.6, 0.0007 * s));
      rim.rect(g.bI(h), y - h - pasoH, Math.min(0.05 * s, a2 - g.bI(h)), pasoH);
      filo.rect(Math.max(g.bI(h), a2 - 0.035 * s), y - h - pasoH, Math.min(0.035 * s, a2 - g.bI(h)), pasoH);
    }
    for (i = 0; i < 16; i++) {
      var mh = (0.012 + r() * 0.03) * s, ht = hA + mh + r() * 0.06 * s, mx = g.bI(ht) + r() * (g.bD(ht) - g.bI(ht));
      if (ht < H * 0.94) manchas.rect(mx, y - ht, (0.001 + r() * 0.0018) * s, mh);
    }
    fin.pintar(k, css(OSCURO, 0.07)); manchas.pintar(k, css(OSCURO, 0.04));
    var l1 = Math.hypot(H, g.B / 2);
    rim.pintar(k, ES.lin(k, g.xL, y, g.xL + H / l1 * 0.04 * s, y + g.B / 2 / l1 * 0.04 * s, [[0, BLANCO, 0.3], [1, BLANCO, 0]]));
    var l2 = Math.hypot(H, x - g.xF);
    filo.pintar(k, ES.lin(k, g.xF, y, g.xF - H / l2 * 0.035 * s, y + (g.xF - x) / l2 * 0.035 * s, [[0, [255, 252, 236], 0.32], [0.4, [255, 252, 236], 0.12], [1, [255, 252, 236], 0]]));
  }
  A.kefren = {
    ancho: 0.84, alto: 0.54, abajo: 0,
    dibujar: function (k, x, y, s, op) {
      var g = piramide(k, x, y, s, KEFREN);
      revestimiento(k, g, s, 0.775, 77);
      pie(k, g, s, A.kefren.ancho, 62);
    }
  };

  /* ---------- Micerinos (base 104,6 m, 65,5 m de alto, 51°): abajo le quedan bloques de granito rosa sin pulir; en la cara
     norte, el tajo que dejó en 1196 el intento de desmontarla; y al sur, las tres pirámides de sus reinas ---------- */
  var MICERINOS = { base: 0.432, alto: 0.27, pie: 0.585, tope: 0.262, n: 36, semilla: 3301, bloque: 1.8 };
  var ROSA = { sol: mez(mez(P.piedra, P.rojo, 0.25), P.lino, 0.22), medio: mez(mez(P.piedra, P.rojo, 0.3), P.negro2, 0.08), sombra: mez(mez(P.piedra2, P.rojo, 0.28), P.negro2, 0.12), honda: mez(mez(P.piedra2, P.rojo, 0.3), P.negro2, 0.3) };
  // los bloques de granito que le quedan abajo: grandes, sin pulir (con su bulto), de un rosa apagado; el borde de arriba,
  // roto (más alto en el centro de cada cara). Ajustados a cada hilada, sin recorte
  function granito(k, g, s, hasta, semilla) {
    var r = U.azar(semilla), y = g.y, hs = g.hs, ext = g.ext, q, i, luz = new Lote(), sombra = new Lote(), juntas = new Lote(), bultos = new Lote(), bajos = new Lote(), claros = new Lote(), oscuros = new Lote(), mo = new Lote(), mc = new Lote();
    function poner(lote, a, b, yy, c) { if (b - a > 0.5) lote.rect(a, yy, b - a, c); }
    for (q = 1; q < hs.length && hs[q - 1] < hasta * g.H; q++) {
      var h0 = hs[q - 1], h1 = hs[q], c = h1 - h0, o = (q - 1) * 4, xa = ext[o], xm1 = ext[o + 1], xm2 = ext[o + 2], xb = ext[o + 3], bx = xa - r() * c * 2;
      while (bx < xb) {
        var bw = c * (2 + r() * 2.4), centro = (bx + bw / 2 - g.xL) / g.B, tope = hasta * g.H * (0.5 + 0.65 * Math.sin(Math.min(1, Math.max(0, centro * 1.05)) * Math.PI) * (0.65 + r() * 0.55));
        if (h1 <= tope) {
          var a = Math.max(bx, xa), b = Math.min(bx + bw, xb), yy = y - h1, gj = Math.max(0.8, c * 0.12), tir = r();
          poner(luz, a, Math.min(b, xm1), yy, c); poner(sombra, Math.max(a, xm2), b, yy, c);
          if (tir < 0.3) poner(claros, a, b, yy, c); else if (tir < 0.55) poner(oscuros, a, b, yy, c);
          if (bx > xa) juntas.rect(bx, yy, gj, c);
          poner(juntas, a, b, yy, gj);
          // el bulto sin desbastar: luz arriba a la izquierda, sombra abajo
          poner(bultos, Math.max(a, bx + bw * 0.18), Math.min(b, bx + bw * 0.62), yy + c * 0.2, c * 0.3);
          poner(bajos, Math.max(a, bx + bw * 0.12), Math.min(b, bx + bw * 0.9), yy + c * 0.72, c * 0.18);
          for (i = 0; i < 4; i++) { var mx = a + r() * (b - a), dm = (0.0008 + r() * 0.001) * s; (r() < 0.55 ? mo : mc).rect(mx, yy + r() * (c - dm), dm, dm); }
        }
        bx += bw;
      }
    }
    luz.pintar(k, ES.lin(k, g.xL, y - hasta * g.H, g.xF, y, [[0, ROSA.sol], [1, ROSA.medio]]));
    sombra.pintar(k, ES.lin(k, g.xF, y - hasta * g.H, g.xR, y, [[0, ROSA.sombra], [1, ROSA.honda]]));
    claros.pintar(k, css(BLANCO, 0.09)); oscuros.pintar(k, css(OSCURO, 0.08));
    bultos.pintar(k, css(BLANCO, 0.16)); bajos.pintar(k, css(OSCURO, 0.12)); juntas.pintar(k, css(OSCURO, 0.28));
    mo.pintar(k, css(OSCURO, 0.18)); mc.pintar(k, css(BLANCO, 0.16));
  }
  function tajo(k, g, s) {
    // el tajo de la cara norte (aquí, la de la izquierda) que dejó en 1196 el intento de desmontarla: un surco vertical de
    // bordes escalonados, hondo; su pared de la izquierda da sombra y la de la derecha recibe la luz
    var y = g.y, hs = g.hs, r = U.azar(9), hA = g.H * 0.34, hB = g.H * 0.74, izq = [], der = [], q, i, sombraI = new Lote(), luzD = new Lote();
    for (q = 1; q < hs.length; q++) {
      var h0 = hs[q - 1], h1 = hs[q]; if (h1 < hA || h0 > hB) continue;
      var t = (h0 - hA) / (hB - hA), cx = (g.bI(h0) + g.ar(h0)) / 2 + 0.004 * s, ww = (0.018 - 0.009 * t) * s * (0.8 + r() * 0.45), off = (r() - 0.5) * 0.004 * s;
      izq.push(cx - ww / 2 + off, h0, h1); der.push(cx + ww / 2 + off, h0, h1);
      sombraI.rect(cx - ww / 2 + off, y - h1, ww * 0.38, h1 - h0); luzD.rect(cx + ww / 2 + off - ww * 0.2, y - h1, ww * 0.2, h1 - h0);
    }
    if (!izq.length) return;
    relleno(k, function (c) {
      c.moveTo(izq[0], y - izq[1]); for (i = 0; i < izq.length; i += 3) { c.lineTo(izq[i], y - izq[i + 1]); c.lineTo(izq[i], y - izq[i + 2]); }
      for (i = der.length - 3; i >= 0; i -= 3) { c.lineTo(der[i], y - der[i + 2]); c.lineTo(der[i], y - der[i + 1]); }
      c.closePath();
    }, ES.lin(k, 0, y - hB, 0, y - hA, [[0, CAL.sombra], [1, CAL.sombra2]]));
    sombraI.pintar(k, css(OSCURO, 0.22)); luzD.pintar(k, css(BLANCO, 0.26));
    for (i = 0; i < 6; i++) bloque(k, izq[0] + (r() - 0.3) * 0.022 * s, y - hA + (0.002 + r() * 0.004) * s, (0.004 + r() * 0.003) * s, (0.0025 + r() * 0.0015) * s, CAL);
  }

  /* ---------- una pirámide escalonada: las reinas G3-b y G3-c de Micerinos y la de Zoser en Saqqara ----------
     cfg: base, alto (u), pasos, pie, incl (lo que entra la cara por cada px de alto), cima (ancho de arriba / base),
     semilla, hiladas (por escalón), erosion (0–1: esquinas rotas y escombro), tono. Sin recortes: cada línea de la textura
     se ajusta a los bordes del escalón a su altura. */
  function escalonada(k, x, y, s, cfg) {
    var r = U.azar(cfg.semilla), W0 = cfg.base * s, H = cfg.alto * s, p = cfg.pasos, incl = cfg.incl, tono = cfg.tono || CAL, i, j;
    var alturas = [], tot = 0; for (i = 0; i < p; i++) { var v = 1 - 0.18 * i / Math.max(1, p - 1); alturas.push(v); tot += v; }
    for (i = 0; i < p; i++) alturas[i] *= H / tot;
    var retiro = (W0 - 2 * incl * H - cfg.cima * W0) / (2 * Math.max(1, p - 1));
    var Wb = W0, yb = y, er = cfg.erosion || 0, escombros = [], ns = 8;
    var jl = new Lote(), cl = new Lote(), vl = new Lote(), ml = new Lote(), canto = new Lote(), pieL = new Lote();
    for (i = 0; i < p; i++) {
      var hp = alturas[i], yt = yb - hp, xl = x - Wb / 2, Wt = Wb - 2 * incl * hp, xlt = x - Wt / 2;
      // los bordes, con mordiscos de la erosión (esquinas rotas, más arriba que abajo)
      var bi = [], bd = [], RI = hp * er * (0.18 + r() * 0.3), RD = hp * er * (0.15 + r() * 0.3);
      for (j = 0; j <= ns; j++) {
        var t = j / ns, esq = Math.pow(Math.max(0, (t - 0.62) / 0.38), 2);
        var mI = RI * esq + (r() < er * 0.3 ? r() * 0.12 : r() * 0.03) * hp, mD = RD * esq + (r() < er * 0.3 ? r() * 0.1 : r() * 0.025) * hp;
        bi.push(xl + (xlt - xl) * t + mI, yb - hp * t); bd.push(xl + Wb - (xlt - xl) * t - mD, yb - hp * t);
      }
      var cara = function (c) { c.moveTo(bi[0], bi[1]); for (var q = 2; q < bi.length; q += 2) c.lineTo(bi[q], bi[q + 1]); for (q = bd.length - 2; q >= 0; q -= 2) c.lineTo(bd[q], bd[q + 1]); c.closePath(); };
      var xf = xl + Wb * cfg.pie, xft = xlt + Wt * cfg.pie;
      var caraD = function (c) { c.moveTo(xf, yb); c.lineTo(xft, yt); for (var q = bd.length - 2; q >= 0; q -= 2) c.lineTo(bd[q], bd[q + 1]); c.closePath(); };
      relleno(k, cara, ES.lin(k, xl, yt, xf, yb, [[0, tono.luz || aclarar(tono.sol, 0.15)], [0.6, tono.sol], [1, mez(tono.sol, tono.medio, 0.6)]]));
      relleno(k, caraD, ES.lin(k, xft, yt, xl + Wb, yb, [[0, mez(tono.sombra, tono.medio, 0.25)], [0.6, tono.sombra], [1, tono.sombra2 || tono.honda]]));
      // los bordes a una altura dada (por dentro de los mordiscos)
      var bordes = function (yy) {
        var t2 = U.clamp((yb - yy) / hp, 0, 0.9999) * ns, q = Math.floor(t2), f = t2 - q;
        return [bi[q * 2] + (bi[q * 2 + 2] - bi[q * 2]) * f, bd[q * 2] + (bd[q * 2 + 2] - bd[q * 2]) * f];
      };
      var hl = cfg.hiladas || 6, ch = hp / hl, e1, e2;
      for (j = 1; j < hl; j++) {
        var yj = yb - ch * j; e1 = bordes(yj - 1); e2 = bordes(yj + 2);
        var a = Math.max(e1[0], e2[0]), b = Math.min(e1[1], e2[1]);
        jl.rect(a, yj - 0.5, b - a, Math.max(0.7, ch * 0.1)); cl.rect(a, yj + Math.max(0.7, ch * 0.1) - 0.5, b - a, Math.max(0.6, ch * 0.1));
      }
      for (j = 0; j < hl; j++) {
        var y1 = yb - ch * (j + 1); e1 = bordes(y1); e2 = bordes(y1 + ch);
        var a1 = Math.max(e1[0], e2[0]), b1 = Math.min(e1[1], e2[1]), bx = a1 + r() * ch * 2;
        while (bx < b1 - 1) { if (r() < 0.4) vl.rect(bx, y1, Math.max(0.5, ch * 0.08), ch); bx += ch * (1.4 + r() * 1.6); }
      }
      // manchas donde se ha caído la capa de fuera
      for (j = 0; j < Math.round(Wb / (0.03 * s)) + 2; j++) {
        var mw = (0.012 + r() * 0.03) * s, nfr = 2 + Math.floor(r() * 3), my0 = yb - hp * (0.1 + r() * 0.75), mcx = xl + r() * Wb;
        for (var fr = 0; fr < nfr; fr++) {
          var tf = (fr + 0.5) / nfr, ww = mw * Math.sqrt(1 - (2 * tf - 1) * (2 * tf - 1)) * (0.7 + r() * 0.5), myf = my0 - fr * ch;
          e1 = bordes(myf); e2 = bordes(myf + ch); var ma = Math.max(mcx - ww / 2, e1[0], e2[0]), mb = Math.min(mcx + ww / 2, e1[1], e2[1]);
          if (mb > ma && myf > yt && myf + ch < yb) ml.rect(ma, myf, mb - ma, ch);
        }
      }
      // el canto de arriba del escalón, al sol, y la sombra al pie (en cuatro franjas)
      e1 = bordes(yt + 1); canto.rect(e1[0], yt, e1[1] - e1[0], Math.max(1, hp * 0.035));
      for (j = 0; j < 4; j++) { var yf = yb - hp * 0.3 * (j + 1) / 4; e1 = bordes(yf); pieL.rect(e1[0], yf, e1[1] - e1[0], hp * 0.3 / 4 + 0.5); }
      if (er > 0 && i > 0) escombros.push(xl, Wb, yb, hp);
      yb = yt; Wb = Wt - 2 * retiro;
    }
    ml.pintar(k, css(OSCURO, 0.055)); jl.pintar(k, css(OSCURO, 0.22)); cl.pintar(k, css(BLANCO, 0.2)); vl.pintar(k, css(OSCURO, 0.14));
    canto.pintar(k, css(BLANCO, 0.38)); pieL.pintar(k, css(OSCURO, 0.06));
    // el escombro que se ha ido juntando al pie de cada escalón (sobre la grada de abajo)
    for (i = 0; i < escombros.length; i += 4) {
      var ex = escombros[i], ew = escombros[i + 1], ey = escombros[i + 2], eh = escombros[i + 3] * 0.22 * er;
      for (var lado = 0; lado < 2; lado++) {
        var x0 = lado ? ex + ew * (0.8 + r() * 0.08) : ex - ew * 0.015, x1 = lado ? ex + ew * 1.015 : ex + ew * (0.13 + r() * 0.1), hm = eh * (0.7 + r() * 0.6);
        // un talud de piedra suelta: sube desde la esquina y se pierde hacia el centro, con el borde a bultos
        var pts = [x0, ey], nb = 7;
        for (var q = 1; q < nb; q++) { var tq = q / nb, perfil = lado ? Math.pow(tq, 0.7) : Math.pow(1 - tq, 0.7); pts.push(x0 + (x1 - x0) * tq, ey - hm * perfil * (0.75 + r() * 0.5)); }
        pts.push(x1, ey);
        relleno(k, function (c) { poli(c, pts); }, ES.lin(k, x0, ey - hm, x1, ey, [[0, mez(tono.sol, P.arena, 0.25)], [1, mez(tono.sombra, P.arena2, 0.3)]]));
        for (q = 0; q < 3; q++) { var bx2 = x0 + (x1 - x0) * (lado ? 0.55 + r() * 0.4 : 0.05 + r() * 0.4), bw2 = hm * (0.35 + r() * 0.4); bloque(k, bx2, ey - r() * hm * 0.3, bw2, bw2 * 0.6, tono, (r() - 0.5) * 0.4); }
      }
    }
    return { cima: yb, ancho: Wb + 2 * retiro };
  }
  A.micerinos = {
    ancho: 0.74, alto: 0.27, abajo: 0,
    dibujar: function (k, x, y, s, op) {
      // las reinas al sur (aquí, a la izquierda): G3-c y G3-b escalonadas, de cuatro gradas; G3-a, de caras lisas
      escalonada(k, x - 0.31 * s, y, s, { base: 0.1, alto: 0.08, pasos: 4, pie: 0.6, incl: 0.1, cima: 0.26, semilla: 41, hiladas: 3, erosion: 0.6 });
      escalonada(k, x - 0.2 * s, y, s, { base: 0.106, alto: 0.084, pasos: 4, pie: 0.6, incl: 0.1, cima: 0.26, semilla: 42, hiladas: 3, erosion: 0.6 });
      piramide(k, x - 0.075 * s, y, s, { base: 0.145, alto: 0.092, pie: 0.585, tope: 0.087, n: 14, semilla: 43, bloque: 1.6 });
      var g = piramide(k, x + 0.15 * s, y, s, MICERINOS);
      granito(k, g, s, 0.19, 44);
      tajo(k, g, s);
      arena(k, x - A.micerinos.ancho / 2 * s, x + A.micerinos.ancho / 2 * s, y, 0.013 * s, 63, { ondas: 9 });
    }
  };

  /* ------------------------------------------------------------------ la Gran Esfinge
     De perfil, mirando a la derecha (hacia el este). 73 m de largo y 20 m de alto: aquí 0,8 × 0,24 u. Cuerpo de león de
     caliza en capas (las blandas del medio, muy comidas por el viento), la base y las patas forradas de bloques de
     restauración, la cola enroscada sobre el anca derecha, la cabeza pequeña con el nemes a rayas, sin nariz ni barba, y
     entre las patas la Estela del Sueño de Tutmosis IV (granito rojo, 3,6 m, redondeada arriba). */
  var ESTELA = { x0: 0.228, x1: 0.263, y0: 0.004, y1: 0.074 };
  // las capas de la roca: surcos ondulados (la capa blanda se hunde y la dura de encima deja un canto claro)
  function capasRoca(k, p, forma, X0, X1, niveles, semilla, fuerza) {
    var i, j, n = 30;
    if (forma) { k.save(); k.beginPath(); forma(k); k.clip(); }
    var oscuro = [], claro = [];
    for (i = 0; i < niveles.length; i++) {
      var Y = niveles[i], f = (fuerza && fuerza[i]) || 1, pts = [];
      for (j = 0; j <= n; j++) {
        var X = X0 + (X1 - X0) * j / n, ond = (U.fbm(X * 9 + i * 3.7, semilla + i, 3) - 0.5) * 0.012 + (U.fbm(X * 31 + i, semilla + 70 + i, 2) - 0.5) * 0.003;
        var env = U.clamp(U.fbm(X * 5 + i * 1.3, semilla + 90 + i, 2) * 2.2 - 0.45, 0.12, 1);   // el surco se ahonda y se borra
        pts.push(X, Y + ond, (0.0022 + 0.005 * U.fbm(X * 13 + i, semilla + 40 + i, 2)) * f * env);
      }
      oscuro.push(pts); claro.push(pts);
    }
    // las capas, de tono algo distinto una sí y otra no
    k.beginPath();
    for (i = 0; i + 1 < oscuro.length; i += 2) {
      var qa = oscuro[i], qb = oscuro[i + 1];
      p.m(qa[0], qa[1]); for (j = 3; j < qa.length; j += 3) p.l(qa[j], qa[j + 1]);
      for (j = qb.length - 3; j >= 0; j -= 3) p.l(qb[j], qb[j + 1]);
      p.z();
    }
    k.fillStyle = css(P.oro3, 0.06); k.fill();
    // la sombra de cada surco
    k.beginPath();
    for (i = 0; i < oscuro.length; i++) {
      var q = oscuro[i];
      p.m(q[0], q[1]); for (j = 3; j < q.length; j += 3) p.l(q[j], q[j + 1]);
      for (j = q.length - 3; j >= 0; j -= 3) p.l(q[j], q[j + 1] - q[j + 2]);
      p.z();
    }
    k.fillStyle = css(OSCURO, 0.26); k.fill();
    // el núcleo del surco, más hondo
    k.beginPath();
    for (i = 0; i < oscuro.length; i++) {
      var q2 = oscuro[i];
      p.m(q2[0], q2[1]); for (j = 3; j < q2.length; j += 3) p.l(q2[j], q2[j + 1]);
      for (j = q2.length - 3; j >= 0; j -= 3) p.l(q2[j], q2[j + 1] - q2[j + 2] * 0.35);
      p.z();
    }
    k.fillStyle = css(OSCURO, 0.3); k.fill();
    // el canto claro de la capa dura de encima
    k.beginPath();
    for (i = 0; i < claro.length; i++) {
      var q3 = claro[i];
      p.m(q3[0], q3[1] + 0.0002 + q3[2] * 0.4); for (j = 3; j < q3.length; j += 3) p.l(q3[j], q3[j + 1] + 0.0002 + q3[j + 2] * 0.4);
      for (j = q3.length - 3; j >= 0; j -= 3) p.l(q3[j], q3[j + 1] + 0.0002);
      p.z();
    }
    k.fillStyle = css(BLANCO, 0.4); k.fill();
    if (forma) k.restore();
  }
  // bloques de restauración (romanos y modernos) sobre una forma, por debajo de Ymax
  function mamposteria(k, p, s, forma, X0, X1, Ymax, filas, semilla, tono) {
    var r = U.azar(semilla), hf = Ymax / filas, i;
    if (forma) { k.save(); k.beginPath(); forma(k); k.clip(); }
    k.beginPath(); p.m(X0, 0); for (i = 0; i <= 24; i++) { var X = X0 + (X1 - X0) * i / 24; p.l(X, Ymax + (r() - 0.5) * hf * 0.8); } p.l(X1, 0); p.z();
    k.fillStyle = ES.lin(k, 0, p.py(Ymax), 0, p.py(0), [[0, tono[0]], [1, tono[1]]]); k.fill();
    var junta = new Lote(), canto = new Lote(), claros = new Lote();
    for (var f = 0; f < filas; f++) {
      var y0 = p.py(hf * (f + 1)), X2 = X0 + r() * 0.01;
      junta.rect(p.px(X0), y0 - 0.5, (X1 - X0) * s, Math.max(0.8, 0.0012 * s));
      canto.rect(p.px(X0), y0 + Math.max(0.8, 0.0012 * s) - 0.5, (X1 - X0) * s, Math.max(0.7, 0.001 * s));
      while (X2 < X1) {
        var bw = 0.008 + r() * 0.012;
        junta.rect(p.px(X2), y0, Math.max(0.7, 0.001 * s), hf * s);
        if (r() < 0.3) claros.rect(p.px(X2), y0, bw * s, hf * s);
        X2 += bw;
      }
    }
    claros.pintar(k, css(BLANCO, 0.08)); junta.pintar(k, css(OSCURO, 0.2)); canto.pintar(k, css(BLANCO, 0.18));
    if (forma) k.restore();
  }
  function estelaDelSueno(k, p, s) {
    var E = ESTELA, w = E.x1 - E.x0, rr = w / 2, cx = (E.x0 + E.x1) / 2;
    var losa = function (c) { p.m(E.x0, E.y0).l(E.x0, E.y1 - rr); c.arc(p.px(cx), p.py(E.y1 - rr), rr * s, Math.PI, 0); p.l(E.x1, E.y0).z(); };
    relleno(k, losa, ES.lin(k, p.px(E.x0), p.py(E.y1), p.px(E.x1), p.py(E.y0), [[0, mez(P.rojo, P.piedra2, 0.45)], [0.5, mez(mez(P.rojo, P.negro2, 0.45), P.piedra2, 0.15)], [1, mez(P.rojo, P.negro, 0.6)]]));
    // el grano del granito
    var r = U.azar(17), motas = new Lote(), motasC = new Lote();
    for (var i = 0; i < 90; i++) {
      var X = E.x0 + 0.001 + r() * (w - 0.003), Y = E.y0 + r() * (E.y1 - E.y0 - 0.002), d = (0.0006 + r() * 0.0008) * s, oscura = r() < 0.5;
      if (Y > E.y1 - rr && Math.pow(X - cx, 2) + Math.pow(Y - (E.y1 - rr), 2) > Math.pow(rr * 0.9, 2)) continue;   // dentro del medio punto
      (oscura ? motas : motasC).rect(p.px(X), p.py(Y), d, d);
    }
    motas.pintar(k, css(OSCURO, 0.35)); motasC.pintar(k, css(BLANCO, 0.25));
    // el relieve: el disco alado en el medio punto, dos esfinges de espaldas con el rey ofrendando y las líneas del texto
    var tallado = css(OSCURO, 0.36), luzT = css(BLANCO, 0.28);
    function rayaT(X0, Y0, X1, Y1, gr) { k.beginPath(); p.m(X0, Y0).l(X1, Y1); k.lineWidth = gr * s; k.strokeStyle = tallado; k.stroke(); k.beginPath(); p.m(X0, Y0 - gr * 0.8).l(X1, Y1 - gr * 0.8); k.lineWidth = gr * 0.6 * s; k.strokeStyle = luzT; k.stroke(); }
    k.lineCap = 'round';
    var ys = E.y1 - rr * 0.55;
    k.beginPath(); k.arc(p.px(cx), p.py(ys), 0.0026 * s, 0, TAU); k.fillStyle = tallado; k.fill();
    rayaT(cx - rr * 0.8, ys + 0.002, cx - 0.003, ys, 0.0011); rayaT(cx + 0.003, ys, cx + rr * 0.8, ys + 0.002, 0.0011);
    var yb = E.y1 - rr * 1.15;
    rayaT(E.x0 + w * 0.12, yb, E.x1 - w * 0.12, yb, 0.0009);
    for (var lado = -1; lado <= 1; lado += 2) {   // las dos esfinges, de espaldas, sobre su pedestal
      var bx = cx + lado * w * 0.2;
      k.beginPath(); p.m(bx - lado * 0.001, yb + 0.0015).l(bx + lado * 0.009, yb + 0.0015).l(bx + lado * 0.0105, yb + 0.006).l(bx + lado * 0.008, yb + 0.0062).l(bx + lado * 0.007, yb + 0.004).l(bx - lado * 0.001, yb + 0.004).z();
      k.fillStyle = tallado; k.fill();
    }
    for (var t = 0; t < 7; t++) { var yt = yb - 0.006 - t * 0.0058; if (yt < E.y0 + 0.004) break; rayaT(E.x0 + w * 0.12, yt, E.x1 - w * 0.12, yt, 0.0008); }
    relleno(k, losa, ES.lin(k, p.px(E.x0), p.py(E.y1), p.px(cx), p.py(E.y1 - rr), [[0, [255, 230, 210], 0], [0.45, [255, 230, 210], 0.22], [1, [255, 230, 210], 0]]));
  }
  A.esfinge = {
    ancho: 0.8, alto: 0.236, abajo: 0,
    dibujar: function (k, x, y, s, op) {
      var p = pluma(k, x, y, s), i, r = U.azar(23);
      // el cuerpo: la grupa, el lomo largo que sube un poco hacia los hombros, la nuca bajo el nemes, la garganta y el pecho
      var cuerpo = function () {
        p.m(-0.38, 0).c(-0.399, 0.03, -0.398, 0.075, -0.376, 0.098).c(-0.36, 0.114, -0.335, 0.121, -0.305, 0.124)
          .c(-0.27, 0.126, -0.24, 0.1245, -0.2, 0.1275).c(-0.16, 0.1302, -0.13, 0.1268, -0.1, 0.1295).c(-0.05, 0.132, 0.0, 0.135, 0.03, 0.139)
          .c(0.06, 0.142, 0.078, 0.147, 0.09, 0.156).l(0.195, 0.156)
          .c(0.198, 0.142, 0.206, 0.132, 0.212, 0.122).c(0.219, 0.108, 0.221, 0.088, 0.218, 0.072).c(0.216, 0.058, 0.212, 0.05, 0.206, 0.044).l(0.2, 0).z();
      };
      relleno(k, cuerpo, ES.lin(k, 0, p.py(0.145), 0, p.py(0.03), [[0, CAL.luz], [0.1, aclarar(CAL.luz, 0.12)], [0.28, CAL.sol], [0.64, mez(CAL.medio, P.arena2, 0.4)], [1, CAL.sombra2]]));
      // las luces y sombras del cuerpo: la misma forma otra vez, con un degradado transparente (sin recorte)
      // el pecho mira a la derecha: sombra; la cabeza deja sombra en el cuello; luz en el hombro, en la grupa y en el lomo
      relleno(k, cuerpo, ES.lin(k, p.px(0.11), 0, p.px(0.222), 0, [[0, OSCURO, 0], [1, OSCURO, 0.32]]));
      relleno(k, cuerpo, ES.rad(k, p.px(0.165), p.py(0.15), 0, 0.06 * s, [[0, OSCURO, 0.26], [1, OSCURO, 0]]));
      relleno(k, cuerpo, ES.rad(k, p.px(0.115), p.py(0.095), 0, 0.065 * s, [[0, BLANCO, 0.16], [1, BLANCO, 0]]));
      relleno(k, cuerpo, ES.lin(k, p.px(-0.36), p.py(0.06), p.px(-0.4), p.py(0.02), [[0, OSCURO, 0], [1, OSCURO, 0.2]]));
      // el muslo, los estratos, las grietas, la cola y los bloques de la base: dentro de un solo recorte
      k.save(); k.beginPath(); cuerpo(); k.clip();
      // el muslo de atrás: una forma redonda con su luz (como el Anubis tumbado de la referencia 4); delante, su sombra
      var muslo = function () { p.m(-0.394, 0.018).c(-0.4, 0.06, -0.382, 0.1, -0.34, 0.112).c(-0.296, 0.122, -0.242, 0.112, -0.216, 0.086).c(-0.198, 0.066, -0.198, 0.04, -0.214, 0.027).c(-0.236, 0.014, -0.3, 0.012, -0.394, 0.018).z(); };
      relleno(k, function () { k.save(); k.translate(0.005 * s, 0.002 * s); muslo(); k.restore(); }, css(OSCURO, 0.16));
      relleno(k, muslo, ES.rad(k, p.px(-0.33), p.py(0.09), 0, 0.12 * s, [[0, CAL.luz], [0.45, CAL.sol], [1, CAL.medio]], p.px(-0.345), p.py(0.098)));
      capasRoca(k, p, null, -0.4, 0.23, [0.126, 0.114, 0.102, 0.09, 0.077, 0.064, 0.051], 5, [0.7, 1.1, 1.4, 1.5, 1.2, 1.4, 1]);
      // grietas verticales del lomo
      k.beginPath();
      for (i = 0; i < 7; i++) { var X = -0.32 + r() * 0.42, Y = 0.137, xx = X; p.m(X, Y); for (var j = 0; j < 6; j++) { xx += (r() - 0.5) * 0.007; p.l(xx, Y - 0.011 * (j + 1)); } }
      k.lineWidth = Math.max(0.8, 0.0011 * s); k.strokeStyle = css(OSCURO, 0.22); k.stroke();
      k.lineCap = 'round';
      // la cola, en relieve: sale de la grupa por abajo y se enrosca hacia delante sobre el muslo
      function cola(dx, dy, w, col) { k.beginPath(); p.m(-0.393 + dx, 0.03 + dy).c(-0.387 + dx, 0.046 + dy, -0.365 + dx, 0.052 + dy, -0.335 + dx, 0.051 + dy).c(-0.305 + dx, 0.05 + dy, -0.282 + dx, 0.047 + dy, -0.266 + dx, 0.041 + dy); k.lineWidth = w * s; k.strokeStyle = col; k.stroke(); }
      cola(0.0012, -0.0016, 0.0068, css(OSCURO, 0.3)); cola(0, 0, 0.006, css(mez(CAL.sol, CAL.medio, 0.4))); cola(-0.0008, 0.0012, 0.0022, css(CAL.luz, 0.9));
      relleno(k, function () { p.m(-0.27, 0.044).q(-0.253, 0.05, -0.248, 0.037).q(-0.258, 0.034, -0.27, 0.044).z(); }, css(mez(CAL.sol, CAL.medio, 0.3)));
      // la base forrada de bloques de restauración
      mamposteria(k, p, s, null, -0.4, 0.23, 0.034, 3, 31, [mez(CAL.sol, CAL.medio, 0.3), mez(CAL.medio, CAL.sombra, 0.6)]);
      k.restore();

      // la pata de atrás, estirada por debajo del vientre
      var pataT = function () { p.m(-0.262, 0).l(-0.258, 0.023).c(-0.22, 0.032, -0.16, 0.032, -0.13, 0.028).c(-0.114, 0.026, -0.107, 0.014, -0.109, 0).z(); };
      relleno(k, pataT, vertical(k, p.py(0.032), p.py(0), CAL.sol, CAL.medio, CAL.sombra2));
      mamposteria(k, p, s, null, -0.255, -0.118, 0.024, 3, 33, [mez(CAL.sol, CAL.medio, 0.3), mez(CAL.medio, CAL.sombra, 0.7)]);

      // la Estela del Sueño, entre las patas (la de este lado le tapa el pie)
      estelaDelSueno(k, p, s);
      // la pata delantera de este lado (la derecha del animal), forrada de bloques, con los dedos de la garra
      var pata = function () { p.m(0.085, 0).c(0.083, 0.028, 0.098, 0.047, 0.125, 0.053).c(0.16, 0.057, 0.19, 0.049, 0.222, 0.044).c(0.28, 0.039, 0.33, 0.037, 0.36, 0.037).q(0.371, 0.04, 0.379, 0.034).q(0.386, 0.036, 0.391, 0.029).q(0.399, 0.028, 0.399, 0.018).q(0.401, 0.008, 0.396, 0.003).l(0.391, 0).z(); };
      relleno(k, pata, ES.lin(k, 0, p.py(0.056), 0, p.py(0), [[0, CAL.luz], [0.3, CAL.sol], [1, CAL.sombra2]]));
      k.save(); k.beginPath(); pata(); k.clip();
      mamposteria(k, p, s, null, 0.08, 0.4, 0.062, 4, 34, [mez(CAL.sol, CAL.luz, 0.2), mez(CAL.medio, CAL.sombra, 0.65)]);
      k.beginPath();
      for (i = 0; i < 3; i++) { var dx = 0.37 + i * 0.0092; p.m(dx, 0.003).q(dx + 0.005, 0.017, dx + 0.001, 0.034 - i * 0.004); }
      k.lineWidth = Math.max(1, 0.002 * s); k.strokeStyle = css(OSCURO, 0.36); k.stroke();
      k.beginPath(); for (i = 0; i < 3; i++) { var dx3 = 0.3715 + i * 0.0092; p.m(dx3, 0.006).q(dx3 + 0.005, 0.019, dx3 + 0.0025, 0.033 - i * 0.004); }
      k.lineWidth = Math.max(0.8, 0.0012 * s); k.strokeStyle = css(BLANCO, 0.3); k.stroke();
      k.restore();
      // la sombra de la cabeza y del pecho sobre la pata (ahí, a la sombra, se echará el gato) y la del codo
      relleno(k, pata, ES.lin(k, p.px(0.222), 0, p.px(0.4), 0, [[0, OSCURO, 0], [0.001, OSCURO, 0.36], [0.5, OSCURO, 0.24], [1, OSCURO, 0.1]]));
      relleno(k, pata, ES.lin(k, p.px(0.083), 0, p.px(0.11), 0, [[0, OSCURO, 0.18], [1, OSCURO, 0]]));

      // la cabeza: el nemes a rayas (con la cinta de la frente y la caída delante del hombro), la cara sin nariz y la oreja
      var nemes = function () {
        p.m(0.086, 0.152).c(0.09, 0.18, 0.1, 0.205, 0.118, 0.219).c(0.135, 0.232, 0.16, 0.236, 0.185, 0.234).c(0.197, 0.233, 0.206, 0.229, 0.209, 0.219)
          .l(0.209, 0.212).l(0.176, 0.209).c(0.171, 0.198, 0.169, 0.184, 0.17, 0.168).l(0.18, 0.112).l(0.155, 0.112)
          .c(0.152, 0.13, 0.142, 0.145, 0.124, 0.15).c(0.11, 0.152, 0.095, 0.153, 0.086, 0.152).z();
      };
      relleno(k, function () { p.m(0.155, 0.113).l(0.181, 0.113).l(0.185, 0.103).l(0.16, 0.103).z(); }, css(OSCURO, 0.14));
      relleno(k, nemes, ES.lin(k, p.px(0.12), p.py(0.236), p.px(0.19), p.py(0.11), [[0, CAL.luz], [0.4, CAL.sol], [1, CAL.sombra]]));
      k.save(); k.beginPath(); nemes(); k.clip();
      var rayas = new Lote(), color = new Lote();
      for (i = 0; i < 19; i++) { var Yr = 0.112 + i * 0.0066; rayas.rect(p.px(0.08), p.py(Yr + 0.0033), 0.14 * s, 0.0033 * s); if (i % 2) color.rect(p.px(0.08), p.py(Yr + 0.0066), 0.14 * s, 0.0033 * s); }
      rayas.pintar(k, css(OSCURO, 0.17)); color.pintar(k, css(P.egipcio, 0.05));
      k.restore();
      // el volumen: atrás y abajo, en sombra; arriba, la luz (la misma forma otra vez)
      relleno(k, nemes, ES.lin(k, p.px(0.13), 0, p.px(0.086), 0, [[0, OSCURO, 0], [1, OSCURO, 0.24]]));
      relleno(k, nemes, ES.lin(k, p.px(0.165), 0, p.px(0.182), 0, [[0, OSCURO, 0], [1, OSCURO, 0.18]]));
      relleno(k, nemes, ES.lin(k, 0, p.py(0.24), 0, p.py(0.205), [[0, BLANCO, 0.34], [1, BLANCO, 0]]));
      // la cinta de la frente
      k.beginPath(); p.m(0.176, 0.209).l(0.209, 0.212).l(0.209, 0.2185).l(0.178, 0.2165).z(); k.fillStyle = css(mez(CAL.sol, CAL.luz, 0.5)); k.fill();
      k.beginPath(); p.m(0.177, 0.2088).l(0.209, 0.2118); k.lineWidth = 0.0013 * s; k.strokeStyle = css(OSCURO, 0.3); k.stroke();
      // el muñón del ureo (la cobra se perdió)
      relleno(k, function () { p.m(0.2035, 0.2185).q(0.2055, 0.2255, 0.2095, 0.2215).l(0.2095, 0.2185).z(); }, css(mez(CAL.sol, CAL.medio, 0.4)));
      // la cara
      var cara = function () {
        p.m(0.176, 0.209).l(0.209, 0.212).c(0.2105, 0.206, 0.2115, 0.2, 0.2118, 0.196).c(0.2122, 0.193, 0.2105, 0.191, 0.2085, 0.1895)
          .l(0.2088, 0.1725).c(0.21, 0.1705, 0.2138, 0.1695, 0.2138, 0.166).c(0.2138, 0.1625, 0.2112, 0.1618, 0.2122, 0.1592)
          .c(0.2132, 0.1555, 0.2108, 0.1505, 0.2055, 0.1485).c(0.197, 0.1465, 0.186, 0.1475, 0.178, 0.151).c(0.172, 0.165, 0.171, 0.19, 0.176, 0.209).z();
      };
      relleno(k, cara, ES.lin(k, p.px(0.175), p.py(0.21), p.px(0.214), p.py(0.15), [[0, CAL.luz], [0.45, CAL.sol], [1, CAL.medio]]));
      // el borde de delante en sombra (mira a la derecha), la mandíbula y la cuenca del ojo: la cara otra vez, sin recorte
      relleno(k, cara, ES.lin(k, p.px(0.199), 0, p.px(0.214), 0, [[0, OSCURO, 0], [1, OSCURO, 0.24]]));
      relleno(k, cara, ES.lin(k, 0, p.py(0.16), 0, p.py(0.147), [[0, OSCURO, 0], [1, OSCURO, 0.26]]));
      relleno(k, cara, ES.rad(k, p.px(0.2035), p.py(0.1912), 0, 0.0075 * s, [[0, OSCURO, 0.3], [1, OSCURO, 0]]));
      k.lineCap = 'round';
      k.beginPath(); p.m(0.1962, 0.1965).q(0.204, 0.2002, 0.2112, 0.1958); k.lineWidth = 0.0019 * s; k.strokeStyle = css(OSCURO, 0.36); k.stroke();
      k.beginPath(); p.m(0.1975, 0.1912).q(0.2035, 0.1955, 0.2092, 0.1915).q(0.2035, 0.1882, 0.1975, 0.1912).z(); k.fillStyle = css(OSCURO, 0.5); k.fill();
      k.beginPath(); p.m(0.1995, 0.191).q(0.2035, 0.1937, 0.2078, 0.1913).q(0.2035, 0.1898, 0.1995, 0.191).z(); k.fillStyle = css(CAL.luz, 0.92); k.fill();
      // el sitio de la nariz que falta: piedra rota, más oscura y áspera
      k.beginPath(); p.m(0.2042, 0.1885).l(0.2092, 0.189).l(0.2092, 0.1722).l(0.2052, 0.1712).z(); k.fillStyle = css(OSCURO, 0.2); k.fill();
      var rn = U.azar(51); k.fillStyle = css(OSCURO, 0.24);
      for (i = 0; i < 10; i++) k.fillRect(p.px(0.2048 + rn() * 0.0042), p.py(0.1725 + rn() * 0.015), 0.0011 * s, 0.0009 * s);
      // los labios y el pliegue de la mejilla
      k.beginPath(); p.m(0.2062, 0.1607).q(0.2098, 0.1597, 0.2134, 0.1606); k.lineWidth = 0.0014 * s; k.strokeStyle = css(OSCURO, 0.5); k.stroke();
      k.beginPath(); p.m(0.2085, 0.1572).q(0.211, 0.1565, 0.2128, 0.1572); k.lineWidth = 0.001 * s; k.strokeStyle = css(OSCURO, 0.25); k.stroke();
      k.beginPath(); p.m(0.203, 0.1712).q(0.2005, 0.1645, 0.203, 0.1572); k.lineWidth = 0.0014 * s; k.strokeStyle = css(OSCURO, 0.16); k.stroke();
      // la oreja, grande, delante del borde del nemes
      var oreja = function () { p.m(0.1775, 0.1965).c(0.1875, 0.199, 0.1905, 0.186, 0.1885, 0.177).c(0.1865, 0.169, 0.183, 0.1645, 0.1778, 0.1645).c(0.175, 0.171, 0.1745, 0.19, 0.1775, 0.1965).z(); };
      relleno(k, function () { k.save(); k.translate(0.0012 * s, 0.0008 * s); oreja(); k.restore(); }, css(OSCURO, 0.2));
      relleno(k, oreja, ES.lin(k, p.px(0.176), p.py(0.198), p.px(0.19), p.py(0.165), [[0, CAL.luz], [1, mez(CAL.sol, CAL.medio, 0.6)]]));
      k.beginPath(); p.m(0.1792, 0.1912).c(0.1852, 0.1902, 0.1862, 0.178, 0.181, 0.1712); k.lineWidth = 0.0016 * s; k.strokeStyle = css(OSCURO, 0.34); k.stroke();

      // el suelo de roca con su arena, y la sombra fresca de la cabeza delante de las patas
      arena(k, x - 0.4 * s, x + 0.4 * s, y, 0.007 * s, 64, { ondas: 11 });
      k.fillStyle = ES.lin(k, p.px(0.25), 0, p.px(0.4), 0, [[0, OSCURO, 0], [0.3, OSCURO, 0.15], [1, OSCURO, 0.08]]);
      k.beginPath(); p.m(0.25, 0).l(0.4, 0).l(0.4, 0.006).q(0.33, 0.009, 0.25, 0.003).z(); k.fill();
    }
  };
  A.esfinge.estela = { dx: (ESTELA.x0 + ESTELA.x1) / 2, dy: -(ESTELA.y0 + ESTELA.y1) / 2, w: ESTELA.x1 - ESTELA.x0, h: ESTELA.y1 - ESTELA.y0 };
  // a la sombra de la cabeza, delante de las patas: el gato tumbado en el suelo, de dx − w/2 a dx + w/2
  A.esfinge.sombra = { dx: 0.335, dy: 0, w: 0.08 };

  /* ------------------------------------------------------------------ piezas de templo (Dendera, Amarna, Alejandría) */
  // una gola (la cornisa de media caña egipcia) con su toro debajo: de X0 a X1, del pie del toro (Y0) a lo alto (Y1); sale
  // «vuelo» por cada lado. Estrías verticales (las hojas pintadas) y, si se pide, el toro con su atadura en espiral
  function gola(k, p, s, X0, X1, Y0, Y1, vuelo, tono, op) {
    op = op || {};
    var hT = (Y1 - Y0) * 0.17, Yc = Y0 + hT, Yf = Y1 - (Y1 - Y0) * 0.13, i;
    relleno(k, function () { p.m(X0, Y0).l(X1, Y0).l(X1, Yc).l(X0, Yc).z(); }, ES.lin(k, 0, p.py(Yc), 0, p.py(Y0), [[0, tono.luz], [0.45, tono.sol], [1, tono.sombra2 || tono.sombra]]));
    if (op.atadura !== false) {
      var paso = (Yc - Y0) * 1.6;
      k.beginPath();
      for (var xx = X0; xx < X1; xx += paso) { p.m(xx, Y0).l(xx + paso * 0.35, Y0).l(Math.min(X1, xx + paso * 0.65), Yc).l(xx + paso * 0.3, Yc).z(); }
      k.fillStyle = css(OSCURO, 0.13); k.fill();
    }
    var cuerpo = function () { p.m(X0, Yc).q(X0 + vuelo * 0.1, Yf - (Yf - Yc) * 0.3, X0 - vuelo, Yf).l(X1 + vuelo, Yf).q(X1 - vuelo * 0.1, Yf - (Yf - Yc) * 0.3, X1, Yc).z(); };
    relleno(k, cuerpo, ES.lin(k, 0, p.py(Yf), 0, p.py(Yc), [[0, tono.honda || tono.sombra2], [0.35, tono.sombra], [1, tono.sol]]));
    // las estrías: una franja clara y otra oscura por cada hoja
    var n = Math.max(3, Math.round((X1 - X0) / (op.paso || 0.011))), pw = (X1 - X0) / n, cl = new Lote(), os = new Lote();
    for (i = 0; i < n; i++) {
      var xa = p.px(X0 + i * pw), yA = p.py(Yf - (Yf - Yc) * 0.06), alto = (Yf - Yc) * 0.82 * s;
      cl.rect(xa + pw * s * 0.12, yA, pw * s * 0.3, alto); os.rect(xa + pw * s * 0.5, yA, pw * s * 0.32, alto);
    }
    cl.pintar(k, css(BLANCO, 0.14)); os.pintar(k, css(OSCURO, 0.14));
    // el listel de arriba, al sol, y su sombra sobre la caña
    relleno(k, function () { p.m(X0 - vuelo, Yf).l(X1 + vuelo, Yf).l(X1 + vuelo, Y1).l(X0 - vuelo, Y1).z(); }, ES.lin(k, 0, p.py(Y1), 0, p.py(Yf), [[0, tono.luz], [1, tono.sol]]));
    k.fillStyle = ES.lin(k, 0, p.py(Yf), 0, p.py(Yf - (Yf - Yc) * 0.4), [[0, OSCURO, 0.22], [1, OSCURO, 0]]); k.fillRect(p.px(X0 - vuelo), p.py(Yf), (X1 - X0 + 2 * vuelo) * s, (Yf - Yc) * 0.4 * s);
  }
  // una fila de ureos (cobras erguidas con el disco), de X0 a X1, sobre Y, de alto h
  function ureos(k, p, s, X0, X1, Y, h, tono) {
    var n = Math.max(2, Math.round((X1 - X0) / (h * 0.62))), pw = (X1 - X0) / n, i, cuerpos = new Lote();
    k.beginPath();
    for (i = 0; i < n; i++) {
      var cx = X0 + pw * (i + 0.5), w = pw * 0.36;
      p.m(cx - w * 0.55, Y).c(cx - w * 0.75, Y + h * 0.35, cx - w * 1.05, Y + h * 0.62, cx - w * 0.4, Y + h * 0.78).q(cx, Y + h * 0.84, cx + w * 0.4, Y + h * 0.78)
        .c(cx + w * 1.05, Y + h * 0.62, cx + w * 0.75, Y + h * 0.35, cx + w * 0.55, Y).z();
      k.moveTo(p.px(cx + w * 0.42), p.py(Y + h * 0.89)); k.arc(p.px(cx), p.py(Y + h * 0.89), w * 0.42 * s, 0, TAU);
    }
    k.fillStyle = ES.lin(k, 0, p.py(Y + h), 0, p.py(Y), [[0, tono.luz], [1, tono.sombra]]); k.fill();
    // la sombra de cada una, a la derecha
    k.beginPath();
    for (i = 0; i < n; i++) { var cx2 = X0 + pw * (i + 0.5), w2 = pw * 0.36; p.m(cx2 + w2 * 0.1, Y).l(cx2 + w2 * 0.55, Y).c(cx2 + w2 * 0.75, Y + h * 0.35, cx2 + w2 * 1.05, Y + h * 0.62, cx2 + w2 * 0.4, Y + h * 0.78).q(cx2 + w2 * 0.3, Y + h * 0.5, cx2 + w2 * 0.1, Y).z(); }
    k.fillStyle = css(OSCURO, 0.2); k.fill();
  }
  // el disco solar alado (el de las cornisas): disco de cornalina con sus dos ureos y alas de bandas de colores
  function discoAlado(k, p, s, cx, cy, w, h) {
    var lados = [-1, 1], i, b;
    // el ala (lado d), encogida hacia la raíz con e: el borde de arriba casi recto y abajo las puntas de las plumas
    function ala(d, e) {
      var L = w * 0.5, ex = function (f) { return cx + d * (w * 0.05 + (L - w * 0.05) * f * e); };
      p.m(ex(0), cy + h * 0.3).c(ex(0.35), cy + h * 0.42, ex(0.7), cy + h * 0.4, ex(1), cy + h * (0.1 + 0.25 * e))
        .l(ex(1), cy + h * (0.1 + 0.25 * e) - h * 0.2 * e);
      for (var f = 9; f >= 0; f--) { var fx = ex(f / 9), fy = cy - h * (0.05 + 0.3 * (1 - f / 9)) * e; p.q(ex((f + 0.5) / 9), fy - h * 0.12 * e, fx, fy); }
      p.l(ex(0), cy - h * 0.2).z();
    }
    var bandas = [[P.lapis2, 1], [P.lapis, 0.86], [P.egipcio, 0.66], [P.turquesa, 0.46], [P.oro2, 0.26]];
    for (i = 0; i < 2; i++) for (b = 0; b < bandas.length; b++) { var d = lados[i], col = bandas[b][0], e2 = bandas[b][1]; relleno(k, function () { ala(d, e2); }, ES.relleno(k, col, p.px(cx), p.py(cy + h * 0.4), p.px(cx + d * w * 0.5), p.py(cy - h * 0.4), 0.16)); }
    // las plumas: rayas finas de oro dentro del ala
    k.beginPath();
    for (i = 0; i < 2; i++) for (var f2 = 1; f2 < 10; f2++) { var dd = lados[i], fx2 = cx + dd * (w * 0.05 + (w * 0.45) * f2 / 9.5); p.m(fx2, cy + h * 0.28).l(fx2 + dd * w * 0.012, cy - h * (0.05 + 0.3 * (1 - f2 / 9)) + h * 0.02); }
    k.lineWidth = Math.max(0.6, 0.0012 * s); k.strokeStyle = css(P.oro1, 0.5); k.stroke();
    // los dos ureos que cuelgan del disco
    for (i = 0; i < 2; i++) {
      var d3 = lados[i];
      relleno(k, function () { p.m(cx + d3 * w * 0.035, cy - h * 0.05).q(cx + d3 * w * 0.075, cy - h * 0.2, cx + d3 * w * 0.06, cy - h * 0.38).q(cx + d3 * w * 0.05, cy - h * 0.2, cx + d3 * w * 0.02, cy - h * 0.08).z(); }, ES.oro(k, p.px(cx), p.py(cy), p.px(cx + d3 * w * 0.08), p.py(cy - h * 0.38), 0.3));
    }
    ES.gema(k, p.px(cx), p.py(cy), h * 0.32 * s);
  }


  /* ---------- relieves hundidos: figuras de perfil talladas en la pared (un hueco algo más oscuro con el canto de abajo y
     de la derecha claro, como la luz que entra en el corte). tipo: 'rey' (corona alta), 'reina' (corona plana), 'diosa'
     (cuernos de vaca y disco: Hathor); d = 1 si mira a la derecha */
  function figuraRelieve(c, p, s, cx, y0, h, d, tipo) {
    p.m(cx - d * 0.05 * h, y0).l(cx - d * 0.02 * h, y0 + 0.3 * h).l(cx - d * 0.06 * h, y0 + 0.55 * h);   // la pierna de atrás y la espalda
    if (tipo === 'diosa' || tipo === 'reina') p.l(cx - d * 0.07 * h, y0 + 0.02 * h).l(cx + d * 0.08 * h, y0 + 0.02 * h).l(cx + d * 0.06 * h, y0 + 0.55 * h);
    else p.l(cx - d * 0.09 * h, y0 + 0.35 * h).l(cx + d * 0.1 * h, y0 + 0.35 * h).l(cx + d * 0.13 * h, y0).l(cx + d * 0.08 * h, y0).l(cx + d * 0.05 * h, y0 + 0.3 * h).l(cx + d * 0.06 * h, y0 + 0.55 * h);
    // el pecho, el brazo de delante tendido con la ofrenda, la cabeza
    p.l(cx + d * 0.1 * h, y0 + 0.78 * h).l(cx + d * 0.3 * h, y0 + 0.72 * h).l(cx + d * 0.32 * h, y0 + 0.78 * h).l(cx + d * 0.12 * h, y0 + 0.86 * h).l(cx + d * 0.06 * h, y0 + 0.86 * h)
      .l(cx + d * 0.08 * h, y0 + 0.95 * h).l(cx - d * 0.02 * h, y0 + 1.0 * h).l(cx - d * 0.08 * h, y0 + 0.92 * h).l(cx - d * 0.12 * h, y0 + 0.8 * h).l(cx - d * 0.08 * h, y0 + 0.62 * h).z();
    // la corona
    if (tipo === 'rey') { p.m(cx - d * 0.07 * h, y0 + 0.97 * h).l(cx + d * 0.06 * h, y0 + 0.98 * h).l(cx + d * 0.0, y0 + 1.18 * h).l(cx - d * 0.1 * h, y0 + 1.12 * h).z(); }
    else if (tipo === 'reina') { p.m(cx - d * 0.09 * h, y0 + 0.97 * h).l(cx + d * 0.05 * h, y0 + 0.99 * h).l(cx + d * 0.07 * h, y0 + 1.12 * h).l(cx - d * 0.11 * h, y0 + 1.1 * h).z(); }
    else {
      // los cuernos de vaca y el disco solar entre ellos
      p.m(cx - 0.14 * h, y0 + 1.06 * h).q(cx - 0.12 * h, y0 + 1.22 * h, cx - 0.05 * h, y0 + 1.25 * h).l(cx - 0.06 * h, y0 + 1.21 * h).q(cx - 0.1 * h, y0 + 1.16 * h, cx - 0.1 * h, y0 + 1.06 * h).z();
      p.m(cx + 0.14 * h, y0 + 1.06 * h).q(cx + 0.12 * h, y0 + 1.22 * h, cx + 0.05 * h, y0 + 1.25 * h).l(cx + 0.06 * h, y0 + 1.21 * h).q(cx + 0.1 * h, y0 + 1.16 * h, cx + 0.1 * h, y0 + 1.06 * h).z();
      c.moveTo(p.px(cx + 0.075 * h), p.py(y0 + 1.13 * h)); c.arc(p.px(cx), p.py(y0 + 1.13 * h), 0.075 * h * s, 0, TAU);
    }
  }
  // una escena en relieve hundido: el hueco y su canto de luz (dos pasadas del mismo camino)
  function relieve(k, p, s, fn, T) {
    k.beginPath(); k.save(); k.translate(0.0008 * s, 0.0008 * s); fn(k); k.restore(); k.fillStyle = css(BLANCO, 0.22); k.fill();
    k.beginPath(); fn(k); k.fillStyle = css(mez(T.sombra, OSCURO, 0.25), 0.42); k.fill();
  }
  // el Atón de Amarna en relieve: el disco con su ureo y los rayos que acaban en manos
  function atonRelieve(c, p, s, cx, cy, r, alto) {
    c.moveTo(p.px(cx + r), p.py(cy)); c.arc(p.px(cx), p.py(cy), r * s, 0, TAU);
    for (var i = 0; i < 9; i++) {
      var a = -Math.PI * (0.27 + 0.46 * i / 8), x1 = cx + Math.cos(a) * alto * 0.95, y1 = cy + Math.sin(a) * alto, w = r * 0.08;
      p.m(cx + Math.cos(a) * r - w, cy + Math.sin(a) * r).l(x1 - w, y1).l(x1 + w, y1).l(cx + Math.cos(a) * r + w, cy + Math.sin(a) * r).z();
      c.moveTo(p.px(x1 + r * 0.2), p.py(y1)); c.arc(p.px(x1), p.py(y1), r * 0.2 * s, 0, TAU);   // la manita
    }
  }

  /* ------------------------------------------------------------------ Dendera: la fachada del templo de Hathor
     El pronaos (época romana): seis columnas hathóricas con muros-pantalla entre ellas hasta media altura, la puerta del
     centro de dintel partido, el arquitrabe con su texto, el toro y la gran gola con el disco alado. Por encima de los
     muros-pantalla se ve la penumbra de la sala y su techo azul con estrellas (el color de verdad, restaurado). */
  var COL_DENDERA = [-0.295, -0.18, -0.065, 0.065, 0.18, 0.295];
  // la cara de Hathor de frente: mujer de cara ancha con orejas de vaca y la peluca que cae a los lados y se riza al final
  function caraHathor(k, p, s, cx, cy, F, T) {
    var peluca = function () {
      p.m(cx - 0.52 * F, cy + 0.25 * F).c(cx - 0.5 * F, cy + 0.66 * F, cx + 0.5 * F, cy + 0.66 * F, cx + 0.52 * F, cy + 0.25 * F)
        .c(cx + 0.58 * F, cy - 0.15 * F, cx + 0.64 * F, cy - 0.45 * F, cx + 0.7 * F, cy - 0.62 * F).c(cx + 0.75 * F, cy - 0.76 * F, cx + 0.62 * F, cy - 0.86 * F, cx + 0.52 * F, cy - 0.78 * F)
        .c(cx + 0.47 * F, cy - 0.72 * F, cx + 0.5 * F, cy - 0.62 * F, cx + 0.56 * F, cy - 0.64 * F).l(cx + 0.4 * F, cy - 0.5 * F).l(cx - 0.4 * F, cy - 0.5 * F).l(cx - 0.56 * F, cy - 0.64 * F)
        .c(cx - 0.5 * F, cy - 0.62 * F, cx - 0.47 * F, cy - 0.72 * F, cx - 0.52 * F, cy - 0.78 * F).c(cx - 0.62 * F, cy - 0.86 * F, cx - 0.75 * F, cy - 0.76 * F, cx - 0.7 * F, cy - 0.62 * F)
        .c(cx - 0.64 * F, cy - 0.45 * F, cx - 0.58 * F, cy - 0.15 * F, cx - 0.52 * F, cy + 0.25 * F).z();
    };
    relleno(k, peluca, ES.lin(k, p.px(cx - 0.6 * F), p.py(cy + 0.6 * F), p.px(cx + 0.7 * F), p.py(cy - 0.8 * F), [[0, T.sol], [0.5, T.medio], [1, T.sombra]]));
    // las bandas de la peluca
    // (sin recorte: el ancho de cada franja sale de la forma de la peluca a esa altura)
    var bandas = new Lote();
    for (var i = 0; i < 10; i++) {
      var yb = cy + 0.52 * F - i * 0.13 * F, hw;
      if (yb > cy + 0.25 * F) hw = 0.5 * F * Math.sqrt(Math.max(0, 1 - Math.pow((yb - cy - 0.25 * F) / (0.36 * F), 2)));
      else hw = 0.52 * F + 0.17 * F * Math.min(1, (cy + 0.25 * F - yb) / (0.87 * F));
      if (hw > 0.02 * F) bandas.rect(p.px(cx - hw * 0.97), p.py(yb), hw * 1.94 * s, 0.045 * F * s);
    }
    bandas.pintar(k, css(OSCURO, 0.16));
    // las orejas de vaca, hacia fuera a la altura de los ojos
    for (var lado = -1; lado <= 1; lado += 2) {
      var d = lado;
      relleno(k, function () { p.m(cx + d * 0.27 * F, cy + 0.15 * F).c(cx + d * 0.42 * F, cy + 0.27 * F, cx + d * 0.6 * F, cy + 0.22 * F, cx + d * 0.7 * F, cy + 0.08 * F).c(cx + d * 0.58 * F, cy - 0.02 * F, cx + d * 0.42 * F, cy - 0.03 * F, cx + d * 0.27 * F, cy + 0.04 * F).z(); },
        ES.lin(k, 0, p.py(cy + 0.25 * F), 0, p.py(cy - 0.03 * F), [[0, T.luz], [1, d < 0 ? T.sol : T.medio]]));
      relleno(k, function () { p.m(cx + d * 0.33 * F, cy + 0.12 * F).c(cx + d * 0.45 * F, cy + 0.19 * F, cx + d * 0.57 * F, cy + 0.16 * F, cx + d * 0.63 * F, cy + 0.09 * F).c(cx + d * 0.52 * F, cy + 0.05 * F, cx + d * 0.43 * F, cy + 0.04 * F, cx + d * 0.33 * F, cy + 0.07 * F).z(); }, css(OSCURO, 0.2));
    }
    // la cara
    var cara = function () { p.m(cx - 0.3 * F, cy + 0.3 * F).q(cx, cy + 0.38 * F, cx + 0.3 * F, cy + 0.3 * F).c(cx + 0.34 * F, cy + 0.05 * F, cx + 0.3 * F, cy - 0.3 * F, cx + 0.12 * F, cy - 0.46 * F).q(cx, cy - 0.53 * F, cx - 0.12 * F, cy - 0.46 * F).c(cx - 0.3 * F, cy - 0.3 * F, cx - 0.34 * F, cy + 0.05 * F, cx - 0.3 * F, cy + 0.3 * F).z(); };
    relleno(k, cara, ES.rad(k, p.px(cx - 0.08 * F), p.py(cy + 0.08 * F), 0, 0.5 * F * s, [[0, T.luz], [0.6, T.sol], [1, T.medio]], p.px(cx - 0.12 * F), p.py(cy + 0.14 * F)));
    k.lineCap = 'round';
    // las cejas, los ojos (con la raya hacia atrás), la nariz y la boca que sonríe
    k.beginPath();
    for (lado = -1; lado <= 1; lado += 2) { p.m(cx + lado * 0.05 * F, cy + 0.16 * F).q(cx + lado * 0.14 * F, cy + 0.21 * F, cx + lado * 0.24 * F, cy + 0.14 * F); }
    k.lineWidth = Math.max(0.7, 0.03 * F * s); k.strokeStyle = css(OSCURO, 0.45); k.stroke();
    k.beginPath();
    for (lado = -1; lado <= 1; lado += 2) { p.m(cx + lado * 0.055 * F, cy + 0.07 * F).q(cx + lado * 0.14 * F, cy + 0.135 * F, cx + lado * 0.225 * F, cy + 0.075 * F).q(cx + lado * 0.14 * F, cy + 0.02 * F, cx + lado * 0.055 * F, cy + 0.07 * F).z(); }
    k.fillStyle = css(aclarar(T.luz, 0.25)); k.fill();
    k.beginPath();
    for (lado = -1; lado <= 1; lado += 2) { k.moveTo(p.px(cx + lado * 0.135 * F) + 0.034 * F * s, p.py(cy + 0.075 * F)); k.arc(p.px(cx + lado * 0.135 * F), p.py(cy + 0.075 * F), 0.034 * F * s, 0, TAU); }
    k.fillStyle = css(OSCURO, 0.6); k.fill();
    k.beginPath();
    for (lado = -1; lado <= 1; lado += 2) { p.m(cx + lado * 0.05 * F, cy + 0.07 * F).q(cx + lado * 0.14 * F, cy + 0.14 * F, cx + lado * 0.23 * F, cy + 0.076 * F).l(cx + lado * 0.29 * F, cy + 0.06 * F); }
    k.lineWidth = Math.max(0.7, 0.028 * F * s); k.strokeStyle = css(OSCURO, 0.55); k.stroke();
    relleno(k, function () { p.m(cx - 0.03 * F, cy + 0.06 * F).l(cx + 0.012 * F, cy + 0.06 * F).l(cx + 0.055 * F, cy - 0.15 * F).q(cx, cy - 0.18 * F, cx - 0.06 * F, cy - 0.15 * F).z(); }, css(OSCURO, 0.12));
    k.beginPath(); p.m(cx - 0.1 * F, cy - 0.28 * F).q(cx, cy - 0.33 * F, cx + 0.1 * F, cy - 0.28 * F); k.lineWidth = Math.max(0.7, 0.028 * F * s); k.strokeStyle = css(OSCURO, 0.4); k.stroke();
    // la mejilla derecha, en sombra
    k.fillStyle = ES.lin(k, p.px(cx + 0.1 * F), 0, p.px(cx + 0.33 * F), 0, [[0, OSCURO, 0], [1, OSCURO, 0.16]]);
    k.beginPath(); cara(); k.fill();
  }
  // una columna hathórica: basa, fuste con sus registros, el capitel de cuatro caras de Hathor, el naos encima y el ábaco
  function columnaHathor(k, p, s, cx, T) {
    var Y0 = 0.012, Ys = 0.196, Yn = 0.257, Yg = 0.279, Ya = 0.292, Yt = 0.3, i;
    // la basa
    relleno(k, function () { p.m(cx - 0.032, Y0).l(cx + 0.032, Y0).l(cx + 0.03, Y0 + 0.008).l(cx - 0.03, Y0 + 0.008).z(); }, horizontal(k, p.px(cx - 0.032), p.px(cx + 0.032), T.luz, T.medio, T.sombra2));
    // el fuste, redondo: luz a la izquierda, sombra a la derecha
    var fuste = function () { p.m(cx - 0.026, Y0 + 0.008).l(cx - 0.024, Ys).l(cx + 0.024, Ys).l(cx + 0.026, Y0 + 0.008).z(); };
    relleno(k, fuste, ES.lin(k, p.px(cx - 0.026), 0, p.px(cx + 0.026), 0, [[0, T.sol], [0.28, T.luz], [0.62, T.medio], [1, T.honda]]));
    var reg = new Lote(), regC = new Lote();
    for (i = 0; i < 7; i++) { var yr = p.py(Y0 + 0.03 + i * 0.024); reg.rect(p.px(cx - 0.026), yr, 0.052 * s, Math.max(0.8, 0.0012 * s)); regC.rect(p.px(cx - 0.026), yr + Math.max(0.8, 0.0012 * s), 0.052 * s, Math.max(0.7, 0.001 * s)); }
    reg.pintar(k, css(OSCURO, 0.26)); regC.pintar(k, css(BLANCO, 0.25));
    // el collar de bandas bajo el capitel
    relleno(k, function () { p.m(cx - 0.027, Ys - 0.006).l(cx + 0.027, Ys - 0.006).l(cx + 0.027, Ys).l(cx - 0.027, Ys).z(); }, horizontal(k, p.px(cx - 0.027), p.px(cx + 0.027), T.luz, T.sol, T.sombra));
    // el bloque del capitel: la cara de delante y, a la derecha, la cara del lado en sombra (son cuatro)
    relleno(k, function () { p.m(cx - 0.037, Ys).l(cx + 0.037, Ys).l(cx + 0.037, Yn).l(cx - 0.037, Yn).z(); }, ES.lin(k, 0, p.py(Yn), 0, p.py(Ys), [[0, T.sol], [1, T.medio]]));
    relleno(k, function () { p.m(cx + 0.037, Ys).l(cx + 0.047, Ys + 0.004).l(cx + 0.047, Yn - 0.002).l(cx + 0.037, Yn).z(); }, ES.lin(k, p.px(cx + 0.037), 0, p.px(cx + 0.047), 0, [[0, T.sombra], [1, T.honda]]));
    // en la cara del lado asoman la peluca rizada y la oreja de la otra Hathor
    relleno(k, function () { p.m(cx + 0.039, Yn - 0.006).q(cx + 0.046, Yn - 0.02, cx + 0.045, Ys + 0.012).q(cx + 0.047, Ys + 0.004, cx + 0.042, Ys + 0.006).q(cx + 0.04, Yn - 0.02, cx + 0.039, Yn - 0.006).z(); }, css(OSCURO, 0.22));
    relleno(k, function () { p.m(cx + 0.038, Ys + 0.038).q(cx + 0.044, Ys + 0.044, cx + 0.0475, Ys + 0.036).q(cx + 0.043, Ys + 0.032, cx + 0.038, Ys + 0.034).z(); }, css(T.sombra));
    caraHathor(k, p, s, cx, Ys + 0.034, 0.048, T);
    // el naos (la capilla del sistro) encima: caja con su puerta, su gola pequeña y los ureos
    relleno(k, function () { p.m(cx - 0.031, Yn).l(cx + 0.031, Yn).l(cx + 0.031, Yg).l(cx - 0.031, Yg).z(); }, ES.lin(k, p.px(cx - 0.031), p.py(Yg), p.px(cx + 0.031), p.py(Yn), [[0, T.luz], [0.6, T.sol], [1, T.sombra]]));
    relleno(k, function () { p.m(cx + 0.031, Yn).l(cx + 0.039, Yn + 0.002).l(cx + 0.039, Yg - 0.001).l(cx + 0.031, Yg).z(); }, css(T.honda));
    relleno(k, function () { p.m(cx - 0.009, Yn + 0.002).l(cx + 0.009, Yn + 0.002).l(cx + 0.009, Yg - 0.006).l(cx - 0.009, Yg - 0.006).z(); }, css(mez(T.sombra, OSCURIDAD, 0.35)));
    relleno(k, function () { p.m(cx - 0.012, Yg - 0.006).l(cx + 0.012, Yg - 0.006).l(cx + 0.012, Yg - 0.004).l(cx - 0.012, Yg - 0.004).z(); }, css(T.luz));
    gola(k, p, s, cx - 0.031, cx + 0.031, Yg, Ya, 0.004, T, { paso: 0.006, atadura: false });
    // el ábaco
    relleno(k, function () { p.m(cx - 0.028, Ya).l(cx + 0.028, Ya).l(cx + 0.028, Yt).l(cx - 0.028, Yt).z(); }, horizontal(k, p.px(cx - 0.028), p.px(cx + 0.028), T.sol, T.medio, T.sombra2));
  }
  A.dendera = {
    ancho: 0.8, alto: 0.4, abajo: 0, letra: true,
    dibujar: function (k, x, y, s, op) {
      var p = pluma(k, x, y, s), T = ARENISCA, i, X0 = -0.338, X1 = 0.338, r = U.azar(71);
      // el podio
      relleno(k, function () { p.m(-0.4, 0).l(0.4, 0).l(0.4, 0.012).l(-0.4, 0.012).z(); }, vertical(k, p.py(0.012), p.py(0), T.luz, T.medio, T.sombra2));
      // la penumbra de la sala, con el techo azul de estrellas doradas arriba
      relleno(k, function () { p.m(X0, 0.012).l(X1, 0.012).l(X1, 0.3).l(X0, 0.3).z(); }, ES.lin(k, 0, p.py(0.3), 0, p.py(0.012), [[0, mez(OSCURIDAD, P.lapis2, 0.35)], [0.3, OSCURIDAD], [1, mez(OSCURIDAD, T.honda, 0.4)]]));
      relleno(k, function () { p.m(X0, 0.272).l(X1, 0.272).l(X1, 0.3).l(X0, 0.3).z(); }, ES.lin(k, 0, p.py(0.3), 0, p.py(0.272), [[0, P.lapis], [1, mez(P.lapis2, OSCURIDAD, 0.5)]]));
      var est = new Lote(); for (i = 0; i < 40; i++) { var ex = X0 + r() * (X1 - X0), ey = 0.276 + r() * 0.02, de = (0.0012 + r() * 0.0012) * s; est.rect(p.px(ex), p.py(ey), de, de); }
      est.pintar(k, css(P.oro1, 0.85));
      // las columnas de dentro, en la penumbra (la segunda fila asoma entre las de delante)
      for (i = 0; i < 5; i++) {
        var cxi = (COL_DENDERA[i] + COL_DENDERA[i + 1]) / 2;
        relleno(k, function () { p.m(cxi - 0.02, 0.012).l(cxi + 0.02, 0.012).l(cxi + 0.02, 0.272).l(cxi - 0.02, 0.272).z(); }, ES.lin(k, p.px(cxi - 0.02), 0, p.px(cxi + 0.02), 0, [[0, mez(T.sombra, OSCURIDAD, 0.55)], [1, mez(T.honda, OSCURIDAD, 0.75)]]));
        relleno(k, function () { p.m(cxi - 0.027, 0.215).l(cxi + 0.027, 0.215).l(cxi + 0.027, 0.262).l(cxi - 0.027, 0.262).z(); }, ES.lin(k, 0, p.py(0.262), 0, p.py(0.215), [[0, mez(P.egipcio, OSCURIDAD, 0.55)], [1, mez(P.oro3, OSCURIDAD, 0.6)]]));
      }
      // los muros de los extremos (algo inclinados), con su toro en la esquina
      for (var lado = -1; lado <= 1; lado += 2) {
        var d = lado, xi = d * 0.338, xe0 = d * 0.395, xe1 = d * 0.386;
        var muro = function () { p.m(xi, 0.012).l(xe0, 0.012).l(xe1, 0.33).l(xi, 0.33).z(); };
        relleno(k, muro, ES.lin(k, p.px(Math.min(xi, xe0)), p.py(0.33), p.px(Math.max(xi, xe0)), p.py(0.012), d < 0 ? [[0, T.luz], [0.6, T.sol], [1, T.medio]] : [[0, T.sol], [0.5, T.medio], [1, T.sombra]]));
        var hil = new Lote(); for (var yy = 0.03; yy < 0.33; yy += 0.0185) hil.rect(p.px(Math.min(xi, xe1)), p.py(yy), Math.abs(xe0 - xi) * s, Math.max(0.7, 0.001 * s));
        hil.pintar(k, css(OSCURO, 0.16));
        // un relieve hundido: el marco de una escena
        relleno(k, function () { p.m(xi + d * 0.008, 0.05).l(xi + d * 0.046, 0.05).l(xi + d * 0.044, 0.26).l(xi + d * 0.008, 0.26).z(); }, css(OSCURO, 0.06));
        // el toro de la esquina
        relleno(k, function () { p.m(xe0 - d * 0.006, 0.012).l(xe0, 0.012).l(xe1, 0.33).l(xe1 - d * 0.006, 0.33).z(); }, ES.lin(k, p.px(xe0 - d * 0.006), 0, p.px(xe0), 0, d < 0 ? [[0, T.medio], [1, T.luz]] : [[0, T.sol], [1, T.honda]]));
      }
      // los muros-pantalla entre columnas, con su gola y su friso de ureos; en el centro, la puerta de dintel partido
      for (i = 0; i < 5; i++) {
        var a = COL_DENDERA[i] + 0.022, b = COL_DENDERA[i + 1] - 0.022, centro = i === 2;
        var tramos = centro ? [[a, a + 0.024], [b - 0.024, b]] : [[a, b]];
        for (var t2 = 0; t2 < tramos.length; t2++) {
          var ta = tramos[t2][0], tb = tramos[t2][1];
          relleno(k, function () { p.m(ta, 0.012).l(tb, 0.012).l(tb, 0.14).l(ta, 0.14).z(); }, ES.lin(k, p.px(ta), p.py(0.14), p.px(tb), p.py(0.012), [[0, T.luz], [0.55, T.sol], [1, T.medio]]));
          if (!centro) {
            // el relieve hundido de la escena y la raya de base
            relleno(k, function () { p.m(ta + 0.008, 0.026).l(tb - 0.008, 0.026).l(tb - 0.008, 0.13).l(ta + 0.008, 0.13).z(); }, css(OSCURO, 0.05));
            k.fillStyle = css(BLANCO, 0.2); k.fillRect(p.px(ta + 0.008), p.py(0.03), (tb - ta - 0.016) * s, Math.max(1, 0.0012 * s));
            // la escena: el emperador, con su corona, tiende la ofrenda a Hathor (cuernos de vaca y disco)
            var mid = (ta + tb) / 2, hf2 = 0.066;
            relieve(k, p, s, function (c) { figuraRelieve(c, p, s, mid - 0.016, 0.032, hf2, 1, 'rey'); figuraRelieve(c, p, s, mid + 0.017, 0.032, hf2 * 0.97, -1, 'diosa'); }, T);
          }
          gola(k, p, s, ta, tb, 0.14, 0.162, 0.003, T, { paso: 0.008, atadura: false });
          ureos(k, p, s, ta, tb, 0.162, 0.016, T);
        }
        // la sombra de la columna de la izquierda sobre el muro (la luz viene de la izquierda)
        k.fillStyle = ES.lin(k, p.px(a), 0, p.px(a + 0.03), 0, [[0, OSCURO, 0.26], [1, OSCURO, 0]]); k.fillRect(p.px(a), p.py(0.178), 0.03 * s, 0.166 * s);
      }
      // las seis columnas
      for (i = 0; i < 6; i++) estampar(k, 'columnaHathor', p.px(COL_DENDERA[i]), y, s, { x0: -0.05, x1: 0.052, y0: 0, y1: 0.302 }, function (c, cx0, cy0, s0) { columnaHathor(c, pluma(c, cx0, cy0, s0), s0, 0, ARENISCA); });
      // el arquitrabe con su texto (fórmulas de verdad, en relieve hundido)
      relleno(k, function () { p.m(X0, 0.3).l(X1, 0.3).l(X1, 0.33).l(X0, 0.33).z(); }, ES.lin(k, 0, p.py(0.33), 0, p.py(0.3), [[0, T.luz], [0.6, T.sol], [1, T.medio]]));
      k.fillStyle = ES.lin(k, 0, p.py(0.3), 0, p.py(0.293), [[0, OSCURO, 0.25], [1, OSCURO, 0]]); k.fillRect(p.px(X0), p.py(0.3), (X1 - X0) * s, 0.007 * s);
      var sig = ES.secuencia(5, 40), tam = 0.0165 * s;
      k.font = Math.round(tam) + 'px ' + ES.JERO; k.textAlign = 'center'; k.textBaseline = 'alphabetic'; k.fillStyle = css(mez(T.sombra, OSCURO, 0.35), 0.8);
      for (i = 0; i < sig.length; i++) { var gx = p.px(-0.318 + i * 0.0185); if (gx > p.px(0.326)) break; k.fillText(sig[i], gx, p.py(0.308)); }
      // la gran gola con el toro y el disco alado en medio
      gola(k, p, s, -0.391, 0.391, 0.33, 0.4, 0.008, T, { paso: 0.012 });
      discoAlado(k, p, s, 0, 0.364, 0.22, 0.042);
      // la arena al pie
      arena(k, x - 0.4 * s, x + 0.4 * s, y, 0.008 * s, 72, { ondas: 13 });
    }
  };


  /* ------------------------------------------------------------------ Amarna: el gran templo del Atón (Per-Aten)
     Un templo sin techo: el sol entra en todo. El pilono de entrada con sus mástiles y gallardetes rojos (como en los
     relieves de las tumbas de Amarna), patios de muros bajos, enlucidos de blanco, con filas de mesas de ofrendas cargadas
     (pan, frutas, verduras, lotos azules, jarras), y al fondo el gran altar en alto con su rampa. El disco del Atón con sus
     rayos acabados en manos va en el cielo (lo pone el mundo). */
  var ENLUCIDO = { luz: aclarar(P.lino, 0.3), sol: P.lino, medio: mez(P.lino, P.lino2, 0.5), sombra: mez(P.lino2, P.piedra2, 0.3), sombra2: mez(P.lino2, P.piedra2, 0.6), honda: mez(P.piedra2, P.tinta, 0.25) };
  // un muro bajo enlucido, de X0 a X1 y de alto h, con su albardilla y su sombra al pie
  function muroBajo(k, p, s, X0, X1, Y0, h, T) {
    relleno(k, function () { p.m(X0, Y0).l(X1, Y0).l(X1, Y0 + h).l(X0, Y0 + h).z(); }, ES.lin(k, 0, p.py(Y0 + h), 0, p.py(Y0), [[0, T.sol], [0.7, T.medio], [1, T.sombra]]));
    relleno(k, function () { p.m(X0 - 0.002, Y0 + h).l(X1 + 0.002, Y0 + h).l(X1 + 0.002, Y0 + h + 0.004).l(X0 - 0.002, Y0 + h + 0.004).z(); }, vertical(k, p.py(Y0 + h + 0.004), p.py(Y0 + h), T.luz, T.sol, T.medio));
    // los ladrillos, apenas marcados bajo el enlucido
    var l = new Lote(); for (var yy = Y0 + 0.008; yy < Y0 + h - 0.002; yy += 0.008) l.rect(p.px(X0), p.py(yy), (X1 - X0) * s, Math.max(0.6, 0.0007 * s));
    l.pintar(k, css(OSCURO, 0.06));
  }
  // una mesa de ofrendas cargada (de frente): ancla en el centro del pie; v = variante (0, 1, 2)
  function mesaOfrendas(k, x, y, s, v) {
    var p = pluma(k, x, y, s), T = ENLUCIDO;
    // el pie y el tablero de piedra
    relleno(k, function () { p.m(-0.009, 0).l(0.009, 0).l(0.0065, 0.019).l(-0.0065, 0.019).z(); }, horizontal(k, p.px(-0.009), p.px(0.009), T.luz, T.medio, T.sombra2));
    relleno(k, function () { p.m(-0.018, 0.019).l(0.018, 0.019).l(0.018, 0.0225).l(-0.018, 0.0225).z(); }, vertical(k, p.py(0.0225), p.py(0.019), T.luz, T.sol, T.sombra));
    // el montón: panes cónicos, panes redondos, granadas, puerros, una jarra roja y el ramo de lotos azules
    var panC = mez(P.oro2, P.arena2, 0.5), Yb = 0.0225;
    function pan(cx, w, h) { relleno(k, function () { p.m(cx - w, Yb).q(cx - w * 0.6, Yb + h, cx, Yb + h).q(cx + w * 0.6, Yb + h, cx + w, Yb).z(); }, ES.lin(k, p.px(cx - w), p.py(Yb + h), p.px(cx + w), p.py(Yb), [[0, aclarar(panC, 0.3)], [0.5, panC], [1, P.oro3]])); }
    function fruta(cx, cy, r, col) { k.beginPath(); k.arc(p.px(cx), p.py(cy), r * s, 0, TAU); k.fillStyle = ES.rad(k, p.px(cx - r * 0.35), p.py(cy + r * 0.35), 0, r * s, [[0, aclarar(col, 0.35)], [1, oscurecer(col, 0.2)]]); k.fill(); }
    if (v === 0) {
      // los puerros, detrás
      k.beginPath(); p.m(-0.014, Yb + 0.004).q(0.0, Yb + 0.013, 0.017, Yb + 0.011).m(-0.012, Yb + 0.002).q(0.002, Yb + 0.009, 0.019, Yb + 0.005);
      k.lineWidth = 0.0024 * s; k.strokeStyle = ES.lin(k, p.px(-0.014), 0, p.px(0.019), 0, [[0, P.lino], [0.35, aclarar(P.verde, 0.2)], [1, P.verde]]); k.lineCap = 'round'; k.stroke();
      pan(-0.009, 0.007, 0.016); pan(0.002, 0.0065, 0.019); fruta(0.012, Yb + 0.004, 0.0042, P.cornalina); fruta(-0.015, Yb + 0.0035, 0.0035, P.cornalina);
    } else if (v === 1) {
      pan(-0.01, 0.0075, 0.011); fruta(0, Yb + 0.0048, 0.0052, P.oro2);
      // la jarra roja
      relleno(k, function () { p.m(0.007, Yb).q(0.004, Yb + 0.008, 0.009, Yb + 0.014).l(0.0095, Yb + 0.017).l(0.0145, Yb + 0.017).l(0.015, Yb + 0.014).q(0.02, Yb + 0.008, 0.017, Yb).z(); }, ES.lin(k, p.px(0.004), 0, p.px(0.02), 0, [[0, aclarar(P.rojo, 0.25)], [0.6, P.rojo], [1, oscurecer(P.rojo, 0.3)]]));
      fruta(-0.003, Yb + 0.011, 0.0034, P.cornalina);
    } else {
      pan(0.008, 0.008, 0.014); pan(-0.008, 0.006, 0.012); fruta(0.0, Yb + 0.013, 0.004, P.verde);
    }
    // el ramo de lotos: tallos verdes y flores azules abiertas
    var lx = v === 1 ? -0.012 : 0.0, ly = Yb + (v === 1 ? 0.012 : 0.016);
    k.beginPath(); p.m(lx, ly - 0.002).q(lx - 0.003, ly + 0.01, lx - 0.008, ly + 0.0185).m(lx, ly - 0.002).l(lx + 0.001, ly + 0.0205).m(lx, ly - 0.002).q(lx + 0.004, ly + 0.009, lx + 0.009, ly + 0.0165);
    k.lineWidth = 0.0011 * s; k.strokeStyle = css(oscurecer(P.verde, 0.15)); k.stroke();
    function flor(fx, fy) {
      relleno(k, function () { p.m(fx, fy - 0.001).l(fx - 0.004, fy + 0.006).q(fx - 0.0015, fy + 0.0035, fx, fy + 0.0075).q(fx + 0.0015, fy + 0.0035, fx + 0.004, fy + 0.006).z(); }, ES.lin(k, 0, p.py(fy + 0.0075), 0, p.py(fy), [[0, aclarar(P.egipcio, 0.25)], [1, P.lapis]]));
    }
    flor(lx - 0.008, ly + 0.019); flor(lx + 0.001, ly + 0.021); flor(lx + 0.009, ly + 0.017);
  }
  // el pilono de Amarna: dos torres enlucidas con su gola, la puerta de dintel partido y los mástiles con gallardetes
  function pilonoAmarna(k, p, s, X0, X1, alto, T) {
    var w = X1 - X0, hueco = w * 0.17, xa = X0 + (w - hueco) / 2, xb = xa + hueco, i;
    for (var lado = 0; lado < 2; lado++) {
      var a = lado ? xb : X0, b = lado ? X1 : xa, inc = (b - a) * 0.07;
      var torre = function () { p.m(a, 0).l(b, 0).l(b - (lado ? inc : 0), alto).l(a + (lado ? 0 : inc), alto).z(); };
      relleno(k, torre, ES.lin(k, p.px(a), p.py(alto), p.px(b), p.py(0), lado ? [[0, T.sol], [0.6, T.medio], [1, T.sombra]] : [[0, T.luz], [0.6, T.sol], [1, T.medio]]));
      // los cuatro nichos de los mástiles, cada uno con su mástil de madera, la punta de oro y dos gallardetes rojos
      for (i = 0; i < 2; i++) {
        var mx = a + (b - a) * (0.28 + i * 0.44);
        relleno(k, function () { p.m(mx - 0.006, 0.012).l(mx + 0.006, 0.012).l(mx + 0.005, alto - 0.004).l(mx - 0.005, alto - 0.004).z(); }, css(OSCURO, 0.1));
        var tope = alto + 0.085 + (i ? 0.004 : 0);
        relleno(k, function () { p.m(mx - 0.0022, 0.012).l(mx + 0.0022, 0.012).l(mx + 0.0014, tope).l(mx - 0.0014, tope).z(); }, horizontal(k, p.px(mx - 0.0022), p.px(mx + 0.0022), mez(P.oro3, P.piel2, 0.3), P.oro4, oscurecer(P.oro4, 0.3)));
        relleno(k, function () { p.m(mx - 0.0018, tope).l(mx + 0.0018, tope).l(mx, tope + 0.006).z(); }, ES.oro(k, p.px(mx - 0.002), p.py(tope + 0.006), p.px(mx + 0.002), p.py(tope), 0.3));
        for (var g2 = 0; g2 < 2; g2++) {
          var gy = tope - 0.006 - g2 * 0.011, ond = g2 ? 0.003 : -0.002;
          relleno(k, function () { p.m(mx + 0.0014, gy).c(mx + 0.014, gy + 0.004 + ond, mx + 0.024, gy - 0.004 + ond, mx + 0.036, gy - 0.002).c(mx + 0.025, gy - 0.008 + ond, mx + 0.014, gy - 0.003 + ond, mx + 0.0014, gy - 0.006).z(); },
            ES.lin(k, p.px(mx), p.py(gy), p.px(mx + 0.036), p.py(gy - 0.006), [[0, aclarar(P.rojo, 0.15)], [0.6, P.cornalina], [1, oscurecer(P.rojo, 0.2)]]));
        }
      }
      // el relieve: el disco del Atón, con sus rayos acabados en manos, sobre el rey y la reina que ofrendan
      var cxr = (a + b) / 2;
      relieve(k, p, s, function (c) { atonRelieve(c, p, s, cxr, alto * 0.8, 0.007, 0.034); figuraRelieve(c, p, s, cxr - 0.011, alto * 0.47, 0.03, 1, 'rey'); figuraRelieve(c, p, s, cxr + 0.012, alto * 0.47, 0.028, -1, 'reina'); }, T);
      gola(k, p, s, a + (lado ? 0 : inc) - 0.001, b - (lado ? inc : 0) + 0.001, alto, alto + 0.022, 0.004, T, { paso: 0.009 });
    }
    // la puerta de dintel partido (la de Amarna): dos jambas con medio dintel cada una; el paso, abierto al cielo, en sombra
    var hp = alto * 0.66;
    relleno(k, function () { p.m(xa, 0).l(xb, 0).l(xb, hp).l(xa, hp).z(); }, ES.lin(k, 0, p.py(hp), 0, p.py(0), [[0, T.sombra], [0.75, T.sombra2], [1, mez(T.sombra, P.arena, 0.4)]]));
    k.fillStyle = ES.lin(k, p.px(xa), 0, p.px(xa + 0.012), 0, [[0, OSCURO, 0.25], [1, OSCURO, 0]]); k.fillRect(p.px(xa), p.py(hp), 0.012 * s, hp * s);
    for (i = 0; i < 2; i++) {
      var ja = i ? xb - 0.007 : xa - 0.006, jb = i ? xb + 0.006 : xa + 0.007;
      relleno(k, function () { p.m(ja, 0).l(jb, 0).l(jb, hp).l(ja, hp).z(); }, horizontal(k, p.px(ja), p.px(jb), T.luz, T.sol, T.medio));
      gola(k, p, s, ja - 0.003, jb + 0.003, hp, hp + 0.016, 0.003, T, { paso: 0.006, atadura: false });
    }
  }
  // el gran altar: una plataforma en alto con su rampa, el pretil y encima la mesa grande cargada, entre dos pebeteros
  function altarAmarna(k, p, s, X0, X1, alto, T, xMesa) {
    var rampa = 0.07, i;
    // la rampa, a la izquierda
    relleno(k, function () { p.m(X0 - rampa, 0).l(X0, alto).l(X0 + 0.02, alto).l(X0 + 0.02, 0).z(); }, ES.lin(k, p.px(X0 - rampa), p.py(alto), p.px(X0), p.py(0), [[0, T.luz], [1, T.medio]]));
    var esc = new Lote(); for (i = 1; i < 12; i++) { var t = i / 12; esc.rect(p.px(X0 - rampa + rampa * t), p.py(alto * t), 0.02 * s, Math.max(0.7, 0.001 * s)); }
    esc.pintar(k, css(OSCURO, 0.12));
    // la plataforma: cara de delante y su lado en sombra
    relleno(k, function () { p.m(X0, 0).l(X1, 0).l(X1, alto).l(X0, alto).z(); }, ES.lin(k, p.px(X0), p.py(alto), p.px(X1), p.py(0), [[0, T.luz], [0.6, T.sol], [1, T.medio]]));
    relleno(k, function () { p.m(X1, 0).l(X1 + 0.012, 0.004).l(X1 + 0.012, alto + 0.002).l(X1, alto).z(); }, ES.lin(k, p.px(X1), 0, p.px(X1 + 0.012), 0, [[0, T.sombra], [1, T.sombra2]]));
    var hil = new Lote(); for (var yy = 0.012; yy < alto - 0.014; yy += 0.012) hil.rect(p.px(X0), p.py(yy), (X1 - X0) * s, Math.max(0.6, 0.0008 * s));
    hil.pintar(k, css(OSCURO, 0.07));
    // el friso pintado de arriba: rectángulos de lapislázuli, rojo, oro y turquesa entre filetes (como los de los palacios
    // de Amarna) y, debajo, el zócalo oscuro
    var cols = [P.lapis, P.rojo, P.oro2, P.turquesa], fw = 0.009, nf = Math.floor((X1 - X0) / fw);
    relleno(k, function () { p.m(X0, alto - 0.013).l(X1, alto - 0.013).l(X1, alto - 0.003).l(X0, alto - 0.003).z(); }, css(T.luz));
    for (i = 0; i < 4; i++) {
      var lf = new Lote();
      for (var f = i; f < nf; f += 4) lf.rect(p.px(X0 + f * fw + fw * 0.12), p.py(alto - 0.0045), fw * 0.76 * s, 0.007 * s);
      lf.pintar(k, ES.lin(k, 0, p.py(alto - 0.0045), 0, p.py(alto - 0.0115), [[0, aclarar(cols[i], 0.2)], [1, cols[i]]]));
    }
    relleno(k, function () { p.m(X0, 0).l(X1, 0).l(X1, 0.012).l(X0, 0.012).z(); }, ES.lin(k, 0, p.py(0.012), 0, p.py(0), [[0, T.sombra], [1, T.sombra2]]));
    // el pretil de arriba, con la gola
    gola(k, p, s, X0 - 0.002, X1 + 0.002, alto, alto + 0.016, 0.003, T, { paso: 0.009 });
    // dos pebeteros de bronce a los lados de la mesa grande
    for (i = 0; i < 2; i++) {
      var bx = xMesa + (i ? 0.045 : -0.045), b0 = alto + 0.016;
      // el pie, alto y fino, con su basa ancha, y el cuenco abierto con el incienso
      relleno(k, function () { p.m(bx - 0.007, b0).l(bx + 0.007, b0).l(bx + 0.0022, b0 + 0.006).l(bx + 0.0016, b0 + 0.03).l(bx - 0.0016, b0 + 0.03).l(bx - 0.0022, b0 + 0.006).z(); }, ES.oro(k, p.px(bx - 0.007), p.py(b0 + 0.03), p.px(bx + 0.007), p.py(b0), 0.35));
      relleno(k, function () { p.m(bx - 0.0095, b0 + 0.036).l(bx + 0.0095, b0 + 0.036).q(bx + 0.006, b0 + 0.029, bx, b0 + 0.029).q(bx - 0.006, b0 + 0.029, bx - 0.0095, b0 + 0.036).z(); }, ES.oro(k, p.px(bx - 0.0095), p.py(b0 + 0.036), p.px(bx + 0.0095), p.py(b0 + 0.029), 0.3));
      relleno(k, function () { p.m(bx - 0.007, b0 + 0.036).q(bx, b0 + 0.042, bx + 0.007, b0 + 0.036).z(); }, ES.lin(k, 0, p.py(b0 + 0.041), 0, p.py(b0 + 0.036), [[0, P.cornalina], [1, oscurecer(P.rojo, 0.3)]]));
    }
    // la mesa grande del altar, con su montón de ofrendas (dos mesas pequeñas juntas, más grandes)
    estampar(k, 'mesaGrande', p.px(xMesa - 0.016), p.py(alto + 0.016), s * 1.35, { x0: -0.022, x1: 0.024, y0: 0, y1: 0.066 }, function (c, x0, y0, s0) { mesaOfrendas(c, x0, y0, s0, 0); });
    estampar(k, 'mesaGrande1', p.px(xMesa + 0.017), p.py(alto + 0.016), s * 1.35, { x0: -0.022, x1: 0.024, y0: 0, y1: 0.066 }, function (c, x0, y0, s0) { mesaOfrendas(c, x0, y0, s0, 1); });
  }
  A.amarna = {
    ancho: 0.8, alto: 0.3, abajo: 0,
    dibujar: function (k, x, y, s, op) {
      var p = pluma(k, x, y, s), T = ENLUCIDO, i, caja = { x0: -0.022, x1: 0.024, y0: 0, y1: 0.066 };
      function mesa(X, Y, v) { estampar(k, 'mesaOfrendas' + v, p.px(X), p.py(Y), s, caja, function (c, x0, y0, s0) { mesaOfrendas(c, x0, y0, s0, v); }); }
      // el suelo del recinto, de yeso
      relleno(k, function () { p.m(-0.4, 0).l(0.4, 0).l(0.4, 0.006).l(-0.4, 0.006).z(); }, vertical(k, p.py(0.006), p.py(0), T.sol, T.medio, T.sombra));
      // el muro del fondo del patio (con una puerta de dintel partido) y, delante, la fila de atrás de mesas
      muroBajo(k, p, s, -0.15, 0.13, 0.006, 0.07, T);
      relleno(k, function () { p.m(-0.02, 0.006).l(0.012, 0.006).l(0.012, 0.062).l(-0.02, 0.062).z(); }, ES.lin(k, 0, p.py(0.062), 0, p.py(0.006), [[0, mez(T.sombra, P.arena, 0.4)], [1, T.sombra2]]));
      gola(k, p, s, -0.026, -0.016, 0.062, 0.072, 0.002, T, { paso: 0.005, atadura: false }); gola(k, p, s, 0.008, 0.018, 0.062, 0.072, 0.002, T, { paso: 0.005, atadura: false });
      for (i = 0; i < 7; i++) mesa(-0.128 + i * 0.04, 0.034, (i + 1) % 3);
      // el muro bajo del medio y, delante, la primera fila
      muroBajo(k, p, s, -0.155, 0.135, 0.006, 0.028, T);
      for (i = 0; i < 7; i++) mesa(-0.135 + i * 0.044, 0.006, i % 3);
      // el gran altar, a la derecha: aquí bajan los rayos del Atón
      altarAmarna(k, p, s, 0.2, 0.345, 0.085, T, 0.272);
      // el pilono de entrada, a la izquierda
      pilonoAmarna(k, p, s, -0.395, -0.165, 0.16, T);
      // la arena al pie
      arena(k, x - 0.4 * s, x + 0.4 * s, y, 0.006 * s, 81, { ondas: 15 });
    }
  };
  // el centro del altar (donde llegan los rayos del Atón), respecto al ancla
  A.amarna.altar = { dx: 0.272, dy: -0.13 };


  /* ------------------------------------------------------------------ Saqqara: la pirámide escalonada de Zoser
     Seis gradas de caliza (62,5 m; base de 109 × 125 m), gastadas, con las esquinas rotas y el escombro al pie de cada
     una. Delante, un tramo del muro del recinto (10,5 m, de caliza fina de Tura) con su «fachada de palacio»: bastiones y
     entrantes, y la puerta estrecha de la entrada. */
  // el muro de fachada de palacio: bastiones al sol y entrantes en sombra (la pared izquierda del entrante da sombra; la de
  // la derecha recibe la luz)
  function muroPalacio(k, p, s, X0, X1, alto, T, puerta) {
    var i, bast = new Lote(), sombraB = new Lote(), ranuras = new Lote(), luzR = new Lote(), hil = new Lote(), x = X0 + 0.006, n = 0;
    // el muro de fondo (los paños entre bastiones, algo hundidos)
    relleno(k, function () { p.m(X0, 0).l(X1, 0).l(X1, alto).l(X0, alto).z(); }, ES.lin(k, 0, p.py(alto), 0, p.py(0), [[0, T.sol], [0.6, T.medio], [1, T.sombra]]));
    while (x < X1 - 0.02) {
      // un bastión (ancho, al sol) y luego un paño con dos entrantes; cada cinco, un bastión doble (las falsas puertas)
      var doble = n % 5 === 2, bw = doble ? 0.03 : 0.017, pw = 0.016;
      if (x + bw > X1 - 0.006) break;
      if (puerta == null || x + bw < puerta - 0.014 || x > puerta + 0.014) {
        bast.rect(p.px(x), p.py(alto - 0.005), bw * s, (alto - 0.005) * s);
        sombraB.rect(p.px(x + bw), p.py(alto - 0.005), 0.006 * s, (alto - 0.005) * s);
        // las ranuras finas del bastión: su pared izquierda en sombra, la derecha al sol
        var nr = doble ? 3 : 1;
        for (var q = 0; q < nr; q++) { var rx = x + bw * (q + 1) / (nr + 1) - 0.0015; ranuras.rect(p.px(rx), p.py(alto - 0.012), 0.003 * s, (alto - 0.02) * s); luzR.rect(p.px(rx + 0.0022), p.py(alto - 0.012), 0.0008 * s, (alto - 0.02) * s); }
      }
      x += bw + pw; n++;
    }
    for (var yy = 0.009; yy < alto - 0.004; yy += 0.0072) hil.rect(p.px(X0), p.py(yy), (X1 - X0) * s, Math.max(0.6, 0.0007 * s));
    sombraB.pintar(k, css(OSCURO, 0.16));
    bast.pintar(k, ES.lin(k, 0, p.py(alto), 0, p.py(0), [[0, T.luz], [0.5, T.sol], [1, T.medio]]));
    hil.pintar(k, css(OSCURO, 0.07));
    ranuras.pintar(k, css(OSCURO, 0.22)); luzR.pintar(k, css(BLANCO, 0.45));
    // la albardilla de arriba, redondeada
    relleno(k, function () { p.m(X0, alto - 0.006).l(X1, alto - 0.006).l(X1, alto).q(X1, alto + 0.003, X1 - 0.003, alto + 0.003).l(X0 + 0.003, alto + 0.003).q(X0, alto + 0.003, X0, alto).z(); }, vertical(k, p.py(alto + 0.003), p.py(alto - 0.006), T.luz, T.sol, T.medio));
    // la puerta de la entrada: un paso estrecho y hondo, con su dintel
    if (puerta != null) {
      relleno(k, function () { p.m(puerta - 0.008, 0).l(puerta + 0.008, 0).l(puerta + 0.008, alto * 0.72).l(puerta - 0.008, alto * 0.72).z(); }, ES.lin(k, 0, p.py(alto * 0.72), 0, p.py(0), [[0, OSCURIDAD], [1, mez(T.sombra, OSCURIDAD, 0.5)]]));
      relleno(k, function () { p.m(puerta - 0.013, alto * 0.72).l(puerta + 0.013, alto * 0.72).l(puerta + 0.013, alto * 0.8).l(puerta - 0.013, alto * 0.8).z(); }, vertical(k, p.py(alto * 0.8), p.py(alto * 0.72), T.luz, T.sol, T.medio));
    }
    k.fillStyle = ES.lin(k, 0, p.py(0.012), 0, p.py(0), [[0, OSCURO, 0], [1, OSCURO, 0.14]]); k.fillRect(p.px(X0), p.py(0.012), (X1 - X0) * s, 0.012 * s);
  }
  A.saqqara = {
    ancho: 0.75, alto: 0.34, abajo: 0,
    dibujar: function (k, x, y, s, op) {
      var p = pluma(k, x, y, s);
      // la pirámide queda detrás del muro, más al fondo: su pie va algo más alto, para que se vean las seis gradas
      escalonada(k, x + 0.025 * s, y - 0.032 * s, s, { base: 0.62, alto: 0.306, pasos: 6, pie: 0.66, incl: 0.26, cima: 0.27, semilla: 1902, hiladas: 6, erosion: 1, tono: CAL });
      // el escombro y la arena al pie de la pirámide, detrás del muro
      arena(k, x - 0.31 * s, x + 0.36 * s, y - 0.03 * s, 0.016 * s, 91, { ondas: 6 });
      relleno(k, function () { p.m(-0.33, 0.03).l(0.37, 0.03).l(0.37, 0.045).l(-0.33, 0.045).z(); }, css(mez(P.arena, P.arena2, 0.5)));
      muroPalacio(k, p, s, -0.375, 0.375, 0.05, TURA_MURO, -0.27);
      arena(k, x - 0.375 * s, x + 0.375 * s, y, 0.007 * s, 92, { ondas: 14 });
    }
  };
  var TURA_MURO = { luz: aclarar(P.piedra, 0.62), sol: aclarar(P.piedra, 0.48), medio: aclarar(P.piedra, 0.3), sombra: mez(P.piedra, P.piedra2, 0.45) };


  /* ------------------------------------------------------------------ el Faro de Alejandría
     Sobre la isla de Faros (rocas y escollera), un basamento; la rampa sobre arcos hasta la puerta; el cuerpo cuadrado y
     ancho, con ventanas, rematado por los tritones de las esquinas; el cuerpo octogonal, más estrecho; el cilíndrico; la
     linterna (vacía y oscura: el fuego, el humo y la luz los pone el mundo) y, arriba de todo, la estatua de Zeus Sóter con
     su cetro. Con op.ruina: solo el basamento roto, con los bloques que tiraron los terremotos de 1303 y 1323. */
  var FARO_T = { luz: aclarar(P.lino, 0.25), sol: mez(P.lino, P.piedra, 0.3), medio: mez(P.piedra, P.lino, 0.45), sombra: mez(P.piedra2, P.lino2, 0.45), sombra2: mez(P.piedra2, P.lino2, 0.15), honda: oscurecer(P.piedra2, 0.22) };
  var ROCA = { luz: mez(P.piedra2, P.lino2, 0.45), sol: mez(P.piedra2, P.lino2, 0.2), medio: mez(P.piedra2, P.negro2, 0.22), sombra: mez(P.piedra2, P.negro, 0.42), sombra2: mez(P.piedra2, P.negro, 0.55), honda: mez(P.piedra2, P.negro, 0.65) };
  // las rocas de la isla y la escollera de bloques a la derecha
  function islaFaros(k, p, s, semilla) {
    var r = U.azar(semilla), i;
    // rocas de arenisca de la isla, angulosas: primero las de atrás (más claras), luego las de delante
    for (var capa = 0; capa < 2; capa++) {
      var n = capa ? 8 : 6;
      for (i = 0; i < n; i++) {
        var w = (capa ? 0.026 : 0.034) + r() * 0.03, cx = -0.18 + w / 2 + (0.36 - w) * (i + r() * 0.6) / n, h = (capa ? 0.012 : 0.026) + r() * (capa ? 0.016 : 0.014);
        var pts = [], nv = 7;
        for (var v = 0; v <= nv; v++) { var a2 = Math.PI * v / nv, rr = 0.78 + r() * 0.3; pts.push(p.px(cx - Math.cos(a2) * w / 2 * rr), p.py(Math.sin(a2) * h * rr * (v === 0 || v === nv ? 0 : 1))); }
        var T2 = capa ? ROCA : { luz: aclarar(ROCA.luz, 0.12), medio: mez(ROCA.medio, ROCA.luz, 0.35), sombra2: ROCA.sombra };
        relleno(k, function (c) { poli(c, pts); }, ES.lin(k, p.px(cx - w / 2), p.py(h), p.px(cx + w / 2), p.py(0), [[0, T2.luz], [0.5, T2.medio], [1, T2.sombra2]]));
        // la cara de arriba, al sol: un triángulo claro entre los vértices de la izquierda y la cima
        relleno(k, function (c) { poli(c, [pts[2], pts[3], pts[6], pts[7], pts[8], pts[9], (pts[2] + pts[8]) / 2, (pts[3] + pts[9]) / 2 + h * 0.25 * s]); }, css(BLANCO, 0.14));
      }
    }
    // la escollera: bloques escuadrados amontonados en talud
    for (i = 0; i < 12; i++) { var bw = 0.012 + r() * 0.01, bx = Math.min(0.1 + r() * 0.075, 0.172 - bw * 0.62), by = 0.004 + r() * 0.01; bloque(k, p.px(bx), p.py(by), bw * s, bw * 0.62 * s, ROCA, (r() - 0.5) * 0.5); }
  }
  // el basamento: un zócalo ancho y algo inclinado, con su moldura
  function basamentoFaro(k, p, s, T) {
    relleno(k, function () { p.m(-0.15, 0.028).l(0.15, 0.028).l(0.14, 0.064).l(-0.14, 0.064).z(); }, ES.lin(k, p.px(-0.15), p.py(0.064), p.px(0.15), p.py(0.028), [[0, T.luz], [0.55, T.sol], [1, T.sombra]]));
    var hl = new Lote(); for (var yy = 0.036; yy < 0.062; yy += 0.0075) hl.rect(p.px(-0.15), p.py(yy), 0.3 * s, Math.max(0.6, 0.0008 * s));
    hl.pintar(k, css(OSCURO, 0.12));
    relleno(k, function () { p.m(-0.145, 0.064).l(0.145, 0.064).l(0.145, 0.07).l(-0.145, 0.07).z(); }, vertical(k, p.py(0.07), p.py(0.064), T.luz, T.sol, T.medio));
  }
  // un tritón de bronce que sopla su caracola (en las esquinas del primer cuerpo); d = hacia dónde mira
  function triton(k, p, s, cx, cy, h, d) {
    var g = ES.oro(k, p.px(cx - h * 0.4), p.py(cy + h), p.px(cx + h * 0.4), p.py(cy), 0.32);
    relleno(k, function () {
      p.m(cx - h * 0.22, cy).c(cx - h * 0.28, cy + h * 0.3, cx - h * 0.2, cy + h * 0.55, cx - d * h * 0.02, cy + h * 0.62)
        .c(cx + d * h * 0.16, cy + h * 0.6, cx + h * 0.22, cy + h * 0.3, cx + h * 0.2, cy).z();
    }, g);
    k.beginPath(); k.arc(p.px(cx + d * h * 0.03), p.py(cy + h * 0.74), h * 0.12 * s, 0, TAU); k.fillStyle = g; k.fill();
    // el brazo que sube y la caracola, hacia fuera
    k.beginPath(); p.m(cx + d * h * 0.1, cy + h * 0.55).q(cx + d * h * 0.24, cy + h * 0.68, cx + d * h * 0.18, cy + h * 0.78); k.lineWidth = h * 0.08 * s; k.strokeStyle = g; k.lineCap = 'round'; k.stroke();
    relleno(k, function () { p.m(cx + d * h * 0.1, cy + h * 0.76).l(cx + d * h * 0.46, cy + h * 0.98).l(cx + d * h * 0.5, cy + h * 0.86).z(); }, ES.oro(k, p.px(cx), p.py(cy + h), p.px(cx + d * h * 0.5), p.py(cy + h * 0.76), 0.4));
  }
  // la estatua de lo alto: Zeus Sóter, de pie, con el manto y el cetro en alto
  function zeus(k, p, s, cx, cy, h) {
    var g = ES.oro(k, p.px(cx - h * 0.3), p.py(cy + h), p.px(cx + h * 0.3), p.py(cy), 0.3), g2 = ES.oro(k, p.px(cx - h * 0.2), p.py(cy + h * 0.8), p.px(cx + h * 0.25), p.py(cy), 0.55);
    k.lineCap = 'round'; k.lineJoin = 'round';
    // el cetro, largo, en la mano derecha (a la izquierda del que mira: la estatua mira al frente)
    k.beginPath(); p.m(cx - h * 0.2, cy).l(cx - h * 0.2, cy + h * 0.97); k.lineWidth = h * 0.03 * s; k.strokeStyle = g; k.stroke();
    // las piernas: la de apoyo recta y la otra algo doblada
    relleno(k, function () { p.m(cx - h * 0.07, cy).l(cx - h * 0.02, cy).l(cx + h * 0.0, cy + h * 0.42).l(cx - h * 0.09, cy + h * 0.42).z(); }, g);
    relleno(k, function () { p.m(cx + h * 0.03, cy).l(cx + h * 0.08, cy).l(cx + h * 0.06, cy + h * 0.2).l(cx + h * 0.09, cy + h * 0.42).l(cx + h * 0.0, cy + h * 0.42).z(); }, g);
    // el torso desnudo y la cabeza
    relleno(k, function () { p.m(cx - h * 0.1, cy + h * 0.42).l(cx + h * 0.1, cy + h * 0.42).c(cx + h * 0.12, cy + h * 0.58, cx + h * 0.12, cy + h * 0.7, cx + h * 0.11, cy + h * 0.76).l(cx - h * 0.11, cy + h * 0.76).c(cx - h * 0.12, cy + h * 0.66, cx - h * 0.12, cy + h * 0.55, cx - h * 0.1, cy + h * 0.42).z(); }, g2);
    k.beginPath(); k.arc(p.px(cx), p.py(cy + h * 0.85), h * 0.075 * s, 0, TAU); k.fillStyle = g2; k.fill();
    // el manto: le envuelve las caderas y sube al hombro izquierdo, del que cae
    relleno(k, function () { p.m(cx - h * 0.12, cy + h * 0.5).c(cx - h * 0.04, cy + h * 0.38, cx + h * 0.08, cy + h * 0.36, cx + h * 0.13, cy + h * 0.42).l(cx + h * 0.15, cy + h * 0.78).l(cx + h * 0.19, cy + h * 0.25).c(cx + h * 0.12, cy + h * 0.2, cx + h * 0.0, cy + h * 0.22, cx - h * 0.12, cy + h * 0.32).z(); }, g);
    // los brazos: el derecho sube al cetro; el izquierdo, bajo el manto
    k.beginPath(); p.m(cx - h * 0.1, cy + h * 0.72).q(cx - h * 0.2, cy + h * 0.72, cx - h * 0.2, cy + h * 0.86); k.lineWidth = h * 0.055 * s; k.strokeStyle = g2; k.stroke();
    ES.brillo(k, function () { p.m(cx - h * 0.1, cy + h * 0.42).l(cx + h * 0.1, cy + h * 0.42).l(cx + h * 0.11, cy + h * 0.76).l(cx - h * 0.11, cy + h * 0.76).z(); }, p.px(cx - h * 0.12), 0, p.px(cx + h * 0.04), 0, 0.3, [255, 250, 222]);
  }

  // un cuerpo de la torre: cara de delante (al sol) y la del lado derecho (en sombra), de Y0 a Y1, con su ancho abajo y arriba
  function cuerpoTorre(k, p, s, Y0, Y1, w0, w1, lado0, lado1, T) {
    relleno(k, function () { p.m(-w0, Y0).l(w0, Y0).l(w1, Y1).l(-w1, Y1).z(); }, ES.lin(k, p.px(-w0), p.py(Y1), p.px(w0), p.py(Y0), [[0, T.luz], [0.5, T.sol], [1, T.medio]]));
    relleno(k, function () { p.m(w0, Y0).l(w0 + lado0, Y0 + 0.004).l(w1 + lado1, Y1 - 0.002).l(w1, Y1).z(); }, ES.lin(k, p.px(w0), 0, p.px(w0 + lado0), 0, [[0, T.sombra], [1, T.sombra2]]));
    var hl = new Lote(); for (var yy = Y0 + 0.008; yy < Y1 - 0.003; yy += 0.0082) { var f = (yy - Y0) / (Y1 - Y0), ww = w0 + (w1 - w0) * f, wl = lado0 + (lado1 - lado0) * f; hl.rect(p.px(-ww), p.py(yy), (2 * ww + wl) * s, Math.max(0.6, 0.0007 * s)); }
    hl.pintar(k, css(OSCURO, 0.09));
    // la sombra al pie del cuerpo
    k.fillStyle = ES.lin(k, 0, p.py(Y0 + 0.02), 0, p.py(Y0), [[0, OSCURO, 0], [1, OSCURO, 0.1]]); k.fillRect(p.px(-w0), p.py(Y0 + 0.02), (2 * w0 + lado0) * s, 0.02 * s);
  }
  function ventanas(k, p, s, lista, w, h, T) {
    var v = new Lote(), al = new Lote(), sombraV = new Lote();
    for (var i = 0; i < lista.length; i += 2) { var X = lista[i], Y = lista[i + 1]; v.rect(p.px(X - w / 2), p.py(Y + h), w * s, h * s); sombraV.rect(p.px(X - w / 2), p.py(Y + h), w * 0.4 * s, h * s); al.rect(p.px(X - w * 0.7), p.py(Y), w * 1.4 * s, Math.max(1, h * 0.14 * s)); }
    v.pintar(k, ES.lin(k, 0, 0, 0, 1, [[0, OSCURIDAD], [1, OSCURIDAD]])); sombraV.pintar(k, css(OSCURO, 0.3)); al.pintar(k, css(T.luz));
  }
  // una cornisa saliente con dentículos
  function cornisaFaro(k, p, s, X0, X1, Y, h, T) {
    relleno(k, function () { p.m(X0, Y).l(X1, Y).l(X1 + h * 0.6, Y + h * 0.55).l(X1 + h * 0.6, Y + h).l(X0 - h * 0.6, Y + h).l(X0 - h * 0.6, Y + h * 0.55).z(); }, vertical(k, p.py(Y + h), p.py(Y), T.luz, T.sol, T.sombra));
    var d = new Lote(); for (var xx = X0; xx < X1; xx += h * 0.5) d.rect(p.px(xx), p.py(Y + h * 0.5), h * 0.22 * s, h * 0.3 * s);
    d.pintar(k, css(OSCURO, 0.22));
  }
  A.faro = {
    ancho: 0.36, alto: 0.62, abajo: 0,
    caja: function (op) { return op && op.ruina ? { ancho: 0.36, alto: 0.13, abajo: 0 } : { ancho: 0.36, alto: 0.62, abajo: 0 }; },
    dibujar: function (k, x, y, s, op) {
      op = op || {};
      var p = pluma(k, x, y, s), T = FARO_T, i, r = U.azar(1303);
      islaFaros(k, p, s, 21);
      basamentoFaro(k, p, s, T);
      if (op.ruina) {
        // el muñón del primer cuerpo: hiladas de sillares rotas a distinta altura (más alto a la izquierda, donde aguantó)
        var ch = 0.0082, luzB = new Lote(), sombraB = new Lote(), juntas = new Lote(), cantos = new Lote();
        for (var fila = 0; fila < 8; fila++) {
          var y0 = 0.07 + fila * ch, bx = -0.072 + (fila % 2) * 0.006;
          while (bx < 0.09) {
            var bw = 0.014 + r() * 0.008, alto2 = 0.07 + 0.062 * Math.max(0, 1 - (bx + 0.072) / 0.19) * (0.6 + r() * 0.5) + (r() < 0.25 ? 0.012 : 0);
            if (y0 + ch <= alto2 && bx < 0.072) {
              var b0 = Math.max(bx, -0.072), b1 = Math.min(bx + bw, 0.072);
              luzB.rect(p.px(b0), p.py(y0 + ch), (b1 - b0) * s, ch * s); juntas.rect(p.px(b0), p.py(y0 + ch), Math.max(0.7, 0.0008 * s), ch * s);
              cantos.rect(p.px(b0), p.py(y0 + ch), (b1 - b0) * s, Math.max(0.7, 0.0009 * s));
            }
            bx += bw;
          }
          if (fila < 4) sombraB.rect(p.px(0.072), p.py(y0 + ch), 0.016 * s, ch * s);
        }
        luzB.pintar(k, ES.lin(k, p.px(-0.072), p.py(0.13), p.px(0.072), p.py(0.07), [[0, T.luz], [0.5, T.sol], [1, T.medio]]));
        sombraB.pintar(k, css(T.sombra)); juntas.pintar(k, css(OSCURO, 0.22)); cantos.pintar(k, css(BLANCO, 0.4));
        // los bloques y los fustes de granito caídos, por el basamento y entre las rocas
        for (i = 0; i < 14; i++) { var fx = -0.15 + r() * 0.3, fy = (r() < 0.55 ? 0.07 : 0.026 + r() * 0.01), fw = 0.012 + r() * 0.016; bloque(k, p.px(fx), p.py(fy), fw * s, fw * (0.45 + r() * 0.3) * s, T, (r() - 0.5) * 0.6); }
        for (i = 0; i < 2; i++) {
          var tx = i ? 0.095 : -0.12, ty = i ? 0.07 : 0.03, tl = 0.045, tr = 0.0065;
          relleno(k, function () { p.m(tx - tl / 2, ty).l(tx + tl / 2, ty).l(tx + tl / 2, ty + tr * 2).l(tx - tl / 2, ty + tr * 2).z(); }, ES.lin(k, 0, p.py(ty + tr * 2), 0, p.py(ty), [[0, aclarar(ROSA.sol, 0.1)], [0.4, ROSA.medio], [1, ROSA.honda]]));
          k.beginPath(); k.ellipse(p.px(tx + tl / 2), p.py(ty + tr), tr * 0.45 * s, tr * s, 0, 0, TAU); k.fillStyle = css(ROSA.sombra); k.fill();
        }
        return;
      }
      // la rampa sobre arcos, a la derecha, hasta la puerta
      relleno(k, function () { p.m(0.165, 0.064).l(0.165, 0.07).l(0.072, 0.118).l(0.072, 0.104).z(); }, vertical(k, p.py(0.118), p.py(0.064), T.luz, T.sol, T.medio));
      relleno(k, function () { p.m(0.072, 0.07).l(0.165, 0.07).l(0.165, 0.064).l(0.072, 0.104).z(); }, css(T.medio));
      for (i = 0; i < 3; i++) { var ax = 0.088 + i * 0.026, ah = 0.086 - i * 0.012 - 0.064; relleno(k, function () { p.m(ax - 0.008, 0.07).l(ax - 0.008, 0.07 + ah * 0.55).q(ax, 0.07 + ah * 0.95, ax + 0.008, 0.07 + ah * 0.55).l(ax + 0.008, 0.07).z(); }, css(mez(T.sombra, OSCURIDAD, 0.45))); }
      // el primer cuerpo, cuadrado
      cuerpoTorre(k, p, s, 0.07, 0.345, 0.072, 0.062, 0.02, 0.016, T);
      var vs = []; for (var fila = 0; fila < 8; fila++) { var vy = 0.1 + fila * 0.03; vs.push(-0.032, vy, 0, vy + 0.012, 0.032, vy); }
      ventanas(k, p, s, vs, 0.006, 0.011, T);
      var vl = new Lote(); for (fila = 0; fila < 7; fila++) vl.rect(p.px(0.079), p.py(0.12 + fila * 0.03 + 0.01), 0.003 * s, 0.01 * s);
      vl.pintar(k, css(OSCURIDAD, 0.8));
      // la puerta, al final de la rampa
      relleno(k, function () { p.m(0.05, 0.104).l(0.068, 0.104).l(0.068, 0.128).q(0.059, 0.136, 0.05, 0.128).z(); }, css(OSCURIDAD));
      cornisaFaro(k, p, s, -0.064, 0.078, 0.345, 0.01, T);
      // los tritones de las esquinas
      triton(k, p, s, -0.056, 0.355, 0.03, -1); triton(k, p, s, 0.07, 0.355, 0.03, 1);
      // el segundo cuerpo, octogonal: tres caras a la vista (la de la izquierda, más clara; la de la derecha, en sombra)
      relleno(k, function () { p.m(-0.04, 0.355).l(-0.024, 0.355).l(-0.021, 0.485).l(-0.035, 0.485).z(); }, ES.lin(k, p.px(-0.04), 0, p.px(-0.024), 0, [[0, T.sol], [1, T.luz]]));
      relleno(k, function () { p.m(-0.024, 0.355).l(0.024, 0.355).l(0.021, 0.485).l(-0.021, 0.485).z(); }, ES.lin(k, p.px(-0.024), p.py(0.485), p.px(0.024), p.py(0.355), [[0, T.luz], [0.6, T.sol], [1, T.medio]]));
      relleno(k, function () { p.m(0.024, 0.355).l(0.04, 0.355).l(0.035, 0.485).l(0.021, 0.485).z(); }, ES.lin(k, p.px(0.024), 0, p.px(0.04), 0, [[0, T.sombra], [1, T.sombra2]]));
      var ho = new Lote(); for (var yy2 = 0.363; yy2 < 0.483; yy2 += 0.0082) ho.rect(p.px(-0.04), p.py(yy2), 0.08 * s, Math.max(0.6, 0.0007 * s));
      ho.pintar(k, css(OSCURO, 0.08));
      // las aristas del octógono: un filo de luz donde se doblan las caras y una sombra en la de la derecha
      k.beginPath(); p.m(-0.024, 0.355).l(-0.021, 0.485); k.lineWidth = Math.max(1, 0.0016 * s); k.strokeStyle = css(BLANCO, 0.6); k.stroke();
      k.beginPath(); p.m(0.024, 0.355).l(0.021, 0.485); k.lineWidth = Math.max(1, 0.0014 * s); k.strokeStyle = css(OSCURO, 0.2); k.stroke();
      k.fillStyle = ES.lin(k, p.px(-0.04), 0, p.px(-0.03), 0, [[0, OSCURO, 0.1], [1, OSCURO, 0]]); k.fillRect(p.px(-0.04), p.py(0.485), 0.01 * s, 0.13 * s);
      ventanas(k, p, s, [0, 0.38, 0, 0.42, 0, 0.455, -0.031, 0.4, -0.03, 0.44], 0.005, 0.01, T);
      cornisaFaro(k, p, s, -0.036, 0.036, 0.485, 0.008, T);
      // el tercer cuerpo, cilíndrico, y la linterna de columnas, vacía y oscura
      relleno(k, function () { p.m(-0.026, 0.493).l(0.026, 0.493).l(0.026, 0.516).l(-0.026, 0.516).z(); }, horizontal(k, p.px(-0.026), p.px(0.026), T.sol, T.luz, T.sombra));
      relleno(k, function () { p.m(-0.026, 0.516).l(0.026, 0.516).l(0.026, 0.555).l(-0.026, 0.555).z(); }, ES.lin(k, 0, p.py(0.555), 0, p.py(0.516), [[0, OSCURIDAD], [1, mez(OSCURIDAD, T.sombra2, 0.25)]]));
      var cols = [-0.024, -0.009, 0.006, 0.021];
      for (i = 0; i < cols.length; i++) { var cxv = cols[i]; relleno(k, function () { p.m(cxv - 0.0018, 0.516).l(cxv + 0.0018, 0.516).l(cxv + 0.0018, 0.555).l(cxv - 0.0018, 0.555).z(); }, horizontal(k, p.px(cxv - 0.0018), p.px(cxv + 0.0018), T.luz, T.sol, T.sombra)); }
      relleno(k, function () { p.m(-0.03, 0.555).l(0.03, 0.555).l(0.03, 0.56).l(-0.03, 0.56).z(); }, vertical(k, p.py(0.56), p.py(0.555), T.luz, T.sol, T.medio));
      // la cúpula
      relleno(k, function () { p.m(-0.027, 0.56).q(-0.026, 0.574, 0, 0.577).q(0.026, 0.574, 0.027, 0.56).z(); }, ES.lin(k, p.px(-0.027), p.py(0.577), p.px(0.027), p.py(0.56), [[0, T.luz], [0.55, T.sol], [1, T.sombra]]));
      zeus(k, p, s, 0, 0.576, 0.044);
      arena(k, x - 0.15 * s, x + 0.15 * s, y - 0.07 * s, 0.004 * s, 23, { ondas: 8 });
    }
  };
  A.faro.fuego = { dx: 0, dy: -0.5355 };


  /* ------------------------------------------------------------------ el obelisco
     De granito rosa de Asuán, con la punta (el piramidión) forrada de oro, sobre su pedestal. En la columna de la cara, una
     titulatura de verdad de Tutmosis III, el de los obeliscos que acabaron en Alejandría (las «Agujas de Cleopatra»):
     nṯr nfr nb tꜣwj nswt-bjtj (Mn-ḫpr-Rꜥ) dj ꜥnḫ, «el dios bueno, señor de las Dos Tierras, rey del Alto y del Bajo
     Egipto, Menjeperra, dotado de vida». op.alto: el alto total en u (0,4 si no se da). */
  var OBEL = { luz: mez(mez(P.rojo, P.piedra, 0.58), P.lino, 0.18), sol: mez(P.rojo, P.piedra, 0.52), medio: mez(P.rojo, P.piedra2, 0.46), sombra: mez(mez(P.rojo, P.piedra2, 0.42), P.negro2, 0.2), honda: mez(mez(P.rojo, P.piedra2, 0.4), P.negro2, 0.42) };
  // las filas de la columna de texto (de arriba abajo): dos signos en una fila van uno al lado del otro; 'cartucho' abre y cierra
  var TITULO = [['𓊹', '𓄤'], ['𓎟'], ['𓇿'], ['𓇿'], ['𓇓', '𓆤'], ['𓏏', '𓏏'], 'cartucho', ['𓇳'], ['𓏠'], ['𓆣'], 'cartucho', ['𓂞'], ['𓋹']];
  var PLANOS_OB = { '𓎟': 1, '𓇿': 1, '𓏏': 1, '𓂞': 1 };
  function cajaObelisco(op) { var H = (op && op.alto) || 0.4; return { ancho: 0.25 * H, alto: H, abajo: 0 }; }
  A.obelisco = {
    ancho: 0.1, alto: 0.4, abajo: 0, letra: true, caja: cajaObelisco,
    dibujar: function (k, x, y, s, op) {
      op = op || {};
      var H = op.alto || 0.4, p = pluma(k, x, y, s), r = U.azar(op.semilla || 1), i;
      var hp = 0.07 * H, b = 0.094 * H, bt = b * 0.68, lado = 0.3, hpy = b * 0.95, ys = hp + 0.004 * H, yt = H - hpy;
      // el pedestal: una losa ancha y el dado, de caliza
      var wp = 0.19 * H, wl = 0.03 * H;
      relleno(k, function () { p.m(-wp / 2 - 0.004 * H, 0).l(wp / 2 + 0.004 * H, 0).l(wp / 2 + 0.004 * H, hp * 0.3).l(-wp / 2 - 0.004 * H, hp * 0.3).z(); }, vertical(k, p.py(hp * 0.3), p.py(0), CAL.luz, CAL.sol, CAL.sombra));
      relleno(k, function () { p.m(-wp / 2 + 0.004 * H, hp * 0.3).l(wp / 2 - 0.006 * H, hp * 0.3).l(wp / 2 - 0.006 * H, hp).l(-wp / 2 + 0.004 * H, hp).z(); }, ES.lin(k, p.px(-wp / 2), p.py(hp), p.px(wp / 2), p.py(hp * 0.3), [[0, CAL.luz], [0.6, CAL.sol], [1, CAL.medio]]));
      relleno(k, function () { p.m(wp / 2 - 0.006 * H, hp * 0.3).l(wp / 2 - 0.006 * H + wl, hp * 0.34).l(wp / 2 - 0.006 * H + wl, hp * 0.96).l(wp / 2 - 0.006 * H, hp).z(); }, css(CAL.sombra));
      relleno(k, function () { p.m(-wp / 2 + 0.002 * H, hp).l(wp / 2 - 0.004 * H, hp).l(wp / 2 - 0.004 * H, ys).l(-wp / 2 + 0.002 * H, ys).z(); }, vertical(k, p.py(ys), p.py(hp), CAL.luz, CAL.sol, CAL.medio));
      // el fuste: la cara de delante al sol y la del lado en sombra, más estrecha; las dos se afinan hacia arriba
      var cara = function () { p.m(-b / 2, ys).l(b / 2, ys).l(bt / 2, yt).l(-bt / 2, yt).z(); };
      var ladoF = function () { p.m(b / 2, ys).l(b / 2 + b * lado, ys + 0.002 * H).l(bt / 2 + bt * lado, yt - 0.001 * H).l(bt / 2, yt).z(); };
      relleno(k, cara, ES.lin(k, p.px(-b / 2), p.py(yt), p.px(b / 2), p.py(ys), [[0, OBEL.luz], [0.45, OBEL.sol], [1, OBEL.medio]]));
      relleno(k, ladoF, ES.lin(k, p.px(b / 2), p.py(yt), p.px(b / 2 + b * lado), p.py(ys), [[0, OBEL.sombra], [1, OBEL.honda]]));
      // el grano del granito
      var mo = new Lote(), mc = new Lote(), n = Math.round(H * 900);
      for (i = 0; i < n; i++) {
        var fy = ys + r() * (yt - ys), f = (fy - ys) / (yt - ys), wf = b + (bt - b) * f, fx = -wf / 2 + r() * wf * (1 + lado), d = (0.0007 + r() * 0.0009) * s;
        (r() < 0.55 ? mo : mc).rect(p.px(fx), p.py(fy), d, d);
      }
      mo.pintar(k, css(OSCURO, 0.2)); mc.pintar(k, css(BLANCO, 0.18));
      // el filo de luz de la arista y el brillo de la cara
      k.beginPath(); p.m(b / 2, ys).l(bt / 2, yt); k.lineWidth = Math.max(0.8, 0.0012 * s); k.strokeStyle = css(BLANCO, 0.35); k.stroke();
      ES.brillo(k, cara, p.px(-b / 2), 0, p.px(b * 0.1), 0, 0.16, [255, 240, 225]);
      // la columna de jeroglíficos, tallada (si la cara es tan estrecha que los signos serían ruido, solo su huella)
      if (b * s < 16) {
        k.fillStyle = css(OBEL.honda, 0.35); k.fillRect(p.px(-b * 0.08), p.py(yt - b * 0.3), b * 0.16 * s, (yt - b * 0.3 - ys - (yt - ys) * 0.06) * s);
        relleno(k, function () { p.m(-bt / 2, yt).l(bt / 2, yt).l(bt * 0.12, H).z(); }, ES.oro(k, p.px(-bt / 2), p.py(H), p.px(bt / 2), p.py(yt), 0.35));
        relleno(k, function () { p.m(bt / 2, yt).l(bt / 2 + bt * lado, yt - 0.001 * H).l(bt * 0.12, H).z(); }, ES.lin(k, p.px(bt / 2), p.py(H), p.px(bt / 2 + bt * lado), p.py(yt), [[0, P.oro3], [1, P.oro4]]));
        return;
      }
      // las filas se reparten por todo el fuste; los signos, tan grandes como deja el ancho de la cara
      var yA = yt - b * 0.3, yB = ys + (yt - ys) * 0.06, peso = 0;
      for (i = 0; i < TITULO.length; i++) peso += TITULO[i] === 'cartucho' ? 0.25 : (PLANOS_OB[TITULO[i][0]] ? 0.62 : 1);
      var paso = (yA - yB) / peso, tam = Math.min(b * 0.66 * 0.62, paso * 0.92), col = OBEL.honda;
      k.textAlign = 'center'; k.textBaseline = 'middle';
      var yy = yA - paso * 0.5, cartIni = null;
      for (i = 0; i < TITULO.length; i++) {
        var fila = TITULO[i];
        if (fila === 'cartucho') {
          if (cartIni == null) { cartIni = yy + paso * 0.5; yy -= paso * 0.25; }
          else {
            var c0 = cartIni, c1 = yy + paso * 0.45, rw = tam * 0.62, rh = (c0 - c1) / 2, ccy = (c0 + c1) / 2;
            k.beginPath(); k.ellipse(p.px(0), p.py(ccy), rw * s, rh * s, 0, 0, TAU); k.lineWidth = Math.max(0.8, tam * 0.07 * s); k.strokeStyle = css(col, 0.8); k.stroke();
            k.beginPath(); p.m(-rw * 0.7, c1 - tam * 0.06).l(rw * 0.7, c1 - tam * 0.06); k.stroke();
            cartIni = null; yy -= paso * 0.25;
          }
          continue;
        }
        var t2 = fila.length === 2 ? tam * 0.62 : (PLANOS_OB[fila[0]] ? tam * 0.85 : tam), alto2 = PLANOS_OB[fila[0]] ? paso * 0.62 : paso;
        if (fila.length === 2) { ES.signo(k, fila[0], p.px(-tam * 0.27), p.py(yy - alto2 * 0.05), t2, 0.85, col); ES.signo(k, fila[1], p.px(tam * 0.27), p.py(yy - alto2 * 0.05), t2, 0.85, col); }
        else ES.signo(k, fila[0], p.px(0), p.py(yy), t2, 0.85, col);
        yy -= alto2;
      }
      k.textBaseline = 'alphabetic';
      // el piramidión de oro: la cara al sol y la del lado en sombra
      relleno(k, function () { p.m(-bt / 2, yt).l(bt / 2, yt).l(bt * 0.12, H).z(); }, ES.oro(k, p.px(-bt / 2), p.py(H), p.px(bt / 2), p.py(yt), 0.35));
      relleno(k, function () { p.m(bt / 2, yt).l(bt / 2 + bt * lado, yt - 0.001 * H).l(bt * 0.12, H).z(); }, ES.lin(k, p.px(bt / 2), p.py(H), p.px(bt / 2 + bt * lado), p.py(yt), [[0, P.oro3], [1, P.oro4]]));
      ES.brillo(k, function () { p.m(-bt / 2, yt).l(bt / 2, yt).l(bt * 0.12, H).z(); }, p.px(-bt / 2), p.py(H), p.px(bt * 0.2), p.py(yt), 0.4, [255, 252, 220]);
    }
  };


  /* ------------------------------------------------------------------ la aldea
     Casas de adobe de tejado plano: las vigas son troncos de palmera que asoman por la fachada, en el tejado se amontonan
     hojas de palma secas y leña, las puertas y ventanas van pintadas de azul y algunas fachadas encaladas. En medio, el
     palomar de barro en forma de cono, con sus filas de cántaros para las palomas y los palos donde se posan. */
  var PALMA = { tronco: mez(P.oro4, P.tinta, 0.35), tronco2: mez(P.oro3, P.oro4, 0.5), hoja: mez(P.verde, P.oro3, 0.25), hoja2: oscurecer(mez(P.verde, P.oro3, 0.3), 0.25), seca: mez(P.arena2, P.oro3, 0.5) };
  // una casa: cara de delante (al sol) y lado derecho (en sombra), tejado plano con pretil, vigas que asoman y lo de encima
  function casa(k, p, s, X0, X1, alto, lado, op) {
    var T = op.encalada ? ENLUCIDO : ADOBE, i;
    relleno(k, function () { p.m(X0, 0).l(X1, 0).l(X1, alto).l(X0, alto).z(); }, ES.lin(k, p.px(X0), p.py(alto), p.px(X1), p.py(0), [[0, aclarar(T.sol, 0.08)], [0.6, T.sol], [1, T.medio]]));
    relleno(k, function () { p.m(X1, 0).l(X1 + lado, 0.003).l(X1 + lado, alto + 0.002).l(X1, alto).z(); }, ES.lin(k, p.px(X1), 0, p.px(X1 + lado), 0, [[0, T.sombra], [1, T.honda || T.sombra2]]));
    // el adobe: hiladas de ladrillo apenas marcadas y manchas donde se ha caído el revoco
    var r = U.azar(op.semilla || 3), hl = new Lote(), mn = new Lote();
    for (var yy = 0.006; yy < alto - 0.002; yy += 0.0055) hl.rect(p.px(X0), p.py(yy), (X1 - X0 + lado) * s, Math.max(0.5, 0.0006 * s));
    for (i = 0; i < 5; i++) { var mx = X0 + r() * (X1 - X0) * 0.82, mh = 0.006 + r() * 0.01, my = mh + alto * (0.06 + r() * 0.6), mw = 0.008 + r() * 0.016; mn.rect(p.px(mx), p.py(my), mw * s, mh * s); }
    hl.pintar(k, css(OSCURO, op.encalada ? 0.04 : 0.09)); mn.pintar(k, css(op.encalada ? ADOBE.medio : OSCURO, op.encalada ? 0.5 : 0.07));
    // el pretil del tejado
    relleno(k, function () { p.m(X0 - 0.002, alto).l(X1 + lado, alto).l(X1 + lado, alto + 0.006).l(X0 - 0.002, alto + 0.006).z(); }, vertical(k, p.py(alto + 0.006), p.py(alto), aclarar(T.sol, 0.15), T.sol, T.medio));
    // las cabezas de las vigas de palmera, en fila bajo el tejado, con su sombra
    var vg = new Lote(), vs = new Lote();
    for (var xv = X0 + 0.006; xv < X1 - 0.003; xv += 0.0105) { vg.rect(p.px(xv), p.py(alto - 0.0045), 0.0042 * s, 0.0042 * s); vs.rect(p.px(xv + 0.0042), p.py(alto - 0.0045), 0.0022 * s, 0.006 * s); }
    vs.pintar(k, css(OSCURO, 0.18)); vg.pintar(k, ES.lin(k, 0, p.py(alto), 0, p.py(alto - 0.005), [[0, PALMA.tronco2], [1, PALMA.tronco]]));
    // la puerta (azul) y las ventanas pequeñas con su marco azul
    if (op.puerta != null) {
      var dx = op.puerta;
      relleno(k, function () { p.m(dx - 0.008, 0).l(dx + 0.008, 0).l(dx + 0.008, 0.028).l(dx - 0.008, 0.028).z(); }, css(mez(T.medio, P.lino, 0.4)));
      relleno(k, function () { p.m(dx - 0.006, 0).l(dx + 0.006, 0).l(dx + 0.006, 0.025).l(dx - 0.006, 0.025).z(); }, ES.lin(k, p.px(dx - 0.006), p.py(0.025), p.px(dx + 0.006), p.py(0), [[0, aclarar(P.egipcio, 0.15)], [0.6, P.egipcio], [1, P.lapis]]));
      k.fillStyle = css(OSCURO, 0.25); k.fillRect(p.px(dx - 0.0004), p.py(0.025), Math.max(0.6, 0.0008 * s), 0.025 * s);
    }
    var vt = op.ventanas || [];
    for (i = 0; i < vt.length; i += 2) {
      var vx = vt[i], vy = vt[i + 1];
      relleno(k, function () { p.m(vx - 0.0055, vy).l(vx + 0.0055, vy).l(vx + 0.0055, vy + 0.0095).l(vx - 0.0055, vy + 0.0095).z(); }, css(P.egipcio));
      relleno(k, function () { p.m(vx - 0.0038, vy + 0.0015).l(vx + 0.0038, vy + 0.0015).l(vx + 0.0038, vy + 0.008).l(vx - 0.0038, vy + 0.008).z(); }, css(OSCURIDAD));
    }
    // encima del tejado: hojas de palma secas y leña amontonadas
    if (op.monton) {
      var ma = op.monton[0], mb = op.monton[1];
      relleno(k, function () { p.m(ma, alto + 0.006).q(ma + 0.004, alto + 0.016, (ma + mb) / 2, alto + 0.017).q(mb - 0.003, alto + 0.014, mb, alto + 0.006).z(); }, ES.lin(k, 0, p.py(alto + 0.017), 0, p.py(alto + 0.006), [[0, aclarar(PALMA.seca, 0.2)], [1, PALMA.tronco2]]));
      k.beginPath(); for (i = 0; i < 6; i++) { var hx = ma + (mb - ma) * (0.1 + i * 0.15); p.m(hx, alto + 0.008).l(hx + 0.012, alto + 0.014 + (i % 2) * 0.003); }
      k.lineWidth = Math.max(0.6, 0.0009 * s); k.strokeStyle = css(PALMA.tronco, 0.5); k.stroke();
    }
    // la sombra al pie
    k.fillStyle = ES.lin(k, 0, p.py(0.012), 0, p.py(0), [[0, OSCURO, 0], [1, OSCURO, 0.12]]); k.fillRect(p.px(X0), p.py(0.012), (X1 - X0 + lado) * s, 0.012 * s);
  }
  // el palomar: una torre de barro en cono, con filas de cántaros (las bocas, oscuras), palos para posarse, bandas
  // encaladas y el remate almenado
  function palomar(k, p, s, cx, alto) {
    var w0 = 0.042, w1 = 0.018, i, T = ADOBE;
    var forma = function () { p.m(cx - w0, 0).c(cx - w0 * 1.02, alto * 0.4, cx - w1 * 1.6, alto * 0.8, cx - w1, alto * 0.94).l(cx + w1, alto * 0.94).c(cx + w1 * 1.6, alto * 0.8, cx + w0 * 1.02, alto * 0.4, cx + w0, 0).z(); };
    relleno(k, forma, ES.lin(k, p.px(cx - w0), 0, p.px(cx + w0), 0, [[0, T.sol], [0.3, aclarar(T.sol, 0.1)], [0.65, T.medio], [1, T.sombra]]));
    // el ancho a una altura dada (por dentro)
    function ancho(Y) { var t = Y / (alto * 0.94); return (w0 + (w1 - w0) * Math.pow(t, 1.4)) * 0.92; }
    // las bandas encaladas y las filas de bocas de cántaro
    var bandas = new Lote(), bocas = new Lote(), labios = new Lote(), palos = new Lote();
    for (i = 0; i < 4; i++) { var by = alto * (0.22 + i * 0.2), bw = ancho(by); bandas.rect(p.px(cx - bw), p.py(by + 0.004), bw * 2 * s, 0.004 * s); }
    for (var f = 0; f < 9; f++) {
      var fy = alto * (0.12 + f * 0.088), fw = ancho(fy), nb = Math.max(2, Math.floor(fw * 2 / 0.0085));
      for (i = 0; i < nb; i++) { var bx = cx - fw + (i + 0.5) * fw * 2 / nb; bocas.rect(p.px(bx - 0.0016), p.py(fy + 0.0032), 0.0032 * s, 0.0032 * s); labios.rect(p.px(bx - 0.002), p.py(fy), 0.004 * s, Math.max(0.6, 0.0008 * s)); }
      if (f % 2) { palos.rect(p.px(cx - fw - 0.006), p.py(fy - 0.001), (fw * 2 + 0.012) * s, Math.max(0.7, 0.0011 * s)); }
    }
    bandas.pintar(k, css(P.lino, 0.75)); bocas.pintar(k, css(OSCURIDAD, 0.85)); labios.pintar(k, css(aclarar(T.sol, 0.3), 0.8));
    palos.pintar(k, css(PALMA.tronco));
    // el remate: almenas encaladas
    var al = new Lote(); for (i = -2; i <= 2; i++) al.rect(p.px(cx + i * 0.0072 - 0.0025), p.py(alto), 0.005 * s, (alto * 0.06) * s);
    relleno(k, function () { p.m(cx - w1 * 1.05, alto * 0.94).l(cx + w1 * 1.05, alto * 0.94).l(cx + w1 * 1.05, alto * 0.955).l(cx - w1 * 1.05, alto * 0.955).z(); }, css(P.lino));
    al.pintar(k, ES.lin(k, 0, p.py(alto), 0, p.py(alto * 0.94), [[0, P.lino], [1, P.lino2]]));
    // dos palomas posadas
    for (i = 0; i < 2; i++) { var px2 = cx + (i ? 0.024 : -0.026), py2 = alto * (0.12 + (i ? 5 : 3) * 0.088) + 0.0005; relleno(k, function () { p.m(px2 - 0.004, py2).q(px2 - 0.003, py2 + 0.005, px2 + 0.001, py2 + 0.005).l(px2 + 0.004, py2 + 0.0065).l(px2 + 0.0035, py2 + 0.004).q(px2 + 0.002, py2, px2 - 0.004, py2).z(); }, ES.lin(k, 0, p.py(py2 + 0.006), 0, p.py(py2), [[0, P.lino], [1, P.lino2]])); }
  }
  // una palmera datilera: tronco anillado algo curvo y la copa de hojas
  function palmera(k, p, s, cx, alto, semilla) {
    var r = U.azar(semilla), i, curva = 0.012;
    relleno(k, function () { p.m(cx - 0.0045, 0).q(cx - 0.002 + curva, alto * 0.5, cx + curva - 0.0022, alto * 0.86).l(cx + curva + 0.0022, alto * 0.86).q(cx + 0.002 + curva, alto * 0.5, cx + 0.0045, 0).z(); }, horizontal(k, p.px(cx - 0.004), p.px(cx + 0.006), PALMA.tronco2, PALMA.tronco, oscurecer(PALMA.tronco, 0.3)));
    var an = new Lote(); for (var yy = 0.01; yy < alto * 0.84; yy += 0.005) { var t = yy / (alto * 0.86), xx = cx + curva * t * t; an.rect(p.px(xx - 0.0038), p.py(yy), 0.0076 * s, Math.max(0.6, 0.0009 * s)); }
    an.pintar(k, css(OSCURO, 0.24));
    var tx = cx + curva, ty = alto * 0.87, hojas = [];
    // las hojas: arcos que salen de la copa y caen, con sus foliolos; las de atrás, más oscuras
    for (i = 0; i < 13; i++) {
      var a = Math.PI * (0.06 + 0.88 * i / 12) + (r() - 0.5) * 0.12, L = 0.04 + r() * 0.016, dx = Math.cos(a), cae = 0.4 + Math.abs(dx) * 0.9;
      hojas.push([tx + dx * L, ty + Math.sin(a) * L * 0.45 - L * cae * 0.55, tx + dx * L * 0.5, ty + Math.sin(a) * L * 0.6 + 0.004, i % 2]);
    }
    for (var capa = 1; capa >= 0; capa--) for (i = 0; i < hojas.length; i++) {
      var h = hojas[i]; if (h[4] !== capa) continue;
      var col = capa ? PALMA.hoja2 : PALMA.hoja;
      k.beginPath(); p.m(tx, ty).q(h[2], h[3], h[0], h[1]); k.lineWidth = 0.0016 * s; k.strokeStyle = css(oscurecer(col, 0.15)); k.stroke();
      // los foliolos: trazos cortos a los dos lados del nervio
      k.beginPath();
      for (var f = 1; f < 8; f++) {
        var u = f / 8, bx = (1 - u) * (1 - u) * tx + 2 * (1 - u) * u * h[2] + u * u * h[0], by = (1 - u) * (1 - u) * ty + 2 * (1 - u) * u * h[3] + u * u * h[1], lf = 0.011 * (1 - u * 0.6);
        p.m(bx, by).l(bx + (h[0] > tx ? 0.004 : -0.004) * (1 - u), by - lf).m(bx, by).l(bx + (h[0] > tx ? 0.006 : -0.006), by - lf * 0.4);
      }
      k.lineWidth = 0.0022 * s; k.strokeStyle = css(col); k.lineCap = 'round'; k.stroke();
    }
    // los racimos de dátiles bajo la copa
    k.beginPath(); for (i = 0; i < 7; i++) { var dx2 = tx - 0.005 + (i % 4) * 0.003, dy2 = ty - 0.006 - Math.floor(i / 4) * 0.003; k.moveTo(p.px(dx2) + 0.0017 * s, p.py(dy2)); k.arc(p.px(dx2), p.py(dy2), 0.0017 * s, 0, TAU); }
    k.fillStyle = ES.lin(k, 0, p.py(ty - 0.004), 0, p.py(ty - 0.011), [[0, P.oro2], [1, P.oro3]]); k.fill();
  }

  A.aldea = {
    ancho: 0.6, alto: 0.16, abajo: 0,
    dibujar: function (k, x, y, s, op) {
      var p = pluma(k, x, y, s);
      palmera(k, p, s, 0.065, 0.158, 5);
      casa(k, p, s, -0.29, -0.175, 0.1, 0.014, { semilla: 3, puerta: -0.25, ventanas: [-0.212, 0.04, -0.27, 0.07, -0.212, 0.07], monton: [-0.28, -0.22] });
      palomar(k, p, s, -0.118, 0.158);
      casa(k, p, s, -0.07, 0.04, 0.062, 0.013, { semilla: 4, encalada: true, puerta: -0.03, ventanas: [0.012, 0.034] });
      // la casa de dos plantas con la escalera de fuera
      casa(k, p, s, 0.075, 0.185, 0.095, 0.014, { semilla: 6, puerta: 0.15, ventanas: [0.1, 0.04, 0.1, 0.07, 0.16, 0.07], monton: [0.14, 0.18] });
      relleno(k, function () { p.m(0.043, 0).l(0.075, 0.062).l(0.075, 0.0).z(); }, ES.lin(k, p.px(0.043), p.py(0.06), p.px(0.075), p.py(0), [[0, ADOBE.sol], [1, ADOBE.medio]]));
      var esc = new Lote(); for (var e = 1; e < 9; e++) { var t = e / 9; esc.rect(p.px(0.043 + 0.032 * t), p.py(0.062 * t), (0.032 * (1 - t)) * s, Math.max(0.7, 0.0012 * s)); }
      esc.pintar(k, css(OSCURO, 0.16));
      casa(k, p, s, 0.215, 0.29, 0.052, 0.01, { semilla: 7, puerta: 0.255, ventanas: [0.232, 0.032] });
      // el sombrajo de hojas de palma delante de la última casa (dos postes y el techo de hojas secas) y la tinaja de barro
      k.lineCap = 'butt'; k.beginPath(); p.m(0.204, 0).l(0.204, 0.038).m(0.243, 0).l(0.243, 0.039); k.lineWidth = 0.0024 * s; k.strokeStyle = css(PALMA.tronco); k.stroke(); k.lineCap = 'round';
      relleno(k, function () { p.m(0.196, 0.036).q(0.24, 0.042, 0.288, 0.047).l(0.29, 0.053).q(0.24, 0.05, 0.197, 0.044).z(); }, ES.lin(k, 0, p.py(0.052), 0, p.py(0.036), [[0, aclarar(PALMA.seca, 0.25)], [1, PALMA.tronco2]]));
      k.beginPath(); for (var hh = 0; hh < 12; hh++) { var hx = 0.198 + hh * 0.0075; p.m(hx, 0.037 + hh * 0.0008).l(hx + 0.006, 0.033 + hh * 0.0008); }
      k.lineWidth = Math.max(0.6, 0.0012 * s); k.strokeStyle = css(PALMA.seca); k.stroke();
      relleno(k, function () { p.m(0.268, 0).q(0.26, 0.012, 0.266, 0.02).l(0.276, 0.02).q(0.282, 0.012, 0.274, 0).z(); }, ES.lin(k, p.px(0.262), 0, p.px(0.28), 0, [[0, aclarar(ADOBE.sol, 0.15)], [0.6, mez(ADOBE.medio, P.rojo, 0.25)], [1, ADOBE.sombra]]));
      arena(k, x - 0.3 * s, x + 0.3 * s, y, 0.006 * s, 31, { ondas: 12 });
    }
  };


  /* ------------------------------------------------------------------ Alejandría
     La ciudad helenística junto al mar: al fondo, el Serapeo en su colina; casas de tejas; una estoa de dos pisos; el
     Cesareo con sus dos obeliscos delante (los de Tutmosis III, las «Agujas de Cleopatra»); la muralla con sus torres y una
     puerta, y a la derecha el puerto, con el muelle y los barcos. Mármol y caliza claros, tejas de barro, los frontones
     pintados (el azul y el rojo de verdad de los templos griegos) y acroteras de oro. */
  function lejano(T, k2) { var o = {}; for (var c in T) o[c] = ES.lejos(T[c], k2); return o; }
  // columnas en lote: n columnas de X0 a X1, del suelo Y0 al capitel Y1, de ancho w (en u): cara al sol y sombra
  function columnata(k, p, s, X0, X1, Y0, Y1, n, w, T) {
    var luz = new Lote(), som = new Lote(), cap = new Lote(), base = new Lote(), i;
    for (i = 0; i < n; i++) {
      var cx = X0 + (X1 - X0) * (n === 1 ? 0.5 : i / (n - 1));
      luz.rect(p.px(cx - w / 2), p.py(Y1), w * 0.62 * s, (Y1 - Y0) * s); som.rect(p.px(cx - w / 2 + w * 0.62), p.py(Y1), w * 0.38 * s, (Y1 - Y0) * s);
      cap.rect(p.px(cx - w * 0.75), p.py(Y1 + w * 0.5), w * 1.5 * s, w * 0.5 * s); base.rect(p.px(cx - w * 0.7), p.py(Y0 + w * 0.35), w * 1.4 * s, w * 0.35 * s);
    }
    luz.pintar(k, ES.lin(k, 0, p.py(Y1), 0, p.py(Y0), [[0, T.luz], [1, T.sol]])); som.pintar(k, ES.lin(k, 0, p.py(Y1), 0, p.py(Y0), [[0, T.medio], [1, T.sombra]]));
    cap.pintar(k, css(T.luz)); base.pintar(k, css(T.sol));
    // las estrías
    var es = new Lote(); for (i = 0; i < n; i++) { var cx2 = X0 + (X1 - X0) * (n === 1 ? 0.5 : i / (n - 1)); es.rect(p.px(cx2 - w * 0.12), p.py(Y1), Math.max(0.5, w * 0.08 * s), (Y1 - Y0) * s); es.rect(p.px(cx2 + w * 0.18), p.py(Y1), Math.max(0.5, w * 0.08 * s), (Y1 - Y0) * s); }
    es.pintar(k, css(OSCURO, 0.1));
  }
  // un templo griego de frente: gradas, columnas, arquitrabe y friso, el frontón pintado con su tejado de tejas y acroteras
  function templo(k, p, s, cx, w, h, n, T, lado, lejos) {
    var X0 = cx - w / 2, X1 = cx + w / 2, hg = h * 0.07, hc = h * 0.58, ha = h * 0.12, hf = h * 0.23, i;
    function f(c) { return lejos ? ES.lejos(c, lejos) : c; }
    var TJ = lejos ? lejano(TEJA, lejos) : TEJA;
    // el lado del templo, en sombra, con su tejado inclinado
    relleno(k, function () { p.m(X1, hg).l(X1 + lado, hg + 0.003).l(X1 + lado, hg + hc + ha).l(X1, hg + hc + ha).z(); }, ES.lin(k, p.px(X1), 0, p.px(X1 + lado), 0, [[0, T.sombra], [1, T.sombra2 || T.honda]]));
    relleno(k, function () { p.m(X1, hg + hc + ha).l(X1 + lado, hg + hc + ha).l(X1 + lado * 0.5, hg + hc + ha + hf * 0.75).l(cx, hg + hc + ha + hf).z(); }, ES.lin(k, 0, p.py(hg + hc + ha + hf), 0, p.py(hg + hc + ha), [[0, TJ.medio], [1, TJ.sombra]]));
    // las gradas
    for (i = 0; i < 3; i++) { var gi = i; relleno(k, function () { p.m(X0 - 0.006 + gi * 0.002, gi * hg / 3).l(X1 + 0.006 - gi * 0.002, gi * hg / 3).l(X1 + 0.006 - gi * 0.002, (gi + 1) * hg / 3).l(X0 - 0.006 + gi * 0.002, (gi + 1) * hg / 3).z(); }, vertical(k, p.py((gi + 1) * hg / 3), p.py(gi * hg / 3), T.luz, T.sol, T.medio)); }
    // el fondo (la cella, en sombra) y las columnas
    relleno(k, function () { p.m(X0 + 0.004, hg).l(X1 - 0.004, hg).l(X1 - 0.004, hg + hc).l(X0 + 0.004, hg + hc).z(); }, ES.lin(k, 0, p.py(hg + hc), 0, p.py(hg), [[0, mez(T.sombra2 || T.sombra, f(OSCURIDAD), 0.35)], [1, T.sombra]]));
    columnata(k, p, s, X0 + w * 0.06, X1 - w * 0.06, hg, hg + hc, n, w * 0.055, T);
    // el arquitrabe y el friso (con sus triglifos)
    relleno(k, function () { p.m(X0, hg + hc).l(X1, hg + hc).l(X1, hg + hc + ha).l(X0, hg + hc + ha).z(); }, vertical(k, p.py(hg + hc + ha), p.py(hg + hc), T.luz, T.sol, T.medio));
    var tg = new Lote(); for (var xx = X0 + 0.004; xx < X1 - 0.004; xx += w / (n * 2)) tg.rect(p.px(xx), p.py(hg + hc + ha * 0.92), w * 0.022 * s, ha * 0.45 * s);
    tg.pintar(k, css(f(mez(P.lapis2, OSCURIDAD, 0.3)), 0.7));
    // el frontón: el tímpano azul, el marco de mármol, el tejado de tejas y las acroteras de oro
    var yb = hg + hc + ha;
    relleno(k, function () { p.m(X0 - 0.004, yb).l(X1 + 0.004, yb).l(cx, yb + hf).z(); }, vertical(k, p.py(yb + hf), p.py(yb), T.luz, T.sol, T.medio));
    relleno(k, function () { p.m(X0 + w * 0.06, yb + hf * 0.1).l(X1 - w * 0.06, yb + hf * 0.1).l(cx, yb + hf * 0.82).z(); }, ES.lin(k, 0, p.py(yb + hf), 0, p.py(yb), [[0, f(mez(P.egipcio, P.lino, 0.12))], [1, f(P.lapis)]]));
    // un relieve dorado en el tímpano (un escudo con su guirnalda)
    k.beginPath(); k.arc(p.px(cx), p.py(yb + hf * 0.36), hf * 0.17 * s, 0, TAU); k.fillStyle = ES.oro(k, p.px(cx - hf * 0.17), p.py(yb + hf * 0.53), p.px(cx + hf * 0.17), p.py(yb + hf * 0.19), 0.35); k.fill();
    k.beginPath(); p.m(cx - w * 0.28, yb + hf * 0.2).q(cx - w * 0.15, yb + hf * 0.05, cx - hf * 0.17, yb + hf * 0.33).m(cx + hf * 0.17, yb + hf * 0.33).q(cx + w * 0.15, yb + hf * 0.05, cx + w * 0.28, yb + hf * 0.2);
    k.lineWidth = Math.max(0.8, hf * 0.06 * s); k.strokeStyle = css(f(P.rojo), 0.85); k.stroke();
    relleno(k, function () { p.m(X0 - 0.007, yb - 0.002).l(cx, yb + hf + 0.004).l(X1 + 0.007, yb - 0.002).l(X1 + 0.004, yb + 0.002).l(cx, yb + hf - 0.002).l(X0 - 0.004, yb + 0.002).z(); }, ES.lin(k, 0, p.py(yb + hf), 0, p.py(yb), [[0, TJ.sol], [1, TJ.medio]]));
    for (i = -1; i <= 1; i++) { var ax = i === 0 ? cx : (i < 0 ? X0 - 0.004 : X1 + 0.004), ay = i === 0 ? yb + hf + 0.003 : yb; relleno(k, function () { p.m(ax - 0.004, ay).q(ax, ay + 0.012, ax + 0.004, ay).z(); }, ES.oro(k, p.px(ax - 0.004), p.py(ay + 0.012), p.px(ax + 0.004), p.py(ay), 0.35)); }
  }
  // casas helenísticas: cajas encaladas con su tejado de tejas a dos aguas, ventanitas
  function casasGriegas(k, p, s, lista, T) {
    for (var i = 0; i < lista.length; i += 3) {
      var X0 = lista[i], X1 = lista[i + 1], h = lista[i + 2], c = (X0 + X1) / 2, lado = 0.009;
      relleno(k, function () { p.m(X0, 0).l(X1, 0).l(X1, h).l(X0, h).z(); }, ES.lin(k, p.px(X0), p.py(h), p.px(X1), 0, [[0, T.luz], [0.6, T.sol], [1, T.medio]]));
      relleno(k, function () { p.m(X1, 0).l(X1 + lado, 0.003).l(X1 + lado, h).l(X1, h).z(); }, css(T.sombra));
      relleno(k, function () { p.m(X0 - 0.003, h).l(X1 + lado + 0.002, h).l(c + lado * 0.5, h + (X1 - X0) * 0.22).z(); }, ES.lin(k, 0, p.py(h + (X1 - X0) * 0.22), 0, p.py(h), [[0, TEJA.sol], [0.6, TEJA.medio], [1, TEJA.sombra]]));
      var tj = new Lote(); for (var xx = X0; xx < X1 + lado; xx += 0.004) tj.rect(p.px(xx), p.py(h + 0.002), Math.max(0.5, 0.0007 * s), 0.002 * s);
      tj.pintar(k, css(OSCURO, 0.18));
      var v = new Lote(); for (var vx = X0 + 0.008; vx < X1 - 0.006; vx += 0.014) v.rect(p.px(vx), p.py(h * 0.75), 0.004 * s, 0.006 * s);
      v.pintar(k, css(OSCURIDAD, 0.75));
    }
  }
  // la muralla: lienzo almenado con torres cuadradas y una puerta en arco
  function muralla(k, p, s, X0, X1, h, torres, puerta, T) {
    relleno(k, function () { p.m(X0, 0).l(X1, 0).l(X1, h).l(X0, h).z(); }, ES.lin(k, 0, p.py(h), 0, p.py(0), [[0, T.sol], [0.6, T.medio], [1, T.sombra]]));
    var hl = new Lote(), al = new Lote(), i;
    for (var yy = 0.008; yy < h; yy += 0.0075) hl.rect(p.px(X0), p.py(yy), (X1 - X0) * s, Math.max(0.6, 0.0007 * s));
    for (var xx = X0; xx < X1 - 0.004; xx += 0.011) al.rect(p.px(xx), p.py(h + 0.008), 0.0065 * s, 0.008 * s);
    al.pintar(k, ES.lin(k, 0, p.py(h + 0.008), 0, p.py(h), [[0, T.luz], [1, T.sol]])); hl.pintar(k, css(OSCURO, 0.08));
    for (i = 0; i < torres.length; i++) {
      var tx = torres[i], tw = 0.034, th = h + 0.028, ld = 0.01;
      relleno(k, function () { p.m(tx - tw / 2, 0).l(tx + tw / 2, 0).l(tx + tw / 2, th).l(tx - tw / 2, th).z(); }, ES.lin(k, p.px(tx - tw / 2), p.py(th), p.px(tx + tw / 2), p.py(0), [[0, T.luz], [0.6, T.sol], [1, T.medio]]));
      relleno(k, function () { p.m(tx + tw / 2, 0).l(tx + tw / 2 + ld, 0.002).l(tx + tw / 2 + ld, th).l(tx + tw / 2, th).z(); }, css(T.sombra));
      var at = new Lote(); for (var q = 0; q < 3; q++) at.rect(p.px(tx - tw / 2 + q * tw * 0.4), p.py(th + 0.008), tw * 0.22 * s, 0.008 * s);
      at.pintar(k, css(T.luz));
      var sa = new Lote(); sa.rect(p.px(tx - 0.002), p.py(th - 0.012), 0.004 * s, 0.01 * s); sa.rect(p.px(tx - 0.002), p.py(th * 0.45), 0.004 * s, 0.009 * s); sa.pintar(k, css(OSCURIDAD, 0.8));
    }
    if (puerta != null) {
      relleno(k, function () { p.m(puerta - 0.013, 0).l(puerta - 0.013, h * 0.62).q(puerta - 0.013, h * 0.95, puerta, h * 0.95).q(puerta + 0.013, h * 0.95, puerta + 0.013, h * 0.62).l(puerta + 0.013, 0).z(); }, ES.lin(k, 0, p.py(h), 0, p.py(0), [[0, OSCURIDAD], [1, mez(OSCURIDAD, T.sombra, 0.35)]]));
      k.beginPath(); p.m(puerta - 0.016, h * 0.62).q(puerta - 0.016, h * 1.02, puerta, h * 1.02).q(puerta + 0.016, h * 1.02, puerta + 0.016, h * 0.62); k.lineWidth = 0.004 * s; k.strokeStyle = css(T.luz); k.stroke();
    }
  }
  // un barco mercante griego: casco de madera con la popa curva, el mástil y la vela cuadrada con sus franjas
  function barco(k, p, s, cx, w, T, vela) {
    var h = w * 0.22, i;
    var casco = function () { p.m(cx - w * 0.5, h * 0.9).q(cx - w * 0.42, h * 0.1, cx - w * 0.2, 0).l(cx + w * 0.32, 0).q(cx + w * 0.48, h * 0.2, cx + w * 0.52, h * 1.25).q(cx + w * 0.44, h * 0.9, cx + w * 0.38, h * 0.85).l(cx - w * 0.44, h * 0.85).z(); };
    relleno(k, casco, ES.lin(k, 0, p.py(h), 0, p.py(0), [[0, mez(P.oro3, P.piel2, 0.4)], [0.5, P.oro4], [1, oscurecer(P.oro4, 0.35)]]));
    var tb = new Lote(); for (i = 1; i < 4; i++) tb.rect(p.px(cx - w * 0.4), p.py(h * 0.22 * i), w * 0.78 * s, Math.max(0.6, 0.0008 * s)); tb.pintar(k, css(OSCURO, 0.25));
    k.beginPath(); p.m(cx - w * 0.44, h * 0.84).l(cx + w * 0.38, h * 0.84); k.lineWidth = Math.max(1, h * 0.12 * s); k.strokeStyle = css(P.rojo); k.stroke();
    // el ojo de proa
    k.beginPath(); k.arc(p.px(cx + w * 0.4), p.py(h * 0.55), h * 0.09 * s, 0, TAU); k.fillStyle = css(P.lino); k.fill();
    // el mástil, la verga y la vela
    var mx = cx - w * 0.02, mh = w * 1.15;
    k.beginPath(); p.m(mx, h * 0.8).l(mx, mh); k.lineWidth = Math.max(1, w * 0.018 * s); k.strokeStyle = css(P.oro4); k.stroke();
    if (vela) {
      relleno(k, function () { p.m(mx - w * 0.3, mh * 0.94).l(mx + w * 0.3, mh * 0.94).q(mx + w * 0.34, mh * 0.6, mx + w * 0.28, mh * 0.36).l(mx - w * 0.28, mh * 0.36).q(mx - w * 0.22, mh * 0.6, mx - w * 0.3, mh * 0.94).z(); },
        ES.lin(k, p.px(mx - w * 0.3), p.py(mh), p.px(mx + w * 0.3), p.py(mh * 0.36), [[0, P.lino], [0.6, mez(P.lino, P.lino2, 0.5)], [1, P.lino2]]));
      var fr = new Lote(); for (i = 0; i < 5; i++) fr.rect(p.px(mx - w * 0.29 + i * w * 0.13), p.py(mh * 0.93), w * 0.025 * s, mh * 0.56 * s);
      fr.pintar(k, css(P.rojo, 0.5));
    } else {
      relleno(k, function () { p.m(mx - w * 0.3, mh * 0.94).l(mx + w * 0.3, mh * 0.94).q(mx, mh * 0.88, mx - w * 0.3, mh * 0.94).z(); }, css(P.lino2));
    }
    k.beginPath(); p.m(mx - w * 0.32, mh * 0.95).l(mx + w * 0.32, mh * 0.95).m(mx, mh).l(cx + w * 0.46, h * 1.1).m(mx, mh).l(cx - w * 0.46, h * 0.9); k.lineWidth = Math.max(0.6, w * 0.008 * s); k.strokeStyle = css(P.oro4, 0.8); k.stroke();
  }
  A.alejandria = {
    ancho: 1.2, alto: 0.3, abajo: 0, letra: true,
    dibujar: function (k, x, y, s, op) {
      var p = pluma(k, x, y, s), T = MARMOL, L = lejano(MARMOL, 0.35), CL = lejano(CAL, 0.35), i;
      // al fondo: la colina del Serapeo con su templo y la fila de tejados de la ciudad (más pálidos: lejos)
      relleno(k, function () { p.m(-0.56, 0).c(-0.5, 0.07, -0.44, 0.105, -0.38, 0.11).l(-0.24, 0.11).c(-0.18, 0.1, -0.12, 0.05, -0.06, 0).z(); }, ES.lin(k, 0, p.py(0.11), 0, p.py(0), [[0, ES.lejos(P.arena, 0.3)], [1, ES.lejos(P.arena2, 0.3)]]));
      k.save(); k.translate(0, -0.11 * s); templo(k, p, s, -0.31, 0.15, 0.16, 8, L, 0.02, 0.3); k.restore();
      casasGriegas(k, p, s, [0.12, 0.17, 0.07, 0.18, 0.22, 0.09, -0.06, -0.01, 0.075, 0.35, 0.4, 0.06], L);
      // en medio: la estoa de dos pisos, casas y el Cesareo con sus dos obeliscos delante
      relleno(k, function () { p.m(-0.15, 0).l(0.12, 0).l(0.12, 0.13).l(-0.15, 0.13).z(); }, ES.lin(k, 0, p.py(0.13), 0, p.py(0), [[0, mez(T.sombra, OSCURIDAD, 0.25)], [1, T.sombra]]));
      columnata(k, p, s, -0.142, 0.112, 0.004, 0.058, 15, 0.0075, T);
      relleno(k, function () { p.m(-0.152, 0.058).l(0.122, 0.058).l(0.122, 0.068).l(-0.152, 0.068).z(); }, vertical(k, p.py(0.068), p.py(0.058), T.luz, T.sol, T.medio));
      columnata(k, p, s, -0.142, 0.112, 0.068, 0.115, 19, 0.0055, T);
      relleno(k, function () { p.m(-0.155, 0.115).l(0.125, 0.115).l(0.125, 0.124).l(-0.155, 0.124).z(); }, vertical(k, p.py(0.124), p.py(0.115), T.luz, T.sol, T.medio));
      relleno(k, function () { p.m(-0.158, 0.124).l(0.128, 0.124).l(0.11, 0.138).l(-0.14, 0.138).z(); }, ES.lin(k, 0, p.py(0.138), 0, p.py(0.124), [[0, TEJA.sol], [1, TEJA.sombra]]));
      casasGriegas(k, p, s, [-0.55, -0.48, 0.07, -0.46, -0.4, 0.09, -0.38, -0.3, 0.075, -0.28, -0.2, 0.085], T);
      templo(k, p, s, 0.23, 0.15, 0.2, 6, T, 0.022);
      A.obelisco.dibujar(k, x + 0.136 * s, y, s, { alto: 0.13, semilla: 7 });
      A.obelisco.dibujar(k, x + 0.326 * s, y, s, { alto: 0.13, semilla: 8 });
      // delante: la muralla con sus torres y la puerta
      muralla(k, p, s, -0.6, 0.12, 0.045, [-0.57, -0.43, -0.29, -0.15, -0.01, 0.105], -0.22, CAL);
      // el puerto: el muelle de sillares con sus bolardos y, pasado el muelle, el agua del puerto con los barcos a flote
      relleno(k, function () { p.m(0.12, 0).l(0.31, 0).l(0.31, 0.016).l(0.12, 0.016).z(); }, vertical(k, p.py(0.016), p.py(0), CAL.luz, CAL.sol, CAL.sombra));
      var bl = new Lote(); for (i = 0; i < 3; i++) bl.rect(p.px(0.14 + i * 0.06), p.py(0.024), 0.004 * s, 0.008 * s); bl.pintar(k, css(CAL.sombra));
      var agua = function (y1) { return function () { p.m(0.31, 0).l(0.62, 0).l(0.62, y1).l(0.31, y1).z(); }; };
      var azul = ES.lin(k, 0, p.py(0.014), 0, p.py(0), [[0, ES.lejos(P.egipcio, 0.25)], [1, P.lapis]]);
      relleno(k, agua(0.014), azul);
      barco(k, p, s, 0.43, 0.11, T, true);
      barco(k, p, s, 0.545, 0.085, T, false);
      relleno(k, agua(0.006), azul);   // (la línea de flotación: el agua corta los cascos)
      k.strokeStyle = css([220, 236, 255], 0.5); k.lineWidth = Math.max(1, 0.0016 * s); k.beginPath();
      [[0.34, 0.009], [0.395, 0.004], [0.5, 0.01], [0.585, 0.004]].forEach(function (o) { p.m(o[0], o[1]).l(o[0] + 0.014, o[1]); }); k.stroke();
    }
  };

  /* ------------------------------------------------------------------ cada pieza deja el contexto como lo encontró
     (grosores, alineación del texto, extremos de línea…): las teselas pintan varias piezas seguidas en el mismo contexto */
  ['dendera', 'amarna', 'saqqara', 'keops', 'kefren', 'micerinos', 'esfinge', 'faro', 'obelisco', 'aldea', 'alejandria'].forEach(function (n) {
    var pintar = A[n].dibujar;
    A[n].dibujar = function (k, x, y, s, op) { k.save(); try { pintar(k, x, y, s, op || {}); } finally { k.restore(); } };
  });

  /* ------------------------------------------------------------------ fin */
})();

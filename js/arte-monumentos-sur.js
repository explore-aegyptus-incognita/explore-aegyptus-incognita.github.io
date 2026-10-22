/* Aegyptus Incognita · arte · los monumentos del sur, de Abu Simbel a Tebas
   Siete piezas quietas que se pintan una vez en teselas: AE.arte.abuSimbel, filae, edfu, karnak, memnon, deirElBahari y
   valleReyes, con la forma del contrato ({ ancho, alto, abajo, dibujar(ctx, x, y, s, op) }; contrato en
   herramientas/encargos/contrato-arte.md). Piedra arenisca, caliza, cuarcita o granito con la luz arriba a la izquierda
   (la cara iluminada a la izquierda, la sombra a la derecha), relieves de perfil en tonos de piedra (hundidos en los
   templos ptolemaicos), restos de pintura solo donde los hay de verdad, sin contornos.
   Sitios exportados para los secretos (en u respecto al ancla; dy negativa hacia arriba): abuSimbel.puerta,
   filae.grafito, deirElBahari.relieve y valleReyes.escalon.
   Cómo está hecho, por el coste en WebKit (medido en lab-monumentos-sur.html): cada pieza se dibuja en u (x a la derecha,
   y negativa hacia arriba, desde el centro de la base) con formas Path2D hechas una sola vez (preparar(), que se llama
   sola al cargar). Lo caro no es el número de llamadas sino cada subcamino curvo y cada línea ondulada larga (decenas de
   µs cada uno), los rellenos de mucha área (~1,5 ns por píxel) y los recortes grandes; los rectángulos son baratos. Por
   eso lo que se repite igual (los colosos con su familia, las columnas, las esfinges, las estatuas osíricas, el halcón,
   los relieves de cada torre) se pinta una vez en un lienzo aparte, a la escala de los píxeles del contexto, y se pega
   1:1 alineado a píxel (sello()): nítido, igual en todas las teselas, y en las siguientes llamadas cuesta un drawImage.
   No se usa setTransform ni otro globalCompositeOperation sobre el contexto que llega, ni ctx.filter. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, TAU = Math.PI * 2;
  AE.arte = AE.arte || {};
  var mez = U.mezcla, rgba = U.rgba, acl = ES.aclarar, osc = ES.oscurecer;

  /* ======================================================================= ayudas */
  function forma(fn) { var p = new Path2D(); fn(p); return p; }
  function matriz(a, b, c, d, e, f) { return typeof DOMMatrix === 'function' ? new DOMMatrix([a, b, c, d, e, f]) : { a: a, b: b, c: c, d: d, e: e, f: f }; }
  // añade la plantilla t al camino p: escalada k, en (ox, oy), girada ang y, si espejo, mirando al otro lado
  function poner(p, t, ox, oy, k, espejo, ang) {
    var co = Math.cos(ang || 0) * k, si = Math.sin(ang || 0) * k, e = espejo ? -1 : 1;
    p.addPath(t, matriz(co * e, si * e, -si, co, ox, oy));
  }
  // un polígono cerrado, siempre en el sentido de las agujas del reloj (así las uniones en un mismo camino no hacen agujeros)
  function poli(p, v) {
    var n = v.length / 2, a = 0, i;
    for (i = 0; i < n; i++) { var j = (i + 1) % n; a += v[2 * i] * v[2 * j + 1] - v[2 * j] * v[2 * i + 1]; }
    if (a >= 0) { p.moveTo(v[0], v[1]); for (i = 1; i < n; i++) p.lineTo(v[2 * i], v[2 * i + 1]); }
    else { p.moveTo(v[2 * n - 2], v[2 * n - 1]); for (i = n - 2; i >= 0; i--) p.lineTo(v[2 * i], v[2 * i + 1]); }
    p.closePath();
  }
  function elipse(p, cx, cy, rx, ry, rot) { rot = rot || 0; p.moveTo(cx + rx * Math.cos(rot), cy + rx * Math.sin(rot)); p.ellipse(cx, cy, rx, ry, rot, 0, TAU); }
  function circulo(p, cx, cy, r) { p.moveTo(cx + r, cy); p.arc(cx, cy, r, 0, TAU); }
  // un miembro: un círculo de radio r0 en (x0, y0) unido por sus tangentes a otro de radio r1 en (x1, y1)
  function miembro(p, x0, y0, r0, x1, y1, r1) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1e-9, nx = -dy / L, ny = dx / L;
    poli(p, [x0 + nx * r0, y0 + ny * r0, x1 + nx * r1, y1 + ny * r1, x1 - nx * r1, y1 - ny * r1, x0 - nx * r0, y0 - ny * r0]);
    circulo(p, x0, y0, r0); circulo(p, x1, y1, r1);
  }
  // una tira a lo largo de una polilínea [x, y, …], de grosor g0 al principio a g1 al final (grietas, rayas, juntas)
  function tira(p, pts, g0, g1) {
    var n = pts.length / 2, izq = [], der = [];
    if (g1 == null) g1 = g0;
    for (var i = 0; i < n; i++) {
      var a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1);
      var dx = pts[2 * b] - pts[2 * a], dy = pts[2 * b + 1] - pts[2 * a + 1], L = Math.hypot(dx, dy) || 1e-9;
      var g = (g0 + (g1 - g0) * (i / Math.max(1, n - 1))) / 2, nx = -dy / L * g, ny = dx / L * g;
      izq.push(pts[2 * i] + nx, pts[2 * i + 1] + ny); der.unshift(pts[2 * i] - nx, pts[2 * i + 1] - ny);
    }
    poli(p, izq.concat(der));
  }
  /* el suelo al pie de una pieza (arena o tierra), de x0 a x1: el borde de arriba va de y0 (a la izquierda) a y1 (a la
     derecha) con los puntos de control c1 y c2, como un bezierCurveTo. En los extremos no se corta con un lado vertical (un
     escalón contra los campos o el papiro de al lado): en los últimos r u baja en curva hasta la línea de suelo, como la
     arena que se derrama, y se funde con lo que haya al lado. */
  var REMATE = 0.05;
  function sueloRematado(p, x0, y0, c1x, c1y, c2x, c2y, x1, y1, r) {
    r = r || REMATE;
    p.moveTo(x0, 0);
    p.bezierCurveTo(x0 + r * 0.45, 0, x0 + r * 0.7, y0, x0 + r, y0);
    p.bezierCurveTo(c1x, c1y, c2x, c2y, x1 - r, y1);
    p.bezierCurveTo(x1 - r * 0.7, y1, x1 - r * 0.45, 0, x1, 0);
    p.closePath();
  }
  /* medir por partes: solo si el laboratorio pone window.__perfil (lab-monumentos-sur.html?perfil); si no, no hace nada.
     Cada marca espera a que WebKit termine lo pintado (U.vaciar y un píxel del propio lienzo) y apunta lo que tardó la parte. */
  var PF = null, PFX = null;
  function marca(n) {
    if (!window.__perfil) return;
    U.vaciar(); if (PFX) PFX.getImageData(0, 0, 1, 1);
    var t = performance.now(); if (PF && PF.n) window.__perfil[PF.n] = (window.__perfil[PF.n] || 0) + t - PF.t; PF = { n: n, t: t };
  }
  function rellena(x, p, estilo) { x.fillStyle = estilo; x.fill(p); }
  var lin = function (x, x0, y0, x1, y1, par) { return ES.lin(x, x0, y0, x1, y1, par); };
  // un volumen redondo de piedra (pierna, brazo, columna, cara): la luz a la izquierda con un brillo suave, la sombra a la derecha
  function cil(x, x0, x1, c, k, y) {
    k = k == null ? 0.2 : k; y = y || 0;
    return lin(x, x0, y, x1, y, [[0, acl(c, k * 0.55)], [0.3, acl(c, k)], [0.62, c], [1, osc(c, k * 1.5)]]);
  }
  function vert(x, y0, y1, c0, c1, cx) { return lin(x, cx || 0, y0, cx || 0, y1, [[0, c0], [1, c1]]); }

  /* ---------- los jeroglíficos tallados ----------
     Solo signos y fórmulas reales del kit (ES.TEXTOS, comprobadas): se escriben como hundidos en la piedra, el signo oscuro
     con un filo claro abajo a la derecha. Van en tandas (la letra se fija una vez, que es lo que cuesta): lista =
     [[signo, x, y, espejo], …] en u; en el contexto escalado a u se vuelve un momento a px para la letra. */
  function tallarLista(x, s, lista, tam, cOsc, cLuz, a) {
    var t = Math.max(3, Math.round(tam * s)), o = t * 0.05;
    x.save(); x.scale(1 / s, 1 / s);
    x.font = t + 'px ' + ES.JERO; x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    for (var pasada = cLuz ? 0 : 1; pasada < 2; pasada++) {
      x.fillStyle = pasada === 0 ? rgba(cLuz, a * 0.8) : rgba(cOsc, a);
      var d = pasada === 0 ? o : 0;
      for (var i = 0; i < lista.length; i++) {
        var g = lista[i], px = g[1] * s + d, py = g[2] * s + d;
        if (g[3]) { x.save(); x.translate(px, py); x.scale(-1, 1); x.fillText(g[0], 0, 0); x.restore(); }
        else x.fillText(g[0], px, py);
      }
    }
    x.restore();
  }
  // una fila de signos sacados de las fórmulas del kit (siempre las mismas para la misma semilla)
  function frase(semilla, cuantos) {
    var r = U.azar(semilla), out = [];
    while (out.length < cuantos) { var t = Array.from(ES.TEXTOS[Math.floor(r() * 13)]); out.push.apply(out, t); }
    return out.slice(0, cuantos);
  }

  /* ---------- sellos ----------
     Lo que se repite igual (los colosos) se pinta una vez en un lienzo aparte, a la escala de los píxeles del contexto
     (x.getTransform), y se pega 1:1 alineado a píxel entero: sale nítido, siempre igual entre teselas (sus desfases son
     píxeles enteros) y cuesta un drawImage. caja = [x0, y0, x1, y1] en u respecto al punto (ox, oy) donde se pega;
     pintor(k) dibuja en u con el origen en ese punto. Sin getTransform, se dibuja directamente. */
  var sellos = {}, escalas = [];
  function sello(x, clave, caja, pintor, ox, oy, espejo) {
    var M = x.getTransform ? x.getTransform() : null;
    if (!M || Math.abs(M.b) > 1e-9 || Math.abs(M.c) > 1e-9 || !(M.a > 0) || !(M.d > 0)) { x.save(); x.translate(ox, oy); if (espejo) x.scale(-1, 1); pintor(x); x.restore(); return; }
    var ea = M.a, ed = M.d, esc = ea.toFixed(3) + '|' + ed.toFixed(3), k = clave + '|' + esc, sp = sellos[k];
    if (!sp) {
      // (se guardan los de las dos últimas escalas; si la ventana cambia de tamaño, los viejos se sueltan)
      if (escalas.indexOf(esc) < 0) { escalas.push(esc); if (escalas.length > 2) { var vieja = escalas.shift(); for (var kk in sellos) if (sellos[kk].esc === vieja) delete sellos[kk]; } }
      var w = Math.ceil((caja[2] - caja[0]) * ea) + 4, h = Math.ceil((caja[3] - caja[1]) * ed) + 4, L = U.lienzo(w, h);
      L.x.setTransform(ea, 0, 0, ed, 2 - caja[0] * ea, 2 - caja[1] * ed);   // (un lienzo propio: aquí sí)
      pintor(L.x, ea);
      sp = sellos[k] = { c: L.c, dx: caja[0] * ea - 2, dy: caja[1] * ed - 2, esc: esc };
    }
    var py = Math.round(ed * oy + M.f + sp.dy), px;
    x.save();
    if (espejo) { px = Math.round(ea * ox + M.e - sp.dx); x.translate((px - M.e) / ea, (py - M.f) / ed); x.scale(-1 / ea, 1 / ed); }
    else { px = Math.round(ea * ox + M.e + sp.dx); x.translate((px - M.e) / ea, (py - M.f) / ed); x.scale(1 / ea, 1 / ed); }
    x.drawImage(sp.c, 0, 0);
    x.restore();
  }
  /* un grupo de figuras de relieve (las de una torre) como un solo sello: figs = [[nombre, plantilla, escala, x, y, espejo],
     …] en u de la pieza. Cada figura se pone ya volteada en su camino (las que miran a un lado y a otro, en caminos aparte:
     al voltear cambia el sentido y en un mismo camino se harían agujeros) y los filos se pintan después sin voltear: la luz
     viene siempre de arriba a la izquierda, también en las figuras que miran al otro lado. */
  var gruposRel = {};
  function selloRelieves(x, clave, figs, T, d, hundido) {
    var g = gruposRel[clave];
    if (!g) {
      g = gruposRel[clave] = { der: new Path2D(), izq: new Path2D(), caja: [1e9, 1e9, -1e9, -1e9] };
      figs.forEach(function (f) {
        var k = f[2], ox = f[3], oy = f[4];
        poner(f[5] ? g.izq : g.der, f[1], ox, oy, k, f[5]);
        g.caja[0] = Math.min(g.caja[0], ox - 0.45 * k); g.caja[2] = Math.max(g.caja[2], ox + 0.45 * k);
        g.caja[1] = Math.min(g.caja[1], oy - 1.45 * k); g.caja[3] = Math.max(g.caja[3], oy + 0.03 * k);
      });
      g.caja = [g.caja[0] - 0.004, g.caja[1] - 0.004, g.caja[2] + 0.004, g.caja[3] + 0.004];
    }
    sello(x, 'rel|' + clave, g.caja, function (q) {
      var tono = rgba(mez(T.luz, T.med, 0.55), 1);
      relieve(q, g.der, d, tono, T.claro, T.hondo, hundido, 0.7, 0.45);
      relieve(q, g.izq, d, tono, T.claro, T.hondo, hundido, 0.7, 0.45);
    }, 0, 0);
  }
  /* ======================================================================= figuras de perfil
     Las figuras de los relieves, al modo egipcio (cabeza y piernas de perfil, hombros de frente), mirando a la derecha,
     de alto 1 de la planta a la coronilla. Son uniones de formas simples en un solo camino (todo en el mismo sentido):
     se rellenan de una vez. op: pose ('quieta', 'ofrenda', 'golpear', 'cetro', 'adora'), cabeza ('hombre', 'halcon',
     'mujer'), corona ('pschent', 'blanca', 'disco', 'hathor', 'nemes'). */
  var figs = {};
  function figura(pose, cabeza, corona) {
    var clave = pose + '|' + cabeza + '|' + corona;
    if (figs[clave]) return figs[clave];
    var p = new Path2D(), q = new Path2D(), mujer = cabeza === 'mujer', sentado = pose === 'sentado';
    // la cabeza (en q, con el torso y la corona: lo que baja si la figura está sentada)
    if (cabeza === 'halcon') {
      elipse(q, -0.005, -0.93, 0.062, 0.066);
      poli(q, [0.03, -0.975, 0.07, -0.95, 0.098, -0.925, 0.094, -0.9, 0.078, -0.888, 0.08, -0.905, 0.05, -0.9, 0.03, -0.88]);
      // la peluca tripartita: una caída delante y otra detrás, hasta los hombros
      poli(q, [-0.07, -0.95, 0.02, -0.98, 0.04, -0.9, 0.045, -0.79, 0.005, -0.79, -0.01, -0.86, -0.075, -0.79, -0.085, -0.88]);
    } else {
      elipse(q, -0.002, -0.928, 0.058, 0.066);
      poli(q, [0.02, -0.985, 0.052, -0.965, 0.06, -0.94, 0.084, -0.915, 0.063, -0.905, 0.068, -0.893, 0.058, -0.884, 0.056, -0.868, 0.02, -0.86, -0.02, -0.88]);
      if (mujer || corona === 'hathor') poli(q, [-0.075, -0.97, 0.02, -0.995, 0.04, -0.95, 0.03, -0.9, 0.042, -0.77, 0.0, -0.77, -0.02, -0.86, -0.07, -0.78, -0.085, -0.9]);
      else if (corona === 'nemes') poli(q, [-0.065, -0.985, 0.04, -0.99, 0.045, -0.94, 0.012, -0.9, 0.0, -0.8, -0.06, -0.8, -0.09, -0.86, -0.085, -0.94]);
    }
    // el cuello y el torso (hombros de frente)
    poli(q, [-0.024, -0.885, 0.036, -0.885, 0.04, -0.81, -0.03, -0.81]);
    if (mujer) { poli(q, [-0.115, -0.81, 0.115, -0.81, 0.1, -0.74, 0.07, -0.6, -0.06, -0.6, -0.1, -0.74]); circulo(q, -0.095, -0.79, 0.03); circulo(q, 0.095, -0.79, 0.03); }
    else { poli(q, [-0.135, -0.815, 0.135, -0.815, 0.12, -0.75, 0.072, -0.6, -0.062, -0.6, -0.118, -0.75]); circulo(q, -0.112, -0.795, 0.034); circulo(q, 0.112, -0.795, 0.034); }
    // la corona
    if (corona === 'pschent') {
      // la roja por fuera (con su espalda alta y la espiral) y la blanca saliendo de dentro
      poli(q, [-0.07, -0.95, 0.06, -0.96, 0.06, -1.04, -0.02, -1.04, -0.02, -1.2, -0.075, -1.2]);
      tira(q, [0.045, -1.03, 0.085, -1.07, 0.1, -1.11, 0.085, -1.13], 0.012);
      poli(q, [-0.01, -1.03, 0.055, -1.04, 0.05, -1.14, 0.025, -1.24, -0.005, -1.27, -0.03, -1.24, -0.02, -1.15]);
    } else if (corona === 'blanca') {
      poli(q, [-0.065, -0.95, 0.055, -0.96, 0.05, -1.08, 0.025, -1.2, -0.005, -1.24, -0.035, -1.2, -0.06, -1.08]);
    } else if (corona === 'disco') {
      circulo(q, -0.005, -1.06, 0.075); poli(q, [0.05, -1.0, 0.075, -1.03, 0.07, -1.0]);
    } else if (corona === 'hathor') {
      circulo(q, -0.005, -1.07, 0.07);
      tira(q, [-0.09, -0.98, -0.11, -1.06, -0.085, -1.14], 0.018, 0.01); tira(q, [0.08, -0.98, 0.1, -1.06, 0.075, -1.14], 0.018, 0.01);
      poli(q, [-0.06, -0.975, 0.05, -0.975, 0.05, -1.0, -0.06, -1.0]);
    }
    var bajo = sentado ? 0.27 : 0;
    p.addPath(q, matriz(1, 0, 0, 1, 0, bajo));
    // de cintura para abajo
    if (sentado) {
      // el trono (un bloque con respaldo bajo), el muslo hacia delante, la espinilla y el pie
      poli(p, [-0.13, -0.26, 0.05, -0.26, 0.05, 0, -0.13, 0]); poli(p, [-0.13, -0.4, -0.1, -0.4, -0.1, -0.25, -0.13, -0.25]);
      if (mujer) poli(p, [-0.08, -0.36, 0.07, -0.36, 0.215, -0.29, 0.215, -0.045, 0.14, -0.045, 0.14, -0.23, -0.08, -0.23]);
      else { poli(p, [-0.075, -0.35, 0.075, -0.35, 0.21, -0.3, 0.21, -0.23, -0.075, -0.23]); miembro(p, 0.18, -0.26, 0.036, 0.18, -0.05, 0.022); }
      poli(p, [0.14, -0.05, 0.19, -0.052, 0.285, -0.014, 0.285, 0, 0.135, 0]);
    } else if (mujer) {
      poli(p, [-0.07, -0.62, 0.08, -0.62, 0.09, -0.4, 0.075, -0.045, -0.065, -0.045, -0.075, -0.4]);
      poli(p, [-0.07, -0.05, 0.02, -0.05, 0.13, -0.012, 0.13, 0, -0.075, 0]);
    } else {
      // el faldellín (shendyt), con la pala de delante que se abre; las piernas en marcha y los pies
      poli(p, [-0.072, -0.62, 0.078, -0.62, 0.145, -0.385, -0.088, -0.405]);
      miembro(p, -0.03, -0.42, 0.043, -0.122, -0.045, 0.021);
      miembro(p, 0.045, -0.42, 0.043, 0.138, -0.045, 0.021);
      poli(p, [-0.152, -0.05, -0.1, -0.052, -0.02, -0.014, -0.02, 0, -0.16, 0]);
      poli(p, [0.11, -0.052, 0.16, -0.05, 0.255, -0.014, 0.255, 0, 0.105, 0]);
    }
    // los brazos según la pose
    if (pose === 'ofrenda') {
      miembro(p, -0.1, -0.79, 0.032, 0.07, -0.66, 0.026); miembro(p, 0.07, -0.66, 0.026, 0.235, -0.73, 0.022);
      miembro(p, 0.11, -0.79, 0.034, 0.2, -0.64, 0.027); miembro(p, 0.2, -0.64, 0.027, 0.3, -0.7, 0.022);
      // lo que ofrece: una figurilla de Maat sentada con su pluma (el nombre del rey) sobre las manos
      elipse(p, 0.275, -0.775, 0.032, 0.045); circulo(p, 0.288, -0.835, 0.02); poli(p, [0.28, -0.85, 0.29, -0.85, 0.305, -0.93, 0.296, -0.93]);
    } else if (pose === 'adora') {
      miembro(p, -0.1, -0.79, 0.032, 0.09, -0.72, 0.026); miembro(p, 0.09, -0.72, 0.026, 0.17, -0.9, 0.022);
      miembro(p, 0.11, -0.79, 0.034, 0.22, -0.7, 0.027); miembro(p, 0.22, -0.7, 0.027, 0.28, -0.88, 0.022);
      elipse(p, 0.29, -0.915, 0.022, 0.035, 0.3); elipse(p, 0.18, -0.93, 0.02, 0.033, 0.3);
    } else if (pose === 'golpear') {
      // el brazo de atrás, levantado con la maza; el de delante, estirado, agarra del pelo a los enemigos
      miembro(p, -0.11, -0.8, 0.034, -0.2, -0.96, 0.027); miembro(p, -0.2, -0.96, 0.027, -0.1, -1.1, 0.024);
      circulo(p, -0.095, -1.115, 0.03);
      tira(p, [-0.1, -1.08, -0.15, -1.2, -0.185, -1.29], 0.022, 0.016);
      elipse(p, -0.2, -1.33, 0.045, 0.06, -0.4);
      miembro(p, 0.11, -0.79, 0.034, 0.23, -0.71, 0.027); miembro(p, 0.23, -0.71, 0.027, 0.34, -0.64, 0.023);
      circulo(p, 0.36, -0.63, 0.032);
    } else if (pose === 'cetro' || sentado) {
      // el de delante sostiene el cetro uas, de la cabeza de animal al suelo; el de atrás cae con el ankh (o, sentado, en el regazo)
      var b = bajo;
      miembro(p, 0.11, -0.79 + b, 0.034, 0.18, -0.64 + b, 0.027); miembro(p, 0.18, -0.64 + b, 0.027, 0.28, -0.67 + b, 0.022);
      circulo(p, 0.29, -0.67 + b, 0.03);
      tira(p, [0.3, -1.04 + b, 0.3, -0.02], 0.022);
      poli(p, [0.28, -1.03 + b, 0.36, -1.08 + b, 0.345, -1.05 + b, 0.31, -1.0 + b]);
      poli(p, [0.27, -0.03, 0.3, 0, 0.33, -0.03, 0.315, -0.01, 0.3, -0.03, 0.285, -0.01]);
      if (sentado) { miembro(p, -0.11, -0.53, 0.034, -0.06, -0.38, 0.027); miembro(p, -0.06, -0.38, 0.027, 0.06, -0.33, 0.022); circulo(p, 0.075, -0.33, 0.026); }
      else {
        miembro(p, -0.11, -0.79, 0.034, -0.13, -0.6, 0.027); miembro(p, -0.13, -0.6, 0.027, -0.12, -0.46, 0.022);
        elipse(p, -0.12, -0.36, 0.022, 0.03); tira(p, [-0.12, -0.45, -0.12, -0.33], 0.016); poli(p, [-0.16, -0.395, -0.08, -0.395, -0.08, -0.38, -0.16, -0.38]);
      }
    } else {
      miembro(p, -0.11, -0.79, 0.034, -0.13, -0.6, 0.027); miembro(p, -0.13, -0.6, 0.027, -0.12, -0.45, 0.022);
      miembro(p, 0.11, -0.79, 0.034, 0.14, -0.6, 0.027); miembro(p, 0.14, -0.6, 0.027, 0.15, -0.45, 0.022);
    }
    figs[clave] = p;
    return p;
  }
  // dos enemigos arrodillados que levantan las manos (mirando a la izquierda, hacia el rey que los agarra del pelo)
  var manojo = null;
  function cautivos() {
    if (manojo) return manojo;
    var p = new Path2D();
    [[0, 0], [0.11, 0.02]].forEach(function (o) {
      var ox = o[0], oy = o[1];
      circulo(p, ox, oy - 0.52, 0.052); poli(p, [ox - 0.046, oy - 0.55, ox - 0.068, oy - 0.522, ox - 0.046, oy - 0.5]);   // la cabeza y la nariz
      poli(p, [ox - 0.03, oy - 0.6, ox + 0.04, oy - 0.6, ox + 0.05, oy - 0.53, ox + 0.02, oy - 0.5]);   // el pelo, por donde los agarra
      poli(p, [ox - 0.055, oy - 0.47, ox + 0.065, oy - 0.47, ox + 0.075, oy - 0.27, ox - 0.035, oy - 0.28]);   // el torso
      // arrodillado: el muslo hacia delante y la pierna doblada hacia atrás, el pie en punta
      poli(p, [ox - 0.04, oy - 0.29, ox + 0.075, oy - 0.3, ox + 0.09, oy - 0.06, ox + 0.17, oy - 0.03, ox + 0.17, oy, ox - 0.13, oy, ox - 0.13, oy - 0.07]);
      // los brazos alzados, suplicando
      miembro(p, ox - 0.03, oy - 0.44, 0.024, ox - 0.12, oy - 0.38, 0.019); miembro(p, ox - 0.12, oy - 0.38, 0.019, ox - 0.12, oy - 0.53, 0.016);
    });
    return (manojo = p);
  }
  /* pinta un camino de relieve: un filo claro arriba a la izquierda y uno oscuro abajo a la derecha (relieve alzado) o al
     revés (hundido), y la figura en su tono, algo más oscuro que el muro. d = el desfase del filo, en u */
  function relieve(x, p, d, tono, cLuz, cOsc, hundido, aLuz, aOsc) {
    var sg = hundido ? -1 : 1;
    x.save(); x.translate(d * sg, d * sg); rellena(x, p, rgba(cOsc, aOsc == null ? 0.55 : aOsc)); x.restore();
    x.save(); x.translate(-d * 0.8 * sg, -d * 0.8 * sg); rellena(x, p, rgba(cLuz, aLuz == null ? 0.7 : aLuz)); x.restore();
    rellena(x, p, tono);
  }

  /* ======================================================================= 1. ABU SIMBEL
     La fachada del gran templo de Ramsés II, tallada en el acantilado de arenisca rosada: cuatro colosos sentados con la
     doble corona (pschent) sobre el nemes, la barba postiza y las manos en las rodillas; el segundo por la izquierda, roto
     (su cabeza y su torso, caídos a sus pies; en la roca queda la huella de lo que se cayó); la familia de pie entre y junto
     a las piernas; la puerta oscura en el centro; encima, el nicho de Ra-Horajti (cabeza de halcón y disco solar, con el
     cetro user y Maat: el nombre del rey, User-Maat-Ra) entre dos relieves del rey que le ofrece a Maat; la banda de la
     dedicatoria con sus cartuchos, la cornisa y la fila de 22 babuinos que adoran al sol naciente. El cerro de arenisca
     en capas, con arena al pie. Ancla: el centro de la base. */
  var AB = {
    luz: mez(P.piedra, P.pielM, 0.28), med: mez(P.piedra2, P.pielM, 0.22), som: mez(P.piedra2, P.piel2, 0.38),
    roca: mez(P.arena2, P.piel, 0.2), rocaL: acl(mez(P.arena, P.pielM, 0.22), 0.1), rocaS: osc(mez(P.piedra2, P.piel2, 0.45), 0.14)
  };
  AB.hondo = osc(AB.som, 0.55); AB.claro = acl(AB.luz, 0.32); AB.oscuro = osc(AB.som, 0.25);
  var AB_BASE = 0.035, AB_K = 0.33, AB_CX = [-0.256, -0.108, 0.108, 0.256];
  function abFachX(y) { return 0.339 + y * (0.023 / 0.493); }   // medio ancho de la fachada a la altura y

  // ---- el coloso: plantilla en unidades de coloso (alto 1 de la planta a la punta de la corona; base en y = 0)
  var coloso = null;
  function plantillaColoso() {
    if (coloso) return coloso;
    var c = {};
    c.sil = forma(function (p) {
      p.moveTo(0, -0.999);
      p.bezierCurveTo(0.017, -0.999, 0.028, -0.99, 0.027, -0.973); p.bezierCurveTo(0.044, -0.955, 0.07, -0.915, 0.068, -0.855);
      p.lineTo(0.098, -0.855); p.lineTo(0.092, -0.8); p.lineTo(0.094, -0.765);
      p.bezierCurveTo(0.125, -0.715, 0.17, -0.655, 0.19, -0.617); p.bezierCurveTo(0.215, -0.622, 0.239, -0.605, 0.239, -0.57);
      p.bezierCurveTo(0.239, -0.5, 0.235, -0.44, 0.229, -0.4); p.lineTo(0.225, -0.385); p.lineTo(0.225, 0);
      p.lineTo(-0.225, 0); p.lineTo(-0.225, -0.385); p.lineTo(-0.229, -0.4);
      p.bezierCurveTo(-0.235, -0.44, -0.239, -0.5, -0.239, -0.57); p.bezierCurveTo(-0.239, -0.605, -0.215, -0.622, -0.19, -0.617);
      p.bezierCurveTo(-0.17, -0.655, -0.125, -0.715, -0.094, -0.765); p.lineTo(-0.092, -0.8); p.lineTo(-0.098, -0.855); p.lineTo(-0.068, -0.855);
      p.bezierCurveTo(-0.07, -0.915, -0.044, -0.955, -0.027, -0.973); p.bezierCurveTo(-0.028, -0.99, -0.017, -0.999, 0, -0.999);
      p.closePath();
    });
    c.trono = forma(function (p) { p.rect(-0.225, -0.385, 0.1, 0.385); p.rect(0.125, -0.385, 0.1, 0.385); });
    c.hueco = forma(function (p) { p.rect(-0.042, -0.33, 0.084, 0.33); });
    c.alas = forma(function (p) {
      p.moveTo(-0.094, -0.765); p.lineTo(0.094, -0.765);
      p.bezierCurveTo(0.125, -0.715, 0.17, -0.655, 0.19, -0.617); p.lineTo(0.15, -0.58); p.lineTo(-0.15, -0.58); p.lineTo(-0.19, -0.617);
      p.bezierCurveTo(-0.17, -0.655, -0.125, -0.715, -0.094, -0.765); p.closePath();
    });
    c.torso = forma(function (p) {
      p.moveTo(-0.17, -0.615); p.lineTo(0.17, -0.615);
      p.bezierCurveTo(0.2, -0.6, 0.212, -0.575, 0.208, -0.545); p.bezierCurveTo(0.19, -0.49, 0.155, -0.44, 0.118, -0.395);
      p.lineTo(-0.118, -0.395);
      p.bezierCurveTo(-0.155, -0.44, -0.19, -0.49, -0.208, -0.545); p.bezierCurveTo(-0.212, -0.575, -0.2, -0.6, -0.17, -0.615);
      p.closePath();
    });
    function brazo(p, l) {
      p.moveTo(l * 0.168, -0.61);
      p.bezierCurveTo(l * 0.205, -0.632, l * 0.241, -0.61, l * 0.24, -0.568); p.bezierCurveTo(l * 0.239, -0.51, l * 0.236, -0.45, l * 0.23, -0.402);
      p.bezierCurveTo(l * 0.21, -0.39, l * 0.185, -0.39, l * 0.166, -0.402); p.bezierCurveTo(l * 0.17, -0.47, l * 0.168, -0.55, l * 0.168, -0.61);
      p.closePath();
    }
    function antebrazo(p, l) {
      p.moveTo(l * 0.233, -0.412);
      p.bezierCurveTo(l * 0.227, -0.375, l * 0.19, -0.348, l * 0.14, -0.343); p.lineTo(l * 0.097, -0.356);
      p.bezierCurveTo(l * 0.115, -0.384, l * 0.14, -0.404, l * 0.165, -0.412); p.closePath();
    }
    function mano(p, l) {
      p.moveTo(l * 0.14, -0.36);
      p.bezierCurveTo(l * 0.146, -0.34, l * 0.143, -0.318, l * 0.133, -0.302); p.bezierCurveTo(l * 0.11, -0.293, l * 0.065, -0.293, l * 0.042, -0.301);
      p.bezierCurveTo(l * 0.04, -0.322, l * 0.055, -0.347, l * 0.082, -0.362); p.bezierCurveTo(l * 0.1, -0.368, l * 0.125, -0.368, l * 0.14, -0.36);
      p.closePath();
    }
    function pierna(p, l) {
      p.moveTo(l * 0.036, -0.318);
      p.bezierCurveTo(l * 0.05, -0.337, l * 0.108, -0.337, l * 0.124, -0.318); p.bezierCurveTo(l * 0.131, -0.26, l * 0.13, -0.18, l * 0.115, -0.09);
      p.lineTo(l * 0.108, -0.045); p.lineTo(l * 0.046, -0.045); p.bezierCurveTo(l * 0.042, -0.12, l * 0.033, -0.22, l * 0.036, -0.318);
      p.closePath();
    }
    function pie(p, l) {
      p.moveTo(l * 0.044, -0.056); p.lineTo(l * 0.11, -0.056);
      p.bezierCurveTo(l * 0.124, -0.04, l * 0.131, -0.018, l * 0.13, 0); p.lineTo(l * 0.03, 0);
      p.bezierCurveTo(l * 0.03, -0.02, l * 0.035, -0.04, l * 0.044, -0.056); p.closePath();
    }
    function solapa(p, l) {
      p.moveTo(l * 0.058, -0.72); p.lineTo(l * 0.093, -0.752);
      p.bezierCurveTo(l * 0.098, -0.68, l * 0.104, -0.6, l * 0.108, -0.528); p.bezierCurveTo(l * 0.09, -0.52, l * 0.068, -0.52, l * 0.052, -0.528);
      p.bezierCurveTo(l * 0.053, -0.6, l * 0.055, -0.67, l * 0.058, -0.72); p.closePath();
    }
    c.brazoI = forma(function (p) { brazo(p, -1); }); c.brazoD = forma(function (p) { brazo(p, 1); });
    c.anteI = forma(function (p) { antebrazo(p, -1); }); c.anteD = forma(function (p) { antebrazo(p, 1); });
    c.manos = forma(function (p) { mano(p, -1); mano(p, 1); });
    c.piernaI = forma(function (p) { pierna(p, -1); }); c.piernaD = forma(function (p) { pierna(p, 1); });
    c.pies = forma(function (p) { pie(p, -1); pie(p, 1); });
    c.solapas = forma(function (p) { solapa(p, -1); solapa(p, 1); });
    c.falda = forma(function (p) {
      p.moveTo(-0.118, -0.398); p.lineTo(0.118, -0.398);
      p.bezierCurveTo(0.128, -0.37, 0.134, -0.345, 0.135, -0.322); p.lineTo(0.035, -0.316); p.quadraticCurveTo(0, -0.3, -0.035, -0.316);
      p.lineTo(-0.135, -0.322); p.bezierCurveTo(-0.134, -0.345, -0.128, -0.37, -0.118, -0.398); p.closePath();
    });
    c.nemes = forma(function (p) { poli(p, [-0.093, -0.803, 0.093, -0.803, 0.095, -0.74, 0.058, -0.72, -0.058, -0.72, -0.095, -0.74]); });
    c.cara = forma(function (p) {
      p.moveTo(-0.057, -0.775); p.bezierCurveTo(-0.025, -0.782, 0.025, -0.782, 0.057, -0.775);
      p.bezierCurveTo(0.065, -0.74, 0.062, -0.697, 0.043, -0.674); p.bezierCurveTo(0.028, -0.657, -0.028, -0.657, -0.043, -0.674);
      p.bezierCurveTo(-0.062, -0.697, -0.065, -0.74, -0.057, -0.775); p.closePath();
    });
    c.orejas = forma(function (p) { elipse(p, -0.068, -0.733, 0.012, 0.023, 0.12); elipse(p, 0.068, -0.733, 0.012, 0.023, -0.12); });
    c.gorro = forma(function (p) { p.moveTo(-0.098, -0.855); p.lineTo(0.098, -0.855); p.lineTo(0.092, -0.802); p.quadraticCurveTo(0, -0.79, -0.092, -0.802); p.closePath(); });
    c.blanca = forma(function (p) {
      p.moveTo(-0.068, -0.853); p.bezierCurveTo(-0.07, -0.915, -0.044, -0.955, -0.027, -0.973); p.bezierCurveTo(-0.028, -0.99, -0.017, -0.999, 0, -0.999);
      p.bezierCurveTo(0.017, -0.999, 0.028, -0.99, 0.027, -0.973); p.bezierCurveTo(0.044, -0.955, 0.07, -0.915, 0.068, -0.853); p.closePath();
    });
    c.barba = forma(function (p) { p.moveTo(-0.019, -0.668); p.lineTo(0.019, -0.668); p.lineTo(0.024, -0.588); p.quadraticCurveTo(0, -0.58, -0.024, -0.588); p.closePath(); });
    c.ureo = forma(function (p) { elipse(p, 0, -0.792, 0.009, 0.014); poli(p, [-0.004, -0.781, 0.004, -0.781, 0.005, -0.774, -0.005, -0.774]); });
    // lo fino y oscuro de arriba (nemes, barba, cara) y de abajo (cinturón, pliegues, dedos)
    c.lineasArriba = forma(function (p) {
      var i, y, t, xi, xo, xw;
      for (i = 0; i < 15; i++) {   // las rayas de las solapas
        y = -0.712 + i * 0.0128; if (y > -0.534) break;
        t = (y + 0.72) / 0.192; xi = 0.058 - 0.006 * t + 0.002; xo = 0.093 + 0.015 * t - 0.002;
        p.rect(xi, y, xo - xi, 0.0046); p.rect(-xo, y, xo - xi, 0.0046);
      }
      for (i = 0; i < 12; i++) {   // las de las alas, entre la solapa y el borde
        y = -0.752 + i * 0.0128; t = (y + 0.765) / 0.148; if (t > 0.97) break;
        xw = 0.094 + 0.096 * Math.pow(t, 0.8) - 0.004; xo = (y < -0.74 ? 0.096 : 0.093 + 0.015 * Math.max(0, (y + 0.752) / 0.224)) + 0.003;
        if (xw > xo + 0.004) { p.rect(xo, y, xw - xo, 0.0046); p.rect(-xw, y, xw - xo, 0.0046); }
      }
      for (i = 0; i < 4; i++) { y = -0.797 + i * 0.0128; p.rect(0.064, y, 0.03, 0.0046); p.rect(-0.094, y, 0.03, 0.0046); }   // las sienes
      p.rect(-0.057, -0.781, 0.114, 0.0035);   // el borde de la cinta en la frente
    });
    c.lineasCara = forma(function (p) {
      for (var i = 0; i < 5; i++) p.rect(-0.021, -0.655 + i * 0.0145, 0.042, 0.0034);   // la barba trenzada
      // la cara: los ojos en almendra con la raya hacia atrás, las cejas, las aletas de la nariz y la boca
      [-1, 1].forEach(function (l) {
        p.moveTo(l * 0.012, -0.734); p.quadraticCurveTo(l * 0.028, -0.746, l * 0.045, -0.735); p.quadraticCurveTo(l * 0.028, -0.727, l * 0.012, -0.734); p.closePath();
        tira(p, [l * 0.044, -0.7355, l * 0.056, -0.736], 0.0032, 0.002);
        tira(p, [l * 0.01, -0.7505, l * 0.03, -0.7575, l * 0.05, -0.751], 0.0042, 0.003);
      });
      elipse(p, -0.0078, -0.6995, 0.0052, 0.0032); elipse(p, 0.0088, -0.6995, 0.0052, 0.0032);
      p.moveTo(-0.02, -0.6845); p.quadraticCurveTo(0, -0.6895, 0.02, -0.6845); p.quadraticCurveTo(0, -0.6865, -0.02, -0.6845); p.closePath();
      poli(p, [-0.011, -0.802, 0.011, -0.802, 0.011, -0.798, -0.011, -0.798]);
    });
    c.lineasAbajo = forma(function (p) {
      var i;
      p.rect(-0.118, -0.398, 0.236, 0.0065); p.rect(-0.117, -0.384, 0.234, 0.0035);
      poli(p, [-0.012, -0.392, 0.012, -0.392, 0.01, -0.37, -0.01, -0.37]);   // la hebilla
      for (i = -5; i <= 5; i++) if (i) tira(p, [i * 0.0105, -0.378, i * 0.0128, -0.318], 0.003);
      for (i = 1; i < 4; i++) { var fx = 0.045 + i * 0.022; tira(p, [fx, -0.326, fx + 0.002, -0.299], 0.003); tira(p, [-fx, -0.326, -fx - 0.002, -0.299], 0.003); }
      for (i = 1; i < 4; i++) { var dx = 0.036 + i * 0.022; p.rect(dx, -0.02, 0.003, 0.018); p.rect(-dx - 0.003, -0.02, 0.003, 0.018); }
    });
    // las sombras propias, translúcidas
    c.sombrasArriba = forma(function (p) {
      p.moveTo(0.057, -0.775); p.bezierCurveTo(0.065, -0.74, 0.062, -0.697, 0.043, -0.674); p.bezierCurveTo(0.035, -0.665, 0.026, -0.66, 0.016, -0.659);
      p.bezierCurveTo(0.036, -0.69, 0.045, -0.735, 0.037, -0.775); p.closePath();   // la mejilla derecha
      poli(p, [0.003, -0.738, 0.012, -0.703, 0.004, -0.697]);   // el lado de la nariz
      p.rect(-0.092, -0.805, 0.184, 0.011);   // bajo el borde de la corona
      poli(p, [0.052, -0.528, 0.108, -0.528, 0.113, -0.513, 0.058, -0.514]); poli(p, [-0.108, -0.528, -0.052, -0.528, -0.046, -0.514, -0.1, -0.513]);
      poli(p, [-0.024, -0.588, 0.03, -0.588, 0.035, -0.571, -0.012, -0.573]);   // bajo la barba
      poli(p, [-0.034, -0.663, 0.036, -0.663, 0.02, -0.668, -0.02, -0.668]);
      tira(p, [0.198, -0.548, 0.182, -0.49, 0.15, -0.44, 0.122, -0.405], 0.016, 0.008);   // el costado derecho
      tira(p, [0.173, -0.6, 0.171, -0.52, 0.169, -0.41], 0.012); tira(p, [-0.173, -0.6, -0.171, -0.52, -0.169, -0.41], 0.006);
      // el filo de las alas del nemes, que se despega del hombro
      p.moveTo(0.094, -0.765); p.bezierCurveTo(0.125, -0.715, 0.17, -0.655, 0.19, -0.617); p.lineTo(0.2, -0.611);
      p.bezierCurveTo(0.178, -0.652, 0.133, -0.713, 0.101, -0.766); p.closePath();
      p.moveTo(-0.094, -0.765); p.bezierCurveTo(-0.125, -0.715, -0.17, -0.655, -0.19, -0.617); p.lineTo(-0.196, -0.613);
      p.bezierCurveTo(-0.176, -0.652, -0.13, -0.713, -0.099, -0.766); p.closePath();
    });
    c.sombrasAbajo = forma(function (p) {
      poli(p, [0.1, -0.351, 0.142, -0.343, 0.137, -0.33, 0.1, -0.338]); poli(p, [-0.142, -0.343, -0.1, -0.351, -0.1, -0.338, -0.137, -0.33]);
      poli(p, [0.042, -0.301, 0.133, -0.302, 0.128, -0.287, 0.048, -0.286]); poli(p, [-0.133, -0.302, -0.042, -0.301, -0.048, -0.286, -0.128, -0.287]);
      poli(p, [-0.035, -0.316, 0.035, -0.316, 0.03, -0.3, -0.03, -0.3]);
      tira(p, [0.112, -0.3, 0.115, -0.2, 0.103, -0.06], 0.018, 0.012); tira(p, [-0.05, -0.3, -0.048, -0.2, -0.054, -0.06], 0.012, 0.008);
      poli(p, [0.03, 0, 0.13, 0, 0.128, 0.004, 0.032, 0.004]);
    });
    c.lucesArriba = forma(function (p) {
      elipse(p, -0.036, -0.712, 0.013, 0.03, 0.1); tira(p, [-0.0015, -0.75, 0.0005, -0.706], 0.005, 0.008);
      tira(p, [-0.014, -0.6805, 0, -0.679, 0.014, -0.6805], 0.004); tira(p, [-0.045, -0.7445, -0.028, -0.7505, -0.012, -0.745], 0.003);
      tira(p, [0.012, -0.745, 0.028, -0.7505, 0.042, -0.7455], 0.0025);
      elipse(p, -0.02, -0.766, 0.024, 0.006); elipse(p, -0.006, -0.664, 0.012, 0.004);
      elipse(p, -0.213, -0.598, 0.022, 0.013, -0.4); elipse(p, -0.118, -0.565, 0.042, 0.017, -0.2);
      tira(p, [-0.058, -0.862, -0.052, -0.92, -0.033, -0.96], 0.008, 0.004);
      tira(p, [-0.09, -0.85, -0.086, -0.808], 0.008); tira(p, [-0.105, -0.528, -0.098, -0.68, -0.093, -0.745], 0.005, 0.003);
    });
    c.lucesAbajo = forma(function (p) {
      elipse(p, -0.09, -0.324, 0.03, 0.009); elipse(p, 0.07, -0.326, 0.025, 0.008);
      tira(p, [-0.117, -0.3, -0.115, -0.2, -0.105, -0.09], 0.008, 0.005); tira(p, [0.047, -0.3, 0.046, -0.2, 0.051, -0.09], 0.007, 0.004);
      tira(p, [-0.13, -0.355, -0.085, -0.363], 0.006); tira(p, [0.085, -0.363, 0.13, -0.355], 0.004);
      p.rect(-0.223, -0.385, 0.096, 0.006); p.rect(0.127, -0.385, 0.096, 0.006);
    });
    // lo que queda del roto: el tronco partido a la altura de la cintura y el arranque de los codos
    var r = U.azar(27), corte = [], i, xx = -0.226;
    while (xx < 0.226) { corte.push(xx, -0.47 + xx * 0.12 + (U.fbm(xx * 14 + 2, 7, 3) - 0.5) * 0.07 + (r() - 0.5) * 0.014); xx += 0.012 + r() * 0.026; }
    corte.push(0.226, -0.44);
    c.corte = corte;
    c.tronco = forma(function (p) {
      p.moveTo(0.226, -0.398); p.lineTo(-0.226, -0.398);
      for (var j = 0; j < corte.length; j += 2) p.lineTo(corte[j], Math.min(corte[j + 1], -0.402));
      p.closePath();
    });
    c.troncoSil = forma(function (p) {
      p.moveTo(0.225, 0); p.lineTo(-0.225, 0); p.lineTo(-0.225, -0.385);
      for (var j = 0; j < corte.length; j += 2) p.lineTo(corte[j], Math.min(corte[j + 1], -0.402));
      p.lineTo(0.225, -0.385); p.closePath();
    });
    // la cara de la rotura: piedra partida, más clara, vista un poco desde arriba
    c.filoCorte = forma(function (p) {
      var v = [], j;
      for (j = 0; j < corte.length; j += 2) v.push(corte[j], Math.min(corte[j + 1], -0.402));
      for (j = corte.length - 2; j >= 0; j -= 2) v.push(corte[j], Math.min(corte[j + 1], -0.402) + 0.012 + (U.fbm(corte[j] * 20, 3, 2) - 0.5) * 0.012);
      poli(p, v);
    });
    c.picadoCorte = forma(function (p) {
      for (var j = 2; j < corte.length - 2; j += 4) { var px = corte[j], py = Math.min(corte[j + 1], -0.402) + 0.008; poli(p, [px - 0.008, py, px, py - 0.005, px + 0.01, py + 0.002, px + 0.002, py + 0.008]); }
    });
    // la cabeza caída: el nemes partido por debajo (las alas y las solapas se quedaron en el torso), el gorro rojo entero
    // y un muñón de la corona blanca con un corte oblicuo
    var jag = function (x0, x1, y0, y1, amp, n2) { var v = []; for (var j = 0; j <= n2; j++) { var t = j / n2; v.push(x0 + (x1 - x0) * t + (r() - 0.5) * 0.006, y0 + (y1 - y0) * t + (r() - 0.5) * amp); } return v; };
    var rotaAlas = jag(0.15, -0.15, -0.668, -0.652, 0.014, 8), rotaSolapa = function (l) { return jag(l * 0.105, l * 0.055, -0.62, -0.612, 0.01, 3); };
    c.alasRotas = forma(function (p) { poli(p, [-0.094, -0.765, 0.094, -0.765, 0.125, -0.715, 0.15, -0.676].concat(rotaAlas).concat([-0.15, -0.676, -0.125, -0.715])); });
    c.solapasRotas = forma(function (p) {
      [-1, 1].forEach(function (l) { poli(p, [l * 0.058, -0.72, l * 0.093, -0.752, l * 0.1, -0.68].concat(rotaSolapa(l)).concat([l * 0.054, -0.66])); });
    });
    var munon = [-0.066, -0.853, -0.069, -0.885, -0.062, -0.905, -0.04, -0.912, -0.02, -0.905, -0.004, -0.918, 0.018, -0.9, 0.034, -0.893, 0.052, -0.872, 0.066, -0.868, 0.068, -0.853];
    c.munon = forma(function (p) { poli(p, munon); });
    c.munonRotura = forma(function (p) { poli(p, munon.slice(2, 20).concat([0.052, -0.866, 0.034, -0.887, 0.018, -0.893, -0.004, -0.909, -0.02, -0.897, -0.04, -0.904, -0.06, -0.897, -0.064, -0.88])); });
    c.cabezaRayas = forma(function (p) {
      var i2, y, t, xi, xo;
      for (i2 = 0; i2 < 8; i2++) {
        y = -0.712 + i2 * 0.0128; if (y > -0.63) break;
        t = (y + 0.72) / 0.192; xi = 0.058 - 0.006 * t + 0.002; xo = 0.093 + 0.015 * t - 0.002;
        p.rect(xi, y, xo - xi, 0.0046); p.rect(-xo, y, xo - xi, 0.0046);
      }
      for (i2 = 0; i2 < 3; i2++) { y = -0.752 + i2 * 0.0128; t = (y + 0.765) / 0.148; var xw = 0.094 + 0.096 * Math.pow(t, 0.8) - 0.004, xo2 = (y < -0.74 ? 0.096 : 0.093 + 0.015 * Math.max(0, (y + 0.752) / 0.224)) + 0.003; if (xw > xo2 + 0.004) { p.rect(xo2, y, xw - xo2, 0.0046); p.rect(-xw, y, xw - xo2, 0.0046); } }
      for (i2 = 0; i2 < 4; i2++) { y = -0.797 + i2 * 0.0128; p.rect(0.064, y, 0.03, 0.0046); p.rect(-0.094, y, 0.03, 0.0046); }
    });
    c.roturaCabeza = forma(function (p) {
      poli(p, rotaAlas.concat([-0.15, -0.64, 0.15, -0.64]));
      [-1, 1].forEach(function (l) { poli(p, rotaSolapa(l).concat([l * 0.055, -0.6, l * 0.105, -0.6])); });
    });
    // el torso caído: el pecho con los hombros y los arranques de las solapas y de la barba, partido arriba y abajo
    c.torsoCaido = forma(function (p) {
      var v = [-0.19, -0.617, -0.13, -0.66].concat(jag(-0.12, 0.12, -0.655, 0.01, 8)).concat([0.13, -0.66, 0.19, -0.617, 0.224, -0.615, 0.24, -0.568, 0.238, -0.5])
        .concat(jag(0.236, -0.236, -0.47, 0.016, 12)).concat([-0.238, -0.5, -0.24, -0.568, -0.224, -0.615]);
      poli(p, v);
    });
    c.torsoCaidoDet = forma(function (p) {
      tira(p, [0.172, -0.6, 0.17, -0.5], 0.012); tira(p, [-0.172, -0.6, -0.17, -0.5], 0.006);
      poli(p, [0.052, -0.6, 0.106, -0.6, 0.11, -0.585, 0.056, -0.586]); poli(p, [-0.106, -0.6, -0.052, -0.6, -0.046, -0.586, -0.1, -0.585]);
      for (var j = 0; j < 3; j++) p.rect(-0.022, -0.648 + j * 0.0145, 0.044, 0.0036);
    });
    c.torsoCaidoClaro = forma(function (p) {
      poli(p, jag(-0.12, 0.12, -0.655, -0.655, 0.02, 8).concat([0.12, -0.638, -0.12, -0.638]));
      poli(p, jag(0.236, -0.236, -0.47, -0.47, 0.032, 12).concat([-0.236, -0.455, 0.236, -0.455]));
      elipse(p, -0.215, -0.6, 0.02, 0.012, -0.4);
    });
    c.torsoCaidoGrietas = forma(function (p) { tira(p, [-0.06, -0.64, -0.075, -0.6, -0.068, -0.56, -0.09, -0.5], 0.004, 0.0015); tira(p, [0.15, -0.6, 0.13, -0.56, 0.14, -0.52], 0.003, 0.0012); });
    return (coloso = c);
  }
  // pinta un coloso (en su marco: la base en (0, 0), alto 1); roto = solo lo que queda en pie
  function pintarColoso(x, c, roto) {
    rellena(x, c.trono, lin(x, -0.225, -0.39, 0.225, 0, [[0, AB.luz], [0.45, AB.med], [1, AB.som]]));
    rellena(x, c.hueco, vert(x, -0.33, 0, osc(AB.som, 0.28), osc(AB.som, 0.48)));
    if (roto) rellena(x, c.tronco, cil(x, -0.23, 0.23, AB.luz, 0.18));
    else {
      rellena(x, c.alas, cil(x, -0.19, 0.19, mez(AB.luz, AB.med, 0.55), 0.16));
      rellena(x, c.torso, cil(x, -0.21, 0.21, AB.luz, 0.2));
      rellena(x, c.brazoI, cil(x, -0.241, -0.165, AB.luz, 0.22)); rellena(x, c.brazoD, cil(x, 0.165, 0.241, AB.luz, 0.16));
    }
    rellena(x, c.falda, cil(x, -0.135, 0.135, AB.luz, 0.18));
    rellena(x, c.piernaI, cil(x, -0.13, -0.034, AB.luz, 0.22)); rellena(x, c.piernaD, cil(x, 0.034, 0.13, AB.luz, 0.18));
    rellena(x, c.pies, vert(x, -0.056, 0, acl(AB.luz, 0.06), AB.med));
    rellena(x, c.anteI, cil(x, -0.235, -0.095, AB.luz, 0.2)); rellena(x, c.anteD, cil(x, 0.095, 0.235, AB.luz, 0.16));
    rellena(x, c.manos, vert(x, -0.368, -0.295, acl(AB.luz, 0.16), AB.med));
    if (!roto) {
      rellena(x, c.solapas, cil(x, -0.11, 0.11, mez(AB.luz, AB.med, 0.4), 0.18));
      rellena(x, c.nemes, cil(x, -0.095, 0.095, mez(AB.luz, AB.med, 0.4), 0.16));
      rellena(x, c.cara, cil(x, -0.065, 0.065, acl(AB.luz, 0.06), 0.22, -0.72));
      rellena(x, c.gorro, cil(x, -0.098, 0.098, AB.luz, 0.2));
      rellena(x, c.blanca, cil(x, -0.07, 0.07, acl(AB.luz, 0.04), 0.24));
      rellena(x, c.barba, cil(x, -0.024, 0.024, AB.med, 0.14));
      rellena(x, c.ureo, AB.med);
      rellena(x, c.sombrasArriba, rgba(AB.hondo, 0.3));
      rellena(x, c.lineasArriba, rgba(AB.hondo, 0.45)); rellena(x, c.lineasCara, rgba(AB.hondo, 0.45));
      rellena(x, c.orejas, cil(x, -0.08, 0.08, AB.luz, 0.2));
      rellena(x, c.lucesArriba, rgba(AB.claro, 0.42));
    }
    rellena(x, c.sombrasAbajo, rgba(AB.hondo, 0.3));
    rellena(x, c.lineasAbajo, rgba(AB.hondo, 0.42));
    rellena(x, c.lucesAbajo, rgba(AB.claro, 0.42));
    if (roto) rellena(x, c.filoCorte, rgba(AB.claro, 0.55));
  }
  var CAJA_COLOSO = [-0.245 * AB_K - 0.004, -AB_K - 0.004, 0.245 * AB_K + 0.004, 0.004];
  var CAJA_ROTO = [-0.42 * AB_K, -AB_K - 0.004, 0.32 * AB_K, 0.006];
  function pintorColoso(roto) {
    return function (k) {
      k.save(); k.scale(AB_K, AB_K);
      var c = plantillaColoso();
      pintarColoso(k, c, roto); if (!roto) pintarEstatuillas(k);
      if (roto) pintarCaidos(k, c);
      k.restore();
    };
  }
  var pintorEntero = pintorColoso(false), pintorRoto = pintorColoso(true);

  // ---- las estatuillas de la familia: de pie, de frente; alto 1 hasta la coronilla (las plumas de la reina suben más)
  var estat = null;
  function plantillaEstatuilla() {
    if (estat) return estat;
    var c = {};
    c.cuerpo = forma(function (p) {
      p.moveTo(-0.075, -0.715); p.lineTo(0.075, -0.715);
      p.bezierCurveTo(0.105, -0.71, 0.12, -0.69, 0.117, -0.655); p.bezierCurveTo(0.114, -0.56, 0.1, -0.45, 0.095, -0.4);
      p.bezierCurveTo(0.09, -0.3, 0.077, -0.15, 0.064, -0.05); p.lineTo(0.078, 0); p.lineTo(-0.078, 0); p.lineTo(-0.064, -0.05);
      p.bezierCurveTo(-0.077, -0.15, -0.09, -0.3, -0.095, -0.4); p.bezierCurveTo(-0.1, -0.45, -0.114, -0.56, -0.117, -0.655);
      p.bezierCurveTo(-0.12, -0.69, -0.105, -0.71, -0.075, -0.715); p.closePath();
    });
    c.peluca = forma(function (p) {
      p.moveTo(0, -0.935); p.bezierCurveTo(0.062, -0.935, 0.088, -0.89, 0.088, -0.84); p.lineTo(0.092, -0.655); p.lineTo(0.052, -0.65);
      p.lineTo(0.046, -0.79); p.lineTo(-0.046, -0.79); p.lineTo(-0.052, -0.65); p.lineTo(-0.092, -0.655); p.lineTo(-0.088, -0.84);
      p.bezierCurveTo(-0.088, -0.89, -0.062, -0.935, 0, -0.935); p.closePath();
    });
    c.cara = forma(function (p) { elipse(p, 0, -0.81, 0.044, 0.058); });
    c.plumas = forma(function (p) {
      p.rect(-0.05, -0.97, 0.1, 0.04);
      p.moveTo(-0.034, -0.97); p.bezierCurveTo(-0.045, -1.08, -0.035, -1.18, -0.01, -1.24); p.lineTo(0, -1.24); p.lineTo(0, -0.97); p.closePath();
      p.moveTo(0, -0.97); p.lineTo(0, -1.24); p.lineTo(0.01, -1.24); p.bezierCurveTo(0.035, -1.18, 0.045, -1.08, 0.034, -0.97); p.closePath();
      circulo(p, 0, -1.0, 0.036);
    });
    c.modius = forma(function (p) { poli(p, [-0.045, -0.93, 0.045, -0.93, 0.05, -0.975, -0.05, -0.975]); });
    c.lineas = forma(function (p) {
      tira(p, [-0.03, -0.818, -0.012, -0.82], 0.007); tira(p, [0.012, -0.82, 0.03, -0.818], 0.007);
      tira(p, [-0.012, -0.78, 0.012, -0.78], 0.006);
      p.rect(-0.07, -0.66, 0.14, 0.014);
      tira(p, [-0.095, -0.45, -0.07, -0.41], 0.009); tira(p, [0.095, -0.45, 0.07, -0.41], 0.009);
      for (var i = 0; i < 4; i++) p.rect(-0.088, -0.84 + i * 0.045, 0.034, 0.008), p.rect(0.054, -0.84 + i * 0.045, 0.034, 0.008);
    });
    c.sombra = forma(function (p) {
      p.moveTo(0.02, -0.715); p.lineTo(0.075, -0.715); p.bezierCurveTo(0.105, -0.71, 0.12, -0.69, 0.117, -0.655); p.bezierCurveTo(0.114, -0.56, 0.1, -0.45, 0.095, -0.4);
      p.bezierCurveTo(0.09, -0.3, 0.077, -0.15, 0.064, -0.05); p.lineTo(0.078, 0); p.lineTo(0.03, 0); p.bezierCurveTo(0.04, -0.2, 0.045, -0.5, 0.02, -0.715); p.closePath();
      elipse(p, 0.03, -0.8, 0.014, 0.05);
    });
    c.luz = forma(function (p) { tira(p, [-0.1, -0.66, -0.085, -0.45, -0.07, -0.12], 0.016, 0.01); elipse(p, -0.018, -0.83, 0.012, 0.025); });
    return (estat = c);
  }

  // ---- un babuino de frente que adora al sol con las manos alzadas (alto 1), de una pieza
  var babu = null;
  function plantillaBabuino() {
    if (babu) return babu;
    var c = {};
    c.cuerpo = forma(function (p) {
      p.moveTo(0, -0.97);
      p.quadraticCurveTo(0.13, -0.97, 0.15, -0.84); p.quadraticCurveTo(0.2, -0.76, 0.21, -0.66);   // la cabeza y la melena
      p.lineTo(0.25, -0.7); p.lineTo(0.25, -0.98); p.quadraticCurveTo(0.3, -1.03, 0.35, -0.98);   // el brazo alzado y la mano
      p.lineTo(0.36, -0.62); p.quadraticCurveTo(0.35, -0.5, 0.3, -0.45);
      p.quadraticCurveTo(0.33, -0.3, 0.3, -0.2); p.quadraticCurveTo(0.42, -0.14, 0.42, 0); p.lineTo(-0.42, 0);   // el costado y las ancas
      p.quadraticCurveTo(-0.42, -0.14, -0.3, -0.2); p.quadraticCurveTo(-0.33, -0.3, -0.3, -0.45); p.quadraticCurveTo(-0.35, -0.5, -0.36, -0.62);
      p.lineTo(-0.35, -0.98); p.quadraticCurveTo(-0.3, -1.03, -0.25, -0.98); p.lineTo(-0.25, -0.7); p.lineTo(-0.21, -0.66);
      p.quadraticCurveTo(-0.2, -0.76, -0.15, -0.84); p.quadraticCurveTo(-0.13, -0.97, 0, -0.97); p.closePath();
    });
    c.cara = forma(function (p) { elipse(p, 0, -0.75, 0.075, 0.105); elipse(p, -0.05, -0.86, 0.03, 0.012); elipse(p, 0.05, -0.86, 0.03, 0.012); });
    c.sombra = forma(function (p) { elipse(p, 0.17, -0.3, 0.12, 0.26); elipse(p, 0.25, -0.08, 0.15, 0.08); p.rect(0.3, -0.95, 0.05, 0.3); elipse(p, 0.12, -0.6, 0.08, 0.06); });
    c.luz = forma(function (p) { elipse(p, -0.08, -0.9, 0.06, 0.03); p.rect(-0.35, -0.95, 0.035, 0.3); elipse(p, -0.18, -0.33, 0.06, 0.18); });
    return (babu = c);
  }

  // ---- todo lo de la fachada, en u, hecho una vez
  var abu = null;
  function formasAbu() {
    if (abu) return abu;
    var r = U.azar(1264), c = {}, i, j;
    // el cerro: una loma redondeada con bultos; dentro, los estratos ondulados de la arenisca, sus filos al sol y alguna grieta
    var altoC = function (ax) { return ax < 0.27 ? 0.514 : 0.514 * Math.cos(Math.min(1, (ax - 0.27) / 0.232) * Math.PI / 2); };
    var borde = [];
    for (i = 0; i <= 80; i++) {
      var xx = -0.5 + i / 80, ax = Math.abs(xx);
      var bulto = ax > 0.3 ? (U.fbm(xx * 6.5 + 11, 23, 3) - 0.45) * 0.07 * Math.sin(Math.min(1, (ax - 0.3) / 0.08) * Math.PI / 2) : 0;
      borde.push(xx, Math.min(0, -(altoC(ax) + bulto) + (U.fbm(xx * 38 + 3, 31, 2) - 0.5) * 0.008));
    }
    borde[1] = 0; borde[161] = 0;
    // los flancos y la franja de arriba: el cerro menos la fachada (lo que se ve de él)
    c.flancos = forma(function (p) { poli(p, borde.concat([0.339, 0, 0.316, -0.493, -0.316, -0.493, -0.339, 0])); });
    // dónde está el borde del cerro a la altura y, por un lado (lado = −1, desde el pie izquierdo; 1, desde el derecho)
    var nB = borde.length / 2 - 1;
    function bordeEn(y, lado) {
      for (var q = 0; q < nB / 2; q++) {
        var a = lado < 0 ? q : nB - q, b = lado < 0 ? q + 1 : nB - q - 1, ya2 = borde[2 * a + 1], yb2 = borde[2 * b + 1];
        if (ya2 <= y) return borde[2 * a];
        if (yb2 <= y) return borde[2 * a] + (borde[2 * b] - borde[2 * a]) * (y - ya2) / (yb2 - ya2);
      }
      return lado * 0.3;
    }
    function bordeY(xq) { var t = (xq + 0.5) * nB, a = Math.max(0, Math.min(nB - 1, Math.floor(t))); return borde[2 * a + 1] + (borde[2 * a + 3] - borde[2 * a + 1]) * (t - a); }
    // los estratos: tiras onduladas que van del corte de la fachada al borde del cerro, sin salirse (sin recortes, que cuestan)
    c.estratosOsc = new Path2D(); c.estratosClr = new Path2D(); c.filos = new Path2D(); c.bajos = new Path2D(); c.grietas = new Path2D(); c.bultos = new Path2D();
    var yk = -0.5;
    while (yk < -0.006) {
      var hk = 0.014 + r() * 0.03, yk2 = Math.min(-0.001, yk + hk), fase = r() * 9, tono = r();
      for (var lado = -1; lado <= 1; lado += 2) {
        var xa = Math.abs(bordeEn(yk, lado)) - 0.004, xb = Math.abs(bordeEn(yk2, lado)) - 0.004, fa = abFachX(yk) - 0.012, fb = abFachX(yk2) - 0.012;
        if (xa < fa + 0.012) continue;
        var arriba = [], abajo = [], m = 9, j2;
        for (j2 = 0; j2 <= m; j2++) {
          var t = j2 / m, ond = Math.sin(t * Math.PI) * (Math.sin(t * 7 + fase) * 0.003 + (U.fbm(t * 4 + fase, 41, 2) - 0.5) * 0.007);
          arriba.push(lado * (fa + (xa - fa) * t), yk + ond);
          abajo.unshift(lado * (fb + (xb - fb) * t), yk2 + Math.sin(t * Math.PI) * Math.sin(t * 6 + fase + 1) * 0.0025);
        }
        var pol = arriba.concat(abajo);
        if (tono < 0.33) poli(c.estratosOsc, pol); else if (tono > 0.7) poli(c.estratosClr, pol);
        // el filo de arriba al sol (en el flanco izquierdo, entero; en el derecho, a trozos) y la sombra bajo la capa de encima
        var desde = lado < 0 ? 0 : 3 + Math.floor(r() * 3), hasta = lado < 0 ? 10 : 8;
        if (r() < 0.8) tira(c.filos, arriba.slice(2 * desde, 2 * hasta), 0.003, 0.0012);
        if (r() < 0.55) tira(c.bajos, arriba.slice(2, 16).map(function (v, k) { return k % 2 ? v - 0.0035 : v; }), 0.0035, 0.0015);
        if (r() < 0.45) { var gt = 0.2 + r() * 0.6, gx = lado * (fa + (xa - fa) * gt); tira(c.grietas, [gx, yk + 0.004, gx + (r() - 0.5) * 0.008, yk2 - 0.002], 0.003, 0.0012); }
      }
      yk = yk2;
    }
    // bultos de roca, al sol en el flanco izquierdo y en sombra en el derecho
    for (i = 0; i < 12; i++) {
      var lb = -1, bx2 = lb * (0.36 + r() * 0.1), ry2 = 0.012 + r() * 0.01, rx2 = 0.025 + r() * 0.02, by2 = -0.05 - r() * 0.3;
      if (bordeY(bx2 - rx2) > by2 - ry2 - 0.012 || bordeY(bx2 + rx2) > by2 - ry2 - 0.012 || Math.abs(bx2) - rx2 < abFachX(by2) + 0.005) continue;
      elipse(c.bultos, bx2, by2, rx2, ry2, (r() - 0.5) * 0.5);
    }
    // piedras sueltas sobre el borde de arriba, por encima de la fachada
    c.piedrasArriba = new Path2D(); c.piedrasArribaLuz = new Path2D();
    [-0.27, -0.19, -0.1, -0.02, 0.07, 0.15, 0.23, 0.29].forEach(function (px, k) {
      var py = bordeY(px), rx3 = 0.01 + r() * 0.012, ry3 = 0.004 + r() * 0.003, cy3 = Math.max(-0.52 + ry3, py + ry3 * 0.4);
      elipse(c.piedrasArriba, px, cy3, rx3, ry3, (r() - 0.5) * 0.3);
      elipse(c.piedrasArribaLuz, px - rx3 * 0.3, cy3 - ry3 * 0.4, rx3 * 0.45, ry3 * 0.35);
    });
    // bloques caídos al pie, medio enterrados en la arena
    c.bloques = new Path2D(); c.bloquesLuz = new Path2D();
    [[-0.455, 0.03], [-0.415, 0.02], [-0.375, 0.016], [0.39, 0.018], [0.43, 0.026], [0.462, 0.02]].forEach(function (b) {
      var v = [], v2 = [], rr = b[1];
      for (var q = 0; q < 9; q++) { var an = Math.PI + q * Math.PI / 8, k = 0.85 + r() * 0.25; v.push(b[0] + Math.cos(an) * rr * 1.3 * k, -0.004 + Math.sin(an) * rr * k); }
      poli(c.bloques, v);
      elipse(c.bloquesLuz, b[0] - rr * 0.35, -rr * 0.6, rr * 0.5, rr * 0.2, -0.3);
    });
    // la arena amontonada a los dos pies del cerro: en el borde de la pieza no acaba en escalón, se derrama hasta el suelo
    c.arena = forma(function (p) {
      p.moveTo(-0.5, 0); p.bezierCurveTo(-0.5 + REMATE * 0.45, 0, -0.5 + REMATE * 0.7, -0.023, -0.45, -0.023);
      p.bezierCurveTo(-0.43, -0.023, -0.405, -0.01, -0.35, 0); p.closePath();
      p.moveTo(0.352, 0); p.bezierCurveTo(0.395, -0.009, 0.425, -0.029, 0.45, -0.03);
      p.bezierCurveTo(0.5 - REMATE * 0.7, -0.03, 0.5 - REMATE * 0.45, 0, 0.5, 0); p.closePath();
    });
    // la fachada alisada: un rectángulo (que se pinta deprisa) y dos cuñas a los lados, solapadas un poco
    c.fachadaCunas = forma(function (p) { poli(p, [-0.339, 0, -0.316, -0.493, -0.31, -0.493, -0.31, 0]); poli(p, [0.31, -0.493, 0.316, -0.493, 0.339, 0, 0.31, 0]); });
    c.paredI = forma(function (p) { poli(p, [-0.33, -0.497, -0.316, -0.493, -0.339, 0, -0.354, 0]); });
    c.paredD = forma(function (p) { poli(p, [0.316, -0.493, 0.33, -0.497, 0.354, 0, 0.339, 0]); });
    c.toroI = forma(function (p) { poli(p, [-0.3165, -0.459, -0.3055, -0.459, -0.3275, 0, -0.3385, 0]); });
    c.toroD = forma(function (p) { poli(p, [0.3055, -0.459, 0.3165, -0.459, 0.3385, 0, 0.3275, 0]); });
    c.cintas = new Path2D();
    for (i = 0; i < 62; i++) {   // la cinta enrollada de los toros (rayitas)
      var vy = -0.455 + i * 0.0073, xl = abFachX(vy) - 0.0005;
      c.cintas.rect(-xl + 0.002, vy, 0.007, 0.0024); c.cintas.rect(xl - 0.009, vy, 0.007, 0.0024);
    }
    c.cintasArriba = new Path2D(); for (i = 0; i < 88; i++) c.cintasArriba.rect(-0.314 + i * 0.0072, -0.426, 0.0024, 0.0066);
    // las bandas de la arenisca: tiras casi horizontales dentro de la fachada (por debajo de la banda de la dedicatoria),
    // que dejan libres la puerta y el nicho
    c.bandasOsc = new Path2D(); c.bandasClr = new Path2D();
    for (i = 0; i < 30; i++) {
      var yb2 = -0.04 - r() * 0.34, gb = 0.003 + r() * 0.012, tramos = yb2 > -0.33 && yb2 < -0.03 ? [[-abFachX(yb2) + 0.004, -0.037], [0.037, abFachX(yb2) - 0.004]] : [[-abFachX(yb2) + 0.004, abFachX(yb2) - 0.004]];
      if (yb2 > -0.13) tramos = tramos.map(function (tr) { return tr[1] < 0 ? [tr[0], -0.205] : tr; });   // (ni la cabeza ni el torso caídos)
      var destino = r() < 0.55 ? c.bandasOsc : c.bandasClr, fase = r() * 6;
      tramos.forEach(function (tr) {
        var arriba = [], abajo = [], m = Math.max(2, Math.round((tr[1] - tr[0]) / 0.06));
        for (var q = 0; q <= m; q++) {
          var xb = tr[0] + (tr[1] - tr[0]) * q / m, ob = Math.sin(xb * 11 + fase) * 0.003, gg = gb * (0.5 + 0.5 * Math.sin(xb * 7 + fase * 2) * Math.sin(xb * 7 + fase * 2));
          arriba.push(xb, yb2 + ob); abajo.unshift(xb, yb2 + ob + gg + 0.0008);
        }
        poli(destino, arriba.concat(abajo));
      });
    }
    // la terraza y la escalera del centro
    c.escalones = forma(function (p) { for (var k = 1; k < 5; k++) { var ye = -AB_BASE + k * AB_BASE / 5, w = 0.032 + k * 0.004; p.rect(-w, ye - 0.0016, 2 * w, 0.0028); } });
    c.escalera = forma(function (p) { poli(p, [-0.032, -AB_BASE, 0.032, -AB_BASE, 0.052, 0, -0.052, 0]); });
    // arriba: la gola (con sus hojas), el toro con su cinta, la banda de la dedicatoria y sus cartuchos
    c.hojas = new Path2D();
    for (i = 0; i < 70; i++) c.hojas.rect(-0.311 + i * 0.622 / 69 - 0.0018, -0.457, 0.0036, 0.025);
    c.cartuchos = new Path2D(); c.cartuchosHueco = new Path2D();
    [-0.27, -0.15, 0.15, 0.27].forEach(function (cx) {
      c.cartuchos.rect(cx - 0.032, -0.414, 0.064, 0.022);
      c.cartuchosHueco.moveTo(cx - 0.022, -0.411); c.cartuchosHueco.lineTo(cx + 0.022, -0.411); c.cartuchosHueco.arc(cx + 0.022, -0.403, 0.008, -Math.PI / 2, Math.PI / 2);
      c.cartuchosHueco.lineTo(cx - 0.022, -0.395); c.cartuchosHueco.arc(cx - 0.022, -0.403, 0.008, Math.PI / 2, Math.PI * 1.5); c.cartuchosHueco.closePath();
    });
    c.cartuchosRaya = new Path2D();
    [-0.27, -0.15, 0.15, 0.27].forEach(function (cx) { c.cartuchosRaya.rect(cx - 0.031, -0.4095, 0.0028, 0.013); c.cartuchosRaya.rect(cx + 0.028, -0.4095, 0.0028, 0.013); });
    // los signos de la dedicatoria: desde el centro hacia los lados (los de la izquierda miran al otro lado) y el sol de Ra
    // al principio de cada cartucho (los dos nombres de Ramsés II empiezan por Ra)
    var frase1 = frase(1264, 12), signos = [];
    for (i = 0; i < 11; i++) {
      var dx = 0.03 + i * 0.0245;
      if (Math.abs(dx - 0.15) < 0.042 || Math.abs(dx - 0.27) < 0.042) continue;
      signos.push([frase1[i], dx, -0.3935, false], [frase1[i], -dx, -0.3935, true]);
    }
    [0.15, 0.27].forEach(function (cx) { signos.push(['𓇳', cx - 0.016, -0.396, false], ['𓇳', -cx + 0.016, -0.396, true]); });
    c.signos = signos;
    // los 22 babuinos en su repisa
    var B = plantillaBabuino();
    c.babCuerpo = new Path2D(); c.babCara = new Path2D(); c.babSombra = new Path2D(); c.babLuz = new Path2D();
    for (i = 0; i < 22; i++) {
      var bx = -0.296 + i * 0.592 / 21;
      poner(c.babCuerpo, B.cuerpo, bx, -0.459, 0.032); poner(c.babCara, B.cara, bx, -0.459, 0.032); poner(c.babSombra, B.sombra, bx, -0.459, 0.032); poner(c.babLuz, B.luz, bx, -0.459, 0.032);
    }
    // la puerta: el marco con su dintel, el hueco y dentro la sala en penumbra hasta el santuario
    c.dintel = forma(function (p) { poli(p, [-0.038, -0.193, 0.038, -0.193, 0.035, -0.175, -0.035, -0.175]); });
    c.sala = forma(function (p) { poli(p, [-0.022, -0.158, 0.022, -0.158, 0.008, -0.112, 0.008, -0.072, -0.008, -0.072, -0.008, -0.112]); });
    c.suelo = forma(function (p) { poli(p, [-0.022, -0.035, 0.022, -0.035, 0.008, -0.072, -0.008, -0.072]); });
    c.pilares = forma(function (p) { poli(p, [-0.02, -0.15, -0.014, -0.13, -0.014, -0.06, -0.02, -0.045]); poli(p, [0.014, -0.13, 0.02, -0.15, 0.02, -0.045, 0.014, -0.06]); });
    c.jambasRelieve = new Path2D();
    for (i = 0; i < 5; i++) { c.jambasRelieve.rect(-0.031, -0.168 + i * 0.026, 0.0065, 0.016); c.jambasRelieve.rect(0.0245, -0.168 + i * 0.026, 0.0065, 0.016); }
    // el nicho de Ra-Horajti: de frente, con la cabeza de halcón y el gran disco; a un lado el cetro user, al otro Maat
    c.nichoGola = forma(function (p) { poli(p, [-0.035, -0.318, 0.035, -0.318, 0.032, -0.304, -0.032, -0.304]); });
    var dz = 0.0016;
    c.dios = forma(function (p) {
      // (en u: el dios mide unos 0,07 de los pies a la coronilla, de pie en el suelo del nicho, y = −0,2)
      var b = -0.2, k = 0.07;
      function q(xx, yy) { return [xx * k, b + yy * k]; }
      var v = [];
      [[-0.07, 0], [-0.075, -0.05], [-0.075, -0.4], [-0.15, -0.44], [-0.17, -0.72], [-0.13, -0.78], [-0.1, -0.84], [-0.11, -0.95], [-0.06, -1.01], [0, -1.02],
        [0.06, -1.01], [0.11, -0.95], [0.1, -0.84], [0.13, -0.78], [0.17, -0.72], [0.15, -0.44], [0.075, -0.4], [0.075, -0.05], [0.07, 0]].forEach(function (pt) { v.push.apply(v, q(pt[0], pt[1])); });
      poli(p, v);
    });
    c.diosFalda = forma(function (p) { poli(p, [-0.13 * 0.07, -0.2 - 0.6 * 0.07, 0.13 * 0.07, -0.2 - 0.6 * 0.07, 0.15 * 0.07, -0.2 - 0.4 * 0.07, -0.15 * 0.07, -0.2 - 0.4 * 0.07]); });
    c.diosPeluca = forma(function (p) { var k = 0.07, b = -0.2; poli(p, [-0.11 * k, b - 0.98 * k, 0.11 * k, b - 0.98 * k, 0.12 * k, b - 0.74 * k, 0.07 * k, b - 0.74 * k, 0.05 * k, b - 0.84 * k, -0.05 * k, b - 0.84 * k, -0.07 * k, b - 0.74 * k, -0.12 * k, b - 0.74 * k]); });
    c.diosPico = forma(function (p) { var k = 0.07, b = -0.2; poli(p, [-0.035 * k, b - 0.9 * k, 0.035 * k, b - 0.9 * k, 0.012 * k, b - 0.8 * k, 0, b - 0.78 * k]); elipse(p, -0.055 * k, b - 0.92 * k, 0.022 * k, 0.016 * k); elipse(p, 0.055 * k, b - 0.92 * k, 0.022 * k, 0.016 * k); });
    c.diosPiernas = forma(function (p) { var k = 0.07, b = -0.2; p.rect(-0.006 * k, b - 0.4 * k, 0.012 * k, 0.4 * k); });
    c.disco = forma(function (p) { circulo(p, 0, -0.2 - 1.17 * 0.07, 0.16 * 0.07); });
    c.ureoDisco = forma(function (p) { var k = 0.07, b = -0.2; elipse(p, 0, b - 1.02 * k, 0.03 * k, 0.045 * k); });
    c.uas = forma(function (p) {
      tira(p, [-0.019, -0.296, -0.019, -0.201], 0.0026);
      poli(p, [-0.0205, -0.296, -0.012, -0.302, -0.014, -0.295, -0.017, -0.291]);
      poli(p, [-0.0215, -0.204, -0.019, -0.199, -0.0165, -0.204, -0.0175, -0.2, -0.0205, -0.2]);
    });
    c.maat = forma(function (p) { elipse(p, 0.019, -0.212, 0.0052, 0.011); circulo(p, 0.0192, -0.227, 0.0038); poli(p, [0.018, -0.231, 0.0195, -0.231, 0.0225, -0.249, 0.0208, -0.249]); p.rect(0.0135, -0.203, 0.011, 0.003); });
    c.reyes = new Path2D(); var rey = figura('ofrenda', 'hombre', 'blanca');
    poner(c.reyes, rey, -0.06, -0.266, 0.056); poner(c.reyes, rey, 0.06, -0.266, 0.056, true);
    c.dz = dz;
    // las sombras que arrojan los colosos sobre la fachada (hacia la derecha y abajo)
    var K = plantillaColoso();
    c.sombrasColosos = new Path2D();
    for (i = 0; i < 4; i++) poner(c.sombrasColosos, i === 1 ? K.troncoSil : K.sil, AB_CX[i] + 0.009, -AB_BASE + 0.002, AB_K);
    // la huella del roto en la roca: la silueta de lo que se cayó, rehundida y áspera, desde la rotura hasta la corona
    var hu = [], cx1 = AB_CX[1];
    for (i = 0; i < K.corte.length; i += 2) hu.push(cx1 + K.corte[i] * AB_K * 0.96, -AB_BASE + (K.corte[i + 1] - 0.004) * AB_K);
    var contorno = [[0.235, -0.52], [0.236, -0.58], [0.205, -0.62], [0.17, -0.65], [0.125, -0.72], [0.098, -0.765], [0.1, -0.86], [0.07, -0.87], [0.05, -0.95], [0.02, -0.99],
      [-0.02, -0.99], [-0.05, -0.95], [-0.07, -0.87], [-0.1, -0.86], [-0.098, -0.765], [-0.125, -0.72], [-0.17, -0.65], [-0.205, -0.62], [-0.236, -0.58], [-0.235, -0.52]];
    contorno.forEach(function (pt) { hu.push(cx1 + (pt[0] + (r() - 0.5) * 0.02) * AB_K, -AB_BASE + (pt[1] + (r() - 0.5) * 0.016) * AB_K); });
    c.huella = forma(function (p) { poli(p, hu); });
    // (la de dentro: la misma huella encogida un poco hacia abajo a la derecha, para que quede un filo de sombra arriba a la izquierda)
    var cxh = 0, cyh = 0; for (i = 0; i < hu.length; i += 2) { cxh += hu[i]; cyh += hu[i + 1]; } cxh /= hu.length / 2; cyh /= hu.length / 2;
    c.huellaDentro = forma(function (p) { poli(p, hu.map(function (v, k) { return k % 2 ? cyh + (v - cyh) * 0.96 + 0.004 : cxh + (v - cxh) * 0.92 + 0.004; })); });
    c.huellaPicado = new Path2D();
    for (i = 0; i < 26; i++) {
      var hx = cx1 + (r() - 0.5) * 0.12, hy = -AB_BASE - (0.47 + r() * 0.48) * AB_K, rr = 0.003 + r() * 0.006;
      if (Math.abs(hx - cx1) > 0.07 - (hy + 0.25) * 0.2) continue;
      poli(c.huellaPicado, [hx - rr, hy, hx - rr * 0.2, hy - rr * 0.8, hx + rr, hy - rr * 0.3, hx + rr * 0.4, hy + rr * 0.7]);
    }
    // la cabeza y el torso caídos (en u, ya colocados): se pintan con las piezas de la plantilla
    return (abu = c);
  }

  function pintorFrisoAbu(x) {
    var c = formasAbu();
    // la repisa de los babuinos, bajo el voladizo de la roca, y los babuinos
    x.fillStyle = vert(x, -0.495, -0.459, AB.oscuro, AB.som); x.fillRect(-0.316, -0.495, 0.632, 0.036);
    rellena(x, c.babCuerpo, vert(x, -0.492, -0.459, acl(AB.luz, 0.1), AB.med));
    rellena(x, c.babSombra, rgba(AB.hondo, 0.3)); rellena(x, c.babLuz, rgba(AB.claro, 0.4)); rellena(x, c.babCara, rgba(AB.hondo, 0.45));
    // la cornisa: la gola con sus hojas, el toro con su cinta; la banda de la dedicatoria con sus cartuchos y sus signos
    x.fillStyle = vert(x, -0.459, -0.43, acl(AB.luz, 0.22), AB.som); x.fillRect(-0.316, -0.459, 0.632, 0.03);
    rellena(x, c.hojas, rgba(AB.hondo, 0.2));
    x.fillStyle = vert(x, -0.429, -0.42, AB.claro, AB.som); x.fillRect(-0.316, -0.429, 0.632, 0.009);
    x.fillStyle = vert(x, -0.42, -0.386, AB.luz, AB.med); x.fillRect(-0.312, -0.42, 0.624, 0.034);
    rellena(x, c.cartuchosHueco, rgba(AB.hondo, 0.1)); rellena(x, c.cartuchosRaya, rgba(AB.hondo, 0.25));
    rellena(x, c.cintasArriba, rgba(AB.hondo, 0.22));
  }
  function pintorNichoAbu(x) {
    var c = formasAbu();
    // el nicho de Ra-Horajti (con el cetro user y Maat) y los dos reyes que le ofrecen a Maat
    x.fillStyle = cil(x, -0.032, 0.032, AB.luz, 0.12); x.fillRect(-0.032, -0.306, 0.064, 0.112);
    rellena(x, c.nichoGola, vert(x, -0.318, -0.304, AB.claro, AB.som));
    x.fillStyle = vert(x, -0.3, -0.198, AB.oscuro, AB.som); x.fillRect(-0.026, -0.3, 0.052, 0.102);
    x.save(); x.translate(c.dz, c.dz); rellena(x, c.dios, rgba(AB.hondo, 0.5)); x.restore();
    rellena(x, c.dios, cil(x, -0.012, 0.012, AB.luz, 0.22));
    rellena(x, c.diosFalda, rgba(AB.claro, 0.35)); rellena(x, c.diosPeluca, rgba(AB.som, 0.8)); rellena(x, c.diosPico, rgba(AB.hondo, 0.55));
    rellena(x, c.diosPiernas, rgba(AB.hondo, 0.3));
    rellena(x, c.disco, ES.rad(x, -0.0004, -0.282, 0, 0.012, [[0, mez(AB.luz, P.cornalina, 0.3)], [1, mez(AB.som, P.cornalina, 0.35)]], -0.003, -0.286));
    rellena(x, c.ureoDisco, AB.med);
    rellena(x, c.uas, mez(AB.luz, AB.med, 0.3)); rellena(x, c.maat, mez(AB.luz, AB.med, 0.3));
    relieve(x, c.reyes, 0.0009, rgba(mez(AB.luz, AB.med, 0.5), 1), AB.claro, AB.hondo, false, 0.6, 0.45);
  }
  function dibujarAbuSimbel(x, X, Y, s, op) {
    var c = formasAbu(), i; PFX = x;
    x.save(); x.translate(X, Y); x.scale(s, s);
    marca('cerro');
    // el cerro de arenisca: la loma, sus estratos, filos y grietas (dentro de lo que se ve de ella)
    rellena(x, c.flancos, lin(x, -0.5, -0.35, 0.5, 0.05, [[0, AB.rocaL], [0.36, AB.roca], [0.64, mez(AB.roca, AB.rocaS, 0.55)], [1, AB.rocaS]]));
    rellena(x, c.estratosOsc, rgba(AB.rocaS, 0.2)); rellena(x, c.estratosClr, rgba(AB.rocaL, 0.28));
    rellena(x, c.bultos, rgba(acl(AB.rocaL, 0.2), 0.2));
    rellena(x, c.bajos, rgba(osc(AB.rocaS, 0.3), 0.35)); rellena(x, c.filos, rgba(acl(AB.rocaL, 0.4), 0.5));
    rellena(x, c.grietas, rgba(osc(AB.rocaS, 0.45), 0.35));
    rellena(x, c.bloques, lin(x, -0.5, -0.05, 0.5, 0, [[0, AB.rocaL], [0.5, AB.roca], [1, AB.rocaS]])); rellena(x, c.bloquesLuz, rgba(acl(AB.rocaL, 0.3), 0.4));
    rellena(x, c.piedrasArriba, lin(x, -0.3, -0.52, 0.3, -0.5, [[0, AB.rocaL], [0.5, AB.roca], [1, AB.rocaS]])); rellena(x, c.piedrasArribaLuz, rgba(acl(AB.rocaL, 0.3), 0.45));
    rellena(x, c.arena, vert(x, -0.03, 0, acl(P.arena, 0.14), P.arena2));
    marca('fachada');
    // la fachada alisada y las paredes del corte (la izquierda, en sombra; la derecha, al sol)
    rellena(x, c.paredI, osc(AB.rocaS, 0.22)); rellena(x, c.paredD, acl(AB.roca, 0.12));
    var gF = lin(x, -0.34, -0.45, 0.34, -0.05, [[0, mez(AB.luz, AB.med, 0.2)], [0.5, mez(AB.luz, AB.med, 0.5)], [1, AB.med]]);
    x.fillStyle = gF; x.fillRect(-0.311, -0.493, 0.622, 0.493); rellena(x, c.fachadaCunas, gF);
    // la huella del roto
    rellena(x, c.huella, rgba(mez(AB.som, AB.hondo, 0.3), 1));
    rellena(x, c.huellaDentro, lin(x, -0.16, -0.36, -0.06, -0.16, [[0, mez(AB.luz, AB.med, 0.5)], [1, mez(AB.med, AB.som, 0.5)]]));
    rellena(x, c.huellaPicado, rgba(AB.hondo, 0.2));
    marca('arriba');
    // la franja de arriba (los babuinos, la cornisa, la banda de la dedicatoria y sus signos), como sello
    sello(x, 'abu-arriba', [-0.32, -0.497, 0.32, -0.384], pintorFrisoAbu, 0, 0);
    tallarLista(x, s, formasAbu().signos, 0.019, AB.hondo, AB.claro, 0.55);   // (la letra, siempre aparte de los sellos)
    // los toros de las esquinas, con su cinta
    rellena(x, c.toroI, cil(x, -0.339, -0.305, AB.luz, 0.22)); rellena(x, c.toroD, cil(x, 0.305, 0.339, AB.luz, 0.2));
    rellena(x, c.cintas, rgba(AB.hondo, 0.22));
    marca('puerta');
    // la puerta: el marco, el dintel con su gola, el hueco y la sala en penumbra
    x.fillStyle = cil(x, -0.034, 0.034, AB.luz, 0.14); x.fillRect(-0.034, -0.178, 0.068, 0.143);
    rellena(x, c.jambasRelieve, rgba(AB.hondo, 0.16));
    rellena(x, c.dintel, vert(x, -0.193, -0.175, AB.claro, AB.som));
    x.fillStyle = vert(x, -0.158, -0.035, osc(AB.hondo, 0.6), osc(AB.hondo, 0.45)); x.fillRect(-0.022, -0.158, 0.044, 0.123);
    rellena(x, c.sala, rgba(osc(AB.hondo, 0.35), 0.85)); rellena(x, c.suelo, rgba(osc(AB.hondo, 0.25), 0.6));
    rellena(x, c.pilares, rgba(AB.hondo, 0.5));
    x.fillStyle = rgba(osc(AB.hondo, 0.75), 1); x.fillRect(-0.0075, -0.106, 0.015, 0.034);
    marca('nicho');
    sello(x, 'abu-nicho', [-0.092, -0.345, 0.092, -0.188], pintorNichoAbu, 0, 0);
    marca('sombrasColosos');
    rellena(x, c.sombrasColosos, rgba(AB.hondo, 0.17));
    marca('colosos');
    for (i = 0; i < 4; i++) sello(x, i === 1 ? 'abu-roto' : 'abu-coloso', i === 1 ? CAJA_ROTO : CAJA_COLOSO, i === 1 ? pintorRoto : pintorEntero, AB_CX[i], -AB_BASE);
    marca('bandas');
    rellena(x, c.bandasOsc, rgba(mez(AB.som, P.rojo, 0.22), 0.14)); rellena(x, c.bandasClr, rgba(acl(P.arena, 0.25), 0.18));
    marca('terraza');
    x.fillStyle = vert(x, -AB_BASE, 0, AB.luz, AB.som); x.fillRect(-0.354, -AB_BASE, 0.708, AB_BASE);
    rellena(x, c.escalera, vert(x, -AB_BASE, 0, acl(AB.luz, 0.12), AB.med)); rellena(x, c.escalones, rgba(AB.hondo, 0.3));
    x.fillStyle = rgba(AB.claro, 0.75); x.fillRect(-0.354, -AB_BASE, 0.708, 0.0045);
    marca('fin');
    x.restore();
  }
  var estatCache = null;
  function pintarEstatuillas(x) {
    var E = plantillaEstatuilla(), cache = estatCache;
    if (!cache) {
      cache = estatCache = { cuerpo: new Path2D(), peluca: new Path2D(), cara: new Path2D(), plumas: new Path2D(), modius: new Path2D(), lineas: new Path2D(), sombra: new Path2D(), luz: new Path2D() };
      [[0, 0.25, false], [-0.175, 0.33, true], [0.175, 0.31, true]].forEach(function (e) {
        ['cuerpo', 'peluca', 'cara', 'lineas', 'sombra', 'luz'].forEach(function (n) { poner(cache[n], E[n], e[0], 0, e[1]); });
        poner(e[2] ? cache.plumas : cache.modius, e[2] ? E.plumas : E.modius, e[0], 0, e[1]);
      });
    }
    rellena(x, cache.cuerpo, vert(x, -0.33, 0, acl(AB.luz, 0.1), AB.med));
    rellena(x, cache.plumas, vert(x, -0.41, -0.3, acl(AB.luz, 0.06), AB.med)); rellena(x, cache.modius, AB.med);
    rellena(x, cache.peluca, osc(AB.med, 0.06));
    rellena(x, cache.cara, AB.luz);
    rellena(x, cache.sombra, rgba(AB.hondo, 0.26));
    rellena(x, cache.lineas, rgba(AB.hondo, 0.34));
    rellena(x, cache.luz, rgba(AB.claro, 0.4));
  }
  // la cabeza y el torso del roto, caídos a sus pies sobre la terraza (en unidades de coloso, dentro de su sello)
  function pintarCaidos(x, K) {
    // el torso, inclinado, delante de la pierna izquierda
    x.save(); x.translate(-0.13, -0.075); x.rotate(0.3); x.translate(0, 0.56);
    rellena(x, K.torsoCaido, cil(x, -0.24, 0.24, AB.luz, 0.24));
    rellena(x, K.torsoCaidoDet, rgba(AB.hondo, 0.36)); rellena(x, K.torsoCaidoGrietas, rgba(AB.hondo, 0.4));
    rellena(x, K.torsoCaidoClaro, rgba(AB.claro, 0.55));
    x.restore();
    // la cabeza, tumbada y ladeada, delante de la pierna derecha
    x.save(); x.translate(0.11, -0.16); x.rotate(-0.42); x.translate(0, 0.72);
    rellena(x, K.alasRotas, cil(x, -0.17, 0.17, mez(AB.luz, AB.med, 0.55), 0.16));
    rellena(x, K.solapasRotas, cil(x, -0.11, 0.11, mez(AB.luz, AB.med, 0.4), 0.18));
    rellena(x, K.nemes, cil(x, -0.095, 0.095, mez(AB.luz, AB.med, 0.4), 0.16));
    rellena(x, K.cara, cil(x, -0.065, 0.065, acl(AB.luz, 0.06), 0.22, -0.72));
    rellena(x, K.munon, cil(x, -0.07, 0.07, acl(AB.luz, 0.04), 0.24));
    rellena(x, K.gorro, cil(x, -0.098, 0.098, AB.luz, 0.2));
    rellena(x, K.barba, cil(x, -0.024, 0.024, AB.med, 0.14));
    rellena(x, K.cabezaRayas, rgba(AB.hondo, 0.45));
    rellena(x, K.lineasCara, rgba(AB.hondo, 0.45));
    rellena(x, K.orejas, cil(x, -0.08, 0.08, AB.luz, 0.2));
    rellena(x, K.roturaCabeza, rgba(AB.claro, 0.55)); rellena(x, K.munonRotura, rgba(AB.claro, 0.6));
    x.restore();
  }

  AE.arte.abuSimbel = { ancho: 1.0, alto: 0.52, abajo: 0, dibujar: dibujarAbuSimbel,
    preparar: function () { plantillaColoso(); plantillaEstatuilla(); plantillaBabuino(); formasAbu(); } };
  // la puerta (el hueco oscuro, en u respecto al ancla): por ahí entra el sol hasta el santuario
  AE.arte.abuSimbel.puerta = { dx: 0, dy: -(AB_BASE + 0.123 / 2), w: 0.044, h: 0.123 };

  /* ======================================================================= comunes de la arquitectura */
  // una torre de pilono vista de frente: el muro con talud, el toro en las aristas y bajo la gola, y la gola con sus hojas.
  // x0, x1: el pie de la torre; yb: la base; yt: lo alto del muro; t: lo que entra cada lado arriba; g: alto de la gola
  function formasTorre(c, x0, x1, yb, yt, t, g) {
    var vuelo = g * 0.22, xa = x0 + t, xb = x1 - t, i;
    poli(c.cara, [x0, yb, x1, yb, xb, yt, xa, yt]);
    // el toro: una moldura redonda por las aristas y bajo la gola
    var tg = g * 0.2;
    poli(c.toro, [x0, yb, x0 + tg, yb, xa + tg, yt, xa, yt]); poli(c.toro, [x1 - tg, yb, x1, yb, xb, yt, xb - tg, yt]);
    c.toroArriba.rect(xa - 0.001, yt - tg, xb - xa + 0.002, tg);
    // la gola, con sus hojas verticales y el filete de arriba
    c.gola.rect(xa - vuelo, yt - tg - g, xb - xa + 2 * vuelo, g);
    var n = Math.round((xb - xa + 2 * vuelo) / (g * 0.3));
    for (i = 0; i <= n; i++) { var hx = xa - vuelo + (xb - xa + 2 * vuelo) * i / n; c.hojas.rect(hx - g * 0.05, yt - tg - g * 0.92, g * 0.1, g * 0.78); }
    c.filete.rect(xa - vuelo - 0.001, yt - tg - g - g * 0.14, xb - xa + 2 * vuelo + 0.002, g * 0.14);
    // la sombra que la gola echa sobre el muro, y el filo en sombra de la derecha
    poli(c.sombraGola, [xa, yt, xb, yt, xb + t * 0.08, yt + g * 0.45, xa + t * 0.08, yt + g * 0.45]);
    poli(c.filoDer, [x1 - tg * 0.6, yb, x1, yb, xb, yt, xb - tg * 0.6, yt]);
  }
  function torres() { return { cara: new Path2D(), toro: new Path2D(), toroArriba: new Path2D(), gola: new Path2D(), hojas: new Path2D(), filete: new Path2D(), sombraGola: new Path2D(), filoDer: new Path2D() }; }
  function pintarTorres(x, c, T, x0, x1, y0, y1) {
    // T: { luz, med, som, hondo, claro }
    rellena(x, c.cara, lin(x, x0, y0, x1, y1, [[0, acl(T.luz, 0.08)], [0.5, T.luz], [1, mez(T.luz, T.med, 0.7)]]));
    rellena(x, c.sombraGola, lin(x, 0, y0, 0, y0 + 0.03, [[0, T.hondo, 0.3], [1, T.hondo, 0]]));
    rellena(x, c.filoDer, rgba(T.hondo, 0.16));
    rellena(x, c.toro, rgba(T.claro, 0.4)); rellena(x, c.toroArriba, vert(x, y0 - 0.006, y0, T.claro, T.med));
    rellena(x, c.gola, vert(x, y0 - 0.04, y0, acl(T.luz, 0.2), T.som));
    rellena(x, c.hojas, rgba(T.hondo, 0.2));
    rellena(x, c.filete, rgba(T.claro, 0.9));
  }

  // una columna de capitel compuesto (quiosco de Trajano), de alto 1 hasta lo alto del ábaco; tres capiteles distintos
  var columnas = {};
  function plantillaColumna(v) {
    if (columnas[v]) return columnas[v];
    var c = {}, i;
    c.basa = forma(function (p) { p.moveTo(-0.062, 0); p.lineTo(-0.062, -0.012); p.quadraticCurveTo(-0.06, -0.026, -0.05, -0.028); p.lineTo(0.05, -0.028); p.quadraticCurveTo(0.06, -0.026, 0.062, -0.012); p.lineTo(0.062, 0); p.closePath(); });
    c.fuste = forma(function (p) { p.moveTo(-0.05, -0.026); p.bezierCurveTo(-0.052, -0.25, -0.047, -0.45, -0.045, -0.62); p.lineTo(0.045, -0.62); p.bezierCurveTo(0.047, -0.45, 0.052, -0.25, 0.05, -0.026); p.closePath(); });
    c.atadura = forma(function (p) { for (i = 0; i < 4; i++) p.rect(-0.046, -0.6 - i * 0.008, 0.092, 0.0035); });
    // el capitel: una campana que se abre (con un borde que vuelve) y sus hojas o nervios
    c.capitel = forma(function (p) {
      p.moveTo(-0.045, -0.62); p.bezierCurveTo(-0.06, -0.68, -0.1, -0.74, -0.118, -0.8); p.quadraticCurveTo(-0.121, -0.818, -0.105, -0.82);
      p.lineTo(0.105, -0.82); p.quadraticCurveTo(0.121, -0.818, 0.118, -0.8); p.bezierCurveTo(0.1, -0.74, 0.06, -0.68, 0.045, -0.62); p.closePath();
    });
    c.hojas = new Path2D(); c.hojasLuz = new Path2D();
    if (v === 0) {   // papiro abierto: nervios en abanico
      for (i = -4; i <= 4; i++) tira(c.hojas, [i * 0.009, -0.63, i * 0.02, -0.72, i * 0.025, -0.81], 0.0045, 0.006);
    } else if (v === 1) {   // dos pisos de hojas de palma
      for (i = -3; i <= 3; i++) { var hx = i * 0.026; poli(c.hojas, [hx - 0.012, -0.66, hx, -0.725, hx + 0.012, -0.66, hx + 0.004, -0.645, hx - 0.004, -0.645]); poli(c.hojasLuz, [hx - 0.008, -0.668, hx - 0.002, -0.715, hx + 0.001, -0.67]); }
      for (i = -4; i <= 4; i++) { var hx2 = i * 0.026; poli(c.hojas, [hx2 - 0.012, -0.735, hx2, -0.815, hx2 + 0.012, -0.735, hx2, -0.72]); }
    } else {   // loto: pétalos grandes
      for (i = -2; i <= 2; i++) { var px = i * 0.045; c.hojas.moveTo(px - 0.022, -0.8); c.hojas.quadraticCurveTo(px, -0.66, px + 0.022, -0.8); c.hojas.quadraticCurveTo(px, -0.75, px - 0.022, -0.8); c.hojas.closePath(); }
      for (i = -2; i <= 1; i++) { var px2 = i * 0.045 + 0.0225; tira(c.hojasLuz, [px2, -0.81, px2, -0.7], 0.004, 0.002); }
    }
    c.abaco = forma(function (p) { p.rect(-0.064, -1, 0.128, 0.18); });
    c.abacoSombra = forma(function (p) { p.rect(-0.064, -0.836, 0.128, 0.016); });
    return (columnas[v] = c);
  }
  function pintarColumna(x, c, T) {
    rellena(x, c.basa, cil(x, -0.062, 0.062, T.luz, 0.18));
    rellena(x, c.fuste, cil(x, -0.05, 0.05, T.luz, 0.24));
    rellena(x, c.atadura, rgba(T.hondo, 0.35));
    rellena(x, c.capitel, cil(x, -0.12, 0.12, T.luz, 0.22));
    rellena(x, c.hojas, rgba(T.hondo, 0.28)); rellena(x, c.hojasLuz, rgba(T.claro, 0.5));
    rellena(x, c.abaco, cil(x, -0.064, 0.064, T.luz, 0.16));
    rellena(x, c.abacoSombra, rgba(T.hondo, 0.25));
  }

  // rocas de granito redondeadas (las de Filé): lista de [cx, base, rx, ry]
  function formasRocas(semilla, lista) {
    var r = U.azar(semilla), c = { lista: [], luz: new Path2D(), grieta: new Path2D(), motas: new Path2D(), motasClaras: new Path2D() };
    lista.forEach(function (b) {
      var cx = b[0], cy = b[1], rx = b[2], ry = b[3], v = [], n = 16, i;
      for (i = 0; i < n; i++) {
        var a = Math.PI + i / (n - 1) * Math.PI, k = 0.92 + (U.fbm(i * 0.7 + cx * 30, 13, 2) - 0.5) * 0.3;
        v.push(cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k);
      }
      v.push(cx + rx * 0.98, Math.min(0, cy + 0.006), cx - rx * 0.98, Math.min(0, cy + 0.006));
      c.lista.push({ p: forma(function (p) { poli(p, v); }), x0: cx - rx, y0: cy - ry, x1: cx + rx, y1: cy });
      elipse(c.luz, cx - rx * 0.28, cy - ry * 0.68, rx * 0.42, ry * 0.2, -0.15);
      if (r() < 0.6) tira(c.grieta, [cx + (r() - 0.5) * rx, cy - ry * 0.9, cx + (r() - 0.5) * rx * 0.6, cy - ry * 0.4, cx + (r() - 0.5) * rx, cy], 0.003, 0.0015);
      var nm = Math.round(rx * ry * 9000);
      for (i = 0; i < nm; i++) {
        var a2 = r() * Math.PI, rr = Math.sqrt(r()) * 0.85, mx = cx + Math.cos(a2 + Math.PI) * rx * rr, my = cy + Math.sin(a2 + Math.PI) * ry * rr;
        (r() < 0.5 ? c.motas : c.motasClaras).rect(mx, my, 0.0018, 0.0016);
      }
    });
    return c;
  }
  function pintarRocas(x, c, G) {
    for (var i = 0; i < c.lista.length; i++) {
      var b = c.lista[i], rosa = (i * 7) % 3 * 0.07;
      rellena(x, b.p, lin(x, b.x0, b.y0, b.x1, b.y1, [[0, mez(G.luz, P.cornalina, rosa * 0.8)], [0.45, mez(G.med, P.rojo, rosa)], [1, G.som]]));
    }
    rellena(x, c.motas, rgba(G.hondo, 0.35)); rellena(x, c.motasClaras, rgba(G.claro, 0.4));
    rellena(x, c.luz, rgba(G.claro, 0.35)); rellena(x, c.grieta, rgba(G.hondo, 0.45));
  }

  /* ======================================================================= 2. FILÉ
     El templo de Isis en la isla de Filé: el primer pilono (dos torres con talud, toro y gola; la puerta, más baja, con el
     disco solar alado; en cada torre, el rey que golpea a los enemigos ante Isis y Horus, y encima un registro de ofrendas),
     el quiosco de Trajano (catorce columnas de capiteles compuestos, distintos, con los muros de cierre entre ellas y sin
     techo: el anillo de arquitrabes abierto al cielo, visto un poco desde arriba) y las rocas de granito de la isla.
     El rincón bajo de la torre derecha queda liso para el último grafito jeroglífico (394 d. C.). */
  var FI = { luz: mez(P.piedra, P.arena, 0.35), med: mez(P.piedra2, P.arena2, 0.4) };
  FI.som = osc(mez(P.piedra2, P.oro4, 0.15), 0.08); FI.hondo = osc(FI.som, 0.55); FI.claro = acl(FI.luz, 0.35);
  var GR = { med: mez(mez(P.negro2, P.piedra2, 0.5), P.rojo, 0.08) };
  GR.luz = acl(GR.med, 0.28); GR.som = osc(GR.med, 0.32); GR.hondo = osc(GR.med, 0.55); GR.claro = acl(GR.med, 0.5);
  var FI_B = -0.045, FI_TOP = -0.364, FI_T = 0.016, FI_G = 0.026;
  var FI_COL = { x0: 0.15, paso: 0.056, base: -0.062, alto: 0.24, dx: 0.034, dy: -0.075 };
  var filae = null;
  function formasFilae() {
    if (filae) return filae;
    var r = U.azar(394), c = { torres: torres() }, i;
    formasTorre(c.torres, -0.45, -0.214, FI_B, FI_TOP, FI_T, FI_G);
    formasTorre(c.torres, -0.146, 0.09, FI_B, FI_TOP, FI_T, FI_G);
    // la puerta entre las torres: más baja, con su gola y el disco alado
    c.portal = forma(function (p) { p.rect(-0.21, -0.262, 0.06, 0.262 + FI_B); });
    c.portalGola = forma(function (p) { p.rect(-0.216, -0.286, 0.072, 0.022); });
    c.portalHojas = new Path2D(); for (i = 0; i <= 18; i++) c.portalHojas.rect(-0.215 + i * 0.07 / 18 - 0.0008, -0.284, 0.0016, 0.017);
    c.portalFilete = forma(function (p) { p.rect(-0.2165, -0.289, 0.073, 0.003); });
    c.vano = forma(function (p) { p.rect(-0.197, -0.218, 0.034, 0.218 + FI_B); });
    c.vanoFondo = forma(function (p) { p.rect(-0.188, -0.17, 0.016, 0.17 + FI_B); });
    c.alas = forma(function (p) {
      [-1, 1].forEach(function (l) { p.moveTo(-0.18 + l * 0.006, -0.272); p.bezierCurveTo(-0.18 + l * 0.018, -0.282, -0.18 + l * 0.03, -0.28, -0.18 + l * 0.033, -0.271); p.bezierCurveTo(-0.18 + l * 0.02, -0.266, -0.18 + l * 0.012, -0.268, -0.18 + l * 0.006, -0.266); p.closePath(); });
    });
    c.plumas = new Path2D(); [-1, 1].forEach(function (l) { for (var k = 0; k < 4; k++) tira(c.plumas, [-0.18 + l * (0.01 + k * 0.006), -0.268, -0.18 + l * (0.012 + k * 0.006), -0.278], 0.0012); });
    c.disco = forma(function (p) { circulo(p, -0.18, -0.2735, 0.0048); });
    // las rayas de los registros y el zócalo liso
    c.rayas = new Path2D();
    [[-0.45, -0.214], [-0.146, 0.09]].forEach(function (tw) {
      [-0.097, -0.29, -0.357].forEach(function (yy) { var tt = (yy - FI_B) / (FI_TOP - FI_B) * FI_T; c.rayas.rect(tw[0] + tt + 0.006, yy, tw[1] - tw[0] - 2 * tt - 0.012, 0.0022); });
    });
    // los sillares: hiladas y juntas, muy suaves
    c.juntasTorre = new Path2D();
    [[-0.45, -0.214], [-0.146, 0.09]].forEach(function (tw) {
      for (var hy = FI_B - 0.017, fila = 0; hy > FI_TOP + 0.004; hy -= 0.0175, fila++) {
        var tt = (hy - FI_B) / (FI_TOP - FI_B) * FI_T, xa = tw[0] + tt + 0.005, xb = tw[1] - tt - 0.005;
        var liso = tw[0] > -0.2 && hy > -0.1;   // el zócalo de la torre derecha queda liso (ahí irá el grafito)
        if (liso) continue;
        c.juntasTorre.rect(xa, hy, xb - xa, 0.0011);
        for (var jx = xa + (fila % 2 ? 0.02 : 0.04); jx < xb - 0.01; jx += 0.045 + r() * 0.02) c.juntasTorre.rect(jx, hy, 0.0011, 0.0175);
      }
    });
    c.manchas = new Path2D();
    for (i = 0; i < 14; i++) { var mx = -0.44 + r() * 0.52, my = -0.07 - r() * 0.27; if ((mx > -0.22 && mx < -0.14) || (mx > -0.02 && my > -0.12)) continue; elipse(c.manchas, mx, my, 0.01 + r() * 0.02, 0.006 + r() * 0.012, r()); }
    // los relieves: el rey que golpea a los enemigos ante Isis y Horus (abajo) y un registro de ofrendas (arriba), en cada
    // torre mirando hacia la puerta; [nombre, plantilla, escala, x, y, espejo]
    c.figuras = [];
    var H1 = 0.132, H2 = 0.046;
    function escena(cxRey, haciaDer) {
      var sg = haciaDer ? 1 : -1, yb = -0.1, y2 = -0.296;
      c.figuras.push(['rey-golpea', figura('golpear', 'hombre', 'pschent'), H1, cxRey, yb, !haciaDer]);
      c.figuras.push(['cautivos', cautivos(), 0.15, cxRey + sg * 0.051, yb, !haciaDer]);
      c.figuras.push(['isis', figura('quieta', 'mujer', 'hathor'), H1 * 0.96, cxRey + sg * 0.13, yb, haciaDer]);
      c.figuras.push(['horus', figura('cetro', 'halcon', 'pschent'), H1, cxRey + sg * 0.172, yb, haciaDer]);
      c.figuras.push(['rey-ofrece-b', figura('ofrenda', 'hombre', 'blanca'), H2, cxRey - sg * 0.012, y2, !haciaDer]);
      c.figuras.push(['ra-sentado', figura('sentado', 'halcon', 'disco'), H2, cxRey + sg * 0.036, y2, haciaDer]);
      c.figuras.push(['rey-ofrece-p', figura('ofrenda', 'hombre', 'pschent'), H2, cxRey + sg * 0.095, y2, !haciaDer]);
      c.figuras.push(['hathor-sentada', figura('sentado', 'mujer', 'hathor'), H2, cxRey + sg * 0.143, y2, haciaDer]);
    }
    escena(-0.405, true); escena(0.045, false);
    // el nombre de Isis (fórmula del kit) en una columna delante de ella, en cada torre
    c.signos = [];
    [[-0.298, false], [-0.062, true]].forEach(function (g) { ['𓊨', '𓏏', '𓁐'].forEach(function (sg, k) { c.signos.push([sg, g[0], -0.236 + k * 0.0145, g[1]]); }); });
    // el quiosco de Trajano: 5 columnas por lado largo y 4 por lado corto (14 en total)
    var C = FI_COL, xs = [], k2;
    for (k2 = 0; k2 < 5; k2++) xs.push(C.x0 + k2 * C.paso);
    c.colDelante = xs.map(function (cx, k) { return [cx, C.base, k % 3]; });
    c.colDetras = xs.map(function (cx, k) { return [cx + C.dx, C.base + C.dy, (k + 1) % 3]; });
    c.colLado = [1 / 3, 2 / 3].map(function (f, k) { return [xs[4] + C.dx * f, C.base + C.dy * f, k + 1]; });
    c.colIzq = [1 / 3, 2 / 3].map(function (f, k) { return [xs[0] + C.dx * f, C.base + C.dy * f, k]; });
    var rf = 0.05 * C.alto, ym = C.base - 0.1;   // radio del fuste y alto de los muros de cierre
    c.muros = new Path2D(); c.murosDetras = new Path2D(); c.murosLado = new Path2D(); c.murosGola = new Path2D(); c.murosGolaDetras = new Path2D();
    for (k2 = 0; k2 < 4; k2++) {
      var a = xs[k2] + rf, b = xs[k2 + 1] - rf;
      c.muros.rect(a, ym, b - a, C.base - ym); c.murosGola.rect(a - 0.002, ym - 0.011, b - a + 0.004, 0.011);
      c.murosDetras.rect(a + C.dx, ym + C.dy, b - a, C.base - ym); c.murosGolaDetras.rect(a + C.dx - 0.002, ym + C.dy - 0.011, b - a + 0.004, 0.011);
    }
    // el lado corto de la derecha: dos muros en oblicuo y la puerta en el centro
    [[0, 1 / 3], [2 / 3, 1]].forEach(function (tr) {
      var xa = xs[4] + C.dx * tr[0], ya = C.base + C.dy * tr[0], xb = xs[4] + C.dx * tr[1], yb2 = C.base + C.dy * tr[1];
      poli(c.murosLado, [xa, ya, xb, yb2, xb, yb2 - 0.1, xa, ya - 0.1]);
      poli(c.murosGola, [xa, ya - 0.1, xb, yb2 - 0.1, xb, yb2 - 0.111, xa, ya - 0.111]);
    });
    // el anillo de arquitrabes y su gola, abierto: detrás, a los lados y delante
    var at = C.base - C.alto, ah = 0.016, gh = 0.015, xi = xs[0] - 0.03, xd = xs[4] + 0.03;
    function banda(dx, dy) { return [xi + dx, at + dy, xd + dx, at + dy, xd + dx, at + dy - ah - gh, xi + dx, at + dy - ah - gh]; }
    c.aniDetras = forma(function (p) { poli(p, banda(C.dx, C.dy)); });
    c.aniIzq = forma(function (p) { poli(p, [xi, at, xi + C.dx, at + C.dy, xi + C.dx, at + C.dy - ah - gh, xi, at - ah - gh]); });
    c.aniDer = forma(function (p) { poli(p, [xd, at, xd + C.dx, at + C.dy, xd + C.dx, at + C.dy - ah - gh, xd, at - ah - gh]); });
    c.aniDelante = forma(function (p) { poli(p, banda(0, 0)); });
    c.aniGolaDelante = forma(function (p) { p.rect(xi - 0.003, at - ah - gh, xd - xi + 0.006, gh); });
    c.aniGolaDetras = forma(function (p) { p.rect(xi + C.dx - 0.003, at + C.dy - ah - gh, xd - xi + 0.006, gh); });
    c.aniHojas = new Path2D();
    for (k2 = 0; k2 <= 40; k2++) { var hx3 = xi - 0.002 + (xd - xi + 0.004) * k2 / 40; c.aniHojas.rect(hx3 - 0.0011, at - ah - gh + 0.002, 0.0022, gh * 0.75); }
    c.aniFilete = forma(function (p) { p.rect(xi - 0.0035, at - ah - gh - 0.003, xd - xi + 0.007, 0.003); });
    c.aniFileteDetras = forma(function (p) { p.rect(xi + C.dx - 0.0035, at + C.dy - ah - gh - 0.003, xd - xi + 0.007, 0.003); });
    c.aniHojasDetras = new Path2D();
    for (k2 = 0; k2 <= 40; k2++) { var hx4 = xi - 0.002 + (xd - xi + 0.004) * k2 / 40 + C.dx; c.aniHojasDetras.rect(hx4 - 0.0011, at + C.dy - ah - gh + 0.002, 0.0022, gh * 0.75); }
    c.aniArqDetras = forma(function (p) { p.rect(xi + C.dx, at + C.dy - ah, xd - xi, ah); });
    // las caras de arriba del anillo (al sol): delante, detrás y los dos lados; dibujan el hueco abierto del quiosco
    var tt = at - ah - gh - 0.003, gx = 0.009, tdx = C.dx * 0.12, tdy = C.dy * 0.12;
    c.aniArriba = forma(function (p) {
      poli(p, [xi - 0.0035, tt, xd + 0.0035, tt, xd + 0.0035 + tdx, tt + tdy, xi - 0.0035 + tdx, tt + tdy]);
      poli(p, [xi - 0.0035 + C.dx - tdx, tt + C.dy - tdy, xd + 0.0035 + C.dx - tdx, tt + C.dy - tdy, xd + 0.0035 + C.dx, tt + C.dy, xi - 0.0035 + C.dx, tt + C.dy]);
      poli(p, [xi - 0.0035, tt, xi - 0.0035 + gx, tt, xi - 0.0035 + gx + C.dx, tt + C.dy, xi - 0.0035 + C.dx, tt + C.dy]);
      poli(p, [xd + 0.0035 - gx, tt, xd + 0.0035, tt, xd + 0.0035 + C.dx, tt + C.dy, xd + 0.0035 - gx + C.dx, tt + C.dy]);
    });
    // el basamento del quiosco y el muro del muelle, sobre las rocas
    c.basamento = forma(function (p) { p.rect(xi - 0.01, C.base, xd - xi + 0.02, 0.02); });
    c.basamentoLado = forma(function (p) { poli(p, [xd + 0.01, C.base, xd + 0.01 + C.dx * 0.5, C.base + C.dy * 0.5, xd + 0.01 + C.dx * 0.5, C.base + C.dy * 0.5 + 0.02, xd + 0.01, C.base + 0.02]); });
    c.muelle = forma(function (p) { p.rect(xi - 0.012, C.base + 0.018, xd - xi + 0.05, -C.base - 0.018); });
    c.juntas = new Path2D();
    for (k2 = 0; k2 < 3; k2++) { var yj = C.base + 0.026 + k2 * 0.012; c.juntas.rect(xi - 0.012, yj, xd - xi + 0.05, 0.0018); for (var m = 0; m < 9; m++) c.juntas.rect(xi - 0.005 + m * 0.036 + (k2 % 2) * 0.018, yj, 0.0018, 0.012); }
    // las rocas de granito de la isla
    c.rocasAtras = formasRocas(1901, [
      [-0.418, -0.004, 0.028, 0.05], [-0.31, -0.006, 0.04, 0.036], [-0.06, -0.006, 0.05, 0.034], [0.11, -0.006, 0.04, 0.05], [0.2, -0.01, 0.05, 0.045],
      [0.33, -0.012, 0.05, 0.042], [0.42, -0.006, 0.026, 0.06]
    ]);
    c.rocas = formasRocas(1902, [
      [-0.418, 0, 0.03, 0.034], [-0.37, 0, 0.05, 0.03], [-0.305, 0, 0.022, 0.014], [-0.25, 0, 0.04, 0.022], [-0.19, 0, 0.022, 0.012],
      [-0.12, 0, 0.05, 0.026], [-0.03, 0, 0.028, 0.016], [0.04, 0, 0.05, 0.028], [0.12, 0, 0.036, 0.04],
      [0.22, 0, 0.065, 0.034], [0.3, 0, 0.026, 0.018], [0.37, 0, 0.05, 0.03], [0.425, 0, 0.02, 0.042]
    ]);
    c.suelo = forma(function (p) { p.rect(-0.45, FI_B, 0.56, -FI_B); });
    return (filae = c);
  }
  var CAJA_COL = [-0.13 * FI_COL.alto - 0.003, -FI_COL.alto - 0.003, 0.13 * FI_COL.alto + 0.003, 0.003];
  var pintoresCol = [0, 1, 2].map(function (v) { return function (k) { k.save(); k.scale(FI_COL.alto, FI_COL.alto); pintarColumna(k, plantillaColumna(v), FI); k.restore(); }; });

  function dibujarFilae(x, X, Y, s, op) {
    var c = formasFilae(), i; PFX = x;
    x.save(); x.translate(X, Y); x.scale(s, s);
    marca('pilono');
    pintarTorres(x, c.torres, FI, -0.45, FI_TOP, 0.09, FI_B);
    rellena(x, c.manchas, rgba(FI.med, 0.18)); rellena(x, c.juntasTorre, rgba(FI.hondo, 0.09));
    rellena(x, c.rayas, rgba(FI.hondo, 0.22));
    // la puerta
    rellena(x, c.portal, cil(x, -0.21, -0.15, FI.luz, 0.14));
    rellena(x, c.vano, vert(x, -0.218, FI_B, osc(FI.hondo, 0.4), osc(FI.hondo, 0.2)));
    rellena(x, c.vanoFondo, rgba(acl(FI.luz, 0.1), 0.5));
    rellena(x, c.portalGola, vert(x, -0.286, -0.264, acl(FI.luz, 0.2), FI.som)); rellena(x, c.portalHojas, rgba(FI.hondo, 0.2)); rellena(x, c.portalFilete, FI.claro);
    rellena(x, c.alas, rgba(mez(FI.luz, P.lapis, 0.45), 1)); rellena(x, c.plumas, rgba(mez(FI.luz, P.turquesa, 0.5), 0.9));
    rellena(x, c.disco, ES.rad(x, -0.181, -0.275, 0, 0.005, [[0, acl(P.cornalina, 0.2)], [1, mez(P.cornalina, FI.med, 0.3)]]));
    marca('relieves');
    selloRelieves(x, 'filae-izq', c.figuras.filter(function (f) { return f[3] < -0.18; }), FI, 0.0011, true);
    selloRelieves(x, 'filae-der', c.figuras.filter(function (f) { return f[3] >= -0.18; }), FI, 0.0011, true);
    tallarLista(x, s, c.signos, 0.012, FI.hondo, FI.claro, 0.55);
    marca('quiosco');
    // el muelle y el basamento
    rellena(x, c.muelle, vert(x, FI_COL.base, 0, FI.med, FI.som)); rellena(x, c.juntas, rgba(FI.hondo, 0.25));
    rellena(x, c.basamento, vert(x, FI_COL.base, FI_COL.base + 0.02, FI.claro, FI.med)); rellena(x, c.basamentoLado, FI.som);
    // lo de detrás: el anillo del fondo (su cara de dentro, a media sombra), las columnas de atrás y sus muros
    rellena(x, c.aniArqDetras, vert(x, -0.39, -0.37, FI.med, mez(FI.med, FI.som, 0.5)));
    rellena(x, c.aniGolaDetras, vert(x, -0.405, -0.39, FI.luz, FI.som)); rellena(x, c.aniHojasDetras, rgba(FI.hondo, 0.22)); rellena(x, c.aniFileteDetras, FI.luz);
    var C = FI_COL;
    for (i = 0; i < c.colDetras.length; i++) sello(x, 'filae-col' + c.colDetras[i][2], CAJA_COL, pintoresCol[c.colDetras[i][2]], c.colDetras[i][0], c.colDetras[i][1]);
    for (i = 0; i < c.colIzq.length; i++) sello(x, 'filae-col' + c.colIzq[i][2], CAJA_COL, pintoresCol[c.colIzq[i][2]], c.colIzq[i][0], c.colIzq[i][1]);
    if (!c.sombraDetras) c.sombraDetras = forma(function (p) {
      c.colDetras.concat(c.colIzq).forEach(function (cc) { var t = plantillaColumna(cc[2]); ['basa', 'fuste', 'capitel', 'abaco'].forEach(function (n) { poner(p, t[n], cc[0], cc[1], C.alto); }); });
    });
    rellena(x, c.sombraDetras, rgba(FI.hondo, 0.28));
    rellena(x, c.murosDetras, vert(x, -0.21, -0.11, FI.med, FI.som)); rellena(x, c.murosGolaDetras, rgba(FI.som, 1));
    rellena(x, c.aniIzq, vert(x, -0.4, -0.31, FI.som, osc(FI.som, 0.1)));
    // el lado corto de la derecha (en sombra) con su puerta
    for (i = 0; i < c.colLado.length; i++) sello(x, 'filae-col' + c.colLado[i][2], CAJA_COL, pintoresCol[c.colLado[i][2]], c.colLado[i][0], c.colLado[i][1]);
    rellena(x, c.murosLado, vert(x, -0.21, -0.06, mez(FI.med, FI.som, 0.5), FI.som));
    rellena(x, c.aniDer, vert(x, -0.4, -0.31, mez(FI.med, FI.som, 0.6), osc(FI.som, 0.15)));
    // la fila de delante: columnas, muros de cierre, arquitrabe y gola
    for (i = 0; i < c.colDelante.length; i++) sello(x, 'filae-col' + c.colDelante[i][2], CAJA_COL, pintoresCol[c.colDelante[i][2]], c.colDelante[i][0], c.colDelante[i][1]);
    rellena(x, c.muros, lin(x, 0.12, -0.16, 0.4, -0.06, [[0, acl(FI.luz, 0.06)], [1, FI.med]]));
    rellena(x, c.murosGola, vert(x, -0.175, -0.16, FI.claro, FI.som));
    rellena(x, c.aniDelante, vert(x, -0.35, -0.31, FI.luz, FI.med));
    rellena(x, c.aniGolaDelante, vert(x, -0.35, -0.33, acl(FI.luz, 0.2), FI.som)); rellena(x, c.aniHojas, rgba(FI.hondo, 0.2)); rellena(x, c.aniFilete, FI.claro);
    rellena(x, c.aniArriba, acl(FI.luz, 0.25));
    marca('rocas');
    rellena(x, c.suelo, vert(x, FI_B, 0, FI.med, FI.som));
    pintarRocas(x, c.rocasAtras, { luz: GR.med, med: GR.som, som: osc(GR.som, 0.2), hondo: GR.hondo, claro: GR.luz });
    pintarRocas(x, c.rocas, GR);
    marca('fin');
    x.restore();
  }
  AE.arte.filae = { ancho: 0.9, alto: 0.42, abajo: 0, dibujar: dibujarFilae, preparar: function () { formasFilae(); [0, 1, 2].forEach(plantillaColumna); } };
  // el rincón liso, abajo a la derecha del pilono (el zócalo de la torre derecha): el último grafito jeroglífico
  AE.arte.filae.grafito = { dx: 0.06, dy: -0.074 };

  /* ======================================================================= 3. EDFU
     El gran pilono del templo de Horus: dos torres enormes con los relieves gigantes del rey (Ptolomeo XII) que golpea a
     los enemigos ante Horus de Edfu y Hathor, y encima dos registros de ofrendas; las cuatro ranuras de los mástiles con
     sus ventanucos; la puerta alta con el disco solar alado (con restos de pintura) y, por ella, el patio al sol. Delante,
     el halcón Horus de granito negro pulido con la doble corona, sobre su pedestal. */
  var ED = { luz: mez(P.piedra, P.arena, 0.5), med: mez(P.piedra2, P.arena2, 0.5) };
  ED.som = osc(mez(P.piedra2, P.oro4, 0.18), 0.06); ED.hondo = osc(ED.som, 0.55); ED.claro = acl(ED.luz, 0.35);
  var ED_TOP = -0.392, ED_G = 0.03, ED_T = 0.026;
  var edfu = null;
  function formasEdfu() {
    if (edfu) return edfu;
    var r = U.azar(237), c = { torres: torres() }, i;
    formasTorre(c.torres, -0.372, -0.056, 0, ED_TOP, ED_T, ED_G);
    formasTorre(c.torres, 0.056, 0.372, 0, ED_TOP, ED_T, ED_G);
    var tTorres = [[-0.372, -0.056], [0.056, 0.372]];
    function bordes(tw, y) { var tt = y / ED_TOP * ED_T; return [tw[0] + tt, tw[1] - tt]; }
    // los sillares, muy suaves
    c.juntas = new Path2D();
    tTorres.forEach(function (tw) {
      for (var hy = -0.02, fila = 0; hy > ED_TOP + 0.004; hy -= 0.02, fila++) {
        var b = bordes(tw, hy); c.juntas.rect(b[0] + 0.006, hy, b[1] - b[0] - 0.012, 0.0012);
        for (var jx = b[0] + (fila % 2 ? 0.025 : 0.05); jx < b[1] - 0.01; jx += 0.05 + r() * 0.025) c.juntas.rect(jx, hy, 0.0012, 0.02);
      }
    });
    // las ranuras de los mástiles (dos por torre, del suelo hasta casi arriba) y los ventanucos que las acompañan
    c.ranuras = new Path2D(); c.ranurasLuz = new Path2D(); c.ventanas = new Path2D();
    [-0.094, -0.126, 0.094, 0.126].forEach(function (rx) {
      var w = 0.015, top = ED_TOP + 0.024;
      c.ranuras.rect(rx - w / 2, top, w, -top); c.ranurasLuz.rect(rx + w / 2 - 0.0035, top, 0.0035, -top);
    });
    [-0.11, 0.11].forEach(function (vx) { [-0.17, -0.25, -0.33].forEach(function (vy) { c.ventanas.rect(vx - 0.0055, vy, 0.011, 0.012); }); });
    c.registros = new Path2D();
    tTorres.forEach(function (tw) { [-0.03, -0.262, -0.322, -0.378].forEach(function (yy) { var b = bordes(tw, yy); c.registros.rect(b[0] + 0.008, yy, b[1] - b[0] - 0.016, 0.0025); }); });
    // los relieves: en cada torre, el rey (fuera) golpea a los enemigos ante Horus y Hathor (junto a las ranuras), mirando a la
    // puerta; encima, dos registros de ofrendas. [nombre, plantilla, escala, x, y, espejo]
    c.figuras = [];
    function torre(lado) {
      var sg = -lado, xr = lado * 0.3, yb = -0.034, H = 0.178;   // (lado −1: la torre izquierda; el rey mira hacia la derecha)
      c.figuras.push(['rey', figura('golpear', 'hombre', 'pschent'), H, xr, yb, lado > 0]);
      c.figuras.push(['cautivos', cautivos(), 0.205, xr + sg * 0.066, yb, lado > 0]);
      c.figuras.push(['horus', figura('cetro', 'halcon', 'pschent'), H, lado * 0.162, yb, lado < 0]);
      // arriba: el rey ofrece a Horus sentado y a Hathor sentada; y otra vez, más arriba
      [[-0.266, 0.046], [-0.326, 0.043]].forEach(function (rg, k) {
        var y2 = rg[0], h2 = rg[1];
        c.figuras.push(['rey-ofrece', figura('ofrenda', 'hombre', k ? 'blanca' : 'pschent'), h2, lado * 0.345, y2, lado > 0]);
        c.figuras.push([k ? 'hathor-s' : 'horus-s', figura('sentado', k ? 'mujer' : 'halcon', k ? 'hathor' : 'pschent'), h2, lado * 0.297, y2, lado < 0]);
        c.figuras.push(['rey-ofrece2', figura('ofrenda', 'hombre', 'blanca'), h2, lado * 0.25, y2, lado > 0]);
        c.figuras.push(['isis-s', figura('sentado', 'mujer', 'hathor'), h2, lado * 0.2, y2, lado < 0]);
      });
    }
    torre(-1); torre(1);
    // el nombre de Horus delante de él, y «dotado de vida» (fórmulas del kit)
    c.signos = [];
    [-1, 1].forEach(function (lado) {
      ['𓅃', '𓂞', '𓋹'].forEach(function (sg, k) { c.signos.push([sg, lado * 0.205, -0.225 + k * 0.02, lado > 0]); });
      ['𓇓', '𓏏', '𓆤', '𓏏'].forEach(function (sg, k) { c.signos.push([sg, lado * 0.262, -0.25 + k * 0.015, lado > 0]); });
    });
    // la puerta: el portal, más bajo que las torres, con su gola y el disco alado; el vano, y al fondo el patio al sol
    c.portalGola = forma(function (p) { p.rect(-0.066, -0.33, 0.132, 0.03); });
    c.portalHojas = new Path2D(); for (i = 0; i <= 26; i++) c.portalHojas.rect(-0.064 + i * 0.128 / 26 - 0.001, -0.327, 0.002, 0.023);
    c.portalFilete = forma(function (p) { p.rect(-0.067, -0.335, 0.134, 0.005); });
    c.alas = forma(function (p) {
      [-1, 1].forEach(function (l) {
        p.moveTo(l * 0.008, -0.312); p.bezierCurveTo(l * 0.025, -0.33, l * 0.05, -0.33, l * 0.058, -0.312);
        p.bezierCurveTo(l * 0.04, -0.302, l * 0.022, -0.304, l * 0.008, -0.302); p.closePath();
      });
    });
    c.plumas = new Path2D(); [-1, 1].forEach(function (l) { for (var k = 0; k < 7; k++) tira(c.plumas, [l * (0.014 + k * 0.0062), -0.304, l * (0.016 + k * 0.0062), -0.322 + k * 0.0012], 0.0016); });
    c.ureos = forma(function (p) { [-1, 1].forEach(function (l) { elipse(p, l * 0.0105, -0.307, 0.0028, 0.005); }); });
    c.disco = forma(function (p) { circulo(p, 0, -0.312, 0.0085); });
    c.vano = forma(function (p) { p.rect(-0.033, -0.262, 0.066, 0.262); });
    c.patio = forma(function (p) { poli(p, [-0.016, -0.2, 0.016, -0.2, 0.016, -0.03, -0.016, -0.03]); });
    c.patioColumnas = forma(function (p) { [-0.011, 0, 0.011].forEach(function (cx) { p.rect(cx - 0.0025, -0.165, 0.005, 0.12); p.rect(cx - 0.0045, -0.172, 0.009, 0.008); }); p.rect(-0.016, -0.18, 0.032, 0.008); });
    c.jambas = forma(function (p) { p.rect(-0.044, -0.27, 0.011, 0.27); p.rect(0.033, -0.27, 0.011, 0.27); p.rect(-0.044, -0.3, 0.088, 0.03); });
    c.jambasRel = new Path2D(); for (i = 0; i < 6; i++) { c.jambasRel.rect(-0.042, -0.255 + i * 0.04, 0.007, 0.03); c.jambasRel.rect(0.035, -0.255 + i * 0.04, 0.007, 0.03); }
    // el suelo delante
    c.suelo = forma(function (p) { p.rect(-0.375, -0.006, 0.75, 0.006); });
    return (edfu = c);
  }

  // ---- el halcón de granito negro con la doble corona (de perfil, mirando a la derecha; alto 1 del pedestal a la corona)
  var halcon = null;
  function plantillaHalcon() {
    if (halcon) return halcon;
    var c = {};
    c.pedestal = forma(function (p) { p.rect(-0.2, 0, 0.42, 0.2); });
    c.pedestalArriba = forma(function (p) { p.rect(-0.21, -0.008, 0.44, 0.03); });
    c.cuerpo = forma(function (p) {
      p.moveTo(0.02, -0.56);   // la nuca
      p.bezierCurveTo(0.16, -0.54, 0.2, -0.4, 0.17, -0.27);    // el pecho
      p.bezierCurveTo(0.15, -0.16, 0.1, -0.08, 0.04, -0.05);    // el vientre
      p.lineTo(-0.06, -0.05);
      p.bezierCurveTo(-0.13, -0.1, -0.17, -0.25, -0.15, -0.4);  // la espalda
      p.bezierCurveTo(-0.13, -0.5, -0.06, -0.57, 0.02, -0.56);
      p.closePath();
    });
    c.cola = forma(function (p) { p.moveTo(-0.08, -0.12); p.lineTo(-0.02, -0.08); p.lineTo(-0.1, 0.0); p.lineTo(-0.17, 0.0); p.closePath(); });
    c.patas = forma(function (p) {
      p.moveTo(-0.02, -0.08); p.bezierCurveTo(0.04, -0.1, 0.09, -0.08, 0.1, -0.04); p.lineTo(0.1, 0); p.lineTo(-0.03, 0); p.closePath();
      poli(p, [0.06, -0.012, 0.16, -0.012, 0.17, 0, 0.06, 0]);
    });
    c.cabeza = forma(function (p) {
      p.moveTo(-0.07, -0.6);
      p.bezierCurveTo(-0.07, -0.7, 0.0, -0.76, 0.07, -0.74);   // la coronilla
      p.bezierCurveTo(0.12, -0.73, 0.15, -0.7, 0.16, -0.665);  // la frente hacia el pico
      p.bezierCurveTo(0.2, -0.66, 0.215, -0.63, 0.205, -0.6);  // el pico, curvo
      p.bezierCurveTo(0.2, -0.585, 0.19, -0.58, 0.185, -0.592);
      p.bezierCurveTo(0.18, -0.6, 0.17, -0.605, 0.15, -0.6);
      p.bezierCurveTo(0.12, -0.56, 0.08, -0.54, 0.02, -0.53);  // la garganta
      p.bezierCurveTo(-0.04, -0.53, -0.07, -0.56, -0.07, -0.6);
      p.closePath();
    });
    // las alas plegadas a lo largo del lomo, con sus plumas
    c.ala = forma(function (p) {
      p.moveTo(-0.02, -0.5); p.bezierCurveTo(0.08, -0.48, 0.12, -0.36, 0.08, -0.24);
      p.bezierCurveTo(0.04, -0.14, -0.04, -0.06, -0.12, -0.02); p.lineTo(-0.14, -0.04);
      p.bezierCurveTo(-0.16, -0.2, -0.15, -0.38, -0.1, -0.46); p.bezierCurveTo(-0.08, -0.49, -0.05, -0.505, -0.02, -0.5); p.closePath();
    });
    c.plumas = new Path2D();
    for (var i = 0; i < 6; i++) { var t = i / 5; tira(c.plumas, [-0.1 + t * 0.12, -0.44 + t * 0.06, -0.12 + t * 0.14, -0.3 + t * 0.12, -0.13 + t * 0.1, -0.06 + t * 0.03], 0.006, 0.003); }
    c.plumasCortas = new Path2D();
    for (i = 0; i < 4; i++) tira(c.plumasCortas, [-0.06 + i * 0.03, -0.47 + i * 0.012, -0.0 + i * 0.03, -0.42 + i * 0.02], 0.005, 0.003);
    c.ojo = forma(function (p) { elipse(p, 0.085, -0.66, 0.022, 0.018); });
    c.ojoBrillo = forma(function (p) { elipse(p, 0.08, -0.666, 0.006, 0.005); });
    c.lagrima = forma(function (p) { p.moveTo(0.075, -0.645); p.bezierCurveTo(0.09, -0.62, 0.085, -0.595, 0.07, -0.58); p.lineTo(0.06, -0.585); p.bezierCurveTo(0.07, -0.6, 0.07, -0.625, 0.062, -0.645); p.closePath(); });
    // la doble corona: la roja con su espalda alta y su espiral, y la blanca saliendo de dentro
    c.roja = forma(function (p) { poli(p, [-0.07, -0.72, 0.1, -0.745, 0.1, -0.84, -0.02, -0.84, -0.02, -1.0, -0.085, -1.0, -0.085, -0.73]); });
    c.espiral = forma(function (p) { tira(p, [0.085, -0.83, 0.13, -0.86, 0.15, -0.9, 0.135, -0.925, 0.115, -0.915], 0.014, 0.01); });
    c.blanca = forma(function (p) {
      p.moveTo(-0.01, -0.83); p.lineTo(0.09, -0.84); p.bezierCurveTo(0.09, -0.9, 0.07, -0.98, 0.03, -1.03);
      p.bezierCurveTo(0.025, -1.06, 0.0, -1.065, -0.005, -1.045); p.bezierCurveTo(-0.02, -0.98, -0.015, -0.9, -0.01, -0.83); p.closePath();
    });
    return (halcon = c);
  }
  function pintarHalcon(x, c) {
    // (en su marco: alto 1, el pie del halcón en y = 0, el pedestal debajo)
    rellena(x, c.pedestal, lin(x, -0.2, 0, 0.22, 0.2, [[0, acl(P.negro2, 0.12)], [0.5, P.negro2], [1, P.negro]]));
    rellena(x, c.pedestalArriba, vert(x, -0.008, 0.022, acl(P.negro2, 0.35), P.negro2));
    rellena(x, c.cola, ES.negro(x, -0.17, -0.1, -0.05, 0));
    rellena(x, c.cuerpo, ES.negro(x, -0.1, -0.55, 0.15, -0.05));
    ES.brillo(x, function (k) { k.ellipse(0.1, -0.35, 0.06, 0.2, -0.2, 0, TAU); }, 0.04, -0.5, 0.18, -0.2, 0.32, [160, 185, 225]);
    rellena(x, c.patas, ES.negro(x, -0.03, -0.1, 0.17, 0));
    rellena(x, c.ala, lin(x, -0.15, -0.5, 0.1, -0.05, [[0, P.negro2], [0.5, mez(P.negro, P.negro2, 0.3)], [1, P.negro]]));
    rellena(x, c.plumas, rgba([150, 170, 210], 0.3)); rellena(x, c.plumasCortas, rgba([150, 170, 210], 0.25));
    rellena(x, c.cabeza, ES.negro(x, -0.07, -0.76, 0.2, -0.53));
    rellena(x, c.lagrima, rgba([12, 14, 24], 0.8));
    rellena(x, c.ojo, rgba([12, 14, 24], 1)); rellena(x, c.ojoBrillo, rgba([200, 215, 240], 0.8));
    // la corona, del mismo granito
    rellena(x, c.roja, ES.negro(x, -0.09, -1.0, 0.1, -0.72));
    rellena(x, c.blanca, ES.negro(x, -0.02, -1.06, 0.09, -0.83));
    ES.brillo(x, function (k) { k.moveTo(-0.01, -0.83); k.lineTo(0.09, -0.84); k.bezierCurveTo(0.09, -0.9, 0.07, -0.98, 0.03, -1.03); k.bezierCurveTo(0.025, -1.06, 0.0, -1.065, -0.005, -1.045); k.bezierCurveTo(-0.02, -0.98, -0.015, -0.9, -0.01, -0.83); k.closePath(); }, -0.01, -1.0, 0.06, -0.9, 0.35, [170, 190, 230]);
    rellena(x, c.espiral, ES.negro(x, 0.08, -0.93, 0.15, -0.83));
    ES.brillo(x, function (k) { k.ellipse(0.06, -0.7, 0.05, 0.02, -0.4, 0, TAU); }, 0.0, -0.74, 0.12, -0.66, 0.4, [170, 190, 230]);
  }
  var ED_HALCON = { x: -0.083, alto: 0.19, ped: 0.036 };

  function dibujarEdfu(x, X, Y, s, op) {
    var c = formasEdfu(), i; PFX = x;
    x.save(); x.translate(X, Y); x.scale(s, s);
    marca('torres');
    pintarTorres(x, c.torres, ED, -0.375, ED_TOP, 0.375, 0);
    rellena(x, c.zocalo || (c.zocalo = forma(function (p) { p.rect(-0.374, -0.03, 0.318, 0.03); p.rect(0.056, -0.03, 0.318, 0.03); })), rgba(ED.som, 0.25));
    rellena(x, c.juntas, rgba(ED.hondo, 0.09));
    rellena(x, c.registros, rgba(ED.hondo, 0.22));
    // las ranuras: hondas, con la luz en el filo de la derecha; los ventanucos
    rellena(x, c.ranuras, lin(x, 0, ED_TOP, 0, 0, [[0, osc(ED.som, 0.15)], [1, osc(ED.som, 0.3)]])); rellena(x, c.ranurasLuz, rgba(ED.med, 0.8));
    rellena(x, c.ventanas, rgba(ED.hondo, 0.85));
    marca('relieves');
    selloRelieves(x, 'edfu-izq', c.figuras.filter(function (f) { return f[3] < 0; }), ED, 0.0016, true);
    selloRelieves(x, 'edfu-der', c.figuras.filter(function (f) { return f[3] >= 0; }), ED, 0.0016, true);
    tallarLista(x, s, c.signos, 0.017, ED.hondo, ED.claro, 0.55);
    marca('puerta');
    rellena(x, c.jambas, cil(x, -0.045, 0.045, ED.luz, 0.12)); rellena(x, c.jambasRel, rgba(ED.hondo, 0.14));
    rellena(x, c.vano, lin(x, -0.033, 0, 0.033, 0, [[0, osc(ED.hondo, 0.45)], [0.35, osc(ED.hondo, 0.2)], [1, osc(ED.hondo, 0.5)]]));
    rellena(x, c.patio, vert(x, -0.2, -0.03, acl(ED.luz, 0.15), ED.luz)); rellena(x, c.patioColumnas, rgba(ED.med, 0.9));
    rellena(x, c.portalGola, vert(x, -0.33, -0.3, acl(ED.luz, 0.22), ED.som)); rellena(x, c.portalHojas, rgba(ED.hondo, 0.2)); rellena(x, c.portalFilete, ED.claro);
    rellena(x, c.alas, rgba(mez(ED.luz, P.lapis, 0.45), 1)); rellena(x, c.plumas, rgba(mez(ED.luz, P.turquesa, 0.55), 0.9));
    rellena(x, c.ureos, rgba(mez(ED.luz, P.oro3, 0.4), 1));
    rellena(x, c.disco, ES.rad(x, -0.002, -0.314, 0, 0.009, [[0, acl(P.cornalina, 0.2)], [1, mez(P.cornalina, ED.med, 0.3)]]));
    marca('halcon');
    rellena(x, c.suelo, vert(x, -0.006, 0, ED.med, ED.som));
    // la sombra del halcón en el suelo y en el pilono; el halcón sobre su pedestal
    x.fillStyle = rgba(ED.hondo, 0.22); x.beginPath(); x.ellipse(ED_HALCON.x + 0.02, -0.002, 0.04, 0.005, 0, 0, TAU); x.fill();
    sello(x, 'edfu-halcon', [-0.24 * ED_HALCON.alto, -1.09 * ED_HALCON.alto - ED_HALCON.ped, 0.24 * ED_HALCON.alto, 0.002], function (k) {
      k.save(); k.scale(ED_HALCON.alto, ED_HALCON.alto); k.translate(0, -ED_HALCON.ped / ED_HALCON.alto); pintarHalcon(k, plantillaHalcon()); k.restore();
    }, ED_HALCON.x, 0);
    marca('fin');
    x.restore();
  }
  AE.arte.edfu = { ancho: 0.75, alto: 0.5, abajo: 0, dibujar: dibujarEdfu, preparar: function () { formasEdfu(); plantillaHalcon(); } };

  /* ======================================================================= 4. KARNAK
     El primer pilono, inacabado (sillares en bruto, almohadillados, sin gola ni relieves; la torre norte, la de la
     izquierda, más baja y sin terminar arriba), con la puerta abierta al cielo; delante, la avenida de esfinges con cabeza
     de carnero y la estatuilla del rey entre las patas; detrás, a la derecha, una fila de columnas papiriformes de la sala
     hipóstila (capiteles abiertos en la nave central, de capullo cerrado a los lados, con restos de pintura) y los dos
     obeliscos de granito rosa con la punta dorada: el de Tutmosis I y el de Hatshepsut, el más alto de los que siguen en pie. */
  var KA = { luz: mez(P.piedra, P.arena, 0.4), med: mez(P.piedra2, P.arena2, 0.45) };
  KA.som = osc(mez(P.piedra2, P.oro4, 0.16), 0.08); KA.hondo = osc(KA.som, 0.55); KA.claro = acl(KA.luz, 0.35);
  var KL = { luz: ES.lejos(KA.luz, 0.3), med: ES.lejos(KA.med, 0.3), som: ES.lejos(KA.som, 0.3) };   // lo de detrás, más pálido
  KL.hondo = ES.lejos(KA.hondo, 0.3); KL.claro = acl(KL.luz, 0.3);
  var RO = { med: mez(P.rojo, P.lino2, 0.52) };   // el granito rosa de Asuán
  RO.luz = acl(RO.med, 0.2); RO.som = osc(RO.med, 0.28); RO.hondo = osc(RO.med, 0.5); RO.claro = acl(RO.med, 0.45);

  // ---- una esfinge con cabeza de carnero (de perfil, mirando a la derecha; largo 1, la base del cuerpo en y = 0)
  var esfinge = null;
  function plantillaEsfinge() {
    if (esfinge) return esfinge;
    var c = {};
    c.pedestal = forma(function (p) { p.rect(-0.5, 0, 1.0, 0.15); });
    c.pedestalCanto = forma(function (p) { p.rect(-0.52, -0.012, 1.04, 0.03); });
    // el cuerpo de león echado, con las patas de delante estiradas
    c.cuerpo = forma(function (p) {
      p.moveTo(-0.47, 0);
      p.bezierCurveTo(-0.5, -0.1, -0.46, -0.2, -0.36, -0.22);   // el anca
      p.bezierCurveTo(-0.22, -0.24, -0.05, -0.22, 0.06, -0.25);  // el lomo
      p.bezierCurveTo(0.11, -0.27, 0.16, -0.27, 0.2, -0.24);     // la cruz
      p.bezierCurveTo(0.24, -0.2, 0.25, -0.12, 0.24, -0.06);     // el pecho
      p.lineTo(0.45, -0.06); p.quadraticCurveTo(0.49, -0.055, 0.49, -0.025); p.lineTo(0.49, 0);
      p.closePath();
    });
    c.muslo = forma(function (p) { p.moveTo(-0.37, -0.03); p.bezierCurveTo(-0.38, -0.15, -0.23, -0.18, -0.19, -0.09); p.lineTo(-0.09, -0.03); p.quadraticCurveTo(-0.07, -0.015, -0.08, 0); p.lineTo(-0.35, 0); p.closePath(); });
    c.cola = forma(function (p) { tira(p, [-0.465, -0.05, -0.42, -0.025, -0.3, -0.022, -0.22, -0.035], 0.02, 0.012); });
    // el tocado: cae por detrás de la cabeza hasta el pecho
    c.tocado = forma(function (p) {
      p.moveTo(0.1, -0.5); p.bezierCurveTo(0.13, -0.54, 0.2, -0.54, 0.22, -0.5);
      p.lineTo(0.26, -0.24); p.quadraticCurveTo(0.22, -0.2, 0.16, -0.22); p.lineTo(0.08, -0.36); p.closePath();
    });
    c.rayasTocado = new Path2D(); for (var i = 0; i < 8; i++) { var ty = -0.47 + i * 0.03; c.rayasTocado.rect(0.12 + i * 0.012, ty, 0.07, 0.009); }
    // la cabeza de carnero: la nariz convexa, el hocico redondo
    c.cabeza = forma(function (p) {
      p.moveTo(0.16, -0.53);
      p.bezierCurveTo(0.24, -0.56, 0.33, -0.5, 0.37, -0.42);    // la frente y la nariz, curvas
      p.quadraticCurveTo(0.39, -0.38, 0.37, -0.36);             // el hocico
      p.bezierCurveTo(0.34, -0.345, 0.3, -0.35, 0.27, -0.36);   // la boca
      p.bezierCurveTo(0.23, -0.37, 0.19, -0.39, 0.16, -0.43);   // la quijada
      p.bezierCurveTo(0.14, -0.46, 0.14, -0.51, 0.16, -0.53); p.closePath();
    });
    // el cuerno, que se enrosca hacia abajo alrededor de la oreja
    c.cuerno = forma(function (p) {
      p.moveTo(0.2, -0.54);
      p.bezierCurveTo(0.12, -0.56, 0.06, -0.5, 0.07, -0.43);
      p.bezierCurveTo(0.08, -0.37, 0.15, -0.36, 0.17, -0.41);
      p.bezierCurveTo(0.185, -0.45, 0.15, -0.47, 0.13, -0.45);
      p.bezierCurveTo(0.12, -0.44, 0.125, -0.425, 0.135, -0.425);
      p.lineTo(0.135, -0.41);
      p.bezierCurveTo(0.11, -0.405, 0.1, -0.44, 0.115, -0.46);
      p.bezierCurveTo(0.14, -0.49, 0.2, -0.47, 0.19, -0.42);
      p.bezierCurveTo(0.18, -0.35, 0.07, -0.34, 0.05, -0.43);
      p.bezierCurveTo(0.04, -0.52, 0.12, -0.585, 0.21, -0.555);
      p.closePath();
    });
    c.anillos = new Path2D(); for (i = 0; i < 6; i++) { var an = -2.4 + i * 0.5; tira(c.anillos, [0.125 + Math.cos(an) * 0.048, -0.44 + Math.sin(an) * 0.052, 0.125 + Math.cos(an) * 0.07, -0.44 + Math.sin(an) * 0.075], 0.008, 0.004); }
    c.ojo = forma(function (p) { p.moveTo(0.235, -0.475); p.quadraticCurveTo(0.255, -0.49, 0.275, -0.475); p.quadraticCurveTo(0.255, -0.465, 0.235, -0.475); p.closePath(); });
    // la estatuilla del rey entre las patas, bajo la barbilla: momiforme, con los brazos cruzados y el nemes
    c.rey = forma(function (p) {
      p.moveTo(0.33, -0.06); p.lineTo(0.43, -0.06); p.lineTo(0.418, -0.24); p.quadraticCurveTo(0.415, -0.27, 0.38, -0.27); p.quadraticCurveTo(0.345, -0.27, 0.342, -0.24); p.closePath();
      poli(p, [0.35, -0.255, 0.41, -0.255, 0.405, -0.3, 0.38, -0.335, 0.355, -0.3]);
    });
    c.reyCara = forma(function (p) { elipse(p, 0.385, -0.29, 0.015, 0.022); });
    c.lineas = forma(function (p) {
      for (var j = 0; j < 4; j++) p.rect(0.37 + j * 0.022, -0.06, 0.005, 0.055);   // las garras
      tira(p, [0.345, -0.2, 0.38, -0.215, 0.415, -0.2], 0.008);   // los brazos cruzados
      tira(p, [-0.19, -0.09, -0.09, -0.03], 0.008); tira(p, [0.24, -0.06, 0.24, -0.005], 0.01);
    });
    c.sombra = forma(function (p) {
      p.moveTo(-0.47, -0.015); p.bezierCurveTo(-0.3, -0.05, 0.0, -0.045, 0.24, -0.06); p.lineTo(0.45, -0.06); p.lineTo(0.49, -0.025); p.lineTo(0.49, 0); p.lineTo(-0.47, 0); p.closePath();
      poli(p, [0.16, -0.43, 0.27, -0.36, 0.25, -0.33, 0.2, -0.35]);
    });
    c.luz = forma(function (p) { tira(p, [-0.43, -0.205, -0.3, -0.228, -0.1, -0.218, 0.06, -0.245, 0.16, -0.262], 0.022, 0.01); tira(p, [0.2, -0.535, 0.28, -0.53, 0.34, -0.47], 0.016, 0.008); });
    return (esfinge = c);
  }
  function pintarEsfinge(x, c, T) {
    rellena(x, c.pedestal, lin(x, -0.5, 0, 0.5, 0.15, [[0, T.luz], [1, T.som]]));
    rellena(x, c.pedestalCanto, vert(x, -0.012, 0.018, T.claro, T.med));
    rellena(x, c.cola, T.med);
    rellena(x, c.cuerpo, lin(x, -0.5, -0.27, 0.4, 0, [[0, acl(T.luz, 0.08)], [0.55, T.luz], [1, T.med]]));
    rellena(x, c.muslo, lin(x, -0.38, -0.17, -0.08, 0, [[0, acl(T.luz, 0.06)], [1, T.med]]));
    rellena(x, c.tocado, lin(x, 0.08, -0.54, 0.26, -0.2, [[0, T.luz], [1, T.som]]));
    rellena(x, c.rayasTocado, rgba(T.hondo, 0.22));
    rellena(x, c.cabeza, lin(x, 0.14, -0.56, 0.39, -0.35, [[0, acl(T.luz, 0.12)], [0.6, T.luz], [1, T.med]]));
    rellena(x, c.cuerno, lin(x, 0.04, -0.58, 0.2, -0.34, [[0, T.claro], [0.5, T.luz], [1, T.som]]));
    rellena(x, c.anillos, rgba(T.hondo, 0.3));
    rellena(x, c.ojo, rgba(T.hondo, 0.8));
    rellena(x, c.rey, lin(x, 0.33, -0.34, 0.43, -0.06, [[0, T.claro], [1, T.med]])); rellena(x, c.reyCara, rgba(T.luz, 1));
    rellena(x, c.sombra, rgba(T.hondo, 0.22)); rellena(x, c.lineas, rgba(T.hondo, 0.35)); rellena(x, c.luz, rgba(T.claro, 0.45));
  }
  var KA_ESF = 0.165;

  // ---- las columnas papiriformes de la sala hipóstila (alto 1 hasta el ábaco): abierta (campaniforme) o de capullo cerrado
  var hipo = {};
  function plantillaPapiro(abierta) {
    var k = abierta ? 'a' : 'c';
    if (hipo[k]) return hipo[k];
    var c = {}, i;
    c.fuste = forma(function (p) {
      p.moveTo(-0.07, -0.02); p.quadraticCurveTo(-0.082, -0.05, -0.078, -0.09); p.lineTo(-0.072, -0.66); p.lineTo(0.072, -0.66); p.lineTo(0.078, -0.09); p.quadraticCurveTo(0.082, -0.05, 0.07, -0.02); p.closePath();
    });
    c.basa = forma(function (p) { p.rect(-0.09, -0.022, 0.18, 0.022); });
    c.bandas = forma(function (p) { for (i = 0; i < 5; i++) p.rect(-0.073, -0.665 - i * 0.012, 0.146, 0.006); });
    if (abierta) {
      c.capitel = forma(function (p) {
        p.moveTo(-0.072, -0.72); p.bezierCurveTo(-0.09, -0.8, -0.15, -0.87, -0.17, -0.925); p.quadraticCurveTo(-0.17, -0.945, -0.15, -0.945);
        p.lineTo(0.15, -0.945); p.quadraticCurveTo(0.17, -0.945, 0.17, -0.925); p.bezierCurveTo(0.15, -0.87, 0.09, -0.8, 0.072, -0.72); p.closePath();
      });
      c.pintura = new Path2D(); c.pinturaRoja = new Path2D();
      for (i = -3; i <= 3; i++) { var hx = i * 0.034; c.pintura.moveTo(hx * 0.5, -0.725); c.pintura.quadraticCurveTo(hx * 1.4, -0.8, hx * 1.9 - 0.012, -0.87); c.pintura.lineTo(hx * 1.9 + 0.012, -0.87); c.pintura.quadraticCurveTo(hx * 1.4 + 0.012, -0.8, hx * 0.5 + 0.008, -0.725); c.pintura.closePath(); }
      for (i = -4; i <= 4; i++) c.pinturaRoja.rect(i * 0.036 - 0.006, -0.93, 0.012, 0.022);
      c.abaco = forma(function (p) { p.rect(-0.07, -1, 0.14, 0.055); });
    } else {
      c.capitel = forma(function (p) {
        p.moveTo(-0.072, -0.72); p.bezierCurveTo(-0.1, -0.76, -0.105, -0.83, -0.075, -0.9); p.lineTo(-0.06, -0.93); p.lineTo(0.06, -0.93); p.lineTo(0.075, -0.9);
        p.bezierCurveTo(0.105, -0.83, 0.1, -0.76, 0.072, -0.72); p.closePath();
      });
      c.pintura = new Path2D(); c.pinturaRoja = new Path2D();
      for (i = -2; i <= 2; i++) { var px = i * 0.03; c.pintura.moveTo(px - 0.012, -0.72); c.pintura.lineTo(px, -0.79); c.pintura.lineTo(px + 0.012, -0.72); c.pintura.closePath(); }
      for (i = 0; i < 3; i++) c.pinturaRoja.rect(-0.07, -0.875 - i * 0.012, 0.14, 0.005);
      c.abaco = forma(function (p) { p.rect(-0.065, -1, 0.13, 0.07); });
    }
    // los relieves hundidos del fuste: cartuchos y figuras, muy borrosos
    c.relieves = new Path2D();
    for (i = 0; i < 3; i++) { var cy = -0.22 - i * 0.16; c.relieves.rect(-0.04, cy, 0.022, 0.07); c.relieves.rect(0.012, cy - 0.02, 0.024, 0.09); c.relieves.rect(-0.058, cy - 0.035, 0.11, 0.004); }
    return (hipo[k] = c);
  }
  function pintarPapiro(x, c, T) {
    rellena(x, c.basa, cil(x, -0.09, 0.09, T.luz, 0.16));
    rellena(x, c.fuste, cil(x, -0.08, 0.08, T.luz, 0.22));
    rellena(x, c.relieves, rgba(T.hondo, 0.12));
    rellena(x, c.bandas, rgba(T.hondo, 0.3));
    rellena(x, c.capitel, cil(x, -0.17, 0.17, T.luz, 0.22));
    // restos de pintura: azul y verde en los sépalos y rojo en el borde (muy gastados)
    rellena(x, c.pintura, rgba(mez(P.lapis, P.turquesa, 0.4), 0.28)); rellena(x, c.pinturaRoja, rgba(P.rojo, 0.3));
    rellena(x, c.abaco, cil(x, -0.07, 0.07, T.luz, 0.14));
  }

  // ---- un obelisco de granito rosa con el piramidión dorado (alto 1; base en y = 0; ancho de la base 0,088)
  function formasObelisco(c, ox, alto, semilla) {
    var r = U.azar(semilla), b = 0.044 * alto, t = 0.029 * alto, yp = -0.9 * alto, ya = -alto, lado = 0.36;   // (la cara de la derecha, en sombra, es más estrecha)
    var xl = ox - b, xr = ox + b * (1 - lado * 2) , xs = ox + b;   // la arista de delante en xr
    var tl = ox - t, tr = ox + t * (1 - lado * 2), ts = ox + t;
    poli(c.caraLuz, [xl, 0, xr, 0, tr, yp, tl, yp]);
    poli(c.caraSombra, [xr, 0, xs, 0, ts, yp, tr, yp]);
    poli(c.piraLuz, [tl, yp, tr, yp, ox + t * (0.5 - lado), ya]);
    poli(c.piraSombra, [tr, yp, ts, yp, ox + t * (0.5 - lado), ya]);
    // las motas del granito
    for (var i = 0; i < Math.round(alto * 520); i++) {
      var yy = -r() * 0.9 * alto, f = yy / yp, w = b + (t - b) * f, xx = ox - w + r() * w * 2;
      (r() < 0.55 ? c.motas : c.motasClaras).rect(xx, yy, 0.0016, 0.0014);
    }
    // la columna de jeroglíficos en el centro de la cara iluminada, entre dos rayas
    var cx = (xl + xr) / 2, top = yp + 0.02;
    c.rayas.rect(cx - 0.0125, top, 0.0012, -top - 0.02); c.rayas.rect(cx + 0.0113, top, 0.0012, -top - 0.02);
    return { cx: cx, top: top + 0.012, abajo: -0.03 };
  }

  var karnak = null;
  function formasKarnak() {
    if (karnak) return karnak;
    var r = U.azar(1479), c = {}, i;
    // el primer pilono, sin terminar: sillares en bruto, almohadillados, la torre norte más baja y escalonada arriba
    var torres2 = [[-0.43, -0.17, -0.3, 0.02], [-0.088, 0.172, -0.415, 0.028]];   // x0, x1, alto, talud
    c.torres = new Path2D(); c.juntas = new Path2D(); c.almohadas = new Path2D(); c.almohadasOsc = new Path2D(); c.huecos = new Path2D(); c.claros = new Path2D();
    torres2.forEach(function (tw, k) {
      var x0 = tw[0], x1 = tw[1], yt = tw[2], t = tw[3], v = [x0, 0, x1, 0], j;
      // el lado derecho, con sillares que asoman sin labrar
      for (j = 1; j <= 12; j++) { var yy = yt * j / 12, ti = t * j / 12; v.push(x1 - ti + (j % 2 ? 0.003 : -0.001) * (r() + 0.3), yy); }
      // arriba: escalones de sillares que faltan (la del norte, muy irregular)
      var nx = 9, arriba = [];
      for (j = 0; j <= nx; j++) { var xx = x1 - t - (x1 - x0 - 2 * t) * j / nx, sube = k === 0 ? (r() - 0.3) * 0.035 : (r() - 0.5) * 0.008; arriba.push(xx, yt - Math.max(-0.02, sube)); if (j < nx) arriba.push(xx - (x1 - x0 - 2 * t) / nx * 0.02, yt - Math.max(-0.02, sube)); }
      v = v.concat(arriba);
      for (j = 12; j >= 1; j--) { var yy2 = yt * j / 12, ti2 = t * j / 12; v.push(x0 + ti2 - (j % 2 ? 0.002 : -0.001) * (r() + 0.3), yy2); }
      poli(c.torres, v);
      // las hiladas y los sillares, cada uno con su almohadilla (claro arriba a la izquierda, oscuro abajo a la derecha)
      var y = 0, fila = 0;
      while (y > yt + 0.01) {
        var hh = 0.016 + r() * 0.01, ti3 = t * (y - hh / 2) / yt, xa = x0 + ti3 + 0.002, xb = x1 - ti3 - 0.002, xx2 = xa;
        c.juntas.rect(xa, y - hh, xb - xa, 0.0014);
        while (xx2 < xb - 0.008) {
          var w = 0.03 + r() * 0.045, xe = Math.min(xb, xx2 + w), tono = r();
          c.juntas.rect(xe, y - hh + 0.001 * r(), 0.0016, hh);
          // la cara del sillar sin labrar: un abombado claro arriba a la izquierda, sombra abajo; unos más claros, otros más oscuros
          elipse(c.almohadas, xx2 + (xe - xx2) * 0.42, y - hh * 0.62, (xe - xx2) * 0.36, hh * 0.22, 0);
          c.almohadasOsc.rect(xx2 + 0.002, y - 0.004, xe - xx2 - 0.003, 0.0026);
          if (tono < 0.18) c.huecos.rect(xx2 + 0.001, y - hh + 0.0015, xe - xx2 - 0.002, hh - 0.002);
          else if (tono > 0.85) c.claros.rect(xx2 + 0.001, y - hh + 0.0015, xe - xx2 - 0.002, hh - 0.002);
          xx2 = xe;
        }
        y -= hh; fila++;
      }
    });
    // la puerta: las jambas, el paso en sombra y el hueco abierto al cielo entre las torres
    c.paso = forma(function (p) { p.rect(-0.168, -0.235, 0.078, 0.235); });
    c.jambas = forma(function (p) { p.rect(-0.17, -0.24, 0.018, 0.24); p.rect(-0.108, -0.24, 0.018, 0.24); });
    c.fondoPaso = forma(function (p) { p.rect(-0.145, -0.17, 0.032, 0.17); });
    // la sala hipóstila, detrás: columnas de capullo a los lados y abiertas en la nave central, con su arquitrabe y la celosía
    c.cols = [[0.215, false], [0.285, false], [0.36, true], [0.45, true], [0.53, false], [0.6, false]];
    c.arquitrabes = forma(function (p) {
      p.rect(0.185, -0.262, 0.135, 0.022); p.rect(0.495, -0.262, 0.14, 0.022);   // sobre las de capullo
      p.rect(0.32, -0.342, 0.175, 0.024);   // sobre las de la nave central, más alto
    });
    c.celosia = forma(function (p) { p.rect(0.292, -0.318, 0.166, 0.056); });
    c.celosiaHuecos = new Path2D(); for (i = 0; i < 16; i++) c.celosiaHuecos.rect(0.298 + i * 0.0098, -0.312, 0.0052, 0.044);
    c.arqSignos = [];
    frase(1479, 9).forEach(function (g, k) { c.arqSignos.push([g, 0.336 + k * 0.017, -0.323, false]); });
    // los obeliscos, entre el pilono y la sala
    c.ob = { caraLuz: new Path2D(), caraSombra: new Path2D(), piraLuz: new Path2D(), piraSombra: new Path2D(), motas: new Path2D(), motasClaras: new Path2D(), rayas: new Path2D() };
    c.colT = formasObelisco(c.ob, 0.27, 0.42, 11);
    c.colH = formasObelisco(c.ob, 0.425, 0.545, 22);
    // las columnas de signos: títulos reales (rey del Alto y del Bajo Egipto, señor de las Dos Tierras, hijo de Ra, dotado
    // de vida) y los cartuchos (los dos nombres empiezan por Ra: Maatkara y Aajeperkara)
    c.obSignos = []; c.obCartuchos = new Path2D();
    [[c.colT, 0.41], [c.colH, 0.545]].forEach(function (o) {
      var col = o[0], y = col.top, paso = 0.017, sec = ['𓇓', '𓏏', '𓆤', '𓏏', '𓎟', '𓇿', '𓇿', 'C', '𓅭', '𓇳', 'C', '𓂞', '𓋹', '𓇓', '𓏏', '𓆤', '𓏏', '𓎟', '𓇿', '𓇿'];
      for (var k = 0; k < sec.length && y < col.abajo - 0.02; k++) {
        if (sec[k] === 'C') {
          c.obCartuchos.moveTo(col.cx - 0.009, y - 0.012); c.obCartuchos.lineTo(col.cx + 0.009, y - 0.012); c.obCartuchos.lineTo(col.cx + 0.009, y + 0.03);
          c.obCartuchos.lineTo(col.cx - 0.009, y + 0.03); c.obCartuchos.closePath();
          c.obSignos.push(['𓇳', col.cx, y + 0.003, false]);
          y += 0.046;
        } else { c.obSignos.push([sec[k], col.cx, y, false]); y += paso; }
      }
    });
    // la avenida de esfinges: una fila delante y otra detrás (la del otro lado del camino)
    c.esfDetras = [-0.545, -0.36].map(function (xx) { return [xx, -0.02]; });
    c.esfDelante = [-0.555, -0.38, -0.255].map(function (xx) { return [xx, 0]; });
    // el muro bajo de las ruinas delante de la sala, y el suelo de arena
    c.muroBajo = forma(function (p) { poli(p, [0.18, -0.03, 0.24, -0.03, 0.24, -0.038, 0.33, -0.038, 0.33, -0.026, 0.38, -0.026, 0.38, -0.042, 0.49, -0.042, 0.49, -0.032, 0.57, -0.032, 0.57, -0.04, 0.645, -0.04, 0.645, 0, 0.18, 0]); });
    c.muroJuntas = new Path2D(); for (i = 0; i < 23; i++) { var mx = 0.19 + i * 0.02; c.muroJuntas.rect(mx, -0.03, 0.0012, 0.03); } c.muroJuntas.rect(0.18, -0.016, 0.465, 0.0012);
    c.suelo = forma(function (p) { sueloRematado(p, -0.65, -0.012, -0.3, -0.016, 0.2, -0.008, 0.65, -0.014); });
    return (karnak = c);
  }
  var CAJA_ESF = [-0.54 * KA_ESF, -0.75 * KA_ESF, 0.54 * KA_ESF, 0.005];
  var pintorEsfDelante = function (k) { k.save(); k.scale(KA_ESF, KA_ESF); k.translate(0, -0.15); pintarEsfinge(k, plantillaEsfinge(), KA); k.restore(); };
  var pintorEsfDetras = function (k) { k.save(); k.scale(KA_ESF, KA_ESF); k.translate(0, -0.15); pintarEsfinge(k, plantillaEsfinge(), KL); k.restore(); };
  var KA_COL = { cerrada: 0.235, abierta: 0.31 };
  var pintorCol = function (abierta) { return function (k) { var a = abierta ? KA_COL.abierta : KA_COL.cerrada; k.save(); k.scale(a, a); pintarPapiro(k, plantillaPapiro(abierta), KL); k.restore(); }; };
  var pintorColA = pintorCol(true), pintorColC = pintorCol(false);

  function dibujarKarnak(x, X, Y, s, op) {
    var c = formasKarnak(), i; PFX = x;
    x.save(); x.translate(X, Y); x.scale(s, s);
    marca('sala');
    // la sala hipóstila, detrás (más pálida): columnas, arquitrabes, la celosía
    for (i = 0; i < c.cols.length; i++) {
      var ab = c.cols[i][1], a = ab ? KA_COL.abierta : KA_COL.cerrada;
      sello(x, ab ? 'karnak-col-a' : 'karnak-col-c', [-0.18 * a, -a - 0.003, 0.18 * a, 0.003], ab ? pintorColA : pintorColC, c.cols[i][0], -0.03);
    }
    rellena(x, c.arquitrabes, vert(x, -0.345, -0.24, KL.luz, KL.med));
    tallarLista(x, s, c.arqSignos, 0.014, KL.hondo, null, 0.35);
    marca('obeliscos');
    // los obeliscos: la cara al sol y la de sombra, las motas del granito, la columna de signos y el piramidión de oro
    var ob = c.ob;
    rellena(x, ob.caraLuz, lin(x, 0.2, -0.5, 0.4, 0, [[0, RO.luz], [0.6, RO.med], [1, mez(RO.med, RO.som, 0.4)]]));
    rellena(x, ob.caraSombra, lin(x, 0.2, -0.5, 0.45, 0, [[0, RO.som], [1, RO.hondo]]));
    rellena(x, ob.motas, rgba(RO.hondo, 0.45)); rellena(x, ob.motasClaras, rgba(RO.claro, 0.5));
    rellena(x, ob.rayas, rgba(RO.hondo, 0.35)); rellena(x, c.obCartuchos, rgba(RO.hondo, 0.18));
    tallarLista(x, s, c.obSignos, 0.0145, RO.hondo, RO.claro, 0.6);
    rellena(x, ob.piraLuz, ES.oro(x, 0.2, -0.56, 0.42, -0.36, 0.35));
    rellena(x, ob.piraSombra, lin(x, 0.2, -0.55, 0.42, -0.36, [[0, P.oro3], [1, P.oro4]]));
    marca('pilono');
    // el pilono en bruto
    rellena(x, c.torres, lin(x, -0.43, -0.42, 0.17, 0, [[0, acl(KA.luz, 0.06)], [0.55, KA.luz], [1, mez(KA.luz, KA.med, 0.7)]]));
    rellena(x, c.huecos, rgba(KA.med, 0.32)); rellena(x, c.claros, rgba(KA.claro, 0.22));
    rellena(x, c.almohadas, rgba(KA.claro, 0.2)); rellena(x, c.almohadasOsc, rgba(KA.som, 0.26));
    rellena(x, c.juntas, rgba(KA.hondo, 0.26));
    rellena(x, c.paso, vert(x, -0.2, 0, osc(KA.hondo, 0.3), osc(KA.hondo, 0.15)));
    rellena(x, c.fondoPaso, rgba(acl(KA.luz, 0.15), 0.7));
    rellena(x, c.jambas, cil(x, -0.17, -0.09, KA.luz, 0.12));
    marca('esfinges');
    rellena(x, c.muroBajo, vert(x, -0.045, 0, KL.luz, KL.som)); rellena(x, c.muroJuntas, rgba(KL.hondo, 0.25));
    rellena(x, c.suelo, vert(x, -0.016, 0, acl(P.arena, 0.1), P.arena2));
    for (i = 0; i < c.esfDetras.length; i++) sello(x, 'karnak-esf-d', CAJA_ESF, pintorEsfDetras, c.esfDetras[i][0], c.esfDetras[i][1]);
    for (i = 0; i < c.esfDelante.length; i++) sello(x, 'karnak-esf', CAJA_ESF, pintorEsfDelante, c.esfDelante[i][0], c.esfDelante[i][1]);
    marca('fin');
    x.restore();
  }
  AE.arte.karnak = { ancho: 1.3, alto: 0.55, abajo: 0, dibujar: dibujarKarnak, preparar: function () { formasKarnak(); plantillaEsfinge(); plantillaPapiro(true); plantillaPapiro(false); } };

  /* ======================================================================= 5. LOS COLOSOS DE MEMNÓN
     Las dos estatuas sedentes de Amenhotep III en la llanura de Tebas, de cuarcita, muy erosionadas: sin rostro (solo
     queda la masa del nemes), la piedra agrietada y picada, las manos en las rodillas, la reina Tiy y la madre del rey de
     pie junto a las piernas. El de la derecha (el del norte, el «Memnón» que cantaba al amanecer) tiene el cuerpo de arriba
     rehecho con hiladas de arenisca (la reparación de época romana) y en las piernas las marcas finas de las inscripciones
     griegas de los visitantes: «ἤκουσα Μέμνονος», «oí a Memnón». */
  var ME = { med: mez(mez(P.piedra2, P.oro4, 0.35), P.rojo, 0.1) };   // cuarcita parda
  ME.luz = acl(ME.med, 0.22); ME.som = osc(ME.med, 0.25); ME.hondo = osc(ME.med, 0.55); ME.claro = acl(ME.med, 0.42);
  var MA = { luz: mez(P.piedra, P.arena, 0.4), med: mez(P.piedra2, P.arena2, 0.4) };   // la arenisca de la reparación
  MA.som = osc(MA.med, 0.18); MA.hondo = osc(MA.med, 0.5); MA.claro = acl(MA.luz, 0.3);
  var MEM_K = 0.352, MEM_PED = 0.058, MEM_CX = [-0.172, 0.172];
  var memnon = null;
  function formasMemnon() {
    if (memnon) return memnon;
    var r = U.azar(1350), c = {}, i;
    // un coloso gastado, en unidades de coloso (alto 1 de la planta a lo alto de la cabeza; base en y = 0). Cada contorno se
    // hace con muchos puntos y un poco de ruido: la piedra mordida por el viento y la arena de tres mil años
    function gastado(v, amp, sem) {
      var q = U.azar(sem), out = [], n = v.length / 2;
      for (var j = 0; j < n; j++) {
        var x0 = v[2 * j], y0 = v[2 * j + 1], x1 = v[(2 * j + 2) % v.length], y1 = v[(2 * j + 3) % v.length], pasos = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.03));
        for (var k = 0; k < pasos; k++) { var t = k / pasos; out.push(x0 + (x1 - x0) * t + (q() - 0.5) * amp, y0 + (y1 - y0) * t + (q() - 0.5) * amp); }
      }
      return out;
    }
    function f(v, amp, sem) { return forma(function (p) { poli(p, gastado(v, amp, sem)); }); }
    function par(v, amp, sem) { return forma(function (p) { poli(p, gastado(v, amp, sem)); poli(p, gastado(v.map(function (vv, k) { return k % 2 ? vv : -vv; }), amp, sem + 50)); }); }
    c.trono = par([0.16, -0.5, 0.3, -0.5, 0.31, 0, 0.16, 0], 0.012, 3);
    c.hueco = forma(function (p) { p.rect(-0.05, -0.41, 0.1, 0.41); });
    c.piernas = par([0.042, -0.405, 0.09, -0.43, 0.15, -0.41, 0.158, -0.25, 0.148, -0.08, 0.14, -0.06, 0.055, -0.06, 0.045, -0.2], 0.012, 5);
    c.pies = par([0.035, -0.07, 0.15, -0.07, 0.168, -0.03, 0.168, 0, 0.03, 0], 0.01, 7);
    c.regazo = f([-0.17, -0.53, 0.17, -0.53, 0.185, -0.43, 0.06, -0.415, 0, -0.4, -0.06, -0.415, -0.185, -0.43], 0.012, 9);
    c.manos = par([0.04, -0.47, 0.14, -0.475, 0.15, -0.43, 0.13, -0.41, 0.05, -0.41], 0.01, 10);
    c.antebrazos = par([0.25, -0.57, 0.27, -0.52, 0.2, -0.46, 0.13, -0.46, 0.15, -0.5], 0.012, 11);
    c.brazos = par([0.19, -0.76, 0.25, -0.76, 0.285, -0.7, 0.285, -0.6, 0.265, -0.54, 0.205, -0.54, 0.2, -0.62], 0.014, 12);
    c.torso = f([-0.2, -0.76, 0.2, -0.76, 0.205, -0.66, 0.16, -0.53, -0.16, -0.53, -0.205, -0.66], 0.012, 13);
    // la cabeza: el nemes (las alas hasta los hombros, la coronilla redonda), sin rostro, y las solapas sobre el pecho
    c.nemes = f([-0.11, -0.94, -0.06, -0.995, 0.0, -1.0, 0.06, -0.995, 0.11, -0.94, 0.125, -0.86, 0.17, -0.8, 0.24, -0.76, -0.24, -0.76, -0.17, -0.8, -0.125, -0.86], 0.016, 14);
    c.solapas = par([0.075, -0.87, 0.115, -0.85, 0.13, -0.62, 0.075, -0.62], 0.012, 15);
    c.cara = f([-0.07, -0.93, 0.07, -0.93, 0.075, -0.84, 0.05, -0.78, -0.05, -0.78, -0.075, -0.84], 0.02, 16);
    // la reina Tiy y la madre del rey, junto a las piernas; y una hija entre ellas
    c.reinas = forma(function (p) {
      [[-0.235, 0.47, 20], [0.235, 0.45, 21], [0, 0.32, 22]].forEach(function (q) {
        var cx = q[0], h = q[1], w = q[2] === 22 ? 0.038 : 0.052;
        poli(p, gastado([cx - w, 0, cx + w, 0, cx + w * 0.9, -h * 0.62, cx + w * 1.05, -h * 0.82, cx + w * 0.75, -h * 0.97, cx, -h, cx - w * 0.75, -h * 0.97, cx - w * 1.05, -h * 0.82, cx - w * 0.9, -h * 0.62], 0.01, q[2]));
      });
    });
    c.reinasSombra = new Path2D(); poner(c.reinasSombra, c.reinas, 0.012, 0.004, 1);
    // la peluca larga, el cuello y el borde del vestido de cada una (gastados)
    c.reinasDet = forma(function (p) {
      [[-0.235, 0.47], [0.235, 0.45], [0, 0.32]].forEach(function (q) {
        var cx = q[0], h = q[1], w = q[0] ? 0.052 : 0.038;
        poli(p, [cx - w * 0.95, -h * 0.82, cx - w * 0.55, -h * 0.82, cx - w * 0.5, -h * 0.66, cx - w * 0.92, -h * 0.64]);
        poli(p, [cx + w * 0.55, -h * 0.82, cx + w * 0.95, -h * 0.82, cx + w * 0.92, -h * 0.64, cx + w * 0.5, -h * 0.66]);
        p.rect(cx - w * 0.85, -h * 0.6, w * 1.7, h * 0.02);
      });
    });
    // la silueta de la piedra: todas las partes juntas, en el mismo marco en que se pintan (todas van en el mismo sentido:
    // juntas no hacen agujeros). Lo que gasta la piedra (picados, desconchones, grietas, hiladas, sombras y luces) se recorta
    // a ella: si no, lo que cae entre la cabeza y los hombros o junto a los brazos se pintaba en el aire, sobre el papiro
    // dos fondos de piedra bajo las juntas (entre piernas y trono, y entre brazos y torso): como el ruido de «gastado» hace
    // que las partes vecinas no se solapen, entre ellas asomaban rendijas finas de papiro; las partes los tapan y solo
    // se ven por esas rendijas
    c.fondoBajo = forma(function (p) { poli(p, [-0.17, -0.43, 0.17, -0.43, 0.17, 0, -0.17, 0]); });
    c.fondoTorso = forma(function (p) { poli(p, [-0.2, -0.77, 0.2, -0.77, 0.215, -0.66, 0.17, -0.52, -0.17, -0.52, -0.215, -0.66]); });
    c.silueta = new Path2D();
    [c.fondoBajo, c.fondoTorso, c.trono, c.hueco, c.reinas, c.piernas, c.pies, c.regazo, c.manos, c.antebrazos, c.brazos, c.torso, c.nemes, c.solapas, c.cara].forEach(function (q) { c.silueta.addPath(q); });
    // las hiladas de la reparación (de y = −0,6 arriba: dentro de la silueta solo caen en lo de arriba, que es lo rehecho)
    c.hiladas = new Path2D();
    for (var hy = -0.6, fila = 0; hy > -1.0; hy -= 0.075, fila++) {
      c.hiladas.rect(-0.3, hy, 0.6, 0.008);
      for (var jx = -0.26 + (fila % 2) * 0.07; jx < 0.28; jx += 0.13 + r() * 0.05) c.hiladas.rect(jx, hy - 0.075, 0.007, 0.075);
    }
    // grietas, picados y desconchones
    c.grietas = new Path2D(); c.picados = new Path2D(); c.desconchones = new Path2D();
    for (i = 0; i < 8; i++) {
      var gx = -0.25 + r() * 0.5, gy = -0.12 - r() * 0.72, pts = [gx, gy];
      for (var j = 0; j < 5; j++) { gx += (r() - 0.5) * 0.07; gy += 0.025 + r() * 0.04; pts.push(gx, gy); }
      tira(c.grietas, pts, 0.008, 0.002);
    }
    for (i = 0; i < 70; i++) { var px = -0.27 + r() * 0.54, py = -0.04 - r() * 0.92, rr = 0.004 + r() * 0.01; if (Math.abs(px) > 0.2 && py < -0.8) continue; elipse(c.picados, px, py, rr, rr * (0.6 + r() * 0.4), r() * 3); }
    for (i = 0; i < 12; i++) { var dx = -0.25 + r() * 0.5, dy = -0.1 - r() * 0.78, dr = 0.018 + r() * 0.028; if (Math.abs(dx) > 0.18 && dy < -0.8) continue; poli(c.desconchones, [dx - dr, dy, dx - dr * 0.3, dy - dr * 0.7, dx + dr * 0.8, dy - dr * 0.4, dx + dr, dy + dr * 0.3, dx + dr * 0.1, dy + dr * 0.8, dx - dr * 0.7, dy + dr * 0.5]); }
    c.sombras = forma(function (p) {
      poli(p, [0.06, -0.93, 0.075, -0.84, 0.05, -0.78, 0.02, -0.8, 0.04, -0.9]);   // el lado derecho de lo que fue la cara
      poli(p, [0.11, -0.41, 0.15, -0.41, 0.158, -0.25, 0.148, -0.08, 0.11, -0.08, 0.12, -0.25]);
      poli(p, [-0.06, -0.4, -0.045, -0.2, -0.055, -0.06, -0.075, -0.06, -0.08, -0.4]);
      poli(p, [0.15, -0.53, 0.205, -0.66, 0.2, -0.76, 0.17, -0.72, 0.13, -0.56]);
      poli(p, [-0.17, -0.43, 0.17, -0.43, 0.17, -0.41, -0.17, -0.41]);
      poli(p, [0.205, -0.54, 0.265, -0.54, 0.285, -0.6, 0.285, -0.7, 0.26, -0.66, 0.24, -0.58]);
      poli(p, [0.075, -0.62, 0.13, -0.62, 0.135, -0.6, 0.08, -0.6]); poli(p, [-0.13, -0.62, -0.075, -0.62, -0.07, -0.6, -0.125, -0.6]);
    });
    c.luces = forma(function (p) {
      tira(p, [-0.06, -0.99, -0.1, -0.95, -0.12, -0.88], 0.02, 0.01); tira(p, [-0.152, -0.4, -0.156, -0.24, -0.146, -0.09], 0.014, 0.008);
      tira(p, [-0.27, -0.74, -0.284, -0.64, -0.27, -0.56], 0.016, 0.008); elipse(p, -0.1, -0.445, 0.04, 0.01); elipse(p, 0.08, -0.445, 0.03, 0.008);
      elipse(p, -0.12, -0.72, 0.05, 0.016, -0.2); tira(p, [-0.205, -0.6, -0.235, -0.45, -0.24, -0.2], 0.01, 0.006);
    });
    c.pedestal = forma(function (p) {
      var q2 = U.azar(30), v = [];
      for (var k = 0; k <= 20; k++) v.push(-0.35 + k * 0.035, (q2() - 0.5) * 0.014 + (k % 5 === 2 ? 0.01 : 0));
      poli(p, v.concat([0.362, 0.05, 0.364, 0.164, -0.364, 0.164, -0.362, 0.06]));
    });
    // las marcas griegas: renglones cortos y finos en las piernas y los pies del de la derecha
    c.griego = [];
    var palabras = ['ΗΚΟΥΣΑ', 'ΜΕΜΝΟΝΟΣ', 'ΗΚΟΥΣΑ ΜΕΜ', 'ΝΟΝΟΣ'];
    for (i = 0; i < 22; i++) {
      var lado = i % 2 ? 1 : -1, yy = -0.09 - (i >> 1) * 0.029 - r() * 0.01;
      c.griego.push([palabras[Math.floor(r() * palabras.length)], lado * (0.098 + (r() - 0.5) * 0.02), yy]);
    }
    // la llanura: el suelo (los campos de detrás son los del friso, que pasan por debajo de la pieza: una franja propia,
    // de otro verde, se juntaba con ellos en dos costuras verticales)
    c.suelo = forma(function (p) { sueloRematado(p, -0.35, -0.013, -0.1, -0.017, 0.1, -0.011, 0.35, -0.015); });
    return (memnon = c);
  }
  function pintarMemnon(x, c, reparado) {
    // (en su marco: la base de la estatua en y = 0, alto 1)
    rellena(x, c.trono, lin(x, -0.31, -0.5, 0.31, 0, [[0, ME.med], [0.5, ME.som], [1, mez(ME.som, ME.hondo, 0.4)]]));
    rellena(x, c.fondoBajo, rgba(ME.som, 1));   // (solo asoma por las juntas)
    rellena(x, c.hueco, vert(x, -0.41, 0, ME.som, ME.hondo));
    rellena(x, c.reinasSombra, rgba(ME.hondo, 0.35));
    rellena(x, c.reinas, lin(x, -0.3, -0.45, 0.3, 0, [[0, ME.claro], [0.45, ME.luz], [1, ME.med]]));
    rellena(x, c.reinasDet, rgba(ME.hondo, 0.3));
    rellena(x, c.piernas, cil(x, -0.17, 0.17, ME.med, 0.2));
    rellena(x, c.pies, vert(x, -0.07, 0, ME.luz, ME.som));
    rellena(x, c.regazo, lin(x, -0.18, -0.53, 0.18, -0.41, [[0, ME.claro], [0.5, ME.luz], [1, ME.med]]));
    var T = reparado ? MA : ME;
    rellena(x, c.fondoTorso, rgba(T.som, 1));   // (solo asoma por las juntas de los hombros y los brazos)
    rellena(x, c.brazos, cil(x, -0.29, 0.29, T.med, 0.2));
    rellena(x, c.torso, cil(x, -0.21, 0.21, T.med, 0.2));
    rellena(x, c.nemes, lin(x, -0.24, -1.0, 0.24, -0.76, [[0, T.luz], [0.5, T.med], [1, T.som]]));
    rellena(x, c.solapas, cil(x, -0.13, 0.13, T.med, 0.16));
    rellena(x, c.cara, lin(x, -0.075, -0.93, 0.075, -0.78, [[0, mez(T.med, T.som, 0.2)], [1, T.som]]));
    rellena(x, c.antebrazos, cil(x, -0.27, 0.27, ME.med, 0.2));
    rellena(x, c.manos, vert(x, -0.475, -0.41, ME.luz, ME.med));
    // lo que gasta la piedra, recortado a su silueta (cada coloso se pinta una sola vez en su sello: el recorte no se repite)
    x.save(); x.clip(c.silueta);
    if (reparado) rellena(x, c.hiladas, rgba(MA.hondo, 0.4));
    rellena(x, c.desconchones, rgba(ME.claro, 0.2));
    rellena(x, c.picados, rgba(ME.hondo, 0.35));
    rellena(x, c.grietas, rgba(ME.hondo, 0.55));
    rellena(x, c.sombras, rgba(ME.hondo, 0.3));
    rellena(x, c.luces, rgba(ME.claro, 0.32));
    x.restore();
    rellena(x, c.pedestal, lin(x, -0.36, 0, 0.36, 0.165, [[0, ME.luz], [0.5, ME.med], [1, ME.hondo]]));
  }
  // (cada coloso como sello: el origen en el pie del pedestal)
  function pintorMemnon(reparado) { return function (k) { k.save(); k.translate(0, -MEM_PED); k.scale(MEM_K, MEM_K); pintarMemnon(k, formasMemnon(), reparado); k.restore(); }; }
  var pintorMemnonS = pintorMemnon(false), pintorMemnonN = pintorMemnon(true);
  function dibujarMemnon(x, X, Y, s, op) {
    var c = formasMemnon(), i; PFX = x;
    x.save(); x.translate(X, Y); x.scale(s, s);
    marca('suelo');
    rellena(x, c.suelo, vert(x, -0.016, 0, acl(P.arena, 0.08), P.arena2));
    marca('colosos');
    for (i = 0; i < 2; i++) {
      // la sombra en el suelo, hacia la derecha
      x.fillStyle = rgba(ME.hondo, 0.2); x.beginPath(); x.ellipse(MEM_CX[i] + 0.04, -0.004, 0.125, 0.0075, 0, 0, TAU); x.fill();
      sello(x, i ? 'memnon-norte' : 'memnon-sur', [-0.37 * MEM_K, -1.02 * MEM_K - MEM_PED, 0.37 * MEM_K, 0.002], i ? pintorMemnonN : pintorMemnonS, MEM_CX[i], 0);
    }
    marca('griego');
    // las inscripciones griegas: renglones de letras diminutas, rayados en la piedra (oscuro con un filo claro debajo)
    x.save(); x.translate(MEM_CX[1], -MEM_PED); x.scale(1 / s, 1 / s);
    var t = Math.max(3, Math.round(0.0058 * s));
    x.font = t + 'px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    for (var pasada = 0; pasada < 2; pasada++) {
      x.fillStyle = pasada ? rgba(ME.hondo, 0.62) : rgba(ME.claro, 0.5);
      for (i = 0; i < c.griego.length; i++) { var g = c.griego[i]; x.fillText(g[0], g[1] * MEM_K * s + (pasada ? 0 : 0.5), g[2] * MEM_K * s + (pasada ? 0 : 0.5)); }
    }
    x.restore();
    marca('fin');
    x.restore();
  }
  AE.arte.memnon = { ancho: 0.7, alto: 0.42, abajo: 0, dibujar: dibujarMemnon, preparar: formasMemnon };

  /* ======================================================================= 6. DEIR EL-BAHARI
     El templo de Hatshepsut: tres terrazas de caliza pálida con sus pórticos de pilares cuadrados y las dos rampas del
     centro; arriba, el pórtico de las estatuas osíricas de la reina (con la doble corona y la cara roja, como sus restos de
     pintura) y la puerta de granito; en la terraza de en medio, la capilla de Hathor a la izquierda, con sus columnas
     hathóricas, y la de Anubis a la derecha, con sus columnas protodóricas; tras los pilares del pórtico de Punt, restos de
     pintura. Detrás, los acantilados de caliza dorada de la montaña tebana, con sus estratos, sus cárcavas y los conos de
     derrubios al pie. En la terraza de abajo, a la izquierda, un tramo liso del muro (para una procesión pintada). */
  var DB = { luz: mez(P.piedra, P.lino, 0.42), med: mez(P.piedra, P.piedra2, 0.35) };
  DB.som = mez(P.piedra2, P.oro4, 0.12); DB.hondo = osc(DB.som, 0.5); DB.claro = acl(DB.luz, 0.4);
  var CL = { luz: mez(P.arena, P.oro2, 0.25), med: mez(P.arena2, P.oro3, 0.35) };   // los acantilados dorados
  CL.som = osc(mez(P.arena2, P.oro4, 0.35), 0.06); CL.hondo = osc(CL.som, 0.4); CL.claro = acl(CL.luz, 0.3);
  var DB_T1 = -0.105, DB_T2 = -0.208, DB_T3 = -0.302;   // lo alto de cada terraza
  var deir = null;
  function formasDeir() {
    if (deir) return deir;
    var r = U.azar(1479), c = {}, i, j;
    // los acantilados: una pared de caliza de costados casi verticales y el borde de arriba anguloso (la meseta), más alta
    // detrás del templo
    var borde = [], n = 96;
    for (i = 0; i <= n; i++) {
      var xx = -0.6 + i * 1.2 / n, a = Math.abs(xx + 0.03);
      var alto = 0.505 - Math.pow(Math.max(0, a - 0.25) / 0.33, 2) * 0.09 + (U.fbm(xx * 7 + 2, 51, 3) - 0.5) * 0.03;
      if (i % 3 === 0) alto -= r() * 0.014;   // escalones de roca caída
      borde.push(xx, -Math.min(0.52, alto));
    }
    var izq = [-0.65, 0, -0.648, -0.08, -0.638, -0.2, -0.626, -0.3, -0.614, -0.37], der = [0.614, -0.4, 0.626, -0.32, 0.638, -0.2, 0.648, -0.08, 0.65, 0];
    c.borde = borde;
    c.acantilado = forma(function (p) { poli(p, izq.concat(borde).concat(der)); });
    function topeEn(xq) { var t = (xq + 0.6) / 1.2 * n, k = Math.max(0, Math.min(n - 1, Math.floor(t))); return borde[2 * k + 1] + (borde[2 * k + 3] - borde[2 * k + 1]) * (t - k); }
    // los contrafuertes: entre cárcava y cárcava, una costilla vertical con la luz a la izquierda y la sombra a la derecha
    c.carcavas = new Path2D(); c.costillasSombra = new Path2D(); c.costillasLuz = new Path2D(); c.estratos = new Path2D(); c.estratosLuz = new Path2D();
    c.derrubios = new Path2D(); c.derrubiosLuz = new Path2D(); c.bandas = new Path2D();
    var gx = -0.6;
    while (gx < 0.56) {
      var w = Math.min(0.035 + r() * 0.05, 0.6 - gx), top = topeEn(Math.min(0.599, gx + w * 0.5)) + 0.006, bajo = -0.12 - r() * 0.08, sombra = [], luz = [], canal = [];
      for (var yy = top; yy <= bajo + 0.001; yy += 0.05) {
        var o = (U.fbm(yy * 14 + gx * 30, 3, 2) - 0.5) * 0.016, ancho = w * (0.32 + 0.12 * Math.sin(yy * 20 + gx * 9));
        sombra.push(gx + w - ancho + o, yy); luz.push(gx + 0.004 + o, yy); canal.push(gx + w + o * 0.5, yy);
      }
      if (sombra.length > 2) {
        var der2 = sombra.map(function (v, k) { return k % 2 ? v : v + 0.0; });
        var pol = [], k2;
        for (k2 = 0; k2 < sombra.length; k2 += 2) pol.push(sombra[k2], sombra[k2 + 1]);
        for (k2 = canal.length - 2; k2 >= 0; k2 -= 2) pol.push(canal[k2], canal[k2 + 1]);
        poli(c.costillasSombra, pol);
        tira(c.costillasLuz, luz, 0.006, 0.003);
        tira(c.carcavas, canal, 0.006 + r() * 0.006, 0.003);
      }
      gx += w;
    }
    // los estratos: bandas horizontales de la caliza, más claras y más oscuras, con su filo
    for (i = 0; i < 15; i++) {
      var ye = -0.49 + i * 0.03 + (r() - 0.5) * 0.008, seg = [], xi0 = -0.64, tono = r();
      for (j = 0; j <= 14; j++) {
        var xq = xi0 + j * 1.28 / 14, ok = topeEn(Math.max(-0.6, Math.min(0.6, xq))) < ye - 0.006 && Math.abs(xq) < 0.62 + (ye + 0.37) * 0.1;
        if (!ok || r() < 0.18) { if (seg.length > 4) { tira(c.estratos, seg, 0.003, 0.003); if (tono > 0.5) tira(c.bandas, seg.map(function (v, k) { return k % 2 ? v + 0.006 : v; }), 0.009, 0.009); } seg = []; continue; }
        seg.push(xq, ye + Math.sin(xq * 9 + i) * 0.0025 + (U.fbm(xq * 4 + i, 9, 2) - 0.5) * 0.006);
      }
      if (seg.length > 4) { tira(c.estratos, seg, 0.003, 0.003); tira(c.estratosLuz, seg.map(function (v, k) { return k % 2 ? v + 0.0035 : v; }), 0.0018, 0.0018); if (tono > 0.5) tira(c.bandas, seg.map(function (v, k) { return k % 2 ? v + 0.006 : v; }), 0.009, 0.009); }
    }
    // los conos de derrubios al pie, a los dos lados del templo
    // (abanicos de curva cóncava, como cae la grava)
    [[-0.6, 0.1, 0.1], [-0.47, 0.07, 0.08], [0.48, 0.075, 0.09], [0.6, 0.11, 0.09], [-0.34, 0.045, 0.06], [0.35, 0.05, 0.065]].forEach(function (d) {
      var cx = d[0], hgt = d[1], ab = d[2] * 1.7, iz = Math.max(-0.648, cx - ab), de = Math.min(0.648, cx + ab);
      c.derrubios.moveTo(iz, 0); c.derrubios.quadraticCurveTo(cx - (cx - iz) * 0.25, -hgt * 0.15, cx - 0.01, -hgt); c.derrubios.lineTo(cx + 0.01, -hgt);
      c.derrubios.quadraticCurveTo(cx + (de - cx) * 0.25, -hgt * 0.15, de, 0); c.derrubios.closePath();
      c.derrubiosLuz.moveTo(iz, 0); c.derrubiosLuz.quadraticCurveTo(cx - (cx - iz) * 0.25, -hgt * 0.15, cx - 0.01, -hgt); c.derrubiosLuz.lineTo(cx - 0.004, -hgt);
      c.derrubiosLuz.quadraticCurveTo(cx - (cx - iz) * 0.12, -hgt * 0.2, cx - (cx - iz) * 0.35, 0); c.derrubiosLuz.closePath();
    });
    // la terraza de abajo: el muro (liso a los lados) y el pórtico de pilares a cada lado de la rampa
    c.muro1 = forma(function (p) { p.rect(-0.62, DB_T1, 1.24, -DB_T1); });
    c.porticos = new Path2D(); c.pilares = new Path2D(); c.pilaresSombra = new Path2D();
    function portico(x0, x1, yb, yt, n, dos) {
      c.porticos.rect(x0, yt + 0.012, x1 - x0, yb - yt - 0.012);   // el fondo en sombra
      var paso = (x1 - x0) / n;
      for (var k = 0; k <= n; k++) {
        var px = x0 + k * paso - 0.005;
        c.pilares.rect(px, yt + 0.012, 0.01, yb - yt - 0.012); c.pilaresSombra.rect(px + 0.0065, yt + 0.012, 0.0035, yb - yt - 0.012);
        if (dos && k < n) c.pilaresSombra.rect(px + paso * 0.5 + 0.001, yt + 0.012, 0.008, yb - yt - 0.012);   // la segunda fila, al fondo
      }
    }
    portico(-0.37, -0.075, 0, DB_T1, 11, true); portico(0.075, 0.37, 0, DB_T1, 11, true);
    // la terraza de en medio: un poco más atrás (y más estrecha), con su pórtico y las capillas de Hathor y de Anubis
    c.muro2 = forma(function (p) { p.rect(-0.52, DB_T2, 1.04, DB_T1 - DB_T2 - 0.012); });
    portico(-0.395, -0.065, DB_T1 - 0.012, DB_T2, 12, true); portico(0.065, 0.395, DB_T1 - 0.012, DB_T2, 12, true);
    // los restos de pintura de los relieves de Punt, al fondo del pórtico de la izquierda (barcos, árboles de incienso)
    c.punt = new Path2D(); c.puntAzul = new Path2D();
    for (i = 0; i < 8; i++) { var bx = -0.38 + i * 0.039; c.punt.rect(bx, DB_T1 - 0.05, 0.016, 0.006); c.puntAzul.rect(bx + 0.004, DB_T1 - 0.074, 0.01, 0.015); }
    // la capilla de Hathor (izquierda): columnas con la cara de la diosa; la de Anubis (derecha): columnas estriadas
    c.hathor = new Path2D(); c.hathorCaras = new Path2D(); c.anubis = new Path2D(); c.anubisEstrias = new Path2D();
    for (i = 0; i < 3; i++) {
      var hx = -0.5 + 0.018 + i * 0.033;
      c.hathor.rect(hx - 0.006, DB_T2 + 0.016, 0.012, DB_T1 - DB_T2 - 0.028);
      elipse(c.hathorCaras, hx, DB_T2 + 0.026, 0.009, 0.011); poli(c.hathorCaras, [hx - 0.011, DB_T2 + 0.012, hx + 0.011, DB_T2 + 0.012, hx + 0.008, DB_T2 + 0.018, hx - 0.008, DB_T2 + 0.018]);
      var ax = 0.5 - 0.018 - i * 0.033;
      c.anubis.rect(ax - 0.0065, DB_T2 + 0.012, 0.013, DB_T1 - DB_T2 - 0.024);
      for (j = 0; j < 3; j++) c.anubisEstrias.rect(ax - 0.004 + j * 0.003, DB_T2 + 0.014, 0.0011, DB_T1 - DB_T2 - 0.028);
    }
    c.capillas = forma(function (p) { p.rect(-0.52, DB_T2, 0.12, DB_T1 - DB_T2 - 0.012); p.rect(0.4, DB_T2, 0.12, DB_T1 - DB_T2 - 0.012); });
    // la terraza de arriba: el pórtico de las estatuas osíricas y la puerta de granito
    c.muro3 = forma(function (p) { p.rect(-0.31, DB_T3, 0.62, DB_T2 - DB_T3 - 0.01); });
    c.fondo3 = forma(function (p) { p.rect(-0.3, DB_T3 + 0.012, 0.6, DB_T2 - DB_T3 - 0.022); });
    c.osiris = [];
    for (i = 0; i < 12; i++) { var ox = -0.28 + i * 0.05 + (i >= 6 ? 0.01 : -0.01); c.osiris.push(ox); }
    c.puerta3 = forma(function (p) { p.rect(-0.016, DB_T3 + 0.022, 0.032, DB_T2 - DB_T3 - 0.032); });
    c.puerta3Marco = forma(function (p) { p.rect(-0.024, DB_T3 + 0.014, 0.048, DB_T2 - DB_T3 - 0.024); });
    // las cornisas de las tres terrazas (con su filo de luz) y las caras de arriba de cada terraza (al sol)
    c.cornisas = forma(function (p) { p.rect(-0.625, DB_T1, 1.25, 0.012); p.rect(-0.525, DB_T2, 1.05, 0.012); p.rect(-0.315, DB_T3, 0.63, 0.012); });
    c.filos = forma(function (p) { p.rect(-0.625, DB_T1, 1.25, 0.0025); p.rect(-0.525, DB_T2, 1.05, 0.0025); p.rect(-0.315, DB_T3, 0.63, 0.0025); });
    c.terrazas = forma(function (p) { p.rect(-0.6, DB_T1 - 0.012, 1.2, 0.012); p.rect(-0.5, DB_T2 - 0.01, 1.0, 0.01); });
    // las rampas del centro: la de abajo, de la explanada a la primera terraza; la de arriba, a la segunda
    c.rampas = forma(function (p) { poli(p, [-0.07, 0, 0.07, 0, 0.054, DB_T1 - 0.012, -0.054, DB_T1 - 0.012]); poli(p, [-0.052, DB_T1 - 0.012, 0.052, DB_T1 - 0.012, 0.042, DB_T2 - 0.01, -0.042, DB_T2 - 0.01]); });
    c.pretiles = forma(function (p) {
      poli(p, [-0.078, 0, -0.068, 0, -0.053, DB_T1 - 0.012, -0.061, DB_T1 - 0.02]); poli(p, [0.068, 0, 0.078, 0, 0.061, DB_T1 - 0.02, 0.053, DB_T1 - 0.012]);
      poli(p, [-0.058, DB_T1 - 0.012, -0.05, DB_T1 - 0.012, -0.041, DB_T2 - 0.01, -0.047, DB_T2 - 0.016]); poli(p, [0.05, DB_T1 - 0.012, 0.058, DB_T1 - 0.012, 0.047, DB_T2 - 0.016, 0.041, DB_T2 - 0.01]);
    });
    c.rampaLineas = new Path2D(); for (i = 1; i < 10; i++) { var t = i / 10, ry = DB_T1 * t, hw = 0.07 - 0.016 * t; c.rampaLineas.rect(-hw, ry, hw * 2, 0.0012); }
    // el suelo de la explanada
    c.suelo = forma(function (p) { sueloRematado(p, -0.65, -0.01, -0.3, -0.012, 0.3, -0.008, 0.65, -0.012); });
    return (deir = c);
  }
  // una estatua osírica de Hatshepsut: momiforme, con los brazos cruzados (cayado y mayal), la doble corona, la cara roja
  var osirica = null;
  function plantillaOsirica() {
    if (osirica) return osirica;
    var c = {};
    c.cuerpo = forma(function (p) {
      p.moveTo(-0.13, -0.66); p.quadraticCurveTo(-0.15, -0.6, -0.13, -0.5); p.lineTo(-0.1, -0.04); p.lineTo(-0.11, 0); p.lineTo(0.11, 0); p.lineTo(0.1, -0.04); p.lineTo(0.13, -0.5);
      p.quadraticCurveTo(0.15, -0.6, 0.13, -0.66); p.quadraticCurveTo(0.08, -0.7, 0, -0.7); p.quadraticCurveTo(-0.08, -0.7, -0.13, -0.66); p.closePath();
    });
    c.corona = forma(function (p) {
      poli(p, [-0.075, -0.8, 0.075, -0.8, 0.08, -0.86, -0.08, -0.86]);
      p.moveTo(-0.055, -0.86); p.bezierCurveTo(-0.06, -0.93, -0.04, -0.98, -0.02, -0.995); p.quadraticCurveTo(0, -1.01, 0.02, -0.995); p.bezierCurveTo(0.04, -0.98, 0.06, -0.93, 0.055, -0.86); p.closePath();
    });
    c.cara = forma(function (p) { elipse(p, 0, -0.76, 0.05, 0.055); });
    c.barba = forma(function (p) { poli(p, [-0.016, -0.71, 0.016, -0.71, 0.02, -0.64, -0.02, -0.64]); });
    c.brazos = forma(function (p) { poli(p, [-0.12, -0.6, 0.12, -0.5, 0.12, -0.46, -0.12, -0.56]); poli(p, [-0.12, -0.5, 0.12, -0.6, 0.12, -0.56, -0.12, -0.46]); });
    c.cetros = forma(function (p) { tira(p, [-0.09, -0.62, -0.06, -0.48, -0.1, -0.4], 0.018); tira(p, [0.09, -0.62, 0.07, -0.47, 0.11, -0.42], 0.018); });
    return (osirica = c);
  }
  function pintarOsirica(x, c) {
    rellena(x, c.cuerpo, cil(x, -0.15, 0.15, acl(DB.luz, 0.1), 0.2));
    rellena(x, c.brazos, rgba(DB.med, 0.9));
    rellena(x, c.cetros, rgba(mez(P.oro3, DB.med, 0.4), 0.9));
    rellena(x, c.corona, cil(x, -0.08, 0.08, P.lino, 0.12));
    rellena(x, c.cara, ES.rad(x, -0.01, -0.77, 0, 0.06, [[0, mez(P.piel, DB.luz, 0.35)], [1, mez(P.piel2, DB.med, 0.3)]], -0.02, -0.78));
    rellena(x, c.barba, rgba(mez(P.lapis2, DB.som, 0.4), 0.9));
  }
  var DB_OS = 0.075;

  function dibujarDeir(x, X, Y, s, op) {
    var c = formasDeir(), i; PFX = x;
    x.save(); x.translate(X, Y); x.scale(s, s);
    marca('acantilado');
    rellena(x, c.acantilado, lin(x, -0.65, -0.45, 0.65, -0.05, [[0, acl(CL.luz, 0.08)], [0.4, CL.luz], [0.72, CL.med], [1, mez(CL.med, CL.som, 0.6)]]));
    rellena(x, c.bandas, rgba(CL.claro, 0.16));
    rellena(x, c.costillasSombra, rgba(CL.som, 0.3)); rellena(x, c.costillasLuz, rgba(CL.claro, 0.4));
    rellena(x, c.estratos, rgba(CL.hondo, 0.15)); rellena(x, c.estratosLuz, rgba(CL.claro, 0.26));
    rellena(x, c.carcavas, rgba(CL.hondo, 0.35));
    rellena(x, c.derrubios, lin(x, 0, -0.16, 0, 0, [[0, mez(CL.med, CL.luz, 0.4)], [1, mez(CL.luz, P.arena, 0.5)]])); rellena(x, c.derrubiosLuz, rgba(CL.claro, 0.3));
    marca('templo');
    // de arriba abajo: la terraza de arriba (al pie de la roca), la de en medio y la de abajo
    rellena(x, c.muro3, vert(x, DB_T3, DB_T2, DB.luz, DB.med));
    rellena(x, c.fondo3, vert(x, DB_T3, DB_T2, osc(DB.som, 0.15), DB.som));
    rellena(x, c.puerta3Marco, mez(P.rojo, P.lino2, 0.55)); rellena(x, c.puerta3, osc(DB.hondo, 0.4));
    for (i = 0; i < c.osiris.length; i++) sello(x, 'deir-osiris', [-0.16 * DB_OS, -1.02 * DB_OS, 0.16 * DB_OS, 0.002], function (k) { k.save(); k.scale(DB_OS, DB_OS); pintarOsirica(k, plantillaOsirica()); k.restore(); }, c.osiris[i], DB_T2 - 0.01);
    rellena(x, c.muro2, vert(x, DB_T2, DB_T1, DB.luz, DB.med));
    rellena(x, c.capillas, vert(x, DB_T2, DB_T1, DB.luz, DB.som));
    rellena(x, c.terrazas, vert(x, DB_T2 - 0.01, DB_T1, DB.claro, DB.luz));
    rellena(x, c.muro1, lin(x, -0.62, DB_T1, 0.62, 0, [[0, acl(DB.luz, 0.06)], [0.5, DB.luz], [1, DB.med]]));
    rellena(x, c.porticos, vert(x, DB_T2, 0, osc(DB.som, 0.2), DB.som));
    rellena(x, c.punt, rgba(P.rojo, 0.3)); rellena(x, c.puntAzul, rgba(P.egipcio, 0.25));
    rellena(x, c.pilares, lin(x, -0.6, 0, 0.6, 0, [[0, DB.claro], [1, DB.luz]])); rellena(x, c.pilaresSombra, rgba(DB.hondo, 0.35));
    rellena(x, c.hathor, cil(x, -0.5, -0.4, DB.luz, 0.12)); rellena(x, c.hathorCaras, rgba(DB.som, 0.9));
    rellena(x, c.anubis, cil(x, 0.4, 0.5, DB.luz, 0.12)); rellena(x, c.anubisEstrias, rgba(DB.hondo, 0.25));
    rellena(x, c.cornisas, vert(x, DB_T3, 0, DB.med, DB.som)); rellena(x, c.filos, DB.claro);
    marca('rampas');
    rellena(x, c.rampas, vert(x, DB_T2, 0, DB.claro, DB.luz)); rellena(x, c.rampaLineas, rgba(DB.som, 0.25));
    rellena(x, c.pretiles, rgba(DB.som, 0.9));
    rellena(x, c.suelo, vert(x, -0.012, 0, acl(P.arena, 0.12), P.arena2));
    marca('fin');
    x.restore();
  }
  AE.arte.deirElBahari = { ancho: 1.3, alto: 0.52, abajo: 0, dibujar: dibujarDeir, preparar: function () { formasDeir(); plantillaOsirica(); } };
  // el tramo liso del muro de la terraza de abajo (a la izquierda), donde irá la procesión pintada
  AE.arte.deirElBahari.relieve = { dx: -0.495, dy: -0.052, w: 0.22, h: 0.08 };

  /* ======================================================================= 7. EL VALLE DE LOS REYES
     El cerro de al-Qurn, «el cuerno», la pirámide natural que vigila el valle, al fondo y más pálido; delante, las laderas
     del valle seco, de caliza y escombro, con cuatro entradas de tumbas talladas en la roca (rectángulos oscuros con su
     dintel); a la derecha, la entrada grande de la tumba de Ramsés VI (con un resto de su techo azul pintado) y las chozas
     de piedra de los obreros, en ruinas. Debajo de las chozas, arena lisa: ahí estaba escondido el primer escalón de la
     tumba de Tutankamón. */
  var VR = { luz: mez(P.arena, P.piedra, 0.5), med: mez(P.arena2, P.piedra2, 0.5) };
  VR.som = osc(mez(P.piedra2, P.oro4, 0.2), 0.06); VR.hondo = osc(VR.som, 0.5); VR.claro = acl(VR.luz, 0.35);
  var VL = { luz: ES.lejos(VR.luz, 0.35), med: ES.lejos(VR.med, 0.35), som: ES.lejos(VR.som, 0.35) };   // el cerro, lejos
  VL.hondo = ES.lejos(VR.hondo, 0.35); VL.claro = acl(VL.luz, 0.3);
  var valle = null;
  // en los dos bordes de la pieza el cerro y las laderas no se cortan en vertical: bajan hasta el suelo en los últimos
  // PIE_VR u (lo que mide de alto cada punto se multiplica por esto)
  var PIE_VR = 0.07;
  function pieVR(xq) { return U.suave((0.5 - Math.abs(xq)) / PIE_VR); }
  function formasValle() {
    if (valle) return valle;
    var r = U.azar(1922), c = {}, i, j;
    // al-Qurn: la pirámide natural (no una pirámide hecha: laderas desiguales, un hombro a la derecha, la cima roma),
    // con estratos rotos y cárcavas que bajan de la cima
    var qx = -0.06, qy = -0.515, izq = [], der = [], arista = [];
    for (i = 0; i <= 30; i++) {
      var t = i / 30, yy = qy + t * 0.43;
      var ruidoI = (U.fbm(t * 5 + 1, 61, 3) - 0.5) * 0.07 * Math.sin(t * Math.PI) + (U.fbm(t * 23 + 3, 67, 2) - 0.5) * 0.012;
      var ruidoD = (U.fbm(t * 5 + 7, 62, 3) - 0.5) * 0.07 * Math.sin(t * Math.PI) + (U.fbm(t * 23 + 9, 68, 2) - 0.5) * 0.012;
      var hombro = 0.035 * Math.exp(-Math.pow((t - 0.42) / 0.12, 2));   // el hombro de la derecha
      var roma = 0.012 * Math.max(0, 1 - t / 0.06);                     // la cima, algo roma
      izq.push(Math.max(-0.494, qx - 0.006 - roma - t * 0.43 * Math.pow(t, -0.04) + ruidoI), yy);
      der.push(qx + 0.006 + roma + t * 0.47 + hombro + ruidoD, yy);
      arista.push(qx + 0.004 + t * 0.06 + (U.fbm(t * 7, 63, 3) - 0.5) * 0.04 * t, yy);
    }
    // (el pie del cerro baja hasta el suelo, tapado por las laderas: que no flote entre ellas)
    izq.push(Math.max(-0.495, izq[izq.length - 2] - 0.01), -0.004); der.push(Math.min(0.495, der[der.length - 2] + 0.01), -0.004);
    arista.push(arista[arista.length - 2] + 0.012, -0.004);
    // (la falda de la izquierda llega al borde de la pieza a 0,085 de alto: allí baja hasta el suelo, como las laderas)
    for (i = 1; i < izq.length; i += 2) izq[i] *= pieVR(izq[i - 1]);
    for (i = 1; i < der.length; i += 2) der[i] *= pieVR(der[i - 1]);
    var izqSube = []; for (i = izq.length - 2; i >= 0; i -= 2) izqSube.push(izq[i], izq[i + 1]);
    var derSube = []; for (i = der.length - 2; i >= 0; i -= 2) derSube.push(der[i], der[i + 1]);
    c.qurn = forma(function (p) { poli(p, [qx - 0.006, qy - 0.006, qx + 0.006, qy - 0.006].concat(der).concat(izqSube)); });
    c.qurnSombra = forma(function (p) { poli(p, [qx + 0.002, qy - 0.004].concat(arista).concat(derSube)); });
    function anchoQ(yq, lado) { var k = Math.max(0, Math.min(29, Math.floor((yq - qy) / 0.43 * 30))), v = lado < 0 ? izq : der; return v[2 * k]; }
    c.qurnEstratos = new Path2D(); c.qurnEstratosLuz = new Path2D(); c.qurnCarcavas = new Path2D(); c.qurnRoca = new Path2D();
    for (i = 0; i < 16; i++) {
      var ye = qy + 0.035 + i * 0.024 + (r() - 0.5) * 0.008, xa = anchoQ(ye, -1) + 0.012, xb = anchoQ(ye, 1) - 0.012, seg = [];
      for (j = 0; j <= 9; j++) {
        var xq = xa + (xb - xa) * j / 9;
        if (r() < 0.32 && seg.length > 2) { tira(c.qurnEstratos, seg, 0.0026, 0.0026); tira(c.qurnEstratosLuz, seg.map(function (v, k) { return k % 2 ? v + 0.003 : v; }), 0.0015, 0.0015); seg = []; continue; }
        seg.push(xq, ye + (U.fbm(xq * 9 + i, 64, 2) - 0.5) * 0.012);
      }
      if (seg.length > 4) { tira(c.qurnEstratos, seg, 0.0026, 0.0026); tira(c.qurnEstratosLuz, seg.map(function (v, k) { return k % 2 ? v + 0.003 : v; }), 0.0015, 0.0015); }
    }
    for (i = 0; i < 14; i++) {
      var lado = i % 2 ? 1 : -1, cx = qx + lado * (0.02 + r() * 0.2), top = qy + 0.03 + r() * 0.08, pts = [];
      var abre = lado * (0.3 + r() * 0.2);
      for (var yy2 = top; yy2 < -0.14; yy2 += 0.022) {
        var gq = cx + (U.fbm(yy2 * 10 + i, 65, 2) - 0.5) * 0.02 + (yy2 - top) * abre;
        pts.push(Math.max(anchoQ(yy2, -1) + 0.016, Math.min(anchoQ(yy2, 1) - 0.016, gq)), yy2);
      }
      if (pts.length > 2) tira(c.qurnCarcavas, pts, 0.003, 0.009);
    }
    for (i = 0; i < 10; i++) {   // salientes de roca
      var ry0 = qy + 0.08 + r() * 0.3, rx0 = anchoQ(ry0, -1) + 0.02 + r() * (anchoQ(ry0, 1) - anchoQ(ry0, -1) - 0.04), rr = 0.01 + r() * 0.015;
      poli(c.qurnRoca, [rx0 - rr, ry0, rx0 - rr * 0.3, ry0 - rr * 0.6, rx0 + rr, ry0 - rr * 0.2, rx0 + rr * 0.6, ry0 + rr * 0.3]);
    }
    // las laderas del valle, delante: masas de roca irregulares, con escarpes (donde se tallan las tumbas), repisas y taludes
    function ladera(puntos, sem) {
      // puntos: [x, alto] de izquierda a derecha; entre ellos, el borde se rompe un poco
      var q = U.azar(sem), v = [puntos[0][0], 0];
      for (var k = 0; k < puntos.length - 1; k++) {
        var a2 = puntos[k], b2 = puntos[k + 1], m = Math.max(2, Math.round(Math.abs(b2[0] - a2[0]) / 0.012));
        for (var j2 = 0; j2 < m; j2++) { var t3 = j2 / m; v.push(a2[0] + (b2[0] - a2[0]) * t3, -(a2[1] + (b2[1] - a2[1]) * t3 + (q() - 0.5) * 0.008 + (U.fbm((a2[0] + t3) * 20, sem, 2) - 0.5) * 0.01)); }
      }
      var ult = puntos[puntos.length - 1]; v.push(ult[0], -ult[1], ult[0], 0);
      // en el borde de la pieza baja hasta el suelo (pieVR). El perfil de antes se guarda (orig) para contar con él las
      // vetas: así salen las mismas vetas y, detrás de ellas en el azar, las mismas piedras del suelo
      v.orig = v.slice();
      for (var k3 = 1; k3 < v.length; k3 += 2) v[k3] *= pieVR(v[k3 - 1]);
      return v;
    }
    c.laderaIzq = ladera([[-0.5, 0.13], [-0.47, 0.165], [-0.43, 0.185], [-0.38, 0.196], [-0.33, 0.2], [-0.29, 0.192], [-0.25, 0.178], [-0.21, 0.15], [-0.17, 0.122], [-0.12, 0.1], [-0.08, 0.07], [-0.04, 0.036], [0.0, 0.012]], 3);
    c.laderaDer = ladera([[0.05, 0.015], [0.09, 0.05], [0.13, 0.075], [0.17, 0.1], [0.21, 0.14], [0.26, 0.17], [0.31, 0.184], [0.36, 0.188], [0.41, 0.182], [0.46, 0.165], [0.5, 0.14]], 9);
    c.laderas = forma(function (p) { poli(p, c.laderaIzq); poli(p, c.laderaDer); });
    // los escarpes: caras de roca casi verticales en la parte baja de cada ladera (en ellas se abren las tumbas)
    c.escarpes = forma(function (p) {
      poli(p, [-0.415, 0, -0.41, -0.06, -0.398, -0.072, -0.385, -0.068, -0.37, -0.082, -0.35, -0.076, -0.335, -0.084, -0.318, -0.07, -0.31, -0.05, -0.3, 0]);
      poli(p, [-0.212, 0, -0.208, -0.07, -0.195, -0.08, -0.18, -0.074, -0.162, -0.088, -0.145, -0.08, -0.133, -0.066, -0.128, 0]);
      poli(p, [0.088, 0, 0.092, -0.05, 0.104, -0.058, 0.118, -0.054, 0.132, -0.062, 0.14, -0.046, 0.143, 0]);
      poli(p, [0.205, 0, 0.21, -0.085, 0.226, -0.098, 0.245, -0.092, 0.262, -0.105, 0.282, -0.098, 0.296, -0.08, 0.302, 0]);
    });
    c.escarpesSombra = forma(function (p) { poli(p, [-0.31, -0.07, -0.3, -0.07, -0.29, 0, -0.3, 0]); poli(p, [0.29, -0.11, 0.3, -0.118, 0.305, 0, 0.295, 0]); });
    c.laderasSombra = forma(function (p) {
      // las caras que miran a la derecha, en sombra
      poli(p, [-0.29, -0.19, -0.25, -0.176, -0.21, -0.148, -0.17, -0.12, -0.12, -0.098, -0.08, -0.068, -0.04, -0.034, 0.0, -0.012, 0.0, 0, -0.12, 0, -0.2, -0.07, -0.26, -0.12]);
      // (la de la derecha llega al borde de la pieza: allí baja con la ladera)
      var somb = [];
      for (var xs = 0.41; xs < 0.5005; xs += 0.01) somb.push(xs, (xs < 0.46 ? -0.18 + (xs - 0.41) / 0.05 * 0.017 : -0.163 + (xs - 0.46) / 0.04 * 0.025) * pieVR(xs));
      poli(p, somb.concat([0.5, 0, 0.42, 0, 0.39, -0.1]));
    });
    c.laderasEstratos = new Path2D(); c.laderasLuz = new Path2D(); c.escombros = new Path2D(); c.escombrosLuz = new Path2D();
    [c.laderaIzq, c.laderaDer].forEach(function (v) {
      for (var k = 3; k < v.length - 5; k += 2) {
        var x0 = v[k - 1], y0 = v[k], x1 = v[k + 1], y1 = v[k + 2], pie = y0 !== v.orig[k] || y1 !== v.orig[k + 2];
        for (var e = 0.02; e < -v.orig[k] - 0.01; e += 0.026) {
          if (r() < 0.5) {
            var ye2 = y0 + e + (r() - 0.5) * 0.004;
            // (en el pie de los bordes, solo las vetas que quedan dentro de la ladera)
            if (!pie || (ye2 > Math.max(y0, y1) + 0.006 && ye2 < -0.01)) c.laderasEstratos.rect(x0, ye2, x1 - x0 + 0.002, 0.0024);
          }
        }
        if (r() < 0.7) tira(c.laderasLuz, [x0, y0 + 0.0025, x1, y1 + 0.0025], 0.0032);
      }
    });
    // los taludes de escombro, claros, al pie de las laderas
    c.taludes = forma(function (p) {
      [[-0.41, 0.045, 0.05], [-0.25, 0.035, 0.045], [-0.06, 0.022, 0.06], [0.17, 0.03, 0.04], [0.41, 0.04, 0.05]].forEach(function (d) {
        p.moveTo(d[0] - d[2] * 1.8, 0); p.bezierCurveTo(d[0] - d[2] * 0.9, -d[1] * 0.4, d[0] - d[2] * 0.5, -d[1], d[0], -d[1]);
        p.bezierCurveTo(d[0] + d[2] * 0.5, -d[1], d[0] + d[2] * 0.9, -d[1] * 0.4, d[0] + d[2] * 1.8, 0); p.closePath();
      });
    });
    // el suelo del valle, el camino y los montones de escombro de las excavaciones
    c.suelo = forma(function (p) { sueloRematado(p, -0.5, -0.02, -0.3, -0.03, 0.1, -0.012, 0.5, -0.025); });
    c.camino = forma(function (p) { p.moveTo(-0.5, -0.004); p.bezierCurveTo(-0.2, -0.016, 0.0, -0.006, 0.2, -0.012); p.bezierCurveTo(0.3, -0.016, 0.4, -0.01, 0.5, -0.012); p.lineTo(0.5, -0.004); p.bezierCurveTo(0.3, -0.004, 0.0, 0.0, -0.5, 0.0); p.closePath(); });
    for (i = 0; i < 40; i++) {
      var bx = -0.48 + r() * 0.96, by = -0.004 - r() * 0.02, br = 0.003 + r() * 0.007;
      if (bx > 0.27 && bx < 0.37) continue;   // (la arena lisa del escalón, sin piedras)
      poli(c.escombros, [bx - br, by, bx - br * 0.4, by - br * 0.9, bx + br * 0.6, by - br * 0.8, bx + br, by]);
      elipse(c.escombrosLuz, bx - br * 0.3, by - br * 0.55, br * 0.35, br * 0.18);
    }
    // las entradas de las tumbas: [x, base, ancho, alto]; la última, la grande de Ramsés VI
    c.tumbas = [[-0.365, -0.014, 0.028, 0.04], [-0.168, -0.022, 0.026, 0.036], [0.116, -0.012, 0.022, 0.03], [0.252, -0.012, 0.044, 0.058]];
    c.vanos = new Path2D(); c.marcos = new Path2D(); c.dinteles = new Path2D(); c.cortes = new Path2D(); c.dentro = new Path2D();
    c.tumbas.forEach(function (tb) {
      var tx = tb[0], ty = tb[1], w = tb[2], h = tb[3];
      // el corte en la roca (la cara tallada, plana, alrededor de la puerta)
      poli(c.cortes, [tx - w * 1.2, ty, tx + w * 1.2, ty, tx + w * 1.05, ty - h * 1.5, tx - w * 1.05, ty - h * 1.5]);
      c.marcos.rect(tx - w / 2 - w * 0.14, ty - h - h * 0.06, w * 1.28, h * 1.06);
      c.vanos.rect(tx - w / 2, ty - h, w, h);
      c.dinteles.rect(tx - w / 2 - w * 0.24, ty - h - h * 0.22, w * 1.48, h * 0.18);
      poli(c.dentro, [tx - w / 2, ty, tx + w / 2, ty, tx + w * 0.18, ty - h * 0.45, tx - w * 0.18, ty - h * 0.45]);   // el pasillo que baja
    });
    var g = c.tumbas[3];
    c.techoAzul = forma(function (p) { p.rect(g[0] - g[2] * 0.42, g[1] - g[3] * 0.96, g[2] * 0.84, g[3] * 0.16); });
    c.estrellas = new Path2D(); for (i = 0; i < 6; i++) circulo(c.estrellas, g[0] - g[2] * 0.36 + i * g[2] * 0.14, g[1] - g[3] * 0.88, 0.0012);
    c.paredes = forma(function (p) { poli(p, [g[0] - g[2] * 0.5, g[1] - g[3], g[0] - g[2] * 0.25, g[1] - g[3] * 0.78, g[0] - g[2] * 0.22, g[1] - g[3] * 0.3, g[0] - g[2] * 0.5, g[1]]); });
    c.escalera = new Path2D(); for (i = 0; i < 4; i++) c.escalera.rect(g[0] - g[2] * 0.5, g[1] - 0.002 - i * 0.004, g[2], 0.0015);
    // las chozas de los obreros, en ruinas: muretes de piedra seca en cuartos pequeños, junto a la tumba de Ramsés VI
    c.piedras = new Path2D(); c.piedrasOsc = new Path2D(); c.piedrasLuz = new Path2D(); c.suelos = new Path2D(); c.murosSombra = new Path2D();
    var cuartos = [[0.282, -0.022, 0.03, 0.016], [0.316, -0.024, 0.034, 0.018], [0.354, -0.02, 0.03, 0.016], [0.392, -0.023, 0.028, 0.015]];
    cuartos.forEach(function (q, k) {
      var qx2 = q[0], qy2 = q[1], qw = q[2], qh = q[3];
      c.suelos.rect(qx2 - qw / 2, qy2 - qh * 0.5, qw, qh * 0.5);
      // los muros: el de atrás (más alto) y los dos de los lados, con huecos
      function muro(xa2, ya2, xb2, yb2, alto) {
        var len = Math.hypot(xb2 - xa2, yb2 - ya2), nps = Math.max(2, Math.round(len / 0.0055));
        for (var m = 0; m < nps; m++) {
          if (r() < 0.12) continue;
          var t4 = m / nps, sx = xa2 + (xb2 - xa2) * t4, sy = ya2 + (yb2 - ya2) * t4;
          var hileras = Math.max(1, Math.round(alto / 0.004 * (0.5 + r() * 0.6)));
          c.murosSombra.rect(sx - 0.003, sy - 0.0006, 0.0065, 0.0016);
          for (var hh2 = 0; hh2 < hileras; hh2++) {
            var pw = 0.0042 + r() * 0.0025, ph = 0.003 + r() * 0.0014, py2 = sy - hh2 * 0.0036, px3 = sx - pw / 2 + (r() - 0.5) * 0.0012;
            (r() < 0.35 ? c.piedrasOsc : c.piedras).rect(px3, py2 - ph, pw, ph); c.piedrasLuz.rect(px3, py2 - ph, pw * 0.55, ph * 0.3);
          }
        }
      }
      muro(qx2 - qw / 2, qy2 - qh * 0.5, qx2 + qw / 2, qy2 - qh * 0.5, 0.013);
      muro(qx2 - qw / 2, qy2 - qh * 0.5, qx2 - qw / 2 - 0.004, qy2 + qh * 0.4, 0.009);
      if (k === cuartos.length - 1) muro(qx2 + qw / 2, qy2 - qh * 0.5, qx2 + qw / 2 + 0.004, qy2 + qh * 0.4, 0.008);
      muro(qx2 - qw / 2 - 0.004, qy2 + qh * 0.4, qx2 + 0.002, qy2 + qh * 0.42, 0.005);
    });
    // la arena lisa bajo las chozas (el escalón escondido)
    c.arenaLisa = forma(function (p) { elipse(p, 0.318, -0.006, 0.05, 0.005); });
    return (valle = c);
  }
  function dibujarValle(x, X, Y, s, op) {
    var c = formasValle(), i; PFX = x;
    x.save(); x.translate(X, Y); x.scale(s, s);
    marca('qurn');
    rellena(x, c.qurn, lin(x, -0.5, -0.5, 0.4, -0.1, [[0, acl(VL.luz, 0.08)], [0.5, VL.luz], [1, VL.med]]));
    rellena(x, c.qurnSombra, lin(x, -0.08, -0.5, 0.4, -0.1, [[0, VL.med], [1, mez(VL.med, VL.som, 0.6)]]));
    rellena(x, c.qurnEstratos, rgba(VL.som, 0.2)); rellena(x, c.qurnEstratosLuz, rgba(VL.claro, 0.3)); rellena(x, c.qurnCarcavas, rgba(VL.som, 0.3));
    rellena(x, c.qurnRoca, rgba(VL.claro, 0.3));
    marca('laderas');
    rellena(x, c.laderas, lin(x, -0.5, -0.22, 0.5, 0, [[0, acl(VR.luz, 0.06)], [0.5, VR.luz], [1, VR.med]]));
    rellena(x, c.laderasSombra, rgba(VR.som, 0.32));
    rellena(x, c.laderasEstratos, rgba(VR.hondo, 0.2)); rellena(x, c.laderasLuz, rgba(VR.claro, 0.5));
    rellena(x, c.escarpes, lin(x, -0.4, -0.12, 0.3, 0, [[0, mez(VR.luz, VR.med, 0.35)], [1, mez(VR.med, VR.som, 0.4)]])); rellena(x, c.escarpesSombra, rgba(VR.hondo, 0.35));
    rellena(x, c.taludes, vert(x, -0.06, 0, mez(VR.luz, P.arena, 0.4), mez(VR.med, P.arena2, 0.4)));
    marca('tumbas');
    rellena(x, c.dinteles, vert(x, -0.09, -0.03, acl(VR.luz, 0.2), VR.med));
    rellena(x, c.marcos, rgba(VR.som, 0.6));
    rellena(x, c.vanos, vert(x, -0.09, 0, osc(VR.hondo, 0.55), osc(VR.hondo, 0.3)));
    rellena(x, c.dentro, rgba(VR.hondo, 0.5));
    // dentro de la de Ramsés VI: el techo azul con estrellas y la pared pintada, apenas
    rellena(x, c.techoAzul, rgba(mez(P.lapis2, VR.hondo, 0.35), 0.9)); rellena(x, c.estrellas, rgba(P.oro1, 0.75));
    rellena(x, c.paredes, rgba(mez(P.oro2, VR.som, 0.5), 0.55));
    rellena(x, c.escalera, rgba(VR.claro, 0.35));
    marca('suelo');
    rellena(x, c.suelo, vert(x, -0.03, 0, acl(P.arena, 0.1), P.arena2));
    x.save(); x.clip(c.suelo); rellena(x, c.camino, rgba(acl(P.arena, 0.3), 0.6)); x.restore();   // (el camino, dentro del suelo: en los bordes baja con él)
    rellena(x, c.arenaLisa, rgba(acl(P.arena, 0.25), 0.7));
    rellena(x, c.escombros, lin(x, -0.5, -0.03, 0.5, 0, [[0, VR.luz], [1, VR.som]])); rellena(x, c.escombrosLuz, rgba(VR.claro, 0.5));
    marca('chozas');
    rellena(x, c.suelos, rgba(VR.med, 0.35));
    rellena(x, c.murosSombra, rgba(VR.hondo, 0.3));
    rellena(x, c.piedras, lin(x, 0.26, -0.04, 0.42, -0.005, [[0, mez(VR.luz, VR.med, 0.3)], [1, VR.som]])); rellena(x, c.piedrasOsc, rgba(mez(VR.som, VR.hondo, 0.3), 1));
    rellena(x, c.piedrasLuz, rgba(VR.claro, 0.4));
    marca('fin');
    x.restore();
  }
  AE.arte.valleReyes = { ancho: 1.0, alto: 0.52, abajo: 0, dibujar: dibujarValle, preparar: formasValle };
  // el sitio en el suelo, bajo las chozas de los obreros, donde estaba escondido el primer escalón de Tutankamón
  AE.arte.valleReyes.escalon = { dx: 0.318, dy: -0.006, w: 0.04 };

  /* ---------- al cargar: las formas y los sellos ----------
     Nada más cargar, cada pieza hace sus formas (preparar) y se pinta una vez en un lienzo de 1 × 1, lejos de él: no
     queda nada pintado, pero sus sellos quedan hechos a la escala más probable de las teselas del mundo (la del motor:
     E.u, el alto de la ventana o 1,25 veces el ancho en un móvil de pie, por la densidad de píxeles, hasta 2). Así el
     primer dibujo de cada monumento no paga el pintado de sus sellos. Una pieza por turno, para no hacer una tarea larga;
     si al final la escala es otra, los sellos se hacen en el primer dibujo. Ningún sello lleva letra (los signos se
     escriben siempre aparte): pintarlos antes de que cargue la fuente no estropea nada. */
  function precalentar() {
    var lista = ['abuSimbel', 'filae', 'edfu', 'karnak', 'memnon', 'deirElBahari', 'valleReyes'].map(function (n) { return AE.arte[n]; });
    var L = U.lienzo(1, 1), e = Math.min(window.devicePixelRatio || 1, 2), s = Math.min(window.innerHeight || 900, (window.innerWidth || 1440) * 1.25);
    (function una(i) {
      if (i >= lista.length || window.__sinPrecalentar) return;
      try { lista[i].preparar(); L.x.setTransform(e, 0, 0, e, 0, 0); lista[i].dibujar(L.x, -1e5, -1e5, s, {}); } catch (err) { console.error(err); }
      setTimeout(function () { una(i + 1); }, 20);
    })(0);
  }
  setTimeout(precalentar, 0);

})();

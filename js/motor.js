/* Aegyptus Incognita · motor
   Un friso egipcio pintado, larguísimo, que se recorre en horizontal siguiendo el Nilo de sur a norte: la cámara con
   inercia, las capas con paralaje (teselas que mueve la GPU), el cálamo del escriba que escribe sobre el papiro y se
   seca, la entrada (rueda, arrastre, táctil, teclado) y las escenas de los secretos.
   Todo en píxeles CSS. La unidad de diseño «u» es el alto del friso (el alto de la pantalla, salvo en un móvil de pie):
   las posiciones del mundo van en u. x en pantalla de algo en xu: E.sx(xu, p); y: E.sy(yu). */
(function () {
  'use strict';
  var AE = window.AE = window.AE || {};
  var TAU = Math.PI * 2;

  /* ------------------------------------------------------------------ utilidades */
  var U = AE.util = {
    clamp: function (x, a, b) { return x < a ? a : x > b ? b : x; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    tramo: function (t, a, b) { return U.clamp((t - a) / (b - a), 0, 1); },
    suave: function (t) { t = U.clamp(t, 0, 1); return t * t * (3 - 2 * t); },
    entra: function (t) { t = U.clamp(t, 0, 1); return t * t * t; },
    sale: function (t) { t = U.clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); },
    inOut: function (t) { t = U.clamp(t, 0, 1); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
    rebote: function (t) { t = U.clamp(t, 0, 1); var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    meseta: function (t, a, b, c, d) { return t < a || t > d ? 0 : t < b ? U.suave((t - a) / (b - a)) : t > c ? 1 - U.suave((t - c) / (d - c)) : 1; },
    azar: function (semilla) { var s = (semilla | 0) || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; },
    rgba: function (c, a) { if (a == null) a = 1; return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + (a < 0 ? 0 : a > 1 ? 1 : a).toFixed(3) + ')'; },
    mezcla: function (a, b, t) { return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)]; },
    hex: function (h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; },
    num: function (x, dec) {
      var s = Math.abs(x).toFixed(dec || 0).split('.'), ent = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return (x < 0 ? '−' : '') + ent + (s[1] ? ',' + s[1] : '');
    },
    dos: function (n) { return (n < 10 ? '0' : '') + n; },
    // ruido de valor en 1D (suave) y su suma en octavas
    ruido: function (x, semilla) {
      var i = Math.floor(x), f = x - i, a = U._h(i + (semilla | 0) * 131), b = U._h(i + 1 + (semilla | 0) * 131);
      f = f * f * (3 - 2 * f); return a + (b - a) * f;
    },
    _h: function (n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); },
    fbm: function (x, semilla, oct) { var v = 0, a = 0.5, f = 1; for (var o = 0; o < (oct || 4); o++) { v += U.ruido(x * f, semilla + o * 7) * a; a *= 0.5; f *= 2.03; } return v; },
    // lienzos aparte: para pintar una vez y dibujar muchas
    lienzo: function (w, h) {
      var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
      var x = c.getContext('2d'); x.lineCap = 'round'; x.lineJoin = 'round';
      return { c: c, x: x, w: c.width, h: c.height };
    }
  };
  // lienzos de trabajo reutilizados (crear y tirar lienzos grandes provoca parones del recolector)
  var auxiliares = {};
  U.auxiliar = function (nombre, w, h) {
    w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
    var L = auxiliares[nombre];
    if (!L || L.c.width < w || L.c.height < h) L = auxiliares[nombre] = U.lienzo(Math.max(w, L ? L.c.width : 0), Math.max(h, L ? L.c.height : 0));
    L.x.setTransform(1, 0, 0, 1, 0, 0); L.x.globalAlpha = 1; L.x.globalCompositeOperation = 'source-over';
    L.x.clearRect(0, 0, w + 3, h + 3); L.w = w; L.h = h;
    return L;
  };
  /* Espera a que WebKit haya pintado de verdad todo lo pedido (ver guia/05): Safari pinta los lienzos en otro proceso y el
     JavaScript acaba antes. Leer un píxel obliga a terminar lo pendiente; sin esto, el trabajo se acumula y hay parones. */
  var unPixel = null;
  U.vaciar = function () {
    if (!unPixel) unPixel = U.lienzo(1, 1);
    try { unPixel.x.fillRect(0, 0, 1, 1); unPixel.x.getImageData(0, 0, 1, 1); } catch (err) { /* nada */ }
  };

  // los colores del mundo (la paleta completa, con sus degradados, vive en estilo.js) y el único acento de la interfaz:
  // el lapislázuli, para lo que se descubre (como el bermellón de Iaponia y el cian de Mare)
  AE.color = {
    papiro: [247, 226, 184],
    tinta: [58, 38, 20],
    acento: [47, 79, 166],
    oro: [246, 183, 51],
    noche: [24, 34, 74]
  };
  var C = AE.color;

  /* ------------------------------------------------------------------ el motor */
  var E = AE.motor = {
    t: 0, W: 800, H: 600, u: 600, y0: 0, dpr: 1,
    largo: 15.6,              // lo que mide el friso, en u (de Abu Simbel al mar)
    camX: 0, velX: 0, empuje: 0, camObj: null,   // camObj: adonde va la cámara (la rueda la mueve y la cámara la sigue con suavidad)
    camVel: 0,                // px por ms de pantalla, para el taller y el gato
    puntero: { x: -999, y: -999, sobre: false, tipo: 'mouse', vx: 0, vy: 0, velocidad: 0 },
    viento: 0, senal: 0,
    escena: null, bloqueado: false, ligero: false, lectura: 5000,
    ultimoInput: 0, calamo: true,  // en móvil se puede cambiar a «mover»
    oyentes: {}, capas: []
  };
  var cv, ctx, raf = window.requestAnimationFrame.bind(window), ultimoRaf = null, congelado = false, cam = null, mediaDt = 16, mediaCoste = 4, nMedidos = 0;
  /* Las capas, de abajo arriba (para que vaya fluido en Safari, lo grande y quieto lo mueve la GPU y en cada fotograma
     solo se pinta lo que cambia; ver guia/05 y Mare Incognita):
     · fondo: el papiro con sus jeroglíficos y lo lejano, en teselas fijas en el mundo (p = 0,9); se pintan una vez.
     · tinte del fondo: un <div> que multiplica (CSS): la luz de la hora del día sobre el papiro.
     · cielo: el sol (lienzo a media resolución, transparente).
     · medio: las colinas lejanas del desierto, en teselas (p = 0,95): el sol sale y se pone detrás.
     · mundo: los monumentos, el suelo, el Nilo y las cenefas, en teselas (p = 1).
     · el lienzo del motor (transparente): lo que se mueve (el gato, la vida, las escenas, la tinta del cálamo).
     · delante: los papiros y lotos de primer plano, en teselas (p = 1,12).
     · tinte del mundo: otro <div> que multiplica, más suave.
     · brillo: lo que da luz por encima de todo (las estrellas, la luna, el fuego del faro), a media resolución. */
  var cvCielo, ctxCielo, cvBrillo, ctxBrillo, tinteFondo, tinteMundo;
  E.ESC_CIELO = 0.5; E.ESC_BRILLO = 0.5;

  E.en = function (n, fn) { (E.oyentes[n] = E.oyentes[n] || []).push(fn); };
  function emitir(n, d) { var l = E.oyentes[n]; if (!l) return; for (var i = 0; i < l.length; i++) { try { l[i](d); } catch (err) { console.error(err); } } }
  E.emitir = emitir;

  /* ---------- coordenadas ---------- */
  // x en pantalla de algo que está en xu (u) en una capa de profundidad p; y en pantalla de algo en yu (del friso)
  E.sx = function (xu, p) { p = p == null ? 1 : p; return E.W / 2 + (xu * E.u - E.W / 2 - E.camX) * p; };
  E.sy = function (yu) { return E.y0 + yu * E.u; };
  E.xuDe = function (sx) { return (sx + E.camX) / E.u; };    // en la capa del mundo (p = 1)
  E.yuDe = function (sy) { return (sy - E.y0) / E.u; };
  E.centroXu = function () { return (E.camX + E.W / 2) / E.u; };
  E.maxCam = function () { return Math.max(0, E.largo * E.u - E.W); };
  E.irA = function (xu, ms, ease) {   // centra la cámara en xu (y guarda el viaje en u: si cambia el tamaño, se recalcula)
    cam = { x0: E.camX, x1: U.clamp(xu * E.u - E.W / 2, 0, E.maxCam()), xu0: E.centroXu(), xu1: xu, t0: E.t, dur: ms || 1400, ease: ease || U.inOut };
    E.velX = 0; E.camObj = null;
  };
  E.camaraActiva = function () { return !!cam; };

  /* ---------- tamaño ---------- */
  var tinta, ctxTinta, tmp, ctxTmp;
  function medir() {
    var w = window.innerWidth, h = window.innerHeight;
    var centro = E.u ? E.centroXu() : 0;
    // la unidad es el alto de la pantalla, salvo en pantallas estrechas (un móvil de pie): ahí manda el ancho, para que se
    // vea un buen trozo de friso; arriba y abajo sigue el papiro
    E.W = w; E.H = h; E.u = Math.min(h, w * 1.25); E.y0 = Math.round((h - E.u) * 0.42);
    E.dpr = E.ligero ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(w * E.dpr); cv.height = Math.round(h * E.dpr);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    [tinta, tmp].forEach(function (c) { c.width = cv.width; c.height = cv.height; });
    E.ESC_CIELO = E.ligero ? 0.4 : 0.5; E.ESC_BRILLO = E.ligero ? 0.4 : 0.5;
    cvCielo.width = Math.max(1, Math.round(w * E.ESC_CIELO)); cvCielo.height = Math.max(1, Math.round(h * E.ESC_CIELO));
    cvBrillo.width = Math.max(1, Math.round(w * E.ESC_BRILLO)); cvBrillo.height = Math.max(1, Math.round(h * E.ESC_BRILLO));
    E.camX = U.clamp(centro * E.u - E.W / 2, 0, E.maxCam()); E.camObj = null;
    if (cam) { cam.x0 = U.clamp(cam.xu0 * E.u - E.W / 2, 0, E.maxCam()); cam.x1 = U.clamp(cam.xu1 * E.u - E.W / 2, 0, E.maxCam()); }
    emitir('medida', { W: w, H: h });
  }

  /* ------------------------------------------------------------------ las capas de teselas
     Cada capa vive en un contenedor que la GPU desplaza (transform) con su paralaje. Dentro, lienzos de TW px de ancho
     y todo el alto de la pantalla, fijos en el espacio de la capa: λ = xu · p (en px: λ · u). Su x en pantalla es
     λ·u + W/2·(1 − p) − camX·p. Cada tesela se pinta una vez, por pasos (el pintor es un generador), antes de que haga
     falta: primero las que se ven, luego las de al lado hacia donde vas. Si se ve una sin pintar, se termina de golpe.
     def = { nombre, p, esc (resolución respecto a la CSS, sin el dpr), el (contenedor), pintar(ctx, xu0, xu1, tesela) } */
  var CAPAS_T = [];
  E.TW = 512;   // ancho de una tesela, en px CSS
  E.capaTeselas = function (def) {
    def.vivas = {}; def.libres = []; def.clave = ''; def.desp = null; def.listas = 0;
    CAPAS_T.push(def); return def;
  };
  E.capasTeselas = function () { return CAPAS_T; };
  function escTesela(k) { return (k.esc || 1) * (E.ligero ? 1 : E.dpr) * (E.ligero ? 0.75 : 1); }
  function soltarTeselas(k) { for (var i in k.vivas) { var t = k.vivas[i]; if (t.c.parentNode) t.c.parentNode.removeChild(t.c); } k.vivas = {}; k.libres = []; }
  function nuevaTesela(k, i) {
    var e = escTesela(k), w = Math.max(1, Math.round(E.TW * e)), h = Math.max(1, Math.round(E.H * e)), c = k.libres.pop();
    if (!c) { c = document.createElement('canvas'); c.className = 'tesela'; }
    // dar el tamaño también borra un lienzo reutilizado y deja su contexto como nuevo (la transformación y el recorte de su
    // tesela anterior harían que se vieran trozos de otro sitio del friso)
    c.width = w; c.height = h;
    c.style.width = E.TW + 'px'; c.style.height = E.H + 'px'; c.style.left = (i * E.TW) + 'px';
    var x = c.getContext('2d'); x.lineCap = 'round'; x.lineJoin = 'round';
    return { i: i, c: c, x: x, gen: null, lista: false, e: e };
  }
  // un paso del pintor de una tesela (o la tesela entera, si no es un generador). El contexto llega con la transformación
  // del mundo: se dibuja en px CSS de pantalla como si la cámara estuviera donde esta tesela cae justo en la pantalla, y
  // recortado a la tesela (lo que cae fuera no cuesta rellenarlo: un monumento que cruza tres teselas se pinta tres veces)
  function pasoTesela(k, t) {
    if (!t.gen) {
      var x = t.x, xuA = t.i * E.TW / E.u / k.p, xuB = (t.i + 1) * E.TW / E.u / k.p;
      x.setTransform(t.e, 0, 0, t.e, -t.i * E.TW * t.e, 0);   // (px de la capa → px de la tesela)
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
      x.save(); x.beginPath(); x.rect(t.i * E.TW - 2, -2, E.TW + 4, E.H + 4); x.clip();
      var g = null; try { g = k.pintar(x, xuA, xuB, t); } catch (err) { console.error(err); }
      if (!g || typeof g.next !== 'function') { x.restore(); t.lista = true; k.listas++; return; }
      t.gen = g;
    }
    var fin = true;
    try { fin = t.gen.next().done; } catch (err) { console.error(err); }
    if (fin) { t.gen = null; t.x.restore(); t.lista = true; k.listas++; }
  }
  E.sincronas = [];   // (para medir: las teselas que hubo que pintar de golpe porque ya se veían)
  function completar(k, i) {
    var t = k.vivas[i]; if (!t) t = k.vivas[i] = nuevaTesela(k, i);
    if (!t.lista) E.sincronas.push(k.nombre);
    var n = 0; while (!t.lista && n++ < 400) pasoTesela(k, t);
    if (!t.c.parentNode) k.el.appendChild(t.c);
    return t;
  }
  E.dirTaller = 1;
  var presupuesto = 7;   // ms de pintar teselas por fotograma mientras la cámara se mueve (quieta, 2,5 veces más)
  E.presupuestoTaller = function (ms) { presupuesto = ms; };
  function colocarTeselas(dt) {
    var v = E.camVel; if (v > 0.05) E.dirTaller = 1; else if (v < -0.05) E.dirTaller = -1;
    var limite = performance.now() + (Math.abs(v) > 0.05 ? presupuesto : presupuesto * 2.5), cand = [];
    for (var c = 0; c < CAPAS_T.length; c++) {
      var k = CAPAS_T[c], clave = E.W + 'x' + E.H + '|' + escTesela(k) + '|' + E.u;
      if (k.clave !== clave) { soltarTeselas(k); k.clave = clave; k.listas = 0; }
      var p = k.p, desp = E.W / 2 * (1 - p) - E.camX * p, dpx = Math.round(desp * E.dpr) / E.dpr;
      if (k.desp !== dpx) { k.el.style.transform = 'translate3d(' + dpx + 'px,0,0)'; k.desp = dpx; }
      var izq = -dpx, i0 = Math.floor(izq / E.TW), i1 = Math.floor((izq + E.W - 0.01) / E.TW);
      var iMin = Math.floor(((k.desde != null ? k.desde : -0.5) * p * E.u) / E.TW), iMax = Math.floor(((k.hasta != null ? k.hasta : E.largo + 0.5) * p * E.u) / E.TW);
      for (var i = Math.max(iMin, i0); i <= Math.min(iMax, i1); i++) completar(k, i);
      // las de al lado, de todas las capas, van a una lista: se pintan antes las que antes se van a ver
      for (var q = i0 - 2; q <= i1 + 3; q++) {
        if ((q >= i0 && q <= i1) || q < iMin || q > iMax) continue;
        var t = k.vivas[q]; if (t && t.lista) { if (!t.c.parentNode) k.el.appendChild(t.c); continue; }
        var x0 = q * E.TW + dpx, x1 = x0 + E.TW, d = x0 >= E.W ? x0 - E.W : x1 <= 0 ? -x1 : 0;
        if ((x0 >= E.W ? 1 : -1) !== E.dirTaller) d = d * 2 + E.TW;   // (lo de detrás, después)
        cand.push({ k: k, q: q, d: d });
      }
      // las que quedan lejos se sueltan (y su lienzo se reutiliza)
      for (var key in k.vivas) {
        var ii = +key; if (ii >= i0 - 3 && ii <= i1 + 4) continue;
        var tt = k.vivas[key]; if (tt.c.parentNode) tt.c.parentNode.removeChild(tt.c);
        tt.gen = null;
        k.libres.push(tt.c); delete k.vivas[key];
      }
    }
    cand.sort(function (a, b) { return a.d - b.d; });
    for (var j = 0; j < cand.length && performance.now() < limite; j++) {
      var cd = cand[j], tc = cd.k.vivas[cd.q]; if (!tc) tc = cd.k.vivas[cd.q] = nuevaTesela(cd.k, cd.q);
      while (!tc.lista && performance.now() < limite) pasoTesela(cd.k, tc);
      if (tc.lista && !tc.c.parentNode) cd.k.el.appendChild(tc.c);
    }
    // y el trabajo de fondo del mundo (las piezas grandes, en su lienzo), si lo hay
    if (E.extra) { try { E.extra(limite, Math.abs(v) <= 0.05, dt); } catch (err) { console.error(err); } }
  }
  // todas las teselas que se ven, pintadas ya (para la pantalla de carga)
  E.prepararTeselas = function () { colocarTeselas(0); };
  E.olvidarTeselas = function (nombre) { CAPAS_T.forEach(function (k) { if (!nombre || k.nombre === nombre) { soltarTeselas(k); k.clave = ''; } }); };
  E.tallerOcupado = function () {
    for (var c = 0; c < CAPAS_T.length; c++) { var k = CAPAS_T[c]; for (var i in k.vivas) if (!k.vivas[i].lista) return true; }
    return false;
  };

  /* ---------- el cálamo: lo que escribe quien juega; va pegado al friso y se seca poco a poco ---------- */
  var camTinta = 0;
  // (si no hay nada escrito, no se toca: copiar, secar y dibujar un lienzo de pantalla entera cuesta en cada fotograma)
  E.tintaLimpia = true;
  function desplazarTinta() {
    if (E.tintaLimpia) { camTinta = E.camX; return; }
    var dx = Math.round((E.camX - camTinta) * E.dpr);
    if (!dx) return;
    ctxTmp.setTransform(1, 0, 0, 1, 0, 0); ctxTmp.clearRect(0, 0, tmp.width, tmp.height); ctxTmp.drawImage(tinta, 0, 0);
    ctxTinta.setTransform(1, 0, 0, 1, 0, 0); ctxTinta.clearRect(0, 0, tinta.width, tinta.height); ctxTinta.drawImage(tmp, -dx, 0);
    camTinta += dx / E.dpr;
  }
  var secado = 0;
  function secarTinta(dt) {
    if (E.tintaLimpia) { secado = 0; return; }
    secado += dt;
    if (secado < 50) return;
    // lo que queda casi seco no llega nunca a cero (redondeo de 8 bits): si hace rato que no se escribe, se limpia del todo
    if (E.t - (E.ultimoTrazo || 0) > 9000) { E.limpiarTinta(); E.tintaLimpia = true; secado = 0; return; }
    ctxTinta.setTransform(1, 0, 0, 1, 0, 0);
    ctxTinta.globalCompositeOperation = 'destination-out';
    ctxTinta.fillStyle = 'rgba(0,0,0,' + (0.012 * secado / 50).toFixed(4) + ')';
    ctxTinta.fillRect(0, 0, tinta.width, tinta.height);
    ctxTinta.globalCompositeOperation = 'source-over';
    secado = 0;
  }
  // un trazo de cálamo entre dos puntos (pantalla): una línea de junco, casi constante, un poco más gruesa despacio
  E.trazo = function (x0, y0, x1, y1, ancho, a) {
    E.tintaLimpia = false; E.ultimoTrazo = E.t;
    var c = ctxTinta; c.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
    c.strokeStyle = U.rgba(C.tinta, a == null ? 0.86 : a); c.lineWidth = ancho; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    // el junco deja el borde un poco más cargado en un lado
    c.strokeStyle = U.rgba(C.tinta, 0.22); c.lineWidth = Math.max(0.6, ancho * 0.35);
    c.beginPath(); c.moveTo(x0 + ancho * 0.35, y0 + ancho * 0.3); c.lineTo(x1 + ancho * 0.35, y1 + ancho * 0.3); c.stroke();
  };
  E.limpiarTinta = function () { ctxTinta.setTransform(1, 0, 0, 1, 0, 0); ctxTinta.clearRect(0, 0, tinta.width, tinta.height); };

  /* ---------- un clic: un destello de polvo de oro que se abre ---------- */
  var destellos = [];
  E.destello = function (x, y, op) {
    destellos.push({ x: x, y: y, t0: E.t, dur: (op && op.dur) || 900, r: (op && op.r) || E.u * 0.05 });
    if (destellos.length > 6) destellos.shift();
  };
  function dibujarDestellos() {
    for (var i = destellos.length - 1; i >= 0; i--) {
      var p = destellos[i], k = (E.t - p.t0) / p.dur;
      if (k >= 1) { destellos.splice(i, 1); continue; }
      var r = p.r * U.sale(k), a = (1 - k) * (1 - k);
      ctx.strokeStyle = U.rgba(C.oro, 0.7 * a); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
      ctx.fillStyle = U.rgba([255, 236, 160], 0.9 * a);
      for (var j = 0; j < 7; j++) { var an = j / 7 * TAU + p.t0, rr = r * (0.7 + 0.5 * U._h(j + p.t0)); ctx.beginPath(); ctx.arc(p.x + Math.cos(an) * rr, p.y + Math.sin(an) * rr, 1.6 * (1 - k) + 0.4, 0, TAU); ctx.fill(); }
    }
  }

  /* ---------- efectos de dibujo ---------- */
  var FONDOS = {
    serif: '"Instrument Serif", Georgia, serif',
    mono: '"IBM Plex Mono", ui-monospace, Menlo, monospace',
    jero: '"Jeroglificos", "Noto Sans Egyptian Hieroglyphs", "Segoe UI Historic", sans-serif'
  };
  E.FUENTES = FONDOS;
  var FX = AE.fx = {
    texto: function (s, x, y, op) {
      op = op || {}; var k = op.ctx || ctx;
      var fam = op.jero ? FONDOS.jero : op.serif ? FONDOS.serif : FONDOS.mono;
      k.font = (op.cursiva ? 'italic ' : '') + (op.peso || 400) + ' ' + (op.tam || 11) + 'px ' + fam;
      k.textAlign = op.alin || 'left'; k.textBaseline = op.base || 'middle';
      k.fillStyle = U.rgba(op.color || C.tinta, op.a == null ? 0.85 : op.a);
      if (op.espaciado && 'letterSpacing' in k) k.letterSpacing = op.espaciado + 'px';
      k.fillText(s, x, y);
      if ('letterSpacing' in k) k.letterSpacing = '0px';
    },
    brillo: function (x, y, r, col, a, k) {
      k = k || ctx; if (a <= 0.003 || r <= 0) return;
      var g = k.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, U.rgba(col, a)); g.addColorStop(1, U.rgba(col, 0));
      k.fillStyle = g; k.beginPath(); k.arc(x, y, r, 0, TAU); k.fill();
    }
  };
  // un halo suave en caché (se tiñe con globalAlpha): mucho más barato que un gradiente por llamada
  var halos = {};
  function spriteHalo(col, s) {
    var clave = col[0] + ',' + col[1] + ',' + col[2] + '|' + s, h = halos[clave];
    if (!h) {
      var L = U.lienzo(s, s), g = L.x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, U.rgba(col, 1)); g.addColorStop(0.25, U.rgba(col, 0.55)); g.addColorStop(0.6, U.rgba(col, 0.14)); g.addColorStop(1, U.rgba(col, 0));
      L.x.fillStyle = g; L.x.fillRect(0, 0, s, s); h = halos[clave] = L.c;
    }
    return h;
  }
  FX.halo = function (x, y, r, col, a, c2) {   // (c2: otro contexto donde dibujar; si no, el del motor)
    if (r <= 0.5) return;
    var px = r * E.dpr, s = px < 10 ? 24 : px < 30 ? 48 : px < 80 ? 96 : 192;
    var h = spriteHalo(col, s), k = c2 || ctx;
    if (a <= 0.003) return;
    var antes = k.globalAlpha; k.globalAlpha = U.clamp(a, 0, 1) * antes; k.drawImage(h, x - r, y - r, r * 2, r * 2); k.globalAlpha = antes;
  };
  FX.prepararHalos = function (colores) { colores.forEach(function (col) { [24, 48, 96, 192].forEach(function (s) { spriteHalo(col, s); }); }); };

  /* ---------- reconocer gestos en un trazo del cálamo ---------- */
  AE.gestos = {
    // ¿es un óvalo cerrado (un cartucho)? Ajusta una elipse por momentos: centro, ejes, giro y cuánto se parece
    ovalo: function (pts) {
      if (pts.length < 12) return null;
      // (a mano se suele dar algo más de una vuelta, o algo menos: se recorta el trazo a la primera vuelta entera, contando
      // el giro alrededor de su centro, y el cierre se mide en las unidades de la propia elipse)
      var n0 = pts.length, mx = 0, my = 0, acum = 0, prev = null, fin = n0, i;
      for (i = 0; i < n0; i++) { mx += pts[i].x; my += pts[i].y; } mx /= n0; my /= n0;
      for (i = 0; i < n0; i++) {
        var aa = Math.atan2(pts[i].y - my, pts[i].x - mx);
        if (prev != null) { var dd = aa - prev; while (dd > Math.PI) dd -= TAU; while (dd < -Math.PI) dd += TAU; acum += dd; if (Math.abs(acum) >= TAU) { fin = i + 1; break; } }
        prev = aa;
      }
      pts = pts.slice(0, Math.max(12, fin));
      var n = pts.length, cx = 0, cy = 0;
      for (i = 0; i < n; i++) { cx += pts[i].x; cy += pts[i].y; } cx /= n; cy /= n;
      var sxx = 0, syy = 0, sxy = 0;
      for (i = 0; i < n; i++) { var dx = pts[i].x - cx, dy = pts[i].y - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
      sxx /= n; syy /= n; sxy /= n;
      var tr = sxx + syy, det = sxx * syy - sxy * sxy, l1 = tr / 2 + Math.sqrt(Math.max(0, tr * tr / 4 - det)), l2 = tr / 2 - Math.sqrt(Math.max(0, tr * tr / 4 - det));
      var ang = 0.5 * Math.atan2(2 * sxy, sxx - syy), a = Math.sqrt(2 * l1), b = Math.sqrt(2 * Math.max(l2, 1e-6));
      var ca = Math.cos(ang), sa = Math.sin(ang), err = 0, giro = 0, a0 = null;
      for (i = 0; i < n; i++) {
        var px = pts[i].x - cx, py = pts[i].y - cy, u1 = (px * ca + py * sa) / a, v1 = (-px * sa + py * ca) / b, rr = Math.sqrt(u1 * u1 + v1 * v1);
        err += (rr - 1) * (rr - 1);
        var an = Math.atan2(v1, u1); if (a0 != null) { var d = an - a0; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; giro += d; } a0 = an;
      }
      var q = function (p) { var px = p.x - cx, py = p.y - cy; return [(px * ca + py * sa) / a, (-px * sa + py * ca) / b]; };
      var q0 = q(pts[0]), q1 = q(pts[n - 1]), desv = Math.sqrt(err / n), cierre = Math.hypot(q0[0] - q1[0], q0[1] - q1[1]);
      return { cx: cx, cy: cy, a: a, b: b, ang: ang, desv: desv, giro: Math.abs(giro), cierre: cierre,
        ok: b > E.u * 0.025 && a < E.u * 0.6 && desv < 0.26 && Math.abs(giro) > Math.PI * 1.6 && cierre < 1.0 };
    },
    // cuántas veces cambia de sentido en horizontal (con un mínimo de amplitud)
    vaivenes: function (pts, minimo) {
      var n = 0, dir = 0, ext = pts.length ? pts[0].x : 0;
      for (var i = 1; i < pts.length; i++) {
        var dx = pts[i].x - ext;
        if (dir >= 0 && dx < -minimo) { if (dir > 0) n++; dir = -1; ext = pts[i].x; }
        else if (dir <= 0 && dx > minimo) { if (dir < 0) n++; dir = 1; ext = pts[i].x; }
        else if ((dir > 0 && pts[i].x > ext) || (dir < 0 && pts[i].x < ext)) ext = pts[i].x;
      }
      return n;
    }
  };

  /* ---------- dibujar un fotograma ---------- */
  var tintes = { fondo: '', mundo: '' };
  E.tinte = function (cual, color) {   // color CSS del multiplicador ('' = sin tinte)
    if (tintes[cual] === color) return; tintes[cual] = color;
    var d = cual === 'fondo' ? tinteFondo : tinteMundo; if (!d) return;
    d.style.backgroundColor = color || 'transparent'; d.style.display = color ? 'block' : 'none';
  };
  function dibujar(dt) {
    var esc = E.escena, s = esc && esc.s, t = esc ? esc.t : 0, N = AE.nilo;
    // las capas de teselas (las mueve la GPU; aquí solo se colocan y se pinta lo que falte)
    colocarTeselas(dt);
    // el cielo: el sol, la luna y las estrellas (media resolución, transparente)
    ctxCielo.setTransform(1, 0, 0, 1, 0, 0); ctxCielo.globalAlpha = 1; ctxCielo.globalCompositeOperation = 'source-over';
    ctxCielo.clearRect(0, 0, cvCielo.width, cvCielo.height); ctxCielo.setTransform(E.ESC_CIELO, 0, 0, E.ESC_CIELO, 0, 0);
    seguro(N && N.cielo, ctxCielo); seguro(s && s.cielo, ctxCielo, t);
    ctxBrillo.setTransform(1, 0, 0, 1, 0, 0); ctxBrillo.globalAlpha = 1; ctxBrillo.globalCompositeOperation = 'source-over';
    ctxBrillo.clearRect(0, 0, cvBrillo.width, cvBrillo.height); ctxBrillo.setTransform(E.ESC_BRILLO, 0, 0, E.ESC_BRILLO, 0, 0);
    // el lienzo del motor: transparente, solo lo que se mueve
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
    if (N) N.tapasEscena = [];   // (lo que las escenas tapan en este fotograma: X.panel, X.lupa, X.tapar)
    seguro(s && s.fondo, ctx, t); seguro(N && N.dibujar, ctx);
    // lo escrito con el cálamo
    if (!E.tintaLimpia) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.95; ctx.drawImage(tinta, 0, 0); ctx.globalAlpha = 1; ctx.setTransform(E.dpr, 0, 0, E.dpr, 0, 0); }
    if (!s) for (var i = 0; i < E.capas.length; i++) { try { E.capas[i](ctx, E.t); } catch (err) { console.error(err); } }
    seguro(s && s.frente, ctx, t); seguro(N && N.encima, ctx); seguro(s && s.encima, ctx, t);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    dibujarDestellos();
    seguro(N && N.brillo, ctxBrillo); seguro(s && s.brillo, ctxBrillo, t);
    // (la viñeta y el grano son CSS: los compone la GPU y no cuestan nada al lienzo)
  }

  // una llamada de dibujo protegida: si falla, se apunta y el contexto vuelve a como estaba (un fallo no congela la web)
  function seguro(fn, c, t) {
    if (!fn) return;
    c.save(); try { fn(c, t); } catch (err) { console.error(err); } finally { c.restore(); }
  }

  /* ---------- un paso del reloj ---------- */
  function actualizar(dt) {
    E.t += dt;
    var esc = E.escena, antes = E.camX;
    if (cam) {
      var k = U.clamp((E.t - cam.t0) / cam.dur, 0, 1); E.camX = U.lerp(cam.x0, cam.x1, cam.ease(k)); if (k >= 1) cam = null;
    } else if (!esc) {
      if (Math.abs(E.velX) > 0.001) { E.camX += E.velX * dt; E.velX *= Math.pow(0.92, dt / 16); }
      // la cámara persigue su objetivo con un muelle crítico (unos 110 ms): la rueda no da saltos
      if (E.camObj != null) {
        E.camX += (E.camObj - E.camX) * (1 - Math.exp(-dt / 110));
        if (Math.abs(E.camObj - E.camX) < 0.25) { E.camX = E.camObj; E.camObj = null; }
      }
    }
    E.camX = U.clamp(E.camX, 0, E.maxCam());
    if (E.camX >= E.maxCam() - 0.5) { if (E.alFinal == null) E.alFinal = E.t; } else E.alFinal = null;   // (desde cuándo está al final)
    E.camVel = E.camVel * 0.8 + (dt > 0 ? (E.camX - antes) / dt : 0) * 0.2;
    // el viento: una brisa que va y viene, más lo que mueve el ratón (rápido = ráfaga), que se calma solo
    var p = E.puntero;
    E.viento = E.viento * Math.pow(0.94, dt / 16) + U.clamp(p.velocidad / 2.5, 0, 1) * 0.08;
    p.velocidad *= Math.pow(0.8, dt / 16);
    desplazarTinta();
    secarTinta(dt);
    if (esc) {
      if (!(E.retenida && esc.tv && !esc.tq)) esc.t += dt;   // (con la tarjeta retenida, la escena espera)
      var sc = esc.s, ta = sc.tarjeta;
      if (ta && !esc.tv && esc.t >= ta.en) { esc.tv = true; AE.interfaz && AE.interfaz.tarjeta(ta); }
      if (ta && esc.tv && !esc.tq && esc.t >= ta.hasta) { esc.tq = true; AE.interfaz && AE.interfaz.tarjeta(null); }
      if (sc.cuadro) { try { sc.cuadro(esc.t, dt); } catch (err) { console.error(err); } }
      if (esc.t >= esc.dur) terminarEscena(false);
    }
    AE.nilo && AE.nilo.actualizar(dt);
    if (!esc && !E.bloqueado) emitir('cuadro', { t: E.t, dt: dt, inactivo: E.t - E.ultimoInput, movido: E.camX - antes });
  }
  function paso(dt) { actualizar(dt); dibujar(dt); }
  function bucle(ahora) {
    if (congelado) return;
    var dt = ultimoRaf === null ? 16 : Math.min(50, ahora - ultimoRaf); ultimoRaf = ahora;
    raf(bucle);   // (antes de pintar: si algo falla, el siguiente fotograma ya está pedido)
    var a = performance.now(); paso(dt); var coste = performance.now() - a;
    // si el equipo no llega (de media más de 28 ms por fotograma), se pasa a modo ligero (resolución 1×). Solo se mide con
    // el taller parado y sin entrada ni escena: el taller usa a propósito el tiempo libre y no debe confundirse con lentitud
    var midiendo = !E.ligero && !E.bloqueado && !E.escena && !E.tallerOcupado();
    // (una pantalla a 30 Hz da fotogramas de 33 ms aunque sobre tiempo: hace falta además que cueste de verdad, o que vaya
    // por debajo de 22 fotogramas por segundo)
    if (midiendo) {
      mediaDt = mediaDt * 0.95 + dt * 0.05; mediaCoste = mediaCoste * 0.95 + coste * 0.05;
      if (++nMedidos > 120 && ((mediaDt > 28 && mediaCoste > 14) || mediaDt > 45)) { E.ligero = true; medir(); }
    }
  }

  /* ---------- escenas ---------- */
  E.reproducir = function (h, alTerminar) {
    if (E.escena) return false;
    var s = h.escena(E) || {}, ta = s.tarjeta;
    // la tarjeta se queda lo que se tarda en leerla (unas 230 palabras por minuto, más 3 s para el título): las escenas
    // mantienen su último cuadro mientras tanto. Con el puntero o el dedo encima, la escena espera (E.retenida)
    if (ta && ta.texto && ta.hasta) {
      var pal = String(ta.texto).replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
      var falta = Math.max(0, (ta.en || 0) + 3000 + pal * 260 - ta.hasta);
      if (falta) { ta.hasta += falta; s.duracion = (s.duracion || 8000) + falta; }
    }
    E.retenida = false;
    E.escena = { h: h, s: s, t: 0, dur: s.duracion || 8000, fin: alTerminar };
    E.velX = 0; cam = null; arrastre = null; E.camObj = null;
    document.documentElement.classList.add('en-escena');
    if (s.inicio) { try { s.inicio(); } catch (err) { console.error(err); } }
    emitir('escena', { fase: 'inicio', huevo: h });
    return true;
  };
  function terminarEscena(saltada) {
    var e = E.escena; if (!e) return;
    try { e.s.fin && e.s.fin(saltada); } catch (err) { console.error(err); }
    E.escena = null; cam = null;
    AE.interfaz && AE.interfaz.tarjeta(null);
    document.documentElement.classList.remove('en-escena');
    E.ultimoInput = E.t;
    emitir('escena', { fase: 'fin', huevo: e.h, saltada: saltada });
    if (e.fin) e.fin(saltada);
  }
  E.saltar = function () { terminarEscena(true); };

  /* ---------- entrada ----------
     Rueda / trackpad / flechas / mapa: avanzar por el Nilo. Arrastrar: escribir con el cálamo (en pantallas táctiles,
     según el botón Cálamo / Mover). Clic sin moverse: un destello. Dos dedos: mover. */
  var arrastre = null, punteros = {}, dosDedos = null;
  // zonas donde, en táctil, arrastrar es un gesto aunque el botón diga «Mover»: funciones (x, y) → sí/no que ponen los
  // secretos de gesto (el escalón de Tutankamón, el cartucho de Rosetta) mientras no se han encontrado
  E.zonasGesto = [];
  function enZonaGesto(x, y) { return E.zonasGesto.some(function (f) { try { return !!f(x, y); } catch (e) { return false; } }); }
  var EMPUJE_DEDO = 3;   // (un dedo recorre mucho menos que una rueda: lo que empuja cuenta el triple)
  function libre() { return !E.escena && !E.bloqueado; }
  function marcar() { E.ultimoInput = E.t; }
  function datos(x, y) { return { x: x, y: y, xu: E.xuDe(x), yu: E.yuDe(y) }; }
  function umbralToque(A) { return A.tipo === 'mouse' ? 6 : 12; }   // (px: hasta aquí, un toque)
  // la tinta de un trazo que estaba por decidir (en una zona de gesto), de golpe
  function tintaDelTrazo(A) {
    var ancho = 3.2 * (E.u / 900 * 0.5 + 0.5); A.ancho = ancho;
    for (var i = 1; i < A.pts.length; i++) { var a = A.pts[i - 1], b = A.pts[i]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.5) E.trazo(a[0], a[1], b[0], b[1], ancho); }
  }

  function alBajar(ev) {
    marcar();
    var p = E.puntero; p.x = ev.clientX; p.y = ev.clientY; p.sobre = true; p.tipo = ev.pointerType || 'mouse';
    if (!libre()) return;
    punteros[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
    try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
    if (Object.keys(punteros).length === 2) { arrastre = null; dosDedos = { x: ev.clientX, cam: E.camX }; return; }
    // (un lápiz escribe siempre; un dedo, según el botón Mover / Escribir; en una zona de gesto, el modo se decide con el
    // primer movimiento: una recta larga y rápida es navegar, y si da la vuelta o se curva, es el gesto)
    var dedoMueve = p.tipo === 'touch' && !E.calamo, zona = dedoMueve && enZonaGesto(ev.clientX, ev.clientY);
    arrastre = { modo: dedoMueve && !zona ? 'mover' : 'escribir', tipo: p.tipo, dudando: zona, x: ev.clientX, y: ev.clientY, x0: ev.clientX, y0: ev.clientY, t0: E.t, cam0: E.camX, movido: 0, lejos: 0, camino: 0, pts: [[ev.clientX, ev.clientY, E.t, E.camX]] };
    cam = null; E.velX = 0; E.camObj = null;
    emitir('bajar', datos(ev.clientX, ev.clientY));
  }
  function alMover(ev) {
    marcar();
    var p = E.puntero, dx = ev.clientX - p.x, dy = ev.clientY - p.y;
    if (p.sobre && E.t - (p.tm || 0) > 0) { var v = Math.hypot(dx, dy) / Math.max(1, E.t - (p.tm || E.t - 16)); p.velocidad = Math.max(p.velocidad, v); p.vx = dx; p.vy = dy; }
    p.x = ev.clientX; p.y = ev.clientY; p.sobre = ev.target === cv || !!arrastre; p.tm = E.t; p.tipo = ev.pointerType || p.tipo;
    if (punteros[ev.pointerId]) { punteros[ev.pointerId].x = ev.clientX; punteros[ev.pointerId].y = ev.clientY; }
    if (!libre()) return;
    if (dosDedos) {
      var ids = Object.keys(punteros); if (ids.length < 2) return;
      var mx = (punteros[ids[0]].x + punteros[ids[1]].x) / 2;
      if (dosDedos.ultimo != null) {
        var nuevo = E.camX - (mx - dosDedos.ultimo);
        if (nuevo > E.maxCam() && nuevo > E.camX) E.empujarFin((nuevo - Math.max(E.camX, E.maxCam())) * EMPUJE_DEDO);   // (más allá del final)
        E.camX = U.clamp(nuevo, 0, E.maxCam());
      }
      dosDedos.ultimo = mx; return;
    }
    var A = arrastre;
    if (A) {
      var d = Math.hypot(ev.clientX - A.x, ev.clientY - A.y); A.movido += d;
      // (si es un toque se decide por lo lejos que llega del punto de partida, no por la suma: un dedo apoyado siempre se
      // desliza unos píxeles, y a 120 Hz hay muchos eventos)
      A.lejos = Math.max(A.lejos, Math.hypot(ev.clientX - A.x0, ev.clientY - A.y0));
      if (A.modo === 'mover') {
        if (!A.suelto) { if (A.lejos < umbralToque(A)) return; A.suelto = true; A.xRef = ev.clientX; A.cam0 = E.camX; }
        var dest = A.cam0 - (ev.clientX - A.xRef), exceso = Math.max(0, dest - E.maxCam());
        E.camX = U.clamp(dest, 0, E.maxCam());
        // arrastrar con el dedo más allá del final también empuja (como la rueda): cuenta lo que crece el exceso
        if (exceso > (A.exceso || 0)) E.empujarFin((exceso - (A.exceso || 0)) * EMPUJE_DEDO);
        A.exceso = exceso;
        A.pts.push([ev.clientX, ev.clientY, E.t, E.camX]); return;
      }
      if (A.dudando) {
        A.camino += d; A.x = ev.clientX; A.y = ev.clientY; A.pts.push([ev.clientX, ev.clientY, E.t, E.camX]);
        var nx = ev.clientX - A.x0, ny = ev.clientY - A.y0, neto = Math.hypot(nx, ny);
        if (A.camino > 20 && neto / A.camino < 0.7) { A.dudando = false; tintaDelTrazo(A); }   // da la vuelta o se curva: el gesto
        // navegar: casi recto, de lado y rápido (el arranque de un óvalo alargado también es casi recto, pero se dibuja más
        // despacio); o, despacio, si sigue recto mucho más de lo que mide un óvalo
        else if (Math.abs(nx) > 2.5 * Math.abs(ny) && ((A.camino > 50 && neto / A.camino > 0.95 && A.camino / Math.max(1, E.t - A.t0) > 0.5) || (A.camino > 150 && neto / A.camino > 0.97))) {
          A.dudando = false; A.modo = 'mover'; A.suelto = true; A.xRef = A.x0; A.cam0 = E.camX;
          E.camX = U.clamp(A.cam0 - (ev.clientX - A.xRef), 0, E.maxCam()); return;
        }
        emitir('mover', { x: ev.clientX, y: ev.clientY, xu: E.xuDe(ev.clientX), yu: E.yuDe(ev.clientY), arrastrando: true });
        return;   // (mientras duda, los detectores ven el movimiento, pero aún no hay tinta)
      }
      // escribir: el junco carga algo más de tinta cuando se va despacio
      var ult = A.pts[A.pts.length - 1], dtm = Math.max(1, E.t - ult[2] || 16), vel = d / dtm;
      var ancho = U.clamp(4.2 - vel * 1.2, 2.2, 4.2) * (E.u / 900 * 0.5 + 0.5);
      A.ancho = A.ancho == null ? ancho : A.ancho * 0.7 + ancho * 0.3;
      if (d > 0.5 && (A.tipo === 'mouse' ? A.movido > 3 : A.lejos >= umbralToque(A))) { E.trazo(A.x, A.y, ev.clientX, ev.clientY, A.ancho); }
      A.x = ev.clientX; A.y = ev.clientY;
      A.pts.push([ev.clientX, ev.clientY, E.t, E.camX]);
    }
    emitir('mover', { x: ev.clientX, y: ev.clientY, xu: E.xuDe(ev.clientX), yu: E.yuDe(ev.clientY), arrastrando: !!A });
  }
  function alSubir(ev) {
    marcar();
    delete punteros[ev.pointerId];
    if (dosDedos) { if (Object.keys(punteros).length < 2) dosDedos = null; arrastre = null; return; }
    var A = arrastre; arrastre = null;
    if (ev.pointerType && ev.pointerType !== 'mouse') E.puntero.sobre = false;   // (un dedo levantado ya no está encima de nada)
    if (!A || !libre()) return;
    var toque = A.lejos < umbralToque(A) && E.t - A.t0 < 600;
    if (A.modo === 'mover') {   // inercia
      var n = A.pts.length; if (A.suelto && n > 2) { var a = A.pts[Math.max(0, n - 5)], b = A.pts[n - 1]; E.velX = -(b[0] - a[0]) / Math.max(16, b[2] - a[2]); }
      if (toque) { E.destello(A.x0, A.y0); emitir('clic', datos(A.x0, A.y0)); }
      return;
    }
    if (A.dudando && !toque) tintaDelTrazo(A);   // (un trazo corto que no llegó a decidirse es el gesto)
    var dur = E.t - A.t0, d = datos(A.x0, A.y0);
    if (toque) { E.destello(A.x0, A.y0); emitir('clic', d); }
    else {
      // el trazo completo, en coordenadas del friso (para los gestos)
      var pts = A.pts.map(function (q) { return { x: q[0], y: q[1], t: q[2], xu: (q[0] + q[3]) / E.u, yu: E.yuDe(q[1]) }; });
      emitir('trazo', { pts: pts, dur: dur, movido: A.movido });
    }
  }

  E.iniciar = function (lienzo) {
    cv = lienzo; ctx = cv.getContext('2d'); E.ctx = ctx;
    tinta = document.createElement('canvas'); ctxTinta = tinta.getContext('2d');
    tmp = document.createElement('canvas'); ctxTmp = tmp.getContext('2d');
    function capa(clase, antes, div) {
      var c = document.createElement(div ? 'div' : 'canvas'); c.className = 'capa ' + clase; c.setAttribute('aria-hidden', 'true');
      cv.parentNode.insertBefore(c, antes); return c;
    }
    E.capaFondo = capa('capa-fondo', cv, true);
    tinteFondo = capa('tinte tinte-fondo', cv, true);
    cvCielo = capa('capa-cielo', cv); ctxCielo = cvCielo.getContext('2d');
    E.capaMedio = capa('capa-medio', cv, true);   // (las colinas lejanas: por delante del sol, que se pone detrás)
    E.capaMundo = capa('capa-mundo', cv, true);
    var tras = cv.nextSibling;
    E.capaDelante = capa('capa-delante', tras, true);
    tinteMundo = capa('tinte tinte-mundo', tras, true);
    cvBrillo = capa('capa-brillo', tras); ctxBrillo = cvBrillo.getContext('2d');
    E.ctxCielo = ctxCielo; E.ctxBrillo = ctxBrillo; E.lienzoCielo = cvCielo; E.lienzoBrillo = cvBrillo; E.lienzoTinta = tinta;
    E.tinte('fondo', ''); E.tinte('mundo', '');
    medir();
    window.addEventListener('resize', medir);
    cv.addEventListener('pointerdown', alBajar);
    window.addEventListener('pointermove', function (ev) { if (ev.target === cv || arrastre || dosDedos) alMover(ev); else { E.puntero.sobre = false; marcar(); } });
    window.addEventListener('pointerup', alSubir);
    window.addEventListener('pointercancel', function (ev) { delete punteros[ev.pointerId]; arrastre = null; dosDedos = null; });
    cv.addEventListener('pointerleave', function (ev) { if (ev.pointerType === 'mouse' && !arrastre) E.puntero.sobre = false; });
    cv.addEventListener('wheel', function (ev) {
      ev.preventDefault(); marcar();
      if (!libre()) return;
      var d = (Math.abs(ev.deltaX) > Math.abs(ev.deltaY) ? ev.deltaX : ev.deltaY) * (ev.deltaMode === 1 ? 16 : 1);
      if (!d) return;
      cam = null;
      var antes = E.camObj != null ? E.camObj : E.camX; E.camObj = U.clamp(antes + d, 0, E.maxCam());
      if (d > 0 && antes >= E.maxCam() - 0.5 && E.alFinal != null && E.t - E.alFinal > 400) E.empujarFin(d);   // (la inercia del golpe que te ha traído no cuenta)
      E.velX = 0;
      emitir('rueda', { d: d });
    }, { passive: false });
    window.addEventListener('keydown', function (ev) {
      marcar();
      if (ev.key === 'Escape' && E.escena) { E.saltar(); return; }
      if (!libre() || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      // con el papiro abierto, las flechas y AvPág son para leerlo, no para mover el friso
      if (/^(Arrow|Page|Home$|End$)/.test(ev.key) && AE.interfaz && AE.interfaz.cuadernoAbierto && AE.interfaz.cuadernoAbierto()) return;
      var t = ev.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      var k = ev.key;
      if (k === 'ArrowRight' || k === 'ArrowLeft') {
        ev.preventDefault(); cam = null; E.camObj = null;
        var dir = k === 'ArrowRight' ? 1 : -1;
        if (dir > 0 && E.camX >= E.maxCam() - 0.5) E.empujarFin(120);
        E.velX = dir * 1.6;
      } else if (k === 'PageDown' || k === 'PageUp') {
        ev.preventDefault();
        if (k === 'PageDown' && E.camX >= E.maxCam() - 0.5) E.empujarFin(400);
        E.irA(E.centroXu() + (k === 'PageDown' ? 0.85 : -0.85) * E.W / E.u, 650);
      } else if (k === 'Home' || k === 'End') {
        ev.preventDefault(); if (k === 'End' && E.camX >= E.maxCam() - 0.5) E.empujarFin(400);
        E.irA(k === 'Home' ? 0 : E.largo, 2600);
      }
      emitir('tecla', { key: k, repeat: !!ev.repeat });
    });
    document.addEventListener('visibilitychange', function () { ultimoRaf = null; });   // (sin marcar: el reloj no corre oculta, y la Espera no tiene que volver a empezar)
    window.addEventListener('wheel', marcar, { passive: true }); document.addEventListener('scroll', marcar, true);   // (leer el papiro también es estar haciendo algo)
    raf(bucle);
  };
  // empujar más allá del final: se acumula mientras sigas empujando (si paras 0,7 s, vuelve a cero)
  E.empujarFin = function (d) { if (E.t - (E.ultimoEmpuje || -1e9) > 700) E.empuje = 0; E.ultimoEmpuje = E.t; E.empuje += d; emitir('empujar', { d: d, total: E.empuje }); };

  /* ---------- pruebas: pasos manuales ---------- */
  E.congelar = function (si) { congelado = si !== false; if (!congelado) { ultimoRaf = null; raf(bucle); } };
  // (cada fotograma simulado espera a que WebKit lo pinte, como haría la pantalla)
  E.paso = function (ms, trozos) { trozos = trozos || Math.max(1, Math.round(ms / 16)); for (var i = 0; i < trozos; i++) { paso(ms / trozos); U.vaciar(); } };
})();

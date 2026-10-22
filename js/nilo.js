/* Aegyptus Incognita · el Nilo
   Lo que hay en el friso, de sur a norte (de izquierda a derecha): Nubia, Abu Simbel, Filé, Siena, Edfu, Karnak, los
   colosos de Memnón, Deir el-Bahari, el Valle de los Reyes, Dendera, Amarna, Saqqara, Guiza, el delta, Rosetta,
   Alejandría y el faro, y el mar. La hora avanza con el viaje: amanece en Abu Simbel, es mediodía en Siena, atardece en
   Guiza y es de noche en Alejandría.
   Las franjas de la pantalla (en u, desde arriba): la cenefa de arriba, el registro principal (papiro con jeroglíficos,
   los monumentos), la línea de suelo, el Nilo, la cenefa de zigzag y la franja de ojos de Horus y escarabajos.
   Tres capas de teselas (ver el motor): el fondo (p = 0,9), el mundo (p = 1) y lo de delante (p = 1,12). Lo que se mueve
   (el agua, las barcas, los pájaros, la gente, el gato) se pinta en cada fotograma en el lienzo del motor. AE.nilo (N). */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, E = AE.motor, ES = AE.estilo, P = ES.p, FX = AE.fx, TAU = Math.PI * 2;
  var N = AE.nilo = {};
  function A() { return AE.arte || {}; }

  /* ------------------------------------------------------------------ las franjas */
  var ARR = 0.046, SUELO = 0.66, RIO0 = 0.672, RIO1 = 0.84, CEN1 = 0.872, FLOT = 0.705;
  N.ARR = ARR; N.SUELO = SUELO; N.RIO0 = RIO0; N.RIO1 = RIO1; N.CEN1 = CEN1; N.FLOT = FLOT;
  E.largo = 17.6;
  var COSTA = 16.85;   // desde aquí, el mar
  N.COSTA = COSTA;

  /* ------------------------------------------------------------------ los sitios (para el instrumento y el mapa) */
  var SITIOS = [
    { nombre: 'Nubia', xu: 0.35 }, { nombre: 'Abu Simbel', xu: 1.3 }, { nombre: 'Filé', xu: 3.1 }, { nombre: 'Siena', xu: 3.9 },
    { nombre: 'Edfu', xu: 4.7 }, { nombre: 'Karnak', xu: 5.75 }, { nombre: 'Colosos de Memnón', xu: 6.8 }, { nombre: 'Deir el-Bahari', xu: 7.85 },
    { nombre: 'Valle de los Reyes', xu: 9.0 }, { nombre: 'Dendera', xu: 10.05 }, { nombre: 'Amarna', xu: 10.95 }, { nombre: 'Saqqara', xu: 11.8 },
    { nombre: 'Guiza', xu: 13.2, desde: 12.15 }, { nombre: 'El delta', xu: 14.75, desde: 14.3 }, { nombre: 'Rosetta', xu: 15.6 }, { nombre: 'Alejandría', xu: 16.3 },
    { nombre: 'Faro', xu: 17.15 }
  ];
  N.sitios = SITIOS;
  // el sitio del centro de la pantalla: cada uno empieza a medio camino del anterior (o donde dice «desde»: Guiza, con
  // Micerinos, y el delta, cuando Keops ya se va); con la cámara al final del todo, el mar
  N.lugarEn = function (xu) {
    if (E.camX >= E.maxCam() - 2) return 'Mar Mediterráneo';
    var nombre = SITIOS[0].nombre;
    for (var i = 1; i < SITIOS.length; i++) if (xu >= (SITIOS[i].desde != null ? SITIOS[i].desde : (SITIOS[i - 1].xu + SITIOS[i].xu) / 2)) nombre = SITIOS[i].nombre;
    return nombre;
  };

  /* ------------------------------------------------------------------ la hora del día a lo largo del río */
  var HORAS = [[0, 6.5], [1.2, 7.0], [2.6, 9.6], [3.8, 12.0], [6.0, 14.0], [9.0, 15.4], [11.5, 16.7], [13.2, 17.6], [14.1, 18.2], [14.8, 18.9], [15.5, 19.8], [16.3, 21.0], [17.6, 23.0]];
  N.hora = function (xu) {
    if (xu <= HORAS[0][0]) return HORAS[0][1];
    for (var i = 1; i < HORAS.length; i++) if (xu <= HORAS[i][0]) { var a = HORAS[i - 1], b = HORAS[i], k = (xu - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * k; }
    return HORAS[HORAS.length - 1][1];
  };
  N.horaForzada = null;   // (las escenas y el amanecer de la entrada pueden imponer la hora)
  N.horaAhora = function () {
    var h = N.hora(E.centroXu());
    if (amanecer != null) h = U.lerp(4.2, h, U.inOut(amanecer));
    if (N.horaForzada != null) return N.horaForzada;
    // al soltar la hora de una escena, vuelve a la del sitio en 1,8 s por el camino más corto (sin el salto de golpe)
    if (soltada) {
      var k = (E.t - soltada.t0) / 1800;
      if (k >= 1) soltada = null;
      else { var a = soltada.h, b = h; if (b - a > 12) b -= 24; else if (a - b > 12) b += 24; h = ((U.lerp(a, b, U.inOut(k)) % 24) + 24) % 24; }
    }
    return h;
  };
  var soltada = null;
  N.soltarHora = function () { if (N.horaForzada != null) soltada = { h: N.horaForzada, t0: E.t }; N.horaForzada = null; };
  // los egipcios contaban doce horas de día y doce de noche
  N.horaTexto = function () {
    var h = N.horaAhora(), dia = h >= 6 && h < 18, n = dia ? Math.floor(h - 6) + 1 : Math.floor((h - 18 + 24) % 24) + 1;
    return n + '.ª ' + (dia ? 'del día' : 'de la noche');
  };

  /* ------------------------------------------------------------------ la luz: los tintes, la noche y el sol */
  // [hora, cuánto se multiplica el papiro del fondo en total, multiplicador del mundo]. El tinte del mundo está por encima
  // de todo (también del fondo), así que el del fondo es el total dividido por el del mundo. De noche, el papiro queda
  // del azul de los techos de las tumbas (las estrellas y la luna van en la capa de brillo, sin tinte)
  var LUCES = [
    [0, [28, 52, 153], [92, 108, 170]], [4.4, [30, 55, 156], [96, 112, 172]], [5.3, [118, 96, 150], [168, 150, 190]],
    [6.0, [248, 190, 170], [252, 214, 198]], [6.9, [255, 226, 200], [255, 238, 220]], [8.2, [255, 255, 255], [255, 255, 255]],
    [15.4, [255, 255, 255], [255, 255, 255]], [16.7, [250, 214, 170], [255, 239, 208]], [17.6, [222, 134, 98], [253, 210, 170]],
    [18.3, [172, 104, 124], [228, 172, 170]], [19.1, [96, 88, 150], [152, 142, 188]], [20.1, [34, 58, 158], [102, 116, 178]],
    [24, [28, 52, 153], [92, 108, 170]]
  ];
  function luzDe(h) {
    h = ((h % 24) + 24) % 24;
    var tot = LUCES[0][1], mun = LUCES[0][2];
    for (var i = 1; i < LUCES.length; i++) if (h <= LUCES[i][0]) {
      var a = LUCES[i - 1], b = LUCES[i], k = U.suave((h - a[0]) / (b[0] - a[0]));
      tot = U.mezcla(a[1], b[1], k); mun = U.mezcla(a[2], b[2], k); break;
    }
    return { fondo: [0, 1, 2].map(function (j) { return Math.min(255, Math.round(tot[j] * 255 / Math.max(1, mun[j]))); }), mundo: mun };
  }
  N.noche = 0;
  function nocheDe(h) { h = ((h % 24) + 24) % 24; return h < 12 ? 1 - U.suave((h - 4.6) / 1.4) : U.suave((h - 18.4) / 1.6); }
  function cssMult(c) { return (c[0] > 252 && c[1] > 252 && c[2] > 252) ? '' : 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }
  // dónde está el sol en la pantalla: sale por la izquierda, sube hasta arriba a mediodía y se pone por la derecha
  N.sol = function (h) {
    h = h == null ? N.horaAhora() : h;
    var k = (h - 6) / 12, alt = Math.sin(U.clamp(k, -0.15, 1.15) * Math.PI);
    return { x: E.W * (0.08 + 0.72 * U.clamp(k, -0.1, 1.1)), y: E.sy(SUELO - 0.03) - alt * E.u * 0.5, alt: alt, k: k, r: E.u * (0.04 + 0.01 * (1 - U.clamp(alt * 2, 0, 1))) };
  };

  /* ------------------------------------------------------------------ lo que hay pintado: las piezas
     Cada una: { a: nombre en AE.arte, xu, op, z (orden: más bajo, más atrás) }. Si la pieza aún no existe, un hueco
     marcado (para componer el mundo antes de tener el arte). */
  var PIEZAS = [
    { a: 'acacia', xu: 0.22 }, { a: 'palmeraDum', xu: 0.5, op: { quieta: true, semilla: 3 } },
    { a: 'abuSimbel', xu: 1.3 },
    { a: 'palmera', xu: 1.95, op: { quieta: true, semilla: 11 } }, { a: 'aldea', xu: 2.18 },
    { a: 'isis', xu: 2.6, z: 1 }, { a: 'filae', xu: 3.12 }, { a: 'grafito', xu: 3.18, dy: -0.05, z: 1 },   // (Isis, con las alas abiertas, por delante del pilono; el grafito va en la piedra de Filé: se coloca en preparar)
    { a: 'pozo', xu: 3.9 }, { a: 'palmeraDum', xu: 4.08, op: { quieta: true, semilla: 22 } },
    { a: 'horus', xu: 4.3 }, { a: 'edfu', xu: 4.74 },
    { a: 'karnak', xu: 5.76 }, { a: 'thot', xu: 6.42 },
    { a: 'memnon', xu: 6.95 },
    { a: 'deirElBahari', xu: 7.95 }, { a: 'procesion', xu: 7.95, dy: -0.05, z: 1 },   // (la procesión va en el muro del templo: se coloca en preparar)
    { a: 'anubis', xu: 8.62 }, { a: 'valleReyes', xu: 9.15 },
    { a: 'osiris', xu: 9.66 }, { a: 'dendera', xu: 10.12 },
    { a: 'amarna', xu: 10.95 },
    { a: 'saqqara', xu: 11.82 },
    { a: 'micerinos', xu: 12.42, z: -2 }, { a: 'kefren', xu: 12.98, z: -1 }, { a: 'keops', xu: 13.95, z: -1 }, { a: 'esfinge', xu: 13.2, z: 1 },   // (la esfinge, delante de Kefrén, deja libre la entrada de Keops)
    { a: 'ra', xu: 14.5 }, { a: 'obelisco', xu: 14.75, op: { alto: 0.46 } },
    { a: 'palmera', xu: 14.98, op: { quieta: true, semilla: 41 } }, { a: 'aldea', xu: 15.22 }, { a: 'piedraRosetta', xu: 15.64, z: 1 },
    { a: 'alejandria', xu: 16.35 }, { a: 'faro', xu: 17.18, op: { ruina: true } }
  ];
  PIEZAS.forEach(function (p, i) { p.i = i; p.z = p.z || 0; });
  var ORDEN = PIEZAS.slice().sort(function (a, b) { return a.z - b.z || a.i - b.i; });
  N.piezas = PIEZAS;
  N.pieza = function (a, n) { var k = 0; for (var i = 0; i < PIEZAS.length; i++) if (PIEZAS[i].a === a && k++ === (n || 0)) return PIEZAS[i]; return null; };
  function medidas(p) {
    var d = A()[p.a];
    if (!d) return { ancho: 0.5, alto: 0.3, abajo: 0 };
    if (d.caja) { var c = d.caja(p.op || {}); if (c) return { ancho: c.ancho || d.ancho || 0.5, alto: c.alto || d.alto || 0.3, abajo: c.abajo || 0 }; }
    var alto = d.alto; if (p.op && p.op.alto && p.a === 'obelisco') alto = p.op.alto;
    return { ancho: d.ancho || 0.5, alto: alto || 0.3, abajo: d.abajo || 0 };
  }
  // un punto exportado por una pieza ({dx, dy} en u respecto a su ancla), en la pantalla
  N.punto = function (a, clave, n) {
    var p = N.pieza(a, n), d = A()[a], h = d && d[clave];
    if (!p || !h) return null;
    return [E.sx(p.xu + (h.dx || 0)), E.sy(SUELO + (h.dy || 0)), (h.w || 0) * E.u, (h.h || 0) * E.u];
  };
  // la zona de un sitio de una pieza en la pantalla: { x, y (centro), w, h, xu }. Si la pieza no exporta el sitio, «def»
  N.zona = function (a, clave, def, n) {
    var p = N.pieza(a, n); if (!p) return null;
    var d = A()[a], h = (d && d[clave]) || def || { dx: 0, dy: -0.1, w: 0.05, h: 0.05 };
    var dy = (p.dy || 0) + (h.dy || 0);
    return { x: E.sx(p.xu + (h.dx || 0)), y: E.sy(SUELO + dy), w: (h.w || 0.04) * E.u, h: (h.h || 0.04) * E.u, xu: p.xu + (h.dx || 0), yu: SUELO + dy };
  };
  N.dentro = function (z, x, y, margen) { if (!z) return false; var m = (margen || 0) * E.u; return Math.abs(x - z.x) <= z.w / 2 + m && Math.abs(y - z.y) <= z.h / 2 + m; };
  function dibujarFalta(x, cx, cy, s, p, m) {
    x.save();
    x.fillStyle = 'rgba(58,38,20,0.06)'; x.strokeStyle = 'rgba(58,38,20,0.35)'; x.lineWidth = 1.5; x.setLineDash([6, 5]);
    x.beginPath(); x.rect(cx - m.ancho * s / 2, cy - m.alto * s, m.ancho * s, m.alto * s); x.fill(); x.stroke();
    x.setLineDash([]); x.fillStyle = 'rgba(58,38,20,0.6)'; x.font = Math.round(s * 0.022) + 'px "IBM Plex Mono", monospace'; x.textAlign = 'center';
    x.fillText(p.a, cx, cy - m.alto * s / 2);
    x.restore();
  }

  /* ------------------------------------------------------------------ zonas: dónde hay desierto y dónde campos */
  var DESIERTO = [[-1, 0.86], [0.86, 1.86, 0.6], [12.15, 14.25], [16.7, 18.5]];   // (y en el resto del valle, campos verdes)
  // cuánto campo hay (1 en el valle, 0 en el desierto, con la misma rampa que las colinas; junto al mar, nada)
  function camposK(xu) { return xu > COSTA - 0.5 && enDesierto(xu) ? 0 : 1 - desiertoSuave(xu); }
  function enDesierto(xu) { for (var i = 0; i < DESIERTO.length; i++) if (xu >= DESIERTO[i][0] && xu <= DESIERTO[i][1]) return true; return false; }
  // para las colinas: de 0 (valle) a 1 (desierto) con una rampa de ±0,15 u en los bordes; junto al mar no hay desierto
  // (los tramos que se tocan se juntan antes: si no, en la unión de dos desiertos la rampa bajaba y salía una mata de campo)
  var DESIERTO_UNIDO = DESIERTO.slice().sort(function (a, b) { return a[0] - b[0]; }).reduce(function (l, d) {
    var u = l[l.length - 1]; if (u && d[0] <= u[1] + 1e-6) u[1] = Math.max(u[1], d[1]); else l.push([d[0], d[1]]); return l;
  }, []);
  function desiertoSuave(xu) {
    var v = 0;
    for (var i = 0; i < DESIERTO_UNIDO.length; i++) { var d = DESIERTO_UNIDO[i]; if (d[0] >= COSTA - 0.5) continue; v = Math.max(v, Math.min(U.suave((xu - d[0] + 0.15) / 0.3), U.suave((d[1] + 0.15 - xu) / 0.3))); }
    return v;
  }

  /* ------------------------------------------------------------------ la capa del fondo (p = 0,9)
     El papiro, las columnas de jeroglíficos y, abajo, las colinas del desierto al modo egipcio (arena con puntos
     rojizos), más claras, como lo lejano de un friso. */
  var PF = 0.9, PC = 0.95;
  function* pintarFondo(x, xu0, xu1, t) {
    var s = E.u, X0 = xu0 * PF * s, W = (xu1 - xu0) * PF * s, H = E.H;
    ES.papiro(x, X0, 0, W + 1, H, X0, 0);
    yield;
    // las columnas de jeroglíficos, estampadas desde sus tiras (una pausa del taller tras cada tira nueva)
    var op = { col: 0.064, tam: 0.042, a: 0.36, xOrigen: 0, p: PF, esc: t.e }, r = ES.rangoColumnas(xu0, xu1, op), c;
    for (c = r[0]; c <= r[1]; c++) if (ES.columna(x, c, E.sy(ARR), E.sy(SUELO), s, op)) yield;
    // (en un móvil de pie, arriba y abajo del friso también hay papiro: con jeroglíficos, más tenues)
    if (E.y0 > 8) {
      var op2 = { col: 0.064, tam: 0.042, a: 0.22, xOrigen: 0, p: PF, esc: t.e };
      for (c = r[0]; c <= r[1]; c++) { if (ES.columna(x, c, 0, E.sy(0), s, op2)) yield; if (ES.columna(x, c + 7, E.sy(1.012), E.H, s, op2)) yield; }
    }
  }
  /* ------------------------------------------------------------------ la capa de en medio (p = 0,95): las colinas
     Un contorno suave, más alto en el desierto; arena clara con su sombra y puntos rojizos. Va por delante del sol, que
     sale y se pone detrás de ellas. */
  function* pintarColinas(x, xu0, xu1, t) {
    var s = E.u, X0 = xu0 * PC * s, W = (xu1 - xu0) * PC * s;
    var paso = 6 / PC, pts = [];
    for (var X = X0 - paso; X <= X0 + W + paso; X += paso) {
      var xu = X / (PC * s), des = 0.35 + 0.65 * desiertoSuave(xu);
      var hh = (0.035 + 0.075 * des) * (0.55 + 0.9 * U.fbm(xu * 0.85 + 3, 5, 4)) * (1 - U.suave((xu - (COSTA - 0.45)) / 0.4));   // (y se allanan hacia el mar)
      pts.push([X, E.sy(SUELO - hh)]);
    }
    var base = E.sy(SUELO + 0.01);
    x.beginPath(); x.moveTo(pts[0][0], base);
    for (var i = 0; i < pts.length; i++) x.lineTo(pts[i][0], pts[i][1]);
    x.lineTo(pts[pts.length - 1][0], base); x.closePath();
    x.fillStyle = ES.lin(x, 0, E.sy(SUELO - 0.13), 0, base, [[0, ES.lejos(P.arena, 0.38)], [1, ES.lejos(P.arena2, 0.3)]]); x.fill();
    // el filo iluminado de las colinas
    x.strokeStyle = U.rgba(ES.lejos(P.oro1, 0.3), 0.55); x.lineWidth = s * 0.003; x.beginPath();
    for (i = 0; i < pts.length; i++) i ? x.lineTo(pts[i][0], pts[i][1] + s * 0.002) : x.moveTo(pts[i][0], pts[i][1] + s * 0.002);
    x.stroke();
    // los puntos del desierto (la convención egipcia), en racimos
    var r = U.azar(Math.floor(xu0 * 97) + 5);
    x.fillStyle = U.rgba(ES.lejos(P.rojo, 0.45), 0.55);
    for (var j = 0; j < 46; j++) {
      var px = X0 + r() * W, xuP = px / (PC * s), k = Math.floor((px - pts[0][0]) / paso), top = pts[U.clamp(k, 0, pts.length - 1)][1];
      if (!enDesierto(xuP) && r() < 0.6) continue;
      var py = top + (base - top) * (0.25 + r() * 0.65);
      x.beginPath(); x.arc(px, py, s * (0.0018 + r() * 0.0014), 0, TAU); x.fill();
    }
  }

  /* ------------------------------------------------------------------ la capa del mundo (p = 1) */
  function* pintarMundo(x, xu0, xu1, t) {
    var s = E.u, X0 = xu0 * s, X1 = xu1 * s, W = X1 - X0, i;
    // los campos verdes de la orilla (bajo los monumentos)
    pintarCampos(x, xu0, xu1, s);
    // el mar, al final: el horizonte detrás del faro
    if (xu1 > COSTA - 0.3) pintarMarLejos(x, xu0, xu1, s);
    yield;
    // las piezas que tocan esta tesela, de atrás adelante. Las grandes se estampan desde su lienzo (pintado una vez);
    // las pequeñas se pintan aquí mismo
    for (i = 0; i < ORDEN.length; i++) {
      var p = ORDEN[i], m = medidas(p);
      if (p.xu + m.ancho / 2 < xu0 - 0.01 || p.xu - m.ancho / 2 > xu1 + 0.01) continue;
      if (grande(m)) {
        var sp = spritePieza(p, t.e);
        if (sp.nueva) { sp.nueva = false; yield; }
        x.drawImage(sp.c, sp.x0, sp.y0, sp.w, sp.h);
        continue;
      }
      x.save(); pintarPieza(x, p, m); x.restore();
      x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
      yield;
    }
    pintarSueloYRio(x, X0, W, s);
    yield;
    pintarCenefas(x, X0, W, s);
  }

  function pintarPieza(x, p, m) {
    var d = A()[p.a], s = E.u, cx = p.xu * s, cy = E.sy(SUELO + (p.dy || 0));
    try { if (d) d.dibujar(x, cx, cy, s, p.op || {}); else dibujarFalta(x, cx, cy, s, p, m); } catch (err) { console.error(p.a, err); }
  }
  /* ---------- las piezas grandes, en su lienzo ----------
     Un monumento que cruza tres teselas se pintaba tres veces, y cada vez de un tirón (25–50 ms). Ahora se pinta una
     sola vez en su lienzo, a la resolución de las teselas y alineado a sus píxeles, y las teselas lo estampan. Esos
     lienzos se pintan durante la carga (lo que se ve), durante la entrada y en los ratos en que la cámara está quieta
     (N.tallerPiezas, por cercanía), y se sueltan cuando quedan lejos. */
  var SPR = {}, ESC_MUNDO = 1;
  function grande(m) { return m.ancho * (m.alto + m.abajo) > 0.03; }
  function escMundo() { return ESC_MUNDO * (E.ligero ? 0.75 : E.dpr); }
  function spritePieza(p, e) {
    var m = medidas(p), k = SPR[p.i], clave = E.u + '|' + e + '|' + E.y0;
    if (k && k.clave === clave) return k;
    var s = E.u, mg = 0.02, base = SUELO + (p.dy || 0);
    var X0 = Math.floor((p.xu - m.ancho / 2 - mg) * s * e) / e, Y0 = Math.floor(E.sy(base - m.alto - mg) * e) / e;
    var w = Math.ceil(((p.xu + m.ancho / 2 + mg) * s - X0) * e), h = Math.ceil((E.sy(base + m.abajo + mg) - Y0) * e);
    var L = U.lienzo(w, h); L.x.setTransform(e, 0, 0, e, -X0 * e, -Y0 * e);
    L.x.save(); pintarPieza(L.x, p, m); L.x.restore();
    k = SPR[p.i] = { c: L.c, x0: X0, y0: Y0, w: w / e, h: h / e, clave: clave, nueva: true };
    return k;
  }
  // el taller de las piezas: pinta la que falte más cerca de la cámara (durante la entrada, todas las que quepan; con la
  // cámara quieta, una por fotograma; moviéndose, solo si sobra tiempo de verdad) y suelta las lejanas
  var quietoMs = 0;
  N.tallerPiezas = function (limite, quieta, dt) {
    quietoMs = quieta ? quietoMs + (dt || 16) : 0;
    var e = escMundo(), clave = E.u + '|' + e + '|' + E.y0, c = E.centroXu(), mejor = null, dm = Infinity, i, p;
    for (i = 0; i < PIEZAS.length; i++) {
      p = PIEZAS[i]; var sp = SPR[p.i], d = Math.abs(p.xu - c);
      if (sp && (sp.clave !== clave || d > 4.5)) { delete SPR[p.i]; sp = null; }
      if (sp || d > 3.5 || !grande(medidas(p))) continue;
      if (d < dm) { dm = d; mejor = p; }
    }
    if (!mejor) return;
    var ahora = performance.now(), entrada = E.bloqueado;
    if (entrada) { while (mejor && performance.now() < limite + 30) { spritePieza(mejor, e).nueva = false; mejor = null; for (i = 0, dm = Infinity; i < PIEZAS.length; i++) { p = PIEZAS[i]; if (SPR[p.i] || !grande(medidas(p))) continue; var d2 = Math.abs(p.xu - c); if (d2 < dm && d2 < 3.5) { dm = d2; mejor = p; } } } return; }
    if ((quieta && quietoMs > 350) || limite - ahora > 30) spritePieza(mejor, e).nueva = false;
  };
  // los animales, las barcas y la gente llenan sus cachés la primera vez que se dibujan (de 3 a 300 ms): se dibujan una
  // vez durante la carga, en un lienzo aparte
  function prepararVida() {
    var vistos = {}, L = U.auxiliar('preparar-vida', 64, 64), s = E.u;
    L.x.setTransform(E.dpr, 0, 0, E.dpr, 0, 0);
    VIDA.forEach(function (v) {
      var d = A()[v.tipo]; if (!d || vistos[v.tipo + (v.agua ? 'a' : '')]) return; vistos[v.tipo + (v.agua ? 'a' : '')] = true;
      try { L.x.save(); d.dibujar(L.x, 32, 60, s * (v.escala || 1), { t: 0, fase: 0, k: 0.5, semilla: v.semilla, agua: v.agua, viento: 0.3 }); L.x.restore(); } catch (err) { console.error(v.tipo, err); }
    });
    ['palmera', 'palmeraDum', 'papiros', 'barcaSolar', 'carter', 'champollion', 'eratostenes'].forEach(function (n) { var d = A()[n]; if (d) try { L.x.save(); d.dibujar(L.x, 32, 60, s, { t: 0, viento: 0.3 }); L.x.restore(); } catch (err) { console.error(n, err); } });
    // la procesión, entera y borrada (la escena de Hatshepsut la redibuja encima)
    var pr = A().procesion; if (pr) [0, 1].forEach(function (k) { try { L.x.save(); pr.dibujar(L.x, 32, 60, s, { revelar: k }); L.x.restore(); } catch (err) { console.error('procesion', err); } });
  }
  function pintarCampos(x, xu0, xu1, s) {
    var y0 = E.sy(SUELO - 0.026), y1 = E.sy(SUELO), r = U.azar(Math.floor(xu0 * 131) + 7);
    for (var X = Math.floor(xu0 * s / 3) * 3; X < xu1 * s + 3; X += 3) {
      var xu = X / s, kc = camposK(xu); if (kc < 0.03) continue;
      // la franja verde (trigo y lino en hileras), con la altura que ondula un poco (y que baja en el borde del desierto)
      var hh = (y1 - y0) * (0.75 + 0.25 * U.ruido(xu * 9, 2)) * kc;
      x.fillStyle = ES.lin(x, 0, y1 - hh, 0, y1, [[0, ES.aclarar(P.verde, 0.18)], [1, ES.oscurecer(P.verde, 0.2)]]);
      x.fillRect(X, y1 - hh, 3.2, hh);
    }
    // los tallos y las espigas: rayas finas verticales y puntitos dorados
    x.lineWidth = Math.max(0.8, s * 0.0012);
    for (var k = 0; k < (xu1 - xu0) * 220; k++) {
      var xu2 = xu0 + r() * (xu1 - xu0); if (r() > camposK(xu2)) continue;
      var px = xu2 * s, top = y0 + (y1 - y0) * (0.05 + r() * 0.3);
      x.strokeStyle = U.rgba(ES.oscurecer(P.verde, 0.35), 0.5); x.beginPath(); x.moveTo(px, y1); x.lineTo(px + (r() - 0.5) * 2, top); x.stroke();
      if (r() < 0.45) { x.fillStyle = U.rgba(P.oro2, 0.8); x.beginPath(); x.ellipse(px, top, s * 0.0016, s * 0.0034, 0, 0, TAU); x.fill(); }
    }
  }
  function pintarMarLejos(x, xu0, xu1, s) {
    var X0 = Math.max(xu0, COSTA - 0.25) * s, X1 = xu1 * s; if (X1 <= X0) return;
    var y0 = E.sy(SUELO - 0.125), y1 = E.sy(SUELO);   // (el horizonte, contra el cielo)
    x.save(); x.beginPath(); x.rect(X0, y0 - 2, X1 - X0, y1 - y0 + 2); x.clip();
    // el mar entra poco a poco desde la costa (una curva de playa)
    x.beginPath(); x.moveTo(X0, y1);
    for (var X = X0; X <= X1 + 4; X += 4) { var k = U.suave(((X / s) - (COSTA - 0.25)) / 0.45); x.lineTo(X, y1 - (y1 - y0) * k); }
    x.lineTo(X1 + 4, y1); x.closePath();
    x.fillStyle = ES.lin(x, 0, y0, 0, y1, [[0, ES.lejos(P.egipcio, 0.25)], [1, P.lapis]]); x.fill();
    // las olas lejanas, rayitas claras
    var r = U.azar(Math.floor(xu0 * 17) + 3); x.strokeStyle = U.rgba([220, 236, 255], 0.5); x.lineWidth = Math.max(1, s * 0.0016);
    for (var j = 0; j < (xu1 - xu0) * 60; j++) {
      var px = X0 + r() * (X1 - X0), py = y0 + (y1 - y0) * (0.2 + r() * 0.75); if ((px / s) < COSTA) continue;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + s * (0.006 + r() * 0.01), py); x.stroke();
    }
    x.restore();
  }

  // la línea de suelo, el Nilo (el agua quieta; las ondas que corren van en el lienzo del motor) y su orilla
  function pintarSueloYRio(x, X0, W, s) {
    var y0 = E.sy(SUELO), y1 = E.sy(RIO0), r0 = E.sy(RIO0), r1 = E.sy(RIO1);
    // el agua: azul egipcio arriba y lapislázuli abajo; en el mar, más verde y más hondo
    x.fillStyle = ES.lin(x, 0, r0, 0, r1, [[0, P.egipcio], [0.55, U.mezcla(P.egipcio, P.lapis, 0.6)], [1, P.lapis2]]);
    x.fillRect(X0, r0, W + 1, r1 - r0);
    var XC = COSTA * s;
    if (X0 + W > XC - 0.6 * s) {
      x.save(); x.beginPath(); x.rect(X0, r0, W + 1, r1 - r0); x.clip();
      var g = x.createLinearGradient(XC - 0.6 * s, 0, XC + 0.2 * s, 0); g.addColorStop(0, 'rgba(14,92,116,0)'); g.addColorStop(1, 'rgba(14,92,116,0.78)');
      x.fillStyle = g; x.fillRect(X0, r0, W + 1, r1 - r0); x.restore();
    }
    // reflejos quietos: rayas horizontales suaves
    var r = U.azar(Math.floor(X0) + 11);
    for (var k = 0; k < W / 30; k++) {
      var px = X0 + r() * W, py = r0 + (r1 - r0) * (0.1 + r() * 0.85);
      x.fillStyle = U.rgba([200, 225, 255], 0.08 + r() * 0.08); x.fillRect(px, py, s * (0.02 + r() * 0.05), Math.max(1, s * 0.0016));
    }
    // la línea de suelo: una banda de lapislázuli con un filo de oro arriba (la de la referencia 1)
    x.fillStyle = ES.relleno(x, P.lapis, 0, y0, 0, y1, 0.25); x.fillRect(X0, y0, W + 1, y1 - y0);
    x.fillStyle = ES.oro(x, 0, y0 - s * 0.003, 0, y0 + s * 0.002, 0.5); x.fillRect(X0, y0 - s * 0.0025, W + 1, s * 0.0035);
  }

  // las cenefas: arriba, estrellas sobre lapislázuli y una banda de bloques de colores; abajo, el zigzag y las rayas, y la
  // franja de ojos de Horus y escarabajos alados sobre papiro (como en la referencia 1)
  var CICLO_ABAJO = 0.16;
  function pintarCenefas(x, X0, W, s) {
    var X1 = X0 + W, i, k;
    // ---- arriba
    var a0 = E.sy(0), a1 = E.sy(ARR * 0.62), a2 = E.sy(ARR * 0.9), a3 = E.sy(ARR);
    x.fillStyle = ES.lin(x, 0, a0, 0, a1, [[0, P.lapis2], [1, P.lapis]]); x.fillRect(X0, a0, W + 1, a1 - a0);
    var pe = s * 0.034, ry = (a0 + a1) / 2;
    x.fillStyle = ES.oro(x, 0, ry - pe * 0.3, 0, ry + pe * 0.3, 0.4);
    for (k = Math.floor(X0 / pe) - 1; k * pe < X1 + pe; k++) { ES.estrella(x, k * pe + pe / 2, ry, (a1 - a0) * 0.34, 0); x.fill(); }
    var bloques = [P.rojo, P.lino, P.lapis, P.lino, P.verde, P.lino], bw = s * 0.014;
    for (k = Math.floor(X0 / bw) - 1; k * bw < X1 + bw; k++) {
      var c = bloques[((k % 6) + 6) % 6];
      x.fillStyle = ES.relleno(x, c, 0, a1, 0, a2, 0.15); x.fillRect(k * bw, a1, bw + 0.5, a2 - a1);
    }
    x.fillStyle = U.rgba(P.oro4, 0.35); for (k = Math.floor(X0 / bw) - 1; k * bw < X1 + bw; k++) x.fillRect(k * bw, a1, Math.max(0.6, s * 0.0011), a2 - a1);
    x.fillStyle = ES.oro(x, 0, a2, 0, a3, 0.5); x.fillRect(X0, a2, W + 1, a3 - a2);
    // ---- abajo: la orilla de crema, el zigzag, las rayas
    var b0 = E.sy(RIO1), b1 = E.sy(RIO1 + 0.004), b2 = E.sy(RIO1 + 0.019), b3 = E.sy(RIO1 + 0.022), b4 = E.sy(CEN1);
    x.fillStyle = U.rgba(P.lino); x.fillRect(X0, b0, W + 1, b4 - b0);
    x.fillStyle = ES.oro(x, 0, b0, 0, b1, 0.5); x.fillRect(X0, b0, W + 1, b1 - b0);
    var zw = s * 0.022;
    for (k = Math.floor(X0 / zw) - 1; k * zw < X1 + zw; k++) {
      x.beginPath(); x.moveTo(k * zw, b2); x.lineTo(k * zw + zw / 2, b1 + s * 0.001); x.lineTo(k * zw + zw, b2); x.closePath();
      x.fillStyle = ES.relleno(x, k % 2 ? P.lapis : P.rojo, 0, b1, 0, b2, 0.12); x.fill();
    }
    x.fillStyle = ES.relleno(x, P.lapis, 0, b2, 0, b3, 0.2); x.fillRect(X0, b2, W + 1, b3 - b2);
    var rayas = [P.rojo, P.lino, P.lapis, P.lino], rw = s * 0.009;
    for (k = Math.floor(X0 / rw) - 1; k * rw < X1 + rw; k++) { var cr = rayas[((k % 4) + 4) % 4]; x.fillStyle = ES.relleno(x, cr, 0, b3, 0, b4, 0.12); x.fillRect(k * rw, b3, rw + 0.5, b4 - b3); }
    x.fillStyle = ES.oro(x, 0, b4 - s * 0.003, 0, b4, 0.5); x.fillRect(X0, b4 - s * 0.003, W + 1, s * 0.003);
    // ---- la franja de abajo: papiro con ojos de Horus y escarabajos alados, y tres puntos entre ellos
    var f0 = b4, f1 = Math.min(E.H + 2, E.sy(1) + 1), fy = E.sy(0.935);
    ES.papiro(x, X0, f0, W + 1, f1 - f0, X0 + 211, f0);   // (el origen, X0 + una constante: así casa entre teselas)
    x.fillStyle = U.rgba([252, 240, 214], 0.35); x.fillRect(X0, f0, W + 1, f1 - f0);
    var cw = s * CICLO_ABAJO;
    for (k = Math.floor(X0 / cw) - 1; k * cw < X1 + cw; k++) {
      var cx = k * cw + cw / 2;
      if (((k % 2) + 2) % 2) ES.escarabajo(x, cx, fy + s * 0.004, s * 0.085);
      else ES.ojoHorus(x, cx, fy, s * 0.068, P.lapis);
      x.fillStyle = U.rgba(P.lapis, 0.9);
      for (i = -1; i <= 1; i++) { x.beginPath(); x.arc(k * cw + cw + i * s * 0.009, fy - s * 0.022, s * 0.0032, 0, TAU); x.fill(); }
    }
    // (en un móvil de pie, debajo del friso sigue el papiro, con una raya de cierre)
    if (E.H > E.sy(1) + 4) { x.fillStyle = ES.relleno(x, P.lapis, 0, E.sy(1), 0, E.sy(1.008), 0.2); x.fillRect(X0, E.sy(1), W + 1, s * 0.008); }
  }

  /* ------------------------------------------------------------------ la capa de delante (p = 1,12): papiros de la orilla */
  var PD = 1.12, DELANTE = [];
  (function () { var r = U.azar(4242); for (var xu = 0.9; xu < COSTA; xu += 1.1 + r() * 1.6) DELANTE.push({ xu: xu, alto: 0.11 + r() * 0.06, semilla: Math.floor(r() * 1000) }); })();
  function* pintarDelante(x, xu0, xu1, t) {
    var s = E.u;
    for (var i = 0; i < DELANTE.length; i++) {
      var d = DELANTE[i]; if (d.xu < xu0 - 0.2 || d.xu > xu1 + 0.2) continue;
      var cx = d.xu * PD * s, cy = E.sy(RIO1 + 0.004), papiros = A().papiros;
      x.save();
      if (papiros) papiros.dibujar(x, cx, cy, s, { alto: d.alto, semilla: d.semilla, quieta: true });
      else { x.fillStyle = U.rgba(P.verde, 0.8); for (var k = -3; k <= 3; k++) { x.beginPath(); x.moveTo(cx + k * s * 0.006, cy); x.lineTo(cx + k * s * 0.012, cy - d.alto * s); x.lineTo(cx + k * s * 0.012 + 2, cy - d.alto * s); x.closePath(); x.fill(); } }
      x.restore();
      yield;
    }
  }

  /* ------------------------------------------------------------------ lo que se mueve: el agua */
  function dibujarAgua(ctx) {
    var s = E.u, r0 = E.sy(RIO0), r1 = E.sy(RIO1), filas = 5, t = E.t * 0.001;
    var lam = s * 0.034, amp = s * 0.0052, deriva = t * s * 0.014;   // (el Nilo corre hacia el norte: a la derecha)
    ctx.lineWidth = Math.max(1.2, s * 0.0024); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (var f = 0; f < filas; f++) {
      var y = r0 + (r1 - r0) * (f + 0.62) / (filas + 0.3), fase = (f % 2) * lam * 0.5 + deriva * (0.8 + f * 0.08) - E.camX;
      var x0 = ((fase % lam) + lam) % lam - lam, a = 0.5 - f * 0.04, xMar = E.sx(COSTA - 0.35);
      ctx.strokeStyle = U.rgba([160, 200, 246], a);
      ctx.beginPath();
      for (var X = x0, i = 0; X < E.W + lam; X += lam / 2, i++) {
        var mar = X > xMar ? U.suave((X - xMar) / (0.7 * s)) : 0;   // (en el mar, las olas crecen)
        var yy = y + (i % 2 ? amp : -amp) * (1 + 0.9 * mar) + Math.sin(t * (1.3 - 0.5 * mar) + X * 0.01 + f) * s * 0.0012 * (1 + 2 * mar);
        i ? ctx.lineTo(X, yy) : ctx.moveTo(X, yy);
      }
      ctx.stroke();
    }
    // destellos que aparecen y se van
    for (var k = 0; k < 14; k++) {
      var sem = Math.floor(t * 0.7 + k * 0.37), xk = ((U._h(sem * 13 + k) * (E.W + 200)) - 100), yk = r0 + (r1 - r0) * (0.08 + U._h(sem * 7 + k) * 0.85);
      var vida = (t * 0.7 + k * 0.37) % 1, a2 = Math.sin(vida * Math.PI) * 0.55;
      ctx.fillStyle = U.rgba([235, 245, 255], a2); ctx.fillRect(xk, yk, s * 0.014 * (0.5 + vida), Math.max(1, s * 0.0016));
    }
  }

  /* ------------------------------------------------------------------ lo que se mueve: la vida del río y de la orilla */
  var VIDA = [];
  function vida(def) { VIDA.push(def); return def; }
  (function () {
    // las barcas: con la vela izada van al sur (a la izquierda, río arriba, con el viento del norte); sin vela y a remo, al
    // norte (a la derecha, con la corriente). Se mueven de verdad y dan la vuelta al río
    [[0.9, -1], [4.9, 1], [7.4, -1], [9.9, 1], [12.1, -1], [14.3, 1], [15.4, -1]].forEach(function (b, i) {   // (la primera ya ha dejado atrás Abu Simbel)
      vida({ tipo: b[1] < 0 ? 'barcaVela' : 'barcaRemos', xu: b[0], v: b[1] * (0.022 + (i % 3) * 0.004), y: FLOT + (i % 2) * 0.03, ancho: 0.42, semilla: i });
    });
    vida({ tipo: 'esquife', xu: 3.45, v: 0, y: FLOT + 0.06, ancho: 0.24 });
    vida({ tipo: 'esquife', xu: 14.95, v: 0, y: FLOT + 0.07, ancho: 0.24 });
    vida({ tipo: 'cocodrilo', xu: 4.2, y: FLOT + 0.045, ancho: 0.2, agua: true });   // (Sobek, entre Siena y Kom Ombo: en el agua, delante de Horus)
    vida({ tipo: 'cocodrilo', xu: 6.35, y: FLOT + 0.045, ancho: 0.2, agua: true });
    vida({ tipo: 'hipopotamo', xu: 8.25, y: FLOT + 0.05, ancho: 0.2 });
    vida({ tipo: 'hipopotamo', xu: 14.6, y: FLOT + 0.07, ancho: 0.2, fayenza: false });
    vida({ tipo: 'ibis', xu: 2.08, y: SUELO, ancho: 0.08 }); vida({ tipo: 'ibis', xu: 5.05, y: SUELO, ancho: 0.08 }); vida({ tipo: 'ibis', xu: 14.85, y: SUELO, ancho: 0.08 });
    vida({ tipo: 'garza', xu: 10.5, y: SUELO + 0.03, ancho: 0.08 }); vida({ tipo: 'garza', xu: 15.3, y: SUELO + 0.025, ancho: 0.08 });
    vida({ tipo: 'gansos', xu: 11.4, y: SUELO, ancho: 0.24 });   // (Meidum queda entre Amarna y Saqqara)
    vida({ tipo: 'escarabajo', xu: 0.68, y: SUELO, ancho: 0.05 }); vida({ tipo: 'escarabajo', xu: 12.85, y: SUELO, ancho: 0.05 });
    vida({ tipo: 'shaduf', xu: 2.3, y: SUELO, ancho: 0.3 }); vida({ tipo: 'shaduf', xu: 15.12, y: SUELO, ancho: 0.3 });
    vida({ tipo: 'escriba', xu: 6.24, y: SUELO, ancho: 0.16 });
    vida({ tipo: 'porteadores', xu: 12.1, v: 0.005, desde: 12.02, hasta: 12.3, y: SUELO, ancho: 0.78, escala: 0.7 });   // (más pequeños: entre Saqqara y Micerinos)
    vida({ tipo: 'palmera', xu: 3.62, y: SUELO, ancho: 0.32, semilla: 51 });   // (entre Filé y el pozo)
    vida({ tipo: 'palmera', xu: 8.95 - 0.62, y: SUELO, ancho: 0.32, semilla: 52 });
    vida({ tipo: 'palmera', xu: 15.92, y: SUELO, ancho: 0.32, semilla: 53 });
    vida({ tipo: 'pez', xu: 0, y: FLOT, ancho: 0.08, salto: true });
    // los pájaros que vuelan: una bandada de patos que cruza de vez en cuando y un halcón sobre Edfu (Horus)
    vida({ tipo: 'patos', xu: 0, y: 0.2, ancho: 0.3, vuelo: true });
    vida({ tipo: 'halcon', xu: 4.74, y: 0.24, ancho: 0.12, circulo: true });
    vida({ tipo: 'ibisVuelo', xu: 9.3, y: 0.25, ancho: 0.1, vuelo: true, v: -0.05 });
  })();
  N.vida = VIDA;
  // el orden, como un pintor: lo de la orilla (y la gente), luego el gato, luego lo del agua de atrás adelante (las barcas
  // flotan más abajo que la orilla, más cerca: pasan por delante del gato, de la orilla y de las palmeras), y lo que vuela
  var ORILLA = [], AGUA = [], AIRE = [];
  VIDA.forEach(function (v, i) { v.i = i; (v.vuelo || v.circulo ? AIRE : v.y <= SUELO + 0.005 ? ORILLA : AGUA).push(v); });
  [ORILLA, AGUA].forEach(function (l) { l.sort(function (a, b) { return a.y - b.y || a.i - b.i; }); });
  function actualizarVida(dt) {
    var seg = dt / 1000;
    for (var i = 0; i < VIDA.length; i++) {
      var v = VIDA[i];
      if (v.v && v.desde != null) { v.xu += v.v * seg; if (v.xu > v.hasta) v.xu = v.desde; }
      else if (v.v) { v.xu += v.v * seg; if (v.xu > COSTA + 0.3) v.xu = -0.3; if (v.xu < -0.3) v.xu = COSTA; }   // (en −0,3 ya no se ve; en la costa se funden)
      if (v.tipo === 'patos') {   // cruza la pantalla cada medio minuto, más o menos
        v.reloj = (v.reloj || 9000) + dt;
        if (v.reloj > 26000) { v.reloj = 0; v.x0 = E.W + E.u * 0.2; v.yy = 0.12 + Math.random() * 0.16; }
      }
      if (v.tipo === 'pez') {     // de vez en cuando un pez salta delante de la cámara
        v.reloj = (v.reloj || 0) + dt;
        if (v.reloj > 6500 + (v.espera || 0)) { v.reloj = 0; v.espera = Math.random() * 7000; v.xu = E.xuDe(E.W * (0.15 + Math.random() * 0.7)); v.y = FLOT + 0.02 + Math.random() * 0.07; }
      }
    }
  }
  // las escenas que piden «sinBarcas» las apartan (se desvanecen y vuelven al acabar), para que ninguna vela tape lo que se cuenta
  var veloBarcas = 1, BARCAS = { barcaVela: 1, barcaRemos: 1, esquife: 1 };
  var lugares = [];   // (los secretos de sitio que faltan, en pantalla, cuando la cámara está quieta: lo calcula N.dibujar)
  function lugaresPendientes() {
    var I = AE.interfaz, out = []; if (!I || !I.huevos || Math.abs(E.camVel) > 0.02 || E.escena) return out;
    var hall = I.estado ? I.estado().hallados : {};
    I.huevos().forEach(function (h) { if (!h.lugar || hall[h.id]) return; try { var p = h.lugar(); if (p && p[0] > -50 && p[0] < E.W + 50) out.push(p); } catch (e) { /* nada */ } });
    return out;
  }
  function dibujarVida(ctx, lista) {
    var s = E.u, art = A(), t = E.t;
    for (var j = 0; j < lista.length; j++) {
      var v = lista[j], i = v.i, d = art[v.tipo];
      var x, y = E.sy(v.y), op = { t: t + i * 977, semilla: v.semilla };
      if (v.tipo === 'patos') {
        if (v.x0 == null) continue;
        x = v.x0 - v.reloj * s * 0.00009; y = E.sy(v.yy); op.fase = (t * 0.0021) % 1;
        if (x < -s * 0.4) continue;
      } else if (v.tipo === 'halcon') {
        var an = t * 0.00035; x = E.sx(v.xu) + Math.cos(an) * s * 0.16; y = E.sy(v.y) + Math.sin(an) * s * 0.035; op.fase = (t * 0.0005) % 1; op.angulo = an;
      } else if (v.tipo === 'pez') {
        var k = v.reloj / 1100; if (k > 1) continue; x = E.sx(v.xu); op.k = k;
      } else x = E.sx(v.xu);
      if (v.tipo === 'ibisVuelo') { op.fase = (t * 0.0016) % 1; y = E.sy(v.y) + Math.sin(t * 0.0013) * s * 0.01; }
      if (x < -v.ancho * s || x > E.W + v.ancho * s) continue;
      if (v.tipo === 'barcaRemos' || v.tipo === 'barcaVela') y += Math.sin(t * 0.0011 + i) * s * 0.0025;
      if (v.tipo === 'porteadores') op.fase = (v.xu * 9) % 1;
      if (v.agua) op.agua = true;
      if (v.fayenza != null) op.fayenza = v.fayenza;
      op.viento = 0.3 + E.viento * 0.7;
      // lo que se mueve aparece y se va fundiéndose junto a la costa (allí da la vuelta al río); las barcas, además, se
      // apartan en las escenas que lo piden
      var va = v.v && v.desde == null ? (v.v < 0 ? U.clamp((COSTA - v.xu) / 0.35, 0, 1) : U.clamp((COSTA + 0.3 - v.xu) / 0.35, 0, 1)) : 1;
      if (BARCAS[v.tipo]) {
        va *= veloBarcas;
        // con la cámara quieta, una barca que tapa un secreto de sitio aún no encontrado se vuelve casi transparente
        var tapa = 0; for (var q = 0; q < lugares.length; q++) if (Math.abs(lugares[q][0] - x) < v.ancho * s * 0.5 && lugares[q][1] > E.sy(SUELO - 0.45) && lugares[q][1] < E.sy(v.y + 0.02)) tapa = 1;
        v.velo = v.velo == null ? 1 : v.velo + ((tapa ? 0.35 : 1) - v.velo) * 0.06; va *= v.velo;
      }
      if (va < 0.01) continue;
      if (va < 0.99) ctx.globalAlpha = va;
      if (d) { ctx.save(); try { d.dibujar(ctx, x, y, s * (v.escala || 1), op); } catch (err) { console.error(v.tipo, err); } ctx.restore(); }
      ctx.globalAlpha = 1;
    }
  }

  /* ------------------------------------------------------------------ el cielo: el sol, el Atón de Amarna, la luna y las estrellas */
  var ESTRELLAS = [];
  (function () { var r = U.azar(808); for (var i = 0; i < 70; i++) ESTRELLAS.push({ x: r(), y: r(), r: 0.0055 + r() * 0.0065, f: r() * TAU, rot: r() * 0.6 }); })();
  // ¿está tapado este punto de la pantalla por un monumento o una barca? (para no pintar estrellas encima: van en la capa
  // de brillo, por encima de todo)
  // (las piezas grandes, con su silueta: lo más alto que tienen pintado en cada columna, medido una vez en su lienzo; las
  // pequeñas, con su caja)
  var PERFIL = {}, COLS = 48;
  function perfil(p) {
    var pf = PERFIL[p.i]; if (pf) return pf;
    var sp = SPR[p.i]; if (!sp || sp.nueva) return null;
    var mh = U.clamp(Math.round(sp.h / 3), 16, 120), L = U.auxiliar('perfil', COLS, mh);
    L.x.drawImage(sp.c, 0, 0, COLS, mh);
    var dat = L.x.getImageData(0, 0, COLS, mh).data, tops = [];
    for (var c = 0; c < COLS; c++) { var top = null; for (var j = 0; j < mh; j++) if (dat[(j * COLS + c) * 4 + 3] > 40) { top = E.yuDe(sp.y0 + (j / mh) * sp.h); break; } tops.push(top); }
    return (PERFIL[p.i] = { xu0: sp.x0 / E.u, wu: sp.w / E.u, tops: tops });
  }
  function tapado(px, py) {
    var s = E.u, i, m, margen = s * 0.012;
    for (i = 0; i < PIEZAS.length; i++) {
      var p = PIEZAS[i]; m = medidas(p);
      var x0 = E.sx(p.xu - m.ancho / 2), x1 = E.sx(p.xu + m.ancho / 2);
      if (px <= x0 - margen || px >= x1 + margen) continue;
      var pf = grande(m) ? perfil(p) : null;
      if (pf) {
        var c = Math.floor((E.xuDe(px) - pf.xu0) / pf.wu * COLS), alto = Infinity;
        for (var k = c - 1; k <= c + 1; k++) if (k >= 0 && k < COLS && pf.tops[k] != null) alto = Math.min(alto, pf.tops[k]);
        if (alto < Infinity && py > E.sy(alto) - margen) return true;
        continue;
      }
      if (px > x0 && px < x1 && py > E.sy(SUELO + (p.dy || 0) - m.alto) - s * 0.01) return true;
    }
    for (i = 0; i < VIDA.length; i++) {
      var v = VIDA[i];
      if (v.tipo === 'patos') {   // la bandada que cruza
        if (v.x0 == null) continue;
        var bx = v.x0 - v.reloj * s * 0.00009, by = E.sy(v.yy);
        if (px > bx - s * 0.34 && px < bx + s * 0.06 && Math.abs(py - by) < s * 0.07) return true;
        continue;
      }
      if (v.tipo !== 'barcaVela' && v.tipo !== 'barcaRemos' && v.tipo !== 'palmera') continue;
      var vx = E.sx(v.xu); if (Math.abs(px - vx) < v.ancho * s * 0.55 && py > E.sy(SUELO - (v.tipo === 'barcaRemos' ? 0.2 : 0.45))) return true;
    }
    // lo que levanta una escena (el faro, mientras crece): { xu, ancho, alto }
    var tp = N.tapa; if (tp && Math.abs(px - E.sx(tp.xu)) < tp.ancho * s / 2 && py > E.sy(SUELO - tp.alto) - s * 0.01) return true;
    // y lo que tapa la escena en este fotograma (viñetas, lupas, textos: X.panel, X.lupa, X.tapar), en px de pantalla
    var L = N.tapasEscena; if (L) for (i = 0; i < L.length; i++) { var r = L[i]; if (px > r.x - 6 && px < r.x + r.w + 6 && py > r.y - 6 && py < r.y + r.h + 6) return true; }
    return false;
  }
  N.tapa = null; N.tapasEscena = [];
  N.lunaVelo = 0;
  var lunaX = null, lunaTapada = 0;   // (la luna: dónde sale, en fracción del ancho; delante de Abu Simbel tapaba la cornisa)   // (una escena puede apagar la luna: el fuego del faro)
  N.brillo = function (x) {
    var s = E.u, noche = N.noche;
    if (noche <= 0.02) return;
    // las estrellas doradas de los techos de las tumbas
    for (var i = 0; i < ESTRELLAS.length; i++) {
      var e = ESTRELLAS[i], ex = ((e.x * (E.W + 200) - E.camX * 0.04) % (E.W + 200) + (E.W + 200)) % (E.W + 200) - 100, ey = E.sy(ARR + 0.02) + e.y * (E.sy(SUELO - 0.12) - E.sy(ARR + 0.02));
      if (tapado(ex, ey)) continue;
      x.globalAlpha = noche * (0.75 + 0.25 * Math.sin(E.t * 0.0017 + e.f));
      ES.estrella(x, ex, ey, e.r * s, e.rot); x.fillStyle = 'rgb(255,214,110)'; x.fill();
    }
    x.globalAlpha = 1;
    // la luna (creciente), con su halo: el disco recortado por otro círculo desplazado
    var la = noche * (1 - N.lunaVelo);
    if (la <= 0.01) { lunaX = null; return; }
    if (lunaX == null) {
      var ly0 = E.sy(0.15), rr = s * 0.045; lunaX = 0.8;
      [0.8, 0.62, 0.3, 0.12].some(function (f) { var q = E.W * f; if (tapado(q, ly0) || tapado(q, ly0 + rr) || tapado(q - rr, ly0) || tapado(q + rr, ly0)) return false; lunaX = f; return true; });
    }
    var lx = E.W * lunaX, ly = E.sy(0.15), rl = s * 0.04;
    // si una escena pone algo encima (una viñeta, la frase del sueño), la luna se aparta fundiéndose
    lunaTapada += ((tapado(lx, ly) || tapado(lx - rl, ly) || tapado(lx + rl, ly) ? 1 : 0) - lunaTapada) * 0.15;
    la *= 1 - lunaTapada; if (la <= 0.01) return;
    FX.halo(lx, ly, s * 0.12, [200, 214, 255], 0.22 * la, x);
    x.save(); x.globalAlpha = la;
    x.beginPath(); x.rect(lx - s * 0.06, ly - s * 0.06, s * 0.12, s * 0.12); x.arc(lx + s * 0.014, ly - s * 0.008, s * 0.03, 0, TAU); x.clip('evenodd');
    x.beginPath(); x.arc(lx, ly, s * 0.034, 0, TAU);
    x.fillStyle = ES.lin(x, lx - s * 0.03, ly - s * 0.03, lx + s * 0.03, ly + s * 0.03, [[0, [255, 246, 214]], [1, [232, 206, 150]]]); x.fill();
    x.restore();
  };
  N.cielo = function (x) {
    var h = N.horaAhora(), s = E.u, sol = N.sol(h), noche = N.noche;
    // el sol: un disco de cornalina con su aro de oro, el halo y, cerca del horizonte, más grande y más rojo
    if (sol.alt > -0.12) {
      var bajo = 1 - U.clamp(sol.alt * 2.2, 0, 1), col = U.mezcla([255, 120, 50], [255, 70, 40], bajo);
      FX.halo(sol.x, sol.y, sol.r * (5 + 3 * bajo), U.mezcla([255, 214, 120], [255, 150, 90], bajo), 0.45 * (1 - noche), x);
      x.save(); x.globalAlpha = 1 - noche * 0.9;
      ES.gema(x, sol.x, sol.y, sol.r, col);
      x.restore();
    }
  };
  // el Atón de Amarna: rayos que bajan del sol y acaban en manos, a la altura de las ofrendas. Van en el lienzo del motor,
  // por delante del templo (como en los relieves); en la capa del cielo, el templo y el suelo tapaban las manos
  function rayosAton(ctx) {
    var a = U.clamp(1 - Math.abs(E.centroXu() - 10.95) / 0.9, 0, 1) * (1 - N.noche); if (a <= 0.01) return;
    var sol = N.sol(N.horaAhora()); if (sol.alt <= -0.12) return;
    dibujarAton(ctx, sol, a, E.u);
  }
  function dibujarAton(x, sol, a, s) {
    x.save(); x.globalAlpha = a * 0.8;
    var n = 13, yFin = E.sy(SUELO - 0.09);
    for (var i = 0; i < n; i++) {
      var an = Math.PI / 2 + (i - (n - 1) / 2) * 0.13, largo = Math.max(s * 0.1, (yFin - sol.y) / Math.sin(an)), x1 = sol.x + Math.cos(an) * largo, y1 = sol.y + Math.sin(an) * largo;
      x.strokeStyle = ES.lin(x, sol.x, sol.y, x1, y1, [[0, P.oro2, 0.9], [1, P.oro2, 0.5]]); x.lineWidth = s * 0.0035;
      x.beginPath(); x.moveTo(sol.x + Math.cos(an) * sol.r * 1.2, sol.y + Math.sin(an) * sol.r * 1.2); x.lineTo(x1, y1); x.stroke();
      // la manita del final
      x.save(); x.translate(x1, y1); x.rotate(an - Math.PI / 2);
      x.fillStyle = U.rgba(P.oro2, 0.9); x.beginPath(); x.ellipse(0, s * 0.006, s * 0.006, s * 0.009, 0, 0, TAU); x.fill();
      x.fillRect(-s * 0.005, s * 0.009, s * 0.0016, s * 0.008); x.fillRect(-s * 0.002, s * 0.01, s * 0.0016, s * 0.009); x.fillRect(s * 0.001, s * 0.01, s * 0.0016, s * 0.0085); x.fillRect(s * 0.0042, s * 0.009, s * 0.0016, s * 0.007);
      x.restore();
    }
    x.restore();
  }

  /* ------------------------------------------------------------------ el ciclo */
  var amanecer = null;
  N.prepararAmanecer = function () { amanecer = 0; };
  N.amaneciendo = function () { return amanecer != null && amanecer < 1; };
  E.en('empezar', function () { if (amanecer === 0) amanecer = 0.0001; });
  N.preparar = function () {
    // la procesión pintada, en el tramo liso del muro de Deir el-Bahari (su ancla es el centro de su base)
    var rel = A().deirElBahari && A().deirElBahari.relieve, pr = N.pieza('procesion'), dm = N.pieza('deirElBahari');
    if (rel && pr && dm) { pr.xu = dm.xu + (rel.dx || 0); pr.dy = (rel.dy || 0) + (rel.h || 0.08) / 2; }
    // el grafito de Filé, en su sitio (su ancla es la base de las marcas)
    var gf = A().filae && A().filae.grafito, pg = N.pieza('grafito'), pf = N.pieza('filae');
    if (gf && pg && pf) { pg.xu = pf.xu + (gf.dx || 0); pg.dy = (gf.dy || 0) + 0.017; }
    E.capaTeselas({ nombre: 'fondo', p: PF, esc: 0.75, el: E.capaFondo, pintar: pintarFondo, desde: -0.6, hasta: E.largo + 0.6 });
    E.capaTeselas({ nombre: 'colinas', p: PC, esc: 0.8, el: E.capaMedio, pintar: pintarColinas, desde: -0.6, hasta: E.largo + 0.6 });
    E.capaTeselas({ nombre: 'mundo', p: 1, esc: ESC_MUNDO, el: E.capaMundo, pintar: pintarMundo, desde: -0.6, hasta: E.largo + 0.6 });
    E.capaTeselas({ nombre: 'delante', p: PD, esc: 0.85, el: E.capaDelante, pintar: pintarDelante, desde: 0, hasta: E.largo });
    ES.texturaPapiro();
    FX.prepararHalos([[255, 214, 120], [255, 150, 90], [200, 214, 255], [255, 220, 140], [140, 230, 255], [255, 240, 200], [255, 190, 90]]);
    prepararVida();
    E.prepararTeselas();
    E.extra = N.tallerPiezas;
  };
  N.actualizar = function (dt) {
    if (amanecer != null && amanecer > 0 && amanecer < 1) { amanecer = Math.min(1, amanecer + dt / 5200); if (amanecer >= 1) amanecer = null; }
    var h = N.horaAhora(), L = luzDe(h);
    N.noche = nocheDe(h);
    E.tinte('fondo', cssMult(L.fondo)); E.tinte('mundo', cssMult(L.mundo));
    document.documentElement.classList.toggle('noche', N.noche > 0.55);
    actualizarVida(dt);
    var quiere = E.escena && E.escena.s && E.escena.s.sinBarcas ? 0 : 1; veloBarcas += (quiere - veloBarcas) * (1 - Math.exp(-dt / 220));
    if (AE.gatoCtl) AE.gatoCtl.actualizar(dt);
  };
  N.dibujar = function (ctx) {
    lugares = lugaresPendientes();
    dibujarAgua(ctx);
    rayosAton(ctx);
    dibujarVida(ctx, ORILLA);
    if (AE.gatoCtl) AE.gatoCtl.dibujar(ctx);
    dibujarVida(ctx, AGUA);
    dibujarVida(ctx, AIRE);
  };
  N.encima = function (ctx) { };
})();

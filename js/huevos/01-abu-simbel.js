/* Secreto 01 · El sol de Ramsés (Lugar) — Abu Simbel
   Clic en la puerta del gran templo: amanece, el rayo nace del sol que asoma tras las colinas y entra por la puerta; en
   una viñeta, recorre el templo hasta el santuario: ilumina a Amón-Ra, a Ramsés divinizado y a Ra-Horajti, y deja a
   oscuras a Ptah. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, FX = AE.fx, X = AE.esc, N = AE.nilo, TAU = Math.PI * 2;
  var PUERTA = { dx: 0, dy: -0.11, w: 0.06, h: 0.12 };   // (si el arte no exporta la suya)
  function puerta() { return N.zona('abuSimbel', 'puerta', PUERTA); }
  // con el dedo, la zona crece hasta medir al menos TOQUE px de ancho y de alto (un dedo no apunta como un ratón)
  var TOQUE = 48;
  function margen(z, m) {
    var Em = AE.motor; if (!z || Em.puntero.tipo === 'mouse') return m;
    return Math.max(m, (TOQUE - Math.min(z.w, z.h)) / 2 / Em.u);
  }

  // la altura de las colinas del fondo en una x de la pantalla (el sol sale por detrás de ellas): es la cuenta de
  // pintarColinas en nilo.js en pleno desierto, como en Abu Simbel. Si nilo.js da N.colina(x), manda esa
  function colina(x) {
    if (N.colina) return N.colina(x);
    var Em = AE.motor, PC = 0.95, xu = (x - Em.W / 2 * (1 - PC) + Em.camX * PC) / (PC * Em.u);
    return Em.sy(N.SUELO - 0.11 * (0.55 + 0.9 * U.fbm(xu * 0.85 + 3, 5, 4)));
  }

  // el ancho de un rótulo de la viñeta (la letra de FX.texto), para que no se pisen ni se salgan del panel
  function ancho(ctx, s, tam, esp) {
    ctx.save(); ctx.font = '400 ' + tam + 'px ' + AE.motor.FUENTES.mono;
    var w = ctx.measureText(s).width; ctx.restore();
    return w + ('letterSpacing' in ctx ? (esp || 0) * s.length : 0);
  }
  // unos rótulos centrados bajo sus x: en una fila si caben y, si no, en dos alternas; nunca fuera de [x0, x1]
  function rotulos(ctx, nombres, xs, y, tam, x0, x1, colores, a) {
    var esp = 1, ws = nombres.map(function (s) { return ancho(ctx, s, tam, esp); });
    function pos(i) { return U.clamp(xs[i], x0 + ws[i] / 2, x1 - ws[i] / 2); }
    function caben(filas) {
      for (var i = 0; i + filas < nombres.length; i++) { var j = i + filas; if (pos(j) - ws[j] / 2 - (pos(i) + ws[i] / 2) < tam * 0.7) return false; }
      return true;
    }
    var filas = caben(1) ? 1 : 2;
    for (var i = 0; i < nombres.length; i++) FX.texto(nombres[i], pos(i), y + (i % filas) * tam * 1.3, { tam: tam, alin: 'center', color: colores[i], a: a, espaciado: esp });
  }

  /* ---------- las cuatro estatuas del santuario ----------
     Sentadas en su banco y vistas de frente, pintadas como el friso (piel, lino plisado, collar usej, oro): Ptah,
     momiforme, con la cara verde, el casquete azul y su cetro; Amón-Ra, de piel azul, con las dos plumas altas; Ramsés
     divinizado, con la corona azul (jepresh) y la barba real; Ra-Horajti, con cabeza de halcón, la peluca tripartita y el
     disco solar con su ureo. En «unidades de estatua»: la base en y = 0 y lo alto de la cabeza en y = −1 (las coronas suben
     más, hasta −1,6). Cada una se pinta una vez en su lienzo, con su silueta en sombra para cuando no le llega la luz. */
  var PIELES = [U.mezcla(P.verde, P.turquesa, 0.25), U.mezcla(P.egipcio, P.lapis, 0.3), P.piel, P.piel];
  var ROCA = { l: U.mezcla(P.piedra, [190, 128, 90], 0.35), m: U.mezcla(P.piedra2, [150, 92, 62], 0.45), s: U.mezcla(P.piedra2, [92, 54, 34], 0.6) };
  var LAPIS_CLARO = U.mezcla(P.lapis, P.egipcio, 0.55);
  function cil(k, x0, x1, c, f) { f = f == null ? 0.18 : f; return ES.lin(k, x0, 0, x1, 0, [[0, ES.aclarar(c, f)], [0.45, c], [1, ES.oscurecer(c, f * 1.4)]]); }
  function vert(k, y0, y1, c, f) { f = f == null ? 0.16 : f; return ES.lin(k, 0, y0, 0, y1, [[0, ES.aclarar(c, f)], [0.5, c], [1, ES.oscurecer(c, f * 1.3)]]); }
  function llena(k, estilo) { k.fillStyle = Array.isArray(estilo) ? U.rgba(estilo, 1) : estilo; k.fill(); }
  function rayas(k, clip, y0, y1, paso, grueso, col, a) {   // rayas horizontales recortadas a una forma
    k.save(); k.beginPath(); clip(); k.clip(); k.fillStyle = U.rgba(col, a == null ? 0.85 : a);
    for (var y = y0; y < y1; y += paso) k.fillRect(-1, y, 2, grueso);
    k.restore();
  }

  function cara(k, piel) {
    k.beginPath(); k.ellipse(0.079, -0.9, 0.016, 0.03, -0.1, 0, TAU); k.ellipse(-0.079, -0.9, 0.016, 0.03, 0.1, 0, TAU); llena(k, ES.oscurecer(piel, 0.08));   // las orejas
    k.beginPath(); k.ellipse(0, -0.905, 0.074, 0.094, 0, 0, TAU); llena(k, ES.rad(k, 0, -0.905, 0, 0.1, [[0, ES.aclarar(piel, 0.12)], [0.7, piel], [1, ES.oscurecer(piel, 0.2)]], -0.025, -0.93));
    // los ojos en almendra con su raya de kohl, las cejas, la nariz y la boca
    [-1, 1].forEach(function (l) {
      k.beginPath(); k.ellipse(l * 0.032, -0.917, 0.019, 0.008, 0, 0, TAU); llena(k, U.mezcla(P.lino, [255, 255, 255], 0.3));
      k.beginPath(); k.arc(l * 0.032, -0.917, 0.0068, 0, TAU); llena(k, P.negro);
      k.strokeStyle = U.rgba(P.negro, 0.95); k.lineWidth = 0.0055;
      k.beginPath(); k.moveTo(l * 0.012, -0.919); k.quadraticCurveTo(l * 0.032, -0.929, l * 0.054, -0.918); k.lineTo(l * 0.068, -0.915); k.stroke();
      k.lineWidth = 0.006; k.beginPath(); k.moveTo(l * 0.011, -0.94); k.quadraticCurveTo(l * 0.034, -0.952, l * 0.06, -0.938); k.stroke();
    });
    k.beginPath(); k.moveTo(0.004, -0.912); k.lineTo(0.012, -0.868); k.lineTo(0, -0.864); k.closePath(); llena(k, U.rgba(ES.oscurecer(piel, 0.35), 0.45));
    k.strokeStyle = U.rgba(ES.oscurecer(piel, 0.45), 0.85); k.lineWidth = 0.007;
    k.beginPath(); k.moveTo(-0.021, -0.847); k.quadraticCurveTo(0, -0.84, 0.021, -0.847); k.stroke();
  }
  function barba(k, real) {
    k.beginPath();
    if (real) { k.moveTo(-0.02, -0.82); k.lineTo(0.02, -0.82); k.lineTo(0.025, -0.728); k.quadraticCurveTo(0, -0.72, -0.025, -0.728); k.closePath(); }
    else { k.moveTo(-0.019, -0.82); k.lineTo(0.019, -0.82); k.lineTo(0.016, -0.745); k.quadraticCurveTo(0.034, -0.728, 0.012, -0.716); k.lineTo(-0.012, -0.716); k.quadraticCurveTo(-0.034, -0.728, -0.016, -0.745); k.closePath(); }
    llena(k, cil(k, -0.026, 0.026, real ? P.negro2 : P.lapis2, 0.25));
    rayas(k, function () { k.rect(-0.03, -0.82, 0.06, 0.11); }, -0.808, -0.72, 0.016, 0.005, real ? P.oro2 : LAPIS_CLARO, 0.7);
  }
  function collar(k, piel) {
    var bandas = [P.turquesa, 'oro', P.lapis, P.cornalina, 'oro', P.turquesa], cy = -0.8;
    for (var i = 0; i < bandas.length; i++) {
      var f = 1 - i / bandas.length * 0.7, rx = 0.208 * f, ry = 0.122 * f;
      k.beginPath(); k.moveTo(rx, cy); k.ellipse(0, cy, rx, ry, 0, 0, Math.PI, false); k.closePath();
      llena(k, bandas[i] === 'oro' ? ES.oro(k, -rx, cy, rx, cy + ry, 0.35) : cil(k, -rx, rx, bandas[i], 0.2));
    }
    k.beginPath(); k.moveTo(0.06, cy); k.ellipse(0, cy, 0.06, 0.034, 0, 0, Math.PI, false); k.closePath(); llena(k, ES.oscurecer(piel, 0.08));
    // las gotas del borde
    k.fillStyle = ES.oro(k, -0.2, -0.8, 0.2, -0.66, 0.3);
    for (var g = 0; g <= 12; g++) { var an = Math.PI * (0.06 + 0.88 * g / 12), gx = Math.cos(an) * 0.214, gy = cy + Math.sin(an) * 0.128; k.beginPath(); k.ellipse(gx, gy, 0.009, 0.013, an - Math.PI / 2, 0, TAU); k.fill(); }
  }
  // el cuerpo de un rey o un dios sentado: piernas, falda con su delantal, torso, brazos con las manos en las rodillas
  function cuerpo(k, piel) {
    var i;
    [-1, 1].forEach(function (l) {
      var a = l < 0 ? -0.15 : 0.028, b = l < 0 ? -0.028 : 0.15;
      k.beginPath(); k.moveTo(l * 0.032, -0.405); k.lineTo(l * 0.14, -0.405); k.bezierCurveTo(l * 0.15, -0.31, l * 0.135, -0.18, l * 0.12, -0.075); k.lineTo(l * 0.045, -0.075); k.bezierCurveTo(l * 0.035, -0.18, l * 0.028, -0.31, l * 0.032, -0.405); k.closePath();
      llena(k, cil(k, a, b, piel, 0.22));
      k.beginPath(); k.moveTo(l * 0.042, -0.082); k.lineTo(l * 0.124, -0.082); k.quadraticCurveTo(l * 0.142, -0.035, l * 0.14, 0); k.lineTo(l * 0.026, 0); k.quadraticCurveTo(l * 0.024, -0.04, l * 0.042, -0.082); k.closePath();
      llena(k, vert(k, -0.082, 0, ES.aclarar(piel, 0.06), 0.14));
      k.strokeStyle = U.rgba(ES.oscurecer(piel, 0.4), 0.55); k.lineWidth = 0.005; k.beginPath();
      for (i = 1; i < 4; i++) { var dx = l * (0.03 + i * 0.026); k.moveTo(dx, -0.024); k.lineTo(dx, -0.002); }
      k.stroke();
    });
    // la sombra del regazo sobre las espinillas
    k.beginPath(); k.rect(-0.15, -0.405, 0.3, 0.03); llena(k, ES.lin(k, 0, -0.405, 0, -0.375, [[0, [30, 16, 8], 0.35], [1, [30, 16, 8], 0]]));
    // la falda (shendyt) sobre el regazo, plisada, con el cinturón y el delantal de oro entre las rodillas
    k.beginPath(); k.moveTo(-0.16, -0.53); k.lineTo(0.16, -0.53); k.bezierCurveTo(0.17, -0.48, 0.174, -0.44, 0.168, -0.397); k.quadraticCurveTo(0.08, -0.385, 0, -0.392); k.quadraticCurveTo(-0.08, -0.385, -0.168, -0.397); k.bezierCurveTo(-0.174, -0.44, -0.17, -0.48, -0.16, -0.53); k.closePath();
    llena(k, cil(k, -0.17, 0.17, P.lino, 0.12));
    k.strokeStyle = U.rgba(P.lino2, 0.95); k.lineWidth = 0.005; k.beginPath();
    for (i = -4; i <= 4; i++) { k.moveTo(i * 0.031, -0.518); k.lineTo(i * 0.038, -0.397); }
    k.stroke();
    k.beginPath(); k.moveTo(-0.032, -0.53); k.lineTo(0.032, -0.53); k.lineTo(0.042, -0.375); k.lineTo(-0.042, -0.375); k.closePath(); llena(k, ES.oro(k, -0.042, -0.53, 0.042, -0.375, 0.3));
    for (i = 0; i < 5; i++) { k.fillStyle = U.rgba(i % 2 ? P.cornalina : P.lapis, 0.9); k.fillRect(-0.034 - i * 0.0016, -0.515 + i * 0.027, 0.068 + i * 0.0032, 0.011); }
    k.beginPath(); k.rect(-0.164, -0.55, 0.328, 0.026); llena(k, ES.oro(k, -0.164, -0.55, 0.164, -0.524, 0.35));
    k.fillStyle = U.rgba(P.lapis, 0.85); for (i = 0; i < 9; i++) k.fillRect(-0.15 + i * 0.036, -0.544, 0.014, 0.014);
    // el torso, con los pectorales y el ombligo apenas marcados
    k.beginPath(); k.moveTo(-0.156, -0.545); k.bezierCurveTo(-0.172, -0.62, -0.2, -0.7, -0.212, -0.765); k.quadraticCurveTo(-0.19, -0.8, -0.1, -0.805); k.lineTo(0.1, -0.805); k.quadraticCurveTo(0.19, -0.8, 0.212, -0.765); k.bezierCurveTo(0.2, -0.7, 0.172, -0.62, 0.156, -0.545); k.closePath();
    llena(k, cil(k, -0.21, 0.21, piel, 0.22));
    k.strokeStyle = U.rgba(ES.oscurecer(piel, 0.35), 0.4); k.lineWidth = 0.007;
    k.beginPath(); k.moveTo(-0.11, -0.68); k.quadraticCurveTo(-0.06, -0.662, -0.012, -0.678); k.moveTo(0.012, -0.678); k.quadraticCurveTo(0.06, -0.662, 0.11, -0.68); k.stroke();
    k.beginPath(); k.arc(0, -0.592, 0.007, 0, TAU); llena(k, U.rgba(ES.oscurecer(piel, 0.4), 0.6));
    // los brazos: cuelgan junto al cuerpo y los antebrazos se apoyan en los muslos, con las manos en las rodillas
    [-1, 1].forEach(function (l) {
      var a = l < 0 ? -0.276 : 0.194, b = l < 0 ? -0.194 : 0.276;
      k.beginPath(); k.moveTo(l * 0.2, -0.8); k.bezierCurveTo(l * 0.255, -0.802, l * 0.276, -0.775, l * 0.273, -0.735); k.bezierCurveTo(l * 0.271, -0.66, l * 0.263, -0.58, l * 0.257, -0.53); k.lineTo(l * 0.198, -0.53); k.bezierCurveTo(l * 0.195, -0.6, l * 0.197, -0.72, l * 0.2, -0.8); k.closePath();
      llena(k, cil(k, a, b, piel, 0.22));
      k.beginPath(); k.moveTo(l * 0.26, -0.545); k.bezierCurveTo(l * 0.258, -0.48, l * 0.205, -0.44, l * 0.138, -0.418); k.lineTo(l * 0.108, -0.445); k.bezierCurveTo(l * 0.16, -0.47, l * 0.195, -0.505, l * 0.198, -0.545); k.closePath();
      llena(k, cil(k, a, b, ES.oscurecer(piel, 0.05), 0.2));
      k.beginPath(); k.ellipse(l * 0.092, -0.415, 0.05, 0.027, 0, 0, TAU); llena(k, vert(k, -0.442, -0.388, ES.aclarar(piel, 0.08), 0.16));
      k.strokeStyle = U.rgba(ES.oscurecer(piel, 0.4), 0.5); k.lineWidth = 0.004; k.beginPath();
      for (var d = 0; d < 3; d++) { var fx = l * (0.07 + d * 0.016); k.moveTo(fx, -0.417); k.lineTo(fx + l * 0.002, -0.393); }
      k.stroke();
      k.beginPath(); k.rect(Math.min(a, b) + 0.002, -0.712, 0.078, 0.018); llena(k, ES.oro(k, a, -0.712, b, -0.694, 0.35));   // el brazalete
    });
  }
  // Ptah, momiforme: el sudario ceñido de los hombros a los pies, las manos que salen por delante con el cetro
  function cuerpoMomia(k, piel) {
    k.beginPath();
    k.moveTo(-0.07, -0.805); k.bezierCurveTo(-0.17, -0.8, -0.226, -0.79, -0.228, -0.735); k.bezierCurveTo(-0.232, -0.64, -0.216, -0.56, -0.202, -0.5);
    k.lineTo(-0.206, -0.42); k.bezierCurveTo(-0.19, -0.28, -0.16, -0.15, -0.142, -0.075); k.lineTo(0.142, -0.075);
    k.bezierCurveTo(0.16, -0.15, 0.19, -0.28, 0.206, -0.42); k.lineTo(0.202, -0.5); k.bezierCurveTo(0.216, -0.56, 0.232, -0.64, 0.228, -0.735);
    k.bezierCurveTo(0.226, -0.79, 0.17, -0.8, 0.07, -0.805); k.closePath();
    llena(k, cil(k, -0.23, 0.23, P.lino, 0.15));
    // el regazo (la luz de arriba de los muslos y la sombra bajo las rodillas) y las vendas, en diagonal
    k.beginPath(); k.rect(-0.21, -0.506, 0.42, 0.086); llena(k, ES.lin(k, 0, -0.506, 0, -0.42, [[0, [255, 255, 255], 0.25], [1, [255, 255, 255], 0]]));
    k.beginPath(); k.rect(-0.2, -0.42, 0.4, 0.04); llena(k, ES.lin(k, 0, -0.42, 0, -0.38, [[0, [60, 40, 20], 0.3], [1, [60, 40, 20], 0]]));
    k.save(); k.beginPath(); k.rect(-0.24, -0.81, 0.48, 0.74); k.clip(); k.strokeStyle = U.rgba(P.lino2, 0.8); k.lineWidth = 0.005; k.beginPath();
    for (var v = -0.8; v < -0.06; v += 0.045) { k.moveTo(-0.24, v); k.lineTo(0.24, v + 0.035); }
    k.stroke(); k.restore();
    k.beginPath(); k.moveTo(-0.142, -0.08); k.lineTo(0.142, -0.08); k.quadraticCurveTo(0.162, -0.03, 0.158, 0); k.lineTo(-0.158, 0); k.quadraticCurveTo(-0.162, -0.03, -0.142, -0.08); k.closePath();
    llena(k, vert(k, -0.08, 0, P.lino, 0.14));
    // el cetro, de oro, con su djed (las cuatro barras) justo bajo el collar, que baja hasta el suelo; las manos lo
    // sujetan una sobre otra
    k.beginPath(); k.rect(-0.011, -0.67, 0.022, 0.66); llena(k, cil(k, -0.011, 0.011, P.oro2, 0.3));
    k.fillStyle = ES.oro(k, -0.034, -0.67, 0.034, -0.6, 0.3);
    for (var j = 0; j < 4; j++) k.fillRect(-0.033, -0.666 + j * 0.016, 0.066, 0.009);
    k.beginPath(); k.ellipse(0, -0.578, 0.046, 0.027, 0, 0, TAU); llena(k, cil(k, -0.046, 0.046, piel, 0.22));
    k.beginPath(); k.ellipse(0, -0.53, 0.046, 0.027, 0, 0, TAU); llena(k, cil(k, -0.046, 0.046, ES.oscurecer(piel, 0.06), 0.22));
  }
  // las coronas y tocados
  function tocado(k, cual) {
    if (cual === 0) {   // Ptah: el casquete azul, ceñido
      k.beginPath(); k.moveTo(-0.081, -0.93); k.quadraticCurveTo(-0.088, -1.018, 0, -1.016); k.quadraticCurveTo(0.088, -1.018, 0.081, -0.93); k.quadraticCurveTo(0, -0.955, -0.081, -0.93); k.closePath();
      llena(k, cil(k, -0.088, 0.088, P.lapis, 0.25));
    } else if (cual === 1) {   // Amón-Ra: el casquete de oro y las dos plumas altas, a bandas
      k.beginPath(); k.moveTo(-0.08, -0.94); k.lineTo(-0.086, -1.066); k.lineTo(0.086, -1.066); k.lineTo(0.08, -0.94); k.quadraticCurveTo(0, -0.958, -0.08, -0.94); k.closePath();
      llena(k, ES.oro(k, -0.086, -1.066, 0.086, -0.94, 0.32));
      k.beginPath(); k.rect(-0.084, -1.01, 0.168, 0.02); llena(k, U.rgba(P.cornalina, 0.9));
      [-1, 1].forEach(function (l) {
        var pluma = function () { k.moveTo(l * 0.004, -1.064); k.lineTo(l * 0.06, -1.064); k.bezierCurveTo(l * 0.066, -1.3, l * 0.064, -1.48, l * 0.046, -1.58); k.quadraticCurveTo(l * 0.026, -1.605, l * 0.004, -1.582); k.closePath(); };
        k.beginPath(); pluma(); llena(k, ES.oro(k, l < 0 ? -0.066 : 0.004, -1.6, l < 0 ? -0.004 : 0.066, -1.06, 0.4));
        k.save(); k.beginPath(); pluma(); k.clip();
        for (var y = -1.1, n = 0; y > -1.6; y -= 0.07, n++) { k.fillStyle = U.rgba(n % 2 ? P.cornalina : P.lapis, 0.88); k.fillRect(-0.07, y, 0.14, 0.022); }
        k.restore();
      });
      k.beginPath(); k.rect(-0.004, -1.59, 0.008, 0.53); llena(k, U.rgba(P.oro4, 0.7));   // el filo entre las dos
    } else if (cual === 2) {   // Ramsés: la jepresh, azul con anillos de oro, y el ureo
      var jep = function () { k.moveTo(-0.084, -0.885); k.bezierCurveTo(-0.1, -1.0, -0.132, -1.12, -0.112, -1.24); k.bezierCurveTo(-0.092, -1.335, 0.092, -1.335, 0.112, -1.24); k.bezierCurveTo(0.132, -1.12, 0.1, -1.0, 0.084, -0.885); k.quadraticCurveTo(0.06, -0.94, 0, -0.962); k.quadraticCurveTo(-0.06, -0.94, -0.084, -0.885); k.closePath(); };
      k.beginPath(); jep(); llena(k, ES.lin(k, -0.13, -1.33, 0.13, -0.9, [[0, ES.aclarar(P.egipcio, 0.2)], [0.45, P.lapis], [1, P.lapis2]]));
      k.save(); k.beginPath(); jep(); k.clip(); k.strokeStyle = U.rgba(P.oro2, 0.9); k.lineWidth = 0.004; k.beginPath();
      for (var yy = -1.32, f = 0; yy < -0.9; yy += 0.03, f++) for (var xx = -0.13 + (f % 2 ? 0.015 : 0); xx < 0.14; xx += 0.03) { k.moveTo(xx + 0.007, yy); k.arc(xx, yy, 0.007, 0, TAU); }
      k.stroke(); k.restore();
      k.strokeStyle = ES.oro(k, -0.084, -0.96, 0.084, -0.88, 0.35); k.lineWidth = 0.014;
      k.beginPath(); k.moveTo(-0.082, -0.89); k.quadraticCurveTo(-0.06, -0.942, 0, -0.958); k.quadraticCurveTo(0.06, -0.942, 0.082, -0.89); k.stroke();
      k.beginPath(); k.moveTo(-0.011, -0.958); k.quadraticCurveTo(-0.016, -1.02, 0, -1.052); k.quadraticCurveTo(0.016, -1.02, 0.011, -0.958); k.closePath(); llena(k, ES.oro(k, -0.016, -1.05, 0.016, -0.96, 0.3));
      k.beginPath(); k.ellipse(0, -1.02, 0.017, 0.024, 0, 0, TAU); llena(k, ES.oro(k, -0.017, -1.044, 0.017, -0.996, 0.35));
      k.beginPath(); k.ellipse(0, -1.022, 0.006, 0.012, 0, 0, TAU); llena(k, P.lapis2);
    } else {   // Ra-Horajti: el disco solar con su ureo, sobre la cabeza de halcón
      ES.gema(k, 0, -1.158, 0.14, P.cornalina);
      k.beginPath(); k.moveTo(-0.012, -0.996); k.quadraticCurveTo(-0.018, -1.05, 0, -1.082); k.quadraticCurveTo(0.018, -1.05, 0.012, -0.996); k.closePath(); llena(k, ES.oro(k, -0.018, -1.08, 0.018, -1.0, 0.3));
      k.beginPath(); k.ellipse(0, -1.052, 0.018, 0.025, 0, 0, TAU); llena(k, ES.oro(k, -0.018, -1.077, 0.018, -1.027, 0.35));
      k.beginPath(); k.ellipse(0, -1.054, 0.006, 0.012, 0, 0, TAU); llena(k, P.lapis2);
    }
  }
  // la cabeza de halcón de Ra-Horajti, de frente: plumas negro azulado, mejillas claras con la «lágrima», ojos de oro y pico
  function halcon(k) {
    var claro = [236, 226, 204];
    k.beginPath(); k.ellipse(0, -0.918, 0.079, 0.088, 0, 0, TAU); llena(k, ES.rad(k, 0, -0.918, 0, 0.09, [[0, P.negro2], [0.6, U.mezcla(P.negro, P.lapis2, 0.3)], [1, P.negro]], -0.03, -0.95));
    [-1, 1].forEach(function (l) {
      k.beginPath(); k.ellipse(l * 0.036, -0.879, 0.035, 0.036, 0, 0, TAU); llena(k, vert(k, -0.915, -0.843, claro, 0.1));
      k.strokeStyle = U.rgba(P.negro, 0.95); k.lineWidth = 0.014; k.lineCap = 'round';
      k.beginPath(); k.moveTo(l * 0.04, -0.908); k.quadraticCurveTo(l * 0.054, -0.88, l * 0.05, -0.85); k.stroke();
      k.beginPath(); k.arc(l * 0.042, -0.926, 0.02, 0, TAU); llena(k, ES.oro(k, l * 0.042 - 0.02, -0.946, l * 0.042 + 0.02, -0.906, 0.3));
      k.beginPath(); k.arc(l * 0.042, -0.926, 0.013, 0, TAU); llena(k, P.negro);
      k.beginPath(); k.arc(l * 0.042 - 0.004, -0.93, 0.0035, 0, TAU); llena(k, [255, 250, 230]);
    });
    k.beginPath(); k.ellipse(0, -0.855, 0.04, 0.024, 0, 0, TAU); llena(k, claro);
    k.beginPath(); k.moveTo(-0.021, -0.934); k.quadraticCurveTo(0, -0.95, 0.021, -0.934); k.lineTo(0.016, -0.9); k.quadraticCurveTo(0.012, -0.869, 0, -0.855); k.quadraticCurveTo(-0.012, -0.869, -0.016, -0.9); k.closePath();
    llena(k, ES.lin(k, 0, -0.95, 0, -0.855, [[0, [240, 204, 92]], [0.45, [214, 196, 160]], [1, [64, 56, 58]]]));
  }
  // la peluca tripartita: la masa detrás de la cabeza y las dos bandas que caen por delante de los hombros, a rayas
  function pelucaAtras(k) {
    k.beginPath(); k.moveTo(-0.11, -0.79); k.bezierCurveTo(-0.132, -0.88, -0.128, -1.02, 0, -1.03); k.bezierCurveTo(0.128, -1.02, 0.132, -0.88, 0.11, -0.79); k.closePath();
    llena(k, cil(k, -0.13, 0.13, P.lapis2, 0.2));
  }
  function pelucaDelante(k) {
    [-1, 1].forEach(function (l) {
      var banda = function () { k.moveTo(l * 0.068, -0.94); k.lineTo(l * 0.126, -0.94); k.lineTo(l * 0.124, -0.738); k.quadraticCurveTo(l * 0.097, -0.722, l * 0.066, -0.738); k.closePath(); };
      k.beginPath(); banda(); llena(k, cil(k, l < 0 ? -0.126 : 0.066, l < 0 ? -0.066 : 0.126, P.lapis, 0.22));
      rayas(k, banda, -0.93, -0.73, 0.022, 0.006, P.oro2, 0.85);
    });
  }
  function pintarEstatua(k, cual) {
    var piel = PIELES[cual];
    k.lineCap = 'round'; k.lineJoin = 'round';
    // el banco, tallado en la roca: el frente del asiento a los lados de las piernas y el zócalo
    k.beginPath(); k.rect(-0.3, -0.47, 0.6, 0.47); llena(k, cil(k, -0.3, 0.3, ROCA.m, 0.16));
    k.beginPath(); k.rect(-0.3, -0.47, 0.6, 0.016); llena(k, U.rgba(ES.aclarar(ROCA.l, 0.25), 0.75));
    k.beginPath(); k.rect(-0.33, -0.036, 0.66, 0.036); llena(k, vert(k, -0.036, 0, ROCA.s, 0.14));
    if (cual === 3) pelucaAtras(k);
    k.beginPath(); k.rect(-0.046, -0.866, 0.092, 0.08); llena(k, cil(k, -0.046, 0.046, ES.oscurecer(piel, 0.12), 0.2));   // el cuello
    if (cual === 0) cuerpoMomia(k, piel); else cuerpo(k, piel);
    collar(k, piel);
    if (cual === 3) { pelucaDelante(k); halcon(k); }
    else { cara(k, piel); barba(k, cual === 2); }
    tocado(k, cual);
  }

  var SPRITES = {}, CLAVE_SPRITES = '';
  // la estatua «cual» de alto h px (de la base a lo alto de la cabeza): su lienzo en color y su silueta en sombra
  function sprite(cual, h) {
    var dpr = AE.motor.dpr || 1, clave = Math.round(h * 4) + '|' + dpr;
    if (clave !== CLAVE_SPRITES) { SPRITES = {}; CLAVE_SPRITES = clave; }
    if (SPRITES[cual]) return SPRITES[cual];
    var w = 0.74 * h, alto = 1.66 * h, ox = w / 2, oy = 1.63 * h;
    var L = U.lienzo(w * dpr, alto * dpr), k = L.x;
    k.scale(dpr, dpr); k.translate(ox, oy); k.scale(h, h);
    try { pintarEstatua(k, cual); } catch (err) { console.error(err); }
    var O = U.lienzo(L.w, L.h); O.x.drawImage(L.c, 0, 0); O.x.globalCompositeOperation = 'source-in'; O.x.fillStyle = 'rgb(26,15,9)'; O.x.fillRect(0, 0, O.w, O.h);
    return (SPRITES[cual] = { color: L.c, sombra: O.c, w: w, h: alto, ox: ox, oy: oy });
  }
  // la estatua en (x, y) (el centro de su base), con la luz de 0 a 1 (a oscuras se ve apenas su silueta)
  function estatua(ctx, x, y, h, cual, luz) {
    var c = sprite(cual, h);
    ctx.drawImage(c.color, x - c.ox, y - c.oy, c.w, c.h);
    var a = 0.86 * (1 - U.clamp(luz, 0, 1));
    if (a > 0.01) { var a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * a; ctx.drawImage(c.sombra, x - c.ox, y - c.oy, c.w, c.h); ctx.globalAlpha = a0; }
  }

  // la viñeta: dónde va y cuánto mide. A la derecha y por encima de la puerta; en un móvil de pie, arriba del todo, para que
  // no la tape la tarjeta (que entra después del clímax) y se vean el sol, el rayo y la puerta
  function marco(E, z) {
    var s = E.u, W = E.W, m = 16, techoPuerta = z.y - z.h / 2;
    if (W < 700) { var py0 = 58; return { x: m, y: py0, w: W - 2 * m, h: Math.min(s * 0.5, techoPuerta - 14 - py0) }; }
    var pw = Math.min(W * 0.56, s * 1.02), ph = s * (s < 560 ? 0.42 : 0.36), px = W - pw - s * 0.05, py = E.sy(0.09);
    // (si baja más que el dintel, que no tape la puerta: a su derecha)
    if (py + ph > techoPuerta - 8 && px < z.x + z.w / 2 + 10) { px = z.x + z.w / 2 + 10; pw = Math.min(pw, W - px - m); }
    return { x: px, y: py, w: pw, h: ph };
  }

  AE.registrar({
    id: 'abu-simbel', n: 1, nombre: 'El sol de Ramsés', jero: '𓍹𓇳𓄊𓁦𓇳𓍉𓈖𓍺', tipo: 'Lugar',
    pista: 'Dos veces al año, el sol entra hasta el fondo de la montaña. Llama a su puerta.',
    lugar: function () { var z = puerta(); return z ? [z.x, z.y] : null; }, radioKa: 0.28,
    detectar: function (api) {
      api.en('clic', function (d) { var z = puerta(); if (N.dentro(z, d.x, d.y, margen(z, 0.012))) api.disparar(); });
    },
    escena: function (E) {
      var L = E.lectura, G = AE.gatoCtl, DUR = 17000 + L;
      var proximo = (function () { var a = X.diasHasta(2, 22), b = X.diasHasta(10, 22); return a < b ? { d: a, f: '22 de febrero' } : { d: b, f: '22 de octubre' }; })();
      return {
        duracion: DUR,
        tarjeta: {
          en: 9800, hasta: 16200 + L,   // (después del clímax: cuando la luz ya ha llegado a las estatuas)
          titulo: 'El sol de Ramsés',
          // (una cadena, no una función: el motor cuenta sus palabras para saber cuánto se queda la tarjeta)
          texto: 'Dos veces al año, hacia el 22 de febrero y el 22 de octubre, el sol del amanecer cruza la puerta y se adentra unos 60 metros en la roca, hasta el santuario. Durante unos veinte minutos ilumina a Amón-Ra, a Ramsés divinizado y a Ra-Horajti. Ptah, al que se asociaba con el mundo de los muertos, se queda a oscuras. ' +
            (proximo.d === 0 ? 'Hoy, ' + proximo.f + ', vuelve a pasar.' : proximo.d === 1 ? 'Mañana, ' + proximo.f + ', vuelve a pasar.' : 'La próxima vez será el ' + proximo.f + ', dentro de ' + proximo.d + ' días.'),
          pie: 'Abu Simbel · Ramsés II (Usermaatra) · siglo XIII a. C.'
        },
        // el gato se sienta al otro lado de la puerta, donde no tapa ni el sol ni el rayo
        inicio: function () { E.irA(1.3, 1600); if (G) G.forzar({ xu: 1.62, estado: 'sentado' }); AE.sonido.tocar('amanecer'); },
        cuadro: function (t) { X.hora(t, 0, 1400, null, 5.75); if (t > 1400) X.hora(t, 1400, 3000, 5.75, 6.35); },
        sinBarcas: true,   // (que ninguna vela tape la puerta)
        frente: function (ctx, t) {
          var z = puerta(); if (!z) return;
          var s = E.u, sol = N.sol(), D = (E.escena && E.escena.dur) || DUR;   // (la duración ya alargada para leer la tarjeta)
          // el rayo: nace de lo que asoma del sol por encima de las colinas (su filo del lado de la puerta, a media altura de
          // lo que se ve) y entra por la puerta; crece a medida que sale el sol
          var arriba = sol.y - sol.r, abajo = Math.min(sol.y + sol.r, colina(sol.x)), vis = abajo - arriba;
          var kr = U.meseta(t, 2600, 3800, D - 1800, D - 300) * U.clamp(vis / (sol.r * 0.45), 0, 1);
          if (vis > 1 && kr > 0.01) {
            var ym = (arriba + abajo) / 2, dx = Math.sqrt(Math.max(0, sol.r * sol.r - (ym - sol.y) * (ym - sol.y)));
            X.rayo(ctx, sol.x + dx * 0.8, ym, z.x, z.y, Math.min(vis, sol.r * 1.5), z.w * 1.1, [255, 210, 120], kr * 0.85);
          }
          FX.halo(z.x, z.y, z.h * 1.2, [255, 220, 140], kr * 0.85);
          X.polvo(ctx, z.x, z.y, z.h * 0.8, 10, kr, t, 1);
          // la viñeta, a la manera egipcia: el templo de perfil (de la puerta, a la izquierda, al santuario) y la pared del
          // fondo de frente, con las cuatro estatuas una junto a otra
          var kp = U.meseta(t, 3400, 4400, D - 1600, D - 200); if (kp <= 0) return;
          var mc = marco(E, z), etq = Math.max(11, Math.round(s * 0.0125)), claro = [255, 228, 170];
          X.panel(ctx, mc.x, mc.y, mc.w, mc.h, kp, function (x0, y0, w, h) {
            // el santuario se lleva más sitio cuanto más estrecha es la viñeta (para que las estatuas y sus nombres quepan)
            var fs = U.clamp(250 / w, 0.37, 0.56), sep = w * 0.03, pas = w * (1 - fs) - sep, corte = x0 + pas, fondo0 = corte + sep, x1 = x0 + w;
            var bajo = Math.max(h * 0.2, etq * 3.1), suelo = y0 + h - bajo, techo = y0 + h * 0.2, muro = y0 + Math.max(h * 0.15, etq * 2);
            // la roca y el pasillo, de piedra rosada en sombra (las salas se van estrechando hacia el santuario)
            ctx.fillStyle = ES.lin(ctx, 0, y0, 0, y0 + h, [[0, [86, 54, 38]], [1, [48, 30, 20]]]); ctx.fillRect(x0, y0, w, h);
            ctx.fillStyle = ES.lin(ctx, x0, 0, corte, 0, [[0, [142, 96, 64]], [1, [78, 48, 32]]]);
            ctx.beginPath(); ctx.moveTo(x0, techo); ctx.lineTo(x0 + pas * 0.57, techo); ctx.lineTo(x0 + pas * 0.6, techo + (suelo - techo) * 0.2); ctx.lineTo(corte, techo + (suelo - techo) * 0.27);
            ctx.lineTo(corte, suelo); ctx.lineTo(x0, suelo); ctx.closePath(); ctx.fill();
            // los pilares osiríacos de la gran sala, en sombra
            ctx.fillStyle = 'rgba(36,22,12,0.6)';
            for (var i = 0; i < 4; i++) ctx.fillRect(x0 + pas * (0.11 + i * 0.12), techo, pas * 0.05, suelo - techo);
            // el rayo avanza por el suelo del pasillo, de la puerta al fondo
            var avance = U.sale(U.tramo(t, 4400, 8600)), xr = x0 + (corte - x0) * avance;
            if (avance > 0) {
              ctx.fillStyle = ES.lin(ctx, x0, 0, Math.max(x0 + 1, xr), 0, [[0, [255, 228, 156], 0.9], [1, [255, 204, 112], 0.6]]);
              ctx.beginPath(); ctx.moveTo(x0, techo + (suelo - techo) * 0.18); ctx.lineTo(xr, suelo - (suelo - techo) * 0.36); ctx.lineTo(xr, suelo); ctx.lineTo(x0, suelo); ctx.closePath(); ctx.fill();
            }
            // la pared del fondo, de frente, separada por una banda de oro
            ctx.fillStyle = ES.oro(ctx, corte, y0, fondo0, y0 + h, 0.4); ctx.fillRect(corte + sep * 0.3, y0 + h * 0.05, sep * 0.4, h * 0.9);
            ctx.fillStyle = ES.lin(ctx, 0, muro, 0, suelo, [[0, [74, 46, 30]], [1, [40, 24, 16]]]); ctx.fillRect(fondo0, muro, x1 - fondo0, suelo - muro);
            // la mancha de luz llega a la pared y cubre a las tres de la derecha
            var llega = U.tramo(t, 8400, 9400) * (0.85 + 0.15 * Math.sin(t * 0.005)), paso = (x1 - fondo0) / 4, lx0 = fondo0 + paso * 1.06, lx1 = x1 - paso * 0.04;
            var mancha = function (a0, a1) {
              ctx.fillStyle = ES.lin(ctx, 0, muro, 0, suelo, [[0, [255, 214, 130], a0 * llega], [1, [255, 226, 160], a1 * llega]]);
              ctx.beginPath(); ctx.moveTo(lx0 + paso * 0.2, muro + (suelo - muro) * 0.06); ctx.lineTo(lx1, muro + (suelo - muro) * 0.06); ctx.lineTo(lx1, suelo); ctx.lineTo(lx0, suelo); ctx.closePath(); ctx.fill();
            };
            if (llega > 0) mancha(0.35, 0.6);
            // las cuatro estatuas: Ptah, Amón-Ra, Ramsés divinizado y Ra-Horajti; la luz no llega a Ptah
            var hE = Math.min(paso * 1.42, (suelo - muro) * 0.97 / 1.62), nombres = ['PTAH', 'AMÓN-RA', 'RAMSÉS', 'RA-HORAJTI'], xs = [];
            for (var k = 0; k < 4; k++) { xs.push(fondo0 + paso * (k + 0.5)); estatua(ctx, xs[k], suelo, hE, k, k === 0 ? 0.04 : llega); }
            if (llega > 0) { mancha(0.12, 0.2); X.polvo(ctx, (lx0 + lx1) / 2, (muro + suelo) / 2, (lx1 - lx0) * 0.6, 14, llega, t, 3); }
            // los rótulos (de 11 px como poco; los nombres, dentro del panel y sin pisarse)
            rotulos(ctx, nombres, xs, suelo + Math.min(bajo * 0.36, etq * 1.25), etq, fondo0 + 2, x1 - 2, [[176, 146, 120], claro, claro, claro], 0.9 * kp);
            FX.texto('LA PUERTA', x0 + pas * 0.04, y0 + h * 0.1, { tam: etq, color: claro, a: 0.85 * kp, espaciado: 1.5 });
            FX.texto('EL SANTUARIO', (fondo0 + x1) / 2, y0 + h * 0.1, { tam: etq, alin: 'center', color: claro, a: 0.85 * kp, espaciado: 1.5 });
            // «unos 60 metros»: una cota a lo largo del pasillo, bajo el suelo
            var tc = 'UNOS 60 METROS', wc = ancho(ctx, tc, etq, 1.5), cy = suelo + bajo * 0.5, ca = x0 + pas * 0.03, cb = corte - pas * 0.03, cm = (ca + cb) / 2;
            ctx.strokeStyle = U.rgba(claro, 0.55 * kp); ctx.lineWidth = 1; ctx.beginPath();
            ctx.moveTo(ca, cy - 4); ctx.lineTo(ca, cy + 4); ctx.moveTo(cb, cy - 4); ctx.lineTo(cb, cy + 4);
            if (cb - ca > wc + 16) { ctx.moveTo(ca, cy); ctx.lineTo(cm - wc / 2 - 6, cy); ctx.moveTo(cm + wc / 2 + 6, cy); ctx.lineTo(cb, cy); }
            ctx.stroke();
            FX.texto(tc, cm, cy, { tam: etq, alin: 'center', color: claro, a: 0.75 * kp, espaciado: 1.5 });
          });
        },
        fin: function () { X.soltarHora(); if (G) G.soltar(); SPRITES = {}; CLAVE_SPRITES = ''; }
      };
    }
  });
})();

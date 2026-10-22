/* Secreto 02 · El último jeroglífico (Mirada) — Filé
   En la piedra del templo de Isis hay una inscripción diminuta. Si se deja el puntero encima 1,2 s (o el dedo), sale una
   lupa: es el grafito de Esmet-Ajom, la última inscripción jeroglífica fechada (24 de agosto de 394). */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, FX = AE.fx, X = AE.esc, N = AE.nilo, TAU = Math.PI * 2;
  var GRAFITO = { dx: 0.3, dy: -0.07, w: 0.03, h: 0.03 };
  function grafito() { var z = N.zona('filae', 'grafito', GRAFITO); if (z) { z.w = Math.max(z.w, E().u * 0.034); z.h = Math.max(z.h, E().u * 0.034); } return z; }
  function E() { return AE.motor; }
  // el radio de la mirada: con el dedo, al menos 24 px (una zona de 48 px, lo que necesita un dedo)
  function radio() { var Em = E(); return Em.puntero.tipo === 'mouse' ? Em.u * 0.03 : Math.max(Em.u * 0.03, 24); }

  /* ---------- el grafito, en relieve hundido ----------
     Mandulis de perfil, mirando a la derecha, con su corona (cuernos de carnero, tres haces con sus discos, dos plumas y dos
     cobras), el cetro was delante y el anj en la mano de atrás; delante de la cara, tres columnas de jeroglíficos, y bajo el
     brazo, entre el cuerpo y el cetro, las líneas de demótico. Todo tallado en la arenisca, como la procesión de Deir
     el-Bahari: la forma hundida, con su filo en sombra arriba a la izquierda y su filo al sol abajo a la derecha.
     Las columnas llevan palabras del texto real en su grafía de manual (no es una copia signo a signo del grafito): sꜣ Ḥr,
     «hijo de Horus»; n Ꜣst, «de Isis», y nḥḥ, «eternidad». Por orden de lectura, de derecha a izquierda: los signos miran
     hacia donde mira el dios (en la fuente miran a la izquierda: se dibujan en espejo).
     En «cuadros» (la retícula de los relieves: de la planta del pie al nacimiento del pelo, 18): los pies en (0, 0), la
     cabeza hacia y negativa. */
  var SIGNOS = [['𓅭', '𓅃'], ['𓈖', '𓊨', '𓏏', '𓁐'], ['𓈖', '𓎛', '𓎛', '𓇳']];
  var COL_X = [7.45, 5.75, 4.05], COL_Y0 = -25.7, COL_TAM = 1.5, COL_PASO = 1.66, COL_MEDIO = 0.85;
  var CX = 2.25, CY = -12.85, RADIO_CUADROS = 14.2;   // (el centro de la composición y lo que hay que meter en la lupa)
  var DEM_X0 = 3.3, DEM_X1 = 5.2, DEM_Y0 = -11.7;

  // un contorno cerrado y suave por sus puntos (los que llevan un tercer valor son esquinas en punta)
  function forma(k, pts) {
    var n = pts.length, mid = function (a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }, m0 = pts[0][2] ? pts[0] : mid(pts[n - 1], pts[0]);
    k.moveTo(m0[0], m0[1]);
    for (var i = 0; i < n; i++) {
      var p = pts[i], q = pts[(i + 1) % n], m = q[2] ? q : mid(p, q);
      if (p[2]) k.lineTo(m[0], m[1]); else k.quadraticCurveTo(p[0], p[1], m[0], m[1]);
    }
    k.closePath();
  }
  function trazos(k, lineas) { k.beginPath(); lineas.forEach(function (l) { k.moveTo(l[0], l[1]); for (var i = 2; i < l.length; i += 2) k.lineTo(l[i], l[i + 1]); }); }

  var PIERNA_ATRAS = [[-0.45, -7.6, 1], [-0.85, -5.8], [-1.3, -3.3], [-1.65, -1.15], [-0.9, -0.75], [0.35, -0.3], [0.45, 0, 1], [-2.85, 0, 1], [-2.9, -0.5], [-2.45, -1.1], [-2.3, -2.6], [-2.1, -3.9], [-2.0, -5.5], [-2.0, -7.6, 1]];
  var PIERNA_DELANTE = [[0.65, -7.6, 1], [1.3, -5.6], [1.45, -3.9], [1.75, -2.4], [2.15, -1.1], [1.8, -0.5], [1.75, 0, 1], [5.35, 0, 1], [5.25, -0.3], [3.95, -0.72], [3.05, -1.1], [2.75, -3.0], [2.4, -5.7], [2.1, -7.6, 1]];
  var FALDA = [[-1.75, -11.4, 1], [1.3, -11.4, 1], [2.95, -7.3, 1], [0.7, -7.15], [-2.3, -7.45, 1], [-2.35, -8.9], [-2.0, -10.4]];
  var TORSO = [[-1.6, -11.2, 1], [1.25, -11.2, 1], [1.5, -12.1], [1.65, -13.2], [2.3, -14.3], [2.75, -15.2], [3.1, -15.75], [2.7, -16.15], [0.8, -16.35], [0.85, -16.9, 1], [-0.55, -17.1, 1], [-0.65, -16.4], [-2.6, -16.15], [-3.05, -15.75], [-2.5, -14.5], [-1.85, -12.6]];
  var CABEZA = [[-0.55, -17.0], [-1.15, -17.6], [-1.45, -18.45], [-1.05, -19.2], [-0.2, -19.5], [0.55, -19.45], [1.15, -18.95], [1.35, -18.45], [1.42, -18.2], [1.98, -17.75, 1], [1.55, -17.55], [1.62, -17.38], [1.45, -17.26], [1.56, -17.1], [1.35, -16.78], [0.8, -16.7]];
  var BARBA = [[1.2, -16.85], [1.55, -16.8], [1.72, -15.6], [1.98, -15.25], [1.72, -15.05], [1.42, -15.4], [1.28, -16.3]];
  var BRAZO_DELANTE = [[2.35, -15.95], [3.2, -15.75], [3.7, -13.25], [4.95, -13.75], [5.2, -14.0], [5.9, -13.9], [5.95, -12.85], [5.0, -12.7], [3.55, -12.3], [2.85, -12.9], [2.55, -14.6]];
  var BRAZO_ATRAS = [[-2.2, -15.5], [-3.08, -15.6], [-3.3, -14.0], [-3.25, -12.0], [-3.05, -10.0], [-2.9, -9.4], [-3.0, -8.75], [-2.4, -8.55], [-2.25, -9.3], [-2.4, -10.1], [-2.5, -12.0], [-2.4, -14.0]];
  var CABEZA_WAS = [[5.45, -17.55, 1], [5.48, -18.1], [5.9, -18.35], [6.45, -18.5, 1], [6.35, -18.2], [5.78, -17.95], [5.75, -17.55, 1]];

  // las capas del relieve: A, el dios (con el cetro y el anj); B, la corona; C, las columnas; D, el demótico
  function llenar(k, pts) { k.beginPath(); forma(k, pts); k.fill(); }
  function mascaraDios(k) {
    [PIERNA_ATRAS, PIERNA_DELANTE, FALDA, TORSO, CABEZA, BARBA, BRAZO_ATRAS, BRAZO_DELANTE, CABEZA_WAS].forEach(function (p) { llenar(k, p); });
    // el cetro was: el palo y la horquilla de abajo
    k.fillRect(5.45, -17.6, 0.3, 17.3);
    k.beginPath(); k.moveTo(5.25, 0); k.lineTo(5.45, -0.5); k.lineTo(5.75, -0.5); k.lineTo(5.95, 0); k.lineTo(5.75, 0); k.lineTo(5.6, -0.3); k.lineTo(5.45, 0); k.closePath(); k.fill();
    // el anj que cuelga de la mano de atrás (sujeto por el lazo)
    k.fillRect(-3.3, -8.5, 1.4, 0.32);
    k.beginPath(); k.moveTo(-2.78, -8.2); k.lineTo(-2.42, -8.2); k.lineTo(-2.3, -6.55); k.lineTo(-2.9, -6.55); k.closePath(); k.fill();
  }
  function lineasDios(k) {
    trazos(k, [
      [-1.65, -11.0, 1.32, -11.0], [1.0, -11.0, 2.45, -7.45],   // el cinturón y el borde del delantal
      [-1.2, -10.8, -1.6, -7.6], [-0.4, -10.8, -0.6, -7.4], [0.4, -10.8, 0.5, -7.3],   // los pliegues de la falda
      [-2.2, -15.5, -2.42, -14.0, -2.5, -12.0], [2.35, -15.95, 2.55, -14.6, 2.85, -12.9],   // donde los brazos se separan del cuerpo
      [5.25, -13.85, 5.3, -12.9], [5.62, -13.88, 5.66, -12.88],   // los dedos de la mano que sujeta el cetro
      [-2.85, -9.25, -2.4, -9.15],
      [-1.05, -1.6, -1.25, -1.0], [2.85, -1.6, 2.6, -1.05],   // los tobillos
      [-1.0, -5.9, -1.35, -5.3], [2.25, -5.9, 2.0, -5.3]   // las rodillas
    ]);
    k.stroke();
    // el collar ancho y el ojo, la oreja y el borde de la peluca corta
    k.beginPath(); k.ellipse(0.2, -16.3, 1.75, 1.05, 0, 0.25, Math.PI - 0.15); k.moveTo(0.2 + Math.cos(0.3) * 2.35, -16.3 + Math.sin(0.3) * 1.5); k.ellipse(0.2, -16.3, 2.35, 1.5, 0, 0.3, Math.PI - 0.2); k.stroke();
    k.beginPath(); k.moveTo(0.68, -18.38); k.quadraticCurveTo(0.95, -18.62, 1.2, -18.36); k.quadraticCurveTo(0.95, -18.2, 0.68, -18.38); k.stroke();
    k.beginPath(); k.moveTo(1.08, -19.0); k.quadraticCurveTo(0.2, -18.7, -0.15, -18.2); k.quadraticCurveTo(-0.5, -17.6, -1.05, -17.55); k.stroke();
    k.beginPath(); k.arc(-0.3, -17.95, 0.3, -1.2, 1.6); k.stroke();
  }
  // la corona de Mandulis: los cuernos ondulados de carnero, los tres haces con su disco, las dos plumas y las dos cobras
  var HACES = [-1.0, 0.1, 1.2], PLUMAS = [-2.15, 2.3], COBRAS = [-3.3, 2.75];
  function mascaraCorona(k) {
    var x, i, arriba = [], abajo = [];
    for (x = -3.7; x <= 3.0001; x += 0.1) {
      var f = (x + 3.7) / 6.7, yt = -19.92 + 0.2 * Math.sin((x + 3.7) * 2.6), g = 0.62 * Math.pow(Math.sin(Math.PI * U.clamp(f, 0.02, 0.98)), 0.45);
      arriba.push([x, yt]); abajo.unshift([x, yt + g]);
    }
    k.beginPath(); var pts = arriba.concat(abajo); k.moveTo(pts[0][0], pts[0][1]); for (i = 1; i < pts.length; i++) k.lineTo(pts[i][0], pts[i][1]); k.closePath(); k.fill();
    HACES.forEach(function (hx) {
      k.beginPath(); forma(k, [[hx - 0.24, -19.85, 1], [hx - 0.3, -21.2], [hx - 0.5, -23.1], [hx - 0.34, -24.1], [hx, -24.45], [hx + 0.34, -24.1], [hx + 0.5, -23.1], [hx + 0.3, -21.2], [hx + 0.24, -19.85, 1]]); k.fill();
      k.beginPath(); k.arc(hx, -24.9, 0.42, 0, TAU); k.fill();
    });
    PLUMAS.forEach(function (px, j) {
      var s = j ? 1 : -1;
      k.beginPath(); forma(k, [[px - 0.17, -19.85, 1], [px - 0.21, -22.6], [px - 0.1 + s * 0.06, -24.5], [px + s * 0.26, -24.95], [px + s * 0.42, -24.55], [px + 0.19, -22.6], [px + 0.17, -19.85, 1]]); k.fill();
    });
    COBRAS.forEach(function (cx) {
      k.beginPath(); forma(k, [[cx - 0.2, -19.85, 1], [cx - 0.28, -20.6], [cx - 0.06, -21.05], [cx - 0.34, -21.45], [cx, -21.75], [cx + 0.34, -21.45], [cx + 0.24, -21.0], [cx + 0.2, -19.85, 1]]); k.fill();
      k.beginPath(); k.arc(cx, -22.12, 0.33, 0, TAU); k.fill();
    });
  }
  function lineasCorona(k) {
    var l = [];
    for (var x = -3.2; x < 2.8; x += 0.75) l.push([x, -19.85, x + 0.22, -19.45]);   // las vueltas del cuerno
    HACES.forEach(function (hx) { l.push([hx - 0.4, -21.3, hx + 0.4, -21.3], [hx - 0.38, -23.0, hx + 0.38, -23.0], [hx, -20.0, hx, -24.2]); });   // las ataduras de los haces
    PLUMAS.forEach(function (px) { l.push([px, -20.0, px + 0.02, -24.2]); });
    trazos(k, l); k.stroke();
  }
  // (los signos se dibujan uno a uno con X.columna y en px reales: cada uno ajustado al ancho de la columna, como hacían los
  // escribas con los signos anchos, y apilados por su tinta, no por su caja; X.columna redondea el tamaño de la letra, y
  // en «cuadros» saldría mal)
  function mascaraColumnas(k, esc, tr) {
    var tam = COL_TAM * esc, anchoCol = (COL_MEDIO * 2 - 0.24) * esc, hueco = 0.16 * esc;
    k.save(); k.setTransform(1, 0, 0, 1, 0, 0); k.font = Math.round(tam) + 'px ' + ES.JERO; k.textAlign = 'center'; k.textBaseline = 'top';
    var medidas = SIGNOS.map(function (col) {
      return col.map(function (g) {
        var m = k.measureText(g), w = (m.actualBoundingBoxLeft || 0) + (m.actualBoundingBoxRight || 0), asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
        if (!(w > 0)) w = m.width;
        if (!(asc + desc > 0)) { asc = 0; desc = tam; }
        return { w: w, asc: asc, desc: desc };
      });
    });
    k.restore();
    for (var c = 0; c < 3; c++) {
      var cx = tr[4] + COL_X[c] * esc, y = tr[5] + COL_Y0 * esc;
      for (var i = 0; i < SIGNOS[c].length; i++) {
        var md = medidas[c][i], alto = md.asc + md.desc, f = Math.min(1, anchoCol / Math.max(1, md.w), tam / Math.max(1, alto)), yt = y + md.asc * f;
        // en espejo: los signos miran a la derecha, como el dios
        k.setTransform(-1, 0, 0, 1, cx, 0);
        X.columna(k, SIGNOS[c][i], 0, yt, tam * f, 1, [255, 255, 255], 1);
        k.save(); k.lineWidth = Math.max(1, tam * 0.045); k.strokeStyle = '#fff'; k.font = Math.round(tam * f) + 'px ' + ES.JERO; k.textAlign = 'center'; k.textBaseline = 'top'; k.strokeText(SIGNOS[c][i], 0, yt); k.restore();
        y += alto * f + hueco;
      }
    }
    // las líneas que separan las columnas
    k.setTransform(tr[0], tr[1], tr[2], tr[3], tr[4], tr[5]); k.fillStyle = '#fff';
    for (var j = 0; j < 4; j++) { var lx = j === 0 ? COL_X[0] + COL_MEDIO : COL_X[j - 1] - COL_MEDIO; k.fillRect(lx - 0.06, COL_Y0 - 0.25, 0.12, 4 * COL_PASO + 0.35); }
  }
  // las líneas de demótico: cursivas, de derecha a izquierda, con algún trazo que sube o baja
  function mascaraDemotico(k) {
    var r = U.azar(394), y, x;
    k.lineCap = 'round'; k.lineJoin = 'round'; k.lineWidth = 0.2; k.beginPath();
    for (var f = 0; f < 5; f++) {
      y = DEM_Y0 + f * 0.75; x = DEM_X1 - (f === 4 ? 0.7 : 0);
      k.moveTo(x, y);
      while (x > DEM_X0 + 0.15) {
        var paso = 0.22 + r() * 0.3, dy = (r() - 0.5) * 0.35; x -= paso;
        if (r() < 0.22) { k.lineTo(x, y - 0.38); k.moveTo(x, y); } else k.quadraticCurveTo(x + paso / 2, y + dy, x, y + (r() - 0.5) * 0.12);
      }
    }
    k.stroke();
  }

  // pinta una capa en relieve hundido en su propio lienzo (lado × lado px reales; la composición centrada, sq px por cuadro)
  var HONDO = U.mezcla(P.piedra, P.piedra2, 0.6), SOMBRA = U.mezcla(P.piedra2, P.tinta, 0.55), LUZ = [255, 246, 222];
  function capaRelieve(lado, esc, mascara, lineas) {
    var tr = [esc, 0, 0, esc, lado / 2 - CX * esc, lado / 2 - CY * esc], d = Math.max(1.1, esc * 0.17);
    var M = U.auxiliar('fileMascara', lado, lado), m = M.x;
    m.setTransform(tr[0], tr[1], tr[2], tr[3], tr[4], tr[5]); m.fillStyle = '#fff'; m.strokeStyle = '#fff';
    mascara(m, esc, tr);
    var R = U.lienzo(lado, lado), x = R.x;
    x.drawImage(M.c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = U.rgba(HONDO, 1); x.fillRect(0, 0, lado, lado); x.globalCompositeOperation = 'source-over';
    // el filo en sombra (arriba a la izquierda, por dentro) y el filo al sol (abajo a la derecha)
    [[d, SOMBRA, 0.9], [-d * 0.85, LUZ, 0.88]].forEach(function (b) {
      var S = U.auxiliar('fileBisel', lado, lado), k = S.x;
      k.drawImage(M.c, 0, 0); k.globalCompositeOperation = 'destination-out'; k.drawImage(M.c, b[0], b[0]);
      k.globalCompositeOperation = 'source-in'; k.fillStyle = U.rgba(b[1], b[2]); k.fillRect(0, 0, lado, lado); k.globalCompositeOperation = 'source-over';
      x.drawImage(S.c, 0, 0, lado, lado, 0, 0, lado, lado);
    });
    // los detalles grabados dentro de la figura: una raya en sombra con su filo al sol debajo
    if (lineas) {
      x.setTransform(tr[0], tr[1], tr[2], tr[3], tr[4], tr[5]); x.lineCap = 'round'; x.lineJoin = 'round'; x.lineWidth = 0.13;
      var o = d / esc * 0.75;
      x.save(); x.translate(o, o); x.strokeStyle = U.rgba(LUZ, 0.75); lineas(x); x.restore();
      x.strokeStyle = U.rgba(SOMBRA, 0.85); lineas(x);
      x.setTransform(1, 0, 0, 1, 0, 0);
    }
    return R.c;
  }
  var RELIEVE = null;
  function relieve(r) {
    var dpr = E().dpr || 1, clave = Math.round(r) + '|' + dpr;
    if (RELIEVE && RELIEVE.clave === clave) return RELIEVE;
    var lado = Math.ceil(r * 2 * dpr), esc = r * 0.92 / RADIO_CUADROS * dpr;
    RELIEVE = { clave: clave, sq: esc / dpr, capas: [capaRelieve(lado, esc, mascaraDios, lineasDios), capaRelieve(lado, esc, mascaraCorona, lineasCorona), capaRelieve(lado, esc, mascaraColumnas), capaRelieve(lado, esc, mascaraDemotico)] };
    return RELIEVE;
  }
  // lo que se ve en la lupa (centro lx, ly; radio r): la arenisca con sus juntas y el grafito, que aparece por partes
  // (k de 0 a 1): primero el dios, luego la corona, las columnas de arriba abajo y en orden de lectura, y el demótico
  function grabado(ctx, lx, ly, r, k) {
    ctx.fillStyle = ES.lin(ctx, lx - r, ly - r, lx + r, ly + r, [[0, ES.aclarar(P.piedra, 0.18)], [0.6, P.piedra], [1, P.piedra2]]); ctx.fillRect(lx - r, ly - r, r * 2, r * 2);
    var gr = U.azar(77); ctx.fillStyle = U.rgba(P.piedra2, 0.35);
    for (var i = 0; i < 140; i++) { ctx.beginPath(); ctx.arc(lx - r + gr() * r * 2, ly - r + gr() * r * 2, 0.4 + gr() * 0.9, 0, TAU); ctx.fill(); }
    var R; try { R = relieve(r); } catch (err) { console.error(err); return; }
    var sq = R.sq, a0 = ctx.globalAlpha, x0 = lx - r, y0 = ly - r;
    function aX(xq) { return lx + (xq - CX) * sq; }
    function aY(yq) { return ly + (yq - CY) * sq; }
    // las juntas de los sillares de la puerta de Adriano
    ctx.strokeStyle = U.rgba(ES.oscurecer(P.piedra2, 0.2), 0.45); ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(lx - r, aY(-4.6)); ctx.lineTo(lx + r, aY(-4.6)); ctx.moveTo(aX(-6.2), aY(-4.6)); ctx.lineTo(aX(-6.2), ly + r); ctx.stroke();
    function poner(c, a, clip) {
      if (a <= 0.01) return;
      ctx.save(); if (clip) { ctx.beginPath(); ctx.rect(clip[0], clip[1], clip[2], clip[3]); ctx.clip(); }
      ctx.globalAlpha = a0 * a; ctx.drawImage(c, x0, y0, r * 2, r * 2); ctx.restore();
    }
    poner(R.capas[0], U.tramo(k, 0, 0.3));
    poner(R.capas[1], U.tramo(k, 0.15, 0.45));
    for (var c = 0; c < 3; c++) {
      var f = U.tramo(k, 0.32 + c * 0.12, 0.56 + c * 0.12), cx0 = aX(COL_X[c] - COL_MEDIO - 0.1), y1 = aY(COL_Y0 - 0.4);
      if (f > 0) poner(R.capas[2], 1, [cx0, y1, (COL_MEDIO * 2 + 0.2) * sq, (4 * COL_PASO + 0.8) * sq * f]);
    }
    var fd = U.tramo(k, 0.72, 1);   // (el demótico se lee de derecha a izquierda: aparece así)
    if (fd > 0) { var dx1 = aX(DEM_X1 + 0.3), dw = (DEM_X1 - DEM_X0 + 0.6) * sq * fd; poner(R.capas[3], 1, [dx1 - dw, aY(DEM_Y0 - 0.8), dw, 4.6 * sq]); }
  }

  var mirando = 0, armado = true;
  AE.registrar({
    id: 'filae', n: 2, nombre: 'El último jeroglífico', jero: '𓊨𓏏𓁐', tipo: 'Mirada',
    pista: 'En la isla de Isis, alguien grabó el último. Es tan pequeño que solo se ve si te quedas mirando.',
    lugar: function () { var z = grafito(); return z ? [z.x, z.y] : null; }, radioKa: 0.2,
    detectar: function (api) {
      var Em = api.motor;
      api.en('cuadro', function (d) {
        var p = Em.puntero, z = grafito();
        var encima = !!(p.sobre && z && Math.hypot(p.x - z.x, p.y - z.y) < radio());
        // se rearma solo cuando el puntero sale de la zona: al acabar la escena, la cámara deja el grafito justo debajo
        // del puntero y, si no, la mirada volvía a empezar sola
        if (!encima) armado = true;
        mirando = encima && armado ? mirando + d.dt : Math.max(0, mirando - d.dt * 2);
        if (mirando > 1200) { mirando = 0; armado = false; api.disparar(); }
      });
      api.en('escena', function () { mirando = 0; });   // (al empezar y al acabar cualquier escena, la cuenta vuelve a cero)
      // mientras se mira, un aro que se cierra alrededor (la lupa que se acerca)
      api.capa(function (ctx) {
        if (mirando < 120) return; var z = grafito(); if (!z) return;
        var k = U.clamp(mirando / 1200, 0, 1), r = Math.max(Em.u * (0.05 - 0.02 * k), radio() * 1.15);
        ctx.strokeStyle = U.rgba(AE.color.oro, 0.35 + 0.5 * k); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(z.x, z.y, r, -Math.PI / 2, -Math.PI / 2 + TAU * k); ctx.stroke();
      });
    },
    escena: function (E) {
      var L = E.lectura, G = AE.gatoCtl, DUR = 14500 + L;
      return {
        duracion: DUR,
        tarjeta: {
          en: 6200, hasta: 13600 + L,
          titulo: 'El último jeroglífico',
          texto: 'El 24 de agosto de 394 d. C., en Filé, la isla de Isis, un sacerdote llamado Esmet-Ajom grabó la figura del dios Mandulis, unas líneas en jeroglífico y otras en demótico con la fecha. Es la última inscripción jeroglífica fechada que se conoce. Poco después, seguramente, ya no quedaba nadie que supiera leer esa escritura, y así siguió hasta que Champollion la descifró en 1822.',
          pie: 'Filé · Esmet-Ajom · 24.08.394 d. C.'
        },
        inicio: function () { var z = grafito(); E.irA(z ? z.xu : 2.98, 1400); if (G) G.forzar({ xu: (z ? z.xu : 2.98) - 0.45, estado: 'sentado' }); AE.sonido.tocar('descubrir'); },
        frente: function (ctx, t) {
          var z = grafito(); if (!z) return;
          var s = E.u, D = (E.escena && E.escena.dur) || DUR, k = U.meseta(t, 1500, 2600, D - 1300, D - 100);
          // la lupa: más grande en una pantalla pequeña (si no, los signos no se distinguen); a la derecha del grafito y por
          // encima de él, sin taparlo
          var r = Math.max(s * 0.19, Math.min(120, s * 0.31, E.W * 0.34)), arribaMin = E.W < 700 ? 64 : 10;
          var lx = U.clamp(z.x + Math.max(s * 0.22, r * 1.25), r * 1.15, E.W - r * 1.45);
          var ly = Math.max(r + arribaMin, Math.min(E.sy(0.3), z.y - r - s * 0.04));
          // la línea que une el sitio con la lupa
          var an = Math.atan2(z.y - ly, z.x - lx), bx = lx + Math.cos(an) * r, by = ly + Math.sin(an) * r;
          ctx.strokeStyle = U.rgba(P.oro3, 0.6 * k); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(z.x, z.y); ctx.lineTo(bx, by); ctx.stroke();
          ctx.strokeStyle = U.rgba(P.oro3, 0.8 * k); ctx.beginPath(); ctx.arc(z.x, z.y, s * 0.02, 0, TAU); ctx.stroke();
          X.lupa(ctx, lx, ly, r, k, function () { grabado(ctx, lx, ly, r, U.tramo(t, 2400, 5200)); });
          // la fecha, debajo de la lupa (o encima, si debajo estaría sobre el grafito)
          if (t > 5200) {
            var tam = Math.max(11, s * 0.013), yf = ly + r * 1.22;
            if (Math.abs(yf - z.y) < s * 0.06 && Math.abs(lx - z.x) < r) yf = ly - r * 1.16;
            FX.texto('24.08.394 d. C.', lx, yf, { tam: tam, alin: 'center', a: k * U.tramo(t, 5200, 6000), espaciado: 2, color: P.tinta });
            X.tapar(lx - r, yf - tam, r * 2, tam * 2);
          }
        },
        sinBarcas: true,
        fin: function () { if (G) G.soltar(); RELIEVE = null; }
      };
    }
  });
})();

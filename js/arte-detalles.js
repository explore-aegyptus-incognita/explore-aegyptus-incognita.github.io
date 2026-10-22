/* Aegyptus Incognita · detalles de los secretos
   Dos piezas pequeñas que hacen falta para los secretos: el pozo de Siena (Eratóstenes) y la piedra de Rosetta, con sus
   tres escrituras (jeroglífica arriba, demótica en medio y griega abajo) y el cartucho de Ptolomeo. Mismo acabado que el
   resto (estilo.js). */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, TAU = Math.PI * 2;
  AE.arte = AE.arte || {};

  /* ---------- el pozo de Siena: un brocal de piedra, redondo, con el agua al fondo ---------- */
  AE.arte.pozo = {
    ancho: 0.16, alto: 0.11,
    boca: { dx: 0, dy: -0.085, w: 0.11, h: 0.05 },
    dibujar: function (x, cx, cy, s, op) {
      var w = 0.13 * s, h = 0.075 * s, top = cy - h, er = w * 0.16;
      // el cuerpo del brocal: un cilindro de sillares, iluminado a la izquierda
      var cuerpo = function (k) { k.moveTo(cx - w / 2, top); k.lineTo(cx - w / 2, cy - er * 0.4); k.ellipse(cx, cy - er * 0.4, w / 2, er, 0, Math.PI, 0, true); k.lineTo(cx + w / 2, top); k.ellipse(cx, top, w / 2, er, 0, 0, Math.PI, false); k.closePath(); };
      ES.rellenar(x, cuerpo, ES.lin(x, cx - w / 2, 0, cx + w / 2, 0, [[0, ES.aclarar(P.piedra, 0.18)], [0.45, P.piedra], [1, ES.oscurecer(P.piedra2, 0.25)]]));
      // las juntas de los sillares
      x.save(); x.beginPath(); cuerpo(x); x.clip();
      x.strokeStyle = U.rgba(ES.oscurecer(P.piedra2, 0.3), 0.45); x.lineWidth = Math.max(1, s * 0.0016);
      for (var f = 1; f < 4; f++) { var yy = top + (h - er * 0.4) * f / 4; x.beginPath(); x.ellipse(cx, yy, w / 2, er, 0, 0, Math.PI); x.stroke(); }
      for (f = 0; f < 4; f++) {
        var y0 = top + (h - er * 0.4) * f / 4, y1 = top + (h - er * 0.4) * (f + 1) / 4;
        for (var j = 0; j < 5; j++) { var an = (j + (f % 2) * 0.5) / 5 * Math.PI, px = cx - Math.cos(an) * w / 2; x.beginPath(); x.moveTo(px, y0 + Math.sin(an) * er); x.lineTo(px, y1 + Math.sin(an) * er); x.stroke(); }
      }
      ES.sombra(x, cuerpo, cx, 0, cx + w / 2, 0, 0.3);
      x.restore();
      // el borde de arriba (el brocal) y la boca: oscura, con el agua al fondo y el sol reflejado
      x.beginPath(); x.ellipse(cx, top, w / 2, er, 0, 0, TAU); x.fillStyle = ES.lin(x, cx - w / 2, top - er, cx + w / 2, top + er, [[0, ES.aclarar(P.piedra, 0.3)], [1, P.piedra2]]); x.fill();
      x.beginPath(); x.ellipse(cx, top + er * 0.12, w * 0.4, er * 0.72, 0, 0, TAU); x.fillStyle = ES.lin(x, 0, top - er, 0, top + er, [[0, [40, 26, 14]], [1, [14, 24, 40]]]); x.fill();
      if (op.reflejo !== false) {
        var g = x.createRadialGradient(cx + w * 0.02, top + er * 0.18, 0, cx + w * 0.02, top + er * 0.18, er * 0.6);
        g.addColorStop(0, 'rgba(255,240,190,0.95)'); g.addColorStop(0.35, 'rgba(255,200,90,0.6)'); g.addColorStop(1, 'rgba(255,170,60,0)');
        x.fillStyle = g; x.beginPath(); x.ellipse(cx + w * 0.02, top + er * 0.18, er * 0.62, er * 0.42, 0, 0, TAU); x.fill();
      }
      // un cántaro de barro apoyado al lado
      var jx = cx + w * 0.62, jy = cy, jh = h * 0.62;
      var cantaro = function (k) { k.moveTo(jx - jh * 0.12, jy - jh); k.quadraticCurveTo(jx - jh * 0.1, jy - jh * 0.8, jx - jh * 0.32, jy - jh * 0.55); k.quadraticCurveTo(jx - jh * 0.42, jy - jh * 0.1, jx - jh * 0.12, jy); k.lineTo(jx + jh * 0.12, jy); k.quadraticCurveTo(jx + jh * 0.42, jy - jh * 0.1, jx + jh * 0.32, jy - jh * 0.55); k.quadraticCurveTo(jx + jh * 0.1, jy - jh * 0.8, jx + jh * 0.12, jy - jh); k.closePath(); };
      ES.rellenar(x, cantaro, ES.relleno(x, [176, 92, 46], jx - jh * 0.4, jy - jh, jx + jh * 0.4, jy, 0.2));
      x.fillStyle = U.rgba(P.lino, 0.8); x.fillRect(jx - jh * 0.3, jy - jh * 0.56, jh * 0.6, jh * 0.04);
    }
  };

  /* ---------- el grafito de Filé: unas marcas diminutas y gastadas, grabadas en la piedra (el ancla es su base) ---------- */
  AE.arte.grafito = {
    ancho: 0.034, alto: 0.034,
    dibujar: function (x, cx, cy, s, op) {
      var h = 0.03 * s, hondo = 'rgba(112,74,44,0.55)', lw = Math.max(0.7, s * 0.0011);
      x.save(); x.translate(cx - h * 0.1, cy - h * 0.5); x.lineCap = 'round'; x.strokeStyle = hondo; x.lineWidth = lw;
      // la figura, apenas un trazo: el cuerpo, la cabeza con la corona y el cetro
      x.beginPath(); x.moveTo(-h * 0.02, h * 0.45); x.lineTo(0, -h * 0.12); x.moveTo(-h * 0.06, -h * 0.22); x.lineTo(h * 0.08, -h * 0.22);
      x.moveTo(0, -h * 0.22); x.lineTo(0, -h * 0.4); x.moveTo(h * 0.16, -h * 0.18); x.lineTo(h * 0.16, h * 0.45); x.stroke();
      // dos columnitas de rayas delante, y unas líneas de demótico
      for (var c = 0; c < 2; c++) for (var j = 0; j < 4; j++) { x.beginPath(); x.moveTo(h * (0.26 + c * 0.1), -h * 0.38 + j * h * 0.09); x.lineTo(h * (0.31 + c * 0.1), -h * 0.38 + j * h * 0.09); x.stroke(); }
      for (var f = 0; f < 2; f++) { x.beginPath(); x.moveTo(h * 0.04, h * (0.1 + f * 0.1)); x.lineTo(h * 0.13, h * (0.1 + f * 0.1)); x.stroke(); }
      x.restore();
    }
  };

  /* ---------- la piedra de Rosetta ----------
     Granodiorita gris oscura con vetas rosadas y motas claras, rota arriba. Tres franjas de texto: jeroglíficos (con el
     cartucho de Ptolomeo, más grande de lo real para poder rodearlo), demótico y griego (empieza «ΒΑΣΙΛΕΥΟΝΤΟΣ ΤΟΥ ΝΕΟΥ…»). */
  var CARTUCHO_PTOLOMEO = '𓊪𓏏𓍯𓃭𓐝𓇌𓋴';   // p-t-wꜣ-l-m-y-s (comprobado en herramientas/datos-comprobados.md)
  AE.arte.piedraRosetta = {
    ancho: 0.2, alto: 0.27,
    cartucho: { dx: 0.0, dy: -0.205, w: 0.105, h: 0.042 },
    signos: CARTUCHO_PTOLOMEO,
    dibujar: function (x, cx, cy, s, op) {
      var w = 0.16 * s, h = 0.25 * s, x0 = cx - w / 2, y0 = cy - h, r = U.azar(1799);
      // la silueta: rota arriba a la izquierda y a la derecha
      var losa = function (k) {
        k.moveTo(x0 + w * 0.02, cy); k.lineTo(x0, y0 + h * 0.3); k.lineTo(x0 + w * 0.08, y0 + h * 0.16); k.lineTo(x0 + w * 0.2, y0 + h * 0.12); k.lineTo(x0 + w * 0.34, y0 + h * 0.02);
        k.lineTo(x0 + w * 0.58, y0); k.lineTo(x0 + w * 0.72, y0 + h * 0.06); k.lineTo(x0 + w * 0.84, y0 + h * 0.05); k.lineTo(x0 + w, y0 + h * 0.2); k.lineTo(x0 + w * 0.985, cy); k.closePath();
      };
      ES.rellenar(x, losa, ES.lin(x, x0, y0, x0 + w, cy, [[0, [92, 88, 96]], [0.5, [58, 54, 62]], [1, [34, 31, 38]]]));
      x.save(); x.beginPath(); losa(x); x.clip();
      // las motas y vetas de la granodiorita
      for (var i = 0; i < 260; i++) { x.fillStyle = r() < 0.5 ? 'rgba(220,200,200,' + (0.08 + r() * 0.12).toFixed(2) + ')' : 'rgba(170,110,110,' + (0.06 + r() * 0.08).toFixed(2) + ')'; x.fillRect(x0 + r() * w, y0 + r() * h, 1 + r() * 1.6, 1 + r() * 1.2); }
      // la franja de los jeroglíficos (rota), con el cartucho
      var hy0 = y0 + h * 0.12, hy1 = y0 + h * 0.36, filas = 5;
      x.font = Math.round(s * 0.011) + 'px ' + ES.JERO; x.textBaseline = 'middle'; x.fillStyle = 'rgba(232,226,214,0.55)';
      for (var f = 0; f < filas; f++) {
        var fy = hy0 + (hy1 - hy0) * (f + 0.5) / filas, seq = ES.secuencia(80 + f, 22), px = x0 + w * 0.05;
        for (var g = 0; g < seq.length && px < x0 + w * 0.96; g++) {
          if (f >= 1 && f <= 2 && px > cx - s * 0.062 && px < cx + s * 0.062) { px += s * 0.012; continue; }
          x.fillText(seq[g], px, fy); px += s * 0.0115;
        }
      }
      // el cartucho de Ptolomeo, en grande
      var c = AE.arte.piedraRosetta.cartucho, ccx = cx + c.dx * s, ccy = cy + c.dy * s, cw = c.w * s * 0.92, ch = c.h * s * 0.8;
      x.strokeStyle = 'rgba(240,232,214,0.75)'; x.lineWidth = Math.max(1, s * 0.0018);
      x.beginPath(); ES.redondo(x, ccx - cw / 2, ccy - ch / 2, cw, ch, ch / 2); x.stroke();
      x.beginPath(); x.moveTo(ccx + cw / 2, ccy - ch * 0.3); x.lineTo(ccx + cw / 2, ccy + ch * 0.3); x.lineWidth = Math.max(1.5, s * 0.003); x.stroke();
      x.font = Math.round(s * 0.017) + 'px ' + ES.JERO; x.textAlign = 'center'; x.fillStyle = 'rgba(242,236,222,0.8)';
      var sg = Array.from(CARTUCHO_PTOLOMEO), paso = cw * 0.84 / sg.length;
      for (g = 0; g < sg.length; g++) x.fillText(sg[g], ccx - cw * 0.42 + paso * (g + 0.5), ccy);
      x.textAlign = 'left';
      // la franja del demótico: renglones de trazos cursivos
      var dy0 = y0 + h * 0.4, dy1 = y0 + h * 0.66;
      x.strokeStyle = 'rgba(226,218,204,0.42)'; x.lineWidth = Math.max(0.8, s * 0.0013);
      for (f = 0; f < 9; f++) {
        var ry = dy0 + (dy1 - dy0) * (f + 0.5) / 9; x.beginPath();
        for (var px2 = x0 + w * 0.05; px2 < x0 + w * 0.95; px2 += s * 0.004) { var q = r(); if (q < 0.12) { x.moveTo(px2 + s * 0.004, ry); continue; } x.lineTo(px2, ry + (q - 0.5) * s * 0.006); }
        x.stroke();
      }
      // la franja del griego: el principio del decreto y renglones de letras
      var gy0 = y0 + h * 0.7, gy1 = cy - h * 0.04, texto = 'ΒΑΣΙΛΕΥΟΝΤΟΣ ΤΟΥ ΝΕΟΥ ΚΑΙ ΠΑΡΑΛΑΒΟΝΤΟΣ ΤΗΝ ΒΑΣΙΛΕΙΑΝ ΠΑΡΑ ΤΟΥ ΠΑΤΡΟΣ ΚΥΡΙΟΥ ΒΑΣΙΛΕΙΩΝ ΜΕΓΑΛΟΔΟΞΟΥ ΤΟΥ ΤΗΝ ΑΙΓΥΠΤΟΝ ΚΑΤΑΣΤΗΣΑΜΕΝΟΥ ';
      x.font = Math.round(s * 0.0062) + 'px Georgia, "Times New Roman", serif'; x.fillStyle = 'rgba(232,226,214,0.5)';
      for (f = 0; f < 11; f++) {
        var ly = gy0 + (gy1 - gy0) * (f + 0.5) / 11, ini = (f * 23) % texto.length, linea = (texto + texto).slice(ini, ini + 60);
        x.save(); x.beginPath(); x.rect(x0 + w * 0.04, ly - s * 0.006, w * 0.92, s * 0.012); x.clip(); x.fillText(linea, x0 + w * 0.04, ly); x.restore();
      }
      ES.brillo(x, losa, x0, y0, x0 + w * 0.5, y0 + h * 0.4, 0.12);
      ES.sombra(x, losa, cx, 0, x0 + w, 0, 0.3);
      x.restore();
    }
  };
})();

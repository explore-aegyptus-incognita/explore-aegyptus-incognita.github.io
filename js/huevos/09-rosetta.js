/* Secreto 09 · Je tiens l'affaire (Gesto) — Rosetta
   En la piedra negra, el nombre del rey va dentro de un óvalo. Si se rodea con el cálamo (un óvalo cerrado alrededor
   del cartucho), cada signo suena: p, t, o, l, m, i, s… PTOLMIS, y en el griego de abajo, ΠΤΟΛΕΜΑΙΟΣ. Champollion
   pasa corriendo: «Je tiens l'affaire!». */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, FX = AE.fx, X = AE.esc, N = AE.nilo, TAU = Math.PI * 2;
  var CARTUCHO = { dx: 0, dy: -0.205, w: 0.105, h: 0.042 };
  function cartucho() { return N.zona('piedraRosetta', 'cartucho', CARTUCHO); }
  var LETRAS = ['p', 't', 'o', 'l', 'm', 'i', 's'];
  AE.registrar({
    id: 'rosetta', n: 9, nombre: '«Je tiens l’affaire!»', jero: '𓍹𓊪𓏏𓍯𓃭𓐝𓇌𓋴𓍺', tipo: 'Gesto',
    pista: 'En una piedra oscura, el nombre de un rey va dentro de un óvalo. Rodéalo tú también.',
    lugar: function () { var z = cartucho(); return z ? [z.x, z.y] : null; }, radioKa: 0.2,
    detectar: function (api) {
      // en táctil, un trazo que empieza cerca del cartucho es para rodearlo aunque el botón diga «Mover»
      api.motor.zonasGesto.push(function (x, y) { return !api.hallado() && N.dentro(cartucho(), x, y, 0.09); });
      api.en('trazo', function (d) {
        var z = cartucho(), g = AE.gestos.ovalo(d.pts); if (!z || !g || !g.ok) return;
        // el óvalo tiene que rodear el cartucho: su centro cerca, y más grande que él pero no mucho
        var Em = api.motor;
        if (Math.abs(g.cx - z.x) < z.w * 0.6 && Math.abs(g.cy - z.y) < z.h * 1.2 && g.a > z.w * 0.32 && g.a < Em.u * 0.28) api.disparar();
      });
    },
    escena: function (E) {
      var L = E.lectura, G = AE.gatoCtl;
      return {
        duracion: 18000 + L,
        tarjeta: {
          en: 10200, hasta: 17200 + L,
          titulo: '«Je tiens l’affaire!»',
          texto: 'En julio de 1799, unos soldados franceses que ampliaban un fuerte junto a Rashid (Rosetta) encontraron esta piedra: un decreto del 196\u00a0a.\u00a0C. escrito en jeroglífico, en demótico y en griego. Jean-François Champollion comparó el óvalo de Ptolomeo con su nombre en griego y con el de una reina Cleopatra grabado en un obelisco de Filé, y dio con la clave. Según su familia, el 14 de septiembre de 1822 corrió a ver a su hermano, gritó «Je tiens l’affaire!» («¡Lo tengo!») y se desmayó.',
          pie: 'Rosetta · Champollion · 1822'
        },
        inicio: function () { var z = cartucho(); E.irA(z ? z.xu : 15.55, 1400); if (G) G.forzar({ xu: (z ? z.xu : 15.55) - 0.35, estado: 'sentado' }); AE.sonido.tocar('descubrir'); },
        sinBarcas: true,
        frente: function (ctx, t) {
          var z = cartucho(); if (!z) return;
          var s = E.u;
          // el óvalo que se ha dibujado se vuelve de oro sobre la piedra
          var ko = U.meseta(t, 200, 1000, 16800, 17900);
          ctx.save(); ctx.globalAlpha = ko; ctx.lineWidth = Math.max(2, s * 0.004); ctx.strokeStyle = ES.oro(ctx, z.x - z.w, z.y, z.x + z.w, z.y, 0.4);
          ctx.beginPath(); ctx.ellipse(z.x, z.y, z.w * 0.62, z.h * 0.85, 0, 0, TAU); ctx.stroke(); ctx.restore();
          FX.halo(z.x, z.y, z.w * 0.8, [255, 220, 140], 0.4 * ko);
          // la viñeta: el cartucho en grande, cada signo con su sonido
          var kp = U.meseta(t, 1400, 2400, 16600, 17800); if (kp <= 0) return;
          var pw = Math.min(E.W * 0.56, s * 1.0), ph = s * 0.3, px = E.W * 0.5 - pw / 2, py = E.sy(0.08);
          X.panel(ctx, px, py, pw, ph, kp, function (x0, y0, w, h) {
            ctx.fillStyle = ES.lin(ctx, 0, y0, 0, y0 + h, [[0, [70, 66, 74]], [1, [40, 37, 44]]]); ctx.fillRect(x0, y0, w, h);
            var tam = h * 0.3, cx = x0 + w / 2, cy = y0 + h * 0.36;
            var caja = X.cartucho(ctx, '𓊪𓏏𓍯𓃭𓐝𓇌𓋴', cx, cy, tam, 1, [240, 232, 214], 1);
            // los sonidos, uno tras otro, debajo de cada signo
            var sg = Array.from('𓊪𓏏𓍯𓃭𓐝𓇌𓋴'); ctx.font = Math.round(tam) + 'px ' + ES.JERO;
            var xx = caja.x + tam * 0.35;
            for (var i = 0; i < sg.length; i++) {
              var wi = ctx.measureText(sg[i]).width, ki = U.tramo(t, 3000 + i * 520, 3400 + i * 520);
              if (ki > 0) { FX.halo(xx + wi / 2, cy, tam * 0.7, [255, 220, 140], 0.5 * ki * (1 - U.tramo(t, 3500 + i * 520, 4400 + i * 520))); FX.texto(LETRAS[i].toUpperCase(), xx + wi / 2, cy + tam * 1.05, { serif: true, tam: tam * 0.55, alin: 'center', color: [255, 228, 160], a: ki * kp }); }
              xx += wi + tam * 0.08;
            }
            // y el nombre en griego, que se enciende al final
            var kg = U.tramo(t, 7000, 7800);
            FX.texto('ΠΤΟΛΕΜΑΙΟΣ', cx, y0 + h * 0.86, { serif: true, tam: h * 0.13, alin: 'center', color: [255, 228, 160], a: kg * kp, espaciado: 4 });
          });
          // Champollion pasa corriendo con sus papeles
          var ch = AE.arte.champollion, kc = U.tramo(t, 7600, 8200) * (1 - U.tramo(t, 15800, 16600));
          if (ch && kc > 0) {
            var cxp = U.lerp(-s * 0.2, E.W * 0.38, U.sale(U.tramo(t, 7600, 9600)));
            ctx.save(); ctx.globalAlpha = kc; ch.dibujar(ctx, cxp, E.sy(N.SUELO), s, { t: t, corre: t < 9600 }); ctx.restore();
          }
          if (t > 9000) FX.texto('«Je tiens l’affaire!»', E.W * 0.5, py + ph + s * 0.05, { serif: true, cursiva: true, tam: Math.max(20, s * 0.034), alin: 'center', a: U.tramo(t, 9000, 9800) * kp, color: P.tinta });
        },
        fin: function () { if (G) G.soltar(); }
      };
    }
  });
})();

/* Secreto 03 · El pozo de Siena (Lugar) — Siena (Asuán)
   Clic en el pozo: es mediodía, el sol cae a plomo y se ve en el fondo del agua. Dos viñetas, Siena y Alejandría a la
   misma hora, y el dibujo de Eratóstenes: 7,2° de diferencia = una cincuentava parte del círculo → la Tierra mide
   50 × 5.000 estadios. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, FX = AE.fx, X = AE.esc, N = AE.nilo, TAU = Math.PI * 2;
  var BOCA = { dx: 0, dy: -0.085, w: 0.11, h: 0.05 };
  function boca() { return N.zona('pozo', 'boca', BOCA); }

  // un sol pequeño para los dibujos
  function solito(ctx, x, y, r, a) { ctx.save(); ctx.globalAlpha = a; FX.halo(x, y, r * 3, [255, 214, 120], 0.6); ES.gema(ctx, x, y, r, P.cornalina); ctx.restore(); }

  AE.registrar({
    id: 'eratostenes', n: 3, nombre: 'El pozo de Siena', jero: '𓇶', tipo: 'Lugar',
    pista: 'El día más largo del año, a mediodía, el sol de Siena se mira en el fondo de un pozo. Asómate.',
    lugar: function () { var z = boca(); return z ? [z.x, z.y] : null; }, radioKa: 0.25,
    detectar: function (api) {
      api.en('clic', function (d) { if (N.dentro(boca(), d.x, d.y, 0.015)) api.disparar(); });
    },
    escena: function (E) {
      var L = E.lectura, G = AE.gatoCtl;
      return {
        duracion: 18500 + L,
        tarjeta: {
          en: 10400, hasta: 17600 + L,
          titulo: 'El pozo de Siena',
          texto: 'En Siena (hoy Asuán), a mediodía del solsticio de verano, el sol caía casi a plomo: un pozo quedaba iluminado hasta el fondo y las varas no daban sombra. En Alejandría, a la misma hora, la sombra marcaba 7,2°, la cincuentava parte de un círculo. Si entre las dos ciudades había 5.000 estadios, calculó Eratóstenes, la circunferencia de la Tierra medía unos 250.000: entre 39.000 y 46.000 km, según el estadio que usara. Mide unos 40.000.',
          pie: 'Siena · Eratóstenes · siglo III\u00a0a.\u00a0C.'
        },
        inicio: function () { var z = boca(); E.irA(z ? z.xu : 3.8, 1400); if (G) G.forzar({ xu: (z ? z.xu : 3.8) - 0.3, estado: 'sentado' }); AE.sonido.tocar('descubrir'); },
        cuadro: function (t) { X.hora(t, 0, 1200, null, 12); },
        sinBarcas: true,
        frente: function (ctx, t) {
          var z = boca(); if (!z) return;
          var s = E.u, sol = N.sol(12);
          // el sol cae a plomo en el pozo
          var kr = U.meseta(t, 1200, 2200, 17000, 18300);
          X.rayo(ctx, z.x, sol.y + sol.r, z.x, z.y, sol.r * 1.4, z.w * 0.6, [255, 222, 140], kr * 0.45);
          FX.halo(z.x, z.y, z.w * 0.9, [255, 230, 150], kr * (0.6 + 0.2 * Math.sin(t * 0.006)));
          // dos viñetas: Siena y Alejandría a la misma hora
          var kp = U.meseta(t, 2600, 3600, 17200, 18400), pw = Math.min(E.W * 0.26, s * 0.42), ph = s * 0.3, py = E.sy(0.12);
          var p1 = E.W * 0.5 - pw - s * 0.03, p2 = E.W * 0.5 + s * 0.03;
          var rot = ['SIENA', 'ALEJANDRÍA'], etq = Math.max(9, s * 0.0115);
          [p1, p2].forEach(function (px, i) {
            X.panel(ctx, px, py, pw, ph, kp, function (x0, y0, w, h) {
              var suelo = y0 + h * 0.82, gx = x0 + w * 0.5, alto = h * 0.5;
              ctx.fillStyle = ES.lin(ctx, 0, suelo, 0, y0 + h, [[0, P.arena], [1, P.arena2]]); ctx.fillRect(x0, suelo, w, h);
              // el sol: en Siena, justo encima; en Alejandría, un poco ladeado (7,2°)
              var ang = i ? 7.2 * Math.PI / 180 : 0, sx = gx - Math.sin(ang) * h * 0.95, sy = suelo - Math.cos(ang) * h * 0.95;
              solito(ctx, sx, Math.max(y0 + h * 0.12, sy), h * 0.06, 1);
              // los rayos paralelos
              ctx.strokeStyle = U.rgba([255, 200, 90], 0.6); ctx.lineWidth = 1.2;
              for (var r = -2; r <= 2; r++) { ctx.beginPath(); ctx.moveTo(gx + r * w * 0.12 - Math.sin(ang) * h, suelo - Math.cos(ang) * h); ctx.lineTo(gx + r * w * 0.12, suelo); ctx.stroke(); }
              // la vara (gnomon) y su sombra
              ctx.fillStyle = ES.relleno(ctx, P.oro3, gx - 2, suelo - alto, gx + 2, suelo, 0.2); ctx.fillRect(gx - 2, suelo - alto, 4, alto);
              if (i) {
                var ls = alto * Math.tan(ang) * U.tramo(t, 4200, 5600);
                ctx.fillStyle = 'rgba(70,40,14,0.45)'; ctx.fillRect(gx + 2, suelo - 1.5, ls, 3);
                ctx.strokeStyle = U.rgba(P.lapis, 0.9); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(gx, suelo - alto, alto * 0.3, Math.PI / 2, Math.PI / 2 - ang, true); ctx.stroke();
                FX.texto('7,2°', gx + alto * 0.12, suelo - alto * 0.55, { tam: Math.max(10, s * 0.014), color: P.lapis, a: U.tramo(t, 5200, 6000) * kp });
              } else {
                FX.texto(w > s * 0.3 ? 'SIN SOMBRA' : '0°', x0 + w * 0.95, suelo + (y0 + h - suelo) * 0.5, { tam: etq, alin: 'right', color: P.lapis, a: U.tramo(t, 4200, 5000) * kp, espaciado: 1 });
              }
              // el nombre, abajo, en la arena (arriba lo taparía el sol)
              FX.texto(rot[i], x0 + w * 0.05, suelo + (y0 + h - suelo) * 0.5, { tam: etq, color: P.tinta, a: 0.85 * kp, espaciado: 1 });
            });
          });
          // el dibujo de Eratóstenes: la Tierra, los rayos paralelos y el ángulo en el centro
          var kd = U.meseta(t, 6400, 7400, 17200, 18400); if (kd <= 0) return;
          var cx = E.W * (E.W < 700 ? 0.5 : 0.56), cy = E.sy(0.565), R = s * 0.105;
          var aS = -Math.PI / 2, aA = -Math.PI / 2 + 7.2 * Math.PI / 180 * 3.5;   // (Alejandría, al norte: a la derecha, como en todo el friso; el ángulo, exagerado para que se vea)
          var pS = [cx + Math.cos(aS) * R, cy + Math.sin(aS) * R], pA = [cx + Math.cos(aA) * R, cy + Math.sin(aA) * R];
          ctx.save(); ctx.globalAlpha = kd;
          // la Tierra
          ctx.fillStyle = ES.rad(ctx, cx, cy, 0, R, [[0, ES.aclarar(P.egipcio, 0.25)], [1, P.lapis2]], cx - R * 0.3, cy - R * 0.3); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
          // los rayos del sol, paralelos, que bajan a las dos ciudades
          ctx.strokeStyle = U.rgba([214, 140, 30], 0.85); ctx.lineWidth = 1.4;
          [pS, pA].forEach(function (q) { ctx.beginPath(); ctx.moveTo(q[0], q[1] - R * 0.75); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.beginPath(); ctx.moveTo(q[0] - 4, q[1] - 7); ctx.lineTo(q[0], q[1] - 1); ctx.lineTo(q[0] + 4, q[1] - 7); ctx.stroke(); });
          // los dos radios hasta el centro y el ángulo entre ellos
          ctx.strokeStyle = U.rgba(P.oro1, 0.95); ctx.lineWidth = 1.6;
          [pS, pA].forEach(function (q) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(q[0], q[1]); ctx.stroke(); });
          ctx.beginPath(); ctx.arc(cx, cy, R * 0.32, aS, aA); ctx.stroke();
          ctx.fillStyle = U.rgba(P.oro1, 1); ctx.beginPath(); ctx.arc(pS[0], pS[1], 3, 0, TAU); ctx.arc(pA[0], pA[1], 3, 0, TAU); ctx.fill();
          ctx.restore();
          FX.texto('7,2°', cx + R * 0.1, cy - R * 0.44, { tam: Math.max(10, s * 0.013), color: P.oro1, a: kd });
          FX.texto('SIENA', pS[0] - 18, pS[1] + 6, { tam: Math.max(9, s * 0.011), color: P.tinta, a: kd, espaciado: 1.5, alin: 'right' });
          FX.texto('ALEJANDRÍA', pA[0] + 12, pA[1] + 6, { tam: Math.max(9, s * 0.011), color: P.tinta, a: kd, espaciado: 1.5 });
          // la cuenta, en una cartela de papiro al lado del globo (en una pantalla estrecha, debajo)
          var kt = U.tramo(t, 8200, 9400) * kd; if (kt <= 0) return;
          var estrecha = E.W < 700, cw = estrecha ? E.W - s * 0.1 : s * 0.44, ch = s * (estrecha ? 0.11 : 0.07);
          var cxp = estrecha ? s * 0.05 : cx + R + s * 0.08, cyp = estrecha ? cy + R + s * 0.03 : cy + R * 0.2 - ch / 2;
          X.panel(ctx, cxp, cyp, cw, ch, kt, function (x0, y0, w, h) {
            if (estrecha) { FX.texto('5.000 ESTADIOS × 50', x0 + w / 2, y0 + h * 0.34, { tam: etq, alin: 'center', color: P.lapis, a: kt, espaciado: 1 }); FX.texto('= 250.000', x0 + w / 2, y0 + h * 0.7, { tam: etq, alin: 'center', color: P.lapis, a: kt, espaciado: 1 }); }
            else FX.texto('5.000 ESTADIOS × 50 = 250.000', x0 + w / 2, y0 + h / 2, { tam: Math.max(10, s * 0.0135), alin: 'center', color: P.lapis, a: kt, espaciado: 1.5 });
          });
        },
        fin: function () { X.soltarHora(); if (G) G.soltar(); }
      };
    }
  });
})();

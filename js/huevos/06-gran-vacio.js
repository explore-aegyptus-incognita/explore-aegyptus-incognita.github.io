/* Secreto 06 · El Gran Vacío (Lugar) — la Gran Pirámide de Keops
   Clic en los bloques a dos aguas de la entrada: la pirámide se cubre de un velo de muones (partículas que nacen
   cuando los rayos cósmicos chocan con la atmósfera y la atraviesan) y los chevrones brillan. En una viñeta, el corte
   norte–sur con sus proporciones reales: los pasillos y las cámaras de siempre y, brillando, lo descubierto por
   ScanPyramids: el Gran Vacío (2017) sobre la Gran Galería y el pasillo de la cara norte (2023) detrás de la entrada.
   (La pirámide del friso se ve de tres cuartos, con la entrada en medio de la cara; el corte, de perfil, la tiene en el
   borde. Por eso el corte va aparte y no encima.) */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, FX = AE.fx, X = AE.esc, N = AE.nilo, TAU = Math.PI * 2;
  var ENTRADA = { dx: -0.17, dy: -0.07, w: 0.045, h: 0.04 };
  function entrada() { var z = N.zona('keops', 'entrada', ENTRADA); if (z) { z.w = Math.max(z.w, AE.motor.u * 0.045); z.h = Math.max(z.h, AE.motor.u * 0.04); } return z; }
  var ALTO = 0.56, BASE = 0.88;   // u: el vértice ideal (146,6 m) y la base (230 m) de la pieza del friso

  AE.registrar({
    id: 'gran-vacio', n: 6, nombre: 'El Gran Vacío', jero: '𓍹𓐍𓅱𓆑𓅱𓍺', tipo: 'Lugar',
    pista: 'Sobre la entrada de la Gran Pirámide, unas piedras a dos aguas guardan algo que nadie vio en 4.500 años. Tócalas.',
    lugar: function () { var z = entrada(); return z ? [z.x, z.y] : null; }, radioKa: 0.24,
    detectar: function (api) {
      api.en('clic', function (d) { if (N.dentro(entrada(), d.x, d.y, 0.012)) api.disparar(); });
    },
    escena: function (E) {
      var L = E.lectura, G = AE.gatoCtl, muones = [];
      for (var i = 0; i < 70; i++) muones.push({ x: U._h(i * 3.3), v: 0.6 + U._h(i * 1.7) * 0.8, f: U._h(i * 9.1), ang: (U._h(i * 5.5) - 0.5) * 0.5 });
      // un muon que cae (en un rectángulo): una raya fina que se apaga al bajar
      function lluvia(ctx, x0, y0, w, h, t, a) {
        ctx.lineWidth = 1.2;
        for (var i = 0; i < muones.length; i++) {
          var mu = muones[i], f = ((t * 0.0006 * mu.v + mu.f) % 1), mx = x0 + mu.x * w, my = y0 - h * 0.1 + f * h * 1.2;
          ctx.strokeStyle = U.rgba([190, 226, 255], 0.8 * (1 - f) * a); ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + mu.ang * h * 0.08, my + h * 0.08); ctx.stroke();
        }
      }
      return {
        duracion: 17500 + L,
        tarjeta: {
          en: 9000, hasta: 16600 + L,
          titulo: 'El Gran Vacío',
          texto: 'En 2017, el proyecto ScanPyramids anunció en <i>Nature</i> el hallazgo de un enorme hueco de al menos 30\u00a0metros sobre la Gran Galería. Lo detectaron con muones, partículas que nacen cuando los rayos cósmicos chocan con la atmósfera y que atraviesan la piedra. En 2023 confirmaron que detrás de los bloques a dos aguas de la entrada hay un pasillo de unos 9\u00a0metros, y lo vieron por dentro con un endoscopio. Para qué se hicieron el hueco y el pasillo, nadie lo sabe aún.',
          pie: 'Guiza · Keops (Jufu) · ScanPyramids, 2017 y 2023',
          lado: 'derecha'   // (a la izquierda tapaba la pirámide, con los muones y los bloques de la entrada brillando)
        },
        inicio: function () {
          // la pirámide a la izquierda de la pantalla, para que quepa la viñeta del corte a la derecha
          var p = N.pieza('keops'), xu = p ? p.xu : 13.95; E.irA(xu + (E.W < 700 ? 0 : 0.2 * E.W / E.u), 1500);
          if (G) G.forzar({ xu: xu + 0.52, estado: 'sentado' }); AE.sonido.tocar('descubrir');
        },
        sinBarcas: true,
        frente: function (ctx, t) {
          var s = E.u, p = N.pieza('keops'), cx = E.sx(p ? p.xu : 13.95), base = E.sy(N.SUELO), H = ALTO * s, mitad = BASE * s / 2;
          var k = U.meseta(t, 1400, 2800, 16200, 17400); if (k <= 0) return;
          // en el friso: un velo de lapislázuli sobre la pirámide, con hiladas finas y la lluvia de muones
          var v = function (c) { c.moveTo(cx - mitad, base); c.lineTo(cx, base - H); c.lineTo(cx + mitad, base); c.closePath(); };
          ctx.save(); ctx.beginPath(); v(ctx); ctx.clip();
          ctx.globalAlpha = 0.38 * k; ctx.fillStyle = ES.lin(ctx, 0, base - H, 0, base, [[0, [40, 64, 140]], [1, [18, 30, 80]]]); ctx.fillRect(cx - mitad, base - H, mitad * 2, H);
          ctx.globalAlpha = 0.2 * k; ctx.strokeStyle = '#9fb6ff'; ctx.lineWidth = 1;
          for (var y = base; y > base - H; y -= H / 24) { ctx.beginPath(); ctx.moveTo(cx - mitad, y); ctx.lineTo(cx + mitad, y); ctx.stroke(); }
          ctx.globalAlpha = 1; lluvia(ctx, cx - mitad, base - H, mitad * 2, H, t, k);
          ctx.restore();
          // los chevrones de la entrada, donde se hizo clic, brillan
          var z = entrada(), late = 0.7 + 0.3 * Math.sin(t * 0.006);
          if (z) { FX.halo(z.x, z.y, z.w * 1.4, [140, 230, 255], 0.7 * k * late); X.polvo(ctx, z.x, z.y, z.w, 8, k, t, 6); }
        },
        // la viñeta, sin el tinte del atardecer: el corte norte–sur, con sus proporciones (el norte, con la entrada, a la
        // izquierda). En escritorio acaba en 0,40 u: la tarjeta va debajo, a la derecha, y su halo no la tiene que cubrir
        luz: function (ctx, t) {
          var s = E.u, late = 0.7 + 0.3 * Math.sin(t * 0.006);
          var kp = U.meseta(t, 2400, 3400, 16200, 17400); if (kp <= 0) return;
          var estrecha = E.W < 700, ph = estrecha ? s * 0.42 : s * 0.35, pw = estrecha ? E.W - s * 0.08 : Math.min(E.W * 0.5, ph * 1.3);
          var px = estrecha ? s * 0.04 : E.W - pw - s * 0.05, py = estrecha ? E.sy(0.08) : E.sy(0.05), etq = Math.max(9, s * 0.0115);
          X.panel(ctx, px, py, pw, ph, kp, function (x0, y0, w, h) {
            ctx.fillStyle = ES.lin(ctx, 0, y0, 0, y0 + h, [[0, [24, 40, 96]], [1, [12, 20, 56]]]); ctx.fillRect(x0, y0, w, h);
            // la escala: que quepan la base (230 m) a lo ancho y, a lo alto, de la punta (146,6 m) a la cámara subterránea (−31 m)
            var m = Math.min(w * 0.88 / 230, h * 0.8 / 178), sx = x0 + w * 0.5, sb = y0 + h * 0.1 + 146.6 * m, Hs = 146.6 * m, mit = 115 * m;
            function pt(xm, ym) { return [sx - xm * m, sb - ym * m]; }
            // la roca bajo el suelo y la silueta de la pirámide, con hiladas y la lluvia
            ctx.fillStyle = 'rgba(80,110,190,0.18)'; ctx.fillRect(x0, sb, w, h - (sb - y0));
            ctx.beginPath(); ctx.moveTo(sx - mit, sb); ctx.lineTo(sx, sb - Hs); ctx.lineTo(sx + mit, sb); ctx.closePath();
            ctx.fillStyle = 'rgba(120,150,230,0.16)'; ctx.fill(); ctx.strokeStyle = 'rgba(190,210,255,0.55)'; ctx.lineWidth = 1.2; ctx.stroke();
            lluvia(ctx, x0, y0, w, h, t, 0.8);
            // los pasillos y las cámaras conocidas, en oro, uno tras otro (medidas aproximadas, en metros)
            var ko = U.tramo(t, 3000, 6600); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            function linea(a, b, fr, ancho, col) { if (fr <= 0) return; var p0 = pt(a[0], a[1]), p1 = pt(b[0], b[1]); ctx.strokeStyle = col || U.rgba(P.oro2, 0.95); ctx.lineWidth = Math.max(1.4, (ancho || 1.2) * m); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p0[0] + (p1[0] - p0[0]) * fr, p0[1] + (p1[1] - p0[1]) * fr); ctx.stroke(); }
            function caja(c, cw, chh, fr, col) { if (fr <= 0) return; var p0 = pt(c[0] + cw / 2, c[1] + chh); ctx.globalAlpha = kp * fr; ctx.fillStyle = col || U.rgba(P.oro2, 0.95); ctx.fillRect(p0[0], p0[1], Math.max(2, cw * m), Math.max(2, chh * m)); ctx.globalAlpha = kp; }
            linea([101.7, 17], [7.7, -29.8], U.tramo(ko, 0, 0.25), 1.1);           // el pasillo descendente, a 26°, hasta bajo la roca
            linea([7.7, -29.8], [3, -29.8], U.tramo(ko, 0.22, 0.27), 1.1);
            caja([-4, -31], 14, 3.5, U.tramo(ko, 0.25, 0.32));                      // la cámara subterránea
            linea([76.6, 4.5], [41.5, 21.6], U.tramo(ko, 0.3, 0.45), 1.1);         // el pasillo ascendente
            linea([41.5, 21.6], [2.9, 21.6], U.tramo(ko, 0.45, 0.55), 1.1);        // hacia la cámara de la reina
            caja([0, 21.2], 5.2, 6.2, U.tramo(ko, 0.53, 0.62));                     // la cámara de la reina
            linea([41.5, 24.5], [-0.4, 45.2], U.tramo(ko, 0.5, 0.72), 6.5);        // la Gran Galería (8,6 m de alto)
            linea([-0.4, 43], [-8.8, 43], U.tramo(ko, 0.7, 0.76), 1.2);            // la antecámara
            caja([-11.4, 42.3], 5.2, 5.8, U.tramo(ko, 0.74, 0.82));                  // la cámara del rey
            caja([-11.4, 48.5], 5.2, 15.5, U.tramo(ko, 0.8, 0.9), U.rgba(P.oro2, 0.5)); // las cámaras de descarga, encima
            // lo nuevo, brillando: el Gran Vacío, sobre la Gran Galería (al menos 30 m), y el pasillo de la cara norte (unos
            // 9 m), detrás de los chevrones de la entrada
            var kn = U.tramo(t, 6800, 8000);
            if (kn > 0) {
              var a0 = pt(31, 45), a1 = pt(4, 58);
              ctx.globalAlpha = kp * kn;
              FX.halo((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2, 22 * m, [140, 230, 255], 0.6 * late);
              ctx.strokeStyle = U.rgba([214, 248, 255], 0.95); ctx.lineWidth = Math.max(3, 6 * m); ctx.setLineDash([m * 3, m * 1.6]);
              ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke(); ctx.setLineDash([]);
              var c0 = pt(97.5, 22.5), c1 = pt(88.5, 22.5);
              FX.halo((c0[0] + c1[0]) / 2, c0[1], 8 * m, [140, 230, 255], 0.65 * late);
              ctx.strokeStyle = U.rgba([214, 248, 255], 0.95); ctx.lineWidth = Math.max(2.5, 2.2 * m); ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(c1[0], c1[1]); ctx.stroke();
              ctx.globalAlpha = 1;
              // los rótulos, fuera de la silueta, con su línea: el del vacío al sur (derecha) y el del pasillo al norte (izquierda)
              var ka = kp * kn, kb = kp * U.tramo(t, 7400, 8200), ry = a1[1] - h * 0.12, rx = x0 + w * 0.97;
              ctx.strokeStyle = U.rgba([214, 246, 255], 0.7 * ka); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2); ctx.lineTo(rx - w * 0.2, ry + etq * 0.6); ctx.lineTo(rx, ry + etq * 0.6); ctx.stroke();
              FX.texto('GRAN VACÍO · 2017', rx, ry, { tam: etq, color: [214, 246, 255], a: ka, espaciado: 1.5, alin: 'right' });
              var lx = x0 + w * 0.03, lyy = c0[1] - h * 0.16;
              ctx.strokeStyle = U.rgba([214, 246, 255], 0.7 * kb); ctx.beginPath(); ctx.moveTo((c0[0] + c1[0]) / 2, c0[1]); ctx.lineTo(lx + w * 0.16, lyy + etq * 0.6); ctx.lineTo(lx, lyy + etq * 0.6); ctx.stroke();
              FX.texto('PASILLO NORTE · 2023', lx, lyy, { tam: etq, color: [214, 246, 255], a: kb, espaciado: 1.5, alin: 'left' });
            }
            FX.texto('CORTE NORTE-SUR', x0 + w * 0.03, y0 + h * 0.07, { tam: etq, color: [214, 228, 255], a: 0.85 * kp, espaciado: 1.5 });
            FX.texto('N', x0 + w * 0.03, sb - h * 0.03, { tam: etq, color: [214, 228, 255], a: 0.7 * kp, espaciado: 1.5 });
            FX.texto('S', x0 + w * 0.97, sb - h * 0.04, { tam: etq, color: [214, 228, 255], a: 0.7 * kp, espaciado: 1.5, alin: 'right' });
          });
        },
        fin: function () { if (G) G.soltar(); }
      };
    }
  });
})();

/* Secreto 08 · Miu (Teclado) — en cualquier sitio
   Escribir «miu» (o «miau», como se dice en castellano, o «mau», o la transliteración, «mjw»): el gato se vuelve, contesta y se sienta como Bastet, y encima se
   escribe la palabra egipcia, mjw, signo a signo, con el gato sentado de determinativo. Por la cenefa de arriba pasa
   una fila de gatos. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, FX = AE.fx, X = AE.esc, N = AE.nilo, TAU = Math.PI * 2;
  var PALABRA = '𓏇𓇋𓅱𓃠';   // mjw: W19, la jarra de leche en su red (mj); M17, el junco (j, complemento fonético); G43, el pollito de codorniz (w), y E13, el gato sentado (determinativo)
  var buffer = '';
  AE.registrar({
    id: 'miu', n: 8, nombre: 'Miu', jero: PALABRA, tipo: 'Teclado', tipoTactil: 'Toque',   // (en el móvil no hay teclado: se llama tocándolo)
    pista: '¿Cómo llamaban los egipcios al gato? Llámalo tú.',
    detectar: function (api) {
      api.en('tecla', function (d) {
        if (!d.key || d.key.length !== 1) return;
        buffer = (buffer + d.key.toLowerCase()).slice(-6);
        if (/(mi+a*u|mi+w|mjw|ma+u)$/.test(buffer)) { buffer = ''; api.disparar(); }
      });
      // tocar al gato: contesta; y en una pantalla táctil, donde no hay teclado, llamarlo es tocarlo tres veces seguidas.
      // Cada toque se ve (sin sonido no pasaba nada): levanta las orejas y te mira, y sale un pulso de oro con tantas
      // estrellitas como toques llevas
      var toques = [], respuestas = [];
      api.en('clic', function (d) {
        var G = AE.gatoCtl, Em = api.motor; if (!G || G.oculto || !G.cerca(d.x, d.y)) return;
        G.responder(); AE.sonido.tocar('miau');
        if (Em.puntero.tipo === 'mouse') { respuestas.push({ t: Em.t, n: 1 }); return; }
        toques = toques.filter(function (q) { return Em.t - q < 1800; }); toques.push(Em.t);
        respuestas.push({ t: Em.t, n: Math.min(3, toques.length) });
        if (toques.length >= 3) { toques = []; api.disparar(); }
      });
      api.brillo(function (ctx, t) {
        var G = AE.gatoCtl, Em = api.motor; respuestas = respuestas.filter(function (r) { return t - r.t < 1000; });
        if (!G || !respuestas.length) return;
        var s = Em.u, gx = G.x() + G.dir * s * 0.02, gy = G.y() - s * 0.13 * 0.8;
        respuestas.forEach(function (r) {
          var k = (t - r.t) / 1000, a = 1 - k * k;
          FX.halo(gx, gy, s * (0.05 + 0.07 * U.sale(k)), [255, 214, 120], 0.55 * a, ctx);
          for (var i = 0; i < r.n; i++) {
            var an = -Math.PI / 2 + (i - (r.n - 1) / 2) * 0.6, rr = s * (0.065 + 0.03 * U.sale(k));
            ctx.save(); ctx.globalAlpha = a; ES.estrella(ctx, gx + Math.cos(an) * rr, gy + Math.sin(an) * rr - k * s * 0.015, s * 0.014, 0); ctx.fillStyle = 'rgb(255,214,110)'; ctx.fill(); ctx.restore();
          }
        });
      });
    },
    escena: function (E) {
      var L = E.lectura, G = AE.gatoCtl, xu0 = G ? G.xu : E.centroXu();
      return {
        duracion: 15500 + L,
        tarjeta: {
          en: 7800, hasta: 14700 + L,
          titulo: 'Miu',
          texto: 'Los egipcios llamaban al gato <i>mjw</i>, que por convención se lee «miu»: casi seguro imita su maullido. Se escribía con el gato sentado al final. Los gatos eran animales de Bastet, la diosa de Bubastis, en el delta, y se momificaron por cientos de miles. En 1890 se subastaron en Liverpool, como abono, unas 180.000 momias (19,5\u00a0toneladas) de Beni Hasan, ofrendas a otra diosa felina, Pajet.',
          pie: '𓏇𓇋𓅱𓃠 · mjw · el gato'
        },
        inicio: function () {
          // el gato se queda donde está (si no se ve, entra en la pantalla) y se sienta mirando hacia arriba; a la derecha
          // de la tarjeta (abajo a la izquierda, hasta 640 px más su resplandor), que es el protagonista y se tiene que ver
          var libre = Math.min(E.W * 0.85, Math.max(E.W * 0.68, E.W * 0.06 + 780));
          var xu = U.clamp(xu0, E.xuDe(libre), E.xuDe(Math.max(libre, E.W * 0.85)));
          if (G) G.forzar({ xu: xu, estado: 'sentado' });
          AE.sonido.tocar('miau');
        },
        frente: function (ctx, t) {
          var s = E.u, gx = G ? G.x() : E.W / 2, gy = G ? G.y() : E.sy(N.SUELO);
          // el halo dorado de Bastet detrás del gato
          var kh = U.meseta(t, 600, 1800, 13800, 15200);
          FX.halo(gx, gy - s * 0.07, s * 0.16, [255, 214, 120], 0.45 * kh);
          X.polvo(ctx, gx, gy - s * 0.08, s * 0.12, 14, kh, t, 13);
          // la fila de gatos negros que pasa por arriba, de izquierda a derecha, sobre su línea de registro (por debajo
          // del título y por encima del recuadro)
          var kf = U.tramo(t, 3000, 3600) * (1 - U.tramo(t, 13600, 14600)), g = AE.gato; if (kf <= 0 || !g) return;
          var h = s * 0.05, y = E.sy(0.158) - h;
          ctx.save(); ctx.globalAlpha = kf * 0.55; ctx.strokeStyle = U.rgba(P.oro2, 1); ctx.lineWidth = Math.max(1, s * 0.0016);
          ctx.beginPath(); ctx.moveTo(0, y + h + s * 0.003); ctx.lineTo(E.W * U.sale(U.tramo(t, 3000, 6200)), y + h + s * 0.003); ctx.stroke(); ctx.restore();
          var dist = Math.max(0, t - 3000) * 0.00016 * s, zan = g.zancada ? g.zancada(h, 0.2) : h * 0.9;
          for (var i = 0; i < 9; i++) {
            var x = -s * 0.1 + dist - i * s * 0.09; if (x < -h * 2 || x > E.W + h * 2) continue;
            var fase = (dist / zan + i * 0.37) % 1;
            ctx.save(); ctx.globalAlpha = kf; try { g.dibujar(ctx, x, y + h, h, g.andar(fase, 0.2), { mirada: 0, orejas: 0.6 }); } catch (err) { } ctx.restore();
          }
        },
        // la palabra, signo a signo, en un recuadro de papiro sobre el gato, con la transliteración debajo (sin tinte: el
        // gato contesta en cualquier sitio, también de noche)
        luz: function (ctx, t) {
          var s = E.u, gx = G ? G.x() : E.W / 2;
          var kp = U.meseta(t, 1600, 2400, 13600, 15000); if (kp <= 0) return;
          var bw = s * 0.36, bh = s * 0.16, bx = U.clamp(gx - bw / 2, s * 0.05, E.W - bw - s * 0.05), by = E.sy(0.2);
          X.panel(ctx, bx, by, bw, bh, kp, function (x0, y0, w, h) {
            X.fila(ctx, PALABRA, x0 + w / 2, y0 + h * 0.42, h * 0.46, U.tramo(t, 2400, 5200), P.tinta, 1, 'center');
            var sonidos = ['mj', '(j)', 'w', '(gato)'];   // (W19 mj, M17 j —repite la j, no suena—, G43 w y el determinativo)
            FX.texto(sonidos.slice(0, Math.ceil(U.tramo(t, 2400, 5200) * 4)).join(' · '), x0 + w / 2, y0 + h * 0.84, { tam: Math.max(10, s * 0.013), alin: 'center', a: kp, espaciado: 2, color: P.lapis });
          });
        },
        sinBarcas: true,   // (el gato es el protagonista: que ninguna vela pase por delante)
        fin: function () { if (G) G.soltar(); }
      };
    }
  });
})();

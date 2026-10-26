/* Final · Aegyptus cognita — al encontrar los diez secretos (y se puede volver a ver desde el papiro).
   La barca solar de Ra recorre el Nilo de izquierda a derecha, con el gato a bordo (en los mitos, Ra tomaba la forma del
   Gran Gato para vencer a la serpiente Apofis). A su paso, los signos de los diez secretos se encienden uno a uno en una
   banda de oro, y el título pierde el «in» de incognita: Aegyptus cognita. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, FX = AE.fx, X = AE.esc, N = AE.nilo, TAU = Math.PI * 2;

  function duracion(ms) {
    if (!isFinite(ms) || ms <= 0) return 'un momento';
    var min = Math.round(ms / 60000);
    if (min < 1) return 'menos de un minuto';
    if (min < 60) return min + (min === 1 ? ' minuto' : ' minutos');
    var h = Math.floor(min / 60), m = min % 60;
    if (h < 48) return h + (h === 1 ? ' hora' : ' horas') + (m ? ' y ' + m + (m === 1 ? ' minuto' : ' minutos') : '');
    var d = Math.floor(h / 24), r = h % 24; return d + ' días' + (r ? ' y ' + r + (r === 1 ? ' hora' : ' horas') : '');
  }

  AE.registrarFinal({
    escena: function (E, datos) {
      var huevos = datos.huevos || [], raiz = document.documentElement, G = AE.gatoCtl;
      return {
        duracion: 18500,
        tarjeta: {
          en: 8600, hasta: 17400, jero: '𓋹𓍑𓋴',
          etiqueta: 'Los ' + AE.interfaz.palabra(huevos.length) + ' secretos', titulo: 'Aegyptus cognita',
          texto: 'Ya no queda nada oculto en este friso. Lo has recorrido entero en ' + duracion(datos.hasta - datos.desde) + ', del primer secreto al último.',
          pie: '𓋹𓍑𓋴 · vida, prosperidad y salud'
        },
        inicio: function () { raiz.classList.add('final-activo'); if (G) G.ocultar(true); AE.sonido.tocar('final'); },
        cuadro: function (t) {
          X.hora(t, 0, 2000, null, 6.6); if (t > 6000) raiz.classList.add('completo');
          // el gato, que ha hecho el viaje en la barca, vuelve a su sitio fundiéndose (antes aparecía de golpe al acabar)
          if (G && t > 16800) { if (G.oculto) G.ocultar(false); G.alfa = U.tramo(t, 16800, 18400); }
        },
        frente: function (ctx, t) {
          var s = E.u, a = U.meseta(t, 0, 900, 17000, 18400);
          ctx.fillStyle = U.rgba([249, 234, 202], 0.55 * a); ctx.fillRect(0, 0, E.W, E.sy(N.SUELO));
          // la banda de oro con los signos de los diez secretos, en sus recuadros
          var n = Math.max(1, huevos.length), ancho = Math.min(E.W * 0.86, s * 1.5), x0 = E.W / 2 - ancho / 2, paso = ancho / n, by = E.sy(0.2), bh = s * 0.17;
          ctx.save(); ctx.globalAlpha = a;
          ctx.fillStyle = ES.oro(ctx, x0, by - bh / 2, x0, by + bh / 2, 0.35); ctx.fillRect(x0 - s * 0.012, by - bh / 2 - s * 0.012, ancho + s * 0.024, bh + s * 0.024);
          ctx.fillStyle = ES.lin(ctx, 0, by - bh / 2, 0, by + bh / 2, [[0, P.lapis], [1, P.lapis2]]); ctx.fillRect(x0, by - bh / 2, ancho, bh);
          ctx.restore();
          huevos.forEach(function (h, i) {
            var cx = x0 + paso * (i + 0.5), ki = U.tramo(t, 1800 + i * 520, 2300 + i * 520) * a;
            if (i) { ctx.fillStyle = U.rgba(P.oro2, 0.7 * a); ctx.fillRect(x0 + paso * i - 0.75, by - bh / 2, 1.5, bh); }
            if (ki <= 0) return;
            FX.halo(cx, by, paso * 0.6, [255, 220, 140], 0.6 * ki * (1 - U.tramo(t, 2300 + i * 520, 3600 + i * 520)));
            var sg = Array.from(h.jero || '𓋹'), cart = sg.length > 2 && sg[0] === '𓍹' && sg[sg.length - 1] === '𓍺';
            if (cart) sg = sg.slice(1, -1);
            var tam = Math.min(bh * 0.8 / Math.max(1, sg.length * 1.08), paso * 0.62), alto = sg.length * tam * 1.08;
            X.columna(ctx, sg.join(''), cx, by - alto / 2, tam, 1, [255, 226, 150], ki);
            if (cart) { ctx.save(); ctx.globalAlpha = ki; ctx.strokeStyle = U.rgba([255, 226, 150], 0.9); ctx.lineWidth = 1.4; ctx.beginPath(); ES.redondo(ctx, cx - tam * 0.62, by - alto / 2 - tam * 0.18, tam * 1.24, alto + tam * 0.3, tam * 0.62); ctx.stroke(); ctx.fillStyle = U.rgba([255, 226, 150], 0.9); ctx.fillRect(cx - tam * 0.45, by + alto / 2 + tam * 0.16, tam * 0.9, 2); ctx.restore(); }
          });
          // la barca solar recorre el Nilo, con el sol y el gato a bordo
          var barca = AE.arte.barcaSolar, kb = U.tramo(t, 600, 15800), bx = U.lerp(-s * 0.5, E.W + s * 0.5, kb), byb = E.sy(N.FLOT + 0.012) + Math.sin(t * 0.0012) * s * 0.004;
          if (barca) { ctx.save(); barca.dibujar(ctx, bx, byb, s, { t: t }); ctx.restore(); }
          else { ctx.fillStyle = ES.oro(ctx, bx - s * 0.3, byb - s * 0.05, bx + s * 0.3, byb, 0.4); ctx.beginPath(); ctx.moveTo(bx - s * 0.3, byb - s * 0.06); ctx.quadraticCurveTo(bx, byb + s * 0.04, bx + s * 0.3, byb - s * 0.06); ctx.lineTo(bx + s * 0.25, byb - s * 0.02); ctx.lineTo(bx - s * 0.25, byb - s * 0.02); ctx.closePath(); ctx.fill(); }
          var g = AE.gato; if (g) { ctx.save(); try { g.dibujar(ctx, bx - s * 0.17, byb - s * 0.045, s * 0.09, g.sentado(t), { mirada: 0.2, orejas: 1 }); } catch (err) { } ctx.restore(); }
          // el disco solar que la barca lleva brilla más al pasar por el centro
          FX.halo(bx, byb - s * 0.2, s * 0.12, [255, 214, 120], 0.35 * (1 - Math.abs(kb - 0.5) * 2));
        },
        sinBarcas: true,   // (la única barca, la del sol)
        fin: function () { raiz.classList.remove('final-activo'); X.soltarHora(); if (G) { G.ocultar(false); G.alfa = 1; } }
      };
    }
  });
})();

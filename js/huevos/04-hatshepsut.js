/* Secreto 04 · La faraona borrada (Mirada) — Deir el-Bahari
   En el muro del templo hay una procesión pintada con una figura picada a cincel. Si se mira el hueco (el puntero encima
   1,5 s), la figura vuelve: Hatshepsut, que reinó como faraón y cuya imagen se borró décadas después de su muerte. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, FX = AE.fx, X = AE.esc, N = AE.nilo, TAU = Math.PI * 2;
  var HUECO = { dx: 0, dy: -0.04, w: 0.03, h: 0.07 };
  // el hueco de la procesión, en la pantalla (la procesión está colocada en el muro del templo)
  function hueco() {
    var pr = N.pieza('procesion'), d = AE.arte.procesion, h = (d && d.hueco) || HUECO; if (!pr) return null;
    var Em = AE.motor;
    return { x: Em.sx(pr.xu + (h.dx || 0)), y: Em.sy(N.SUELO + (pr.dy || 0) + (h.dy || 0)), w: Math.max((h.w || 0.03) * Em.u, Em.u * 0.035), h: Math.max((h.h || 0.07) * Em.u, Em.u * 0.05), xu: pr.xu + (h.dx || 0) };
  }
  var armado = true, mirando = 0, ultimo = 0;
  AE.registrar({
    id: 'hatshepsut', n: 4, nombre: 'La faraona borrada', jero: '𓍹𓇳𓁦𓂓𓍺', tipo: 'Mirada',
    pista: 'En un templo de terrazas, a una procesión pintada le falta un rey: alguien lo borró a cincel. Míralo bien.',
    lugar: function () { var z = hueco(); return z ? [z.x, z.y] : null; }, radioKa: 0.22,
    detectar: function (api) {
      var Em = api.motor;
      api.en('cuadro', function (d) {
        var p = Em.puntero, z = hueco();
        var encima = p.sobre && z && N.dentro(z, p.x, p.y, 0.008);
        // (se rearma solo cuando el puntero sale de la figura: al acabar la escena sigue encima, y la escena se repetía en bucle)
        if (!encima) armado = true;
        mirando = encima && armado ? mirando + d.dt : Math.max(0, mirando - d.dt * 2);
        if (mirando > 1500 && Em.t - ultimo > 2000) { mirando = 0; ultimo = Em.t; armado = false; api.disparar(); }
      });
      api.en('escena', function () { mirando = 0; });   // (al empezar y al acabar cualquier escena, la cuenta vuelve a cero)
      // mientras se mira, la silueta empieza a dorarse
      api.capa(function (ctx) {
        if (mirando < 150) return; var z = hueco(); if (!z) return;
        var k = U.clamp(mirando / 1500, 0, 1);
        FX.halo(z.x, z.y, z.h * 0.8, [255, 214, 120], 0.15 + 0.4 * k);
        X.polvo(ctx, z.x, z.y, z.h * 0.6, 8, k * 0.8, Em.t, 7);
      });
    },
    escena: function (E) {
      var L = E.lectura, G = AE.gatoCtl;
      return {
        duracion: 15000 + L,
        tarjeta: {
          en: 7000, hasta: 14200 + L,
          titulo: 'La faraona borrada',
          texto: 'Hatshepsut gobernó Egipto hacia 1479–1458\u00a0a.\u00a0C., primero como regente y después como rey, y se hizo representar con la barba postiza y los atributos de un faraón. Este es su templo funerario: Dyeser-Dyeseru, «el Sagrado de los sagrados». Al menos veinte años después de su muerte, a finales del reinado de Tutmosis III, sus imágenes y su nombre se borraron a cincel en muchos monumentos. No del todo: su silueta aún se adivina.',
          pie: 'Deir el-Bahari · Hatshepsut (Maatkara) · siglo XV\u00a0a.\u00a0C.'
        },
        inicio: function () { var z = hueco(); E.irA(z ? z.xu : 7.95, 1400); if (G) G.forzar({ xu: (z ? z.xu : 7.95) - 0.5, estado: 'sentado' }); AE.sonido.tocar('descubrir'); },
        sinBarcas: true,
        frente: function (ctx, t) {
          var z = hueco(); if (!z) return;
          var s = E.u, pr = N.pieza('procesion'), d = AE.arte.procesion;
          // en el muro: la figura vuelve poco a poco, con polvo de oro; y al acabar la escena se vuelve a borrar despacio
          // (la escena dura lo que se tarda en leer la tarjeta: antes seguía entera hasta el final y desaparecía de golpe)
          var rev = U.inOut(U.tramo(t, 2200, 6200)) * X.salida(t, 2200);
          if (d && pr) { ctx.save(); d.dibujar(ctx, E.sx(pr.xu), E.sy(N.SUELO + (pr.dy || 0)), s, { revelar: rev }); ctx.restore(); }
          X.polvo(ctx, z.x, z.y, z.h * 0.7, 16, U.meseta(t, 1800, 2800, 7000, 9000), t, 11);
        },
        // y en grande, en una viñeta (sin tinte): la procesión con Hatshepsut en el centro, y su nombre de trono en un cartucho
        luz: function (ctx, t) {
          var s = E.u, d = AE.arte.procesion, rev = U.inOut(U.tramo(t, 2200, 6200));
          var kp = U.meseta(t, 3200, 4200, 13800, 14900); if (kp <= 0 || !d) return;
          var pw = Math.min(E.W * 0.44, s * 0.8), ph = s * 0.32, px = E.W - pw - s * 0.06, py = E.sy(0.1);
          X.panel(ctx, px, py, pw, ph, kp, function (x0, y0, w, h) {
            ctx.fillStyle = ES.lin(ctx, 0, y0, 0, y0 + h, [[0, ES.aclarar(P.piedra, 0.1)], [1, P.piedra2]]); ctx.fillRect(x0, y0, w, h);
            var esc = Math.min(w / (d.ancho || 0.22), h * 0.8 / (d.alto || 0.08)) * 0.92;
            ctx.save(); d.dibujar(ctx, x0 + w / 2, y0 + h * 0.86, esc, { revelar: rev }); ctx.restore();
          });
          var kc = U.tramo(t, 6200, 7200) * kp;
          if (kc > 0) X.cartucho(ctx, '𓇳𓁦𓂓', px + pw / 2, py + ph + s * 0.06, s * 0.04, kc, P.tinta, U.tramo(t, 6200, 7600));
        },
        fin: function () { if (G) G.soltar(); }
      };
    }
  });
})();

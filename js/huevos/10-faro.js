/* Secreto 10 · La séptima maravilla (Distancia) — el final del friso, de noche
   Al seguir empujando más allá de la costa, el faro de Alejandría se levanta de sus ruinas, piedra a piedra, y se
   enciende el fuego de arriba; su luz barre el mar. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, FX = AE.fx, X = AE.esc, N = AE.nilo, TAU = Math.PI * 2;
  var EMPUJE = 1800;
  AE.registrar({
    id: 'faro', n: 10, nombre: 'La séptima maravilla', jero: '𓇼', tipo: 'Distancia',
    pista: 'Al final del río, una isla guardaba una de las siete maravillas. Sigue más allá de la costa.',
    detectar: function (api) {
      api.en('empujar', function (d) { if (d.total > EMPUJE) { api.motor.empuje = 0; api.disparar(); } });
    },
    escena: function (E) {
      var L = E.lectura, G = AE.gatoCtl, p = N.pieza('faro'), d = AE.arte.faro;
      return {
        duracion: 17000 + L,
        tarjeta: {
          en: 9000, hasta: 16200 + L,
          titulo: 'La séptima maravilla',
          texto: 'En la isla de Faro, frente a Alejandría, se terminó hacia el 280\u00a0a.\u00a0C. una torre de más de 100\u00a0metros con un fuego en lo alto. Llegó la última a la lista de las siete maravillas y dio nombre a los faros. Los terremotos la fueron arruinando, sobre todo el de 1303; en 1349, el viajero Ibn Battuta ya no pudo entrar. Entre 1477 y 1479, el sultán Qaitbay levantó un fuerte sobre sus ruinas. En 1994 se cartografiaron bajo el agua cientos de bloques, algunos de la torre.',
          pie: 'Alejandría · Faro (Pháros) · hacia 280\u00a0a.\u00a0C.'
        },
        inicio: function () { E.irA(E.largo, 1600); if (G) G.forzar({ xu: (p ? p.xu : 17.2) - 0.55, estado: 'sentado' }); AE.sonido.tocar('faro'); },
        cuadro: function (t) {
          X.hora(t, 0, 1200, null, 22);
          // mientras crece, el faro tapa las estrellas que tiene detrás; y la luna se aparta mientras arde el fuego. El faro
          // sigue encendido mientras se lee la tarjeta y, al acabar la escena, se funde y vuelven las ruinas (antes se
          // apagaba a los 17 s y la torre seguía en pie hasta el final, y desaparecía de golpe)
          var fin = X.salida(t, 2200);
          N.tapa = p && d && fin > 0.2 ? { xu: p.xu, ancho: d.ancho, alto: d.alto * U.inOut(U.tramo(t, 1400, 6400)) } : null;
          N.lunaVelo = U.tramo(t, 5600, 7000) * fin;
        },
        frente: function (ctx, t) {
          if (!p || !d) return;
          var s = E.u, cx = E.sx(p.xu), base = E.sy(N.SUELO), alto = d.alto * s, ancho = d.ancho * s;
          // el faro se levanta de abajo arriba sobre sus ruinas (se pinta entero y se recorta por la altura que lleva)
          var k = U.inOut(U.tramo(t, 1400, 6400)), corte = base - alto * k, fin = X.salida(t, 2200); if (fin <= 0.01) return;
          ctx.save(); ctx.globalAlpha = fin; ctx.beginPath(); ctx.rect(cx - ancho, corte, ancho * 2, base - corte + 2); ctx.clip();
          d.dibujar(ctx, cx, base, s, {});
          ctx.restore();
          // las piedras que suben a su sitio
          if (k > 0 && k < 1) for (var i = 0; i < 16; i++) {
            var f = (i / 16 + t * 0.0006) % 1, px = cx + (U._h(i * 4.1) - 0.5) * ancho * 0.8, py = U.lerp(base + s * 0.02, corte, f);
            ctx.fillStyle = U.rgba(U.mezcla(P.piedra, P.piedra2, U._h(i)), 0.9 * (1 - f)); ctx.fillRect(px - s * 0.005, py - s * 0.004, s * 0.01, s * 0.008);
          }
        },
        brillo: function (ctx, t) {
          if (!p || !d) return;
          var s = E.u, f = d.fuego || { dx: 0, dy: -d.alto + 0.04 }, fx = E.sx(p.xu + (f.dx || 0)), fy = E.sy(N.SUELO + (f.dy || 0));
          var kf = U.tramo(t, 6200, 7400) * X.salida(t, 2200); if (kf <= 0) return;
          // el fuego: un halo que late y unas llamas
          var late = 0.85 + 0.15 * Math.sin(t * 0.013) * Math.sin(t * 0.007);
          FX.halo(fx, fy, s * 0.22 * late, [255, 190, 90], 0.55 * kf, ctx);
          FX.halo(fx, fy, s * 0.06, [255, 240, 200], 0.9 * kf, ctx);
          for (var i = 0; i < 6; i++) {
            var a = U._h(i * 7), lh = s * (0.025 + 0.02 * Math.sin(t * 0.011 + i * 2)), lx = fx + (a - 0.5) * s * 0.02;
            ctx.fillStyle = U.rgba(i % 2 ? [255, 214, 120] : [255, 150, 60], 0.85 * kf);
            ctx.beginPath(); ctx.moveTo(lx - s * 0.006, fy); ctx.quadraticCurveTo(lx, fy - lh * 1.2, lx + s * 0.006, fy); ctx.fill();
          }
          // el haz que barre el mar
          var an = Math.sin(t * 0.0009) * 0.9, l = s * 1.4;
          ctx.save(); ctx.globalAlpha = 0.35 * kf;
          var g = ctx.createLinearGradient(fx, fy, fx - Math.cos(an) * l, fy + Math.sin(Math.abs(an)) * l * 0.1);
          g.addColorStop(0, 'rgba(255,230,170,0.9)'); g.addColorStop(1, 'rgba(255,230,170,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx, fy - s * 0.008); ctx.lineTo(fx - Math.cos(an) * l, fy - s * 0.09 + Math.sin(an) * s * 0.05); ctx.lineTo(fx - Math.cos(an) * l, fy + s * 0.09 + Math.sin(an) * s * 0.05); ctx.lineTo(fx, fy + s * 0.008); ctx.closePath(); ctx.fill();
          ctx.restore();
        },
        sinBarcas: true,
        fin: function () { X.soltarHora(); N.tapa = null; N.lunaVelo = 0; if (G) G.soltar(); }
      };
    }
  });
})();

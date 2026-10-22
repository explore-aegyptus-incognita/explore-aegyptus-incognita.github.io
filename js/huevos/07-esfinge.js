/* Secreto 07 · El sueño de la Esfinge (Espera) — Guiza
   Si te quedas quieto junto a la Esfinge (unos 40 s sin tocar nada, aunque tengas el papiro abierto), el gato se va a su sombra,
   se echa y se duerme. Y sueña lo que soñó el príncipe Tutmosis: la Esfinge enterrada en arena hasta el cuello, que le
   pide que la libere y le promete el trono. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, FX = AE.fx, X = AE.esc, N = AE.nilo, TAU = Math.PI * 2;
  var SOMBRA = { dx: 0.24, dy: 0, w: 0.12 }, ESTELA = { dx: 0.27, dy: -0.07, w: 0.03, h: 0.07 };
  function sombra() { return N.zona('esfinge', 'sombra', SOMBRA); }
  function estela() { return N.zona('esfinge', 'estela', ESTELA); }
  var ESPERA = 40000, llevado = false;
  AE.registrar({
    id: 'esfinge', n: 7, nombre: 'El sueño de la Esfinge', jero: '𓅝𓄟𓋴', tipo: 'Espera',
    pista: 'Un príncipe se durmió a su sombra y soñó que sería rey. Quédate quieto junto a ella.',
    detectar: function (api) {
      var Em = api.motor, G = AE.gatoCtl;
      api.en('cuadro', function (d) {
        var z = sombra(); if (!z || !G) return;
        var cerca = Math.abs(Em.centroXu() - z.xu) < 0.55 && z.x > 0 && z.x < Em.W;
        if (!cerca) { if (llevado) { G.soltar(); llevado = false; G.fijo = false; } return; }
        // a los 20 s quieto, el gato se va a la sombra de la Esfinge (luego se echará y se dormirá solo)
        if (d.inactivo > 20000 && !llevado && G.estado !== 'dormir') { G.forzar({ xu: z.xu }); llevado = true; G.fijo = true; }   // (fijo: no se aparta si pasa una barca)
        if (llevado && Math.abs(G.xu - z.xu) < 0.02 && G.forzado) G.soltar();
        if (d.inactivo < 1000 && llevado) { G.soltar(); llevado = false; G.fijo = false; }
        if (d.inactivo > ESPERA && G.estado === 'dormir' && Math.abs(G.xu - z.xu) < 0.1) { llevado = false; G.fijo = false; api.disparar(); }
      });
    },
    escena: function (E) {
      var L = E.lectura, G = AE.gatoCtl;
      return {
        duracion: 18000 + L,
        tarjeta: {
          en: 10200, hasta: 17200 + L,
          titulo: 'El sueño de la Esfinge',
          texto: 'Cuenta la Estela del Sueño que el príncipe Tutmosis, de caza, se durmió a mediodía a la sombra de la Esfinge. En sueños, el dios de la Esfinge, Horemajet, se quejó de que la arena lo cubría y le prometió el reino. Reinó como Tutmosis IV y, en su primer año, hacia 1401\u00a0a.\u00a0C., mandó grabar el sueño en una losa de granito entre las patas del dios. Se suele leer como propaganda: quizá no era el heredero. Falta casi la mitad del texto, pero la losa sigue ahí.',
          pie: 'Guiza · Tutmosis IV (Dyehutymes) · hacia 1401\u00a0a.\u00a0C.'
        },
        inicio: function () { var z = sombra(); E.irA(z ? z.xu - 0.1 : 13.3, 1600); if (G && z) G.forzar({ xu: z.xu, estado: 'dormir', ya: true }); AE.sonido.tocar('sueno'); },
        cuadro: function (t) { X.hora(t, 0, 3000, null, 21.5); if (t > 12500) X.hora(t, 12500, 4000, 21.5, N.hora(E.centroXu())); if (t > 15200 && G && G.estado === 'dormir') G.despertar(); },
        sinBarcas: true,
        frente: function (ctx, t) {
          var s = E.u, p = N.pieza('esfinge'), d = AE.arte.esfinge; if (!p) return;
          var cx = E.sx(p.xu), base = E.sy(N.SUELO), w = ((d && d.ancho) || 0.8) * s, h = ((d && d.alto) || 0.24) * s;
          // el sueño: un velo azul de noche con estrellas
          var kv = U.meseta(t, 600, 2600, 13800, 16400);
          ctx.fillStyle = U.rgba([30, 40, 96], 0.25 * kv); ctx.fillRect(0, 0, E.W, E.H);
          // la arena cubre a la Esfinge hasta el cuello… y luego se va
          var cubre = U.meseta(t, 2200, 4200, 8200, 11200), duna = base - h * 0.62 * cubre;
          if (cubre > 0.01) {
            ctx.save(); ctx.beginPath(); ctx.moveTo(cx - w * 0.62, base + 2);
            for (var i = 0; i <= 24; i++) { var f = i / 24, xx = cx - w * 0.62 + f * w * 1.24, yy = duna + Math.sin(f * Math.PI) * -h * 0.08 * cubre + Math.sin(f * 9 + t * 0.001) * h * 0.012; ctx.lineTo(xx, Math.min(base, yy + (1 - Math.sin(f * Math.PI)) * h * 0.45 * cubre)); }
            ctx.lineTo(cx + w * 0.62, base + 2); ctx.closePath();
            ctx.fillStyle = ES.lin(ctx, 0, duna, 0, base, [[0, ES.aclarar(P.arena, 0.1)], [1, P.arena2]]); ctx.fill();
            ctx.restore();
            if (t > 8200) X.arena(ctx, cx - w * 0.5, duna, w, h * 0.5, U.tramo(t, 8200, 11200), 77);
          }
          // la estela que brilla al final, y el texto del sueño
          var ze = estela(), ke = U.meseta(t, 10400, 11400, 16000, 17600);
          if (ze && ke > 0) { FX.halo(ze.x, ze.y, ze.h * 1.2, [255, 220, 140], ke * (0.6 + 0.2 * Math.sin(t * 0.006))); X.polvo(ctx, ze.x, ze.y, ze.h, 14, ke, t, 9); }
          var kt = U.meseta(t, 4400, 5400, 9000, 10200);
          if (kt > 0) {
            FX.texto('«Mírame, hijo mío Tutmosis: te daré mi reino…', E.W * 0.5, E.sy(0.18), { serif: true, cursiva: true, tam: Math.max(18, s * 0.032), alin: 'center', a: kt, color: [252, 244, 222] });
            FX.texto('La arena del desierto me ha alcanzado. Haz lo que deseo.»', E.W * 0.5, E.sy(0.18) + s * 0.045, { serif: true, cursiva: true, tam: Math.max(18, s * 0.032), alin: 'center', a: kt * U.tramo(t, 5600, 6600), color: [252, 244, 222] });
          }
          // las «zetas» del gato dormido, en jeroglífico de sueño: tres estrellitas que suben
          if (G && t < 15000) { var gx = G.x(), gy = G.y() - s * 0.08; for (var q = 0; q < 3; q++) { var f2 = ((t * 0.0004 + q / 3) % 1); ctx.save(); ctx.globalAlpha = (1 - f2) * 0.8 * kv; ES.estrella(ctx, gx + s * 0.02 + f2 * s * 0.04, gy - f2 * s * 0.08, s * (0.006 + f2 * 0.006), 0); ctx.fillStyle = 'rgb(255,214,110)'; ctx.fill(); ctx.restore(); } }
        },
        fin: function () { X.soltarHora(); if (G) { G.soltar(); G.despertar(); } }
      };
    }
  });
})();

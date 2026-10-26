/* Secreto 05 · Cosas maravillosas (Gesto) — el Valle de los Reyes
   Bajo las chozas de los obreros, al barrer la arena (ir y venir con el puntero o con el cálamo encima, tres vaivenes),
   aparece un escalón. La escalera baja hasta una puerta sellada; Carter mira con una vela y dentro brilla el oro. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, FX = AE.fx, X = AE.esc, N = AE.nilo, TAU = Math.PI * 2;
  var ESCALON = { dx: 0.28, dy: -0.012, w: 0.1, h: 0.03 };
  function escalon() { var z = N.zona('valleReyes', 'escalon', ESCALON); if (z) { z.w = Math.max(z.w, AE.motor.u * 0.1); z.h = Math.max(z.h, AE.motor.u * 0.045); } return z; }

  // la escalera tallada en la roca que baja (k: cuánto se ha descubierto), la puerta sellada y el agujero
  function escalera(ctx, x0, y0, w, h, k, luz) {
    ctx.fillStyle = ES.lin(ctx, 0, y0, 0, y0 + h, [[0, [150, 104, 60]], [1, [64, 40, 24]]]); ctx.fillRect(x0, y0, w, h);
    var n = 16, bajada = U.clamp(k, 0, 1);
    for (var i = 0; i < n; i++) {
      var f = i / n; if (f > bajada) break;
      var sx = x0 + w * (0.06 + f * 0.6), sy = y0 + h * (0.12 + f * 0.7), sw = w * 0.06, sh = h * 0.05;
      ctx.fillStyle = ES.lin(ctx, 0, sy, 0, sy + sh, [[0, ES.aclarar(P.piedra, 0.1 - f * 0.4)], [1, ES.oscurecer(P.piedra2, 0.3 + f * 0.4)]]);
      ctx.fillRect(sx, sy, sw * 1.05, sh); ctx.fillStyle = 'rgba(30,18,8,0.4)'; ctx.fillRect(sx, sy + sh, sw * 1.05, h * 0.0436 - sh * 0.1);
    }
    if (bajada < 0.98) return;
    // la puerta, enlucida y sellada con los sellos de la necrópolis (el chacal sobre nueve cautivos)
    var dx = x0 + w * 0.7, dy = y0 + h * 0.18, dw = w * 0.2, dh = h * 0.74;
    ctx.fillStyle = ES.lin(ctx, dx, dy, dx + dw, dy + dh, [[0, [222, 204, 170]], [1, [168, 146, 112]]]); ctx.fillRect(dx, dy, dw, dh);
    ctx.fillStyle = 'rgba(120,80,50,0.5)';
    for (var s2 = 0; s2 < 9; s2++) { ctx.beginPath(); ctx.ellipse(dx + dw * (0.22 + (s2 % 3) * 0.28), dy + dh * (0.25 + Math.floor(s2 / 3) * 0.22), dw * 0.08, dh * 0.05, 0, 0, TAU); ctx.fill(); }
    // el agujero de arriba a la izquierda, y lo que brilla dentro
    if (luz > 0) {
      var hx = dx + dw * 0.18, hy = dy + dh * 0.06, hw = dw * 0.3, hh = dh * 0.12;
      ctx.fillStyle = '#1a0f06'; ctx.fillRect(hx, hy, hw, hh);
      ctx.save(); ctx.beginPath(); ctx.rect(hx, hy, hw, hh); ctx.clip();
      ctx.fillStyle = ES.oro(ctx, hx, hy, hx + hw, hy + hh, 0.4); ctx.globalAlpha = luz;
      for (var g = 0; g < 7; g++) { var gx = hx + hw * (0.08 + g * 0.13), gh = hh * (0.4 + U._h(g) * 0.5); ctx.fillRect(gx, hy + hh - gh, hw * 0.09, gh); }
      ctx.restore();
      FX.halo(hx + hw / 2, hy + hh / 2, hw * 1.4, [255, 200, 90], luz * 0.9);
    }
  }

  // el primer escalón, en el friso: un hueco en la arena con los dos primeros peldaños de piedra, que bajan hacia la derecha,
  // y dos montoncitos de arena barrida a los lados que tapan sus bordes (antes era un rectángulo que cortaba la línea de
  // oro del suelo). Todo queda por encima del filo de oro («suelo» es la y de la línea de suelo)
  function primerEscalon(ctx, cx, suelo, s, a) {
    if (a <= 0.01) return;
    var g = suelo - s * 0.0027, w = s * 0.08, H = s * 0.02, top = g - H, l = cx - w * 0.46, r = cx + w * 0.42, m = cx - w * 0.04;
    ctx.save(); ctx.globalAlpha = a;
    // el hueco, oscuro, con los bordes de arena un poco caídos
    ctx.beginPath(); ctx.moveTo(cx - w * 0.52, top + H * 0.08); ctx.quadraticCurveTo(cx, top - H * 0.06, cx + w * 0.5, top + H * 0.1); ctx.lineTo(r + w * 0.04, g); ctx.lineTo(l - w * 0.02, g); ctx.closePath();
    ctx.fillStyle = ES.lin(ctx, 0, top, 0, g, [[0, [96, 62, 32]], [1, [40, 24, 12]]]); ctx.fill();
    // los peldaños: la piedra tallada, la huella clara arriba y la contrahuella en sombra
    var t1 = top + H * 0.28, t2 = top + H * 0.64;
    ctx.beginPath(); ctx.moveTo(l, t1); ctx.lineTo(m, t1); ctx.lineTo(m, t2); ctx.lineTo(r, t2); ctx.lineTo(r, g); ctx.lineTo(l, g); ctx.closePath();
    ctx.fillStyle = ES.lin(ctx, 0, t1, 0, g, [[0, P.piedra], [1, ES.oscurecer(P.piedra2, 0.2)]]); ctx.fill();
    ctx.fillStyle = U.rgba(ES.aclarar(P.piedra, 0.35), 0.95); ctx.fillRect(l, t1, m - l, Math.max(1, H * 0.12)); ctx.fillRect(m, t2, r - m, Math.max(1, H * 0.12));
    ctx.fillStyle = 'rgba(40,24,10,0.35)'; ctx.fillRect(m - Math.max(1, w * 0.02), t1, Math.max(1, w * 0.02), t2 - t1);
    // los montoncitos de arena barrida a los lados, que se funden con el suelo
    [-1, 1].forEach(function (lado) {
      var mx = cx + lado * w * 0.6, mw = w * 0.3, mh = H * 0.55;
      ctx.beginPath(); ctx.moveTo(mx - mw, g); ctx.quadraticCurveTo(mx - mw * 0.35, g - mh * 1.15, mx, g - mh); ctx.quadraticCurveTo(mx + mw * 0.4, g - mh * 0.9, mx + mw, g); ctx.closePath();
      ctx.fillStyle = ES.lin(ctx, 0, g - mh, 0, g, [[0, ES.aclarar(P.arena, 0.14)], [1, P.arena]]); ctx.fill();
    });
    ctx.restore();
  }

  var pts = [], ultimo = 0, barrido = 0;
  AE.registrar({
    id: 'tutankamon', n: 5, nombre: 'Cosas maravillosas', jero: '𓍹𓇳𓆣𓏥𓎟𓍺', tipo: 'Gesto',
    pista: 'Bajo unas chozas de obreros, la arena esconde un escalón. Bárrela.',
    lugar: function () { var z = escalon(); return z ? [z.x, z.y] : null; }, radioKa: 0.24,
    detectar: function (api) {
      var Em = api.motor;
      // en táctil, barrer con el dedo sobre el escalón es barrer aunque el botón diga «Mover» (mientras no se haya encontrado)
      Em.zonasGesto.push(function (x, y) { return !api.hallado() && N.dentro(escalon(), x, y, 0.04); });
      // los movimientos del puntero sobre la arena (con o sin el botón pulsado): tres vaivenes en 2 s. Al barrer de verdad
      // la mano se pasa del escalón por los lados: los puntos que caen un poco fuera no cuentan, pero ya no borran lo
      // barrido (antes, uno solo fuera de la zona lo ponía todo a cero y había que barrer muy recto y muy corto)
      api.en('mover', function (d) {
        var z = escalon(); if (!z) return;
        while (pts.length && Em.t - pts[0].t > 2000) pts.shift();
        var dentro = Math.abs(d.x - z.x) < z.w / 2 + Em.u * 0.07 && Math.abs(d.y - z.y) < z.h / 2 + Em.u * 0.035;
        if (!dentro) { if (Math.abs(d.y - z.y) > Em.u * 0.12) pts.length = 0; return; }
        pts.push({ x: d.x, y: d.y, t: Em.t });
        barrido = Em.t;
        if (AE.gestos.vaivenes(pts, Em.u * 0.01) >= 3 && Em.t - ultimo > 2500) { pts.length = 0; ultimo = Em.t; api.disparar(); }
      });
      // al barrer, se levanta un poco de arena (para que se note que algo pasa)
      api.capa(function (ctx) {
        if (Em.t - barrido > 500 || !pts.length) return; var p = pts[pts.length - 1];
        X.arena(ctx, p.x - Em.u * 0.02, p.y - Em.u * 0.004, Em.u * 0.04, Em.u * 0.01, ((Em.t - barrido) / 500), Math.floor(Em.t / 90));
      });
    },
    escena: function (E) {
      var L = E.lectura, G = AE.gatoCtl;
      return {
        duracion: 17000 + L,
        tarjeta: {
          en: 9200, hasta: 16200 + L,
          titulo: 'Cosas maravillosas',
          texto: 'El 4 de noviembre de 1922, bajo los restos de unas chozas de obreros, el equipo de Howard Carter encontró un escalón. Llevaba a una puerta sellada y, tras ella, a otra. El 26 de noviembre, Carter abrió un agujero en la segunda y se asomó con una vela. Lord Carnarvon le preguntó si veía algo. «Sí, cosas maravillosas», respondió, según su libro de 1923; en su diario había escrito «Sí, es maravilloso». Era la tumba de Tutankamón, casi intacta.',
          pie: 'Valle de los Reyes · Tutankamón (Nebjeperura) · 26.11.1922'
        },
        inicio: function () { var z = escalon(); E.irA(z ? z.xu : 9.4, 1400); if (G) G.forzar({ xu: (z ? z.xu : 9.4) - 0.4, estado: 'sentado' }); AE.sonido.tocar('descubrir'); },
        sinBarcas: true,
        frente: function (ctx, t) {
          var z = escalon(); if (!z) return;
          var s = E.u;
          // la arena se va volando y deja ver el primer escalón, que se funde con la arena (y se vuelve a tapar al acabar)
          X.arena(ctx, z.x - z.w / 2, z.y - z.h * 0.4, z.w, z.h * 0.8, U.tramo(t, 300, 2200), 22);
          primerEscalon(ctx, z.x, E.sy(N.SUELO), s, U.tramo(t, 900, 2400) * X.salida(t, 1800));
          X.polvo(ctx, z.x, z.y - z.h, z.w * 0.6, 10, U.meseta(t, 1500, 2500, 5000, 7000), t, 5);
        },
        // la viñeta (sin tinte): la escalera que baja, la puerta sellada y Carter con la vela
        luz: function (ctx, t) {
          var s = E.u, kp = U.meseta(t, 2600, 3600, 15800, 16900); if (kp <= 0) return;
          var pw = Math.min(E.W * 0.48, s * 0.86), ph = s * 0.34, px = E.W * 0.5 - pw / 2 + s * 0.1, py = E.sy(0.1);
          X.panel(ctx, px, py, pw, ph, kp, function (x0, y0, w, h) {
            escalera(ctx, x0, y0, w, h, U.tramo(t, 3600, 6200), U.tramo(t, 7800, 9200) * (0.85 + 0.15 * Math.sin(t * 0.009)));
            var carter = AE.arte.carter;
            if (carter && t > 6400) { ctx.save(); ctx.globalAlpha = U.tramo(t, 6400, 7200); carter.dibujar(ctx, x0 + w * 0.6, y0 + h * 0.97, h * 0.95 / (carter.alto || 0.26) * 0.86, { t: t }); ctx.restore(); }
          });
          if (t > 8200) FX.texto('«Sí, cosas maravillosas»', px + pw / 2, py + ph + s * 0.045, { serif: true, cursiva: true, tam: Math.max(18, s * 0.03), alin: 'center', a: U.tramo(t, 8200, 9000) * kp, color: P.tinta });
        },
        fin: function () { if (G) G.soltar(); }
      };
    }
  });
})();

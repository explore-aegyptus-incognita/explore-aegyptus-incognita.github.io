/* Secreto 07 · El sueño de la Esfinge (Espera) — Guiza
   Si te quedas quieto junto a la Esfinge (unos 40 s sin tocar nada, 25 en el móvil, aunque tengas el papiro abierto), el gato se va a su sombra,
   se echa y se duerme. Y sueña lo que soñó el príncipe Tutmosis: la Esfinge enterrada en arena hasta el cuello, que le
   pide que la libere y le promete el trono. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p, FX = AE.fx, X = AE.esc, N = AE.nilo, TAU = Math.PI * 2;
  var SOMBRA = { dx: 0.24, dy: 0, w: 0.12 }, ESTELA = { dx: 0.27, dy: -0.07, w: 0.03, h: 0.07 };
  function sombra() { return N.zona('esfinge', 'sombra', SOMBRA); }
  function estela() { return N.zona('esfinge', 'estela', ESTELA); }
  var llevado = false;
  // los tiempos de la Espera (ms sin tocar nada). En el móvil, más corta: muchos iPhone se bloquean a los 30 s, y antes de
  // los 40 se apagaba la pantalla (además se pide que no se apague: ver despierta)
  var RATON = { llevar: 20000, tumbar: 25000, dormir: 34000, espera: 40000 }, DEDO = { llevar: 9000, tumbar: 14000, dormir: 19000, espera: 25000 };
  function tiempos(Em) { var t = Em.puntero.tipo; return t === 'touch' || t === 'pen' ? DEDO : RATON; }

  // que la pantalla no se apague mientras esperas junto a la Esfinge (Screen Wake Lock: Safari 16.4 y posteriores). Se pide
  // al llegar y se suelta al irse; si el navegador no deja, no pasa nada (la espera en el móvil ya es más corta)
  var cerrojo = null, pidiendo = false, quiere = false, ultimoIntento = -1e9;
  function despierta(si, ahora) {
    quiere = si;
    if (si && !cerrojo && !pidiendo && navigator.wakeLock && !document.hidden && ahora - ultimoIntento > 5000) {
      pidiendo = true; ultimoIntento = ahora;
      navigator.wakeLock.request('screen').then(function (c) {
        pidiendo = false; cerrojo = c;
        c.addEventListener('release', function () { if (cerrojo === c) cerrojo = null; });
        if (!quiere) despierta(false, ahora);
      }, function () { pidiendo = false; });
    } else if (!si && cerrojo) { var c = cerrojo; cerrojo = null; c.release().catch(function () { }); }
  }

  // una frase partida en líneas que quepan en «ancho» px (en un móvil de pie, las del sueño se salían)
  function partir(ctx, texto, ancho) {
    var pal = texto.split(' '), lineas = [], l = '';
    pal.forEach(function (w) { var p = l ? l + ' ' + w : w; if (l && ctx.measureText(p).width > ancho) { lineas.push(l); l = w; } else l = p; });
    if (l) lineas.push(l); return lineas;
  }
  var SUENO = ['«Mírame, hijo mío Tutmosis: te daré mi reino…', 'La arena del desierto me ha alcanzado. Haz lo que deseo.»'];

  // la duna que cubre a la Esfinge hasta el cuello, como una duna de verdad: la ladera del viento, suave y con ondas; la
  // cresta, a la izquierda de la cabeza; y la cara de caída, lisa y en sombra, que baja por delante del pecho. Su perfil
  // llega a 0 en los extremos (antes acababa en una pared)
  var GRANOS = []; (function () { var r = U.azar(71); for (var i = 0; i < 80; i++) GRANOS.push([r(), r(), r(), r()]); })();
  var CRESTA = 0.45;
  function perfil(f) {
    f = U.clamp(f, 0, 1);
    return f < CRESTA ? Math.pow(Math.sin(Math.PI / 2 * f / CRESTA), 1.2) : 1 - Math.pow((f - CRESTA) / (1 - CRESTA), 1.5);
  }
  function duna(ctx, cx, base, w, h, cubre, t) {
    var x0 = cx - w * 0.64, an = w * 1.28, alto = h * 0.62 * cubre, N2 = 48;
    function y(f, k) { k = k == null ? 1 : k; return base - alto * k * perfil(f) + Math.sin(f * 9 + t * 0.001) * h * 0.006 * cubre * k; }
    ctx.save();
    // la sombra que deja en el suelo
    ctx.fillStyle = 'rgba(60,36,14,' + (0.16 * cubre).toFixed(3) + ')'; ctx.beginPath(); ctx.ellipse(cx + w * 0.05, base + 1, an * 0.5, h * 0.03, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x0, base + 1);
    for (var i = 0; i <= N2; i++) ctx.lineTo(x0 + an * i / N2, y(i / N2));
    ctx.lineTo(x0 + an, base + 1); ctx.closePath();
    ctx.fillStyle = ES.lin(ctx, 0, base - alto, 0, base, [[0, ES.aclarar(P.arena, 0.12)], [0.6, P.arena], [1, P.arena2]]); ctx.fill();
    ctx.clip();
    // la luz de lado: la ladera del viento, clara; la cara de caída, en sombra, con el cambio justo en la cresta
    ctx.fillStyle = ES.lin(ctx, x0, 0, x0 + an, 0, [[0, [255, 242, 206], 0.26], [CRESTA - 0.04, [255, 242, 206], 0.08], [CRESTA + 0.04, [96, 54, 22], 0.2], [1, [96, 54, 22], 0.34]]);
    ctx.fillRect(x0, base - alto - 4, an, alto + 6);
    // las ondas del viento, solo en la ladera de barlovento: trazos cortos y ondulados, claros con su sombra debajo
    ctx.lineCap = 'round';
    for (var o = 0; o < 11; o++) {
      var k = 0.14 + U._h(o * 2.3) * 0.74, fa = 0.04 + U._h(o * 3.7) * 0.18, fb = Math.min(CRESTA - 0.03, fa + 0.14 + U._h(o * 5.1) * 0.2), f1 = U._h(o * 1.9) * TAU, f2 = U._h(o * 7.3) * TAU;
      if (fb <= fa) continue;
      [[0, [255, 238, 196], 0.55], [Math.max(1, h * 0.005), [110, 68, 30], 0.35]].forEach(function (c) {
        ctx.strokeStyle = U.rgba(c[1], c[2]); ctx.lineWidth = Math.max(1, h * 0.0055); ctx.beginPath();
        for (var j = 0; j <= 20; j++) {
          var f = fa + (fb - fa) * j / 20, env = Math.sin(Math.PI * j / 20);
          ctx[j ? 'lineTo' : 'moveTo'](x0 + an * f, y(f, k) + (Math.sin(f * 40 + f1) * 0.011 + Math.sin(f * 17 + f2) * 0.007) * h * env + c[0]);
        }
        ctx.stroke();
      });
    }
    // el grano
    for (var g = 0; g < GRANOS.length; g++) {
      var q = GRANOS[g], fx = 0.05 + q[0] * 0.9, gy = y(fx, 0.04 + q[1] * 0.9);
      ctx.fillStyle = q[2] < 0.5 ? 'rgba(255,240,205,0.5)' : 'rgba(110,70,30,0.35)'; ctx.fillRect(x0 + an * fx, gy, 1 + q[3] * 1.4, 1 + q[3] * 1.4);
    }
    ctx.restore();
    // el filo de la ladera del viento hasta la cresta, iluminado
    ctx.save(); ctx.strokeStyle = U.rgba([255, 244, 214], 0.6 * cubre); ctx.lineWidth = Math.max(1.2, h * 0.008); ctx.lineCap = 'round'; ctx.beginPath();
    for (var m = 0; m <= 30; m++) { var fm = 0.06 + (CRESTA + 0.01 - 0.06) * m / 30; ctx[m ? 'lineTo' : 'moveTo'](x0 + an * fm, y(fm) + 1); }
    ctx.stroke(); ctx.restore();
    return base - alto;
  }

  AE.registrar({
    id: 'esfinge', n: 7, nombre: 'El sueño de la Esfinge', jero: '𓅝𓄟𓋴', tipo: 'Espera',
    pista: 'Un príncipe se durmió a su sombra y soñó que sería rey. Quédate quieto junto a ella.',
    detectar: function (api) {
      var Em = api.motor, G = AE.gatoCtl;
      api.en('cuadro', function (d) {
        var z = sombra(); if (!z || !G) return;
        var cerca = Math.abs(Em.centroXu() - z.xu) < 0.55 && z.x > 0 && z.x < Em.W, T = tiempos(Em);
        despierta(cerca && !api.hallado(), Em.t);
        if (!cerca) { if (llevado) { G.soltar(); llevado = false; G.fijo = false; } return; }
        // quieto un rato, el gato se va a la sombra de la Esfinge, se echa y se duerme (fijo: no se aparta si pasa una barca)
        if (d.inactivo > T.llevar && !llevado && G.estado !== 'dormir') { G.forzar({ xu: z.xu }); llevado = true; G.fijo = true; }
        if (llevado && Math.abs(G.xu - z.xu) < 0.02) {
          var est = d.inactivo > T.dormir ? 'dormir' : d.inactivo > T.tumbar ? 'tumbado' : 'sentado';
          if (!G.forzado || G.forzado.estado !== est) G.forzar({ xu: z.xu, estado: est });
        }
        if (d.inactivo < 1000 && llevado) { G.soltar(); llevado = false; G.fijo = false; }
        if (d.inactivo > T.espera && G.estado === 'dormir' && Math.abs(G.xu - z.xu) < 0.1) { llevado = false; G.fijo = false; despierta(false, Em.t); api.disparar(); }
      });
    },
    escena: function (E) {
      var L = E.lectura, G = AE.gatoCtl, despierto = false;
      return {
        duracion: 18000 + L,
        tarjeta: {
          en: 10200, hasta: 17200 + L,
          titulo: 'El sueño de la Esfinge',
          texto: 'Cuenta la Estela del Sueño que el príncipe Tutmosis, de caza, se durmió a mediodía a la sombra de la Esfinge. En sueños, el dios de la Esfinge, Horemajet, se quejó de que la arena lo cubría y le prometió el reino. Reinó como Tutmosis IV y, en su primer año, hacia 1401 a. C., mandó grabar el sueño en una losa de granito entre las patas del dios. Se suele leer como propaganda: quizá no era el heredero. Falta casi la mitad del texto, pero la losa sigue ahí.',
          pie: 'Guiza · Tutmosis IV (Dyehutymes) · hacia 1401 a. C.'
        },
        inicio: function () { var z = sombra(); E.irA(z ? z.xu - 0.1 : 13.3, 1600); if (G && z) G.forzar({ xu: z.xu, estado: 'dormir', ya: true }); AE.sonido.tocar('sueno'); },
        cuadro: function (t) {
          X.hora(t, 0, 3000, null, 21.5); if (t > 12500) X.hora(t, 12500, 4000, 21.5, N.hora(E.centroXu()));
          // al acabar el sueño, el gato se despierta y se sienta (antes se le soltaba el «dormir» y volvía a él en el
          // fotograma siguiente: se quedaba medio tumbado hasta el final)
          if (t > 15200 && G && !despierto) { despierto = true; G.forzar({ xu: G.xu, estado: 'sentado' }); }
        },
        sinBarcas: true,
        frente: function (ctx, t) {
          var s = E.u, p = N.pieza('esfinge'), d = AE.arte.esfinge; if (!p) return;
          var cx = E.sx(p.xu), base = E.sy(N.SUELO), w = ((d && d.ancho) || 0.8) * s, h = ((d && d.alto) || 0.24) * s;
          // el sueño: un velo azul de noche
          var kv = U.meseta(t, 600, 2600, 13800, 16400);
          ctx.fillStyle = U.rgba([30, 40, 96], 0.25 * kv); ctx.fillRect(0, 0, E.W, E.H);
          // la arena cubre a la Esfinge hasta el cuello… y luego se va
          var cubre = U.meseta(t, 2200, 4200, 8200, 11200);
          if (cubre > 0.01) {
            var cima = duna(ctx, cx, base, w, h, cubre, t);
            if (t > 8200) X.arena(ctx, cx - w * 0.5, cima, w, h * 0.5, U.tramo(t, 8200, 11200), 77);
          }
          // la estela que brilla al final
          var ze = estela(), ke = U.meseta(t, 10400, 11400, 16000, 17600);
          if (ze && ke > 0) { FX.halo(ze.x, ze.y, ze.h * 1.2, [255, 220, 140], ke * (0.6 + 0.2 * Math.sin(t * 0.006))); X.polvo(ctx, ze.x, ze.y, ze.h, 14, ke, t, 9); }
        },
        // lo que se lee, sin el tinte de la noche: lo que dice el dios en el sueño (la luna y las estrellas se apartan) y las
        // «zetas» del gato dormido, tres estrellitas de oro que suben
        luz: function (ctx, t) {
          var s = E.u, kv = U.meseta(t, 600, 2600, 13800, 16400), kt = U.meseta(t, 4400, 5400, 9000, 10200);
          if (kt > 0) {
            var tam = Math.round(Math.max(17, Math.min(s * 0.032, E.W * 0.05))), paso = tam * 1.35;
            ctx.font = 'italic 400 ' + tam + 'px ' + E.FUENTES.serif;
            var l1 = partir(ctx, SUENO[0], E.W * 0.9), l2 = partir(ctx, SUENO[1], E.W * 0.9), todas = l1.concat(l2);
            var y0 = E.sy(0.15), ancho = Math.max.apply(null, todas.map(function (l) { return ctx.measureText(l).width; }));
            if (kt > 0.2) X.tapar(E.W / 2 - ancho / 2 - tam * 0.5, y0 - tam, ancho + tam, todas.length * paso + tam);
            ctx.shadowColor = 'rgba(8,14,44,0.9)'; ctx.shadowBlur = tam * 0.6;
            todas.forEach(function (l, i) {
              var a = kt * (i < l1.length ? 1 : U.tramo(t, 5600, 6600));
              FX.texto(l, E.W * 0.5, y0 + i * paso, { serif: true, cursiva: true, tam: tam, alin: 'center', a: a, color: [252, 244, 222] });
            });
            ctx.shadowBlur = 0;
          }
          if (G && t < 15000) {
            var gx = G.x(), gy = G.y() - s * 0.08;
            for (var q = 0; q < 3; q++) { var f2 = ((t * 0.0004 + q / 3) % 1); ctx.save(); ctx.globalAlpha = (1 - f2) * 0.8 * kv; ES.estrella(ctx, gx + s * 0.02 + f2 * s * 0.04, gy - f2 * s * 0.08, s * (0.006 + f2 * 0.006), 0); ctx.fillStyle = 'rgb(255,214,110)'; ctx.fill(); ctx.restore(); }
          }
        },
        fin: function () { X.soltarHora(); if (G) { G.soltar(); G.despertar(); } }
      };
    }
  });
})();

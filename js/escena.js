/* Aegyptus Incognita · ayudas para las escenas de los secretos
   Un panel de papiro con marco de lapislázuli y oro para ver algo de cerca, la lupa de cristal, los rayos de luz, el
   polvo de oro que flota, el cambio de hora durante la escena y la arena que se va. AE.esc. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, E = AE.motor, ES = AE.estilo, P = ES.p, FX = AE.fx, TAU = Math.PI * 2;
  var X = AE.esc = {};

  // la hora durante una escena: de la que haya a «h», en «dur» ms desde «t0» (y se suelta en fin)
  X.hora = function (t, t0, dur, h0, h1) {
    var k = U.inOut(U.tramo(t, t0, t0 + dur));
    var a = h0 == null ? AE.nilo.hora(E.centroXu()) : h0, b = h1;
    // por el camino más corto en el círculo de 24 h: de las 21,8 a las 6,6 se pasa por la madrugada, no por el mediodía
    if (b - a > 12) b -= 24; else if (a - b > 12) b += 24;
    AE.nilo.horaForzada = ((U.lerp(a, b, k) % 24) + 24) % 24;
  };
  X.soltarHora = function () { AE.nilo.soltarHora(); };   // (vuelve a la del sitio en 1,8 s, sin saltos)
  // lo que queda de una escena hasta que acaba de verdad (1 → 0 en los últimos «ms»): la tarjeta alarga la escena lo que se
  // tarda en leerla, así que lo que dura hasta el final (el faro, Hatshepsut, el escalón) se funde con esto y no de golpe
  X.salida = function (t, ms) { var e = E.escena, d = e ? e.dur : 0; return d ? 1 - U.inOut(U.tramo(t, d - (ms || 1600), d)) : 1; };
  // lo que tapa una escena en este fotograma (para que las estrellas y la luna no se pinten encima): px de pantalla
  X.tapar = function (x, y, w, h) { var N = AE.nilo; if (N && N.tapasEscena) N.tapasEscena.push({ x: x, y: y, w: w, h: h }); };

  // un panel de papiro (viñeta) con marco de oro y lapislázuli, para ver algo de cerca; dibujo(x, y, w, h) va recortado
  X.panel = function (ctx, x, y, w, h, a, dibujo) {
    if (a <= 0.01) return;
    if (a > 0.2) X.tapar(x, y, w, h);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(70,40,10,0.18)'; ctx.fillRect(x + 8, y + 10, w, h);
    ES.papiro(ctx, x, y, w, h, x * 1.3, y * 1.7);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 6, y + 6, w - 12, h - 12); ctx.clip();
    try { dibujo(x + 6, y + 6, w - 12, h - 12); } catch (err) { console.error(err); }
    ctx.restore();
    // el marco: lapislázuli con un filo de oro por dentro y por fuera
    ctx.lineWidth = 6; ctx.strokeStyle = ES.relleno(ctx, P.lapis, x, y, x + w, y + h, 0.2); ctx.strokeRect(x + 3, y + 3, w - 6, h - 6);
    ctx.lineWidth = 1.6; ctx.strokeStyle = ES.oro(ctx, x, y, x + w, y + h, 0.4); ctx.strokeRect(x + 0.8, y + 0.8, w - 1.6, h - 1.6); ctx.strokeRect(x + 6.6, y + 6.6, w - 13.2, h - 13.2);
    ctx.restore();
  };

  // una lupa: un círculo de cristal con aro de oro; dentro se dibuja ampliado lo que se quiera
  X.lupa = function (ctx, x, y, r, a, dibujo) {
    if (a <= 0.01) return;
    if (a > 0.2) X.tapar(x - r, y - r, r * 2, r * 2);
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(70,40,10,0.2)'; ctx.beginPath(); ctx.arc(x + 5, y + 7, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r * 0.96, 0, TAU); ctx.clip();
    ES.papiro(ctx, x - r, y - r, r * 2, r * 2, x, y);
    try { dibujo(); } catch (err) { console.error(err); }
    // el reflejo del cristal
    ctx.fillStyle = ES.lin(ctx, x - r, y - r, x + r * 0.2, y, [[0, [255, 255, 255], 0.28], [1, [255, 255, 255], 0]]); ctx.fillRect(x - r, y - r, r * 2, r);
    ctx.restore();
    ctx.lineWidth = Math.max(3, r * 0.06); ctx.strokeStyle = ES.oro(ctx, x - r, y - r, x + r, y + r, 0.35); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    // el mango, de ébano con anillas de oro
    var an = Math.PI * 0.25, x1 = x + Math.cos(an) * r * 1.03, y1 = y + Math.sin(an) * r * 1.03, x2 = x + Math.cos(an) * r * 1.75, y2 = y + Math.sin(an) * r * 1.75;
    ctx.lineCap = 'round'; ctx.lineWidth = Math.max(5, r * 0.13); ctx.strokeStyle = ES.negro(ctx, x1, y1, x2, y2); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.lineWidth = Math.max(5, r * 0.15); ctx.strokeStyle = ES.oro(ctx, x1, y1, x2, y2, 0.4); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + (x2 - x1) * 0.12, y1 + (y2 - y1) * 0.12); ctx.stroke();
    ctx.restore();
  };

  // un rayo de luz: una cuña que se abre de (x0, y0) a (x1, y1), con el ancho a0 al principio y a1 al final
  X.rayo = function (ctx, x0, y0, x1, y1, a0, a1, col, a) {
    if (a <= 0.01) return;
    var dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = ES.lin(ctx, x0, y0, x1, y1, [[0, col, 0.85], [0.7, col, 0.5], [1, col, 0.15]]);
    ctx.beginPath(); ctx.moveTo(x0 + nx * a0 / 2, y0 + ny * a0 / 2); ctx.lineTo(x1 + nx * a1 / 2, y1 + ny * a1 / 2);
    ctx.lineTo(x1 - nx * a1 / 2, y1 - ny * a1 / 2); ctx.lineTo(x0 - nx * a0 / 2, y0 - ny * a0 / 2); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  // polvo de oro que flota alrededor de (x, y): n motas, en un radio r, con la opacidad a
  X.polvo = function (ctx, x, y, r, n, a, t, semilla) {
    if (a <= 0.01) return;
    for (var i = 0; i < n; i++) {
      var h1 = U._h(i * 3.1 + (semilla || 0)), h2 = U._h(i * 7.7 + (semilla || 0) + 1), h3 = U._h(i * 1.3 + (semilla || 0) + 2);
      var an = h1 * TAU + t * 0.0004 * (h2 - 0.5), rr = r * Math.sqrt(h2), px = x + Math.cos(an) * rr, py = y + Math.sin(an) * rr * 0.7 - ((t * 0.02 * (0.4 + h3)) % (r * 0.8));
      var al = a * (0.4 + 0.6 * Math.sin(t * 0.004 + i)) * 0.9;
      FX.halo(px, py, 2.2 + h3 * 3, [255, 220, 120], al);
    }
  };

  // un texto de jeroglíficos en columna (de arriba abajo) que aparece signo a signo
  X.columna = function (ctx, signos, x, y, tam, aparicion, col, a) {
    var lista = Array.from(signos), a0 = ctx.globalAlpha;   // (se multiplica: así se funden con su viñeta)
    ctx.save(); ctx.font = Math.round(tam) + 'px ' + ES.JERO; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (var i = 0; i < lista.length; i++) {
      var k = U.clamp(aparicion * lista.length - i, 0, 1); if (k <= 0) continue;
      ctx.globalAlpha = a0 * (a == null ? 1 : a) * k; ctx.fillStyle = U.rgba(col || P.tinta, 1);
      ctx.fillText(lista[i], x, y + i * tam * 1.08 + (1 - k) * tam * 0.3);
    }
    ctx.restore();
  };
  // y en fila (de izquierda a derecha)
  X.fila = function (ctx, signos, x, y, tam, aparicion, col, a, alin) {
    var lista = Array.from(signos), a0 = ctx.globalAlpha;
    ctx.save(); ctx.font = Math.round(tam) + 'px ' + ES.JERO; ctx.textBaseline = 'middle';
    var anchos = lista.map(function (g) { return ctx.measureText(g).width; }), total = anchos.reduce(function (p, q) { return p + q; }, 0) + (lista.length - 1) * tam * 0.08;
    var cx = alin === 'center' ? x - total / 2 : alin === 'right' ? x - total : x;
    for (var i = 0; i < lista.length; i++) {
      var k = U.clamp(aparicion * lista.length - i, 0, 1);
      if (k > 0) { ctx.globalAlpha = a0 * (a == null ? 1 : a) * k; ctx.fillStyle = U.rgba(col || P.tinta, 1); ctx.fillText(lista[i], cx, y + (1 - k) * tam * 0.2); }
      cx += anchos[i] + tam * 0.08;
    }
    ctx.restore();
    return total;
  };
  // un cartucho: el óvalo con su nudo, alrededor de unos signos en fila (devuelve su caja)
  X.cartucho = function (ctx, signos, cx, cy, tam, a, col, aparicion) {
    var a0 = ctx.globalAlpha;
    ctx.save(); ctx.font = Math.round(tam) + 'px ' + ES.JERO;
    var lista = Array.from(signos), w = 0; lista.forEach(function (g) { w += ctx.measureText(g).width + tam * 0.08; });
    var W = w + tam * 0.7, H = tam * 1.45, x0 = cx - W / 2, y0 = cy - H / 2;
    ctx.globalAlpha = a0 * (a == null ? 1 : a);
    ctx.lineWidth = Math.max(1.5, tam * 0.07); ctx.strokeStyle = U.rgba(col || P.tinta, 1);
    ctx.beginPath(); ES.redondo(ctx, x0, y0, W, H, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + W, y0 + H * 0.2); ctx.lineTo(x0 + W, y0 + H * 0.8); ctx.lineWidth = Math.max(2, tam * 0.11); ctx.stroke();
    ctx.restore();
    X.fila(ctx, signos, cx, cy, tam, aparicion == null ? 1 : aparicion, col, a, 'center');
    return { x: x0, y: y0, w: W, h: H };
  };

  // la arena que se va volando de una zona (un montón de granos que se levantan con el viento): k de 0 a 1
  X.arena = function (ctx, x, y, w, h, k, semilla) {
    var n = 90, r = U.azar(semilla || 5);
    for (var i = 0; i < n; i++) {
      var px = x + r() * w, py = y + r() * h, d = U.clamp(k * 1.6 - r() * 0.6, 0, 1), vx = (0.4 + r()) * w * 0.9, vy = -(0.2 + r() * 0.8) * h * 1.6;
      if (d <= 0 || d >= 1) continue;
      ctx.fillStyle = U.rgba(U.mezcla(P.arena, P.arena2, r()), (1 - d) * 0.9);
      ctx.beginPath(); ctx.arc(px + vx * d, py + vy * d + d * d * h * 1.2, 1 + r() * 2.2, 0, TAU); ctx.fill();
    }
  };

  // ¿cuánto falta para una fecha que se repite cada año (mes 1–12, día)? En días, desde hoy
  X.diasHasta = function (mes, dia) {
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    var f = new Date(hoy.getFullYear(), mes - 1, dia); if (f < hoy) f = new Date(hoy.getFullYear() + 1, mes - 1, dia);
    return Math.round((f - hoy) / 86400000);
  };
})();

/* Aegyptus Incognita · el gato
   Lo que hace el gato negro que te acompaña (el dibujo y las poses son de arte-gato.js, AE.gato):
   · anda contigo: si la cámara avanza, va en la misma dirección y a su ritmo, sin que le resbalen las patas (la fase de
     la marcha avanza con lo que recorre, dividido por su zancada); si se queda atrás, trota para alcanzarte;
   · al parar, se sienta como Bastet; al rato se lava; si no tocas nada, se echa y se duerme;
   · mira al ratón; si el ratón corretea por el suelo delante de él, se agazapa y salta;
   · las escenas lo pueden llevar a un sitio y ponerle una pose (forzar / soltar).
   AE.gatoCtl (G). */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, E = AE.motor, TAU = Math.PI * 2;
  var G = AE.gatoCtl = {
    xu: 0.62, dir: 1, v: 0, fase: 0, estado: 'sentado', tEstado: 0, mezcla: 1, poseAntes: null,
    mirada: 0, orejas: 0.3, parpadeo: 0, oculto: false, forzado: null, salto: null, quietoMs: 0
  };
  var ALTO = 0.13, VMAX = 1.4, VPASO = 0.32;   // u: el alto del gato sentado; u/s: el trote más rápido y el paso tranquilo
  G.ALTO = ALTO;
  function alto() { return E.u * ALTO; }
  G.x = function () { return E.sx(G.xu); };
  G.y = function () { return E.sy(AE.nilo.SUELO); };
  G.cerca = function (x, y, r) { return Math.hypot(x - G.x(), y - (G.y() - alto() * 0.45)) < (r || alto() * 0.6); };

  function cambiar(estado) {
    if (G.estado === estado) return;
    G.poseAntes = poseActual(); G.mezcla = 0;
    G.estado = estado; G.tEstado = 0;
    if (estado === 'dormir') E.emitir('gato', { dormido: true });
  }
  G.cambiar = cambiar;
  // las escenas: llevar al gato a un sitio (andando, o de golpe) y dejarlo en una pose
  G.forzar = function (op) { G.forzado = op || {}; if (op && op.ya) { G.xu = op.xu; G.v = 0; } if (op && op.estado && op.ya) cambiar(op.estado); };
  G.soltar = function () { G.forzado = null; G.quietoMs = 0; };
  G.ocultar = function (si) { G.oculto = si !== false; };
  G.despertar = function () { if (G.estado === 'dormir' || G.estado === 'tumbado') cambiar('sentado'); G.quietoMs = 0; };
  // al tocarlo: se despierta, levanta las orejas y te mira un momento (en el móvil no hay ratón al que mirar)
  G.responder = function () { G.despertar(); G.atento = E.t + 1100; };
  G.alfa = 1;   // (el final lo funde al volver)

  // de paso tranquilo (0) a trote (1), según lo deprisa que va
  function velMarcha() { return U.clamp((Math.abs(G.v) - VPASO * 0.5) / (VMAX - VPASO * 0.5), 0, 1); }
  function poseDe(estado, t) {
    var g = AE.gato; if (!g) return null;
    switch (estado) {
      case 'andar': return g.andar(G.fase, velMarcha());
      case 'lavarse': return g.lavarse(t);
      case 'tumbado': return g.tumbado(t);
      case 'dormir': return g.dormir(t);
      case 'acecho': return g.acecho(t);
      case 'salto': return g.salto(G.salto ? U.clamp(G.salto.k, 0, 1) : 0.5, 0.5);   // (el arco del salto lo pone la pose)
      default: return g.sentado(t);
    }
  }
  function poseActual() {
    var p = poseDe(G.estado, G.tEstado);
    if (p && G.poseAntes && G.mezcla < 1 && AE.gato.mezclar) p = AE.gato.mezclar(G.poseAntes, p, U.inOut(G.mezcla));
    return p;
  }

  // las barcas pasan por delante del gato (flotan más cerca) y tardan 15–20 s en pasar: con la cámara quieta, si una viene
  // hacia él o ya lo tapa, se aparta al lado que la barca ya ha dejado libre (o, si ese queda fuera, muy por delante)
  function apartarse() {
    var V = AE.nilo && AE.nilo.vida, b = null, dm = 0.32;
    if (!V || G.fijo) return null;   // (G.fijo: un secreto lo quiere ahí, como la sombra de la Esfinge)
    for (var i = 0; i < V.length; i++) {
      var c = V[i]; if ((c.tipo !== 'barcaVela' && c.tipo !== 'barcaRemos') || !c.v) continue;
      var d = (G.xu - c.xu) * (c.v > 0 ? 1 : -1);   // > 0: la barca viene hacia él
      if (d > -0.3 && d < dm) { dm = d; b = c; }
    }
    if (!b) return null;
    var sg = b.v > 0 ? 1 : -1, tras = E.sx(b.xu - sg * 0.38);
    return tras > E.W * 0.06 && tras < E.W * 0.94 ? tras : U.clamp(E.sx(b.xu + sg * 0.62), E.W * 0.06, E.W * 0.94);
  }

  /* ---------- un paso ---------- */
  G.actualizar = function (dt) {
    var seg = dt / 1000, s = E.u, x = G.x(), quieta = Math.abs(E.camVel) < 0.02, F = G.forzado;
    G.tEstado += dt; if (G.mezcla < 1) G.mezcla = Math.min(1, G.mezcla + dt / 520);
    // ---- adónde quiere ir
    var vObj = 0;
    if (F && F.xu != null && !F.ya) {
      // (dentro de la pantalla: en un móvil, los sitios pensados para 1.440 px lo dejaban fuera)
      var fx = E.escena ? U.clamp(F.xu, E.xuDe(E.W * 0.12), E.xuDe(E.W * 0.88)) : F.xu, d = fx - G.xu;   // (solo en las escenas: la Esfinge lo necesita exacto)
      vObj = U.clamp(d * 3, -VMAX, VMAX); if (Math.abs(d) < 0.01) { vObj = 0; G.xu = fx; }
    } else if (!F && G.estado !== 'salto' && G.estado !== 'acecho') {
      var vCam = E.camVel * 1000 / s, objX;
      if (!quieta) objX = E.camVel > 0 ? E.W * 0.36 : E.W * 0.64;
      else if (x < E.W * 0.08) objX = E.W * 0.2; else if (x > E.W * 0.92) objX = E.W * 0.8; else objX = null;
      if (quieta && objX == null) objX = apartarse();
      // (mientras la cámara corre, puede ir a su velocidad y un poco más: con las flechas o un trackpad decidido se quedaba
      // fuera de la pantalla casi todo el viaje)
      var vmax = quieta ? VMAX : Math.max(VMAX, Math.abs(vCam) + 0.3);
      if (objX != null) vObj = (quieta ? 0 : vCam) + U.clamp((objX - x) / s * 2.4, -vmax, vmax);
      vObj = U.clamp(vObj, -vmax, vmax);
      // si se ha quedado muy atrás (un salto del mapa), aparece justo fuera de la pantalla y entra trotando
      if (x < -E.W * 0.25 || x > E.W * 1.25) { G.xu = E.xuDe(x < 0 ? -alto() : E.W + alto()); G.v = vObj; }
      if (G.estado === 'dormir' || G.estado === 'tumbado') { if (Math.abs(vObj) > 0.15) G.despertar(); else vObj = 0; }
    }
    // ---- aceleración suave (un gato no arranca de golpe)
    var acel = Math.abs(vObj) > Math.abs(G.v) ? 2.2 : 3.2;
    G.v += U.clamp(vObj - G.v, -acel * seg, acel * seg);
    if (G.estado !== 'salto') G.xu = U.clamp(G.xu + G.v * seg, 0.12, E.largo - 0.3);
    if (Math.abs(G.v) > 0.03) G.dir = G.v > 0 ? 1 : -1;
    // la marcha: la fase avanza con lo recorrido, para que las patas no resbalen
    var zancada = AE.gato && AE.gato.zancada ? AE.gato.zancada(alto(), velMarcha()) : alto() * 0.9;
    G.fase = (G.fase + Math.abs(G.v) * seg * s / zancada) % 1;
    // ---- el estado
    if (G.estado === 'salto') {
      G.salto.k += dt / G.salto.dur;
      G.xu = U.lerp(G.salto.x0, G.salto.x1, U.clamp(G.salto.k, 0, 1));
      if (G.salto.k >= 1) { G.salto = null; cambiar('sentado'); }
    } else if (Math.abs(G.v) > 0.05) { if (G.estado !== 'andar') cambiar('andar'); G.quietoMs = 0; }
    else if (G.estado === 'andar') cambiar(F && F.estado ? F.estado : 'sentado');
    else if (F && F.estado && G.estado !== F.estado && G.estado !== 'acecho') cambiar(F.estado);
    else if (!F) idle(dt);
    // ---- la mirada (al ratón, si está cerca) y el parpadeo
    var p = E.puntero, mObj = 0, oObj = 0.25;
    if (p.sobre && !F) {
      var dx = (p.x - x) * G.dir, dy = (G.y() - alto() * 0.75) - p.y, dist = Math.hypot(dx, dy);
      if (dist < s * 0.6 && dx > -s * 0.05) { mObj = U.clamp(Math.atan2(dy, Math.max(20, dx)), -0.45, 0.7); oObj = 1; }
    }
    if (E.t < (G.atento || 0)) { mObj = 0.4; oObj = 1; }
    G.mirada += (mObj - G.mirada) * (1 - Math.exp(-dt / 160));
    G.orejas += (oObj - G.orejas) * (1 - Math.exp(-dt / 220));
    var ciclo = (E.t % 4300) / 4300; G.parpadeo = G.estado === 'dormir' ? 1 : ciclo > 0.955 ? Math.sin((ciclo - 0.955) / 0.045 * Math.PI) : 0;
  };
  // lo que hace cuando no pasa nada: sentado; a los 9 s se lava; si no tocas nada en 25 s se echa, y a los 34 s se duerme
  function idle(dt) {
    var inactivo = E.t - E.ultimoInput;
    if (G.estado === 'acecho') {
      if (G.tEstado > 850) {
        var p = E.puntero, haciaXu = E.xuDe(p.x), dir = haciaXu >= G.xu ? 1 : -1;
        var dest = U.clamp(haciaXu - dir * 0.1, G.xu - 0.35, G.xu + 0.35);   // (cae al lado del ratón, mirándolo)
        G.salto = { x0: G.xu, x1: dest, k: 0, dur: 620 }; G.dir = dir; cambiar('salto');
      }
      return;
    }
    if (G.estado === 'sentado' && G.tEstado > 9000 && inactivo < 25000) cambiar('lavarse');
    else if (G.estado === 'lavarse' && G.tEstado > 6200) cambiar('sentado');
    if (inactivo > 34000 && G.estado !== 'dormir') cambiar('dormir');   // (también con el papiro abierto: lo pide el secreto de la Esfinge)
    else if (inactivo > 25000 && (G.estado === 'sentado' || G.estado === 'lavarse')) cambiar('tumbado');
    else if (inactivo < 400 && (G.estado === 'dormir' || G.estado === 'tumbado')) cambiar('sentado');
    // el ratón que corretea por el suelo delante de él: se agazapa y salta
    var q = E.puntero, s = E.u;
    if ((G.estado === 'sentado' || G.estado === 'lavarse') && q.sobre && q.tipo === 'mouse' && !(E.senal > 0.25) && q.velocidad > 0.9 && Math.abs(q.y - G.y()) < s * 0.05 && Math.abs(q.x - G.x()) < s * 0.32 && Math.abs(q.x - G.x()) > s * 0.06) {
      G.dir = q.x > G.x() ? 1 : -1; cambiar('acecho');
    }
  }

  /* ---------- dibujar ---------- */
  G.dibujar = function (ctx) {
    if (G.oculto || G.alfa <= 0.01) return;
    var x = G.x(), y = G.y(), h = alto();
    if (x < -h * 2 || x > E.W + h * 2) return;
    ctx.save(); ctx.globalAlpha *= G.alfa;
    try { dibujarGato(ctx, x, y, h); } finally { ctx.restore(); }
  };
  function dibujarGato(ctx, x, y, h) {
    // la sombra en el suelo
    ctx.fillStyle = 'rgba(40,24,8,0.16)'; ctx.beginPath(); ctx.ellipse(x, G.y() + h * 0.02, h * 0.42, h * 0.05, 0, 0, TAU); ctx.fill();
    var g = AE.gato, pose = poseActual();
    if (g && pose) { ctx.save(); try { g.dibujar(ctx, x, y, h, pose, { espejo: G.dir < 0, mirada: G.mirada, parpadeo: G.parpadeo, orejas: G.orejas }); } catch (err) { console.error('gato', err); } ctx.restore(); return; }
    // (sin el arte todavía: una silueta provisional)
    ctx.save(); ctx.translate(x, y); if (G.dir < 0) ctx.scale(-1, 1);
    ctx.fillStyle = '#1d2233';
    ctx.beginPath(); ctx.ellipse(0, -h * 0.32, h * 0.2, h * 0.3, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(h * 0.08, -h * 0.72, h * 0.13, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(h * 0.0, -h * 0.8); ctx.lineTo(h * 0.04, -h); ctx.lineTo(h * 0.1, -h * 0.82); ctx.moveTo(h * 0.12, -h * 0.82); ctx.lineTo(h * 0.2, -h * 0.98); ctx.lineTo(h * 0.2, -h * 0.76); ctx.fill();
    ctx.restore();
  };
  // al empezar la primera vez, el gato duerme y se despierta con el amanecer
  E.en('empezar', function () { G.estado = 'dormir'; setTimeout(function () { G.despertar(); }, 3200); });
})();

/* Aegyptus Incognita · sonido
   Todo sintetizado con Web Audio, sin archivos:
   - el ambiente: el viento del desierto (ruido filtrado que sigue al viento), el río que corre, las olas cerca del mar,
     pájaros de día, grillos de noche y el gato, que ronronea cuando duerme a tu lado;
   - la música (26-10-2026), árabe de Egipto (antes era un arpa que soltaba notas sueltas al azar, igual que el koto de
     Iaponia, y sonaban iguales):
     · las frases van en un maqam: Hiyaz de día (re, mi♭, fa♯, sol, la, si♭, do: la segunda aumentada que todo el mundo
       reconoce) y Bayati al atardecer y de noche (con el mi a un cuarto de tono, que no se puede tocar en un piano);
     · la flauta ney las toca con una sola voz que liga las notas, con su soplo, sus adornos y el vibrato en las largas, y el
       laúd (oud) las dobla una octava más abajo o le contesta, como se hace en la música árabe (heterofonía);
     · la darbuka lleva el ritmo con el riq (el pandero de sonajas): saidi, el del Alto Egipto, en el sur, y maqsum, el más
       común, en el norte; al atardecer, más lento; de noche, nada;
     · al amanecer y de noche, un bordón grave de caña, como el del arghul;
     · cambia con la hora del viaje, y durante las escenas baja para dejar sonar lo suyo;
   - al descubrir un secreto, el pandero y el sistro (el sonajero de Hathor) y un glissando del qanún (la cítara árabe);
     cada escena con lo suyo: el amanecer, la flauta del sueño de la Esfinge, el maullido del gato, el fuego del faro…;
   - el cálamo raspa el papiro al escribir.
   (La música del Egipto antiguo no se conserva. Los maqamat y los ritmos son de la música árabe posterior, la que hoy
   suena a Egipto; la flauta de caña, el laúd, el pandero y el sistro ya se tocaban en el Egipto antiguo.)
   Empieza apagado: el botón ♪ lo enciende y se recuerda. Los navegadores solo dejan sonar después de un gesto. Con la
   pestaña oculta se suspende todo.
   S.renderizar(segundos, { hora, xu }) devuelve la música sin tiempo real (OfflineAudioContext), para el laboratorio. */
(function () {
  'use strict';
  var AE = window.AE, E = AE.motor, U = AE.util, CLAVE = 'aegyptus-incognita.sonido';
  var S = AE.sonido = { activo: false };
  // (ac, master, salaEnv, ruido y cache se cambian por los de un contexto sin tiempo real al renderizar)
  var ac = null, master, salaEnv, ruido, cache = {}, mus = null;
  var vientoF, vientoG, rioF, rioG, olasF, olasG, grillosG, ronroneoG;

  /* ---------- las alturas ---------- */
  var RE = 293.66;   // re4: la tónica (la ney en re)
  // en cents desde re; los de Hiyaz, algo más bajos que en un piano, como se tocan
  var MAQAM = {
    hiyaz: [0, 95, 385, 500, 700, 800, 1000],    // re, mi♭, fa♯, sol, la, si♭, do
    bayati: [0, 150, 300, 500, 700, 800, 1000]   // re, mi medio bemol, fa, sol, la, si♭, do
  };
  function frec(maqam, g) { var c = MAQAM[maqam] || MAQAM.hiyaz, o = Math.floor(g / 7), i = g - o * 7; return RE * Math.pow(2, o + c[i] / 1200); }

  /* ---------- el contexto y el ambiente ---------- */
  function sala(seg, caida) {   // la reverberación de una sala de piedra, como dentro de un templo
    var n = Math.floor(ac.sampleRate * seg), b = ac.createBuffer(2, n, ac.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, caida); }
    return b;
  }
  function bufferRuido(seg) {
    var n = Math.floor(ac.sampleRate * seg), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0), b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
    return b;
  }
  // lo común a cualquier contexto: la salida, la sala y el ruido
  function base(nivel) {
    master = ac.createGain(); master.gain.value = nivel; master.connect(ac.destination);
    var conv = ac.createConvolver(); conv.buffer = sala(3.6, 2.4);
    salaEnv = ac.createGain(); salaEnv.gain.value = 0.5; salaEnv.connect(conv); var rv = ac.createGain(); rv.gain.value = 0.4; conv.connect(rv); rv.connect(master);
    ruido = bufferRuido(4);
  }
  function fuente(desde) { var s = ac.createBufferSource(); s.buffer = ruido; s.loop = true; s.start(0, desde || 0); return s; }
  function crear() {
    var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return false;
    ac = new Ctx(); base(0);
    // el viento: ruido rosa por un pasa-banda que se mueve
    vientoF = ac.createBiquadFilter(); vientoF.type = 'bandpass'; vientoF.frequency.value = 380; vientoF.Q.value = 0.6;
    vientoG = ac.createGain(); vientoG.gain.value = 0; fuente(0).connect(vientoF); vientoF.connect(vientoG); vientoG.connect(master); vientoG.connect(salaEnv);
    // el río: un rumor de agua que sube y baja
    rioF = ac.createBiquadFilter(); rioF.type = 'bandpass'; rioF.frequency.value = 900; rioF.Q.value = 0.4;
    rioG = ac.createGain(); rioG.gain.value = 0; fuente(1.1).connect(rioF); rioF.connect(rioG); rioG.connect(master);
    // las olas del mar, al final
    olasF = ac.createBiquadFilter(); olasF.type = 'lowpass'; olasF.frequency.value = 520;
    olasG = ac.createGain(); olasG.gain.value = 0; fuente(2.3).connect(olasF); olasF.connect(olasG); olasG.connect(master);
    // los grillos de noche: un tono agudo que se corta en pulsos
    var gr = ac.createOscillator(); gr.frequency.value = 4400; var am = ac.createGain(); am.gain.value = 0;
    var pul = ac.createOscillator(); pul.type = 'square'; pul.frequency.value = 28; var pg = ac.createGain(); pg.gain.value = 0.5; pul.connect(pg); pg.connect(am.gain);
    var tr = ac.createOscillator(); tr.frequency.value = 0.9; var tg = ac.createGain(); tg.gain.value = 0.5; tr.connect(tg); tg.connect(am.gain);
    grillosG = ac.createGain(); grillosG.gain.value = 0; gr.connect(am); am.connect(grillosG); grillosG.connect(master); gr.start(); pul.start(); tr.start();
    // el ronroneo: ruido muy grave que late unas 25 veces por segundo
    var rf = ac.createBiquadFilter(); rf.type = 'lowpass'; rf.frequency.value = 140; var ra = ac.createGain(); ra.gain.value = 0.5;
    var ro = ac.createOscillator(); ro.frequency.value = 25; var rog = ac.createGain(); rog.gain.value = 0.5; ro.connect(rog); rog.connect(ra.gain); ro.start();
    ronroneoG = ac.createGain(); ronroneoG.gain.value = 0; fuente(3.1).connect(rf); rf.connect(ra); ra.connect(ronroneoG); ronroneoG.connect(master);
    mus = crearMusica(master);
    return true;
  }
  // una salida con su volumen y, si se pide, algo de sala
  function salida(nodo, vol, mas, dest) {
    var g = ac.createGain(); g.gain.value = vol; nodo.connect(g); g.connect(dest || master);
    if (mas) { var g2 = ac.createGain(); g2.gain.value = mas; g.connect(g2); g2.connect(salaEnv); }
    return g;
  }
  function golpe(cuando, dur, f, vol, tipo, dest, q) {   // un golpe de ruido filtrado
    var s = ac.createBufferSource(); s.buffer = ruido; var fl = ac.createBiquadFilter(); fl.type = tipo || 'lowpass'; fl.frequency.value = f; fl.Q.value = q || (tipo === 'bandpass' ? 2 : 0.7);
    var g = ac.createGain(); g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(vol, cuando + Math.min(0.006, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
    s.connect(fl); fl.connect(g); salida(g, 1, 0.3, dest);
    s.start(cuando, Math.random() * 2, dur + 0.05);
  }

  /* ---------- los instrumentos ---------- */
  // una cuerda pulsada (Karplus-Strong), ya calculada y guardada. brillo: cuánto peso tiene la muestra actual en el filtro
  // del lazo (0,5 = el clásico; más = más brillante); caida: lo que pierde en cada vuelta; pua: qué trozo de la cuerda
  // se excita (con púa, uno corto: un ataque más seco y con más armónicos)
  function cuerda(f, seg, brillo, caida, pua) {
    var clave = Math.round(f * 10) + '|' + seg + '|' + brillo + '|' + caida + '|' + pua; if (cache[clave]) return cache[clave];
    var sr = ac.sampleRate, n = Math.floor(sr * seg), b = ac.createBuffer(1, n, sr), d = b.getChannelData(0);
    var N = Math.max(2, Math.round(sr / f)), anillo = new Float32Array(N), largo = Math.max(2, Math.round(N * (pua || 1))), k = 0;
    for (var i = 0; i < largo; i++) anillo[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / largo);
    var a1 = brillo, a0 = 1 - brillo;
    for (var j = 0; j < n; j++) { var a = anillo[k], s = anillo[(k + 1) % N]; anillo[k] = (a * a1 + s * a0) * caida; d[j] = a * Math.min(1, j / 12); k = (k + 1) % N; }
    return (cache[clave] = b);
  }
  // el laúd (oud): dos cuerdas por orden, un pelo desafinadas (su coro), púa, la caja que resuena en el grave y nada de
  // agudo metálico
  function oud(f, t, vol, dest, ligero) {
    var cuerpo = ac.createBiquadFilter(); cuerpo.type = 'peaking'; cuerpo.frequency.value = 230; cuerpo.Q.value = 1.1; cuerpo.gain.value = 6;
    var caja = ac.createBiquadFilter(); caja.type = 'lowpass'; caja.frequency.value = 2100; caja.Q.value = 0.5;
    (ligero ? [1] : [1, 1.0019]).forEach(function (d, i) {
      var s = ac.createBufferSource(); s.buffer = cuerda(f * d, 2.2, 0.53, 0.9965, 0.3);
      var g = ac.createGain(); g.gain.value = i ? 0.75 : 1; s.connect(g); g.connect(cuerpo); s.start(t + i * 0.005);
    });
    cuerpo.connect(caja); salida(caja, vol, 0.35, dest);
    if (!ligero) golpe(t, 0.025, 1400, vol * 0.18, 'bandpass', dest, 1);   // (el toque de la púa)
  }
  // el trémolo del laúd (rish): la misma nota pulsada muy deprisa, para sostener las notas largas
  function rish(f, t, dur, vol, dest) { for (var x = 0, i = 0; x < dur - 0.05; x += 0.09, i++) oud(f, t + x, vol * (i ? 0.55 + 0.1 * Math.sin(i) : 1) * (1 - x / dur * 0.4), dest, i > 0); }   // (las repeticiones, con una sola cuerda: cuestan la mitad)
  // el qanún: la cítara árabe, brillante, para los glissandos
  function qanun(f, t, vol, dest) { var s = ac.createBufferSource(); s.buffer = cuerda(f, 2.4, 0.72, 0.9975, 0.16); salida(s, vol, 0.6, dest); s.start(t); }
  function glissando(t, desde, hasta, paso, vol, maqam, dest) {
    var dir = hasta >= desde ? 1 : -1, k = 0;
    for (var g = desde; dir > 0 ? g <= hasta : g >= hasta; g += dir, k++) qanun(frec(maqam, g), t + k * paso, vol * (0.7 + 0.3 * k / Math.abs(hasta - desde || 1)), dest);
  }
  /* la flauta ney: una frase entera con una sola voz, como se toca (las notas se ligan con un deslizamiento corto), con el
     aire que suena, un segundo armónico suave, la entrada un poco baja que sube, un leve bajón antes de cada nota y el
     vibrato que crece en las largas. notas: [[f, t, dur, vol], …] */
  function ney(notas, dest) {
    if (!notas.length) return;
    var t0 = notas[0][1], u = notas[notas.length - 1], fin = u[1] + u[2];
    var o = ac.createOscillator(), o2 = ac.createOscillator(), g2 = ac.createGain(), env = ac.createGain();
    var vib = ac.createOscillator(), vg = ac.createGain(); vib.frequency.value = 5.3; vg.gain.value = 0; vib.connect(vg); vg.connect(o.detune); vg.connect(o2.detune);
    g2.gain.value = 0.12; o.connect(env); o2.connect(g2); g2.connect(env);
    var aire = ac.createBufferSource(); aire.buffer = ruido; aire.loop = true;
    var af = ac.createBiquadFilter(); af.type = 'bandpass'; af.Q.value = 2.4; var ag = ac.createGain(); ag.gain.value = 0.3;
    aire.connect(af); af.connect(ag); ag.connect(env);
    var suave = ac.createBiquadFilter(); suave.type = 'lowpass'; suave.frequency.value = 2400; env.connect(suave); salida(suave, 1, 0.9, dest);
    env.gain.setValueAtTime(0.0001, t0);
    notas.forEach(function (n, i) {
      var f = n[0], t = n[1], d = n[2], v = n[3];
      if (!i) { o.frequency.setValueAtTime(f * 0.975, t); o2.frequency.setValueAtTime(f * 1.95, t); af.frequency.setValueAtTime(f * 2, t); }
      o.frequency.setTargetAtTime(f, t, i ? 0.018 : 0.05); o2.frequency.setTargetAtTime(f * 2, t, i ? 0.018 : 0.05); af.frequency.setTargetAtTime(f * 2.1, t, 0.03);
      if (i && d > 0.1) env.gain.setTargetAtTime(v * 0.62, t - 0.03, 0.01);
      env.gain.setTargetAtTime(v, t, i ? 0.018 : 0.07);
      vg.gain.setTargetAtTime(0, t, 0.02);
      if (d > 0.5) vg.gain.setTargetAtTime(13, t + 0.28, 0.22);
    });
    env.gain.setTargetAtTime(0.0001, fin - 0.04, 0.11);
    var para = fin + 0.9;
    [o, o2, vib].forEach(function (x) { x.start(t0); x.stop(para); });
    aire.start(t0, Math.random() * 3); aire.stop(para);
  }
  // la darbuka: el «dum» del centro (grave, que cae de tono) y el «tak» y el «ka» del borde (secos, con el anillo de la caja)
  function dum(t, vol, dest) {
    var o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(132, t); o.frequency.exponentialRampToValueAtTime(76, t + 0.12);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.48);
    o.connect(g); salida(g, 1, 0.22, dest); o.start(t); o.stop(t + 0.52);
    golpe(t, 0.045, 600, vol * 0.45, 'lowpass', dest);
  }
  function tak(t, vol, dest, fr) {
    golpe(t, 0.055, fr || 3300, vol, 'bandpass', dest, 1.3);
    var o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(fr ? fr * 0.34 : 1150, t); o.frequency.exponentialRampToValueAtTime(fr ? fr * 0.28 : 940, t + 0.05);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * 0.32, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    o.connect(g); salida(g, 1, 0.2, dest); o.start(t); o.stop(t + 0.09);
  }
  // el riq: un golpe corto de sus sonajas de metal
  function riq(t, vol, dest) {
    [5300, 6900, 8200].forEach(function (f, i) {
      var o = ac.createOscillator(), g = ac.createGain(), tt = t + i * 0.005; o.type = 'triangle'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.05);
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(vol / (i + 1), tt + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.11);
      o.connect(g); salida(g, 1, 0.3, dest); o.start(tt); o.stop(tt + 0.13);
    });
    golpe(t, 0.06, 7200, vol * 0.7, 'bandpass', dest, 2);
  }
  // el pandero grande (daf): un golpe grave en el centro y el chasquido del borde
  function pandero(cuando, vol, dest) {
    var o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(110, cuando); o.frequency.exponentialRampToValueAtTime(58, cuando + 0.25);
    g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(vol, cuando + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, cuando + 0.6);
    o.connect(g); salida(g, 1, 0.4, dest); o.start(cuando); o.stop(cuando + 0.7);
    golpe(cuando, 0.08, 1300, vol * 0.4, 'bandpass', dest);
  }
  // el sistro: chapitas de metal que tintinean al agitarlo
  function sistro(cuando, vol, veces) {
    for (var v = 0; v < (veces || 3); v++) {
      var t0 = cuando + v * 0.16;
      [3100, 4250, 5400, 6900].forEach(function (f, i) {
        for (var k = 0; k < 3; k++) {
          var o = ac.createOscillator(), g = ac.createGain(), tt = t0 + k * 0.018 + i * 0.004; o.type = 'triangle'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.04);
          g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(vol * 0.25 / (i + 1), tt + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.22);
          o.connect(g); salida(g, 1, 0.5); o.start(tt); o.stop(tt + 0.25);
        }
      });
      golpe(t0, 0.12, 5200, vol * 0.25, 'bandpass');
    }
  }
  // un zumbido grave que crece (el amanecer, el faro)
  function bordon(cuando, dur, vol, f) {
    [f || 73.42, (f || 73.42) * 1.5, (f || 73.42) * 2].forEach(function (fr, i) {
      var o = ac.createOscillator(), g = ac.createGain(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(vol / (i + 1), cuando + dur * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
      o.connect(g); salida(g, 1, 0.7); o.start(cuando); o.stop(cuando + dur + 0.1);
    });
  }
  // el maullido: una sierra con dos formantes que pasan de «i» a «a» a «u» mientras el tono sube y baja
  function maullido(cuando, vol) {
    var o = ac.createOscillator(); o.type = 'sawtooth'; var d = 0.8;
    o.frequency.setValueAtTime(480, cuando); o.frequency.linearRampToValueAtTime(760, cuando + d * 0.35); o.frequency.linearRampToValueAtTime(430, cuando + d);
    var f1 = ac.createBiquadFilter(), f2 = ac.createBiquadFilter(); f1.type = f2.type = 'bandpass'; f1.Q.value = 6; f2.Q.value = 8;
    f1.frequency.setValueAtTime(380, cuando); f1.frequency.linearRampToValueAtTime(820, cuando + d * 0.4); f1.frequency.linearRampToValueAtTime(360, cuando + d);
    f2.frequency.setValueAtTime(2300, cuando); f2.frequency.linearRampToValueAtTime(1250, cuando + d * 0.45); f2.frequency.linearRampToValueAtTime(820, cuando + d);
    var g = ac.createGain(); g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(vol, cuando + 0.06); g.gain.setValueAtTime(vol, cuando + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, cuando + d);
    o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); salida(g, 1, 0.3);
    o.start(cuando); o.stop(cuando + d + 0.05);
  }
  // un destello: una campanilla aguda y breve
  function campanilla(cuando, vol) {
    [[1568, 1], [2349, 0.5], [3136, 0.3]].forEach(function (p) {
      var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = p[0];
      g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(vol * p[1], cuando + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, cuando + 0.9);
      o.connect(g); salida(g, 1, 0.6); o.start(cuando); o.stop(cuando + 1);
    });
  }
  // un pájaro: dos o tres píos con barridos rápidos de tono
  function pajaro(cuando) {
    var n = 2 + Math.floor(Math.random() * 3), b0 = 2400 + Math.random() * 1600;
    for (var i = 0; i < n; i++) {
      var t0 = cuando + i * (0.09 + Math.random() * 0.05), o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(b0, t0); o.frequency.exponentialRampToValueAtTime(b0 * (1.25 + Math.random() * 0.3), t0 + 0.04); o.frequency.exponentialRampToValueAtTime(b0 * 0.9, t0 + 0.08);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.03, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      o.connect(g); salida(g, 1, 0.6); o.start(t0); o.stop(t0 + 0.1);
    }
  }

  /* ---------- la música ----------
     Va a una rejilla de corcheas (84 negras por minuto) que se programa con medio segundo de adelanto en el reloj del
     audio. Cada compás elige su ritmo; la melodía va por frases: la ney toca una, y el laúd la dobla o le contesta, y
     luego un silencio (más largo de noche). */
  var NEGRA = 60 / 84, CORCHEA = NEGRA / 2;
  var RITMOS = {   // en corcheas: D dum, T tak, . nada (en algunos huecos cae un «ka», un tak suave)
    saidi: 'DT.DD.T.',    // el del Alto Egipto (el sur del friso)
    maqsum: 'DT.TD.T.',   // el más común en Egipto
    wahda: 'D...T...'     // lento, para el atardecer
  };
  // lo que pide la hora y el sitio: qué maqam, cuánta percusión y de qué ritmo, cuánto laúd y cuánto bordón
  function perfilDe(h, xu, noche) {
    var dia = U.clamp(Math.min((h - 7.2) / 1.2, (16.6 - h) / 1.2), 0, 1), tarde = U.clamp(Math.min((h - 15.6) / 1, (19.6 - h) / 1), 0, 1);
    var alba = U.clamp(Math.min((h - 4.6) / 0.8, (8 - h) / 0.8), 0, 1);
    return {
      maqam: h >= 16.2 || h < 4.5 ? 'bayati' : 'hiyaz',
      perc: Math.max(dia, tarde * 0.7), ritmo: dia >= tarde ? (xu < 10.2 ? 'saidi' : 'maqsum') : 'wahda', riq: dia,
      oud: U.clamp(Math.max(dia, tarde) + 0.25, 0, 1), bordon: Math.max(noche, alba) * (1 - dia),
      juntos: dia > 0.5 ? 0.65 : 0.25,   // probabilidad de que el laúd doble a la ney en vez de contestarle
      silencio: 4 + Math.round(noche * 8 + alba * 4)   // corcheas de silencio entre frases
    };
  }
  function perfilAhora() { var N = AE.nilo; return perfilDe(N && N.horaAhora ? N.horaAhora() : 12, E.centroXu ? E.centroXu() : 5, N ? N.noche : 0); }
  function crearMusica(dest, perfilFijo, azar) {
    var bus = ac.createGain(); bus.gain.value = 1; bus.connect(dest);
    // el bordón de caña (re y la graves, con un latido lento): suena siempre y se abre o se cierra
    var bf = ac.createBiquadFilter(); bf.type = 'lowpass'; bf.frequency.value = 430; bf.Q.value = 0.7;
    var trem = ac.createGain(); trem.gain.value = 0.75; var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 0.25; lfo.connect(lg); lg.connect(trem.gain); lfo.start();
    var bg = ac.createGain(); bg.gain.value = 0;
    [[73.42, 0.5, -4], [110.0, 0.28, 3], [146.83, 0.18, 0]].forEach(function (p) {
      var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = p[0]; o.detune.value = p[2];
      var gi = ac.createGain(); gi.gain.value = p[1]; o.connect(gi); gi.connect(bf); o.start();
    });
    bf.connect(trem); trem.connect(bg); salida(bg, 1, 0.5, bus);
    return { bus: bus, bordon: bg, sig: 0, i: 0, libre: 0, patron: RITMOS.maqsum, perfil: null, fijo: perfilFijo || null, azar: azar || Math.random };
  }
  // una frase en el maqam (grados: 0 = re4, 3 = sol, 7 = re5) y sus duraciones en corcheas. Sube por grados conjuntos
  // hacia una cima, a veces la borda, y baja por grados hasta su reposo: en Hiyaz, la cadencia sol–fa♯–mi♭–re
  function componer(m) {
    var a = m.azar, tipo = Math.floor(a() * 4), g, cima, meta;
    if (tipo === 0) { g = 0; cima = 3 + Math.floor(a() * 2); meta = 0; }
    else if (tipo === 1) { g = 3; cima = 4 + Math.floor(a() * 2); meta = a() < 0.5 ? 0 : 3; }
    else if (tipo === 2) { g = 4; cima = 6 + Math.floor(a() * 2); meta = 4; }
    else { g = 6 + Math.floor(a() * 2); cima = g; meta = a() < 0.5 ? 3 : 4; }   // (o empieza arriba y solo baja)
    var gs = [g];
    while (g < cima && gs.length < 7) { g += a() < 0.82 ? 1 : -1; gs.push(g); }
    if (a() < 0.5) gs.push(g + 1, g);
    while (g > meta) { g--; gs.push(g); }
    return gs.map(function (x, i) { return [x, i === gs.length - 1 ? 4 + Math.floor(a() * 3) : (a() < 0.68 ? 1 : 2)]; });
  }
  // una corchea de la rejilla: el ritmo (al empezar cada compás se decide cuál) y, si toca, una frase nueva
  function corchea(m, t) {
    var p = m.fijo || perfilAhora(), a = m.azar, k = m.i % 8, compas = Math.floor(m.i / 8);
    if (!k) { m.perfil = p; m.patron = RITMOS[p.ritmo] || RITMOS.maqsum; }
    var bus = m.bus, hum = function () { return (a() - 0.5) * 0.012; };
    // la forma, cada 16 compases: cuatro suaves (solo el dum del primer tiempo y el tak del tercero), ocho plenos y cuatro
    // en que la percusión descansa (sin ella, todo el rato, cansaba)
    var seccion = Math.floor(compas / 4) % 4, pleno = seccion === 1 || seccion === 2;
    // el bordón, despacio
    m.bordon.gain.setTargetAtTime(0.03 * p.bordon, t, 1.6);
    // la darbuka; al final de cada cuatro compases plenos, un redoble en la última negra
    if (p.perc > 0.02 && seccion !== 3 && (pleno || k === 0 || k === 4)) {
      var c = pleno ? m.patron.charAt(k) : (k ? 'T' : 'D'), v = p.perc * (pleno ? 1 : 0.7);
      if (pleno && compas % 4 === 3 && k >= 6 && p.ritmo !== 'wahda') {
        for (var s = 0; s < 2; s++) tak(t + s * CORCHEA / 2 + hum(), (s ? 0.05 : 0.075) * v, bus, s ? 2600 : 3300);
      } else if (c === 'D') dum(t + hum(), 0.2 * v * (0.9 + a() * 0.15), bus);
      else if (c === 'T') { tak(t + hum(), 0.075 * v * (0.85 + a() * 0.2), bus); if (pleno && p.riq > 0.3 && a() < 0.6) riq(t + 0.004, 0.022 * p.riq, bus); }
      else if (pleno && a() < 0.3) tak(t + hum(), 0.03 * v, bus, 2500);
    }
    // la melodía: cuando ha acabado la anterior y su silencio, otra frase
    if (t >= m.libre - 0.001) {
      var notas = componer(m), mq = p.maqam, tt = t, frase = [], vol = 0.075;
      notas.forEach(function (n, i) {
        var d = n[1] * CORCHEA, f = frec(mq, n[0]);
        // un adorno: la nota de arriba, muy corta, antes de algunas largas
        if (i && n[1] >= 2 && a() < 0.35) { frase.push([frec(mq, n[0] + 1), tt, 0.07, vol * 0.9]); frase.push([f, tt + 0.07, d - 0.07, vol]); }
        else frase.push([f, tt, d, vol * (i === notas.length - 1 ? 1 : 0.92)]);
        tt += d;
      });
      // en la última nota, a veces, un trino que se queda
      var ul = frase[frase.length - 1];
      if (ul[2] > 0.9 && a() < 0.4) {
        var arriba = frec(mq, notas[notas.length - 1][0] + 1); frase.pop();
        for (var q = 0; q < 6; q++) frase.push([q % 2 ? ul[0] : arriba, ul[1] + q * 0.065, 0.065, ul[3] * 0.95]);
        frase.push([ul[0], ul[1] + 0.39, ul[2] - 0.39, ul[3]]);
      }
      ney(frase, bus);
      var fin = tt, juntos = a() < p.juntos;
      if (p.oud > 0.05) {
        // el laúd: o la dobla a la vez, una octava más abajo y solo en las notas largas o en tiempo (heterofonía), o le
        // contesta después con la misma frase, y la nota final en trémolo
        var x = juntos ? t : fin + CORCHEA * 2;
        notas.forEach(function (n, i) {
          var d = n[1] * CORCHEA, f = frec(mq, n[0] - 7), ultima = i === notas.length - 1;
          if (ultima && n[1] >= 4) rish(f, x, d * 0.8, 0.16 * p.oud, bus);
          else if (!juntos || n[1] >= 2 || i === 0) oud(f, x, 0.2 * p.oud * (0.85 + a() * 0.2), bus);
          x += d;
        });
        if (!juntos) fin = x;
      }
      m.libre = fin + CORCHEA * (p.silencio + Math.floor(a() * 7));
    }
    m.i++;
  }
  // programar hasta «hasta» (s, en el reloj del audio)
  function programar(m, hasta) { while (m.sig < hasta) { corchea(m, m.sig); m.sig += CORCHEA; } }

  // la música sin tiempo real, para el laboratorio: { hora, xu, noche, semilla } fijos. Devuelve una promesa con el AudioBuffer
  S.renderizar = function (seg, op) {
    op = op || {};
    var Off = window.OfflineAudioContext || window.webkitOfflineAudioContext, sr = 44100;
    var antes = { ac: ac, master: master, salaEnv: salaEnv, ruido: ruido, cache: cache };
    ac = new Off(2, Math.round(sr * seg), sr); cache = {}; base(0.9);
    var semilla = op.semilla || 7, azar = function () { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
    var m = crearMusica(master, perfilDe(op.hora == null ? 12 : op.hora, op.xu == null ? 5 : op.xu, op.noche || 0), azar);
    m.sig = 0.2; programar(m, seg - 1.5);
    var off = ac;
    ac = antes.ac; master = antes.master; salaEnv = antes.salaEnv; ruido = antes.ruido; cache = antes.cache;
    return new Promise(function (ok) { off.oncomplete = function (e) { ok(e.renderedBuffer); }; var p = off.startRendering(); if (p && p.then) p.then(ok); });
  };
  S.perfilDe = perfilDe;

  /* ---------- lo que suena solo ---------- */
  var proxPajaro = 6;
  function actualizar() {
    if (!ac || !S.activo || ac.state !== 'running') return;
    var t = ac.currentTime, N = AE.nilo, xc = E.centroXu(), noche = N ? N.noche : 0;
    vientoG.gain.setTargetAtTime(0.02 + Math.min(0.14, E.viento * 0.13), t, 0.4);
    vientoF.frequency.setTargetAtTime(240 + E.viento * 800, t, 0.6);
    rioG.gain.setTargetAtTime(0.03 + 0.012 * Math.sin(t * 0.6) * Math.sin(t * 0.23), t, 0.6);
    var mar = U.clamp((xc - (N ? N.COSTA : 16.8) + 0.9) / 1.2, 0, 1);
    olasG.gain.setTargetAtTime(mar * (0.05 + 0.04 * Math.sin(t * 0.7)), t, 0.5);
    grillosG.gain.setTargetAtTime(noche * 0.012, t, 0.8);
    var G = AE.gatoCtl, duerme = G && (G.estado === 'dormir' || G.estado === 'tumbado') && G.x() > 0 && G.x() < E.W ? 1 : 0;
    ronroneoG.gain.setTargetAtTime(duerme * 0.16, t, 0.6);
    // la música: durante las escenas baja (y no empieza frases), para que se oiga lo suyo
    if (mus) {
      mus.bus.gain.setTargetAtTime(E.escena ? 0.16 : 1, t, E.escena ? 0.4 : 1.2);
      if (E.escena) mus.libre = Math.max(mus.libre, t + 1);
      if (mus.sig < t + 0.05) mus.sig = Math.ceil((t + 0.1) / CORCHEA) * CORCHEA;   // (al volver de un silencio, en la rejilla)
      programar(mus, t + 0.5);
    }
    if (t > proxPajaro && noche < 0.5) { pajaro(t); proxPajaro = t + 6 + Math.random() * 12; }
  }
  setInterval(actualizar, 120);

  /* ---------- lo que suena cuando pasa algo ---------- */
  function maqamAhora() { var N = AE.nilo; return perfilDe(N && N.horaAhora ? N.horaAhora() : 12, E.centroXu(), N ? N.noche : 0).maqam; }
  var SONIDOS = {
    amanecer: function (t) {
      bordon(t + 0.2, 6, 0.08);
      var h = function (g) { return frec('hiyaz', g); };
      ney([[h(0), t + 2.0, 0.9, 0.07], [h(1), t + 2.9, 0.35, 0.065], [h(2), t + 3.25, 0.35, 0.065], [h(3), t + 3.6, 1.6, 0.075], [h(2), t + 5.2, 0.3, 0.06], [h(1), t + 5.5, 0.3, 0.06], [h(0), t + 5.8, 1.8, 0.07]]);
    },
    descubrir: function (t) { var mq = maqamAhora(); glissando(t + 0.35, 0, 7, 0.05, 0.14, mq); oud(frec(mq, 0), t + 0.8, 0.22); },
    sueno: function (t) { ney([[293.66, t + 1.0, 3.6, 0.07]]); ney([[311.13, t + 4.8, 1.6, 0.06]]); ney([[293.66, t + 6.6, 4.2, 0.07]]); },
    miau: function (t) { maullido(t + 0.25, 0.22); maullido(t + 1.5, 0.12); },
    faro: function (t) { bordon(t + 0.6, 7, 0.1, 55); golpe(t + 6.2, 3, 700, 0.1); campanilla(t + 6.6, 0.08); },
    final: function (t) {
      pandero(t + 0.2, 0.8); sistro(t + 0.6, 0.6, 4);
      for (var k = 0; k < 8; k++) tak(t + 0.9 + k * 0.09, 0.05 + k * 0.006);
      dum(t + 1.65, 0.22); glissando(t + 1.7, 0, 14, 0.06, 0.16, 'hiyaz'); oud(frec('hiyaz', -7), t + 2.6, 0.24); oud(frec('hiyaz', 0), t + 2.62, 0.18);
      bordon(t + 1, 8, 0.07);
    }
  };
  S.tocar = function (nombre) { if (!ac || !S.activo) return; var f = SONIDOS[nombre]; if (f) f(ac.currentTime); };
  // al empezar cada escena: el pandero y el sistro
  E.en('escena', function (d) { if (!ac || !S.activo || d.fase !== 'inicio') return; var t = ac.currentTime; pandero(t, 0.6); sistro(t + 0.12, 0.45, 2); });
  // el cálamo raspa el papiro al escribir; el destello del clic suena a campanilla
  var trazoOriginal = E.trazo, destelloOriginal = E.destello, ultimoTrazo = 0;
  E.trazo = function (x0, y0, x1, y1) {
    trazoOriginal.apply(this, arguments);
    if (ac && S.activo && ac.currentTime - ultimoTrazo > 0.06) { ultimoTrazo = ac.currentTime; golpe(ultimoTrazo, 0.08, 2600 + Math.hypot(x1 - x0, y1 - y0) * 40, 0.035, 'bandpass'); }
  };
  E.destello = function () { destelloOriginal.apply(this, arguments); if (ac && S.activo) campanilla(ac.currentTime, 0.035); };

  /* ---------- encender y apagar ---------- */
  function despertarAudio() { if (ac && S.activo && ac.state !== 'running' && !document.hidden) { try { ac.resume(); } catch (e) { /* nada */ } } }
  S.encender = function () {
    if (!ac && !crear()) return;
    S.activo = true; despertarAudio();
    master.gain.setTargetAtTime(0.9, ac.currentTime, 0.6);
    if (mus) { mus.sig = 0; mus.libre = ac.currentTime + NEGRA * 2; }   // (la primera frase, tras dos negras)
    try { localStorage.setItem(CLAVE, '1'); } catch (e) { /* nada */ }
    pintarBoton();
  };
  S.apagar = function () {
    S.activo = false; if (ac) master.gain.setTargetAtTime(0, ac.currentTime, 0.25);
    try { localStorage.setItem(CLAVE, '0'); } catch (e) { /* nada */ }
    pintarBoton();
  };
  S.alternar = function () { if (S.activo) S.apagar(); else S.encender(); };
  function pintarBoton() { var bt = document.getElementById('b-sonido'); if (bt) { bt.setAttribute('aria-pressed', S.activo ? 'true' : 'false'); bt.classList.toggle('activo', S.activo); } }
  // si la última vez estaba encendido, se enciende en el primer gesto (los navegadores no dejan antes). El gesto que cae
  // en el propio botón ♪ no cuenta: si no, lo encendía este y lo apagaba el clic del botón (y se guardaba apagado)
  var quiere = false; try { quiere = localStorage.getItem(CLAVE) === '1'; } catch (e) { /* nada */ }
  var b = document.getElementById('b-sonido');
  function primerGesto(ev) {
    if (!quiere) return;
    if (b && ev && ev.target && ev.target.nodeType === 1 && b.contains(ev.target)) return;
    if (!S.activo) S.encender();
    quiere = false;
  }
  // en el iPhone, solo algunos gestos (soltar el dedo, un clic, una tecla) dejan arrancar el audio: se intenta en cada uno
  // mientras no suene
  ['pointerdown', 'pointerup', 'touchend', 'click', 'keydown'].forEach(function (n) {
    window.addEventListener(n, function (ev) { primerGesto(ev); despertarAudio(); }, true);
  });
  if (b) b.addEventListener('click', function (ev) { ev.stopPropagation(); quiere = false; S.alternar(); });
  // con la pestaña oculta se suspende todo (el viento, el río y los grillos seguían sonando); al volver, si estaba encendido
  document.addEventListener('visibilitychange', function () {
    if (!ac) return;
    if (document.hidden) { try { ac.suspend(); } catch (e) { /* nada */ } }
    else despertarAudio();
  });
  pintarBoton();
})();

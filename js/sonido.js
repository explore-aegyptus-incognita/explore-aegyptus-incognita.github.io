/* Aegyptus Incognita · sonido
   Todo sintetizado con Web Audio, sin archivos:
   - el viento del desierto (ruido filtrado que sigue al viento), el río que corre, las olas cerca del mar, pájaros de
     día y grillos de noche;
   - un arpa (cuerda pulsada, Karplus-Strong) que suelta notas sueltas de vez en cuando;
   - al descubrir un secreto, un pandero y un sistro (el sonajero de Hathor), y cada escena con lo suyo: el amanecer, la
     flauta ney del sueño de la Esfinge, el maullido del gato, el fuego del faro…;
   - el cálamo raspa el papiro al escribir y el gato ronronea cuando duerme a tu lado.
   (La música del Egipto antiguo no se conserva: el arpa usa una escala moderna que suena a Egipto, no una reconstrucción.)
   Empieza apagado: el botón ♪ lo enciende y se recuerda. Los navegadores solo dejan sonar después de un gesto. */
(function () {
  'use strict';
  var AE = window.AE, E = AE.motor, U = AE.util, CLAVE = 'aegyptus-incognita.sonido';
  var S = AE.sonido = { activo: false };
  var ac = null, master, salaEnv, ruido, vientoF, vientoG, rioF, rioG, olasF, olasG, grillosG, ronroneoG, ksCache = {};
  // re frigio dominante (la escala que hoy suena «a Egipto»): re, mi bemol, fa sostenido, sol, la, si bemol, do
  var ESCALA = [293.66, 311.13, 369.99, 392.0, 440.0, 466.16, 523.25, 587.33, 622.25, 739.99, 783.99, 880.0];

  function crear() {
    var Ctx = window.AudioContext || window.webkitAudioContext; if (!Ctx) return false;
    ac = new Ctx();
    master = ac.createGain(); master.gain.value = 0; master.connect(ac.destination);
    // la sala: una reverberación larga, como dentro de un templo de piedra
    var conv = ac.createConvolver(); conv.buffer = impulso(3.6, 2.4);
    salaEnv = ac.createGain(); salaEnv.gain.value = 0.5; salaEnv.connect(conv); var rv = ac.createGain(); rv.gain.value = 0.4; conv.connect(rv); rv.connect(master);
    ruido = bufferRuido(4);
    function fuente(desde) { var s = ac.createBufferSource(); s.buffer = ruido; s.loop = true; s.start(0, desde || 0); return s; }
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
    return true;
  }
  function bufferRuido(seg) {
    var n = Math.floor(ac.sampleRate * seg), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0), b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
    return b;
  }
  function impulso(seg, caida) {
    var n = Math.floor(ac.sampleRate * seg), b = ac.createBuffer(2, n, ac.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, caida); }
    return b;
  }
  function salida(nodo, vol, sala) { var g = ac.createGain(); g.gain.value = vol; nodo.connect(g); g.connect(master); if (sala) { var g2 = ac.createGain(); g2.gain.value = sala; g.connect(g2); g2.connect(salaEnv); } return g; }
  // una cuerda de arpa (Karplus-Strong): el ataque brillante y una caída larga y limpia
  function cuerda(f, seg) {
    var clave = Math.round(f * 10); if (ksCache[clave]) return ksCache[clave];
    var sr = ac.sampleRate, n = Math.floor(sr * seg), b = ac.createBuffer(1, n, sr), d = b.getChannelData(0), N = Math.max(2, Math.round(sr / f)), anillo = new Float32Array(N), k = 0;
    for (var i = 0; i < N; i++) anillo[i] = (Math.random() * 2 - 1) * (0.5 + 0.5 * Math.sin(Math.PI * i / N));
    for (var j = 0; j < n; j++) { var a = anillo[k], s = anillo[(k + 1) % N]; anillo[k] = (a * 0.5 + s * 0.5) * 0.9978; d[j] = a * Math.min(1, j / 30); k = (k + 1) % N; }
    return (ksCache[clave] = b);
  }
  function arpa(f, cuando, vol) { var s = ac.createBufferSource(); s.buffer = cuerda(f, 3.6); salida(s, vol == null ? 0.26 : vol, 1); s.start(cuando); }
  function arpegio(cuando, notas, paso, vol) { notas.forEach(function (i, k) { arpa(ESCALA[i % ESCALA.length] * (i >= ESCALA.length ? 2 : 1), cuando + k * paso, vol); }); }
  function golpeRuido(cuando, dur, frec, vol, tipo) {
    var s = ac.createBufferSource(); s.buffer = ruido; var f = ac.createBiquadFilter(); f.type = tipo || 'lowpass'; f.frequency.value = frec; f.Q.value = tipo === 'bandpass' ? 2 : 0.7;
    var g = ac.createGain(); g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(vol, cuando + Math.min(0.02, dur * 0.2)); g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
    s.connect(f); f.connect(g); g.connect(master); var g2 = ac.createGain(); g2.gain.value = 0.3; g.connect(g2); g2.connect(salaEnv);
    s.start(cuando, Math.random() * 2, dur + 0.05);
  }
  // el pandero: un golpe grave en el centro y el chasquido del borde
  function pandero(cuando, vol) {
    var o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(110, cuando); o.frequency.exponentialRampToValueAtTime(58, cuando + 0.25);
    g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(vol, cuando + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, cuando + 0.6);
    o.connect(g); g.connect(master); var g2 = ac.createGain(); g2.gain.value = 0.4; g.connect(g2); g2.connect(salaEnv); o.start(cuando); o.stop(cuando + 0.7);
    golpeRuido(cuando, 0.08, 1300, vol * 0.4, 'bandpass');
  }
  // el sistro: chapitas de metal que tintinean al agitarlo
  function sistro(cuando, vol, veces) {
    for (var v = 0; v < (veces || 3); v++) {
      var t0 = cuando + v * 0.16;
      [3100, 4250, 5400, 6900].forEach(function (f, i) {
        for (var k = 0; k < 3; k++) {
          var o = ac.createOscillator(), g = ac.createGain(), tt = t0 + k * 0.018 + i * 0.004; o.type = 'triangle'; o.frequency.value = f * (1 + (Math.random() - 0.5) * 0.04);
          g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(vol * 0.25 / (i + 1), tt + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.22);
          o.connect(g); g.connect(master); var g2 = ac.createGain(); g2.gain.value = 0.5; g.connect(g2); g2.connect(salaEnv); o.start(tt); o.stop(tt + 0.25);
        }
      });
      golpeRuido(t0, 0.12, 5200, vol * 0.25, 'bandpass');
    }
  }
  // la flauta ney: un tono soplado (seno con vibrato y mucho aire) que crece y se apaga
  function ney(f, cuando, dur, vol) {
    var o = ac.createOscillator(), g = ac.createGain(), vib = ac.createOscillator(), gv = ac.createGain();
    o.frequency.value = f; vib.frequency.value = 5.2; gv.gain.value = f * 0.007; vib.connect(gv); gv.connect(o.frequency);
    g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(vol, cuando + dur * 0.3); g.gain.setValueAtTime(vol, cuando + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
    o.connect(g); g.connect(master); var g2 = ac.createGain(); g2.gain.value = 0.9; g.connect(g2); g2.connect(salaEnv);
    o.start(cuando); vib.start(cuando); o.stop(cuando + dur + 0.1); vib.stop(cuando + dur + 0.1);
    golpeRuido(cuando, dur, f * 2.2, vol * 0.35, 'bandpass');
  }
  // un zumbido grave que crece (el amanecer, el faro)
  function bordon(cuando, dur, vol, f) {
    [f || 73.42, (f || 73.42) * 1.5, (f || 73.42) * 2].forEach(function (fr, i) {
      var o = ac.createOscillator(), g = ac.createGain(); o.type = i ? 'sine' : 'triangle'; o.frequency.value = fr;
      g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(vol / (i + 1), cuando + dur * 0.45); g.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
      o.connect(g); g.connect(master); var g2 = ac.createGain(); g2.gain.value = 0.7; g.connect(g2); g2.connect(salaEnv); o.start(cuando); o.stop(cuando + dur + 0.1);
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
    o.connect(f1); o.connect(f2); f1.connect(g); f2.connect(g); g.connect(master); var g2 = ac.createGain(); g2.gain.value = 0.3; g.connect(g2); g2.connect(salaEnv);
    o.start(cuando); o.stop(cuando + d + 0.05);
  }
  // un destello: una campanilla aguda y breve
  function campanilla(cuando, vol) {
    [[1568, 1], [2349, 0.5], [3136, 0.3]].forEach(function (p) {
      var o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = p[0];
      g.gain.setValueAtTime(0.0001, cuando); g.gain.exponentialRampToValueAtTime(vol * p[1], cuando + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, cuando + 0.9);
      o.connect(g); g.connect(master); var g2 = ac.createGain(); g2.gain.value = 0.6; g.connect(g2); g2.connect(salaEnv); o.start(cuando); o.stop(cuando + 1);
    });
  }
  // un pájaro: dos o tres píos con barridos rápidos de tono
  function pajaro(cuando) {
    var n = 2 + Math.floor(Math.random() * 3), base = 2400 + Math.random() * 1600;
    for (var i = 0; i < n; i++) {
      var t0 = cuando + i * (0.09 + Math.random() * 0.05), o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(base, t0); o.frequency.exponentialRampToValueAtTime(base * (1.25 + Math.random() * 0.3), t0 + 0.04); o.frequency.exponentialRampToValueAtTime(base * 0.9, t0 + 0.08);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.03, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      o.connect(g); g.connect(master); var g2 = ac.createGain(); g2.gain.value = 0.6; g.connect(g2); g2.connect(salaEnv); o.start(t0); o.stop(t0 + 0.1);
    }
  }

  /* --- lo que suena solo --- */
  var proxArpa = 4, proxPajaro = 6;
  function actualizar() {
    if (!ac || !S.activo) return;
    var t = ac.currentTime, N = AE.nilo, xc = E.centroXu(), noche = N ? N.noche : 0;
    vientoG.gain.setTargetAtTime(0.02 + Math.min(0.14, E.viento * 0.13), t, 0.4);
    vientoF.frequency.setTargetAtTime(240 + E.viento * 800, t, 0.6);
    rioG.gain.setTargetAtTime(0.03 + 0.012 * Math.sin(t * 0.6) * Math.sin(t * 0.23), t, 0.6);
    var mar = U.clamp((xc - (N ? N.COSTA : 16.8) + 0.9) / 1.2, 0, 1);
    olasG.gain.setTargetAtTime(mar * (0.05 + 0.04 * Math.sin(t * 0.7)), t, 0.5);
    grillosG.gain.setTargetAtTime(noche * 0.012, t, 0.8);
    var G = AE.gatoCtl, duerme = G && (G.estado === 'dormir' || G.estado === 'tumbado') && G.x() > 0 && G.x() < E.W ? 1 : 0;
    ronroneoG.gain.setTargetAtTime(duerme * 0.16, t, 0.6);
    if (t > proxArpa && !E.escena) {
      var i = Math.floor(Math.random() * 8); arpa(ESCALA[i], t, 0.14 + Math.random() * 0.06);
      if (Math.random() < 0.4) arpa(ESCALA[i + 2 < ESCALA.length ? i + 2 : i], t + 0.3 + Math.random() * 0.3, 0.1);
      proxArpa = t + 4 + Math.random() * 7;
    }
    if (t > proxPajaro && noche < 0.5) { pajaro(t); proxPajaro = t + 6 + Math.random() * 12; }
  }
  setInterval(actualizar, 120);

  /* --- lo que suena cuando pasa algo --- */
  var SONIDOS = {
    amanecer: function (t) { bordon(t + 0.2, 5, 0.09); arpegio(t + 2.2, [0, 2, 3, 4, 6, 7], 0.22, 0.2); },
    descubrir: function (t) { arpegio(t + 0.5, [4, 3, 2, 0], 0.16, 0.16); },
    sueno: function (t) { ney(293.66, t + 1.0, 3.6, 0.07); ney(311.13, t + 4.8, 1.6, 0.06); ney(293.66, t + 6.6, 4.2, 0.07); },
    miau: function (t) { maullido(t + 0.25, 0.22); maullido(t + 1.5, 0.12); },
    faro: function (t) { bordon(t + 0.6, 7, 0.1, 55); golpeRuido(t + 6.2, 3, 700, 0.1); campanilla(t + 6.6, 0.08); },
    final: function (t) { pandero(t + 0.2, 0.8); sistro(t + 0.6, 0.6, 4); arpegio(t + 1.2, [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], 0.2, 0.22); bordon(t + 1, 8, 0.07); }
  };
  S.tocar = function (nombre) { if (!ac || !S.activo) return; var f = SONIDOS[nombre]; if (f) f(ac.currentTime); };
  // al empezar cada escena: el pandero y el sistro
  E.en('escena', function (d) { if (!ac || !S.activo || d.fase !== 'inicio') return; var t = ac.currentTime; pandero(t, 0.6); sistro(t + 0.12, 0.45, 2); });
  // el cálamo raspa el papiro al escribir; el destello del clic suena a campanilla
  var trazoOriginal = E.trazo, destelloOriginal = E.destello, ultimoTrazo = 0;
  E.trazo = function (x0, y0, x1, y1) {
    trazoOriginal.apply(this, arguments);
    if (ac && S.activo && ac.currentTime - ultimoTrazo > 0.06) { ultimoTrazo = ac.currentTime; golpeRuido(ultimoTrazo, 0.08, 2600 + Math.hypot(x1 - x0, y1 - y0) * 40, 0.035, 'bandpass'); }
  };
  E.destello = function () { destelloOriginal.apply(this, arguments); if (ac && S.activo) campanilla(ac.currentTime, 0.035); };

  /* --- encender y apagar --- */
  S.encender = function () {
    if (!ac && !crear()) return;
    if (ac.state === 'suspended') ac.resume();
    S.activo = true; master.gain.setTargetAtTime(0.9, ac.currentTime, 0.6);
    try { localStorage.setItem(CLAVE, '1'); } catch (e) { /* nada */ }
    pintarBoton();
  };
  S.apagar = function () {
    S.activo = false; if (ac) master.gain.setTargetAtTime(0, ac.currentTime, 0.25);
    try { localStorage.setItem(CLAVE, '0'); } catch (e) { /* nada */ }
    pintarBoton();
  };
  S.alternar = function () { if (S.activo) S.apagar(); else S.encender(); };
  function pintarBoton() { var b = document.getElementById('b-sonido'); if (b) { b.setAttribute('aria-pressed', S.activo ? 'true' : 'false'); b.classList.toggle('activo', S.activo); } }
  // si la última vez estaba encendido, se enciende en el primer gesto (los navegadores no dejan antes)
  var quiere = false; try { quiere = localStorage.getItem(CLAVE) === '1'; } catch (e) { /* nada */ }
  function primerGesto() { if (quiere && !S.activo) S.encender(); window.removeEventListener('pointerdown', primerGesto, true); window.removeEventListener('keydown', primerGesto, true); }
  window.addEventListener('pointerdown', primerGesto, true); window.addEventListener('keydown', primerGesto, true);
  var b = document.getElementById('b-sonido'); if (b) b.addEventListener('click', function (ev) { ev.stopPropagation(); quiere = false; S.alternar(); });
  pintarBoton();
})();

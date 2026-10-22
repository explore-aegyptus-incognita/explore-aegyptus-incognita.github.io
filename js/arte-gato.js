/* Aegyptus Incognita · el gato negro (AE.gato)
   El compañero de quien juega: un gato negro egipcio como la Bastet de la referencia 4 (negro azulado con reflejos gris
   azulados, orejas grandes y altas con el interior de oro, ojo verde dorado con su raya, hocico fino, patas largas), con las
   joyas de los gatos de bronce como el «gato Gayer-Anderson» del British Museum: collar usej de bandas (turquesa, verde y
   lapislázuli entre rayas de oro, con cuentas en gota), colgante de cornalina y un aro de oro en la oreja.

   API
   · Poses (objetos de números; se mezclan):
       AE.gato.andar(fase, vel)   fase en [0, 1) = un ciclo de paso; vel 0 (paso tranquilo) … 1 (trote ligero)
       AE.gato.sentado(t)         la pose de Bastet, viva (respira, la punta de la cola y una oreja de vez en cuando); t en ms
       AE.gato.lavarse(t)         sentado, se lame la mano y se la pasa por la oreja (ciclo de 3 s)
       AE.gato.tumbado(t)         echado como una esfinge
       AE.gato.dormir(t)          hecho un ovillo, respirando
       AE.gato.acecho(t)          agazapado, meneando el trasero
       AE.gato.salto(k, altura)   k de 0 a 1 a lo largo del salto; altura en altos del gato (0,5 por defecto; 0 = sin subir,
                                  si lo sube quien lo controla)
       AE.gato.mezclar(a, b, k)   de a (k = 0) a b (k = 1); las patas cambian por turnos y se levantan si van lejos
   · AE.gato.dibujar(ctx, x, y, alto, pose, op)
       (x, y) el suelo bajo el centro del cuerpo; alto = el alto sentado, de la punta de la oreja al suelo (px).
       op: espejo (mira a la izquierda), mirada (rad, + arriba), parpadeo (0–1), orejas (−1 atrás … 1 alerta), a (0–1).
   · AE.gato.zancada(alto, vel): px que avanza en un ciclo de andar a ese tamaño (sin vel, la última que se pidió a andar):
     quien lo controla hace fase += distancia / zancada y las patas apoyadas no resbalan.
   · AE.gato.limpiar(): olvida las cachés (por ejemplo, tras cambiar mucho de tamaño). AE.gato.armar(pose): el esqueleto
     (para pruebas).

   Cómo está hecho
   · Las poses llevan un tronco curvo (cadera, ángulo, curva, largo y su perfil), el cuello, la cabeza, cuatro patas de tres
     huesos más la mano y una cola de doce segmentos. Cada pata guarda dónde está el nudillo, el ángulo del último hueso, el
     de la mano y el giro de la escápula; el codo y la rodilla salen por IK al dibujar. Al mezclar, lo apoyado sigue apoyado.
   · Medidas internas en «unidades del gato» (ug): ALTO ug es el alto sentado. El origen es el suelo bajo el centro del
     cuerpo; x hacia delante (el gato mira a la derecha) e y hacia abajo.
   · Se dibuja directo en el contexto que llega, sin lienzos que cambien en cada fotograma (solo save/translate/scale/rotate
     y restore, siempre en source-over y sin filter): una forma para el lado lejano, otra para todo el cuerpo (tronco,
     cuello, cabeza, patas y cola: sin costuras), otra para la luz de arriba y otra para los reflejos, todas de color plano
     (en Safari un relleno con degradado cuesta mucho más y, sobre este negro, apenas se ve). Lo que no se mueve va en
     caché, un lienzo por tamaño, con sus degradados: la cara (ojo, raya, nariz, reflejos), el oro de la oreja con el aro y
     el collar con el colgante. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, ES = AE.estilo, P = ES.p;
  var TAU = Math.PI * 2, PI = Math.PI, RECTO = Math.PI / 2;

  /* ------------------------------------------------------------------ medidas (ug) */
  var PD = [20, 22.5, 8];      // pata delantera: húmero, antebrazo, metacarpo
  var PT = [23, 25, 16];       // pata trasera: fémur, tibia, metatarso
  var BOLA = 2.6;              // alto del nudillo sobre el suelo con la mano plana
  var KD = 0.84, KT = 0.94;    // tamaño de la mano delantera y de la trasera
  var NC = 12, LC = 6.4;       // la cola: segmentos y largo de cada uno
  var LTR = 60;                // el tronco, de la cadera al hombro, andando
  var CAB = 0.94;              // escala de la cabeza
  var ESCAP = 14;              // la escápula: de su pivote (cerca de la cruz) al hombro
  var ALTO = 108;              // el alto sentado (se recalcula al final con la pose)

  /* ------------------------------------------------------------------ utilidades */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function fr(v) { return v - Math.floor(v); }
  function suave(t) { return U.suave(t); }

  /* ------------------------------------------------------------------ las poses */
  function nueva() {
    return {
      cad: [-30, -48],         // la cadera (la cabeza del fémur)
      tronco: 0,               // ángulo de la cuerda cadera → hombro (0 horizontal; negativo = el pecho más alto)
      arco: 0.1,               // lo que gira la columna de la cadera al hombro (rad; + = lomo redondo)
      largo: LTR,              // largo del tronco
      vientre: 1,              // hondo del pecho y la barriga (sentado se recogen detrás de las patas)
      perfil: PERFIL.slice(),  // el contorno del tronco: lo que sube (lomo) o baja (pecho y barriga) cada punto
      anca: 1,                 // grosor del muslo
      frente: 1,               // lo que sale el pecho por delante del hombro (sentado se recoge)
      cuello: -0.9,            // dirección del cuello (rad de lienzo)
      cuelloL: 15,
      cabeza: 0,               // ángulo de la cabeza (rad de lienzo: negativo = el hocico arriba)
      // las patas: [x, y del nudillo, ángulo del último hueso, ángulo de la mano, giro de la escápula]
      pd: [31, -BOLA, RECTO - 0.2, 0, 0],
      pd2: [29.5, -BOLA, RECTO - 0.2, 0, 0],
      pt: [-25, -BOLA, RECTO - 0.08, 0, 0],
      pt2: [-26.5, -BOLA, RECTO - 0.08, 0, 0],
      cola: colaForma(PI + 0.3, 0.09, -0.03, 0, 0, 0),
      colaL: 1,
      manoDelante: 0,          // 1: la mano de este lado pasa por delante de la cara (lavarse)
      giroCollar: 0,           // lo que se gira el collar además de seguir la unión del cuello (rad)
      orejas: 0, parpado: 0, pupila: 0.35, mira: 1, resp: 0, lengua: 0
    };
  }
  // los ángulos de la cola: sale con «base», se curva c1 al principio y c2 al final; una onda baja de la raíz a la punta
  // (amplitud amp, fase fa), para que siga al cuerpo con retraso; «punta» dobla solo el final
  function colaForma(base, c1, c2, amp, fa, punta) {
    var o = [], a = base;
    for (var i = 0; i < NC; i++) {
      var t = i / (NC - 1);
      o.push(a + amp * Math.sin(fa - i * 0.55) * Math.pow(t, 0.8) + (punta || 0) * t * t * t);
      a += c1 * (1 - t) + c2 * t;
    }
    return o;
  }
  // de la punta de los dedos (apoyada) al nudillo, con la mano girada ap
  function nudillo(tx, ty, ap, delantera) {
    var dx = (delantera ? KD : KT) * 5.2, c = Math.cos(ap), s = Math.sin(ap);
    return [tx - (dx * c - BOLA * s), ty - (dx * s + BOLA * c)];
  }

  /* --- andar: la marcha del gato es de secuencia lateral (trasera izquierda, delantera izquierda, trasera derecha,
     delantera derecha); al trotar pasa a diagonal. La punta de los dedos apoyada no se mueve del suelo: al final del apoyo
     la mano rueda sobre ella y en el vuelo vuelve adelante con la velocidad del suelo en los dos extremos. --- */
  var ultimaVel = 0.3;
  function zancadaU(vel) { return 66 + 24 * vel; }
  function cicloPata(ps, delantera, S, d, vel, xc) {
    var bar = S * d, tx, ty = 0, ap, a3, esc, rueda = delantera ? 0.5 : 0.7;
    if (ps < d) {
      var k = ps / d;
      tx = xc + bar / 2 - S * ps;
      ap = rueda * Math.pow(U.tramo(k, delantera ? 0.66 : 0.58, 1), 1.6);
      if (delantera) a3 = RECTO - 0.08 - 0.2 * Math.sin(PI * Math.min(1, k * 1.1)) + 0.25 * Math.pow(U.tramo(k, 0.7, 1), 1.5);
      else a3 = RECTO - 0.03 - 0.16 * k - 0.32 * Math.pow(U.tramo(k, 0.5, 1), 1.4);
      esc = (tx - xc) / (bar / 2) * (tx > xc ? 0.4 : 0.25);
    } else {
      var t = (ps - d) / (1 - d), x0 = xc - bar / 2, x1 = xc + bar / 2, m0 = -S * (1 - d) * 0.5, m1 = -S * (1 - d) * 0.7;
      var t2 = t * t, t3 = t2 * t;
      tx = (2 * t3 - 3 * t2 + 1) * x0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * x1 + (t3 - t2) * m1;
      var alt = delantera ? (4.5 + 4.5 * vel) : (3.5 + 4 * vel);
      ty = -alt * Math.pow(Math.sin(PI * Math.pow(t, delantera ? 0.8 : 0.9)), 1.3);
      if (delantera) {
        // la muñeca se dobla (la mano cuelga hacia atrás) y luego se estira para alcanzar
        var dob = Math.sin(PI * Math.pow(U.clamp(t / 0.8, 0, 1), 0.8));
        a3 = lerp(RECTO + 0.09, RECTO - 0.08, suave(t)) + (0.95 + 0.2 * vel) * dob - 0.2 * Math.sin(PI * U.tramo(t, 0.6, 1));
        ap = lerp(rueda, 0, suave(U.tramo(t, 0.2, 1))) + (1.2 + 0.2 * vel) * dob;
      } else {
        var dt = Math.sin(PI * Math.pow(U.clamp(t / 0.85, 0, 1), 0.85));
        a3 = lerp(RECTO - 0.51, RECTO - 0.03, suave(t)) + 0.45 * dt;
        ap = lerp(rueda, 0, suave(U.tramo(t, 0.15, 1))) + 0.7 * dt;
      }
      esc = lerp(-0.25, 0.4, suave(t));
    }
    var n = nudillo(tx, ty, ap, delantera);
    return [n[0], n[1], a3, ap, esc];
  }
  function andar(fase, vel) {
    vel = U.clamp(vel == null ? 0.3 : vel, 0, 1); ultimaVel = vel;
    fase = fr(fase || 0);
    var S = zancadaU(vel), d = 0.64 - 0.14 * vel, lat = 0.26 + 0.24 * vel;
    var p = nueva();
    // el cuerpo sube y baja dos veces por ciclo (más al trote) y apenas cabecea
    var bote = (0.5 + 0.9 * vel) * Math.cos(TAU * 2 * (fase - 0.1));
    p.cad = [-27.5 - 1.5 * vel, -48 + 1.0 * vel + bote];
    p.tronco = 0.03 + 0.015 * Math.sin(TAU * (fase + 0.1)) - 0.012 * vel;
    p.arco = 0.1 - 0.04 * vel + 0.02 * Math.sin(TAU * 2 * fase);
    p.largo = 55 + 2 * vel;
    p.pt = cicloPata(fase, false, S, d, vel, -16.5);
    p.pd = cicloPata(fr(fase - lat), true, S, d, vel, 33.5);
    p.pt2 = cicloPata(fr(fase - 0.5), false, S, d, vel, -18);
    p.pd2 = cicloPata(fr(fase - 0.5 - lat), true, S, d, vel, 31);
    // el cuello y la cabeza, estables, con un vaivén leve a contratiempo
    p.cuello = -0.92 + 0.16 * vel + 0.03 * Math.sin(TAU * 2 * (fase - 0.2));
    p.cuelloL = 16.5 - 1.5 * vel;
    p.cabeza = 0.02 + 0.05 * vel - 0.03 * Math.sin(TAU * 2 * (fase - 0.25));
    // la cola, en S, con la onda que baja con retraso
    p.cola = colaForma(PI + 0.15 - 0.2 * vel, 0.24 - 0.06 * vel, -0.3 + 0.08 * vel, 0.07 + 0.05 * vel, TAU * fase * 2, 0);
    p.orejas = 0.3; p.pupila = 0.35;
    return p;
  }

  /* --- sentado: la pose de Bastet --- */
  function sentadoBase() {
    var p = nueva();
    // calibrada con la Bastet de la referencia 4 (herramientas: el perfil sale de cortar la silueta de la referencia)
    p.cad = [-20, -24];
    p.tronco = -0.62; p.arco = 0.5; p.largo = 46; p.frente = 0.3; p.anca = 1.12;
    p.perfil = [2, 8, 15.9, 21.5, 24.2, 22.1, 19.0, 17.7, 13.7, 6.5, -3.1, -9.6, -10.6, -10.7, -12.1, -13.6, -15.8, -18.4, -7];
    p.cuello = -1.68; p.cuelloL = 18.9; p.cabeza = -0.16;
    var n1 = nudillo(25.5, 0, 0, true), n2 = nudillo(21.5, 0, 0, true);
    p.pd = [n1[0], n1[1], RECTO - 0.1, 0, 0];
    p.pd2 = [n2[0], n2[1], RECTO - 0.06, 0, 0.06];
    // la pata trasera doblada: la rodilla delante y abajo, el corvejón atrás y el metatarso echado en el suelo
    var n3 = nudillo(-8, 0, 0, false), n4 = nudillo(-10, 0, 0, false);
    p.pt = [n3[0], n3[1], 0.04, 0, 0];
    p.pt2 = [n4[0], n4[1], 0.04, 0, 0];
    p.cola = [1.75, 1.45, 0.95, 0.42, 0.1, 0.0, -0.02, -0.02, -0.04, -0.1, -0.22, -0.4];
    p.colaL = 1.08;
    p.orejas = 0.15; p.pupila = 0.3;
    return p;
  }
  function sentado(t) {
    t = t || 0;
    var p = sentadoBase();
    // respira (unas veinte veces por minuto)
    p.resp = Math.sin(TAU * t / 3000);
    p.cad[1] += 0.15 * p.resp; p.tronco -= 0.004 * p.resp;
    // la punta de la cola se mueve de vez en cuando: un golpe de 1,4 s cada 6,5 s
    var ciclo = 6500, n = Math.floor(t / ciclo), u = (t - n * ciclo) / 1400, golpe = u < 1 ? Math.sin(PI * u) * Math.sin(TAU * u * 1.5 + n) : 0;
    var cola = p.cola.slice();
    for (var i = 7; i < NC; i++) cola[i] -= golpe * 0.5 * (i - 6) / 5;
    p.cola = cola;
    // y una oreja que se mueve de vez en cuando
    var uo = fr(t / 8300 + 0.37); p.orejas = 0.15 + (uo < 0.06 ? 0.5 * Math.sin(PI * uo / 0.06) : 0);
    return p;
  }

  /* --- lavarse: sentado, se lame la mano levantada y se la pasa por la oreja (ciclo de 3 s). Por fotogramas clave:
     la mano asoma delante del hocico al lamer y por encima de la oreja al pasarla, para que se lea en silueta --- */
  // [k, cabeza, cuello, x y del nudillo, ángulo del metacarpo, de la mano, orejas, párpado]
  var LAVAR = [
    [0.00, 0.12, -1.62, 33, -71, -1.9, -2.3, 0.1, 0.55],
    [0.40, 0.12, -1.62, 33, -71, -1.9, -2.3, 0.1, 0.55],
    [0.50, 0.45, -1.36, 26, -94, -1.5, -0.6, -0.5, 0.9],
    [0.58, 0.55, -1.3, 30, -98, -1.2, 0.4, -0.9, 1.0],
    [0.68, 0.55, -1.3, 39, -90, -0.9, 1.3, -0.6, 1.0],
    [0.76, 0.42, -1.38, 41, -77, -0.9, 1.8, -0.1, 0.9],
    [0.88, 0.12, -1.62, 33, -71, -1.9, -2.3, 0.1, 0.55],
    [1.00, 0.12, -1.62, 33, -71, -1.9, -2.3, 0.1, 0.55]
  ];
  function lavarse(t) {
    t = t || 0;
    var p = sentadoBase(), k = fr(t / 3000), i = 0;
    while (i < LAVAR.length - 2 && k > LAVAR[i + 1][0]) i++;
    var A = LAVAR[i], B = LAVAR[i + 1], u = suave((k - A[0]) / Math.max(1e-6, B[0] - A[0]));
    function v(j) { return lerp(A[j], B[j], u); }
    p.resp = Math.sin(TAU * t / 3000) * 0.5;
    p.manoDelante = 1; p.mira = 0.1;
    // al lamer, la cabeza sube y baja tres veces sobre la mano y asoma la lengua
    var lam = k < 0.4 ? Math.max(0, Math.sin(TAU * k / 0.4 * 3)) : k > 0.88 ? Math.max(0, Math.sin(TAU * (k - 0.88) / 0.12)) * 0.6 : 0;
    p.cabeza = v(1) + 0.07 * lam; p.cuello = v(2);
    p.pd = [v(3), v(4) - 1.2 * lam, v(5), v(6), 0.3];
    p.orejas = v(7); p.parpado = v(8); p.lengua = lam;
    return p;
  }

  /* --- tumbado: echado como una esfinge, con las patas delanteras estiradas --- */
  function tumbado(t) {
    t = t || 0;
    var p = nueva();
    p.resp = Math.sin(TAU * t / 3400);
    p.cad = [-28, -16 + 0.2 * p.resp];
    p.tronco = -0.1; p.arco = 0.15; p.largo = 58; p.vientre = 0.82;
    p.cuello = -1.25; p.cuelloL = 17; p.cabeza = 0.0;
    var n1 = nudillo(52, 0, 0, true), n2 = nudillo(49, 0, 0, true);
    p.pd = [n1[0], n1[1], 0.04, 0, -0.4];
    p.pd2 = [n2[0], n2[1], 0.04, 0, -0.4];
    var n3 = nudillo(-2, 0, 0, false), n4 = nudillo(-4, 0, 0, false);
    p.pt = [n3[0], n3[1], 0.04, 0, 0];
    p.pt2 = [n4[0], n4[1], 0.04, 0, 0];
    p.cola = colaForma(RECTO + 1.0, -0.4, 0.03, 0, 0, -0.2);
    var ciclo = 7000, n = Math.floor(t / ciclo), u = (t - n * ciclo) / 1500, golpe = u < 1 ? Math.sin(PI * u) * Math.sin(TAU * u * 1.5 + n) : 0;
    for (var i = 7; i < NC; i++) p.cola[i] -= golpe * 0.4 * (i - 6) / 5;
    p.orejas = 0.1; p.pupila = 0.3;
    return p;
  }

  /* --- dormir: hecho un ovillo (el lomo muy redondo, la cabeza baja delante sobre las manos y la cola alrededor),
     respirando despacio --- */
  function dormir(t) {
    t = t || 0;
    var p = nueva();
    p.resp = Math.sin(TAU * t / 4200);
    p.cad = [-24, -15 + 0.3 * p.resp];
    p.tronco = -0.22; p.arco = 1.5; p.largo = 48; p.frente = 0.5; p.anca = 1.1;
    p.perfil = [2, 9, 13, 16, 17.5, 17, 16, 14.5, 11, 4, -4, -9, -10, -9.5, -9, -8.5, -8, -8, -6];
    p.cuello = 0.62; p.cuelloL = 10; p.cabeza = 0.62;
    var n1 = nudillo(36, 0, 0, true), n2 = nudillo(33, 0, 0, true);
    p.pd = [n1[0], n1[1], 0.1, 0, -0.3];
    p.pd2 = [n2[0], n2[1], 0.1, 0, -0.3];
    var n3 = nudillo(2, 0, 0, false), n4 = nudillo(0, 0, 0, false);
    p.pt = [n3[0], n3[1], 0.05, 0, 0];
    p.pt2 = [n4[0], n4[1], 0.05, 0, 0];
    p.cola = [1.9, 1.5, 0.95, 0.4, 0.08, -0.02, -0.04, -0.06, -0.12, -0.3, -0.6, -1.0];
    p.colaL = 1.02;
    p.orejas = -0.3; p.parpado = 1; p.mira = 0; p.pupila = 0.3; p.giroCollar = -0.75;
    return p;
  }

  /* --- acecho: agazapado, el pecho cerca del suelo, los codos por encima del lomo, la cabeza baja en línea con la espalda
     y el trasero que se menea antes de saltar --- */
  function acecho(t) {
    t = t || 0;
    var p = nueva();
    // ráfagas de meneo de 1,1 s y pausas
    var k = fr(t / 2000), men = k < 0.55 ? Math.sin(PI * k / 0.55) : 0, osc = Math.sin(TAU * t / 260) * men;
    p.cad = [-26 + 0.9 * osc, -31 - 1.2 * Math.abs(osc)];
    p.tronco = 0.26; p.arco = -0.06; p.largo = 54; p.vientre = 0.75;
    p.cuello = -0.18; p.cuelloL = 12; p.cabeza = 0.06;
    var n1 = nudillo(42, 0, 0, true), n2 = nudillo(39, 0, 0, true);
    p.pd = [n1[0], n1[1], RECTO - 0.55, 0, -0.35];
    p.pd2 = [n2[0], n2[1], RECTO - 0.55, 0, -0.35];
    // las traseras recogidas, con los corvejones casi en el suelo, pisando por turnos al menear
    var n3 = nudillo(-6, -1.4 * Math.max(0, osc), 0, false), n4 = nudillo(-8, -1.4 * Math.max(0, -osc), 0, false);
    p.pt = [n3[0], n3[1], 0.35, 0, 0];
    p.pt2 = [n4[0], n4[1], 0.35, 0, 0];
    p.cola = colaForma(PI - 0.08, 0.01, -0.01, 0, 0, 0);
    var punta = Math.sin(TAU * t / 700) * 0.35;
    for (var i = 8; i < NC; i++) p.cola[i] += punta * (i - 7) / 4;
    p.orejas = 1; p.pupila = 0.9; p.mira = 0.5;
    return p;
  }

  /* --- salto: k de 0 a 1 a lo largo del salto (altura: lo que sube, en altos del gato) --- */
  function salto(k, altura) {
    k = U.clamp(k || 0, 0, 1);
    altura = altura == null ? 0.5 : altura;
    var p = nueva();
    var subir = 4 * k * (1 - k) * altura * ALTO;
    var est = Math.sin(PI * U.tramo(k, 0.05, 0.75));
    p.cad = [-30 + 2 * est, -48 + 8 * (1 - est) * (k < 0.15 ? 1 : 0.4) - subir];
    p.tronco = lerp(-0.25, 0.3, suave(U.tramo(k, 0.1, 0.9)));
    p.arco = lerp(0.05, -0.12, est); p.largo = LTR + 6 * est;
    p.cuello = -0.75 + 0.35 * suave(U.tramo(k, 0.5, 0.9)); p.cabeza = lerp(-0.15, 0.25, suave(U.tramo(k, 0.3, 0.9)));
    var y0 = -subir;
    var dx = lerp(30, 56, est), dy = y0 + lerp(-14, -24, est) + 24 * suave(U.tramo(k, 0.6, 0.95));
    p.pd = [dx, dy, lerp(RECTO + 0.6, -0.2, est), lerp(1.0, 0.1, est), lerp(-0.2, 0.4, est)];
    p.pd2 = [dx - 3, dy + 1.5, lerp(RECTO + 0.6, -0.1, est), lerp(1.0, 0.1, est), lerp(-0.2, 0.4, est)];
    var tx = lerp(-46, -58, est) + 30 * suave(U.tramo(k, 0.55, 0.95)), ty = y0 + lerp(-2.6, -6, est) - 8 * Math.sin(PI * U.tramo(k, 0.5, 1));
    var cae = suave(U.tramo(k, 0.5, 0.95));
    p.pt = [tx, ty, lerp(PI - 0.5, RECTO, cae), lerp(0.4, 0, cae), 0];
    p.pt2 = [tx - 2.5, ty - 1, lerp(PI - 0.45, RECTO, cae), lerp(0.4, 0, cae), 0];
    p.cola = colaForma(PI + 0.25 - 0.35 * k, 0.12 - 0.1 * k, -0.16, 0, 0, 0.25 * est);
    p.orejas = 0.6; p.pupila = 0.8;
    return p;
  }

  /* --- mezclar dos poses. Las patas cambian por turnos (primero las delanteras) y, si una mano tiene que ir lejos por el
     suelo, se levanta en un arco: así andar → sentado parece un gato que se sienta, no una figura que se deforma. --- */
  var TURNOS = { pd: [0, 0.6], pd2: [0.1, 0.7], pt: [0.3, 0.9], pt2: [0.4, 1] };
  function mezclar(a, b, k) {
    k = U.clamp(k, 0, 1);
    if (k <= 0) return a; if (k >= 1) return b;
    var o = {};
    for (var c in a) {
      if (!(c in b)) { o[c] = a[c]; continue; }
      var va = a[c], vb = b[c];
      if (TURNOS[c]) {
        var tr = TURNOS[c], kk = suave(U.tramo(k, tr[0], tr[1]));
        var q = mezclaNum(va, vb, kk);
        if (va[1] > -BOLA - 3 && vb[1] > -BOLA - 3) q[1] -= Math.min(9, 0.35 * Math.abs(vb[0] - va[0])) * Math.sin(PI * kk);
        o[c] = q;
      } else o[c] = mezclaNum(va, vb, k);
    }
    return o;
  }
  function mezclaNum(a, b, k) {
    if (typeof a === 'number') return a + (b - a) * k;
    if (Array.isArray(a)) { var o = []; for (var i = 0; i < a.length; i++) o.push(mezclaNum(a[i], b[i], k)); return o; }
    return k < 0.5 ? a : b;
  }

  /* ------------------------------------------------------------------ el esqueleto: de la pose a los puntos */
  // un punto del arco del tronco (s desde la cadera, h hacia el lomo); devuelve [x, y, ángulo de la columna]
  function enArco(E, s, h) {
    var th0 = E.th0, k = E.k, x, y, th;
    if (s <= 0 || Math.abs(k) < 1e-6) {
      th = th0;
      x = E.cx + Math.cos(th0) * s; y = E.cy + Math.sin(th0) * s;
    } else if (s >= E.L) {
      th = th0 + k * E.L;
      x = E.cx + (Math.sin(th) - Math.sin(th0)) / k + Math.cos(th) * (s - E.L); y = E.cy - (Math.cos(th) - Math.cos(th0)) / k + Math.sin(th) * (s - E.L);
    } else {
      th = th0 + k * s;
      x = E.cx + (Math.sin(th) - Math.sin(th0)) / k; y = E.cy - (Math.cos(th) - Math.cos(th0)) / k;
    }
    return [x + Math.sin(th) * h, y - Math.cos(th) * h, th];
  }
  // el contorno del tronco [s (para un tronco de LTR), h]: arriba de atrás adelante y abajo de delante atrás
  var TRONCO_S = [-16, -11.5, -3, 10, 24, 38, 49, 57, 63, 69.5, 71, 65, 54, 41, 29, 18.5, 9.5, 0, -10];
  // el perfil (h de cada punto) del gato de pie; cada pose puede llevar el suyo en «perfil» (y se mezcla)
  var PERFIL = [2, 8, 11.4, 11.6, 10.8, 11.2, 13, 14.2, 13.2, 6, -4, -14, -18.6, -17.6, -14.6, -11.2, -10, -10, -7];
  var VIENTRE = { 11: 0.6, 12: 1, 13: 1, 14: 1, 15: 0.9, 16: 0.6 }, RESPIRA = { 12: 1, 13: 1, 14: 0.8, 15: 0.5 };

  var tmpIK = [0, 0, 0, 0];
  function ik2(rx, ry, ox, oy, l1, l2, lado) {
    var dx = ox - rx, dy = oy - ry, d = Math.sqrt(dx * dx + dy * dy) || 0.001;
    var dmax = l1 + l2 - 0.05, dmin = Math.abs(l1 - l2) + 0.05;
    if (d > dmax) { dx *= dmax / d; dy *= dmax / d; d = dmax; }
    else if (d < dmin) { dx *= dmin / d; dy *= dmin / d; d = dmin; }
    var a = Math.atan2(dy, dx), b = Math.acos(U.clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1)), a1 = a + lado * b;
    tmpIK[0] = rx + Math.cos(a1) * l1; tmpIK[1] = ry + Math.sin(a1) * l1; tmpIK[2] = rx + dx; tmpIK[3] = ry + dy;
  }
  function pata(raiz, obj, L, lado, delantera) {
    var a3 = obj[2], wx = obj[0] - Math.cos(a3) * L[2], wy = obj[1] - Math.sin(a3) * L[2];
    ik2(raiz[0], raiz[1], wx, wy, L[0], L[1], lado);
    var j2 = [tmpIK[2], tmpIK[3]], b = [j2[0] + Math.cos(a3) * L[2], j2[1] + Math.sin(a3) * L[2]];
    var ap = obj[3], dx = (delantera ? KD : KT) * 5.2, c = Math.cos(ap), s = Math.sin(ap);
    // punta: la punta de los dedos que sale; pedida: la que pedía la pose (si la IK no llega, no coinciden)
    return { r: raiz, j1: [tmpIK[0], tmpIK[1]], j2: j2, b: b, a3: a3, ap: ap, d: delantera,
      punta: [b[0] + dx * c - BOLA * s, b[1] + dx * s + BOLA * c], pedida: [obj[0] + dx * c - BOLA * s, obj[1] + dx * s + BOLA * c] };
  }

  function armar(p, op) {
    var E = { L: p.largo, k: p.arco / p.largo, cx: p.cad[0], cy: p.cad[1], p: p };
    E.th0 = p.tronco - p.arco / 2;
    var fs = p.largo / LTR, i, n = TRONCO_S.length, perfil = p.perfil || PERFIL;
    E.tronco = [];
    for (i = 0; i < n; i++) {
      var s = TRONCO_S[i], h = perfil[i];
      s = s < 0 ? s : s > LTR ? p.largo + (s - LTR) * p.frente : s * fs;
      if (VIENTRE[i]) h *= 1 - (1 - p.vientre) * VIENTRE[i];
      if (RESPIRA[i]) h *= 1 + 0.035 * p.resp * RESPIRA[i];
      var q = enArco(E, s, h);
      E.tronco.push(q[0], Math.min(q[1], -0.3));
    }
    // la cadera y el hombro (que mueve la escápula desde su pivote, arriba)
    E.cad = [p.cad[0], p.cad[1]];
    var hom = enArco(E, p.largo, -1), piv = enArco(E, p.largo - 3, ESCAP - 1);
    function hombro(esc, dx, dy) {   // esc > 0: la escápula gira y el hombro va adelante
      var vx = hom[0] - piv[0], vy = hom[1] - piv[1], c = Math.cos(-esc), s2 = Math.sin(-esc);
      return [piv[0] + vx * c - vy * s2 + dx, piv[1] + vx * s2 + vy * c + dy];
    }
    E.pd = pata(hombro(p.pd[4], 0, 0), p.pd, PD, 1, true);
    E.pd2 = pata(hombro(p.pd2[4], -0.6, -1.0), p.pd2, PD, 1, true);
    E.pt = pata(E.cad, p.pt, PT, -1, false);
    E.pt2 = pata([E.cad[0] - 1.0, E.cad[1] - 1.8], p.pt2, PT, -1, false);
    // el cuello sale de entre la cruz y el frente del pecho (puntos 7 y 9 del contorno); la cabeza va al final
    E.T = [E.tronco[14], E.tronco[15]]; E.F = [E.tronco[18], E.tronco[19]];
    var nb = [(E.T[0] + E.F[0]) / 2, (E.T[1] + E.F[1]) / 2];
    var mir = (op && op.mirada ? op.mirada : 0) * p.mira;
    var ac = p.cuello - mir * 0.3;
    E.cab = [nb[0] + Math.cos(ac) * p.cuelloL, nb[1] + Math.sin(ac) * p.cuelloL];
    E.aCab = p.cabeza - mir * 0.7;
    var c2 = Math.cos(E.aCab) * CAB, s3 = Math.sin(E.aCab) * CAB;
    E.mc = [c2, s3, -s3, c2, E.cab[0], E.cab[1]];
    // el puente del cuello: de la cruz a la nuca y de la garganta al pecho
    E.N = aplicar(E.mc, -5.8, -8.4); E.G = aplicar(E.mc, 1.6, 4.9);
    // el collar descansa en la unión del cuello con el cuerpo (de la cruz al pecho): se orienta por esa línea, que casi no
    // cambia de inclinación entre sentado y andando (el eje del cuello sí)
    E.rc = Math.atan2(E.F[1] - E.T[1], E.F[0] - E.T[0]) - 0.843 + (p.giroCollar || 0);
    E.cc = [(E.T[0] + E.F[0]) / 2 + Math.sin(E.rc) * 2.3, (E.T[1] + E.F[1]) / 2 - Math.cos(E.rc) * 2.3];
    // la cola: sale de arriba de la grupa
    var rb = enArco(E, -9.5, 6.5), cx = rb[0], cy = rb[1], lc = LC * p.colaL;
    E.cola = [cx, cy];
    for (i = 0; i < NC; i++) {
      cx += Math.cos(p.cola[i]) * lc; cy += Math.sin(p.cola[i]) * lc;
      var ri = radioCola(i + 1);
      if (cy > -ri) cy = -ri;   // la cola no se mete en el suelo: se apoya
      E.cola.push(cx, cy);
    }
    return E;
  }
  function radioCola(i) { return lerp(3.9, 2.5, Math.pow(i / NC, 0.8)); }

  /* ------------------------------------------------------------------ geometría para pintar */
  function aplicar(m, px, py) { return [m[0] * px + m[2] * py + m[4], m[1] * px + m[3] * py + m[5]]; }
  function componer(m, n) {
    return [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
  }
  // curva cerrada suave por puntos (Catmull-Rom → Bézier); pts = [x0, y0, x1, y1, …]
  function curvaCerrada(x, pts, n) {
    n = n || pts.length / 2;
    for (var i = 0; i < n; i++) {
      var i0 = (i - 1 + n) % n, i2 = (i + 1) % n, i3 = (i + 2) % n;
      var p1x = pts[2 * i], p1y = pts[2 * i + 1], p2x = pts[2 * i2], p2y = pts[2 * i2 + 1];
      if (i === 0) x.moveTo(p1x, p1y);
      x.bezierCurveTo(p1x + (p2x - pts[2 * i0]) / 6, p1y + (p2y - pts[2 * i0 + 1]) / 6, p2x - (pts[2 * i3] - p1x) / 6, p2y - (pts[2 * i3 + 1] - p1y) / 6, p2x, p2y);
    }
    x.closePath();
  }
  function areaCon(pts) { var a = 0, n = pts.length / 2; for (var i = 0; i < n; i++) { var j = (i + 1) % n; a += pts[2 * i] * pts[2 * j + 1] - pts[2 * j] * pts[2 * i + 1]; } return a; }
  function alReves(pts) { var o = []; for (var i = pts.length - 2; i >= 0; i -= 2) o.push(pts[i], pts[i + 1]); return o; }
  // caminos en coordenadas propias que se transforman con m = [a, b, c, d, e, f]
  // órdenes: 0 = M x y, 1 = L x y, 3 = C x1 y1 x2 y2 x y, 4 = Z
  function camino(x, cmd, m) {
    var a = m[0], b = m[1], c = m[2], d = m[3], e = m[4], f = m[5], i = 0, n = cmd.length;
    while (i < n) {
      var o = cmd[i++];
      if (o === 0) { x.moveTo(a * cmd[i] + c * cmd[i + 1] + e, b * cmd[i] + d * cmd[i + 1] + f); i += 2; }
      else if (o === 1) { x.lineTo(a * cmd[i] + c * cmd[i + 1] + e, b * cmd[i] + d * cmd[i + 1] + f); i += 2; }
      else if (o === 3) { x.bezierCurveTo(a * cmd[i] + c * cmd[i + 1] + e, b * cmd[i] + d * cmd[i + 1] + f, a * cmd[i + 2] + c * cmd[i + 3] + e, b * cmd[i + 2] + d * cmd[i + 3] + f, a * cmd[i + 4] + c * cmd[i + 5] + e, b * cmd[i + 4] + d * cmd[i + 5] + f); i += 6; }
      else x.closePath();
    }
  }
  // un hueso con su carne, de A a B: medio ancho delante y detrás en A, en el medio y en B, y lo que sobresale por los
  // extremos (redondeado). w = [delA, detA, delM, detM, delB, detB, sobreA, sobreB]
  var HB = [];
  function hueso(x, A, B, w, mA, mB) {
    var dx = B[0] - A[0], dy = B[1] - A[1], l = Math.sqrt(dx * dx + dy * dy) || 0.001; dx /= l; dy /= l;
    var nx = dy, ny = -dx, ma = mA == null ? 0.5 : mA, mx = A[0] + (B[0] - A[0]) * ma, my = A[1] + (B[1] - A[1]) * ma;
    HB[0] = A[0] - dx * w[6]; HB[1] = A[1] - dy * w[6];
    HB[2] = A[0] + nx * w[0]; HB[3] = A[1] + ny * w[0];
    HB[4] = mx + nx * w[2]; HB[5] = my + ny * w[2];
    HB[6] = B[0] + nx * w[4]; HB[7] = B[1] + ny * w[4];
    HB[8] = B[0] + dx * w[7]; HB[9] = B[1] + dy * w[7];
    HB[10] = B[0] - nx * w[5]; HB[11] = B[1] - ny * w[5];
    HB[12] = mx - nx * w[3]; HB[13] = my - ny * w[3];
    HB[14] = A[0] - nx * w[1]; HB[15] = A[1] - ny * w[1];
    curvaCerrada(x, HB, 8);
  }
  // la mano: los dedos (b = el nudillo; ap = hacia dónde apuntan los dedos; k = tamaño a lo largo)
  var MANO = [-2.3, -2.0, 0.4, -2.75, 3.3, -2.6, 5.5, -1.3, 6.25, 0.8, 5.3, 2.6, 1.0, 2.62, -1.8, 2.35, -2.9, 0.3];
  var MB = [];
  function mano(x, b, ap, k) {
    var c = Math.cos(ap), s = Math.sin(ap);
    for (var i = 0; i < MANO.length; i += 2) { var px = MANO[i] * k, py = MANO[i + 1]; MB[i] = b[0] + px * c - py * s; MB[i + 1] = b[1] + px * s + py * c; }
    curvaCerrada(x, MB, MANO.length / 2);
  }
  var W_BRAZO = [7.2, 6.4, 6.0, 5.6, 4.0, 5.0, 4.5, 2.4], W_ANTE = [4.1, 3.7, 3.25, 2.85, 2.5, 2.6, 1.6, 1.4], W_MCARPO = [2.45, 2.9, 2.25, 2.2, 2.15, 2.15, 1.2, 0.6];
  var W_MUSLO = [11.5, 12.5, 9.8, 10.6, 5.6, 6.2, 9, 3.2], W_TIBIA = [4.7, 5.6, 3.3, 3.2, 2.5, 2.1, 1.8, 0.8], W_MTARSO = [2.5, 3.6, 2.3, 2.2, 2.15, 2.25, 2.6, 0.6];
  function pataDel(x, Q) {
    hueso(x, [lerp(Q.r[0], Q.j1[0], 0.12), lerp(Q.r[1], Q.j1[1], 0.12)], Q.j1, W_BRAZO, 0.45);
    hueso(x, Q.j1, Q.j2, W_ANTE, 0.4);
    hueso(x, Q.j2, Q.b, W_MCARPO);
    mano(x, Q.b, Q.ap, KD);
  }
  var WM = [];
  function pataTras(x, Q, conMuslo, anca) {
    if (conMuslo) { var k = anca || 1; for (var i = 0; i < 6; i++) WM[i] = W_MUSLO[i] * k; WM[6] = W_MUSLO[6] * k; WM[7] = W_MUSLO[7]; hueso(x, Q.r, Q.j1, WM, 0.45); }
    else hueso(x, [lerp(Q.r[0], Q.j1[0], 0.45), lerp(Q.r[1], Q.j1[1], 0.45)], Q.j1, [7, 7.5, 6.2, 6.6, 5.2, 5.8, 2, 2.6]);
    hueso(x, Q.j1, Q.j2, W_TIBIA, 0.38);
    hueso(x, Q.j2, Q.b, W_MTARSO);
    mano(x, Q.b, Q.ap, KT);
  }
  // la cola: un tubo con la punta redonda
  function cola(x, E) {
    var c = E.cola, i, izq = [], der = [];
    for (i = 0; i <= NC; i++) {
      var a = Math.max(0, i - 1), b = Math.min(NC, i + 1), dx = c[2 * b] - c[2 * a], dy = c[2 * b + 1] - c[2 * a + 1], l = Math.sqrt(dx * dx + dy * dy) || 1;
      var r = radioCola(i), nx = dy / l * r, ny = -dx / l * r;
      izq.push(c[2 * i] + nx, c[2 * i + 1] + ny); der.push(c[2 * i] - nx, c[2 * i + 1] - ny);
    }
    var ux = c[2 * NC] - c[2 * NC - 2], uy = c[2 * NC + 1] - c[2 * NC - 1], ul = Math.sqrt(ux * ux + uy * uy) || 1, rp = radioCola(NC) * 0.95;
    var pts = izq.concat([c[2 * NC] + ux / ul * rp, c[2 * NC + 1] + uy / ul * rp]), dd = alReves(der);
    pts = pts.concat(dd);
    pts.push(c[0] - (c[2] - c[0]) * 0.3, c[1] - (c[3] - c[1]) * 0.3);
    if (areaCon(pts) < 0) pts = alReves(pts);
    curvaCerrada(x, pts);
  }

  /* --- la cabeza (hocico a la derecha; origen donde llega el cuello), en el sentido de las agujas del reloj --- */
  var CABEZA = [0, 0, 5.0,
    3, -5.4, 1.2, -7.4, -4.6, -6.4, -9.2,      // la nuca y el occipucio
    3, -5.0, -13.6, -0.6, -16.4, 5.0, -16.4,   // el cráneo
    3, 10.4, -16.2, 14.0, -13.6, 17.0, -11.4,  // la frente
    3, 20.2, -9.4, 23.6, -7.6, 26.0, -6.0,     // el caballete, largo y recto
    3, 26.8, -5.5, 27.2, -4.7, 27.0, -3.8,     // la punta de la nariz
    3, 26.8, -2.9, 26.1, -2.3, 25.0, -1.9,     // el labio de arriba
    3, 23.8, -1.5, 22.8, -1.0, 22.2, -0.3,     // la boca
    3, 22.2, 0.7, 21.2, 1.7, 19.4, 2.2,        // la barbilla
    3, 14.6, 3.6, 6.8, 5.4, 0, 5.0, 4];        // la mandíbula
  // la oreja (alrededor de su pivote, en la base); y su interior de oro
  var PIV_OREJA = [5.6, -15.2];
  var OREJA = [0, -6, 2.2,
    3, -5.6, -4.8, -4.2, -11.6, -1.9, -16.6,
    3, 1.1, -12.8, 4.8, -6.6, 6.4, -0.4,
    3, 3.2, 2.2, -2.4, 3, -6, 2.2, 4];
  var OREJA_DENTRO = [0, -1.6, 0.4,
    3, -2.0, -4.6, -1.8, -10.4, -1.7, -13.8,
    3, 0.6, -10.6, 3.3, -5.6, 4.9, -0.8,
    3, 4.4, 1.2, 0.6, 2.2, -1.6, 0.4, 4];
  var OJO_C = [14.8, -9.0];
  function almendra(x, m, cierre, e) {
    var cx = OJO_C[0], cy = OJO_C[1];
    var bx = cx - 3.4 * e, by = cy - 0.5 * e, fx = cx + 3.2 * e, fy = cy + 0.5 * e;
    var u1y = lerp(cy - 2.7 * e, cy + 1.9 * e, cierre), u2y = lerp(cy - 2.4 * e, cy + 2.0 * e, cierre);
    camino(x, [0, bx, by, 3, cx - 1.8 * e, u1y, cx + 1.6 * e, u2y, fx, fy, 3, cx + 1.8 * e, cy + 2.2 * e, cx - 1.6 * e, cy + 2.1 * e, bx, by, 4], m);
  }
  function oreja(mc, orejas, lejos) {
    var aO = orejas >= 0 ? 0.12 * orejas : 1.0 * orejas, sO = orejas >= 0 ? 1 + 0.04 * orejas : 1 + 0.22 * orejas;
    var c = Math.cos(aO), s = Math.sin(aO), px = PIV_OREJA[0] + (lejos ? 3.4 : 0), py = PIV_OREJA[1] - (lejos ? 0.5 : 0), k = lejos ? 0.97 : 1;
    return componer(mc, [c * k, s * k, -s * sO * k, c * sO * k, px, py]);
  }

  /* --- los colores del gato --- */
  var NEGRO = P.negro, NEGRO2 = P.negro2;
  var C_MEDIO = ES.oscurecer(NEGRO, 0.1), C_LEJOS = ES.oscurecer(NEGRO, 0.4), C_LUZ = U.mezcla(NEGRO2, P.lino, 0.12);
  var BRILLO = U.mezcla(NEGRO2, P.lino, 0.36);
  var IRIS1 = U.mezcla(P.oro1, P.verde, 0.3), IRIS2 = U.mezcla(P.verde, P.oro2, 0.42), IRIS3 = ES.oscurecer(U.mezcla(P.verde, P.turquesa, 0.25), 0.4);
  var OSCURO = ES.oscurecer(NEGRO, 0.55);
  var LENGUA = U.mezcla(P.cornalina, P.lino, 0.42);

  /* ------------------------------------------------------------------ cachés (un lienzo por tamaño) */
  // px de dispositivo por unidad en el contexto (para pintar las cachés a su resolución); sin getTransform (Safari muy
  // antiguo), la densidad de la pantalla por la escala del gato
  var escalaReserva = 1;
  function escalaDispositivo(x) {
    try { if (x.getTransform) { var m = x.getTransform(); return Math.sqrt(m.a * m.a + m.b * m.b) || 1; } } catch (err) { /* nada */ }
    return escalaReserva;
  }
  var cache = {};
  // devuelve el lienzo de «nombre» pintado a k px por unidad (escalas en pasos de un 6 %), con su caja (x0, y0, w, h)
  function sprite(nombre, kDisp, caja, pintor, variante) {
    var paso = Math.max(-40, Math.round(Math.log(kDisp) / Math.LN2 * 12)), clave = nombre + '|' + paso + '|' + (variante || 0), L = cache[clave];
    if (!L) {
      var k = Math.pow(2, paso / 12) * 1.04, w = Math.ceil(caja[2] * k) + 4, h = Math.ceil(caja[3] * k) + 4;
      L = U.lienzo(w, h);
      L.x.setTransform(k, 0, 0, k, 2 - caja[0] * k, 2 - caja[1] * k);
      pintor(L.x, variante);
      L.k = k; L.caja = caja; cache[clave] = L;
    }
    return L;
  }
  function ponerSprite(x, L) {
    x.drawImage(L.c, L.caja[0] - 2 / L.k, L.caja[1] - 2 / L.k, L.c.width / L.k, L.c.height / L.k);
  }

  /* --- el oro de dentro de la oreja, con un reflejo, y el pendiente: un aro de oro con una cuenta en el borde de delante
     (en coordenadas de la oreja) --- */
  var CAJA_OREJA = [-3.5, -16, 11, 20];
  function pintarOreja(x) {
    x.beginPath(); camino(x, OREJA_DENTRO, IDENT);
    x.fillStyle = ES.lin(x, 0, 0, 0, -14, [[0, P.oro3], [0.35, P.oro2], [0.75, P.oro1], [1, P.oro2]]); x.fill();
    // el reflejo: una cuña clara por el lado de delante
    x.beginPath(); camino(x, [0, 0.6, -1.0, 3, 0.4, -5, 0.2, -9.5, -1.2, -12.6, 3, 0.8, -9.6, 2.6, -5.0, 3.4, -1.2, 4], IDENT);
    x.fillStyle = U.rgba([255, 248, 200], 0.35); x.fill();
    // lo hondo de la oreja: el oro se oscurece hacia la base, donde entra en la cabeza
    x.save(); x.beginPath(); camino(x, OREJA_DENTRO, IDENT); x.clip();
    x.fillStyle = ES.lin(x, 0, 2.4, 0, -4, [[0, [40, 20, 6], 0.75], [1, [40, 20, 6], 0]]); x.fillRect(-4, -5, 12, 8);
    x.restore();
    x.beginPath();
    x.moveTo(5.65, -0.2); x.arc(4.3, -0.2, 1.35, 0, TAU);
    x.moveTo(5.08, -0.2); x.arc(4.3, -0.2, 0.78, 0, TAU, true);
    x.moveTo(4.92, 1.4); x.arc(4.3, 1.4, 0.62, 0, TAU);
    x.fillStyle = ES.oro(x, 2.9, -1.6, 5.7, 2.1, 0.32); x.fill();
  }

  /* --- la cara: los reflejos, el ojo con su raya, la nariz y la boca (en coordenadas de la cabeza) --- */
  var CAJA_CARA = [-9, -19.5, 37, 28];
  var PUPILAS = [0.25, 0.55, 0.9];
  function pintarCara(x, nivel) {
    var ident = [1, 0, 0, 1, 0, 0];
    x.save();
    x.beginPath(); camino(x, CABEZA, ident); x.clip();
    // la frente: una franja clara del entrecejo a la coronilla
    x.beginPath();
    camino(x, [0, 17.6, -10.4, 3, 14.6, -12.8, 10.9, -15.7, 5.6, -16.1, 3, 1.4, -16.4, -2.2, -15.0, -4.4, -12.0,
      3, -2.0, -13.0, 1.6, -13.8, 5.4, -13.7, 3, 10.0, -13.4, 13.8, -11.9, 17.6, -10.4, 4], ident);
    x.fillStyle = ES.lin(x, -4, -14, 18, -11, [[0, BRILLO, 0.04], [0.45, BRILLO, 0.5], [1, BRILLO, 0.28]]); x.fill();
    // el caballete de la nariz
    x.beginPath();
    camino(x, [0, 17.4, -10.3, 3, 20.2, -8.9, 23.4, -7.3, 25.8, -5.9, 3, 23.0, -6.4, 20.0, -7.8, 17.0, -9.4, 4], ident);
    x.fillStyle = U.rgba(BRILLO, 0.42); x.fill();
    // la mejilla y el hocico
    x.beginPath();
    camino(x, [0, 8.6, -4.6, 3, 13.0, -6.4, 19.0, -6.8, 25.0, -5.3, 3, 22.4, -3.8, 17.0, -2.9, 12.2, -2.5, 3, 10.6, -2.5, 9.2, -3.2, 8.6, -4.6, 4], ident);
    x.fillStyle = ES.lin(x, 8, -4, 25, -5, [[0, BRILLO, 0], [0.5, BRILLO, 0.34], [1, BRILLO, 0.5]]); x.fill();
    // la mandíbula: un reflejo fino abajo
    x.beginPath();
    camino(x, [0, 2, 4.2, 3, 8, 4.4, 14.6, 3.0, 19.2, 1.6, 3, 14.6, 2.0, 8, 3.0, 2, 3.2, 4], ident);
    x.fillStyle = U.rgba(BRILLO, 0.22); x.fill();
    // el ojo: el párpado claro alrededor, el iris verde dorado, la pupila y el brillo
    x.beginPath(); almendra(x, ident, 0, 1.32);
    x.fillStyle = U.rgba(BRILLO, 0.62); x.fill();
    x.beginPath(); almendra(x, ident, 0, 1);
    x.fillStyle = ES.rad(x, OJO_C[0] + 0.8, OJO_C[1] - 0.2, 0, 3.8, [[0, IRIS1], [0.5, IRIS2], [1, IRIS3]]); x.fill();
    var pw = 0.45 + 1.25 * PUPILAS[nivel];
    x.beginPath(); x.ellipse(OJO_C[0] + 0.8, OJO_C[1] + 0.1, pw, 2.05, 0, 0, TAU); x.fillStyle = U.rgba(OSCURO); x.fill();
    x.beginPath(); x.arc(OJO_C[0] + 1.75, OJO_C[1] - 0.95, 0.55, 0, TAU); x.fillStyle = U.rgba([255, 250, 230], 0.85); x.fill();
    // la raya del ojo: por el párpado de arriba y hacia atrás, como el kohl
    var cx0 = OJO_C[0], cy0 = OJO_C[1];
    x.beginPath();
    camino(x, [0, cx0 + 3.5, cy0 + 0.6, 3, cx0 + 1.7, cy0 - 2.7, cx0 - 1.9, cy0 - 3.0, cx0 - 3.7, cy0 - 0.5,
      3, cx0 - 5.5, cy0 - 1.1, cx0 - 7.6, cy0 - 1.4, cx0 - 9.0, cy0 - 1.2,
      3, cx0 - 7.4, cy0 - 0.4, cx0 - 5.3, cy0 + 0.2, cx0 - 3.3, cy0 + 0.3,
      3, cx0 - 1.8, cy0 - 1.8, cx0 + 1.6, cy0 - 1.7, cx0 + 3.5, cy0 + 0.6, 4], ident);
    x.fillStyle = U.rgba(OSCURO, 0.95); x.fill();
    // la nariz y la boca
    x.beginPath(); camino(x, [0, 27.1, -3.7, 3, 27.3, -4.9, 26.7, -5.8, 25.5, -6.0, 3, 24.7, -5.1, 25.0, -4.0, 25.9, -3.3, 4], ident);
    x.fillStyle = U.rgba(OSCURO); x.fill();
    x.beginPath(); camino(x, [0, 25.8, -2.7, 3, 24.8, -1.6, 22.6, -0.7, 20.0, -0.1, 3, 22.4, -0.4, 24.4, -1.2, 25.8, -2.7, 4], ident);
    x.fillStyle = U.rgba(OSCURO, 0.8); x.fill();
    x.restore();
  }

  /* --- el collar usej: bandas de turquesa, verde y lapislázuli separadas por rayas de oro, y cuentas en gota en el borde.
     En coordenadas del cuello derecho: X hacia la garganta, Y hacia abajo; origen en la base del cuello --- */
  var COL_ARR = [[-8.4, -13.6], [-2.0, -14.4], [6.0, -10.6], [12.3, -4.6]];
  var COL_ABA = [[-11.6, -5.6], [-8.6, 5.0], [-1.6, 13.6], [7.1, 18.2]];
  var CAJA_COLLAR = [-17, -17, 33, 44];
  function bez(p0, p1, p2, p3, t) {
    var u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  }
  function cpsBanda(t) { var o = []; for (var i = 0; i < 4; i++) o.push([lerp(COL_ARR[i][0], COL_ABA[i][0], t), lerp(COL_ARR[i][1], COL_ABA[i][1], t)]); return o; }
  function borde(t, f) { var c = cpsBanda(t); return bez(c[0], c[1], c[2], c[3], f); }
  function banda(x, t0, t1) {
    var c0 = cpsBanda(t0), c1 = cpsBanda(t1);
    x.moveTo(c0[0][0], c0[0][1]); x.bezierCurveTo(c0[1][0], c0[1][1], c0[2][0], c0[2][1], c0[3][0], c0[3][1]);
    x.quadraticCurveTo(lerp(c0[3][0], c1[3][0], 0.5) + 3.4, lerp(c0[3][1], c1[3][1], 0.5), c1[3][0], c1[3][1]);
    x.bezierCurveTo(c1[2][0], c1[2][1], c1[1][0], c1[1][1], c1[0][0], c1[0][1]);
    x.closePath();
  }
  // f a lo largo del collar con el escorzo de un anillo (las cuentas se juntan hacia los lados)
  function escorzo(i, n) { return (1 - Math.cos(PI * i / n)) / 2; }
  function pintarCollar(x) {
    var i, f;
    var BANDAS = [[0, 0.07, 0], [0.07, 0.34, P.turquesa], [0.34, 0.4, 0], [0.4, 0.58, P.verde], [0.58, 0.64, 0], [0.64, 0.82, P.lapis], [0.82, 1, 0]];
    for (i = 0; i < BANDAS.length; i++) {
      var b = BANDAS[i];
      x.beginPath(); banda(x, b[0], b[1]);
      x.fillStyle = b[2] ? ES.relleno(x, b[2], -6, -8, 10, 8, 0.2) : ES.oro(x, -8, -8, 12, 9, 0.35);
      x.fill();
    }
    // las cuentas tubulares: rayas finas de oro entre cuenta y cuenta, y un brillo en cada una
    x.lineCap = 'butt';
    var FILAS = [[0.07, 0.34, 13], [0.4, 0.58, 15], [0.64, 0.82, 17]];
    for (var k = 0; k < FILAS.length; k++) {
      var tb = FILAS[k], nn = tb[2];
      for (i = 1; i < nn; i++) {
        f = escorzo(i, nn);
        var p0 = borde(tb[0], f), p1 = borde(tb[1], f);
        x.lineWidth = 0.34; x.strokeStyle = U.rgba(P.oro2, 0.9); x.beginPath(); x.moveTo(p0[0], p0[1]); x.lineTo(p1[0], p1[1]); x.stroke();
      }
      for (i = 0; i < nn; i++) {
        f = escorzo(i + 0.5, nn);
        var q0 = borde(tb[0] + 0.04, f), q1 = borde(tb[1] - 0.04, f);
        x.lineWidth = 0.42; x.strokeStyle = U.rgba([255, 255, 240], 0.32); x.beginPath(); x.moveTo(q0[0], q0[1]); x.lineTo(q1[0], q1[1]); x.stroke();
      }
    }
    // las cuentas en gota del borde: la punta en el collar y la parte redonda hacia fuera
    var NG = 15;
    for (i = 0; i <= NG; i++) {
      f = 0.03 + 0.96 * escorzo(i, NG);
      var pa = borde(1, f), pb = borde(1, Math.min(1, f + 0.01)), tx = pb[0] - pa[0], ty = pb[1] - pa[1], tl = Math.sqrt(tx * tx + ty * ty) || 1;
      var nx = -ty / tl, ny = tx / tl, r = 0.78 + 0.22 * Math.sin(PI * f), lg = 1.55 * r;
      var cx = pa[0] + nx * lg, cy = pa[1] + ny * lg;
      x.beginPath(); gota(x, pa[0] - nx * 0.6, pa[1] - ny * 0.6, cx, cy, r);
      x.fillStyle = i % 2 ? ES.oro(x, cx - r, cy - r, cx + r, cy + r, 0.3) : ES.relleno(x, P.cornalina, cx - r, cy - r, cx + r, cy + r, 0.22);
      x.fill();
    }
    // el volumen: más oscuro por detrás del cuello, un brillo en la parte que mira a quien mira
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = ES.lin(x, -11, 0, 14, 0, [[0, [12, 14, 32], 0.6], [0.32, [12, 14, 32], 0.04], [0.55, [255, 250, 230], 0.16], [0.78, [255, 250, 230], 0], [1, [12, 14, 32], 0.22]]);
    x.fillRect(CAJA_COLLAR[0], CAJA_COLLAR[1], CAJA_COLLAR[2], CAJA_COLLAR[3]);
    x.globalCompositeOperation = 'source-over';
    // el colgante, que cuelga del frente del collar (va en la misma caché: una operación menos en cada fotograma)
    x.save(); x.translate(7.2, 18.2); pintarColgante(x); x.restore();
  }
  function gota(x, ax, ay, cx, cy, r) {   // una gota con la punta en (ax, ay) y la parte redonda centrada en (cx, cy)
    var dx = cx - ax, dy = cy - ay, l = Math.sqrt(dx * dx + dy * dy) || 1, f = Math.atan2(dy, dx), al = Math.acos(U.clamp(r / l, -1, 1));
    x.moveTo(ax, ay);
    x.lineTo(cx + Math.cos(f + PI + al) * r, cy + Math.sin(f + PI + al) * r);
    x.arc(cx, cy, r, f + PI + al, f + 3 * PI - al);
    x.closePath();
  }
  // el colgante: una gota de cornalina con su casquete de oro (cuelga de (0, 0) hacia abajo)
  function pintarColgante(x) {
    x.beginPath(); x.arc(0, 0.2, 0.75, 0, TAU); x.arc(0, 0.2, 0.32, 0, TAU, true); x.fillStyle = ES.oro(x, -1, -0.6, 1, 1, 0.3); x.fill();
    var gx = 0, gy = 3.9, r = 1.7;
    x.beginPath(); gota(x, 0, 0.7, gx, gy, r + 0.45); x.fillStyle = ES.oro(x, -r, 1, r, gy + r, 0.3); x.fill();
    x.beginPath(); gota(x, 0, 1.5, gx, gy, r);
    x.fillStyle = ES.rad(x, gx, gy, 0, r * 1.5, [[0, ES.aclarar(P.cornalina, 0.35)], [0.55, P.cornalina], [1, ES.oscurecer(P.cornalina, 0.3)]], gx - r * 0.4, gy - r * 0.5); x.fill();
    x.beginPath(); x.ellipse(gx - r * 0.25, gy - r * 0.35, r * 0.42, r * 0.22, -0.6, 0, TAU); x.fillStyle = U.rgba([255, 230, 200], 0.5); x.fill();
  }

  /* ------------------------------------------------------------------ los reflejos (una sola forma) */
  // una franja: lado de fuera (adelante) y lado de dentro; se cierra y se pone en el sentido de las agujas del reloj
  function franja(x, fuera, dentro) {
    var pts = fuera.concat(alReves(dentro));
    if (areaCon(pts) < 0) pts = alReves(pts);
    curvaCerrada(x, pts);
  }
  // una franja a lo largo de un hueso, por su lado de delante (lado = 1) o de detrás (−1)
  function franjaHueso(x, A, B, t0, t1, desde, ancho, lado) {
    var dx = B[0] - A[0], dy = B[1] - A[1], l = Math.sqrt(dx * dx + dy * dy) || 1, nx = dy / l * lado, ny = -dx / l * lado;
    var fuera = [], dentro = [];
    for (var i = 0; i <= 4; i++) {
      var t = lerp(t0, t1, i / 4), px = A[0] + (B[0] - A[0]) * t, py = A[1] + (B[1] - A[1]) * t;
      var o = typeof desde === 'function' ? desde(t) : desde, w = ancho * Math.pow(Math.sin(PI * i / 4), 0.7);
      fuera.push(px + nx * o, py + ny * o); dentro.push(px + nx * (o - w), py + ny * (o - w));
    }
    franja(x, fuera, dentro);
  }
  function reflejosPataDel(x, Q) {
    franjaHueso(x, Q.j1, Q.j2, 0.08, 0.95, function (t) { return lerp(3.6, 2.2, t); }, 1.6, 1);
    franjaHueso(x, [lerp(Q.r[0], Q.j1[0], 0.12), lerp(Q.r[1], Q.j1[1], 0.12)], Q.j1, 0.35, 1.0, function (t) { return lerp(5.9, 3.6, t); }, 2.0, 1);
  }
  // la luz de arriba: bandas anchas que salen del borde de arriba (lomo, anca, cuello y cola) y se pierden hacia dentro
  function luces(x, E, p) {
    var i, fs = p.largo / LTR, perfil = p.perfil || PERFIL, BANDA = [[1, 0], [2, 4], [3, 6], [4, 6.5], [5, 6.5], [6, 6], [7, 4.5], [8, 0]];
    var fuera = [], dentro = [];
    for (i = 0; i < BANDA.length; i++) {
      var j = BANDA[i][0], s0 = TRONCO_S[j], s = s0 < 0 ? s0 : s0 > LTR ? p.largo + (s0 - LTR) * p.frente : s0 * fs, h = perfil[j] - 0.35;
      var q = enArco(E, s, h), q2 = enArco(E, s, h - BANDA[i][1]);
      fuera.push(q[0], q[1]); dentro.push(q2[0], q2[1]);
    }
    franja(x, fuera, dentro);
    var T = E.pt;
    franjaHueso(x, T.r, T.j1, 0.0, 1.0, function (t) { return lerp(11.2, 5.0, t); }, 5.5, 1);
    // el cuello, por detrás (de la cruz a la nuca)
    var A = E.T, B = E.N, fuera2 = [], dentro2 = [], dx = B[0] - A[0], dy = B[1] - A[1], l = Math.sqrt(dx * dx + dy * dy) || 1, nx = dy / l, ny = -dx / l;
    for (i = 0; i <= 4; i++) {
      var t = i / 4, px = A[0] + dx * t, py = A[1] + dy * t, cv = l * 0.1 * Math.sin(PI * t) * 1.1, w = 4.5 * Math.pow(Math.sin(PI * t), 0.6);
      fuera2.push(px + nx * (cv - 0.35), py + ny * (cv - 0.35)); dentro2.push(px + nx * (cv - 0.35 - w), py + ny * (cv - 0.35 - w));
    }
    franja(x, fuera2, dentro2);
  }
  function reflejos(x, E, p) {
    var i, fs = p.largo / LTR;
    // el lomo
    var perfil = p.perfil || PERFIL, LOMO = [[2, 0], [3, 2.0], [4, 2.6], [5, 2.6], [6, 2.3], [7, 1.4], [8, 0]];
    var fuera = [], dentro = [];
    for (i = 0; i < LOMO.length; i++) {
      var j = LOMO[i][0], s0 = TRONCO_S[j], s = s0 < 0 ? s0 : s0 > LTR ? p.largo + (s0 - LTR) * p.frente : s0 * fs, h = perfil[j] - 0.9;
      var q = enArco(E, s, h), q2 = enArco(E, s, h - LOMO[i][1]);
      fuera.push(q[0], q[1]); dentro.push(q2[0], q2[1]);
    }
    franja(x, fuera, dentro);
    // el muslo: una franja curva por delante del anca, de arriba a la rodilla
    var T = E.pt;
    franjaHueso(x, T.r, T.j1, 0.02, 0.98, function (t) { return lerp(10.6, 4.6, t) - 0.9; }, 2.6, 1);
    franjaHueso(x, T.j1, T.j2, 0.1, 0.8, function (t) { return lerp(4.4, 2.6, t); }, 1.3, 1);
    franjaHueso(x, T.j2, T.b, 0.15, 0.9, 1.8, 0.9, 1);
    // la pata delantera de este lado (si no va delante de la cara)
    if (p.manoDelante < 0.5) reflejosPataDel(x, E.pd);
    // la garganta: por delante del cuello
    var G = E.G, F = E.F, fuera2 = [], dentro2 = [];
    for (i = 0; i <= 4; i++) {
      var t = 0.12 + 0.72 * i / 4, gx = lerp(G[0], F[0], t), gy = lerp(G[1], F[1], t), w = 2.3 * Math.pow(Math.sin(PI * i / 4), 0.7);
      var dx = F[0] - G[0], dy = F[1] - G[1], l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;   // hacia fuera
      var bomb = Math.sin(PI * t) * l * 0.08;
      fuera2.push(gx + nx * (bomb - 0.7), gy + ny * (bomb - 0.7)); dentro2.push(gx + nx * (bomb - 0.7 - w), gy + ny * (bomb - 0.7 - w));
    }
    franja(x, fuera2, dentro2);
    // la cola: por arriba
    var c = E.cola, fuera3 = [], dentro3 = [];
    for (i = 1; i <= NC - 1; i++) {
      var a = i - 1, b = i + 1, ex = c[2 * b] - c[2 * a], ey = c[2 * b + 1] - c[2 * a + 1], el = Math.sqrt(ex * ex + ey * ey) || 1;
      var mx = ey / el, my = -ex / el; if (my > 0) { mx = -mx; my = -my; }
      var r = radioCola(i), w3 = r * 0.42 * Math.pow(Math.sin(PI * (i - 0.5) / (NC - 1)), 0.6);
      fuera3.push(c[2 * i] + mx * (r - 0.55), c[2 * i + 1] + my * (r - 0.55)); dentro3.push(c[2 * i] + mx * (r - 0.55 - w3), c[2 * i + 1] + my * (r - 0.55 - w3));
    }
    franja(x, fuera3, dentro3);
  }

  /* ------------------------------------------------------------------ pintar el gato */
  // los rellenos no cambian (van en coordenadas del gato o de la oreja): se crean una vez por contexto
  function degradados(x) {
    var g = x.__gatoDegradados;
    if (!g) {
      g = x.__gatoDegradados = {
        cuerpo: U.rgba(C_MEDIO), lejos: U.rgba(C_LEJOS), luz: U.rgba(C_LUZ, 0.2),
        brillo: U.rgba(BRILLO, 0.36)
      };
    }
    return g;
  }
  var IDENT = [1, 0, 0, 1, 0, 0];
  function dibujarGato(x, E, p, op) {
    var mc = E.mc, orejas = op.orejas != null ? U.clamp(op.orejas, -1, 1) : p.orejas;
    var mO = oreja(mc, orejas, false), mO2 = oreja(mc, orejas, true);
    var D = degradados(x), gC = D.cuerpo;
    var kDisp = escalaDispositivo(x);

    // 1. el lado lejano, más oscuro: las patas y la oreja
    x.beginPath();
    pataTras(x, E.pt2, false);
    pataDel(x, E.pd2);
    camino(x, OREJA, mO2);
    x.fillStyle = D.lejos; x.fill();

    // 2. el cuerpo: una sola forma (todo del mismo color: sin costuras)
    x.beginPath();
    curvaCerrada(x, E.tronco);
    puenteCuello(x, E);
    camino(x, CABEZA, mc);
    camino(x, OREJA, mO);
    pataTras(x, E.pt, true, p.anca);
    if (p.manoDelante < 0.5) pataDel(x, E.pd);
    cola(x, E);
    x.fillStyle = gC; x.fill();

    // la luz de arriba: bandas anchas y suaves en el lomo, el anca y el cuello (planas y translúcidas: en Safari un
    // relleno con degradado cuesta mucho más que uno plano, y sobre este negro el resultado es el mismo)
    x.beginPath(); luces(x, E, p); x.fillStyle = D.luz; x.fill();

    // 3. el oro de dentro de la oreja y el aro (en caché, en coordenadas de la oreja: gira y se aplasta con ella)
    var Lo = sprite('oreja', kDisp * CAB, CAJA_OREJA, pintarOreja, 0);
    x.save(); x.transform(mO[0], mO[1], mO[2], mO[3], mO[4], mO[5]); ponerSprite(x, Lo); x.restore();

    // 4. la cara (en caché) y el párpado, si parpadea o duerme
    var nivel = p.pupila < 0.4 ? 0 : p.pupila < 0.72 ? 1 : 2;
    var Lc = sprite('cara', kDisp * CAB, CAJA_CARA, pintarCara, nivel);
    x.save(); x.transform(mc[0], mc[1], mc[2], mc[3], mc[4], mc[5]); ponerSprite(x, Lc); x.restore();
    var cierre = Math.max(p.parpado, op.parpadeo || 0);
    if (cierre > 0.04) {
      x.beginPath();
      var cx0 = OJO_C[0], cy0 = OJO_C[1], e = 1.12, ly = lerp(cy0 - 2.9, cy0 + 2.25, cierre);
      camino(x, [0, cx0 - 3.6 * e, cy0 - 0.6, 3, cx0 - 1.9 * e, cy0 - 3.3, cx0 + 1.7 * e, cy0 - 3.0, cx0 + 3.5 * e, cy0 + 0.5,
        3, cx0 + 1.8 * e, ly + 0.4, cx0 - 1.6 * e, ly + 0.1, cx0 - 3.6 * e, cy0 - 0.6, 4], mc);
      x.fillStyle = gC; x.fill();
    }

    // 5. todos los reflejos del cuerpo, en una forma
    x.beginPath(); reflejos(x, E, p);
    if (cierre > 0.04) {   // el borde del párpado cerrado, claro
      var lx = OJO_C[0], lyy = OJO_C[1], ly2 = lerp(lyy - 2.9, lyy + 2.25, cierre);
      camino(x, [0, lx + 3.4, lyy + 0.5, 3, lx + 1.8, ly2 + 0.5, lx - 1.6, ly2 + 0.2, lx - 3.6, lyy - 0.5,
        3, lx - 1.6, ly2 - 0.5, lx + 1.8, ly2 - 0.25, lx + 3.4, lyy + 0.5, 4], mc);
    }
    x.fillStyle = D.brillo; x.fill();

    // 6. el collar con el colgante (en caché)
    var Lk = sprite('collar', kDisp, CAJA_COLLAR, pintarCollar, 0);
    x.save(); x.translate(E.cc[0], E.cc[1]); x.rotate(E.rc); ponerSprite(x, Lk); x.restore();

    // 7. la mano que pasa por delante de la cara (lavarse)
    if (p.manoDelante >= 0.5) {
      x.beginPath(); pataDel(x, E.pd); x.fillStyle = gC; x.fill();
      x.beginPath(); reflejosPataDel(x, E.pd); x.fillStyle = D.brillo; x.fill();
    }
    // la lengua al lavarse
    if (p.lengua > 0.02) {
      var lg = p.lengua;
      x.beginPath(); camino(x, [0, 22.2, -0.4, 3, 24.0 + 1.2 * lg, -0.4 + 0.5 * lg, 24.4 + 1.6 * lg, 1.3 + 1.1 * lg, 23.2 + 0.8 * lg, 1.6 + 1.2 * lg, 3, 22.2, 1.6, 21.4, 0.5, 22.2, -0.4, 4], mc);
      x.fillStyle = U.rgba(LENGUA); x.fill();
    }
  }
  // el cuello: de la cruz a la nuca (cóncavo) y de la garganta al pecho (convexo), sin costuras con el tronco y la cabeza
  function puenteCuello(x, E) {
    var T = E.T, F = E.F, N = E.N, G = E.G;
    var dx = N[0] - T[0], dy = N[1] - T[1], l = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = dy / l, ny = -dx / l;   // hacia el lado de la garganta
    var ex = F[0] - G[0], ey = F[1] - G[1], l2 = Math.sqrt(ex * ex + ey * ey) || 1, mx = -ey / l2, my = ex / l2;   // hacia fuera de la garganta
    x.moveTo(T[0], T[1]);
    x.bezierCurveTo(T[0] + dx * 0.33 + nx * l * 0.1, T[1] + dy * 0.33 + ny * l * 0.1, T[0] + dx * 0.7 + nx * l * 0.12, T[1] + dy * 0.7 + ny * l * 0.12, N[0], N[1]);
    x.lineTo(G[0], G[1]);
    x.bezierCurveTo(G[0] + ex * 0.33 + mx * l2 * 0.1, G[1] + ey * 0.33 + my * l2 * 0.1, G[0] + ex * 0.7 + mx * l2 * 0.1, G[1] + ey * 0.7 + my * l2 * 0.1, F[0], F[1]);
    x.closePath();
  }

  /* ------------------------------------------------------------------ la API */
  function dibujar(ctx, x, y, alto, pose, op) {
    op = op || {};
    var a = op.a == null ? 1 : op.a;
    if (a <= 0.003 || !pose || !(alto > 0)) return;
    var s = alto / ALTO, E = armar(pose, op);
    escalaReserva = (window.devicePixelRatio || 1) * s;
    if (a < 0.999) { dibujarTransparente(ctx, x, y, s, E, pose, op, a); return; }
    ctx.save();
    ctx.translate(x, y); ctx.scale(op.espejo ? -s : s, s);
    dibujarGato(ctx, E, pose, op);
    ctx.restore();
  }
  // con opacidad: el gato se pinta entero en un lienzo aparte y se pone con esa opacidad (si no, se verían las patas
  // del otro lado a través del cuerpo)
  function dibujarTransparente(ctx, x, y, s, E, pose, op, a) {
    var kd = escalaDispositivo(ctx) * s, x0 = -112, y0 = -178, w = 235, h = 188;
    var L = U.auxiliar('gato-transparente', w * kd, h * kd);
    L.x.setTransform(kd, 0, 0, kd, -x0 * kd, -y0 * kd);   // (es un lienzo nuestro: aquí sí se puede)
    var antes = escalaReserva; escalaReserva = kd;
    dibujarGato(L.x, E, pose, op);
    escalaReserva = antes;
    ctx.save();
    ctx.translate(x, y); ctx.scale(op.espejo ? -s : s, s);
    ctx.globalAlpha *= a;
    ctx.drawImage(L.c, 0, 0, Math.ceil(w * kd), Math.ceil(h * kd), x0, y0, Math.ceil(w * kd) / kd, Math.ceil(h * kd) / kd);
    ctx.restore();
  }

  AE.gato = {
    andar: andar, sentado: sentado, lavarse: lavarse, tumbado: tumbado, dormir: dormir, acecho: acecho, salto: salto,
    mezclar: mezclar, dibujar: dibujar,
    // px que avanza el gato en un ciclo de andar a ese tamaño (vel: si no se da, la última que se pidió a andar)
    zancada: function (alto, vel) { return zancadaU(vel == null ? ultimaVel : U.clamp(vel, 0, 1)) * alto / ALTO; },
    armar: armar,
    limpiar: function () { cache = {}; }
  };
  // el alto de verdad del gato sentado (de la punta de la oreja al suelo), para que «alto» sea exacto
  (function () {
    var p = sentadoBase(), E = armar(p, {}), m = oreja(E.mc, p.orejas, false), punta = aplicar(m, -1.9, -16.6);
    ALTO = -punta[1];
    AE.gato.ALTO = ALTO;
  })();
})();

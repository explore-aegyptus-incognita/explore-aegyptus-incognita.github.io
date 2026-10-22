/* Aegyptus Incognita · interfaz
   El registro de secretos, el progreso (en este navegador), el papiro de los secretos, la tarjeta de cada escena, los
   créditos, los avisos, los instrumentos (lugar, hora y ka), el mapa del Nilo y la entrada. */
(function () {
  'use strict';
  var AE = window.AE, U = AE.util, E = AE.motor;
  var CLAVE = 'aegyptus-incognita.v1';   // (no se cambia nunca: borraría el progreso de quien juega)
  var PRUEBA = /[?&]prueba\b/.test(location.search);
  var I = AE.interfaz = { prueba: PRUEBA };
  var huevos = [], final = null;
  var estado = { hallados: {}, final: false, introVista: false };
  var $ = function (id) { return document.getElementById(id); };
  var raiz = document.documentElement;
  // quién ha hecho el juego: sale en los créditos al terminar el final y, después, al pie del papiro
  var AUTOR = { nombre: 'Pau Morató Sebastià', linkedin: 'https://www.linkedin.com/in/pau-morat%C3%B3-sebasti%C3%A0-5554a01b2' };
  // las cifras egipcias: rayitas para las unidades y el ∩ (el trabón) para el diez
  var NUMEROS = ['', '𓏺', '𓏻', '𓏼', '𓏽', '𓏾', '𓏿', '𓐀', '𓐁', '𓐂', '𓎆'];
  var PALABRAS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'];

  /* ---------- registro ----------
     Cada secreto: { id, n, nombre, jero, tipo, pista, lugar?: () => [x, y] en pantalla, radioKa?, detectar(api),
     escena(motor, datos) } */
  AE.registrar = function (h) { huevos.push(h); huevos.sort(function (a, b) { return a.n - b.n; }); };
  AE.registrarFinal = function (h) { final = h; };
  I.huevos = function () { return huevos; };
  I.estado = function () { return estado; };
  I.palabra = function (n) { return PALABRAS[n] || String(n); };
  I.numero = function (n) { return NUMEROS[n] || String(n); };

  function cargar() { try { var s = localStorage.getItem(CLAVE); if (s) { var o = JSON.parse(s); for (var k in o) estado[k] = o[k]; } } catch (e) { /* sin almacenamiento */ } }
  function guardar() { try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { /* sin almacenamiento */ } }
  function cuantos() { return huevos.filter(function (h) { return estado.hallados[h.id]; }).length; }

  /* ---------- disparar un secreto ---------- */
  I.disparar = function (h, datos, op) {
    op = op || {};
    if (E.escena || !$('intro').hidden || !$('creditos').hidden) return false;
    cerrarCuaderno();
    var nuevo = !estado.hallados[h.id] && !op.prueba;
    if (nuevo) { estado.hallados[h.id] = Date.now(); guardar(); }
    h.ultimosDatos = datos || h.ultimosDatos || null;
    var envoltorio = { id: h.id, escena: function (motor) {
      var s = h.escena(motor, datos || h.ultimosDatos || null);
      // «Secreto 03 / 10 · Lugar»: se numera solo, así añadir un secreto es solo añadir su archivo
      if (s && s.tarjeta) {
        if (!s.tarjeta.etiqueta) s.tarjeta.etiqueta = 'Secreto ' + U.dos(h.n) + ' / ' + U.dos(huevos.length) + ' · ' + h.tipo;
        if (s.tarjeta.jero == null) s.tarjeta.jero = h.jero;
      }
      return s;
    } };
    E.reproducir(envoltorio, function () {
      pintarLista(nuevo ? h.id : null);
      if (nuevo) {
        avisoHallado(h);
        var b = $('b-cuaderno'); b.classList.remove('pulso'); void b.offsetWidth; b.classList.add('pulso');
        if (cuantos() === huevos.length && !estado.final && final) setTimeout(function () { I.verFinal(); }, 1600);
      }
    });
    return true;
  };
  I.verFinal = function () {
    if (!final || E.escena) return;
    cerrarCuaderno();
    var primero = Infinity, ultimo = 0;
    huevos.forEach(function (h) { var t = estado.hallados[h.id]; if (t) { primero = Math.min(primero, t); ultimo = Math.max(ultimo, t); } });
    E.reproducir({ id: 'final', escena: function (motor) { return final.escena(motor, { desde: primero, hasta: ultimo, huevos: huevos }); } }, function () {
      if (cuantos() === huevos.length) { estado.final = true; guardar(); }
      pintarLista();
      mostrarCreditos();
    });
  };

  /* ---------- créditos ---------- */
  function mostrarCreditos() {
    var c = $('creditos');
    c.hidden = false; c.classList.remove('saliendo'); void c.offsetWidth; c.classList.add('visible');
    E.bloqueado = true;
    setTimeout(function () { var b = $('creditos-enlace'); try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } }, 2600);
  }
  function cerrarCreditos() {
    var c = $('creditos'); if (c.hidden) return;
    c.classList.remove('visible'); c.classList.add('saliendo');
    E.bloqueado = false; E.ultimoInput = E.t;
    setTimeout(function () { c.hidden = true; c.classList.remove('saliendo'); }, 650);
  }
  I.mostrarCreditos = mostrarCreditos;

  /* ---------- tarjeta ----------
     Su tema (claro u oscuro) se decide al salir y no cambia mientras está puesta, aunque la escena cambie la hora (antes
     cambiaba de colores de golpe a mitad de lectura). Va a la izquierda o, con tarjeta.lado = 'derecha', a la derecha. */
  var tarjetaVisible = false;
  I.tarjeta = function (t) {
    var ta = $('tarjeta');
    if (!t) { ta.classList.remove('visible'); tarjetaVisible = false; soltarRetencion(); return; }
    var v = function (x) { return typeof x === 'function' ? x() : (x || ''); };
    // los jeroglíficos en columna; un cartucho (𓍹…𓍺) se dibuja como óvalo vertical con su nudo abajo, porque los signos
    // de sus extremos son para escritura horizontal. Su tamaño se ajusta midiéndolos (colocarTarjeta)
    var js = Array.from(v(t.jero)), cart = js.length > 2 && js[0] === '𓍹' && js[js.length - 1] === '𓍺';
    if (cart) js = js.slice(1, -1);
    var tj = $('t-jero'); tj.textContent = ''; tj.classList.toggle('cartucho', cart);
    js.forEach(function (g) { tj.appendChild(el('span', '', g)); });   // (un signo por línea: en fila, en un móvil de pie)
    $('t-etq').textContent = v(t.etiqueta);
    $('t-tit').textContent = v(t.titulo);
    $('t-txt').innerHTML = v(t.texto);
    $('t-pie').textContent = v(t.pie);
    ta.classList.toggle('oscura', !!(AE.nilo && AE.nilo.noche > 0.55));
    ta.classList.toggle('derecha', v(t.lado) === 'derecha');
    tarjetaVisible = true; soltarRetencion();
    colocarTarjeta();
    void ta.offsetWidth; ta.classList.add('visible');
  };
  // dónde va y cuánto cabe. Con el friso a toda altura, acaba encima del Nilo (el CSS, con --rio1) y no sube más allá de la
  // cabecera; con el friso centrado (un móvil de pie), va en el papiro libre de debajo del friso (o, si es poco, desde la
  // cenefa de zigzag: nunca tapa el suelo ni el río). Si no cabe, el texto se desplaza dentro (.desborda). La columna de
  // jeroglíficos se mide de verdad (cada signo, en vertical, ocupa más de lo que parece) y no pasa del alto del texto
  function colocarTarjeta() {
    var ta = $('tarjeta'), cu = ta.querySelector('.t-cuerpo'), tj = $('t-jero'), N = AE.nilo;
    var centrado = raiz.classList.contains('friso-centrado'), bajo = window.matchMedia && window.matchMedia('(max-height: 500px)').matches;
    ta.classList.remove('desborda', 'al-final', 'apretada'); cu.style.maxHeight = ''; tj.style.fontSize = '';
    var techo, suelo;   // (px desde arriba: hasta dónde puede subir y dónde acaba)
    if (centrado) {
      var bajoFriso = E.y0 + E.u;
      techo = Math.round(E.H - bajoFriso >= 150 ? bajoFriso + 8 : Math.max(E.sy(N.CEN1) + 4, E.H - 210));
      ta.style.setProperty('--tarjeta-arriba', techo + 'px');
      suelo = E.H - 12;
      // (muy poco sitio, como un móvil de pie con las barras del navegador: fuera la fila de jeroglíficos, que es adorno,
      // y el título más pequeño, para que se lean varias líneas del texto)
      ta.classList.toggle('apretada', suelo - techo < 170);
      // los jeroglíficos, en fila encima de la etiqueta: si la fila no cabe a lo ancho, más pequeños
      var fs = parseFloat(getComputedStyle(tj).fontSize) || 26;
      for (var i = 0; i < 8 && tj.textContent && tj.offsetWidth > cu.offsetWidth - 12 && fs > 14; i++) { fs -= 2; tj.style.fontSize = fs + 'px'; }
    } else {
      var m = document.querySelector('.marca').getBoundingClientRect();
      techo = bajo ? 10 : Math.max(10, m.bottom + 10);   // (en apaisado, el título se va durante las escenas)
      suelo = E.sy(N.RIO1) - 14;
      ajustarColumna(tj, cu.offsetHeight);
    }
    var sobra = ta.offsetHeight - (suelo - techo);
    if (sobra > 0) {
      cu.style.maxHeight = Math.max(80, cu.offsetHeight - sobra) + 'px'; ta.classList.add('desborda');
      if (!centrado) ajustarColumna(tj, cu.offsetHeight);
    }
  }
  function ajustarColumna(tj, alto) {
    if (!tj.textContent) return;
    var fs = parseFloat(getComputedStyle(tj).fontSize) || 46, nudo = tj.classList.contains('cartucho') ? 8 : 0;   // (el nudo del cartucho asoma por debajo)
    for (var i = 0; i < 10 && tj.offsetHeight + nudo > alto && fs > 16; i++) {
      fs = Math.max(16, Math.floor(fs * Math.min(0.96, alto / (tj.offsetHeight + nudo))));
      tj.style.fontSize = fs + 'px';
    }
  }
  // retener la tarjeta: con el puntero encima (o el dedo apoyado, o mientras se desplaza su texto) la escena espera
  // (E.retenida) y la etiqueta dice «En pausa»
  var ret = { puntero: false, dedo: false, desliz: false }, tDesliz = null;
  function aplicarRetencion() {
    var r = tarjetaVisible && (ret.puntero || ret.dedo || ret.desliz);
    E.retenida = r; $('tarjeta').classList.toggle('retenida', r);
  }
  function soltarRetencion() { ret.puntero = ret.dedo = ret.desliz = false; clearTimeout(tDesliz); aplicarRetencion(); }
  function prepararTarjeta() {
    var ta = $('tarjeta'), cu = ta.querySelector('.t-cuerpo');
    ta.addEventListener('pointerenter', function (ev) { if (ev.pointerType !== 'touch') { ret.puntero = true; aplicarRetencion(); } });
    ta.addEventListener('pointerleave', function (ev) { if (ev.pointerType !== 'touch') { ret.puntero = false; aplicarRetencion(); } });
    ta.addEventListener('pointerdown', function (ev) { if (ev.pointerType === 'touch') { ret.dedo = true; aplicarRetencion(); } });
    function levantar(ev) { if (ev.pointerType === 'touch' && ret.dedo) { ret.dedo = false; aplicarRetencion(); } }
    window.addEventListener('pointerup', levantar); window.addEventListener('pointercancel', levantar);
    // (al desplazar el texto con el dedo, el navegador cancela el puntero: mientras se mueve, y un poco después, también espera)
    cu.addEventListener('scroll', function () {
      ret.desliz = true; aplicarRetencion(); clearTimeout(tDesliz);
      tDesliz = setTimeout(function () { ret.desliz = false; aplicarRetencion(); }, 900);
      ta.classList.toggle('al-final', cu.scrollTop + cu.clientHeight >= cu.scrollHeight - 4);
    }, { passive: true });
  }

  /* ---------- aviso ----------
     En el papiro libre de arriba: entre el título y los botones si cabe; si no, entre la cabecera y el friso (un móvil de
     pie) y, si tampoco hay sitio, debajo de los botones. «contenido» es html o un nodo */
  var tAviso = null;
  function aviso(contenido, ms) {
    var caja = $('aviso'); caja.textContent = '';
    if (typeof contenido === 'string') caja.innerHTML = contenido; else caja.appendChild(contenido);
    colocarAviso(caja); caja.classList.add('visible');
    clearTimeout(tAviso); tAviso = setTimeout(function () { caja.classList.remove('visible'); }, ms || 4200);
  }
  I.aviso = aviso;
  function colocarAviso(caja) {
    var m = document.querySelector('.marca').getBoundingClientRect(), b = $('b-cuaderno').getBoundingClientRect(), bs = $('botones').getBoundingClientRect();
    var w = caja.offsetWidth, h = caja.offsetHeight, cab = Math.max(m.bottom, bs.bottom), arriba;
    if ((E.W - w) / 2 >= m.right + 16 && (E.W + w) / 2 <= bs.left - 16) arriba = (b.top + b.bottom - h) / 2;
    else if (E.y0 - cab >= h + 16) arriba = cab + (E.y0 - cab - h) / 2;
    else arriba = bs.bottom + 10;
    caja.style.top = Math.round(Math.max(8, arriba)) + 'px';
  }
  function avisoHallado(h) {
    var t = el('span', 'a-txt'), l = el('span', 'a-linea', 'Secreto encontrado ');
    l.appendChild(el('b', '', U.dos(cuantos()) + '/' + U.dos(huevos.length)));
    t.appendChild(l); t.appendChild(el('span', 'a-nombre', h.nombre));
    aviso(t);
  }

  /* ---------- el papiro de los secretos ---------- */
  function abrirCuaderno() {
    $('cuaderno').classList.add('abierto'); $('cuaderno').setAttribute('aria-hidden', 'false');
    $('b-cuaderno').setAttribute('aria-expanded', 'true'); raiz.classList.add('cuaderno-abierto');
  }
  function cerrarCuaderno() {
    $('cuaderno').classList.remove('abierto'); $('cuaderno').setAttribute('aria-hidden', 'true');
    $('b-cuaderno').setAttribute('aria-expanded', 'false'); raiz.classList.remove('cuaderno-abierto');
  }
  I.abrirCuaderno = abrirCuaderno; I.cerrarCuaderno = cerrarCuaderno;
  I.cuadernoAbierto = function () { return $('cuaderno').classList.contains('abierto'); };

  function fecha(ms) {
    var d = new Date(ms);
    return U.dos(d.getDate()) + '.' + U.dos(d.getMonth() + 1) + '.' + d.getFullYear() + ' · ' + U.dos(d.getHours()) + ':' + U.dos(d.getMinutes());
  }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function pintarLista(recien) {
    var ol = $('lista'); ol.innerHTML = '';
    huevos.forEach(function (h) {
      var ok = !!estado.hallados[h.id];
      var li = el('li', 'entrada' + (ok ? ' hallada' : '') + (recien === h.id ? ' nueva' : ''));
      var num = el('div', 'e-num', I.numero(h.n)); num.setAttribute('aria-label', String(h.n)); li.appendChild(num);
      var c = el('div', 'e-cuerpo');
      c.appendChild(el('div', 'e-tipo', h.tipo));
      var nom = el('div', 'e-nombre');
      if (ok) { nom.textContent = h.nombre; if (h.jero) nom.appendChild(el('small', '', h.jero)); }
      else { var cen = el('span', 'e-censura'); cen.style.width = (h.nombre.length * 0.48 + 0.6) + 'em'; nom.appendChild(cen); nom.setAttribute('aria-label', 'Sin descubrir'); }
      c.appendChild(nom);
      c.appendChild(el('p', 'e-pista', h.pista));
      if (ok || PRUEBA) {
        var meta = el('div', 'e-meta');
        if (ok) meta.appendChild(el('span', '', 'Encontrado ' + fecha(estado.hallados[h.id])));
        var b = el('button', 'e-ver', ok ? '↻ Ver otra vez' : '▶ Probar');
        b.type = 'button';
        b.addEventListener('click', function () { I.disparar(h, null, { prueba: !ok }); });
        meta.appendChild(b); c.appendChild(meta);
      }
      li.appendChild(c); ol.appendChild(li);
    });
    var n = cuantos();
    $('contador').textContent = U.dos(n) + '/' + U.dos(huevos.length);
    var seg = $('segmentos'); seg.innerHTML = ''; seg.style.gridTemplateColumns = 'repeat(' + huevos.length + ', 1fr)';
    for (var i = 0; i < huevos.length; i++) seg.appendChild(el('i', i < n ? 'si' : ''));
    $('ver-final').hidden = !(estado.final || cuantos() === huevos.length || (PRUEBA && final));   // (con los diez, siempre a mano)
    $('c-credito-linea').hidden = !estado.final;
    raiz.classList.toggle('completo', !!estado.final);
    var palabra = I.palabra(huevos.length);
    $('c-intro').textContent = palabra.charAt(0).toUpperCase() + palabra.slice(1) + ' secretos a lo largo del Nilo. Cada pista apunta a uno; el nombre aparece cuando lo encuentras.';
  }

  /* ---------- instrumentos y mapa ---------- */
  var cuadroHud = 0, ultimos = {};
  var tactil = false, vistoRaton = false, dedos = {}, tLatido = -1e9, idMapa = null;
  function barras(id, valor) {
    var b = Math.ceil(valor * 5 - 0.15); if (ultimos[id] === b) return; ultimos[id] = b;
    var is = $(id).children; for (var i = 0; i < is.length; i++) is[i].classList.toggle('si', i < b);
  }
  function texto(id, s) { if (ultimos[id] === s) return; ultimos[id] = s; $(id).textContent = s; }
  function dedoApoyado() { for (var k in dedos) return true; return false; }
  function instrumentos() {
    // el ka: la cercanía del puntero a un secreto con lugar que aún no se ha encontrado. En táctil, sin el dedo apoyado,
    // se mide desde el centro de la pantalla (si no, medía hasta donde se levantó el dedo la última vez), y solo en
    // horizontal: cuánto le falta al secreto para pasar por el medio mientras se navega (la altura del centro no dice nada:
    // medido desde un punto a 0,55 u, el escalón no pasaba de 0,56 y el cartucho de Rosetta de 0,52)
    var objetivo = 0, cerca = null, p = E.puntero, x = p.x, y = p.y, mide = p.sobre, centro = false;
    if ((p.tipo === 'touch' || (tactil && !vistoRaton)) && !dedoApoyado()) { x = E.W / 2; y = E.sy(0.55); mide = true; centro = true; }
    if (mide) huevos.forEach(function (h) {
      if (!h.lugar || estado.hallados[h.id]) return;
      var q = h.lugar(); if (!q) return;
      var d = centro ? Math.abs(x - q[0]) : Math.hypot(x - q[0], y - q[1]);
      var k = U.clamp(1 - d / (E.u * (h.radioKa || 0.3)), 0, 1);
      if (k > objetivo) { objetivo = k; cerca = h; }
    });
    E.senal += (objetivo - E.senal) * 0.12;
    // cerca de un secreto de gesto aún sin encontrar, con el dedo en «Mover»: el botón Escribir late un poco (y no vuelve
    // a latir hasta pasado un rato)
    if (tactil && !E.calamo && cerca && cerca.tipo === 'Gesto' && E.senal >= 0.6 && E.t - tLatido > 20000) latir();
    if (++cuadroHud % 4) return;
    var N = AE.nilo, xu = E.centroXu();
    if (N) { texto('h-lugar', N.lugarEn(xu)); texto('h-hora', N.horaTexto(xu)); }
    barras('h-ka', E.senal);
    ventanaMapa();
  }
  function latir() {
    var be = $('modo-escribir'); tLatido = E.t;
    be.classList.remove('late'); void be.offsetWidth; be.classList.add('late');
    setTimeout(function () { be.classList.remove('late'); }, 3500);
  }
  // la ventana de lo que se ve, en el mapa; mientras se arrastra el mapa, encima, el nombre del sitio (sin salirse)
  function ventanaMapa() {
    var total = E.largo * E.u, m = $('mapa'), w = m.clientWidth, v = $('mapa-ventana');
    var izq = E.camX / total * w, ancho = Math.max(6, E.W / total * w);
    v.style.left = izq + 'px'; v.style.width = ancho + 'px';
    if (idMapa === null || !AE.nilo) return;
    var nom = $('mapa-nombre'); texto('mapa-nombre', AE.nilo.lugarEn(E.centroXu()));
    var r = m.getBoundingClientRect(), mitad = nom.offsetWidth / 2;
    nom.style.left = U.clamp(izq + ancho / 2, 10 + mitad - r.left, E.W - 10 - mitad - r.left) + 'px';
  }
  // las marcas de los sitios en el mapa
  function montarMapa() {
    var m = $('mapa'), N = AE.nilo; if (!N || !N.sitios) return;
    Array.prototype.slice.call(m.querySelectorAll('b')).forEach(function (b) { m.removeChild(b); });
    N.sitios.forEach(function (s) { var b = el('b'); b.style.left = (s.xu / E.largo * 100) + '%'; b.title = s.nombre; m.appendChild(b); });
  }
  /* la geometría del friso, con las mismas cuentas del motor, para el CSS (cada vez que mide): dónde van las cartelas de
     abajo y la tarjeta, y si el friso va centrado (un móvil de pie: papiro libre debajo) */
  function medida() {
    var N = AE.nilo, st = raiz.style, H = E.H;
    st.setProperty('--u', E.u + 'px'); st.setProperty('--y0', E.y0 + 'px'); st.setProperty('--alto', H + 'px');
    if (N) {
      st.setProperty('--motivos', Math.round(H - E.sy((N.CEN1 + 1) / 2)) + 'px');   // (la línea de los ojos de Horus y escarabajos)
      st.setProperty('--rio1', Math.round(H - E.sy(N.RIO1)) + 'px');
    }
    raiz.classList.toggle('friso-centrado', H - (E.y0 + E.u) >= 90);
    medirHud();
    montarMapa();
    if (tarjetaVisible) colocarTarjeta();
    if (!$('intro').hidden) pintarAnkh();
  }
  function medirHud() { var h = $('hud'); if (h) raiz.style.setProperty('--hud-ancho', h.offsetWidth + 'px'); }   // (en apaisado, el mapa ocupa lo que deja)
  // lo que tapa ahora la interfaz, en px de pantalla ({ x, y, w, h }): la cabecera, los botones de arriba, el modo del
  // dedo, los instrumentos y el mapa. Para que el mundo no ponga detrás algo que se tiene que ver (la luna, al aparecer).
  // Mide el DOM: no es para cada fotograma
  I.zonasInterfaz = function () {
    return ['.marca', '#botones', '#modo', '#b-sonido', '#hud', '#mapa'].map(function (s) {
      var e = document.querySelector(s); if (!e || e.hidden) return null;
      var r = e.getBoundingClientRect(); return r.width && r.height ? { x: r.left, y: r.top, w: r.width, h: r.height } : null;
    }).filter(Boolean);
  };

  /* ---------- teclas pulsadas ---------- */
  var SIMBOLOS = { ArrowLeft: '←', ArrowRight: '→' };
  function tecla(d) {
    if (d.repeat) return;
    var s = SIMBOLOS[d.key] || (d.key.length === 1 && /\S/.test(d.key) ? d.key.toUpperCase() : null);
    if (!s) return;
    var cont = $('teclas'), k = el('kbd', '', s);
    cont.appendChild(k);
    while (cont.children.length > 10) cont.removeChild(cont.firstChild);
    setTimeout(function () { if (k.parentNode) k.parentNode.removeChild(k); }, 2300);
  }

  /* ---------- grano (como en sus hermanas) ---------- */
  function grano() {
    try {
      var c = document.createElement('canvas'); c.width = c.height = 180;
      var x = c.getContext('2d'), im = x.createImageData(180, 180), r = U.azar(11);
      for (var i = 0; i < im.data.length; i += 4) { var v = 128 + Math.floor((r() - 0.5) * 255); im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
      x.putImageData(im, 0, 0);
      $('grano').style.backgroundImage = 'url(' + c.toDataURL('image/png') + ')';
    } catch (e) { /* sin grano */ }
  }

  // el ankh de oro de la entrada, dibujado con el kit (como el de la referencia 2), al tamaño que le da el CSS (en un
  // móvil apaisado es más pequeño: se vuelve a pintar al medir)
  function pintarAnkh() {
    var ca = $('intro-ankh'); if (!ca || !AE.estilo || !ca.getContext) return;
    var dd = Math.min(2, window.devicePixelRatio || 1), cw = ca.clientWidth || 86, ch = ca.clientHeight || 150;
    ca.width = Math.round(cw * dd); ca.height = Math.round(ch * dd);
    var cx = ca.getContext('2d'); cx.scale(dd, dd); AE.estilo.ankh(cx, cw / 2, ch * 0.03, ch * 0.94);
  }

  /* ---------- arranque ---------- */
  I.iniciar = function () {
    cargar();
    grano();
    tactil = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    raiz.classList.toggle('tactil', tactil);
    $('ayuda').innerHTML = '<span>Rueda: navegar</span> <span>Arrastra: escribir</span>';   // (dos frases: en una pantalla estrecha, una debajo de otra; en táctil la ayuda va con el modo)
    // en táctil no hay teclado: la entrada no dice «teclea», sino «llama al gato» (tocarlo tres veces es el secreto 08)
    if (tactil) $('intro-txt').innerHTML = 'Este friso sigue el Nilo de Abu Simbel al mar y esconde <span class="n-secretos">diez</span> secretos. Te acompaña un gato negro. Navega, toca, mira de cerca, escribe con el cálamo, llama al gato… o quédate quieto. Lo que encuentres quedará anotado en el papiro del escriba.';
    Array.prototype.forEach.call(document.querySelectorAll('.n-secretos'), function (e) { e.textContent = I.palabra(huevos.length); });
    // en táctil, qué hace el dedo: «Mover | Escribir» (la activa en lapislázuli) y, con él, una línea que lo explica
    if (tactil) {
      E.calamo = false; $('modo').hidden = false;
      var bm = $('modo-mover'), be = $('modo-escribir');
      var pintarModo = function () {
        bm.setAttribute('aria-pressed', String(!E.calamo)); be.setAttribute('aria-pressed', String(!!E.calamo));
        $('modo-ayuda').textContent = E.calamo ? 'Arrastra para escribir · dos dedos: navegar' : 'Desliza para navegar';
      };
      bm.addEventListener('click', function () { E.calamo = false; pintarModo(); });
      be.addEventListener('click', function () { E.calamo = true; be.classList.remove('late'); pintarModo(); });
      pintarModo();
    }
    // los dedos apoyados (para el ka) y si hay ratón de verdad (una tableta con ratón mide desde el puntero)
    window.addEventListener('pointerdown', function (ev) { if (ev.pointerType === 'touch') dedos[ev.pointerId] = 1; else if (ev.pointerType === 'mouse') vistoRaton = true; }, true);
    window.addEventListener('pointermove', function (ev) { if (ev.pointerType === 'mouse') vistoRaton = true; }, true);
    function sinDedo(ev) { delete dedos[ev.pointerId]; }
    window.addEventListener('pointerup', sinDedo, true); window.addEventListener('pointercancel', sinDedo, true);
    prepararTarjeta();

    huevos.forEach(function (h) {
      h.detectar && h.detectar({
        motor: E, en: E.en,
        capa: function (fn) { E.capas.push(fn); },
        hallado: function () { return !!estado.hallados[h.id]; },
        disparar: function (datos) { return I.disparar(h, datos); }
      });
    });
    E.en('cuadro', instrumentos);
    // el final no se puede perder: con los diez y sin haberlo visto (otra escena se cruzó, o se cerró la página a mitad),
    // se lanza en cuanto pasan 1,6 s sin escena ni entrada, también al volver a cargar (no en ?prueba)
    var esperaFinal = 0;
    E.en('cuadro', function (d) {
      if (PRUEBA || !final || estado.final || cuantos() !== huevos.length) { esperaFinal = 0; return; }
      esperaFinal += d.dt; if (esperaFinal > 1600) { esperaFinal = 0; I.verFinal(); }
    });
    E.en('tecla', tecla);
    E.en('medida', medida);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(medirHud);
    // si al empezar no te mueves, una flecha a la derecha invita a navegar (hasta que avances por primera vez)
    var yaAvanzo = false;
    E.capas.push(function (ctx, t) {
      if (yaAvanzo || E.camX > E.u * 0.4) { yaAvanzo = true; return; }
      if (E.t - E.ultimoInput < 5000 || !$('intro').hidden || (AE.nilo && AE.nilo.amaneciendo())) return;
      var a = U.clamp((E.t - E.ultimoInput - 5000) / 800, 0, 1) * (0.55 + 0.35 * Math.sin(t * 0.005)), x = E.W - E.u * 0.09 + Math.sin(t * 0.005) * 6, y = E.sy(0.36);
      ctx.strokeStyle = U.rgba(AE.color.acento, a); ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 22, y); ctx.lineTo(x, y); ctx.moveTo(x - 9, y - 9); ctx.lineTo(x, y); ctx.lineTo(x - 9, y + 9); ctx.stroke();
      AE.fx.texto('NAVEGA', x - 11, y + 26, { tam: 10, alin: 'center', a: a, color: AE.color.acento, espaciado: 2 });
    });

    // el mapa: clic o arrastre para ir a otra parte del Nilo. El puntero se captura y se suelta al levantarlo, al
    // cancelarlo el navegador o al perder la captura (antes, tras un pointercancel el mapa se quedaba «agarrado» y el
    // siguiente arrastre por el friso hacía saltar la cámara)
    var mapa = $('mapa');
    function irMapa(ev) { var r = mapa.getBoundingClientRect(); E.irA(U.clamp((ev.clientX - r.left) / r.width, 0, 1) * E.largo, 900); E.ultimoInput = E.t; }
    mapa.addEventListener('pointerdown', function (ev) {
      if (E.escena || E.bloqueado) return;
      idMapa = ev.pointerId; try { mapa.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
      mapa.classList.add('arrastrando'); irMapa(ev); ventanaMapa();
    });
    window.addEventListener('pointermove', function (ev) { if (ev.pointerId === idMapa) irMapa(ev); });
    function soltarMapa(ev) { if (idMapa === null || (ev && ev.pointerId !== idMapa)) return; idMapa = null; mapa.classList.remove('arrastrando'); }
    window.addEventListener('pointerup', soltarMapa); window.addEventListener('pointercancel', soltarMapa);
    mapa.addEventListener('lostpointercapture', soltarMapa);

    $('b-cuaderno').addEventListener('click', function () { $('cuaderno').classList.contains('abierto') ? cerrarCuaderno() : abrirCuaderno(); });
    $('cerrar-cuaderno').addEventListener('click', cerrarCuaderno);
    $('saltar').addEventListener('click', function () { E.saltar(); });
    $('ver-final').addEventListener('click', function () { I.verFinal(); });
    $('borrar').addEventListener('click', function () {
      if (!window.confirm('¿Borrar todos los secretos encontrados en este navegador?')) return;
      estado = { hallados: {}, final: false, introVista: true }; guardar(); pintarLista();
    });
    window.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !E.escena) { cerrarCuaderno(); cerrarCreditos(); } });

    $('creditos-nombre').textContent = AUTOR.nombre;
    $('c-credito-nombre').textContent = AUTOR.nombre;
    $('creditos-enlace').href = AUTOR.linkedin; $('c-credito').href = AUTOR.linkedin;
    $('creditos-cerrar').addEventListener('click', cerrarCreditos);

    pintarLista();
    montarMapa();

    var intro = $('intro');
    if (!estado.introVista && !PRUEBA) {
      intro.hidden = false; E.bloqueado = true; pintarAnkh();
      if (AE.nilo) AE.nilo.prepararAmanecer();
      $('empezar').addEventListener('click', function () {
        estado.introVista = true; guardar();
        intro.classList.add('saliendo'); E.bloqueado = false; E.ultimoInput = E.t;
        E.emitir('empezar');   // amanece sobre Abu Simbel
        setTimeout(function () { intro.hidden = true; }, 900);
      });
      setTimeout(function () { $('empezar').focus({ preventScroll: true }); }, 50);
    }
  };
})();

/* Aegyptus Incognita · arranque
   Con ?prueba en la dirección, el papiro deja probar todos los secretos (sin apuntarlos) y #id-del-secreto lo lanza al
   cargar (también #final y #creditos). AE.debug sirve para probar desde la consola. */
(function () {
  'use strict';
  var AE = window.AE, E = AE.motor, I = AE.interfaz, U = AE.util, N = AE.nilo;
  I.iniciar();
  E.iniciar(document.getElementById('lienzo'));
  // la pantalla de carga se va cuando están pintadas las teselas que se ven y ha cargado la fuente de los jeroglíficos
  // (sin ella, los signos de fondo saldrían con otra letra y habría que repintarlo todo)
  var fuente = document.fonts && document.fonts.load ? document.fonts.load('40px Jeroglificos', '𓋹') : Promise.resolve();
  function arrancar() {
    var t0 = performance.now();
    N.preparar();
    if (AE.secretos) AE.secretos.preparar();
    U.vaciar();   // (que esté pintado de verdad antes de quitar el aviso: si no, los primeros fotogramas pagan)
    AE.debug.tPreparar = Math.round(performance.now() - t0);
    var c = document.getElementById('cargando');
    if (c) { c.classList.add('fuera'); setTimeout(function () { c.hidden = true; }, 800); }
  }
  fuente.then(function () { setTimeout(arrancar, 20); }, function () { setTimeout(arrancar, 20); });

  function buscar(id) { var h = null; I.huevos().forEach(function (x) { if (x.id === id) h = x; }); return h; }
  AE.debug = {
    disparar: function (id, datos) {
      if (id === 'final') { I.verFinal(); return true; }
      if (id === 'creditos') { I.mostrarCreditos(); return true; }
      var h = buscar(id); return h ? I.disparar(h, datos, { prueba: true }) : false;
    },
    congelar: E.congelar, paso: E.paso,
    ir: function (xu) { E.camX = U.clamp(xu * E.u - E.W / 2, 0, E.maxCam()); E.camObj = null; E.velX = 0; if (AE.gatoCtl) { AE.gatoCtl.xu = E.xuDe(E.W * 0.36); AE.gatoCtl.v = 0; } },
    puntero: function (x, y) { E.puntero.x = x; E.puntero.y = y; E.puntero.sobre = true; E.puntero.tipo = 'mouse'; },
    ids: function () { return I.huevos().map(function (h) { return h.id; }); },
    // todas las capas en un solo lienzo, como se ven (para las capturas: en una WebKit sin ventana no salen los lienzos)
    componer: function () {
      var cv = document.getElementById('lienzo'), c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
      var x = c.getContext('2d'), s = c.width / E.W;
      function teselas(el) {
        if (!el) return; var m = /translate3d\(([-\d.]+)px/.exec(el.style.transform || ''), dx = m ? +m[1] : 0;
        Array.prototype.forEach.call(el.children, function (t) { x.drawImage(t, (dx + parseFloat(t.style.left)) * s, 0, E.TW * s, E.H * s); });
      }
      function tinte(clase) {
        var d = document.querySelector('.' + clase); if (!d || d.style.display === 'none' || !d.style.backgroundColor) return;
        x.save(); x.globalCompositeOperation = 'multiply'; x.fillStyle = d.style.backgroundColor; x.fillRect(0, 0, c.width, c.height); x.restore();
      }
      x.fillStyle = '#f7e2b8'; x.fillRect(0, 0, c.width, c.height);
      teselas(E.capaFondo); tinte('tinte-fondo');
      x.drawImage(E.lienzoCielo, 0, 0, c.width, c.height);
      teselas(E.capaMedio);
      teselas(E.capaMundo);
      x.drawImage(cv, 0, 0);
      teselas(E.capaDelante); tinte('tinte-mundo');
      x.drawImage(E.lienzoBrillo, 0, 0, c.width, c.height);
      if (E.lienzoLuz && E.lienzoLuz.style.display !== 'none' && E.lienzoLuz.width > 1) x.drawImage(E.lienzoLuz, 0, 0, c.width, c.height);
      return c;
    }
  };
  if (location.hash.length > 1) {
    var id = decodeURIComponent(location.hash.slice(1));
    setTimeout(function () { AE.debug.disparar(id); }, 900);
  }
})();

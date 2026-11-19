/* Ayudante del docente: botón flotante con tareas guiadas paso a paso (resalta el botón que hay que tocar).
   Usa window.ES_IR(vista, arg) y window.ES_VISTA() de docente.html. Para agregar una tarea: un objeto más en TAREAS. */
(function () {
  'use strict';
  var TAREAS = [
    { ico: 'examen', t: 'Crear un examen nuevo', pasos: [
      { ir: 'examenes', sel: '[data-nuevo]', txt: 'Pulsa «Nuevo examen». Se llena en 4 pasos: Datos, Preguntas, Restricciones y Compartir.' },
      { ir: 'editor', sel: '[data-paso="datos"]', txt: '1. Datos: título, curso, materia y minutos. Si quieres, también la hora en que abre y cierra.' },
      { sel: '[data-paso="preguntas"]', txt: '2. Preguntas: agrégalas una a una con el botón de cada tipo o pega muchas juntas con «Pegar preguntas».' },
      { sel: '[data-paso="reglas"]', txt: '3. Restricciones: pantalla completa, qué pasa si sale de la ventana, mostrar la nota, una pregunta por página…' },
      { sel: '[data-paso="compartir"]', txt: '4. Compartir: el código y el QR para tus estudiantes, y la versión en papel.' },
      { sel: '#edGuardar', txt: 'Al final pulsa «Guardar». Tu examen aparece en Exámenes con su código.' }] },
    { ico: 'lista', t: 'Preguntas con imagen, video, líneas, algoritmo…', pasos: [
      { ir: 'editor', arg: { paso: 'preguntas' }, sel: '#edCuerpo .filtros', txt: 'Cada botón agrega un tipo: selección, V/F, V/F justificada, respuesta corta, ordenar, algoritmo, diagrama de flujo, relacionar con líneas, clasificar, completar, banco de palabras y numérica.' },
      { sel: '#btnImportar', txt: '«Pegar preguntas» convierte tu texto en preguntas. Escribe «Tipo: algoritmo», «Tipo: palabras»… y una línea «Imagen: https://…» para poner una imagen.' },
      { txt: 'Dentro de cada pregunta abre «Imagen, video o audio»: sube una foto de tu equipo o pega un enlace de YouTube o Google Drive. Así haces «Observa la imagen y contesta» o «Mira el video y responde».' },
      { demo: true, txt: '¿Quieres ver cómo lo ve el estudiante? Pulsa «Abrir la demo»: tiene un ejemplo de cada tipo.' }] },
    { ico: 'estrella', t: 'Ver la demo de todos los tipos', demo: true },
    { ico: 'banco', t: 'Usar un examen ya hecho (banco)', pasos: [
      { ir: 'banco', sel: '#bArea', txt: 'Filtra por Académico, Técnico o Mis materias, o busca por tema.' },
      { sel: '#bLista', txt: 'Abre un examen para ver sus preguntas y pulsa «Usar en mi curso». Se copia a tu curso y lo puedes cambiar.' }] },
    { ico: 'qr', t: 'Aplicar el examen en el aula', pasos: [
      { ir: 'examenes', sel: '[data-comp]', txt: 'En la tarjeta del examen pulsa el botón del QR: proyéctalo o escribe el código en la pizarra.' },
      { txt: 'Cada estudiante abre la página, escribe el código y elige su nombre de la lista.' },
      { sel: '[data-res]', txt: 'Luego abre «Resultados» y pulsa «Ver en vivo»: ves quién está dentro, cuánto lleva y quién salió.' }] },
    { ico: 'grafica', t: 'Resultados, Excel y PDF', pasos: [
      { ir: 'examenes', sel: '[data-res]', txt: 'Pulsa «Resultados» en la tarjeta del examen.' },
      { txt: 'Arriba están los botones Excel y PDF. La pestaña «Preguntas» te dice cuáles fallaron más.' }] },
    { ico: 'corregir', t: 'Corregir respuestas cortas y justificaciones', pasos: [
      { ir: 'examenes', sel: '[data-res]', txt: 'Abre «Resultados» del examen. Si tiene algo por corregir, la tarjeta lo dice en amarillo.' },
      { txt: 'Pestaña «Por corregir»: ves la misma pregunta de todo el curso. Pon 0, la mitad o todo y pulsa Guardar. La nota se recalcula sola.' }] },
    { ico: 'reloj', t: 'Dar más tiempo a un estudiante', pasos: [
      { ir: 'examenes', sel: '[data-res]', txt: 'Abre «Resultados» y busca al estudiante que está «En curso».' },
      { txt: 'Pulsa el botón del reloj en su fila y elige cuántos minutos más.' }] },
    { ico: 'usuarios', t: 'Notas de todo un curso', pasos: [
      { ir: 'reportes', sel: '#rCurso', txt: 'Elige el curso y la materia: ves todas tus notas en una tabla y la bajas en Excel o PDF.' }] },
    { ico: 'imprimir', t: 'Imprimir el examen en papel', pasos: [
      { ir: 'examenes', sel: '[data-comp]', txt: 'Pulsa el botón del QR del examen (Compartir).' },
      { sel: '#btnPapel', txt: '«Versión en papel» baja el PDF listo para imprimir, con la clave al final.' }] },
    { ico: 'libro', t: 'Guía completa y video', ir: 'ayuda' }
  ];
  var TIPS = {
    inicio: 'Aquí ves lo que pasa hoy: exámenes activos, quién está haciendo examen y tus últimos exámenes.',
    examenes: 'Todos tus exámenes. En cada tarjeta: Resultados, Editar, el QR para compartir y Duplicar.',
    editor: 'Ve en orden: Datos → Preguntas → Restricciones → Compartir. No olvides Guardar.',
    resultados: 'Notas, gráfica, quién falta, «Ver en vivo», Excel/PDF y la pestaña «Por corregir».',
    banco: 'Exámenes modelo listos y los que comparten tus colegas. «Usar en mi curso» lo copia para ti.',
    reportes: 'Elige un curso para ver todas tus notas juntas y bajarlas.',
    estudiantes: 'Las listas de cada curso. Los estudiantes eligen su nombre al entrar.',
    ayuda: 'Video tutorial y guía paso a paso.', cuenta: 'Cambia tu contraseña aquí.', docentes: 'Cuentas de los docentes y sus cursos.'
  };
  var $ = function (id) { return document.getElementById(id); }, tour = null;

  var css = document.createElement('style');
  css.textContent =
    '#ayBtn{position:fixed;right:18px;bottom:88px;z-index:60;display:none;align-items:center;gap:8px;padding:12px 16px;border-radius:999px;border:0;background:var(--acento);color:#fff;font:inherit;font-weight:700;box-shadow:var(--sombra);cursor:pointer}' +
    '#ayBtn .ico{width:20px;height:20px}' +
    '#ayPanel{position:fixed;right:18px;bottom:148px;z-index:61;width:min(380px,calc(100vw - 32px));max-height:min(560px,calc(100vh - 170px));overflow:auto;padding:16px;border-radius:20px;background:var(--sup-solida);border:1px solid var(--linea);box-shadow:var(--sombra)}' +
    '#ayPanel h3{margin:0 0 4px;display:flex;gap:8px;align-items:center}#ayPanel .tip{font-size:13.5px;color:var(--suave);margin:0 0 12px;padding:10px 12px;border-radius:12px;background:var(--sup2)}' +
    '#ayPanel .tarea{display:flex;gap:10px;align-items:center;width:100%;text-align:left;padding:10px 12px;margin:0 0 6px;border-radius:12px;border:1px solid var(--linea);background:var(--sup-fuerte);color:var(--texto);font:inherit;font-weight:600;font-size:14.5px;cursor:pointer}' +
    '#ayPanel .tarea:hover{border-color:var(--acento)}#ayPanel .tarea .ico{width:18px;height:18px;color:var(--acento);flex:none}' +
    '#ayFoco{position:fixed;z-index:70;pointer-events:none;border-radius:14px;box-shadow:0 0 0 4px var(--acento),0 0 0 9999px rgba(8,10,25,.55);transition:all .25s}' +
    '#ayBurbuja{position:fixed;z-index:71;width:min(360px,calc(100vw - 32px));padding:16px;border-radius:18px;background:var(--sup-solida);border:1px solid var(--linea);box-shadow:var(--sombra)}' +
    '#ayBurbuja p{margin:0 0 12px;font-size:15px;line-height:1.45}#ayBurbuja .pie{display:flex;gap:8px;align-items:center;flex-wrap:wrap}#ayBurbuja .cuenta{font-size:12.5px;color:var(--tenue);margin-right:auto}' +
    '@media (max-width:820px){#ayBtn{bottom:84px;right:12px;padding:12px}#ayBtn span{display:none}#ayPanel{right:12px;bottom:140px}}';
  document.head.appendChild(css);

  function abrirDemo() { window.open('index.html?demo', '_blank', 'noopener'); }
  function cerrarPanel() { var p = $('ayPanel'); if (p) p.remove(); }
  function panel() {
    if ($('ayPanel')) return cerrarPanel();
    var v = window.ES_VISTA ? window.ES_VISTA() : '', p = document.createElement('div');
    p.id = 'ayPanel'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Ayudante');
    p.innerHTML = '<div style="display:flex;align-items:center"><h3>' + ICO('ayuda') + ' Ayudante</h3><button class="btn fantasma icono" id="ayCerrar" style="margin-left:auto" aria-label="Cerrar">' + ICO('x') + '</button></div>' +
      (TIPS[v] ? '<p class="tip"><b>Estás en ' + esc(v === 'editor' ? 'el editor' : v) + ':</b> ' + esc(TIPS[v]) + '</p>' : '') +
      '<p class="pequeno suave" style="margin:0 0 8px">¿Qué quieres hacer? Te muestro dónde tocar.</p>' +
      TAREAS.map(function (t, i) { return '<button class="tarea" data-t="' + i + '">' + ICO(t.ico) + '<span>' + esc(t.t) + '</span></button>'; }).join('');
    document.body.appendChild(p);
    $('ayCerrar').onclick = cerrarPanel;
    p.onclick = function (e) {
      var b = e.target.closest('[data-t]'); if (!b) return;
      var t = TAREAS[Number(b.dataset.t)]; cerrarPanel();
      if (t.demo) abrirDemo(); else if (t.ir) window.ES_IR(t.ir); else empezar(t);
    };
  }

  function empezar(t) { tour = { t: t, k: 0 }; paso(); }
  function salir() { tour = null; ['ayFoco', 'ayBurbuja'].forEach(function (id) { var x = $(id); if (x) x.remove(); }); }
  function paso() {
    if (!tour) return;
    var s = tour.t.pasos[tour.k];
    if (s.ir) {
      var v = window.ES_VISTA();
      if (s.ir === 'editor' && v === 'editor') {   // ya está editando: solo cambia de pestaña, sin perder lo que escribió
        var pb = s.arg && document.querySelector('[data-paso="' + s.arg.paso + '"]'); if (pb && !pb.classList.contains('on')) pb.click();
      } else if (v !== s.ir) window.ES_IR(s.ir, s.arg || null);
    }
    var hasta = Date.now() + 4000;
    (function esperar() {   // las vistas cargan datos: espera a que aparezca el botón
      if (!tour) return;
      var el = s.sel ? document.querySelector(s.sel) : null;
      if (s.sel && !el && Date.now() < hasta) return setTimeout(esperar, 150);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(function () { mostrar(s, el); }, el ? 380 : 0);
    })();
  }
  function mostrar(s, el) {
    if (!tour) return;
    var n = tour.t.pasos.length, k = tour.k, f = $('ayFoco') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'ayFoco' }));
    var b = $('ayBurbuja') || document.body.appendChild(Object.assign(document.createElement('div'), { id: 'ayBurbuja' }));
    b.setAttribute('role', 'dialog');
    b.innerHTML = '<p>' + esc(s.txt) + '</p><div class="pie"><span class="cuenta">' + esc(tour.t.t) + ' · ' + (k + 1) + ' de ' + n + '</span>' +
      (k ? '<button class="btn claro mini" id="ayAnt">' + ICO('atras') + '</button>' : '') + (s.demo ? '<button class="btn claro mini" id="ayDemo">' + ICO('estrella') + ' Abrir la demo</button>' : '') +
      '<button class="btn primario mini" id="aySig">' + (k < n - 1 ? 'Siguiente ' + ICO('adelante') : ICO('check') + ' Listo') + '</button><button class="btn fantasma mini" id="aySalir">Salir</button></div>';
    $('aySig').onclick = function () { if (k < n - 1) { tour.k++; paso(); } else salir(); };
    if ($('ayAnt')) $('ayAnt').onclick = function () { tour.k--; paso(); };
    if ($('ayDemo')) $('ayDemo').onclick = abrirDemo;
    $('aySalir').onclick = salir;
    tour.el = el; ubicar();
  }
  function ubicar() {
    if (!tour) return;
    var f = $('ayFoco'), b = $('ayBurbuja'), el = tour.el, W = window.innerWidth, H = window.innerHeight, bw = b.offsetWidth, bh = b.offsetHeight;
    if (!el || !el.getClientRects().length) {   // sin botón que señalar: burbuja al centro
      Object.assign(f.style, { left: W / 2 + 'px', top: H / 2 + 'px', width: '0px', height: '0px' });
      Object.assign(b.style, { left: (W - bw) / 2 + 'px', top: (H - bh) / 2 + 'px' }); return;
    }
    var r = el.getBoundingClientRect(), pad = 6;
    Object.assign(f.style, { left: r.left - pad + 'px', top: r.top - pad + 'px', width: r.width + 2 * pad + 'px', height: r.height + 2 * pad + 'px' });
    var top = r.bottom + 14 + bh < H ? r.bottom + 14 : Math.max(10, r.top - 14 - bh);
    Object.assign(b.style, { left: Math.max(12, Math.min(W - bw - 12, r.left + r.width / 2 - bw / 2)) + 'px', top: top + 'px' });
  }
  window.addEventListener('resize', ubicar);
  window.addEventListener('scroll', ubicar, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { salir(); cerrarPanel(); } });

  // Botón flotante: aparece al entrar al panel; la primera vez se abre solo para presentarse.
  var btn = document.createElement('button');
  btn.id = 'ayBtn'; btn.type = 'button'; btn.innerHTML = ICO('ayuda') + '<span>Ayudante</span>'; btn.onclick = panel;
  document.body.appendChild(btn);
  setInterval(function () {
    var app = $('vApp'), dentro = !!app && !app.classList.contains('oculto');
    btn.style.display = dentro ? 'flex' : 'none';
    if (!dentro) { salir(); cerrarPanel(); return; }
    var visto = true; try { visto = !!localStorage.getItem('es-ayudante'); localStorage.setItem('es-ayudante', '1'); } catch (e) {}
    if (!visto) panel();
  }, 800);
})();

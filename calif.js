/* Calificaciones: libretas por curso, materia y periodo; actividades, rúbricas, notas y desglose.
   Todos los cálculos los hace el servidor (Calificaciones.gs); aquí solo se muestran. docente.html llama window.CALIF(ctx). */
(function () {
  'use strict';
  var C = null, INI = null, D = null, TAB = 'notas', CAMBIOS = {};
  var $ = function (id) { return document.getElementById(id); };
  var NIVELES = { PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria', UNIVERSIDAD: 'Universidad', PERSONAL: 'Personalizado' };
  var RECUP = { NINGUNA: 'Sin recuperación', REEMPLAZA: 'Reemplaza (si es mayor)', PROMEDIA: 'Promedia con la del periodo' };

  var css = document.createElement('style');
  css.textContent = '.cal-g td,.cal-g th{padding:6px 8px;white-space:nowrap}.cal-g th{font-size:11px;max-width:110px;white-space:normal;line-height:1.2}' +
    '.cal-g .fijo{position:sticky;left:0;background:var(--sup-solida);z-index:1}.cal-in{width:64px;padding:7px 6px;text-align:center;border:1px solid var(--linea);border-radius:10px;background:var(--sup-fuerte);color:var(--texto);font:inherit}' +
    '.cal-in.ex{font-style:italic;color:var(--acento)}.cal-in.cambio{border-color:var(--acento);box-shadow:0 0 0 3px color-mix(in srgb,var(--acento) 18%,transparent)}.cal-in.com{border-style:dashed}' +
    '.cal-obs{width:200px}.cal-card{margin-bottom:12px}.cal-card .r{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--linea)}.cal-card .r span{flex:1;font-size:14px}' +
    '.cal-rub td{vertical-align:top;cursor:pointer;font-size:13px;border:1px solid var(--linea);padding:8px}.cal-rub td.on{background:var(--morado-t);outline:2px solid var(--acento)}.cal-rub td small{display:block;color:var(--suave);font-weight:700}' +
    '.cal-ed td{vertical-align:top;padding:4px}.cal-ed textarea{min-height:54px;font-size:13px;padding:6px}.cal-ed input{padding:6px 8px}';
  document.head.appendChild(css);

  window.CALIF = function (ctx) { C = ctx; D = null; inicio(); };
  function modal(h) { C.modal('<div id="calM">' + h + '</div>', true); }   // los clics de estas ventanas se escuchan en #calM, no en la caja compartida
  function err(e) { AVISO(e.message, 'error'); }
  function n(v) { return v === null || v === undefined || v === '' ? '—' : String(v); }
  function pag(h) { $('pagina').innerHTML = h; }
  function opciones(lista, sel) { return lista.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(sel) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function copia(o) { return JSON.parse(JSON.stringify(o)); }
  function esc2(s) { return esc(s).replace(/\n/g, '<br>'); }

  /* ---------- Inicio: mis libretas ---------- */
  function inicio() {
    pag('<div class="cargando"><div class="girar"></div><p>Cargando libretas…</p></div>');
    C.A({ action: 'calInicio' }).then(function (r) {
      INI = r;
      var admin = C.yo && C.yo.rol === 'ADMIN';
      pag(C.cabeza('Calificaciones', 'Libretas por curso, materia y periodo: actividades, rúbricas, notas y el desglose de cada estudiante.',
        '<div class="filtros" style="margin:0"><button class="btn claro" id="calRub">' + ICO('lista') + ' Rúbricas</button><button class="btn primario" id="calNueva">' + ICO('mas') + ' Nueva libreta</button></div>') +
        (r.libretas.length ? '<div class="tarjeta desliza"><table class="tabla"><thead><tr><th>Curso</th><th>Materia</th><th>Periodo</th><th>Nivel</th>' + (admin ? '<th>Docente</th>' : '') + '<th></th></tr></thead><tbody>' +
          r.libretas.map(function (l) { return '<tr><td><b>' + esc(l.curso) + '</b></td><td>' + esc(l.materia) + '</td><td>' + l.periodo + '</td><td>' + esc(NIVELES[l.nivel] || l.nivel) + '</td>' +
            (admin ? '<td>' + esc(l.docente) + '</td>' : '') + '<td><button class="btn claro mini" data-abrir="' + esc(l.id) + '">' + ICO('ver') + ' Abrir</button></td></tr>'; }).join('') + '</tbody></table></div>'
          : '<div class="tarjeta vacio"><div class="chip-ico">' + ICO('lista') + '</div><p>Todavía no tienes libretas. Crea una por curso, materia y periodo.</p></div>'));
      $('calNueva').onclick = function () { formLibreta(null); };
      $('calRub').onclick = rubricas;
      $('pagina').onclick = function (e) { var b = e.target.closest('[data-abrir]'); if (b) abrir(b.dataset.abrir); };
    }).catch(function (e) { pag('<div class="tarjeta"><p class="error">' + esc(e.message) + '</p></div>'); });
  }

  /* ---------- Libreta: crear o cambiar esquema ---------- */
  function formLibreta(base) {
    var x = base ? copia(base) : { curso: C.panel.cursos[0] || '', materia: '', nivel: 'SECUNDARIA', periodo: 1, esquema: copia(INI.presets.SECUNDARIA) };
    var E = x.esquema, editando = !!x.id;
    var mats = []; (C.panel.asignaciones || []).forEach(function (a) { if (mats.indexOf(a.materia) < 0) mats.push(a.materia); });
    modal('<h2>' + ICO('lista') + ' ' + (editando ? 'Esquema de la libreta' : 'Nueva libreta') + '</h2>' +
      '<div class="fila"><label class="campo"><span>Curso</span><select class="entrada" id="lCurso"' + (editando ? ' disabled' : '') + '>' + opciones((editando ? [x.curso] : C.panel.cursos).map(function (c) { return [c, c]; }), x.curso) + '</select></label>' +
      '<label class="campo"><span>Materia</span><input class="entrada" id="lMat" list="lMats" maxlength="60" value="' + esc(x.materia) + '"><datalist id="lMats">' + mats.map(function (m) { return '<option value="' + esc(m) + '">'; }).join('') + '</datalist></label></div>' +
      '<div class="fila"><label class="campo"><span>Nivel</span><select class="entrada" id="lNivel">' + opciones(Object.keys(NIVELES).map(function (k) { return [k, NIVELES[k]]; }), x.nivel) + '</select></label>' +
      '<label class="campo"><span>Periodo</span><select class="entrada" id="lPer"></select></label></div>' +
      '<div id="lEsq"></div><p class="error" id="lErr"></p>' +
      '<div class="filtros" style="justify-content:flex-end;margin:0"><button class="btn fantasma" data-cerrar>Cancelar</button><button class="btn primario" id="lOk">' + ICO('check') + ' Guardar</button></div>');
    function per() { $('lPer').innerHTML = opciones(Array.from({ length: Number(E.periodos) || 1 }, function (_, i) { return [i + 1, 'Periodo ' + (i + 1)]; }), x.periodo); }
    function leer() {
      E.escala = $('eEsc').value; E.periodos = $('ePer').value; E.minima = $('eMin').value; E.recuperacion = $('eRec').value;
      E.categorias = [].map.call(document.querySelectorAll('[data-cat]'), function (f, i) { return { id: (E.categorias[i] || {}).id, nombre: f.querySelector('.n').value, peso: f.querySelector('.p').value }; });
      E.niveles = [].map.call(document.querySelectorAll('[data-niv]'), function (f) { return { etiqueta: f.querySelector('.n').value, abrev: f.querySelector('.a').value, valor: f.querySelector('.v').value }; });
      E.letras = $('eLet').checked ? [].map.call(document.querySelectorAll('[data-let]'), function (f) { return { letra: f.querySelector('.n').value, min: f.querySelector('.m').value, gpa: f.querySelector('.g').value }; }) : [];
      x.periodo = $('lPer').value;
    }
    function dibujar() {
      var cual = E.escala === 'CUALITATIVA', suma = E.categorias.reduce(function (a, c) { return a + (Number(c.peso) || 0); }, 0);
      var letras = E.letras && E.letras.length ? E.letras : [];
      $('lEsq').innerHTML = '<div class="fila"><label class="campo"><span>Escala</span><select class="entrada" id="eEsc">' + opciones([['NUMERICA', 'Numérica 0 a 100'], ['CUALITATIVA', 'Cualitativa (niveles de logro)']], E.escala) + '</select></label>' +
        '<label class="campo"><span>Periodos del año</span><input class="entrada" id="ePer" type="number" min="1" max="6" value="' + esc(E.periodos) + '"></label>' +
        '<label class="campo"><span>' + (cual ? 'Valor mínimo para avanzar' : 'Nota mínima para aprobar') + '</span><input class="entrada" id="eMin" type="number" step="any" value="' + esc(E.minima) + '"></label>' +
        '<label class="campo"><span>Recuperación</span><select class="entrada" id="eRec">' + opciones(Object.keys(RECUP).map(function (k) { return [k, RECUP[k]]; }), E.recuperacion) + '</select></label></div>' +
        '<label class="titulo">Categorías y peso (%) · suman <b id="eSuma" class="' + (Math.abs(suma - 100) > 0.01 ? 'error' : '') + '">' + suma + '</b> de 100</label>' +
        E.categorias.map(function (c, i) { return '<div class="filtros" data-cat style="margin:6px 0"><input class="entrada n" maxlength="40" placeholder="Categoría" value="' + esc(c.nombre) + '" style="flex:1"><input class="entrada p" type="number" step="any" min="0" max="100" value="' + esc(c.peso) + '" style="width:90px;min-width:0"><button class="btn fantasma mini" data-quitar="cat" data-i="' + i + '">' + ICO('x') + '</button></div>'; }).join('') +
        '<button class="btn claro mini" data-mas="cat">' + ICO('mas') + ' Categoría</button>' +
        (cual ? '<label class="titulo" style="display:block;margin-top:14px">Niveles (nombre, abreviatura, valor numérico)</label>' + E.niveles.map(function (v, i) {
          return '<div class="filtros" data-niv style="margin:6px 0"><input class="entrada n" maxlength="30" value="' + esc(v.etiqueta) + '" style="flex:1"><input class="entrada a" maxlength="4" value="' + esc(v.abrev) + '" style="width:70px;min-width:0"><input class="entrada v" type="number" step="any" value="' + esc(v.valor) + '" style="width:80px;min-width:0"><button class="btn fantasma mini" data-quitar="niv" data-i="' + i + '">' + ICO('x') + '</button></div>'; }).join('') +
          '<button class="btn claro mini" data-mas="niv">' + ICO('mas') + ' Nivel</button>'
          : '<label class="campo" style="flex-direction:row;align-items:center;margin-top:14px"><input type="checkbox" id="eLet"' + (letras.length ? ' checked' : '') + '> <span>Convertir a letra y GPA</span></label>' +
            '<div id="eLetras"' + (letras.length ? '' : ' class="oculto"') + '>' + (letras.length ? letras : copia(INI.presets.UNIVERSIDAD.letras)).map(function (l, i) {
              return '<div class="filtros" data-let style="margin:6px 0"><input class="entrada n" maxlength="3" placeholder="Letra" value="' + esc(l.letra) + '" style="width:80px;min-width:0"><span class="suave pequeno">desde</span><input class="entrada m" type="number" step="any" value="' + esc(l.min) + '" style="width:80px;min-width:0"><span class="suave pequeno">GPA</span><input class="entrada g" type="number" step="any" value="' + esc(l.gpa) + '" style="width:80px;min-width:0"><button class="btn fantasma mini" data-quitar="let" data-i="' + i + '">' + ICO('x') + '</button></div>'; }).join('') +
            '<button class="btn claro mini" data-mas="let">' + ICO('mas') + ' Letra</button></div>');
      if (!cual) $('eLet').onchange = function () { $('eLetras').classList.toggle('oculto', !this.checked); if (this.checked && !E.letras.length) { leer(); E.letras = copia(INI.presets.UNIVERSIDAD.letras); dibujar(); } };
      $('eEsc').onchange = function () { leer(); if (E.escala === 'CUALITATIVA' && !E.niveles.length) { E.niveles = copia(INI.presets.PRIMARIA.niveles); E.minima = 2; } if (E.escala === 'NUMERICA' && Number(E.minima) < 10) E.minima = 70; dibujar(); };
      $('ePer').onchange = function () { leer(); per(); };
      $('lEsq').oninput = function (e) { if (e.target.classList.contains('p')) { leer(); var s = E.categorias.reduce(function (a, c) { return a + (Number(c.peso) || 0); }, 0); $('eSuma').textContent = Math.round(s * 100) / 100; $('eSuma').className = Math.abs(s - 100) > 0.01 ? 'error' : ''; } };
      $('lEsq').onclick = function (e) {
        var b = e.target.closest('[data-mas],[data-quitar]'); if (!b) return; leer();
        var k = b.dataset.mas || b.dataset.quitar, lista = k === 'cat' ? E.categorias : k === 'niv' ? E.niveles : E.letras;
        if (b.dataset.mas) lista.push(k === 'cat' ? { nombre: '', peso: 0 } : k === 'niv' ? { etiqueta: '', abrev: '', valor: 0 } : { letra: '', min: 0, gpa: 0 }); else lista.splice(Number(b.dataset.i), 1);
        dibujar();
      };
    }
    $('lNivel').onchange = function () { x.nivel = this.value; E = x.esquema = copia(INI.presets[x.nivel]); x.periodo = 1; per(); dibujar(); };
    $('lOk').onclick = function () {
      leer(); $('lErr').textContent = ''; this.disabled = true; var b = this;
      C.A({ action: 'calGuardarLibreta', libreta: { id: x.id, curso: $('lCurso').value, materia: $('lMat').value, periodo: Number(x.periodo), nivel: $('lNivel').value, esquema: E } })
        .then(function (r) { C.cerrarModal(); AVISO('Libreta guardada'); abrir(r.id); }).catch(function (e) { $('lErr').textContent = e.message; b.disabled = false; });
    };
    per(); dibujar();
  }

  /* ---------- Libreta abierta ---------- */
  function abrir(id, tab) {
    if (tab) TAB = tab;
    pag('<div class="cargando"><div class="girar"></div><p>Abriendo libreta…</p></div>');
    return C.A({ action: 'calLibreta', id: id }).then(function (r) { D = r; CAMBIOS = {}; vista(); }).catch(function (e) { err(e); inicio(); });
  }
  function E() { return D.libreta.esquema; }
  function cual() { return E().escala === 'CUALITATIVA'; }
  function titulo() { return D.libreta.curso + ' · ' + D.libreta.materia + ' · Periodo ' + D.libreta.periodo; }
  function vista() {
    var L = D.libreta, R = D.resumen;
    pag(C.cabeza(esc(titulo()), esc(NIVELES[L.nivel] + ' · ' + (cual() ? 'escala cualitativa' : 'nota mínima ' + E().minima) + (L.docente ? ' · ' + L.docente : '')),
      '<div class="filtros" style="margin:0"><button class="btn fantasma" id="cVolver">' + ICO('atras') + ' Libretas</button><button class="btn claro" id="cEsq">' + ICO('ajustes') + ' Esquema</button>' +
      '<button class="btn claro" id="cXls">' + ICO('descargar') + ' Excel</button><button class="btn claro" id="cBol">' + ICO('imprimir') + ' Boletines</button><button class="btn claro" id="cImp">' + ICO('imprimir') + ' Clase</button></div>') +
      '<div class="filtros">' + D.hermanas.map(function (h) { return '<button class="btn ' + (h.id === L.id ? 'primario' : 'claro') + ' mini" data-per="' + esc(h.id) + '">Periodo ' + h.periodo + '</button>'; }).join('') +
      (D.hermanas.length < E().periodos ? '<button class="btn fantasma mini" id="cSig">' + ICO('mas') + ' Otro periodo</button>' : '') + '<button class="btn fantasma mini" id="cBorrar" style="margin-left:auto">' + ICO('borrar') + ' Eliminar libreta</button></div>' +
      '<div class="kpis">' + C.kpi('usuarios', 'azul', D.estudiantes.length, 'Estudiantes') + C.kpi('lista', 'morado', D.actividades.length, 'Actividades') +
      C.kpi('premio', 'amarillo', n(R.promedio), 'Promedio del periodo') + C.kpi('estrella', 'verde', R.aprobados + ' / ' + R.conNota, cual() ? 'Avanzan' : 'Aprobados') + '</div>' +
      '<div class="segmento" id="cTab" style="margin-bottom:12px"><button data-t="notas">' + ICO('editar') + ' Notas</button><button data-t="act">' + ICO('lista') + ' Actividades</button><button data-t="des">' + ICO('grafica') + ' Desglose</button></div><div id="cCuerpo"></div>');
    $('cVolver').onclick = inicio;
    $('cEsq').onclick = function () { formLibreta({ id: L.id, curso: L.curso, materia: L.materia, nivel: L.nivel, periodo: L.periodo, esquema: L.esquema }); };
    if ($('cSig')) $('cSig').onclick = function () { var usados = D.hermanas.map(function (h) { return h.periodo; }), p = 1; while (usados.indexOf(p) >= 0) p++; formLibreta({ curso: L.curso, materia: L.materia, nivel: L.nivel, periodo: p, esquema: L.esquema }); };
    $('cBorrar').onclick = function () { if (confirm('¿Eliminar la libreta ' + titulo() + '? Deja de verse en la lista.')) C.A({ action: 'calEliminarLibreta', id: L.id }).then(function () { AVISO('Libreta eliminada'); inicio(); }).catch(err); };
    $('cXls').onclick = excel; $('cBol').onclick = function () { boletines(D.filas); }; $('cImp').onclick = imprimirClase;
    $('pagina').onclick = function (e) { var b = e.target.closest('[data-per]'); if (b && b.dataset.per !== L.id) { if (!salir()) return; abrir(b.dataset.per); } };
    $('cTab').onclick = function (e) { var b = e.target.closest('[data-t]'); if (b && salir()) { TAB = b.dataset.t; pestana(); } };
    pestana();
  }
  function salir() { if (!Object.keys(CAMBIOS).length) return true; if (!confirm('Tienes notas sin guardar. ¿Salir sin guardarlas?')) return false; CAMBIOS = {}; return true; }
  function pestana() {
    document.querySelectorAll('#cTab [data-t]').forEach(function (b) { b.classList.toggle('on', b.dataset.t === TAB); });
    ({ notas: notas, act: actividades, des: desglose })[TAB]();
  }

  /* ---------- Notas: estudiantes × actividades ---------- */
  function nota(a, e) { return (D.notas[a] || {})[e] || null; }
  function valor(x) { return !x ? '' : x.marca === 'AUSENTE' ? 'A' : x.marca === 'EXCUSA' ? 'E' : x.puntos === '' || x.puntos === null || x.puntos === undefined ? '' : String(x.puntos); }
  function celda(a, e, r, c) {
    var x = nota(a.id, e), v = valor(x), tit = esc((x && x.comentario ? 'Comentario: ' + x.comentario + ' · ' : '') + (x && x.origen ? 'Nota del examen' : 'Doble clic: comentario'));
    var cls = 'cal-in' + (x && x.origen ? ' ex' : '') + (x && x.comentario ? ' com' : '');
    if (a.rubricaId) return '<button class="' + cls + '" data-rub="' + esc(a.id) + '" data-e="' + esc(e) + '" title="' + tit + '">' + esc(v || '—') + '</button>';
    if (cual()) return '<select class="' + cls + '" style="width:76px" data-a="' + esc(a.id) + '" data-e="' + esc(e) + '" data-o="' + esc(v) + '" data-r="' + r + '" data-c="' + c + '" title="' + tit + '"><option value=""></option>' +
      E().niveles.map(function (l) { return '<option value="' + esc(l.valor) + '"' + (String(l.valor) === v ? ' selected' : '') + '>' + esc(l.abrev) + '</option>'; }).join('') +
      '<option value="E"' + (v === 'E' ? ' selected' : '') + '>Exc.</option></select>';
    return '<input class="' + cls + '" inputmode="decimal" autocomplete="off" data-a="' + esc(a.id) + '" data-e="' + esc(e) + '" data-o="' + esc(v) + '" data-r="' + r + '" data-c="' + c + '" value="' + esc(v) + '" placeholder="/' + a.maximo + '" title="' + tit + '">';
  }
  function filaDe(e) { return D.filas.filter(function (f) { return f.nombre === e; })[0] || {}; }
  function notas() {
    var A = D.actividades, rec = E().recuperacion !== 'NINGUNA', movil = window.matchMedia('(max-width: 700px)').matches;
    if (!A.length) { $('cCuerpo').innerHTML = '<div class="tarjeta vacio"><div class="chip-ico">' + ICO('lista') + '</div><p>Primero agrega las actividades de este periodo.</p><button class="btn primario" id="cPrimera">' + ICO('mas') + ' Nueva actividad</button></div>'; $('cPrimera').onclick = function () { formActividad(null); }; return; }
    var ayuda = '<p class="suave pequeno">' + (cual() ? 'Elige el nivel de cada indicador. Exc. = excusa (no cuenta).' : 'Escribe los puntos. A = ausente (cuenta 0), E = excusa (no cuenta). Enter baja a la siguiente fila. Doble clic: comentario. En azul cursiva: nota tomada del examen (escribe otra para cambiarla; bórrala para volver a la del examen).') + '</p>';
    var html;
    if (movil) {
      html = D.estudiantes.map(function (e, r) {
        var f = filaDe(e);
        return '<div class="tarjeta cal-card"><h3 style="justify-content:space-between">' + esc(e) + ' <span class="pildora">' + n(f.periodo) + (f.letra ? ' · ' + esc(f.letra) : '') + '</span></h3>' +
          A.map(function (a, c) { return '<div class="r"><span>' + esc(a.nombre) + ' <small class="tenue">/' + a.maximo + '</small></span>' + celda(a, e, r, c) + '<button class="btn fantasma mini" data-com="' + esc(a.id) + '" data-e="' + esc(e) + '" aria-label="Comentario">' + ICO('editar') + '</button></div>'; }).join('') +
          (rec ? '<div class="r"><span>Recuperación</span><input class="cal-in" inputmode="decimal" data-a="REC" data-e="' + esc(e) + '" data-o="' + esc(n(D.rec[e]).replace('—', '')) + '" value="' + esc(n(D.rec[e]).replace('—', '')) + '"></div>' : '') +
          '<div class="r"><input class="entrada" data-a="OBS" data-e="' + esc(e) + '" data-o="' + esc(f.observacion || '') + '" value="' + esc(f.observacion || '') + '" placeholder="Observación"></div></div>';
      }).join('');
    } else {
      html = '<div class="tarjeta desliza" style="padding:8px"><table class="tabla cal-g"><thead><tr><th class="fijo">Estudiante</th>' +
        A.map(function (a) { return '<th title="' + esc(a.nombre + (a.descripcion ? ' · ' + a.descripcion : '')) + '">' + esc(a.nombre.length > 22 ? a.nombre.slice(0, 20) + '…' : a.nombre) + '<br><span class="tenue">' + (cual() ? '' : '/' + a.maximo) + (a.rubricaId ? ' rúbrica' : '') + (a.examenId ? ' examen' : '') + '</span></th>'; }).join('') +
        (rec ? '<th>Recup.</th>' : '') + '<th>Periodo</th><th>Observación</th></tr></thead><tbody>' +
        D.estudiantes.map(function (e, r) {
          var f = filaDe(e);
          return '<tr><td class="fijo"><b>' + esc(e) + '</b></td>' + A.map(function (a, c) { return '<td>' + celda(a, e, r, c) + '</td>'; }).join('') +
            (rec ? '<td><input class="cal-in" inputmode="decimal" data-a="REC" data-e="' + esc(e) + '" data-o="' + esc(n(D.rec[e]).replace('—', '')) + '" value="' + esc(n(D.rec[e]).replace('—', '')) + '" data-r="' + r + '" data-c="' + A.length + '"></td>' : '') +
            '<td class="n">' + n(f.periodo) + (f.letra ? ' <span class="tenue">' + esc(f.letra) + '</span>' : '') + '</td>' +
            '<td><input class="entrada cal-obs" data-a="OBS" data-e="' + esc(e) + '" data-o="' + esc(f.observacion || '') + '" value="' + esc(f.observacion || '') + '" maxlength="600"></td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    $('cCuerpo').innerHTML = ayuda + html + '<div class="guardar-fijo vidrio"><span class="suave pequeno" id="cEstado" style="margin-right:auto">Sin cambios</span><button class="btn primario" id="cGuardar" disabled>' + ICO('check') + ' Guardar notas</button></div>';
    var cuerpo = $('cCuerpo');
    function marcar(el) {
      var k = el.dataset.a + '|' + el.dataset.e, cambio = el.value.trim() !== el.dataset.o;
      el.classList.toggle('cambio', cambio);
      if (cambio) CAMBIOS[k] = el; else delete CAMBIOS[k];
      var m = Object.keys(CAMBIOS).length; $('cEstado').textContent = m ? m + ' sin guardar' : 'Sin cambios'; $('cGuardar').disabled = !m;
    }
    cuerpo.oninput = cuerpo.onchange = function (e) { if (e.target.dataset && e.target.dataset.a) marcar(e.target); };
    cuerpo.onkeydown = function (e) {
      var el = e.target; if (!el.dataset || el.dataset.r === undefined || ['Enter', 'ArrowDown', 'ArrowUp'].indexOf(e.key) < 0) return;
      if (el.tagName === 'SELECT' && e.key !== 'Enter') return;
      e.preventDefault();
      var sig = cuerpo.querySelector('[data-r="' + (Number(el.dataset.r) + (e.key === 'ArrowUp' ? -1 : 1)) + '"][data-c="' + el.dataset.c + '"]');
      if (sig) { sig.focus(); if (sig.select) sig.select(); }
    };
    cuerpo.ondblclick = function (e) { var el = e.target.closest('[data-a]'); if (el && el.dataset.a !== 'OBS' && el.dataset.a !== 'REC') comentario(el.dataset.a, el.dataset.e); };
    cuerpo.onclick = function (e) {
      var b = e.target.closest('[data-rub]'); if (b) return rubricaNota(b.dataset.rub, b.dataset.e);
      b = e.target.closest('[data-com]'); if (b) comentario(b.dataset.com, b.dataset.e);
    };
    $('cGuardar').onclick = guardarNotas;
  }
  function paquete(el) {
    var a = el.dataset.a, e = el.dataset.e, v = el.value.trim(), x = nota(a, e) || {};
    if (a === 'OBS') return { actividadId: a, estudiante: e, comentario: v };
    if (a === 'REC') return { actividadId: a, estudiante: e, puntos: v };
    var M = { A: 'AUSENTE', E: 'EXCUSA' }[v.toUpperCase()];
    return { actividadId: a, estudiante: e, puntos: M ? '' : v, marca: M || '', comentario: x.comentario || '' };
  }
  function enviar(lista, msg) {
    return C.A({ action: 'calGuardarNotas', libretaId: D.libreta.id, notas: lista }).then(function () { AVISO(msg || 'Notas guardadas'); CAMBIOS = {}; return abrir(D.libreta.id); });
  }
  function guardarNotas() {
    var lista = Object.keys(CAMBIOS).map(function (k) { return paquete(CAMBIOS[k]); });
    $('cGuardar').disabled = true;
    enviar(lista, lista.length + ' notas guardadas').catch(function (e) { err(e); $('cGuardar').disabled = false; });
  }
  function comentario(a, e) {
    if (Object.keys(CAMBIOS).length) return AVISO('Guarda primero las notas.', 'error');
    var x = nota(a, e) || {}, t = prompt('Comentario para ' + e, x.comentario || '');
    if (t === null) return;
    enviar([{ actividadId: a, estudiante: e, puntos: x.origen ? '' : x.puntos, marca: x.marca || '', comentario: t, niveles: x.niveles || '' }], 'Comentario guardado').catch(err);
  }

  /* ---------- Rúbricas ---------- */
  function rubrica(id) { return INI.rubricas.filter(function (r) { return r.id === id; })[0] || null; }
  function rubricaNota(aid, e) {
    if (Object.keys(CAMBIOS).length) return AVISO('Guarda primero las notas.', 'error');
    var a = D.actividades.filter(function (x) { return x.id === aid; })[0], R = rubrica(a.rubricaId), x = nota(aid, e) || {}, sel = Array.isArray(x.niveles) ? x.niveles.slice() : [];
    if (!R) return AVISO('La rúbrica ya no existe; escribe la nota en otra actividad.', 'error');
    var max = R.criterios.reduce(function (s, c) { return s + Math.max.apply(null, c.p); }, 0);
    function total() { var s = 0, ok = true; R.criterios.forEach(function (c, i) { if (sel[i] === undefined) ok = false; else s += c.p[sel[i]]; }); return ok ? Math.round(s / max * a.maximo * 100) / 100 : null; }
    function dib() {
      modal('<h2>' + ICO('lista') + ' ' + esc(R.nombre) + '</h2><p class="suave">' + esc(e) + ' · ' + esc(a.nombre) + ' · haz clic en un nivel por criterio.</p><div class="desliza"><table class="cal-rub" style="border-collapse:collapse;width:100%"><thead><tr><th></th>' +
        R.niveles.map(function (l) { return '<th>' + esc(l) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        R.criterios.map(function (c, i) { return '<tr><th style="text-align:left;padding:8px">' + esc(c.nombre) + '</th>' + c.d.map(function (d, j) { return '<td data-i="' + i + '" data-j="' + j + '" class="' + (sel[i] === j ? 'on' : '') + '"><small>' + c.p[j] + ' pts</small>' + esc(d) + '</td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody></table></div><p><b>Total: ' + n(total()) + ' / ' + a.maximo + '</b></p><div class="filtros" style="justify-content:flex-end;margin:0">' +
        '<button class="btn fantasma" data-m="">Borrar</button><button class="btn fantasma" data-m="AUSENTE">Ausente</button><button class="btn fantasma" data-m="EXCUSA">Excusa</button><button class="btn primario" id="rbOk">' + ICO('check') + ' Guardar</button></div>');
      $('calM').onclick = function (ev) {
        var td = ev.target.closest('td[data-i]'); if (td) { sel[Number(td.dataset.i)] = Number(td.dataset.j); dib(); return; }
        var m = ev.target.closest('[data-m]');
        if (m) enviar([{ actividadId: aid, estudiante: e, puntos: '', marca: m.dataset.m, comentario: m.dataset.m ? x.comentario || '' : '' }]).then(C.cerrarModal).catch(err);
      };
      $('rbOk').onclick = function () { if (total() === null) return AVISO('Elige un nivel en cada criterio.', 'error'); enviar([{ actividadId: aid, estudiante: e, niveles: sel, comentario: x.comentario || '' }]).then(C.cerrarModal).catch(err); };
    }
    dib();
  }
  function rubricas() {
    modal('<h2>' + ICO('lista') + ' Rúbricas</h2><p class="suave">Las modelo se pueden copiar y adaptar. Úsalas en una actividad de la libreta.</p>' +
      '<table class="tabla"><tbody>' + INI.rubricas.map(function (r) {
        return '<tr><td><b>' + esc(r.nombre) + '</b> <span class="pildora' + (r.modelo ? '' : ' verde') + '">' + (r.modelo ? 'Modelo' : 'Mía') + '</span><br><span class="tenue pequeno">' + r.criterios.length + ' criterios · ' + r.niveles.length + ' niveles</span></td><td style="text-align:right;white-space:nowrap">' +
          '<button class="btn fantasma mini" data-imp="' + esc(r.id) + '">' + ICO('imprimir') + '</button><button class="btn fantasma mini" data-cop="' + esc(r.id) + '">' + ICO('copiar') + '</button>' +
          (r.modelo ? '' : '<button class="btn fantasma mini" data-edi="' + esc(r.id) + '">' + ICO('editar') + '</button><button class="btn fantasma mini" data-bor="' + esc(r.id) + '">' + ICO('borrar') + '</button>') + '</td></tr>'; }).join('') + '</tbody></table>' +
      '<div class="filtros" style="justify-content:flex-end;margin:12px 0 0"><button class="btn fantasma" data-cerrar>Cerrar</button><button class="btn primario" id="rbNueva">' + ICO('mas') + ' Nueva rúbrica</button></div>');
    $('rbNueva').onclick = function () { editorRubrica({ nombre: '', niveles: ['Excelente', 'Bueno', 'Regular', 'Insuficiente'], criterios: [{ nombre: '', d: ['', '', '', ''], p: [4, 3, 2, 1] }] }); };
    $('calM').onclick = function (e) {
      var b = e.target.closest('[data-imp],[data-cop],[data-edi],[data-bor]'); if (!b) return;
      var r = rubrica(b.dataset.imp || b.dataset.cop || b.dataset.edi || b.dataset.bor);
      if (b.dataset.imp) imprimirRubrica(r);
      else if (b.dataset.cop) { var c = copia(r); delete c.id; c.nombre = r.nombre + ' (copia)'; editorRubrica(c); }
      else if (b.dataset.edi) editorRubrica(copia(r));
      else if (confirm('¿Borrar la rúbrica ' + r.nombre + '?')) C.A({ action: 'calEliminarRubrica', id: r.id }).then(recargarIni).then(rubricas).catch(err);
    };
  }
  function recargarIni() { return C.A({ action: 'calInicio' }).then(function (r) { INI = r; }); }
  function editorRubrica(R) {
    function leer() {
      R.nombre = $('reNom').value;
      R.niveles = [].map.call(document.querySelectorAll('[data-niv]'), function (i) { return i.value; });
      R.criterios = [].map.call(document.querySelectorAll('[data-cri]'), function (f) {
        return { nombre: f.querySelector('.n').value, d: [].map.call(f.querySelectorAll('textarea'), function (t) { return t.value; }), p: [].map.call(f.querySelectorAll('.p'), function (t) { return t.value; }) };
      });
    }
    function dib() {
      modal('<h2>' + ICO('editar') + ' Rúbrica</h2><label class="campo"><span>Nombre</span><input class="entrada" id="reNom" maxlength="80" value="' + esc(R.nombre) + '"></label>' +
        '<div class="desliza"><table class="cal-ed"><thead><tr><th>Criterio</th>' + R.niveles.map(function (l) { return '<th><input class="entrada" data-niv maxlength="30" value="' + esc(l) + '" style="min-width:120px"></th>'; }).join('') + '</tr></thead><tbody>' +
        R.criterios.map(function (c, i) { return '<tr data-cri><td><input class="entrada n" maxlength="80" value="' + esc(c.nombre) + '" style="min-width:140px"><button class="btn fantasma mini" data-qc="' + i + '">' + ICO('x') + '</button></td>' +
          R.niveles.map(function (_, j) { return '<td><textarea class="entrada" maxlength="300" placeholder="Descriptor">' + esc((c.d || [])[j] || '') + '</textarea><input class="entrada p" type="number" min="0" step="any" value="' + esc((c.p || [])[j] === undefined ? 0 : c.p[j]) + '" title="Puntos"></td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody></table></div><div class="filtros" style="margin:10px 0"><button class="btn claro mini" id="reCri">' + ICO('mas') + ' Criterio</button><button class="btn claro mini" id="reNiv">' + ICO('mas') + ' Nivel</button><button class="btn claro mini" id="reMenos">Quitar último nivel</button></div>' +
        '<p class="error" id="reErr"></p><div class="filtros" style="justify-content:flex-end;margin:0"><button class="btn fantasma" id="reVolver">Volver</button><button class="btn primario" id="reOk">' + ICO('check') + ' Guardar</button></div>');
      $('calM').onclick = function (e) { var b = e.target.closest('[data-qc]'); if (b && R.criterios.length > 1) { leer(); R.criterios.splice(Number(b.dataset.qc), 1); dib(); } };
      $('reCri').onclick = function () { leer(); R.criterios.push({ nombre: '', d: R.niveles.map(function () { return ''; }), p: R.niveles.map(function (_, j) { return R.niveles.length - j; }) }); dib(); };
      $('reNiv').onclick = function () { leer(); if (R.niveles.length >= 6) return; R.niveles.push('Nivel ' + (R.niveles.length + 1)); R.criterios.forEach(function (c) { c.d.push(''); c.p.push(0); }); dib(); };
      $('reMenos').onclick = function () { leer(); if (R.niveles.length <= 2) return; R.niveles.pop(); R.criterios.forEach(function (c) { c.d.pop(); c.p.pop(); }); dib(); };
      $('reVolver').onclick = rubricas;
      $('reOk').onclick = function () {
        leer(); var b = this; b.disabled = true;
        C.A({ action: 'calGuardarRubrica', rubrica: R }).then(function () { AVISO('Rúbrica guardada'); return recargarIni(); }).then(rubricas).catch(function (e) { $('reErr').textContent = e.message; b.disabled = false; });
      };
    }
    dib();
  }

  /* ---------- Actividades ---------- */
  function catNombre(id) { var c = E().categorias.filter(function (x) { return x.id === id; })[0] || E().categorias[0]; return c.nombre; }
  function actividades() {
    var A = D.actividades;
    $('cCuerpo').innerHTML = '<div class="filtros"><button class="btn primario" id="aNueva">' + ICO('mas') + ' Nueva actividad</button></div>' +
      (A.length ? '<div class="tarjeta desliza"><table class="tabla"><thead><tr><th>Actividad</th><th>Categoría</th><th>Fecha</th>' + (cual() ? '' : '<th>Máximo</th>') + '<th>Cómo se califica</th><th></th></tr></thead><tbody>' +
        A.map(function (a) { var r = a.rubricaId && rubrica(a.rubricaId), ex = a.examenId && (C.panel.examenes || []).filter(function (x) { return x.id === a.examenId; })[0];
          return '<tr><td><b>' + esc(a.nombre) + '</b>' + (a.descripcion ? '<br><span class="tenue pequeno">' + esc(a.descripcion) + '</span>' : '') + '</td><td>' + esc(catNombre(a.categoria)) + '</td><td>' + esc(a.fecha ? FECHA(a.fecha) : '—') + '</td>' +
            (cual() ? '' : '<td>' + a.maximo + '</td>') + '<td>' + (r ? 'Rúbrica: ' + esc(r.nombre) : ex ? 'Examen: ' + esc(ex.titulo) + ' (' + (a.criterio === 'ULTIMO' ? 'último' : 'mejor') + ' intento)' : a.examenId ? 'Examen enlazado' : cual() ? 'Nivel de logro' : 'Puntos') + '</td>' +
            '<td style="white-space:nowrap"><button class="btn fantasma mini" data-ed="' + esc(a.id) + '">' + ICO('editar') + '</button><button class="btn fantasma mini" data-bo="' + esc(a.id) + '">' + ICO('borrar') + '</button></td></tr>'; }).join('') + '</tbody></table></div>'
        : '<div class="tarjeta vacio"><p>Sin actividades todavía.</p></div>');
    $('aNueva').onclick = function () { formActividad(null); };
    $('cCuerpo').onclick = function (e) {
      var b = e.target.closest('[data-ed],[data-bo]'); if (!b) return;
      var a = A.filter(function (x) { return x.id === (b.dataset.ed || b.dataset.bo); })[0];
      if (b.dataset.ed) formActividad(a);
      else if (confirm('¿Borrar la actividad ' + a.nombre + '? Sus notas dejan de contar.')) C.A({ action: 'calEliminarActividad', id: a.id }).then(function () { AVISO('Actividad borrada'); abrir(D.libreta.id); }).catch(err);
    };
  }
  function formActividad(a) {
    a = a || { nombre: '', categoria: E().categorias[0].id, fecha: new Date().toISOString().slice(0, 10), maximo: 100, descripcion: '', rubricaId: '', examenId: '', criterio: 'MEJOR' };
    var tipo = a.rubricaId ? 'R' : a.examenId ? 'X' : 'P';
    var exs = (C.panel.examenes || []).filter(function (x) { return x.curso === D.libreta.curso; });
    modal('<h2>' + ICO('lista') + ' ' + (a.id ? 'Actividad' : 'Nueva actividad') + '</h2>' +
      '<label class="campo"><span>Nombre</span><input class="entrada" id="aNom" maxlength="80" value="' + esc(a.nombre) + '"></label>' +
      '<div class="fila"><label class="campo"><span>Categoría</span><select class="entrada" id="aCat">' + opciones(E().categorias.map(function (c) { return [c.id, c.nombre + ' (' + c.peso + ' %)']; }), a.categoria) + '</select></label>' +
      '<label class="campo"><span>Fecha</span><input class="entrada" id="aFec" type="date" value="' + esc(a.fecha) + '"></label></div>' +
      (cual() ? '' : '<div class="fila"><label class="campo"><span>Cómo se califica</span><select class="entrada" id="aTipo">' + opciones([['P', 'Puntos'], ['R', 'Con rúbrica'], ['X', 'Con un examen de la plataforma']], tipo) + '</select></label>' +
        '<label class="campo"><span>Puntos máximos</span><input class="entrada" id="aMax" type="number" min="0.01" step="any" value="' + esc(a.maximo) + '"></label></div>' +
        '<label class="campo" id="aRubC"><span>Rúbrica</span><select class="entrada" id="aRub">' + opciones(INI.rubricas.map(function (r) { return [r.id, r.nombre + (r.modelo ? ' (modelo)' : '')]; }), a.rubricaId) + '</select></label>' +
        '<div class="fila" id="aExC"><label class="campo"><span>Examen</span><select class="entrada" id="aEx">' + (exs.length ? opciones(exs.map(function (x) { return [x.id, x.titulo]; }), a.examenId) : '<option value="">No hay exámenes de este curso</option>') + '</select></label>' +
        '<label class="campo"><span>Nota que se toma</span><select class="entrada" id="aCri">' + opciones([['MEJOR', 'El mejor intento'], ['ULTIMO', 'El último intento']], a.criterio) + '</select></label></div>') +
      '<label class="campo"><span>Descripción (opcional)</span><textarea class="entrada" id="aDes" rows="2" maxlength="500">' + esc(a.descripcion) + '</textarea></label><p class="error" id="aErr"></p>' +
      '<div class="filtros" style="justify-content:flex-end;margin:0"><button class="btn fantasma" data-cerrar>Cancelar</button><button class="btn primario" id="aOk">' + ICO('check') + ' Guardar</button></div>');
    function ver() { if (cual()) return; var t = $('aTipo').value; $('aRubC').classList.toggle('oculto', t !== 'R'); $('aExC').classList.toggle('oculto', t !== 'X'); }
    if (!cual()) { $('aTipo').onchange = function () { if (this.value === 'R' && !a.id) $('aMax').value = ''; ver(); }; ver(); }
    $('aOk').onclick = function () {
      var t = cual() ? 'P' : $('aTipo').value, b = this; b.disabled = true; $('aErr').textContent = '';
      C.A({ action: 'calGuardarActividad', actividad: { id: a.id, libretaId: D.libreta.id, nombre: $('aNom').value, categoria: $('aCat').value, fecha: $('aFec').value, descripcion: $('aDes').value,
        maximo: cual() ? '' : $('aMax').value, rubricaId: t === 'R' ? $('aRub').value : '', examenId: t === 'X' ? $('aEx').value : '', criterio: cual() ? 'MEJOR' : $('aCri').value } })
        .then(function () { C.cerrarModal(); AVISO('Actividad guardada'); abrir(D.libreta.id); }).catch(function (e) { $('aErr').textContent = e.message; b.disabled = false; });
    };
  }

  /* ---------- Desglose ---------- */
  function conLetra() { return cual() || E().letras.length > 0; }
  function desglose() {
    var cats = E().categorias, rec = E().recuperacion !== 'NINGUNA', RF = D.resumenFinal;
    $('cCuerpo').innerHTML = '<div class="tarjeta desliza"><table class="tabla cal-g"><thead><tr><th class="fijo">Estudiante</th>' + cats.map(function (c) { return '<th>' + esc(c.nombre) + '<br><span class="tenue">' + c.peso + ' %</span></th>'; }).join('') +
      '<th>Ponderado</th>' + (rec ? '<th>Recup.</th>' : '') + '<th>Periodo</th><th>Final</th>' + (conLetra() ? '<th>' + (cual() ? 'Nivel' : 'Letra / GPA') + '</th>' : '') + '<th>Estado</th><th></th></tr></thead><tbody>' +
      D.filas.map(function (f, i) {
        return '<tr><td class="fijo"><b>' + esc(f.nombre) + '</b></td>' + f.categorias.map(function (c) { return '<td class="n" title="' + esc(c.obtenidos + ' de ' + c.posibles) + '">' + n(c.valor) + (c.valor !== null && !cual() ? '%' : '') + '</td>'; }).join('') +
          '<td class="n">' + n(f.ponderado) + '</td>' + (rec ? '<td class="n">' + n(f.recuperacion) + '</td>' : '') + '<td class="n">' + n(f.periodo) + '</td><td class="n" title="' + f.periodosConNota + ' periodo(s) con nota">' + n(f.final) + '</td>' +
          (conLetra() ? '<td class="n">' + esc(f.letraFinal || '') + (f.gpaFinal !== null && f.gpaFinal !== undefined ? ' · ' + f.gpaFinal : '') + '</td>' : '') +
          '<td><span class="pildora ' + (/Aprob|Avanza/.test(f.estadoFinal) ? 'verde' : f.estadoFinal ? 'rojo' : '') + '">' + esc(f.estadoFinal || 'Sin notas') + '</span></td>' +
          '<td><button class="btn fantasma mini" data-bol="' + i + '">' + ICO('imprimir') + ' Boletín</button></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="suave pequeno">Cada categoría: puntos obtenidos ÷ posibles (pasa el ratón para verlos). Las categorías sin notas no cuentan todavía. Final = promedio de los periodos con nota. ' +
      'Final de la clase: promedio ' + n(RF.promedio) + ' · ' + RF.aprobados + ' de ' + RF.conNota + (cual() ? ' avanzan.' : ' aprobados.') + '</p>';
    $('cCuerpo').onclick = function (e) { var b = e.target.closest('[data-bol]'); if (b) boletines([D.filas[Number(b.dataset.bol)]]); };
  }

  /* ---------- Excel e impresión ---------- */
  function excel() {
    var A = D.actividades, cats = E().categorias, rec = E().recuperacion !== 'NINGUNA';
    var notas = [['Estudiante'].concat(A.map(function (a) { return a.nombre + (cual() ? '' : ' (/' + a.maximo + ')'); })).concat(rec ? ['Recuperación'] : []).concat(['Periodo'])]
      .concat(D.estudiantes.map(function (e) { var f = filaDe(e); return [e].concat(A.map(function (a) { return valor(nota(a.id, e)); })).concat(rec ? [D.rec[e] === undefined ? '' : D.rec[e]] : []).concat([f.periodo === null ? '' : f.periodo]); }));
    var des = [['Estudiante'].concat(cats.map(function (c) { return c.nombre + ' (' + c.peso + '%)'; })).concat(['Ponderado', 'Recuperación', 'Periodo', 'Final', cual() ? 'Nivel' : 'Letra', 'GPA', 'Estado', 'Observación'])]
      .concat(D.filas.map(function (f) { return [f.nombre].concat(f.categorias.map(function (c) { return c.valor === null ? '' : c.valor; })).concat([f.ponderado === null ? '' : f.ponderado, f.recuperacion, f.periodo === null ? '' : f.periodo,
        f.final === null ? '' : f.final, f.letraFinal || '', f.gpaFinal === null || f.gpaFinal === undefined ? '' : f.gpaFinal, f.estadoFinal, f.observacion]); }));
    var act = [['Actividad', 'Categoría', 'Fecha', 'Máximo', 'Descripción']].concat(A.map(function (a) { return [a.nombre, catNombre(a.categoria), a.fecha, a.maximo, a.descripcion]; }));
    AVISO('Preparando el Excel…');
    C.excel('Calificaciones ' + titulo(), [{ nombre: 'Notas', filas: notas }, { nombre: 'Desglose', filas: des }, { nombre: 'Actividades', filas: act }]);
  }
  function ventana(titulo, cuerpo) {
    var w = window.open('', '_blank'); if (!w) { AVISO('Permite las ventanas emergentes para imprimir.', 'error'); return; }
    w.document.write('<!doctype html><html lang="es"><head><meta charset="utf-8"><title>' + esc(titulo) + '</title><style>' +
      'body{font-family:system-ui,sans-serif;color:#111;margin:24px;font-size:13px}h1{font-size:18px;margin:0 0 2px}h2{font-size:14px;margin:16px 0 6px}.s{color:#555;margin:0 0 12px}' +
      'table{border-collapse:collapse;width:100%;margin-bottom:10px}th,td{border:1px solid #bbb;padding:5px 7px;text-align:left;vertical-align:top}th{background:#eef0fb}.c{text-align:center}' +
      '.hoja{page-break-after:always}.hoja:last-child{page-break-after:auto}.firmas{display:flex;gap:40px;margin-top:40px}.firmas div{flex:1;border-top:1px solid #333;text-align:center;padding-top:4px}' +
      '.no{margin-bottom:12px}@media print{.no{display:none}body{margin:10mm}}</style></head><body><p class="no"><button onclick="print()">Imprimir</button></p>' + cuerpo + '</body></html>');
    w.document.close(); setTimeout(function () { w.print(); }, 300);
  }
  function encabezado() { var L = D.libreta; return '<h1>' + esc(MARCA) + (C.yo && C.yo.centroNombre ? ' · ' + esc(C.yo.centroNombre) : '') + '</h1><p class="s">' + esc(L.curso + ' · ' + L.materia + ' · Periodo ' + L.periodo + ' · ' + NIVELES[L.nivel] + ' · Docente: ' + L.docente) + '</p>'; }
  function boletines(filas) {
    var A = D.actividades, cats = E().categorias;
    ventana('Boletín ' + titulo(), filas.map(function (f) {
      return '<div class="hoja">' + encabezado() + '<h2>Boletín de calificaciones: ' + esc(f.nombre) + '</h2>' +
        '<table><tr><th>Categoría</th><th class="c">Peso</th><th class="c">Obtenido / posible</th><th class="c">' + (cual() ? 'Promedio' : '%') + '</th></tr>' +
        f.categorias.map(function (c) { return '<tr><td>' + esc(c.nombre) + '</td><td class="c">' + c.peso + ' %</td><td class="c">' + (c.posibles ? c.obtenidos + ' / ' + c.posibles : '—') + '</td><td class="c">' + n(c.valor) + '</td></tr>'; }).join('') + '</table>' +
        '<table><tr><th>Actividad</th><th>Categoría</th><th class="c">Nota</th><th>Comentario</th></tr>' + A.map(function (a) { var x = nota(a.id, f.nombre);
          return '<tr><td>' + esc(a.nombre) + '</td><td>' + esc(catNombre(a.categoria)) + '</td><td class="c">' + esc(valor(x) || '—') + (cual() ? '' : ' / ' + a.maximo) + '</td><td>' + esc(x && x.comentario || '') + '</td></tr>'; }).join('') + '</table>' +
        '<table><tr><th>Ponderado</th>' + (E().recuperacion !== 'NINGUNA' ? '<th>Recuperación</th>' : '') + '<th>Nota del periodo</th>' + f.periodos.map(function (p) { return '<th>P' + p.periodo + '</th>'; }).join('') + '<th>Final</th>' + (conLetra() ? '<th>' + (cual() ? 'Nivel' : 'Letra / GPA') + '</th>' : '') + '<th>Estado</th></tr>' +
        '<tr><td class="c">' + n(f.ponderado) + '</td>' + (E().recuperacion !== 'NINGUNA' ? '<td class="c">' + n(f.recuperacion) + '</td>' : '') + '<td class="c"><b>' + n(f.periodo) + '</b></td>' + f.periodos.map(function (p) { return '<td class="c">' + n(p.nota) + '</td>'; }).join('') +
        '<td class="c"><b>' + n(f.final) + '</b></td>' + (conLetra() ? '<td class="c">' + esc(f.letraFinal || '') + (f.gpaFinal !== null && f.gpaFinal !== undefined ? ' · ' + f.gpaFinal : '') + '</td>' : '') + '<td class="c">' + esc(f.estadoFinal || 'Sin notas') + '</td></tr></table>' +
        (f.observacion ? '<h2>Observaciones</h2><p>' + esc2(f.observacion) + '</p>' : '') + '<div class="firmas"><div>Docente</div><div>Padre, madre o tutor</div></div></div>';
    }).join(''));
  }
  function imprimirClase() {
    var cats = E().categorias, R = D.resumen;
    ventana('Clase ' + titulo(), encabezado() + '<table><tr><th>#</th><th>Estudiante</th>' + cats.map(function (c) { return '<th class="c">' + esc(c.nombre) + ' (' + c.peso + '%)</th>'; }).join('') + '<th class="c">Periodo</th><th class="c">Final</th>' + (conLetra() ? '<th class="c">' + (cual() ? 'Nivel' : 'Letra') + '</th>' : '') + '<th>Estado</th></tr>' +
      D.filas.map(function (f, i) { return '<tr><td class="c">' + (i + 1) + '</td><td>' + esc(f.nombre) + '</td>' + f.categorias.map(function (c) { return '<td class="c">' + n(c.valor) + '</td>'; }).join('') + '<td class="c"><b>' + n(f.periodo) + '</b></td><td class="c">' + n(f.final) + '</td>' +
        (conLetra() ? '<td class="c">' + esc(f.letraFinal || '') + '</td>' : '') + '<td>' + esc(f.estadoFinal || '') + '</td></tr>'; }).join('') + '</table>' +
      '<p>Promedio del periodo: <b>' + n(R.promedio) + '</b> · ' + (cual() ? 'Avanzan' : 'Aprobados') + ': <b>' + R.aprobados + '</b> de ' + R.conNota + ' · Reprobados: ' + R.reprobados + '</p>');
  }
  function imprimirRubrica(R) {
    ventana('Rúbrica ' + R.nombre, '<h1>' + esc(R.nombre) + '</h1><p class="s">' + esc(MARCA) + '</p><table><tr><th>Criterio</th>' + R.niveles.map(function (l) { return '<th>' + esc(l) + '</th>'; }).join('') + '</tr>' +
      R.criterios.map(function (c) { return '<tr><td><b>' + esc(c.nombre) + '</b></td>' + c.d.map(function (d, j) { return '<td>' + esc(d) + '<br><b>' + c.p[j] + ' pts</b></td>'; }).join('') + '</tr>'; }).join('') + '</table>' +
      '<p>Estudiante: ______________________________ Total: ______ / ' + R.criterios.reduce(function (s, c) { return s + Math.max.apply(null, c.p); }, 0) + '</p>');
  }
})();

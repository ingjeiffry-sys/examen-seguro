/* Calificaciones: una libreta por curso y materia con la estructura de evaluación que elija el docente (períodos, RA, parciales, cortes…);
   actividades por unidad, rúbricas, notas, desglose por unidad y vista Final.
   Todos los cálculos los hace el servidor (Calificaciones.gs); aquí solo se muestran. docente.html llama window.CALIF(ctx). */
(function () {
  'use strict';
  var C = null, INI = null, D = null, TAB = 'notas', CAMBIOS = {}, U = null, ULIB = null;   // U: id de la unidad abierta, 'FIN' = final, '' = sin unidad
  var $ = function (id) { return document.getElementById(id); };
  var NIVELES = { PRIMARIA: 'Primaria', SECUNDARIA: 'Secundaria', TECNICO: 'Técnico profesional (ETP)', UNIVERSIDAD: 'Universidad', CORTES: 'Universidad por cortes', PERSONAL: 'Personalizado' };
  var RECUP = { NINGUNA: 'Sin recuperación', REEMPLAZA: 'Reemplaza (si es mayor)', PROMEDIA: 'Promedia con la de la unidad' };
  var CALCULOS = { PROMEDIO: 'Promedio simple de las unidades', PONDERADO: 'Promedio ponderado por peso de cada unidad', SUMA: 'Suma de puntos acumulados',
    CADA_UNA: 'Cada unidad debe aprobarse (promedio)' };

  var css = document.createElement('style');
  css.textContent = '.cal-g td,.cal-g th{padding:6px 8px;white-space:nowrap}.cal-g th{font-size:11px;max-width:110px;white-space:normal;line-height:1.2}' +
    '.cal-g .fijo{position:sticky;left:0;background:var(--sup-solida);z-index:1}.cal-in{width:64px;padding:7px 6px;text-align:center;border:1px solid var(--linea);border-radius:10px;background:var(--sup-fuerte);color:var(--texto);font:inherit}' +
    '.cal-in.ex{font-style:italic;color:var(--acento)}.cal-in.cambio{border-color:var(--acento);box-shadow:0 0 0 3px color-mix(in srgb,var(--acento) 18%,transparent)}.cal-in.com{border-style:dashed}' +
    '.cal-obs{width:200px}.cal-card{margin-bottom:12px}.cal-card .r{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--linea)}.cal-card .r span{flex:1;font-size:14px}' +
    '.cal-rub td{vertical-align:top;cursor:pointer;font-size:13px;border:1px solid var(--linea);padding:8px}.cal-rub td.on{background:var(--morado-t);outline:2px solid var(--acento)}.cal-rub td small{display:block;color:var(--suave);font-weight:700}' +
    '.cal-ed td{vertical-align:top;padding:4px}.cal-ed textarea{min-height:54px;font-size:13px;padding:6px}.cal-ed input{padding:6px 8px}.cal-u{flex-wrap:wrap}.cal-pend{color:var(--rojo,#c62828);font-weight:700}';
  document.head.appendChild(css);

  window.CALIF = function (ctx) { C = ctx; D = null; inicio(); };
  function modal(h) { C.modal('<div id="calM">' + h + '</div>', true); }   // los clics de estas ventanas se escuchan en #calM, no en la caja compartida
  function err(e) { AVISO(e.message, 'error'); }
  function n(v) { return v === null || v === undefined || v === '' ? '—' : String(v); }
  function pag(h) { $('pagina').innerHTML = h; }
  function opciones(lista, sel) { return lista.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(sel) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); }
  function copia(o) { return JSON.parse(JSON.stringify(o)); }
  function esc2(s) { return esc(s).replace(/\n/g, '<br>'); }
  /** Igual que calNombreUnidad_ del servidor: RA1, Parcial 1, Período 1. */
  function nombreU(unidad, otro, i) { return unidad === 'RA' ? 'RA' + (i + 1) : (unidad === 'OTRO' ? otro || 'Unidad' : INI.unidades[unidad]) + ' ' + (i + 1); }

  /* ---------- Inicio: mis libretas ---------- */
  function inicio() {
    pag('<div class="cargando"><div class="girar"></div><p>Cargando libretas…</p></div>');
    C.A({ action: 'calInicio' }).then(function (r) {
      INI = r;
      var admin = C.yo && C.yo.rol === 'ADMIN';
      pag(C.cabeza('Calificaciones', 'Una libreta por curso y materia, evaluada como trabaje tu centro: períodos, RA, parciales, cortes… con actividades, rúbricas, notas y el desglose de cada estudiante.',
        '<div class="filtros" style="margin:0"><button class="btn claro" id="calRub">' + ICO('lista') + ' Rúbricas</button><button class="btn primario" id="calNueva">' + ICO('mas') + ' Nueva libreta</button></div>') +
        (r.libretas.length ? '<div class="tarjeta desliza"><table class="tabla"><thead><tr><th>Curso</th><th>Materia</th><th>Evaluación</th><th>Nivel</th>' + (admin ? '<th>Docente</th>' : '') + '<th></th></tr></thead><tbody>' +
          r.libretas.map(function (l) { return '<tr><td><b>' + esc(l.curso) + '</b></td><td>' + esc(l.materia) + '</td><td>' + esc(l.estructura) + '</td><td>' + esc(NIVELES[l.nivel] || l.nivel) + '</td>' +
            (admin ? '<td>' + esc(l.docente) + '</td>' : '') + '<td><button class="btn claro mini" data-abrir="' + esc(l.id) + '">' + ICO('ver') + ' Abrir</button></td></tr>'; }).join('') + '</tbody></table></div>'
          : '<div class="tarjeta vacio"><div class="chip-ico">' + ICO('lista') + '</div><p>Todavía no tienes libretas. Crea una por curso y materia y elige cómo se evalúa.</p></div>'));
      $('calNueva').onclick = function () { formLibreta(null); };
      $('calRub').onclick = rubricas;
      $('pagina').onclick = function (e) { var b = e.target.closest('[data-abrir]'); if (b) abrir(b.dataset.abrir); };
    }).catch(function (e) { pag('<div class="tarjeta"><p class="error">' + esc(e.message) + '</p></div>'); });
  }

  /* ---------- Libreta: crear o cambiar esquema y estructura de evaluación ---------- */
  function formLibreta(base) {
    var x = base ? copia(base) : { curso: C.panel.cursos[0] || '', materia: '', nivel: 'SECUNDARIA', esquema: copia(INI.presets.SECUNDARIA) };
    var E = x.esquema, editando = !!x.id, usaP = E.unidades.some(function (u) { return u.peso !== null && u.peso !== undefined && u.peso !== ''; });
    var mats = []; (C.panel.asignaciones || []).forEach(function (a) { if (mats.indexOf(a.materia) < 0) mats.push(a.materia); });
    modal('<h2>' + ICO('lista') + ' ' + (editando ? 'Esquema de la libreta' : 'Nueva libreta') + '</h2>' +
      '<div class="fila"><label class="campo"><span>Curso</span><select class="entrada" id="lCurso"' + (editando ? ' disabled' : '') + '>' + opciones((editando ? [x.curso] : C.panel.cursos).map(function (c) { return [c, c]; }), x.curso) + '</select></label>' +
      '<label class="campo"><span>Materia o módulo</span><input class="entrada" id="lMat" list="lMats" maxlength="60" value="' + esc(x.materia) + '"><datalist id="lMats">' + mats.map(function (m) { return '<option value="' + esc(m) + '">'; }).join('') + '</datalist></label></div>' +
      '<label class="campo"><span>Modelo (solo llena el esquema; todo se puede cambiar)</span><select class="entrada" id="lNivel">' + opciones(Object.keys(NIVELES).map(function (k) { return [k, NIVELES[k]]; }), x.nivel) + '</select></label>' +
      (editando ? '<p class="suave pequeno">Si quitas unidades que ya tienen actividades, esas actividades y sus notas no se borran: quedan «sin unidad» hasta que las pases a otra.</p>' : '') +
      '<div id="lEsq"></div><p class="error" id="lErr"></p>' +
      '<div class="filtros" style="justify-content:flex-end;margin:0"><button class="btn fantasma" data-cerrar>Cancelar</button><button class="btn primario" id="lOk">' + ICO('check') + ' Guardar</button></div>');
    function conPesos() { return E.calculo === 'PONDERADO' || E.calculo === 'SUMA' || (E.calculo === 'CADA_UNA' && usaP); }
    function suma(l) { return Math.round(l.reduce(function (a, v) { return a + (Number(v) || 0); }, 0) * 100) / 100; }
    function leer() {
      E.escala = $('eEsc').value; E.minima = $('eMin').value; E.recuperacion = $('eRec').value;
      E.unidad = $('eUni').value; E.unidadOtro = $('eOtro') ? $('eOtro').value : ''; E.calculo = $('eCalc').value;
      if ($('eUsaP')) usaP = $('eUsaP').checked;
      E.pesosPorUnidad = !!($('ePpu') && $('ePpu').checked);
      E.categorias = [].map.call(document.querySelectorAll('[data-cat]'), function (f, i) { return { id: (E.categorias[i] || {}).id, nombre: f.querySelector('.n').value, peso: f.querySelector('.p').value }; });
      E.unidades = [].map.call(document.querySelectorAll('[data-uni]'), function (f, i) {
        var u = E.unidades[i] || {}, p = f.querySelector('.p'), d = f.querySelector('.d');
        return { nombre: f.querySelector('.n').value, peso: p ? p.value : null, descripcion: d ? d.value : u.descripcion || '', pesos: u.pesos };
      });
      document.querySelectorAll('[data-pu]').forEach(function (i) { var u = E.unidades[Number(i.dataset.pu)]; u.pesos = u.pesos || []; u.pesos[Number(i.dataset.pc)] = i.value; });
      E.niveles = [].map.call(document.querySelectorAll('[data-niv]'), function (f) { return { etiqueta: f.querySelector('.n').value, abrev: f.querySelector('.a').value, valor: f.querySelector('.v').value }; });
      E.letras = $('eLet') && $('eLet').checked ? [].map.call(document.querySelectorAll('[data-let]'), function (f) { return { letra: f.querySelector('.n').value, min: f.querySelector('.m').value, gpa: f.querySelector('.g').value }; }) : [];
    }
    function dibujar() {
      var cual = E.escala === 'CUALITATIVA', sumaC = suma(E.categorias.map(function (c) { return c.peso; })), pesos = conPesos();
      var letras = E.letras && E.letras.length ? E.letras : [], ppu = E.pesosPorUnidad && E.categorias.length > 1;
      $('lEsq').innerHTML = '<label class="titulo">Estructura de evaluación</label>' +
        '<div class="fila"><label class="campo"><span>Se evalúa por</span><select class="entrada" id="eUni">' + opciones(Object.keys(INI.unidades).map(function (k) { return [k, INI.unidades[k]]; }), E.unidad) + '</select></label>' +
        (E.unidad === 'OTRO' ? '<label class="campo"><span>¿Cómo se llama?</span><input class="entrada" id="eOtro" maxlength="30" value="' + esc(E.unidadOtro || '') + '"></label>' : '') +
        '<label class="campo"><span>Cantidad (1 a 20)</span><input class="entrada" id="eCant" type="number" min="1" max="20" value="' + E.unidades.length + '"></label></div>' +
        '<div class="fila"><label class="campo"><span>Nota final</span><select class="entrada" id="eCalc">' + opciones(Object.keys(CALCULOS).map(function (k) { return [k, CALCULOS[k]]; }), E.calculo) + '</select></label>' +
        (E.calculo === 'CADA_UNA' ? '<label class="campo" style="flex-direction:row;align-items:center"><input type="checkbox" id="eUsaP"' + (usaP ? ' checked' : '') + '> <span>Dar un peso a cada unidad</span></label>' : '') + '</div>' +
        E.unidades.map(function (u, i) {
          return '<div class="filtros" data-uni style="margin:6px 0"><input class="entrada n" maxlength="40" value="' + esc(u.nombre) + '" style="flex:1;min-width:110px" aria-label="Nombre de la unidad ' + (i + 1) + '">' +
            (pesos ? '<input class="entrada p" type="number" step="any" min="0" max="100" placeholder="Peso %" value="' + esc(u.peso === null || u.peso === undefined ? '' : u.peso) + '" style="width:90px;min-width:0" aria-label="Peso">' : '') +
            (E.unidad === 'RA' ? '<input class="entrada d" maxlength="200" placeholder="Descripción del RA (opcional)" value="' + esc(u.descripcion || '') + '" style="flex:2;min-width:160px">' : '') + '</div>'; }).join('') +
        (pesos ? '<p class="pequeno">Pesos de las unidades: suman <b id="eSumaU" class="' + (Math.abs(suma(E.unidades.map(function (u) { return u.peso; })) - 100) > 0.01 ? 'error' : '') + '">' + suma(E.unidades.map(function (u) { return u.peso; })) + '</b> de 100 ' +
          '<button class="btn fantasma mini" data-repartir>Repartir igual</button>' + (E.calculo === 'SUMA' ? ' · cada unidad aporta su nota × peso ÷ 100; las que faltan aportan 0.' : '') + '</p>' : '') +
        (E.calculo === 'CADA_UNA' ? '<p class="suave pequeno">Si una unidad con nota queda bajo la mínima, el estado final dice «Pendiente: …» aunque el promedio apruebe.</p>' : '') +
        '<label class="titulo" style="display:block;margin-top:14px">Escala y aprobación</label>' +
        '<div class="fila"><label class="campo"><span>Escala</span><select class="entrada" id="eEsc">' + opciones([['NUMERICA', 'Numérica 0 a 100'], ['CUALITATIVA', 'Cualitativa (niveles de logro)']], E.escala) + '</select></label>' +
        '<label class="campo"><span>' + (cual ? 'Valor mínimo para avanzar' : 'Nota mínima para aprobar') + '</span><input class="entrada" id="eMin" type="number" step="any" value="' + esc(E.minima) + '"></label>' +
        '<label class="campo"><span>Recuperación (en cada unidad)</span><select class="entrada" id="eRec">' + opciones(Object.keys(RECUP).map(function (k) { return [k, RECUP[k]]; }), E.recuperacion) + '</select></label></div>' +
        '<label class="titulo">Categorías dentro de cada unidad y peso (%) · suman <b id="eSuma" class="' + (Math.abs(sumaC - 100) > 0.01 ? 'error' : '') + '">' + sumaC + '</b> de 100</label>' +
        E.categorias.map(function (c, i) { return '<div class="filtros" data-cat style="margin:6px 0"><input class="entrada n" maxlength="40" placeholder="Categoría" value="' + esc(c.nombre) + '" style="flex:1"><input class="entrada p" type="number" step="any" min="0" max="100" value="' + esc(c.peso) + '" style="width:90px;min-width:0"><button class="btn fantasma mini" data-quitar="cat" data-i="' + i + '">' + ICO('x') + '</button></div>'; }).join('') +
        '<button class="btn claro mini" data-mas="cat">' + ICO('mas') + ' Categoría</button>' +
        (E.categorias.length > 1 ? '<label class="campo" style="flex-direction:row;align-items:center;margin-top:10px"><input type="checkbox" id="ePpu"' + (ppu ? ' checked' : '') + '> <span>Pesos de categorías distintos en cada unidad</span></label>' : '') +
        (ppu ? '<div class="desliza"><table class="tabla cal-g"><thead><tr><th>Unidad</th>' + E.categorias.map(function (c) { return '<th>' + esc(c.nombre) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          E.unidades.map(function (u, i) { return '<tr><td>' + esc(u.nombre) + '</td>' + E.categorias.map(function (c, j) { var v = u.pesos && u.pesos[j] !== undefined ? u.pesos[j] : c.peso;
            return '<td><input class="cal-in" type="number" step="any" min="0" max="100" data-pu="' + i + '" data-pc="' + j + '" value="' + esc(v) + '"></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>' : '') +
        (cual ? '<label class="titulo" style="display:block;margin-top:14px">Niveles (nombre, abreviatura, valor numérico)</label>' + E.niveles.map(function (v, i) {
          return '<div class="filtros" data-niv style="margin:6px 0"><input class="entrada n" maxlength="30" value="' + esc(v.etiqueta) + '" style="flex:1"><input class="entrada a" maxlength="4" value="' + esc(v.abrev) + '" style="width:70px;min-width:0"><input class="entrada v" type="number" step="any" value="' + esc(v.valor) + '" style="width:80px;min-width:0"><button class="btn fantasma mini" data-quitar="niv" data-i="' + i + '">' + ICO('x') + '</button></div>'; }).join('') +
          '<button class="btn claro mini" data-mas="niv">' + ICO('mas') + ' Nivel</button>'
          : '<label class="campo" style="flex-direction:row;align-items:center;margin-top:14px"><input type="checkbox" id="eLet"' + (letras.length ? ' checked' : '') + '> <span>Convertir a letra y GPA</span></label>' +
            '<div id="eLetras"' + (letras.length ? '' : ' class="oculto"') + '>' + (letras.length ? letras : copia(INI.presets.UNIVERSIDAD.letras)).map(function (l, i) {
              return '<div class="filtros" data-let style="margin:6px 0"><input class="entrada n" maxlength="3" placeholder="Letra" value="' + esc(l.letra) + '" style="width:80px;min-width:0"><span class="suave pequeno">desde</span><input class="entrada m" type="number" step="any" value="' + esc(l.min) + '" style="width:80px;min-width:0"><span class="suave pequeno">GPA</span><input class="entrada g" type="number" step="any" value="' + esc(l.gpa) + '" style="width:80px;min-width:0"><button class="btn fantasma mini" data-quitar="let" data-i="' + i + '">' + ICO('x') + '</button></div>'; }).join('') +
            '<button class="btn claro mini" data-mas="let">' + ICO('mas') + ' Letra</button></div>');
      if (!cual) $('eLet').onchange = function () { $('eLetras').classList.toggle('oculto', !this.checked); if (this.checked && !E.letras.length) { leer(); E.letras = copia(INI.presets.UNIVERSIDAD.letras); dibujar(); } };
      $('eEsc').onchange = function () { leer(); if (E.escala === 'CUALITATIVA' && !E.niveles.length) { E.niveles = copia(INI.presets.PRIMARIA.niveles); E.minima = 2; } if (E.escala === 'NUMERICA' && Number(E.minima) < 10) E.minima = 70; dibujar(); };
      $('eUni').onchange = function () {   // los nombres que seguían el patrón anterior pasan al nuevo (RA1 → Parcial 1)
        var antes = E.unidad, otroAntes = E.unidadOtro; leer();
        E.unidades.forEach(function (u, i) { if (!u.nombre || u.nombre === nombreU(antes, otroAntes, i)) u.nombre = nombreU(E.unidad, E.unidadOtro, i); });
        dibujar();
      };
      $('eCant').onchange = function () {
        leer(); var k = Math.max(1, Math.min(20, Math.floor(Number(this.value)) || 1));
        while (E.unidades.length < k) E.unidades.push({ nombre: nombreU(E.unidad, E.unidadOtro, E.unidades.length), peso: null, descripcion: '' });
        E.unidades.length = k; dibujar();
      };
      $('eCalc').onchange = function () { leer(); dibujar(); };
      if ($('eUsaP')) $('eUsaP').onchange = function () { leer(); dibujar(); };
      if ($('ePpu')) $('ePpu').onchange = function () { leer(); dibujar(); };
      if ($('eOtro')) $('eOtro').onchange = function () { var antes = E.unidadOtro; leer(); var nuevo = E.unidadOtro; E.unidadOtro = antes; E.unidades.forEach(function (u, i) { if (!u.nombre || u.nombre === nombreU('OTRO', antes, i)) u.nombre = nombreU('OTRO', nuevo, i); }); E.unidadOtro = nuevo; dibujar(); };
      $('lEsq').oninput = function (e) {
        if (!e.target.classList.contains('p')) return;
        leer();
        var s = suma(E.categorias.map(function (c) { return c.peso; })); $('eSuma').textContent = s; $('eSuma').className = Math.abs(s - 100) > 0.01 ? 'error' : '';
        if ($('eSumaU')) { s = suma(E.unidades.map(function (u) { return u.peso; })); $('eSumaU').textContent = s; $('eSumaU').className = Math.abs(s - 100) > 0.01 ? 'error' : ''; }
      };
      $('lEsq').onclick = function (e) {
        if (e.target.closest('[data-repartir]')) {   // 100 entre las unidades, el resto de redondeo a la última
          leer(); var k = E.unidades.length, p = Math.floor(10000 / k) / 100;
          E.unidades.forEach(function (u, i) { u.peso = i < k - 1 ? p : Math.round((100 - p * (k - 1)) * 100) / 100; }); dibujar(); return;
        }
        var b = e.target.closest('[data-mas],[data-quitar]'); if (!b) return; leer();
        var k2 = b.dataset.mas || b.dataset.quitar, lista = k2 === 'cat' ? E.categorias : k2 === 'niv' ? E.niveles : E.letras;
        if (b.dataset.mas) lista.push(k2 === 'cat' ? { nombre: '', peso: 0 } : k2 === 'niv' ? { etiqueta: '', abrev: '', valor: 0 } : { letra: '', min: 0, gpa: 0 }); else lista.splice(Number(b.dataset.i), 1);
        if (k2 === 'cat') E.unidades.forEach(function (u) { if (u.pesos) { if (b.dataset.mas) u.pesos.push(0); else u.pesos.splice(Number(b.dataset.i), 1); } });
        dibujar();
      };
    }
    $('lNivel').onchange = function () { x.nivel = this.value; E = x.esquema = copia(INI.presets[x.nivel]); usaP = E.unidades.some(function (u) { return u.peso !== null; }); dibujar(); };
    $('lOk').onclick = function () {
      leer(); $('lErr').textContent = ''; this.disabled = true; var b = this;
      var esquema = copia(E); esquema.cantidad = E.unidades.length;
      if (!conPesos()) esquema.unidades.forEach(function (u) { u.peso = null; });
      function guardar(confirmar) {
        return C.A({ action: 'calGuardarLibreta', libreta: { id: x.id, curso: $('lCurso').value, materia: $('lMat').value, nivel: $('lNivel').value, esquema: esquema, confirmar: confirmar } })
          .then(function (r) { C.cerrarModal(); AVISO('Libreta guardada'); abrir(r.id); })
          .catch(function (e) {
            if (!confirmar && /^Al quitar/.test(e.message) && confirm(e.message)) return guardar(true);
            $('lErr').textContent = e.message; b.disabled = false;
          });
      }
      guardar(false);
    };
    dibujar();
  }

  /* ---------- Libreta abierta ---------- */
  function abrir(id, tab) {
    if (tab) TAB = tab;
    pag('<div class="cargando"><div class="girar"></div><p>Abriendo libreta…</p></div>');
    return C.A({ action: 'calLibreta', id: id }).then(function (r) {
      D = r; CAMBIOS = {};
      var ids = E().unidades.map(function (u) { return u.id; });
      if (ULIB !== id || (U !== 'FIN' && ids.indexOf(U) < 0 && !(U === '' && D.sinUnidad))) U = ids[0];
      ULIB = id; vista();
    }).catch(function (e) { err(e); inicio(); });
  }
  function E() { return D.libreta.esquema; }
  function cual() { return E().escala === 'CUALITATIVA'; }
  function titulo() { return D.libreta.curso + ' · ' + D.libreta.materia; }
  function unidad(id) { return E().unidades.filter(function (u) { return u.id === id; })[0] || null; }
  function actsU() { return D.actividades.filter(function (a) { return a.unidad === U; }); }
  function catsU(id) { var u = unidad(id); return E().categorias.map(function (c, j) { return u && u.pesos ? { id: c.id, nombre: c.nombre, peso: u.pesos[j] } : c; }); }
  function filaU(f, id) { return f.unidades.filter(function (x) { return x.id === id; })[0] || {}; }
  function vista() {
    var L = D.libreta, fin = U === 'FIN', R = fin || U === '' ? D.resumenFinal : D.resumenes[U];
    pag(C.cabeza(esc(titulo()), esc(NIVELES[L.nivel] + ' · ' + L.estructura + ' · ' + CALCULOS[E().calculo].toLowerCase() + ' · ' + (cual() ? 'escala cualitativa' : 'nota mínima ' + E().minima) + (L.docente ? ' · ' + L.docente : '')),
      '<div class="filtros" style="margin:0"><button class="btn fantasma" id="cVolver">' + ICO('atras') + ' Libretas</button><button class="btn claro" id="cEsq">' + ICO('ajustes') + ' Esquema</button>' +
      '<button class="btn claro" id="cXls">' + ICO('descargar') + ' Excel</button><button class="btn claro" id="cBol">' + ICO('imprimir') + ' Boletines</button><button class="btn claro" id="cImp">' + ICO('imprimir') + ' Clase</button></div>') +
      '<div class="filtros cal-u" id="cUni">' + E().unidades.map(function (u) { return '<button class="btn ' + (u.id === U ? 'primario' : 'claro') + ' mini" data-u="' + esc(u.id) + '" title="' + esc(u.descripcion || '') + '">' + esc(u.nombre) + (u.peso !== null && u.peso !== undefined ? ' · ' + u.peso + ' %' : '') + '</button>'; }).join('') +
      '<button class="btn ' + (fin ? 'primario' : 'claro') + ' mini" data-u="FIN">' + ICO('premio') + ' Final</button>' +
      (D.sinUnidad ? '<button class="btn ' + (U === '' ? 'primario' : 'fantasma') + ' mini" data-u="">Sin unidad (' + D.sinUnidad + ')</button>' : '') +
      '<button class="btn fantasma mini" id="cBorrar" style="margin-left:auto">' + ICO('borrar') + ' Eliminar libreta</button></div>' +
      (unidad(U) && unidad(U).descripcion ? '<p class="suave pequeno">' + esc(unidad(U).nombre + ': ' + unidad(U).descripcion) + '</p>' : '') +
      '<div class="kpis">' + C.kpi('usuarios', 'azul', D.estudiantes.length, 'Estudiantes') + C.kpi('lista', 'morado', fin ? D.actividades.length : actsU().length, fin ? 'Actividades' : 'Actividades de la unidad') +
      C.kpi('premio', 'amarillo', n(R.promedio), fin || U === '' ? 'Promedio final' : 'Promedio de ' + (unidad(U) || {}).nombre) + C.kpi('estrella', 'verde', R.aprobados + ' / ' + R.conNota, cual() ? 'Avanzan' : 'Aprobados') + '</div>' +
      (fin || U === '' ? '' : '<div class="segmento" id="cTab" style="margin-bottom:12px"><button data-t="notas">' + ICO('editar') + ' Notas</button><button data-t="act">' + ICO('lista') + ' Actividades</button><button data-t="des">' + ICO('grafica') + ' Desglose</button></div>') + '<div id="cCuerpo"></div>');
    $('cVolver').onclick = function () { if (salir()) inicio(); };
    $('cEsq').onclick = function () { formLibreta({ id: L.id, curso: L.curso, materia: L.materia, nivel: L.nivel, esquema: L.esquema }); };
    $('cBorrar').onclick = function () { if (confirm('¿Eliminar la libreta ' + titulo() + '? Deja de verse en la lista.')) C.A({ action: 'calEliminarLibreta', id: L.id }).then(function () { AVISO('Libreta eliminada'); inicio(); }).catch(err); };
    $('cXls').onclick = excel; $('cBol').onclick = function () { boletines(D.filas); }; $('cImp').onclick = imprimirClase;
    $('cUni').onclick = function (e) { var b = e.target.closest('[data-u]'); if (b && b.dataset.u !== U && salir()) { U = b.dataset.u; vista(); } };
    if ($('cTab')) $('cTab').onclick = function (e) { var b = e.target.closest('[data-t]'); if (b && salir()) { TAB = b.dataset.t; pestana(); } };
    if (fin) final(); else if (U === '') actividades(); else pestana();
  }
  function salir() { if (!Object.keys(CAMBIOS).length) return true; if (!confirm('Tienes notas sin guardar. ¿Salir sin guardarlas?')) return false; CAMBIOS = {}; return true; }
  function pestana() {
    document.querySelectorAll('#cTab [data-t]').forEach(function (b) { b.classList.toggle('on', b.dataset.t === TAB); });
    ({ notas: notas, act: actividades, des: desglose })[TAB]();
  }

  /* ---------- Notas de la unidad: estudiantes × actividades ---------- */
  function nota(a, e) { return (D.notas[a] || {})[e] || null; }
  function valor(x) { return !x ? '' : x.marca === 'AUSENTE' ? 'A' : x.marca === 'EXCUSA' ? 'E' : x.puntos === '' || x.puntos === null || x.puntos === undefined ? '' : String(x.puntos); }
  function recDe(e) { var v = (D.rec[U] || {})[e]; return v === undefined || v === null ? '' : String(v); }
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
    var A = actsU(), rec = E().recuperacion !== 'NINGUNA', movil = window.matchMedia('(max-width: 700px)').matches, ra = 'REC:' + U;
    if (!A.length) { $('cCuerpo').innerHTML = '<div class="tarjeta vacio"><div class="chip-ico">' + ICO('lista') + '</div><p>Primero agrega las actividades de ' + esc(unidad(U).nombre) + '.</p><button class="btn primario" id="cPrimera">' + ICO('mas') + ' Nueva actividad</button></div>'; $('cPrimera').onclick = function () { formActividad(null); }; return; }
    var ayuda = '<p class="suave pequeno">' + (cual() ? 'Elige el nivel de cada indicador. Exc. = excusa (no cuenta).' : 'Escribe los puntos. A = ausente (cuenta 0), E = excusa (no cuenta). Enter baja a la siguiente fila. Doble clic: comentario. En azul cursiva: nota tomada del examen (escribe otra para cambiarla; bórrala para volver a la del examen).') + '</p>';
    var html;
    if (movil) {
      html = D.estudiantes.map(function (e, r) {
        var f = filaDe(e), fu = filaU(f, U);
        return '<div class="tarjeta cal-card"><h3 style="justify-content:space-between">' + esc(e) + ' <span class="pildora">' + n(fu.nota) + (fu.letra ? ' · ' + esc(fu.letra) : '') + '</span></h3>' +
          A.map(function (a, c) { return '<div class="r"><span>' + esc(a.nombre) + ' <small class="tenue">/' + a.maximo + '</small></span>' + celda(a, e, r, c) + '<button class="btn fantasma mini" data-com="' + esc(a.id) + '" data-e="' + esc(e) + '" aria-label="Comentario">' + ICO('editar') + '</button></div>'; }).join('') +
          (rec ? '<div class="r"><span>Recuperación</span><input class="cal-in" inputmode="decimal" data-a="' + esc(ra) + '" data-e="' + esc(e) + '" data-o="' + esc(recDe(e)) + '" value="' + esc(recDe(e)) + '"></div>' : '') +
          '<div class="r"><input class="entrada" data-a="OBS" data-e="' + esc(e) + '" data-o="' + esc(f.observacion || '') + '" value="' + esc(f.observacion || '') + '" placeholder="Observación"></div></div>';
      }).join('');
    } else {
      html = '<div class="tarjeta desliza" style="padding:8px"><table class="tabla cal-g"><thead><tr><th class="fijo">Estudiante</th>' +
        A.map(function (a) { return '<th title="' + esc(a.nombre + (a.descripcion ? ' · ' + a.descripcion : '')) + '">' + esc(a.nombre.length > 22 ? a.nombre.slice(0, 20) + '…' : a.nombre) + '<br><span class="tenue">' + (cual() ? '' : '/' + a.maximo) + (a.rubricaId ? ' rúbrica' : '') + (a.examenId ? ' examen' : '') + '</span></th>'; }).join('') +
        (rec ? '<th>Recup.</th>' : '') + '<th>' + esc(unidad(U).nombre) + '</th><th>Observación</th></tr></thead><tbody>' +
        D.estudiantes.map(function (e, r) {
          var f = filaDe(e), fu = filaU(f, U);
          return '<tr><td class="fijo"><b>' + esc(e) + '</b></td>' + A.map(function (a, c) { return '<td>' + celda(a, e, r, c) + '</td>'; }).join('') +
            (rec ? '<td><input class="cal-in" inputmode="decimal" data-a="' + esc(ra) + '" data-e="' + esc(e) + '" data-o="' + esc(recDe(e)) + '" value="' + esc(recDe(e)) + '" data-r="' + r + '" data-c="' + A.length + '"></td>' : '') +
            '<td class="n' + (fu.nota !== null && fu.nota !== undefined && fu.nota < E().minima ? ' cal-pend' : '') + '">' + n(fu.nota) + (fu.letra ? ' <span class="tenue">' + esc(fu.letra) + '</span>' : '') + '</td>' +
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
    cuerpo.ondblclick = function (e) { var el = e.target.closest('[data-a]'); if (el && el.dataset.a !== 'OBS' && el.dataset.a.indexOf('REC:') !== 0) comentario(el.dataset.a, el.dataset.e); };
    cuerpo.onclick = function (e) {
      var b = e.target.closest('[data-rub]'); if (b) return rubricaNota(b.dataset.rub, b.dataset.e);
      b = e.target.closest('[data-com]'); if (b) comentario(b.dataset.com, b.dataset.e);
    };
    $('cGuardar').onclick = guardarNotas;
  }
  function paquete(el) {
    var a = el.dataset.a, e = el.dataset.e, v = el.value.trim(), x = nota(a, e) || {};
    if (a === 'OBS') return { actividadId: a, estudiante: e, comentario: v };
    if (a.indexOf('REC:') === 0) return { actividadId: a, estudiante: e, puntos: v };
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

  /* ---------- Actividades de la unidad (o las que quedaron sin unidad) ---------- */
  function catNombre(id) { var c = E().categorias.filter(function (x) { return x.id === id; })[0] || E().categorias[0]; return c.nombre; }
  function actividades() {
    var A = actsU(), sin = U === '';
    $('cCuerpo').innerHTML = (sin ? '<p class="suave pequeno">Estas actividades eran de una unidad que quitaste del esquema. Sus notas siguen guardadas pero no cuentan: edítalas para pasarlas a otra unidad, o vuelve a agregar la unidad en Esquema.</p>'
      : '<div class="filtros"><button class="btn primario" id="aNueva">' + ICO('mas') + ' Nueva actividad</button></div>') +
      (A.length ? '<div class="tarjeta desliza"><table class="tabla"><thead><tr><th>Actividad</th><th>Categoría</th><th>Fecha</th>' + (cual() ? '' : '<th>Máximo</th>') + '<th>Cómo se califica</th><th></th></tr></thead><tbody>' +
        A.map(function (a) { var r = a.rubricaId && rubrica(a.rubricaId), ex = a.examenId && (C.panel.examenes || []).filter(function (x) { return x.id === a.examenId; })[0];
          return '<tr><td><b>' + esc(a.nombre) + '</b>' + (a.descripcion ? '<br><span class="tenue pequeno">' + esc(a.descripcion) + '</span>' : '') + '</td><td>' + esc(catNombre(a.categoria)) + '</td><td>' + esc(a.fecha ? FECHA(a.fecha) : '—') + '</td>' +
            (cual() ? '' : '<td>' + a.maximo + '</td>') + '<td>' + (r ? 'Rúbrica: ' + esc(r.nombre) : ex ? 'Examen: ' + esc(ex.titulo) + ' (' + (a.criterio === 'ULTIMO' ? 'último' : 'mejor') + ' intento)' : a.examenId ? 'Examen enlazado' : cual() ? 'Nivel de logro' : 'Puntos') + '</td>' +
            '<td style="white-space:nowrap"><button class="btn fantasma mini" data-ed="' + esc(a.id) + '" aria-label="Editar">' + ICO('editar') + '</button><button class="btn fantasma mini" data-bo="' + esc(a.id) + '" aria-label="Borrar">' + ICO('borrar') + '</button></td></tr>'; }).join('') + '</tbody></table></div>'
        : '<div class="tarjeta vacio"><p>Sin actividades en esta unidad todavía.</p></div>');
    if ($('aNueva')) $('aNueva').onclick = function () { formActividad(null); };
    $('cCuerpo').onclick = function (e) {
      var b = e.target.closest('[data-ed],[data-bo]'); if (!b) return;
      var a = A.filter(function (x) { return x.id === (b.dataset.ed || b.dataset.bo); })[0];
      if (b.dataset.ed) formActividad(a);
      else if (confirm('¿Borrar la actividad ' + a.nombre + '? Sus notas dejan de contar.')) C.A({ action: 'calEliminarActividad', id: a.id }).then(function () { AVISO('Actividad borrada'); abrir(D.libreta.id); }).catch(err);
    };
  }
  function formActividad(a) {
    a = a || { nombre: '', unidad: U, categoria: E().categorias[0].id, fecha: new Date().toISOString().slice(0, 10), maximo: 100, descripcion: '', rubricaId: '', examenId: '', criterio: 'MEJOR' };
    var tipo = a.rubricaId ? 'R' : a.examenId ? 'X' : 'P';
    var exs = (C.panel.examenes || []).filter(function (x) { return x.curso === D.libreta.curso; });
    modal('<h2>' + ICO('lista') + ' ' + (a.id ? 'Actividad' : 'Nueva actividad') + '</h2>' +
      '<label class="campo"><span>Nombre</span><input class="entrada" id="aNom" maxlength="80" value="' + esc(a.nombre) + '"></label>' +
      '<div class="fila"><label class="campo"><span>Unidad</span><select class="entrada" id="aUni">' + opciones(E().unidades.map(function (u) { return [u.id, u.nombre]; }), a.unidad || E().unidades[0].id) + '</select></label>' +
      '<label class="campo"><span>Categoría</span><select class="entrada" id="aCat">' + opciones(E().categorias.map(function (c) { return [c.id, c.nombre]; }), a.categoria) + '</select></label>' +
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
      C.A({ action: 'calGuardarActividad', actividad: { id: a.id, libretaId: D.libreta.id, unidad: $('aUni').value, nombre: $('aNom').value, categoria: $('aCat').value, fecha: $('aFec').value, descripcion: $('aDes').value,
        maximo: cual() ? '' : $('aMax').value, rubricaId: t === 'R' ? $('aRub').value : '', examenId: t === 'X' ? $('aEx').value : '', criterio: cual() ? 'MEJOR' : $('aCri').value } })
        .then(function () { C.cerrarModal(); AVISO('Actividad guardada'); abrir(D.libreta.id); }).catch(function (e) { $('aErr').textContent = e.message; b.disabled = false; });
    };
  }

  /* ---------- Desglose de la unidad y vista Final ---------- */
  function conLetra() { return cual() || E().letras.length > 0; }
  function letraGpa(l, g) { return esc(l || '') + (g !== null && g !== undefined ? ' · ' + g : ''); }
  function pildora(f) { return '<span class="pildora ' + (/Aprob|Avanza/.test(f.estado) ? 'verde' : f.estado ? 'rojo' : '') + '">' + esc(f.estado || 'Sin notas') + '</span>'; }
  function desglose() {
    var cats = catsU(U), rec = E().recuperacion !== 'NINGUNA';
    $('cCuerpo').innerHTML = '<div class="tarjeta desliza"><table class="tabla cal-g"><thead><tr><th class="fijo">Estudiante</th>' + cats.map(function (c) { return '<th>' + esc(c.nombre) + '<br><span class="tenue">' + c.peso + ' %</span></th>'; }).join('') +
      '<th>Ponderado</th>' + (rec ? '<th>Recup.</th>' : '') + '<th>' + esc(unidad(U).nombre) + '</th>' + (conLetra() ? '<th>' + (cual() ? 'Nivel' : 'Letra / GPA') + '</th>' : '') + '<th>Estado</th><th></th></tr></thead><tbody>' +
      D.filas.map(function (f, i) {
        var fu = filaU(f, U);
        return '<tr><td class="fijo"><b>' + esc(f.nombre) + '</b></td>' + (fu.categorias || []).map(function (c) { return '<td class="n" title="' + esc(c.obtenidos + ' de ' + c.posibles) + '">' + n(c.valor) + (c.valor !== null && !cual() ? '%' : '') + '</td>'; }).join('') +
          '<td class="n">' + n(fu.ponderado) + '</td>' + (rec ? '<td class="n">' + n(fu.recuperacion) + '</td>' : '') + '<td class="n"><b>' + n(fu.nota) + '</b></td>' +
          (conLetra() ? '<td class="n">' + letraGpa(fu.letra, fu.gpa) + '</td>' : '') + '<td>' + pildora(fu) + '</td>' +
          '<td><button class="btn fantasma mini" data-bol="' + i + '">' + ICO('imprimir') + ' Boletín</button></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="suave pequeno">Cada categoría: puntos obtenidos ÷ posibles (pasa el ratón para verlos). Las categorías sin notas no cuentan todavía.' + (rec ? ' La recuperación solo se usa si la unidad queda bajo la mínima, y nunca baja la nota.' : '') + '</p>';
    $('cCuerpo').onclick = function (e) { var b = e.target.closest('[data-bol]'); if (b) boletines([D.filas[Number(b.dataset.bol)]]); };
  }
  function explicacion() {
    var c = E().calculo;
    return c === 'SUMA' ? 'Final = suma de lo que aporta cada unidad (nota × peso ÷ 100); las unidades sin nota aportan 0.'
      : c === 'PONDERADO' ? 'Final = promedio ponderado por el peso de las unidades que ya tienen nota.'
      : c === 'CADA_UNA' ? 'Final = promedio' + (E().unidades[0].peso !== null ? ' ponderado' : '') + ' de las unidades con nota; cada unidad debe llegar a ' + E().minima + ' o queda pendiente.'
      : 'Final = promedio de las unidades que ya tienen nota.';
  }
  function final() {
    var RF = D.resumenFinal, us = E().unidades;
    $('cCuerpo').innerHTML = '<div class="tarjeta desliza"><table class="tabla cal-g"><thead><tr><th class="fijo">Estudiante</th>' +
      us.map(function (u) { return '<th title="' + esc(u.descripcion || '') + '">' + esc(u.nombre) + (u.peso !== null && u.peso !== undefined ? '<br><span class="tenue">' + u.peso + ' %</span>' : '') + '</th>'; }).join('') +
      '<th>Final</th>' + (conLetra() ? '<th>' + (cual() ? 'Nivel' : 'Letra / GPA') + '</th>' : '') + '<th>Estado</th><th></th></tr></thead><tbody>' +
      D.filas.map(function (f, i) {
        return '<tr><td class="fijo"><b>' + esc(f.nombre) + '</b></td>' + f.unidades.map(function (u) {
          var bajo = u.nota !== null && u.nota !== undefined && u.nota < E().minima;
          return '<td class="n' + (bajo ? ' cal-pend' : '') + '" title="' + esc(bajo ? 'Bajo la mínima' : '') + '">' + n(u.nota) + '</td>'; }).join('') +
          '<td class="n" title="' + f.unidadesConNota + ' unidad(es) con nota"><b>' + n(f.final) + '</b></td>' + (conLetra() ? '<td class="n">' + letraGpa(f.letra, f.gpa) + '</td>' : '') +
          '<td>' + pildora(f) + (f.pendientes.length && E().calculo !== 'CADA_UNA' ? '<br><span class="tenue pequeno">Bajo la mínima: ' + esc(f.pendientes.join(', ')) + '</span>' : '') + '</td>' +
          '<td><button class="btn fantasma mini" data-bol="' + i + '">' + ICO('imprimir') + ' Boletín</button></td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="suave pequeno">' + esc(explicacion()) + ' En rojo: unidades bajo la mínima. Final de la clase: promedio ' + n(RF.promedio) + ' · ' + RF.aprobados + ' de ' + RF.conNota + (cual() ? ' avanzan.' : ' aprobados.') + '</p>';
    $('cCuerpo').onclick = function (e) { var b = e.target.closest('[data-bol]'); if (b) boletines([D.filas[Number(b.dataset.bol)]]); };
  }

  /* ---------- Excel e impresión ---------- */
  function nomU(id) { var u = unidad(id); return u ? u.nombre : 'Sin unidad'; }
  function vacio(v) { return v === null || v === undefined ? '' : v; }
  function excel() {
    var A = D.actividades, us = E().unidades, rec = E().recuperacion !== 'NINGUNA';
    var notas = [['Estudiante'].concat(A.map(function (a) { return nomU(a.unidad) + ' · ' + a.nombre + (cual() ? '' : ' (/' + a.maximo + ')'); }))]
      .concat(D.estudiantes.map(function (e) { return [e].concat(A.map(function (a) { return valor(nota(a.id, e)); })); }));
    var uni = [['Estudiante'].concat([].concat.apply([], us.map(function (u) { return (rec ? [u.nombre + ' (recuperación)'] : []).concat([u.nombre + (u.peso !== null ? ' (' + u.peso + '%)' : '')]); })))
      .concat(['Final', cual() ? 'Nivel' : 'Letra', 'GPA', 'Estado', 'Bajo la mínima', 'Observación'])]
      .concat(D.filas.map(function (f) { return [f.nombre].concat([].concat.apply([], f.unidades.map(function (u) { return (rec ? [u.recuperacion] : []).concat([vacio(u.nota)]); })))
        .concat([vacio(f.final), f.letra || '', vacio(f.gpa), f.estado, f.pendientes.join(', '), f.observacion]); }));
    var act = [['Unidad', 'Actividad', 'Categoría', 'Fecha', 'Máximo', 'Descripción']].concat(A.map(function (a) { return [nomU(a.unidad), a.nombre, catNombre(a.categoria), a.fecha, a.maximo, a.descripcion]; }));
    AVISO('Preparando el Excel…');
    C.excel('Calificaciones ' + titulo(), [{ nombre: 'Notas', filas: notas }, { nombre: 'Unidades y final', filas: uni }, { nombre: 'Actividades', filas: act }]);
  }
  function encabezado() { var L = D.libreta; return '<h1>' + esc(MARCA) + (C.yo && C.yo.centroNombre ? ' · ' + esc(C.yo.centroNombre) : '') + '</h1><p class="s">' + esc(L.curso + ' · ' + L.materia + ' · ' + NIVELES[L.nivel] + ' · Evaluación: ' + L.estructura + ' · Docente: ' + L.docente) + '</p>'; }
  function boletines(filas) {
    var A = D.actividades.filter(function (a) { return a.unidad; }), rec = E().recuperacion !== 'NINGUNA', pesos = E().unidades[0].peso !== null;
    ventana('Boletín ' + titulo(), filas.map(function (f) {
      return '<div class="hoja">' + encabezado() + '<h2>Boletín de calificaciones: ' + esc(f.nombre) + '</h2>' +
        '<table><tr><th>Unidad</th>' + (pesos ? '<th class="c">Peso</th>' : '') + (rec ? '<th class="c">Recuperación</th>' : '') + '<th class="c">Nota</th>' + (conLetra() ? '<th class="c">' + (cual() ? 'Nivel' : 'Letra / GPA') + '</th>' : '') + '<th>Estado</th></tr>' +
        f.unidades.map(function (u) { var d = (unidad(u.id) || {}).descripcion;
          return '<tr><td>' + esc(u.unidad) + (d ? '<br><small>' + esc(d) + '</small>' : '') + '</td>' + (pesos ? '<td class="c">' + u.peso + ' %</td>' : '') + (rec ? '<td class="c">' + n(u.recuperacion) + '</td>' : '') +
            '<td class="c"><b>' + n(u.nota) + '</b></td>' + (conLetra() ? '<td class="c">' + letraGpa(u.letra, u.gpa) + '</td>' : '') + '<td>' + esc(u.estado || '') + '</td></tr>'; }).join('') +
        '<tr><th>Final</th>' + (pesos ? '<th></th>' : '') + (rec ? '<th></th>' : '') + '<th class="c">' + n(f.final) + '</th>' + (conLetra() ? '<th class="c">' + letraGpa(f.letra, f.gpa) + '</th>' : '') + '<th>' + esc(f.estado || 'Sin notas') + '</th></tr></table>' +
        '<p class="s">' + esc(explicacion()) + '</p>' +
        '<table><tr><th>Unidad</th><th>Actividad</th><th>Categoría</th><th class="c">Nota</th><th>Comentario</th></tr>' + A.map(function (a) { var x = nota(a.id, f.nombre);
          return '<tr><td>' + esc(nomU(a.unidad)) + '</td><td>' + esc(a.nombre) + '</td><td>' + esc(catNombre(a.categoria)) + '</td><td class="c">' + esc(valor(x) || '—') + (cual() ? '' : ' / ' + a.maximo) + '</td><td>' + esc(x && x.comentario || '') + '</td></tr>'; }).join('') + '</table>' +
        (f.observacion ? '<h2>Observaciones</h2><p>' + esc2(f.observacion) + '</p>' : '') + '<div class="firmas"><div>Docente</div><div>Padre, madre o tutor</div></div></div>';
    }).join(''));
  }
  function imprimirClase() {
    var us = E().unidades, R = D.resumenFinal;
    ventana('Clase ' + titulo(), encabezado() + '<table><tr><th>#</th><th>Estudiante</th>' + us.map(function (u) { return '<th class="c">' + esc(u.nombre) + (u.peso !== null ? ' (' + u.peso + '%)' : '') + '</th>'; }).join('') + '<th class="c">Final</th>' + (conLetra() ? '<th class="c">' + (cual() ? 'Nivel' : 'Letra') + '</th>' : '') + '<th>Estado</th></tr>' +
      D.filas.map(function (f, i) { return '<tr><td class="c">' + (i + 1) + '</td><td>' + esc(f.nombre) + '</td>' + f.unidades.map(function (u) { return '<td class="c">' + n(u.nota) + '</td>'; }).join('') + '<td class="c"><b>' + n(f.final) + '</b></td>' +
        (conLetra() ? '<td class="c">' + esc(f.letra || '') + '</td>' : '') + '<td>' + esc(f.estado || '') + '</td></tr>'; }).join('') + '</table>' +
      '<p>' + esc(explicacion()) + '</p><p>Promedio final: <b>' + n(R.promedio) + '</b> · ' + (cual() ? 'Avanzan' : 'Aprobados') + ': <b>' + R.aprobados + '</b> de ' + R.conNota + ' · ' + (cual() ? 'Necesitan apoyo' : 'Reprobados o pendientes') + ': ' + R.reprobados + '</p>');
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
  function imprimirRubrica(R) {
    ventana('Rúbrica ' + R.nombre, '<h1>' + esc(R.nombre) + '</h1><p class="s">' + esc(MARCA) + '</p><table><tr><th>Criterio</th>' + R.niveles.map(function (l) { return '<th>' + esc(l) + '</th>'; }).join('') + '</tr>' +
      R.criterios.map(function (c) { return '<tr><td><b>' + esc(c.nombre) + '</b></td>' + c.d.map(function (d, j) { return '<td>' + esc(d) + '<br><b>' + c.p[j] + ' pts</b></td>'; }).join('') + '</tr>'; }).join('') + '</table>' +
      '<p>Estudiante: ______________________________ Total: ______ / ' + R.criterios.reduce(function (s, c) { return s + Math.max.apply(null, c.p); }, 0) + '</p>');
  }
})();

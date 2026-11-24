/* Examen Seguro: descarga del examen en Word (.docx) para darlo en papel. Todo se arma en el navegador. */
(function () {
  var CDN = 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js';
  var ORDEN = ['ORDENAR', 'ALGORITMO', 'FLUJO'], HUECOS = ['COMPLETAR', 'PALABRAS'];
  var GRIS = '7A7A8C', ACENTO = '4F46E5', CAJA = '☐';
  function letra(j) { return String.fromCharCode(97 + j); }

  /* Azar con semilla: la misma versión (A o B) sale igual cada vez que se descarga. */
  function azar(semilla) {
    var h = 2166136261; semilla = String(semilla);
    for (var i = 0; i < semilla.length; i++) h = Math.imul(h ^ semilla.charCodeAt(i), 16777619);
    return function () { h = (h + 0x6D2B79F5) | 0; var t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function mezclar(a, r) { a = a.slice(); for (var z = a.length - 1; z > 0; z--) { var w = Math.floor(r() * (z + 1)), t = a[z]; a[z] = a[w]; a[w] = t; } return a; }
  /* Mezcla índices 0..n-1 sin dejarlos en el orden original (si hay 2 o más). */
  function desorden(n, r) { var ix = []; for (var i = 0; i < n; i++) ix.push(i); if (n < 2) return ix; var m = mezclar(ix, r); return m.join() === ix.join() ? m.slice(1).concat(m[0]) : m; }
  function par(s) { s = String(s); var k = s.indexOf(' => '), n = 4; if (k < 0) { k = s.indexOf(' = '); n = 3; } return k < 0 ? [s.trim(), ''] : [s.slice(0, k).trim(), s.slice(k + n).trim()]; }
  function huecos(enun) { var h = []; String(enun).replace(/\[\[(.+?)\]\]/g, function (m, a) { h.push(a.split('|')); return m; }); return h; }

  /* Decide el orden de preguntas y opciones una sola vez: lo usan el examen y la clave. */
  function preparar(x, preguntas, opc) {
    var r = azar((x.id || x.titulo || 'examen') + '|' + (opc.version || 'original'));
    var lista = opc.version ? mezclar(preguntas, r) : preguntas.slice();
    return lista.map(function (q) {
      var o = (q.opciones || []).map(String), it = { q: q, tipo: String(q.tipo || 'MC').toUpperCase(), puntos: Number(q.puntos) || 1 };
      if (it.tipo === 'MC') { it.ops = opc.version ? mezclar(o, r) : o; it.ok = it.ops.indexOf(String(q.correcta)); }
      else if (it.tipo === 'VF' || it.tipo === 'VFJ') { it.ops = ['Verdadero', 'Falso']; it.ok = String(q.correcta).toLowerCase().charAt(0) === 'f' ? 1 : 0; }
      else if (ORDEN.indexOf(it.tipo) >= 0) it.orden = desorden(o.length, r);
      else if (it.tipo === 'RELACIONAR') { it.pares = o.map(par); it.der = desorden(o.length, r); }
      else if (it.tipo === 'CLASIFICAR') { it.cats = []; it.pares = o.map(par); it.pares.forEach(function (p) { if (it.cats.indexOf(p[0]) < 0) it.cats.push(p[0]); }); it.elem = mezclar(it.pares.map(function (p) { return p[1]; }), r); }
      else if (HUECOS.indexOf(it.tipo) >= 0) { it.huecos = huecos(q.enunciado); if (it.tipo === 'PALABRAS') it.banco = mezclar(it.huecos.map(function (h) { return h[0]; }).concat(o.filter(Boolean)), r); }
      return it;
    });
  }

  /* Arma el documento. cargar(src) devuelve una promesa {data, w, h} o rechaza (CORS, formato). */
  function armar(D, x, preguntas, opc, cargar) {
    opc = opc || {};
    var items = preparar(x, preguntas || [], opc);
    var total = items.reduce(function (a, it) { return a + it.puntos; }, 0);
    var anchoCm = opc.carta === false ? 21 : 21.59, util = Math.round((anchoCm - 4) / 2.54 * 1440);
    function T(t, o) { return new D.TextRun(Object.assign({ text: String(t) }, o || {})); }
    function P(hijos, o) { return new D.Paragraph(Object.assign({ children: [].concat(hijos), spacing: { after: 60 } }, o || {})); }
    var sinBorde = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' }, borde = { style: D.BorderStyle.SINGLE, size: 6, color: 'B8B8C8' };
    var bordes = { top: borde, bottom: borde, left: borde, right: borde, insideHorizontal: borde, insideVertical: borde };
    function celda(hijos, o) { return new D.TableCell(Object.assign({ children: [].concat(hijos), margins: { top: 70, bottom: 70, left: 110, right: 110 } }, o || {})); }
    function tabla(filas, anchos, o) { return new D.Table(Object.assign({ width: { size: util, type: D.WidthType.DXA }, columnWidths: anchos, layout: D.TableLayoutType.FIXED, borders: bordes, rows: filas.map(function (f) { return new D.TableRow({ cantSplit: true, children: f }); }) }, o || {})); }
    /* Renglón para escribir: tabulador con guion bajo de relleno hasta el margen derecho. */
    function linea() { return P([new D.TextRun({ children: [new D.Tab()], color: 'A0A0B0' })], { keepNext: true, spacing: { before: 200, after: 0 }, indent: { left: 360 }, tabStops: [{ type: D.TabStopType.RIGHT, position: util, leader: D.LeaderType.UNDERSCORE }] }); }
    var K = { keepNext: true, keepLines: true };
    function opcion(t, marca) { return P([T(CAJA + '  ', { font: 'Segoe UI Symbol' }), T(marca ? marca + ')  ' : '', { bold: true }), T(t)], Object.assign({ indent: { left: 360 } }, K)); }
    function guia(t) { return P([T(t, { italics: true, color: GRIS, size: 20 })], Object.assign({ indent: { left: 360 } }, K)); }

    /* Imágenes primero (en paralelo); si una falla, se pone una nota en su lugar. */
    return Promise.all(items.map(function (it) {
      var tx0 = G.TIPOSX && G.TIPOSX[it.tipo], md = String(it.q._pimg ? 'imagen:' + it.q._pimg : tx0 && tx0.propiaMedia && !/^imagen:/.test(it.q.media || '') ? '' : it.q.media || ''), k = md.indexOf(':');   // tipos.js: imagen dibujada (crucigrama, sopa, plano, números)
      if (k < 0) return null;
      it.mtipo = md.slice(0, k); it.src = md.slice(k + 1);
      if (it.mtipo !== 'imagen') return null;
      return Promise.resolve().then(function () { return cargar(it.src); }).then(function (im) { it.img = im; }, function () { it.img = null; });
    })).then(function () {
      var cuerpo = [];
      var fecha = x.inicio ? String(x.inicio).slice(0, 10).split('-').reverse().join('/') : new Date().toLocaleDateString('es-DO');
      cuerpo.push(P([T(opc.centro || G.MARCA || 'Examen Seguro', { size: 20, color: GRIS, allCaps: true })], { alignment: D.AlignmentType.CENTER, spacing: { after: 40 } }));
      cuerpo.push(P([T(x.titulo || 'Examen', { bold: true, size: 32, color: '1F1B3A' })], { heading: D.HeadingLevel.TITLE, alignment: D.AlignmentType.CENTER, spacing: { after: 60 } }));
      cuerpo.push(P([T([x.materia ? 'Materia: ' + x.materia : '', x.curso ? 'Curso: ' + x.curso : '', 'Fecha: ' + fecha, x.minutos ? 'Tiempo: ' + x.minutos + ' min' : '', opc.version ? 'Versión ' + opc.version : ''].filter(Boolean).join('   ·   '), { size: 20, color: GRIS })],
        { alignment: D.AlignmentType.CENTER, spacing: { after: 200 }, border: { bottom: { style: D.BorderStyle.SINGLE, size: 12, color: ACENTO, space: 6 } } }));
      var c1 = Math.round(util * 0.62);
      cuerpo.push(tabla([[celda(P([T('Nombre: ', { bold: true })])), celda(P([T('Curso: ', { bold: true })]))], [celda(P([T('Fecha: ', { bold: true })])), celda(P([T('Calificación: ', { bold: true }), T('_______ / ' + total)]))]], [c1, util - c1]));
      cuerpo.push(P([T('Instrucciones: ', { bold: true }), T(x.instrucciones || 'Lee con atención cada pregunta y responde en este mismo papel. Usa lapicero azul o negro.')], { spacing: { before: 200, after: 200 } }));

      items.forEach(function (it, i) {
        var q = it.q, n = i + 1, num = 0;
        var enun = String(q.enunciado || '');
        var tx = G.TIPOSX && G.TIPOSX[it.tipo], pp = tx ? tx.impreso(q) : null;
        if (pp && pp.enun) enun = pp.enun;
        else if (HUECOS.indexOf(it.tipo) >= 0) enun = enun.replace(/\[\[(.+?)\]\]/g, function () { num++; return '(' + num + ') ________________'; });
        var cab = [T(n + '.  ', { bold: true, color: ACENTO }), T(enun, { bold: true })];
        if (opc.puntos !== false) cab.push(T('   (' + it.puntos + (it.puntos === 1 ? ' punto' : ' puntos') + ')', { color: GRIS, size: 20 }));
        cuerpo.push(P(cab, Object.assign({ spacing: { before: 220, after: 80 }, indent: { left: 360, hanging: 360 } }, K)));
        if (it.mtipo === 'imagen') {
          if (it.img) cuerpo.push(P([new D.ImageRun({ data: it.img.data, transformation: (function (w, h) { var f = Math.min(1, 380 / w, 260 / h); return { width: Math.round(w * f), height: Math.round(h * f) }; })(it.img.w, it.img.h) })], Object.assign({ indent: { left: 360 }, spacing: { after: 100 } }, K)));
          else cuerpo.push(guia('[Imagen no disponible para imprimir: ' + (/^data:/.test(it.src) ? 'ver en la plataforma' : it.src) + ']'));
        } else if (it.mtipo) cuerpo.push(guia('[' + (it.mtipo === 'audio' ? 'Audio' : it.mtipo === 'video' ? 'Video' : it.mtipo) + ' de la pregunta: ' + it.src + ']'));

        var t = it.tipo;
        if (pp) {
          (pp.lineas || []).forEach(function (l, k) { cuerpo.push(k ? P([T(l || ' ')], Object.assign({ indent: { left: 360 } }, K)) : guia(l)); });
          if (pp.tabla && pp.tabla.length) { var nc2 = Math.max.apply(null, pp.tabla.map(function (fl) { return fl.length; })), ac2 = Math.floor(util / nc2);
            cuerpo.push(tabla(pp.tabla.map(function (fl, r) { var c2 = fl.slice(); while (c2.length < nc2) c2.push(''); return c2.map(function (x) { return celda(P([T(x, x === CAJA ? { font: 'Segoe UI Symbol' } : r ? {} : { bold: true })], { alignment: x === CAJA ? D.AlignmentType.CENTER : D.AlignmentType.LEFT })); }); }), Array.apply(null, Array(nc2)).map(function () { return ac2; }))); }
        }
        else if (t === 'MC' || t === 'VF') it.ops.forEach(function (o, j) { cuerpo.push(opcion(o, t === 'MC' ? letra(j) : '')); });
        else if (t === 'VFJ') { cuerpo.push(P([T(CAJA + '  ', { font: 'Segoe UI Symbol' }), T('Verdadero          '), T(CAJA + '  ', { font: 'Segoe UI Symbol' }), T('Falso')], Object.assign({ indent: { left: 360 } }, K))); cuerpo.push(guia('Justifica tu respuesta:')); cuerpo.push(linea()); cuerpo.push(linea()); }
        else if (t === 'CORTA') { cuerpo.push(linea()); cuerpo.push(linea()); cuerpo.push(linea()); }
        else if (t === 'NUMERICA') cuerpo.push(tabla([[celda(P([T('Respuesta:', { bold: true })])), celda(P([T('')]))]], [1800, 2600], { width: { size: 4400, type: D.WidthType.DXA }, indent: { size: 360, type: D.WidthType.DXA } }));
        else if (ORDEN.indexOf(t) >= 0) {
          cuerpo.push(guia(t === 'FLUJO' ? 'Numera los bloques del diagrama en el orden correcto (1 = el primero):' : t === 'ALGORITMO' ? 'Numera las líneas del algoritmo en el orden correcto (1 = la primera):' : 'Numera del 1 al ' + it.orden.length + ' en el orden correcto:'));
          it.orden.forEach(function (k) { cuerpo.push(P([T('(  ____  )   ', { color: GRIS }), T(String(q.opciones[k]).trim(), t === 'ALGORITMO' ? { font: 'Consolas', size: 21 } : {})], Object.assign({ indent: { left: 360 } }, K))); });
        } else if (t === 'RELACIONAR') {
          cuerpo.push(guia('Escribe en el paréntesis la letra que corresponde a cada número:'));
          var mitad = Math.round(util / 2);
          cuerpo.push(tabla(it.pares.map(function (p, j) { return [celda(P([T((j + 1) + '. ', { bold: true }), T(p[0]), T('   ( ___ )', { color: GRIS })])), celda(P([T(letra(j) + ') ', { bold: true }), T(it.pares[it.der[j]][1])]))]; }), [mitad, util - mitad]));
        } else if (t === 'CLASIFICAR') {
          cuerpo.push(guia('Escribe cada elemento en la columna de su grupo:'));
          cuerpo.push(tabla([[celda(P([T('Elementos:  ', { bold: true }), T(it.elem.join('   •   '))]), { shading: { fill: 'F2F2F7', type: D.ShadingType.CLEAR, color: 'auto' } })]], [util]));
          cuerpo.push(P([T('')], { keepNext: true, spacing: { after: 0 } }));
          var nc = it.cats.length || 1, ac = Math.floor(util / nc), alto = Math.max.apply(null, it.cats.map(function (c) { return it.pares.filter(function (p) { return p[0] === c; }).length; }).concat([2]));
          var filas = [it.cats.map(function (c) { return celda(P([T(c, { bold: true })], { alignment: D.AlignmentType.CENTER }), { shading: { fill: 'E8E6FB', type: D.ShadingType.CLEAR, color: 'auto' } }); })];
          for (var f = 0; f < alto; f++) filas.push(it.cats.map(function () { return celda(P([T(' ')], { spacing: { before: 80, after: 80 } })); }));
          cuerpo.push(tabla(filas, it.cats.map(function () { return ac; })));
        } else if (t === 'PALABRAS') {
          cuerpo.push(tabla([[celda(P([T('Banco de palabras:  ', { bold: true }), T(it.banco.join('     •     '))], { alignment: D.AlignmentType.CENTER }), { shading: { fill: 'F2F2F7', type: D.ShadingType.CLEAR, color: 'auto' } })]], [util]));
        } else if (t !== 'COMPLETAR') (q.opciones || []).forEach(function (o, j) { cuerpo.push(opcion(o, letra(j))); });
        cuerpo.push(P([T('')], { spacing: { after: 40 } }));
      });

      if (opc.clave) {
        cuerpo.push(P([T('Hoja de respuestas', { bold: true, size: 30, color: '1F1B3A' })], { pageBreakBefore: true, heading: D.HeadingLevel.HEADING_1, spacing: { after: 60 } }));
        cuerpo.push(P([T('Solo para el docente · ' + (x.titulo || '') + (opc.version ? ' · Versión ' + opc.version : '') + ' · Total: ' + total + ' puntos', { color: GRIS, size: 20 })], { spacing: { after: 200 }, border: { bottom: { style: D.BorderStyle.SINGLE, size: 8, color: ACENTO, space: 4 } } }));
        items.forEach(function (it, i) {
          var q = it.q, t = it.tipo, o = q.opciones || [], lineas = [];
          if (G.TIPOSX && G.TIPOSX[t]) lineas = G.TIPOSX[t].clave(q).split('\n');
          else if (t === 'MC') lineas = [it.ok >= 0 ? letra(it.ok) + ')  ' + it.ops[it.ok] : String(q.correcta || '')];
          else if (t === 'VF') lineas = [it.ops[it.ok]];
          else if (t === 'VFJ') lineas = [it.ops[it.ok] + (q.explicacion ? '. Justificación esperada: ' + q.explicacion : ' (la justificación la corrige el docente)')];
          else if (t === 'CORTA') lineas = [String(q.correcta || '').split('|').join(' / ') || '(la corrige el docente)'];
          else if (t === 'NUMERICA') lineas = [q.correcta + (Number(o[0]) ? ' (± ' + o[0] + ')' : '')];
          else if (ORDEN.indexOf(t) >= 0) { lineas = ['Números en el papel: ' + it.orden.map(function (k) { return k + 1; }).join(', ')]; o.forEach(function (s, k) { lineas.push((k + 1) + '. ' + s); }); }
          else if (t === 'RELACIONAR') lineas = it.pares.map(function (p, j) { return (j + 1) + ' → ' + letra(it.der.indexOf(j)) + ')  ' + p[0] + ' = ' + p[1]; });
          else if (t === 'CLASIFICAR') lineas = it.cats.map(function (c) { return c + ': ' + it.pares.filter(function (p) { return p[0] === c; }).map(function (p) { return p[1]; }).join(', '); });
          else if (HUECOS.indexOf(t) >= 0) lineas = it.huecos.map(function (h, k) { return '(' + (k + 1) + ') ' + h.join(' / '); });
          else lineas = [String(q.correcta || '')];
          cuerpo.push(P([T((i + 1) + '.  ', { bold: true, color: ACENTO }), T(lineas[0])].concat(opc.puntos !== false ? [T('   (' + it.puntos + ' pt)', { color: GRIS, size: 18 })] : []), { keepNext: lineas.length > 1, spacing: { before: 100, after: 40 }, indent: { left: 360, hanging: 360 } }));
          lineas.slice(1).forEach(function (l, k) { cuerpo.push(P([T(l, t === 'ALGORITMO' ? { font: 'Consolas', size: 20 } : { size: 21 })], { keepNext: k < lineas.length - 2, indent: { left: 720 }, spacing: { after: 0 } })); });
        });
      }

      var pie = new D.Footer({ children: [P([T((x.titulo || '') + '   ·   Página ', { size: 16, color: GRIS }), new D.TextRun({ children: [D.PageNumber.CURRENT], size: 16, color: GRIS }), T(' de ', { size: 16, color: GRIS }), new D.TextRun({ children: [D.PageNumber.TOTAL_PAGES], size: 16, color: GRIS })], { alignment: D.AlignmentType.CENTER })] });
      var tam = opc.carta === false ? { width: 11906, height: 16838 } : { width: 12240, height: 15840 };
      return new D.Document({
        creator: G.MARCA || 'Examen Seguro', title: x.titulo || 'Examen', language: 'es-DO',
        styles: { default: { document: { run: { font: 'Calibri', size: 23 }, paragraph: { spacing: { line: 276 } } } } },
        sections: [{ properties: { page: { size: tam, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, footers: { default: pie }, children: cuerpo }]
      });
    });
  }

  var G = typeof window !== 'undefined' ? window : {};
  if (typeof module === 'object' && module.exports) { module.exports = { armar: armar, preparar: preparar }; return; }

  var cargaLib = null;
  function libDocx() {
    if (window.docx && window.docx.Document) return Promise.resolve(window.docx);
    return cargaLib || (cargaLib = new Promise(function (ok, mal) {
      var s = document.createElement('script'); s.src = CDN; s.onload = function () { window.docx ? ok(window.docx) : mal(new Error('No se pudo cargar el generador de Word.')); };
      s.onerror = function () { cargaLib = null; mal(new Error('No se pudo cargar el generador de Word. Revisa la conexión.')); }; document.head.appendChild(s);
    }));
  }
  /* Cualquier imagen (PNG, JPG, SVG, data:) pasa por un lienzo y sale como PNG. */
  function cargarImagen(src) {
    return fetch(src).then(function (r) { if (!r.ok) throw new Error('imagen'); return r.blob(); }).then(function (b) {
      return new Promise(function (ok, mal) {
        var u = URL.createObjectURL(b), im = new Image();
        im.onload = function () {
          var w = im.naturalWidth || 600, h = im.naturalHeight || 400, f = Math.min(1, 1400 / w), cv = document.createElement('canvas');
          cv.width = Math.round(w * f); cv.height = Math.round(h * f); var cx = cv.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, cv.width, cv.height); cx.drawImage(im, 0, 0, cv.width, cv.height); URL.revokeObjectURL(u);
          cv.toBlob(function (pb) { if (!pb) return mal(new Error('imagen')); pb.arrayBuffer().then(function (ab) { ok({ data: ab, w: w, h: h }); }, mal); }, 'image/png');
        };
        im.onerror = function () { URL.revokeObjectURL(u); mal(new Error('imagen')); }; im.src = u;
      });
    });
  }
  function nombreArchivo(t) { return String(t).replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 90) || 'Examen'; }
  function aviso(t, tipo) { if (window.AVISO) window.AVISO(t, tipo); else if (tipo === 'error') alert(t); }

  function descargar(x, preguntas, opc) {
    aviso('Preparando el Word…');
    return libDocx().then(function (D) { return armar(D, x, preguntas, opc, cargarImagen).then(function (doc) { return D.Packer.toBlob(doc); }); }).then(function (blob) {
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = nombreArchivo('Examen ' + (x.titulo || '') + (opc.version ? ' version ' + opc.version : '')) + '.docx';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      aviso('Word descargado');
    }).catch(function (e) { aviso(e.message, 'error'); });
  }

  /** Abre la ventana de opciones y descarga el examen en Word. centro = nombre del centro (opcional). */
  window.bajarWord = function (x, preguntas, centro) {
    if (!preguntas || !preguntas.length) { aviso('El examen no tiene preguntas.', 'error'); return; }
    var dl = document.createElement('dialog');
    dl.style.cssText = 'border:0;border-radius:18px;padding:22px;max-width:420px;width:calc(100% - 32px);background:var(--sup-solida,#fff);color:var(--texto,#16132A);box-shadow:0 20px 50px rgba(0,0,0,.3)';
    function ch(id, txt, on, ayuda) { return '<label style="display:flex;gap:10px;align-items:flex-start;margin:10px 0;cursor:pointer"><input type="checkbox" id="' + id + '"' + (on ? ' checked' : '') + ' style="margin-top:3px"><span><b>' + txt + '</b><br><small style="opacity:.7">' + ayuda + '</small></span></label>'; }
    dl.innerHTML = '<h3 style="margin:0 0 6px">Descargar en Word</h3><p style="margin:0 0 8px;opacity:.75;font-size:14px">Un .docx listo para imprimir o editar en Word.</p>' +
      ch('wClave', 'Incluir hoja de respuestas', false, 'Va en la última página, separada del examen. Quítala antes de imprimir para los estudiantes.') +
      ch('wPuntos', 'Mostrar los puntos de cada pregunta', true, 'Y el total en la casilla de calificación.') +
      ch('wCarta', 'Tamaño carta', true, 'Si lo quitas, sale en A4.') +
      '<label style="display:block;margin:12px 0 4px"><b>Versión</b></label><select id="wVersion" class="entrada" style="width:100%"><option value="">Original (sin mezclar)</option><option value="A">Versión A (preguntas y opciones mezcladas)</option><option value="B">Versión B (otra mezcla)</option></select>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:18px"><button class="btn claro" id="wNo" type="button">Cancelar</button><button class="btn primario" id="wSi" type="button">Descargar Word</button></div>';
    document.body.appendChild(dl);
    function cerrar() { try { dl.close(); } catch (e) {} dl.remove(); }
    dl.addEventListener('cancel', function () { setTimeout(cerrar, 0); });
    dl.querySelector('#wNo').onclick = cerrar;
    dl.querySelector('#wSi').onclick = function () {
      var opc = { clave: dl.querySelector('#wClave').checked, puntos: dl.querySelector('#wPuntos').checked, carta: dl.querySelector('#wCarta').checked, version: dl.querySelector('#wVersion').value, centro: centro || '' };
      cerrar(); descargar(x, preguntas, opc);
    };
    if (dl.showModal) dl.showModal(); else dl.setAttribute('open', '');
  };
})();

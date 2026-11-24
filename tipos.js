/* Examen Seguro: tipos de pregunta v3 (24/11/2026). Un solo archivo para la página del estudiante (index.html), el panel (docente.html), Word y papel.
   El servidor (Tipos.gs) valida y califica; aquí solo se dibuja, se edita y se imprime. Nada de lo que se ve aquí trae la clave: llega en q.x sin respuestas.
   Catálogo y formatos: TIPOS_PREGUNTA.md. */
(function (W) {
  'use strict';
  var X = W.TIPOSX = {};
  var D = typeof document !== 'undefined' && document.addEventListener ? document : null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ico(n) { return W.ICO ? W.ICO(n) : ''; }
  function ctx() { return W.TIPOSX_CTX; }
  function resp(i) { return ctx() ? ctx().resp(i) : undefined; }
  function poner(i, v) { if (ctx()) ctx().poner(i, v); }
  function preg(i) { return ctx() ? ctx().pregunta(i) : null; }
  function activo() { return !!(ctx() && ctx().activo()); }
  function aviso(t, tipo) { if (W.AVISO) W.AVISO(t, tipo); }
  function lineas(q) { return (q.opciones || []).map(String).filter(function (l) { return l.trim(); }); }
  function norm(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' '); }
  function cfg(ls, claves) { var c = { otras: [] }; ls.forEach(function (l) { var m = String(l).match(/^\s*([A-Za-zÁÉÍÓÚáéíóúÑñ ]{2,30}?)\s*:\s*(.*)$/), k = m ? norm(m[1]) : ''; if (m && claves.indexOf(k) >= 0) (c[k] = c[k] || []).push(m[2].trim()); else c.otras.push(l); }); return c; }
  function uno(c, k, d) { return c[k] && c[k].length ? c[k][c[k].length - 1] : d; }
  function estrella(s) { var m = String(s).match(/^\s*\*\s*(.+)$/); return m ? m[1].trim() : null; }
  function sinEstrella(s) { var e = estrella(s); return e === null ? String(s).trim() : e; }
  function huecos(en) { var h = []; String(en || '').replace(/\[\[(.+?)\]\]/g, function (m, a) { h.push(a.split('|').map(function (x) { return x.trim(); })); return m; }); return h; }
  function pal(s) { return String(s || '').toUpperCase().replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ').replace(/[^A-ZÑ0-9]/g, ''); }
  function alfa(a) { return a.slice().sort(function (x, y) { return String(x).localeCompare(String(y), 'es'); }); }
  function hms(s) { s = Math.round(s); var m = Math.floor(s / 60); return m + ':' + ('0' + (s % 60)).slice(-2); }
  function srcImg(m) { var s = String(m || ''), url = s.slice(s.indexOf(':') + 1), d = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/); return d ? 'https://drive.google.com/thumbnail?id=' + d[1] + '&sz=w1600' : url; }
  function semilla(txt) { var h = 2166136261; txt = String(txt); for (var i = 0; i < txt.length; i++) h = Math.imul(h ^ txt.charCodeAt(i), 16777619);
    return function () { h = (h + 0x6D2B79F5) | 0; var t = Math.imul(h ^ (h >>> 15), 1 | h); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function fichas(ls, tipo) {   /* igual que fichas_ de Tipos.gs: {t, m} y '\n' entre líneas */
    var out = [];
    ls.forEach(function (l, k) {
      if (k) out.push({ t: '\n' });
      var marc = [], p = tipo === 'RESALTAR' ? String(l).replace(/\*([^*]+)\*/g, function (m, a) { return '\u0001' + a.trim().replace(/\s+/g, ' ') + '\u0002'; })
        : String(l).replace(/\{([^{}|]+)\|([^{}]+)\}/g, function (m, a, b) { marc.push(b.split('|').map(function (x) { return x.trim(); }).filter(Boolean)); return '\u0001' + (marc.length - 1) + '\u0003' + a.trim().replace(/\s+/g, ' ') + '\u0002'; });
      p.split(/[ \t]+/).filter(Boolean).forEach(function (w) { var mm = w.match(/\u0001(?:(\d+)\u0003)?/), f = { t: w.replace(/\u0001(\d+\u0003)?|\u0002/g, '').replace(/ /g, ' ') }; if (mm) f.m = tipo === 'RESALTAR' ? true : marc[Number(mm[1])]; out.push(f); });
    });
    return out;
  }

  /* ---------- Crucigrama y sopa: copia exacta de cruci_ y sopa_ de Tipos.gs (pruebas/tweb.js comprueba que den lo mismo) ---------- */
  function cruci_(pares) {
    var ws = pares.map(function (p, k) { return { s: p[0], p: p[1], k: k }; }).sort(function (a, b) { return b.s.length - a.s.length || a.k - b.k; });
    var g = {}, pl = [];
    function at(r, c) { return g[r + ',' + c]; }
    function cabe(s, r, c, d) {
      var dr = d, dc = 1 - d, n = 0, i, x;
      if (at(r - dr, c - dc) || at(r + dr * s.length, c + dc * s.length)) return -1;
      for (i = 0; i < s.length; i++) {
        x = at(r + dr * i, c + dc * i);
        if (x) { if (x.l !== s[i] || x[d]) return -1; n++; continue; }
        if (at(r + dr * i + dc, c + dc * i + dr) || at(r + dr * i - dc, c + dc * i - dr)) return -1;
      }
      return n;
    }
    function poner(w, r, c, d) { for (var i = 0; i < w.s.length; i++) { var k = (r + d * i) + ',' + (c + (1 - d) * i); g[k] = g[k] || { l: w.s[i] }; g[k][d] = true; } pl.push({ w: w, r: r, c: c, d: d }); }
    ws.forEach(function (w, wi) {
      if (!wi) { poner(w, 0, 0, 0); return; }
      var mejor = null;
      Object.keys(g).forEach(function (k) {
        var x = g[k], rc = k.split(',').map(Number);
        for (var i = 0; i < w.s.length; i++) {
          if (w.s[i] !== x.l) continue;
          [0, 1].forEach(function (d) {
            if (x[d]) return;
            var r = rc[0] - d * i, c = rc[1] - (1 - d) * i, n = cabe(w.s, r, c, d);
            if (n > 0 && (!mejor || n > mejor.n || (n === mejor.n && (r < mejor.r || (r === mejor.r && c < mejor.c))))) mejor = { r: r, c: c, d: d, n: n };
          });
        }
      });
      if (mejor) poner(w, mejor.r, mejor.c, mejor.d);
      else { var maxR = Math.max.apply(null, Object.keys(g).map(function (k) { return Number(k.split(',')[0]); })), minC = Math.min.apply(null, Object.keys(g).map(function (k) { return Number(k.split(',')[1]); })); poner(w, maxR + 2, minC, 0); }
    });
    var ks = Object.keys(g).map(function (k) { return k.split(',').map(Number); });
    var r0 = Math.min.apply(null, ks.map(function (x) { return x[0]; })), c0 = Math.min.apply(null, ks.map(function (x) { return x[1]; }));
    var w = Math.max.apply(null, ks.map(function (x) { return x[1]; })) - c0 + 1, h = Math.max.apply(null, ks.map(function (x) { return x[0]; })) - r0 + 1;
    var ini = pl.map(function (p) { return (p.r - r0) * 1000 + (p.c - c0); }).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
    var ent = pl.map(function (p) { var r = p.r - r0, c = p.c - c0; return { n: ini.indexOf(r * 1000 + c) + 1, d: p.d ? 'V' : 'H', r: r, c: c, len: p.w.s.length, p: p.w.p, s: p.w.s }; });
    ent.sort(function (a, b) { return a.n - b.n || (a.d < b.d ? -1 : 1); });
    return { w: w, h: h, ent: ent };
  }
  function sopa_(palabras, tam, todas, rnd) {
    var D = todas ? [[0, 1], [1, 0], [1, 1], [0, -1], [-1, 0], [-1, -1], [-1, 1], [1, -1]] : [[0, 1], [1, 0], [1, 1]], A = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
    for (var n = tam; n < tam + 6; n++) {
      var g = [], pos = [], i, r;
      for (i = 0; i < n; i++) { g.push([]); for (r = 0; r < n; r++) g[i].push(''); }
      var orden = palabras.map(function (p, k) { return k; }).sort(function (a, b) { return palabras[b].length - palabras[a].length || a - b; });
      var ok = orden.every(function (k) {
        var w = palabras[k];
        for (var t = 0; t < 400; t++) {
          var d = D[Math.floor(rnd() * D.length)], r1 = Math.floor(rnd() * n), c1 = Math.floor(rnd() * n), r2 = r1 + d[0] * (w.length - 1), c2 = c1 + d[1] * (w.length - 1), j, bien = true;
          if (r2 < 0 || r2 >= n || c2 < 0 || c2 >= n) continue;
          for (j = 0; j < w.length && bien; j++) { var x = g[r1 + d[0] * j][c1 + d[1] * j]; if (x && x !== w[j]) bien = false; }
          if (!bien) continue;
          for (j = 0; j < w.length; j++) g[r1 + d[0] * j][c1 + d[1] * j] = w[j];
          pos[k] = [r1, c1, r2, c2]; return true;
        }
        return false;
      });
      if (ok) return { g: g.map(function (f) { return f.map(function (x) { return x || A[Math.floor(rnd() * A.length)]; }).join(''); }), pos: pos };
    }
    return null;
  }
  X._cruci = cruci_; X._sopa = sopa_; X._fichas = fichas;

  /* ---------- Lectores de las líneas del docente (para editor, papel y clave) ---------- */
  function matriz(q) { var c = cfg(lineas(q), ['columnas']); return { cols: String(uno(c, 'columnas', '')).split('|').map(function (x) { return x.trim(); }).filter(Boolean),
    filas: c.otras.map(function (l) { var k = l.lastIndexOf('='); return k > 0 ? [l.slice(0, k).trim(), l.slice(k + 1).trim()] : null; }) }; }
  function zonas(q) { return lineas(q).map(function (l) { var m = l.match(/^\s*(c|circulo|círculo|r|rect|rectangulo|rectángulo)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s+([\d.]+))?\s*(?:=\s*(.*))?$/i); if (!m) return null; var c = /^c/i.test(m[1]);
    return !c && !m[5] ? null : { c: c, x: +m[2], y: +m[3], a: +m[4], b: c ? +m[4] : +m[5], et: (m[6] || '').trim() }; }); }
  function etiquetas(q) { var c = cfg(lineas(q), ['relleno']), rel = [].concat.apply([], (c.relleno || []).map(function (s) { return s.split(',').map(function (x) { return x.trim(); }).filter(Boolean); }));
    return { pts: c.otras.map(function (l) { var m = l.match(/^(.+?)\s*=\s*(-|([\d.]+)\s*[ ;]\s*([\d.]+))\s*$/); return !m ? null : m[2] === '-' ? { et: m[1].trim(), rel: true } : { et: m[1].trim(), x: +m[3], y: +m[4] }; }), rel: rel }; }
  function plano(q) { var c = cfg(lineas(q), ['ejes', 'paso', 'puntos', 'funcion', 'puntos requeridos', 'tolerancia']), e = String(uno(c, 'ejes', '-10 10 -10 10')).split(/[\s;]+/).map(Number), pts = [];
    String(uno(c, 'puntos', '')).replace(/\(\s*([-+]?[\d.]+)\s*[,;]\s*([-+]?[\d.]+)\s*\)/g, function (m, a, b) { pts.push([+a, +b]); return m; });
    return { ejes: e.length === 4 && e.every(isFinite) && e[0] < e[1] && e[2] < e[3] ? e : [-10, 10, -10, 10], paso: Math.abs(Number(String(uno(c, 'paso', '1')).replace(',', '.'))) || 1, pts: pts, fn: uno(c, 'funcion', ''), req: parseInt(uno(c, 'puntos requeridos', '2'), 10) || 2 }; }
  function controles(q) { var sl = [], resto = []; lineas(q).forEach(function (l) { var m = l.match(/^\s*([A-Za-z][A-Za-z0-9_]{0,11})\s*:\s*([-+]?[\d.]+)\s+a\s+([-+]?[\d.]+)(?:\s*,\s*paso\s+([\d.]+))?(?:\s*,\s*(.+))?$/i);
    if (m && !/^(meta|tolerancia)$/i.test(m[1])) sl.push({ v: m[1], min: +m[2], max: +m[3], paso: +m[4] || 1, et: (m[5] || m[1]).trim() }); else resto.push(l); });
    return { sl: sl, metas: cfg(resto, ['meta']).meta || [] }; }
  function tabla(q) { var c = cfg(lineas(q), ['tolerancia']); return c.otras.map(function (l) { return l.split('|').map(function (x) { return x.trim(); }); }); }
  function codigo(q) { var c = cfg(lineas(q), ['firma', 'prueba', 'oculta']), p = function (s) { var k = s.lastIndexOf('=>'); return k > 0 ? [s.slice(0, k).trim(), s.slice(k + 2).trim()] : null; };
    return { firma: uno(c, 'firma', ''), vis: (c.prueba || []).map(p), oc: (c.oculta || []).map(p) }; }
  function escena(q) { var nodos = {}, orden = [], cur = null;
    lineas(q).forEach(function (l) { var m = l.match(/^\s*\[([^\]]+)\]\s*(.*)$/); if (m) { var id = norm(m[1]); cur = nodos[id] = { t: m[2].trim(), op: [], d: [], p: [] }; orden.push(id); return; }
      m = l.match(/^\s*[-•*]\s*(.+?)\s*=>\s*([^()]+?)\s*(?:\(\s*([-+]?[\d.,]+)\s*(?:pts?|puntos?)?\s*\))?\s*$/i);
      if (m && cur) { cur.op.push(m[1].trim()); cur.d.push(norm(m[2])); cur.p.push(Number(String(m[3] || '0').replace(',', '.')) || 0); return; } if (cur) cur.t += (cur.t ? '\n' : '') + l.trim(); });
    return { nodos: nodos, orden: orden }; }
  function sct(q) { var c = cfg(lineas(q), ['escala']); return c.otras.map(function (l) { var p = l.split('|').map(function (x) { return x.trim(); }); return p.length < 3 ? null : { h: p[0], d: p[1], r: p[2] }; }); }
  function paradas(q) { return lineas(q).map(function (l) { var m = l.match(/^\s*@\s*(\d+(?::\d{1,2}){0,2})\s+(.+)$/); if (!m) return null; var pz = m[2].split('|').map(function (x) { return x.trim(); }).filter(Boolean);
    return { t: m[1].split(':').map(Number).reduce(function (a, x) { return a * 60 + x; }, 0), p: pz[0], op: pz.slice(1) }; }); }
  function ensayo(q) { var c = cfg(lineas(q), ['minimo', 'maximo', 'criterio']); return { min: parseInt(uno(c, 'minimo', '0'), 10) || 0, max: parseInt(uno(c, 'maximo', '0'), 10) || 0, rub: c.criterio || [] }; }
  function crucPares(q) { return lineas(q).map(function (l) { var k = l.indexOf('='); return k > 0 ? [pal(l.slice(0, k)), l.slice(k + 1).trim()] : null; }); }
  function sopaDe(q) { var c = cfg(lineas(q), ['tamano', 'direcciones']), w = []; c.otras.map(pal).forEach(function (x) { if (x && w.indexOf(x) < 0) w.push(x); });
    var tam = Math.max(Math.min(15, parseInt(uno(c, 'tamano', '0'), 10) || 0), Math.max.apply(null, w.map(function (x) { return x.length; }).concat([8])) + 1);
    var s = sopa_(w, tam, /tod/i.test(uno(c, 'direcciones', '')), semilla(q.enunciado + '|' + w.join(','))); return { w: w, s: s }; }

  /* ---------- El catálogo (nombre, papel, ayuda del editor, ejemplo, formato para «Pegar preguntas» y prompts) ---------- */
  function T(codigo, o) { X[codigo] = o; o.codigo = codigo; }
  var CAJA = '☐';
  T('DESPLEGABLE', { nombre: 'Listas desplegables', papel: 'SI', campos: 'enunciado', alias: ['desplegable', 'lista desplegable'], ia: true,
    ph: 'Ej.: La [[CPU|RAM|bocina]] procesa los datos.', enun: 'Elige la opción correcta en cada espacio.',
    ayuda: 'Escribe el texto en la pregunta y pon cada espacio como [[correcta|incorrecta|incorrecta]]: la PRIMERA es la correcta (al estudiante le salen mezcladas).',
    formato: ['Listas desplegables: primera línea «Tipo: desplegable» y luego el texto con cada espacio como [[correcta|incorrecta|incorrecta]] (la PRIMERA opción es la correcta).', 'Tipo: desplegable\nLa [[CPU|RAM|impresora]] procesa los datos y la [[RAM|CPU|bocina]] los guarda mientras el equipo está encendido.'],
    validar: function (q) { var h = huecos(q.enunciado); return !h.length ? 'marca los espacios con [[correcta|otra]]' : h.some(function (x) { return x.length < 2; }) ? 'cada espacio necesita al menos 2 opciones' : null; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [], p = esc(q.enunciado).split('[[]]');
      return '<div class="completar">' + p.map(function (s, j) { return s + (j < p.length - 1 ? '<select class="hueco tx-des" data-i="' + i + '" data-j="' + j + '" aria-label="Espacio ' + (j + 1) + '"><option value="">…</option>' + (q.x[j] || []).map(function (o) { return '<option' + (a[j] === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select>' : ''); }).join('') + '</div>'; },
    impreso: function (q) { return { enun: String(q.enunciado).replace(/\[\[(.+?)\]\]/g, function (m, a) { return '( ' + alfa(a.split('|').map(function (x) { return x.trim(); })).join(' / ') + ' )'; }), lineas: ['Encierra en cada paréntesis la opción correcta.'] }; },
    clave: function (q) { return huecos(q.enunciado).map(function (h) { return h[0]; }).join(' · '); } });
  T('MULTIPLE', { nombre: 'Varias respuestas correctas', papel: 'SI', alias: ['varias correctas', 'varias respuestas', 'casillas', 'multirrespuesta'], ia: true,
    ayuda: 'Una opción por línea. Pon un * al inicio de CADA opción correcta. Puntaje parcial: cada correcta suma y cada incorrecta marcada resta.', ejemplo: '*Teclado\n*Mouse\nMonitor\n*Micrófono\nImpresora',
    formato: ['Varias correctas: primera línea «Tipo: varias correctas», el enunciado y debajo 4 a 6 opciones, una por línea, con * al inicio de CADA correcta (2 o 3 correctas).', 'Tipo: varias correctas\nMarca todos los dispositivos de entrada.\n*Teclado\n*Mouse\nMonitor\n*Micrófono\nImpresora'],
    limpiaLinea: function (l) { var m = l.match(/^(\*?)\s*(?:[a-hA-H][).]|[-•])\s+(.*?)(\s*\*)?$/); return m ? (m[1] || m[3] ? '*' : '') + m[2] : l; },
    validar: function (q) { var o = lineas(q); return o.length < 2 ? 'necesita al menos 2 opciones' : !o.some(function (x) { return estrella(x) !== null; }) ? 'marca con * cada correcta' : null; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [];
      return '<p class="ayuda-tipo">' + ico('check') + 'Puedes marcar varias. Las incorrectas marcadas restan.</p>' + q.opciones.map(function (o, j) { var on = a.indexOf(j) >= 0;
        return '<label class="op' + (on ? ' sel' : '') + '" data-i="' + i + '" data-j="' + j + '"><input type="checkbox" class="tx-mul" data-i="' + i + '" data-j="' + j + '"' + (on ? ' checked' : '') + '><span class="letra">' + (on ? '✔' : String.fromCharCode(65 + j)) + '</span><span>' + esc(o) + '</span></label>'; }).join(''); },
    impreso: function (q) { return { lineas: ['Marca TODAS las correctas:'].concat(lineas(q).map(function (o) { return CAJA + '  ' + sinEstrella(o); })) }; },
    clave: function (q) { return lineas(q).filter(function (o) { return estrella(o) !== null; }).map(estrella).join(' · '); } });
  T('MATRIZ', { nombre: 'Matriz (filas y columnas)', papel: 'SI', alias: ['matriz', 'cuadricula', 'cuadrícula', 'tabla de opciones'], ia: true,
    ayuda: 'Primera línea «Columnas: A | B | C». Luego una fila por línea: «afirmación = columna correcta». Cada fila bien vale su parte.', ejemplo: 'Columnas: Verdadero | Falso\nLa RAM es volátil = Verdadero\nEl monitor es de entrada = Falso',
    formato: ['Matriz: primera línea «Tipo: matriz», el enunciado, una línea «Columnas: A | B» y debajo 3 a 6 filas «afirmación = columna correcta».', 'Tipo: matriz\nMarca si cada afirmación es verdadera o falsa.\nColumnas: Verdadero | Falso\nLa RAM es volátil = Verdadero\nEl monitor es de entrada = Falso\nUn byte tiene 8 bits = Verdadero'],
    validar: function (q) { var m = matriz(q); return m.cols.length < 2 ? 'falta «Columnas: A | B»' : !m.filas.length || m.filas.some(function (f) { return !f || !m.cols.some(function (c) { return norm(c) === norm(f[1]); }); }) ? 'cada fila: «afirmación = una de las columnas»' : null; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [], c = q.x.cols;
      return '<div class="tx-scroll"><table class="tx-mat"><thead><tr><th></th>' + c.map(function (x) { return '<th>' + esc(x) + '</th>'; }).join('') + '</tr></thead><tbody>' + q.opciones.map(function (f, j) {
        return '<tr><td>' + esc(f) + '</td>' + c.map(function (x, k) { return '<td><input type="radio" class="tx-mat-r" name="tm' + i + '_' + j + '" data-i="' + i + '" data-j="' + j + '" value="' + k + '" aria-label="' + esc(x) + '"' + (a[j] === k ? ' checked' : '') + '></td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>'; },
    impreso: function (q) { var m = matriz(q); return { lineas: ['Marca una casilla por fila:'], tabla: [[''].concat(m.cols)].concat(m.filas.filter(Boolean).map(function (f) { return [f[0]].concat(m.cols.map(function () { return CAJA; })); })) }; },
    clave: function (q) { return matriz(q).filas.filter(Boolean).map(function (f) { return f[0] + ' → ' + f[1]; }).join('\n'); } });
  T('RESALTAR', { nombre: 'Marcar palabras en el texto', papel: 'ADAPTADO', alias: ['resalta', 'marcar palabras', 'marca las palabras', 'subraya', 'seleccionar palabras'], ia: true,
    ayuda: 'En la pregunta va la instrucción (ej.: Marca los verbos). Abajo el texto; pon entre *asteriscos* lo que se debe marcar. Las marcadas de más restan.', ejemplo: 'Ana *enciende* la computadora y *abre* el navegador.',
    formato: ['Marcar palabras: primera línea «Tipo: marcar palabras», la instrucción y debajo el texto con las palabras a marcar entre *asteriscos*.', 'Tipo: marcar palabras\nMarca todos los verbos.\nAna *enciende* la computadora y *abre* el navegador.'],
    validar: function (q) { return fichas(lineas(q), 'RESALTAR').some(function (f) { return f.m; }) ? null : 'pon entre *asteriscos* las palabras a marcar'; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [];
      return '<p class="ayuda-tipo">' + ico('editar') + 'Toca las palabras para marcarlas; tócalas otra vez para desmarcar.</p><div class="tx-texto">' + q.x.map(function (t, k) { return t === '\n' ? '<br>' : '<button type="button" class="tx-tok' + (a.indexOf(k) >= 0 ? ' on' : '') + '" data-i="' + i + '" data-k="' + k + '">' + esc(t) + '</button>'; }).join(' ') + '</div>'; },
    impreso: function (q) { return { lineas: ['Subraya en el texto lo que se pide.', ''].concat(lineas(q).map(function (l) { return l.replace(/\*([^*]+)\*/g, '$1'); })) }; },
    clave: function (q) { return fichas(lineas(q), 'RESALTAR').filter(function (f) { return f.m; }).map(function (f) { return f.t; }).join(' · '); } });
  T('CORREGIR', { nombre: 'Corregir el texto', papel: 'ADAPTADO', alias: ['corregir', 'correccion', 'corrección', 'errores'], ia: true,
    ayuda: 'En la pregunta va la instrucción. Abajo el texto con cada error como {incorrecto|correcto} (varias correcciones válidas: {aver|a ver|haber}). Cambiar una palabra que estaba bien resta.', ejemplo: 'La memoria RAM se {vorra|borra} al apagar el equipo.',
    formato: ['Corregir: primera línea «Tipo: corregir», la instrucción y debajo el texto con 2 a 4 errores escritos {incorrecto|correcto}.', 'Tipo: corregir\nCorrige las palabras mal escritas.\nEl procesador ejecuta las {istrucciones|instrucciones} y la RAM se {vorra|borra} al apagar.'],
    validar: function (q) { return fichas(lineas(q), 'CORREGIR').some(function (f) { return f.m; }) ? null : 'escribe los errores como {incorrecto|correcto}'; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [], fx = {}; a.forEach(function (p) { fx[p[0]] = p[1]; });
      return '<p class="ayuda-tipo">' + ico('corregir') + 'Toca cada palabra que esté mal y escribe cómo va. Para deshacer, borra lo que escribiste.</p><div class="tx-texto">' + q.x.map(function (t, k) {
        if (t === '\n') return '<br>';
        return fx[k] !== undefined ? '<span class="tx-fix"><s>' + esc(t) + '</s><input class="tx-cor" data-i="' + i + '" data-k="' + k + '" value="' + esc(fx[k]) + '" autocomplete="off" spellcheck="false" size="' + Math.max(4, t.length + 2) + '" aria-label="Corrección de ' + esc(t) + '"></span>'
          : '<button type="button" class="tx-tok" data-i="' + i + '" data-k="' + k + '" data-cor="1">' + esc(t) + '</button>'; }).join(' ') + '</div>'; },
    impreso: function (q) { return { lineas: ['Tacha cada palabra con error y escribe la corrección encima.', ''].concat(lineas(q).map(function (l) { return l.replace(/\{([^{}|]+)\|[^{}]+\}/g, '$1'); })) }; },
    clave: function (q) { return fichas(lineas(q), 'CORREGIR').filter(function (f) { return f.m; }).map(function (f) { return f.t + ' → ' + f.m.join(' / '); }).join('\n'); } });
  T('HOTSPOT', { nombre: 'Tocar zonas de la imagen', papel: 'ADAPTADO', alias: ['hotspot', 'zona', 'punto caliente', 'tocar la imagen'], imagen: true, propiaMedia: true, imgPapel: true,
    ayuda: 'Necesita una imagen (abajo). Pulsa «Marcar en la imagen» y toca cada zona correcta: se agrega «c x y radio» (círculo, en % de la imagen) o escribe «r x y ancho alto». Opcional «= nombre».', ejemplo: 'c 75 45 10 = Torre (CPU)\nr 10 20 30 15 = Monitor',
    validar: function (q) { var z = zonas(q); return !/^imagen:/.test(q.media || '') ? 'agrega una imagen' : !z.length || z.some(function (x) { return !x; }) ? 'zonas: «c x y radio» o «r x y ancho alto»' : null; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [];
      return '<p class="ayuda-tipo">' + ico('ver') + 'Toca en la imagen ' + (q.x.n > 1 ? 'las ' + q.x.n + ' zonas' : 'la zona') + ' que se pide. Toca una marca para quitarla.</p>' +
        '<div class="tx-img" data-i="' + i + '" data-hot="1"><img src="' + esc(srcImg(q.media)) + '" alt="Imagen de la pregunta" draggable="false">' + a.map(function (p, k) { return '<span class="tx-mk" data-k="' + k + '" style="left:' + p[0] + '%;top:' + p[1] + '%">' + (k + 1) + '</span>'; }).join('') + '</div>' +
        '<p class="pequeno suave">Marcas: ' + a.length + ' de ' + q.x.n + '</p>'; },
    impreso: function (q) { var n = zonas(q).filter(Boolean).length; return { lineas: ['Marca con una X en la imagen ' + (n > 1 ? 'las ' + n + ' zonas que se piden.' : 'la zona que se pide.')] }; },
    clave: function (q) { return zonas(q).filter(Boolean).map(function (z, k) { return (z.et || 'Zona ' + (k + 1)) + ' (' + (z.c ? 'círculo en ' + z.x + ' %, ' + z.y + ' %' : 'rectángulo desde ' + z.x + ' %, ' + z.y + ' %') + ')'; }).join('\n'); } });
  T('ETIQUETAR', { nombre: 'Etiquetar la imagen', papel: 'ADAPTADO', alias: ['etiquet', 'rotula', 'rotular', 'partes de la imagen'], imagen: true, propiaMedia: true, imgPapel: true,
    ayuda: 'Necesita una imagen (abajo). Una etiqueta por línea «Nombre = x y» (posición en % de la imagen); pulsa «Marcar en la imagen» para ponerlas tocando. Etiquetas de relleno: «Relleno: a, b».', ejemplo: 'Monitor = 32 33\nTeclado = 35 74\nRelleno: Impresora, Escáner',
    validar: function (q) { var e = etiquetas(q); return !/^imagen:/.test(q.media || '') ? 'agrega una imagen' : e.pts.some(function (p) { return !p; }) || e.pts.filter(function (p) { return !p.rel; }).length < 2 ? 'al menos 2 líneas «Nombre = x y»' : null; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [], sel = X._etSel && X._etSel.i === i ? X._etSel.j : -1;
      return '<p class="ayuda-tipo">' + ico('enlace') + 'Arrastra cada etiqueta a su número (o tócala y luego toca el número). También puedes elegir en las listas.</p>' +
        '<div class="tx-chips">' + q.opciones.map(function (o, j) { return '<button type="button" class="tx-et' + (sel === j ? ' sel' : '') + (a.indexOf(j) >= 0 ? ' usada' : '') + '" draggable="true" data-i="' + i + '" data-j="' + j + '">' + esc(o) + '</button>'; }).join('') + '</div>' +
        '<div class="tx-img" data-i="' + i + '"><img src="' + esc(srcImg(q.media)) + '" alt="Imagen de la pregunta" draggable="false">' + q.x.pts.map(function (p, k) {
          var v = a[k]; return '<span class="tx-pt' + (v !== null && v !== undefined ? ' on' : '') + '" data-i="' + i + '" data-k="' + k + '" style="left:' + p[0] + '%;top:' + p[1] + '%"><b>' + (k + 1) + '</b>' + (v !== null && v !== undefined ? '<em>' + esc(q.opciones[v]) + '</em>' : '') + '</span>'; }).join('') + '</div>' +
        '<div class="tx-lista">' + q.x.pts.map(function (p, k) { return '<label><b>' + (k + 1) + '</b><select class="entrada mini tx-et-s" data-i="' + i + '" data-k="' + k + '"><option value="">…</option>' + q.opciones.map(function (o, j) { return '<option value="' + j + '"' + (a[k] === j ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></label>'; }).join('') + '</div>'; },
    impreso: function (q) { var e = etiquetas(q), p = e.pts.filter(function (x) { return x && !x.rel; }); return { lineas: ['Escribe el nombre de cada número. Etiquetas: ' + alfa(p.map(function (x) { return x.et; }).concat(e.rel)).join(' · ')].concat(p.map(function (x, k) { return (k + 1) + '. ____________________'; })) }; },
    clave: function (q) { return etiquetas(q).pts.filter(function (x) { return x && !x.rel; }).map(function (x, k) { return (k + 1) + ' → ' + x.et; }).join('\n'); } });
  T('GRAFICAR', { nombre: 'Graficar en el plano', papel: 'ADAPTADO', alias: ['grafic', 'plano cartesiano', 'plano', 'ubicar puntos'], imgPapel: true,
    ayuda: '«Ejes: xmin xmax ymin ymax» (opcional, por defecto -10 10 -10 10), «Paso: 1» (cuadrícula). Luego «Puntos: (1,2) (3,4)» para ubicar puntos, o «Función: 2x + 1» y «Puntos requeridos: 2» para graficarla. «Tolerancia:» opcional.', ejemplo: 'Ejes: -5 5 -5 5\nFunción: x + 1\nPuntos requeridos: 2',
    formato: ['Graficar: primera línea «Tipo: graficar», el enunciado y debajo «Ejes: -5 5 -5 5» y «Puntos: (1,2) (-3,4)» (ubicar puntos) o «Función: 2x + 1» con «Puntos requeridos: 2» (la recta o curva).', 'Tipo: graficar\nUbica dos puntos de la recta y = 2x - 1.\nEjes: -5 5 -5 5\nFunción: 2x - 1\nPuntos requeridos: 2'],
    validar: function (q) { var p = plano(q); return p.pts.length || p.fn ? null : 'escribe «Puntos: (1,2)» o «Función: …»'; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [], e = q.x.ejes, S = 300, sx = function (x) { return (x - e[0]) / (e[1] - e[0]) * S; }, sy = function (y) { return S - (y - e[2]) / (e[3] - e[2]) * S; };
      var g = '', p = q.x.paso, n = 0, paso = p; while ((e[1] - e[0]) / paso > 40) paso *= 2;
      for (var x = Math.ceil(e[0] / paso) * paso; x <= e[1] + 1e-9 && n < 200; x += paso, n++) g += '<line x1="' + sx(x) + '" y1="0" x2="' + sx(x) + '" y2="' + S + '" class="g"/>';
      for (var y = Math.ceil(e[2] / paso) * paso; y <= e[3] + 1e-9 && n < 400; y += paso, n++) g += '<line x1="0" y1="' + sy(y) + '" x2="' + S + '" y2="' + sy(y) + '" class="g"/>';
      var et = '', pe = Math.max(paso, Math.ceil((e[1] - e[0]) / 10));
      for (x = Math.ceil(e[0] / pe) * pe; x <= e[1]; x += pe) if (Math.abs(x) > 1e-9) et += '<text x="' + sx(x) + '" y="' + Math.min(S - 3, Math.max(10, sy(0) + 11)) + '">' + Math.round(x * 100) / 100 + '</text>';
      for (y = Math.ceil(e[2] / pe) * pe; y <= e[3]; y += pe) if (Math.abs(y) > 1e-9) et += '<text x="' + Math.min(S - 8, Math.max(8, sx(0) - 8)) + '" y="' + (sy(y) + 4) + '">' + Math.round(y * 100) / 100 + '</text>';
      var ord = a.slice().sort(function (u, v) { return u[0] - v[0]; });
      return '<p class="ayuda-tipo">' + ico('grafica') + (q.x.modo === 'funcion' ? 'Toca ' + q.x.n + ' puntos de la gráfica.' : 'Ubica ' + q.x.n + ' punto' + (q.x.n > 1 ? 's' : '') + '.') + ' Toca un punto para quitarlo.</p>' +
        '<svg class="tx-plano" data-i="' + i + '" viewBox="-6 -6 ' + (S + 12) + ' ' + (S + 12) + '" role="img" aria-label="Plano cartesiano">' + g +
        (e[0] <= 0 && e[1] >= 0 ? '<line x1="' + sx(0) + '" y1="0" x2="' + sx(0) + '" y2="' + S + '" class="ej"/>' : '') + (e[2] <= 0 && e[3] >= 0 ? '<line x1="0" y1="' + sy(0) + '" x2="' + S + '" y2="' + sy(0) + '" class="ej"/>' : '') + et +
        (q.x.modo === 'funcion' && ord.length > 1 ? '<polyline points="' + ord.map(function (pt) { return sx(pt[0]) + ',' + sy(pt[1]); }).join(' ') + '" class="ln"/>' : '') +
        a.map(function (pt) { return '<circle cx="' + sx(pt[0]) + '" cy="' + sy(pt[1]) + '" r="6" class="pt"/>'; }).join('') + '</svg>' +
        '<p class="pequeno suave">Puntos: ' + (a.length ? a.map(function (pt) { return '(' + pt[0] + ', ' + pt[1] + ')'; }).join(' ') : 'ninguno') + '</p>'; },
    impreso: function (q) { var p = plano(q); return { lineas: [p.fn ? 'Grafica en el plano (ubica al menos ' + p.req + ' puntos).' : 'Ubica los puntos en el plano.'] }; },
    clave: function (q) { var p = plano(q); return p.fn ? 'y = ' + p.fn + ' (' + p.req + ' puntos)' : p.pts.map(function (x) { return '(' + x[0] + ', ' + x[1] + ')'; }).join(' '); } });
  T('EXPRESION', { nombre: 'Expresión matemática', papel: 'SI', campos: 'correcta', alias: ['expresion', 'expresión', 'formula', 'fórmula', 'algebra', 'álgebra'], ia: true,
    ayuda: 'Escribe la expresión correcta en «Respuesta» (ej.: 2*x + 6). Se acepta cualquier forma equivalente (2(x+3), x+x+6…): se prueba en varios valores. Opcional: «Variables: x, y» y «Rango: 1 10».', ejemplo: 'Variables: x',
    formato: ['Expresión: primera línea «Tipo: expresión», el enunciado y «Respuesta:» con la expresión (usa x; * para multiplicar, ^ para potencia).', 'Tipo: expresión\nEscribe el perímetro de un rectángulo de base x y altura 3.\nRespuesta: 2*x + 6'],
    validar: function (q) { return String(q.correcta || '').trim() && q.correcta !== 'auto' ? null : 'escribe la expresión en «Respuesta»'; },
    html: function (q, i, r) { return '<p class="ayuda-tipo">' + ico('editar') + 'Escribe la expresión' + (q.x.vars.length ? ' usando ' + q.x.vars.join(', ') : '') + '. Usa * para multiplicar, / para dividir, ^ para potencia y sqrt( ) para raíz.</p>' +
      '<input class="entrada tx-expr" data-i="' + i + '" autocomplete="off" spellcheck="false" inputmode="text" maxlength="200" placeholder="Ej.: 2*x + 1" value="' + esc(r || '') + '">'; },
    impreso: function () { return { lineas: ['Respuesta: ______________________________'] }; },
    clave: function (q) { return String(q.correcta || ''); } });
  T('CONTROLES', { nombre: 'Deslizadores (simulación)', papel: 'NO', alias: ['control', 'deslizador', 'slider', 'simulacion', 'simulación'],
    ayuda: 'Un deslizador por línea «R: 1 a 20, paso 1, Resistencia (Ω)». Luego una o más «Meta: R*I = 12» (también <, >, <=, >=) y «Tolerancia: 0.1» opcional. Cada meta cumplida vale su parte.', ejemplo: 'R: 1 a 12, paso 1, Resistencia (Ω)\nI: 0.5 a 6, paso 0.5, Corriente (A)\nMeta: R*I = 12',
    validar: function (q) { var c = controles(q); return !c.sl.length ? 'escribe un deslizador «R: 1 a 20, paso 1»' : !c.metas.length ? 'escribe una «Meta: …»' : null; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [];
      return '<p class="ayuda-tipo">' + ico('ajustes') + 'Mueve los controles hasta cumplir lo que se pide.</p><div class="tx-sl">' + q.x.sl.map(function (s, k) { var v = a[k] !== undefined && a[k] !== null ? a[k] : s.min;
        return '<label><span>' + esc(s.et) + ' <b class="tx-sv">' + v + '</b></span><input type="range" class="tx-rng" data-i="' + i + '" data-k="' + k + '" min="' + s.min + '" max="' + s.max + '" step="' + s.paso + '" value="' + v + '"></label>'; }).join('') + '</div>'; },
    impreso: function () { return { lineas: [] }; },
    clave: function (q) { return controles(q).metas.join(' · '); } });
  T('TABLA', { nombre: 'Tabla para completar', papel: 'SI', alias: ['tabla', 'cuadro'], ia: true,
    ayuda: 'Una fila por línea, columnas separadas por |; la primera fila son los títulos. Las celdas que llena el estudiante van entre [[ ]] (varias válidas: [[500|quinientos]]). Los números se comparan como número («1,500.00» = 1500); «Tolerancia: 0.01» opcional.', ejemplo: 'Cuenta | Debe | Haber\nCaja | [[5000]] |\nCapital | | [[5000]]',
    formato: ['Tabla: primera línea «Tipo: tabla», el enunciado y debajo las filas con columnas separadas por | (la primera = títulos); las celdas a llenar entre [[ ]].', 'Tipo: tabla\nCompleta el asiento de apertura con RD$ 5000 en efectivo.\nCuenta | Debe | Haber\nCaja | [[5000]] |\nCapital | | [[5000]]'],
    validar: function (q) { var t = tabla(q); return t.length < 2 ? 'escribe títulos y filas separadas por |' : !lineas(q).some(function (l) { return /\[\[.+?\]\]/.test(l); }) ? 'pon entre [[ ]] las celdas a llenar' : null; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [], h = 0;
      return '<div class="tx-scroll"><table class="tx-tab">' + q.x.filas.map(function (f, k) { return '<tr>' + f.map(function (c) { var tag = k ? 'td' : 'th';
        if (c !== null) return '<' + tag + '>' + esc(c) + '</' + tag + '>'; var j = h++; return '<' + tag + '><input class="tx-cel" data-i="' + i + '" data-h="' + j + '" autocomplete="off" spellcheck="false" value="' + esc(a[j] || '') + '" aria-label="Celda ' + (j + 1) + '"></' + tag + '>'; }).join('') + '</tr>'; }).join('') + '</table></div>'; },
    impreso: function (q) { return { lineas: ['Completa la tabla:'], tabla: tabla(q).map(function (f) { return f.map(function (c) { return /^\[\[.+\]\]$/.test(c) ? '__________' : c; }); }) }; },
    clave: function (q) { var h = []; tabla(q).forEach(function (f) { f.forEach(function (c) { var m = c.match(/^\[\[(.+)\]\]$/); if (m) h.push(m[1].split('|')[0].trim()); }); }); return h.join(' · '); } });
  T('CODIGO', { nombre: 'Programación (JavaScript)', papel: 'ADAPTADO', manual: true, alias: ['codigo', 'código', 'programa', 'programacion', 'programación', 'javascript', 'funcion js'],
    ayuda: '«Firma: suma(a, b)» y pruebas «Prueba: suma(2, 3) => 5» (el estudiante las ve y puede probar su código en su navegador) o «Oculta: suma(-1, 1) => 0» (no las ve). La nota la pones tú en «Por corregir»: verás el código y cuántas pruebas pasó.', ejemplo: 'Firma: doble(n)\nPrueba: doble(2) => 4\nOculta: doble(-3) => -6',
    formato: ['Programación: primera línea «Tipo: código», el enunciado, «Firma: nombre(parámetros)» y 2 a 4 líneas «Prueba: llamada => resultado» (JavaScript).', 'Tipo: código\nEscribe la función doble(n) que devuelva el doble de n.\nFirma: doble(n)\nPrueba: doble(2) => 4\nPrueba: doble(0) => 0'],
    validar: function (q) { var c = codigo(q); return c.vis.length || c.oc.length ? (c.vis.concat(c.oc).some(function (x) { return !x || !x[0] || !x[1]; }) ? 'cada prueba: «llamada => resultado»' : null) : 'escribe al menos una «Prueba: f(1) => 2»'; },
    html: function (q, i, r) { var v = r && typeof r === 'object' ? r : {}, f = q.x.firma, ini = v.c || (f ? 'function ' + f + ' {\n  \n}\n' : '');
      return '<p class="ayuda-tipo">' + ico('editar') + 'Escribe tu código en JavaScript. «Probar» lo ejecuta en tu equipo con las pruebas de ejemplo' + (q.x.ocultas ? ' (hay ' + q.x.ocultas + ' prueba' + (q.x.ocultas > 1 ? 's' : '') + ' más que no ves)' : '') + '. La nota la pone tu profesor.</p>' +
        (q.x.pruebas.length ? '<div class="tx-pruebas">' + q.x.pruebas.map(function (p) { return '<code>' + esc(p[0]) + ' → ' + esc(p[1]) + '</code>'; }).join('') + '</div>' : '') +
        '<textarea class="entrada tx-code" data-i="' + i + '" spellcheck="false" autocapitalize="off" autocomplete="off" maxlength="5000">' + esc(ini) + '</textarea>' +
        '<button type="button" class="btn claro mini tx-probar" data-i="' + i + '">' + ico('check') + ' Probar</button> <span class="tx-res pequeno">' + (v.pre ? 'Última prueba: ' + esc(v.pre) : '') + '</span>'; },
    impreso: function (q) { var c = codigo(q); return { lineas: (c.firma ? ['Función: ' + c.firma] : []).concat(c.vis.filter(Boolean).map(function (p) { return 'Ejemplo: ' + p[0] + ' → ' + p[1]; })).concat(['Escribe tu código:', '', '', '', '', '', '', '', '']) }; },
    clave: function (q) { var c = codigo(q); return c.vis.concat(c.oc).filter(Boolean).map(function (p) { return p[0] + ' => ' + p[1]; }).join('\n'); } });
  T('ESCENARIO', { nombre: 'Escenario con decisiones', papel: 'NO', alias: ['escenario', 'ramific', 'decisiones', 'caso con decisiones'],
    ayuda: 'Cada paso empieza con «[id] texto». Debajo sus opciones «- opción => id del siguiente paso (puntos)». Un paso sin opciones es un final. El primero es el inicio. Nota = puntos del camino ÷ mejor camino. Sin líneas en blanco.', ejemplo: '[inicio] El paciente llega con fiebre. ¿Qué haces?\n- Tomo los signos vitales => signos (2)\n- Lo mando a casa => fin_mal (0)\n[signos] Tiene 39 °C. ¿Ahora?\n- Pido hemograma => fin_bien (2)\n[fin_bien] Bien hecho.\n[fin_mal] Se complicó.',
    validar: function (q) { var e = escena(q); if (!e.orden.length || !e.nodos[e.orden[0]].op.length) return 'empieza con «[inicio] texto» y sus opciones «- opción => paso (puntos)»';
      var malo = null; e.orden.forEach(function (id) { e.nodos[id].d.forEach(function (d) { if (!e.nodos[d]) malo = d; }); }); return malo ? 'no existe el paso [' + malo + ']' : null; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [], k = 0, h = '', n;
      a.forEach(function (j) { n = q.x.nodos[k]; if (!n) return; h += '<div class="tx-paso hecho"><p>' + esc(n.t) + '</p><b>' + ico('check') + ' ' + esc(n.op[j]) + '</b></div>'; k = n.d[j]; });
      n = q.x.nodos[k];
      return '<p class="ayuda-tipo">' + ico('flecha') + 'Lee cada situación y decide. No se puede volver atrás.</p>' + h + (n ? '<div class="tx-paso"><p>' + esc(n.t) + '</p>' + (n.op.length ? n.op.map(function (o, j) { return '<button type="button" class="btn claro tx-esc" data-i="' + i + '" data-j="' + j + '">' + esc(o) + '</button>'; }).join('') : '<b>Fin del escenario.</b>') + '</div>' : ''); },
    impreso: function () { return { lineas: [] }; },
    clave: function (q) { var e = escena(q); return e.orden.map(function (id) { var n = e.nodos[id]; return '[' + id + '] ' + n.op.map(function (o, j) { return o + ' → ' + n.d[j] + ' (' + n.p[j] + ')'; }).join(' · '); }).join('\n'); } });
  T('CONCORDANCIA', { nombre: 'Concordancia de guiones (SCT)', papel: 'SI', alias: ['concordancia', 'sct', 'guiones', 'razonamiento clinico', 'razonamiento clínico'], ia: true,
    ayuda: 'En la pregunta va el caso. Un ítem por línea: «Si piensas en… | y encuentras… | +1» (respuesta experta de −2 a +2) o el panel de expertos «0:2 +1:6 +2:2». A un punto de distancia vale la mitad; con panel, según cuántos expertos eligieron eso.', ejemplo: 'Si piensas en: neumonía | y la radiografía muestra consolidación | +2\nSi piensas en: asma | y no hay sibilancias | -1',
    formato: ['Concordancia: primera línea «Tipo: concordancia», el caso y debajo 3 a 5 ítems «Si piensas en: … | y encuentras: … | +1» (respuesta de -2 a +2).', 'Tipo: concordancia\nPaciente de 60 años con dolor torácico.\nSi piensas en: infarto | y el ECG muestra elevación del ST | +2\nSi piensas en: reflujo | y el dolor se irradia al brazo | -1\nSi piensas en: ansiedad | y la troponina sale alta | -2'],
    validar: function (q) { var s = sct(q); return !s.length || s.some(function (x) { return !x || !/^[-+−]?\d|:/.test(x.r); }) ? 'cada ítem: «hipótesis | dato | +1»' : null; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [], V = [-2, -1, 0, 1, 2];
      return '<p class="ayuda-tipo">' + ico('lista') + 'Con el dato nuevo, ¿la hipótesis se vuelve más o menos probable?</p><div class="tx-sct-l">' + q.x.esc.map(function (e, k) { return '<span><b>' + (V[k] > 0 ? '+' : '') + V[k] + '</b> ' + esc(e.replace(/\s*\([^)]*\)\s*$/, '')) + '</span>'; }).join('') + '</div>' +
        q.x.it.map(function (it, j) { return '<div class="tx-sct"><p><b>' + esc(it[0]) + '</b><br>' + esc(it[1]) + '</p><div class="tx-sct-b">' + V.map(function (v) { return '<button type="button" class="tx-sct-v' + (a[j] === v ? ' on' : '') + '" data-i="' + i + '" data-j="' + j + '" data-v="' + v + '">' + (v > 0 ? '+' : '') + v + '</button>'; }).join('') + '</div></div>'; }).join(''); },
    impreso: function (q) { return { lineas: ['Marca cómo cambia cada hipótesis con el dato nuevo (−2 mucho menos probable … +2 mucho más probable):'], tabla: [['Hipótesis', 'Dato nuevo', '−2', '−1', '0', '+1', '+2']].concat(sct(q).filter(Boolean).map(function (x) { return [x.h, x.d, CAJA, CAJA, CAJA, CAJA, CAJA]; })) }; },
    clave: function (q) { return sct(q).filter(Boolean).map(function (x) { return x.d + ' → ' + x.r; }).join('\n'); } });
  T('VIDEO_PAUSA', { nombre: 'Video con preguntas', papel: 'NO', alias: ['video con preguntas', 'video interactivo', 'video pausa', 'video'], propiaMedia: true,
    ayuda: 'Necesita un video de YouTube o un enlace directo .mp4 (abajo; Drive no deja pausar). Una pausa por línea: «@1:30 ¿Pregunta? | *Correcta | Otra | Otra». El video se detiene en ese segundo hasta que responda.', ejemplo: '@0:30 ¿Qué componente se mostró? | *La CPU | La RAM | El disco\n@1:10 ¿Para qué sirve? | *Procesar | Guardar',
    validar: function (q) { var p = paradas(q); return !/^video:/.test(q.media || '') || /drive\.google/.test(q.media) ? 'agrega un video de YouTube o .mp4' : !p.length || p.some(function (x) { return !x || x.op.length < 2 || x.op.filter(function (o) { return estrella(o) !== null; }).length !== 1; }) ? 'cada pausa: «@0:30 Pregunta | *Correcta | Otra»' : null; },
    html: function (q, i, r) { return '<div class="tx-vid" data-i="' + i + '"><div class="tx-vp"></div></div><div class="tx-vq" data-i="' + i + '">' + X.VIDEO_PAUSA.lista(q, i, r) + '</div>'; },
    lista: function (q, i, r) { var a = Array.isArray(r) ? r : [], ab = (X._vid[i] || {}).ab || {};
      return q.x.stops.map(function (s, j) { var dada = a[j] !== null && a[j] !== undefined, abierta = dada || ab[j];
        if (!abierta) return '<div class="tx-vs cerrada">' + ico('candado') + ' Pregunta ' + (j + 1) + ': se abre en el minuto ' + hms(s.t) + '</div>';
        return '<div class="tx-vs' + (dada ? '' : ' activa') + '"><p><b>' + hms(s.t) + '</b> · ' + esc(s.p) + '</p>' + s.op.map(function (o, k) { return '<button type="button" class="btn ' + (a[j] === k ? 'primario' : 'claro') + ' mini tx-vo" data-i="' + i + '" data-j="' + j + '" data-k="' + k + '">' + esc(o) + '</button>'; }).join(' ') + '</div>'; }).join(''); },
    impreso: function () { return { lineas: [] }; },
    clave: function (q) { return paradas(q).filter(Boolean).map(function (s) { var c = s.op.filter(function (o) { return estrella(o) !== null; })[0]; return hms(s.t) + ' ' + s.p + ' → ' + (c ? estrella(c) : '?'); }).join('\n'); } });
  T('ENSAYO', { nombre: 'Ensayo (respuesta larga)', papel: 'SI', manual: true, alias: ['ensayo', 'desarrollo', 'redaccion', 'redacción', 'respuesta larga'], ia: true,
    ayuda: 'Opcional: «Mínimo: 120» y «Máximo: 300» (palabras) y la rúbrica «Criterio: Ideas claras (4)», una por línea. Lo corriges tú en «Por corregir». Escribe una respuesta modelo en «Explicación».', ejemplo: 'Mínimo: 120\nMáximo: 300\nCriterio: Ideas claras (4)\nCriterio: Ortografía (2)',
    formato: ['Ensayo: primera línea «Tipo: ensayo», la consigna y debajo «Mínimo: 100», «Máximo: 250» y 2 a 4 líneas «Criterio: nombre (puntos)».', 'Tipo: ensayo\nExplica por qué es importante hacer copias de seguridad.\nMínimo: 60\nMáximo: 200\nCriterio: Idea principal clara (2)\nCriterio: Ejemplos (2)\nCriterio: Ortografía (1)'],
    validar: function (q) { var e = ensayo(q); return e.max && e.min > e.max ? 'el mínimo es mayor que el máximo' : null; },
    html: function (q, i, r) { var t = String(r || ''), n = t.split(/\s+/).filter(Boolean).length;
      return (q.x.rub.length ? '<p class="ayuda-tipo">' + ico('lista') + 'Se calificará: ' + esc(q.x.rub.map(function (x) { return x[0] + (x[1] ? ' (' + x[1] + ')' : ''); }).join(' · ')) + '</p>' : '') +
        '<textarea class="entrada tx-ens" data-i="' + i + '" maxlength="8000" spellcheck="true" style="min-height:200px" placeholder="Escribe tu respuesta">' + esc(t) + '</textarea><p class="pequeno suave tx-cuenta">' + X.ENSAYO.cuenta(q, n) + '</p>'; },
    cuenta: function (q, n) { var mn = q.x.min, mx = q.x.max, mal = (mn && n < mn) || (mx && n > mx); return '<span' + (mal ? ' style="color:var(--rojo)"' : '') + '>' + n + ' palabras</span>' + (mn || mx ? ' (' + (mn ? 'mínimo ' + mn : '') + (mn && mx ? ', ' : '') + (mx ? 'máximo ' + mx : '') + ')' : ''); },
    impreso: function (q) { var e = ensayo(q), n = Math.max(6, Math.min(20, Math.round((e.max || 150) / 12))), l = []; if (e.min || e.max) l.push('Escribe ' + (e.min ? 'al menos ' + e.min : '') + (e.min && e.max ? ' y ' : '') + (e.max ? 'como máximo ' + e.max : '') + ' palabras.');
      for (var k = 0; k < n; k++) l.push('_____________________________________________________________________________'); return { lineas: l }; },
    clave: function (q) { var e = ensayo(q); return (e.rub.length ? 'Rúbrica: ' + e.rub.join(' · ') : 'Lo corrige el docente') + (q.explicacion ? '\nModelo: ' + q.explicacion : ''); } });
  T('CRUCIGRAMA', { nombre: 'Crucigrama', papel: 'SI', alias: ['crucigrama'], ia: true, imgPapel: true,
    ayuda: 'Una palabra por línea: «PALABRA = pista» (de 2 a 20 palabras). Se arma solo. Las tildes no cuentan; la Ñ sí.', ejemplo: 'TECLADO = Sirve para escribir\nMONITOR = Muestra la imagen\nCPU = Procesa los datos (siglas)',
    formato: ['Crucigrama: primera línea «Tipo: crucigrama», el enunciado y debajo 5 a 10 líneas «PALABRA = pista» (una sola palabra cada una).', 'Tipo: crucigrama\nResuelve el crucigrama de la célula.\nNUCLEO = Guarda el ADN\nMEMBRANA = Rodea la célula\nCITOPLASMA = Medio interno donde están los organelos\nRIBOSOMA = Fabrica proteínas'],
    validar: function (q) { var p = crucPares(q); return p.length < 2 || p.some(function (x) { return !x || x[0].length < 2 || !x[1]; }) ? 'al menos 2 líneas «PALABRA = pista»' : null; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [], x = q.x, cel = {}, num = {};
      x.ent.forEach(function (e, j) { num[e.r + ',' + e.c] = e.n; for (var k = 0; k < e.len; k++) { var key = (e.r + (e.d === 'V' ? k : 0)) + ',' + (e.c + (e.d === 'H' ? k : 0)), ch = String(a[j] || '').charAt(k); cel[key] = cel[key] || ''; if (ch && ch !== '_') cel[key] = ch; } });
      var g = ''; for (var rr = 0; rr < x.h; rr++) for (var cc = 0; cc < x.w; cc++) { var key = rr + ',' + cc;
        g += cel[key] === undefined ? '<span class="tx-cv"></span>' : '<span class="tx-cc">' + (num[key] ? '<small>' + num[key] + '</small>' : '') + '<input maxlength="1" autocomplete="off" autocapitalize="characters" spellcheck="false" class="tx-cx" data-i="' + i + '" data-r="' + rr + '" data-c="' + cc + '" value="' + esc(cel[key]) + '" aria-label="Fila ' + (rr + 1) + ', columna ' + (cc + 1) + '"></span>'; }
      var pista = function (d) { return x.ent.filter(function (e) { return e.d === d; }).map(function (e) { return '<li><b>' + e.n + '.</b> ' + esc(e.p) + ' <span class="suave">(' + e.len + ')</span></li>'; }).join(''); };
      return '<div class="tx-cru" style="grid-template-columns:repeat(' + x.w + ',minmax(0,34px))">' + g + '</div><div class="tx-pistas"><div><b>Horizontales</b><ul>' + pista('H') + '</ul></div><div><b>Verticales</b><ul>' + pista('V') + '</ul></div></div>'; },
    impreso: function (q) { var c = cruci_(crucPares(q).filter(Boolean)), l = function (d) { return c.ent.filter(function (e) { return e.d === d; }).map(function (e) { return e.n + '. ' + e.p + ' (' + e.len + ')'; }); };
      return { lineas: ['Horizontales:'].concat(l('H')).concat(['Verticales:']).concat(l('V')) }; },
    clave: function (q) { return cruci_(crucPares(q).filter(Boolean)).ent.map(function (e) { return e.n + (e.d === 'H' ? ' horizontal: ' : ' vertical: ') + e.s; }).join('\n'); } });
  T('SOPA', { nombre: 'Sopa de letras', papel: 'SI', alias: ['sopa'], ia: true, imgPapel: true,
    ayuda: 'Una palabra por línea (de 2 a 20, sin espacios). Opcional: «Tamaño: 12» y «Direcciones: todas» (también al revés y en diagonal hacia arriba). Cada estudiante recibe una sopa distinta.', ejemplo: 'TECLADO\nMONITOR\nMOUSE\nCPU',
    formato: ['Sopa de letras: primera línea «Tipo: sopa de letras», el enunciado y debajo 6 a 10 palabras del tema, una por línea, sin espacios.', 'Tipo: sopa de letras\nEncuentra los planetas del sistema solar.\nMERCURIO\nVENUS\nTIERRA\nMARTE\nJUPITER\nSATURNO'],
    validar: function (q) { var s = sopaDe(q); return s.w.length < 2 ? 'escribe al menos 2 palabras' : s.w.some(function (x) { return x.length > 15; }) ? 'palabras de hasta 15 letras' : null; },
    html: function (q, i, r) { var a = Array.isArray(r) ? r : [], g = q.x.g, n = g.length, sel = X._sopaSel && X._sopaSel.i === i ? X._sopaSel : null, marca = {}, hall = [];
      a.forEach(function (s, k) { var w = X.SOPA.leer(g, s); hall.push(w); X.SOPA.celdas(s).forEach(function (c) { marca[c] = (marca[c] || []).concat(k % 6); }); });
      var h = ''; g.forEach(function (fila, rr) { Array.from(fila).forEach(function (ch, cc) { var k = rr + ',' + cc;
        h += '<button type="button" class="tx-sc' + (marca[k] ? ' f' + marca[k][0] : '') + (sel && sel.r === rr && sel.c === cc ? ' sel' : '') + '" data-i="' + i + '" data-r="' + rr + '" data-c="' + cc + '">' + esc(ch) + '</button>'; }); });
      return '<p class="ayuda-tipo">' + ico('ver') + 'Toca la primera letra de una palabra y luego la última.</p><div class="tx-sopa" style="grid-template-columns:repeat(' + n + ',minmax(0,32px))">' + h + '</div>' +
        '<div class="tx-pal">' + q.x.w.map(function (w) { var ok = hall.some(function (x) { return x === w || x === Array.from(w).reverse().join(''); }); return '<span class="' + (ok ? 'ok' : '') + '">' + esc(w) + '</span>'; }).join('') + '</div>' +
        (a.length ? '<button type="button" class="btn fantasma mini tx-sopa-x" data-i="' + i + '">' + ico('atras') + ' Deshacer la última</button>' : ''); },
    celdas: function (s) { var dr = Math.sign(s[2] - s[0]), dc = Math.sign(s[3] - s[1]), L = Math.max(Math.abs(s[2] - s[0]), Math.abs(s[3] - s[1])), o = []; for (var k = 0; k <= L; k++) o.push((s[0] + dr * k) + ',' + (s[1] + dc * k)); return o; },
    leer: function (g, s) { return X.SOPA.celdas(s).map(function (c) { var p = c.split(','); return Array.from(g[+p[0]] || '')[+p[1]] || ''; }).join(''); },
    impreso: function (q) { return { lineas: ['Palabras: ' + sopaDe(q).w.join(' · ')] }; },
    clave: function (q) { var s = sopaDe(q); return s.s ? s.w.map(function (w, k) { var p = s.s.pos[k]; return w + ': fila ' + (p[0] + 1) + ', col. ' + (p[1] + 1) + ' → fila ' + (p[2] + 1) + ', col. ' + (p[3] + 1); }).join('\n') : s.w.join(' · '); } });
  X._vid = {};

  /* ---------- Panel del docente: «Pegar preguntas», validación y editor ---------- */
  X._tipoDe = function (s) { s = norm(s); if (/pseudo/.test(s)) return null; var k = Object.keys(X).filter(function (c) { return X[c] && X[c].alias; }); for (var a = 0; a < k.length; a++) if (X[k[a]].alias.some(function (w) { return s.indexOf(norm(w)) >= 0; })) return k[a]; return null; };
  X._validar = function (q) { var d = X[q.tipo]; return d && d.validar ? d.validar(q) : null; };
  X._pegar = function (b, tipo, n) {
    var d = X[tipo], q = { tipo: tipo, enunciado: '', opciones: [], correcta: d.campos === 'correcta' ? '' : 'auto', puntos: 1, explicacion: '', tema: '' }, cont = [];
    b.split('\n').forEach(function (l) {
      var m;
      if (/^\s*tipo\s*[:=]/i.test(l)) return;
      if ((m = l.match(/^\s*explicaci[oó]n\s*[:=]\s*(.+)$/i))) { q.explicacion = m[1].trim(); return; }
      if ((m = l.match(/^\s*tema\s*[:=]\s*(.+)$/i))) { q.tema = m[1].trim(); return; }
      if ((m = l.match(/^\s*puntos\s*[:=]\s*([\d.,]+)\s*$/i))) { q.puntos = Number(m[1].replace(',', '.')) || 1; return; }
      if (d.campos === 'correcta' && (m = l.match(/^\s*(respuesta|r)\s*[:=]\s*(.+)$/i))) { q.correcta = m[2].trim(); return; }
      if (l.trim()) cont.push(d.limpiaLinea ? d.limpiaLinea(l.trim()) : l.trim());
    });
    if (d.campos === 'enunciado') q.enunciado = cont.join('\n').replace(/^\d+\s*[.)\-]\s*/, '');
    else { q.enunciado = (cont.shift() || '').replace(/^\d+\s*[.)\-]\s*/, ''); q.opciones = cont; }
    var e = !q.enunciado.trim() ? 'sin pregunta' : X._validar(q); if (e) q.error = '#' + (n + 1) + ' (' + e + ')';
    return q;
  };
  X._editor = function (x, i) {
    var d = X[x.tipo];
    return '<p class="pequeno suave" style="margin:6px 0">' + esc(d.ayuda) + (d.papel === 'NO' ? ' <b>No sale en la versión en papel.</b>' : d.papel === 'ADAPTADO' ? ' En papel sale adaptado.' : '') + '</p>' +
      (d.campos === 'correcta' ? '<label class="campo"><span>Respuesta</span><input class="entrada" data-f="correcta" data-i="' + i + '" value="' + esc(x.correcta === 'auto' ? '' : x.correcta) + '" placeholder="Ej.: 2*x + 6" style="font-family:ui-monospace,Consolas,monospace"></label>' : '') +
      (d.campos !== 'enunciado' ? '<textarea class="entrada" data-f="lineas" data-i="' + i + '" style="min-height:120px;font-family:ui-monospace,Consolas,monospace;font-size:13.5px" placeholder="' + esc(d.ejemplo || '') + '">' + esc((x.opciones || []).join('\n')) + '</textarea>' : '') +
      (d.imagen ? '<button type="button" class="btn claro mini" data-txpick="' + i + '" style="margin-top:6px">' + ico('ver') + ' Marcar en la imagen</button>' : '');
  };

  /* ---------- Papel y Word: aviso de las que no se pueden imprimir e imágenes dibujadas ---------- */
  X._papel = function (preguntas) {
    var no = preguntas.filter(function (q) { return X[q.tipo] && X[q.tipo].papel === 'NO'; });
    return (no.length ? confirmar(no) : Promise.resolve(true)).then(function (sigue) {
      if (!sigue) return null;
      var l = preguntas.filter(function (q) { return !(X[q.tipo] && X[q.tipo].papel === 'NO'); }).map(function (q) { return Object.assign({}, q); });
      if (!l.length) { aviso('No queda ninguna pregunta que se pueda imprimir.', 'error'); return null; }
      return Promise.all(l.map(function (q) { return X[q.tipo] && X[q.tipo].imgPapel ? X._imagen(q).then(function (d) { q._pimg = d; }, function () {}) : null; })).then(function () { return l; });
    });
  };
  function confirmar(no) {
    return new Promise(function (ok) {
      var dl = document.createElement('dialog');
      dl.style.cssText = 'border:0;border-radius:18px;padding:22px;max-width:460px;width:calc(100% - 32px);background:var(--sup-solida,#fff);color:var(--texto,#16132A);box-shadow:0 20px 50px rgba(0,0,0,.3)';
      dl.innerHTML = '<h3 style="margin:0 0 8px">Preguntas que no van en papel</h3><p style="margin:0 0 8px">Este examen tiene <b>' + no.length + '</b> pregunta' + (no.length > 1 ? 's' : '') + ' interactiva' + (no.length > 1 ? 's' : '') + ' que no se puede' + (no.length > 1 ? 'n' : '') + ' hacer en papel:</p><ul style="margin:0 0 8px;padding-left:20px;max-height:180px;overflow:auto">' +
        no.map(function (q) { return '<li>' + esc(X[q.tipo].nombre) + ': ' + esc(String(q.enunciado).slice(0, 70)) + '</li>'; }).join('') + '</ul><p style="margin:0">Se quitarán de la versión impresa.</p>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px"><button class="btn claro" type="button" data-no>Cancelar</button><button class="btn primario" type="button" data-si>Continuar</button></div>';
      document.body.appendChild(dl);
      function fin(v) { try { dl.close(); } catch (e) {} dl.remove(); ok(v); }
      dl.querySelector('[data-no]').onclick = function () { fin(false); }; dl.querySelector('[data-si]').onclick = function () { fin(true); };
      dl.addEventListener('cancel', function (e) { e.preventDefault(); fin(false); });
      if (dl.showModal) dl.showModal(); else dl.setAttribute('open', '');
    });
  }
  function lienzo(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.textAlign = 'center'; g.textBaseline = 'middle'; return { c: c, g: g }; }
  function cargarImg(src) { return new Promise(function (ok, mal) { var im = new Image(); im.crossOrigin = 'anonymous'; im.onload = function () { ok(im); }; im.onerror = mal; im.src = src; }); }
  /** Imagen para papel/Word (PNG en data:): plano, crucigrama, sopa o la imagen de la pregunta con sus números. */
  X._imagen = function (q) {
    var t = q.tipo, L, g, k;
    if (t === 'GRAFICAR') { var p = plano(q), e = p.ejes, S = 520, M = 30, sx = function (x) { return M + (x - e[0]) / (e[1] - e[0]) * S; }, sy = function (y) { return M + S - (y - e[2]) / (e[3] - e[2]) * S; }, ps = p.paso;
      while ((e[1] - e[0]) / ps > 40) ps *= 2; L = lienzo(S + 2 * M, S + 2 * M); g = L.g; g.strokeStyle = '#c8c8d4'; g.lineWidth = 1;
      for (k = Math.ceil(e[0] / ps) * ps; k <= e[1] + 1e-9; k += ps) { g.beginPath(); g.moveTo(sx(k), M); g.lineTo(sx(k), M + S); g.stroke(); }
      for (k = Math.ceil(e[2] / ps) * ps; k <= e[3] + 1e-9; k += ps) { g.beginPath(); g.moveTo(M, sy(k)); g.lineTo(M + S, sy(k)); g.stroke(); }
      g.strokeStyle = '#222'; g.lineWidth = 2; if (e[0] <= 0 && e[1] >= 0) { g.beginPath(); g.moveTo(sx(0), M); g.lineTo(sx(0), M + S); g.stroke(); } if (e[2] <= 0 && e[3] >= 0) { g.beginPath(); g.moveTo(M, sy(0)); g.lineTo(M + S, sy(0)); g.stroke(); }
      g.fillStyle = '#333'; g.font = '13px Arial'; var pe = Math.max(ps, Math.ceil((e[1] - e[0]) / 10));
      for (k = Math.ceil(e[0] / pe) * pe; k <= e[1]; k += pe) if (k) g.fillText(String(Math.round(k * 100) / 100), sx(k), Math.min(M + S - 6, Math.max(M + 8, sy(0) + 12)));
      for (k = Math.ceil(e[2] / pe) * pe; k <= e[3]; k += pe) if (k) g.fillText(String(Math.round(k * 100) / 100), Math.min(M + S - 10, Math.max(M + 10, sx(0) - 14)), sy(k));
      return Promise.resolve(L.c.toDataURL('image/png')); }
    if (t === 'CRUCIGRAMA') { var c = cruci_(crucPares(q).filter(Boolean)), Z = 34; L = lienzo(c.w * Z + 4, c.h * Z + 4); g = L.g; g.strokeStyle = '#222'; g.lineWidth = 1.5; g.font = 'bold 10px Arial'; g.fillStyle = '#222';
      var hecho = {}; c.ent.forEach(function (en) { for (var j = 0; j < en.len; j++) { var r = en.r + (en.d === 'V' ? j : 0), cc = en.c + (en.d === 'H' ? j : 0); if (hecho[r + ',' + cc]) continue; hecho[r + ',' + cc] = 1; g.strokeRect(2 + cc * Z, 2 + r * Z, Z, Z); } g.fillText(String(en.n), 2 + en.c * Z + 7, 2 + en.r * Z + 8); });
      return Promise.resolve(L.c.toDataURL('image/png')); }
    if (t === 'SOPA') { var s = sopaDe(q).s; if (!s) return Promise.reject(new Error('sopa')); var n = s.g.length, Y = 30; L = lienzo(n * Y + 4, n * Y + 4); g = L.g; g.font = 'bold 17px Arial'; g.fillStyle = '#111'; g.strokeStyle = '#ddd';
      s.g.forEach(function (f, r) { Array.from(f).forEach(function (ch, cc) { g.strokeRect(2 + cc * Y, 2 + r * Y, Y, Y); g.fillText(ch, 2 + cc * Y + Y / 2, 2 + r * Y + Y / 2 + 1); }); });
      return Promise.resolve(L.c.toDataURL('image/png')); }
    if (!/^imagen:/.test(q.media || '')) return Promise.reject(new Error('sin imagen'));
    return cargarImg(srcImg(q.media)).then(function (im) {
      var w = im.naturalWidth || 800, h = im.naturalHeight || 600, f = Math.min(1, 1000 / w); L = lienzo(Math.round(w * f), Math.round(h * f)); g = L.g; g.drawImage(im, 0, 0, L.c.width, L.c.height);
      if (t === 'ETIQUETAR') etiquetas(q).pts.filter(function (x) { return x && !x.rel; }).forEach(function (p, j) { var x = p.x / 100 * L.c.width, y = p.y / 100 * L.c.height, R = Math.max(12, L.c.width / 45);
        g.fillStyle = '#4F46E5'; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold ' + Math.round(R * 1.2) + 'px Arial'; g.fillText(String(j + 1), x, y + 1); });
      return L.c.toDataURL('image/png');
    });
  };

  /* ---------- Página del estudiante: eventos ---------- */
  function cuerpo(i) { var q = preg(i), el = D && D.querySelector('.tx[data-i="' + i + '"]'); if (q && el && X[q.tipo]) el.innerHTML = X[q.tipo].html(q, i, resp(i)); }
  X._cuerpo = function (q, i, r) { return '<div class="tx" data-i="' + i + '" data-tx="' + q.tipo + '">' + X[q.tipo].html(q, i, r) + '</div>'; };
  function set(i, v, repintar) { if (!activo()) return; poner(i, v); if (repintar) cuerpo(i); }
  if (D) {
    D.addEventListener('change', function (e) {
      var t = e.target, i = Number(t.dataset && t.dataset.i); if (!activo() || !t.dataset || t.dataset.i === undefined) return;
      if (t.classList.contains('tx-des')) { var a = [].map.call(D.querySelectorAll('.tx-des[data-i="' + i + '"]'), function (s) { return s.value; }); set(i, a.some(Boolean) ? a : null); }
      if (t.classList.contains('tx-mul')) { var m = [].filter.call(D.querySelectorAll('.tx-mul[data-i="' + i + '"]'), function (c) { return c.checked; }).map(function (c) { return Number(c.dataset.j); }); set(i, m.length ? m : null, true); }
      if (t.classList.contains('tx-mat-r')) { var q = preg(i), r = (resp(i) || q.opciones.map(function () { return null; })).slice(); r[Number(t.dataset.j)] = Number(t.value); set(i, r); }
      if (t.classList.contains('tx-et-s')) { var qq = preg(i), re = (resp(i) || qq.x.pts.map(function () { return null; })).slice(); re[Number(t.dataset.k)] = t.value === '' ? null : Number(t.value); set(i, re.some(function (x) { return x !== null; }) ? re : null, true); }
    });
    D.addEventListener('input', function (e) {
      var t = e.target; if (!t.dataset || t.dataset.i === undefined || !activo()) return; var i = Number(t.dataset.i), q = preg(i); if (!q) return;
      if (t.classList.contains('tx-expr')) set(i, t.value.trim() || null);
      if (t.classList.contains('tx-ens')) { set(i, t.value.trim() ? t.value : null); var c = t.parentNode.querySelector('.tx-cuenta'); if (c) c.innerHTML = X.ENSAYO.cuenta(q, t.value.split(/\s+/).filter(Boolean).length); }
      if (t.classList.contains('tx-code')) { set(i, t.value.trim() ? { c: t.value, pre: '' } : null); }
      if (t.classList.contains('tx-cel')) { var h = [].map.call(D.querySelectorAll('.tx-cel[data-i="' + i + '"]'), function (x) { return x.value.trim(); }); set(i, h.some(Boolean) ? h : null); }
      if (t.classList.contains('tx-rng')) { var v = [].map.call(D.querySelectorAll('.tx-rng[data-i="' + i + '"]'), function (x) { return Number(x.value); }); t.parentNode.querySelector('.tx-sv').textContent = t.value; set(i, v); }
      if (t.classList.contains('tx-cor')) { var a = (resp(i) || []).filter(function (p) { return p[0] !== Number(t.dataset.k); }); if (t.value.trim()) a.push([Number(t.dataset.k), t.value.trim()]); set(i, a.length ? a : null); }
      if (t.classList.contains('tx-cx')) { t.value = pal(t.value).slice(-1); leerCruci(i); if (t.value) mover(t, 1); }
    });
    D.addEventListener('focusout', function (e) { var t = e.target; if (t.classList && t.classList.contains('tx-cor') && !t.value.trim()) setTimeout(function () { cuerpo(Number(t.dataset.i)); }, 0); });
    D.addEventListener('keydown', function (e) {
      var t = e.target;
      if (t.classList && t.classList.contains('tx-code') && e.key === 'Tab') { e.preventDefault(); var p = t.selectionStart; t.value = t.value.slice(0, p) + '  ' + t.value.slice(t.selectionEnd); t.selectionStart = t.selectionEnd = p + 2; t.dispatchEvent(new Event('input', { bubbles: true })); }
      if (t.classList && t.classList.contains('tx-cx')) {
        if (e.key === 'Backspace' && !t.value) { e.preventDefault(); mover(t, -1, true); }
        var fl = { ArrowRight: [0, 1], ArrowLeft: [0, -1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[e.key]; if (fl) { e.preventDefault(); X._dir = fl[0] ? 'V' : 'H'; mover(t, fl[0] + fl[1]); }
      }
    });
    D.addEventListener('click', function (e) {
      var t = e.target.closest ? e.target.closest('.tx-tok,.tx-img,.tx-mk,.tx-pt,.tx-et,.tx-plano,.tx-probar,.tx-esc,.tx-sct-v,.tx-vo,.tx-sc,.tx-sopa-x,.tx-cx,[data-txpick]') : null; if (!t) return;
      if (t.dataset.txpick !== undefined) { elegirEnImagen(t); return; }
      var di = t.closest('[data-i]'), i = di ? Number(di.dataset.i) : NaN, q = preg(i); if (!q || !activo()) return;
      var r = resp(i), a = Array.isArray(r) ? r.slice() : [];
      if (t.classList.contains('tx-tok')) { var k = Number(t.dataset.k);
        if (t.dataset.cor) { a.push([k, '']);
          var el = D.querySelector('.tx[data-i="' + i + '"]'); el.innerHTML = X.CORREGIR.html(q, i, a); var inp = el.querySelector('.tx-cor[data-k="' + k + '"]'); if (inp) inp.focus(); return; }
        var j = a.indexOf(k); if (j >= 0) a.splice(j, 1); else a.push(k); set(i, a.length ? a : null, true); return; }
      if (t.classList.contains('tx-mk')) { e.stopPropagation(); a.splice(Number(t.dataset.k), 1); set(i, a.length ? a : null, true); return; }
      if (t.classList.contains('tx-img') && t.dataset.hot) { var im = t.querySelector('img').getBoundingClientRect(); if (!im.width) return;
        if (a.length >= q.x.n) { aviso('Ya pusiste ' + q.x.n + ' marca' + (q.x.n > 1 ? 's' : '') + '. Toca una para quitarla.'); return; }
        a.push([Math.round((e.clientX - im.left) / im.width * 1000) / 10, Math.round((e.clientY - im.top) / im.height * 1000) / 10]); set(i, a, true); return; }
      if (t.classList.contains('tx-et')) { var jj = Number(t.dataset.j); X._etSel = X._etSel && X._etSel.i === i && X._etSel.j === jj ? null : { i: i, j: jj }; cuerpo(i); return; }
      if (t.classList.contains('tx-pt')) { if (!X._etSel || X._etSel.i !== i) { aviso('Primero toca una etiqueta de arriba.'); return; } etiquetar(i, Number(t.dataset.k), X._etSel.j); return; }
      if (t.classList.contains('tx-plano')) { var pt = t.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; var m = t.getScreenCTM(); if (!m) return; var s = pt.matrixTransform(m.inverse()), E = q.x.ejes, P = q.x.paso;
        var x = Math.round((E[0] + s.x / 300 * (E[1] - E[0])) / P) * P, y = Math.round((E[2] + (300 - s.y) / 300 * (E[3] - E[2])) / P) * P; x = Math.round(x * 1000) / 1000; y = Math.round(y * 1000) / 1000;
        if (x < E[0] || x > E[1] || y < E[2] || y > E[3]) return;
        var ya = a.findIndex(function (p) { return p[0] === x && p[1] === y; }); if (ya >= 0) a.splice(ya, 1); else if (a.length >= q.x.n) { aviso('Ya ubicaste ' + q.x.n + ' puntos. Toca uno para quitarlo.'); return; } else a.push([x, y]);
        set(i, a.length ? a : null, true); return; }
      if (t.classList.contains('tx-probar')) { probar(t, i, q); return; }
      if (t.classList.contains('tx-esc')) { a.push(Number(t.dataset.j)); set(i, a, true); return; }
      if (t.classList.contains('tx-sct-v')) { var sv = q.x.it.map(function (_, j2) { return a[j2] === undefined ? null : a[j2]; }), j3 = Number(t.dataset.j), v = Number(t.dataset.v); sv[j3] = sv[j3] === v ? null : v; set(i, sv.some(function (z) { return z !== null; }) ? sv : null, true); return; }
      if (t.classList.contains('tx-vo')) { var vs = q.x.stops.map(function (_, j2) { return a[j2] === undefined ? null : a[j2]; }); vs[Number(t.dataset.j)] = Number(t.dataset.k); set(i, vs); repVideo(i); seguir(i); return; }
      if (t.classList.contains('tx-sc')) { var rr = Number(t.dataset.r), cc = Number(t.dataset.c), sl = X._sopaSel;
        if (!sl || sl.i !== i) { X._sopaSel = { i: i, r: rr, c: cc }; cuerpo(i); return; }
        X._sopaSel = null; var sg = [sl.r, sl.c, rr, cc], dr = Math.abs(rr - sl.r), dc = Math.abs(cc - sl.c);
        if ((dr && dc && dr !== dc) || (!dr && !dc)) { cuerpo(i); return; }
        var w = X.SOPA.leer(q.x.g, sg), rev = Array.from(w).reverse().join('');
        if (q.x.w.indexOf(w) < 0 && q.x.w.indexOf(rev) < 0) { aviso('Esa no es una palabra de la lista.'); cuerpo(i); return; }
        a.push(sg); set(i, a, true); return; }
      if (t.classList.contains('tx-sopa-x')) { a.pop(); set(i, a.length ? a : null, true); return; }
      if (t.classList.contains('tx-cx')) { var cel = Number(t.dataset.r) + ',' + Number(t.dataset.c), en = q.x.ent.filter(function (z) { return X.SOPA.celdas([z.r, z.c, z.r + (z.d === 'V' ? z.len - 1 : 0), z.c + (z.d === 'H' ? z.len - 1 : 0)]).indexOf(cel) >= 0; }).map(function (z) { return z.d; });
        if (en.length === 1) X._dir = en[0]; else if (X._ultCx === cel) X._dir = X._dir === 'H' ? 'V' : 'H'; X._ultCx = cel; }
    });
    /* Arrastrar etiquetas con el mouse (en el celular: tocar la etiqueta y luego el número) */
    D.addEventListener('dragstart', function (e) { var t = e.target.closest && e.target.closest('.tx-et'); if (!t) return; e.dataTransfer.setData('text/plain', t.dataset.i + ':' + t.dataset.j); });
    D.addEventListener('dragover', function (e) { if (e.target.closest && e.target.closest('.tx-pt')) e.preventDefault(); });
    D.addEventListener('drop', function (e) { var t = e.target.closest && e.target.closest('.tx-pt'); if (!t) return; e.preventDefault(); var p = String(e.dataTransfer.getData('text/plain')).split(':'); if (p[0] === t.dataset.i) etiquetar(Number(p[0]), Number(t.dataset.k), Number(p[1])); });
  }
  function etiquetar(i, k, j) { var q = preg(i), a = (resp(i) || q.x.pts.map(function () { return null; })).slice(); a[k] = j; X._etSel = null; set(i, a, true); }
  function leerCruci(i) { var q = preg(i), v = q.x.ent.map(function (z) { var s = ''; for (var k = 0; k < z.len; k++) { var el = D.querySelector('.tx-cx[data-i="' + i + '"][data-r="' + (z.r + (z.d === 'V' ? k : 0)) + '"][data-c="' + (z.c + (z.d === 'H' ? k : 0)) + '"]'); s += el && el.value ? el.value : '_'; } return s; });
    set(i, v.some(function (s) { return /[^_]/.test(s); }) ? v : null); }
  function mover(t, paso, borrar) { var d = X._dir === 'V' ? [1, 0] : [0, 1], r = Number(t.dataset.r) + d[0] * paso, c = Number(t.dataset.c) + d[1] * paso, n = D.querySelector('.tx-cx[data-i="' + t.dataset.i + '"][data-r="' + r + '"][data-c="' + c + '"]');
    if (n) { n.focus(); if (borrar) { n.value = ''; leerCruci(Number(t.dataset.i)); } } }
  /* Programación: el código corre en un Worker aparte, con 2 s de límite. Solo orienta: la nota la pone el docente. */
  function probar(btn, i, q) {
    var r = resp(i) || {}, code = String(r.c || (D.querySelector('.tx-code[data-i="' + i + '"]') || {}).value || ''), out = btn.parentNode.querySelector('.tx-res'), pr = q.x.pruebas;
    if (!pr.length) { out.textContent = 'No hay pruebas de ejemplo.'; return; }
    var src = 'onmessage=function(){var R=[];\n' + pr.map(function (p) { return 'try{R.push([JSON.stringify(' + p[0] + '),JSON.stringify(' + p[1] + ')]);}catch(e){R.push(["Error: "+e.message,"x"]);}'; }).join('\n') + '\npostMessage(R);};\n';
    var u = URL.createObjectURL(new Blob([code + '\n;\n' + src], { type: 'text/javascript' })), w;
    try { w = new Worker(u); } catch (er) { out.textContent = 'Tu navegador no permite probar el código.'; return; }
    var tm = setTimeout(function () { w.terminate(); URL.revokeObjectURL(u); out.textContent = 'Tiempo agotado: ¿hay un ciclo infinito?'; }, 2000);
    w.onerror = function (ev) { clearTimeout(tm); w.terminate(); URL.revokeObjectURL(u); out.textContent = 'Error en tu código: ' + (ev.message || 'revisa la sintaxis'); ev.preventDefault && ev.preventDefault(); };
    w.onmessage = function (m) { clearTimeout(tm); w.terminate(); URL.revokeObjectURL(u); var ok = m.data.filter(function (x) { return x[0] === x[1]; }).length, pre = ok + '/' + pr.length;
      out.innerHTML = 'Pasó ' + pre + ': ' + m.data.map(function (x, k) { return (x[0] === x[1] ? '✔ ' : '✘ ') + esc(pr[k][0]) + (x[0] === x[1] ? '' : ' dio ' + esc(x[0])); }).join(' · ');
      if (code.trim()) set(i, { c: code, pre: pre }); };
    w.postMessage(1);
  }
  /* Video con pausas: YouTube (API IFrame) o .mp4; revisa el tiempo cada 0,4 s y se detiene en cada pregunta sin responder */
  var ytCola = [];
  function youtube(fn) { if (W.YT && W.YT.Player) return fn(); ytCola.push(fn); if (ytCola.length > 1) return;
    var prev = W.onYouTubeIframeAPIReady; W.onYouTubeIframeAPIReady = function () { if (prev) prev(); ytCola.splice(0).forEach(function (f) { f(); }); };
    var s = D.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; D.head.appendChild(s); }
  function repVideo(i) { var q = preg(i), el = D.querySelector('.tx-vq[data-i="' + i + '"]'); if (q && el) el.innerHTML = X.VIDEO_PAUSA.lista(q, i, resp(i)); }
  function seguir(i) { var v = X._vid[i]; if (!v || !v.pl) return; var r = resp(i) || [], q = preg(i); if (q.x.stops.every(function (s, j) { return !v.ab[j] || (r[j] !== null && r[j] !== undefined); })) v.pl.play(); }
  X._listo = function (raiz) {
    if (!D) return;
    (raiz || D).querySelectorAll('.tx-vid').forEach(function (box) {
      var i = Number(box.dataset.i), q = preg(i), m = String(q.media || ''), url = m.slice(m.indexOf(':') + 1), yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/), v = X._vid[i] = { ab: {} };
      (resp(i) || []).forEach(function (x, j) { if (x !== null && x !== undefined) v.ab[j] = true; });
      function vigilar(tiempo, pausar) { var iv = setInterval(function () { if (!D.body.contains(box)) { clearInterval(iv); return; } var t = tiempo(), r = resp(i) || [];
        q.x.stops.forEach(function (s, j) { if (t >= s.t && !v.ab[j]) { v.ab[j] = true; if (r[j] === null || r[j] === undefined) { pausar(); repVideo(i); var a = D.querySelector('.tx-vq[data-i="' + i + '"] .activa'); if (a) a.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } else repVideo(i); } }); }, 400); }
      if (yt) {
        var falla = setTimeout(function () { q.x.stops.forEach(function (s, j) { v.ab[j] = true; }); repVideo(i); }, 9000);
        youtube(function () { var p = new W.YT.Player(box.querySelector('.tx-vp'), { videoId: yt[1], host: 'https://www.youtube-nocookie.com', playerVars: { rel: 0, playsinline: 1, modestbranding: 1 },
          events: { onReady: function () { clearTimeout(falla); v.pl = { play: function () { p.playVideo(); } }; vigilar(function () { return p.getCurrentTime ? p.getCurrentTime() : 0; }, function () { p.pauseVideo(); }); } } }); });
      } else {
        box.querySelector('.tx-vp').innerHTML = '<video controls preload="metadata" playsinline controlslist="nodownload nofullscreen" disablepictureinpicture src="' + esc(url) + '"></video>';
        var vid = box.querySelector('video'); v.pl = { play: function () { var pr = vid.play(); if (pr && pr.catch) pr.catch(function () {}); } };
        vigilar(function () { return vid.currentTime || 0; }, function () { vid.pause(); });
      }
    });
  };
  /* Panel: marcar zonas o etiquetas tocando la imagen de la pregunta */
  function elegirEnImagen(btn) {
    var card = btn.closest('.preg-ed'), img = card && card.querySelector('.media img'), ta = card && card.querySelector('[data-f="lineas"]'), sel = card && card.querySelector('[data-tipo]'), tipo = sel ? sel.value : 'HOTSPOT';
    if (!img || !ta) { aviso('Primero agrega la imagen de la pregunta (abajo, en «Imagen, video o audio»).', 'error'); return; }
    var ov = D.createElement('div'); ov.className = 'tx-pick';
    function dibujar() { var q = { opciones: ta.value.split('\n') }, h = '';
      if (tipo === 'HOTSPOT') zonas(q).forEach(function (z) { if (z) h += '<span class="' + (z.c ? 'zc' : 'zr') + '" style="left:' + (z.c ? z.x - z.a : z.x) + '%;top:' + (z.c ? z.y - z.b : z.y) + '%;width:' + (z.c ? 2 * z.a : z.a) + '%;height:' + (z.c ? 2 * z.b : z.b) + '%"></span>'; });
      else etiquetas(q).pts.forEach(function (p) { if (p && !p.rel) h += '<span class="tx-pt on" style="left:' + p.x + '%;top:' + p.y + '%"><em>' + esc(p.et) + '</em></span>'; });
      ov.querySelector('.tx-pick-z').innerHTML = h; }
    ov.innerHTML = '<div class="tx-pick-c"><p><b>' + (tipo === 'HOTSPOT' ? 'Toca el centro de cada zona correcta (círculo de radio 6 %; puedes cambiar el número después).' : 'Toca cada punto y escribe su nombre.') + '</b></p><div class="tx-pick-i"><img src="' + esc(img.src) + '" alt=""><div class="tx-pick-z"></div></div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px"><button type="button" class="btn primario" data-listo>Listo</button></div></div>';
    D.body.appendChild(ov); dibujar();
    ov.querySelector('[data-listo]').onclick = function () { ov.remove(); };
    ov.querySelector('.tx-pick-i').onclick = function (e) { var b = this.querySelector('img').getBoundingClientRect(), x = Math.round((e.clientX - b.left) / b.width * 100), y = Math.round((e.clientY - b.top) / b.height * 100), l;
      if (tipo === 'HOTSPOT') l = 'c ' + x + ' ' + y + ' 6'; else { var n = W.prompt('Nombre de esta etiqueta'); if (!n || !n.trim()) return; l = n.trim().replace(/=/g, '-') + ' = ' + x + ' ' + y; }
      ta.value = (ta.value.trim() ? ta.value.replace(/\s+$/, '') + '\n' : '') + l; dibujar(); };
  }

  /* ---------- Estilos (usan las variables de es.css) ---------- */
  if (D) { var st = D.createElement('style'); st.textContent = [
    '.tx-scroll{overflow-x:auto;max-width:100%}.tx-mat,.tx-tab{border-collapse:collapse;min-width:100%;font-size:14.5px}.tx-mat th,.tx-mat td,.tx-tab th,.tx-tab td{border:1px solid var(--linea);padding:8px;text-align:center}',
    '.tx-mat td:first-child{text-align:left}.tx-mat input{width:22px;height:22px;accent-color:var(--acento);cursor:pointer}.tx-tab th{background:color-mix(in srgb,var(--acento) 10%,transparent)}.tx-cel{width:100%;min-width:70px;border:0;border-bottom:2px solid var(--acento);background:transparent;font:inherit;color:var(--texto);text-align:center;padding:4px}',
    '.tx-texto{line-height:2.3;font-size:16px}.tx-tok{border:0;background:transparent;color:var(--texto);font:inherit;padding:2px 4px;border-radius:6px;cursor:pointer}.tx-tok:hover{background:color-mix(in srgb,var(--acento) 10%,transparent)}.tx-tok.on{background:#FDE047;color:#111}',
    '.tx-fix{display:inline-flex;gap:4px;align-items:center}.tx-fix s{color:var(--rojo)}.tx-cor{border:0;border-bottom:2px solid var(--verde);background:color-mix(in srgb,var(--verde) 10%,transparent);font:inherit;color:var(--texto);padding:2px 6px;border-radius:6px 6px 0 0}',
    '.tx-img{position:relative;display:inline-block;max-width:100%;margin:6px 0;touch-action:manipulation;cursor:crosshair;user-select:none}.tx-img img{display:block;max-width:100%;max-height:70vh;border-radius:12px}',
    '.tx-mk{position:absolute;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:50%;background:var(--rojo);color:#fff;font-weight:700;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4);cursor:pointer}',
    '.tx-pt{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;cursor:pointer}.tx-pt b{width:28px;height:28px;border-radius:50%;background:var(--acento);color:#fff;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)}.tx-pt em{font-style:normal;font-size:12px;background:rgba(0,0,0,.75);color:#fff;padding:2px 6px;border-radius:6px;margin-top:2px;white-space:nowrap}.tx-pt.on b{background:var(--verde)}',
    '.tx-chips{display:flex;flex-wrap:wrap}.tx-et{display:inline-flex;padding:9px 13px;border-radius:999px;background:var(--sup-solida);border:1px solid var(--linea);margin:4px;cursor:grab;font:600 14.5px inherit;color:var(--texto);touch-action:manipulation}.tx-et.sel{border-color:var(--acento);box-shadow:0 0 0 2px var(--acento)}.tx-et.usada{opacity:.55}.tx-lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;margin-top:6px}.tx-lista label{display:flex;gap:6px;align-items:center}',
    '.tx-plano{width:100%;max-width:420px;display:block;touch-action:manipulation;cursor:crosshair;background:var(--sup-solida);border-radius:12px}.tx-plano .g{stroke:var(--linea);stroke-width:.6}.tx-plano .ej{stroke:var(--texto);stroke-width:1.4}.tx-plano text{font-size:9px;fill:var(--suave);text-anchor:middle}.tx-plano .pt{fill:var(--acento);stroke:#fff;stroke-width:2}.tx-plano .ln{fill:none;stroke:var(--acento);stroke-width:2}',
    '.tx-sl label{display:block;margin:10px 0}.tx-sl input{width:100%;margin:6px 0 0;box-sizing:border-box;accent-color:var(--acento)}.tx-pruebas{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.tx-pruebas code{background:var(--sup-solida);border:1px solid var(--linea);padding:3px 8px;border-radius:8px;font-size:13px}',
    '.tx-code{font-family:ui-monospace,Consolas,monospace;font-size:14px;min-height:180px;tab-size:2;white-space:pre}.tx-res{margin-left:6px}',
    '.tx-paso{border-left:4px solid var(--acento);padding:8px 12px;margin:8px 0;background:var(--sup-fuerte);border-radius:0 12px 12px 0}.tx-paso p{white-space:pre-line;margin:0 0 8px}.tx-paso.hecho{opacity:.75;border-color:var(--verde)}.tx-paso .btn{display:block;width:100%;text-align:left;margin:6px 0;white-space:normal}',
    '.tx-sct-l{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:12.5px;color:var(--suave);margin-bottom:8px}.tx-sct{border:1px solid var(--linea);border-radius:12px;padding:10px;margin:8px 0}.tx-sct p{margin:0 0 8px}.tx-sct-b{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}',
    '.tx-sct-v{padding:10px 0;border-radius:10px;border:1px solid var(--linea);background:var(--sup-solida);color:var(--texto);font-weight:700;cursor:pointer}.tx-sct-v.on{background:var(--acento);color:var(--sobre-acento);border-color:var(--acento)}',
    '.tx-vid video,.tx-vid iframe{width:100%;aspect-ratio:16/9;border:0;border-radius:12px;background:#000}.tx-vs{border:1px solid var(--linea);border-radius:12px;padding:10px;margin:8px 0}.tx-vs.cerrada{color:var(--suave);font-size:14px}.tx-vs.activa{border:2px solid var(--amarillo);box-shadow:0 0 0 4px color-mix(in srgb,var(--amarillo) 25%,transparent)}.tx-vs p{margin:0 0 8px}',
    '.tx-cru,.tx-sopa{display:grid;gap:2px;max-width:100%;margin:8px 0}.tx-cv{aspect-ratio:1}.tx-cc{position:relative;aspect-ratio:1}.tx-cc small{position:absolute;left:2px;top:0;font-size:9px;color:var(--suave);pointer-events:none}',
    '.tx-cx{width:100%;height:100%;border:1.5px solid var(--texto);border-radius:4px;text-align:center;font:700 clamp(12px,3.6vw,18px) inherit;text-transform:uppercase;background:var(--sup-solida);color:var(--texto);padding:0}.tx-cx:focus{outline:3px solid var(--acento)}',
    '.tx-pistas{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;font-size:14px}.tx-pistas ul{margin:4px 0;padding-left:16px}',
    '.tx-sc{aspect-ratio:1;border:1px solid var(--linea);border-radius:5px;background:var(--sup-solida);color:var(--texto);font:700 clamp(11px,3.4vw,16px) inherit;padding:0;cursor:pointer}.tx-sc.sel{outline:3px solid var(--acento)}',
    '.tx-sc.f0{background:#FDE68A;color:#111}.tx-sc.f1{background:#A7F3D0;color:#111}.tx-sc.f2{background:#BFDBFE;color:#111}.tx-sc.f3{background:#FBCFE8;color:#111}.tx-sc.f4{background:#DDD6FE;color:#111}.tx-sc.f5{background:#FED7AA;color:#111}',
    '.tx-pal{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.tx-pal span{padding:4px 10px;border-radius:999px;border:1px solid var(--linea);font-weight:600;font-size:13.5px}.tx-pal span.ok{text-decoration:line-through;opacity:.6;background:color-mix(in srgb,var(--verde) 15%,transparent)}',
    '.tx-pick{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:9999;display:grid;place-items:center;padding:16px}.tx-pick-c{background:var(--sup-solida,#fff);color:var(--texto,#111);border-radius:16px;padding:16px;max-width:min(900px,100%);max-height:100%;overflow:auto}',
    '.tx-pick-i{position:relative;display:inline-block;cursor:crosshair}.tx-pick-i img{display:block;max-width:100%;max-height:70vh}.tx-pick-z{position:absolute;inset:0;pointer-events:none}.tx-pick-z .zc,.tx-pick-z .zr{position:absolute;border:3px solid #EF4444;background:rgba(239,68,68,.2)}.tx-pick-z .zc{border-radius:50%}',
    '.corr .txt div{white-space:pre-wrap}'
  ].join('\n'); (D.head || D.documentElement).appendChild(st); }
})(typeof window !== 'undefined' ? window : this);

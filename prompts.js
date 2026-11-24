/* Examen Seguro: Biblioteca de prompts (copiar a cualquier IA y pegar la respuesta) y «Tu propia clave de IA» en Mi cuenta.
   Usa window.ES_PUENTE de docente.html (A, modal, cerrar, copiar, yo, analizar, claveTexto, tipos, agregar, ex).
   El formato que se pide a la IA es EXACTAMENTE el que entiende «Pegar preguntas» (analizar en docente.html). */
(function () {
  'use strict';
  var P = function () { return window.ES_PUENTE; };
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Formato por tipo (ejemplos que el analizador de «Pegar preguntas» acepta tal cual) ---------- */
  var TIPOS = ['MC', 'VF', 'VFJ', 'CORTA', 'ORDENAR', 'ALGORITMO', 'FLUJO', 'RELACIONAR', 'CLASIFICAR', 'COMPLETAR', 'PALABRAS', 'NUMERICA'];
  var NOMBRES = { MC: 'Selección múltiple', VF: 'Verdadero o falso', VFJ: 'V/F justificada', CORTA: 'Respuesta corta', ORDENAR: 'Ordenar pasos', ALGORITMO: 'Algoritmo (pseudocódigo)',
    FLUJO: 'Diagrama de flujo', RELACIONAR: 'Relacionar', CLASIFICAR: 'Clasificar', COMPLETAR: 'Completar', PALABRAS: 'Banco de palabras', NUMERICA: 'Numérica' };
  var FORMATO = {
    MC: ['Selección múltiple: el enunciado en la primera línea; 4 opciones «a)», «b)», «c)», «d)», una por línea; pon un asterisco * pegado delante de la letra de la ÚNICA correcta.',
      '¿Qué dispositivo conecta redes distintas?\na) Monitor\n*b) Router\nc) Teclado\nd) Altavoz\nExplicación: El router enruta paquetes entre redes.'],
    VF: ['Verdadero o falso: una afirmación y debajo «Respuesta: V» o «Respuesta: F». Sin opciones.',
      'La memoria RAM conserva los datos al apagar el equipo.\nRespuesta: F\nExplicación: La RAM es volátil; se borra al apagar.'],
    VFJ: ['V/F justificada: primera línea «Tipo: justifica», luego la afirmación y «Respuesta: V» o «Respuesta: F». El estudiante explicará por qué.',
      'Tipo: justifica\nUn byte tiene 8 bits.\nRespuesta: V\nExplicación: Por definición, 1 byte = 8 bits.'],
    CORTA: ['Respuesta corta: el enunciado y «Respuesta:» con la respuesta esperada; si se aceptan variantes, sepáralas con |. Sin opciones. La respuesta nunca es solo V ni F.',
      'Escribe el nombre de la unidad que procesa las instrucciones.\nRespuesta: CPU | procesador'],
    ORDENAR: ['Ordenar: primera línea «Tipo: ordenar», luego el enunciado y debajo al menos 3 pasos, uno por línea, EN EL ORDEN CORRECTO (la plataforma los desordena).',
      'Tipo: ordenar\nOrdena los pasos para enviar un correo\nAbrir el programa de correo\nEscribir el destinatario\nRedactar el mensaje\nPulsar Enviar'],
    ALGORITMO: ['Algoritmo: primera línea «Tipo: algoritmo», luego el enunciado y debajo el pseudocódigo correcto, una instrucción por línea, en orden, con sangría de espacios.',
      'Tipo: algoritmo\nArma el algoritmo que muestra el mayor de dos números\nInicio\nLeer A, B\nSi A > B entonces\n    Escribir A\nSino\n    Escribir B\nFinSi\nFin'],
    FLUJO: ['Diagrama de flujo: primera línea «Tipo: diagrama de flujo», luego el enunciado y debajo un bloque por línea de arriba hacia abajo (Inicio, Leer…, decisiones con «?», Escribir…, Fin).',
      'Tipo: diagrama de flujo\nOrdena el diagrama que dice si un número es par\nInicio\nLeer N\n¿N es par?\nEscribir "Par"\nFin'],
    RELACIONAR: ['Relacionar: primera línea «Tipo: relacionar», luego el enunciado y debajo al menos 3 parejas «izquierda = derecha», una por línea.',
      'Tipo: relacionar\nRelaciona cada componente con su función\nCPU = Procesa los datos\nRAM = Memoria temporal\nDisco duro = Guarda archivos'],
    CLASIFICAR: ['Clasificar: primera línea «Tipo: clasificar», luego el enunciado y debajo un grupo por línea «Grupo: elemento, elemento, elemento» (al menos 2 grupos).',
      'Tipo: clasificar\nClasifica cada elemento\nHardware: Teclado, Monitor, Mouse\nSoftware: Word, Windows, Chrome'],
    COMPLETAR: ['Completar: primera línea «Tipo: completar» y luego el texto con cada respuesta entre [[ ]]; variantes válidas dentro con |.',
      'Tipo: completar\nPara mostrar datos se usa [[Escribir|Mostrar]] y para pedirlos se usa [[Leer]].'],
    PALABRAS: ['Banco de palabras: primera línea «Tipo: palabras», la oración con cada palabra correcta entre [[ ]] y una línea «Relleno:» con 2 a 4 palabras falsas separadas por comas.',
      'Tipo: palabras\nEl [[monitor]] muestra la imagen y el [[teclado]] sirve para escribir.\nRelleno: altavoz, escáner, router'],
    NUMERICA: ['Numérica: primera línea «Tipo: numérica», el enunciado, «Respuesta:» con solo el número (punto decimal) y, si hace falta, «Tolerancia:» con el margen aceptado.',
      'Tipo: numérica\n¿Cuántos bits hay en 4 bytes?\nRespuesta: 32\nTolerancia: 0']
  };
  /* Tipos de tipos.js que una IA puede escribir sola (los de imagen o video necesitan material del docente) */
  Object.keys(window.TIPOSX || {}).forEach(function (k) { var d = window.TIPOSX[k]; if (d && d.codigo && d.formato) { TIPOS.push(k); NOMBRES[k] = d.nombre; FORMATO[k] = d.formato; } });
  var NIVELES = ['Primaria', 'Secundaria', 'Universidad'];
  var DIFICULTADES = { mixta: 'Mixta (30 % fácil, 50 % media, 20 % difícil)', facil: 'Fácil', media: 'Media', dificil: 'Difícil', bloom: 'Por niveles de Bloom (recordar, comprender, aplicar, analizar, evaluar, crear)' };
  var IDIOMAS = ['Español', 'Inglés', 'Francés'];

  /* ---------- Plantillas ---------- */
  var BASE = { tema: '', nivel: 'Secundaria', grado: '', materia: '', cantidad: 10, dificultad: 'mixta', idioma: 'Español', explicacion: true, video: '', texto: '', pct: { MC: 40, VF: 30, CORTA: 15, COMPLETAR: 15 } };
  var PLANTILLAS = [
    { id: 'diagnostico', nombre: 'Diagnóstico', proposito: 'Es una prueba DIAGNÓSTICA: mide los conocimientos previos antes de empezar el tema. Cubre los prerrequisitos y lo básico, sin preguntas rebuscadas.', v: { cantidad: 10, dificultad: 'facil', pct: { MC: 50, VF: 30, CORTA: 20 } } },
    { id: 'quiz', nombre: 'Quiz rápido', proposito: 'Es un QUIZ RÁPIDO de 5 a 10 minutos para comprobar lo visto en la clase de hoy. Preguntas cortas y directas.', v: { cantidad: 8, dificultad: 'media', pct: { MC: 50, VF: 50 } } },
    { id: 'unidad', nombre: 'Examen de unidad o final', proposito: 'Es un EXAMEN DE UNIDAD (o final): cubre todos los subtemas de forma equilibrada, con preguntas de comprensión y aplicación además de memoria.', v: { cantidad: 25, dificultad: 'mixta', pct: { MC: 40, VF: 15, CORTA: 10, RELACIONAR: 10, ORDENAR: 10, COMPLETAR: 15 } } },
    { id: 'repaso', nombre: 'Práctica de repaso', proposito: 'Es una PRÁCTICA DE REPASO: el estudiante aprende al ver la explicación de cada pregunta, así que la explicación debe enseñar.', v: { cantidad: 15, dificultad: 'mixta', explicacion: true, pct: { MC: 40, VF: 20, COMPLETAR: 20, RELACIONAR: 20 } } },
    { id: 'unico', nombre: 'Un solo tipo de pregunta', proposito: 'Todas las preguntas son del mismo tipo.', v: { cantidad: 10, pct: { MC: 100 } }, ayuda: 'Pon 100 en el tipo que quieras y 0 en los demás.' },
    { id: 'combinado', nombre: 'Combinado (porcentajes)', proposito: 'Es un examen COMBINADO con los porcentajes de tipos indicados.', v: { cantidad: 20, pct: { MC: 30, VF: 20, CORTA: 10, RELACIONAR: 10, ORDENAR: 10, COMPLETAR: 10, PALABRAS: 10 } }, ayuda: 'Los porcentajes deben sumar 100.' },
    { id: 'video', nombre: 'A partir de un video de YouTube', proposito: 'Las preguntas evalúan lo que se explica en el VIDEO indicado.', v: { cantidad: 10, pct: { MC: 50, VF: 30, CORTA: 20 } }, video: true },
    { id: 'texto', nombre: 'A partir de un texto o lectura', proposito: 'Es una COMPRENSIÓN LECTORA: todas las preguntas salen SOLO del texto indicado (literal, inferencial y crítica). No uses datos que no estén en el texto.', v: { cantidad: 10, pct: { MC: 50, VF: 30, CORTA: 20 } }, texto: true }
  ];
  function plantilla(id) { return PLANTILLAS.filter(function (x) { return x.id === id; })[0] || PLANTILLAS[0]; }
  function valoresDe(id) { var p = plantilla(id), v = JSON.parse(JSON.stringify(BASE)); Object.keys(p.v).forEach(function (k) { v[k] = JSON.parse(JSON.stringify(p.v[k])); }); return v; }

  /* Reparte n entre los tipos según el porcentaje (resto mayor). */
  function reparto(pct, n) {
    var ks = TIPOS.filter(function (t) { return Number(pct[t]) > 0; }), tot = ks.reduce(function (a, t) { return a + Number(pct[t]); }, 0), out = {}, usado = 0;
    if (!tot) return out;
    var r = ks.map(function (t) { var x = n * Number(pct[t]) / tot; out[t] = Math.floor(x); usado += out[t]; return [t, x - Math.floor(x)]; }).sort(function (a, b) { return b[1] - a[1]; });
    for (var i = 0; usado < n && r.length; i = (i + 1) % r.length) { out[r[i][0]]++; usado++; }
    return out;
  }
  function repartoDif(dif, n) {
    if (dif === 'mixta') { var f = Math.round(n * 0.3), d = Math.round(n * 0.2); return f + ' fáciles, ' + Math.max(0, n - f - d) + ' de dificultad media y ' + d + ' difíciles'; }
    if (dif === 'bloom') return 'repartidas entre los niveles de Bloom (recordar, comprender, aplicar, analizar, evaluar, crear), con no más de un tercio de solo recordar';
    return 'todas de dificultad ' + ({ facil: 'fácil', media: 'media', dificil: 'difícil' }[dif] || 'media');
  }

  /* ---------- El prompt ---------- */
  function construir(pl, v) {
    var n = Math.max(1, Math.min(60, Number(v.cantidad) || 10)), rep = reparto(v.pct, n), tipos = TIPOS.filter(function (t) { return rep[t]; });
    var nvf = (rep.VF || 0) + (rep.VFJ || 0), nv = Math.ceil(nvf / 2), nivel = v.nivel + (v.grado ? ', ' + v.grado : '');
    var L = [];
    L.push('Actúa como docente experto en evaluación educativa. Crea ' + n + ' preguntas de examen' + (v.materia ? ' de ' + v.materia : '') + ' para estudiantes de ' + nivel + '.');
    if (v.tema) L.push('Tema o contenido: ' + v.tema);
    L.push(pl.proposito);
    if (pl.video && v.video) L.push('Video: ' + v.video + (v.texto ? '\nTranscripción o resumen del video (básate en esto; no inventes lo que no aparece):\n"""\n' + v.texto + '\n"""' :
      '\nSi no puedes ver el video, basa las preguntas en lo que normalmente explica un video con ese tema y sé conservador.') +
      '\nEn las preguntas que dependan del video escribe al inicio del enunciado el minuto aproximado, por ejemplo «(min 2:30)», y agrega en ese bloque una línea «Video: ' + v.video + '».');
    else if (pl.texto && v.texto) L.push('Texto base (todas las preguntas salen solo de aquí):\n"""\n' + v.texto + '\n"""');
    L.push('Idioma de las preguntas y respuestas: ' + v.idioma + '. (Las palabras clave del formato —Tipo:, Respuesta:, Explicación:, Relleno:, Tolerancia:— se escriben siempre así, en español.)');
    L.push('Dificultad: ' + repartoDif(v.dificultad, n) + '.');
    L.push('Cantidad EXACTA por tipo: ' + tipos.map(function (t) { return rep[t] + ' de ' + NOMBRES[t]; }).join('; ') + '. Mezcla los tipos en el orden que quieras.');
    L.push('', 'REGLAS DE CALIDAD (obligatorias):',
      '- Una sola respuesta correcta por pregunta (salvo que el tipo pida varias, como completar o relacionar).',
      '- Lenguaje claro y adecuado a la edad y al nivel (' + nivel + '). Enunciados cortos.',
      '- Distractores creíbles: del mismo tema, de longitud parecida a la correcta y con errores típicos de los estudiantes. Nada de «todas las anteriores» ni «ninguna de las anteriores». La correcta no debe ser siempre la más larga.',
      '- Varía la posición de la correcta: repártela entre a), b), c) y d) sin patrón.');
    if (nvf) L.push('- Verdadero o falso: la afirmación NO debe delatar la respuesta. Prohibido usar palabras absolutas o pistas como «siempre», «nunca», «todos», «ninguno», «solo», «jamás», «únicamente», y prohibido incluir la respuesta o una negación obvia («no es…»). Las falsas cambian un dato clave y suenan tan creíbles como las verdaderas. Equilibrio: ' + nv + ' verdaderas y ' + (nvf - nv) + ' falsas, en orden mezclado.');
    L.push('- No repitas preguntas ni evalúes dos veces lo mismo.',
      '- No incluyas datos personales: ni nombres reales de estudiantes, ni teléfonos, ni cédulas, ni direcciones. Si necesitas un nombre, usa uno inventado y común.',
      v.explicacion ? '- Cada pregunta lleva al final una línea «Explicación: …» (máximo 25 palabras) que diga por qué la respuesta es correcta.' : '- No escribas explicaciones.',
      '', 'FORMATO DE SALIDA (es para importarlo a una plataforma; si no se respeta, la pregunta se pierde):',
      '- Escribe SOLO las preguntas. Sin títulos, sin introducción, sin comentarios al final, sin markdown (nada de **, #, ``` ni tablas) y SIN numerar las preguntas.',
      '- Separa cada pregunta de la siguiente con UNA línea en blanco. Dentro de una pregunta NUNCA dejes líneas en blanco.',
      '- Ningún enunciado puede empezar con «a)», «-» ni «Tipo:», «Respuesta:», «Imagen:», «Video:» o «Audio:».',
      '- Para un video, imagen o audio en una pregunta: una línea «Video: https://…» (o «Imagen: https://…», «Audio: https://…») dentro del bloque. Solo enlaces https reales; si no tienes uno, no pongas la línea.',
      '', 'Cómo se escribe cada tipo (los ejemplos muestran solo la FORMA, no el contenido):');
    tipos.forEach(function (t) { L.push('', '## ' + NOMBRES[t] + ' — ' + FORMATO[t][0], FORMATO[t][1]); });
    L.push('', 'Antes de responder revisa: total = ' + n + ', cantidades por tipo exactas, una línea en blanco entre preguntas y ninguna dentro, y que la respuesta marcada sea realmente la correcta.');
    return L.join('\n');
  }

  /* ---------- Limpieza de lo que pega el docente (las IA suelen añadir markdown) ---------- */
  function limpiar(txt) {
    return String(txt || '').replace(/\r/g, '').split('\n').filter(function (l) { return !/^\s*```/.test(l) && !/^\s*#{1,6}\s/.test(l); })
      .map(function (l) { return l.replace(/\*\*/g, '').replace(/^\s*\d+\s*[\.\)]\s+(?=(tipo|imagen|video|audio)\s*:)/i, ''); }).join('\n').trim();
  }

  /* ---------- Revisión: errores por pregunta y avisos de equilibrio ---------- */
  var ABSOLUTAS = /\b(siempre|nunca|todos|todas|ninguno|ninguna|jam[aá]s|[uú]nicamente|solamente|always|never|all|none|only)\b/i;
  function pista(err) {
    var e = String(err || '');
    if (/sin respuesta correcta/.test(e)) return 'Marca la correcta con * delante de la letra (*b) …) o agrega «Respuesta: b». En V/F escribe «Respuesta: V» o «F».';
    if (/menos de 2 opciones|pocas opciones/.test(e)) return 'Escribe al menos 2 opciones, una por línea, empezando con a), b), c)…';
    if (/sin pregunta|sin texto/.test(e)) return 'Falta el enunciado: escríbelo en la primera línea del bloque.';
    if (/3 pasos/.test(e)) return 'Escribe al menos 3 pasos, uno por línea, debajo del enunciado.';
    if (/parejas/.test(e)) return 'Escribe una pareja por línea así: izquierda = derecha.';
    if (/\[\[/.test(e)) return 'Pon cada respuesta entre [[ ]].';
    if (/número/.test(e)) return 'Escribe «Respuesta: 12.5» (solo el número).';
    if (/justificada/.test(e)) return 'Agrega «Respuesta: V» o «Respuesta: F».';
    return 'Revisa el formato del bloque o bórralo.';
  }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  /* lista = salida de analizar(); pedido = { cantidad, pct, explicacion }. Devuelve { ok, malas, avisos, vfAbs: {i: true} } */
  function revisar(lista, pedido) {
    var ok = lista.filter(function (q) { return !q.error; }), avisos = [], vfAbs = {};
    var vf = ok.filter(function (q) { return q.tipo === 'VF' || q.tipo === 'VFJ'; }), nv = vf.filter(function (q) { return q.correcta === 'Verdadero'; }).length;
    if (vf.length >= 3 && (nv === 0 || nv === vf.length)) avisos.push('Todas las de verdadero o falso son ' + (nv ? 'VERDADERAS' : 'FALSAS') + '. Cambia algunas para que no se adivinen.');
    else if (vf.length >= 4 && Math.max(nv, vf.length - nv) / vf.length > 0.7) avisos.push('Verdadero o falso desequilibrado: ' + nv + ' V y ' + (vf.length - nv) + ' F. Lo ideal es cerca de la mitad.');
    lista.forEach(function (q, i) { if ((q.tipo === 'VF' || q.tipo === 'VFJ') && !q.error && ABSOLUTAS.test(q.enunciado)) vfAbs[i] = true; });
    if (Object.keys(vfAbs).length) avisos.push(Object.keys(vfAbs).length + ' de V/F usan palabras absolutas (siempre, nunca, todos, solo…) que delatan la respuesta: #' + Object.keys(vfAbs).map(function (i) { return Number(i) + 1; }).join(', #') + '.');
    var mc = ok.filter(function (q) { return q.tipo === 'MC'; }), pos = {}, larga = 0;
    mc.forEach(function (q) { var k = q.opciones.indexOf(q.correcta); pos[k] = (pos[k] || 0) + 1;
      if (q.opciones.every(function (o) { return o === q.correcta || o.length < q.correcta.length; })) larga++; });
    var maxPos = Object.keys(pos).sort(function (a, b) { return pos[b] - pos[a]; })[0];
    if (mc.length >= 3 && pos[maxPos] === mc.length) avisos.push('En selección múltiple la correcta es SIEMPRE la ' + String.fromCharCode(97 + Number(maxPos)) + ').');
    else if (mc.length >= 5 && pos[maxPos] / mc.length > 0.6) avisos.push('En selección múltiple la correcta es casi siempre la ' + String.fromCharCode(97 + Number(maxPos)) + ') (' + pos[maxPos] + ' de ' + mc.length + ').');
    if (mc.length >= 4 && larga / mc.length > 0.7) avisos.push('En ' + larga + ' de ' + mc.length + ' de selección múltiple la correcta es la opción más larga: se adivina fácil.');
    var vistos = {}, dup = [];
    lista.forEach(function (q, i) { var k = norm(q.enunciado); if (!k) return; if (vistos[k] !== undefined) dup.push('#' + (vistos[k] + 1) + ' y #' + (i + 1)); else vistos[k] = i; });
    if (dup.length) avisos.push('Preguntas repetidas: ' + dup.join(', ') + '.');
    if (pedido && pedido.explicacion) { var sin = ok.filter(function (q) { return !String(q.explicacion || '').trim(); }).length; if (sin) avisos.push(sin + ' sin explicación (pediste explicación en cada una).'); }
    if (pedido && pedido.pct) {
      var n = Number(pedido.cantidad) || 0, rep = reparto(pedido.pct, n), real = {};
      ok.forEach(function (q) { real[q.tipo] = (real[q.tipo] || 0) + 1; });
      if (n && ok.length !== n) avisos.push('Pediste ' + n + ' preguntas y llegaron ' + ok.length + ' válidas.');
      var dif = TIPOS.filter(function (t) { return Math.abs((real[t] || 0) - (rep[t] || 0)) > Math.max(1, Math.round(n * 0.1)); });
      if (dif.length) avisos.push('La mezcla de tipos no es la pedida: ' + dif.map(function (t) { return NOMBRES[t] + ' ' + (real[t] || 0) + ' (pediste ' + (rep[t] || 0) + ')'; }).join('; ') + '.');
    }
    return { ok: ok, malas: lista.length - ok.length, avisos: avisos, vfAbs: vfAbs };
  }

  /* ---------- Plantillas propias (localStorage) ---------- */
  function mias() { try { var a = JSON.parse(localStorage.getItem('es-prompts') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function guardarMias(a) { try { localStorage.setItem('es-prompts', JSON.stringify(a.slice(0, 30))); return true; } catch (e) { return false; } }

  /* ---------- Ventana ---------- */
  var DATOS_PERSONALES = /\b\d{3}-?\d{7}-?\d\b|\b(809|829|849)[-. ]?\d{3}[-. ]?\d{4}\b/;
  function abrir() {
    var pu = P(); if (!pu) return;
    var ex = pu.ex() || {}, sel = 'diagnostico', v = valoresDe(sel), ultimo = null;
    v.materia = ex.materia || '';
    function opts(lista, actual) { return lista.map(function (x) { return '<option' + (x === actual ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); }
    function pintar() {
      var pl = plantilla(sel.indexOf('mia:') === 0 ? (mias()[Number(sel.slice(4))] || {}).base : sel), m = mias();
      pu.modal('<h2>📋 Prompts listos</h2><p class="suave pequeno">Llena los datos, copia el prompt y pégalo en tu IA (ChatGPT, Gemini, Claude; sirven las versiones gratis). Luego pega aquí lo que te responda: lo revisamos antes de agregarlo. No escribas nombres de estudiantes ni datos personales.</p>' +
        '<label class="campo"><span>Plantilla</span><select class="entrada" id="prPl">' + PLANTILLAS.map(function (x) { return '<option value="' + x.id + '"' + (sel === x.id ? ' selected' : '') + '>' + esc(x.nombre) + '</option>'; }).join('') +
        (m.length ? '<optgroup label="Mis plantillas">' + m.map(function (x, i) { return '<option value="mia:' + i + '"' + (sel === 'mia:' + i ? ' selected' : '') + '>' + esc(x.nombre) + '</option>'; }).join('') + '</optgroup>' : '') + '</select></label>' +
        (pl.ayuda ? '<p class="pequeno suave" style="margin:-6px 0 10px">' + esc(pl.ayuda) + '</p>' : '') +
        '<label class="campo"><span>Tema o contenido</span><input class="entrada" id="prTema" maxlength="300" placeholder="Ej.: Fotosíntesis; Topologías de red" value="' + esc(v.tema) + '"></label>' +
        (pl.video ? '<label class="campo"><span>Enlace del video de YouTube</span><input class="entrada" id="prVideo" maxlength="300" placeholder="https://www.youtube.com/watch?v=…" value="' + esc(v.video) + '"></label>' : '') +
        (pl.video || pl.texto ? '<label class="campo"><span>' + (pl.video ? 'Transcripción o resumen del video (opcional, mejora mucho el resultado)' : 'Texto o lectura') + '</span><textarea class="entrada" id="prTexto" maxlength="15000" style="min-height:100px">' + esc(v.texto) + '</textarea></label>' : '') +
        '<div class="fila"><label class="campo"><span>Nivel</span><select class="entrada" id="prNivel">' + opts(NIVELES, v.nivel) + '</select></label>' +
        '<label class="campo"><span>Grado o curso</span><input class="entrada" id="prGrado" maxlength="40" placeholder="Ej.: 4to" value="' + esc(v.grado) + '"></label>' +
        '<label class="campo"><span>Materia</span><input class="entrada" id="prMat" maxlength="80" value="' + esc(v.materia) + '"></label></div>' +
        '<div class="fila"><label class="campo"><span>Cantidad (1-60)</span><input class="entrada" id="prCant" type="number" min="1" max="60" value="' + esc(v.cantidad) + '"></label>' +
        '<label class="campo"><span>Dificultad</span><select class="entrada" id="prDif">' + Object.keys(DIFICULTADES).map(function (k) { return '<option value="' + k + '"' + (v.dificultad === k ? ' selected' : '') + '>' + esc(DIFICULTADES[k]) + '</option>'; }).join('') + '</select></label>' +
        '<label class="campo"><span>Idioma</span><select class="entrada" id="prIdi">' + opts(IDIOMAS, v.idioma) + '</select></label></div>' +
        '<label class="pildora" style="cursor:pointer;margin-bottom:12px"><input type="checkbox" id="prExp"' + (v.explicacion ? ' checked' : '') + '> Explicación en cada pregunta</label>' +
        '<div class="campo"><span>Tipos de pregunta (%) · suma: <b id="prSuma"></b></span><div class="fila" id="prPct" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">' + TIPOS.map(function (t) {
          return '<label class="pequeno" style="display:flex;gap:6px;align-items:center"><input class="entrada" type="number" min="0" max="100" step="5" data-t="' + t + '" value="' + (Number(v.pct[t]) || 0) + '" style="width:70px;padding:6px 8px">' + esc(NOMBRES[t]) + '</label>'; }).join('') + '</div></div>' +
        '<div class="error" id="prError"></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><button class="btn primario" id="prCopiar">📋 Copiar prompt</button>' +
        '<a class="btn claro mini" href="https://chatgpt.com/" target="_blank" rel="noopener">ChatGPT</a><a class="btn claro mini" href="https://gemini.google.com/app" target="_blank" rel="noopener">Gemini</a><a class="btn claro mini" href="https://claude.ai/new" target="_blank" rel="noopener">Claude</a>' +
        '<button class="btn fantasma mini" id="prVer">Ver prompt</button><button class="btn fantasma mini" id="prGuardar">Guardar como mi plantilla</button>' + (sel.indexOf('mia:') === 0 ? '<button class="btn fantasma mini" id="prBorrar">Borrar mi plantilla</button>' : '') + '</div>' +
        '<pre id="prTxt" class="oculto pequeno" style="white-space:pre-wrap;max-height:240px;overflow:auto;background:var(--sup2);padding:10px;border-radius:12px;margin-top:10px"></pre>' +
        '<label class="campo" style="margin-top:16px"><span>Pega aquí lo que te dio la IA</span><textarea class="entrada" id="prPega" style="min-height:160px;font-family:ui-monospace,Consolas,monospace;font-size:13.5px" placeholder="Pega la respuesta completa de la IA"></textarea></label>' +
        '<div id="prVista"></div>' +
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:10px"><button class="btn claro" data-cerrar>Cerrar</button><button class="btn primario" id="prAgregar" disabled>Agregar al examen</button></div>', true);
      var suma = function () { var s = 0; $('prPct').querySelectorAll('[data-t]').forEach(function (x) { s += Number(x.value) || 0; }); $('prSuma').textContent = s + ' %'; $('prSuma').style.color = s === 100 ? '' : 'var(--rojo)'; return s; };
      suma(); $('prPct').oninput = suma;
      $('prPl').onchange = function () { leer(); sel = this.value; var nv;
        if (sel.indexOf('mia:') === 0) nv = JSON.parse(JSON.stringify((mias()[Number(sel.slice(4))] || {}).v || BASE)); else nv = valoresDe(sel);
        ['tema', 'materia', 'grado', 'nivel'].forEach(function (k) { if (!nv[k]) nv[k] = v[k]; }); v = nv; pintar(); };
      $('prCopiar').onclick = function () { var t = prompt_(); if (t) { pu.copiar(t); $('prTxt').textContent = t; } };
      $('prVer').onclick = function () { var t = prompt_(); if (t) { $('prTxt').textContent = t; $('prTxt').classList.toggle('oculto'); } };
      $('prGuardar').onclick = function () { leer(); var nom = (window.prompt('Nombre de tu plantilla:', plantilla(pl.id).nombre + ' · ' + (v.tema || 'mía')) || '').trim().slice(0, 60); if (!nom) return;
        var a = mias(); a.push({ nombre: nom, base: pl.id, v: v }); if (guardarMias(a)) { sel = 'mia:' + (a.length - 1); AVISO('Plantilla guardada en este navegador'); pintar(); } else AVISO('No se pudo guardar en este navegador', 'error'); };
      if ($('prBorrar')) $('prBorrar').onclick = function () { var a = mias(); a.splice(Number(sel.slice(4)), 1); guardarMias(a); sel = pl.id; pintar(); };
      $('prPega').oninput = vista; $('prAgregar').onclick = agregar;
      function prompt_() {
        leer(); $('prError').textContent = '';
        var s = suma(), err = s !== 100 ? 'Los porcentajes de tipos deben sumar 100 (ahora suman ' + s + ').' : !v.tema && !(pl.texto && v.texto) && !(pl.video && v.video) ? 'Escribe el tema o contenido.' :
          pl.video && !/^https:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//.test(v.video) ? 'Pega el enlace del video de YouTube (https).' : pl.texto && v.texto.length < 80 ? 'Pega el texto o la lectura (al menos un párrafo).' :
          DATOS_PERSONALES.test(v.tema + ' ' + v.texto) ? 'Parece haber cédulas o teléfonos. Quítalos antes de enviarlo a una IA.' : '';
        if (err) { $('prError').textContent = err; return ''; }
        ultimo = { cantidad: v.cantidad, pct: v.pct, explicacion: v.explicacion };
        return construir(pl, v);
      }
    }
    function leer() {
      var g = function (id) { return $(id) ? $(id).value.trim() : ''; };
      v.tema = g('prTema'); v.nivel = g('prNivel') || v.nivel; v.grado = g('prGrado'); v.materia = g('prMat'); v.idioma = g('prIdi') || v.idioma; v.dificultad = g('prDif') || v.dificultad;
      v.cantidad = Math.max(1, Math.min(60, Number(g('prCant')) || 10)); v.explicacion = !!($('prExp') && $('prExp').checked);
      if ($('prVideo')) v.video = g('prVideo'); if ($('prTexto')) v.texto = g('prTexto');
      v.pct = {}; $('prPct').querySelectorAll('[data-t]').forEach(function (x) { var n = Math.max(0, Number(x.value) || 0); if (n) v.pct[x.dataset.t] = n; });
    }
    var lista = [];
    function vista() {
      lista = pu.analizar(limpiar($('prPega').value));
      var r = revisar(lista, ultimo || (leer(), { cantidad: v.cantidad, pct: v.pct, explicacion: v.explicacion }));
      $('prVista').innerHTML = !lista.length ? '' : '<p class="pequeno" style="margin:10px 0 6px"><b>' + r.ok.length + ' listas</b>' + (r.malas ? ' · <span style="color:var(--rojo)">' + r.malas + ' con errores (no se agregan)</span>' : '') + '</p>' +
        (r.avisos.length ? '<div class="tarjeta" style="padding:10px 14px;margin:0 0 8px;border-left:4px solid var(--amarillo)"><b>⚠ Revisa el equilibrio</b><ul class="pequeno" style="margin:6px 0 0;padding-left:18px">' + r.avisos.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></div>' : '') +
        lista.map(function (q, i) {
          return '<div class="tarjeta" style="padding:10px 12px;margin:0 0 6px' + (q.error ? ';border-left:4px solid var(--rojo)' : '') + '"><span class="pildora">#' + (i + 1) + ' ' + esc(NOMBRES[q.tipo] || q.tipo) + '</span>' + (q.media ? ' <span class="pildora azul">' + esc(q.media.split(':')[0]) + '</span>' : '') + (r.vfAbs[i] ? ' <span class="pildora amarillo">palabra absoluta</span>' : '') +
            '<div style="margin:4px 0;white-space:pre-line"><b>' + esc(q.enunciado || '(sin enunciado)') + '</b></div>' +
            (q.error ? '<div class="pequeno" style="color:var(--rojo)"><b>Error ' + esc(q.error) + '.</b> ' + esc(pista(q.error)) + '</div>' :
              '<div class="pequeno suave" style="white-space:pre-line">' + (q.tipo === 'MC' ? 'Opciones: ' + esc(q.opciones.join(' · ')) + '\n' : '') + 'Respuesta: ' + esc(pu.claveTexto(q)) + (q.explicacion ? '\nExplicación: ' + esc(q.explicacion) : '') + '</div>') + '</div>';
        }).join('');
      $('prAgregar').disabled = !r.ok.length; $('prAgregar').textContent = r.ok.length ? 'Agregar ' + r.ok.length + ' al examen' : 'Agregar al examen';
    }
    pintar();
    function agregar() {
      var ok = lista.filter(function (q) { return !q.error; }); if (!ok.length) return;
      ok.forEach(function (q) { delete q.error; }); pu.cerrar(); pu.agregar(ok); AVISO(ok.length + ' preguntas agregadas. Revísalas y pulsa Guardar.');
    }
  }

  /* ---------- Mi cuenta: tu propia clave de IA (Gemini / Groq) ---------- */
  function claveIA(pagina) {
    var pu = P(); if (!pu || !pagina) return;
    var caja = document.createElement('div'); caja.className = 'tarjeta'; caja.id = 'cClaveIA'; caja.style.marginTop = '14px'; pagina.appendChild(caja);
    function pintar() {
      var y = pu.yo() || {}, ip = y.iaPropia || {}, lim = y.iaHoy;
      var fila = function (pv, nombre, ph) {
        return '<div style="margin-top:12px"><b>' + nombre + '</b> ' + (ip[pv] ? '<span class="pildora verde">Guardada ' + esc(ip[pv]) + '</span> <button class="btn fantasma mini" data-borrar="' + pv + '">Quitar</button>' : '<span class="pildora">Sin clave</span>') +
          '<div class="filtros" style="margin-top:6px"><input class="entrada" type="password" autocomplete="off" spellcheck="false" id="ck_' + pv + '" placeholder="' + ph + '" style="flex:1;min-width:200px"><button class="btn primario mini" data-guardar="' + pv + '">Probar y guardar</button></div></div>';
      };
      caja.innerHTML = '<h3>✨ Tu propia clave de IA</h3><p class="suave pequeno" style="margin:4px 0 8px">Con tu clave gratis de Google, «Generar con IA» usa tu cuota y no el límite de la plataforma' + (lim ? ' (' + lim.limite + ' por día)' : '') + '. La clave queda guardada en el servidor, solo la usa tu cuenta y nunca se vuelve a mostrar (solo sus 4 últimos caracteres). Puedes quitarla cuando quieras.</p>' +
        '<ol class="pequeno" style="margin:0 0 6px;padding-left:20px"><li>Abre <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio ▸ API keys</a> con tu cuenta de Google.</li><li>Pulsa <b>Create API key</b> (crear clave) y cópiala; empieza con <b>AIza</b>.</li><li>Pégala aquí y pulsa <b>Probar y guardar</b>.</li></ol>' +
        fila('gemini', 'Google AI Studio (Gemini)', 'AIza…') + '<details style="margin-top:10px"><summary class="pequeno suave" style="cursor:pointer">Opcional: clave de Groq (respaldo)</summary>' +
        '<p class="pequeno suave" style="margin:6px 0 0">Créala en <a href="https://console.groq.com/keys" target="_blank" rel="noopener">console.groq.com/keys</a>; empieza con <b>gsk_</b>.</p>' + fila('groq', 'Groq', 'gsk_…') + '</details><div class="error" id="ckError"></div>';
    }
    pintar();
    caja.onclick = function (e) {
      var g = e.target.closest('[data-guardar]'), b = e.target.closest('[data-borrar]'); if (!g && !b) return;
      $('ckError').textContent = '';
      var pv = (g || b).dataset.guardar || (g || b).dataset.borrar, dato = g ? { action: 'iaClaveGuardar', proveedor: pv, clave: $('ck_' + pv).value.trim() } : { action: 'iaClaveBorrar', proveedor: pv };
      if (g && !dato.clave) { $('ckError').textContent = 'Pega la clave primero.'; return; }
      if (b && !confirm('¿Quitar tu clave? «Generar con IA» volverá a usar la de la plataforma.')) return;
      (g || b).disabled = true; if (g) g.textContent = 'Probando…';
      pu.A(dato).then(function (r) { var y = pu.yo(); if (y) y.iaPropia = r.iaPropia; AVISO(g ? 'Clave probada y guardada' : 'Clave quitada'); pintar(); })
        .catch(function (er) { $('ckError').textContent = er.message; (g || b).disabled = false; if (g) g.textContent = 'Probar y guardar'; });
    };
  }

  window.ES_PROMPTS = abrir;
  window.ES_CLAVE_IA = claveIA;
  window.ES_PROMPTS_LIB = { construir: construir, revisar: revisar, limpiar: limpiar, reparto: reparto, valoresDe: valoresDe, plantilla: plantilla, FORMATO: FORMATO, TIPOS: TIPOS, PLANTILLAS: PLANTILLAS };
})();

/* Examen Seguro · utilidades compartidas: íconos (trazos estilo Lucide), tema claro/oscuro, API y avisos. */
(function () {
  'use strict';
  var P = {
    inicio: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
    examen: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M8 13h8M8 17h5"/>',
    usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    docentes: '<circle cx="12" cy="7" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/><path d="m16 3 2 2 3-3"/>',
    cuenta: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    salir: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
    mas: '<path d="M12 5v14M5 12h14"/>',
    editar: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    copiar: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    borrar: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
    grafica: '<path d="M3 3v18h18"/><path d="M7 16v-5M12 16V8M17 16v-8"/>',
    ver: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    recargar: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>',
    descargar: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    imprimir: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    enlace: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    candado: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    escudo: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    luna: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    alerta: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    premio: '<circle cx="12" cy="8" r="6"/><path d="M8.2 13.3 7 22l5-3 5 3-1.2-8.7"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    llave: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M17 6l3 3M14 9l2 2"/>',
    atras: '<path d="m15 18-6-6 6-6"/>',
    adelante: '<path d="m9 18 6-6-6-6"/>',
    arriba: '<path d="m18 15-6-6-6 6"/>',
    abajo: '<path d="m6 9 6 6 6-6"/>',
    pantalla: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    salida: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
    robot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9 17h6"/>',
    barajar: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    intentos: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    marca: '<path d="M4 20 20 4"/><path d="M4 12 12 4M12 20l8-8"/>',
    movil: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
    bandera: '<path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/>',
    vivo: '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2"/>',
    libro: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    estrella: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
    importar: '<path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/>',
    banco: '<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/><path d="M10 13h4"/>',
    ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    video: '<rect x="2" y="5" width="15" height="14" rx="2"/><path d="m17 10 5-3v10l-5-3"/>',
    corregir: '<path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="m14 19 2 2 5-5"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 9 4.6V4.5a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A1.7 1.7 0 0 0 20.9 11H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
  };
  window.ICO = function (n, extra) { return '<svg class="ico' + (extra ? ' ' + extra : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || P.examen) + '</svg>'; };
  window.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  /* Tema: claro por defecto; se recuerda en este navegador */
  window.TEMA = function (m) {
    document.documentElement.setAttribute('data-theme', m);
    document.querySelectorAll('[data-tema]').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-tema') === m); });
    try { localStorage.setItem('es-tema', m); } catch (e) {}
  };
  var t = 'light'; try { t = localStorage.getItem('es-tema') || 'light'; } catch (e) {}
  document.documentElement.setAttribute('data-theme', t);
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.tema').forEach(function (g) {
      g.innerHTML = '<button type="button" data-tema="light" aria-label="Tema claro">' + ICO('sol') + '</button><button type="button" data-tema="dark" aria-label="Tema oscuro">' + ICO('luna') + '</button>';
      g.addEventListener('click', function (e) { var b = e.target.closest('[data-tema]'); if (b) TEMA(b.getAttribute('data-tema')); });
    });
    TEMA(t);
  });

  /* API (Apps Script): POST de texto plano, sin preflight */
  window.API = function (datos, opciones) {
    var url = window.EXAMEN_API || '';
    if (!url) return Promise.reject(new Error('Falta configurar el servidor (config.js).'));
    return fetch(url, Object.assign({ method: 'POST', body: JSON.stringify(datos), redirect: 'follow' }, opciones || {}))
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j.ok) { var e = new Error(j.error || 'Error'); e.sesion = j.sesion; throw e; } return j; });
  };

  window.AVISO = function (texto, tipo) {
    var a = document.createElement('div'); a.className = 'aviso';
    a.innerHTML = ICO(tipo === 'error' ? 'alerta' : 'check') + '<span>' + esc(texto) + '</span>';
    document.body.appendChild(a); setTimeout(function () { a.remove(); }, 3200);
  };
  window.DURACION = function (s) { s = Number(s) || 0; if (!s) return '—'; var m = Math.floor(s / 60), r = s % 60; return m ? m + ' min ' + (r ? r + ' s' : '') : r + ' s'; };
  window.FECHA = function (iso) { if (!iso) return '—'; var d = String(iso).replace(' ', 'T'); var p = d.split('T'); var f = p[0].split('-'); return f[2] + '/' + f[1] + (p[1] ? ' ' + p[1].slice(0, 5) : ''); };
})();

/* Versión visible de la plataforma: llena los elementos [data-version]. */
window.ES_VERSION = '2.4';
document.addEventListener('DOMContentLoaded', function () { document.querySelectorAll('[data-version]').forEach(function (e) { e.textContent = 'v' + window.ES_VERSION; }); });

/* Imagen, video o audio de una pregunta («imagen|video|audio:» + enlace). Acepta enlaces de YouTube y Google Drive. */
window.TIPO_MEDIA = function (url) { return /youtu\.?be|\.(mp4|webm|mov)(\?|$)/i.test(url) ? 'video' : /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url) ? 'audio' : 'imagen'; };
window.MEDIA = function (m) {
  var s = String(m || ''), k = s.indexOf(':'); if (k < 0) return '';
  var tipo = s.slice(0, k), url = s.slice(k + 1);
  if (!/^(https:\/\/|data:image\/)/.test(url)) return '';
  var drive = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/), yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (tipo === 'imagen') return '<figure class="media"><img src="' + esc(drive ? 'https://drive.google.com/thumbnail?id=' + drive[1] + '&sz=w1600' : url) + '" alt="Imagen de la pregunta" loading="lazy" draggable="false"><figcaption>Toca la imagen para verla más grande</figcaption></figure>';
  if (tipo === 'video' && yt) return '<figure class="media video"><iframe src="https://www.youtube-nocookie.com/embed/' + yt[1] + '?rel=0&modestbranding=1" title="Video de la pregunta" allow="encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" loading="lazy"></iframe></figure>';
  if (drive && (tipo === 'video' || tipo === 'audio')) return '<figure class="media ' + tipo + '"><iframe src="https://drive.google.com/file/d/' + drive[1] + '/preview" title="Archivo de la pregunta" loading="lazy"></iframe></figure>';
  if (tipo === 'video') return '<figure class="media video"><video controls preload="metadata" playsinline controlslist="nodownload nofullscreen" disablepictureinpicture src="' + esc(url) + '"></video></figure>';
  if (tipo === 'audio') return '<figure class="media audio"><audio controls preload="metadata" controlslist="nodownload" src="' + esc(url) + '"></audio></figure>';
  return '';
};
document.addEventListener('click', function (e) { var f = e.target.closest && e.target.closest('.media img'); if (f) f.parentNode.classList.toggle('grande'); });
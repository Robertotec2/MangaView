/**
 * Generación de portadas de manga como SVG.
 *
 * Cada título produce un diseño único (colores + motivo) sin depender de
 * portadas con derechos de terceros ni de una CDN externa.
 */

const PALETAS = {
  'Naruto': ['#1a0a00', '#FF6B00', '#FFD700'],
  'One Piece': ['#061428', '#1a6cff', '#FF4444'],
  'Attack on Titan': ['#141414', '#5c1010', '#c4a35a'],
  'Death Note': ['#050505', '#2a2a2a', '#eeeeee'],
  'Dragon Ball': ['#2a1200', '#FF8C00', '#FFD700'],
  'Demon Slayer': ['#12061f', '#6b21a8', '#f0c27b'],
  'My Hero Academia': ['#06122a', '#1d4ed8', '#ef4444'],
  'Fullmetal Alchemist': ['#1a1208', '#8B4513', '#DAA520'],
  'Mayonaka Heart Tune': ['#070b1c', '#4a1868', '#ff6b9d'],
  'Jujutsu Kaisen': ['#0b0f14', '#1f2937', '#f59e0b'],
  'Chainsaw Man': ['#1a0505', '#7f1d1d', '#f97316'],
  'Spy x Family': ['#0f172a', '#1e3a5f', '#fbbf24'],
  'Bleach': ['#0a0a12', '#312e81', '#e0e7ff'],
  'Hunter x Hunter': ['#052e16', '#166534', '#86efac'],
  'Tokyo Ghoul': ['#0c0a09', '#44403c', '#ef4444'],
  'Haikyuu!!': ['#1c1917', '#b45309', '#fde68a'],
  'Black Clover': ['#0a0a0a', '#171717', '#a3e635'],
  'Fairy Tail': ['#082f49', '#0369a1', '#f472b6'],
  "JoJo's Bizarre Adventure": ['#1e1b4b', '#6d28d9', '#fbbf24'],
  'Berserk': ['#0a0a0a', '#3f3f46', '#a1a1aa'],
  'Vinland Saga': ['#0c1a14', '#14532d', '#d6d3d1'],
  'Mob Psycho 100': ['#0f172a', '#334155', '#22d3ee'],
  'One Punch Man': ['#1c1917', '#9a3412', '#fb923c'],
  'Solo Leveling': ['#020617', '#1e293b', '#818cf8'],
  'The Promised Neverland': ['#14532d', '#166534', '#fef08a'],
  'Blue Lock': ['#082f49', '#0ea5e9', '#ffffff'],
  'Sakamoto Days': ['#111827', '#374151', '#f87171'],
  'Dandadan': ['#1a0533', '#7c3aed', '#f472b6'],
  'Frieren': ['#0c1220', '#334155', '#a5b4fc'],
  'Bocchi the Rock!': ['#2a1030', '#db2777', '#f9a8d4'],
  "Komi Can't Communicate": ['#1e1b4b', '#6366f1', '#fbcfe8'],
  'Horimiya': ['#1c1917', '#ea580c', '#fdba74'],
  'Fruits Basket': ['#14532d', '#16a34a', '#fde68a'],
  'Sailor Moon': ['#3b0764', '#a21caf', '#fce7f3'],
  'Neon Genesis Evangelion': ['#0a0a0a', '#7f1d1d', '#67e8f9'],
  'Cowboy Bebop': ['#0c0a09', '#78350f', '#fbbf24'],
  'Steins;Gate': ['#0f172a', '#1d4ed8', '#93c5fd'],
  'Code Geass': ['#111827', '#991b1b', '#facc15'],
  'Sword Art Online': ['#082f49', '#0e7490', '#67e8f9']
};

const PALETA_POR_DEFECTO = ['#0f172a', '#1e293b', '#e94560'];

const hashTitulo = (titulo) => {
  let h = 2166136261;
  for (let i = 0; i < titulo.length; i++) {
    h ^= titulo.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

const hsl = (h, s, l) => `hsl(${h % 360} ${s}% ${l}%)`;

/**
 * Paleta de 3 colores: fondo, medio y acento.
 * Los títulos conocidos usan colores fijos; el resto se deriva del hash.
 */
const paletaDe = (titulo) => {
  if (PALETAS[titulo]) return PALETAS[titulo];
  const h = hashTitulo(titulo || '?');
  return [
    hsl(h % 360, 42, 10),
    hsl((h * 3) % 360, 48, 22),
    hsl((h * 7 + 40) % 360, 72, 58)
  ];
};

const escaparXML = (texto) => String(texto)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const inicialDe = (titulo) => (titulo ? titulo.trim().charAt(0).toUpperCase() : '?');

/** Parte títulos largos en hasta 3 líneas para que quepan en la franja inferior. */
const lineasTitulo = (titulo, max = 16) => {
  const palabras = String(titulo || '').split(/\s+/).filter(Boolean);
  if (!palabras.length) return ['?'];
  const lineas = [];
  let actual = '';
  for (const p of palabras) {
    const candidato = actual ? `${actual} ${p}` : p;
    if (candidato.length > max && actual) {
      lineas.push(actual);
      actual = p;
      if (lineas.length === 2) {
        // Ultima linea: el resto
        const resto = [p, ...palabras.slice(palabras.indexOf(p) + 1)].join(' ');
        lineas.push(resto.length > max + 4 ? `${resto.slice(0, max + 2)}…` : resto);
        return lineas;
      }
    } else {
      actual = candidato;
    }
  }
  if (actual) lineas.push(actual);
  return lineas.slice(0, 3);
};

const motivoDecorativo = (seed, acento) => {
  const tipo = seed % 8;
  if (tipo === 0) {
    // Orbes
    return `
      <circle cx="320" cy="90" r="70" fill="${acento}" opacity="0.18"/>
      <circle cx="70" cy="200" r="40" fill="${acento}" opacity="0.12"/>
      <circle cx="300" cy="320" r="90" fill="${acento}" opacity="0.08"/>`;
  }
  if (tipo === 1) {
    // Rayos
    return `
      <g stroke="${acento}" stroke-width="2" opacity="0.35">
        <line x1="200" y1="40" x2="200" y2="360"/>
        <line x1="60" y1="80" x2="340" y2="320"/>
        <line x1="340" y1="80" x2="60" y2="320"/>
        <line x1="40" y1="200" x2="360" y2="200"/>
      </g>`;
  }
  if (tipo === 2) {
    // Diamantes
    return `
      <g fill="${acento}" opacity="0.16">
        <path d="M200 60 L240 140 L200 220 L160 140 Z"/>
        <path d="M80 180 L110 230 L80 280 L50 230 Z"/>
        <path d="M320 180 L350 230 L320 280 L290 230 Z"/>
      </g>`;
  }
  if (tipo === 3) {
    // Ondas
    return `
      <path d="M0 260 Q100 220 200 260 T400 260 V400 H0 Z" fill="${acento}" opacity="0.14"/>
      <path d="M0 300 Q100 270 200 300 T400 300 V400 H0 Z" fill="${acento}" opacity="0.1"/>`;
  }
  if (tipo === 4) {
    // Estrellas
    return Array.from({ length: 18 }, (_, i) => {
      const x = ((seed * (i + 3)) % 360) + 20;
      const y = ((seed * (i + 7)) % 300) + 30;
      const r = 1.2 + (i % 3);
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${0.35 + (i % 4) * 0.12}"/>`;
    }).join('');
  }
  if (tipo === 5) {
    // Rejilla
    return `
      <g stroke="${acento}" stroke-width="1" opacity="0.18">
        ${[80, 160, 240, 320].map((x) => `<line x1="${x}" y1="0" x2="${x}" y2="400"/>`).join('')}
        ${[80, 160, 240, 320].map((y) => `<line x1="0" y1="${y}" x2="400" y2="${y}"/>`).join('')}
      </g>`;
  }
  if (tipo === 6) {
    // Anillos
    return `
      <g fill="none" stroke="${acento}" stroke-width="3" opacity="0.28">
        <circle cx="200" cy="190" r="55"/>
        <circle cx="200" cy="190" r="95"/>
        <circle cx="200" cy="190" r="135"/>
      </g>`;
  }
  // Triangulos
  return `
    <g fill="${acento}" opacity="0.14">
      <path d="M0 0 L160 0 L0 180 Z"/>
      <path d="M400 400 L240 400 L400 220 Z"/>
      <path d="M400 0 L280 0 L400 140 Z"/>
    </g>`;
};

const generarPortadaSVG = (titulo) => {
  const [fondo, medio, acento] = paletaDe(titulo);
  const tituloSeguro = escaparXML(titulo);
  const inicial = escaparXML(inicialDe(titulo));
  const seed = hashTitulo(titulo || '?');
  const lineas = lineasTitulo(titulo);
  const textoLineas = lineas.map((linea, i) => {
    const y = 455 + i * 26;
    const size = lineas.length > 2 ? 18 : 22;
    return `<text x="200" y="${y}" font-family="Georgia, 'Times New Roman', serif" font-size="${size}" font-weight="700" fill="#ffffff" text-anchor="middle">${escaparXML(linea)}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${fondo}"/>
      <stop offset="55%" stop-color="${medio}"/>
      <stop offset="100%" stop-color="${fondo}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.35" r="0.55">
      <stop offset="0%" stop-color="${acento}" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="${fondo}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="band" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${acento}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${acento}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${acento}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="400" height="560" fill="url(#sky)"/>
  <rect width="400" height="560" fill="url(#glow)"/>
  ${motivoDecorativo(seed, acento)}
  <circle cx="200" cy="190" r="78" fill="${fondo}" opacity="0.45"/>
  <circle cx="200" cy="190" r="64" fill="none" stroke="${acento}" stroke-width="3" opacity="0.85"/>
  <text x="200" y="218" font-family="Georgia, 'Times New Roman', serif" font-size="84" font-weight="700" fill="${acento}" text-anchor="middle" opacity="0.95">${inicial}</text>
  <rect x="40" y="400" width="320" height="2" fill="url(#band)"/>
  <rect x="0" y="420" width="400" height="140" fill="${fondo}" opacity="0.72"/>
  ${textoLineas}
  <text x="200" y="540" font-family="Arial, sans-serif" font-size="11" letter-spacing="3" fill="${acento}" text-anchor="middle">MANGAVIEW</text>
  <title>${tituloSeguro}</title>
</svg>`;
};

/** Nombre de archivo amigable para guardar la portada en disco. */
const slugPortada = (titulo) => String(titulo || 'manga')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'manga';

module.exports = {
  generarPortadaSVG,
  paletaDe,
  escaparXML,
  inicialDe,
  slugPortada,
  hashTitulo,
  PALETAS,
  PALETA_POR_DEFECTO
};

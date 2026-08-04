/**
 * Generación de portadas de manga como SVG.
 *
 * Esta lógica vivía dentro de backend/src/index.js, mezclada con el arranque de
 * la aplicación. Al extraerla queda como una función pura —mismo título, mismo
 * SVG— que se puede probar de forma unitaria sin levantar el servidor.
 */

const PALETAS = {
  'Naruto': ['#FF6B00', '#FFD700'],
  'One Piece': ['#1a1a8c', '#FF4444'],
  'Attack on Titan': ['#2c2c2c', '#8B0000'],
  'Death Note': ['#0a0a0a', '#DDDDDD'],
  'Dragon Ball': ['#FF8C00', '#FFD700'],
  'Demon Slayer': ['#1a0a2e', '#9B59B6'],
  'My Hero Academia': ['#003087', '#FF0000'],
  'Fullmetal Alchemist': ['#8B4513', '#DAA520']
};

const PALETA_POR_DEFECTO = ['#1a1a2e', '#e94560'];

const paletaDe = (titulo) => PALETAS[titulo] || PALETA_POR_DEFECTO;

/**
 * El título llega desde la URL, así que puede contener cualquier cosa. Como la
 * respuesta se sirve con Content-Type image/svg+xml y un SVG abierto de forma
 * directa en el navegador puede ejecutar scripts, hay que escapar los
 * caracteres especiales de XML antes de incrustarlo en el documento.
 */
const escaparXML = (texto) => String(texto)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const inicialDe = (titulo) => (titulo ? titulo.trim().charAt(0).toUpperCase() : '?');

const generarPortadaSVG = (titulo) => {
  const [fondo, acento] = paletaDe(titulo);
  const tituloSeguro = escaparXML(titulo);
  const inicial = escaparXML(inicialDe(titulo));

  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280">
    <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${fondo}"/>
      <stop offset="100%" style="stop-color:${acento}33"/>
    </linearGradient></defs>
    <rect width="200" height="280" fill="url(#g)"/>
    <rect x="0" y="0" width="6" height="280" fill="${acento}"/>
    <rect x="0" y="220" width="200" height="60" fill="${acento}22"/>
    <text x="100" y="130" font-family="Arial Black" font-size="72" font-weight="900" fill="${acento}33" text-anchor="middle">${inicial}</text>
    <text x="100" y="245" font-family="Arial" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">${tituloSeguro}</text>
    <text x="100" y="265" font-family="Arial" font-size="10" fill="${acento}" text-anchor="middle">MANGA</text>
  </svg>`;
};

module.exports = { generarPortadaSVG, paletaDe, escaparXML, inicialDe, PALETAS, PALETA_POR_DEFECTO };

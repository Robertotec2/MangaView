/**
 * Generación de páginas de manga como SVG.
 *
 * Las páginas de la demo apuntaban a `via.placeholder.com`, un servicio externo
 * que dejó de responder, así que el lector no podía mostrar nada. Se aplica la
 * misma decisión que ya se había tomado para las portadas: generar la imagen en
 * el propio servidor. Es la única estrategia que funciona en un clon nuevo sin
 * red, sin archivos binarios versionados y sin pasos manuales.
 *
 * Como en el servicio de portadas, la generación es una función pura: mismas
 * entradas, mismo SVG, y por tanto se puede probar sin levantar el servidor.
 */

const { paletaDe, escaparXML } = require('./cover.service');

const ANCHO = 800;
const ALTO = 1200;

/**
 * Distribuciones de viñetas. Se eligen de forma determinista a partir del número
 * de página para que la maqueta no cambie entre recargas, y para que dos páginas
 * seguidas no se vean idénticas.
 *
 * Cada viñeta es [x, y, ancho, alto] en coordenadas del lienzo.
 */
const MAQUETAS = [
  [[60, 80, 680, 420], [60, 530, 320, 300], [420, 530, 320, 300], [60, 860, 680, 260]],
  [[60, 80, 680, 300], [60, 410, 680, 300], [60, 740, 680, 380]],
  [[60, 80, 320, 500], [420, 80, 320, 500], [60, 610, 680, 510]],
  [[60, 80, 680, 640], [60, 750, 320, 370], [420, 750, 320, 370]]
];

const maquetaDe = (orden) => MAQUETAS[(Math.max(1, orden) - 1) % MAQUETAS.length];

/**
 * El título y el número de capítulo se incrustan en el documento SVG, que se
 * sirve con Content-Type image/svg+xml. Un SVG abierto de forma directa en el
 * navegador puede ejecutar scripts, así que todo lo que venga de la URL se
 * escapa antes de interpolarlo.
 */
const generarPaginaSVG = (titulo, numeroCapitulo, orden, totalPaginas) => {
  const [fondo, acento] = paletaDe(titulo);
  const tituloSeguro = escaparXML(titulo);
  const capituloSeguro = escaparXML(numeroCapitulo);
  const ordenSeguro = escaparXML(orden);
  const pieDePagina = totalPaginas
    ? `${ordenSeguro} / ${escaparXML(totalPaginas)}`
    : ordenSeguro;

  // Mayonaka Heart Tune usa un papel de noche para que los paneles encajen
  // con la portada (radio a medianoche) en lugar del crema generico.
  const nocturna = titulo === 'Mayonaka Heart Tune';
  const papel = nocturna ? '#141228' : '#f4f1ea';
  const tinta = nocturna ? '#f0e6ff' : '#333333';
  const tintaSuave = nocturna ? '#a898c8' : '#777777';
  const tintaPie = nocturna ? '#7a6a9a' : '#999999';
  const rellenoVineta = nocturna ? '#1f1a38' : '#ffffff';
  const bordeVineta = nocturna ? '#ff6b9d' : '#111111';

  const vinetas = maquetaDe(Number(orden) || 1)
    .map(([x, y, ancho, alto], indice) => `
    <rect x="${x}" y="${y}" width="${ancho}" height="${alto}" fill="${rellenoVineta}" stroke="${bordeVineta}" stroke-width="4" rx="4"/>
    <rect x="${x}" y="${y}" width="${ancho}" height="${alto}" fill="${fondo}" fill-opacity="${nocturna ? '0.25' : '0.10'}" rx="4"/>
    <rect x="${x}" y="${y}" width="${ancho}" height="${alto}" fill="url(#vineta)" rx="4"/>
    <text x="${x + ancho / 2}" y="${y + alto / 2}" font-family="Arial Black" font-size="${Math.round(Math.min(ancho, alto) / 3)}" font-weight="900" fill="${acento}" fill-opacity="0.22" text-anchor="middle" dominant-baseline="middle">${indice + 1}</text>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ANCHO}" height="${ALTO}" viewBox="0 0 ${ANCHO} ${ALTO}">
    <defs>
      <linearGradient id="vineta" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${acento}18"/>
        <stop offset="100%" style="stop-color:${fondo}00"/>
      </linearGradient>
    </defs>
    <rect width="${ANCHO}" height="${ALTO}" fill="${papel}"/>
    <text x="60" y="52" font-family="Arial" font-size="20" font-weight="bold" fill="${tinta}">${tituloSeguro}</text>
    <text x="${ANCHO - 60}" y="52" font-family="Arial" font-size="18" fill="${tintaSuave}" text-anchor="end">Capitulo ${capituloSeguro}</text>
    <line x1="60" y1="64" x2="${ANCHO - 60}" y2="64" stroke="${acento}" stroke-width="2"/>${vinetas}
    <text x="${ANCHO / 2}" y="${ALTO - 24}" font-family="Arial" font-size="18" fill="${tintaPie}" text-anchor="middle">${pieDePagina}</text>
  </svg>`;
};

module.exports = { generarPaginaSVG, maquetaDe, MAQUETAS, ANCHO, ALTO };

/**
 * Datos de demostración de MangaView.
 *
 * El orden del arreglo es significativo: `frontend/index.html` indexa su
 * diccionario MANGA_EXTRA por el id numérico del manga, así que sobre una base
 * de datos vacía este orden es el que hace que cada ficha muestre los metadatos
 * que le corresponden. Ese acoplamiento está registrado como deuda técnica.
 */

const MANGAS = [
  {
    titulo: 'Naruto',
    autor: 'Masashi Kishimoto',
    genero: 'Accion',
    estado: 'finalizado',
    sinopsis: 'Naruto Uzumaki es un joven ninja de la aldea de Konoha que carga con el zorro de nueve colas sellado en su interior y sueña con convertirse en Hokage',
    abreviatura: 'Naruto',
    capitulos: [
      { numero: 1, titulo: 'Uzumaki Naruto!!', fecha: '1999-09-21', paginas: 3 },
      { numero: 2, titulo: 'Konohamaru!!', fecha: '1999-09-28', paginas: 2 },
      { numero: 3, titulo: 'Sasuke Uchiha!!', fecha: '1999-10-05', paginas: 2 }
    ]
  },
  {
    titulo: 'One Piece',
    autor: 'Eiichiro Oda',
    genero: 'Aventura',
    estado: 'en_curso',
    sinopsis: 'Monkey D. Luffy zarpa en busca del tesoro legendario One Piece para convertirse en el Rey de los Piratas junto a su tripulacion',
    abreviatura: 'OnePiece',
    capitulos: [
      { numero: 1, titulo: 'Romance Dawn', fecha: '1997-07-22', paginas: 2 },
      { numero: 2, titulo: 'Ese chico Coby', fecha: '1997-07-29', paginas: 2 },
      { numero: 3, titulo: 'Morgan vs Luffy', fecha: '1997-08-05', paginas: 1 }
    ]
  },
  {
    titulo: 'Attack on Titan',
    autor: 'Hajime Isayama',
    genero: 'Accion',
    estado: 'finalizado',
    sinopsis: 'La humanidad sobrevive encerrada tras enormes murallas que la protegen de los titanes, hasta que una brecha lo cambia todo',
    abreviatura: 'AoT',
    capitulos: [
      { numero: 1, titulo: 'Hace 2000 anos', fecha: '2009-09-09', paginas: 2 },
      { numero: 2, titulo: 'Ese dia', fecha: '2009-10-09', paginas: 1 },
      { numero: 3, titulo: 'La noche de la graduacion', fecha: '2009-11-09', paginas: 1 }
    ]
  },
  {
    titulo: 'Death Note',
    autor: 'Tsugumi Ohba',
    genero: 'Suspenso',
    estado: 'finalizado',
    sinopsis: 'Un estudiante encuentra un cuaderno que mata a cualquier persona cuyo nombre se escriba en el',
    abreviatura: 'DeathNote',
    capitulos: []
  },
  {
    titulo: 'Dragon Ball',
    autor: 'Akira Toriyama',
    genero: 'Accion',
    estado: 'finalizado',
    sinopsis: 'Goku y sus amigos defienden la Tierra de enemigos cada vez mas poderosos en busca de las Dragon Balls',
    abreviatura: 'DragonBall',
    capitulos: []
  },
  {
    titulo: 'Demon Slayer',
    autor: 'Koyoharu Gotouge',
    genero: 'Accion',
    estado: 'finalizado',
    sinopsis: 'Tanjiro busca la cura para su hermana convertida en demonio mientras se convierte en cazador de demonios',
    abreviatura: 'DemonSlayer',
    capitulos: []
  },
  {
    titulo: 'My Hero Academia',
    autor: 'Kohei Horikoshi',
    genero: 'Accion',
    estado: 'en_curso',
    sinopsis: 'En un mundo donde la mayoria tiene superpoderes, un chico sin habilidades suena con convertirse en el mejor heroe',
    abreviatura: 'MHA',
    capitulos: []
  },
  {
    titulo: 'Fullmetal Alchemist',
    autor: 'Hiromu Arakawa',
    genero: 'Aventura',
    estado: 'finalizado',
    sinopsis: 'Dos hermanos buscan la piedra filosofal para recuperar sus cuerpos perdidos tras un experimento de alquimia fallido',
    abreviatura: 'FMA',
    capitulos: []
  }
];

/**
 * Ruta de la portada de un manga.
 *
 * Se apunta al endpoint que genera la imagen dentro del propio servidor en
 * lugar de a una URL externa o a un archivo en disco. Es la única estrategia
 * que funciona en un clon nuevo sin red y sin archivos binarios versionados.
 */
const rutaPortada = (titulo) => `/api/cover/${encodeURIComponent(titulo)}`;

/**
 * Ruta de una página de capítulo, generada de forma determinista a partir del
 * manga, el capítulo y el número de página.
 */
const rutaPagina = (abreviatura, numeroCapitulo, orden) =>
  `https://via.placeholder.com/800x1200/111111/eeeeee?text=${abreviatura}+C${numeroCapitulo}+P${orden}`;

module.exports = { MANGAS, rutaPortada, rutaPagina };

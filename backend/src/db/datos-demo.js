/**
 * Datos de demostración de MangaView.
 *
 * Las fechas de capítulos se calculan relativas a "hoy" para que la sección
 * Recientes del inicio muestre títulos con capítulos nuevos en cada demo.
 * Las portadas oficiales se resuelven vía AniList (datos-portadas.js); si falta
 * alguna, se usa el SVG local de /covers.
 */

const { slugPortada } = require('../services/cover.service');
const { PORTADAS_ANILIST } = require('./datos-portadas');

/** Fecha ISO (YYYY-MM-DD) restando días a la fecha actual. */
const haceDias = (dias) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - dias);
  return d.toISOString().slice(0, 10);
};

const portadaArchivo = (titulo) => `/covers/${slugPortada(titulo)}.svg`;

/** Capítulos de demo: uno o más, con fechas relativas. */
const caps = (...items) => items.map(([numero, titulo, dias, paginas = 2]) => ({
  numero,
  titulo,
  fecha: haceDias(dias),
  paginas
}));

const MANGAS = [
  {
    titulo: 'Naruto',
    autor: 'Masashi Kishimoto',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Naruto Uzumaki es un joven ninja de la aldea de Konoha que carga con el zorro de nueve colas sellado en su interior y sueña con convertirse en Hokage',
    capitulos: caps([1, 'Uzumaki Naruto!!', 40, 3], [2, 'Konohamaru!!', 33, 2], [3, 'Sasuke Uchiha!!', 26, 2])
  },
  {
    titulo: 'One Piece',
    autor: 'Eiichiro Oda',
    genero: 'Aventura',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Monkey D. Luffy zarpa en busca del tesoro legendario One Piece para convertirse en el Rey de los Piratas junto a su tripulacion',
    capitulos: caps([1, 'Romance Dawn', 14, 2], [2, 'Ese chico Coby', 7, 2], [3, 'Morgan vs Luffy', 0, 1])
  },
  {
    titulo: 'Attack on Titan',
    autor: 'Hajime Isayama',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'La humanidad sobrevive encerrada tras enormes murallas que la protegen de los titanes, hasta que una brecha lo cambia todo',
    capitulos: caps([1, 'Hace 2000 anos', 21, 2], [2, 'Ese dia', 14, 1], [3, 'La noche de la graduacion', 2, 1])
  },
  {
    titulo: 'Death Note',
    autor: 'Tsugumi Ohba',
    genero: 'Suspenso',
    demografia: 'seinen',
    estado: 'finalizado',
    sinopsis: 'Un estudiante encuentra un cuaderno que mata a cualquier persona cuyo nombre se escriba en el',
    capitulos: caps([1, 'Aburrimiento', 18, 2], [2, 'L', 11, 2])
  },
  {
    titulo: 'Dragon Ball',
    autor: 'Akira Toriyama',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Goku y sus amigos defienden la Tierra de enemigos cada vez mas poderosos en busca de las Dragon Balls',
    capitulos: caps([1, 'Bulma y Son Goku', 45, 2])
  },
  {
    titulo: 'Demon Slayer',
    autor: 'Koyoharu Gotouge',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Tanjiro busca la cura para su hermana convertida en demonio mientras se convierte en cazador de demonios',
    capitulos: caps([1, 'Crueldad', 9, 2], [2, 'Un desconocido', 1, 2])
  },
  {
    titulo: 'My Hero Academia',
    autor: 'Kohei Horikoshi',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'En un mundo donde la mayoria tiene superpoderes, un chico sin habilidades suena con convertirse en el mejor heroe',
    capitulos: caps([1, 'Izuku Midoriya: Origen', 6, 2], [2, 'Lo que se necesita para ser un heroe', 0, 2])
  },
  {
    titulo: 'Fullmetal Alchemist',
    autor: 'Hiromu Arakawa',
    genero: 'Aventura',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Dos hermanos buscan la piedra filosofal para recuperar sus cuerpos perdidos tras un experimento de alquimia fallido',
    capitulos: caps([1, 'El alquimista de acero', 28, 2])
  },
  {
    titulo: 'Mayonaka Heart Tune',
    autor: 'Masakuni Igarashi',
    genero: 'Romance',
    demografia: 'shoujo',
    estado: 'en_curso',
    sinopsis: 'Arisu Yamabuki busca a Apollo, la voz de radio que lo acompañaba por las noches. Al transferirse a un nuevo instituto descubre que puede ser cualquiera de las chicas del club de radiodifusion',
    capitulos: caps([1, 'La voz de medianoche', 5, 4], [2, 'Club de radiodifusion', 2, 3], [3, '¿Quien es Apollo?', 0, 3])
  },

  // --- 30 títulos adicionales ---
  {
    titulo: 'Jujutsu Kaisen',
    autor: 'Gege Akutami',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Yuji Itadori traga un dedo maldito y entra al mundo de la hechiceria para exorcizar maldiciones',
    capitulos: caps([1, 'Ryomen Sukuna', 3, 2], [2, 'Por mi misma cuenta', 0, 2])
  },
  {
    titulo: 'Chainsaw Man',
    autor: 'Tatsuki Fujimoto',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Denji se fusiona con su demonio sierra y caza demonios para sobrevivir en un mundo brutal',
    capitulos: caps([1, 'Perro y motosierra', 4, 2], [2, 'La llegada a Tokyo', 1, 2])
  },
  {
    titulo: 'Spy x Family',
    autor: 'Tatsuya Endo',
    genero: 'Comedia',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Un espia, una asesina y una telepata forman una familia falsa sin saber los secretos de los demas',
    capitulos: caps([1, 'Mision 1', 8, 2], [2, 'Examen de admision', 2, 2])
  },
  {
    titulo: 'Bleach',
    autor: 'Tite Kubo',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Ichigo Kurosaki obtiene poderes de Shinigami y protege a los vivos de los hollows',
    capitulos: caps([1, 'Death and Strawberry', 30, 2])
  },
  {
    titulo: 'Hunter x Hunter',
    autor: 'Yoshihiro Togashi',
    genero: 'Aventura',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Gon Freecss busca a su padre convirtiendose en Hunter y enfrentando pruebas imposibles',
    capitulos: caps([1, 'El dia de la partida', 12, 2], [2, 'Una prueba inesperada', 5, 2])
  },
  {
    titulo: 'Tokyo Ghoul',
    autor: 'Sui Ishida',
    genero: 'Horror',
    demografia: 'seinen',
    estado: 'finalizado',
    sinopsis: 'Kaneki se convierte a medias en ghoul y debe vivir entre humanos y depredadores',
    capitulos: caps([1, 'Tragedia', 22, 2])
  },
  {
    titulo: 'Haikyuu!!',
    autor: 'Haruichi Furudate',
    genero: 'Deportes',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Hinata sueña con ser el as del voleibol pese a su baja estatura y forma equipo con su rival',
    capitulos: caps([1, 'Fin y comienzo', 16, 2])
  },
  {
    titulo: 'Black Clover',
    autor: 'Yuki Tabata',
    genero: 'Fantasia',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Asta, sin magia, aspira a ser el Rey Mago junto a su rival Yuno',
    capitulos: caps([1, 'El chico sin magia', 10, 2], [2, 'El grimorio', 3, 2])
  },
  {
    titulo: 'Fairy Tail',
    autor: 'Hiro Mashima',
    genero: 'Fantasia',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Lucy se une al gremio Fairy Tail y vive aventuras con Natsu y Happy',
    capitulos: caps([1, 'Fairy Tail', 35, 2])
  },
  {
    titulo: "JoJo's Bizarre Adventure",
    autor: 'Hirohiko Araki',
    genero: 'Aventura',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'La saga de la familia Joestar y sus enfrentamientos con poderes sobrenaturales a traves de generaciones',
    capitulos: caps([1, 'Dio Brando', 20, 2], [2, 'Una carta del pasado', 9, 2])
  },
  {
    titulo: 'Berserk',
    autor: 'Kentaro Miura',
    genero: 'Fantasia',
    demografia: 'seinen',
    estado: 'en_curso',
    sinopsis: 'Guts, el Espadachin Negro, sobrevive en un mundo oscuro marcado por la traicion y los apostoles',
    capitulos: caps([1, 'Espadachin Negro', 25, 2])
  },
  {
    titulo: 'Vinland Saga',
    autor: 'Makoto Yukimura',
    genero: 'Historico',
    demografia: 'seinen',
    estado: 'en_curso',
    sinopsis: 'Thorfinn busca venganza entre vikingos y descubre un camino distinto a la violencia',
    capitulos: caps([1, 'Normanni', 15, 2], [2, 'En algun lugar no aqui', 6, 2])
  },
  {
    titulo: 'Mob Psycho 100',
    autor: 'ONE',
    genero: 'Comedia',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Un esper adolescente intenta una vida normal mientras su poder amenaza con desbordarse',
    capitulos: caps([1, 'El chico psychic', 19, 2])
  },
  {
    titulo: 'One Punch Man',
    autor: 'ONE',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Saitama derrota a cualquier enemigo de un solo golpe y busca un desafio real',
    capitulos: caps([1, 'El hombre mas fuerte', 7, 2], [2, 'El cyborg solitario', 0, 2])
  },
  {
    titulo: 'Solo Leveling',
    autor: 'Chugong',
    genero: 'Fantasia',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Sung Jinwoo, el cazador mas debil, obtiene un sistema que le permite subir de nivel sin limites',
    capitulos: caps([1, 'E-rank', 11, 2], [2, 'El sistema', 4, 2])
  },
  {
    titulo: 'The Promised Neverland',
    autor: 'Kaiu Shirai',
    genero: 'Suspense',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Ninos de un orfanato descubren la terrible verdad tras su hogar y planean escapar',
    capitulos: caps([1, 'Grace Field House', 27, 2])
  },
  {
    titulo: 'Blue Lock',
    autor: 'Muneyuki Kaneshiro',
    genero: 'Deportes',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Un proyecto extremo busca al egoista definitivo para llevar a Japon al Mundial',
    capitulos: caps([1, 'Sueno', 5, 2], [2, 'Entrando a Blue Lock', 1, 2])
  },
  {
    titulo: 'Sakamoto Days',
    autor: 'Yuto Suzuki',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'El asesino legendario Sakamoto se retira a llevar una tienda de conveniencia con su familia',
    capitulos: caps([1, 'El legendario asesino', 8, 2])
  },
  {
    titulo: 'Dandadan',
    autor: 'Yukinobu Tatsu',
    genero: 'Sobrenatural',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Momo y Okarun se enfrentan a fantasmas y aliens mientras crece su improbable vinculo',
    capitulos: caps([1, 'Asi es como el amor empieza', 2, 2], [2, 'Turbo abuela', 0, 2])
  },
  {
    titulo: 'Frieren',
    autor: 'Kanehito Yamada',
    genero: 'Fantasia',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Tras derrotar al Rey Demonio, la elfa Frieren reflexiona sobre el tiempo y los recuerdos',
    capitulos: caps([1, 'El final de la aventura', 13, 2], [2, 'La maga que mato al Rey Demonio', 6, 2])
  },
  {
    titulo: 'Bocchi the Rock!',
    autor: 'Aki Hamaji',
    genero: 'Comedia',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Hitori Gotoh, una guitarrista timida, se une a una banda y enfrenta su ansiedad social',
    capitulos: caps([1, 'Bocchi', 17, 2])
  },
  {
    titulo: "Komi Can't Communicate",
    autor: 'Tomohito Oda',
    genero: 'Comedia',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Komi es popular pero no puede hablar; Tadano la ayuda a hacer 100 amigos',
    capitulos: caps([1, 'Una chica de otro planeta', 24, 2])
  },
  {
    titulo: 'Horimiya',
    autor: 'HERO',
    genero: 'Romance',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Hori y Miyamura descubren las caras ocultas del otro y se enamoran en el instituto',
    capitulos: caps([1, 'Una chica sencilla', 29, 2])
  },
  {
    titulo: 'Fruits Basket',
    autor: 'Natsuki Takaya',
    genero: 'Romance',
    demografia: 'shoujo',
    estado: 'finalizado',
    sinopsis: 'Tohru vive con la familia Soma, maldita a transformarse en animales del zodiaco chino',
    capitulos: caps([1, 'El zodiaco', 31, 2])
  },
  {
    titulo: 'Sailor Moon',
    autor: 'Naoko Takeuchi',
    genero: 'Fantasia',
    demografia: 'shoujo',
    estado: 'finalizado',
    sinopsis: 'Usagi Tsukino despierta como Sailor Moon para proteger la Tierra junto a las Sailor Guardians',
    capitulos: caps([1, 'Usagi - Sailor Moon', 38, 2])
  },
  {
    titulo: 'Neon Genesis Evangelion',
    autor: 'Yoshiyuki Sadamoto',
    genero: 'Mecha',
    demografia: 'seinen',
    estado: 'finalizado',
    sinopsis: 'Shinji Ikari pilota un Eva para enfrentar a los Angeles en un Tokio devastado',
    capitulos: caps([1, 'Angel Attack', 33, 2])
  },
  {
    titulo: 'Cowboy Bebop',
    autor: 'Yutaka Nanten',
    genero: 'Ciencia Ficcion',
    demografia: 'seinen',
    estado: 'finalizado',
    sinopsis: 'Cazarrecompensas a bordo del Bebop saltan entre planetas al ritmo del jazz',
    capitulos: caps([1, 'Asteroid Blues', 36, 2])
  },
  {
    titulo: 'Steins;Gate',
    autor: 'Sarachi Yomi',
    genero: 'Ciencia Ficcion',
    demografia: 'seinen',
    estado: 'finalizado',
    sinopsis: 'Okabe y su laboratorio descubren que pueden enviar mensajes al pasado',
    capitulos: caps([1, 'Prologo del caos', 23, 2])
  },
  {
    titulo: 'Code Geass',
    autor: 'Goro Taniguchi',
    genero: 'Mecha',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Lelouch obtiene el Geass y lidera una rebelion contra el Imperio de Britannia',
    capitulos: caps([1, 'El dia que nacio un demonio', 26, 2])
  },
  {
    titulo: 'Sword Art Online',
    autor: 'Reki Kawahara',
    genero: 'Fantasia',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Jugadores quedan atrapados en un VRMMO donde morir en el juego significa morir de verdad',
    capitulos: caps([1, 'El mundo de las espadas', 14, 2], [2, 'El boss del piso 1', 7, 2])
  },
  {
    titulo: 'Kaguya-sama: Love is War',
    autor: 'Aka Akasaka',
    genero: 'Romance',
    demografia: 'seinen',
    estado: 'finalizado',
    sinopsis: 'Kaguya y Miyuki, genios del consejo estudiantil, pelean por hacer que el otro confiese primero',
    capitulos: caps([1, 'Te amare', 12, 2], [2, 'Quiero que me invites a cine', 6, 2])
  },
  {
    titulo: 'Oshi no Ko',
    autor: 'Aka Akasaka',
    genero: 'Drama',
    demografia: 'seinen',
    estado: 'en_curso',
    sinopsis: 'Un medico y su paciente renacen como hijos de una idol y revelan la oscuridad del showbiz',
    capitulos: caps([1, 'Madre e hijo', 10, 2], [2, 'Showbiz', 4, 2])
  },
  {
    titulo: 'Dr. Stone',
    autor: 'Riichiro Inagaki',
    genero: 'Ciencia Ficcion',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Tras miles de anos petrificado, Senku revive la civilizacion con ciencia pura',
    capitulos: caps([1, 'Stone World', 16, 2], [2, 'El reino de la ciencia', 8, 2])
  },
  {
    titulo: 'Assassination Classroom',
    autor: 'Yusei Matsui',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'La clase 3-E debe asesinar a su maestro alienigena antes de que destruya la Tierra',
    capitulos: caps([1, 'Hora de asesinar', 18, 2])
  },
  {
    titulo: 'The Apothecary Diaries',
    autor: 'Natsu Hyuuga',
    genero: 'Misterio',
    demografia: 'josei',
    estado: 'en_curso',
    sinopsis: 'Maomao, una joven boticaria, resuelve misterios en la corte imperial china',
    capitulos: caps([1, 'La boticaria', 15, 2], [2, 'Veneno', 5, 2])
  },
  {
    titulo: 'Gintama',
    autor: 'Hideaki Sorachi',
    genero: 'Comedia',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Gintoki y su banda de odd jobs sobreviven en un Edo invadido por aliens',
    capitulos: caps([1, 'Naturalmente rizado', 20, 2])
  },
  {
    titulo: 'Noragami',
    autor: 'Adachitoka',
    genero: 'Fantasia',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Yato, un dios menor sin santuario, busca fama con la ayuda de Hiyori y Yukine',
    capitulos: caps([1, 'El dios callejero', 14, 2], [2, 'Regalia', 7, 2])
  },
  {
    titulo: 'Soul Eater',
    autor: 'Atsushi Ohkubo',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'finalizado',
    sinopsis: 'Estudiantes de la Shibusen convierten sus armas en Death Scythes recolectando almas',
    capitulos: caps([1, 'Soul Eater', 19, 2])
  },
  {
    titulo: 'Lookism',
    autor: 'Park Tae-joon',
    genero: 'Drama',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Daniel Park despierta en un cuerpo atractivo y descubre el poder y la crueldad de la apariencia',
    capitulos: caps([1, 'Lookism', 11, 2], [2, 'Dos cuerpos', 3, 2])
  },
  {
    titulo: 'Wind Breaker',
    autor: 'Satoru Nii',
    genero: 'Accion',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Haruka Sakura entra a Furin High, una escuela de delinquentes que protege su ciudad',
    capitulos: caps([1, 'Sakura', 13, 2], [2, 'Furin', 5, 2])
  },
  {
    titulo: 'Mushoku Tensei',
    autor: 'Rifujin na Magonote',
    genero: 'Fantasia',
    demografia: 'shounen',
    estado: 'en_curso',
    sinopsis: 'Un hombre renace como Rudeus Greyrat en un mundo de magia y decide vivir sin arrepentimientos',
    capitulos: caps([1, 'Un segundo comienzo', 17, 2], [2, 'Magia', 9, 2])
  }
].map((manga) => ({
  ...manga,
  // Preferir portada oficial de AniList (vol. 1 / cover de catálogo).
  portada: PORTADAS_ANILIST[manga.titulo] || manga.portada || portadaArchivo(manga.titulo)
}));

/**
 * Ruta de la portada generada por la API (alternativa al archivo estatico).
 */
const rutaPortada = (titulo) => `/api/cover/${encodeURIComponent(titulo)}`;

/** Usa la portada propia del manga si la trae; si no, la generada por el servidor. */
const portadaDe = (manga) => manga.portada || rutaPortada(manga.titulo);

/**
 * Ruta de una página de capítulo.
 */
const rutaPagina = (titulo, capitulo, orden, total) =>
  `/api/page/${encodeURIComponent(titulo)}/${capitulo}/${orden}?total=${total}`;

module.exports = { MANGAS, rutaPortada, rutaPagina, portadaDe, haceDias, portadaArchivo };

/**
 * Datos de demostración del foro.
 *
 * Sobre los cinco temas: tres los pedía el alcance —discusiones,
 * recomendaciones y noticias— y los otros dos se eligieron por lo que necesita
 * una comunidad de lectura de manga en concreto.
 *
 * "Spoilers" existe porque en un sitio donde la gente va por capítulos
 * distintos, el destrozo de una trama es el motivo más común por el que alguien
 * abandona un foro; separarlo permite hablar de lo último sin arruinárselo a
 * quien va atrasado. "Ayuda y soporte" separa las dudas sobre la plataforma de
 * las conversaciones sobre manga, que si no acaban mezcladas en Discusiones.
 *
 * Se descartó un tema de fan art: la plataforma no tiene subida de imágenes
 * —Cloudinary sigue configurado y sin usar—, así que habría sido un tablón de
 * texto sobre dibujos, que es justo lo que nadie quiere.
 */

const TEMAS = [
  {
    slug: 'discusiones',
    nombre: 'Discusiones',
    descripcion: 'Conversaciones abiertas sobre cualquier serie del catalogo',
    icono: '💬',
    orden: 1
  },
  {
    slug: 'recomendaciones',
    nombre: 'Recomendaciones',
    descripcion: 'Pide y comparte titulos segun lo que te gusta leer',
    icono: '⭐',
    orden: 2
  },
  {
    slug: 'noticias',
    nombre: 'Noticias',
    descripcion: 'Anuncios, lanzamientos y novedades del mundo del manga',
    icono: '📰',
    orden: 3
  },
  {
    slug: 'spoilers',
    nombre: 'Spoilers',
    descripcion: 'Comenta los capitulos recientes sin arruinarselos a nadie',
    icono: '🚧',
    orden: 4
  },
  {
    slug: 'ayuda',
    nombre: 'Ayuda y soporte',
    descripcion: 'Dudas sobre como usar MangaView y reportes de problemas',
    icono: '🛟',
    orden: 5
  }
];

/**
 * Cuentas de demostración. Existen para que el foro no se vea vacío en la demo
 * y comparten la misma contraseña, documentada en el README. No son cuentas de
 * uso real y por eso usan un dominio que no existe.
 */
const PASSWORD_DEMO = 'demo1234';

const USUARIOS_DEMO = [
  { nombre: 'Akira', correo: 'akira@demo.mangaview' },
  { nombre: 'Yuki', correo: 'yuki@demo.mangaview' },
  { nombre: 'Camila', correo: 'camila@demo.mangaview' },
  { nombre: 'Diego', correo: 'diego@demo.mangaview' },
  { nombre: 'Sofia', correo: 'sofia@demo.mangaview' },
  { nombre: 'Mateo', correo: 'mateo@demo.mangaview' },
  { nombre: 'Renata', correo: 'renata@demo.mangaview' },
  { nombre: 'Bruno', correo: 'bruno@demo.mangaview' }
];

/**
 * Publicaciones de ejemplo. `autor`, y los índices dentro de `reacciones`,
 * apuntan a posiciones de USUARIOS_DEMO. `vistas` es la cantidad de personas
 * distintas que se simulan como visitantes.
 */
const PUBLICACIONES = [
  {
    tema: 'discusiones',
    autor: 0,
    titulo: '¿Por que Attack on Titan sigue dividiendo tanto a la gente?',
    cuerpo: 'Lo termine hace poco y me sorprende la cantidad de lecturas distintas que tiene. Hay quien lo ve como una historia sobre la libertad y quien lo ve como una tragedia sobre el ciclo del odio. Las dos se sostienen con lo que pasa en pagina. ¿Ustedes con cual se quedan?',
    vistas: 47,
    reacciones: { like: [1, 2, 3, 4, 6], dislike: [] },
    comentarios: [
      { autor: 2, cuerpo: 'Para mi el tema central es que nadie decide donde nace, y todo lo demas sale de ahi.' },
      { autor: 4, cuerpo: 'Yo lo lei como una tragedia clasica. El final me parecio coherente aunque duela.' },
      { autor: 1, cuerpo: 'Lo que mas me gusta es que no te da una respuesta masticada. Te obliga a elegir.' }
    ]
  },
  {
    tema: 'discusiones',
    autor: 3,
    titulo: 'Dragon Ball envejecio mejor de lo que esperaba',
    cuerpo: 'Volvi a leerlo despues de anos pensando que me iba a parecer lento y resulto lo contrario. El ritmo de los primeros arcos es comodo y el dibujo de las peleas se entiende siempre, cosa que no puedo decir de series mas nuevas.',
    vistas: 31,
    reacciones: { like: [0, 5, 7], dislike: [2] },
    comentarios: [
      { autor: 5, cuerpo: 'Toriyama tenia una claridad para componer una pagina que casi nadie iguala.' },
      { autor: 7, cuerpo: 'Coincido, aunque los arcos finales se me hacen mas pesados que el resto.' }
    ]
  },
  {
    tema: 'recomendaciones',
    autor: 1,
    titulo: 'Busco algo parecido a Death Note pero mas corto',
    cuerpo: 'Me gusto muchisimo la tension de Death Note, ese ida y vuelta de dos personas inteligentes midiendose. El problema es que ahora tengo poco tiempo y busco algo que se lea en pocos tomos. ¿Alguna sugerencia?',
    vistas: 58,
    reacciones: { like: [0, 2, 3, 4, 5, 6], dislike: [] },
    comentarios: [
      { autor: 6, cuerpo: 'Si lo que buscas es el duelo mental mas que lo sobrenatural, cualquier thriller de detectives corto te va a funcionar.' },
      { autor: 0, cuerpo: 'Ojo con los que empiezan bien y se estiran. Fijate siempre en el numero de tomos antes de engancharte.' },
      { autor: 3, cuerpo: 'Fullmetal Alchemist no es corto pero no tiene relleno, si eso te sirve.' },
      { autor: 4, cuerpo: 'Apoyo lo de Fullmetal. Es largo pero nunca se siente estirado.' }
    ]
  },
  {
    tema: 'recomendaciones',
    autor: 4,
    titulo: 'Por donde empezar si nunca lei manga',
    cuerpo: 'Un amigo quiere empezar y no se que decirle. Creo que lo mejor es algo con capitulos cortos y una historia que enganche rapido, mas que un clasico de cincuenta tomos. ¿Que le recomendarian ustedes para no espantarlo?',
    vistas: 72,
    reacciones: { like: [0, 1, 2, 5, 6, 7], dislike: [3] },
    comentarios: [
      { autor: 7, cuerpo: 'Yo empezaria por algo autoconclusivo. Terminar una historia completa engancha mas que dejar algo a medias.' },
      { autor: 2, cuerpo: 'Y explicarle que se lee de derecha a izquierda, que suena obvio y no lo es.' }
    ]
  },
  {
    tema: 'noticias',
    autor: 2,
    titulo: 'MangaView ya genera sus propias portadas',
    cuerpo: 'Aviso para quien tuviera el catalogo con las imagenes rotas: las portadas ahora las genera el propio servidor, asi que ya no dependen de un servicio externo. Si te seguian saliendo en blanco, recarga con Ctrl+F5 para saltarte la cache del navegador.',
    vistas: 96,
    reacciones: { like: [0, 1, 3, 4, 5, 6, 7], dislike: [] },
    comentarios: [
      { autor: 5, cuerpo: 'Confirmado, ya se ven todas. Gracias por avisar.' },
      { autor: 1, cuerpo: 'A mi me seguian saliendo rotas hasta que forze la recarga. Era la cache.' }
    ]
  },
  {
    tema: 'noticias',
    autor: 6,
    titulo: 'El lector ya muestra las paginas de los capitulos',
    cuerpo: 'Otra que estaba pendiente: el lector mostraba un recuadro con el numero de pagina en lugar de la pagina. Ya esta corregido y ademas se puede navegar con las flechas del teclado.',
    vistas: 64,
    reacciones: { like: [0, 2, 3, 7], dislike: [] },
    comentarios: [
      { autor: 3, cuerpo: 'Lo de las flechas del teclado no lo sabia y es comodisimo.' }
    ]
  },
  {
    tema: 'spoilers',
    autor: 5,
    titulo: '[Spoilers] Hablemos del final de Fullmetal Alchemist',
    cuerpo: 'Aviso desde el titulo para que nadie entre por accidente. Lo que mas me gusta del cierre es que el precio que pagan los hermanos es coherente con la regla que la historia establecio en el primer capitulo. No aparece una solucion magica al final.',
    vistas: 38,
    reacciones: { like: [1, 3, 6], dislike: [] },
    comentarios: [
      { autor: 1, cuerpo: 'Justo eso. La historia se toma en serio sus propias reglas hasta el final.' },
      { autor: 6, cuerpo: 'Es de los pocos finales donde el sacrificio se siente ganado y no impuesto por el guion.' }
    ]
  },
  {
    tema: 'spoilers',
    autor: 7,
    titulo: '[Spoilers] Como usar este tema sin arruinarle la lectura a nadie',
    cuerpo: 'Propuesta sencilla para que el tema funcione: poner siempre en el titulo la serie y hasta que capitulo se habla. Asi cada quien decide si entra. Este tema existe precisamente para poder comentar lo ultimo sin tener que medirse en el resto del foro.',
    vistas: 41,
    reacciones: { like: [0, 1, 2, 4, 5], dislike: [] },
    comentarios: [
      { autor: 0, cuerpo: 'De acuerdo. Serie y capitulo en el titulo deberia ser la unica regla del tema.' },
      { autor: 4, cuerpo: 'Sumo: evitar detalles del final en la primera linea del cuerpo, que es lo que se alcanza a ver en el listado.' }
    ]
  },
  {
    tema: 'ayuda',
    autor: 3,
    titulo: '¿Se guarda por donde iba leyendo?',
    cuerpo: 'Estoy leyendo desde dos computadoras distintas y no se si la plataforma recuerda la pagina. ¿Hay que iniciar sesion para que funcione o se guarda igual sin cuenta?',
    vistas: 53,
    reacciones: { like: [2, 5], dislike: [] },
    comentarios: [
      { autor: 2, cuerpo: 'Hay que iniciar sesion. El progreso se guarda contra tu cuenta, no contra el navegador.' },
      { autor: 5, cuerpo: 'Sin cuenta puedes leer, pero al cerrar pierdes por donde ibas.' }
    ]
  },
  {
    tema: 'ayuda',
    autor: 0,
    titulo: 'No me aparecen los favoritos que marque',
    cuerpo: 'Marque varios titulos como favoritos y al volver a entrar no estaban. Despues me di cuenta de que se me habia cerrado la sesion. Lo dejo escrito por si le pasa a alguien mas: si el boton de favoritos no aparece en el menu, es que no hay sesion iniciada.',
    vistas: 29,
    reacciones: { like: [4, 6, 7], dislike: [] },
    comentarios: [
      { autor: 6, cuerpo: 'Me paso igual. El token dura siete dias y despues hay que volver a entrar.' }
    ]
  }
];

module.exports = { TEMAS, USUARIOS_DEMO, PUBLICACIONES, PASSWORD_DEMO };

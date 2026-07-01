require('dotenv').config();
const pool = require('./config/database');

async function setup() {
  await pool.query(`INSERT INTO mangas (titulo, autor, genero, sinopsis, portada_url, estado) VALUES
    ('Dragon Ball', 'Akira Toriyama', 'Accion', 'Goku y sus amigos defienden la Tierra de enemigos cada vez mas poderosos en busca de las Dragon Balls', 'https://upload.wikimedia.org/wikipedia/en/a/a2/Dragon_Ball_volume_1.jpg', 'finalizado'),
    ('Demon Slayer', 'Koyoharu Gotouge', 'Accion', 'Tanjiro busca la cura para su hermana convertida en demonio mientras se convierte en cazador de demonios', 'https://upload.wikimedia.org/wikipedia/en/6/6a/DemonSlayerMangaVolume1.png', 'finalizado'),
    ('My Hero Academia', 'Kohei Horikoshi', 'Accion', 'En un mundo donde la mayoria tiene superpoderes, un chico sin habilidades suena con convertirse en el mejor heroe', 'https://upload.wikimedia.org/wikipedia/en/4/4e/MyHeroAcademia_volume1.png', 'en_curso'),
    ('Death Note', 'Tsugumi Ohba', 'Suspenso', 'Un estudiante encuentra un cuaderno que mata a cualquier persona cuyo nombre se escriba en el', 'https://upload.wikimedia.org/wikipedia/en/3/37/Death_Note_volume_1.jpg', 'finalizado'),
    ('Fullmetal Alchemist', 'Hiromu Arakawa', 'Aventura', 'Dos hermanos buscan la piedra filosofal para recuperar sus cuerpos perdidos tras un experimento de alquimia fallido', 'https://upload.wikimedia.org/wikipedia/en/6/65/FullmetalAlchemistMangaVolume1.jpg', 'finalizado')
  `);
  console.log('Mangas agregados');
  process.exit();
}

setup().catch(e => { console.error(e.message); process.exit(1); });
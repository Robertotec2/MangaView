/**
 * Resuelve la portada oficial (volumen / cover de catálogo) de cada manga
 * vía la API pública de AniList y la guarda en src/db/datos-portadas.js.
 *
 * No descarga ni versiona los archivos: solo guarda la URL del CDN de AniList,
 * que es la misma imagen de portada que muestran los catálogos.
 *
 *   node scripts/fetch-portadas-anilist.js
 */

const fs = require('fs');
const path = require('path');
const { MANGAS } = require('../src/db/datos-demo');
const { PORTADAS_ANILIST: YA_RESUELTAS } = require('../src/db/datos-portadas');

const ENDPOINT = 'https://graphql.anilist.co';
const SALIDA = path.join(__dirname, '../src/db/datos-portadas.js');
const SOLO_FALTANTES = !process.argv.includes('--all');

/** Búsquedas alternativas cuando el título del demo no coincide con AniList. */
const ALIASES = {
  'Mayonaka Heart Tune': 'Tune In to the Midnight Heart',
  'Fullmetal Alchemist': 'Fullmetal Alchemist',
  'Attack on Titan': 'Shingeki no Kyojin',
  'Demon Slayer': 'Kimetsu no Yaiba',
  'My Hero Academia': 'Boku no Hero Academia',
  'Haikyuu!!': 'Haikyuu!!',
  "Komi Can't Communicate": 'Komi-san wa, Comyushou desu',
  'The Promised Neverland': 'Yakusoku no Neverland',
  'Solo Leveling': 'Solo Leveling',
  'Frieren': 'Sousou no Frieren',
  'Bocchi the Rock!': 'Bocchi the Rock!',
  'Spy x Family': 'Spy x Family',
  'Jujutsu Kaisen': 'Jujutsu Kaisen',
  'Chainsaw Man': 'Chainsaw Man',
  "JoJo's Bizarre Adventure": 'JoJo no Kimyou na Bouken Part 1 Phantom Blood',
  'One Punch Man': 'One Punch Man',
  'Mob Psycho 100': 'Mob Psycho 100',
  'Neon Genesis Evangelion': 'Neon Genesis Evangelion',
  'Sword Art Online': 'Sword Art Online',
  'Code Geass': 'Code Geass',
  'Cowboy Bebop': 'Cowboy Bebop',
  'Steins;Gate': 'Steins;Gate',
  'Fruits Basket': 'Fruits Basket',
  'Sailor Moon': 'Bishoujo Senshi Sailor Moon',
  'Horimiya': 'Horimiya',
  'Blue Lock': 'Blue Lock',
  'Sakamoto Days': 'Sakamoto Days',
  'Dandadan': 'Dandadan',
  'Vinland Saga': 'Vinland Saga',
  'Tokyo Ghoul': 'Tokyo Ghoul',
  'Black Clover': 'Black Clover',
  'Fairy Tail': 'Fairy Tail',
  'Berserk': 'Berserk',
  'Hunter x Hunter': 'Hunter x Hunter',
  'Bleach': 'Bleach',
  'Death Note': 'Death Note',
  'Dragon Ball': 'Dragon Ball',
  'Naruto': 'Naruto',
  'One Piece': 'One Piece',
  'Kaguya-sama: Love is War': 'Kaguya-sama wa Kokurasetai',
  'Oshi no Ko': 'Oshi no Ko',
  'Dr. Stone': 'Dr. STONE',
  'Assassination Classroom': 'Ansatsu Kyoushitsu',
  'The Apothecary Diaries': 'Kusuriya no Hitorigoto',
  'Gintama': 'Gintama',
  'Noragami': 'Noragami',
  'Soul Eater': 'Soul Eater',
  'Lookism': 'Lookism',
  'Wind Breaker': 'Wind Breaker',
  'Mushoku Tensei': 'Mushoku Tensei'
};

const QUERY = `
query ($search: String) {
  Page(page: 1, perPage: 8) {
    media(search: $search, type: MANGA, sort: POPULARITY_DESC) {
      id
      format
      title { romaji english native }
      coverImage { extraLarge large }
    }
  }
}`;

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function buscarPortada(titulo) {
  const search = ALIASES[titulo] || titulo;
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({ query: QUERY, variables: { search } })
  });

  if (!res.ok) {
    throw new Error(`AniList HTTP ${res.status} para "${titulo}"`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  const lista = json.data?.Page?.media || [];
  // Preferir manga/manhwa sobre novelas ligeras cuando sea posible.
  const elegido =
    lista.find((m) => m.format && m.format !== 'NOVEL') ||
    lista[0];

  const url = elegido?.coverImage?.extraLarge || elegido?.coverImage?.large || null;
  return {
    url,
    anilistId: elegido?.id || null,
    anilistTitle: elegido?.title?.english || elegido?.title?.romaji || null
  };
}

async function main() {
  const portadas = { ...YA_RESUELTAS };
  let ok = 0;
  let fallos = 0;
  let saltados = 0;

  for (const manga of MANGAS) {
    const titulo = manga.titulo;
    if (SOLO_FALTANTES && portadas[titulo] && titulo !== "JoJo's Bizarre Adventure") {
      saltados++;
      continue;
    }
    try {
      const info = await buscarPortada(titulo);
      if (!info.url) {
        console.warn(`Sin portada: ${titulo}`);
        fallos++;
      } else {
        portadas[titulo] = info.url;
        ok++;
        console.log(`OK  ${titulo} → ${info.anilistTitle}`);
      }
    } catch (err) {
      console.warn(`Error ${titulo}: ${err.message}`);
      fallos++;
      await dormir(4000);
    }
    // AniList pide no martillar la API.
    await dormir(1200);
  }
  console.log(`Saltados (ya tenían URL): ${saltados}`);

  const contenido = `/**
 * URLs de portadas oficiales resueltas con la API de AniList.
 *
 * Se regeneran con: node scripts/fetch-portadas-anilist.js
 * No se versionan los binarios: solo el enlace al CDN de AniList.
 */

const PORTADAS_ANILIST = ${JSON.stringify(portadas, null, 2)};

module.exports = { PORTADAS_ANILIST };
`;

  fs.writeFileSync(SALIDA, contenido, 'utf8');
  console.log(`\nGuardado ${ok} portadas (${fallos} fallos) en ${SALIDA}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

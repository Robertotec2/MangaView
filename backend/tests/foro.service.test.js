const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { crearForoService, calcularHuella } = require('../src/services/foro.service');
const { ErrorDeNegocio } = require('../src/utils/errores');

/**
 * Repositorio falso en memoria. El servicio se construye con sus dependencias
 * inyectadas, así que estas pruebas corren sin PostgreSQL y verifican las
 * reglas de negocio del foro y no el SQL.
 */
function repositorioFalso({ temas = ['discusiones'], publicaciones = {} } = {}) {
  const llamadas = { vistas: [], reacciones: [], comentarios: [], publicaciones: [] };

  return {
    llamadas,
    listarTemas: async () => temas.map((slug, i) => ({ id: i + 1, slug })),
    buscarTemaPorSlug: async (slug) =>
      (temas.includes(slug) ? { id: temas.indexOf(slug) + 1, slug } : null),
    listarPublicaciones: async (filtros) => {
      llamadas.filtros = filtros;
      return [];
    },
    buscarPublicacionPorId: async (id) => publicaciones[id] || null,
    crearPublicacion: async (datos) => {
      llamadas.publicaciones.push(datos);
      return { id: 99 };
    },
    listarComentarios: async (id) => [{ id: 1, cuerpo: 'Hola', autor: 'Akira', publicacion: id }],
    crearComentario: async (datos) => {
      llamadas.comentarios.push(datos);
      return { id: 7, cuerpo: datos.cuerpo };
    },
    buscarComentarioPorId: async (id) => ({
      id, cuerpo: 'Buen aporte', autor: 'Akira', publicacion_id: 1, padre_id: null, borrado: false
    }),
    registrarReaccion: async (datos) => {
      llamadas.reacciones.push(datos);
      return { reaccion: datos.valor };
    },
    buscarReaccion: async () => 1,
    registrarVista: async (id, huella) => {
      llamadas.vistas.push({ id, huella });
    }
  };
}

const publicacionDeEjemplo = {
  1: { id: 1, titulo: 'Hola', cuerpo: 'Cuerpo', comentarios: 3, likes: 5, dislikes: 1, vistas: 10 }
};

describe('listarPublicaciones', () => {
  test('un orden desconocido cae en el orden por defecto en lugar de fallar', async () => {
    // Arrange
    const repositorio = repositorioFalso();
    const servicio = crearForoService({ repositorio });

    // Act
    await servicio.listarPublicaciones({ orden: 'loquesea' });

    // Assert
    assert.equal(repositorio.llamadas.filtros.orden, 'recientes');
  });

  test('respeta el orden por popularidad cuando es valido', async () => {
    // Arrange
    const repositorio = repositorioFalso();
    const servicio = crearForoService({ repositorio });

    // Act
    await servicio.listarPublicaciones({ orden: 'populares' });

    // Assert
    assert.equal(repositorio.llamadas.filtros.orden, 'populares');
  });

  test('recorta los espacios del texto buscado', async () => {
    // Arrange
    const repositorio = repositorioFalso();
    const servicio = crearForoService({ repositorio });

    // Act
    await servicio.listarPublicaciones({ buscar: '   naruto   ' });

    // Assert
    assert.equal(repositorio.llamadas.filtros.busqueda, 'naruto');
  });

  test('avisa con un 404 cuando el tema no existe, en lugar de devolver una lista vacia', async () => {
    // Arrange
    const servicio = crearForoService({ repositorio: repositorioFalso() });

    // Act
    const fallo = await servicio.listarPublicaciones({ tema: 'inexistente' }).catch((e) => e);

    // Assert
    assert.ok(fallo instanceof ErrorDeNegocio);
    assert.equal(fallo.estado, 404);
  });
});

describe('obtenerPublicacion', () => {
  test('registra la vista del visitante antes de devolver la publicacion', async () => {
    // Arrange
    const repositorio = repositorioFalso({ publicaciones: publicacionDeEjemplo });
    const servicio = crearForoService({ repositorio });

    // Act
    await servicio.obtenerPublicacion(1, { usuarioId: 42 });

    // Assert
    assert.equal(repositorio.llamadas.vistas.length, 1);
    assert.deepEqual(repositorio.llamadas.vistas[0], { id: 1, huella: 'u:42' });
  });

  test('devuelve la lista de comentarios y el total por separado', async () => {
    // Arrange
    const repositorio = repositorioFalso({ publicaciones: publicacionDeEjemplo });
    const servicio = crearForoService({ repositorio });

    // Act
    const resultado = await servicio.obtenerPublicacion(1, {});

    // Assert
    assert.ok(Array.isArray(resultado.comentarios));
    assert.equal(resultado.total_comentarios, 3);
  });

  test('no consulta la reaccion propia cuando no hay sesion iniciada', async () => {
    // Arrange
    const repositorio = repositorioFalso({ publicaciones: publicacionDeEjemplo });
    const servicio = crearForoService({ repositorio });

    // Act
    const resultado = await servicio.obtenerPublicacion(1, {});

    // Assert
    assert.equal(resultado.mi_reaccion, null);
  });

  test('rechaza un identificador que no es un numero', async () => {
    // Arrange
    const servicio = crearForoService({ repositorio: repositorioFalso() });

    // Act
    const fallo = await servicio.obtenerPublicacion('abc', {}).catch((e) => e);

    // Assert
    assert.equal(fallo.estado, 400);
  });

  test('responde 404 cuando la publicacion no existe', async () => {
    // Arrange
    const servicio = crearForoService({ repositorio: repositorioFalso() });

    // Act
    const fallo = await servicio.obtenerPublicacion(1, {}).catch((e) => e);

    // Assert
    assert.equal(fallo.estado, 404);
  });
});

describe('crearPublicacion', () => {
  test('guarda el titulo y el cuerpo sin espacios sobrantes', async () => {
    // Arrange
    const repositorio = repositorioFalso({ publicaciones: { 99: { id: 99 } } });
    const servicio = crearForoService({ repositorio });

    // Act
    await servicio.crearPublicacion(7, {
      tema: 'discusiones',
      titulo: '  Un titulo valido  ',
      cuerpo: '  Un cuerpo suficientemente largo  '
    });

    // Assert
    const guardada = repositorio.llamadas.publicaciones[0];
    assert.equal(guardada.titulo, 'Un titulo valido');
    assert.equal(guardada.cuerpo, 'Un cuerpo suficientemente largo');
    assert.equal(guardada.usuarioId, 7);
  });

  test('rechaza el contenido que no cumple las reglas de validacion', async () => {
    // Arrange
    const servicio = crearForoService({ repositorio: repositorioFalso() });

    // Act
    const fallo = await servicio
      .crearPublicacion(7, { tema: 'discusiones', titulo: 'ab', cuerpo: 'corto' })
      .catch((e) => e);

    // Assert
    assert.equal(fallo.estado, 400);
  });

  test('traduce la violacion de unicidad a un 409 entendible', async () => {
    // Arrange
    const repositorio = repositorioFalso();
    repositorio.crearPublicacion = async () => {
      const err = new Error('duplicate key');
      err.code = '23505';
      throw err;
    };
    const servicio = crearForoService({ repositorio });

    // Act
    const fallo = await servicio
      .crearPublicacion(7, {
        tema: 'discusiones',
        titulo: 'Un titulo repetido',
        cuerpo: 'Un cuerpo suficientemente largo'
      })
      .catch((e) => e);

    // Assert
    assert.equal(fallo.estado, 409);
    assert.match(fallo.message, /ya existe/i);
  });

  test('no oculta un error inesperado de la base de datos', async () => {
    // Arrange
    const repositorio = repositorioFalso();
    repositorio.crearPublicacion = async () => {
      throw new Error('se cayo la conexion');
    };
    const servicio = crearForoService({ repositorio });

    // Act
    const fallo = await servicio
      .crearPublicacion(7, {
        tema: 'discusiones',
        titulo: 'Un titulo valido',
        cuerpo: 'Un cuerpo suficientemente largo'
      })
      .catch((e) => e);

    // Assert
    assert.equal(fallo instanceof ErrorDeNegocio, false);
    assert.equal(fallo.message, 'se cayo la conexion');
  });
});

describe('comentar', () => {
  test('guarda el comentario recortado y asociado a su autor', async () => {
    // Arrange
    const repositorio = repositorioFalso({ publicaciones: publicacionDeEjemplo });
    const servicio = crearForoService({ repositorio });

    // Act
    await servicio.comentar(4, 1, { cuerpo: '  Buen aporte  ' });

    // Assert
    assert.deepEqual(repositorio.llamadas.comentarios[0], {
      publicacionId: 1,
      usuarioId: 4,
      cuerpo: 'Buen aporte',
      padreId: null
    });
  });

  test('rechaza un comentario vacio', async () => {
    // Arrange
    const servicio = crearForoService({
      repositorio: repositorioFalso({ publicaciones: publicacionDeEjemplo })
    });

    // Act
    const fallo = await servicio.comentar(4, 1, { cuerpo: '   ' }).catch((e) => e);

    // Assert
    assert.equal(fallo.estado, 400);
  });

  test('no permite comentar en una publicacion que no existe', async () => {
    // Arrange
    const servicio = crearForoService({ repositorio: repositorioFalso() });

    // Act
    const fallo = await servicio.comentar(4, 1, { cuerpo: 'Hola' }).catch((e) => e);

    // Assert
    assert.equal(fallo.estado, 404);
  });
});

describe('reaccionar', () => {
  test('acepta me gusta y no me gusta', async () => {
    // Arrange
    const repositorio = repositorioFalso({ publicaciones: publicacionDeEjemplo });
    const servicio = crearForoService({ repositorio });

    // Act
    await servicio.reaccionar(3, 1, 1);
    await servicio.reaccionar(3, 1, -1);

    // Assert
    assert.deepEqual(
      repositorio.llamadas.reacciones.map((r) => r.valor),
      [1, -1]
    );
  });

  test('rechaza cualquier valor que no sea 1 o -1', async () => {
    // Arrange
    const servicio = crearForoService({
      repositorio: repositorioFalso({ publicaciones: publicacionDeEjemplo })
    });

    // Act
    const fallos = await Promise.all(
      [0, 5, 100, 'muchos'].map((valor) => servicio.reaccionar(3, 1, valor).catch((e) => e))
    );

    // Assert
    assert.ok(fallos.every((f) => f.estado === 400));
  });

  test('devuelve los totales actualizados junto con la reaccion propia', async () => {
    // Arrange
    const servicio = crearForoService({
      repositorio: repositorioFalso({ publicaciones: publicacionDeEjemplo })
    });

    // Act
    const resultado = await servicio.reaccionar(3, 1, 1);

    // Assert
    assert.deepEqual(resultado, { mi_reaccion: 1, likes: 5, dislikes: 1 });
  });
});

describe('calcularHuella', () => {
  test('para una sesion iniciada usa la cuenta y no el dispositivo', () => {
    // Arrange
    const desdeCasa = { usuarioId: 12, ip: '1.1.1.1', agente: 'Firefox' };
    const desdeElMovil = { usuarioId: 12, ip: '9.9.9.9', agente: 'Safari' };

    // Act
    const unaHuella = calcularHuella(desdeCasa);
    const otraHuella = calcularHuella(desdeElMovil);

    // Assert
    assert.equal(unaHuella, 'u:12');
    assert.equal(unaHuella, otraHuella);
  });

  test('sin sesion, el mismo visitante produce siempre la misma huella', () => {
    // Arrange
    const visitante = { ip: '203.0.113.7', agente: 'Chrome' };

    // Act
    const primera = calcularHuella(visitante);
    const segunda = calcularHuella(visitante);

    // Assert
    assert.equal(primera, segunda);
  });

  test('sin sesion, dos visitantes distintos producen huellas distintas', () => {
    // Arrange
    const uno = { ip: '203.0.113.7', agente: 'Chrome' };
    const otro = { ip: '203.0.113.8', agente: 'Chrome' };

    // Act
    const huellaUno = calcularHuella(uno);
    const huellaOtro = calcularHuella(otro);

    // Assert
    assert.notEqual(huellaUno, huellaOtro);
  });

  // La política de privacidad afirma que no se almacena la dirección IP. Esta
  // prueba es la que impide que esa afirmación deje de ser cierta sin que nadie
  // se dé cuenta.
  test('la huella anonima no contiene la direccion ni el navegador en claro', () => {
    // Arrange
    const visitante = { ip: '203.0.113.7', agente: 'Chrome/126 Windows' };

    // Act
    const huella = calcularHuella(visitante);

    // Assert
    assert.equal(huella.includes('203.0.113.7'), false);
    assert.equal(huella.includes('Chrome'), false);
    assert.match(huella, /^a:[0-9a-f]{32}$/);
  });
});

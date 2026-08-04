const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { crearUsuarioService } = require('../src/services/usuario.service');
const { ErrorDeNegocio } = require('../src/utils/errores');

/**
 * Repositorio falso en memoria. Es lo que permite probar la lógica de negocio
 * sin PostgreSQL: el servicio recibe sus dependencias por parámetro, así que
 * aquí se le entrega este doble en lugar del repositorio real.
 */
const crearRepositorioFalso = (usuarios = []) => ({
  llamadas: { crear: 0, agregarFavorito: [] },
  async crear(datos) {
    this.llamadas.crear++;
    const usuario = { id: usuarios.length + 1, nombre: datos.nombre, correo: datos.correo };
    usuarios.push({ ...usuario, password_hash: datos.passwordHash });
    return usuario;
  },
  async buscarPorCorreo(correo) {
    return usuarios.find(u => u.correo === correo) || null;
  },
  async buscarPerfilPorId(id) {
    return usuarios.find(u => u.id === id) || null;
  },
  async listarFavoritos() {
    return [];
  },
  async agregarFavorito(usuarioId, mangaId) {
    this.llamadas.agregarFavorito.push([usuarioId, mangaId]);
  }
});

// Dependencias de cifrado y firma sustituidas por versiones triviales: aquí se
// prueba el flujo del servicio, no la implementación de bcrypt ni de JWT.
const dependenciasDePrueba = (repositorio) => ({
  repositorio,
  hashear: async (texto) => `hash(${texto})`,
  comparar: async (texto, hashGuardado) => hashGuardado === `hash(${texto})`,
  firmarToken: (payload) => `token-de-${payload.id}`
});

describe('usuarioService.registrar', () => {
  test('crea el usuario y guarda la contrasena hasheada, nunca en claro', async () => {
    // Arrange
    const almacen = [];
    const repositorio = crearRepositorioFalso(almacen);
    const servicio = crearUsuarioService(dependenciasDePrueba(repositorio));

    // Act
    const usuario = await servicio.registrar({
      nombre: 'Roberto',
      correo: 'roberto@gmail.com',
      password: 'secreto123'
    });

    // Assert
    assert.equal(usuario.nombre, 'Roberto');
    assert.equal(repositorio.llamadas.crear, 1);
    assert.equal(almacen[0].password_hash, 'hash(secreto123)');
    assert.ok(!JSON.stringify(almacen[0]).includes('"secreto123"'));
  });

  test('normaliza el correo a minusculas y recorta los espacios del nombre', async () => {
    // Arrange
    const almacen = [];
    const servicio = crearUsuarioService(dependenciasDePrueba(crearRepositorioFalso(almacen)));

    // Act
    await servicio.registrar({
      nombre: '  Roberto  ',
      correo: 'Roberto@Gmail.COM',
      password: 'secreto123'
    });

    // Assert
    assert.equal(almacen[0].correo, 'roberto@gmail.com');
    assert.equal(almacen[0].nombre, 'Roberto');
  });

  test('rechaza un correo invalido sin llegar a tocar el repositorio', async () => {
    // Arrange
    const repositorio = crearRepositorioFalso();
    const servicio = crearUsuarioService(dependenciasDePrueba(repositorio));

    // Act
    const error = await servicio
      .registrar({ nombre: 'Roberto', correo: 'no-es-un-correo', password: 'secreto123' })
      .then(() => null)
      .catch(err => err);

    // Assert
    assert.ok(error instanceof ErrorDeNegocio);
    assert.equal(error.estado, 400);
    assert.equal(repositorio.llamadas.crear, 0);
  });

  test('rechaza una contrasena demasiado corta', async () => {
    // Arrange
    const servicio = crearUsuarioService(dependenciasDePrueba(crearRepositorioFalso()));

    // Act
    const error = await servicio
      .registrar({ nombre: 'Roberto', correo: 'roberto@gmail.com', password: '123' })
      .then(() => null)
      .catch(err => err);

    // Assert
    assert.ok(error instanceof ErrorDeNegocio);
    assert.equal(error.estado, 400);
  });

  test('traduce la violacion de unicidad de PostgreSQL a un conflicto 409', async () => {
    // Arrange
    const repositorio = crearRepositorioFalso();
    repositorio.crear = async () => {
      const err = new Error('duplicate key value violates unique constraint');
      err.code = '23505';
      throw err;
    };
    const servicio = crearUsuarioService(dependenciasDePrueba(repositorio));

    // Act
    const error = await servicio
      .registrar({ nombre: 'Roberto', correo: 'roberto@gmail.com', password: 'secreto123' })
      .then(() => null)
      .catch(err => err);

    // Assert
    assert.ok(error instanceof ErrorDeNegocio);
    assert.equal(error.estado, 409);
    assert.equal(error.message, 'El correo ya esta registrado');
  });
});

describe('usuarioService.autenticar', () => {
  test('devuelve el token y los datos publicos del usuario con credenciales correctas', async () => {
    // Arrange
    const almacen = [];
    const servicio = crearUsuarioService(dependenciasDePrueba(crearRepositorioFalso(almacen)));
    await servicio.registrar({
      nombre: 'Roberto',
      correo: 'roberto@gmail.com',
      password: 'secreto123'
    });

    // Act
    const sesion = await servicio.autenticar({
      correo: 'roberto@gmail.com',
      password: 'secreto123'
    });

    // Assert
    assert.equal(sesion.token, 'token-de-1');
    assert.equal(sesion.usuario.nombre, 'Roberto');
    assert.equal(sesion.usuario.id, 1);
  });

  test('nunca devuelve el hash de la contrasena en la sesion', async () => {
    // Arrange
    const almacen = [];
    const servicio = crearUsuarioService(dependenciasDePrueba(crearRepositorioFalso(almacen)));
    await servicio.registrar({
      nombre: 'Roberto',
      correo: 'roberto@gmail.com',
      password: 'secreto123'
    });

    // Act
    const sesion = await servicio.autenticar({
      correo: 'roberto@gmail.com',
      password: 'secreto123'
    });

    // Assert
    assert.ok(!JSON.stringify(sesion).includes('hash('));
  });

  test('responde el mismo error cuando el correo no existe y cuando la contrasena falla', async () => {
    // Arrange
    // Se comprueba a proposito que los dos mensajes sean identicos, para no
    // revelar que correos estan registrados.
    const almacen = [];
    const servicio = crearUsuarioService(dependenciasDePrueba(crearRepositorioFalso(almacen)));
    await servicio.registrar({
      nombre: 'Roberto',
      correo: 'roberto@gmail.com',
      password: 'secreto123'
    });

    // Act
    const errorCorreoInexistente = await servicio
      .autenticar({ correo: 'otro@gmail.com', password: 'secreto123' })
      .then(() => null)
      .catch(err => err);
    const errorPasswordIncorrecta = await servicio
      .autenticar({ correo: 'roberto@gmail.com', password: 'incorrecta' })
      .then(() => null)
      .catch(err => err);

    // Assert
    assert.equal(errorCorreoInexistente.estado, 401);
    assert.equal(errorPasswordIncorrecta.estado, 401);
    assert.equal(errorCorreoInexistente.message, errorPasswordIncorrecta.message);
  });
});

describe('usuarioService.agregarFavorito', () => {
  test('delega en el repositorio cuando el identificador es numerico', async () => {
    // Arrange
    const repositorio = crearRepositorioFalso();
    const servicio = crearUsuarioService(dependenciasDePrueba(repositorio));

    // Act
    await servicio.agregarFavorito(1, '4');

    // Assert
    assert.deepEqual(repositorio.llamadas.agregarFavorito, [[1, '4']]);
  });

  test('rechaza un identificador de manga que no es un numero', async () => {
    // Arrange
    const repositorio = crearRepositorioFalso();
    const servicio = crearUsuarioService(dependenciasDePrueba(repositorio));

    // Act
    const error = await servicio
      .agregarFavorito(1, 'borrame; DROP TABLE mangas')
      .then(() => null)
      .catch(err => err);

    // Assert
    assert.ok(error instanceof ErrorDeNegocio);
    assert.equal(error.estado, 400);
    assert.equal(repositorio.llamadas.agregarFavorito.length, 0);
  });
});

describe('usuarioService.obtenerPerfil', () => {
  test('devuelve 404 cuando el usuario del token ya no existe', async () => {
    // Arrange
    const servicio = crearUsuarioService(dependenciasDePrueba(crearRepositorioFalso()));

    // Act
    const error = await servicio.obtenerPerfil(99).then(() => null).catch(err => err);

    // Assert
    assert.ok(error instanceof ErrorDeNegocio);
    assert.equal(error.estado, 404);
  });
});

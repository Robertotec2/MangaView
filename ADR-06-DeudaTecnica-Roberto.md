# ADR-06: Deuda Técnica del Proyecto

| Campo  | Valor |
|--------|-------|
| Autor  | Roberto |
| Fecha  | 15/07/2026 |
| Estado | `Aceptado` |

---

## Contexto

Durante el desarrollo de los proyectos MangaView (Node.js + PostgreSQL) y CitasApp (ASP.NET Core MVC), se tomaron decisiones rapidas para cumplir con fechas de entrega. Estas decisiones generaron deuda tecnica que debe documentarse y planificarse para su resolucion futura.

---

## Deuda Tecnica 1 — Configuracion e Infraestructura: Credenciales hardcodeadas

### Que es

En el archivo `backend/src/config/database.js` de MangaView, los valores de conexion a PostgreSQL tienen fallbacks hardcodeados directamente en el codigo fuente:

```javascript
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'mangaview',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || ''
});
```

El parametro `password` tiene un string vacio como fallback, lo que significa que si el archivo `.env` no esta presente, el sistema intenta conectarse sin contrasena. En CitasApp ocurre lo mismo con la cadena de conexion en `appsettings.json`, donde el servidor, el nombre de la base de datos y el puerto estan escritos directamente sin separacion por entorno.

### Por que existe

Fue una decision consciente tomada durante el desarrollo inicial para que el proyecto funcionara rapidamente en la maquina local sin tener que configurar variables de entorno cada vez. Se priorizó tener algo funcional para las entregas parciales del cuatrimestre sobre la seguridad y portabilidad del codigo.

### Costo de no pagarla

Si el repositorio se hace publico con estos valores, cualquier persona puede identificar la estructura de la base de datos y los parametros de conexion. En un entorno de produccion, un archivo `.env` ausente o mal configurado causaria que la aplicacion intente conectarse con credenciales vacias, fallando silenciosamente o exponiendo datos. Ademas, al escalar el proyecto a multiples entornos (desarrollo, staging, produccion), no hay manera de diferenciar la configuracion sin modificar el codigo fuente directamente.

### Propuesta de solucion

Aplicar el patron **Externalized Configuration** usando un gestor de variables de entorno estricto. En Node.js, reemplazar los fallbacks hardcodeados por validacion explicita al inicio:

```javascript
const requiredEnvVars = ['DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD'];
requiredEnvVars.forEach(v => {
  if (!process.env[v]) throw new Error(`Variable de entorno faltante: ${v}`);
});
```

En ASP.NET Core, separar la configuracion en `appsettings.Development.json` y `appsettings.Production.json`, y usar **User Secrets** para desarrollo local. Agregar `.env` y `appsettings.*.json` al `.gitignore` y documentar las variables requeridas en el README.

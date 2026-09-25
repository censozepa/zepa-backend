import { buildApp } from './app.js';
import { testDbConnection } from './config/db.js';
import { env } from './config/env.js';

async function main() {
  try {
    // 1. Verificar conexión a PostgreSQL y PostGIS antes de levantar HTTP
    await testDbConnection();

    // 2. Construir e inicializar Fastify
    const app = await buildApp();

    // 3. Iniciar escucha
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    console.log(`🚀 CensoZEPA Backend escuchando en http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    console.error('❌ Error al arrancar el servidor:', error);
    process.exit(1);
  }
}

main();

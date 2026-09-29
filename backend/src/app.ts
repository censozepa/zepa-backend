import fastifyCors from '@fastify/cors';
import Fastify, { FastifyInstance } from 'fastify';
import { testDbConnection } from './config/db.js';
import { authPlugin } from './plugins/auth.js';
import { authRoutes } from './routes/auth.routes.js';
import { sightingRoutes } from './routes/sighting.routes.js';
import { zepaRoutes } from './routes/zepa.routes.js';
import { mitecoRoutes } from './routes/miteco.routes.js';
import { androidRoutes } from './routes/android.routes.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
    },
  });

  // Habilitar CORS para peticiones desde React (Vite) y móviles
  await app.register(fastifyCors, {
    origin: true, // En desarrollo permite todos los orígenes
    credentials: true,
  });

  // Plugins
  await app.register(authPlugin);

  // Healthcheck para Kubernetes (Liveness & Readiness Probes)
  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'censozepa-backend',
      timestamp: new Date().toISOString(),
    };
  });

  // Rutas de la API Web y Móvil
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(sightingRoutes, { prefix: '/api/sightings' });
  await app.register(zepaRoutes, { prefix: '/api' });
  await app.register(mitecoRoutes, { prefix: '/api/miteco' });

  // Rutas directas para la App Android (compatibles tanto con / como con /api)
  await app.register(androidRoutes);
  await app.register(androidRoutes, { prefix: '/api' });

  return app;
}

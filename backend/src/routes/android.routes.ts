import { FastifyPluginAsync } from 'fastify';
import { createUserSchema, addRegistrySchema } from '../schemas/android.schema.js';
import { createOrVerifyAndroidUser, addAndroidRegistry } from '../services/android.service.js';

export const androidRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Endpoint: Crear / Conectar Usuario
  // Ruta: POST /createuser
  fastify.post('/createuser', async (request, reply) => {
    const parseResult = createUserSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        status: 'error',
        message: 'Datos de usuario inválidos',
        details: parseResult.error.format(),
      });
    }

    try {
      const result = await createOrVerifyAndroidUser(parseResult.data);
      return reply.status(result.statusCode).send(result.response);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(err.statusCode || 500).send({
        status: 'error',
        message: err.message || 'Error interno del servidor al verificar usuario',
      });
    }
  });

  // 2. Endpoint: Recibir Muestreos y Avistamientos
  // Ruta: POST /addregistry
  fastify.post('/addregistry', async (request, reply) => {
    const parseResult = addRegistrySchema.safeParse(request.body);
    if (!parseResult.success) {
      fastify.log.warn({ error: parseResult.error.format(), body: request.body }, 'Error de validación en /addregistry');
      return reply.status(400).send({
        status: 'error',
        message: 'Estructura del payload de registros no válida',
        details: parseResult.error.format(),
      });
    }

    try {
      const result = await addAndroidRegistry(parseResult.data);
      return reply.status(result.statusCode).send(result.response);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(err.statusCode || 500).send({
        status: 'error',
        message: err.message || 'Error interno al procesar los registros de avistamientos',
      });
    }
  });
};

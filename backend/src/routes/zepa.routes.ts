import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getSessionDetails, getSessions, getZepas } from '../services/zepa.service.js';

const getSessionsQuerySchema = z.object({
  zepaCode: z.string().optional(),
});

export const zepaRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Listado de ZEPAs con geometrías y estadísticas acumuladas globales
  fastify.get(
    '/zepas',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const zepas = await getZepas(null);
        return reply.send(zepas);
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Error al recuperar las ZEPAs' });
      }
    }
  );

  // 2. Listado de sesiones de muestreo globales de la plataforma
  fastify.get(
    '/sessions',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parseResult = getSessionsQuerySchema.safeParse(request.query);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          details: parseResult.error.format(),
        });
      }

      try {
        const sessions = await getSessions(null, parseResult.data.zepaCode);
        return reply.send(sessions);
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Error al recuperar las sesiones de muestreo' });
      }
    }
  );

  // 3. Detalle de una sesión específica con sus avistamientos
  fastify.get(
    '/sessions/:id',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      try {
        const session = await getSessionDetails(id, null);
        if (!session) {
          return reply.status(404).send({ error: 'Sesión no encontrada' });
        }
        return reply.send(session);
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Error al recuperar el detalle de la sesión' });
      }
    }
  );
};


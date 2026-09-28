import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { createSightingSchema, getSightingsQuerySchema } from '../schemas/sighting.schema.js';
import { createSighting, getSightings } from '../services/sighting.service.js';

const batchSightingsSchema = z.object({
  sightings: z.array(createSightingSchema).min(1, 'La lista debe contener al menos un avistamiento'),
});

export const sightingRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Ingestión de avistamiento individual (Consumido por la App Android)
  fastify.post(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parseResult = createSightingSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          details: parseResult.error.format(),
        });
      }

      try {
        const sighting = await createSighting(request.user.id, parseResult.data);
        return reply.status(201).send({
          message: 'Avistamiento registrado correctamente',
          sighting,
        });
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Error al registrar el avistamiento' });
      }
    }
  );

  // 2. Ingestión por lotes (Ideal para WorkManager tras recuperar cobertura)
  fastify.post(
    '/batch',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parseResult = batchSightingsSchema.safeParse(request.body);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          details: parseResult.error.format(),
        });
      }

      const results = [];
      for (const item of parseResult.data.sightings) {
        try {
          const saved = await createSighting(request.user.id, item);
          results.push({ success: true, clientSyncId: item.clientSyncId, id: saved.id });
        } catch (err: any) {
          results.push({ success: false, clientSyncId: item.clientSyncId, error: err.message });
        }
      }

      return reply.status(201).send({
        message: 'Lote procesado',
        syncedCount: results.filter((r) => r.success).length,
        items: results,
      });
    }
  );

  // 3. Consulta y filtrado de avistamientos (Consumido por el Frontend React - Mapa)
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parseResult = getSightingsQuerySchema.safeParse(request.query);
      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          details: parseResult.error.format(),
        });
      }

      try {
        const tenantId = request.user.role === 'admin' ? null : request.user.tenantId;
        const data = await getSightings(parseResult.data, tenantId);
        return reply.send(data);
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Error al recuperar los avistamientos' });
      }
    }
  );
};

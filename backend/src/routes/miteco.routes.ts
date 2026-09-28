import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getMitecoSummary,
  getMitecoZepas,
  getMitecoZepaDetails,
} from '../services/miteco.service.js';

const queryZepasSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(25),
  search: z.string().optional(),
  sitecode: z.string().optional(),
  sitetype: z.enum(['A', 'C']).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const mitecoRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Resumen global y estadísticas de ZEPAs en España según Directiva Aves
  fastify.get(
    '/summary',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const summary = await getMitecoSummary();
        return reply.send(summary);
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Error al recuperar resumen de ZEPAs MITECO' });
      }
    }
  );

  // 2. Consulta paginada, con búsqueda y filtros de las 658 ZEPAs oficiales de España
  fastify.get(
    '/zepas',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const parseResult = queryZepasSchema.safeParse(request.query);

      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          details: parseResult.error.format(),
        });
      }

      try {
        const data = await getMitecoZepas(parseResult.data);
        return reply.send(data);
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Error al consultar ZEPAs de Directiva Aves' });
      }
    }
  );

  // 3. Detalle completo de una ZEPA y sus especies censadas
  fastify.get(
    '/zepas/:sitecode',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { sitecode } = request.params as { sitecode: string };
      try {
        const details = await getMitecoZepaDetails(sitecode);
        if (!details.zepa) {
          return reply.status(404).send({ error: `ZEPA con código ${sitecode} no encontrada` });
        }
        return reply.send(details);
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Error al recuperar detalle de la ZEPA' });
      }
    }
  );
};

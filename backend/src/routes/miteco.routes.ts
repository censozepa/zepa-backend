import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  getMitecoSummary,
  getMitecoTableData,
  getMitecoTables,
} from '../services/miteco.service.js';

const queryTableSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(25),
  search: z.string().optional(),
  sitecode: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const mitecoRoutes: FastifyPluginAsync = async (fastify) => {
  // 1. Resumen global y estadísticas del Banco de Datos MITECO
  fastify.get(
    '/summary',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const summary = await getMitecoSummary();
        return reply.send(summary);
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Error al recuperar resumen MITECO' });
      }
    }
  );

  // 2. Listado de tablas del esquema MITECO con metadatos y conteo de filas
  fastify.get(
    '/tables',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const tables = await getMitecoTables();
        return reply.send(tables);
      } catch (err: any) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Error al recuperar listado de tablas MITECO' });
      }
    }
  );

  // 3. Consulta paginada y filtrable de cualquier tabla del banco de datos oficial MITECO
  fastify.get(
    '/tables/:table',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { table } = request.params as { table: string };
      const parseResult = queryTableSchema.safeParse(request.query);

      if (!parseResult.success) {
        return reply.status(400).send({
          error: 'ValidationError',
          details: parseResult.error.format(),
        });
      }

      try {
        const data = await getMitecoTableData(table, parseResult.data);
        return reply.send(data);
      } catch (err: any) {
        fastify.log.error(err);
        if (err.message?.includes('Tabla no encontrada')) {
          return reply.status(404).send({ error: err.message });
        }
        return reply.status(500).send({ error: 'Error al consultar la tabla MITECO' });
      }
    }
  );
};

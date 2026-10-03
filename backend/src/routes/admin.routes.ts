import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { getAllUsersForAdmin, deleteUserTotally, toggleUserActiveStatus } from '../services/admin.service.js';

const userIdParamsSchema = z.object({
  id: z.string().uuid('El ID de usuario debe ser un UUID válido'),
});

const toggleStatusBodySchema = z.object({
  isActive: z.boolean({
    required_error: 'El campo isActive (boolean) es obligatorio',
  }),
});

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Middleware de autorización exclusivo para el rol 'admin'
  fastify.addHook('preHandler', async (request, reply) => {
    await fastify.authenticate(request, reply);
    if (request.user.role !== 'admin') {
      return reply.status(403).send({
        status: 'error',
        message: 'Acceso denegado: Se requieren permisos de Administrador Global para acceder a este recurso.',
      });
    }
  });

  // 1. Listar todos los usuarios con estadísticas de actividad completas
  // GET /api/admin/users
  fastify.get('/', async (_request, reply) => {
    try {
      const users = await getAllUsersForAdmin();
      return reply.send({
        status: 'success',
        total: users.length,
        users,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(500).send({
        status: 'error',
        message: 'Error al recuperar el listado de usuarios de la plataforma',
      });
    }
  });

  // 2. Suspender o reactivar temporalmente el login de un usuario
  // PATCH /api/admin/users/:id/status
  fastify.patch('/:id/status', async (request, reply) => {
    const paramsResult = userIdParamsSchema.safeParse(request.params);
    if (!paramsResult.success) {
      return reply.status(400).send({
        status: 'error',
        message: 'Identificador de usuario no válido',
        details: paramsResult.error.format(),
      });
    }

    const bodyResult = toggleStatusBodySchema.safeParse(request.body);
    if (!bodyResult.success) {
      return reply.status(400).send({
        status: 'error',
        message: 'Datos de estado no válidos',
        details: bodyResult.error.format(),
      });
    }

    try {
      const result = await toggleUserActiveStatus(
        paramsResult.data.id,
        bodyResult.data.isActive,
        request.user.id
      );
      return reply.send(result);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(err.statusCode || 500).send({
        status: 'error',
        message: err.message || 'Error al cambiar el estado de la cuenta del usuario',
      });
    }
  });

  // 3. Eliminar completamente un usuario y todos sus registros (Derecho al Olvido / RGPD)
  // DELETE /api/admin/users/:id
  fastify.delete('/:id', async (request, reply) => {
    const parseResult = userIdParamsSchema.safeParse(request.params);
    if (!parseResult.success) {
      return reply.status(400).send({
        status: 'error',
        message: 'Identificador de usuario no válido',
        details: parseResult.error.format(),
      });
    }

    try {
      const result = await deleteUserTotally(parseResult.data.id, request.user.id);
      return reply.send(result);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(err.statusCode || 500).send({
        status: 'error',
        message: err.message || 'Error al eliminar el usuario de la base de datos',
      });
    }
  });
};


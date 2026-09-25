import { FastifyPluginAsync } from 'fastify';
import { loginSchema, registerSchema } from '../schemas/auth.schema.js';
import { getUserById, registerUser, validateUserCredentials } from '../services/auth.service.js';

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  // Registro de usuarios
  fastify.post('/register', async (request, reply) => {
    const parseResult = registerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'ValidationError',
        details: parseResult.error.format(),
      });
    }

    try {
      const user = await registerUser(parseResult.data);
      const token = fastify.jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return reply.status(201).send({
        message: 'Usuario registrado exitosamente',
        token,
        user,
      });
    } catch (err: any) {
      if (err.statusCode) {
        return reply.status(err.statusCode).send({ error: err.message });
      }
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Error interno del servidor' });
    }
  });

  // Login de usuarios (App Android y Web Frontend)
  fastify.post('/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'ValidationError',
        details: parseResult.error.format(),
      });
    }

    const { email, password } = parseResult.data;
    const user = await validateUserCredentials(email, password);

    if (!user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Credenciales inválidas',
      });
    }

    const token = fastify.jwt.sign({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return reply.send({
      message: 'Inicio de sesión correcto',
      token,
      user,
    });
  });

  // Perfil del usuario actual
  fastify.get(
    '/me',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const user = await getUserById(request.user.id);
      if (!user) {
        return reply.status(404).send({ error: 'Usuario no encontrado' });
      }
      return reply.send({ user });
    }
  );
};

import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      role: 'volunteer' | 'admin' | 'researcher';
      tenantId?: string | null;
      tenantName?: string | null;
      tenantSlug?: string | null;
    };
  }
}

const authPluginCallback: FastifyPluginAsync = async (fastify) => {
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      const userCheck = await pool.query('SELECT is_active FROM users WHERE id = $1', [request.user.id]);
      if (userCheck.rowCount === 0 || !userCheck.rows[0].is_active) {
        return reply.status(401).send({
          error: 'AccountSuspended',
          message: 'Su cuenta fue suspendida temporalmente. Por favor, póngase en contacto con el administrador.',
        });
      }
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized', message: 'Token JWT inválido o expirado' });
    }
  });
};

export const authPlugin = fp(authPluginCallback);


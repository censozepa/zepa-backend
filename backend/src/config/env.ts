import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Cargar .env desde la raíz del repo o local
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://censozepa:censozepa_secret@localhost:5432/censozepa'),
  JWT_SECRET: z.string().min(16).default('super_secret_jwt_key_change_in_production_censozepa'),
  JWT_EXPIRES_IN: z.string().default('7d'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Error de configuración en variables de entorno:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;

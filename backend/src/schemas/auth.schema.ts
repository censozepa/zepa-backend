import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: z.enum(['volunteer', 'admin', 'researcher']).default('volunteer'),
});

export const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

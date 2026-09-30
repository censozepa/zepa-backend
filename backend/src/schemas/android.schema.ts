import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('El formato del correo electrónico no es válido'),
  google_id: z.string().optional(),
  name: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const avistamientoSchema = z.object({
  id_especie: z.union([z.string(), z.number()]).optional().transform((v) => (v !== undefined && v !== null ? String(v) : '')),
  nombre_comun: z.string().nullish().default(''),
  nombre_cientifico: z.string().nullish().default(''),
  hora: z.union([z.string(), z.number()]).nullish().default(''),
  cantidad: z.coerce.number().int().min(1).default(1),
  alerta_fenologica: z.coerce.boolean().optional().default(false),
  latitud: z.coerce.number().optional(),
  longitud: z.coerce.number().optional(),
  notas: z.string().nullish(),
});

export type AvistamientoInput = z.infer<typeof avistamientoSchema>;

export const registroSesionSchema = z.object({
  id_sesion: z.coerce.number().int(),
  id_zepa: z.string().min(1, 'El código de la ZEPA (id_zepa) es obligatorio'),
  fecha_hora_inicio: z.coerce.number(),
  fecha_hora_fin: z.coerce.number().nullish().default(0),
  distancia_recorrida: z.coerce.number().nullish().default(0),
  avistamientos: z.array(avistamientoSchema).default([]),
});

export type RegistroSesionInput = z.infer<typeof registroSesionSchema>;

export const addRegistrySchema = z.object({
  email: z.string().email('El formato del correo electrónico no es válido'),
  total_sesiones: z.coerce.number().int().optional().default(1),
  registros: z.array(registroSesionSchema).default([]),
});

export type AddRegistryInput = z.infer<typeof addRegistrySchema>;

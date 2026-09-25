import { z } from 'zod';

export const createSightingSchema = z.object({
  speciesName: z.string().min(2, 'El nombre de la especie es obligatorio'),
  count: z.coerce.number().int().min(1, 'El conteo debe ser al menos 1').default(1),
  sightedAt: z.string().datetime({ message: 'sightedAt debe ser una fecha ISO válida (ej: 2026-09-25T10:00:00Z)' }),
  latitude: z.coerce.number().min(-90).max(90, 'Latitud debe estar entre -90 y 90'),
  longitude: z.coerce.number().min(-180).max(180, 'Longitud debe estar entre -180 y 180'),
  accuracyMeters: z.coerce.number().positive().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  clientSyncId: z.string().uuid({ message: 'clientSyncId debe ser un UUID v4 válido' }).optional().nullable(),
});

export const getSightingsQuerySchema = z.object({
  species: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  
  // Bounding box para vistas de mapa (Leaflet viewport)
  minLat: z.coerce.number().min(-90).max(90).optional(),
  maxLat: z.coerce.number().min(-90).max(90).optional(),
  minLng: z.coerce.number().min(-180).max(180).optional(),
  maxLng: z.coerce.number().min(-180).max(180).optional(),

  // Filtro por radio espacial
  centerLat: z.coerce.number().min(-90).max(90).optional(),
  centerLng: z.coerce.number().min(-180).max(180).optional(),
  radiusMeters: z.coerce.number().positive().optional(),

  // Paginación y formato
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  format: z.enum(['json', 'geojson']).default('geojson'),
});

export type CreateSightingInput = z.infer<typeof createSightingSchema>;
export type GetSightingsQuery = z.infer<typeof getSightingsQuerySchema>;

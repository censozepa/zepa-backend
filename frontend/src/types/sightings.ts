export interface SightingProperties {
  id: string;
  sessionId?: string | null;
  sessionNumber?: number | null;
  zepaCode?: string | null;
  speciesCode?: string | null;
  scientificName?: string | null;
  commonName?: string | null;
  speciesName: string;
  count: number;
  sightedAt: string;
  phenologicalAlert?: boolean;
  accuracyMeters?: number | null;
  notes?: string | null;
  observer: string;
  createdAt: string;
}

export interface SightingFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lon, lat]
  };
  properties: SightingProperties;
}

export interface SightingFeatureCollection {
  type: 'FeatureCollection';
  features: SightingFeature[];
}

export interface SamplingSession {
  id: string;
  sessionNumber: number;
  zepaCode: string;
  tenantId?: string | null;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  distanceKm: number;
  sightingCount: number;
  totalBirds: number;
  uniqueSpecies: number;
  alertsCount: number;
  hasObservations: boolean;
}

export interface ZepaZone {
  code: string;
  name: string;
  geometry: any;
  totalSessions: number;
  totalSightings: number;
  totalBirds: number;
  uniqueSpecies: number;
  alertsCount: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'volunteer' | 'admin' | 'researcher';
  tenantId?: string | null;
  tenantName?: string | null;
  tenantSlug?: string | null;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}


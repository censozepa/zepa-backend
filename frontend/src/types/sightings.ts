export interface SightingProperties {
  id: string;
  speciesName: string;
  count: number;
  sightedAt: string;
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

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'volunteer' | 'admin' | 'researcher';
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

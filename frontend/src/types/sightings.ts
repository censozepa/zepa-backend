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
  observerEmail?: string | null;
  userId?: string | null;
  tenantId?: string | null;
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
  userId?: string | null;
  userEmail?: string | null;
  userFullName?: string | null;
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
  avatarUrl?: string | null;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface MitecoZepaSummary {
  totalZepas: number;
  pureZepasCount: number; // Tipo A
  coincidentZepasCount: number; // Tipo C
  totalAreaHa: number;
  totalBirdSpeciesRecords: number;
  uniqueBirdSpeciesCount: number;
}

export interface ZepaRecord {
  sitecode: string;
  sitename: string;
  sitetype: string;
  date_spa: string | null;
  spa_legal_reference: string | null;
  areaha: number;
  marine_area_percentage: number | null;
  longitude: number;
  latitude: number;
  bird_species_count: number;
  quality: string | null;
  explanations: string | null;
  documentation: string | null;
  othercharact: string | null;
  date_compilation: string | null;
  date_update: string | null;
}

export interface ZepaSpeciesRecord {
  speciesname: string;
  speciescode: string;
  population_type: string | null;
  lowerbound: number | null;
  upperbound: number | null;
  counting_unit: string | null;
  abundance_category: string | null;
  dataquality: string | null;
  population?: string | null;
  conservation: string | null;
}

export interface ZepasQueryResponse {
  rows: ZepaRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ZepaDetailResponse {
  zepa: ZepaRecord | null;
  species: ZepaSpeciesRecord[];
}


import { AuthResponse, SightingFeatureCollection } from '../types/sightings';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchSightingsGeoJSON(species?: string): Promise<SightingFeatureCollection> {
  const url = new URL(`${API_BASE}/sightings`, window.location.origin);
  url.searchParams.set('format', 'geojson');
  url.searchParams.set('limit', '500');

  if (species && species.trim()) {
    url.searchParams.set('species', species.trim());
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error al iniciar sesión');
  }

  return data;
}

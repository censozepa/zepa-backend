import {
  AuthResponse,
  MitecoSummary,
  MitecoTableData,
  MitecoTableMeta,
  SamplingSession,
  SightingFeatureCollection,
  ZepaZone,
} from '../types/sightings';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('censozepa_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchZepas(): Promise<ZepaZone[]> {
  const response = await fetch(`${API_BASE}/zepas`, {
    headers: getAuthHeaders(),
  });
  if (response.status === 401) {
    localStorage.removeItem('censozepa_token');
    localStorage.removeItem('censozepa_user');
    window.location.reload();
    throw new Error('Sesión expirada');
  }
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSessions(zepaCode?: string): Promise<SamplingSession[]> {
  const url = new URL(`${API_BASE}/sessions`, window.location.origin);
  if (zepaCode && zepaCode !== 'ALL') {
    url.searchParams.set('zepaCode', zepaCode);
  }
  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (response.status === 401) {
    localStorage.removeItem('censozepa_token');
    localStorage.removeItem('censozepa_user');
    window.location.reload();
    throw new Error('Sesión expirada');
  }
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSightingsGeoJSON(params?: {
  species?: string;
  zepaCode?: string;
  sessionNumber?: number;
}): Promise<SightingFeatureCollection> {
  const url = new URL(`${API_BASE}/sightings`, window.location.origin);
  url.searchParams.set('format', 'geojson');
  url.searchParams.set('limit', '1000');

  if (params?.species && params.species.trim()) {
    url.searchParams.set('species', params.species.trim());
  }
  if (params?.zepaCode && params.zepaCode !== 'ALL') {
    url.searchParams.set('zepaCode', params.zepaCode);
  }
  if (params?.sessionNumber !== undefined) {
    url.searchParams.set('sessionNumber', params.sessionNumber.toString());
  }

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (response.status === 401) {
    localStorage.removeItem('censozepa_token');
    localStorage.removeItem('censozepa_user');
    window.location.reload();
    throw new Error('Sesión expirada');
  }
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
    throw new Error(data.message || data.error || 'Credenciales inválidas');
  }

  return data;
}

export async function loginWithGoogle(email: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Error al autenticar con Google');
  }

  return data;
}

export async function fetchMitecoSummary(): Promise<MitecoSummary> {
  const response = await fetch(`${API_BASE}/miteco/summary`, {
    headers: getAuthHeaders(),
  });
  if (response.status === 401) {
    localStorage.removeItem('censozepa_token');
    localStorage.removeItem('censozepa_user');
    window.location.reload();
    throw new Error('Sesión expirada');
  }
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchMitecoTables(): Promise<MitecoTableMeta[]> {
  const response = await fetch(`${API_BASE}/miteco/tables`, {
    headers: getAuthHeaders(),
  });
  if (response.status === 401) {
    localStorage.removeItem('censozepa_token');
    localStorage.removeItem('censozepa_user');
    window.location.reload();
    throw new Error('Sesión expirada');
  }
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchMitecoTableData(
  table: string,
  params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    sitecode?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }
): Promise<MitecoTableData> {
  const url = new URL(`${API_BASE}/miteco/tables/${table}`, window.location.origin);
  if (params?.page) url.searchParams.set('page', params.page.toString());
  if (params?.pageSize) url.searchParams.set('pageSize', params.pageSize.toString());
  if (params?.search && params.search.trim()) url.searchParams.set('search', params.search.trim());
  if (params?.sitecode && params.sitecode.trim()) url.searchParams.set('sitecode', params.sitecode.trim());
  if (params?.sortBy) url.searchParams.set('sortBy', params.sortBy);
  if (params?.sortOrder) url.searchParams.set('sortOrder', params.sortOrder);

  const response = await fetch(url.toString(), {
    headers: getAuthHeaders(),
  });
  if (response.status === 401) {
    localStorage.removeItem('censozepa_token');
    localStorage.removeItem('censozepa_user');
    window.location.reload();
    throw new Error('Sesión expirada');
  }
  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  return response.json();
}



import {
  AuthResponse,
  ManagedUser,
  MitecoZepaSummary,
  SamplingSession,
  SightingFeatureCollection,
  ZepaDetailResponse,
  ZepasQueryResponse,
  ZepaZone,
} from '../types/sightings';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders(hasBody = false): HeadersInit {
  const token = localStorage.getItem('censozepa_token');
  const headers: Record<string, string> = {};
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
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

export async function fetchMitecoSummary(): Promise<MitecoZepaSummary> {
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

export async function fetchMitecoZepas(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  sitecode?: string;
  sitetype?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<ZepasQueryResponse> {
  const url = new URL(`${API_BASE}/miteco/zepas`, window.location.origin);
  if (params?.page) url.searchParams.set('page', params.page.toString());
  if (params?.pageSize) url.searchParams.set('pageSize', params.pageSize.toString());
  if (params?.search && params.search.trim()) url.searchParams.set('search', params.search.trim());
  if (params?.sitecode && params.sitecode.trim()) url.searchParams.set('sitecode', params.sitecode.trim());
  if (params?.sitetype && params.sitetype.trim()) url.searchParams.set('sitetype', params.sitetype.trim());
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

export async function fetchMitecoZepaDetails(sitecode: string): Promise<ZepaDetailResponse> {
  const response = await fetch(`${API_BASE}/miteco/zepas/${encodeURIComponent(sitecode)}`, {
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

export async function fetchAdminUsers(): Promise<ManagedUser[]> {
  const response = await fetch(`${API_BASE}/admin/users`, {
    headers: getAuthHeaders(),
  });
  if (response.status === 401) {
    localStorage.removeItem('censozepa_token');
    localStorage.removeItem('censozepa_user');
    window.location.reload();
    throw new Error('Sesión expirada');
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  return data.users || [];
}

export async function deleteUserTotally(userId: string): Promise<{
  status: string;
  message: string;
  deleted: {
    userId: string;
    email: string;
    fullName: string;
    role: string;
    deletedSightings: number;
    deletedSessions: number;
  };
}> {
  const response = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (response.status === 401) {
    localStorage.removeItem('censozepa_token');
    localStorage.removeItem('censozepa_user');
    window.location.reload();
    throw new Error('Sesión expirada');
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `Error al eliminar usuario: ${response.status}`);
  }
  return data;
}

export async function toggleUserStatus(
  userId: string,
  isActive: boolean
): Promise<{
  status: string;
  message: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    isActive: boolean;
  };
}> {
  const response = await fetch(`${API_BASE}/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(true),
    body: JSON.stringify({ isActive }),
  });
  if (response.status === 401) {
    localStorage.removeItem('censozepa_token');
    localStorage.removeItem('censozepa_user');
    window.location.reload();
    throw new Error('Sesión expirada');
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || `Error al cambiar estado del usuario: ${response.status}`);
  }
  return data;
}

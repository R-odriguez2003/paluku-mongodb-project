import { Hotel, Reservation, Room } from './types';
import { mockClient } from './mockClient';

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'staff';
};

export type ApiClient = {
  getCurrentUser: () => Promise<User | null>;
  getHotels: () => Promise<Hotel[]>;
  getHotelById: (id: string) => Promise<Hotel | null>;
  getRooms: (hotelId?: string) => Promise<Room[]>;
  getReservations: () => Promise<Reservation[]>;
  createReservation: (input: { hotelId: string; roomId: string; checkIn: string; checkOut: string; guests: number }) => Promise<{ reservation: Reservation }>;
  login: (email: string, password: string) => Promise<{ token: string; user: User }>;
  register: (input: { name: string; email: string; password: string; role?: 'customer' | 'staff' }) => Promise<{ user: User }>;
  logout: () => void;
};

const AUTH_STORAGE_KEY = 'hotel-booking-auth-token';

const getStoredToken = () => {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
};

const setStoredToken = (token: string) => {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, token);
  } catch {
    // Ignore storage errors in restricted environments.
  }
};

const clearStoredToken = () => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // Ignore storage errors in restricted environments.
  }
};

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const token = getStoredToken();
  const headers = new Headers(init.headers ?? {});

  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = payload?.error?.message ?? 'Request failed.';
    throw new Error(message);
  }

  return payload as T;
};

const realApi: ApiClient = {
  async getCurrentUser() {
    try {
      const payload = await request<{ user?: User }>('/auth/current-user', { method: 'GET' });
      return payload.user ?? null;
    } catch {
      clearStoredToken();
      return null;
    }
  },
  async getHotels() {
    try {
      const payload = await request<{ hotels: Hotel[] }>('/hotels', { method: 'GET' });
      return payload.hotels ?? [];
    } catch {
      return mockClient.getHotels();
    }
  },
  async getHotelById(id) {
    try {
      const payload = await request<{ hotel: Hotel }>('/hotels/' + id, { method: 'GET' });
      return payload.hotel ?? null;
    } catch {
      return mockClient.getHotelById(id);
    }
  },
  async getRooms(hotelId) {
    try {
      const query = hotelId ? `?hotelId=${encodeURIComponent(hotelId)}` : '';
      const payload = await request<{ rooms: Room[] }>('/rooms' + query, { method: 'GET' });
      return payload.rooms ?? [];
    } catch {
      return mockClient.getRooms(hotelId);
    }
  },
  async getReservations() {
    try {
      const payload = await request<{ reservations: Reservation[] }>('/reservations', { method: 'GET' });
      return payload.reservations ?? [];
    } catch {
      return mockClient.getReservations();
    }
  },
  async createReservation(input) {
    const payload = await request<{ reservation: Reservation }>('/reservations', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return payload;
  },
  async login(email, password) {
    const payload = await request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(payload.token);
    return payload;
  },
  async register(input) {
    const payload = await request<{ user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return payload;
  },
  logout() {
    clearStoredToken();
  },
};

export const api: ApiClient = realApi;

export const apiConfig = {
  baseUrl,
};

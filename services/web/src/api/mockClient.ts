import { Hotel, Reservation, Room } from './types';

const hotels: Hotel[] = [
  {
    id: 'hotel-1',
    name: 'Azure Harbor Suites',
    location: 'Lisbon',
    description: 'Calm waterfront suites designed for flexible business and leisure stays.',
    amenities: ['Pool', 'Breakfast', 'Wi-Fi', 'Spa'],
    rating: 4.8,
    pricePerNight: 189,
  },
  {
    id: 'hotel-2',
    name: 'Citylight Rooms',
    location: 'Madrid',
    description: 'A vibrant city stay with boutique design and quick access to transit.',
    amenities: ['Gym', 'Coffee bar', 'Parking', 'Wi-Fi'],
    rating: 4.6,
    pricePerNight: 142,
  },
  {
    id: 'hotel-3',
    name: 'Harbor View Stay',
    location: 'Porto',
    description: 'A family-friendly harbor hotel with premium suites and sea views.',
    amenities: ['Kitchen', 'Sea view', 'Pool', 'Breakfast'],
    rating: 4.7,
    pricePerNight: 175,
  },
];

const rooms: Room[] = [
  { id: 'room-1', hotelId: 'hotel-1', type: 'Deluxe King', capacity: 2, rate: 189, quantity: 4 },
  { id: 'room-2', hotelId: 'hotel-1', type: 'Executive Twin', capacity: 2, rate: 210, quantity: 5 },
  { id: 'room-3', hotelId: 'hotel-2', type: 'Queen Studio', capacity: 1, rate: 142, quantity: 3 },
  { id: 'room-4', hotelId: 'hotel-3', type: 'Family Suite', capacity: 4, rate: 245, quantity: 2 },
];

const reservations: Reservation[] = [
  {
    id: 'HB-2041',
    hotelId: 'hotel-1',
    roomId: 'room-1',
    userId: 'user-1',
    checkIn: '2026-11-14',
    checkOut: '2026-11-17',
    guests: 2,
    status: 'confirmed',
    total: 567,
  },
  {
    id: 'HB-1982',
    hotelId: 'hotel-2',
    roomId: 'room-3',
    userId: 'user-1',
    checkIn: '2026-10-06',
    checkOut: '2026-10-09',
    guests: 1,
    status: 'completed',
    total: 426,
  },
  {
    id: 'HB-2018',
    hotelId: 'hotel-3',
    roomId: 'room-4',
    userId: 'user-1',
    checkIn: '2026-11-22',
    checkOut: '2026-11-25',
    guests: 4,
    status: 'pending',
    total: 735,
  },
];

const currentUser = {
  id: 'user-1',
  name: 'Maya Chen',
  email: 'maya@example.com',
  role: 'customer' as const,
};

export const mockClient = {
  async getCurrentUser() {
    return currentUser;
  },
  async getHotels() {
    return hotels;
  },
  async getHotelById(id: string) {
    return hotels.find((hotel) => hotel.id === id) ?? null;
  },
  async getRooms(hotelId?: string) {
    if (!hotelId) return rooms;
    return rooms.filter((room) => room.hotelId === hotelId);
  },
  async getReservations() {
    return reservations;
  },
  async login(email: string, password: string) {
    if (!email || !password) {
      throw new Error('Missing credentials');
    }
    return { token: 'mock-token', user: currentUser };
  },
  async register(input: { name: string; email: string; password: string; role?: 'customer' | 'staff' }) {
    return { user: { id: 'new-user', ...input, role: input.role ?? 'customer' } };
  },
};

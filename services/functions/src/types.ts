export type Role = 'customer' | 'staff';

export type Hotel = {
  id: string;
  name: string;
  location: string;
  description: string;
  amenities: string[];
  rating: number;
  pricePerNight: number;
};

export type Room = {
  id: string;
  hotelId: string;
  type: string;
  capacity: number;
  rate: number;
  quantity: number;
};

export type ReservationStatus = 'confirmed' | 'pending' | 'completed';

export type Reservation = {
  id: string;
  hotelId: string;
  roomId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: ReservationStatus;
  total: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
};

export type AuthenticatedRequest = {
  user?: { id: string; email: string; role: Role };
};

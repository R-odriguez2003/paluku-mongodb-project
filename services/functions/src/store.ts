import mongoose, { Schema } from 'mongoose';
import { Hotel, Reservation, Room, User } from './types.js';

const hotelSeed: Hotel[] = [
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

const roomSeed: Room[] = [
  { id: 'room-1', hotelId: 'hotel-1', type: 'Deluxe King', capacity: 2, rate: 189, quantity: 4 },
  { id: 'room-2', hotelId: 'hotel-1', type: 'Executive Twin', capacity: 2, rate: 210, quantity: 5 },
  { id: 'room-3', hotelId: 'hotel-2', type: 'Queen Studio', capacity: 1, rate: 142, quantity: 3 },
  { id: 'room-4', hotelId: 'hotel-3', type: 'Family Suite', capacity: 4, rate: 245, quantity: 2 },
];

const userSeed: User[] = [
  {
    id: 'user-1',
    name: 'Demo Guest',
    email: 'guest@example.com',
    passwordHash: '$2a$10$5zEvoG9iU0F4W5a6FF2EUe1kcy7WQdD2S.KQ5OBNNDtfM8i7rjQCi',
    role: 'customer',
  },
];

const reservationSeed: Reservation[] = [
  {
    id: 'reservation-1',
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
    id: 'reservation-2',
    hotelId: 'hotel-2',
    roomId: 'room-3',
    userId: 'user-1',
    checkIn: '2026-10-06',
    checkOut: '2026-10-09',
    guests: 1,
    status: 'completed',
    total: 426,
  },
];

export const dataStore = {
  hotels: [...hotelSeed],
  rooms: [...roomSeed],
  reservations: [...reservationSeed],
  users: [...userSeed],
};

export const isMongoConnected = () => mongoose.connection.readyState === 1;

const hotelSchema = new Schema<Hotel>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String, default: '' },
  amenities: [{ type: String }],
  rating: { type: Number, default: 0 },
  pricePerNight: { type: Number, default: 0 },
}, { collection: 'hotels' });

const roomSchema = new Schema<Room>({
  id: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true },
  type: { type: String, required: true },
  capacity: { type: Number, required: true },
  rate: { type: Number, required: true },
  quantity: { type: Number, required: true },
}, { collection: 'rooms' });

const reservationSchema = new Schema<Reservation>({
  id: { type: String, required: true, unique: true },
  hotelId: { type: String, required: true },
  roomId: { type: String, required: true },
  userId: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String, required: true },
  guests: { type: Number, required: true },
  status: { type: String, required: true, enum: ['confirmed', 'pending', 'completed'] },
  total: { type: Number, required: true },
}, { collection: 'reservations' });

const userSchema = new Schema<User>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['customer', 'staff'] },
}, { collection: 'users' });

export const HotelModel = mongoose.models.Hotel ?? mongoose.model<Hotel>('Hotel', hotelSchema);
export const RoomModel = mongoose.models.Room ?? mongoose.model<Room>('Room', roomSchema);
export const ReservationModel = mongoose.models.Reservation ?? mongoose.model<Reservation>('Reservation', reservationSchema);
export const UserModel = mongoose.models.User ?? mongoose.model<User>('User', userSchema);

export const seedDatabaseIfNeeded = async () => {
  if (!isMongoConnected()) {
    return;
  }

  const [hotelCount, roomCount, userCount, reservationCount] = await Promise.all([
    HotelModel.countDocuments(),
    RoomModel.countDocuments(),
    UserModel.countDocuments(),
    ReservationModel.countDocuments(),
  ]);

  if (hotelCount === 0) {
    await HotelModel.insertMany(hotelSeed);
  }

  if (roomCount === 0) {
    await RoomModel.insertMany(roomSeed);
  }

  if (userCount === 0) {
    await UserModel.insertMany(userSeed);
  }

  if (reservationCount === 0) {
    await ReservationModel.insertMany(reservationSeed);
  }
};

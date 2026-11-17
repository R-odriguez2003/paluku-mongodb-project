import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';
import { createPasswordHash, findUserByEmail, getCurrentUser, requireAuth, signJwt, verifyPassword } from './auth.js';
import { dataStore, HotelModel, isMongoConnected, ReservationModel, RoomModel, seedDatabaseIfNeeded, UserModel } from './store.js';
import { AuthenticatedRequest, Hotel, Reservation, Room, User } from './types.js';

const app = express();
app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());

const sendError = (res: Response, status: number, code: string, message: string) =>
  res.status(status).json({ error: { code, message } });

const parseAuth = (req: Request & AuthenticatedRequest) => {
  const authHeader = req.headers.authorization;
  const user = getCurrentUser(authHeader);
  req.user = user ?? undefined;
  return req;
};

app.get('/api/health', (_req, res) => {
  const databaseStatus = mongoose.connection.readyState === 1 ? 'connected' : 'fallback';
  const services = {
    database: databaseStatus,
    auth: 'healthy',
  };

  const hasIssues = Object.values(services).some((value) => value !== 'healthy' && value !== 'connected');
  const status = hasIssues ? 'degraded' : 'healthy';

  res.status(200).json({ status, services });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role = 'customer' } = req.body ?? {};

  if (!name || !email || !password) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Name, email, and password are required.');
  }

  const existingUsers = isMongoConnected() ? (await UserModel.find().lean()) as unknown as User[] : dataStore.users;
  if (existingUsers.some((user) => user.email.toLowerCase() === String(email).toLowerCase())) {
    return sendError(res, 409, 'USER_EXISTS', 'An account with that email already exists.');
  }

  const passwordHash = await createPasswordHash(String(password));
  const user = {
    id: randomUUID(),
    name: String(name),
    email: String(email),
    passwordHash,
    role,
  };

  if (isMongoConnected()) {
    await UserModel.create(user);
  } else {
    dataStore.users.push(user);
  }

  return res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  const user = await findUserByEmail(String(email ?? ''));

  if (!user) {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'The supplied email or password is incorrect.');
  }

  const validPassword = await verifyPassword(String(password ?? ''), user.passwordHash);
  if (!validPassword) {
    return sendError(res, 401, 'INVALID_CREDENTIALS', 'The supplied email or password is incorrect.');
  }

  const token = signJwt({ id: user.id, email: user.email, role: user.role });
  return res.status(200).json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token,
  });
});

app.get('/api/auth/current-user', (req, res) => {
  const user = parseAuth(req as Request & AuthenticatedRequest).user;
  if (!user) {
    return sendError(res, 401, 'UNAUTHORIZED', 'Authentication required.');
  }

  return res.status(200).json({ user });
});

app.get('/api/hotels', async (_req, res) => {
  const hotels = isMongoConnected() ? (await HotelModel.find().lean()) as unknown as Hotel[] : dataStore.hotels;
  res.status(200).json({ hotels });
});

app.get('/api/hotels/:id', async (req: Request, res: Response) => {
  const hotel = isMongoConnected()
    ? (await HotelModel.findOne({ id: req.params.id }).lean()) as unknown as Hotel | null
    : dataStore.hotels.find((item) => item.id === req.params.id);

  if (!hotel) {
    return sendError(res, 404, 'HOTEL_NOT_FOUND', 'Hotel not found.');
  }

  return res.status(200).json({ hotel });
});

app.post('/api/hotels', requireAuth, async (req: Request & AuthenticatedRequest, res: Response) => {
  const { name, location, description, amenities, rating } = req.body ?? {};
  if (!name || !location) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Hotel name and location are required.');
  }

  const hotel = {
    id: randomUUID(),
    name: String(name),
    location: String(location),
    description: String(description ?? ''),
    amenities: Array.isArray(amenities) ? amenities.map(String) : [],
    rating: Number(rating ?? 0),
    pricePerNight: 150,
  };

  if (isMongoConnected()) {
    await HotelModel.create(hotel);
  } else {
    dataStore.hotels.push(hotel);
  }

  return res.status(201).json({ hotel });
});

app.patch('/api/hotels/:id', requireAuth, async (req: Request & AuthenticatedRequest, res: Response) => {
  const hotel = isMongoConnected()
    ? await HotelModel.findOne({ id: req.params.id })
    : dataStore.hotels.find((item) => item.id === req.params.id);

  if (!hotel) {
    return sendError(res, 404, 'HOTEL_NOT_FOUND', 'Hotel not found.');
  }

  if (isMongoConnected()) {
    Object.assign(hotel, req.body ?? {});
    await hotel.save();
  } else {
    Object.assign(hotel, req.body ?? {});
  }

  return res.status(200).json({ hotel });
});

app.delete('/api/hotels/:id', requireAuth, async (req: Request & AuthenticatedRequest, res: Response) => {
  if (isMongoConnected()) {
    const deleted = await HotelModel.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return sendError(res, 404, 'HOTEL_NOT_FOUND', 'Hotel not found.');
    }
    return res.status(200).json({ deleted: true });
  }

  const index = dataStore.hotels.findIndex((item) => item.id === req.params.id);
  if (index < 0) {
    return sendError(res, 404, 'HOTEL_NOT_FOUND', 'Hotel not found.');
  }

  dataStore.hotels.splice(index, 1);
  return res.status(200).json({ deleted: true });
});

app.get('/api/rooms', async (req: Request, res: Response) => {
  const hotelId = typeof req.query.hotelId === 'string' ? req.query.hotelId : undefined;
  const rooms = isMongoConnected()
    ? hotelId
      ? (await RoomModel.find({ hotelId }).lean()) as unknown as Room[]
      : (await RoomModel.find().lean()) as unknown as Room[]
    : hotelId
      ? dataStore.rooms.filter((room) => room.hotelId === hotelId)
      : dataStore.rooms;

  return res.status(200).json({ rooms });
});

app.post('/api/rooms', requireAuth, async (req: Request & AuthenticatedRequest, res: Response) => {
  const { hotelId, type, capacity, rate, quantity } = req.body ?? {};
  if (!hotelId || !type || !capacity || !rate || !quantity) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Hotel, type, capacity, rate, and quantity are required.');
  }

  const room: Room = {
    id: randomUUID(),
    hotelId: String(hotelId),
    type: String(type),
    capacity: Number(capacity),
    rate: Number(rate),
    quantity: Number(quantity),
  };

  if (isMongoConnected()) {
    await RoomModel.create(room);
  } else {
    dataStore.rooms.push(room);
  }

  return res.status(201).json({ room });
});

app.get('/api/rooms/:id', async (req: Request, res: Response) => {
  const room = isMongoConnected()
    ? (await RoomModel.findOne({ id: req.params.id }).lean()) as unknown as Room | null
    : dataStore.rooms.find((item) => item.id === req.params.id);

  if (!room) {
    return sendError(res, 404, 'ROOM_NOT_FOUND', 'Room not found.');
  }

  return res.status(200).json({ room });
});

app.patch('/api/rooms/:id', requireAuth, async (req: Request & AuthenticatedRequest, res: Response) => {
  const room = isMongoConnected()
    ? await RoomModel.findOne({ id: req.params.id })
    : dataStore.rooms.find((item) => item.id === req.params.id);

  if (!room) {
    return sendError(res, 404, 'ROOM_NOT_FOUND', 'Room not found.');
  }

  if (isMongoConnected()) {
    Object.assign(room, req.body ?? {});
    await room.save();
  } else {
    Object.assign(room, req.body ?? {});
  }

  return res.status(200).json({ room });
});

app.delete('/api/rooms/:id', requireAuth, async (req: Request & AuthenticatedRequest, res: Response) => {
  if (isMongoConnected()) {
    const deleted = await RoomModel.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return sendError(res, 404, 'ROOM_NOT_FOUND', 'Room not found.');
    }
    return res.status(200).json({ deleted: true });
  }

  const index = dataStore.rooms.findIndex((item) => item.id === req.params.id);
  if (index < 0) {
    return sendError(res, 404, 'ROOM_NOT_FOUND', 'Room not found.');
  }

  dataStore.rooms.splice(index, 1);
  return res.status(200).json({ deleted: true });
});

app.post('/api/reservations', requireAuth, async (req: Request & AuthenticatedRequest, res: Response) => {
  const { hotelId, roomId, checkIn, checkOut, guests } = req.body ?? {};
  if (!hotelId || !roomId || !checkIn || !checkOut || !guests) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'Reservation details are incomplete.');
  }

  const room = isMongoConnected()
    ? (await RoomModel.findOne({ id: roomId }).lean()) as unknown as Room | null
    : dataStore.rooms.find((item) => item.id === roomId);

  if (!room) {
    return sendError(res, 404, 'ROOM_NOT_FOUND', 'Room not found.');
  }

  const user = req.user;
  const total = Number(room.rate) * Math.max(1, Number(guests));
  const reservation: Reservation = {
    id: randomUUID(),
    hotelId: String(hotelId),
    roomId: String(roomId),
    userId: user?.id ?? 'guest',
    checkIn: String(checkIn),
    checkOut: String(checkOut),
    guests: Number(guests),
    status: 'pending',
    total,
  };

  if (isMongoConnected()) {
    await ReservationModel.create(reservation);
  } else {
    dataStore.reservations.push(reservation);
  }

  return res.status(201).json({ reservation });
});

app.get('/api/reservations', requireAuth, async (req: Request & AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const reservations = isMongoConnected()
    ? user?.role === 'staff'
      ? (await ReservationModel.find().lean()) as unknown as Reservation[]
      : (await ReservationModel.find({ userId: user?.id }).lean()) as unknown as Reservation[]
    : user?.role === 'staff'
      ? dataStore.reservations
      : dataStore.reservations.filter((item) => item.userId === user?.id);

  return res.status(200).json({ reservations });
});

app.get('/api/reservations/:id', requireAuth, async (req: Request & AuthenticatedRequest, res: Response) => {
  const reservation = isMongoConnected()
    ? await ReservationModel.findOne({ id: req.params.id }).lean()
    : dataStore.reservations.find((item) => item.id === req.params.id);

  if (!reservation) {
    return sendError(res, 404, 'RESERVATION_NOT_FOUND', 'Reservation not found.');
  }

  return res.status(200).json({ reservation });
});

app.patch('/api/reservations/:id', requireAuth, async (req: Request & AuthenticatedRequest, res: Response) => {
  const reservation = isMongoConnected()
    ? await ReservationModel.findOne({ id: req.params.id })
    : dataStore.reservations.find((item) => item.id === req.params.id);

  if (!reservation) {
    return sendError(res, 404, 'RESERVATION_NOT_FOUND', 'Reservation not found.');
  }

  if (isMongoConnected()) {
    Object.assign(reservation, req.body ?? {});
    await reservation.save();
  } else {
    Object.assign(reservation, req.body ?? {});
  }

  return res.status(200).json({ reservation });
});

app.delete('/api/reservations/:id', requireAuth, async (req: Request & AuthenticatedRequest, res: Response) => {
  if (isMongoConnected()) {
    const deleted = await ReservationModel.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return sendError(res, 404, 'RESERVATION_NOT_FOUND', 'Reservation not found.');
    }
    return res.status(200).json({ deleted: true });
  }

  const index = dataStore.reservations.findIndex((item) => item.id === req.params.id);
  if (index < 0) {
    return sendError(res, 404, 'RESERVATION_NOT_FOUND', 'Reservation not found.');
  }

  dataStore.reservations.splice(index, 1);
  return res.status(200).json({ deleted: true });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  return sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong.');
});

const connectToMongo = async () => {
  try {
    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`Connected to MongoDB at ${config.mongodbUri}`);
  } catch (error) {
    console.warn('MongoDB not available; continuing with the in-memory store.', error);
  }
};

const startServer = async () => {
  await connectToMongo();
  await seedDatabaseIfNeeded();
  app.listen(config.port, () => {
    console.log(`Hotel booking API listening on http://localhost:${config.port}`);
  });
};

void startServer();

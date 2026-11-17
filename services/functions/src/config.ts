import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? '4000'),
  jwtSecret: process.env.JWT_SECRET ?? 'development-secret-change-me',
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/hotel-booking',
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
};

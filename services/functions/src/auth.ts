import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';
import { dataStore, isMongoConnected, UserModel } from './store.js';
import { AuthenticatedRequest, Role, User } from './types.js';

export const createPasswordHash = async (password: string) => bcrypt.hash(password, 10);

export const verifyPassword = async (password: string, hash: string) => bcrypt.compare(password, hash);

export const signJwt = (user: Pick<User, 'id' | 'email' | 'role'>) =>
  jwt.sign({ sub: user.id, email: user.email, role: user.role }, config.jwtSecret, { expiresIn: '12h' });

export const getCurrentUser = (authHeader?: string) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; email: string; role: Role };
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
};

export const requireAuth = (req: Request & AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const user = getCurrentUser(authHeader);

  if (!user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } });
  }

  req.user = user;
  return next();
};

export const findUserByEmail = async (email: string) => {
  if (isMongoConnected()) {
    const user = await UserModel.findOne({ email: String(email).toLowerCase() }).lean();
    return (user as unknown as User | null) ?? null;
  }

  return dataStore.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) ?? null;
};

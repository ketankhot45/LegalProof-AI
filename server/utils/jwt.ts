import 'dotenv/config';
import jwt from 'jsonwebtoken';

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('FATAL: JWT_SECRET environment variable is required to sign and verify security tokens.');
  }
  return secret.trim();
};

export interface JWTPayload {
  id: string;
  role: string;
  tokenVersion?: number;
}

export const generateToken = (userId: string, role: string, tokenVersion: number = 1): string => {
  return jwt.sign({ id: userId, role, tokenVersion }, getJwtSecret(), { expiresIn: '24h' });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, getJwtSecret()) as JWTPayload;
};


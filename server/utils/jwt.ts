import 'dotenv/config';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  return secret;
};

export const generateToken = (userId: string, role: string) => {
  return jwt.sign({ id: userId, role }, getJwtSecret(), { expiresIn: '1d' });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, getJwtSecret()) as { id: string; role: string };
};

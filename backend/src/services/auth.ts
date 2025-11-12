import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_TTL = process.env.JWT_TTL ?? '1h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required for authentication service.');
}

const SECRET: jwt.Secret = JWT_SECRET;
const SIGN_OPTIONS: jwt.SignOptions = { expiresIn: TOKEN_TTL as jwt.SignOptions['expiresIn'] };

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const createAuthToken = (payload: { sub: string; role: string }): string => {
  return jwt.sign(payload, SECRET, SIGN_OPTIONS);
};

export const verifyAuthToken = (token: string): { sub: string; role: string } => {
  return jwt.verify(token, SECRET) as { sub: string; role: string };
};

// lib/auth.ts
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

export interface AuthPayload {
  userId: string;
  tenantId: string;
  role: 'Admin' | 'Member';
}

// ----------------------
// Password helpers
// ----------------------
export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

// ----------------------
// JWT helpers
// ----------------------

// Allowed string formats for jwt `expiresIn`
type StringValue =
  | `${number}ms`
  | `${number}s`
  | `${number}m`
  | `${number}h`
  | `${number}d`;

// Sign a JWT
export function signToken(payload: AuthPayload, expiresIn: StringValue = '1h'): string {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not defined');

  const secret: string = process.env.JWT_SECRET;
  const options: SignOptions = { expiresIn };

  return jwt.sign(payload, secret, options);
}

// Verify a JWT
export function verifyToken(token: string): AuthPayload {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not defined');

  const secret: string = process.env.JWT_SECRET;

  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    return payload;
  } catch {
    throw new Error('Invalid or expired token');
  }
}

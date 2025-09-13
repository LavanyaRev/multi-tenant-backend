import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: string;
  tenantId: string;
  role: 'Admin' | 'Member';
}

export function verifyToken(token: string): AuthPayload {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not defined');

  try {
    // ✅ Use jwt.verify, not Jwt.verify
    const payload = jwt.verify(token, process.env.JWT_SECRET) as AuthPayload;
    return payload;
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
}

// lib/middleware.ts
import { verifyToken, AuthPayload } from './auth';

export type AuthRequest = Request & {
  user: AuthPayload & { plan?: 'Free' | 'Pro' };
};

// Generic wrapper preserving RouteContext
export function requireAuth<T extends { params: Record<string, string> }>(
  handler: (req: AuthRequest, context: T) => Promise<Response>
) {
  return async (req: AuthRequest, context: T): Promise<Response> => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    try {
      const user = verifyToken(token);
      (req as AuthRequest).user = user;
      return handler(req as AuthRequest, context);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401 });
    }
  };
}

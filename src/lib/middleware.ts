// lib/middleware.ts
import { verifyToken, AuthPayload } from './auth';
import { prisma } from './prisma';

export type AuthRequest = Request & {
  user: AuthPayload & { plan?: 'Free' | 'Pro' }; 
};

export function requireAuth(
  handler: (req: AuthRequest, context?: { params?: Record<string, string> }) => Promise<Response>
) {
  return async (req: Request, context?: { params?: Record<string, string> }): Promise<Response> => {
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

export async function enforceTenantOwnership(
  req: AuthRequest,
  resourceTenantId: string
): Promise<Response | null> {
  if (req.user.tenantId !== resourceTenantId) {
    return new Response(JSON.stringify({ error: 'Resource not found' }), { status: 404 });
  }
  return null;
}


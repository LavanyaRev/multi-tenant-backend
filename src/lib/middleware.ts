// lib/middleware.ts
import { verifyToken, AuthPayload } from './auth';
import { prisma } from './prisma'; // assuming you're using Prisma

export type AuthRequest = Request & {
  user: AuthPayload & { plan?: 'Free' | 'Pro' }; // include plan if needed
};

/**
 * requireAuth
 * - Verifies JWT
 * - Attaches user info to req.user
 */
export function requireAuth(
  handler: (req: AuthRequest, context: { params: Record<string, string> }) => Promise<Response>
) {
  return async (req: Request, context: { params: Record<string, string> }): Promise<Response> => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
      const user = verifyToken(token); // { id, email, tenantId, role }

      // Optionally fetch tenant info (like plan)
      const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
      (req as AuthRequest).user = { ...user, plan: tenant?.plan ?? 'Free' };

      return handler(req as AuthRequest, context);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 401 });
    }
  };
}

/**
 * requireAdmin
 * - Only allows Admin users
 */
export function requireAdmin(
  handler: (req: AuthRequest, context: { params: Record<string, string> }) => Promise<Response>
) {
  return requireAuth(async (req: AuthRequest, context) => {
    if (req.user.role !== 'Admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admins only' }), { status: 403 });
    }
    return handler(req, context);
  });
}

/**
 * enforceTenantOwnership
 * - Ensures the resource belongs to the tenant
 */
export async function enforceTenantOwnership(
  req: AuthRequest,
  resourceTenantId: string
): Promise<Response | null> {
  if (req.user.tenantId !== resourceTenantId) {
    return new Response(JSON.stringify({ error: 'Resource not found' }), { status: 404 });
  }
  return null;
}

/**
 * enforceFreePlanLimit
 * - Checks if tenant on Free plan has reached note limit
 */
export async function enforceFreePlanLimit(req: AuthRequest): Promise<Response | null> {
  if (req.user.plan === 'Free') {
    const count = await prisma.note.count({ where: { tenantId: req.user.tenantId } });
    if (count >= 3) {
      return new Response(JSON.stringify({ error: 'Free plan limit reached. Upgrade to Pro.' }), { status: 403 });
    }
  }
  return null;
}

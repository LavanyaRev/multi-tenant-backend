// app/api/tenants/[slug]/upgrade/route.ts
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthRequest } from '@/lib/middleware';
import { NextResponse } from 'next/server';

// Helper to safely get slug
const getSlug = (context?: { params?: Record<string, string> }) => context?.params?.slug;

export const POST = requireAuth(async (req: AuthRequest, context?) => {
  const slug = getSlug(context);
  const user = req.user;

  if (!slug) {
    return NextResponse.json({ error: 'Missing tenant slug' }, { status: 400 });
  }

  // Only Admins can upgrade
  if (user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden: Only Admin can upgrade tenant' }, { status: 403 });
  }

  // Fetch the tenant by slug
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // Ensure Admin belongs to this tenant
  if (tenant.id !== user.tenantId) {
    return NextResponse.json({ error: 'Forbidden: You can only upgrade your own tenant' }, { status: 403 });
  }

  // Upgrade tenant plan to Pro
  const updatedTenant = await prisma.tenant.update({
    where: { slug },
    data: { plan: 'PRO' },
  });

  return NextResponse.json({
    message: 'Tenant upgraded successfully',
    tenant: {
      id: updatedTenant.id,
      name: updatedTenant.name,
      slug: updatedTenant.slug,
      plan: updatedTenant.plan,
    },
  });
});

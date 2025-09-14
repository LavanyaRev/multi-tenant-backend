// app/api/tenants/[slug]/upgrade/route.ts
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthRequest } from '@/lib/middleware';
import { NextResponse } from 'next/server';

export const POST = requireAuth(async (req: AuthRequest, { params }) => {
  const slug = params.slug;
  const user = req.user;

  // 1️⃣ Only Admins can upgrade
  if (user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden: Only Admin can upgrade tenant' }, { status: 403 });
  }

  // 2️⃣ Fetch the tenant by slug
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  // 3️⃣ Ensure Admin belongs to this tenant
  if (tenant.id !== user.tenantId) {
    return NextResponse.json({ error: 'Forbidden: You can only upgrade your own tenant' }, { status: 403 });
  }

  // 4️⃣ Upgrade tenant plan to Pro
  const updatedTenant = await prisma.tenant.update({
    where: { slug },
    data: { plan: 'Pro' },
  });

  // 5️⃣ Respond with success
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

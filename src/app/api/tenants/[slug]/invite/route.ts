// app/api/tenants/[slug]/invite/route.ts
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthRequest } from '@/lib/middleware';
import { NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth'; // optional, if creating password now

export const POST = requireAuth(async (req: AuthRequest, { params }) => {
  const slug = params.slug;
  const user = req.user;

  // 1️⃣ Only Admins can invite
  if (user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden: Only Admin can invite users' }, { status: 403 });
  }

  // 2️⃣ Fetch tenant by slug
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (!tenant || tenant.id !== user.tenantId) {
    return NextResponse.json({ error: 'Tenant not found or you cannot invite users to this tenant' }, { status: 403 });
  }

  // 3️⃣ Get invite data from request body
  const { email, role, password } = await req.json();

  if (!email || !role || !password) {
    return NextResponse.json({ error: 'Email, role, and password are required' }, { status: 400 });
  }

  // 4️⃣ Create the new user in the same tenant
  const newUser = await prisma.user.create({
    data: {
      email,
      role,             // Admin or Member
      password: await hashPassword(password), // hash before storing
      tenantId: tenant.id,
    },
  });

  // 5️⃣ Return success response
  return NextResponse.json({
    message: 'User invited successfully',
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      tenantId: newUser.tenantId,
    },
  });
});

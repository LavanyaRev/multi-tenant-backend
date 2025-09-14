// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, signToken, AuthPayload } from '@/lib/auth';

export const POST = async (req: NextRequest) => {
  try {
    const { email, password, tenantSlug, role } = await req.json();

    if (!email || !password || !tenantSlug) {
      return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
    }

    // Find the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists.' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = hashPassword(password);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: role || 'Member',
        tenantId: tenant.id,
      },
    });

    // Generate JWT
    const payload: AuthPayload = {
      userId: newUser.id,
      tenantId: tenant.id,
      role: newUser.role as 'Admin' | 'Member',
    };

    const token = signToken(payload, '1h');

    return NextResponse.json({ token, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
};

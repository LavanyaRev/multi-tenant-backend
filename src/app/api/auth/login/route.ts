// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signToken, AuthPayload } from '@/lib/auth';

export const POST = async (req: NextRequest) => {
  try {
    // Validate body
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Normalize role
    const role: 'Admin' | 'Member' =
      user.role.toLowerCase() === 'admin' ? 'Admin' : 'Member';

    // Create JWT
    const payload: AuthPayload = {
      userId: user.id,
      tenantId: user.tenantId,
      role,
    };

    const token = signToken(payload, '8h');

    return NextResponse.json({ token, user });
  } catch (err: unknown) {
    console.error('Login error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

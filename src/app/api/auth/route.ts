// src/app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthRequest } from '@/lib/middleware';
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

/**
 * Handler to return authenticated user info
 */
const handler = async (req: AuthRequest) => {
  const user = req.user;

  // Fetch user details from DB (optional: include tenant info)
  const dbUser = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: dbUser }, { status: 200 });
};

// ✅ Wrap with auth
export const GET = requireAuth(handler);

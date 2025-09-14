// app/api/auth/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthRequest } from '@/lib/middleware';

const handler = async (req: AuthRequest) => {
  const user = req.user;
  const notes = await prisma.note.findMany({
    where: { tenantId: user.tenantId },
  });

  return NextResponse.json(notes);
};

// ✅ no casting needed
export const GET = requireAuth(handler);

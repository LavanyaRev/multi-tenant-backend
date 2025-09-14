import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, AuthRequest } from '@/lib/middleware';

// handler function
const handler = async (req: AuthRequest) => {
  const user = req.user; // comes from requireAuth
  const notes = await prisma.note.findMany({
    where: { tenantId: user.tenantId },
  });

  return NextResponse.json(notes);
};

// ✅ wrap with auth
export const GET = requireAuth(handler);

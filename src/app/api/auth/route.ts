import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

const handler = async (req: any) => {
  const { user } = req; // comes from requireAuth
  const notes = await prisma.note.findMany({
    where: { tenantId: user.tenantId },
  });
  return NextResponse.json(notes);
};

// ✅ wrap with auth
export const GET = requireAuth(handler);

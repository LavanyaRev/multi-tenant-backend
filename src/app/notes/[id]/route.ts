// app/api/notes/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';
import { NextResponse } from 'next/server';

export const GET = requireAuth(async (req, { params }) => {
  const note = await prisma.note.findFirst({
    where: { id: params.id as string, tenantId: req.user.tenantId },
  });

  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  return NextResponse.json(note);
});

export const PUT = requireAuth(async (req, { params }) => {
  const id = params.id as string;
  const note = await prisma.note.findFirst({ where: { id, tenantId: req.user.tenantId } });
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

  if (req.user.role !== 'Admin' && note.userId !== req.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const updated = await prisma.note.update({
    where: { id },
    data: { title: body.title, content: body.content },
  });

  return NextResponse.json(updated);
});

export const DELETE = requireAuth(async (req, { params }) => {
  const id = params.id as string;
  const note = await prisma.note.findFirst({ where: { id, tenantId: req.user.tenantId } });
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 });

  if (req.user.role !== 'Admin' && note.userId !== req.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.note.delete({ where: { id } });
  return NextResponse.json(null, { status: 204 });
});

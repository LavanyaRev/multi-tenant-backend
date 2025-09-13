// app/api/notes/[id]/route.ts
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/middleware';

export const GET = requireAuth(async (req, { params }) => {
  const id = params.id as string;
  const user = req.user;

  const note = await prisma.note.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!note) return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });

  return new Response(JSON.stringify(note));
});

export const PUT = requireAuth(async (req, { params }) => {
  const id = params.id as string;
  const user = req.user;
  const body = await req.json();

  const note = await prisma.note.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!note) return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });
  if (user.role !== 'Admin' && note.userId !== user.userId) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const updated = await prisma.note.update({
    where: { id },
    data: { title: body.title, content: body.content },
  });

  return new Response(JSON.stringify(updated));
});

export const DELETE = requireAuth(async (req, { params }) => {
  const id = params.id as string;
  const user = req.user;

  const note = await prisma.note.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!note) return new Response(JSON.stringify({ error: 'Note not found' }), { status: 404 });
  if (user.role !== 'Admin' && note.userId !== user.userId) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  await prisma.note.delete({ where: { id } });
  return new Response(null, { status: 204 });
});

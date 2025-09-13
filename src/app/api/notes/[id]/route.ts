// app/api/notes/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthRequest } from "@/lib/middleware";

// App Router always passes context.params as Record<string, string>
export const GET = requireAuth(async (req: AuthRequest, { params }: { params: Record<string, string> }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing note ID" }), { status: 400 });
  }

  const note = await prisma.note.findFirst({
    where: { id, tenantId: req.user.tenantId },
  });

  if (!note) {
    return new Response(JSON.stringify({ error: "Note not found" }), { status: 404 });
  }

  return new Response(JSON.stringify(note), { status: 200 });
});

export const PUT = requireAuth(async (req: AuthRequest, { params }: { params: Record<string, string> }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing note ID" }), { status: 400 });
  }

  const body = await req.json();

  const existing = await prisma.note.findFirst({
    where: { id, tenantId: req.user.tenantId },
  });

  if (!existing) {
    return new Response(JSON.stringify({ error: "Note not found" }), { status: 404 });
  }

  if (req.user.role !== "Admin" && existing.userId !== req.user.userId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  const updated = await prisma.note.update({
    where: { id },
    data: {
      title: body.title,
      content: body.content,
    },
  });

  return new Response(JSON.stringify(updated), { status: 200 });
});

export const DELETE = requireAuth(async (req: AuthRequest, { params }: { params: Record<string, string> }) => {
  const id = params.id;
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing note ID" }), { status: 400 });
  }

  const existing = await prisma.note.findFirst({
    where: { id, tenantId: req.user.tenantId },
  });

  if (!existing) {
    return new Response(JSON.stringify({ error: "Note not found" }), { status: 404 });
  }

  if (req.user.role !== "Admin" && existing.userId !== req.user.userId) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  await prisma.note.delete({ where: { id } });

  return new Response(null, { status: 204 });
});

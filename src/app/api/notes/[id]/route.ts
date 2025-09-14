// src/app/api/notes/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthRequest } from "@/lib/middleware";
import { NextResponse } from "next/server";

// Helper to safely get note ID
const getId = (context?: { params?: Record<string, string> }) => context?.params?.id;

// GET /api/notes/:id → fetch note
export const GET = requireAuth(async (req: AuthRequest, context?) => {
  const id = getId(context);
  if (!id) return NextResponse.json({ error: "Missing note ID" }, { status: 400 });

  const note = await prisma.note.findFirst({ where: { id, tenantId: req.user.tenantId } });
  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  return NextResponse.json(note, { status: 200 });
});

// PUT /api/notes/:id → update note
export const PUT = requireAuth(async (req: AuthRequest, context?) => {
  const id = getId(context);
  if (!id) return NextResponse.json({ error: "Missing note ID" }, { status: 400 });

  const body = await req.json();
  const existing = await prisma.note.findFirst({ where: { id, tenantId: req.user.tenantId } });

  if (!existing) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  if (req.user.role !== "Admin" && existing.userId !== req.user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.note.update({
    where: { id },
    data: { title: body.title, content: body.content },
  });

  return NextResponse.json(updated, { status: 200 });
});

// DELETE /api/notes/:id → delete note
export const DELETE = requireAuth(async (req: AuthRequest, context?) => {
  const id = getId(context);
  if (!id) return NextResponse.json({ error: "Missing note ID" }, { status: 400 });

  const existing = await prisma.note.findFirst({ where: { id, tenantId: req.user.tenantId } });
  if (!existing) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  if (req.user.role !== "Admin" && existing.userId !== req.user.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.note.delete({ where: { id } });
  return new Response(null, { status: 204 });
});

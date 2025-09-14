// src/app/notes/route.ts
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthRequest, enforceFreePlanLimit, enforceTenantOwnership } from "@/lib/middleware";
import { NextResponse } from "next/server";

// GET /api/notes → list all notes for tenant
export const GET = requireAuth(async (req: AuthRequest) => {
  const notes = await prisma.note.findMany({
    where: { tenantId: req.user.tenantId },
  });
  return NextResponse.json(notes);
});

// POST /api/notes → create a new note
export const POST = requireAuth(async (req: AuthRequest) => {
  const body = await req.json();

  // Free plan limit check
  const limitError = await enforceFreePlanLimit(req);
  if (limitError) return limitError;

  const note = await prisma.note.create({
    data: {
      title: body.title,
      content: body.content,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
    },
  });

  return NextResponse.json(note, { status: 201 });
});

// GET /api/notes/:id → retrieve a single note
export const GET_BY_ID = requireAuth(async (req: AuthRequest, context: { params: { id: string } }) => {
  const { id } = context.params;
  const note = await prisma.note.findUnique({ where: { id } });

  const ownershipError = await enforceTenantOwnership(req, note?.tenantId ?? "");
  if (ownershipError) return ownershipError;

  return NextResponse.json(note);
});

// PUT /api/notes/:id → update a note
export const PUT = requireAuth(async (req: AuthRequest, context: { params: { id: string } }) => {
  const { id } = context.params;
  const body = await req.json();

  const note = await prisma.note.findUnique({ where: { id } });
  const ownershipError = await enforceTenantOwnership(req, note?.tenantId ?? "");
  if (ownershipError) return ownershipError;

  const updatedNote = await prisma.note.update({
    where: { id },
    data: { title: body.title, content: body.content },
  });

  return NextResponse.json(updatedNote);
});

// DELETE /api/notes/:id → delete a note
export const DELETE = requireAuth(async (req: AuthRequest, context: { params: { id: string } }) => {
  const { id } = context.params;

  const note = await prisma.note.findUnique({ where: { id } });
  const ownershipError = await enforceTenantOwnership(req, note?.tenantId ?? "");
  if (ownershipError) return ownershipError;

  await prisma.note.delete({ where: { id } });
  return new NextResponse(null, { status: 204 });
});

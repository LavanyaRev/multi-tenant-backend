// src/app/api/notes/route.ts
import { prisma } from "@/lib/prisma";
import { verifyToken, AuthPayload } from "@/lib/auth";
import { NextResponse } from "next/server";

// Typed request with attached user
type AuthRequest = Request & { user: AuthPayload };

// App Router-compatible auth wrapper
export function requireAuth(
  handler: (req: AuthRequest) => Promise<Response>
) {
  return async (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    try {
      const user = verifyToken(token);
      (req as AuthRequest).user = user;
      return handler(req as AuthRequest);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
  };
}

// GET /api/notes → list all notes for tenant
export const GET = requireAuth(async (req: AuthRequest) => {
  const notes = await prisma.note.findMany({
    where: { tenantId: req.user.tenantId },
  });

  const res = NextResponse.json(notes, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
});

// POST /api/notes → create a new note (enforces Free plan limit)
export const POST = requireAuth(async (req: AuthRequest) => {
  const body = await req.json();
  const user = req.user;

  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // Free plan limit: max 3 notes
  const noteCount = await prisma.note.count({ where: { tenantId: user.tenantId } });
  if (tenant.plan === "FREE" && noteCount >= 3) {
    return NextResponse.json({ error: "Free plan limit reached. Upgrade to Pro." }, { status: 403 });
  }

  const note = await prisma.note.create({
    data: {
      title: body.title,
      content: body.content,
      tenantId: user.tenantId,
      userId: user.userId,
    },
  });

  const res = NextResponse.json(note, { status: 201 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
});

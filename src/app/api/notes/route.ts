import { prisma } from "@/lib/prisma";
import { verifyToken, AuthPayload } from "@/lib/auth";
import { NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */

// Typed request with user info
export type AuthRequest = Request & { user: AuthPayload & { plan?: "Free" | "Pro" } };

// Auth wrapper compatible with App Router
export function requireAuth(
  handler: (req: AuthRequest) => Promise<Response>
) {
  return async (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
    }

    try {
      const token = authHeader.split(" ")[1];
      const user = verifyToken(token);

      // Fetch tenant plan
      const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
      const plan = tenant?.plan === "FREE" ? "Free" : "Pro";

      (req as AuthRequest).user = { ...user, plan };

      return handler(req as AuthRequest);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
  };
}

// GET /api/notes
export const GET = requireAuth(async (req: AuthRequest) => {
  const notes = await prisma.note.findMany({ where: { tenantId: req.user.tenantId } });
  const res = NextResponse.json(notes, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
});

// POST /api/notes
export const POST = requireAuth(async (req: AuthRequest) => {
  const body = await req.json();
  const user = req.user;

  // Fetch tenant
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  // Normalize plan
  const plan = tenant.plan === "FREE" ? "Free" : "Pro";

  // Free plan limit
  const noteCount = await prisma.note.count({ where: { tenantId: user.tenantId } });
  if (plan === "Free" && noteCount >= 3) {
    return NextResponse.json({ error: "Free plan limit reached. Upgrade to Pro." }, { status: 403 });
  }

  // Create note
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

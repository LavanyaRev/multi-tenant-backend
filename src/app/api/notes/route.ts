// src/app/api/notes/route.ts
import { prisma } from "@/lib/prisma";
import { verifyToken, AuthPayload } from "@/lib/auth";
import { NextResponse } from "next/server";

// Define typed request with user
type AuthRequest = Request & { user: AuthPayload };

// App Router compatible auth wrapper
export function requireAuth(
  handler: (req: AuthRequest) => Promise<Response>
) {
  return async (req: Request) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    try {
      const user = verifyToken(token);
      // Attach user to request
      (req as AuthRequest).user = user;
      return handler(req as AuthRequest);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 401 });
    }
  };
}

// GET /api/notes
export const GET = requireAuth(async (req: AuthRequest) => {
  const notes = await prisma.note.findMany({
    where: { tenantId: req.user.tenantId },
  });
  return new Response(JSON.stringify(notes), { status: 200 });
});

// POST /api/notes
export const POST = requireAuth(async (req: AuthRequest) => {
  const body = await req.json();
  const user = req.user;

  const tenant = await prisma.tenant.findUnique({
    where: { id: user.tenantId},
  });
  if(!tenant){
    return NextResponse.json({ error: 'Tenant not found' }, {status: 404});
  }
  const noteCount = await prisma.note.count({
    where: { tenantId: user.tenantId },
  });

  if (tenant.plan === 'FREE' && noteCount >= 3) {
    return NextResponse.json(
      { error: 'Free plan limit reached. Upgrade to Pro.' },
      { status: 403 }
    );
  }


  const note = await prisma.note.create({
    data: {
      title: body.title,
      content: body.content,
      tenantId: req.user.tenantId,
      userId: req.user.userId,
    },
  });

  return new Response(JSON.stringify(note), { status: 201 });
});

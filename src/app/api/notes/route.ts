import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// GET /api/notes
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const user = verifyToken(token);

  const notes = await prisma.note.findMany({ where: { tenantId: user.tenantId } });
  const res = NextResponse.json(notes, { status: 200 });
  res.headers.set("Access-Control-Allow-Origin", "*");
  return res;
}

// POST /api/notes
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
  }

  const token = authHeader.split(" ")[1];
  const user = verifyToken(token);

  const body = await req.json();

  // Fetch tenant
  const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

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
}

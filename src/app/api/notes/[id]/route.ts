import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // ✅ unwrap the promise

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
  }

  const user = verifyToken(authHeader.split(" ")[1]);

  const note = await prisma.note.findFirst({
    where: { id, tenantId: user.tenantId },
  });

  if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  return NextResponse.json(note, { status: 200 });
}

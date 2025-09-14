import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params; // ✅ unwrap the promise

  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
  }

  const user = verifyToken(authHeader.split(" ")[1]);
  const body = await req.json();

  const invitedUser = await prisma.user.create({
    data: {
      email: body.email,
      role: "MEMBER",
      tenant: { connect: { slug } },
    },
  });

  return NextResponse.json(
    { message: "User invited successfully", user: invitedUser },
    { status: 200 }
  );
}

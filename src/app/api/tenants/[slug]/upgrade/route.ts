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

  const tenant = await prisma.tenant.update({
    where: { slug },
    data: { plan: "PRO" },
  });

  return NextResponse.json(
    { message: "Tenant upgraded successfully", tenant },
    { status: 200 }
  );
}

// src/app/api/tenants/[slug]/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, hashPassword } from "@/lib/auth";

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
  const { email, role, password } = body;

  // ✅ validate input
  if (!email || !role || !password) {
    return NextResponse.json(
      { error: "Email, role, and password are required" },
      { status: 400 }
    );
  }

  // ✅ check tenant
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.id !== user.tenantId) {
    return NextResponse.json(
      { error: "Tenant not found or you cannot invite users here" },
      { status: 403 }
    );
  }

  // ✅ only Admins can invite
  if (user.role !== "Admin") {
    return NextResponse.json(
      { error: "Forbidden: Only Admin can invite users" },
      { status: 403 }
    );
  }

  // ✅ create new user
  const invitedUser = await prisma.user.create({
    data: {
      email,
      role,
      password: await hashPassword(password), // hash before saving
      tenant: { connect: { slug } },
    },
  });

  return NextResponse.json(
    { message: "User invited successfully", user: invitedUser },
    { status: 200 }
  );
}

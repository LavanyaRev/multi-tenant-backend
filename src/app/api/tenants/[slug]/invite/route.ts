// src/app/api/tenants/[slug]/invite/route.ts
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthRequest } from "@/lib/middleware";
import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";

// Helper to safely get slug
const getSlug = (context?: { params?: Record<string, string> }) => context?.params?.slug;

export const POST = requireAuth(async (req: AuthRequest, context?) => {
  const slug = getSlug(context);
  const user = req.user;

  if (!slug) return NextResponse.json({ error: "Missing tenant slug" }, { status: 400 });

  // Only Admins can invite
  if (user.role !== "Admin") {
    return NextResponse.json({ error: "Forbidden: Only Admin can invite users" }, { status: 403 });
  }

  // Fetch tenant
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant || tenant.id !== user.tenantId) {
    return NextResponse.json(
      { error: "Tenant not found or you cannot invite users to this tenant" },
      { status: 403 }
    );
  }

  // Get invite data
  const { email, role, password } = await req.json();
  if (!email || !role || !password) {
    return NextResponse.json({ error: "Email, role, and password are required" }, { status: 400 });
  }

  // Create new user
  const newUser = await prisma.user.create({
    data: {
      email,
      role, // "Admin" or "Member"
      password: await hashPassword(password),
      tenantId: tenant.id,
    },
  });

  return NextResponse.json({
    message: "User invited successfully",
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      tenantId: newUser.tenantId,
    },
  });
});

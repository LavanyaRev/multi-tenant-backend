import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in your .env');
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, tenantSlug } = await req.json();

    // Find the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
    });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found.' }, { status: 404 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'MEMBER',
        tenantId: tenant.id,
      },
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, tenantId: tenant.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    return NextResponse.json({ token, user: newUser }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'User already exists.' }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

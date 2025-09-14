import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Define the type for the authorized request with the user object
interface AuthRequest extends NextRequest {
  user: { userId: string };
}

/**
 * Handler to return authenticated user info
 */
export const GET = async (req: NextRequest) => {
  // Check for authentication before proceeding
  const userId = req.headers.get('x-user-id'); // Or retrieve token from a cookie
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Create a modified request object with the user property
  const authReq = { ...req, user: { userId } } as AuthRequest;

  // Fetch user details from DB (optional: include tenant info)
  const dbUser = await prisma.user.findUnique({
    where: { id: authReq.user.userId },
    select: {
      id: true,
      email: true,
      role: true,
      tenantId: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user: dbUser }, { status: 200 });
};

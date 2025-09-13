import { prisma } from "@/lib/prisma";
import { requireAuth, AuthRequest } from "@/lib/middleware";

export const GET = requireAuth(async (req: AuthRequest) => {
  const notes = await prisma.note.findMany({
    where: { tenantId: req.user.tenantId },
  });
  return new Response(JSON.stringify(notes), { status: 200 });
});

export const POST = requireAuth(async (req: AuthRequest) => {
  const body = await req.json();

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

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { z } from 'zod';

const banUserSchema = z.object({
  userId: z.string().min(1),
  isBanned: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validated = banUserSchema.parse(body);

    const target = await db.user.findUnique({
      where: { id: validated.userId },
      select: { id: true, email: true },
    });

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updated = await db.user.update({
      where: { id: target.id },
      data: { isBanned: validated.isBanned },
      select: { id: true, isBanned: true },
    });

    return NextResponse.json({ message: 'User updated', user: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
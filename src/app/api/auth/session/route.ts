import { NextResponse } from 'next/server';
import { getSessionUser, authorizeAdmin } from '@/lib/auth';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const auth = await authorizeAdmin();

  return NextResponse.json({
    user,
    isAdmin: auth.allowed,
  });
}
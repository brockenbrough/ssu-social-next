// This API route is externally available.
// It is used by the register page to create a new user.

import { NextResponse } from 'next/server';
import { registerUser } from '@/app/lib/data';

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  try {
    await registerUser(name, email, password);
    return NextResponse.json({ message: 'User registered successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 400 });
  }
}

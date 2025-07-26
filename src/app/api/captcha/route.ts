import { NextResponse } from 'next/server';
import { createCaptcha } from '@/lib/captcha';
import { cookies } from 'next/headers';

export async function GET() {
  const captcha = createCaptcha({
    size: 6, // number of characters
    noise: 2,
    color: true,
    background: '#ffffff',
  });

  // Store the captcha text in an HTTP-only cookie
  // This is more secure than sending it to the client
  cookies().set('captcha', captcha.text, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 5, // 5 minutes
    path: '/',
  });

  return NextResponse.json({ svg: captcha.data });
}

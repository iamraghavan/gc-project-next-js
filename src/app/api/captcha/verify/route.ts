import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const { captcha: userInput } = await request.json();
  const cookieStore = cookies();
  const captchaCookie = cookieStore.get('captcha');

  if (!captchaCookie || !userInput) {
    return NextResponse.json({ message: 'Captcha not found or invalid input.' }, { status: 400 });
  }

  const storedCaptcha = captchaCookie.value;

  // Case-insensitive comparison
  if (userInput.toLowerCase() === storedCaptcha.toLowerCase()) {
    // Clear the cookie after successful verification
    cookies().delete('captcha');
    return NextResponse.json({ message: 'Success' });
  } else {
    return NextResponse.json({ message: 'Invalid captcha.' }, { status: 400 });
  }
}

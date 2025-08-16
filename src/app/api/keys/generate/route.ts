
import { NextResponse } from 'next/server';
import { authAdmin, dbAdmin } from '@/lib/firebase-admin';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    if (!authAdmin || !dbAdmin) {
      return NextResponse.json({ error: 'Authentication service not configured.' }, { status: 500 });
    }

    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    const apiKey = `gd_${randomBytes(24).toString('hex')}`;
    const keyData = {
      userId,
      key: apiKey,
      createdAt: new Date(),
    };
    
    await dbAdmin.collection('apiKeys').add(keyData);

    return NextResponse.json({ success: true, key: apiKey });

  } catch (error: any) {
    console.error('Error generating API key:', error);
    if (error.code === 'auth/id-token-expired') {
        return NextResponse.json({ error: 'Authentication token has expired. Please log in again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to generate key: ' + error.message }, { status: 500 });
  }
}

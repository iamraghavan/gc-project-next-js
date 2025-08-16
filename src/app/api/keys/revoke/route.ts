
import { NextResponse } from 'next/server';
import { authAdmin, dbAdmin } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token.' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    const { keyId } = await request.json();
    if (!keyId) {
        return NextResponse.json({ error: 'API Key ID is required.' }, { status: 400 });
    }

    if (!authAdmin || !dbAdmin) {
      return NextResponse.json({ error: 'Authentication service not configured.' }, { status: 500 });
    }

    const decodedToken = await authAdmin.verifyIdToken(token);
    const userId = decodedToken.uid;

    const keyDocRef = dbAdmin.collection('apiKeys').doc(keyId);
    const keyDoc = await keyDocRef.get();

    if (!keyDoc.exists) {
        return NextResponse.json({ error: 'API Key not found.' }, { status: 404 });
    }
    
    if (keyDoc.data()?.userId !== userId) {
        return NextResponse.json({ error: 'Permission denied. You can only revoke your own keys.' }, { status: 403 });
    }
    
    await keyDocRef.delete();

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error revoking API key:', error);
    return NextResponse.json({ error: 'Failed to revoke key: ' + error.message }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { authAdmin, dbAdmin } from '@/lib/firebase-admin';

export async function GET(request: Request) {
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
    
    const snapshot = await dbAdmin.collection('apiKeys').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
    
    if (snapshot.empty) {
      return NextResponse.json({ keys: [] });
    }
    
    const keys = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    return NextResponse.json({ keys });

  } catch (error: any) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch keys: ' + error.message }, { status: 500 });
  }
}

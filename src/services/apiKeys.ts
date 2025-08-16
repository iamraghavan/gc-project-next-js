
'use server'

import 'dotenv/config';

// This server-side function is for the public file upload API endpoint to use.
// It validates the static API key from the environment variables.

export async function validateApiKey(key: string): Promise<boolean> {
  const staticKey = process.env.STATIC_API_KEY;

  if (!staticKey) {
    console.error("STATIC_API_KEY environment variable is not set.");
    return false;
  }
  
  return key === staticKey;
}

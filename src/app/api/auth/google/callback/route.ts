// src/app/api/auth/google/callback/route.ts
import { NextResponse } from 'next/server';
import fetch from 'node-fetch';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return new Response('Missing code', { status: 400 });
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
            grant_type: 'authorization_code',
        }),
    });

    const data = await tokenRes.json();
    console.log('TOKEN RESPONSE:', data);

    return NextResponse.json(data);
}

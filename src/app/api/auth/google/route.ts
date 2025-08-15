// src/app/api/auth/google/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const options: Record<string, string> = {
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        access_type: 'offline',
        response_type: 'code',
        prompt: 'consent',
        scope: [
            'https://www.googleapis.com/auth/drive.file',
        ].join(' '),
    };

    const qs = new URLSearchParams(options).toString();
    return NextResponse.redirect(`${rootUrl}?${qs}`);
}

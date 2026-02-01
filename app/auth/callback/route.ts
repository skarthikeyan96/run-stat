// app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { StravaClient } from '@/lib/strava';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    console.log('=== OAUTH CALLBACK STARTED ===');
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    console.log('Code received:', code ? 'YES' : 'NO');
    // Handle authorization error
    if (error) {
        return NextResponse.redirect(
            new URL(`/?error=${error}`, request.url)
        );
    }

    if (!code) {
        return NextResponse.redirect(
            new URL('/?error=no_code', request.url)
        );
    }

    try {
        const stravaClient = new StravaClient();
        const tokenData = await stravaClient.getToken(code);

        // Await cookies() before using it
        const cookieStore = await cookies();

        // Store token in cookie (httpOnly for security)
        cookieStore.set('strava_token', tokenData.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: tokenData.expires_at - Math.floor(Date.now() / 1000),
            path: '/',
        });

        // Store athlete info (can be read client-side)
        cookieStore.set('athlete_name',
            `${tokenData.athlete.firstname} ${tokenData.athlete.lastname}`,
            {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                maxAge: tokenData.expires_at - Math.floor(Date.now() / 1000),
                path: '/',
            }
        );

        // Redirect to dashboard/customize page
        return NextResponse.redirect(new URL('/customize', request.url));
    } catch (error) {
        console.error('OAuth error:', error);
        return NextResponse.redirect(
            new URL('/?error=oauth_failed', request.url)
        );
    }
}
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('strava_token');

    return NextResponse.json({
        hasToken: !!token,
        tokenPreview: token ? token.value.substring(0, 10) + '...' : null,
        allCookies: cookieStore.getAll().map(c => ({
            name: c.name,
            hasValue: !!c.value,
            path: c.path
        }))
    });
}
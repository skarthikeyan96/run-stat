// app/api/strava/activities/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    console.log('=== ACTIVITIES ENDPOINT CALLED ===');

    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('strava_token')?.value;

        if (!token) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        // Get filter parameters
        const { searchParams } = new URL(request.url);
        const activityType = searchParams.get('type') || 'all'; // all, Run, Ride, Hike
        const page = parseInt(searchParams.get('page') || '1');
        const perPage = 20;

        console.log(`Fetching activities: type=${activityType}, page=${page}`);

        // Fetch from Strava
        const response = await fetch(
            `https://www.strava.com/api/v3/athlete/activities?per_page=${perPage}&page=${page}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
            throw new Error(`Strava API returned ${response.status}`);
        }

        const activities = await response.json();

        // Filter by type if needed
        const filtered = activityType === 'all'
            ? activities
            : activities.filter((a: any) => a.type === activityType);

        console.log(`Fetched ${activities.length} activities, filtered to ${filtered.length}`);

        return NextResponse.json({
            activities: filtered,
            page,
            hasMore: activities.length === perPage
        });

    } catch (error: any) {
        console.error('Error fetching activities:', error.message);
        return NextResponse.json(
            { error: 'Failed to fetch activities' },
            { status: 500 }
        );
    }
}
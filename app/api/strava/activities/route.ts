// app/api/strava/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { StravaClient } from '@/lib/strava';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
    const cookieStore = await cookies(); // Await here too
    const token = cookieStore.get('strava_token')?.value;

    if (!token) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 }
        );
    }

    try {
        const stravaClient = new StravaClient();
        const activities = await stravaClient.getActivities(token, 200);

        // Filter to only return running activities (Run, TrailRun, VirtualRun)
        const runActivities = activities.filter(
            (activity) => activity.type === 'Run' || activity.type === 'TrailRun' || activity.type === 'VirtualRun'
        );

        return NextResponse.json({ activities: runActivities });
    } catch (error) {
        console.error('Failed to fetch activities:', error);
        return NextResponse.json(
            { error: 'Failed to fetch activities' },
            { status: 500 }
        );
    }
}
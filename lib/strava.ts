// lib/strava.ts
import { StravaActivity, StravaTokenResponse } from './types';

const STRAVA_AUTH_URL = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API_URL = 'https://www.strava.com/api/v3';

export class StravaClient {
    private clientId: string;
    private clientSecret: string;
    private redirectUri: string;

    constructor() {
        this.clientId = process.env.STRAVA_CLIENT_ID!;
        this.clientSecret = process.env.STRAVA_CLIENT_SECRET!;
        this.redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI!;
    }

    // Generate OAuth URL
    getAuthUrl(): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.redirectUri,
            response_type: 'code',
            scope: 'read,activity:read', // ← This line
        });

        return `${STRAVA_AUTH_URL}?${params.toString()}`;
    }

    // Exchange code for token
    async getToken(code: string): Promise<StravaTokenResponse> {
        const response = await fetch(STRAVA_TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code,
                grant_type: 'authorization_code',
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to get token');
        }

        return response.json();
    }

    // Fetch athlete activities
    async getActivities(
        accessToken: string,
        perPage: number = 200
    ): Promise<StravaActivity[]> {
        const response = await fetch(
            `${STRAVA_API_URL}/athlete/activities?per_page=${perPage}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch activities');
        }

        return response.json();
    }

    // Get single activity details
    async getActivity(
        accessToken: string,
        activityId: number
    ): Promise<StravaActivity> {
        const response = await fetch(
            `${STRAVA_API_URL}/activities/${activityId}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch activity');
        }

        return response.json();
    }

    // lib/strava.ts
    async getActivityDetails(token: string, activityId: number) {
        const response = await fetch(
            `${STRAVA_API_URL}/activities/${activityId}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );
        return response.json();
    }
}
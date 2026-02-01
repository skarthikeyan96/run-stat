// lib/types.ts
export interface StravaActivity {
    id: number;
    name: string;
    distance: number;          // meters
    moving_time: number;       // seconds
    elapsed_time: number;      // seconds
    total_elevation_gain: number;
    type: string;              // "Run", "Ride", etc.
    start_date: string;        // ISO 8601
    start_date_local: string;
    average_speed: number;     // m/s
    max_speed: number;         // m/s
    map: {
        summary_polyline: string;
    };
}

export interface Achievement {
    type: 'fastest5K' | 'fastest10K' | 'longestRun' | 'bestPace';
    label: string;
    activity: StravaActivity;
    value: string;             // "21:15" or "42.2 km"
    date: string;
}

export interface StravaTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    athlete: {
        id: number;
        username: string;
        firstname: string;
        lastname: string;
    };
}

// Add this to your existing types.ts
export interface Achievement {
    type: 'fastest5K' | 'fastest10K' | 'longestRun' | 'bestPace';
    label: string;
    activity: StravaActivity;
    value: string;             // "21:15" or "42.2 km" or "4:15 /km"
    date: string;
}
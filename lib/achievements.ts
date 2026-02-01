// lib/achievements.ts
import { StravaActivity, Achievement } from './types';
import { StravaClient } from '@/lib/strava';

// export function detectAchievements(activities: StravaActivity[]): Achievement[] {
//     const achievements: Achievement[] = [];

//     // Filter only GPS-tracked running activities
//     const runs = activities.filter(
//         a => (a.type === 'Run' || a.type === 'TrailRun' || a.type === 'VirtualRun') &&
//             hasGPSData(a) // ← Add this check
//     );

//     if (runs.length === 0) return achievements;

//     // Fastest 5K
//     const fastest5K = findFastest5K(runs);
//     if (fastest5K) achievements.push(fastest5K);

//     // Fastest 10K
//     const fastest10K = findFastest10K(runs);
//     if (fastest10K) achievements.push(fastest10K);

//     // Longest Run
//     const longestRun = findLongestRun(runs);
//     if (longestRun) achievements.push(longestRun);

//     // Best Pace
//     const bestPace = findBestPace(runs);
//     if (bestPace) achievements.push(bestPace);

//     return achievements;
// }


// Helper function to check if activity has GPS data

export async function detectAchievements(
    activities: StravaActivity[],
    token: string
): Promise<Achievement[]> {
    const achievements: Achievement[] = [];
    const stravaClient = new StravaClient()

    // Track best PRs across all activities
    const prs = {
        fastest5K: null as any,
        fastest10K: null as any,
        longestRun: null as any,
        bestPace: null as any
    };

    // Only check GPS-tracked runs
    const runs = activities.filter(
        a => (a.type === 'Run' || a.type === 'TrailRun') && hasGPSData(a)
    );

    // Process first 50 activities to find PRs (avoid rate limits)
    for (const activity of runs.slice(0, 50)) {
        try {
            // Fetch detailed activity with best_efforts
            // const detailed = await fetch(
            //     `https://www.strava.com/api/v3/activities/${activity.id}`,
            //     { headers: { Authorization: `Bearer ${token}` } }
            // ).then(r => r.json());

            const detailed = await stravaClient.getActivityDetails(token, activity.id);
            const bestEfforts = detailed.best_efforts || [];

            // Check for 5K PR
            const fiveK = bestEfforts.find((e: any) => e.name === '5k');
            if (fiveK && (!prs.fastest5K || fiveK.elapsed_time < prs.fastest5K.elapsed_time)) {
                prs.fastest5K = {
                    ...fiveK,
                    activity,
                    activityName: activity.name,
                    date: activity.start_date
                };
                console.log('5K PR:', fiveK.elapsed_time, 'seconds');
            }

            // Check for 10K PR
            const tenK = bestEfforts.find((e: any) => e.name === '10k');
            if (tenK && (!prs.fastest10K || tenK.elapsed_time < prs.fastest10K.elapsed_time)) {
                prs.fastest10K = {
                    ...tenK,
                    activity,
                    activityName: activity.name,
                    date: activity.start_date
                };
            }

        } catch (err) {
            console.error(`Failed to fetch activity ${activity.id}:`, err);
        }
    }

    // Convert to Achievement format
    if (prs.fastest5K) {
        achievements.push({
            type: 'fastest5K',
            label: 'Fastest 5K',
            activity: prs.fastest5K.activity,
            value: formatTime(prs.fastest5K.elapsed_time),
            date: new Date(prs.fastest5K.date).toLocaleDateString()
        });
    }

    if (prs.fastest10K) {
        achievements.push({
            type: 'fastest10K',
            label: 'Fastest 10K',
            activity: prs.fastest10K.activity,
            value: formatTime(prs.fastest10K.elapsed_time),
            date: new Date(prs.fastest10K.date).toLocaleDateString()
        });
    }

    // Longest Run and Best Pace can still use your existing logic
    const longestRun = findLongestRun(runs);
    if (longestRun) achievements.push(longestRun);

    const bestPace = findBestPace(runs);
    if (bestPace) achievements.push(bestPace);

    return achievements;
}

function hasGPSData(activity: StravaActivity): boolean {
    return !!(
        activity.map &&
        activity.map.summary_polyline &&
        activity.map.summary_polyline.length > 0
    );
}


function findFastest5K(runs: StravaActivity[]): Achievement | null {
    const fiveKRuns = runs.filter(r =>
        r.distance >= 4800 && r.distance <= 5200
    );

    if (fiveKRuns.length === 0) return null;

    // Sort by ELAPSED time, not moving time
    const fastest = fiveKRuns.sort((a, b) =>
        a.elapsed_time - b.elapsed_time  // ← Changed from moving_time
    )[0];

    return {
        type: 'fastest5K',
        label: 'Fastest 5K',
        activity: fastest,
        value: formatTime(fastest.elapsed_time),  // ← Changed from moving_time
        date: new Date(fastest.start_date).toLocaleDateString(),
    };
}

function findFastest10K(runs: StravaActivity[]): Achievement | null {
    const tenKRuns = runs.filter(r =>
        r.distance >= 9800 && r.distance <= 10200
    );

    if (tenKRuns.length === 0) return null;

    // Sort by ELAPSED time
    const fastest = tenKRuns.sort((a, b) =>
        a.elapsed_time - b.elapsed_time
    )[0];

    return {
        type: 'fastest10K',
        label: 'Fastest 10K',
        activity: fastest,
        value: formatTime(fastest.elapsed_time),
        date: new Date(fastest.start_date).toLocaleDateString(),
    };
}

function findLongestRun(runs: StravaActivity[]): Achievement | null {
    if (runs.length === 0) return null;

    const longest = runs.sort((a, b) => b.distance - a.distance)[0];

    return {
        type: 'longestRun',
        label: 'Longest Run Ever',
        activity: longest,
        value: `${(longest.distance / 1000).toFixed(1)} km`,
        date: new Date(longest.start_date).toLocaleDateString(),
    };
}

function findBestPace(runs: StravaActivity[]): Achievement | null {
    if (runs.length === 0) return null;

    // Best pace should use MOVING time (actual running pace)
    const bestPaceRun = runs.sort((a, b) =>
        (a.moving_time / a.distance) - (b.moving_time / b.distance)
    )[0];

    const pacePerKm = (bestPaceRun.moving_time / (bestPaceRun.distance / 1000)) / 60;
    const minutes = Math.floor(pacePerKm);
    const seconds = Math.floor((pacePerKm - minutes) * 60);

    return {
        type: 'bestPace',
        label: 'Best Pace',
        activity: bestPaceRun,
        value: `${minutes}:${seconds.toString().padStart(2, '0')} /km`,
        date: new Date(bestPaceRun.start_date).toLocaleDateString(),
    };
}


// Helper function to format seconds to MM:SS
function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
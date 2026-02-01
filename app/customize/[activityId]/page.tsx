'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StravaActivity } from '@/lib/types';
import Header from '@/components/header';
export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const activityId = params.activityId as string;


    const formatDistance = (meters: number): string => {
        return (meters / 1000).toFixed(1);
    };

    const formatDuration = (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const formatPace = (meters: number, seconds: number): string => {
        const km = meters / 1000;
        const pacePerKm = seconds / km / 60;
        const minutes = Math.floor(pacePerKm);
        const secs = Math.floor((pacePerKm - minutes) * 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };


    const [activity, setActivity] = useState<StravaActivity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchActivity() {
            try {
                setLoading(true);
                const response = await fetch('/api/strava/activities');
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to fetch activity');
                }

                // Find the specific activity
                const foundActivity = data.activities.find(
                    (a: StravaActivity) => a.id.toString() === activityId
                );

                if (!foundActivity) {
                    throw new Error('Activity not found');
                }

                setActivity(foundActivity);
            } catch (err: unknown) {
                console.error('Error fetching activity:', err);
                setError(err instanceof Error ? err.message : 'Failed to fetch activity');
            } finally {
                setLoading(false);
            }
        }

        fetchActivity();
    }, [activityId]);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                    <p className="text-lg text-white">Loading activity...</p>
                </div>
            </div>
        );
    }

    if (error || !activity) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-8">
                <div className="max-w-md w-full">
                    <div className="bg-red-500/10 border border-red-500 text-red-400 px-6 py-4 rounded-lg mb-4">
                        <p className="font-bold">Error</p>
                        <p>{error || 'Activity not found'}</p>
                    </div>

                    <button
                        onClick={() => router.push('/customize')}
                        className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                    >
                        Back to Activities
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className=" bg-black text-white">

            <Header />

            <main className="flex flex-1 overflow-hidden min-h-screen">
                <aside className="w-[400px] border-r border-white/10 flex flex-col bg-background dark:bg-background-dark overflow-y-auto custom-scrollbar">
                    <div className="p-6 flex flex-col gap-8 pb-20">
                        <div>
                            <h1 className="text-white text-xl font-bold">Customizer</h1>
                            <p className="text-white/50 text-sm">Advanced Minimalist Edition</p>
                        </div>

                        <section>
                            <h3 className="text-white text-xs font-semibold uppercase tracking-widest mb-4 opacity-70">Overlay Theme</h3>
                            <div className="flex flex-wrap gap-3">
                                <button className="size-8 rounded-full bg-strava-orange border-2 border-white/40 shadow-inner flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-sm font-bold">check</span>
                                </button>
                                <button className="size-8 rounded-full bg-white border border-white/10"></button>
                                <button className="size-8 rounded-full bg-midnight-black border border-white/20"></button>
                                <button className="size-8 rounded-full bg-electric-blue border border-white/10"></button>
                                <button className="size-8 rounded-full bg-forest-green border border-white/10"></button>
                                <button className="size-8 rounded-full bg-yellow-400 border border-white/10"></button>
                            </div>
                        </section>
                        <section>
                            <h3 className="text-white text-xs font-semibold uppercase tracking-widest mb-4 opacity-70">Personalization</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] text-white/50 px-1 uppercase font-bold">Personal Quote</label>
                                    <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors resize-none h-20" placeholder="Type a motivating thought..." defaultValue={'Pain is temporary, pride is forever'} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] text-white/50 px-1 uppercase font-bold">Achievement</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors appearance-none">
                                        <option className="bg-zinc-900">Fastest 5K</option>
                                        <option className="bg-zinc-900">Fastest 10K</option>
                                        <option className="bg-zinc-900">Longest Run</option>
                                        <option className="bg-zinc-900">Most Elevation</option>
                                        <option className="bg-zinc-900">Personal Milestone</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] text-white/50 px-1 uppercase font-bold">Badge Type</label>
                                    <div className="flex gap-2">
                                        <button className="flex-1 p-3 rounded-xl bg-primary text-white flex justify-center border border-primary"><span className="material-symbols-outlined">grade</span></button>
                                        <button className="flex-1 p-3 rounded-xl bg-white/5 text-white/50 flex justify-center hover:bg-white/10 border border-white/5"><span className="material-symbols-outlined">timer</span></button>
                                        <button className="flex-1 p-3 rounded-xl bg-white/5 text-white/50 flex justify-center hover:bg-white/10 border border-white/5"><span className="material-symbols-outlined">mountain_flag</span></button>
                                    </div>
                                </div>
                            </div>
                        </section>
                        <section className="border-t border-white/10 pt-6">
                            <h3 className="text-white text-xs font-semibold uppercase tracking-widest mb-4 opacity-70">Share &amp; Export</h3>
                            <div className="flex flex-col gap-4">
                                <button className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-[#e04503] text-white font-bold py-4 rounded-full transition-all shadow-xl shadow-primary/20">
                                    <span className="material-symbols-outlined">send</span>
                                    Share to Instagram
                                </button>
                                <div className="flex items-center justify-between gap-3">
                                    <button className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl border border-white/10 text-xs transition-colors">
                                        <span className="material-symbols-outlined text-base">download</span>
                                        Export
                                    </button>
                                    <button className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl border border-white/20 text-xs transition-colors">
                                        <span className="material-symbols-outlined text-base">high_quality</span>
                                        HD Export
                                    </button>
                                </div>
                                <div className="flex items-center justify-center gap-4 mt-2">
                                    <button className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors" title="Share to Twitter">
                                        <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                                    </button>
                                    <button className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors" title="Share to Reddit">
                                        <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.056 1.597.04.21.065.422.065.641 0 2.529-2.989 4.587-6.677 4.587-3.688 0-6.677-2.058-6.677-4.587 0-.213.024-.42.062-.622a1.763 1.763 0 0 1-.951-1.58c0-.968.786-1.754 1.754-1.754.483 0 .911.19 1.221.504 1.194-.848 2.846-1.4 4.664-1.473l.843-3.951 3.125.658a1.242 1.242 0 0 1-.031.25zM9.25 11.25a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm5.5 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm-2.75 4.375c-1.442 0-2.671-.568-3.125-1.125a.25.25 0 0 1 .375-.312c.313.375 1.312.812 2.75.812s2.437-.437 2.75-.812a.25.25 0 0 1 .375.312c-.454.557-1.683 1.125-3.125 1.125z"></path></svg>
                                    </button>
                                    <button className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors" title="Copy Link">
                                        <span className="material-symbols-outlined text-lg">link</span>
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </aside>
                <section className="flex-1 flex flex-col items-center justify-center p-12 bg-[#0d0d0d] overflow-y-auto custom-scrollbar">
                    <div className="mb-8 flex p-1 bg-white/5 rounded-full border border-white/10">
                        <button className="px-6 py-2 rounded-full text-xs font-bold transition-all bg-white/10 text-white">Full Card</button>
                        <button className="px-6 py-2 rounded-full text-xs font-bold transition-all text-white/50 hover:text-white">Instagram Grid</button>
                    </div>
                    <div className="flex flex-col items-center gap-12 w-full max-w-[450px]">
                        <div className="relative w-full aspect-4/5 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] ring-1 ring-white/10 bg-zinc-900">
                            <div
                                className="absolute inset-0 bg-cover bg-center opacity-60"
                                style={{
                                    backgroundImage:
                                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuALTdR4diz1Q4oc4CkkkVA1EJgMlPzSu17BWo_AhrTNNKtsQfJ5qQYOQHTkWb7yu-d7oM4rsaDHQX07RfTofJAcpluykao3dGkFJD9yB3BpCsss-jVhS-8-79i_vsoC1BoN2woeqVRQCbyeakv1zv5hUwQDLoOXdVNOm3cJl2F3cdysJNkLifETjRXwRW0sysx8lujACi8FZ1AbCfG77Y580ucimVY3Yi6_NgIA3-JAP50ILGpjdTlxwBleU-N3WzE0cEtPw-BPIeab')",
                                }}
                            ></div>
                            <div
                                className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-30"
                                style={{
                                    backgroundImage:
                                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDTvk30J2EYxsM0ghX14WH_RSEp1wdjBVaaCzg1Eou3d2TyMyDIy00lhMLBs1g1XHMZ1uC1EZ7KWeK4MBQ072dcfiJpPOIz7BS3ZuC5yZCjxuJi1lF4V9pC7_hPXiGVIpe5ZcePvV5vVgYWGPrY9A5j9T1IvK0JTv4Mu7tpGeEI6X-3V95HTw5O4KtOxTXsLHiWsWUtf0ZnkZuiyKWHPjEnsLHHirdpS-nnyvFs6TL-zrKWm7QVP3IkGR9KGQncAuqzT_HQY8lW4TPL')",
                                    filter: "invert(1)",
                                }}
                            ></div>
                            <div className="absolute inset-0 topo-overlay pointer-events-none"></div>
                            <div className="absolute top-8 left-8">
                                <div className="glass-effect pl-1 pr-5 py-1 rounded-full flex items-center gap-3 border border-white/20 shadow-lg">
                                    <div className="size-10 rounded-full flex items-center justify-center bg-yellow-400 text-black">
                                        <span
                                            className="material-symbols-outlined text-[20px]"
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            grade
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] uppercase font-bold tracking-widest text-white/50 leading-none mb-0.5">Personal Best</span>
                                        <span className="text-xs font-bold text-white leading-none">Fastest 5K</span>
                                    </div>
                                </div>
                            </div>

                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[90%] flex flex-col items-center gap-4">
                                <div className="glass-effect rounded-3xl p-6 border border-white/10 flex flex-col items-center w-full shadow-2xl relative overflow-hidden group">
                                    <div className="absolute -bottom-12 -left-12 size-32 bg-primary/20 blur-3xl rounded-full"></div>
                                    <div className="absolute -top-12 -right-12 size-32 bg-primary/20 blur-3xl rounded-full"></div>
                                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.3em] mb-1">Total Distance</p>
                                    <h2 className="text-white text-6xl font-black tracking-tighter flex items-baseline gap-2">
                                        {formatDistance(activity.distance)} <span className="text-2xl opacity-40 font-bold">KM</span>
                                    </h2>
                                    <div className="mt-6 flex items-center gap-8 text-white/90 border-t border-white/10 pt-5 w-full justify-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-1">Avg Pace</span>
                                            <span className="text-lg font-bold">{formatPace(activity.distance, activity.moving_time)} <span className="text-[10px] opacity-60">/km</span></span>
                                        </div>
                                        <div className="h-8 w-px bg-white/10"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] uppercase text-white/40 font-bold tracking-widest mb-1">Total Time</span>
                                            <span className="text-lg font-bold">{formatDuration(activity.moving_time)}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-center text-white/60 italic text-sm font-medium px-4 leading-relaxed">
                                    &ldquo;Pain is temporary, pride is forever.&rdquo;
                                </p>
                            </div>
                            <div className="absolute bottom-4 right-8 opacity-40">
                                <div className="text-primary flex items-center gap-1">
                                    <span className="font-bold tracking-tighter italic text-sm uppercase">Elite Studio</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-1 bg-white/5 rounded-full border border-white/10">
                            <button className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">aspect_ratio</span> 4:5 Portrait
                            </button>
                            <button className="hover:bg-white/10 px-6 py-2 rounded-full text-xs font-bold text-white/50 transition-all flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">smartphone</span> 9:16 Story
                            </button>
                        </div>
                    </div>
                    <div className="hidden mt-12 w-full max-w-[600px]">
                        <div className="instagram-grid">
                            <div className="aspect-square bg-white/5 relative border border-white/10">
                                <img alt="post" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuALTdR4diz1Q4oc4CkkkVA1EJgMlPzSu17BWo_AhrTNNKtsQfJ5qQYOQHTkWb7yu-d7oM4rsaDHQX07RfTofJAcpluykao3dGkFJD9yB3BpCsss-jVhS-8-79i_vsoC1BoN2woeqVRQCbyeakv1zv5hUwQDLoOXdVNOm3cJl2F3cdysJNkLifETjRXwRW0sysx8lujACi8FZ1AbCfG77Y580ucimVY3Yi6_NgIA3-JAP50ILGpjdTlxwBleU-N3WzE0cEtPw-BPIeab" />
                            </div>
                            <div className="aspect-square bg-white/5 relative ring-2 ring-primary z-10">
                                <div className="absolute inset-0 bg-zinc-900 overflow-hidden scale-100">
                                    <img alt="card" className="w-full h-full object-cover opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuALTdR4diz1Q4oc4CkkkVA1EJgMlPzSu17BWo_AhrTNNKtsQfJ5qQYOQHTkWb7yu-d7oM4rsaDHQX07RfTofJAcpluykao3dGkFJD9yB3BpCsss-jVhS-8-79i_vsoC1BoN2woeqVRQCbyeakv1zv5hUwQDLoOXdVNOm3cJl2F3cdysJNkLifETjRXwRW0sysx8lujACi8FZ1AbCfG77Y580ucimVY3Yi6_NgIA3-JAP50ILGpjdTlxwBleU-N3WzE0cEtPw-BPIeab" />
                                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4/5 h-1/3 glass-effect rounded-sm flex flex-col items-center justify-center">
                                        <div className="text-[4px] font-bold">42.2 KM</div>
                                    </div>
                                </div>
                            </div>
                            <div className="aspect-square bg-white/5 relative border border-white/10">
                                <img alt="post" className="w-full h-full object-cover opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuALTdR4diz1Q4oc4CkkkVA1EJgMlPzSu17BWo_AhrTNNKtsQfJ5qQYOQHTkWb7yu-d7oM4rsaDHQX07RfTofJAcpluykao3dGkFJD9yB3BpCsss-jVhS-8-79i_vsoC1BoN2woeqVRQCbyeakv1zv5hUwQDLoOXdVNOm3cJl2F3cdysJNkLifETjRXwRW0sysx8lujACi8FZ1AbCfG77Y580ucimVY3Yi6_NgIA3-JAP50ILGpjdTlxwBleU-N3WzE0cEtPw-BPIeab" />
                            </div>
                            <div className="aspect-square bg-white/5 border border-white/10"></div>
                            <div className="aspect-square bg-white/5 border border-white/10"></div>
                            <div className="aspect-square bg-white/5 border border-white/10"></div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
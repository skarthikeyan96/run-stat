'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StravaActivity } from '@/lib/types';
import Header from '@/components/header';
import MapboxRoute, { MapboxRouteHandle } from '@/components/mapbox-route';
import { toPng } from 'html-to-image';
export default function EditorPage() {
    const params = useParams();
    const router = useRouter();
    const activityId = params.activityId as string;

    const cardRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<MapboxRouteHandle>(null);

    // Add download function

    // async function handleDownload(format: '4:5' | '9:16' = '4:5') {
    //     if (!cardRef.current) return;

    //     try {
    //         // Get map canvas if available
    //         let mapDataUrl: string | null = null;
    //         if (mapRef.current && activity && activity.map?.summary_polyline) {
    //             mapDataUrl = await mapRef.current.getMapCanvas();
    //         }

    //         // Capture the full card
    //         await new Promise(resolve => setTimeout(resolve, 500));

    //         const cardDataUrl = await toPng(cardRef.current, {
    //             quality: 1,
    //             pixelRatio: 3,
    //             cacheBust: false,
    //             width: cardRef.current.offsetWidth + 40,  // Add 40px padding
    //             height: cardRef.current.offsetHeight + 40,
    //             style: {
    //                 margin: '20px',  // Center it
    //             },
    //             backgroundColor: undefined,
    //         });

    //         // If we have the map, composite it
    //         if (mapDataUrl) {
    //             const cardElement = cardRef.current;
    //             const cardRect = cardElement.getBoundingClientRect();
    //             const scale = 3;

    //             const canvas = document.createElement('canvas');
    //             canvas.width = cardRect.width * scale;
    //             canvas.height = cardRect.height * scale;
    //             const ctx = canvas.getContext('2d')!;

    //             // Draw card
    //             const cardImg = new Image();
    //             cardImg.src = cardDataUrl;
    //             await new Promise(resolve => { cardImg.onload = resolve; });
    //             ctx.drawImage(cardImg, 0, 0, canvas.width, canvas.height);

    //             // Draw map overlay
    //             const mapContainer = cardElement.querySelector('.absolute.inset-0.mix-blend-overlay') as HTMLElement;
    //             if (mapContainer) {
    //                 const mapImg = new Image();
    //                 mapImg.src = mapDataUrl;
    //                 await new Promise(resolve => { mapImg.onload = resolve; });

    //                 const mapRect = mapContainer.getBoundingClientRect();
    //                 const x = (mapRect.left - cardRect.left) * scale;
    //                 const y = (mapRect.top - cardRect.top) * scale;
    //                 const w = mapRect.width * scale;
    //                 const h = mapRect.height * scale;

    //                 ctx.save();
    //                 ctx.globalCompositeOperation = 'overlay';
    //                 ctx.globalAlpha = 0.4;
    //                 ctx.drawImage(mapImg, x, y, w, h);
    //                 ctx.restore();
    //             }

    //             canvas.toBlob((blob) => {
    //                 if (!blob) return;
    //                 const url = URL.createObjectURL(blob);
    //                 const link = document.createElement('a');
    //                 link.href = url;
    //                 link.download = `runstat-${customLabel.toLowerCase().replace(/\s+/g, '-')}-${format}.png`;
    //                 link.click();
    //                 URL.revokeObjectURL(url);
    //             }, 'image/png', 1.0);
    //         } else {
    //             // No map, just download card
    //             const link = document.createElement('a');
    //             link.href = cardDataUrl;
    //             link.download = `runstat-${customLabel.toLowerCase().replace(/\s+/g, '-')}-${format}.png`;
    //             link.click();
    //         }

    //     } catch (error) {
    //         console.error('Download failed:', error);
    //         alert('Failed to download. Please try again.');
    //     }
    // }

    async function handleDownload(format: '4:5' | '9:16' = '4:5') {
        if (!cardRef.current) return;

        try {
            // Get map canvas
            let mapDataUrl: string | null = null;
            if (mapRef.current && activity.map?.summary_polyline) {
                mapDataUrl = await mapRef.current.getMapCanvas();
            }

            // Capture card
            await new Promise(resolve => setTimeout(resolve, 500));

            const cardDataUrl = await toPng(cardRef.current, {
                quality: 1,
                pixelRatio: 3,
                cacheBust: false,
                backgroundColor: null,
            });

            const cardElement = cardRef.current;
            const cardRect = cardElement.getBoundingClientRect();
            const scale = 3;
            const borderRadius = 40 * scale; // 2.5rem * scale

            // Create canvas with extra size for anti-aliasing
            const padding = 10;
            const canvas = document.createElement('canvas');
            canvas.width = cardRect.width * scale + padding * 2;
            canvas.height = cardRect.height * scale + padding * 2;
            const ctx = canvas.getContext('2d', { alpha: true })!;

            // Enable anti-aliasing
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Translate for padding
            ctx.translate(padding, padding);

            // Create rounded rectangle clipping path with better curves
            const w = cardRect.width * scale;
            const h = cardRect.height * scale;
            const r = borderRadius;

            ctx.beginPath();
            ctx.moveTo(r, 0);
            ctx.lineTo(w - r, 0);
            ctx.arcTo(w, 0, w, r, r);
            ctx.lineTo(w, h - r);
            ctx.arcTo(w, h, w - r, h, r);
            ctx.lineTo(r, h);
            ctx.arcTo(0, h, 0, h - r, r);
            ctx.lineTo(0, r);
            ctx.arcTo(0, 0, r, 0, r);
            ctx.closePath();
            ctx.clip();

            // Draw card
            const cardImg = new Image();
            cardImg.src = cardDataUrl;
            await new Promise(resolve => { cardImg.onload = resolve; });
            ctx.drawImage(cardImg, 0, 0, w, h);

            // Draw map overlay if available
            if (mapDataUrl) {
                const mapContainer = cardElement.querySelector('.absolute.inset-0.mix-blend-overlay') as HTMLElement;
                if (mapContainer) {
                    const mapImg = new Image();
                    mapImg.src = mapDataUrl;
                    await new Promise(resolve => { mapImg.onload = resolve; });

                    const mapRect = mapContainer.getBoundingClientRect();
                    const x = (mapRect.left - cardRect.left) * scale;
                    const y = (mapRect.top - cardRect.top) * scale;
                    const mw = mapRect.width * scale;
                    const mh = mapRect.height * scale;

                    ctx.save();
                    ctx.globalCompositeOperation = 'overlay';
                    ctx.globalAlpha = 0.4;
                    ctx.drawImage(mapImg, x, y, mw, mh);
                    ctx.restore();
                }
            }

            // Trim the canvas to remove padding
            const finalCanvas = document.createElement('canvas');
            finalCanvas.width = w;
            finalCanvas.height = h;
            const finalCtx = finalCanvas.getContext('2d')!;
            finalCtx.drawImage(canvas, padding, padding, w, h, 0, 0, w, h);

            // Download
            finalCanvas.toBlob((blob) => {
                if (!blob) return;
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `runstat-${customLabel.toLowerCase().replace(/\s+/g, '-')}-${format}.png`;
                link.click();
                URL.revokeObjectURL(url);
            }, 'image/png', 1.0);

        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download. Please try again.');
        }
    }


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
    const [selectedIcon, setSelectedIcon] = useState<{ name: string; label: string } | null>({ name: 'grade', label: 'Star' });
    const [activeCategory, setActiveCategory] = useState<string>('achievements');
    const [personalQuote, setPersonalQuote] = useState<string>('');
    const [customLabel, setCustomLabel] = useState<string>('');

    // Icon background colors to match the icon vibe
    const iconBgColors = {
        'grade': 'bg-yellow-400',           // Star - gold
        'local_fire_department': 'bg-orange-500', // Fire - orange
        'emoji_events': 'bg-amber-400',     // Trophy - gold
        'bolt': 'bg-blue-400',              // Lightning - blue
        'favorite': 'bg-red-400',           // Heart - red
        'military_tech': 'bg-green-400',     // Medal - green
        'directions_run': 'bg-purple-400',   // Runner - purple
        'footprint': 'bg-pink-400',         // Footprint - pink
        'landscape': 'bg-cyan-400',         // Mountain - cyan
        'forest': 'bg-teal-400',           // Trail - teal
        'wb_twilight': 'bg-indigo-400',     // Sunrise - indigo
        'nights_stay': 'bg-violet-400',     // Night - violet
        'speed': 'bg-orange-400',           // Speed - orange
        'trending_up': 'bg-green-400',      // Progress - green
        'fitness_center': 'bg-blue-400',    // Strength - blue
        'track_changes': 'bg-purple-400',   // Target - purple
    };

    // State
    const [overlayTheme, setOverlayTheme] = useState('orange');

    // Theme definitions
    const themes = {
        orange: {
            iconBg: 'bg-orange-500',
            iconText: 'text-white',
            name: 'Orange'
        },
        white: {
            iconBg: 'bg-white',
            iconText: 'text-black',
            name: 'White'
        },
        black: {
            iconBg: 'bg-black',
            iconText: 'text-white',
            name: 'Dark'
        },
        blue: {
            iconBg: 'bg-blue-500',
            iconText: 'text-white',
            name: 'Blue'
        },
        green: {
            iconBg: 'bg-green-500',
            iconText: 'text-white',
            name: 'Green'
        },
        yellow: {
            iconBg: 'bg-yellow-400',
            iconText: 'text-black',
            name: 'Yellow'
        }
    };

    const iconCategories = {
        achievements: {
            label: 'Achievements',
            icons: [
                { name: 'grade', label: 'Star' },
                { name: 'local_fire_department', label: 'Fire' },
                { name: 'emoji_events', label: 'Trophy' },
                { name: 'military_tech', label: 'Medal' }
            ]
        },
        activity: {
            label: 'Activity',
            icons: [
                { name: 'directions_run', label: 'Runner' },
                { name: 'footprint', label: 'Footprint' },
                { name: 'landscape', label: 'Mountain' },
                { name: 'forest', label: 'Trail' }
            ]
        },
        mood: {
            label: 'Mood',
            icons: [
                { name: 'bolt', label: 'Lightning' },
                { name: 'wb_twilight', label: 'Sunrise' },
                { name: 'nights_stay', label: 'Night' },
                { name: 'favorite', label: 'Heart' }
            ]
        },
        performance: {
            label: 'Performance',
            icons: [
                { name: 'speed', label: 'Speed' },
                { name: 'trending_up', label: 'Progress' },
                { name: 'fitness_center', label: 'Strength' },
                { name: 'track_changes', label: 'Target' }
            ]
        }
    };

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

    console.log(activity);



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
                                {/* <button className="size-8 rounded-full bg-strava-orange border-2 border-white/40 shadow-inner flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white text-sm font-bold">check</span>
                                </button>
                                <button className="size-8 rounded-full bg-white border border-white/10"></button>
                                <button className="size-8 rounded-full bg-midnight-black border border-white/20"></button>
                                <button className="size-8 rounded-full bg-electric-blue border border-white/10"></button>
                                <button className="size-8 rounded-full bg-forest-green border border-white/10"></button>
                                <button className="size-8 rounded-full bg-yellow-400 border border-white/10"></button> */}

                                {Object.entries(themes).map(([key, theme]) => (
                                    <button
                                        key={key}
                                        onClick={() => setOverlayTheme(key)}
                                        className={`size-8 rounded-full ${theme.iconBg} border-2 transition-all ${overlayTheme === key
                                            ? 'border-white/40 shadow-inner scale-110'
                                            : 'border-white/10'
                                            }`}
                                    >
                                        {overlayTheme === key && (
                                            <span className="material-symbols-outlined text-white text-sm font-bold">
                                                check
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </section>
                        <section>
                            <h3 className="text-white text-xs font-semibold uppercase tracking-widest mb-4 opacity-70">Personalization</h3>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] text-white/50 px-1 uppercase font-bold">Custom Label</label>
                                    <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors" placeholder="Enter a custom label" defaultValue={customLabel} onChange={(e) => setCustomLabel(e.target.value)} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] text-white/50 px-1 uppercase font-bold">Personal Quote</label>
                                    <textarea className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary transition-colors resize-none h-20" placeholder="Type a motivating thought..." defaultValue={personalQuote} onChange={(e) => setPersonalQuote(e.target.value)} />
                                </div>
                                {/* <div className="flex flex-col gap-2">
                                    <label className="text-[10px] text-white/50 px-1 uppercase font-bold">Badge Type</label>
                                    <div className="flex gap-2">
                                        <button className="flex-1 p-3 rounded-xl bg-primary text-white flex justify-center border border-primary"><span className="material-symbols-outlined">grade</span></button>
                                        <button className="flex-1 p-3 rounded-xl bg-white/5 text-white/50 flex justify-center hover:bg-white/10 border border-white/5"><span className="material-symbols-outlined">timer</span></button>
                                        <button className="flex-1 p-3 rounded-xl bg-white/5 text-white/50 flex justify-center hover:bg-white/10 border border-white/5"><span className="material-symbols-outlined">mountain_flag</span></button>
                                    </div>
                                </div> */}
                                {/* <div className="grid grid-cols-4 gap-2">
                                    {Object.entries(iconCategories).map(([categoryKey, category]) => (
                                        <div key={categoryKey} className="mb-6">
                                            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-2">
                                                {category.label}
                                            </p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {category.icons.map((icon) => (
                                                    <button
                                                        key={icon.name}
                                                        onClick={() => setSelectedIcon(icon)}
                                                        className={`h-12 rounded-xl flex items-center justify-center transition-all ${selectedIcon.name === icon.name
                                                            ? 'bg-primary text-white scale-105 shadow-lg shadow-primary/30'
                                                            : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
                                                            }`}

                                                    >
                                                        <span className="material-symbols-outlined text-xl">
                                                            {icon.name}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div> */}
                                <section className="mb-8 border-b border-white/10 pb-6">
                                    <h3 className="text-white text-xs font-semibold uppercase tracking-widest mb-4 opacity-70">
                                        Badge Icon
                                    </h3>

                                    {/* Category tabs */}
                                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                                        {Object.entries(iconCategories).map(([key, category]) => (
                                            <button
                                                key={key}
                                                onClick={() => setActiveCategory(key)}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${activeCategory === key
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                                                    }`}
                                            >
                                                {category.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Icons grid for active category */}
                                    <div className="grid grid-cols-4 gap-2">
                                        {iconCategories[activeCategory as keyof typeof iconCategories].icons.map((icon) => (
                                            <button
                                                key={icon.name}
                                                onClick={() => setSelectedIcon(icon)}
                                                className={`h-14 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${selectedIcon.name === icon.name
                                                    ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30 ring-2 ring-primary/50'
                                                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
                                                    }`}
                                                title={icon.label}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {icon.name}
                                                </span>
                                                <span className="text-[8px] opacity-70">{icon.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>
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
                                    <button onClick={() => handleDownload('4:5')} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl border border-white/10 text-xs transition-colors">
                                        <span className="material-symbols-outlined text-base">download</span>
                                        Export
                                    </button>
                                    <button onClick={() => handleDownload('9:16')} className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl border border-white/20 text-xs transition-colors">
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
                    <div className="flex flex-col items-center gap-12 w-full max-w-[450px] ">

                        <div ref={cardRef} className="relative w-full aspect-4/5 rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] ring-1 ring-white/10 bg-zinc-900">
                            <div
                                className="absolute inset-0 bg-cover bg-center opacity-60"
                                style={{
                                    backgroundImage:
                                        "url('https://lh3.googleusercontent.com/aida-public/AB6AXuALTdR4diz1Q4oc4CkkkVA1EJgMlPzSu17BWo_AhrTNNKtsQfJ5qQYOQHTkWb7yu-d7oM4rsaDHQX07RfTofJAcpluykao3dGkFJD9yB3BpCsss-jVhS-8-79i_vsoC1BoN2woeqVRQCbyeakv1zv5hUwQDLoOXdVNOm3cJl2F3cdysJNkLifETjRXwRW0sysx8lujACi8FZ1AbCfG77Y580ucimVY3Yi6_NgIA3-JAP50ILGpjdTlxwBleU-N3WzE0cEtPw-BPIeab')",
                                }}
                            ></div>
                            {activity.map?.summary_polyline && (
                                <div className="absolute inset-0 mix-blend-overlay opacity-40">
                                    <MapboxRoute
                                        encodedPolyline={activity.map.summary_polyline}
                                        routeColor="#FC4C02"
                                        routeWidth={5}
                                        ref={mapRef}
                                        mapStyle="cartoDark"
                                    />
                                </div>
                            )}
                            <div className="absolute inset-0 topo-overlay pointer-events-none"></div>
                            <div className="absolute top-8 left-8">
                                <div className="glass-effect pl-1 pr-5 py-1 rounded-full flex items-center gap-3 border border-white/20 shadow-lg">
                                    <div className={`size-10 rounded-full flex items-center justify-center ${themes[overlayTheme as keyof typeof themes].iconBg} ${themes[overlayTheme as keyof typeof themes].iconText}`}>
                                        <span
                                            className={`material-symbols-outlined text-[20px]  ${themes[overlayTheme as keyof typeof themes].iconText} ${overlayTheme[iconBgColors[selectedIcon?.name as keyof typeof iconBgColors]]}`}
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            {selectedIcon?.name}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        {/* <span className="text-[9px] uppercase font-bold tracking-widest text-white/50 leading-none mb-0.5">Personal Best</span> */}
                                        <span className="text-xs font-bold text-white leading-none">{customLabel || activity.name}</span>
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
                                    {personalQuote && `${personalQuote}`}
                                </p>
                            </div>
                            <div className="absolute bottom-4 right-8 opacity-40">
                                <div className="text-primary flex items-center gap-1">
                                    <span className="font-bold tracking-tighter italic text-sm uppercase">Run stat</span>
                                </div>
                            </div>
                        </div>

                    </div>




                </section>
            </main>
        </div>
    );
}
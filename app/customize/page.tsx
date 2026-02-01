'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Zap, Clock, Calendar, Dumbbell } from 'lucide-react';
import { StravaActivity } from '@/lib/types';

// Helper to detect if activity is likely a treadmill run
function isTreadmillRun(activity: StravaActivity): boolean {
  const hasNoGPS = !activity.map?.summary_polyline || activity.map.summary_polyline.length === 0;
  const isRunType = activity.type === 'Run' || activity.type === 'VirtualRun';
  return hasNoGPS && isRunType;
}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 12;

// Decode polyline to lat/lng coordinates
function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

// Convert coordinates to SVG path
function coordsToSvgPath(coords: [number, number][], width: number, height: number, padding: number = 15): string {
  if (coords.length === 0) return '';

  const lats = coords.map(c => c[0]);
  const lngs = coords.map(c => c[1]);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 0.001;
  const lngRange = maxLng - minLng || 0.001;

  const scale = Math.min(
    (width - padding * 2) / lngRange,
    (height - padding * 2) / latRange
  );

  const offsetX = (width - lngRange * scale) / 2;
  const offsetY = (height - latRange * scale) / 2;

  const points = coords.map(([lat, lng]) => {
    const x = (lng - minLng) * scale + offsetX;
    const y = height - ((lat - minLat) * scale + offsetY);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M${points.join('L')}`;
}

// Activity Thumbnail Component
function ActivityThumbnail({ activity }: { activity: StravaActivity }) {
  const polyline = activity.map?.summary_polyline;
  const hasRoute = polyline && polyline.length > 0;

  const getGradientColors = (type: string) => {
    const normalizedType = type === 'TrailRun' || type === 'VirtualRun' ? 'Run' : type;
    switch (normalizedType) {
      case 'Run':
        return { start: '#f97316', mid: '#ef4444', end: '#7c2d12', glow: '#f97316' };
      case 'Ride':
        return { start: '#3b82f6', mid: '#06b6d4', end: '#1e3a5a', glow: '#3b82f6' };
      case 'Hike':
        return { start: '#10b981', mid: '#14b8a6', end: '#064e3b', glow: '#10b981' };
      default:
        return { start: '#a855f7', mid: '#ec4899', end: '#581c87', glow: '#a855f7' };
    }
  };

  const colors = getGradientColors(activity.type);

  if (hasRoute) {
    const coords = decodePolyline(polyline);
    const path = coordsToSvgPath(coords, 200, 140);

    return (
      <div className="relative w-full h-36 overflow-hidden rounded-xl mb-4">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        
        {/* Subtle grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id={`grid-${activity.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke={colors.start} strokeWidth="0.5" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${activity.id})`} />
        </svg>

        {/* Route path */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 140" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={`route-gradient-${activity.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.start} />
              <stop offset="50%" stopColor={colors.mid} />
              <stop offset="100%" stopColor={colors.start} />
            </linearGradient>
            <filter id={`glow-${activity.id}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Glow effect path */}
          <path
            d={path}
            fill="none"
            stroke={colors.glow}
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.3"
            filter={`url(#glow-${activity.id})`}
          />
          
          {/* Main path */}
          <path
            d={path}
            fill="none"
            stroke={`url(#route-gradient-${activity.id})`}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-lg"
          />
          
          {/* Start point */}
          {coords.length > 0 && (
            <>
              <circle
                cx={parseFloat(coordsToSvgPath([coords[0]], 200, 140).split(',')[0].slice(1))}
                cy={parseFloat(coordsToSvgPath([coords[0]], 200, 140).split(',')[1])}
                r="5"
                fill={colors.start}
                className="animate-pulse"
              />
              <circle
                cx={parseFloat(coordsToSvgPath([coords[0]], 200, 140).split(',')[0].slice(1))}
                cy={parseFloat(coordsToSvgPath([coords[0]], 200, 140).split(',')[1])}
                r="3"
                fill="white"
              />
            </>
          )}
        </svg>

        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
      </div>
    );
  }

  const isTreadmill = isTreadmillRun(activity);

  // Treadmill-specific clean design
  if (isTreadmill) {
    return (
      <div className="relative w-full h-36 overflow-hidden rounded-xl mb-4">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        
        {/* Subtle horizontal lines like treadmill belt */}
        <div className="absolute inset-0 flex flex-col justify-center gap-2 px-6 opacity-20">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i} 
              className="h-px w-full"
              style={{ backgroundColor: colors.start }}
            />
          ))}
        </div>

        {/* Central icon and label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div 
              className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-2 border-2"
              style={{ 
                backgroundColor: `${colors.start}15`,
                borderColor: `${colors.start}40`
              }}
            >
              <Dumbbell className="w-7 h-7" style={{ color: colors.start }} />
            </div>
            <p 
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: colors.start }}
            >
              Indoor Run
            </p>
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
      </div>
    );
  }

  // Clean design for other no-GPS activities
  return (
    <div className="relative w-full h-36 overflow-hidden rounded-xl mb-4">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
      
      {/* Subtle pattern */}
      <div className="absolute inset-0 opacity-30">
        <svg className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id={`dots-${activity.id}`} width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="1.5" fill={colors.start} opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#dots-${activity.id})`} />
        </svg>
      </div>

      {/* Central icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div 
            className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-2 border-2"
            style={{ 
              backgroundColor: `${colors.start}15`,
              borderColor: `${colors.start}40`
            }}
          >
            <Zap className="w-7 h-7" style={{ color: colors.start }} />
          </div>
          <p 
            className="text-xs font-semibold uppercase tracking-widest"
            style={{ color: colors.start }}
          >
            No GPS
          </p>
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent" />
    </div>
  );
}

export default function CustomizePage() {
  const router = useRouter();
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch activities on mount
  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        const response = await fetch('/api/strava/activities');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch activities');
        }

        setActivities(data.activities);
      } catch (err: unknown) {
        console.error('Error fetching activities:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  // Extract unique years from activities
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    activities.forEach(activity => {
      const year = new Date(activity.start_date_local).getFullYear().toString();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)); // Sort descending
  }, [activities]);

  // Filter activities based on search and year
  const filteredActivities = useMemo(() => {
    return activities.filter(activity => {
      const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase());
      const activityYear = new Date(activity.start_date_local).getFullYear().toString();
      const matchesYear = selectedYear === 'all' || activityYear === selectedYear;
      return matchesSearch && matchesYear;
    });
  }, [activities, searchQuery, selectedYear]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredActivities.length / ITEMS_PER_PAGE);
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredActivities.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredActivities, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedYear]);

  // Helper to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper to format distance
  const formatDistance = (meters: number): string => {
    return (meters / 1000).toFixed(1);
  };

  const handleActivityClick = (activityId: number) => {
    router.push(`/customize/${activityId}`);
  };

  const getActivityGradient = (type: string): string => {
    const normalizedType = type === 'TrailRun' || type === 'VirtualRun' ? 'Run' : type;
    switch (normalizedType) {
      case 'Run':
        return 'from-orange-500 via-red-500 to-rose-900';
      case 'Ride':
        return 'from-blue-500 via-cyan-500 to-blue-900';
      case 'Hike':
        return 'from-emerald-500 via-teal-500 to-emerald-900';
      default:
        return 'from-purple-500 via-pink-500 to-purple-900';
    }
  };

  const getActivityIcon = () => {
    return <Zap className="w-5 h-5" />;
  };

  const getActivityColor = (type: string): string => {
    const normalizedType = type === 'TrailRun' || type === 'VirtualRun' ? 'Run' : type;
    switch (normalizedType) {
      case 'Run':
        return 'bg-orange-500 text-white';
      case 'Ride':
        return 'bg-blue-500 text-white';
      case 'Hike':
        return 'bg-emerald-500 text-white';
      default:
        return 'bg-purple-500 text-white';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-lg text-white">Loading your runs...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-6 py-4 rounded-lg mb-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Reconnect with Strava
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-900/50 backdrop-blur-xl bg-black/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-orange-500/30">
                <span className="text-xl font-bold">⚡</span>
              </div>
              <h1 className="text-xl font-bold group-hover:text-orange-400 transition-colors">Elite Card Studio</h1>
            </div>

            {/* Navigation & Profile */}
            <div className="flex items-center gap-8">
              <nav className="flex items-center gap-6">
                <button className="text-white font-medium hover:text-orange-400 transition-colors duration-300">
                  My Activities
                </button>
                <button className="text-gray-400 hover:text-gray-300 transition-colors duration-300">
                  Templates
                </button>
                <button className="text-gray-400 hover:text-gray-300 transition-colors duration-300">
                  Showcase
                </button>
              </nav>

              {/* User Profile */}
              <div className="flex items-center gap-3 pl-6 border-l border-gray-800">
                <div className="text-right">
                  <p className="text-sm font-semibold">Strava Athlete</p>
                  <p className="text-xs text-orange-400 font-bold">CONNECTED</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex-shrink-0 overflow-hidden shadow-lg shadow-orange-500/20 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">⚡</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Title Section with Animation */}
        <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
          <h2 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent">
            Select Run
          </h2>
          <p className="text-gray-400 text-lg">Choose a run to create your elite data card</p>
        </div>

        {/* Filters Section */}
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-center md:gap-4">
          {/* Search */}
          <div className="flex-1 min-w-0 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full blur-lg group-hover:blur-xl transition-all duration-300 -z-10"></div>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-orange-400 transition-colors" />
            <input
              type="text"
              placeholder="Search your runs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-950/80 backdrop-blur border border-gray-800 rounded-full px-6 py-3 pl-12 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:bg-gray-900/80 transition-all duration-300"
            />
          </div>

          {/* Year Filter */}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[160px] bg-gray-950/80 backdrop-blur border-gray-800 rounded-full text-white hover:border-orange-500/50 focus:ring-orange-500/30 transition-all duration-300">
              <Calendar className="w-4 h-4 text-orange-400 mr-2" />
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent className="bg-gray-950 border-gray-800 text-white">
              <SelectItem value="all" className="focus:bg-orange-500/20 focus:text-white cursor-pointer">
                All Years
              </SelectItem>
              {availableYears.map(year => (
                <SelectItem 
                  key={year} 
                  value={year}
                  className="focus:bg-orange-500/20 focus:text-white cursor-pointer"
                >
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Run indicator */}
          <div className="flex gap-2 bg-gray-950/50 backdrop-blur p-1.5 rounded-full border border-gray-800/50">
            <div className="px-4 py-2 rounded-full font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 flex items-center gap-2">
              {getActivityIcon()}
              <span>Runs Only</span>
            </div>
          </div>
        </div>

        {/* Results info */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Showing <span className="text-orange-400 font-semibold">{paginatedActivities.length}</span> of{' '}
            <span className="text-white font-semibold">{filteredActivities.length}</span> runs
            {selectedYear !== 'all' && <span className="text-orange-400"> in {selectedYear}</span>}
          </p>
          {totalPages > 1 && (
            <p className="text-gray-500 text-sm">
              Page {currentPage} of {totalPages}
            </p>
          )}
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedActivities.length === 0 ? (
            <div className="col-span-full text-center py-20">
              <div className="w-16 h-16 rounded-full bg-gray-800/50 mx-auto mb-4 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-gray-400 text-lg font-medium">No runs found</p>
              <p className="text-gray-600 text-sm mt-2">Try adjusting your search or year filter</p>
            </div>
          ) : (
            paginatedActivities.map((activity, index) => (
              <button
                key={activity.id}
                onClick={() => handleActivityClick(activity.id)}
                className="group relative h-full rounded-3xl overflow-hidden border border-gray-800 hover:border-orange-500/50 transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Gradient background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${getActivityGradient(activity.type)} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                {/* Card background */}
                <div className="relative h-full bg-gradient-to-br from-gray-900/80 to-gray-950/80 backdrop-blur-sm p-4 flex flex-col">
                  {/* Top section with badge and date */}
                  <div className="absolute top-6 left-6 right-6 flex items-start justify-between gap-3 z-10">
                    <div className={`${getActivityColor(activity.type)} px-2.5 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 shadow-lg`}>
                      {isTreadmillRun(activity) ? (
                        <>
                          <Dumbbell className="w-3 h-3" />
                          Treadmill
                        </>
                      ) : (
                        activity.type === 'TrailRun' || activity.type === 'VirtualRun' ? 'Run' : activity.type
                      )}
                    </div>
                    <div className="text-xs text-gray-300 font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full">{formatDate(activity.start_date_local)}</div>
                  </div>

                  {/* Map Thumbnail */}
                  <ActivityThumbnail activity={activity} />

                  {/* Activity name */}
                  <h3 className="font-bold text-base mb-3 text-left group-hover:text-orange-400 transition-colors duration-300 line-clamp-2">
                    {activity.name}
                  </h3>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm mt-auto">
                    <div>
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Distance</p>
                      <p className="font-bold text-white">{formatDistance(activity.distance)} <span className="text-gray-400 text-sm">km</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs uppercase tracking-wide mb-0.5">Duration</p>
                      <p className="font-bold text-white flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {Math.floor(activity.moving_time / 3600)}:{String(Math.floor((activity.moving_time % 3600) / 60)).padStart(2, '0')}:{String(activity.moving_time % 60).padStart(2, '0')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
              </button>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Pagination className="mt-12">
            <PaginationContent className="gap-2">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)}
                  className={`border border-gray-800 bg-transparent text-white hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-white rounded-xl transition-all duration-300 ${
                    currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }`}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                const showPage = 
                  page === 1 || 
                  page === totalPages || 
                  Math.abs(page - currentPage) <= 1;
                
                const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;

                if (showEllipsisBefore || showEllipsisAfter) {
                  return (
                    <PaginationItem key={page}>
                      <PaginationEllipsis className="text-gray-500" />
                    </PaginationItem>
                  );
                }

                if (!showPage) return null;

                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className={`rounded-xl transition-all duration-300 cursor-pointer ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:text-white'
                          : 'border border-gray-800 bg-transparent text-gray-400 hover:border-orange-500/50 hover:text-white hover:bg-orange-500/10'
                      }`}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)}
                  className={`border border-gray-800 bg-transparent text-white hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-white rounded-xl transition-all duration-300 ${
                    currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                  }`}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {/* Stats Summary */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6 backdrop-blur">
            <p className="text-orange-400 text-sm font-semibold uppercase mb-2">Total Runs</p>
            <p className="text-4xl font-bold text-white">{filteredActivities.length}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6 backdrop-blur">
            <p className="text-orange-400 text-sm font-semibold uppercase mb-2">Total Distance</p>
            <p className="text-4xl font-bold text-white">{(filteredActivities.reduce((sum, a) => sum + a.distance, 0) / 1000).toFixed(1)} km</p>
          </div>
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-6 backdrop-blur">
            <p className="text-red-400 text-sm font-semibold uppercase mb-2">Total Elevation</p>
            <p className="text-4xl font-bold text-white">{Math.round(filteredActivities.reduce((sum, a) => sum + a.total_elevation_gain, 0))} m</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900/50 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12 text-center text-gray-600 text-sm">
          <p>© 2024 RUNSTAT ELITE CARD STUDIO · POWERED BY STRAVA</p>
          <p className="mt-2 text-gray-700 text-xs">Your personal activity data from Strava</p>
        </div>
      </footer>
    </div>
  );
}

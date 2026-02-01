'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import polyline from '@mapbox/polyline';

import 'maplibre-gl/dist/maplibre-gl.css';

// Free dark map styles - no API key required
const FREE_MAP_STYLES = {
    // CartoCDN Dark Matter - beautiful dark style, completely free
    cartoDark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    // CartoCDN Voyager - light style alternative
    cartoVoyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    // Positron - minimal light style
    cartoPositron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};

interface MapLibreRouteProps {
    encodedPolyline: string;
    className?: string;
    routeColor?: string;
    routeWidth?: number;
    mapStyle?: 'cartoDark' | 'cartoVoyager' | 'cartoPositron' | string;
}

export default function MapboxRoute({
    encodedPolyline,
    className = '',
    routeColor = '#FC4C02', // Strava orange
    routeWidth = 4,
    mapStyle = 'cartoDark',
}: MapLibreRouteProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    useEffect(() => {
        if (!mapContainer.current || !encodedPolyline) return;

        // Decode the polyline
        const coordinates = polyline.decode(encodedPolyline).map(([lat, lng]) => [lng, lat]);

        if (coordinates.length === 0) return;

        // Calculate bounds
        const bounds = coordinates.reduce(
            (bounds, coord) => {
                return [
                    [Math.min(bounds[0][0], coord[0]), Math.min(bounds[0][1], coord[1])],
                    [Math.max(bounds[1][0], coord[0]), Math.max(bounds[1][1], coord[1])],
                ];
            },
            [
                [coordinates[0][0], coordinates[0][1]],
                [coordinates[0][0], coordinates[0][1]],
            ]
        );

        // Get style URL
        const styleUrl = FREE_MAP_STYLES[mapStyle as keyof typeof FREE_MAP_STYLES] || mapStyle;

        // Initialize map
        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: styleUrl,
            bounds: bounds as [[number, number], [number, number]],
            fitBoundsOptions: {
                padding: 40,
            },
            interactive: false, // Disable interactions for overlay use
            attributionControl: false,
        });

        map.current.on('load', () => {
            if (!map.current) return;

            // Add route source
            map.current.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates,
                    },
                },
            });

            // Add glow effect layer (wider, more transparent)
            map.current.addLayer({
                id: 'route-glow',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': routeColor,
                    'line-width': routeWidth * 3,
                    'line-opacity': 0.3,
                    'line-blur': 4,
                },
            });

            // Add main route layer
            map.current.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': routeColor,
                    'line-width': routeWidth,
                    'line-opacity': 1,
                },
            });

            // Add start marker
            if (coordinates.length > 0) {
                new maplibregl.Marker({
                    color: '#22c55e', // Green for start
                    scale: 0.7,
                })
                    .setLngLat(coordinates[0] as [number, number])
                    .addTo(map.current!);

                // Add end marker
                new maplibregl.Marker({
                    color: '#ef4444', // Red for end
                    scale: 0.7,
                })
                    .setLngLat(coordinates[coordinates.length - 1] as [number, number])
                    .addTo(map.current!);
            }
        });

        return () => {
            map.current?.remove();
        };
    }, [encodedPolyline, routeColor, routeWidth, mapStyle]);

    return (
        <div
            ref={mapContainer}
            className={className}
            style={{ width: '100%', height: '100%' }}
        />
    );
}

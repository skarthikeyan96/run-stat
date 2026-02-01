'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import maplibregl from 'maplibre-gl';
import polyline from '@mapbox/polyline';

import 'maplibre-gl/dist/maplibre-gl.css';

const FREE_MAP_STYLES = {
    cartoDark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    cartoVoyager: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    cartoPositron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
};

interface MapLibreRouteProps {
    encodedPolyline: string;
    className?: string;
    routeColor?: string;
    routeWidth?: number;
    mapStyle?: 'cartoDark' | 'cartoVoyager' | 'cartoPositron' | string;
}

// Export handle type for TypeScript
export interface MapboxRouteHandle {
    getMapCanvas: () => Promise<string>;
}

const MapboxRoute = forwardRef<MapboxRouteHandle, MapLibreRouteProps>(({
    encodedPolyline,
    className = '',
    routeColor = '#FC4C02',
    routeWidth = 4,
    mapStyle = 'cartoDark',
}, ref) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);

    // Expose getMapCanvas method to parent
    useImperativeHandle(ref, () => ({
        getMapCanvas: () => {
            return new Promise<string>((resolve, reject) => {
                if (!map.current) {
                    reject(new Error('Map not initialized'));
                    return;
                }

                map.current.once('render', () => {
                    if (map.current) {
                        try {
                            const dataUrl = map.current.getCanvas().toDataURL('image/png', 1.0);
                            resolve(dataUrl);
                        } catch (error) {
                            reject(error);
                        }
                    }
                });

                // Trigger render
                map.current.setBearing(map.current.getBearing());
            });
        }
    }));

    useEffect(() => {
        if (!mapContainer.current || !encodedPolyline) return;

        const coordinates = polyline.decode(encodedPolyline).map(([lat, lng]) => [lng, lat]);

        if (coordinates.length === 0) return;

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

        const styleUrl = FREE_MAP_STYLES[mapStyle as keyof typeof FREE_MAP_STYLES] || mapStyle;

        map.current = new maplibregl.Map({
            container: mapContainer.current,
            style: styleUrl,
            bounds: bounds as [[number, number], [number, number]],
            fitBoundsOptions: {
                padding: 40,
            },
            interactive: false,
            attributionControl: false,
            preserveDrawingBuffer: true,
        });

        map.current.on('load', () => {
            if (!map.current) return;

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

            if (coordinates.length > 0) {
                new maplibregl.Marker({
                    color: '#22c55e',
                    scale: 0.7,
                })
                    .setLngLat(coordinates[0] as [number, number])
                    .addTo(map.current!);

                new maplibregl.Marker({
                    color: '#ef4444',
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
});

MapboxRoute.displayName = 'MapboxRoute';

export default MapboxRoute;
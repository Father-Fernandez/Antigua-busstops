import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { BusStop, Place, Route, RouteStop } from '../module_bindings/types';
import { buildRouteStopMap, buildStopMap, hasCoordinates } from '../lib/journey';
import { categoryMeta } from '../lib/places';

interface Props {
  stops: readonly BusStop[];
  routes: readonly Route[];
  routeStops: readonly RouteStop[];
  places: readonly Place[];
}

const ANTIGUA_CENTER: [number, number] = [17.086, -61.8];
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIB =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const stopIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#407fc9;border:2.5px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,.45)"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -8],
});

const placeIconCache = new Map<string, L.DivIcon>();
function placeIcon(color: string): L.DivIcon {
  let icon = placeIconCache.get(color);
  if (!icon) {
    icon = L.divIcon({
      className: '',
      html: `<span style="display:block;width:16px;height:16px;border-radius:4px;background:${color};border:2.5px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,.45)"></span>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      popupAnchor: [0, -9],
    });
    placeIconCache.set(color, icon);
  }
  return icon;
}

export default function MapView({ stops, routes, routeStops, places }: Props) {
  const [showStops, setShowStops] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showPlaces, setShowPlaces] = useState(true);

  const mappedStops = useMemo(() => stops.filter(hasCoordinates), [stops]);
  const mappedPlaces = useMemo(() => places.filter(hasCoordinates), [places]);

  const routeLines = useMemo(() => {
    const stopById = buildStopMap(stops);
    const byRoute = buildRouteStopMap(routeStops);

    const lines: { id: string; color: string; positions: [number, number][] }[] = [];
    for (const route of routes) {
      const rows = byRoute.get(String(route.id)) ?? [];
      const positions: [number, number][] = [];
      for (const rs of rows) {
        const s = stopById.get(String(rs.stopId));
        if (s && hasCoordinates(s)) positions.push([s.lat, s.lng]);
      }
      if (positions.length >= 2) {
        lines.push({ id: String(route.id), color: route.color || '#407fc9', positions });
      }
    }
    return lines;
  }, [routes, routeStops, stops]);

  const legend = [
    {
      label: `Stops (${mappedStops.length})`,
      on: showStops,
      set: setShowStops,
      swatch: 'bg-brand-500',
    },
    {
      label: `Routes (${routeLines.length})`,
      on: showRoutes,
      set: setShowRoutes,
      swatch: 'bg-sun-500',
    },
    {
      label: `Places (${mappedPlaces.length})`,
      on: showPlaces,
      set: setShowPlaces,
      swatch: 'bg-brand-400',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {legend.map(item => (
          <button
            key={item.label}
            onClick={() => item.set(!item.on)}
            aria-pressed={item.on}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              item.on
                ? 'border-slate-200 bg-white text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                : 'border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-500'
            }`}
          >
            <span className={`h-3 w-3 rounded-full ${item.swatch} ${item.on ? '' : 'opacity-30'}`} />
            {item.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          Centered on St. John&apos;s, Antigua
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-slate-800">
        <MapContainer
          center={ANTIGUA_CENTER}
          zoom={11}
          className="h-[60vh] min-h-[360px] w-full sm:h-[68vh] sm:min-h-[420px]"
        >
          <TileLayer url={OSM_URL} attribution={OSM_ATTRIB} />

          {showRoutes &&
            routeLines.map(line => (
              <Polyline
                key={line.id}
                positions={line.positions}
                pathOptions={{ color: line.color, weight: 4, opacity: 0.75 }}
              />
            ))}

          {showStops &&
            mappedStops.map(stop => (
              <Marker
                key={String(stop.id)}
                position={[stop.lat, stop.lng]}
                icon={stopIcon}
                title={stop.name}
                alt={`Bus stop: ${stop.name}`}
              >
                <Popup>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {stop.name}
                  </span>
                </Popup>
              </Marker>
            ))}

          {showPlaces &&
            mappedPlaces.map(place => (
              <Marker
                key={`place-${String(place.id)}`}
                position={[place.lat, place.lng]}
                icon={placeIcon(categoryMeta(place.category).color)}
                title={place.name}
                alt={`${categoryMeta(place.category).singular}: ${place.name}`}
              >
                <Popup>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {place.name}
                  </span>
                  <br />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {categoryMeta(place.category).singular}
                  </span>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Basemap © OpenStreetMap contributors. {stops.length - mappedStops.length} stop(s) hidden
        (location pending).
      </p>
    </div>
  );
}

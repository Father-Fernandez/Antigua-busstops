import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { BusStop, Route, RouteStop, VehiclePosition } from '../module_bindings/types';
import { buildRouteStopMap, buildStopMap, hasCoordinates } from '../lib/journey';

interface Props {
  stops: readonly BusStop[];
  routes: readonly Route[];
  routeStops: readonly RouteStop[];
  vehiclePositions: readonly VehiclePosition[];
}

const ANTIGUA_CENTER: [number, number] = [17.086, -61.8];
const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const stopIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:14px;height:14px;border-radius:9999px;background:#407fc9;border:2.5px solid #ffffff;box-shadow:0 1px 3px rgba(0,0,0,.45)"></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -8],
});

function vehicleIcon(heading: number) {
  return L.divIcon({
    className: '',
    html: `<div style="width:32px;height:32px;transform:rotate(${heading}deg)">
      <svg viewBox="0 0 24 24" width="32" height="32" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,.45))">
        <circle cx="12" cy="12" r="10.5" fill="#d32630" stroke="#ffffff" stroke-width="2"/>
        <path d="M12 5.5l4.5 6.5h-2.6v6h-3.8v-6H7.5z" fill="#ffffff"/>
      </svg>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
}

export default function MapView({ stops, routes, routeStops, vehiclePositions }: Props) {
  const [showStops, setShowStops] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showBuses, setShowBuses] = useState(true);

  const mappedStops = useMemo(() => stops.filter(hasCoordinates), [stops]);

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
    { label: `Stops (${mappedStops.length})`, on: showStops, set: setShowStops, swatch: 'bg-brand-500' },
    { label: `Routes (${routeLines.length})`, on: showRoutes, set: setShowRoutes, swatch: 'bg-sun-500' },
    { label: `Buses (${vehiclePositions.length})`, on: showBuses, set: setShowBuses, swatch: 'bg-flag-500' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {legend.map(item => (
          <button
            key={item.label}
            onClick={() => item.set(!item.on)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              item.on
                ? 'border-slate-200 bg-white text-slate-700 shadow-sm'
                : 'border-slate-200 bg-slate-100 text-slate-400'
            }`}
          >
            <span className={`h-3 w-3 rounded-full ${item.swatch} ${item.on ? '' : 'opacity-30'}`} />
            {item.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">Centered on St. John's, Antigua</span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <MapContainer
          center={ANTIGUA_CENTER}
          zoom={11}
          scrollWheelZoom
          className="h-[68vh] min-h-[420px] w-full"
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
              <Marker key={String(stop.id)} position={[stop.lat, stop.lng]} icon={stopIcon}>
                <Popup>
                  <span className="font-semibold text-slate-800">{stop.name}</span>
                </Popup>
              </Marker>
            ))}

          {showBuses &&
            vehiclePositions.map(vp => (
              <Marker
                key={String(vp.vehicleId)}
                position={[vp.lat, vp.lng]}
                icon={vehicleIcon(vp.heading)}
              >
                <Popup>
                  <span className="font-semibold text-slate-800">Bus {Number(vp.vehicleId)}</span>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      <p className="text-xs text-slate-400">
        Basemap © OpenStreetMap contributors. {stops.length - mappedStops.length} stop(s) hidden
        (location pending).
      </p>
    </div>
  );
}

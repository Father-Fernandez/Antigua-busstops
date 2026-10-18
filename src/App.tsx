import { useMemo, useState } from 'react';
import { tables } from './module_bindings';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';
import Header, { type Page } from './components/Header';
import JourneyPlanner from './components/JourneyPlanner';
import MapView from './components/MapView';
import RoutesView from './components/RoutesView';
import StopsView from './components/StopsView';
import DataView from './components/DataView';
import AdminView from './components/AdminView';
import AboutView from './components/AboutView';
import WeatherCard from './components/WeatherCard';
import Footer from './components/Footer';
import { useTheme } from './lib/theme';
import { SPACETIMEDB_HOST, SPACETIMEDB_DB_NAME } from './lib/config';

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function App() {
  const { isActive: connected, identity } = useSpacetimeDB();
  const [page, setPage] = useState<Page>('planner');
  const { theme, toggle: toggleTheme } = useTheme();

  const [routes] = useTable(tables.route);
  const [stops] = useTable(tables.busStop);
  const [routeStops] = useTable(tables.routeStop);
  const [fares] = useTable(tables.fare);
  const [routeFares] = useTable(tables.routeFare);
  const [vehiclePositions] = useTable(tables.vehiclePosition);
  const [admins] = useTable(tables.admin);

  const identityHex = identity?.toHexString();
  const isAdmin = useMemo(
    () => admins.some(admin => admin.identity.toHexString() === identityHex),
    [admins, identityHex]
  );
  const hasAdmins = admins.length > 0;
  const canOpenAdmin = isAdmin || !hasAdmins;

  return (
    <div className="flex min-h-full flex-col overflow-x-hidden bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <Header
        page={page}
        onNavigate={setPage}
        connected={connected}
        vehicleCount={vehiclePositions.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        showAdmin={canOpenAdmin}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {page === 'planner' && (
          <div className="space-y-6">
            <JourneyPlanner
              stops={stops}
              routes={routes}
              routeStops={routeStops}
              routeFares={routeFares}
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <WeatherCard className="sm:col-span-2 lg:col-span-1" />
              <Stat value={routes.length} label="Routes running" />
              <Stat value={stops.length} label="Stops mapped" />
              <Stat value={vehiclePositions.length} label="Buses on the road" />
            </div>
          </div>
        )}

        {page === 'map' && (
          <MapView
            stops={stops}
            routes={routes}
            routeStops={routeStops}
            vehiclePositions={vehiclePositions}
          />
        )}

        {page === 'routes' && (
          <RoutesView
            routes={routes}
            routeStops={routeStops}
            stops={stops}
            fares={fares}
            routeFares={routeFares}
          />
        )}

        {page === 'stops' && <StopsView stops={stops} />}

        {page === 'data' && (
          <DataView
            routes={routes}
            stops={stops}
            routeStops={routeStops}
            routeFares={routeFares}
            fares={fares}
            host={SPACETIMEDB_HOST}
            database={SPACETIMEDB_DB_NAME}
          />
        )}

        {page === 'admin' && canOpenAdmin && (
          <AdminView
            routes={routes}
            stops={stops}
            routeStops={routeStops}
            fares={fares}
            routeFares={routeFares}
            isAdmin={isAdmin}
            hasAdmins={hasAdmins}
          />
        )}

        {page === 'about' && (
          <AboutView
            stopCount={stops.length}
            routeCount={routes.length}
            vehicleCount={vehiclePositions.length}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;

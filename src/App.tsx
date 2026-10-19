import { lazy, Suspense, useMemo } from 'react';
import { tables } from './module_bindings';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';
import Header from './components/Header';
import JourneyPlanner from './components/JourneyPlanner';
import RoutesView from './components/RoutesView';
import ExploreView from './components/ExploreView';
import DataView from './components/DataView';
import AdminView from './components/AdminView';
import AboutView from './components/AboutView';
import WeatherCard from './components/WeatherCard';
import Footer from './components/Footer';
import { useTheme } from './lib/theme';
import { useHashRoute, navigate } from './lib/router';
import { SPACETIMEDB_HOST, SPACETIMEDB_DB_NAME } from './lib/config';

const MapView = lazy(() => import('./components/MapView'));

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-4xl font-extrabold text-brand-600 sm:text-5xl dark:text-brand-400">
        {value}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-slate-400">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-brand-500 dark:border-slate-700" />
      <p className="text-sm font-medium">Loading the network…</p>
    </div>
  );
}

function App() {
  const { identity } = useSpacetimeDB();
  const { page, params } = useHashRoute();
  const { theme, toggle: toggleTheme } = useTheme();

  const [routes, routesReady] = useTable(tables.route);
  const [stops, stopsReady] = useTable(tables.busStop);
  const [routeStops, routeStopsReady] = useTable(tables.routeStop);
  const [fares, faresReady] = useTable(tables.fare);
  const [routeFares, routeFaresReady] = useTable(tables.routeFare);
  const [places, placesReady] = useTable(tables.place);
  const [admins, adminsReady] = useTable(tables.admin);

  const ready =
    routesReady &&
    stopsReady &&
    routeStopsReady &&
    faresReady &&
    routeFaresReady &&
    placesReady &&
    adminsReady;

  const identityHex = identity?.toHexString();
  const isAdmin = useMemo(
    () => admins.some(admin => admin.identity.toHexString() === identityHex),
    [admins, identityHex]
  );
  const hasAdmins = admins.length > 0;
  const canOpenAdmin = isAdmin || !hasAdmins;
  const activePage = page === 'admin' && !canOpenAdmin ? 'planner' : page;

  return (
    <div className="flex min-h-full flex-col overflow-x-hidden bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <Header
        page={activePage}
        onNavigate={navigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        showAdmin={canOpenAdmin}
      />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {!ready ? (
          <Loading />
        ) : (
          <>
            {activePage === 'planner' && (
              <div className="space-y-6">
                <JourneyPlanner
                  stops={stops}
                  routes={routes}
                  routeStops={routeStops}
                  routeFares={routeFares}
                  places={places}
                  initialFrom={params.get('from') ?? undefined}
                  initialTo={params.get('to') ?? undefined}
                  onPlan={(from, to) => navigate('planner', { from, to })}
                />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <WeatherCard />
                  <Stat value={routes.length} label="Routes running" />
                  <Stat value={stops.length} label="Stops mapped" />
                </div>
              </div>
            )}

            {activePage === 'map' && (
              <Suspense fallback={<Loading />}>
                <MapView stops={stops} routes={routes} routeStops={routeStops} places={places} />
              </Suspense>
            )}

            {activePage === 'explore' && <ExploreView places={places} stops={stops} />}

            {activePage === 'routes' && (
              <RoutesView
                routes={routes}
                routeStops={routeStops}
                stops={stops}
                fares={fares}
                routeFares={routeFares}
              />
            )}

            {activePage === 'data' && (
              <DataView
                routes={routes}
                stops={stops}
                routeStops={routeStops}
                routeFares={routeFares}
                fares={fares}
                places={places}
                host={SPACETIMEDB_HOST}
                database={SPACETIMEDB_DB_NAME}
              />
            )}

            {activePage === 'admin' && canOpenAdmin && (
              <AdminView
                routes={routes}
                stops={stops}
                routeStops={routeStops}
                fares={fares}
                routeFares={routeFares}
                places={places}
                isAdmin={isAdmin}
                hasAdmins={hasAdmins}
              />
            )}

            {activePage === 'about' && (
              <AboutView stopCount={stops.length} routeCount={routes.length} />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;

import { useState } from 'react';
import { tables } from './module_bindings';
import { useSpacetimeDB, useTable } from 'spacetimedb/react';
import Header, { type Page } from './components/Header';
import JourneyPlanner from './components/JourneyPlanner';
import MapView from './components/MapView';
import RoutesView from './components/RoutesView';
import StopsView from './components/StopsView';
import AdminView from './components/AdminView';
import AboutView from './components/AboutView';
import Footer from './components/Footer';

function App() {
  const { isActive: connected } = useSpacetimeDB();
  const [page, setPage] = useState<Page>('planner');

  const [routes] = useTable(tables.route);
  const [stops] = useTable(tables.busStop);
  const [routeStops] = useTable(tables.routeStop);
  const [fares] = useTable(tables.fare);
  const [routeFares] = useTable(tables.routeFare);
  const [vehiclePositions] = useTable(tables.vehiclePosition);

  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-800">
      <Header
        page={page}
        onNavigate={setPage}
        connected={connected}
        vehicleCount={vehiclePositions.length}
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
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-2xl font-extrabold text-brand-600">{routes.length}</p>
                <p className="text-sm text-slate-500">Routes running</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-2xl font-extrabold text-brand-600">{stops.length}</p>
                <p className="text-sm text-slate-500">Stops mapped</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <p className="text-2xl font-extrabold text-brand-600">
                  {vehiclePositions.length}
                </p>
                <p className="text-sm text-slate-500">Buses on the road</p>
              </div>
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

        {page === 'admin' && (
          <AdminView
            routes={routes}
            stops={stops}
            routeStops={routeStops}
            fares={fares}
            routeFares={routeFares}
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

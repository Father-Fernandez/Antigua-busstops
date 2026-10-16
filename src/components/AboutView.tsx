interface Props {
  stopCount: number;
  routeCount: number;
  vehicleCount: number;
}

export default function AboutView({ stopCount, routeCount, vehicleCount }: Props) {
  const stats = [
    { label: 'Stops', value: stopCount },
    { label: 'Routes', value: routeCount },
    { label: 'Vehicles tracked', value: vehicleCount },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(s => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm"
          >
            <p className="text-3xl font-extrabold text-brand-600">{s.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="max-w-none rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">About this service</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Bus Stop Antigua is a real-time bus tracking and journey-planning tool for the Antigua
          public bus network. Data is served live from SpacetimeDB, so routes, stops, fares and
          vehicle positions stay in sync across every connected client without a refresh.
        </p>

        <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">
          Fares
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Fares are a flat rate per route, shown in Eastern Caribbean dollars (EC$). Adult, child
          and night rates are listed on each route.
        </p>

        <h3 className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500">
          Coverage
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Stop locations were geocoded from OpenStreetMap (Nominatim) and GeoNames, with a few
          best-effort placements flagged as approximate. Stops still missing coordinates are listed
          as "pending" on the Bus Stops page.
        </p>
      </div>
    </div>
  );
}

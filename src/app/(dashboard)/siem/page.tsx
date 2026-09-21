export default function SIEMPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SIEM Dashboard</h2>
          <p className="text-sm text-gray-400">
            Real-time security event monitoring and threat detection
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium hover:bg-emerald-700">
            Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Events (24h)" value="—" color="blue" />
        <StatCard title="Open Alerts" value="—" color="amber" />
        <StatCard title="Active Incidents" value="—" color="red" />
        <StatCard title="Active Devices" value="—" color="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-300">
            Recent Alerts
          </h3>
          <p className="text-sm text-gray-500">No alerts to display.</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-300">
            Events by Type
          </h3>
          <p className="text-sm text-gray-500">No event data available.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "border-blue-500/30 bg-blue-500/10",
    amber: "border-amber-500/30 bg-amber-500/10",
    red: "border-red-500/30 bg-red-500/10",
    emerald: "border-emerald-500/30 bg-emerald-500/10",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${colorMap[color] ?? "border-gray-700 bg-gray-800"}`}
    >
      <p className="text-xs font-medium text-gray-400">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

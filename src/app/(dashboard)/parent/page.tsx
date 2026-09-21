export default function ParentControlPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Parental Control</h2>
          <p className="text-sm text-gray-400">
            Manage device policies and monitor child activity
          </p>
        </div>
        <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-700">
          Add Child Profile
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="text-sm font-semibold text-gray-300">
            Child Profiles
          </h3>
          <p className="mt-2 text-3xl font-bold">0</p>
          <p className="text-xs text-gray-500">No profiles configured</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="text-sm font-semibold text-gray-300">
            Active Policies
          </h3>
          <p className="mt-2 text-3xl font-bold">0</p>
          <p className="text-xs text-gray-500">No policies active</p>
        </div>
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
          <h3 className="text-sm font-semibold text-gray-300">
            Monitored Devices
          </h3>
          <p className="mt-2 text-3xl font-bold">0</p>
          <p className="text-xs text-gray-500">No devices registered</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6">
        <h3 className="mb-4 text-sm font-semibold text-gray-300">
          Device Overview
        </h3>
        <p className="text-sm text-gray-500">
          Register a device to begin monitoring. Use the API endpoint{" "}
          <code className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-emerald-400">
            POST /api/devices/register
          </code>{" "}
          from the Android agent.
        </p>
      </div>
    </div>
  );
}

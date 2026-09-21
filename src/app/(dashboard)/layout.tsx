export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r border-gray-800 bg-gray-900 p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-emerald-400">CyberRakshak</h1>
          <p className="text-xs text-gray-500">SIEM & Parental Control</p>
        </div>
        <nav className="space-y-1">
          <a
            href="/siem"
            className="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            SIEM Dashboard
          </a>
          <a
            href="/parent"
            className="block rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Parental Control
          </a>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}

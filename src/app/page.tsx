import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 text-white">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-emerald-400">
          CyberRakshak
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          SIEM & Parental Control Platform
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Enterprise-grade security event monitoring with real-time parental
          controls for Android devices.
        </p>

        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/siem"
            className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold hover:bg-emerald-700"
          >
            SIEM Dashboard
          </Link>
          <Link
            href="/parent"
            className="rounded-lg border border-gray-700 px-6 py-3 text-sm font-semibold hover:bg-gray-800"
          >
            Parental Control
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-left">
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-emerald-400">
              Multi-Tenant
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Strict tenant isolation with UUID-based data segregation.
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-emerald-400">
              Idempotent Ingest
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Duplicate-safe batch event ingestion via composite unique keys.
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <h3 className="text-sm font-semibold text-emerald-400">
              Serverless Ready
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Built for Vercel with PostgreSQL and Next.js App Router.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

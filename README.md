# CyberRakshak SIEM & Parental Control Platform

Enterprise-grade SIEM (Security Information and Event Management) and parental control platform built with Next.js App Router, Prisma ORM, PostgreSQL, and Tailwind CSS.

## Architecture

```
[Android Device / SQLite Queue] → (HTTPS + Token Auth + Idempotent Batch Sync)
    → [Next.js API Route Handlers]
    → [Service Layer Validation & Duplicate Checks]
    → [Prisma Singleton Client]
    → [PostgreSQL Multi-Tenant DB]
```

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT (bcrypt + jsonwebtoken)
- **Validation**: Zod schemas
- **Deployment**: Vercel-compatible (no local filesystem writes)

## Features

- Multi-tenant architecture with strict `tenantId` isolation
- Idempotent bulk event ingestion (composite unique keys)
- Role-based access control (Super Admin, Admin, Analyst, Parent)
- Real-time alert generation and incident management
- Device registration and management
- Parental control policies (screen time, app blocking, content filtering)
- Data export (CSV, JSON, PDF)
- Audit logging for all mutations

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/cyberrakshak-siem.git
cd cyberrakshak-siem

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Start development server
npm run dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register tenant + admin user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `POST` | `/api/devices/register` | Register an Android device |
| `GET` | `/api/devices` | List devices |
| `DELETE` | `/api/devices?deviceId=` | Deactivate a device |
| `POST` | `/api/events/bulk-ingest` | Bulk ingest security events |
| `GET` | `/api/events` | List events with filters |
| `POST` | `/api/alerts` | Create an alert |
| `GET` | `/api/alerts` | List alerts with filters |
| `PATCH` | `/api/alerts` | Update alert status |
| `POST` | `/api/incidents` | Create incident from alerts |
| `GET` | `/api/incidents` | List incidents |
| `PATCH` | `/api/incidents` | Update incident status |
| `POST` | `/api/exports` | Create data export job |
| `GET` | `/api/exports` | List export jobs |
| `GET` | `/api/dashboard/summary` | Dashboard summary stats |

## Database Models

- **Tenant** - Organization/workspace isolation
- **User** - Users with role-based access
- **Child** - Child profiles for parental control
- **Device** - Registered devices (Android/iOS/Desktop)
- **Event** - Security events with idempotent ingestion
- **Alert** - Generated alerts from events
- **Incident** - Aggregated incidents from alerts
- **Policy** - Parental control policies
- **AuditLog** - Full audit trail
- **ExportJob** - Data export tracking

## Development

```bash
npm run lint        # Run ESLint
npm run typecheck   # Run TypeScript checks
npm run db:studio   # Open Prisma Studio
```

## License

MIT

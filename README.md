# WorkTime Pro

A full-stack employee work-time tracking web application built from scratch as a portfolio project. WorkTime Pro demonstrates a modern SaaS-style product with real data persistence, concurrency-safe timers, reporting, and automated tests.

## Features

- Employee management: create, edit, view details, search, filter by status, archive (history preserved)
- Time tracking with concurrency-safe timers (one active timer per employee)
- Timer restoration after page reload and server restart
- Timer Pause/Resume functionality (database-persisted)
- Time history with filtering, search, sorting, pagination
- Reports: today/week/month/custom period, per-employee stats, daily stats, task breakdown
- Charts (Recharts) reflecting real database data
- CSV export with Cyrillic support and CSV-injection protection
- Light/dark theme, responsive layout, skeleton loading, toast notifications, empty states
- Real-time active timer widget based on `startedAt`

## Tech Stack

**Frontend**
- React 18, TypeScript, Vite
- Tailwind CSS, shadcn/ui-style components, Lucide React
- Recharts, React Router, TanStack Query, React Hook Form, Zod

**Backend**
- Node.js, Express, TypeScript
- Prisma ORM, SQLite
- Zod validation, centralized error handling

**Testing**
- Vitest, Supertest, React Testing Library, Playwright

**Tooling**
- ESLint, Prettier, npm, Git

## Architecture

```
worktime-pro/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── features/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
├── server/          # Express + Prisma backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── db/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── tests/
├── .env.example
├── .gitignore
└── package.json
```

Business logic lives in the service layer (`server/src/services`), not in controllers or React components.

## Installation

```bash
git clone <repo-url>
cd worktime-pro
npm install
```

## Environment

Copy the example file:
```bash
cp server/.env.example server/.env
```

## Database

```bash
npm run db:migrate
npm run db:seed
```

## Run

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:3001

## Commands

```bash
npm run test         # all tests
npm run lint         # lint client + server
npm run build        # production build
```

## API Documentation

Base URL: `/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server and DB status |
| POST | `/employees` | Create employee |
| POST | `/timers/start` | Start timer |
| POST | `/timers/:id/stop` | Stop timer |
| POST | `/timers/:id/pause`| Pause timer |
| POST | `/timers/:id/resume`| Resume timer |
| GET | `/timers/active` | Active timers |
| GET | `/reports/*` | Various report endpoints |

## Architectural Decisions

- **Timers concurrency**: active timer = row with `endedAt = null`. SERIALIZABLE transactions prevent race conditions.
- **Timer Pause/Resume**: `pausedAt` and `pausedSeconds` fields track non-working time, ensuring correct duration on stop.
- **Time storage**: UTC timestamps; local UI display.
- **CSV safety**: RFC-4180 escaping + injection prevention.
- **No localStorage**: SQLite is the single source of truth.

## License

MIT

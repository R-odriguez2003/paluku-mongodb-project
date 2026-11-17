# Hotel Booking System

A full-stack hotel booking platform with a React + Vite frontend and an Express + TypeScript API. The app supports customer search and booking flows and administrative management for hotels, rooms, and reservations.

## Stack
- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript
- Database: MongoDB (with graceful fallback when the local MongoDB service is not running)
- Auth: JWT-based login with role support

## Local development

1. Start MongoDB locally:
   ```bash
   docker compose up -d
   ```
2. Install dependencies at the project root:
   ```bash
   npm install
   ```
3. Run both apps together:
   ```bash
   npm run dev
   ```

The frontend runs on http://localhost:5173 and the backend runs on http://localhost:4000.

## Backend

```bash
cd backend
npm install
npm run dev
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

## Environment

Copy `.env.example` to a project-level `.env` or configure the backend environment directly as needed.

## Main routes
- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/hotels`
- `GET /api/hotels/:id`
- `POST /api/hotels`
- `GET /api/rooms`
- `POST /api/reservations`
- `GET /api/reservations`
- `PATCH /api/reservations/:id/status`

## Notes
The API uses MongoDB if a valid connection string is configured. If no database is available, it falls back to an in-memory store so the app is still usable during local development.

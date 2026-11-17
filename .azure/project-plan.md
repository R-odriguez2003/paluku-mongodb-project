# Project Plan

**Status**: Approved
**Created**: 2026-11-06
**Mode**: NEW
**Execution Mode**: auto

---

## 1. Project Overview

**Goal**: Build a full-stack hotel booking platform with a customer-facing search and booking flow plus staff/admin management for hotels, rooms, and reservations. The project is designed so that every module is independently testable.

**App Type**: SPA + API

**API Login**: Yes

**Mode**: NEW

**Deployment Plan**: No deployment plan found

---

## 2. Hotel Booking API — Backend

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Runtime** | Node |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |
| **Orchestration** | Docker + docker compose |

---

## 3. Hotel Booking Web App — Frontend

| Component | Technology |
|-----------|-----------|
| **Language** | TypeScript |
| **Framework** | React + Vite |
| **Package Manager** | npm |
| **Test Runner** | vitest |
| **Mocking Library** | vi.mock |
| **Test Command** | npm test |

---

## 4. Services Required

| Azure Service | Role in App | Environment Variable | Default Value (Local) | Classification |
|---------------|------------|---------------------|----------------------|----------------|
| MongoDB | Primary hotel booking data store | MONGODB_URI | mongodb://localhost:27017/hotel-booking | Essential |

---

## 5. Prerequisites

### Run

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Node.js | * | ❓ | unknown |
| npm | * | ❓ | unknown |

### Debug

| Tool | Service(s) | Installed | Version |
|------|------------|-----------|---------|
| Docker | Hotel Booking API | ❓ | unknown |
| Docker Compose | Hotel Booking API | ❓ | unknown |
| Chrome | Hotel Booking Web App | ✅ | 156.0.80xx |

---

## 6. Design System & UI

**Component Library**: Fluent UI v9
**Style Direction**: Modern hotel booking experience with calm, premium neutral tones, clear reservation pricing, and a responsive admin dashboard for fast booking decisions.
**Typography**: Segoe UI Variable

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#1F5C8B` | Primary actions on search, booking, and login flows |
| `accent` | `#D97706` | Highlighting special offers, status chips, and premium room categories |
| `surface` | `#F8FAFC` | Main page and card backgrounds |
| `text` | `#0F172A` | Core body text and headings |
| `muted` | `#64748B` | Secondary labels, metadata, timestamps, and quiet actions |
| `border` | `#E2E8F0` | Dividers, form fields, and card boundaries |

### Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| Landing | `/` | Search for available hotels and compare stay options | hero + card-list |
| Hotel Details | `/hotels/:id` | Review room availability, amenities, and pricing details | two-column(media+meta) + action-bar |
| Booking | `/booking` | Confirm reservation details and guest information | form |
| My Bookings | `/bookings` | Track active, upcoming, and historical reservations | table |
| Admin Dashboard | `/admin` | Manage hotel, room, and reservation operations | grid + table |

### Sample Content

Landing — Hotel:
| Hotel | Location | Price | Status |
| Azure Harbor Suites | Lisbon | €189/night | Available |
| Citylight Rooms | Madrid | €142/night | Limited |
| Harbor View Stay | Porto | €175/night | Available |

Booking — Reservation:
| Hotel | Room | Dates | Guests | Total |
| Azure Harbor Suites | Deluxe King | Nov 14–17 | 2 adults | €567 |
| Citylight Rooms | Queen Studio | Nov 20–23 | 1 adult | €426 |
| Harbor View Stay | Family Suite | Nov 22–25 | 4 guests | €735 |

Hotel Details — Room:
| Room Type | Capacity | Rate | Availability |
| Deluxe King | 2 guests | €189/night | 4 rooms |
| Family Suite | 4 guests | €245/night | 2 rooms |
| Executive Twin | 2 guests | €210/night | 5 rooms |

Booking — Reservation: check-in: 2026-11-14 · check-out: 2026-11-17 · guests: 2 adults

My Bookings — Reservation:
| Booking ID | Hotel | Dates | Status |
| HB-2041 | Azure Harbor Suites | Nov 14–17 | Confirmed |
| HB-1982 | Citylight Rooms | Oct 06–09 | Completed |
| HB-2018 | Harbor View Stay | Nov 22–25 | Pending |

Admin Dashboard — Reservation:
| Booking ID | Guest | Hotel | Dates | Status |
| HB-2041 | Maya Chen | Azure Harbor Suites | Nov 14–17 | Confirmed |
| HB-2042 | Luca Moretti | Citylight Rooms | Nov 20–23 | Pending |
| HB-2043 | Sofia Almeida | Harbor View Stay | Nov 22–25 | Pending |

---

## 7. Project Structure

```text
hotel-booking/
  frontend/
    package.json
    vite.config.ts
    src/
      components/
      pages/
      services/
      hooks/
      context/
      types/
  backend/
    package.json
    tsconfig.json
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
      validators/
      utils/
  .azure/
    requirements.json
    project-plan.md
    .preview-temp/
  docker-compose.yml
  README.md
```

---

## 8. Route Definitions

| # | Method | Path | Description | Request Body | Response Body | Status Codes |
|---|--------|------|-------------|-------------|--------------|-------------|
| 1 | GET | `/api/health` | Health check | — | `{ status, services }` | 200, 503 |
| 2 | POST | `/api/auth/register` | Create a customer or staff account | `{ name, email, password, role? }` | `{ user }` | 201, 400, 409 |
| 3 | POST | `/api/auth/login` | Authenticate a user | `{ email, password }` | `{ user }` | 200, 401 |
| 4 | GET | `/api/hotels` | List hotels with filters | — | `{ hotels }` | 200 |
| 5 | GET | `/api/hotels/:id` | Get a hotel detail record | — | `{ hotel }` | 200, 404 |
| 6 | POST | `/api/hotels` | Create a hotel record | `{ name, location, description, amenities, rating }` | `{ hotel }` | 201, 400 |
| 7 | PATCH | `/api/hotels/:id` | Update a hotel record | `{ name?, location?, description?, amenities?, rating? }` | `{ hotel }` | 200, 400, 404 |
| 8 | DELETE | `/api/hotels/:id` | Delete a hotel record | — | `{ deleted: true }` | 200, 404 |
| 9 | GET | `/api/rooms` | Query rooms by hotel, dates, and guest capacity | — | `{ rooms }` | 200 |
| 10 | POST | `/api/rooms` | Create a room record | `{ hotelId, type, capacity, rate, quantity }` | `{ room }` | 201, 400, 404 |
| 11 | GET | `/api/rooms/:id` | Get a room record | — | `{ room }` | 200, 404 |
| 12 | PATCH | `/api/rooms/:id` | Update a room record | `{ type?, capacity?, rate?, quantity? }` | `{ room }` | 200, 400, 404 |
| 13 | DELETE | `/api/rooms/:id` | Delete a room record | — | `{ deleted: true }` | 200, 404 |
| 14 | POST | `/api/reservations` | Create a reservation after availability validation | `{ hotelId, roomId, checkIn, checkOut, guests }` | `{ reservation }` | 201, 400, 409 |
| 15 | GET | `/api/reservations` | List reservations for the signed-in user or staff view | — | `{ reservations }` | 200 |
| 16 | GET | `/api/reservations/:id` | Get a reservation record | — | `{ reservation }` | 200, 404 |
| 17 | PATCH | `/api/reservations/:id` | Update reservation details or status | `{ checkIn?, checkOut?, guests?, status? }` | `{ reservation }` | 200, 400, 404, 409 |
| 18 | DELETE | `/api/reservations/:id` | Delete a reservation record | — | `{ deleted: true }` | 200, 404 |

---

## 9. Next Steps

1. Run **azure-project-scaffold** to execute this plan
2. Run **azure-project-integrate** to wire the frontend to live data, smoke-test the backend, and create the migrations
3. Run **azure-debug-plan** → **azure-debug-generate** for Docker emulators and VS Code debugging
4. Run the **azure-deploy** agent when ready; it uses **azure-app-onboard** for architecture, cost estimation, IaC generation, provisioning, and health verification

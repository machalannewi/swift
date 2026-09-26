# Swift

A ride-booking web app built with Next.js. Riders sign in, pick a pickup and dropoff on a live map, compare upfront fares, and book a ride.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) with React 19 and TypeScript
- [Tailwind CSS](https://tailwindcss.com) and [Framer Motion](https://www.framer.com/motion/) for styling and animation
- [Clerk](https://clerk.com) for authentication (email/password with email-code verification, Google OAuth)
- [Mapbox](https://www.mapbox.com) for maps, place search, geocoding and driving routes
- [Prisma](https://www.prisma.io) with PostgreSQL for users, drivers, rides and the ride event log
- [Pusher Channels](https://pusher.com/channels) for real-time ride requests, status updates and live driver location

## Getting started

1. Install dependencies:

    ```bash
    npm install
    ```

2. Create a `.env` file in the project root (see [Environment variables](#environment-variables)).

3. Start the dev server:

    ```bash
    npm run dev
    ```

4. Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command         | Description                  |
| --------------- | ---------------------------- |
| `npm run dev`   | Start the development server |
| `npm run build` | Create a production build    |
| `npm run start` | Serve the production build   |
| `npm run lint`  | Run ESLint                   |
| `npm run make-admin -- <email>` | Give an account admin access (`--remove` to revoke) |
| `npm run approve-driver -- <email>` | Approve a driver application (lists pending drivers when run without an email) |

## Environment variables

```bash
# PostgreSQL connection string (used by Prisma)
DATABASE_URL=

# Mapbox public access token
NEXT_PUBLIC_MAPBOX_TOKEN=

# Clerk keys (from the Clerk dashboard)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Clerk routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Pusher Channels (real-time ride events) - from your Pusher app's "App Keys"
PUSHER_APP_ID=
PUSHER_SECRET=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_PUSHER_CLUSTER=
```

After setting `DATABASE_URL`, create the tables with `npx prisma migrate deploy`.

To enable "Continue with Google", turn on the Google social connection in your Clerk dashboard.

## Project structure

```
swift/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                    # Static files (served as-is)
├── src/
│   ├── app/                   # Routes (Next.js App Router)
│   │   ├── page.tsx           # Landing page
│   │   ├── layout.tsx         # Root layout (Clerk provider, fonts)
│   │   ├── icon.svg           # Favicon
│   │   ├── (auth)/            # Sign-in / sign-up pages + shared layout
│   │   ├── sso-callback/      # OAuth redirect handler
│   │   ├── dashboard/         # Rider dashboard (protected)
│   │   │   ├── page.tsx       # Book a ride (map + booking panel)
│   │   │   ├── rides/         # Ride history
│   │   │   ├── profile/       # Account details
│   │   │   └── info/          # Help, safety and FAQs
│   │   ├── driver/            # Driver sign-in/up, onboarding, live trips, earnings
│   │   ├── admin/             # Admin overview, rides, drivers (+ driver pages), riders
│   │   └── api/               # Ride, driver, admin and Pusher auth endpoints
│   ├── sections/              # Landing page sections (Hero, Features, FAQs, ...)
│   ├── components/
│   │   ├── admin/             # RidesChart, AdminLiveMap, RideRow, TripProgress, LiveRefresh
│   │   ├── auth/              # AuthForm (shared sign-in/up logic) and AuthModal
│   │   ├── dashboard/         # Navbar, BottomNavigation, Mapbox, SearchBox, CarOptions
│   │   ├── ui/                # shadcn/ui primitives
│   │   └── *.tsx              # Shared components (Button, Tag, Pointer, ...)
│   ├── hooks/                 # useMapboxAutocomplete, useMapboxRoute, useRideHistory
│   ├── utils/                 # Mapbox helpers, car tiers and pricing data
│   ├── types/                 # Shared TypeScript types
│   ├── assets/images/         # Logo and landing page images
│   ├── lib/                   # Server: auth/roles, Prisma, Pusher, ride lifecycle, analytics
│   └── proxy.ts               # Clerk middleware - protects /dashboard and /driver
├── next.config.ts
├── tailwind.config.ts
└── prisma.config.ts
```

## Routes

| Route                | Description                                  | Auth |
| -------------------- | -------------------------------------------- | ---- |
| `/`                  | Landing page                                 |      |
| `/sign-in`           | Log in                                       |      |
| `/sign-up`           | Create an account (with email verification)  |      |
| `/dashboard`         | Book a ride: map, route, fares, booking flow | ✓    |
| `/dashboard/rides`   | Ride history and totals                      | ✓    |
| `/dashboard/profile` | Account details, manage account, log out     | ✓    |
| `/dashboard/info`    | Help, safety tips and FAQs                   | ✓    |
| `/driver/sign-up`    | Driver sign-up                               |      |
| `/driver/sign-in`    | Driver log in                                |      |
| `/driver/onboarding` | Vehicle and licence details                  | ✓    |
| `/driver`            | Go online, receive and run trips             | Driver |
| `/driver/trips`      | Trip history and earnings                    | Driver |
| `/driver/profile`    | Driver and vehicle details                   | Driver |
| `/admin`             | Live KPIs, rides per day, service times, driver map, trip activity | Admin |
| `/admin/rides`       | Rides in progress and searchable ride history | Admin |
| `/admin/drivers`     | Driver approval queue and accounts           | Admin |
| `/admin/drivers/[id]`| One driver: stats, current trip, trip history | Admin |
| `/admin/riders`      | Search riders, see spend, suspend accounts   | Admin |
| `/admin/pricing`     | Fare rates and surge per vehicle type, change history | Admin |

## Admin panel

### Getting access

Sign in once with the account you want to use (it can't be a driver account), then run `npm run make-admin -- you@example.com` and open `/admin`. Non-admins get a 404 there.

### Pages

- **Overview** (`/admin`)
  - Right now: active rides, drivers online, pending approvals, total riders.
  - Today: rides requested, completed, cancelled and gross fares.
  - Rides per day for the last 14 days (completed vs cancelled), with hover details and a table view.
  - Service times for the last 7 days: time to accept, pickup time, trip time and completion rate.
  - Live map of online drivers (available vs on a trip) and a 30-day cancellation breakdown.
  - Recent activity: one row per trip with a five-step progress indicator (requested → accepted → arrived → started → completed, or where it was cancelled). Click a row to open that trip.
- **Rides** (`/admin/rides`)
  - *In progress*: every unfinished ride, oldest first. Trips that look stuck are flagged (driver not arrived after 30 min, not started 15 min after arrival, or running far past the expected time). Any unfinished ride can be cancelled; the rider and driver are notified immediately.
  - *History*: search by rider or driver name/email, plate number, pickup/dropoff place or ride ID, and filter by status (completed, cancelled) and period (today, 7 days, 30 days, all time). Filters combine and show as removable chips.
- **Drivers** (`/admin/drivers`)
  - Tabs for pending, approved, suspended and rejected drivers, with counts. Pending applications open by default when there are any.
  - Each card shows vehicle, plate, licence, phone, trips and earnings, with approve / reject / suspend / reinstate actions.
- **Driver page** (`/admin/drivers/[id]`)
  - Profile, online status and last seen, contact and vehicle details, and account actions.
  - Trips completed, distance, total and 7-day earnings, average pickup time, and driver cancellations (highlighted at 20%+ of accepted trips).
  - Their current trip (with cancel) and last 15 trips, plus a link to search all of their trips on the Rides page.
- **Riders** (`/admin/riders`): search by name or email, see completed and cancelled rides and total spend, and suspend or reinstate accounts.
- **Pricing** (`/admin/pricing`)
  - Per vehicle type: base fare, per km, per minute, minimum fare and booking fee, with a live preview of what riders pay on short, medium and long trips.
  - Manual surge: off, 1.2×, 1.5×, 1.8×, 2× or a custom value (up to 3×), with an optional reason shown to riders.
  - Change history: every change with who made it, when, and the old → new values.

Driver and rider names link between these pages, so you can move from a trip to the people involved and back.

### Live updates and suspensions

Admin pages update live: every ride and driver change is broadcast on a private admin channel, and the open page re-renders with fresh data (the "Live" badge shows the connection). Approving or suspending someone also updates their own open screen immediately. A suspended account is blocked on the server; suspending a rider cancels any ride they're waiting for, and suspended drivers are taken offline.

## How a ride works

1. The rider requests a ride. The server recalculates the route and fare, saves the ride as `REQUESTED`, and pushes it to approved, online, idle drivers of that car type within 15 km.
2. The first driver to accept wins (the update is atomic, so two drivers can't take the same ride). Other drivers see the request disappear.
3. The driver moves the ride through `ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED`. The rider sees each step and the driver's live location on the map.
4. Either side can cancel before the trip starts. Requests nobody accepts within 3 minutes are cancelled automatically.

Every status change is recorded in the `RideEvent` table, which powers the admin analytics.

## Notes

- **Driver approval**: new drivers start as `PENDING` and are approved in `/admin/drivers` (or with `npm run approve-driver -- driver@example.com`).
- **Payments**: fares are paid in cash for now.
- **Fares** are `max(minimum, (base + per km × distance + per minute × time) × surge) + booking fee`, using the rates set in `/admin/pricing` (stored in the `PricingTier` table; formula in `src/utils/pricing.ts`). Riders see the price upfront, it's locked when they request, and each ride stores its fare breakdown. If surge changes between the quote and the request, the rider is asked to review the new price.

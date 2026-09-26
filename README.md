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
│   │   └── api/               # Ride, driver and Pusher auth endpoints
│   ├── sections/              # Landing page sections (Hero, Features, FAQs, ...)
│   ├── components/
│   │   ├── auth/              # AuthForm (shared sign-in/up logic) and AuthModal
│   │   ├── dashboard/         # Navbar, BottomNavigation, Mapbox, SearchBox, CarOptions
│   │   ├── ui/                # shadcn/ui primitives
│   │   └── *.tsx              # Shared components (Button, Tag, Pointer, ...)
│   ├── hooks/                 # useMapboxAutocomplete, useMapboxRoute, useRideHistory
│   ├── utils/                 # Mapbox helpers, car tiers and pricing data
│   ├── types/                 # Shared TypeScript types
│   ├── assets/images/         # Logo and landing page images
│   ├── lib/                   # Server: auth/roles, Prisma, Pusher, ride lifecycle
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

## How a ride works

1. The rider requests a ride. The server recalculates the route and fare, saves the ride as `REQUESTED`, and pushes it to approved, online, idle drivers of that car type within 15 km.
2. The first driver to accept wins (the update is atomic, so two drivers can't take the same ride). Other drivers see the request disappear.
3. The driver moves the ride through `ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED`. The rider sees each step and the driver's live location on the map.
4. Either side can cancel before the trip starts. Requests nobody accepts within 3 minutes are cancelled automatically.

Every status change is recorded in the `RideEvent` table - the source for the upcoming admin analytics.

## Notes

- **Driver approval**: new drivers start as `PENDING`. Until the admin panel exists, approve them with `npm run approve-driver -- driver@example.com`.
- **Payments**: fares are paid in cash for now.
- **Fares** are calculated as `baseFare + amountPerKm × distance`, using the car tiers in `src/utils/CarListData.ts`.

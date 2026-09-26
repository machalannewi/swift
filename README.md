# Swift

A ride-booking web app built with Next.js. Riders sign in, pick a pickup and dropoff on a live map, compare upfront fares, and book a ride.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) with React 19 and TypeScript
- [Tailwind CSS](https://tailwindcss.com) and [Framer Motion](https://www.framer.com/motion/) for styling and animation
- [Clerk](https://clerk.com) for authentication (email/password with email-code verification, Google OAuth)
- [Mapbox](https://www.mapbox.com) for maps, place search, geocoding and driving routes
- [Prisma](https://www.prisma.io) with PostgreSQL (configured, no models yet)

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
```

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
│   │   └── driver/            # Driver home (placeholder)
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
│   └── proxy.ts               # Clerk middleware - protects /dashboard
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

## Notes

- **Ride history** is stored in the browser's `localStorage` (`src/hooks/useRideHistory.ts`) until a `Ride` model is added to the Prisma schema.
- **Driver matching** after confirming a booking is simulated; there is no dispatch backend yet.
- **Fares** are calculated as `baseFare + amountPerKm × distance`, using the car tiers in `src/utils/CarListData.ts`.

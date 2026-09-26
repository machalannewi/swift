import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isRiderRoute = createRouteMatcher(['/dashboard(.*)', '/admin(.*)'])
const isDriverAuthRoute = createRouteMatcher(['/driver/sign-in(.*)', '/driver/sign-up(.*)'])
const isDriverRoute = createRouteMatcher(['/driver(.*)'])

// Only checks that someone is signed in. Role checks (rider vs driver)
// happen in the dashboard and driver layouts against the database.
export default clerkMiddleware(async (auth, req) => {
  if (isRiderRoute(req)) await auth.protect()
  if (isDriverRoute(req) && !isDriverAuthRoute(req)) {
    await auth.protect({ unauthenticatedUrl: new URL('/driver/sign-in', req.url).toString() })
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

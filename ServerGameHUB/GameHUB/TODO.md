# GameHUB Work Journal

## **Current Objective:**
Consolidate .gitignore files into a single root .gitignore for the monorepo.
Prepare project for deployment: Dockerize Backend & Redis, and Frontend Vercel readiness.
Remove duplicate Logout button from the Profile page.
Implement Global Error State (error.tsx) to catch runtime exceptions gracefully.

## **Completed Tasks:**
- [FIXED] Implement secure Logout functionality (Backend Cookie clearing and Frontend State reset).
- [FIXED] Implement Next.js Suspense boundary and Skeleton loader for the Profile Games page.
- [FIXED] Converted Friends page tabs to purely client-side state, eliminating Next.js Server Component rendering latency.
- Added Skeleton Loaders to Friends page tabs for Optimistic UI.
- [FIXED] Execute Audit Phase 3: Implement BFF Aggregated DTOs for Profile and Global Context to eliminate frontend waterfalls.
- [FIXED] Changed GameTierDto.IgdbId to long? rather than string? because Game.IgdbId is long? - resolving the C# compiler type mismatch during mapping.
- [FIXED] Profile EF Core query explosion resolved via Fat Aggregate DTO, dropping redundant SWR tier requests.
- [FIXED] Handled Next.js 15 async `cookies()` properly to solve SSR 'User not found' auth bug.
- Migrated heavy Client Components (ProfileView, ScheduleModal, Matrix, Catalog, Nav, Lobby/Friend search) to SWR for aggressive caching, deduplication, and optimistic UI updates.
- [FIXED] Matrix friends array TypeError (`friendsRes.data.filter is not a function`)
- [FIXED] 5000ms Redis connection timeout bottleneck in C# backend
- Eliminated ProfileView Waterfall: Tier lists and profile API calls execute concurrently, and initial data is passed via props.
- Fixed ScheduleModal UI lag using React.memo on cell component, useCallback for interactive props, and controlled slider events limiting mass re-renders.
- Next.js SSR Initial Fetch for Friends Page implemented via cookie store token access and Server Component Data Fetching, avoiding Loading spinner.
- Completed Frontend Performance Audit (identified waterfalls, re-renders, missed SSR in Next.js).
- Backend Performance Audit applied: Fixed N+1 issues, optimized Select projections, added AsNoTracking, and sped up profile loading.
- Refine Profile UI: Scale down to 4 items and 2x2 grid for games.
- Refine Profile UI: Improve Wall of Fame empty state and scale down Game Cards.
- Redesign TierListPreview UI: switch to grid layout, limit rendering to 6 games, enlarge images, use rounded-md, and add inline tier labels and titles.
- [FIXED] Removed rogue rewrites in next.config.mjs that were trapping Next.js App Router dynamic pages (like /profile/[username], /login, /matrix).
- Implement dynamic Public Profile view, remove dummy data, and wire up actual Wall of Fame data using the UserAward model.
- Basic Matrix component structure and popovers implemented.
- Database architecture for Users, Games, Sessions, and Availability established.
- Front-end auth state and Discord Login integration.
- UI: Implement snapping (`step=1`, whole hours only) and strict min/max boundaries for the Dual-Thumb Range Slider.
- UI: Replace the blocking Matrix "Saving..." modal with a non-blocking bottom-right Toast positioning fixed.
- UI: Fixed Toast close button, Toast expiration state, and dead cell selection bugs.
- Backend: Fix EF Core Warning 10102 (Missing OrderBy before Take/Skip)
- Backend: Optimize Redis fallback performance (prevent 5-second blocking timeouts on cache SET)
- [FIXED] React Synthetic Event vs Native Document Event collision causing Popover to instantly close on click.
- [FIXED] Next.js PUT request to /schedule/my is failing with 400 Bad Request due to model binding mismatch with C# backend.
- [FIXED] Redis SET operation is still blocking for 5000ms
- [FIXED] Cell time text format is ugly (needs vertical stacking)
- [FIXED] Right-side settings icon STILL does not open the time slider popover
- [FIXED] React duplicate key error with UUIDs (e.g., d77a0e47...) is breaking component reconciliation
- [FIXED] Fix duplicate friend data causing sidebar render crashes (backend query or frontend state duplication)
- [FIXED] Fix logic hole: prevent sending friend requests to existing friends in the search UI.
- [FIXED] Redesign Friend Card UI, add View Profile/Remove actions, and implement Discord nickname routing.

## **Pending Critical Bugs:**
(None currently)

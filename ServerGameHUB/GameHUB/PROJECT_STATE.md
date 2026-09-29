# GameHUB Project State

## V1 Project Map (Roadmap)

| Feature / Module | Status (Done/Pending/Not Started) | Notes |
| :--- | :--- | :--- |
| **Authentication (Discord OAuth)** | Done | Implemented via Next.js callback and C# API. |
| **Database Schema (DisplayName)** | Pending | Need to add DisplayName to Postgres, update C# models & wipe DB. |
| **Backend Performance (Redis/BFF)** | Done | N+1 fixed, Fat Aggregate DTOs implemented, Redis optimized. |
| **Optimistic UI (Skeletons/SWR)** | Done | Skeletons replace blocking spinners; SWR manages mutations. |
| **Matrix Schedule** | Done | Green-zone algorithms, visual grid, hybrid sliders created. |
| **Friends System** | Done | Bi-directional invites, pending lists, profile linking. |
| **Deployment (Vercel + VPS)** | Pending | Dockerize Backend (C# + Redis), update Vercel configurations. |
| **Mobile UX** | Pending | Bottom sheets & adaptive touch inputs needed for complex views. |
| **Logout functionality** | Done | Backend cookie cleared, Frontend Zustand state reset, UserMenu dropdown added. |

---

## 5. Architectural Review (V1 Roadmap)

After our optimization phase, the following anti-patterns and areas for improvement still exist:

1. [FIXED] **Frontend Error Boundaries (`error.tsx`) Missing**: Added global `error.tsx` and `global-error.tsx` with customized UI and fallback reset capabilities to gracefully catch Next.js runtime exceptions.
2. [FIXED] **Hardcoded API URLs vs Environment Variables**: Several pages (e.g., `app/friends/page.tsx`, `app/profile/page.tsx`) had `http://localhost:5000/api` hardcoded. This is now strictly constrained by `NEXT_PUBLIC_API_URL` environment variables.
3. **Imperfect Mobile Responsiveness**: Extensive components like the Matrix Schedule and large Modals currently lack deep mobile/touch optimizations (e.g. touch/swipe actions, full-screen bottom-sheet modal adjustments).
4. **Data Purging (Hard Deleting)**: Soft deletes aren't mentioned for sensitive features (e.g., Lobbies, Friends). We might face referential integrity issues if entities are hard-deleted.


## 1. Roadmap & Current Status

**Phase 1: Foundation (MVP 1.0)**
- [x] Database design (Users, Games, Sessions, Participants)
- [x] EF Core setup and migrations (PostgreSQL/Supabase)
- [x] Discord OAuth2 authorization & JWT generation
- [x] Friends logic (send, accept, verify)
- [x] Extended user profile (DTO, Eager Loading for stats)
- [x] External IGDB API integration (Twitch credentials)
- [x] Shared game catalog (DB populating, covers, tags)

**Phase 2: Lobbies (MVP 1.5)**
- [x] Lobby creation mechanics & limits
- [x] Sending invites with "Friend" status validation
- [x] Accepting/declining invites (clearing tables)
- [x] Free time matrix ("Green zones" algorithm on C# backend)
- [x] Active Lobbies tracking & UI integration
- [ ] Caching "live" lobbies in Redis (postponed until UI integration)

**Phase 3: Matchmaking (v2.0)**
- [x] Advanced Tier-list for profiles (Custom preference levels & colors)
- [x] Backend Performance Audit applied: Fixed N+1 issues, optimized Select projections, added AsNoTracking, and sped up profile loading.
- [ ] "I'm feeling lucky" (Roulette) feature

- [x] Optimize Redis fallback performance (prevent 5-second blocking timeouts on cache SET)
- [x] Fix EF Core Warning 10102 (Missing OrderBy before Take/Skip)

**Phase 4: Social System (v2.5)**
- [x] Post-match screen (award distribution backend logic)
- [ ] "Reliability Score" calculation and statistics
- [ ] Global badges ("Soul of the Company") & Yearly Wrapped

**Discord Bot Integration**
- [ ] Presence Intent setup (game launch monitoring)
- [ ] Auto-start/end lobbies based on activity
- [ ] Interactive DM messages (accept/decline buttons)
- [ ] Slash-commands (/link, /stats, /roll_game)

---

## 2. Database Architecture

### Core: Users & Games
* **users**: `id` (UUID, PK), `discord_id` (String, Unique), `username` (String), `avatar_url` (String), `reliability_score` (Float), `created_at` (Timestamp).
* **games**: `id` (UUID, PK), `title` (String), `cover_url` (String), `min_players` (Int), `max_players` (Int), `discord_application_id` (String, Nullable).
* **user_game_tiers**: `user_id` (UUID, FK), `game_id` (UUID, FK), `tier` (String: MustPlay, MightPlay, NotToday, Meh, Curious, Reluctant, HardNo). Composite PK: user_id + game_id.
* **user_availability**: `id` (UUID, PK), `user_id` (UUID, FK), `day_of_week` (Int: 1-7), `start_time` (Time), `end_time` (Time).

### Coordination: Sessions (Lobbies)
* **sessions**: `id` (UUID, PK), `game_id` (UUID, FK), `host_id` (UUID, FK, Nullable), `name` (String, default: Game Title + Limit), `status` (Enum: GATHERING, READY, IN_PROGRESS, COMPLETED, CANCELLED), `scheduled_for` (Timestamp, Nullable), `started_at` (Timestamp, Nullable), `ended_at` (Timestamp, Nullable), `is_private` (Boolean), `player_limit` (Int, Nullable).
* **session_participants**: `session_id` (UUID, FK), `user_id` (UUID, FK), `status` (Enum: INVITED, ACCEPTED, DECLINED, JOINED, NO_SHOW), `joined_at` (Timestamp), `left_at` (Timestamp).

### Social: Awards & Statuses
* **award_templates**: `id` (UUID, PK), `name` (String), `icon_url` (String), `is_custom` (Boolean).
* **user_awards**: `id` (UUID, PK), `session_id` (UUID, FK), `receiver_id` (UUID, FK), `giver_id` (UUID, FK), `award_template_id` (UUID, FK), `custom_title` (String, Nullable), `note` (Text, Nullable), `created_at` (Timestamp).
* **user_global_badges**: `id` (UUID, PK), `user_id` (UUID, FK), `badge_name` (String), `awarded_at` (Timestamp), `year` (Int, Nullable).

---

## 3. Frontend State & Roadmap

**Current State (React/Next.js)**
- [x] Basic UI design (Glassmorphism, Tailwind UI mockups)
- [x] Base Axios API client configured (`lib/api.ts`) with Bearer token injection
- [x] Auth Store logic via Zustand (`useAuthStore`)
- [x] Discord Login Callback handling structure

**Needed Refactoring & Next Steps**
- [x] **Routing Refactor**: Migrate state-based local routing (`setPath` in `page.tsx`) to Next.js App Router paradigm (`/profile/[id]`, `/catalog`, `/lobby/[id]`).
- [x] **Component Modularization**: Split the massive monolithic `page.tsx` into modular components (Header, Footer, Feature Pages, UI blocks).
- [x] **Profile Page Integration**: Integrate `Profile` with the C# backend using `useAuthStore` and Axios data fetching, rendering `DetailedProfile` DTO.
- [x] **Public Profile Refactor**: Split Profile into a reusable `ProfileView`, add dynamic routing for `/profile/[username]`, conditionally hide private elements, and wire up Wall of Fame from C# UserAward model.
- [x] Advanced Tier List UI: "My Game Tier List" translated to dedicated routes (`/catalog` & `/profile/[username]/games`) with anti-spam safeguards. Implemented responsive tier-selection (desktop floating popover with sleek scrollbars, mobile bottom sheet via React Portal, perfect dark mode contrast).
- [x] **Data Fetching Migration (Fixes)**: Moved Tier List data fetching to Next.js Server Actions (`'use server'`) replacing erroneous Axios client calls, and implemented the matching C# `GET /api/user/{username}/games` backend endpoint to resolve 404 bugs.
- [x] **Lobby System Integration**: Connect creating/joining lobbies to WebSockets/SignalR or REST API.
- [x] Lobby Creation UI: Dynamic IGDB game search in lobby creation.
- [x] **Lobby Flow Overhaul**: Added `InviteToken` system, API endpoints to edit/end session, and redesigned the Lobby Cards for a much larger visual impact. Addressed edge cases with player limits on join links.
- [x] **Time Matrix UI integration**: Connect checkboxes and dynamic state to user availability endpoints. Added Hybrid Time Selection (Dual-thumb Slider) and Optimistic UI (Delayed Saving Toast).

## 4. Pending Critical Bugs
[FIXED] 6. React Synthetic Event vs Native Document Event collision causing Popover to instantly close on click.
[FIXED] 7. Next.js PUT request to /schedule/my is failing with 400 Bad Request due to model binding mismatch with C# backend.
[FIXED] 1. Redis SET operation is still blocking for 5000ms
[FIXED] 2. Cell time text format is ugly (needs vertical stacking)
[FIXED] 3. Right-side settings icon STILL does not open the time slider popover
[FIXED] 4. React duplicate key error with UUIDs (e.g., d77a0e47...) is breaking component reconciliation
[FIXED] 5. Fix duplicate friend data causing sidebar render crashes (backend query or frontend state duplication)
[FIXED] 8. Fix logic hole: prevent sending friend requests to existing friends in the search UI.
[FIXED] 9. Redesign Friend Card UI, add View Profile/Remove actions, and implement Discord nickname routing.

## 6. Current Objective
Implement Global Error State (error.tsx) to catch runtime exceptions gracefully.
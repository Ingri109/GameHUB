# 🎮 GameHUB

GameHUB is a modern, full-stack web application designed to help gamers effortlessly coordinate play sessions, manage their game collections, and connect with friends. By leveraging a unified Discord identity, GameHUB removes the friction of scheduling and helps you find the perfect time and game for your squad.

## 🚀 Tech Stack

**Frontend:**
- Framework: Next.js (App Router, Server Actions)
- Styling: Tailwind CSS & Framer Motion (Glassmorphism UI)
- State Management: Zustand (Global) & SWR (Data Fetching / Caching)
- Hosting: Vercel

**Backend:**
- Framework: C# / .NET 8 (ASP.NET Core Web API)
- Database: PostgreSQL (hosted on Supabase)
- ORM: Entity Framework Core
- Caching: Redis (Dockerized)
- Architecture: BFF (Backend-for-Frontend) with optimized N+1 queries.

---

## ✨ Key Features (V1 Release)

### 🔐 Seamless Authentication
- **Discord OAuth2:** Instant login using Discord credentials. Automatically syncs `username`, `avatar`, and `DisplayName` for a smooth onboarding experience.
- **Secure Sessions:** JWT-based authentication with HttpOnly cookies and secure frontend state flushing on logout.

### 👥 Social System & Profiles
- **Dynamic Profiles:** Shareable user profiles (`/profile/[username]`) with visibility toggles.
- **Friend Network:** Robust bi-directional friend system (send, accept, decline, verify).
- **Wall of Fame:** Display earned awards, custom titles, and global badges directly on your profile.

### 🕹️ Game Catalog & Tier Lists
- **IGDB Integration:** Search and add games directly from the IGDB API.
- **Personalized Tier Lists:** Categorize games dynamically (e.g., *Must Play*, *Might Play*, *Not Today*, *Hard No*) using a responsive, anti-spam UI with mobile bottom-sheet support.

### 📅 Smart Matchmaking & Matrix Schedule
- **Free Time Matrix:** A visual weekly schedule planner featuring "Green-zone" algorithms.
- **Hybrid Time Selection:** Easily declare availability using a dual-thumb slider.
- **Lobby System:** Create private/public game sessions, manage player limits, and invite friends via secure tokens.

---

## 🏗️ Architecture Highlights

- **Optimistic UI:** Next.js Suspense boundaries and Skeleton loaders replace blocking spinners, providing an instant-feel routing experience.
- **High Performance:** Backend queries are highly optimized utilizing EF Core `AsNoTracking` and `.Select()` projections, eliminating N+1 problems. Data is cached aggressively in Redis.
- **Mobile-First UX:** Adaptive UI featuring responsive Bottom Navigation bars, touch-friendly sliders, and native App-like structural layouts.
- **Production Ready:** Environment-variable driven configuration, global error boundaries (`error.tsx`), and fully dockerized backend setup (API + Redis).

---

## 🗺️ Roadmap (V2 & Beyond)

While V1 provides a rock-solid foundation, the journey continues. Upcoming features include:
- **Discord Bot Integration:** Presence monitoring to auto-start/end lobbies based on actual game activity, interactive DM invites, and slash commands (`/roll_game`).
- **Advanced Matchmaking:** "I'm feeling lucky" roulette feature for indecisive groups.
- **Player Stats:** "Reliability Score" tracking (based on lobby attendance) and yearly Wrapped statistics.

---
*Created for friends. Built with passion.*

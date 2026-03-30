# Odigo Messenger

> The social layer the internet never had.

Odigo is a browser extension that layers a real-time social network on top of the entire internet. Every site you visit, Odigo shows you the other people visiting that exact same page right now — and automatically opens a live public forum where you can all chat and meet.

Built solo by a 15-year-old founder.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Project](#running-the-project)
- [Packages](#packages)
  - [packages/ui](#packagesui)
  - [packages/shared](#packagesshared)
- [Apps](#apps)
  - [apps/client](#appsclient)
  - [apps/extension](#appsextension)
- [Server](#server)
- [How It Works](#how-it-works)
- [Extension Architecture](#extension-architecture)
- [Database Schema](#database-schema)
- [Contributing](#contributing)

---

## Overview

Odigo solves a fundamental problem with the internet: billions of people visit the same pages, watch the same videos, and read the same articles — with no way to know who else is there right now. Existing platforms like Reddit, Discord, and Facebook Groups all require deliberate effort to find and join. Odigo removes all friction.

Install the extension. Browse normally. When 2 or more people land on the same page at the same time, Odigo automatically opens a live chat room in a side panel — no setup, no searching, no accounts required to start.

---

## Architecture

```
Browser Extension (WXT)
        │
        │  WebSocket (Socket.io)
        ▼
Express + Socket.io Server
        │
        │  Prisma ORM
        ▼
   Supabase (PostgreSQL)
        │
        └── Supabase Auth (JWT)

Next.js Client (web app)
        │
        └── Supabase Auth + REST API
```

The browser extension is the primary client. The Next.js web app provides the web-based interface (profile, friends, message history). Both connect to the same Express/Socket.io server. Supabase handles authentication and the database. Prisma is the ORM layer over Supabase's PostgreSQL instance.

---

## Monorepo Structure

```
odigo-messenger/
├── apps/
│   ├── client/                  # Next.js web application
│   └── extension/               # WXT browser extension
├── packages/
│   ├── ui/                      # Shared shadcn/ui component library (Tailwind v4)
│   ├── shared/                  # Shared types, socket logic, Zod schemas, handlers
│   ├── eslint-config/           # Shared ESLint configuration
│   └── typescript-config/       # Shared TypeScript configuration
├── server/                      # Express + Socket.io backend server
├── turbo.json                   # Turborepo pipeline configuration
├── package.json                 # Root package.json (workspaces)
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo |
| Web client | Next.js (App Router) |
| Browser extension | WXT + React |
| Server | Express.js + Socket.io |
| Database | Supabase (PostgreSQL) |
| ORM | Prisma |
| Auth | Supabase Auth (JWT) |
| UI components | shadcn/ui |
| Styling | Tailwind CSS v4 |
| Validation | Zod |
| Language | TypeScript throughout |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- A Supabase project (free tier works)
- Google Chrome (for extension development)

### Installation

Clone the repository and install all dependencies from the root:

```bash
git clone https://github.com/your-username/odigo-messenger.git
cd odigo-messenger
npm install
```

Turborepo will handle the workspace dependency graph automatically.

### Environment Variables

You need three `.env` files:

**`server/.env`**
```env
DATABASE_URL=postgresql://...          # Supabase pooled connection string
DIRECT_URL=postgresql://...            # Supabase direct connection string
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EXPRESS_PORT=8080
```

**`apps/client/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
NEXT_PUBLIC_EXPRESS_SERVER_HOST=http://localhost:8080
```

**`apps/extension/.env`**
```env
WXT_EXPRESS_SERVER_HOST=http://localhost:8080
```

### Running the Project

**Run everything (client + extension) via Turborepo:**
```bash
npm run dev
```

> Note: The client runs on port 3000 and the extension dev server on port 3001.

**Run the server separately:**
```bash
cd server
npm run dev
```

**Run only the extension:**
```bash
cd apps/extension
npm run dev
```

**Build the extension for production:**
```bash
cd apps/extension
npm run build
```

Then load the `.output/chrome-mv3` folder as an unpacked extension in Chrome (`chrome://extensions` → Developer mode → Load unpacked).

---

## Packages

### packages/ui

Shared React component library built on top of [shadcn/ui](https://ui.shadcn.com/) with Tailwind CSS v4.

- Components live at `src/components/`
- Global styles (Discord-inspired dark color palette) at `src/styles/globals.css`
- Exports are defined explicitly in `package.json` — no barrel file

**Color palette (Discord-inspired dark theme):**

| Token | Value | Usage |
|---|---|---|
| `--background` | `#313338` | Page background |
| `--card` | `#2b2d31` | Card/panel backgrounds |
| `--muted` | `#383a40` | Secondary backgrounds |
| `--input` | `#404249` | Input fields |
| `--primary` | `#5865f2` | Blurple — buttons, accents |
| `--foreground` | `#dbdee1` | Primary text |
| `--muted-foreground` | `#b5bac1` | Secondary text |
| `--border` | `#606269` | Borders |

### packages/shared

Shared logic used by both the server and extension/client. Uses `"type": "module"`.

**Exports:**
- `./lib/socket` — Socket.io client factory, `connectUser()`, `getSocket()`, `hosts.ts` (`setHost`/`getHost`)
- `./lib/handlers/auth` — Auth-related socket handlers
- `./lib/handlers/rooms` — Room join/leave handlers
- `./lib/zodSchemas` — Zod validation schemas shared across the stack

**Important pattern:** `setHost()` must be called before `connectUser()`. `getHost()` is called inside `connectUser()` (not at module level) to avoid stale host capture.

---

## Apps

### apps/client

Next.js web application (App Router). Provides:
- User authentication (Supabase Auth)
- Profile management
- Friend requests and messaging
- Message history

Uses `packages/ui` for all UI components and `packages/shared` for socket logic and types.

### apps/extension

WXT-based Chrome browser extension. This is the core of Odigo.

**Entry points:**

| File | Role |
|---|---|
| `entrypoints/background.ts` | Service worker: socket connection, URL handling, message passing, side panel control |
| `entrypoints/content.ts` | URL detection on every page, sends `active_link` messages to background |
| `entrypoints/sidepanel/` | React side panel UI (chat view, auth view) |

**Key files:**

| File | Role |
|---|---|
| `lib/session.ts` | WXT storage-based session management (`saveSession`, `getSession`, `clearSession`, `restoreSession`) |
| `lib/supabase.ts` | Supabase client for the extension context |
| `lib/SessionContext.tsx` | React context for auth state in the side panel |
| `views/AuthView.tsx` | Login/signup UI |
| `views/ChatView.tsx` | Live chat room UI |

**`wxt.config.ts`** uses `@tailwindcss/vite` plugin for Tailwind v4 support (no `postcss.config.js` needed):

```ts
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    permissions: ['tabs', 'storage', 'sidePanel'],
    host_permissions: ['https://*/*'],
  }
});
```

> **Why WXT and not Plasmo?** Plasmo has an open bug (#1188) that prevents Tailwind v4 from working due to a `jiti`/`node:module` incompatibility. WXT uses Vite natively and supports Tailwind v4 without workarounds.

---

## Server

Express + Socket.io server in `server/src/`.

**Key socket events:**

| Event | Direction | Description |
|---|---|---|
| `active_link` | Client → Server | Client sends current page URL; server joins them to the matching room |
| `room_accepted` | Server → Client | Room was found/created; includes room ID and message history |
| `room_error` | Server → Client | Could not join (e.g. only 1 person on page) |
| `send_message` | Client → Server | User sends a chat message |
| `receive_message` | Server → Client | Broadcast message to room members |
| `disconnect` | — | Cleanup: remove socket from active link tracking |

**Room logic (`active_link` handler):**
1. Normalizes URL to hostname (`new URL(url).hostname`)
2. Checks how many sockets are on the same URL
3. If 2+, creates a room (or reuses existing), joins all valid sockets, emits `room_accepted` to each
4. On disconnect, removes socket from the active links map

**CORS** is configured to allow all origins (required for extension):
```ts
cors: { origin: (origin, callback) => callback(null, true), credentials: true }
```

---

## How It Works

1. User installs the extension from the Chrome Web Store
2. User signs up / logs in (Supabase Auth)
3. As the user browses, `content.ts` detects the current URL and sends it to `background.ts`
4. `background.ts` emits `active_link` to the server via Socket.io
5. The server checks if anyone else is on the same URL right now
6. If 2+ people are on the same page, the server creates a room and emits `room_accepted` to all of them
7. `background.ts` receives `room_accepted`, stores the room ID and message history in WXT storage, and opens the side panel
8. The side panel React app reads from storage and renders the live chat room
9. Messages are broadcast in real time via Socket.io to all room members

**Cold-start strategy:** Initial growth will target communities where users are naturally concentrated on the same pages — Reddit threads, university course portals, gaming wikis, and live event pages. These are the highest-density environments for the product to activate immediately.

---

## Database Schema

Managed via Prisma with Supabase PostgreSQL. Key models:

```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  username  String?
  createdAt DateTime  @default(now())
  messages  Message[]
  rooms     RoomMember[]
}

model Room {
  id        String    @id @default(uuid())
  url       String
  createdAt DateTime  @default(now())
  messages  Message[]
  members   RoomMember[]
}

model Message {
  id        String   @id @default(uuid())
  content   String
  createdAt DateTime @default(now())
  userId    String
  roomId    String
  user      User     @relation(fields: [userId], references: [id])
  room      Room     @relation(fields: [roomId], references: [id])
}

model RoomMember {
  userId    String
  roomId    String
  user      User   @relation(fields: [userId], references: [id])
  room      Room   @relation(fields: [roomId], references: [id])
  @@id([userId, roomId])
}
```

---

## Contributing

This is a solo project currently in active development. If you'd like to contribute, reach out first:

- **Email:** eyalzwig@gmail.com
- **LinkedIn:** [linkedin.com/in/eyal-zwigenbom-837aa7365](https://linkedin.com/in/eyal-zwigenbom-837aa7365)

---

*Odigo — bringing back the idea that proved itself once, with modern infrastructure.*

All credit belongs to my __LORD__ and saviour, __Jesus Christ__. \
Made with :hearts: and people in mind.

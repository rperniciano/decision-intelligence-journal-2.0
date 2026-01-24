# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Decision Intelligence Journal - a voice-first application for tracking and analyzing personal decisions. Users speak decisions naturally, AI extracts structured data (options, pros/cons, emotional state), and patterns are revealed through intelligent analysis.

## Development Commands

```bash
# Install dependencies
pnpm install

# Start all services (frontend + backend)
pnpm dev

# Start individual services
pnpm --filter @decisions/web dev    # Frontend at http://localhost:5173
pnpm --filter @decisions/api dev    # Backend at http://localhost:3001

# Build
pnpm build                          # Build all packages
pnpm --filter @decisions/shared build   # Build shared package first (required before other builds)

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## Architecture

### Monorepo Structure (Turborepo + pnpm)

```
apps/
  web/          # React 18 + Vite frontend
  api/          # Fastify backend (Node.js)
packages/
  shared/       # Shared types, schemas, constants (Zod validation)
```

### Key Patterns

**Shared Package Dependency**: Both `apps/web` and `apps/api` depend on `@decisions/shared`. Build shared first when types change:
```bash
pnpm --filter @decisions/shared build
```

**API Route Structure**: All protected routes are under `/api/v1/` prefix with JWT auth middleware. The server is in `apps/api/src/server.ts` with routes registered inline. Services are in `apps/api/src/services/`.

**Authentication Flow**:
- Frontend uses Supabase Auth client (`apps/web/src/contexts/AuthContext.tsx`)
- Login goes through rate-limited endpoint `/api/v1/login`
- Backend validates JWT via `apps/api/src/middleware/auth.ts`
- Both use same Supabase project (RLS enabled on all tables)

**Frontend Context Providers** (in `apps/web/src/App.tsx`):
```
ThemeProvider > ToastProvider > AuthProvider > BrowserRouter
```

**Lazy Loading**: Heavy pages use React.lazy with Suspense fallback

### Database

Supabase PostgreSQL with Row Level Security. Key tables:
- `decisions` - Core decision records with status lifecycle
- `options` - Decision options (linked to decisions)
- `pros_cons` - Pros/cons for options
- `categories` - User and system categories
- `outcomes` - Multiple outcome check-ins per decision
- `DecisionsFollowUpReminders` - Reminder scheduling

Decision status lifecycle: `draft` → `deliberating` → `decided` → `reviewed` (or `abandoned`)

Migrations are in `apps/api/migrations/` (run manually via Supabase SQL editor)

### External Services

- **AssemblyAI**: Voice transcription (`apps/api/src/services/voiceService.ts`)
- **OpenAI GPT-4**: Structured extraction from transcripts (`apps/api/src/services/asyncVoiceService.ts`)
- **Supabase Storage**: Audio file storage

## Environment Setup

Copy `.env.example` to `.env` and configure:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (frontend needs VITE_ prefix)
- `ASSEMBLYAI_API_KEY`
- `OPENAI_API_KEY`

## Design System

Atmospheric dark UI with glassmorphism. Key values in `apps/web/tailwind.config.js`:
- Background: `#0a0a0f` (bg-deep) to `#1a1a2e` (bg-gradient)
- Accent: `#00d4aa` (teal)
- Text: `#f0f0f5` (primary), `#9ca3af` (secondary)
- Animations: Framer Motion with spring physics (`mass: 1, damping: 15`)
- Use `.glass` and `.glass-hover` classes for glassmorphism cards
- Grain overlay via `.grain-overlay` class

## Type System

Core types exported from `@decisions/shared`:
- `Decision`, `DecisionOption`, `ProCon` - Core entities
- `DecisionStatus`: `'draft' | 'deliberating' | 'decided' | 'abandoned' | 'reviewed'`
- `EmotionalState`: `'calm' | 'confident' | 'anxious' | 'excited' | 'uncertain' | 'stressed' | 'neutral' | 'hopeful' | 'frustrated'`
- `ProcessingStatus`: Voice pipeline states
- Zod schemas for validation in `packages/shared/src/schemas/`

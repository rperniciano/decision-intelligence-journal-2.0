# Decisions - A Decision Intelligence Journal

A voice-first application that transforms how people make and track decisions. Speak your decisions naturally, let AI extract structured insights, track outcomes over time, and discover your personal decision-making patterns.

## Features

### Voice-First Experience
- **Natural Voice Recording** - Speak your decisions as you would to a friend
- **AI-Powered Extraction** - GPT-4 extracts structured data (options, pros/cons, emotional state)
- **Real-time Transcription** - AssemblyAI converts speech to text with high accuracy

### Decision Lifecycle
- **Draft** - AI extraction complete, ready for review
- **Deliberating** - Actively thinking, with optional "decide by" dates
- **Decided** - Choice made with confidence level recorded
- **Abandoned** - Decided not to decide, with reason tracking
- **Reviewed** - Outcome recorded, contributing to pattern analysis

### Smart Outcome Tracking
- **Automatic Reminders** - AI-adjusted timing based on decision type
- **Quick Outcomes** - One-tap recording: Better / As Expected / Worse
- **Voice Reflections** - Record learnings with AI insight extraction
- **Multiple Check-ins** - Track how decisions evolve over time

### Pattern Analysis & Insights
- **Timing Patterns** - Discover your best/worst hours for decisions
- **Emotional Correlations** - See how emotions affect outcomes
- **Category Performance** - Track success rates by decision type
- **Decision Score** - Gamified metric (0-100) based on outcomes and process

### Premium UI/UX
- **Cinematic Dark Interface** - Atmospheric design with grain overlay
- **Glassmorphism Cards** - Beautiful backdrop blur with luminous borders
- **Spring Physics Animations** - Framer Motion with mass: 1, damping: 15
- **Staggered Reveals** - Elegant AI extraction presentation

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for lightning-fast development
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Recharts** for data visualization

### Backend
- **Node.js** with Fastify
- **TypeScript** throughout
- **Supabase PostgreSQL** with Row Level Security
- **Supabase Auth** (Google OAuth + Email/Password)
- **Supabase Storage** for audio files

### AI Services
- **AssemblyAI** - Speech-to-text transcription
- **OpenAI GPT-4** - Structured decision extraction

### Monorepo Structure
```
├── apps/
│   ├── web/         # React frontend (Vite)
│   └── api/         # Fastify backend
├── packages/
│   └── shared/      # Shared types and validation
├── turbo.json       # Turborepo configuration
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (will be installed if missing)
- Supabase account
- AssemblyAI API key
- OpenAI API key

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd decision-intelligence-journal-2.0
   ```

2. **Run the setup script**
   ```bash
   chmod +x init.sh
   ./init.sh
   ```

   This will:
   - Check requirements
   - Create `.env` template if missing
   - Install dependencies
   - Build shared packages
   - Start development servers

3. **Configure environment variables**

   Edit `.env` with your actual API keys:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ASSEMBLYAI_API_KEY=your_assemblyai_key
   OPENAI_API_KEY=your_openai_key
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Manual Setup

```bash
# Install pnpm if needed
npm install -g pnpm

# Install dependencies
pnpm install

# Build shared packages
pnpm --filter @decisions/shared build

# Start development
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all development servers |
| `pnpm build` | Build all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run tests |
| `pnpm --filter web dev` | Start frontend only |
| `pnpm --filter api dev` | Start backend only |

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ASSEMBLYAI_API_KEY` | AssemblyAI API key for transcription |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 extraction |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `API_PORT` | 3001 | Backend server port |
| `VITE_API_URL` | http://localhost:3001/api/v1 | API URL for frontend |
| `NODE_ENV` | development | Environment mode |

## Database Schema

The application uses Supabase PostgreSQL with the following main tables:

- **profiles** - User profiles and settings
- **decisions** - Core decision records
- **options** - Options for each decision
- **pros_cons** - Pros and cons for each option
- **categories** - User-defined and system categories
- **outcomes** - Recorded outcomes and reflections
- **outcome_reminders** - Scheduled review reminders
- **processing_jobs** - Voice processing pipeline status

All tables have Row Level Security (RLS) enabled for data isolation between users.

## API Endpoints

### Decisions
- `GET /api/v1/decisions` - List decisions with filters
- `POST /api/v1/decisions` - Create decision
- `PATCH /api/v1/decisions/:id` - Update decision
- `DELETE /api/v1/decisions/:id` - Soft delete decision
- `POST /api/v1/decisions/:id/decide` - Mark as decided
- `POST /api/v1/decisions/:id/abandon` - Mark as abandoned

### Voice Processing
- `POST /api/v1/recordings/upload` - Upload audio
- `POST /api/v1/recordings/:id/process` - Start processing
- `GET /api/v1/recordings/:id/status` - Get processing status

### Insights
- `GET /api/v1/insights` - Full insights object
- `GET /api/v1/insights/score` - Decision score
- `GET /api/v1/insights/patterns/:type` - Specific pattern analysis

### Export
- `POST /api/v1/export/json` - Export as JSON
- `POST /api/v1/export/csv` - Export as CSV
- `POST /api/v1/export/pdf` - Generate PDF report

## Design System

### Colors
```css
--bg-deep: #0a0a0f
--bg-gradient: #1a1a2e
--accent-teal: #00d4aa
--text-primary: #f0f0f5
--text-secondary: #9ca3af
--success: #10b981
--warning: #f59e0b
--error: #ef4444
```

### Motion
- Spring physics: `mass: 1, damping: 15`
- Stagger delay: `0.1s`
- Easing: `cubic-bezier(0.25, 1, 0.5, 1)`
- Grain overlay: `opacity 0.03-0.05`

## Contributing

This project is built using an autonomous AI coding process. Features are tracked in the SQLite database and implemented in priority order.

## License

MIT License - See LICENSE file for details.

---

Built with voice, enhanced by AI, designed for clarity.

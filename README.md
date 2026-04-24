# Blu Sky Pipeline

A sales CRM pipeline built for Blu Sky Films. Kanban-style deal tracking with notes, next steps, reminders, deal types, and a Today View.

## Stack
- React 18 + Vite
- Supabase (auth + database)
- GitHub Pages (hosting)

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

## Setup
See `CLAUDE.md` for the full setup guide including Supabase schema, GitHub Pages deployment, and auth configuration.

## Deploy
```bash
npm run deploy
```

## Reference
`pipeline.html` in the project root is the complete working UI — use it as the source of truth for the pipeline component.

# Blu Sky Pipeline — Claude Code Handoff

## What This Is
A sales CRM pipeline app built for Blu Sky Films (Mill Valley, CA). It is a Kanban-style deal tracker with a Today View, notes, next steps with reminders, and deal type tagging.

The UI is fully designed and working. Your job is to:
1. Wire it up to Supabase (auth + database)
2. Add Login, Signup, and Account pages
3. Set it up for GitHub Pages deployment

Do NOT redesign or restyle anything. The design is intentional and final.

---

## Tech Stack
- **React 18** + **Vite**
- **React Router v6** for navigation
- **Supabase** for auth and database (replaces localStorage)
- **GitHub Pages** for hosting

---

## Step 1 — Install Dependencies

```bash
npm install
npm install @supabase/supabase-js react-router-dom
```

---

## Step 2 — Supabase Project Setup

1. Go to https://supabase.com and create a new project called `blu-sky-pipeline`
2. Once created, go to **Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL` in `.env.local`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY` in `.env.local`

Create `.env.local` in the project root:
```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Go to **SQL Editor** in Supabase and run the contents of `supabase/schema.sql`

4. Go to **Authentication → Settings** and:
   - Enable **Email** provider
   - Set Site URL to your GitHub Pages URL: `https://yourusername.github.io/blu-sky-pipeline`
   - Add the same URL to **Redirect URLs**

---

## Step 3 — GitHub Pages Setup

1. In `vite.config.js`, set `base` to your repo name:
   ```js
   base: '/blu-sky-pipeline/'
   ```

2. Install gh-pages:
   ```bash
   npm install --save-dev gh-pages
   ```

3. Add to `package.json` scripts:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```

4. Push everything to GitHub, then run:
   ```bash
   npm run deploy
   ```

5. In GitHub repo → Settings → Pages → set source to `gh-pages` branch

---

## Step 4 — What To Build

### Auth Flow
- `/login` — Login page (email + password)
- `/signup` — Signup page (name, email, password)
- `/account` — Account page (edit name, email, change password)
- `/` — Protected pipeline (redirect to `/login` if not authenticated)

Use `src/hooks/useAuth.js` for auth state. Wrap protected routes so unauthenticated users are redirected to `/login`.

### Supabase Auth
Use `supabase.auth.signInWithPassword()`, `signUp()`, `signOut()`, `getSession()`, and `onAuthStateChange()`. Store user display name in `profiles` table (see schema).

### Data Migration
Replace all `localStorage` calls with Supabase queries. See `src/lib/supabase.js` for the client and `src/hooks/useDeals.js` for the data layer scaffold.

Each user's data is isolated by `user_id` (Row Level Security is already set up in the schema).

### Data Shape
A deal object looks like this:
```js
{
  id: "abc123",           // uuid
  user_id: "uuid",        // from supabase auth
  stage: 0,               // 0-4 index into stages array
  name: "Justin Kuzmanich",
  business: "Blu Sky Films",
  phone: "(415) 555-0000",
  email: "justin@bluskyfims.com",
  value: 6500,
  deal_type: "video",     // key from DEAL_TYPES
  notes: [],              // stored as JSONB array
  next_step: null,        // stored as JSONB object
  created_at: "iso string"
}
```

User pipeline config (stage names) lives in the `pipeline_config` table as JSONB.

---

## Step 5 — Pages To Build

### Login (`src/pages/Login.jsx`)
- Email + password fields
- "Sign in" button (orange: `#C96A1F`)
- Link to Signup
- On success: redirect to `/`
- Match the app's design system (cream background, Libre Baskerville headings, DM Sans body)

### Signup (`src/pages/Signup.jsx`)
- Name, email, password fields
- "Create account" button
- Link to Login
- On success: creates profile row, redirects to `/`

### Account (`src/pages/Account.jsx`)
- Display name (editable)
- Email (editable)
- Change password section
- "Save changes" button
- "Sign out" button
- Link back to pipeline
- Same design system

---

## Design System — DO NOT CHANGE

### CSS Variables (already in `src/index.css`)
```css
--cream:       #F7F4EF;
--cream-dark:  #E5DFD5;
--cream-mid:   #CEC7BA;
--border:      #B8B0A2;
--border-light:#CBBFB2;
--text-1:      #1C1917;
--text-2:      #57534E;
--text-3:      #A8A29E;
--text-4:      #C7C3BC;
--white:       #FFFFFF;
```

### Fonts
- **Libre Baskerville** — headings, page titles
- **DM Sans** — body copy, labels, buttons
- **DM Mono** — money values, timestamps

### Action color: `#C96A1F` (orange) — used for primary buttons

### Stage colors
```js
["#3B7DD8","#7C5DC7","#C97B2E","#C0392B","#2D8A5E"]
```

---

## Project File Map

```
src/
├── main.jsx              — React entry point with Router
├── App.jsx               — Route definitions + auth guard
├── index.css             — All CSS variables + global styles
├── lib/
│   └── supabase.js       — Supabase client (createClient)
├── constants/
│   ├── dealTypes.js      — DEAL_TYPES array
│   ├── stepTypes.js      — STEP_TYPES array
│   └── stageColors.js    — STAGE_COLORS + STAGE_BG arrays
├── utils/
│   ├── format.js         — fmt$(), fmtDate(), noteFmt()
│   └── dates.js          — isOverdue(), isDueToday()
├── hooks/
│   ├── useAuth.js        — auth state + helpers
│   └── useDeals.js       — CRUD for deals + pipeline config
├── pages/
│   ├── PipelinePage.jsx  — Main pipeline (board + today view)
│   ├── Login.jsx         — Login page
│   ├── Signup.jsx        — Signup page
│   └── Account.jsx       — Account settings page
└── components/
    ├── pipeline/
    │   ├── Board.jsx         — Kanban board with drag-and-drop
    │   ├── StageColumn.jsx   — Individual stage column
    │   ├── DealCard.jsx      — Deal card with drag handlers
    │   ├── DealPanel.jsx     — Right side panel (notes/nextstep/contact tabs)
    │   ├── SummaryBar.jsx    — Header totals + stage progress bar
    │   ├── AddLeadModal.jsx  — New lead modal
    │   └── TodayView.jsx     — Today/overdue view
    ├── auth/
    │   └── ProtectedRoute.jsx — Redirects to /login if no session
    └── ui/
        ├── Label.jsx         — Uppercase field label
        └── FieldInput.jsx    — Styled input component
```

---

## Important Notes

- All pipeline data must be scoped to the logged-in `user_id`
- Stage names are user-configurable and stored in `pipeline_config` table
- Notes and next_step are stored as JSONB columns on the deals table
- The `profiles` table stores display name — create a row on signup
- Row Level Security (RLS) is enabled — users can only see their own data
- The app currently uses `localStorage` with key `blu-pipeline-v3` — this can be removed once Supabase is wired up
- Keep the `uid()` helper for generating temporary IDs client-side before insert

---

## Do This In Order

1. `npm install` + set up `.env.local`
2. Run `supabase/schema.sql` in Supabase SQL editor
3. Build `src/lib/supabase.js` and `src/hooks/useAuth.js`
4. Build `ProtectedRoute` + routing in `App.jsx`
5. Build Login and Signup pages
6. Build Account page
7. Wire `useDeals.js` to Supabase (replace localStorage)
8. Test full auth + data flow
9. Deploy to GitHub Pages

# dental.ai

Cloud-backed dental workspace built around:
- `src/`: Vite React product shell
- `backend/`: FastAPI service layer
- `supabase/`: hosted Supabase migrations

## What is included
- Standardized dashboard, patient directory, drugs, discover, audit, referral, treatment-plan, and imaging flows
- Supabase-ready schema for cases, notes, chat history, saved AI outputs, audit events, and catalogs
- Graceful demo fallbacks when Gemini or specific Supabase tables are unavailable
- Persistent local workspace memory for chat, saved referrals, saved treatment plans, and x-ray reports

## Environment setup
Create `.env` in the project root from `.env.example`.

Required frontend values:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`

Required backend values:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Apply Supabase migrations
From this project folder:

```bash
supabase db push
```

This applies:
- `00001_initial_schema.sql`
- `00002_product_surface.sql`

The second migration seeds:
- patient cases
- drug catalog
- knowledge-base articles
- audit events
- sample AI conversations

## Run the product
Install frontend dependencies:

```bash
npm install
```

Start the Vite app:

```bash
npm run dev
```

Start the FastAPI backend in a second terminal:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## How to use it
1. Open the Vite app URL shown in the terminal.
2. Sign in with Supabase auth, or use the built-in demo fallback if Supabase env vars are not set.
3. Visit:
   - `/dashboard` for clinic overview
   - `/patients` for case tracking
   - `/chat` for persistent AI chat threads
   - `/tools/xray` for imaging reports
   - `/tools/referral` for referral drafts
   - `/tools/treatment-plan` for phased plans
   - `/tools/audit` for medico-legal logs

## Notes
- `npm run build` and `npm run lint` both pass for the Vite app.
- Some AI actions use Gemini when configured, otherwise they fall back to deterministic demo-safe outputs.
- Chat history and generated drafts are also persisted in local storage so the app remains usable even before every Supabase write path is wired.

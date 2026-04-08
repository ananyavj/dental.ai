# dental.ai lite

Fast-loading Vite + React rebuild of dental.ai with Supabase auth/data and direct Gemini calls.

## Stack
- Vite + React 18 + TypeScript
- Tailwind CSS v3
- Lightweight shadcn-style UI primitives
- Supabase for auth, database, and persistence
- Gemini 1.5 Flash for chat, triage, drugs, x-ray, referral, and treatment-plan helpers
- TipTap only for the case-study editor

## Product areas
- `Dashboard`: clinic metrics, recent cases, activity, and saved conversations
- `Chatbot`: Practitioner, Student, and Patient modes with persisted conversation history
- `Patient Directory`: search cases and run AI triage
- `Discover`: PubMed-powered latest research plus community case studies
- `Tools`: x-ray, drug reference, referral builder, treatment planner, audit trail
- `Exam Mode`: lightweight student revision flow
- `Dental TV`: quick learning cards

## Important folders
- `src/App.tsx`: router and lazy-loading setup
- `src/components/`: shell, common, and UI primitives
- `src/contexts/auth-context.tsx`: Supabase auth bootstrap and role/profile state
- `src/lib/`: Supabase client, Gemini helpers, PubMed client, mock data, shared data access
- `src/pages/`: route-level screens
- `supabase/migrations/`: schema + policy changes

## Env setup
Copy `.env.example` to `.env` and fill in:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here

SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

Only the `VITE_...` values are needed to run the frontend. The extra Supabase service vars are kept for migration/admin workflows.

## Database setup
Push migrations from the project root:

```bash
supabase db push
```

This includes:
- `00001_initial_schema.sql`
- `00002_product_surface.sql`
- `00003_fix_auth_trigger.sql`
- `00004_fix_profiles_role_constraint.sql`
- `00005_case_study_publish_policy.sql`

## Demo logins
- `doc@mail.com` / `doc12345`
- `stu@mail.com` / `stu12345`
- `pat@mail.com` / `pat12345`
- `admin@mail.com` / `sudouser123`

## Run locally
From the project root:

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`.

## Verification
- `npm run build`
- `npm run lint`

Both pass on the lightweight Vite rebuild.
# dental-ai

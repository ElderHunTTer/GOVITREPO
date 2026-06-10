# GOVITREPO

Vercel-first showcase product for TTB label reporting, reviewer intake, and explainable label verification.

## What This App Does

- public users can report a label without creating an account
- the app stores the uploaded image in Supabase Storage
- Gemini analyzes the image to decide whether it appears to be a TTB alcohol label
- the app extracts candidate fields and routes uncertain or valid cases into a reviewer queue
- reviewers and admins can sign in, inspect evidence, search on the TTB COLA Registry, and resolve cases
- seeded demo labels make the product easy to showcase without relying only on live uploads

## Stack

- `Next.js 15`
- `React 19`
- `TypeScript`
- `Supabase` for Postgres, Auth, and Storage
- `Gemini` for hosted image analysis
- `Vercel` for hosting and preview deployments

## Repository Shape

```text
apps/
  web/                    # Next.js product app
packages/
  core/                   # deterministic comparison and verification helpers
  types/                  # shared product and domain types
docs/
  ARCHITECTURE.md
  PRODUCT_CONTEXT.md
  SUPABASE_SETUP.md
supabase/
  migrations/             # schema and auth/storage setup
scripts/
  seed-demo-labels.mjs    # uploads and seeds showcase demo labels
```

## Requirements

- `Node.js 20+`
- `npm 10+`
- a Supabase project
- a Gemini API key

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create your local env file

Copy `.env.example` to `.env.local`.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` optional fallback
- `SUPABASE_STORAGE_BUCKET_LABELS`
- `GEMINI_API_KEY`
- `GEMINI_VISION_MODEL`
- `INTAKE_DEBUG`

Notes:

- `SUPABASE_SECRET_KEY` is the preferred server-side key.
- `SUPABASE_SERVICE_ROLE_KEY` is only a fallback for older setups.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` must be present for browser auth/session handling.
- `GEMINI_VISION_MODEL` currently defaults to `gemini-3.5-flash`.

See [docs/SUPABASE_SETUP.md](/c:/Users/l7eIV/GOVITREPO/docs/SUPABASE_SETUP.md) for details.

### 3. Apply the Supabase schema

Run the SQL migrations in `supabase/migrations` against your Supabase project, in order.

Current migrations:

```text
20260609205000_label_review_foundation.sql
20260609213500_product_auth_and_demo_labels.sql
20260609215000_allow_svg_demo_uploads.sql
20260609221500_public_report_cases.sql
20260609234500_automated_public_intake.sql
```

You can apply them with the Supabase CLI or by pasting them into the Supabase SQL editor in order.

### 4. Create at least one reviewer account

In Supabase Auth:

1. Disable email confirmation for local testing if you want simple password login.
2. Create a user in Auth.
3. Confirm that a matching `public.reviewer_profiles` row exists.
4. Promote the user to `admin` if needed.

Example:

```sql
update public.reviewer_profiles
set role = 'admin'
where email = 'your-admin@example.com';
```

### 5. Seed demo labels

This uploads SVG label assets into the configured Supabase bucket and upserts the `demo_labels` rows.

```bash
npm run seed:demo-labels
```

### 6. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Main Routes

- `/` landing page
- `/report` public label reporting flow
- `/case-status` public case lookup
- `/login` reviewer/admin sign-in
- `/dashboard` reviewer queue and operational overview
- `/demo-library` seeded showcase labels
- `/reviews/new` internal reviewer intake
- `/reviews/[id]` review detail and reviewer decision page

## Available Scripts

From the repo root:

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm run test
npm run seed:demo-labels
```

Workspace notes:

- `npm run dev` starts `@govit/web`
- `npm run build`, `lint`, `typecheck`, and `test` run across workspaces when present

## How The Product Works

### Public flow

1. User uploads a label image on `/report`.
2. The image is stored in Supabase.
3. A public case reference is created.
4. Gemini analyzes the image for label classification and candidate fields.
5. Clear non-labels can be auto-rejected.
6. Everything else becomes a reviewer job with stored evidence.
7. The public user can check status with the case reference.

### Reviewer flow

1. Reviewer signs in with Supabase Auth.
2. Reviewer opens dashboard, demo library, or internal intake.
3. Internal intake uses the same image-first automated pipeline as public intake.
4. Reviewer can optionally provide manual field overrides.
5. Reviewer can accept, deny, or request a second opinion.

## TTB COLA Registry Helper

The app includes a `Search on COLA` helper on public case detail and reviewer detail pages.

It currently:

- suggests a product name from extracted fields
- uses a safe rolling date window
- opens the TTB Public COLA Registry in a new tab with a prefilled search

This is a reviewer-assist tool, not a guaranteed official match.

## Deployment

### Vercel

Add the same environment variables from `.env.local` into Vercel for:

- `Production`
- `Preview`
- `Development`

Recommended flow:

1. connect the GitHub repository to Vercel
2. set env vars in Vercel
3. deploy `main` to production
4. use preview deployments for pull requests

### Important runtime note

This app does not depend on a separate local OCR worker anymore.

- local development runs inside Next.js
- Vercel deployments use server actions and hosted Gemini requests
- Supabase handles persistence, auth, and storage

## Troubleshooting

### `Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL`

- set the variable in `.env.local`
- restart the dev server
- add the same variable to Vercel if the error happens in deployment

### Reviewer login succeeds in Supabase but app still blocks access

- confirm the user has a `reviewer_profiles` row
- confirm `reviewer_profiles.status = 'active'`

### Demo labels do not appear

- confirm the storage bucket exists
- run `npm run seed:demo-labels`
- confirm the script can access `NEXT_PUBLIC_SUPABASE_URL` and a server-side Supabase key

### Public intake falls back to manual review

- confirm `GEMINI_API_KEY` is set
- optionally set `INTAKE_DEBUG=true` locally and inspect server logs

## Documentation

- Product framing: [docs/PRODUCT_CONTEXT.md](/c:/Users/l7eIV/GOVITREPO/docs/PRODUCT_CONTEXT.md)
- System design: [docs/ARCHITECTURE.md](/c:/Users/l7eIV/GOVITREPO/docs/ARCHITECTURE.md)
- Supabase setup: [docs/SUPABASE_SETUP.md](/c:/Users/l7eIV/GOVITREPO/docs/SUPABASE_SETUP.md)
- Collaboration guide: [COLLABORATION.md](/c:/Users/l7eIV/GOVITREPO/COLLABORATION.md)
- AI contributor context: [AGENTS.md](/c:/Users/l7eIV/GOVITREPO/AGENTS.md)

# Supabase Setup

## Active Project

The current Supabase project connected for this app is:

- `https://gftwjoencmxeailojvgt.supabase.co`

This project was verified as effectively empty before app-specific setup:

- no app tables in `public`
- only default `storage.*` system tables
- no storage buckets created yet

## Environment Variables

Copy [\.env.example](/c:/Users/l7eIV/GOVITREPO/.env.example) into a local `.env.local` file or add the same variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET_LABELS`
- `GEMINI_API_KEY`
- `GEMINI_VISION_MODEL`
- `PADDLEOCR_PYTHON_PATH`
- `PADDLEOCR_BRIDGE_PATH`

Notes:

- Prefer `SUPABASE_SECRET_KEY` for server-only access.
- `SUPABASE_SERVICE_ROLE_KEY` is included as a fallback for legacy projects.
- Never expose either server-only key in client-side code.
- `GEMINI_API_KEY` enables hosted image understanding that works on Vercel.
- `GEMINI_VISION_MODEL` defaults to `gemini-3.5-flash`.
- `PADDLEOCR_PYTHON_PATH` defaults to `py` on Windows and `python3` elsewhere.
- `PADDLEOCR_BRIDGE_PATH` defaults to `scripts/paddle_ocr_bridge.py`.
- PaddleOCR requires a local Python install plus `paddlepaddle` and `paddleocr`.

Recommended local install:

```bash
python -m pip install "numpy<2" --upgrade
python -m pip install paddlepaddle==3.0.0 paddleocr
```

## Repository Wiring

The app uses three Supabase helpers:

- browser client: [apps/web/lib/supabase/client.ts](/c:/Users/l7eIV/GOVITREPO/apps/web/lib/supabase/client.ts)
- server client: [apps/web/lib/supabase/server.ts](/c:/Users/l7eIV/GOVITREPO/apps/web/lib/supabase/server.ts)
- admin client: [apps/web/lib/supabase/admin.ts](/c:/Users/l7eIV/GOVITREPO/apps/web/lib/supabase/admin.ts)

## App-Owned Database Surface

This app should only use its own resources:

- `public.label_review_jobs`
- `public.label_review_field_results`
- `public.public_report_cases`
- `public.demo_labels`
- `public.reviewer_profiles`
- storage bucket `label-review-images`

No other project tables should be used for this application.

## Vercel

Add the same environment variables to the Vercel project for:

- Production
- Preview
- Development

## Current Public Intake Flow

1. Public user uploads a label image.
2. The image is stored in Supabase Storage.
3. A `public_report_cases` row is created with a case reference.
4. Gemini vision is used first to classify the image and extract candidate fields.
5. If Gemini is unavailable, the app falls back to local PaddleOCR.
6. If confidence is high that it is not a label, the case is auto-rejected.
7. Otherwise a `label_review_jobs` row is created for reviewer action.
8. Reviewers can accept, deny, or request a second opinion.

## Auth For Testing

This project now uses simple Supabase Auth for internal reviewer access.

Recommended test setup:

1. In Supabase Auth settings, disable email confirmation for local testing if you want immediate email/password sign-in.
2. Create users directly in Supabase Auth.
3. Each new auth user will automatically get a `reviewer_profiles` row with default role `reviewer`.
4. Promote a user to admin by updating `reviewer_profiles.role` to `admin`.

Example SQL:

```sql
update public.reviewer_profiles
set role = 'admin'
where email = 'your-admin@example.com';
```

Only users with an active `reviewer_profiles` record should use the app.

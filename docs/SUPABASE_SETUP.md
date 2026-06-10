# Supabase Setup

## Purpose

Supabase is used in this product for:

- Postgres data storage
- reviewer authentication
- image storage
- signed image delivery

## Environment Variables

Copy [\.env.example](/c:/Users/l7eIV/GOVITREPO/.env.example) to `.env.local` and fill in the values.

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`

Optional fallback:

- `SUPABASE_SERVICE_ROLE_KEY`

App configuration:

- `SUPABASE_STORAGE_BUCKET_LABELS`
- `GEMINI_API_KEY`
- `GEMINI_VISION_MODEL`
- `INTAKE_DEBUG`

Notes:

- `SUPABASE_SECRET_KEY` is the preferred server-side admin credential.
- `SUPABASE_SERVICE_ROLE_KEY` is supported as a fallback.
- the browser app still requires `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_STORAGE_BUCKET_LABELS` defaults to `label-review-images`
- `GEMINI_VISION_MODEL` defaults to `gemini-3.5-flash`

## Current App-Owned Supabase Surface

Tables:

- `public.label_review_jobs`
- `public.label_review_field_results`
- `public.public_report_cases`
- `public.demo_labels`
- `public.reviewer_profiles`

Storage bucket:

- `label-review-images` by default

## Migrations

Current repository migrations live in:

- [supabase/migrations](/c:/Users/l7eIV/GOVITREPO/supabase/migrations)

Current ordered set:

```text
20260609205000_label_review_foundation.sql
20260609213500_product_auth_and_demo_labels.sql
20260609215000_allow_svg_demo_uploads.sql
20260609221500_public_report_cases.sql
20260609234500_automated_public_intake.sql
```

Apply them in order using either:

- the Supabase CLI
- or the Supabase SQL editor

## Storage

The app stores:

- public report images
- internal reviewer upload images
- seeded demo label assets

Images are uploaded into the configured bucket and later served through signed URLs.

## Auth

Supabase Auth is used for reviewer/admin access only.

Public reporting does not require a login.

### Recommended local test setup

1. Disable email confirmation in Supabase Auth for local testing if desired.
2. Create a user in Supabase Auth.
3. Confirm that a `reviewer_profiles` row exists for that user.
4. Ensure `status = 'active'`.
5. Update `role` to `admin` if you need admin access.

Example:

```sql
update public.reviewer_profiles
set role = 'admin'
where email = 'your-admin@example.com';
```

## Reviewer access expectations

Only users with an active reviewer profile should be able to enter the internal product routes.

If login succeeds but the app rejects access, check:

- matching `reviewer_profiles.id`
- `reviewer_profiles.status`
- whether the auth user exists in the correct Supabase project

## Seeded demo labels

Seed showcase data with:

```bash
npm run seed:demo-labels
```

The script:

- reads `.env.local`
- uploads demo SVG labels into the storage bucket
- upserts rows into `public.demo_labels`

The script requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

## Vercel

Add the same env vars to Vercel for:

- `Production`
- `Preview`
- `Development`

If Vercel is missing any of the public or server-side Supabase variables, the app will fail during runtime.

## Current product flow through Supabase

### Public intake

1. user uploads image
2. image is stored in Supabase Storage
3. `public_report_cases` row is created
4. automated intake runs
5. a reviewer job may be created

### Internal intake

1. reviewer uploads image
2. image is stored in Supabase Storage
3. automated intake runs
4. `label_review_jobs` row is created with extracted fields and evidence

### Review handling

1. reviewer updates decision
2. `label_review_jobs` is updated
3. related `public_report_cases` status updates when linked

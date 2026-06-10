# Architecture

## Overview

This repository is a Vercel-first Next.js product with Supabase-backed persistence and a hosted image-analysis step.

The current system is optimized for:

- a polished demo flow
- clear reviewer trust signals
- deterministic field-level verification behavior
- minimal moving parts in deployment

## Current System Map

```text
Browser
  -> Next.js app router UI
  -> Server Actions
     -> Supabase Storage
     -> Supabase Postgres
     -> Supabase Auth
     -> Gemini image analysis
     -> Deterministic field comparison helpers
```

## Major Surfaces

### Public reporting

- `/report`
- `/case-status`

Responsibilities:

- accept anonymous uploads
- create case references
- run automated intake
- expose public-facing status without sign-in

### Reviewer product

- `/login`
- `/dashboard`
- `/demo-library`
- `/reviews/new`
- `/reviews/[id]`

Responsibilities:

- reviewer/admin authentication
- queue and case management
- internal image-first intake
- reviewer decisions
- evidence review and COLA search assistance

## Runtime Boundaries

### 1. Next.js application

Location:

- `apps/web`

Responsibilities:

- UI rendering
- form handling
- orchestration of storage, AI analysis, and persistence
- reviewer session enforcement

The app uses server actions rather than a separate API service for the main workflows.

### 2. Domain logic

Locations:

- `packages/core`
- `packages/types`

Responsibilities:

- normalized comparison logic
- structured field decision generation
- shared enums and product types

Rules:

- keep domain logic typed
- keep deterministic comparison logic outside React components
- preserve explainability in result objects

### 3. Automated intake layer

Key file:

- [apps/web/lib/public-intake.ts](/c:/Users/l7eIV/GOVITREPO/apps/web/lib/public-intake.ts)

Responsibilities:

- send uploaded image bytes to Gemini
- classify whether the image appears to be a TTB alcohol label
- extract candidate fields
- score confidence
- produce field-level comparison records
- fall back safely to manual review when automation fails

Important design rule:

- Gemini informs the intake, but it does not replace deterministic reviewer-facing result objects

### 4. Persistence and storage

Supabase is the system of record for:

- reviewer profiles
- public report cases
- review jobs
- field-level verification results
- demo labels
- stored images

## Current Data Model

### `public.label_review_jobs`

Primary internal review record.

Stores:

- source kind
- label title
- submitted fields
- automated classification
- automated summary
- reviewer decision
- reviewer notes
- image path

### `public.label_review_field_results`

Field-level verification evidence for a job.

Stores:

- field name
- expected value
- detected value
- confidence
- reason
- pass/review/fail status

### `public.public_report_cases`

Public-facing case lifecycle record.

Stores:

- case reference
- public status
- uploaded image path
- extracted fields
- candidate label ids
- linked internal job id
- automated summary and rejection reason

### `public.demo_labels`

Seeded showcase labels for demos.

Stores:

- title and metadata
- stored image path
- submitted fields
- sample field results

### `public.reviewer_profiles`

Internal reviewer/admin access profile.

Stores:

- linked auth user id
- role
- active/disabled status

## Request Flows

### Public intake

1. User uploads an image.
2. Server stores the image in Supabase Storage.
3. Server creates a `public_report_cases` row in `processing`.
4. Gemini analyzes the image.
5. The app either:
   - auto-rejects a clear non-label
   - or creates a `label_review_jobs` row for reviewer handling
6. The public case record is updated with extraction and status details.

### Internal reviewer intake

1. Reviewer uploads an image from `/reviews/new`.
2. Server stores the image in Supabase Storage.
3. The same automated intake path runs.
4. Optional manual fields override or supplement extracted fields.
5. A `label_review_jobs` record is created with automated evidence attached.

### Reviewer decision

1. Reviewer opens `/reviews/[id]`.
2. Reviewer inspects image, extracted fields, and field results.
3. Reviewer chooses `accepted`, `denied`, or `second_opinion`.
4. Job status and summary status are updated.
5. If linked to a public case, the public case status is updated too.

## COLA Search Assistance

The product now includes a lightweight TTB registry helper.

Purpose:

- reduce reviewer friction
- provide a fast handoff from extracted fields into the official public registry

Current behavior:

- suggest a product name from extracted brand/title data
- build a safe date window under TTB’s 15-year limit
- open the TTB Public COLA Registry search in a new tab

This is intentionally assistive, not authoritative.

## Deployment Model

### Current

- `Next.js` hosted on Vercel
- Supabase for database, auth, and storage
- Gemini via outbound HTTP from server actions

### Not required

- no separate OCR worker
- no local Python process
- no extra queue service for the current demo path

## Testing Strategy

### Must-have

- `typecheck`
- `lint`
- build validation before shipping

### Domain coverage

Focus tests in `packages/core` on:

- exact-text rules
- normalization
- structured field extraction helpers
- pass/review/fail thresholds

### Product confidence

Use:

- seeded demo labels
- manual upload checks
- public-case round trips
- reviewer-decision verification

## Architectural Guardrails

1. Do not embed business rules directly in React components.
2. Do not let AI output directly replace deterministic field decisions.
3. Do not treat weak extraction as a passing result.
4. Keep public status lookup separate from reviewer-only actions.
5. Keep storage, auth, and analysis concerns visible in docs whenever they change.

# AGENTS

This file gives AI coding agents and automated contributors stable context for working in this repository.

## Mission

Build and maintain a Vercel-hosted showcase product for TTB label reporting and reviewer verification that is:

- explainable
- demo-friendly
- deterministic in its reviewer-facing logic
- easy for humans to trust and operate

## Current Product Reality

The repository already contains a working product baseline with:

- public label reporting
- public case reference tracking
- reviewer/admin sign-in through Supabase Auth
- internal reviewer intake
- seeded demo labels
- Supabase-backed storage and persistence
- Gemini-powered automated intake
- reviewer decisions and status updates
- TTB COLA registry search assistance

## Product Rules

1. Exact regulatory text checks should remain strict.
2. Softer fields may use normalization, but not vague matching.
3. Low-confidence extraction should usually become `review`.
4. Important outcomes should remain traceable to evidence and reasoning.
5. Domain logic should not become tightly coupled to one provider.

## Repository Priorities

When adding or changing code, optimize for:

- clarity over cleverness
- typed interfaces over ad hoc objects
- pure or near-pure domain helpers where practical
- testability of normalization and verification behavior
- smooth local development and Vercel deployment

## Current Project Shape

Prefer to preserve and extend this structure:

```text
apps/web
packages/core
packages/types
docs
supabase/migrations
scripts
```

## Preferred Contribution Pattern

1. Read [docs/PRODUCT_CONTEXT.md](/c:/Users/l7eIV/GOVITREPO/docs/PRODUCT_CONTEXT.md).
2. Read [docs/ARCHITECTURE.md](/c:/Users/l7eIV/GOVITREPO/docs/ARCHITECTURE.md).
3. Keep behavior aligned with `pass`, `review`, and `fail`.
4. Preserve explainability in stored results and UI surfaces.
5. Update docs when setup, architecture, or flow changes.

## Safe Assumptions

- the main app is `Next.js` with `TypeScript`
- Vercel preview deployments are a first-class workflow
- GitHub pull requests are the expected collaboration path
- Supabase is the current persistence/auth/storage platform
- Gemini is the current automated image-analysis provider
- there is no separate local OCR worker in the current deployment model

## Avoid

- embedding business rules directly in React components
- making AI output the final source of truth without deterministic formatting
- reintroducing removed local OCR assumptions without an explicit product reason
- bypassing audit or evidence capture for convenience
- leaving docs behind when setup or workflow changes

## Documentation Expectations

When introducing or changing subsystems, update:

- `README.md` if install, env, run, or operator flow changes
- `docs/ARCHITECTURE.md` if system boundaries change
- `docs/PRODUCT_CONTEXT.md` if product behavior or philosophy changes
- `docs/SUPABASE_SETUP.md` if schema/auth/storage/env changes
- `COLLABORATION.md` if working conventions change

## Definition Of A Good Change

A good change in this repository usually:

- reduces ambiguity
- improves demo reliability
- keeps reviewer trust high
- makes future implementation choices easier rather than narrower
- leaves the next contributor with better context than before

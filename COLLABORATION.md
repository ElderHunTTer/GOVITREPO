# Collaboration Guide

This repository is built for collaboration between human contributors and AI coding agents.

## Shared Working Agreement

We optimize for:

- small, reviewable changes
- docs that match the shipped code
- deterministic domain behavior
- clean handoffs
- stable local and Vercel workflows

## Working Style

### Branching

- use short-lived branches
- open pull requests early
- use Vercel previews for UI review and flow validation

### Pull requests

Each PR should ideally include:

- what changed
- why it changed
- screenshots or preview links for UI changes
- any schema or env implications
- test, lint, typecheck, or build notes

### Commits

Prefer focused commits with one coherent purpose.

Examples:

- `feat: add public case tracking flow`
- `feat: wire reviewer intake to automated analysis`
- `docs: sync setup guide with supabase and gemini flow`
- `fix: persist reviewer decision into public case status`

## Documentation Discipline

When behavior changes, update the docs in the same change whenever possible.

Expected touchpoints:

- `README.md`
  - install, env, run, and operator workflow changes
- `docs/ARCHITECTURE.md`
  - system boundaries, runtime model, or storage/auth/AI changes
- `docs/PRODUCT_CONTEXT.md`
  - user flow or product philosophy changes
- `docs/SUPABASE_SETUP.md`
  - schema, auth, storage, or env changes
- `AGENTS.md`
  - stable contributor guidance changes

## Human and AI Handoffs

Leave behind:

- updated context docs when assumptions changed
- clear TODOs with enough surrounding context
- explicit notes on tradeoffs or limitations
- commands used for verification when relevant

The next contributor should not need to reverse-engineer intent from code alone.

## Definition Of Ready

Before starting a change, we should usually know:

- the user-facing outcome
- the affected route or subsystem
- the data model impact
- the verification plan

## Definition Of Done

A change is closer to done when:

- docs and code agree
- env/setup impact is documented
- local run instructions still work
- lint, typecheck, and build status are known
- the behavior is explainable to a new contributor

## Preferred Technical Conventions

### Code

- prefer TypeScript
- keep reusable logic outside route components
- preserve typed product contracts
- keep provider-specific behavior isolated

### Product behavior

- route uncertainty to `review`
- prefer explainable evidence over opaque outcomes
- keep reviewer trust higher than automation ambition

### UI

- optimize for polished but understandable flows
- keep public and reviewer journeys feeling like one product
- avoid making users type data that the system can reasonably extract first

## Decision Records

If a change materially alters stack, schema, hosting, or workflow direction, record:

- what changed
- why
- rejected alternatives if relevant
- follow-on consequences

If the repo grows, these can move into `docs/decisions/`.

# GOVITREPO

Foundation repository for a Vercel-hosted label verification showcase product inspired by the `treasurytakehome-rgb/instructions` prompt.

## Purpose

This repository is intended to become a polished, demo-ready web application that:

- accepts a liquor label image plus structured application data
- verifies required label fields against submitted application values
- applies exact validation for regulated text such as government warnings
- applies normalized and explainable matching for softer fields such as brand names
- produces reviewer-friendly `pass`, `review`, and `fail` outcomes with evidence

## Product Direction

The product should optimize for:

- reliable demos on Vercel
- strong GitHub-based collaboration workflows
- deterministic and testable validation logic
- a clean path from prototype to production-hardening

## Planned Stack

- `Next.js` for the web app and API routes
- `TypeScript` across the main application and shared packages
- `Vercel` for hosting, preview deployments, and environment management
- `Postgres` for jobs, audit records, and verification results
- blob/object storage for uploaded images
- a deterministic verification engine, with OCR isolated behind a replaceable adapter

## Suggested Initial Repository Layout

```text
apps/
  web/
packages/
  core/
  types/
  config/
docs/
```

## Core Principles

1. Favor deterministic rules over opaque AI decisions for compliance checks.
2. Treat low-confidence extraction as `review`, not `pass`.
3. Keep OCR pluggable so deployment constraints do not infect core business logic.
4. Preserve evidence and auditability for every verification run.
5. Optimize for showcase quality without painting the system into a corner.

## Start Here

- Product framing: [docs/PRODUCT_CONTEXT.md]
- System design: [docs/ARCHITECTURE.md]
- Supabase wiring: [docs/SUPABASE_SETUP.md]
- Working norms: [COLLABORATION.md]
- AI contributor context: [AGENTS.md]

# Implementation Plan

## Goal

Ship a Vercel-hosted, preview-deployable showcase application for label verification with a deterministic comparison engine and an OCR adapter boundary.

## Phase 0: Foundation

Deliverables:

- repository structure
- Next.js app scaffold
- shared TypeScript configuration
- foundational documentation
- CI checks for lint and type safety

Success looks like:

- the repository installs cleanly
- the web app deploys to Vercel
- preview deployments work from GitHub pull requests

## Phase 1: Domain Core

Deliverables:

- shared field schemas
- verification result schema
- normalization utilities
- exact match rules for required warning text
- tolerant matching rules for softer text fields

Success looks like:

- core rule logic can be tested without the web app
- pass/review/fail behavior is deterministic

## Phase 2: Upload To Result Flow

Deliverables:

- upload form for label image and submitted metadata
- verification request endpoint
- job persistence
- result page with field-level outcomes

Success looks like:

- a user can upload one label and receive a structured result
- the result includes reasons and evidence placeholders

## Phase 3: OCR Integration

Deliverables:

- OCR adapter interface
- first OCR implementation
- extraction mapping from OCR output to field candidates
- confidence-aware fallback to `review`

Success looks like:

- OCR can be swapped without rewriting domain logic
- uncertain extractions do not silently pass

## Phase 4: Showcase Hardening

Deliverables:

- seeded demo data
- polished result UI
- preview-safe environment handling
- better observability and logging

Success looks like:

- reviewers can demo the product smoothly from a preview link
- failures are explainable and diagnosable

## Phase 5: Batch Workflow

Deliverables:

- multi-image upload
- queue or background processing strategy
- batch dashboard

Success looks like:

- batch processing builds on the same single-label core

## Immediate Next Build Steps

1. Scaffold `apps/web` with Next.js and TypeScript.
2. Create `packages/types` for shared schemas.
3. Create `packages/core` for normalization and rules.
4. Add CI for lint, typecheck, and tests.
5. Add the first review UI shell with mocked verification data.

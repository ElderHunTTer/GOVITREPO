# Architecture

## Overview

The system should be built as a Vercel-first web application with a strict separation between:

- presentation and workflow
- deterministic verification logic
- OCR and extraction infrastructure
- persistence and audit history

This separation keeps the showcase stable even if OCR implementation details change.

## Architecture Goals

- deploy cleanly on Vercel
- support GitHub preview environments
- keep compliance logic independent from hosting constraints
- minimize risk from long-running OCR operations
- remain easy for new contributors and AI agents to understand

## High-Level Design

```text
Browser
  -> Next.js UI
  -> API Route / Server Action
  -> Verification Orchestrator
     -> Image Storage
     -> OCR Adapter
     -> Field Extractor
     -> Normalizer
     -> Rules Engine
     -> Decision Formatter
     -> Postgres Audit Store
```

## Recommended Repository Structure

```text
apps/
  web/                 # Next.js application deployed to Vercel
packages/
  core/                # domain logic: normalize, compare, decide
  types/               # shared schemas and enums
  config/              # shared linting, tsconfig, env helpers
  ocr/                 # OCR adapter interfaces and implementations
docs/
  ARCHITECTURE.md
  PRODUCT_CONTEXT.md
```

## Runtime Boundaries

### 1. Web Application

Hosted on Vercel as the main product surface.

Responsibilities:

- render reviewer UI
- accept uploads
- create verification jobs
- fetch and present results
- host documentation-friendly preview deployments

### 2. Verification Core

Pure TypeScript domain logic that should not depend on UI or hosting concerns.

Responsibilities:

- field schemas
- normalization
- exact and tolerant comparison rules
- decision scoring
- result formatting

This package should be heavily unit tested and remain deploy-target agnostic.

### 3. OCR Adapter Layer

The OCR layer should be replaceable.

Responsibilities:

- receive an image reference
- return extracted text, confidence values, and bounding boxes
- hide provider-specific details from the rest of the app

This allows the project to start with one OCR approach and switch later if Vercel packaging or performance becomes a constraint.

### 4. Persistence Layer

Use Postgres for structured records and blob storage for images.

Persist:

- verification jobs
- uploaded image metadata
- extracted raw OCR text
- normalized field candidates
- final field-level decisions

## Request Model

### Interactive Single Verification

Best for the first demo.

Flow:

1. User uploads image and metadata.
2. Server creates a verification job.
3. OCR and verification run.
4. Field-level decisions are stored.
5. UI renders status and evidence.

### Batch Verification

Deferred until the interactive flow is stable.

Flow:

1. User uploads a set of images and a manifest.
2. Server enqueues verification jobs.
3. Results stream into a batch dashboard.

## Decision Model

Every field decision should include:

- `status`
- `expectedValue`
- `detectedValue`
- `confidence`
- `reason`
- `evidenceRegions`

Allowed statuses:

- `pass`
- `review`
- `fail`

## Vercel Deployment Strategy

### First-Phase Hosting

Host the main Next.js app on Vercel.

Use:

- preview deployments for every pull request
- production deployments from `main`
- environment variables for storage, database, and OCR settings

### OCR Strategy

Prefer an adapter-based design from the start:

- if OCR performs acceptably inside Vercel Functions, keep it in-app
- if OCR becomes too slow or heavy, move only the adapter implementation to a worker service

The rest of the system should not care where OCR runs.

## Data Model Sketch

### VerificationJob

- `id`
- `status`
- `sourceImageUrl`
- `submittedFields`
- `createdAt`
- `completedAt`

### ExtractedField

- `jobId`
- `fieldName`
- `rawValue`
- `normalizedValue`
- `confidence`
- `evidenceRegions`

### FieldDecision

- `jobId`
- `fieldName`
- `status`
- `expectedValue`
- `detectedValue`
- `reason`

## Testing Strategy

### Unit Tests

Focus on:

- exact warning validation
- normalization behavior
- structured numeric parsing
- pass/review/fail thresholds

### Integration Tests

Focus on:

- upload to result workflow
- OCR adapter contract behavior
- persistence of evidence and decisions

### Golden Fixture Tests

Maintain a small fixture set of sample labels to prevent regressions.

## Architectural Guardrails

1. Do not put compliance decision logic directly in UI code.
2. Do not let OCR provider details leak into domain models.
3. Do not treat uncertain extraction as a passing result.
4. Do not make the critical path depend on opaque LLM reasoning.
5. Do not optimize for batch scale before the single-review experience feels solid.

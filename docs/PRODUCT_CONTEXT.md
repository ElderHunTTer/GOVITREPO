# Product Context

## Working Summary

This project is a showcaseable label verification product based on the `treasurytakehome-rgb/instructions` take-home prompt.

The product helps a reviewer compare a submitted label image against extracted or submitted metadata and quickly identify whether key fields appear valid, suspicious, or non-compliant.

## Primary User

The primary user is an internal reviewer who needs to:

- upload or inspect a label image
- compare extracted label values to structured application values
- receive a fast, explainable verification result
- see what triggered a `review` or `fail`

The secondary user is a public submitter who needs to:

- upload a label image without creating an account
- pass a lightweight bot check
- receive a case reference number immediately
- check whether the case was auto-rejected, queued, or resolved

## Product Goals

- Deliver a demo-friendly reviewer workflow that looks polished on Vercel.
- Deliver a simple public intake flow that feels like a real product.
- Keep the core verification logic deterministic and testable.
- Make every result explainable with field-level evidence.
- Support single-label verification first, then batch review.

## Non-Goals For The First Iteration

- full production-grade COLA integration
- advanced organization and admin tooling
- auto-approval without evidence or confidence checks
- model-heavy AI orchestration in the critical path

## Verification Philosophy

Different fields have different compliance sensitivity:

- `Exact match fields`
  - Government warning text
  - Other legally required statements where wording matters
- `Normalized match fields`
  - Brand name
  - Product class descriptors that may differ in capitalization or punctuation
- `Structured value fields`
  - ABV
  - Proof
  - Net contents

The system should not treat all mismatch types equally. It should explain why a difference matters.

## Outcome Model

Every field comparison should produce:

- `status`: `pass | review | fail`
- `expectedValue`
- `detectedValue`
- `confidence`
- `reason`
- `evidence`

## Demo Priorities

- smooth upload and processing flow
- strong visual explanation of each result
- fast preview deployment workflow
- reliable seeded demo data for showcase environments

## Future Evolution

The product should be able to evolve from:

- single-label synchronous verification

to:

- queued and batched verification
- stronger OCR adapters
- reviewer feedback loops
- production observability and audit reporting

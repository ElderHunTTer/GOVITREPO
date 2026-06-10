# Collaboration Guide

This repository is intended for collaborative development between human contributors and AI coding agents.

## Shared Working Agreement

We optimize for:

- small, reviewable changes
- explicit architecture decisions
- deterministic core behavior
- good handoff quality
- clear reasoning in docs and pull requests

## How We Work

### Branching

- use short-lived feature branches
- open pull requests early for visibility
- rely on Vercel preview deployments for UI and workflow review

### Pull Requests

Each PR should aim to include:

- a concise summary of the change
- why the change was needed
- any architecture or product tradeoffs
- screenshots or preview links for UI work
- notes about test coverage or remaining risk

### Commit Style

Prefer focused commits that group one coherent change at a time.

Examples:

- `docs: add architecture and collaboration baseline`
- `feat: scaffold verification core package`
- `feat: add label upload workflow`
- `test: cover warning text normalization rules`

## Human And AI Handoffs

When handing work between contributors, leave behind:

- updated docs when assumptions changed
- clear TODOs with context
- explicit unresolved questions
- enough structure that the next contributor does not need to rediscover intent

## Decision Records

If a decision materially changes the stack or product direction, record:

- what changed
- why it changed
- alternatives considered
- what it unlocks or constrains

This can live in a future `docs/decisions/` directory if the repository grows.

## Definition Of Ready

Before starting implementation work, we should usually know:

- the user-facing goal
- the affected system boundary
- whether the change belongs in UI, domain, OCR, or persistence
- how the change will be verified

## Definition Of Done

A change is closer to done when:

- code and docs agree
- core logic is testable
- preview deployment behavior is understood
- the change is explainable to a new contributor

## Early Repository Conventions

### Code

- prefer TypeScript
- keep domain logic pure where possible
- share schemas from a common package
- isolate provider-specific adapters behind interfaces

### Docs

- keep top-level docs stable and high signal
- update architecture docs when boundaries move
- avoid stale aspirational docs that no longer reflect the code

### UX

- prefer confidence-building explanations over black-box outputs
- show field-level evidence when possible
- degrade to `review` when certainty is weak

## First Milestone Collaboration Focus

The first implementation milestone should align contributors around:

- repo scaffolding
- shared types
- verification result schema
- a basic upload-to-result flow
- preview-deployable UI shell

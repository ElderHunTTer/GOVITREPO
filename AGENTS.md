# AGENTS

This file gives AI coding agents and automated contributors stable context for working in this repository.

## Mission

Build a Vercel-hosted showcase product for label verification that is:

- explainable
- demo-friendly
- deterministic in its compliance logic
- easy for human reviewers to trust

## Product Rules

1. Exact regulatory text checks must be strict.
2. Softer fields may use normalization, but not hand-wavy matching.
3. Low-confidence extraction should usually become `review`.
4. Every important decision should be traceable to evidence.
5. The domain layer must remain independent from any single OCR provider.

## Repository Priorities

When adding or changing code, optimize for:

- clarity over cleverness
- typed interfaces over ad hoc objects
- pure functions in domain logic
- testability of normalization and rules
- smooth local development and Vercel deployment

## Expected Project Shape

Prefer a structure like:

```text
apps/web
packages/core
packages/types
packages/config
packages/ocr
docs
```

## Guidance For AI Contributors

### Safe Assumptions

- The main app should be `Next.js` and `TypeScript`.
- Vercel preview deployments are a first-class workflow.
- GitHub pull requests are expected to be the default collaboration path.
- Core validation logic should live in shared packages, not route handlers.

### Preferred Contribution Pattern

1. Read [docs/PRODUCT_CONTEXT.md](/c:/Users/l7eIV/GOVITREPO/docs/PRODUCT_CONTEXT.md).
2. Read [docs/ARCHITECTURE.md](/c:/Users/l7eIV/GOVITREPO/docs/ARCHITECTURE.md).
3. Keep product behavior aligned with `pass`, `review`, and `fail`.
4. Add or update tests when changing normalization or comparison logic.
5. Preserve explainability in all result objects and UI surfaces.

### Avoid

- embedding business rules directly in React components
- tying core logic to one OCR SDK
- introducing heavyweight orchestration before the fundamentals exist
- bypassing audit or evidence capture for convenience

## Documentation Expectations

When introducing new subsystems, update:

- `README.md` if the developer entry point changes
- `docs/ARCHITECTURE.md` if system boundaries change
- `docs/PRODUCT_CONTEXT.md` if product scope or decision philosophy changes
- `COLLABORATION.md` if the working model changes

## Definition Of A Good Change

A good change in this repository usually:

- reduces ambiguity
- makes verification behavior easier to reason about
- improves demo reliability
- makes future implementation choices easier rather than narrower

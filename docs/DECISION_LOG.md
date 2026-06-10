# Decision Log

This file records project-level decisions that materially affect architecture, workflow, or product behavior.

## ADR-001: Vercel-First Hosting

Status:

- accepted

Decision:

- The primary application will be hosted on Vercel and optimized for GitHub-driven preview deployments.

Why:

- Fast showcase workflow
- Strong pull request previews
- Good fit for a polished frontend-first demo

Tradeoff:

- Heavy OCR or long-running work may need extra care or an external worker boundary

## ADR-002: Deterministic Compliance Core

Status:

- accepted

Decision:

- Core verification logic will be deterministic and testable rather than driven by opaque LLM reasoning.

Why:

- Easier to trust
- Easier to test
- Better fit for regulated-text validation

Tradeoff:

- Requires explicit rule design and normalization logic

## ADR-003: OCR Behind An Adapter

Status:

- accepted

Decision:

- OCR will be isolated behind an adapter interface so the product can evolve without rewriting the domain layer.

Why:

- Reduces lock-in
- Makes Vercel runtime constraints easier to manage
- Keeps extraction concerns separate from compliance logic

Tradeoff:

- Adds some up-front abstraction

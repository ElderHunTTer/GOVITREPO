# Product Context

## Working Summary

This project is a showcaseable product for TTB label reporting and reviewer verification.

It combines:

- public label reporting without account creation
- internal reviewer/admin handling
- automated label triage and extraction
- deterministic field-level evidence
- a clean path to human review

## Primary Product Story

### Public user

The public user should be able to:

- report a label with only an image upload
- pass a simple bot confirmation
- receive a case reference number
- check status later without signing in

The public flow should feel like a real product, not a developer tool.

### Reviewer or admin

The reviewer/admin should be able to:

- sign in with Supabase Auth
- inspect incoming public cases
- create internal review jobs directly from image upload
- use optional manual field overrides
- accept, deny, or request a second opinion
- use TTB COLA search assistance when helpful

## Current Product Scope

### Included

- public report intake
- public case tracking
- reviewer sign-in
- reviewer dashboard
- demo library
- internal reviewer intake
- uploaded image preview with zoom and pan
- automated Gemini analysis
- Supabase-backed storage and persistence
- seeded demo label assets

### Intentionally limited for now

- no official TTB API integration
- no auto-approval workflow
- no advanced org/user management
- no batch processing system
- no background queue service

## Product Goals

- feel polished enough to demo on Vercel
- make reviewer actions understandable and trustworthy
- preserve evidence for each important decision
- keep the compliance logic explainable
- keep the architecture simple enough for fast iteration

## Verification Philosophy

The product should separate:

- automated intake assistance
- deterministic comparison logic
- human reviewer judgment

### Automation should do

- classify likely label vs likely non-label
- extract likely fields
- propose evidence and confidence
- speed up reviewer work

### Automation should not do

- silently replace reviewer oversight
- convert uncertainty into a pass
- hide confidence or reasoning

## Outcome Model

Every important result should converge on:

- `pass`
- `review`
- `fail`

Every field-level decision should remain explainable with:

- expected value
- detected value
- confidence
- reason

## Demo Priorities

- smooth public intake flow
- strong reviewer detail pages
- reliable seeded examples
- production-like UI quality
- easy setup for local and preview environments

## Current UX Principles

- image-first workflows
- minimal account friction for the public
- optional manual fields for reviewers, not mandatory first-step forms
- high-clarity status surfaces
- clean fallback behavior when AI extraction fails

## TTB COLA Positioning

The TTB Public COLA Registry is used as a reviewer-assist surface, not as a guaranteed integration.

Current product behavior:

- suggest a COLA product search term
- open the public registry with a prefilled search
- keep the reviewer in control of interpreting results

## Near-Term Evolution

Good next steps after the current baseline:

- richer extracted field display
- clearer reviewer audit history
- better admin controls
- deeper seeded fixtures and tests
- optional reviewer-side COLA search mode switching

## Non-Goals For This Stage

- enterprise workflow complexity
- automated enforcement without human traceability
- provider-specific lock-in in the domain layer
- hidden business rules living only in prompts or UI code

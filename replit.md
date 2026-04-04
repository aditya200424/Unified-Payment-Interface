# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + TanStack Query + Wouter + shadcn/ui

## Artifacts

- **upi-trust** (`/`) — UPI TrustScore web app
- **api-server** (`/api`) — Express backend API

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## UPI TrustScore App

A merchant trust scoring system similar to UPI. Before any payment, users can see a merchant's:
- Trust score (out of 5 stars) — calculated as (Happy Transactions / Total) × 5
- Happy transaction count
- Satisfaction percentage
- Risk level: Safe / Medium / Risky

After a simulated payment, users vote:
- "Was this transaction safe?"
- "Did merchant behave correctly?"
- "Are you satisfied?"

### Anti-fake logic
- Each voter can only vote once per merchant
- Verified merchants have higher vote weight (1.5x)
- Fraud reports reduce score faster (0.3 per report)

## Database Schema

- `merchants` — Merchant UPI IDs with trust metrics
- `votes` — Post-payment votes per user per merchant
- `fraud_reports` — Fraud reports that reduce trust score

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

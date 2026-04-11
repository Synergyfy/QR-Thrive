# QR-Thrive AI Agent Guidelines

This file provides critical procedural instructions for AI agents working on the QR-Thrive project. **Always read this file before performing any tasks.**

## Database & Prisma Migrations

To avoid database drift and ensure system integrity, always follow these rules:

### 1. No Manual Schema Changes
- **NEVER** modify the database schema directly via SQL or GUI tools (e.g., pgAdmin, Prisma Studio).
- **ALWAYS** make changes through the `schema.prisma` file.

### 2. Migration Protocol
- **ALWAYS** use `pnpm prisma migrate dev --name <migration_name>` to apply schema changes in development.
- **NEVER** skip migration file generation.
- **CHECK FOR DRIFT:** Before applying a new migration, run `pnpm prisma migrate status` to ensure the local database is in sync with the migration history.

### 3. Handling Drift
- If Prisma detects drift and requests a reset:
  - **STOP** and inform the user of the specific untracked changes.
  - **ASK** for explicit permission before running `prisma migrate reset`.
  - **CONSIDER** generating a manual migration via `prisma migrate diff` if preserving data is critical.

### 4. Environment Variables
- Ensure that you are using the correct environment variables for the database you are targeting (Development vs. Production).
- **NEVER** perform dangerous operations like `migrate reset` on production databases.

## Integration & SSO

### API Keys
- Secure API keys should never be logged or stored in plain text in the codebase.
- When generating API keys for external services, ensure they are stored hashed/encrypted in the database.

### Magic Links
- Magic links are single-use and time-bound (max 15 minutes).
- Always mark tokens as `used` immediately upon successful validation.

# HelixLab v0.7.1 test evidence (2026-10-21)

## Passed in current packaging environment

- 22 scientific service unit tests (input checks, deterministic chemistry, structure and DNA references, docking safeguards).
- 7 JavaScript unit tests for actual TypeScript DNA modules.
- TypeScript/TSX syntax transpilation across the entire frontend.
- Source architecture audit enforcing <=250 lines per source file and verifying local import paths.
- `next.config.mjs` syntax check and ZIP archive integrity check.

## Skipped / unverified

- Primer3 runtime reference test: Python package unavailable.
- AutoDock Vina real docking benchmark: Python package unavailable.
- `npm install`, `npm run typecheck`, `next build`: npm registry DNS `EAI_AGAIN` in this environment.
- Browser integration of Ketcher, Mol*, WASM assets, Next.js routes and downloaded bundles.
- Supabase migrations against a live database, cross-workspace RLS isolation, invitations and private file access.
- Real research-data security review, penetration testing or publication validation.

**Disposition: candidate patch for Vercel testing, not a certified clean build or commercial release.**

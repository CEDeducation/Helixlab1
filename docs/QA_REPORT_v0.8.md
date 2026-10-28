# v0.8.0 packaging QA — 2026-10-27

## Verified locally

- `node scripts/audit.mjs`: PASS (<=250 lines per source, no matching hardcoded secret patterns, local imports resolve).
- `node scripts/syntax-audit.mjs`: PASS (all TS and TSX modules parse; not a complete typecheck).
- `node --test tests/*.test.mjs`: PASS (12/12 tests, 0 skipped).
- `python -m pytest science-service/tests -q`: PASS (24/24 completed; 1 optional Primer3 test skipped).
- `python -m compileall -q science-service`: PASS.
- ZIP members, `zipfile.testzip()`, and source SHA-256 manifest: verified at packaging.

## Explicitly not verified

- Full `npm install`, `npm run typecheck`, and `npm run build`: registry DNS request returned `EAI_AGAIN` in packaging environment.
- Ketcher and Mol* real browser operation: frontend npm packages unavailable locally.
- Primer3 and AutoDock Vina actual engine invocations: `primer3` and `vina` Python modules unavailable locally.
- Supabase migration execution, RLS permission matrix, file archive round-trips: no live project credentials supplied.
- Multi-user concurrency, malicious upload fuzz testing, penetration testing, and publication-quality external scientific benchmarking.

**No source archive can prove 100% operational correctness, absence of vulnerabilities, or scientific publication validity.** The above unverified items are release blockers for handling confidential research or charging students.

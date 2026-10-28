# v0.8.0 changes from v0.7.1

- Reused existing OpenLab source viewer; did not replace the user's original frontend or add fake scientific results.
- Centralized authenticated science proxies with byte-limited JSON parsing, streaming size checks, source validation and TLS-only upstream configuration.
- Added database-backed, atomic per-account scientific rate limits and a new Supabase migration.
- Added a scientific-service capabilities endpoint and a visible System readiness screen for deployed runtime visibility.
- Restricted private storage downloads to actual current research workspace membership; tightened file metadata path linkage.
- Persisted warnings when simplified GenBank imports cannot represent certain qualifiers or original metadata. Original bytes remain archived.
- Added tests for streamed/Unicode JSON request sizes, engine capability reporting, and GenBank metadata warnings.
- Added a release checklist, deployment runbook, commercial-use guidance, and lockfile-release gate.
- Retained patched Next 15.5.28 / React 19.1.10 versions; browser build, Primer3/Vina runtime and live Supabase RLS tests **remain outstanding**.

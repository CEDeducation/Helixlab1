# HelixLab Research Platform v0.8.1 — Vercel deployment audit

**Release classification: controlled engineering preview. NOT a production-certified commercial platform, NOT a validated pharmacophore/docking product, and NOT an independently audited secure system.**

This repository is a real Next.js/Supabase research application using the original OpenLab v8.2 circular plasmid UI. It connects to a separate Python scientific service for RDKit, Biopython, pharmacophore modeling, Primer3 and AutoDock Vina. It does not reuse proprietary Benchling or Discovery Studio code. Original files are stored privately where supported.

## Quick start: existing GitHub + Vercel deployment

1. **Make a backup of the current private GitHub repository and Supabase project.** Replace repository source files with the extracted ZIP contents, preserving `.github`, `src`, `science-service`, and `supabase` folders. Use GitHub Desktop if the browser rejects a large folder upload.
2. In **Supabase → SQL Editor**, for a **new database**, run migrations `202610210001_schema.sql`, `202610210002_policies.sql`, `202610210003_atomic_import.sql`, then `202610270001_security_quotas.sql`, then `202610280001_existing_users_backfill.sql`, in exactly that order. For a database already on v0.7.1, run `202610270001_security_quotas.sql` and `202610280001_existing_users_backfill.sql` (only if not previously applied). If already on v0.8, run only the new backfill migration. Validate the results first in a staging project. Migration rollback is not automated.
3. In **Vercel**, import the Next.js project at repository root **`./`** (same directory as `package.json`). Choose Node.js 24. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the Supabase project. Do not paste `service_role` or database passwords into any `NEXT_PUBLIC_` variable.
4. Deploy the scientific API in `science-service/` on a **separate container/compute host**, not as a Next.js page. Generate a strong random secret, configure `SCIENCE_SERVICE_SECRET` at both hosts, and set the Vercel server-only `SCIENCE_SERVICE_URL=https://your-secure-science-server` and `SCIENCE_SERVICE_SECRET`. Follow `docs/DEPLOYMENT.md` for Docker examples, connectivity, and security.
5. Open HelixLab, sign in, then choose **System readiness** in the sidebar. This reports which scientific packages are installed; it does not certify scientific validity. Test an entire user workflow with two different email accounts before inviting other people.

If Vercel cannot compile, inspect **Vercel → Deployment → Build Logs** and **GitHub → Actions → HelixLab checks**. The repository was re-audited in an environment without npm registry access, so the complete `npm install` + Next production build could **not** be confirmed locally. Do not treat module syntax tests as production-build verification.

### Environment variables

| Variable | Host | Secret? | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel | No | Public project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Vercel | No | Browser-safe publishable key |
| `SCIENCE_SERVICE_URL` | Vercel | Server-only configuration | HTTPS address of your Python API |
| `SCIENCE_SERVICE_SECRET` | Vercel and Python API | **Yes** | Same unpredictable secret; at least 24 characters |

Never commit `.env.local`, private research inputs, access tokens or backend secrets to GitHub. `.env.example` includes variable **names only**.

## Actual feature status

| Feature | Code included? | Verified evidence |
|---|---|---|
| Original circular plasmid viewer | Yes | Preserved OpenLab source; production browser test pending |
| DNA validation, simple FASTA/GenBank, translation and restriction motifs | Yes | JavaScript reference tests passed; unsupported GenBank metadata warns |
| Private original sequence upload and SHA-256 metadata | Yes | Application/SQL implementation; live Supabase testing pending |
| Five display profiles per email | Yes | Database profile-slot limits; not independent identities |
| Multi-account laboratory collaboration | Yes | Database owner/editor/viewer roles; live security testing pending |
| Plain-text linked electronic notebook | Yes | Full rich-text ELN, simultaneous edits and embedded objects not implemented |
| Ketcher molecular drawing | Yes, via upstream package | npm/production/browser build not verified |
| Mol* PDB/mmCIF visualization | Yes, via upstream package | npm/WebGL browser test not verified |
| RDKit molecular properties | Yes | Python reference tests passed |
| Ligand-based 3D pharmacophore | Partial | Real RDKit computational tests; one-conformer scaffold-alignment hypothesis only |
| Structure-based pharmacophore | Partial | Real coordinate proximity computation; **not** validated interaction geometry |
| Primer3 PCR design | Yes | API and input tests passed; Primer3 engine test skipped locally |
| AutoDock Vina | Yes | API and input checks passed; Vina engine unavailable locally |
| Scientific service status | Yes (new v0.8) | Python tests passed, live service check pending |
| Commercial/publication certification | No | Independent validation, security pen test and live acceptance testing required |

A frontend library import or passing a molecular example **is not evidence of clinical accuracy or publication certification**. See `docs/RELEASE_GATES.md` and `docs/SCIENTIFIC_VALIDATION.md`.

## Code organization

```
src/app/                  Next.js routes (authenticated scientific proxy)
src/components/           Modular research tools and reusable UI
src/lib/                  Type-safe DNA, import/export, Supabase, request limits
src/styles/               Original OpenLab UI files, separated for maintainability
science-service/          Docker-ready FastAPI, Biopython, RDKit, Primer3/Vina adapters
science-service/tests/    Python scientific reference and security tests
supabase/migrations/      Account/workspace schema, RLS, atomic import, quotas
scripts/                  Source audits and upstream-asset copy script
tests/                    Actual TypeScript module tests, including streamed JSON limits
.github/workflows/        CI build and scientific test jobs
.github/dependabot.yml    Dependency update monitoring
```

## Local development

```bash
# Use Node 24.20+ for the upstream Ketcher version.
cp .env.example .env.local            # fill in values on your own machine
npm install --no-audit --no-fund
npm run dev
npm run verify

# In a separate environment with Python 3.12:
cd science-service
python -m venv .venv
source .venv/bin/activate             # Windows: .venv\Scripts\activate
pip install -r requirements.txt
SCIENCE_SERVICE_SECRET='a-strong-random-secret' uvicorn main:app --host 127.0.0.1 --port 8000
pytest -q tests
```

Dependency versions are specified in the manifest, but **the lockfile could not be generated** with registry access blocked. On a connected development computer run `npm install`, verify the production build, and commit `package-lock.json`. Run `npm run check:lockfile` before announcing a reproducible stable release. Python production dependencies should also be fully locked and supply-chain audited by a maintainer before commercial hosting.

## Scientific / security boundaries

- A five-profile login offers personalization, **not five private student accounts**. Use distinct Supabase logins for independently attributable group research.
- Database RLS and private buckets are only part of security. Backups, deletion/retention policy, incident handling, abuse monitoring, recovery, access reviews, external penetration tests, and audit trails must still be validated.
- Uploaded GenBank originals are retained unchanged, but complex feature metadata is **not** fully represented in the frontend. The importer refuses some compound locations and warns when fields cannot round-trip.
- SBDD results are candidate proximity features, not chemically validated H-bonds. Docking scores and ligand-based pharmacophore hypotheses are **predictions**.
- Vina is synchronous and resource-intensive here; a worker queue with quotas/cancellation/monitoring is needed before scaling publicly.
- Check redistribution and service licensing, user privacy obligations, and Vercel plan terms before commercial operation. Vercel Hobby is for non-commercial personal use only.

**Next step: complete every blocking item in `docs/RELEASE_GATES.md` on a real staging deployment before accepting unpublished student research.**

## v0.8.1 deployment-audit notes

- Existing Supabase users created before initial SQL migrations are initialized by the new backfill migration. It is idempotent. Do not rerun earlier `CREATE TABLE` migrations against an already-initialized database.
- Edits to imported GenBank sequences now retain available import warnings; original uploaded files remain the source of truth.
- Node 24.x is supported by Vercel; the selected Ketcher version requires a recent Node 24 patch. Select Node.js 24.x in the Vercel project.
- The repository currently **has no package-lock.json** because npm package downloads were unavailable in the audit environment. This prevents a reproducible `npm ci` release. Do not invent a lockfile; generate and commit one using `npm install` in a connected environment after a successful build.
- Full `npm install`, semantic TypeScript checking, `next build`, production browser checks and staging RLS tests remain **UNVERIFIED** and cannot be guaranteed by source inspection.
- Read `docs/DEPLOYMENT_AUDIT_v0.8.1.md` before importing the project into Vercel.

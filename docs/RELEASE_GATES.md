# Release-readiness checklist — v0.8.1

This checklist is intentionally strict. A check marked **UNVERIFIED** is a release blocker, even if the corresponding source code exists. Avoid unsupported claims of "100% mature" or "publication certified".

| Area | Gate | Evidence to collect | Status in packaging environment |
|---|---|---|---|
| JavaScript science core | Import/export, IUPAC, digestion, basic translation | `node --test tests/*.test.mjs` | PASS (13) |
| Python science core | RDKit/Biopython, model limits, auth | `python -m pytest science-service/tests -q` | PASS (24), 1 SKIP |
| File structure | <=250 lines/source, local references, no obvious committed keys | `node scripts/audit.mjs` | PASS |
| TypeScript syntax | TS/TSX parser | `node scripts/syntax-audit.mjs` | PASS |
| TypeScript semantic compilation | All third-party module types resolved | `npm run typecheck` with dependencies | UNVERIFIED |
| Vercel production compile | Complete Next.js optimized build | `npm run build` on Vercel/CI | UNVERIFIED |
| Ketcher molecule drawing | Real browser SMILES/MOL import, edits, save/export | Chromium or human acceptance test | UNVERIFIED |
| Mol* viewer | PDB/mmCIF load, rotate, select, dispose | Actual WebGL browser test | UNVERIFIED |
| Supabase permissions | Owner/editor/viewer/outsider, revoked membership, storage | Staging RLS tests with distinct identities | UNVERIFIED |
| File integrity | Exact original bytes/digests and archive/download | Round-trip QA across FASTA/GenBank | UNVERIFIED in cloud |
| Primer3 | Design against reference templates and known results | End-to-end with installed binary | UNVERIFIED, missing locally |
| Docking | Re-dock structural benchmarks, RMSD and worker limits | Actual Vina runs and accuracy report | UNVERIFIED, missing locally |
| SBDD pharmacophores | Hydrogen-bond geometry, protonation, interaction benchmark | Validated experimental complex test set | NOT IMPLEMENTED |
| LBDD pharmacophores | Multiple conformers/alignments, held-out actives/inactives | Reproducible external benchmark | NOT IMPLEMENTED |
| Publication packs | Full per-analysis provenance, frozen versions, reference metadata | Independent reproducibility audit | PARTIAL |
| Operational reliability | Backups/restores, monitoring, alerting, incident response | Staging disaster-recovery rehearsal | UNVERIFIED |
| Security assurance | Threat model, DAST, dependency scan, penetration test | External security review | UNVERIFIED |
| Commercial licensing | License matrix for all components/compute providers | Legal/maintainer sign-off | UNVERIFIED |
| Commercial hosting | Vercel plan compatible with commercial use | Billing/terms review | UNVERIFIED |

**Release recommendation:** private engineering preview using non-confidential data only. Do not call this production-ready, publication-validated, or major-platform competitive until the gates pass.

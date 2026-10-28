# v0.8 scientific feature matrix

**Implemented** = code calls a real engine. **Unit-tested** = covered by local examples. **Deployment-tested** requires an actual working Vercel/Supabase/Python installation. No test level guarantees publication accuracy.

| Area | Implementation | Test/limitation |
|---|---|---|
| OpenLab plasmid map | Original circular/linear React viewer retained | Live browser interaction pending |
| Sequence core | IUPAC validation, reverse complement, GC, restriction, standard translation | Unit-tested; limited restriction database |
| FASTA/GenBank | Multi-FASTA, simple annotated GenBank, byte-preserving archive | Unit-tested; complex GenBank locations rejected; unsupported metadata warned |
| ELN | Plain-text notebooks linked to UUID records | No rich text or object embedding yet |
| Account profiles | Five persona slots per lab, one Supabase email | Roles remain account-based, not persona-based |
| Collaboration | Owner/editor/viewer, invitations, row-level security | Live cross-account RLS test required |
| Ketcher | Official upstream React and standalone components | Browser and production build unverified |
| Mol* | Official 3D viewer PDB/mmCIF import | Browser/WebGL test unverified |
| RDKit | Server-side real molecular descriptors | Local Python tests passed |
| Primer3 | Official primer3-py pairing and settings output | Optional module unavailable locally, runtime test skipped |
| SBDD | RDKit ligand 3D features / protein contact proximity | Candidate proximity features only, NOT true validated interaction pharmacophore |
| LBDD | One-conformer shared-scaffold alignment and clustering | Local example passes; not a validated screening model |
| Vina | Prepared PDBQT API and computation invocation | Engine unavailable locally; no verified redocking or queue |
| Scientific health | Protected capability endpoint and visible system status | Engine presence measured; no implied validation |
| Rate limiting | Atomic Supabase quotas for scientific requests | SQL requires live staging test |
| Data provenance | Original SHA256 metadata, record revisions and warnings | Full publication-grade evidence bundle absent |

For release blockers see `RELEASE_GATES.md`.

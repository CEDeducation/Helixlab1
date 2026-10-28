# Deployment and security operations

## A. GitHub and Next.js frontend

1. Extract the source ZIP and copy its contents to the root of your repository. Prefer GitHub Desktop / `git` for folder uploads and avoid uploading the ZIP as a single repository file.
2. Protect your main branch, require GitHub Actions checks, enable Dependabot alerts and secret scanning where available.
3. In Vercel, import as one **Next.js** project with **Root Directory `./`**, not `science-service`.
4. Select **Node 24** with a sufficiently recent patch for Ketcher. Keep `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in Vercel env vars.
5. Inspect logs, and stop if `npm install`, `tsc` or `next build` fails. Importing source alone is not a successful deployment.

## B. Supabase

- Create a **staging project** before touching a populated research database. Run all new-install migrations (five files) in sorted order. On v0.7.1 apply only migrations not already installed (the quota migration plus the v0.8.1 existing-user backfill, if missing).
- Configure allowed authentication callback URLs for your exact Vercel domain, verify email confirmation, and configure MFA/recovery for account owners.
- Verify RLS behavior for users A (owner), B (editor), C (viewer), and D (outsider) using separate accounts.
- Confirm original file objects remain unreadable after group-membership revocation. Keep the bucket **private**.
- The new `consume_science_quota` function is required for all scientific proxy calls. Without it, the API fails closed.
- Schedule deletion of old `science_quotas` rows, database backups, restore drills, and operational monitoring.

## C. Scientific service container

On a host that allows Python numerical libraries and controlled CPU workloads:

```bash
cd science-service
docker build -t helixlab-science:0.8.1 .
docker run --read-only --tmpfs /tmp:rw,noexec,nosuid,size=512m \
  --memory=2g --cpus=2 --pids-limit=128 \
  -e SCIENCE_SERVICE_SECRET="<random-secret-from-secret-manager>" \
  -p 127.0.0.1:8000:8000 helixlab-science:0.8.1
```

Use a reputable edge reverse proxy with TLS, authentication, IP restrictions if feasible, request-size enforcement, metrics, and resource limits. Do **not** expose the Python service directly to all Internet users. Only the Vercel server should attach the shared secret. The exact Docker resource limits need load testing; Vina can use substantial CPU and memory.

In Vercel, configure `SCIENCE_SERVICE_URL` with **HTTPS** and `SCIENCE_SERVICE_SECRET` server-only. `http://localhost` is accepted only for local development. `/v1/capabilities` reports installed engines but does not run scientific acceptance tests.

## D. Manual acceptance test with non-sensitive data

1. New signup → verify email → choose one of five profiles.
2. Create sequence → save → refresh page → reopen → FASTA export → compare exact sequence.
3. Import a multi-FASTA → compare original file hash, count and each sequence.
4. Import a GenBank file with extra qualifiers → confirm visible metadata warnings; compare archived original.
5. Invite verified email B as editor → accept → switch workspace; verify edits. As viewer C, writing must be blocked. D must see no data.
6. Revoke access to B using a privileged administrative workflow; verify stored file access also stops.
7. Import a real chemical structure with Ketcher → transfer SMILES → compute RDKit descriptors → export MOL.
8. Open a PDB and mmCIF in Mol*; rotate/zoom and switch files repeatedly without crashing.
9. Run Primer3 and compare with its reference inputs; do not infer genome-wide specificity.
10. Prepare docking files externally and test Vina on reference co-crystal examples; report RMSD, versions, seeds, settings.
11. Check the **System readiness** screen and verify unavailable engines are reported accurately.
12. Test quotas, expired sessions, broken uploads, malicious input, cross-workspace access, backup/restore, and network failures.

Any failing test blocks public launch. Document defect tickets with exact input, expected/actual result, deployment logs, and package versions.

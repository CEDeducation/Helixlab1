# Vercel deployment fix — HelixLab v0.7.1

## Reproduced failure report from v0.7

```
./node_modules/paper/dist/node/canvas.js
Module not found: Can't resolve 'jsdom/lib/jsdom/living/generated/utils'
Import trace: paper -> ketcher-react -> KetcherCanvas
```

The `paper` package ships Node.js shims that should not be included in
browser code. Ketcher indirectly imports Paper.js. The fixed Next.js webpack
configuration explicitly excludes its Node-only canvas/jsdom shims. Ketcher
remains loaded only on the Chemistry page using a client-only dynamic import.
This workaround is related to upstream Paper.js issue #2050:
https://github.com/paperjs/paper.js/issues/2050

**Important:** This fix has been statically checked but NOT proven by a complete
`next build` in this sandbox: npm registry DNS failed (`EAI_AGAIN`). The GitHub
Actions workflow runs a real production build once you push this version. If it
fails, send the complete first error block, not just the final red line.

## Other fixes

- Multi-record FASTA/GenBank imports now use a single PostgreSQL transaction
  through `import_sequence_batch`, after the original file is securely uploaded.
  A failing transaction creates no partially imported records; an unattached
  object is deleted on a best-effort basis.
- Upload paths must reference a laboratory the authenticated user can edit.
- Docking grid coordinates reject NaN and infinity before Vina runs.
- A failed Ketcher or Mol* render no longer has to crash the entire workspace.
- Extended unit tests, JS syntax audit and a CI production-build gate.

## Vercel settings

| Setting | Value |
|---|---|
| Project | `helixlab` (or another unique name) |
| Framework | Next.js |
| Root Directory | `/` (repo root, where `package.json` lives) |
| Build Command | `npm run build` |
| Install Command | `npm install` |
| Node.js | Version 24 (select in Vercel project settings) |

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
Do NOT set a service-role key in a `NEXT_PUBLIC_` variable.

In Supabase SQL Editor, install the migrations in `supabase/migrations/` in
filename order. If you already installed v0.7 migrations, apply **only**
`202610210003_atomic_import.sql`. Do not rerun `202610210001_schema.sql`.

## What a successful launch does NOT mean

Even a successful build does not prove that all libraries work in the browser,
that every chemical computation is accurate, or that group access controls are
secure. Run E2E browser, Supabase RLS, and engine-specific scientific checks
before allowing pre-publication data.

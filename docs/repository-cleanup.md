# Repository cleanup

The repository contains old deployment helpers, Cloudflare package artifacts, extracted binaries, backups, logs, and generated data that should not be part of the application source or Vercel deployment.

Run the cleanup locally from the repository root:

```bash
node scripts/clean-repo-artifacts.mjs --dry-run
node scripts/clean-repo-artifacts.mjs --apply
git diff --cached --stat
git commit -m "chore: remove obsolete deployment artifacts"
git push origin phase-1-stabilization
```

The cleanup script only stages known obsolete artifacts. Review the staged deletion list before committing. It does not remove `.env` files, live databases, uploads, or other untracked local data.

Keep runtime source, Prisma schema/migrations, public assets, mobile deployment metadata, and operational scripts that are actively used. Store production database backups outside Git, in encrypted object storage with restricted access and a tested restore procedure.

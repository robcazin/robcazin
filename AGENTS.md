<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Deploy

This site deploys to Vercel automatically via Git integration:

1. **Push/PR to a branch** → automatic preview deploy
2. **Merge to `main`** → automatic production deploy to `robcazin.com`

No `vercel` CLI required. See [docs/VERCEL-WORKFLOW.md](docs/VERCEL-WORKFLOW.md) for full details.

**Key facts**:
- Vercel project: `robcazin` on team **scancat**
- Root directory: `.` (repo root, not a subdirectory)
- Edit content in `content/collections/*.json`, media in `public/audio/<collection>/`

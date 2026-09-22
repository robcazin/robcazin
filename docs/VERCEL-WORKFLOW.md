# Vercel Deploy Workflow

## Project Setup

**Repository**: `robcazin/robcazin` on GitHub  
**Vercel Project**: `robcazin` on team **scancat**  
**Project ID**: `prj_G1wbGtJ2FmVNqB6hvXS3CP73zHQx`  
**Root Directory**: `.` (repo root — NOT a nested `site/` folder)

**Domains**:
- Production: `robcazin.com`
- Preview: `robcazin.vercel.app`
- Team: `robcazin-scancat.vercel.app`
- Git branch: `robcazin-git-main-scancat.vercel.app`

**Local Checkout** (Mac Studio): `/Volumes/K3/jobs/robcazin/site`

## Editing Content

1. **Edit collections**: Modify JSON files in `content/collections/*.json`
2. **Add media**: 
   - Audio files go in `public/audio/<collection>/`
   - Video paths follow existing structure
   - Large looping videos may stay local-only (excluded from git)

## Deploy Workflow

**No `vercel` CLI required.** Vercel Git integration handles all deployments automatically.

### Preview Deploy (feature branches)

1. Create a branch and make changes
2. Commit and push to GitHub
3. Open a pull request
4. **Vercel automatically deploys a preview** with a unique URL

### Production Deploy

1. Merge the PR to `main` branch
2. **Vercel automatically deploys to production** at `robcazin.com`

That's it. Push to branch → preview. Merge to main → production.

## Important Notes

- **Do NOT transfer the project off the scancat team**
- The Vercel root directory is `.` (repo root), not a subdirectory
- No manual `vercel deploy` commands needed
- Git integration handles everything automatically

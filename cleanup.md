# Cleanup Tasks

Since we've consolidated the GitHub workflows, the following file should be removed:

- `.github/workflows/build-deploy.yml`

This file is now redundant because:

1. We're using the official GitHub Pages workflow in `github-pages.yml`
2. The `build-deploy.yml` file uses a third-party action that does the same thing
3. Having multiple deployment workflows could cause conflicts

## Manual Removal

You can remove the file with:

```bash
rm .github/workflows/build-deploy.yml
``` 
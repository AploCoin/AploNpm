# Release Process

This document describes how to release new versions of AploNpm to NPM.

## Prerequisites

### GitHub Secrets

The following secrets must be configured in your GitHub repository:

1. **NPM_TOKEN** (Required)
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Classic Token"
   - Select "Automation" type (for CI/CD)
   - Copy the token
   - In GitHub: Settings → Secrets and variables → Actions → New repository secret
   - Name: `NPM_TOKEN`
   - Value: paste your token

2. **GITHUB_TOKEN** (Automatic)
   - Automatically provided by GitHub Actions
   - No manual configuration needed

### NPM Account Setup

1. Create an NPM account at https://www.npmjs.com/signup
2. Verify your email address
3. Enable 2FA (recommended but not required for automation tokens)
4. Join the `@aplocoin` organization or create it if needed

### Repository Permissions

The publish workflow requires these permissions:
- `contents: read` - Read repository code
- `id-token: write` - Generate provenance attestations

These are configured in `.github/workflows/publish.yml`.

## Release Methods

### Method 1: Tag-based Release (Recommended)

This is the safest and most traceable method.

1. **Update version in package.json**
   ```bash
   npm version patch  # 0.1.0 → 0.1.1
   # or
   npm version minor  # 0.1.0 → 0.2.0
   # or
   npm version major  # 0.1.0 → 1.0.0
   ```

2. **Push the tag**
   ```bash
   git push origin main --tags
   ```

3. **GitHub Actions automatically:**
   - Runs all tests
   - Builds the package
   - Publishes to NPM
   - Creates a GitHub Release

### Method 2: Manual Workflow Dispatch

For more control over the release process.

1. Go to GitHub Actions → "Publish to NPM" workflow
2. Click "Run workflow"
3. Fill in:
   - **Version**: e.g., `1.0.0` (without 'v' prefix)
   - **Tag**: `latest`, `beta`, `next`, or `alpha`
4. Click "Run workflow"

This method is useful for:
- Publishing pre-release versions
- Re-publishing a specific version
- Publishing without creating a git tag

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

### Pre-release Versions

- **Alpha**: `1.0.0-alpha.1` - Early testing, unstable
- **Beta**: `1.0.0-beta.1` - Feature complete, testing
- **RC**: `1.0.0-rc.1` - Release candidate, final testing

Examples:
```bash
npm version 1.0.0-alpha.1
npm version 1.0.0-beta.1
npm version 1.0.0-rc.1
npm version 1.0.0  # Stable release
```

## NPM Dist Tags

Dist tags control which version users get with `npm install`:

- **latest** (default): Stable releases
- **beta**: Beta versions for testing
- **next**: Release candidates
- **alpha**: Early alpha versions

The workflow automatically determines the tag based on version:
- `1.0.0` → `latest`
- `1.0.0-beta.1` → `beta`
- `1.0.0-rc.1` → `next`
- `1.0.0-alpha.1` → `alpha`

Users can install specific tags:
```bash
npm install @aplocoin/aplonpm@latest
npm install @aplocoin/aplonpm@beta
npm install @aplocoin/aplonpm@next
```

## NPM Provenance

The workflow uses `--provenance` flag to generate attestations:

- Links the published package to the source code
- Verifies the package was built in GitHub Actions
- Provides transparency and security
- Visible on the NPM package page

Requirements:
- `id-token: write` permission (configured in workflow)
- Public repository (or NPM Pro account)

## Release Checklist

Before releasing:

- [ ] All tests pass locally: `pnpm test`
- [ ] Type check passes: `pnpm run typecheck`
- [ ] Build succeeds: `pnpm run build`
- [ ] Version updated in package.json
- [ ] CHANGELOG.md updated (if exists)
- [ ] Examples tested
- [ ] Documentation updated
- [ ] No uncommitted changes

## Troubleshooting

### "npm ERR! 403 Forbidden"

**Cause**: Invalid or expired NPM_TOKEN

**Solution**:
1. Generate a new token at https://www.npmjs.com/settings/tokens
2. Update the `NPM_TOKEN` secret in GitHub
3. Re-run the workflow

### "npm ERR! You cannot publish over the previously published versions"

**Cause**: Version already exists on NPM

**Solution**:
1. Bump the version: `npm version patch`
2. Push the new tag: `git push --tags`

### "Permission denied to publish"

**Cause**: Not a member of @aplocoin organization

**Solution**:
1. Ask an organization admin to invite you
2. Accept the invitation at https://www.npmjs.com/settings/YOUR_USERNAME/teams
3. Ensure you have publish permissions

### Provenance generation fails

**Cause**: Missing `id-token: write` permission or private repo

**Solution**:
- Check workflow permissions in `.github/workflows/publish.yml`
- For private repos, upgrade to NPM Pro or remove `--provenance` flag

## Manual Publishing (Emergency)

If GitHub Actions is unavailable:

```bash
# 1. Ensure you're on main branch
git checkout main
git pull

# 2. Update version
npm version patch

# 3. Build
pnpm install
pnpm test
pnpm run build

# 4. Publish
npm login
pnpm publish --access public

# 5. Push tag
git push --tags
```

## Post-Release

After a successful release:

1. Verify on NPM: https://www.npmjs.com/package/@aplocoin/aplonpm
2. Test installation: `npm install @aplocoin/aplonpm@latest`
3. Update documentation if needed
4. Announce the release (Discord, Twitter, etc.)

## Rollback

If a release has critical issues:

1. **Deprecate the bad version**:
   ```bash
   npm deprecate @aplocoin/aplonpm@1.0.1 "Critical bug, use 1.0.2 instead"
   ```

2. **Publish a patch**:
   ```bash
   npm version patch
   git push --tags
   ```

3. **Never unpublish** (NPM policy):
   - Unpublishing is only allowed within 72 hours
   - Breaks dependent projects
   - Use deprecation instead

## Security

- **Never commit NPM tokens** to the repository
- Use GitHub Secrets for all credentials
- Enable 2FA on your NPM account
- Regularly rotate NPM tokens (every 90 days)
- Review publish logs for anomalies

## Resources

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [NPM Provenance](https://docs.npmjs.com/generating-provenance-statements)

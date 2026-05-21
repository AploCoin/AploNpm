# GitHub and NPM Setup Instructions

This document provides step-by-step instructions for configuring GitHub Actions and NPM publishing for AploNpm.

## Required Setup Steps

### 1. NPM Account and Token

#### Create NPM Account
1. Go to https://www.npmjs.com/signup
2. Create an account or sign in
3. Verify your email address

#### Generate NPM Token
1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token" → "Classic Token"
3. Select **"Automation"** type (required for CI/CD)
4. Give it a name: `AploNpm GitHub Actions`
5. Click "Generate Token"
6. **Copy the token immediately** (you won't see it again)

#### Join or Create @aplocoin Organization
1. If the organization exists, ask an admin to invite you
2. If creating new:
   - Go to https://www.npmjs.com/org/create
   - Name: `aplocoin`
   - Make it public (free)
3. Ensure you have **publish permissions** in the organization

### 2. GitHub Repository Secrets

#### Add NPM_TOKEN Secret
1. Go to your GitHub repository: https://github.com/AploCoin/AploNpm
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `NPM_TOKEN`
5. Value: Paste the NPM token from step 1
6. Click **"Add secret"**

#### Verify GITHUB_TOKEN (Automatic)
- `GITHUB_TOKEN` is automatically provided by GitHub Actions
- No manual configuration needed
- Used for creating GitHub Releases

### 3. Repository Permissions

#### Enable GitHub Actions
1. Go to **Settings** → **Actions** → **General**
2. Under "Actions permissions", select:
   - ✅ "Allow all actions and reusable workflows"
3. Under "Workflow permissions", select:
   - ✅ "Read and write permissions"
   - ✅ "Allow GitHub Actions to create and approve pull requests"
4. Click **"Save"**

#### Enable GitHub Pages (Optional)
If you want to host documentation:
1. Go to **Settings** → **Pages**
2. Source: Deploy from a branch
3. Branch: `main` / `docs` (if you create one)

### 4. NPM Package Scope

#### Verify Package Name
The package is scoped to `@aplocoin/aplonpm`:
- Scope: `@aplocoin`
- Package: `aplonpm`

#### First-Time Publishing
The first publish must be done manually or the organization must exist:

```bash
# Option A: Manual first publish (recommended)
npm login
pnpm publish --access public

# Option B: Use GitHub Actions workflow_dispatch
# (requires organization to exist first)
```

After the first publish, GitHub Actions can handle all subsequent releases.

### 5. Workflow Configuration Verification

#### CI Workflow (.github/workflows/ci.yml)
- ✅ Runs on push to `main` and `develop`
- ✅ Runs on all pull requests
- ✅ Tests on Node.js 18.x, 20.x, 22.x
- ✅ Runs typecheck, lint, test, build
- ✅ Verifies package can be packed

#### Publish Workflow (.github/workflows/publish.yml)
- ✅ Triggers on version tags (`v1.0.0`, `v1.2.3`, etc.)
- ✅ Supports manual workflow_dispatch
- ✅ Requires `NPM_TOKEN` secret
- ✅ Uses npm provenance (requires `id-token: write`)
- ✅ Creates GitHub Releases automatically

## Testing the Setup

### Test CI Workflow
1. Make a small change (e.g., update README.md)
2. Commit and push to a branch
3. Create a pull request
4. Verify CI runs and passes
5. Check: https://github.com/AploCoin/AploNpm/actions

### Test Publish Workflow (Dry Run)
Before publishing to NPM, test the workflow:

```bash
# 1. Create a test tag locally (don't push yet)
git tag v0.1.0-test

# 2. Check what would be published
pnpm pack --dry-run

# 3. Remove test tag
git tag -d v0.1.0-test
```

### First Real Publish
When ready to publish:

```bash
# 1. Update version in package.json
npm version 0.1.0

# 2. Push the tag
git push origin main --tags

# 3. GitHub Actions will automatically:
#    - Run all tests
#    - Build the package
#    - Publish to NPM
#    - Create a GitHub Release

# 4. Verify on NPM
# https://www.npmjs.com/package/@aplocoin/aplonpm
```

## Troubleshooting

### "npm ERR! 403 Forbidden"
**Problem**: NPM_TOKEN is invalid or expired

**Solution**:
1. Generate a new token at https://www.npmjs.com/settings/tokens
2. Update the `NPM_TOKEN` secret in GitHub
3. Ensure token type is "Automation"
4. Verify you have publish permissions in @aplocoin org

### "npm ERR! You do not have permission to publish"
**Problem**: Not a member of @aplocoin organization

**Solution**:
1. Ask organization admin to invite you
2. Accept invitation at https://www.npmjs.com/settings/YOUR_USERNAME/teams
3. Verify you have "publish" role (not just "read")

### "npm ERR! Package name too similar to existing package"
**Problem**: Package name conflict

**Solution**:
- The package name `@aplocoin/aplonpm` should be unique
- If taken, choose a different name in package.json
- Update all documentation references

### Workflow doesn't trigger
**Problem**: GitHub Actions not enabled or permissions issue

**Solution**:
1. Check Settings → Actions → General
2. Ensure "Allow all actions" is selected
3. Ensure "Read and write permissions" is enabled
4. Check branch protection rules don't block Actions

### Provenance generation fails
**Problem**: Missing permissions or private repository

**Solution**:
1. Verify `id-token: write` is in workflow (already configured)
2. For private repos, upgrade to NPM Pro or remove `--provenance` flag
3. Check: https://docs.npmjs.com/generating-provenance-statements

## Security Checklist

- [ ] NPM_TOKEN is stored as a GitHub Secret (not in code)
- [ ] NPM token type is "Automation" (not "Publish")
- [ ] 2FA is enabled on NPM account (recommended)
- [ ] GitHub Actions has minimal required permissions
- [ ] No secrets are logged in workflow outputs
- [ ] Token is rotated every 90 days (set a reminder)

## Post-Setup Verification

After completing setup:

1. **CI Badge**: Add to README.md (already done)
   ```markdown
   [![CI](https://github.com/AploCoin/AploNpm/actions/workflows/ci.yml/badge.svg)](https://github.com/AploCoin/AploNpm/actions/workflows/ci.yml)
   ```

2. **NPM Badge**: Verify it works after first publish
   ```markdown
   [![npm version](https://badge.fury.io/js/@aplocoin%2Faplonpm.svg)](https://www.npmjs.com/package/@aplocoin/aplonpm)
   ```

3. **Test Installation**: After first publish
   ```bash
   npm install @aplocoin/aplonpm
   node -e "console.log(require('@aplocoin/aplonpm').VERSION)"
   ```

## Maintenance

### Regular Tasks
- **Monthly**: Review workflow runs for failures
- **Quarterly**: Rotate NPM_TOKEN
- **Per Release**: Update CHANGELOG.md (if you create one)
- **Per Release**: Test examples with new version

### Monitoring
- GitHub Actions: https://github.com/AploCoin/AploNpm/actions
- NPM Package: https://www.npmjs.com/package/@aplocoin/aplonpm
- NPM Downloads: https://npm-stat.com/charts.html?package=@aplocoin/aplonpm

## Resources

- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [NPM Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [Semantic Versioning](https://semver.org/)
- [RELEASE.md](./RELEASE.md) - Detailed release process

## Support

If you encounter issues:
1. Check this document first
2. Review [RELEASE.md](./RELEASE.md)
3. Check GitHub Actions logs
4. Open an issue with:
   - What you tried
   - Error messages
   - Workflow run URL

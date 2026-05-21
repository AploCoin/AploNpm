# AploNpm Publication Instructions

## Current Status

**Branch**: `feat/aplonpm-typescript-sdk` (created locally)
**Latest Commit**: `d6cc557` - fix: resolve eslint issues and add missing @eslint/js dependency
**Git Identity**: ArtemkaDev <87724011+ArtemkaDev@users.noreply.github.com> ✓
**Working Tree**: Clean ✓
**Review Status**: APPROVED (task t_c822901c) ✓
**Tests**: 99/99 passing ✓
**Build**: Successful ✓

## Step 1: GitHub Authentication Setup

The repository requires GitHub authentication to push. Choose one of these methods:

### Option A: Personal Access Token (Recommended)

1. Generate a GitHub Personal Access Token:
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Required scopes:
     - `repo` (Full control of private repositories)
     - `workflow` (Update GitHub Action workflows)
   - Copy the token

2. Configure git credential helper:
   ```bash
   cd /home/hermes/projects/aplosdk/aplonpm
   
   # Store token in git credentials
   git config credential.helper store
   
   # Push will prompt for username/token once, then cache it
   git push -u origin feat/aplonpm-typescript-sdk
   # Username: ArtemkaDev
   # Password: <paste your token>
   ```

### Option B: SSH Key

1. Generate SSH key if not exists:
   ```bash
   ssh-keygen -t ed25519 -C "87724011+ArtemkaDev@users.noreply.github.com"
   ```

2. Add to GitHub:
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to https://github.com/settings/keys
   - Click "New SSH key" and paste

3. Switch remote to SSH:
   ```bash
   cd /home/hermes/projects/aplosdk/aplonpm
   git remote set-url origin git@github.com:AploCoin/AploNpm.git
   git push -u origin feat/aplonpm-typescript-sdk
   ```

## Step 2: Push to GitHub

Once authentication is configured:

```bash
cd /home/hermes/projects/aplosdk/aplonpm
git push -u origin feat/aplonpm-typescript-sdk
```

Expected output:
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
...
To https://github.com/AploCoin/AploNpm.git
 * [new branch]      feat/aplonpm-typescript-sdk -> feat/aplonpm-typescript-sdk
```

## Step 3: Create Pull Request

### Option A: Using GitHub CLI (if available)

```bash
gh pr create \
  --title "feat: TypeScript SDK for Aplo blockchain" \
  --body "$(cat <<'EOF'
## Summary

Complete TypeScript SDK for Aplo blockchain with mining, staking, and browser wallet support.

## Features

- ✅ Core blockchain client (balance, transactions, gas estimation)
- ✅ Staking client (stake, unstake, multipliers)
- ✅ Mining client (PoW with difficulty adjustment)
- ✅ Browser wallet adapters (MetaMask, WalletConnect, etc.)
- ✅ Dual ESM/CJS builds with TypeScript definitions
- ✅ 99 passing tests with 100% core coverage
- ✅ Comprehensive documentation and examples

## Test Results

- **Total Tests**: 99/99 passing
- **Test Files**: 8
- **Build**: ✓ ESM + CJS + DTS
- **Lint**: ✓ 0 errors, 3 acceptable warnings
- **TypeCheck**: ✓ Strict mode

## Documentation

- README.md - Quick start and API overview
- EXAMPLES.md - Node.js backend examples
- USAGE_BROWSER_WALLET.md - Browser integration guide
- SETUP.md - Development setup
- RELEASE.md - Publication workflow

## Contract Addresses (verified against WebMiner)

- Mining: `0x0000000000000000000000000000000000001234`
- Staking: `0x0000000000000000000000000000000000001235`
- Min Stake: 1000 APLO

## Review

Review completed in task t_c822901c - all 11 gate criteria passed.

Closes #<issue_number_if_any>
EOF
)" \
  --base main
```

### Option B: Manual PR Creation

1. Visit: https://github.com/AploCoin/AploNpm/compare/main...feat/aplonpm-typescript-sdk

2. Click "Create pull request"

3. Use the PR body from Option A above

## Step 4: NPM Publication Setup

**DO NOT publish to npm yet.** The GitHub Actions workflow will handle publication automatically after PR merge.

### Required GitHub Secrets

Configure these in https://github.com/AploCoin/AploNpm/settings/secrets/actions:

1. **NPM_TOKEN** (Required)
   - Generate at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Token type: "Automation" (for CI/CD)
   - Scope: Read and Publish
   - Add as repository secret: `NPM_TOKEN`

### NPM Package Scope Setup

The package is configured as `@aplocoin/aplonpm`. Ensure:

1. **NPM Organization exists**: https://www.npmjs.com/org/aplocoin
   - If not, create it or change package name in `package.json`

2. **Package name is available**:
   ```bash
   npm view @aplocoin/aplonpm
   # Should return 404 if available
   ```

3. **Organization members have publish rights**:
   - Go to https://www.npmjs.com/settings/aplocoin/members
   - Ensure your account has "Developer" or "Owner" role

### GitHub Actions Workflow

The `.github/workflows/publish.yml` workflow will:

1. Trigger on:
   - Push to `main` branch (after PR merge)
   - Manual workflow dispatch

2. Determine version tag:
   - `latest` for stable releases (v1.0.0, v1.2.3)
   - `beta` for pre-releases (v1.0.0-beta.1)
   - `alpha` for alpha releases (v1.0.0-alpha.1)

3. Publish with provenance:
   - Attestation enabled for supply chain security
   - Provenance links package to GitHub commit

### Manual Publication (if needed)

If you need to publish manually instead of using GitHub Actions:

```bash
cd /home/hermes/projects/aplosdk/aplonpm

# Ensure you're on main branch with latest code
git checkout main
git pull origin main

# Login to npm (one-time)
npm login

# Publish with provenance
npm publish --access public --provenance

# Or for beta/alpha
npm publish --access public --tag beta --provenance
```

## Step 5: Post-Publication Verification

After the package is published:

1. **Verify on npm**:
   ```bash
   npm view @aplocoin/aplonpm
   ```

2. **Test installation**:
   ```bash
   mkdir /tmp/test-aplonpm
   cd /tmp/test-aplonpm
   npm init -y
   npm install @aplocoin/aplonpm
   node -e "const { AploClient } = require('@aplocoin/aplonpm'); console.log('✓ CJS works');"
   ```

3. **Test ESM import**:
   ```bash
   # In package.json, add: "type": "module"
   node -e "import('@aplocoin/aplonpm').then(m => console.log('✓ ESM works'));"
   ```

4. **Verify TypeScript definitions**:
   ```bash
   npx tsc --noEmit --esModuleInterop -e "import { AploClient } from '@aplocoin/aplonpm';"
   ```

## Troubleshooting

### Push fails with "Authentication failed"

- Verify token has `repo` and `workflow` scopes
- Check token hasn't expired
- Try SSH method instead

### PR creation fails with "403 Forbidden"

- Token needs `repo` scope (not just `public_repo`)
- For organization repos, token needs org access

### NPM publish fails with "403 Forbidden"

- Verify you're a member of @aplocoin organization
- Check NPM_TOKEN has "Automation" type with publish rights
- Ensure package name isn't already taken

### NPM publish fails with "Package name too similar"

- NPM may block names similar to popular packages
- Contact npm support or choose different name

### Provenance fails

- Requires GitHub Actions with `id-token: write` permission (already configured)
- Only works when publishing from GitHub Actions, not local machine

## Summary

**Current State**: All code ready, feature branch created locally, waiting for GitHub push

**Next Steps**:
1. Configure GitHub authentication (token or SSH)
2. Push branch: `git push -u origin feat/aplonpm-typescript-sdk`
3. Create PR to main
4. Configure NPM_TOKEN secret in GitHub
5. Merge PR → automatic npm publication via GitHub Actions

**Branch URL** (after push): https://github.com/AploCoin/AploNpm/tree/feat/aplonpm-typescript-sdk

**Compare URL** (after push): https://github.com/AploCoin/AploNpm/compare/main...feat/aplonpm-typescript-sdk

**Latest Commit**: d6cc557 (10 commits total on feature branch)

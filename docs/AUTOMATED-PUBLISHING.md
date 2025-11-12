# 🚀 Automated NPM Publishing with GitHub Actions

This guide explains how to set up and use the automated NPM publishing workflow for the Chilean Banks Audit Microservice.

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [Workflow Details](#workflow-details)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The automated publishing workflow (`npm-publish.yml`) automatically:

1. ✅ **Runs all tests** on Node 18.x and 20.x
2. ✅ **Builds the project** and verifies artifacts
3. ✅ **Publishes to NPM** with provenance attestation
4. ✅ **Creates a GitHub Release** with auto-generated changelog
5. ✅ **Provides detailed summaries** of the entire process

**Trigger**: Push a git tag starting with `v` (e.g., `v1.7.1`)

---

## 📦 Prerequisites

Before setting up automated publishing, ensure you have:

1. **NPM Account** with publishing permissions
2. **GitHub Repository** with admin access
3. **Node.js** 18.x or higher installed locally
4. **Git** configured with your GitHub account

---

## 🔧 Setup Instructions

### Step 1: Generate NPM Access Token

1. **Login to NPM**:
   ```bash
   npm login
   ```

2. **Go to NPM Account Settings**:
   - Visit https://www.npmjs.com/settings/[your-username]/tokens
   - Or navigate: Profile → Access Tokens

3. **Generate New Token**:
   - Click "Generate New Token"
   - Select **"Automation"** token type (recommended for CI/CD)
   - Set expiration (or choose "No Expiration" for persistent automation)
   - Click "Generate Token"

4. **Copy the Token**:
   - ⚠️ **IMPORTANT**: Save the token immediately - you won't see it again!
   - Format: `npm_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### Step 2: Add NPM Token to GitHub Secrets

1. **Navigate to Repository Settings**:
   - Go to your GitHub repository
   - Click **Settings** tab
   - Navigate to **Secrets and variables** → **Actions**

2. **Create New Secret**:
   - Click "New repository secret"
   - **Name**: `NPM_TOKEN`
   - **Value**: Paste your NPM automation token
   - Click "Add secret"

3. **Verify Secret**:
   - You should see `NPM_TOKEN` in your secrets list
   - The value will be hidden (shows as `***`)

### Step 3: Verify Workflow File

The workflow file should already exist at:
```
.github/workflows/npm-publish.yml
```

If not, create it with the provided workflow configuration.

---

## 🎬 Usage

### Publishing a New Version

#### Option 1: Manual Version Update (Recommended)

```bash
# 1. Update version in package.json
npm version patch  # for 1.7.0 → 1.7.1
# or
npm version minor  # for 1.7.0 → 1.8.0
# or
npm version major  # for 1.7.0 → 2.0.0

# 2. Commit the version change
git add package.json package-lock.json
git commit -m "chore: bump version to $(node -p "require('./package.json').version")"

# 3. Create and push tag
git push origin main
git push origin v$(node -p "require('./package.json').version")
```

#### Option 2: One-Line Publishing

```bash
# Update version, commit, tag, and push in one command
npm version patch && git push origin main && git push origin v$(node -p "require('./package.json').version")
```

#### Option 3: Manual Tag Creation

```bash
# 1. Update package.json version manually
# Edit package.json: "version": "1.7.1"

# 2. Commit changes
git add package.json package-lock.json
git commit -m "chore: bump version to 1.7.1"
git push origin main

# 3. Create and push tag
git tag v1.7.1
git push origin v1.7.1
```

### What Happens After Tag Push

1. **GitHub Actions Triggers**: Workflow starts automatically
2. **Tests Run**: All tests on Node 18.x and 20.x
3. **Build Creates**: Project builds and artifacts uploaded
4. **Version Verified**: Checks package.json version matches tag
5. **NPM Publishes**: Package published with provenance
6. **Release Created**: GitHub release with changelog
7. **Summary Generated**: Detailed summary in Actions tab

### Monitoring the Workflow

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Find your workflow run (named after the tag, e.g., "v1.7.1")
4. Click on the run to see detailed logs
5. Check the **Summary** tab for quick overview

---

## 📊 Workflow Details

### Workflow Structure

```
npm-publish.yml
├── Job 1: test (Matrix: Node 18.x, 20.x)
│   ├── Lint code
│   ├── Run unit tests
│   └── Run E2E tests
├── Job 2: build
│   ├── Build project
│   └── Upload artifacts
├── Job 3: publish-npm
│   ├── Download artifacts
│   ├── Verify version match
│   └── Publish to NPM with provenance
├── Job 4: create-release
│   ├── Generate changelog
│   └── Create GitHub release
└── Job 5: notify-success
    └── Create success summary
```

### Key Features

#### 1. Provenance Attestation
The workflow publishes with `--provenance` flag, which:
- Links the package to its source code
- Provides cryptographic proof of origin
- Increases package security and trust
- Visible on NPM package page

#### 2. Version Verification
Automatically checks that:
- `package.json` version matches the git tag
- Prevents publishing mismatched versions
- Fails fast if versions don't align

#### 3. Automatic Changelog
Generates changelog from commits since last tag:
- Uses conventional commit messages
- Includes commit hashes for traceability
- Automatically added to GitHub release

#### 4. Matrix Testing
Tests on multiple Node versions:
- Ensures compatibility with Node 18.x
- Validates on Node 20.x (LTS)
- All tests must pass before publishing

### Permissions

The workflow requires these permissions:

```yaml
permissions:
  contents: write  # For creating GitHub releases
  id-token: write  # For npm provenance
  packages: write  # For publishing packages
```

These are automatically granted by GitHub Actions.

---

## 🔍 Troubleshooting

### Issue: "NPM_TOKEN not found"

**Symptom**: Workflow fails with authentication error

**Solution**:
1. Verify `NPM_TOKEN` secret exists in repository settings
2. Check token hasn't expired
3. Ensure token has "Automation" permissions
4. Regenerate token if necessary

### Issue: "Version mismatch"

**Symptom**: Workflow fails at version verification step

**Solution**:
```bash
# Check current version
node -p "require('./package.json').version"

# Check git tag
git describe --tags

# If mismatch, update package.json manually:
npm version [tag-version] --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore: align version with tag"
git push origin main
```

### Issue: "Tests failing in CI but pass locally"

**Symptom**: Tests pass locally but fail in GitHub Actions

**Possible Causes**:
1. **Environment differences**: Check NODE_ENV, timeouts
2. **Dependencies**: Ensure `npm ci` has all required deps
3. **MongoDB**: Mock/stub database calls in tests
4. **Puppeteer**: Headless browser issues in CI

**Solution**:
```yaml
# Add to workflow if needed
env:
  NODE_ENV: test
  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true
```

### Issue: "Build artifacts missing"

**Symptom**: Publish job can't find `dist/` folder

**Solution**:
- Ensure `npm run build` completes successfully
- Check build artifacts are uploaded in build job
- Verify download-artifact step in publish job

### Issue: "Permission denied"

**Symptom**: Cannot publish to NPM registry

**Possible Causes**:
1. **Package name**: Already taken or you're not an owner
2. **Token scope**: Insufficient permissions
3. **Package access**: Not set to public

**Solution**:
1. Verify you're an owner:
   ```bash
   npm owner ls chilean-banks-audit
   ```

2. Check package.json:
   ```json
   {
     "publishConfig": {
       "access": "public"
     }
   }
   ```

3. Regenerate token with correct scopes

### Issue: "Duplicate version"

**Symptom**: "Cannot publish over existing version"

**Solution**:
```bash
# You cannot republish the same version
# Increment version and try again
npm version patch
git push origin main
git push origin v$(node -p "require('./package.json').version")
```

### Getting Help

1. **Check Workflow Logs**: Actions tab → Select run → View logs
2. **Verify Secrets**: Settings → Secrets → Check NPM_TOKEN exists
3. **Test Locally**: Run `npm run test && npm run build` locally
4. **NPM Status**: Check https://status.npmjs.org for NPM outages
5. **GitHub Issues**: https://github.com/JavierCollipal/chilean-banks-audit-microservice/issues

---

## 📚 Additional Resources

### NPM Documentation
- **Access Tokens**: https://docs.npmjs.com/creating-and-viewing-access-tokens
- **Publishing**: https://docs.npmjs.com/cli/v10/commands/npm-publish
- **Provenance**: https://docs.npmjs.com/generating-provenance-statements

### GitHub Actions Documentation
- **Actions Guide**: https://docs.github.com/en/actions
- **Workflow Syntax**: https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions
- **Encrypted Secrets**: https://docs.github.com/en/actions/security-guides/encrypted-secrets

### Related Workflows
- **ci.yml**: Runs on every push/PR for continuous integration
- **npm-publish.yml**: Runs on tag push for automated publishing

---

## 🎯 Best Practices

1. **Semantic Versioning**: Follow semver (MAJOR.MINOR.PATCH)
   - MAJOR: Breaking changes
   - MINOR: New features (backward compatible)
   - PATCH: Bug fixes

2. **Commit Messages**: Use conventional commits
   - `feat:` for new features
   - `fix:` for bug fixes
   - `chore:` for maintenance tasks

3. **Testing**: Always run tests locally before tagging
   ```bash
   npm run lint
   npm run test
   npm run build
   ```

4. **Changelogs**: Write clear commit messages for auto-generated changelogs

5. **Token Security**:
   - Never commit tokens to repository
   - Use GitHub Secrets
   - Rotate tokens periodically
   - Use automation tokens for CI/CD

6. **Version Tags**: Always prefix with `v` (e.g., `v1.7.1`)

---

## 📝 Example Workflow Run

```bash
# Step 1: Make changes
git checkout -b feature/awesome-feature
# ... make changes ...
git commit -m "feat: add awesome feature"
git push origin feature/awesome-feature

# Step 2: Create PR and merge
gh pr create --title "Add awesome feature"
# ... review and merge ...

# Step 3: Update version and publish
git checkout main
git pull origin main
npm version minor  # 1.7.0 → 1.8.0
git push origin main
git push origin v1.8.0

# Step 4: Monitor GitHub Actions
# → Go to Actions tab
# → Watch workflow run
# → Check NPM package page
# → Verify GitHub release
```

---

🐾✨ **Automated publishing makes releases fast, consistent, and reliable!** Nyaa~! 🚀

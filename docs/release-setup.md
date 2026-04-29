# Release & signing setup

This document covers the one-time human setup for signed release packaging in GitHub Actions. It does not imply that in-app auto-update is already implemented.

## Current release status

- `.github/workflows/ci.yml` validates pushes and pull requests.
- `.github/workflows/build.yml` packages unsigned installers on pushes to `main` and on manual dispatch, then uploads them as workflow artifacts.
- `.github/workflows/release.yml` packages installers when a GitHub Release is published or when manually dispatched for an existing release tag.
- The release workflow uploads platform artifacts and updater metadata files to the GitHub Release.
- The app does not currently import or call `electron-updater`, so installed clients do not self-check or self-apply updates yet.

## Release flow

1. Ensure the change has passed CI.
2. Bump `version` in [../package.json](../package.json).
3. Commit, push, and publish a matching GitHub Release tag `v<version>`.
4. GitHub Actions checks out the release tag, runs `npm ci`, validates the version/tag match, then builds and publishes release artifacts for macOS, Windows, and Linux.

Release publishing does not run on ordinary pushes or PRs.

## One-time setup

### 1. Workflow permissions

The release workflow requests `contents: write` so `electron-builder` can upload assets to the published release.

Verify repository workflow permissions:

```bash
gh api repos/:owner/:repo/actions/permissions/workflow \
  --jq '{default_workflow_permissions, can_approve_pull_request_reviews}'
```

If repository policy is locked down, enable workflow write permission:

```bash
gh api --method PUT repos/:owner/:repo/actions/permissions/workflow \
  -f default_workflow_permissions=write \
  -F can_approve_pull_request_reviews=false
```

### 2. macOS signing and notarization

Required for shipping macOS builds without Gatekeeper warnings.

Add these repository secrets:

```bash
gh secret set APPLE_CSC_LINK
gh secret set APPLE_CSC_KEY_PASSWORD
gh secret set APPLE_ID
gh secret set APPLE_APP_SPECIFIC_PASSWORD
gh secret set APPLE_TEAM_ID
```

If these secrets are absent, the workflow still produces unsigned macOS artifacts for smoke testing.

### 3. Windows code signing

Recommended for shipping Windows installers without SmartScreen warnings.

Add these repository secrets:

```bash
gh secret set WIN_CSC_LINK
gh secret set WIN_CSC_KEY_PASSWORD
```

If these secrets are absent, the workflow still produces unsigned Windows artifacts.

### 4. Linux

No signing is configured. Linux artifacts are still published to the GitHub Release.

## Wiring app-managed auto-update

Updater metadata alone is not enough. The application still needs explicit main-process wiring before release builds will self-update in the installed app.

That work is not present in the current codebase. When the project is ready to add it, install `electron-updater` and integrate update checks in the main process as a separate application change.

## Cutting a release

1. Bump the version:

```bash
npm version patch
git push && git push --tags
```

2. Publish the GitHub Release:

```bash
gh release create v$(node -p "require('./package.json').version") --generate-notes
```

3. Watch the workflow:

```bash
gh run watch
```

## Troubleshooting

- `Release tag v<version> does not match package.json version`: publish a new release with a tag that matches the committed version.
- macOS artifact is produced but cannot be opened cleanly: signing or notarization secrets are missing or invalid.
- Windows artifact shows SmartScreen warnings: the build is unsigned or the signing certificate reputation is still warming up.
- Installed app does not auto-update: expected until `electron-updater` wiring is added to the app itself.

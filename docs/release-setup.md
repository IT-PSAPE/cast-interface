# Release & signing setup

Everything in this doc is the one-time human setup required to turn unsigned CI builds into signed, notarized, auto-updating releases. After this is done, cutting a release is bumping `version` in `package.json`, pushing the matching `v<version>` tag, and publishing a GitHub Release.

## The release flow (after this is all set up)

1. Bump `"version"` in [../package.json](../package.json).
2. Commit, tag, and push the commit + tag.
3. GitHub Actions:
   - waits until a GitHub Release is published,
   - checks out the release tag,
   - validates the tag matches `package.json`,
   - builds + signs + notarizes on macOS, Windows, and Linux runners,
   - uploads artifacts to the published GitHub Release.
4. Installed clients see `latest-mac.yml` / `latest.yml` / `latest-linux.yml` at the new release and self-update.

No production build runs unless a GitHub Release is published. Pushes to `main`, PRs, and version-only commits do not build release artifacts.

---

## One-time setup

### 1. Enable workflow write permissions on the repo

Already set in the workflow via `permissions: contents: write`. No UI action needed unless repo default policies override it.

To verify (run locally):

```bash
gh api repos/:owner/:repo/actions/permissions/workflow \
  --jq '{default_workflow_permissions, can_approve_pull_request_reviews}'
# default_workflow_permissions should be "write" or workflow-level perms must be allowed.
```

If locked down:

```bash
gh api --method PUT repos/:owner/:repo/actions/permissions/workflow \
  -f default_workflow_permissions=write \
  -F can_approve_pull_request_reviews=false
```

### 2. macOS signing & notarization

Required for: Gatekeeper approval, auto-update (auto-update is blocked on unsigned macOS builds).

**Prerequisites**

- Apple Developer Program membership (~$99/year): <https://developer.apple.com/programs/>
- Xcode installed locally for keychain/cert tooling.

**Get the certificate**

1. In Xcode → Settings → Accounts → your Apple ID → Manage Certificates.
2. Create a **Developer ID Application** certificate.
3. Export it as a `.p12` from Keychain Access (right-click → Export, choose "Personal Information Exchange .p12").
4. Base64-encode it for the GitHub secret:
   ```bash
   base64 -i ~/path/to/DeveloperID.p12 | pbcopy
   ```

**Create an app-specific password**

1. Sign in at <https://appleid.apple.com/> → Sign-In and Security → App-Specific Passwords.
2. Generate one, copy it.

**Find your Team ID**

Apple Developer → Membership: 10-character string like `ABC1234XYZ`.

**Entitlements file** (optional but recommended for NDI)

Create [../resources/entitlements.mac.plist](../resources/entitlements.mac.plist) if you want to enable microphone / camera / network access explicitly under the hardened runtime. For now NDI network access is implicit through the plugin; add this only if notarization fails citing a missing entitlement.

**Add secrets via gh CLI**

```bash
gh secret set APPLE_CSC_LINK              # paste the base64 string
gh secret set APPLE_CSC_KEY_PASSWORD      # the .p12 export password
gh secret set APPLE_ID                    # your Apple Developer email
gh secret set APPLE_APP_SPECIFIC_PASSWORD # the app-specific password
gh secret set APPLE_TEAM_ID               # e.g. ABC1234XYZ
```

Without these secrets, the Mac build succeeds but produces an unsigned `.dmg` / `.zip` — fine for smoke-testing, not fine for distribution or auto-update.

### 3. Windows code signing

Required for: avoiding the SmartScreen "Windows protected your PC" warning, and for fast auto-update without user confirmation.

**Options**

| Option | Cost | Notes |
| --- | --- | --- |
| OV certificate (Sectigo, DigiCert…) | ~$100–200/yr | Works, but SmartScreen reputation accrues only after many downloads (~weeks). |
| EV certificate | ~$300–500/yr | Instant SmartScreen reputation. Requires a hardware token or HSM. |
| [Azure Trusted Signing](https://learn.microsoft.com/en-us/azure/trusted-signing/) | ~$10/mo | Microsoft-issued, cloud-key-based, cheapest. Requires an Azure tenant. |

**Get & export the certificate**

1. Buy from your CA. They'll issue a `.pfx` (= `.p12`) or a cloud key reference.
2. For a file-based cert, export as `.pfx`:
   ```bash
   # If you have a .pfx already, just base64 it:
   base64 -i path/to/windows-codesign.pfx | pbcopy
   ```

**Add secrets via gh CLI**

```bash
gh secret set WIN_CSC_LINK            # base64 of .pfx
gh secret set WIN_CSC_KEY_PASSWORD    # the .pfx password
```

Without these, the Windows build succeeds but the installer is unsigned — users see SmartScreen warnings and auto-update will require user confirmation each time.

### 4. Linux

No signing required. AppImage supports auto-update out of the box once `publish` metadata lands in the release. `.deb` does not auto-update; users reinstall manually.

### 5. Enable electron-updater in the app

The workflow publishes the artifacts. To make installed apps actually self-update, the main process needs to check for updates on launch. See [ai-agent-commits.md](ai-agent-commits.md) for the minimal wiring — or ask the agent to add it when you're ready.

Key package:

```bash
npm install electron-updater
```

Minimal bootstrap in [../app/main/index.ts](../app/main/index.ts):

```ts
import { autoUpdater } from 'electron-updater';

app.whenReady().then(() => {
  // ... existing init ...
  if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify();
});
```

---

## Cutting a release

1. Bump the version:
   ```bash
   npm version patch   # or minor / major
   git push && git push --tags
   ```
   (`npm version` edits package.json, commits, and creates a local tag. The release tag must be named `v<version>` and must match `package.json`.)
2. Publish the GitHub Release:
   ```bash
   gh release create v<version> --generate-notes
   ```
3. Watch the run:
   ```bash
   gh run watch
   ```
4. When the workflow completes, the release is live at:
   ```bash
   gh release view v<version> --web
   ```

## Troubleshooting

- **"Release tag v<version> does not match package.json version"** in the workflow log → the GitHub Release tag and app version disagree. Fix the version/tag alignment and publish a new release.
- **Mac build succeeds but users can't open the app** → likely unsigned or notarization failed. Check the workflow log for `electron-notarize` errors, usually due to wrong `APPLE_TEAM_ID` or password.
- **Windows auto-update fails with "cannot find latest.yml"** → make sure the release build completed; check the release assets include `latest.yml`.
- **Auto-update not triggering on launch** → `app.isPackaged` is false in dev mode; the update check only runs in packaged builds.

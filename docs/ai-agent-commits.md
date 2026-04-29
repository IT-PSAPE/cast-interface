# Commit and release conventions

This repo has two GitHub Actions paths:

- [.github/workflows/ci.yml](../.github/workflows/ci.yml): runs on pull requests and branch pushes for validation.
- [.github/workflows/release.yml](../.github/workflows/release.yml): packages production artifacts only when a GitHub Release is published.

## Commit messages

- Use a short sentence-case title.
- Prefer user-facing phrasing because PR titles feed generated release notes.
- Group related work into one coherent commit when possible.

Good:

> Fix overlay stack registration loop in dialog handling

Bad:

> update files

## Version bumps

Only bump `package.json` when preparing an actual release candidate.

| Change class | Bump |
| --- | --- |
| Bug fixes only | `patch` |
| Backward-compatible feature work | `minor` |
| Breaking change | `major` |

## Release process

1. Land the change through a passing PR.
2. Bump the version:

```bash
npm version patch
git push && git push --tags
```

3. Publish the GitHub Release:

```bash
gh release create v$(node -p "require('./package.json').version") --generate-notes
```

4. Watch the release build:

```bash
gh run watch
```

## What the release workflow does

When a GitHub Release is published, the release workflow:

1. checks out the release tag
2. runs `npm ci`
3. validates `v<version>` against `package.json`
4. typechecks, tests, and builds
5. packages and uploads artifacts to that GitHub Release

## Release notes

Auto-generated release notes use [.github/release.yml](../.github/release.yml). Label PRs when you want them grouped more cleanly.

## Rules for agents

- Do not bump `version` unless the human explicitly asks for release preparation.
- Do not rewrite published tags or release notes.
- Do not commit secrets.
- Do not commit generated directories such as `dist/`, `out/`, `node_modules/`, or `test-results/`.
- Prefer PRs over direct pushes to protected release branches.

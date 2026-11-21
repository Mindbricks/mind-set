# Releasing mind-set

How a new version of `@mindbricks/mind-set` reaches npm. It is written for maintainers, and
for coding agents that a maintainer asked to cut a release. An agent may run steps 1 to 6;
the approvals and every npm or GitHub setting stay with a maintainer.

## The model: this repository is built

This repository is generated from the source repository of the tooling and replaced on
every release (see [CONTRIBUTING.md](CONTRIBUTING.md)). **A release never starts here.**
Every change, the version number included, lands in the source repository first. Then the
build writes this repository's whole tree (everything except `.git`), and a tag here
publishes it.

## Release steps

1. **Version and changelog (source repository).**
   - Set `version` in the package's `package.json` (semantic versioning; see "Versions"
     below) and add its section to `CHANGELOG.md`.
   - Fix every release text now (README banners, "not published yet", changelog headings):
     a version on npm can never change its README.
   - Merge to the source repository's main branch.
2. **Build and sync.** Clone this repository next to a main checkout of the source
   repository, then, in the source repository:

   ```bash
   npm run build:mind-set -- --seed <path to the clone of mind-set>
   ```

3. **Test the built tree (in the clone).**

   ```bash
   npm test
   ```

   A built tree also runs the tests that need the corpus (the pack test). They do not run
   in the source repository's plain test run, so this is where they are first seen.
4. **Commit and push `main`.** Describe the release in the commit message, then wait until
   the `test` workflow is green on every job: ubuntu, macOS and Windows, Node 18, 20 and
   22. Never tag a red main.
5. **Tag.** The tag publishes:

   ```bash
   git tag -a v<version> -m "mind-set <version>"
   git push origin v<version>
   ```

   The `publish` workflow then:
   - checks that the tag equals `package.json`'s version;
   - runs the tests;
   - publishes with provenance through trusted publishing.

   Follow it with `gh run watch <run-id> --exit-status`. A successful run logs
   `+ @mindbricks/mind-set@<version>`.
6. **Verify.** The registry can take a minute or two to show the new version.

   ```bash
   npm view @mindbricks/mind-set version dist-tags
   npm install -g --prefix "$(mktemp -d)" @mindbricks/mind-set@<version>
   ```

   Then run `<prefix>/bin/mindset --version`; the alias `mind-set` must answer the same. If
   the version stays missing, read "Staged releases" below.

## Release order with genesis-set

genesis-set depends on mind-set through a range in its `package.json`.

- **A mind-set patch release** (`0.2.0` to `0.2.1`): genesis-set needs no release. Its
  `^0.2.0` range already takes the new mind-set on the next install or update.
- **A mind-set minor release** (`0.2.x` to `0.3.0`), or **a mind-set change that moves or
  renames a page that genesis-set links to**: genesis-set must be released too, with its
  range raised (`^0.3.0`).
- **Order:** mind-set is always published first, and is visible on npm, before the
  genesis-set tag is pushed.

## Versions

- **Semantic versioning, pre-1.0 rules:** while the major is 0, a minor bump (`0.2.x` to
  `0.3.0`) may break things, and a dependent range `^0.2.0` accepts only `0.2.x`.
- **The version in `package.json` and the tag must match.** The workflow refuses a
  mismatch.
- **Every version is published once.** A failed run that never reached npm leaves the
  version free; a version that reached npm can never be reused.

## Trusted publishing (how the workflow is allowed to publish)

- **No npm token exists for this package, and none may be added.** `publish.yml` proves
  itself to npm with GitHub's OIDC token (`permissions: id-token: write`). npm accepts it
  because the package's npm settings list a **Trusted Publisher**:
  - GitHub Actions;
  - organization `Mindbricks`, repository `mind-set`;
  - workflow `publish.yml`, no environment;
  - "allow npm publish" on, "allow npm dist-tag" off.
- **npm version:** the job installs `npm@^11.5.1` first, because trusted publishing needs it
  and the npm that comes with Node 22 is older.
- **Provenance:** every release carries a signed SLSA provenance statement (`--provenance`).
- **Renaming:** if the workflow file or this repository is renamed, the Trusted Publisher
  entry on npmjs.com must be changed to match, or the next publish fails with an
  authentication error.

## Staged releases

npm can hold a published version as **staged** until a maintainer approves it with 2FA.
Until then the registry answers 404 for it, or shows a `0.0.0-stage` placeholder. In 0.1.0
this happened with a token publish; the trusted publishes of 0.2.0 went live at once. If a
release is staged:

- **On the web:** npmjs.com, Staged Packages, review it, Approve, then the 2FA code.
- **Or on the command line** (npm 11.15 or newer, logged in): `npm stage list`, then
  `npm stage view <stage-id>`, then `npm stage approve <stage-id>`.

Only a maintainer approves. An agent says the release is waiting and stops.

## When a publish fails

- **The `publish` run is red before the publish step** (the tag does not match
  `package.json`, or a test fails): nothing reached npm and the version is
  still free.
  1. Delete the tag (`git push origin :refs/tags/v<version>`, `git tag -d v<version>`).
  2. Fix the cause in the source repository and sync again.
  3. Tag again.
- **The publish step fails with an authentication error** (`ENEEDAUTH`, `E401`, `E403`,
  or `E404` on the PUT): the Trusted Publisher entry is missing or does not match. A
  maintainer fixes it on npmjs.com, then re-run the same run (`gh run rerun <run-id>`).
  The tag stays.
- **A version that reached npm is never published again**, not even after an unpublish:
  fix forward with the next patch version.

## Never

- Publish from a laptop (`npm publish` by hand), or create an npm token for CI.
- Move or re-push a tag of a version that is on npm.
- Reuse a version number.
- Release changes that exist only here and not in the source repository: the next sync
  removes them.
- Approve a staged release, or change npm or GitHub settings, unless you are a maintainer
  doing it yourself.

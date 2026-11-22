# mind-set

Skills and documents that teach a coding agent (Claude Code, Codex) to design and write an
OpenAPPL blueprint, plus a local structural validator. Zero dependencies, Node 18 or newer.

```bash
npm install -g @mindbricks/mind-set
mindset install
```

The global install puts the `mindset` command on the `PATH` (`mind-set` still works as an alias); the skills run `mindset validate`
after every change. Without a global install, use `npx @mindbricks/mind-set@latest <command>`
wherever this README says `mindset <command>`; the skills fall back to the same form.

## The design flow is a strong recommendation

OpenAPPL requires only the blueprint. The design flow the skills run first is spec-driven
design: a requirements interview and design documents under `design/`, from the project
description to one spec per service. It settles the requirements before the blueprint is
written and gives clearly better blueprints, so the skills strongly recommend it and start
with it.

It is a method of mind-set, not part of the OpenAPPL standard. Tell the agent to skip the
design documents and it writes the blueprint directly from your request (the review's
`spec-coverage` pass only runs when design documents exist).

## After installing

- **Start a new agent session.** Claude Code lists its skills at startup, so skills copied
  during a running session are on disk but not callable until the session restarts (or
  `/reload-skills` runs).
- **Trust the folder.** Permission rules in a project's settings only apply after the agent
  has accepted the workspace trust prompt for that folder; an untrusted headless run
  (`claude -p`) ignores them and asks, or refuses, on every call.
- **Headless runs cannot install.** They are refused writes under `.claude/`; run
  `mindset install` yourself in a terminal, then start the headless run.
- **Run each command on its own.** The skills run `mindset validate`, `design-check` and
  `spec-coverage` as one command each: an agent whose permissions approve the command still
  refuses it when it is chained (`; echo $?`, a pipe, `&&`). Read the exit code from the
  command, not from a wrapper.
- **Sandboxed Node.** In an agent sandbox that sends traffic through a proxy, Node's
  built-in `fetch` ignores the proxy unless `NODE_USE_ENV_PROXY=1` is set (Node 22.21 or 24.5
  and newer); `mindset` itself needs no network after install.

## Commands

| Command | What it does |
|---|---|
| `mindset install [--claude] [--codex] [--force] [--dry-run]` | Copies the corpus to `~/.mind-set/<version>/` (linked as `~/.mind-set/current`) and writes each skill to Claude Code (`~/.claude/skills/<skill>/`) and Codex (`~/.agents/skills/<skill>/`). |
| `mindset update [...]` | Installs this version for every agent installed before (and every detected one), then deletes older corpus versions. |
| `mindset uninstall [--dry-run]` | Removes only what `install` recorded in `~/.mind-set/installed.json`. |
| `mindset validate <file>... [--schema <path>] [--root <Class>] [--json]` | Structural check of a blueprint against `openappl.json`. |
| `mindset design-check <docName> [<draft.md>] [--dir <design>] [--roster <file>] [--pipeline <file>] [--json]` | Structural check of one design document (default `design/<docName>.md`) against the design pipeline of the corpus. |
| `mindset spec-coverage [<blueprint.json>] [--dir <design>] [--ledger <file>] [--json]` | Every document in `design/` produced its artifact in the blueprint, or carries a recorded decline (`--declare <doc> --reason "<why>" --by "<who>"`). |
| `mindset doctor` | Detected agents, installed skills, corpus version and its OpenAPPL version. |

### Agents

- **Claude Code** is detected by `~/.claude`; **Codex** by `~/.codex` or a `codex` binary on
  `PATH`. With no flag, `install` writes to every detected agent; `--claude` / `--codex` pick
  the agents and install even when the agent is not detected.
- Each skill folder mind-set writes carries a `.mind-set.json` marker. A folder of the same
  name without the marker belongs to someone else and is skipped (exit code 1) unless
  `--force` is given; the replaced folder is copied to `~/.mind-set/backup/` first.
- The placeholder `{{CORPUS}}` in a skill's Markdown files is replaced with the absolute path
  of the installed corpus.

### Validation

`validate` checks property names, value types, enum values, required fields, arrays and the
`Project` root (`MindbricksProject` is accepted as an alias of the root class; `--root Service`
checks a fragment). Each problem is one line:

```
ERROR $.services[0].serviceSettings.serviceOptions.dbType enum "oracle" is not a DbTypes value; allowed: postgresql, mongodb
```

The exit code is 1 when there is an error, 0 otherwise (`WARN` lines, such as an enum value
in the wrong case, do not fail). The schema is the installed corpus copy of `openappl.json`,
this package's copy, or `--schema`.

It is structural only. MScript values are accepted as a string or a descriptor such as
`{ "js": "..." }` and are never evaluated. Relations, ownership, references by name and every
other semantic rule need a compiler or the hosted OpenAPPL Validator. A legacy shape that a
compiler migrates on load is reported here, so the blueprint moves to the current form.

### Design documents and coverage

`design-check` checks a design document's name, required sections, the
`microservice-definitions` roster and event table, the interview record's Status and
Coverage Ledger, and the test-plan target, all read from
`corpus/procedures/design/pipeline.json` (or `--pipeline`). It exits 0 with no finding and 2
with findings or on a usage error (with `--json`, a usage error has `error` and no
`findings`).

`spec-coverage` maps each document in `design/` to its target in the blueprint
(`projectSettings`, `authentication`, the services, `bffService.dataViews`,
`notificationService.eventNotifications`, `agentHub.aiAgents`). An empty target or a
document without a rule is a gap (exit 1) until it is written or declined; declines live in
`design/spec-ledger.json` with their reason. The frontend document is `NOT_CHECKED` (the
frontend is not part of the blueprint).

`validate`, `design-check` and `spec-coverage` warn (`secret-literal`, never an error)
about a string in a credential field that is not `$ENV:<NAME>`, `ENTER_CREDENTIAL` or a
placeholder, and about any credential-shaped value. Never write a real password or key into
a blueprint or a design document; the seeded super-admin password is `$ENV:<NAME>` or a
placeholder changed on first login.

### Environment

- `HOME` is where the agents' folders are looked up.
- `MIND_SET_HOME` moves the data folder (`~/.mind-set`).

## Development

```bash
npm test
```

runs the `node:test` suites in `test/` against a throwaway package and a fake `HOME`. In a
built package (one with a `corpus/` folder) it also packs the package with `npm pack`,
installs the tarball into a throwaway project and runs `install`, `doctor`, `validate` and
`uninstall` from there.

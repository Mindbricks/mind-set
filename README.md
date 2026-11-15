# mind-set

Skills and documents that teach a coding agent (Claude Code, Codex) to design and write an
OpenAPPL blueprint, plus a local structural validator. Zero dependencies, Node 18 or newer.

```bash
npm install -g @mindbricks/mind-set
mind-set install
```

The global install puts the `mind-set` command on the `PATH`; the skills run `mind-set validate`
after every change. Without a global install, use `npx @mindbricks/mind-set@latest <command>`
wherever this README says `mind-set <command>`; the skills fall back to the same form.

## Commands

| Command | What it does |
|---|---|
| `mind-set install [--claude] [--codex] [--force] [--dry-run]` | Copies the corpus to `~/.mind-set/<version>/` (linked as `~/.mind-set/current`) and writes each skill to Claude Code (`~/.claude/skills/<skill>/`) and Codex (`~/.agents/skills/<skill>/`). |
| `mind-set update [...]` | Installs this version for every agent installed before (and every detected one), then deletes older corpus versions. |
| `mind-set uninstall [--dry-run]` | Removes only what `install` recorded in `~/.mind-set/installed.json`. |
| `mind-set validate <file>... [--schema <path>] [--root <Class>] [--json]` | Structural check of a blueprint against `openappl.json`. |
| `mind-set doctor` | Detected agents, installed skills, corpus version and its OpenAPPL version. |

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

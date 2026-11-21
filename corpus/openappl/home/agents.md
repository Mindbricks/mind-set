---
title: Use OpenAPPL with your agent
---

# Use OpenAPPL with your agent

A coding agent such as Claude Code or Codex can design and write OpenAPPL blueprints with
you. It needs two things to do that well: the language itself, so it looks up every
pattern instead of guessing, and a method, so it works in small checked steps. **mind-set**
gives it both.

mind-set is a free, open source package (Apache-2.0). It installs a set of agent skills and a
local copy of the OpenAPPL documents, and it adds a validator the agent runs after every
change. Source, issues and releases: [github.com/Mindbricks/mind-set](https://github.com/Mindbricks/mind-set).

## Install

You need Node.js 18 or newer. Install the package, then let it set up your agents:

```bash
npm install -g @mindbricks/mind-set
mindset install
```

The global install puts the `mindset` command on your `PATH`; the skills call it to
validate. To try it without a global install, run it through npx. The agent then runs the
validator the same way:

```bash
npx @mindbricks/mind-set@latest install
```

Until the first npm release is out, install it straight from GitHub instead:

```bash
npx github:Mindbricks/mind-set install
```

`install` finds the agents on your machine and writes the skills to each of them:

| Agent | Detected by | Skills written to |
|---|---|---|
| Claude Code | `~/.claude` | `~/.claude/skills/` |
| Codex | `~/.codex`, or `codex` on the `PATH` | `~/.agents/skills/` |

Use `--claude` or `--codex` to pick the agents yourself, and `--dry-run` to see what would be
written. The documents go to `~/.mind-set/current/`. Check the result with:

```bash
mindset doctor
```

It lists the agents it found, the installed skills and the OpenAPPL version of the corpus.
Start a new agent session afterwards, so the agent loads the skills.

The commands on this page are written as `mindset <command>`. Without a global install,
write `npx @mindbricks/mind-set@latest` in place of `mindset`.

## The four skills

The agent chooses a skill from what you ask for. You can also name the skill in your
request, which is the surest way to get it.

| Skill | Use it to | It writes |
|---|---|---|
| `openappl-blueprint-design` | Turn a product idea into design documents through a short interview, before any blueprint exists | Markdown files under `design/` |
| `openappl-blueprint-authoring` | Write or change a blueprint, and fix its validation errors | The blueprint JSON file |
| `openappl-blueprint-review` | Audit a blueprint: ownership, tenant scope, public APIs, secrets, delete actions and more | A findings report under `review/`, no edits |
| `openappl-blueprint-contract` | Write code around the compiled system, such as a frontend, a client, tests or the blueprint's library functions | Your code, built against the blueprint |

## Your first prompts

These are starting points; replace the parts in angle brackets. Each one names its skill so
the right method is used from the first message.

**Start a new application.** Begin with the design, not with JSON:

```text
I want to build <a booking app for small clinics: patients book slots,
staff manage calendars, the clinic owner sees reports>. Use the
openappl-blueprint-design skill: interview me one question at a time
and write the design documents under design/. Do not write blueprint
JSON yet.
```

**Write the blueprint from the design:**

```text
Write the OpenAPPL blueprint for the design in design/ to
blueprint.json with the openappl-blueprint-authoring skill. Work one
element at a time, run "mindset validate blueprint.json" after each
change and fix every error before you go on.
```

**Start small, without a design phase.** Fine for a prototype:

```text
With the openappl-blueprint-authoring skill, create blueprint.json for
<a team task list: projects, tasks with an assignee and a due date,
comments>. Start from the closest example in the mind-set corpus and
keep only what this needs. Validate before you show it to me.
```

**Change an existing blueprint:**

```text
In blueprint.json, <add a "comment" data object to the blog service: a
comment belongs to a post, only its author can edit or delete it>. Use
the openappl-blueprint-authoring skill, look up every pattern you use,
validate, and show me the diff.
```

**Review a blueprint before you compile it:**

```text
Review blueprint.json with the openappl-blueprint-review skill and
write the findings to review/blueprint-review.md, each with its JSON
path, the reason and the fix. Do not edit the blueprint.
```

**Build a client against the blueprint:**

```text
Using blueprint.json as the contract, write a TypeScript client for
the order APIs of the shop service with the
openappl-blueprint-contract skill. If you need a route or a field the
blueprint does not declare, propose the blueprint change instead of
working around it.
```

## How the agent works

When the agent writes or changes a blueprint, it follows this loop:

1. **Look up.** Before it writes a pattern, the agent reads that pattern's page in the
   local copy of [the language specification](../spec/index.md). Property names, types and
   allowed values come from there, not from memory.
2. **Draft one element.** A setting, a data object, a property or an API at a time, so each
   step stays small and easy to review.
3. **Validate.** It runs `mindset validate` on the file.
4. **Repair.** Every error is fixed before the next element. Errors come back with the JSON
   path of the problem:

```text
ERROR $.services[0].serviceSettings.serviceOptions.dbType enum "oracle" is not a DbTypes value; allowed: postgresql, mongodb
```

Your part is the review: read the blueprint diff, not generated code. That is where the
decisions are.

## Validate it yourself

You can run the same check outside the agent, in a terminal or in your CI:

```bash
mindset validate blueprint.json
```

The exit code is 1 when there is an error. The check is structural: property names, types,
allowed values, required fields and the shape of the tree. Semantic rules, such as whether a
relation points at an existing data object, are checked by a compiler's validator.

## Compile and iterate

When the blueprint validates, pick a [compiler](compilers.md) and build. When the
requirements change, ask the agent to change the blueprint and compile again. Never edit
the generated code: the next compile replaces it.

## What the skills do not do

The skills never hand-write the backend that a blueprint describes. The backend comes
from a compiler, and the blueprint is the contract it is checked against. When code you are
writing around the system needs something new, the agent proposes a blueprint change
instead of patching around it. Implementations of any kind count as
[conforming](compilers.md) only by passing the conformance suite.

## Other agents

An agent without skills support can still use the corpus mind-set installs. Point it at
`~/.mind-set/current/` and give it the procedure to follow, for example:

```text
Read ~/.mind-set/current/procedures/blueprint-authoring.md and follow
it to write blueprint.json for <your application>. Look up every
pattern in ~/.mind-set/current/openappl/spec/ and run "mind-set
validate blueprint.json" after every change.
```

The full schema is also one file, [openappl.json](../../openappl.json), for tools that load
the language directly.

## Update and remove

```bash
mindset update
```

installs the current version for every agent you installed before and deletes older copies
of the documents.

```bash
mindset uninstall
```

removes exactly what `install` wrote and nothing else. A skill folder that mind-set did not
write is never replaced unless you pass `--force`, and then it is backed up first.

## Contribute

Report a problem with a skill or a document on the
[mind-set issue tracker](https://github.com/Mindbricks/mind-set/issues). Contributions follow
the OpenAPPL rules: a person writes and stands behind every change, and AI assistance is
disclosed. See [Contributing](../governance/contributing.md).

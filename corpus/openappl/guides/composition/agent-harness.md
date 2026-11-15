---
title: AgentHarness
---

# AgentHarness

An **AgentHarness** is a long-running, autonomous agent that works from skills,
documents and scripts, keeps a private working directory, calls your project's
APIs as tools, and carries a task end to end with little scripting. Think of
the way a coding agent works on a repository, applied to your business
process: "triage this ticket", "run the KYC check for this customer", "research
this supplier and write the summary".

It sits next to the in-process [AI agents](../system-services/agent-hub.md) of
the agentHub, and is a different tool:

| | AIAgent | AgentHarness |
|---|---|---|
| Loop | One model-call loop inside agentHub | An open-source agent runtime in a sandbox |
| State | Chat history keyed by session | A working directory that persists between sessions |
| Extension | Tools and prompts | Skills, documents, scripts, plugins, tools |
| Best for | Chat, short tool-calling turns | Long autonomous jobs |

> **Naming.** The pattern is called AgentHarness and lives under
> `agentHub.harnesses[]`. The emitted service that runs the sessions is the
> **harness runner** (see [the compiler specification](../../compiler/index.md)).
> Clients never talk to the runner; they talk only to agentHub.

> **Language support.** A harness requires a target language that implements
> it. A project whose language does not is refused with
> `AGENT_HARNESS_LANGUAGE_NOT_SUPPORTED`.

## Shape

```json
{
  "agentHub": {
    "harnesses": [
      {
        "harnessBasics": {
          "name": "ticketTriage",
          "description": "Triages a new support ticket with its skills.",
          "runtime": "dsh",
          "enabled": true
        },
        "modelSettings": { "providerName": "defaultLlm", "model": "gpt-4o-mini", "maxTurns": 20 },
        "assets": {
          "skills": ["harness/ticketTriage/skills/triage"],
          "documents": ["harness/ticketTriage/docs/policy.md"],
          "scripts": []
        },
        "plugins": [],
        "toolSettings": {
          "apiTools": "listTickets,getTicket",
          "m2mTools": "",
          "agentTools": "",
          "approvalRequiredTools": "",
          "webTools": { "search": "labSearch", "scrape": "labScrape" }
        },
        "networkSettings": { "egress": "open", "allowedHosts": [] },
        "sessionSettings": {
          "allowFrontendSessions": true,
          "maxConcurrentPerUser": 2,
          "idleTimeoutMinutes": 30,
          "workspaceRetentionDays": 30
        },
        "triggers": [],
        "guardrails": { "timeout": 1800000, "maxToolCalls": 200 }
      }
    ]
  }
}
```

More than one harness can be declared. Each has its own runtime, model, tools,
assets and workspace. Every field is documented in the pattern pages:
[AgentHarness](../../spec/AgentHarness.md),
[AgentHarnessBasics](../../spec/AgentHarnessBasics.md),
[AgentHarnessModelSettings](../../spec/AgentHarnessModelSettings.md),
[AgentHarnessAssets](../../spec/AgentHarnessAssets.md),
[AgentHarnessPlugin](../../spec/AgentHarnessPlugin.md),
[AgentHarnessToolSettings](../../spec/AgentHarnessToolSettings.md),
[AgentHarnessWebTools](../../spec/AgentHarnessWebTools.md),
[AgentHarnessNetworkSettings](../../spec/AgentHarnessNetworkSettings.md),
[AgentHarnessSessionSettings](../../spec/AgentHarnessSessionSettings.md) and
[AgentHarnessTrigger](../../spec/AgentHarnessTrigger.md).

## Runtimes

agentHub drives every harness through the Agent Client Protocol (ACP) over
stdio, never through a runtime-specific API. The `runtime` field picks which
agent is launched inside the sandbox:

| `runtime` | Agent | Model API it speaks | Notes |
|---|---|---|---|
| `dsh` (default) | DeepSeek Harness, through its ACP app | OpenAI-compatible, Anthropic | MIT licence. Pre-stable: its version is pinned and never floats. |
| `goose` | Goose, native ACP | OpenAI-compatible, Anthropic | The stable fallback. Apache-2.0. |
| `codex` | OpenAI Codex CLI, through its ACP adapter | OpenAI-compatible | Apache-2.0. |
| `claude-code` | Anthropic Claude Code, through its ACP adapter | Anthropic | Not open source; check the licence terms for hosted use before you ship. |
| `opencode` | OpenCode, native ACP (`opencode acp`) | OpenAI (Responses API) | MIT. Preview: no plugins, no subscription login; see the note below. |

OpenCode note: the runner hands OpenCode the gateway as `OPENAI_BASE_URL` /
`OPENAI_API_KEY`, like every other runtime, and the model in
`AGENT_HARNESS_MODEL`. OpenCode's built-in OpenAI client calls the Responses
API (`/responses`), so use it on an `openai` entry; a provider that serves only
chat completions (Ollama and many OpenAI-compatible vendors) needs a
per-session OpenCode config the runner does not write yet. An Anthropic entry
is refused for OpenCode (`AGENT_HARNESS_MODEL_API_UNSUPPORTED`). Treat
`opencode` as preview until it has run on a real session.

Switching runtime changes one field; the rest of the blueprint stays the same
as long as the model provider speaks an API the new runtime understands, or
one the gateway translates into (Claude Code on an OpenAI-compatible entry,
see below); the validator reports `AGENT_HARNESS_MODEL_API_UNSUPPORTED`
otherwise.

## Model providers and the gateway

A harness names an entry of `projectSettings.aiProvidersSettings.aiProviders[]`
in `modelSettings.providerName`. The harness never sees the real API key. The
runner runs a **model gateway** on loopback: the sandboxed runtime is given the
gateway URL and a short-lived session token instead of a key, and the gateway
adds the real key from the provider entry, enforces your cost ceilings and
records usage. A prompt-injected skill therefore cannot exfiltrate the key,
even with open network egress.

The runtime gets the gateway in its SDK's usual variables. An OpenAI-shaped
runtime gets `OPENAI_BASE_URL` ending in `/v1` and calls
`/chat/completions`, `/responses` or `/models` on it. An Anthropic-shaped
runtime gets `ANTHROPIC_BASE_URL` without `/v1` and calls `/v1/messages`,
`/v1/messages/count_tokens` or `/v1/models`. The gateway forwards these paths
to the provider entry's base URL and answers 404 for any other path. On the
OpenAI shape the version segment is optional, so a client that joins the base
without `/v1` reaches the same provider path. An OpenAI-compatible entry's
`baseUrl` carries its own version segment (`https://api.deepseek.com/v1`).

### Whose key a session runs on

The gateway applies the entry's `credentialScopes` (tenant and user keys, see
the scoped provider credentials in [`AiProvider`](../../spec/AiProvider.md) and
[`AiProviderCredentialScopes`](../../spec/AiProviderCredentialScopes.md)) the
way agents and AI call actions do. The key is resolved once, at session start,
for the session owner:

- a **frontend session** runs on the owner's stored user key, else the tenant
  key, else the entry's own (saas) key, in the order the scopes allow;
- a **triggered (Kafka) session** has no user: it runs on the event tenant's
  key, else the saas key. A user key never reaches a triggered session, even
  when the user scope is `required`;
- a `required` scope with no stored key refuses the start with
  `428 AI_PROVIDER_CREDENTIAL_REQUIRED` (the same code the agent and chat
  surfaces answer); the session row records the code and the owner adds a key
  before trying again.

A live session keeps the key it started with until it ends: revoking or
replacing a key takes effect on the next session, not on one that is running.
The session's `starting` event carries `credentialScope` (`saas`, `tenant`,
`resource` or `user`) so a client can show whose key the session uses; the key
itself is never in an event, a log line or an error.

Under `costPolicy: ownerPays` a session on a tenant, workspace (resource) or
user key is the key owner's spend: it is not charged to, and not bounded by,
the project's or the harness's `dailyCostCeilingUsd` (usage is still recorded
on the session). `saasPays` keeps the ceiling. The runner reports the level
and the policy on the `starting` event and on every `usage` event
(`credentialScope`, `costPolicy`, and on a workspace key `credentialOwnerId:
<object>:<id>`), and the hub feeds them to its cost governor. A session on a
workspace key is bounded instead by that workspace's own
`credentialScopes.resource.budget.dailyCostCeilingUsd`, when the entry sets
one: at start, at every prompt (`429 AGENT_BUDGET_EXCEEDED` with
`bucket: "resource"` and the row id) and per model call at the gateway; other
workspaces are never read. For an entry with a tenant, user or resource scope
the hub cannot know the level before the runner answers, so the ceilings are
checked once `starting` arrives: a `saasPays` session over the project
ceiling, or a workspace session over its own budget, fails right after it
starts with `AGENT_BUDGET_EXCEEDED`; an entry without owner scopes is checked
before the start, as before.

The runner holds `PROVIDER_CREDENTIAL_KEY` (the project key the stored
credentials are sealed under) like every service that calls AI providers.

The provider entry must be reachable in one of two API shapes:

- OpenAI-compatible: `openai`, `xai`, `deepseek`, `moonshot`, `azure-openai`
  and `ollama` entries, or a `custom` entry with `apiFormat: "openai"`.
- Anthropic Messages: `anthropic` entries, or a `custom` entry with
  `apiFormat: "anthropic"`.

`google`, `bedrock` and the media providers cannot back a harness. With the
default `modelSettings.auth: "providerKey"` only API keys are used: the
application owner's, or a tenant's or user's own through `credentialScopes`.
A session owner's personal subscription is used only in the explicit
`userSubscription` mode below, and never for work the application does on
the users' behalf.

### Running on the owner's own subscription

A Claude Code harness may run on the session owner's own Claude plan, and a
Codex harness on the owner's own ChatGPT plan, instead of an API key. This is
the one case where a subscription login is carried, and only at the tenant
and user levels: the application (saas) level
never holds one, so no fallback to the entry's own key exists. A tenant-level
token is readable by every tenant user whose session runs on it (it is inside
their sandbox HOME, not behind the gateway like a tenant API key): the user
level is the normal place, the tenant level a deliberate share.

```json
{
  "harnessBasics": { "name": "claudeDesk", "runtime": "claude-code" },
  "modelSettings": { "providerName": "claudeSubscription", "auth": "userSubscription" },
  "networkSettings": { "egress": "allowlist", "allowedHosts": [] },
  "sessionSettings": { "allowFrontendSessions": true }
}
```

with a dedicated provider entry of the vendor's brand that opens the user
(or tenant) scope:

```json
{
  "name": "claudeSubscription",
  "provider": "anthropic",
  "configuration": [],
  "credentialScopes": { "tenant": "off", "user": "optional" }
}
```

Rules the validator enforces on the `auth` field:

- `userSubscription` runs on `claude-code` (an `anthropic` entry) and `codex`
  (an `openai` entry) only; dsh and goose, and any other vendor's plan, are
  refused (`AGENT_HARNESS_SUBSCRIPTION_RUNTIME`, `AGENT_HARNESS_SUBSCRIPTION_BRAND`).
- The entry must enable the tenant or the user credential scope
  (`AGENT_HARNESS_SUBSCRIPTION_SCOPE_OFF`): a subscription lives at those levels
  only.
- Frontend sessions only: a Kafka-triggered session has no subscriber
  (`AGENT_HARNESS_SUBSCRIPTION_FRONTEND_ONLY`).
- `networkSettings.egress` must be `allowlist` (`AGENT_HARNESS_SUBSCRIPTION_EGRESS_OPEN`):
  the login is inside the sandbox, in that owner's HOME. The runner adds the
  vendor's hosts (`api.anthropic.com`, `claude.ai`, ...; `api.openai.com`,
  `chatgpt.com`, `auth.openai.com`) to the allowlist itself.
- Every such harness gets the warning `AGENT_HARNESS_SUBSCRIPTION_TERMS`.
  Read it: the vendor's consumer terms license a plan to the subscriber for
  the subscriber's own work and may restrict a third-party service from using
  a subscription login. Offer the mode only where that holds for your users.

How a user connects: on their own machine they run `claude setup-token`
(Claude) or `codex login` (ChatGPT), then save the result on the auth service
with the scoped-credential routes and `kind: "subscriptionToken"`:
`PUT /my-provider-credentials/claudeSubscription` with
`{ "kind": "subscriptionToken", "subscriptionToken": "<token or the auth.json content>" }`
(a tenant administrator uses `/tenant-provider-credentials/...`).
The value is shape-checked, never verified live, stored encrypted and never
returned. A session start whose owner (user, then tenant) holds no token fails
with `428 AI_PROVIDER_CREDENTIAL_REQUIRED`, which the frontend turns into
"connect your Claude / ChatGPT subscription".

What the runner does with it: the token is resolved for the session owner at
start and placed in THAT owner's session HOME only (a `~/.claude/.credentials.json`
or `~/.codex/auth.json` document with mode 0600, or `CLAUDE_CODE_OAUTH_TOKEN`
for a bare Claude token; `CODEX_HOME` points Codex at it). No model gateway
variable is set (`ANTHROPIC_*`, `OPENAI_*`, `AGENT_HARNESS_GATEWAY_*` are
absent), so the session goes straight to the vendor and **nothing is metered**:
`dailyCostCeilingUsd`, `maxTurns` and usage recording do not apply (the turn
timeout and `maxToolCalls` still do). The file is removed when the owner's
last live session of the harness ends; the next session re-seeds it from the
stored row, so a deleted token is never re-used from the disk. A live session
finishes on the token it started with. A token the runtime refreshed during a
session is not written back: the owner re-connects when the stored one
expires.

### Claude Code on an OpenAI-compatible provider (translation)

The recommended default is Claude Code driven by a cheaper model (DeepSeek,
GLM, Kimi). Claude Code speaks only the Anthropic Messages API; most of those
entries speak the OpenAI shape. The gateway bridges that: for a `claude-code`
harness on a `deepseek`, `moonshot`, `xai`, `azure-openai` or `ollama` entry,
or a `custom` entry with `apiFormat: "openai"` (an OpenRouter-style endpoint),
the runner translates every call on the wire. The request (system prompt,
text and image content, tool definitions and tool calls both ways,
`max_tokens`, stop sequences, sampling) becomes an OpenAI chat completion;
the answer, streamed or not, comes back as the Anthropic message and event
sequence Claude Code expects, with the provider's token counts (cached prompt
tokens included) in `usage`; provider errors keep their status in the
Anthropic error envelope. The validator accepts the pair; nothing in the
blueprint says "translate".

Claude Code asks for 32000 output tokens or more on every call, which many
OpenAI-compatible models refuse (`deepseek-chat` stops at 8192). The gateway
clamps `max_tokens` to the model's ceiling: the entry's own `maxTokens`
configuration value when you set one (else `maxOutputTokens`, else
`maxCompletionTokens`), otherwise the known ceiling of the model
(`deepseek-chat` 8192, `deepseek-reasoner` 65536, `gpt-4o` and `gpt-4o-mini`
16384). A model the gateway does not know is sent as asked: add a `maxTokens`
item to the entry's `configuration` when its model has a lower limit. The
pair itself needs nothing more than this:

```json
{
  "projectSettings": {
    "aiProvidersSettings": {
      "aiProviders": [
        {
          "name": "deepseekMain",
          "provider": "deepseek",
          "configuration": [
            { "name": "apiKey", "value": "ENTER_CREDENTIAL", "secret": true },
            { "name": "defaultModel", "value": "deepseek-chat" }
          ]
        }
      ]
    }
  },
  "agentHub": {
    "harnesses": [
      {
        "harnessBasics": { "name": "researcher", "runtime": "claude-code" },
        "modelSettings": { "providerName": "deepseekMain", "model": "deepseek-chat" }
      }
    ]
  }
}
```

What the translation does not carry: extended thinking (Claude Code's
`thinking` requests are dropped; a provider's own reasoning text is shown as
a thinking block), base64 documents (replaced by a placeholder; text
documents are carried), `top_k`, and Anthropic server-side tools. The
provider must support function calling for the harness's tools to work, and
`count_tokens` is approximated locally (one token per four characters). The
cost ledger records the provider's own usage numbers. The translation is one
way: an OpenAI-only runtime (`codex`) on an Anthropic entry is still
`AGENT_HARNESS_MODEL_API_UNSUPPORTED` (dsh and goose speak both shapes and
never need it).

Example: Claude Code on an Anthropic-compatible endpoint of another vendor
(a GLM or Kimi gateway, for instance; no translation is involved):

```json
{
  "projectSettings": {
    "aiProvidersSettings": {
      "aiProviders": [
        {
          "name": "glmAnthropic",
          "provider": "custom",
          "configuration": [
            { "name": "baseUrl", "value": "https://llm.example.com/anthropic" },
            { "name": "apiFormat", "value": "anthropic" },
            { "name": "apiKey", "value": "ENTER_CREDENTIAL", "secret": true },
            { "name": "defaultModel", "value": "glm-4.6" }
          ]
        }
      ]
    }
  },
  "agentHub": {
    "harnesses": [
      {
        "harnessBasics": { "name": "researcher", "runtime": "claude-code" },
        "modelSettings": { "providerName": "glmAnthropic", "model": "glm-4.6" }
      }
    ]
  }
}
```

The key is delivered like every other provider secret: it reaches only the
runner, and the runner's gateway. A tenant or user key is fetched by the
runner from the identity owner at session start and is held by the runner's
gateway alone.

## Assets: skills, documents, scripts

Harness assets are [service files](service-files.md) of the **agentHub**
service. Upload each file as a service file with the service name `agentHub`
(the files land in `agentHub.serviceFiles`), then list them in the harness:

| List | Folder | Typical content |
|---|---|---|
| `skills` | `harness/<name>/skills/` | `SKILL.md` folders: one directory per skill |
| `documents` | `harness/<name>/docs/` | Policies, reference material |
| `scripts` | `harness/<name>/scripts/` | Helper scripts the skills call |

An upload names the project, the service (`agentHub`), the file's `path`
(`harness/ticketTriage/skills/triage/SKILL.md`), its content, and its
`visibility` (`private`).

An entry names either one uploaded file (`harness/ticketTriage/docs/policy.md`)
or a folder (`harness/ticketTriage/skills/triage`), which stands for every
uploaded file under it. Paths compare exactly, letter case included.

| Rule | Code |
|---|---|
| The path is outside `harness/<name>/`, or in the wrong folder | `AGENT_HARNESS_ASSET_OUTSIDE_FOLDER` (error) |
| The path names no file of `agentHub.serviceFiles` (neither a file nor a folder holding one) | `AGENT_HARNESS_ASSET_NOT_IN_SERVICE_FILES` (error) |
| The path resolves to a **public** file | `AGENT_HARNESS_ASSET_PUBLIC` (warning) |
| The same path is listed twice | `AGENT_HARNESS_ASSET_DUPLICATE` (warning) |

Keep assets **private**. A public file is also served by the agentHub at
`/service-files/<path>` to anyone, and a harness does not need that. Private
is still not secret: the files ride in the agentHub's source and image, so never
put a credential in one.

The build places the files in the agentHub's source and checks each one
against its manifest hash. When a session
starts, the runner copies the harness's declared files, read-only, from there
into the session's `assets/` folder (`assets/skills/...`, `assets/docs/...`,
`assets/scripts/...`). The runner copies exactly the files the manifest lists
for the declared entries and checks each size and sha256 again. It never copies
anything else. A file it cannot copy is reported in the session's
`starting` status event. There is no second upload path, and a session cannot
change its own skills.

## Plugins

`plugins` lists runtime-native plugins, pinned:

```json
{ "plugins": [{ "name": "markdown-tools", "version": "1.4.2", "source": "registry" }] }
```

- `version` must be an exact version (no ranges, no `latest`):
  `AGENT_HARNESS_PLUGIN_UNPINNED` otherwise.
- `source` is `registry` (the runtime's own registry) or `npm`, and must be one
  the runtime supports (`AGENT_HARNESS_PLUGIN_SOURCE_NOT_ALLOWED`).
- Plugins are installed per harness when the runner image is built, never per
  user and never at request time: dsh plugins are installed into the harness
  profile of the image, which a session receives as `AGENT_HARNESS_PROFILE_DIR`.

> **Claude Code plugins.** Marketplace plugins of a `claude-code` harness are
> validated and listed in the runner's manifest, but the runner image does not
> install them; the validator warns with `AGENT_HARNESS_PLUGIN_NOT_INSTALLED`.
> Put the work into skills and tools, or expect the runtime to add them itself
> at session start.

## Tools

`toolSettings` selects what the harness may call. It reuses the AIAgent tool
vocabulary:

- `apiTools`: REST business APIs of your services, called **as the session
  owner**. An API that is not exposable is refused
  (`AGENT_HARNESS_API_TOOL_NOT_EXPOSABLE`), an unknown one too
  (`AGENT_HARNESS_UNKNOWN_API_TOOL`).
- `m2mTools`: the subset of `apiTools` that may also be called on the service
  identity. The target API must allow M2M (the two-key contract).
- `agentTools`: other agents of the hub, offered as `invoke_agent_<name>`.
- `approvalRequiredTools`: tools that pause the session until a decision
  (status `paused_approval`); see [Approvals](#approvals).
- `webTools`: web search and scraping (below).

Every tool is offered to the harness through a per-session MCP endpoint that
the runner serves on loopback. The endpoint lists exactly this list. Each call
runs with the session owner's authority: `permissionCheck`, tenant gates and
ownership behave exactly as for a direct API call, and the capability token
never grants more than the owner has.

### Web tools

`webTools.search` and `webTools.scrape` give the harness `web_search` and
`web_fetch_scrape`. They are backed by integrations you declare in the
project's integration entries. An entry is a named record (`name`, `provider`, `configuration`) whose provider catalogue is defined by the hosting platform, outside `openappl.json`; the fragment below is illustrative:

| Family | Provider (brand) | Configuration |
|---|---|---|
| `searchProvider` | `serper`, `brave` | `apiKey` (secret), `gl`, `hl`, `timeoutMs`, `baseUrl` |
| `scrapProvider` | `zyte` | `apiKey` (secret), `timeoutMs`, `maxBytes`, `baseUrl` |

```json
{
  "integrations": [
    { "name": "labSearch", "provider": "serper", "configuration": { "apiKey": "ENTER_CREDENTIAL" } },
    { "name": "labSearchBackup", "provider": "brave", "configuration": { "apiKey": "ENTER_CREDENTIAL" } },
    { "name": "labScrape", "provider": "zyte", "configuration": { "apiKey": "ENTER_CREDENTIAL" } }
  ]
}
```

```json
{ "webTools": { "search": "labSearch,labSearchBackup", "scrape": "labScrape" } }
```

- `search` is one name or an ordered, comma-separated **fallback chain**. The
  next provider is tried on an error, a timeout, a quota refusal or a missing
  key; on an empty answer only for free-text queries. If every provider fails
  the tool answers `WEB_SEARCH_ALL_PROVIDERS_FAILED` with the attempt trace.
- `scrape` is exactly one provider (`AGENT_HARNESS_WEB_TOOL_SCRAPE_SINGLE_PROVIDER`).
  Modes are `text` (default), `html` and `browser`. Private, loopback and
  internal addresses are refused, and the page content is size-capped.
- A name that is not an integration entry is `AGENT_HARNESS_UNKNOWN_WEB_TOOL_PROVIDER`;
  a brand of the wrong family is `AGENT_HARNESS_WEB_TOOL_PROVIDER_WRONG_CATEGORY`.
- The provider keys stay in the runner and never enter the sandbox.

## Workspace

Each (tenant, user, harness) has one private working directory on the runner.
Sessions of the same user and the same harness share it, so files persist
across sessions the way they do for a local coding agent; each session also
gets a scratch folder. The path is derived from the server-side session owner,
never from a request value, and is never shared across users.
`sessionSettings.workspaceRetentionDays` (default 30) sets how long an idle
workspace is kept before it is removed.

## Network egress

`networkSettings.egress` is `open` (the default) or `allowlist`.

```json
{ "networkSettings": { "egress": "allowlist", "allowedHosts": ["api.example.com", "*.docs.example.com"] } }
```

- With `allowlist`, only the listed hosts (a `*.` wildcard prefix, an IPv4
  address and an optional `:port` are allowed) are reachable. The model gateway
  and the MCP endpoint are always reachable.
- An empty allowlist is `AGENT_HARNESS_ALLOWLIST_EMPTY`; a malformed entry is
  `AGENT_HARNESS_INVALID_ALLOWED_HOST`; hosts on an `open` harness are ignored
  (warning `AGENT_HARNESS_ALLOWED_HOSTS_IGNORED`).
- In v1 the allowlist is enforced by a proxy the runtime is pointed at. It
  stops well-behaved tools; it is not a network firewall. Treat `open` as
  open, and keep a harness's tool list to what the job needs.

## Sessions from a frontend

A signed-in user starts and drives sessions through agentHub (the harness
must have `allowFrontendSessions` on, the default):

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/harnesses/:name/sessions` | Start a session. Body `{ "prompt": "...", "attachments": [...] }`. Answers `201`. |
| `POST` | `/harness-sessions/:id/prompt` | Send a follow-up message (only while the session is `waiting_input`). Answers `202`. |
| `POST` | `/harness-sessions/:id/cancel` | Cancel a session. |
| `POST` | `/harness-sessions/:id/approvals/:approvalId` | Approve or reject a paused tool call. Body `{ "approved": true, "note": "..." }`. Answers `200`. See [Approvals](#approvals). |
| `GET` | `/harness-sessions` | List your sessions; filters `harnessName`, `status`, `origin`, `page`, `pageSize`. An approval role adds `status=paused_approval` to list the sessions waiting on it. |
| `GET` | `/harness-sessions/:id` | One session: status, runtime, usage, summary. |
| `GET` | `/harness-sessions/:id/events` | The stored message and tool-call events. `?afterSeq=n&limit=n` pages; `?stream=1` replays, then streams live over SSE. |

Statuses: `starting`, `running`, `waiting_input`, `paused_approval`,
`completed`, `failed`, `cancelled`, `timed_out`.

```js
// Start, then follow the session live.
const base = "/api/agenthub"; // the agentHub prefix of your project
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

const started = await fetch(`${base}/harnesses/ticketTriage/sessions`, {
  method: "POST",
  headers,
  body: JSON.stringify({ prompt: "Triage ticket 4411 and tell me the priority." }),
}).then((r) => r.json());

const id = started.session.id;
const res = await fetch(`${base}/harness-sessions/${id}/events?stream=1`, { headers });

const reader = res.body.getReader();
const decoder = new TextDecoder();
let buffer = "";
for (;;) {
  const { value, done } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  let cut;
  while ((cut = buffer.indexOf("\n\n")) >= 0) {
    const frame = buffer.slice(0, cut);
    buffer = buffer.slice(cut + 2);
    if (frame.startsWith(":")) continue;                   // heartbeat
    const name = /^event: (.*)$/m.exec(frame)?.[1];
    const data = /^data: (.*)$/m.exec(frame)?.[1];
    if (name === "harness-event") render(JSON.parse(data)); // message, tool call, plan, usage, status
    if (name === "harness-end") return;                     // the session ended
  }
}
```

Each frame carries `id: <seq>`; reconnect with `Last-Event-ID` (or `afterSeq`)
to resume without duplicates. The stream is read with `fetch` because an
`EventSource` cannot send the Authorization header.

Rules to design the UI around:

- The owner sees their own sessions. Reader roles (the roles that read the
  agent run log) see all, including triggered ones; in a multi-tenant project
  a tenant owner or tenant admin sees their tenant's sessions.
- A service (M2M) caller cannot start or read sessions (`403
  AGENT_HARNESS_MACHINE_CALLER`).
- `403 AGENT_HARNESS_FRONTEND_SESSIONS_DISABLED` when the harness is
  trigger-only; `429 AGENT_HARNESS_SESSION_LIMIT` past `maxConcurrentPerUser`;
  `429 AGENT_BUDGET_EXCEEDED` past a cost ceiling; `428
  AI_PROVIDER_CREDENTIAL_REQUIRED` when the provider entry requires a tenant
  or user key the owner has not stored (see "Whose key a session runs on");
  `409 AGENT_HARNESS_SESSION_BUSY` for a prompt sent while the agent is
  working.
- A session that is not in a terminal state moves to `timed_out` after
  `idleTimeoutMinutes` without input.

### Approvals

A call to a tool listed in `approvalRequiredTools` does not run straight away.
The session moves to `paused_approval`, and its events carry a `status` event
whose payload is `{ "approvalId": "...", "toolName": "...", "arguments": {...} }`.
Someone allowed to decide then answers it:

```js
await fetch(`${base}/harness-sessions/${id}/approvals/${approvalId}`, {
  method: "POST",
  headers,
  body: JSON.stringify({ approved: false, note: "Not this customer." }),
});
// 200 { success: true, session: {...}, decision: { approvalId, approved: false, decidedAs: "owner" } }
```

Who may decide:

- the owner of a frontend session, for its own session;
- a holder of the hub's approval roles (`hubSettings.hubBasics.approvalRoles`,
  the roles that decide paused agent runs on `/agent-runs/:runId/approve`;
  the platform operators by default), for any session. In a multi-tenant
  project an approver decides only the sessions of its own tenant, the same
  rule as for agent runs;
- a Kafka-triggered session has no user owner, so only the approval roles
  decide it;
- a service (M2M) caller never decides (`403 AGENT_HARNESS_MACHINE_CALLER`).

Because the owner may approve its own calls, an approval in a frontend session
works as a confirmation step for the user. When a tool needs an operator's
sign-off, keep it out of frontend harnesses, or give the tool its own
`permissionCheck`.

An approver finds the waiting sessions with `GET
/harness-sessions?status=paused_approval`, and while a session waits it can
read the session and its events (the pending tool and its arguments) even when
it is neither the owner nor a reader role. That access ends with the pause: an
approver's live event stream (`?stream=1`) delivers only the events stored
while the session waited, and closes with its end frame as soon as the session
leaves `paused_approval`.

agentHub stores only the decision that applies: the `approvalId` must name an
approval that is pending on the session right now, otherwise the answer is
`409 AGENT_HARNESS_APPROVAL_NOT_PENDING` and nothing is stored (of two
concurrent decisions on one call, the second gets that 409). It stores the
decision first, as an event of kind `approval` with payload
`{ approvalId, approved, decidedBy, decidedAs, note }` (masked like every
payload), then forwards it to the runner. The runner moves the session back to
`running` with a `status` event whose payload is `{ approvalId, approved }`. An
approved tool runs; a rejected one returns a refusal to the harness, and the
turn goes on without its effect. A call nobody decides within 15 minutes is
denied (the runner's `AGENT_HARNESS_APPROVAL_TIMEOUT_SECONDS` setting).

Refusals: `400 AGENT_HARNESS_BAD_APPROVAL` (`approved` is not a boolean, the
note is longer than 2000 characters, or the `approvalId` is not 1 to 128
characters of `A-Z a-z 0-9 _ -`), `403 AGENT_HARNESS_APPROVAL_NOT_ALLOWED`
(a reader role that holds no approval role), `404` (a session the caller may
not see), `409 AGENT_HARNESS_APPROVAL_NOT_PENDING` (nothing is pending, the
id names no pending call of this session, the call was decided already, or it
was denied on timeout), `409
AGENT_HARNESS_SESSION_ENDED`, `502 AGENT_HARNESS_RUNNER_FAILED`.

## Kafka triggers

A harness can be started by an event. Triggers run in the background, with no
user present:

```json
{
  "triggers": [
  {
    "name": "onCustomerCreated",
    "topic": "myproject-crm-service-dbevent-customer-created",
    "condition": { "js": "message != null && message.data != null" },
    "introPrompt": {
      "js": "`New customer ${message.data.firstName} ${message.data.lastName} (id ${message.data.id}). Run the KYC skill and record the result with the updateCustomerKyc tool.`"
    },
    "dedupKey": { "js": "message.data.id" },
    "tenantId": { "js": "message.data.storeId" },
    "concurrency": 1
  }
  ]
}
```

`condition`, `introPrompt`, `dedupKey` and `tenantId` are
[MScript](../mscript/overview.md) expressions over `(message, topic, headers)`: the same
binding as an agent's Kafka data mapping. The `condition` must be synchronous.
`dedupKey` keeps a replayed event from starting a second session: the key is
claimed atomically, so two events with one key in flight at once start one
session, and a key whose start failed (dead-lettered) is released, so a later
event with that key still runs.

An expression that throws is a fault of that event, not a passing outage, so
the event is dead-lettered once (no retry) and no session starts. The
dead-letter record names the expression in its `reason`:
`AGENT_HARNESS_TRIGGER_CONDITION_ERROR` (the `condition` threw or returned a
Promise), `AGENT_HARNESS_TRIGGER_DEDUP_KEY_ERROR`, or
`AGENT_HARNESS_TRIGGER_TENANT_ERROR` (the `tenantId` expression threw).

**Identity: the M2M service identity.** A triggered session has no user. It
runs as the agentHub **M2M service identity**, and it is offered only:

- the harness's `m2mTools` whose target API is `M2MAllowed` (the two-key
  contract: you list it under `m2mTools` AND the API opts in), and
- the web tools.

Any `apiTools` entry outside `m2mTools`, any `agentTools`, or a harness with
enabled triggers and `allowFrontendSessions: false` that lists them is an
error (`AGENT_HARNESS_TRIGGERED_TOOL_NOT_M2M`): the session could never call it.
If the harness also allows frontend sessions, it is only a warning
(`AGENT_HARNESS_TRIGGERED_TOOL_FRONTEND_ONLY`), because frontend sessions keep
those tools.

**Tenant.** In a multi-tenant project a triggered session runs in the
**event's tenant**: `tenantId` is required, and names it from the event (for
example `message.data.storeId`). The value is stamped on the session, names the
workspace `/<tenant>/_system/<harness>/`, and rides every M2M tool call. An
event whose `tenantId` expression is empty is dead-lettered with the reason
`AGENT_HARNESS_TRIGGER_NO_TENANT`; it never runs tenant-less. In a
single-tenant project `tenantId` is refused
(`AGENT_HARNESS_TRIGGER_TENANT_NOT_MULTI_TENANT`); in a multi-tenant one a
missing value is `AGENT_HARNESS_TRIGGER_TENANT_REQUIRED`.

**Event data is data, not instructions.** A customer name can carry text a
user typed. agentHub renders your `introPrompt` over a quoted copy of the
event: every value is wrapped in an `<event-data>` block, and the session's
first prompt tells the agent never to obey text inside those blocks. Object
keys are event data too: a key that is a plain identifier (letters, digits,
`_`, `$`, `-`, up to 64 characters) is kept, so `message.data.firstName` still
resolves, and every other key (spaces, `<`, `>`, punctuation, long text) is
wrapped in its own `<event-data>` block. `JSON.stringify(message.data.profile)`
in an intro prompt therefore puts no free key text outside a block. Read event
fields by plain identifier names in your `introPrompt`. Still:

- keep a triggered harness's tool list to what the job needs;
- put destructive tools under `approvalRequiredTools`, so an approval role
  signs each call off;
- write the skill so the KYC result is decided from your policy documents, not
  from text found in the customer's fields.

**KYC example.** The trigger above fires when a customer record is created.
The harness's skill `harness/kycCheck/skills/kyc/SKILL.md` describes the
check; its `m2mTools` is `updateCustomerKyc` (an API with M2M allowed) and its
`webTools` has a search chain for sanctions lists. The job runs for minutes,
records the outcome through the one write tool, and ends `completed`. Admins
see it under `GET /harness-sessions?origin=kafka`, with every message and tool
call.

Other services can react to the outcome: agentHub publishes
`<serviceCodename>-agent-harness-session-completed` and
`...-agent-harness-session-failed` topics when a session ends.

## Visibility and cost

- Every message, tool call, plan step and permission decision is stored as an
  event (masked, size-capped, kept 90 days). Permission events carry
  `payload.decision` (`allowed` or `denied`) and `payload.reason` alongside
  the request details in both JSON replay and SSE. These fields pass through
  the same mask and size cap as the rest of the payload. The session row keeps its status,
  summary, token usage and cost. The summary and the error message the runner
  reports go through the same mask before they are stored, shown, or published
  on the session-completed / session-failed topics.
- Usage is metered through the same cost governor as agents. Authored
  `dailyCostCeilingUsd` and `costCeilingScope` are enforced at session start,
  at every prompt, and per model call at the gateway. A session on an
  owner-paid tenant, workspace or user key (`costPolicy: ownerPays`) is the
  owner's spend and is not counted against those ceilings; a workspace key is
  bounded by its own `credentialScopes.resource.budget.dailyCostCeilingUsd`.

## Guardrails

`guardrails` reuses the [`AgentGuardrails`](../../spec/AgentGuardrails.md) shape. For a harness:

| Field | Meaning | Default when not authored |
|---|---|---|
| `timeout` | Wall-clock limit of **one prompt turn** (ms) | 30 minutes |
| `maxToolCalls` | Tool calls allowed in **one turn** | 200 |
| `dailyCostCeilingUsd` | Daily spend ceiling | none |
| `costCeilingScope` | Which spend the ceiling counts | the pattern default |

Only values you author apply. The agent defaults (2 minutes, 25 calls) are too
short for an autonomous turn, so a harness ignores them: a field left at the
agent default gets the harness default, and a section with only defaults is
reported with the warning `AGENT_HARNESS_GUARDRAIL_NOT_APPLIED`. A breach ends
the session: a turn over `timeout` is `timed_out`, one over `maxToolCalls` is
`failed`.

## Runner health

The runner's public `/health` carries an `agentHarnessSandbox` block: at boot
the runner runs a trivial command in its sandbox tool and checks that the
resource-limit tool is present. `status` is `ok`, `failed` (with the exit
code, the signal or `timeout`, and a short excerpt of the tool's stderr),
`skipped` (the `none` backend of a dev or test runner) or `pending` while the
test runs. The self-test never fails the boot and never refuses a session: it
makes a runner that cannot create namespaces visible before the first session
fails with `AGENT_HARNESS_RUNTIME_SPAWN_FAILED`. For how the runner is built
and configured, see [the compiler specification](../../compiler/index.md).

## Validation codes

| Code | Level | Meaning |
|---|---|---|
| `AGENT_HARNESS_UNKNOWN_RUNTIME` | error | `runtime` is not one of dsh, goose, codex, claude-code, opencode |
| `AGENT_HARNESS_MODEL_API_UNSUPPORTED` | error | The provider's API shape is not one the runtime speaks, nor one the gateway translates into (Anthropic Messages to OpenAI chat completions) |
| `AGENT_HARNESS_PLUGIN_UNPINNED` / `_SOURCE_NOT_ALLOWED` / `_INVALID_NAME` | error | Plugin not an exact version, source not allowed, or bad name |
| `AGENT_HARNESS_PLUGIN_NOT_INSTALLED` | warning | A `claude-code` harness lists plugins; the runner image records them but does not install them |
| `AGENT_HARNESS_ASSET_OUTSIDE_FOLDER` | error | Asset path outside `harness/<name>/<folder>/` |
| `AGENT_HARNESS_ASSET_DUPLICATE` | warning | The same asset listed twice |
| `AGENT_HARNESS_ASSET_NOT_IN_SERVICE_FILES` | error | Asset names no file of the agentHub service files |
| `AGENT_HARNESS_ASSET_PUBLIC` | warning | Asset resolves to a public agentHub service file |
| `AGENT_HARNESS_UNKNOWN_API_TOOL` / `_API_TOOL_NOT_EXPOSABLE` | error | Unknown tool, or an API with no REST route |
| `AGENT_HARNESS_UNKNOWN_AGENT_TOOL` / `_UNKNOWN_APPROVAL_TOOL` | error | Tool name not in the harness's own list |
| `AGENT_HARNESS_UNKNOWN_WEB_TOOL_PROVIDER` / `_WEB_TOOL_PROVIDER_WRONG_CATEGORY` / `_WEB_TOOL_SCRAPE_SINGLE_PROVIDER` | error | Web tool provider rules |
| `AGENT_HARNESS_TRIGGERED_TOOL_NOT_M2M` | error | A triggered session lists a tool it can never call |
| `AGENT_HARNESS_TRIGGERED_TOOL_FRONTEND_ONLY` | warning | Same, but frontend sessions keep the tool |
| `AGENT_HARNESS_TRIGGER_TENANT_REQUIRED` / `_TRIGGER_TENANT_NOT_MULTI_TENANT` | error | Trigger tenant rules |
| `AGENT_HARNESS_TRIGGER_CONDITION_ASYNC` | error | `condition` must be synchronous |
| `AGENT_HARNESS_INVALID_ALLOWED_HOST` / `_ALLOWLIST_EMPTY` | error | Egress allowlist rules |
| `AGENT_HARNESS_ALLOWED_HOSTS_IGNORED` | warning | Hosts listed on an `open` harness |
| `AGENT_HARNESS_FRONTEND_NO_TOOLS` | warning | A frontend session with no tools can only talk |
| `AGENT_HARNESS_GUARDRAIL_NOT_APPLIED` | warning | A guardrail field left at its default is ignored |
| `AGENT_HARNESS_LANGUAGE_NOT_SUPPORTED` | error | The project's target language does not implement harnesses |

## Limits to design around

- One agentHub replica and one runner replica in v1.
- Claude Code marketplace plugins are listed, not installed (above); dsh
  plugins are installed into the image profile.
- An approval-required tool call that nobody decides is denied after 15
  minutes; build the approver's queue on `GET
  /harness-sessions?status=paused_approval`.
- A deployment refuses to start a runtime whose version is not pinned by the
  release, so the start route answers `503` until the runtimes are pinned.

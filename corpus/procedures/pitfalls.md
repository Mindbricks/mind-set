# Cross-cutting pitfalls: an appendix, not a procedure

Residual anti-misconception notes that no single procedure owns. Task-specific pitfalls
live in their own documents: authoring in `blueprint-authoring.md` sections 6-7. Read this
once; recall it when you work on the matching part of a blueprint.

The numbering starts at 5: sections 1-4 of the original appendix describe how one
compiler's running system behaves on its hosting platform and are not part of the language.
## 5. Frontend contracts

- **Never edit generated backend code to fix a frontend contract.** A
  route the UI needs, a field name that does not match, a validation the
  form trips over: the fix is a blueprint change plus a recompile. A hand
  edit in the generated code is erased by the next compile; a frontend
  built against it is built against a ghost.

## 6. Service files

- **A service file is not live until a rebuild and a deploy.**
  Adding or changing a service file changes the blueprint and the stored
  file only; the running service keeps the previous bytes (or answers 404 on
  a new public path) until the service is rebuilt and deployed.
- **`LIB.serviceFiles.*` is synchronous.** `await` is harmless but
  unnecessary; a `.then(...)` on the result is a bug. A private path is never
  reachable over HTTP: the public route answers the same 404 for a private
  path and an unknown one, so a 404 on `/service-files/<path>` may just mean
  the file is private.
- **"Private" is not "secret".** Private files are in the service repo and
  the image. Never store a credential in one; use secret custom variables or
  provider secrets.

## 7. Scoped AI provider credentials

- **A 428 `AI_PROVIDER_CREDENTIAL_REQUIRED` is not a bug.** An AI provider
  entry with a `required` `credentialScopes` level refuses until that user
  (or tenant) stores a key with `PUT /my-provider-credentials/:providerName`
  (or `/tenant-provider-credentials/...`) on auth. The saas key is never used
  in its place. To exercise such an entry on the preview, store a key first;
  a save checks the key live, so a fake key answers 422
  `AI_PROVIDER_CREDENTIAL_INVALID` (fal and custom store it `unverified`).
- **`baseUrl` is never part of a stored credential.** A PUT body with any
  key outside the brand's scoped keys (openai: `apiKey`, `organization`,
  `project`; the other brands: `apiKey`) answers 422
  `AI_PROVIDER_CREDENTIAL_UNSUPPORTED_KEY`.
- **`500 AI_PROVIDER_CREDENTIAL_DECRYPT_FAILED` or a save answering `503
  PROVIDER_CREDENTIAL_KEY_NOT_CONFIGURED` is a deployment fault** (the
  services do not share the project's `PROVIDER_CREDENTIAL_KEY`), not a
  blueprint error: report it, do not edit the blueprint around it.
- **Video and content-layer AI calls still use the saas key**; agents (with
  their fallbacks), agentHub agents, `AiCallAction`, the mcpbff `/chat` and
  `/ai-complete`, and the AgentHarness model gateway (`auth: providerKey`,
  resolved once at session start) resolve tenant, workspace and user keys.
- **A Kafka- or cron-triggered run has no user**: the user level is skipped
  even when it is `required`, so such a run needs a tenant or a saas key.
  A triggered agent bound to a key-less `user: required` entry falls through
  to a saas key the entry does not have and fails at the provider: a design
  gap (bind it to an entry with an owner key), not a missing user key.
- **A 428 with `scope: resource` is not a bug either.** An entry with a
  `required` workspace (resource) level refuses until a manager of that
  workspace record stores a key with `PUT
  /resource-provider-credentials/<object>/:id/:providerName` on the
  workspace object's own service (not auth). A caller who is not a member of
  the record gets the SAME 428, by design: an AI call never reveals
  membership. To exercise it on the preview, log in as the record's creator
  or a `managers` role member, store a key, then call as a member.
- **Cron, machine and system runs skip the workspace level.** Without a
  verified actor (a cron run, an M2M call, a `system` actor, a Kafka-triggered
  harness session) the resource level is skipped even when `required`, as the
  user level is. A Kafka run keeps it only for a human event author. Bind such
  a caller to an entry with a tenant or saas key.
- **`idFrom` binds `params` and `session` only, as a plain path.**
  `params.workspaceId` or `session.activeWorkspaceId`; `this.`, `request.`,
  a call, an operator or a template literal is a validation error. Every
  caller of the entry must pass the workspace id under that same name (the
  chat sends it in the body's `context`).
- **A workspace is a data object with a membership, never a tenant and never
  a session field.** A user belongs to one tenant only; a "company key" for
  users who join several companies is the resource level on the company
  object. In a multi-tenant project that object must be tenant-level (or the
  tenant object itself), else
  `AI_PROVIDER_CREDENTIAL_RESOURCE_OBJECT_NOT_TENANT_SCOPED`; without a
  complete `membershipSettings` it is
  `AI_PROVIDER_CREDENTIAL_RESOURCE_OBJECT_WITHOUT_MEMBERSHIP`.

## 8. AgentHarness is a runtime pattern, not this harness

- **"Harness" here has two meanings.** The Claude Code customer harness is
  what you are running in (this bundle). The AgentHarness is a pattern a
  project may declare under `agentHub.harnesses[]`: a sandboxed agent runtime
  that runs inside the generated project. Never mix the two when you name a
  blueprint asset, a skill folder or a commit.
- **A triggered AgentHarness cannot call a user API.** A Kafka-triggered
  session runs as the M2M service identity, not as a user. An `apiTools` entry
  outside `m2mTools`, or any `agentTools`, is `AGENT_HARNESS_TRIGGERED_TOOL_NOT_M2M`
  (an error, unless the harness also allows frontend sessions, then a warning).
  The target API must also allow M2M, or the tool is not offered.
- **A multi-tenant trigger needs `tenantId`.** An MScript reading the tenant
  from the event (`message.data.<tenantField>`); a single-tenant project must
  not set it. An event with no tenant is dead-lettered, never run tenant-less.
- **Event values are data.** The introPrompt is rendered over a quoted copy of
  the event; still keep a triggered harness's tool list minimal and put
  destructive tools under `approvalRequiredTools`.
- **Guardrails are per turn and only authored values count.** A harness turn
  defaults to 30 minutes and 200 tool calls; leaving the agent defaults
  (2 minutes, 25 calls) in the section is ignored with a warning.
- **v1 limits to remember when you promise behavior:** plugins are listed but
  not installed; one runner replica; production refuses unpinned runtimes with
  `503`; the egress allowlist is proxy-enforced, not a firewall. A project in a
  language other than nodejs is refused (`AGENT_HARNESS_LANGUAGE_NOT_SUPPORTED`).

## 9. Scheduled work: cron jobs and cron controllers

- **A cron controller runs on one replica per tick on nodejs, unless told
  otherwise.** `cronSettings.singleReplica` defaults to `true`: each tick is
  claimed in `sys_cronJobRun`, as a service cron job (`services.cronJobs[]`)
  does. `"singleReplica": false`, and every non-nodejs language, run the API on
  EVERY replica (three replicas, three runs per tick). On a single-replica
  preview the two look the same; they differ in production.
- **An edge controller's `edgeCronSettings` schedules nothing.** No generator
  emits it (warning EDGE_CRON_NOT_SCHEDULED); use a cron job instead.
- **A `onceEver` job that already succeeded never runs again**, even after a
  redeploy. `POST /cron-jobs/<name>/run` answers 409 for it; `{ "force": true }`
  works for a superAdmin session only. Renaming the job starts a new history
  and runs it again.
- **A run-once data move must be idempotent.** A failed or timed-out run
  leaves part of the data moved and the next tick retries; nothing is rolled
  back. Back up first, verify with `GET /cron-jobs/<name>/runs`, remove the job
  in the next version, then drop the old table.
- **`timeoutSeconds` does not kill the function.** The run is recorded
  `timed_out` and `ctx.signal` fires; a function that ignores the signal keeps
  running. Check `ctx.signal.aborted` between batches.

## 10. Agent runs: dropped streams and growing token use

- **A dropped agent stream does not cancel the run.** The run continues
  server-side and its answer is stored. The stream's first frame is
  `run { runId, agentName, sessionId }`; the caller polls
  `GET <agent path>/runs/<runId>` (hub: `GET /agents/<name>/runs/<runId>`)
  until `runState` is terminal. Only the user who started the run reads it
  (platform operators too); everyone else gets 404. It is read only: there
  is no re-attach to the live stream. Media runs (image/audio/video) send no
  `run` frame.
- **A chat agent that does bulk work in one context burns tokens
  superlinearly**, because every provider call re-sends every earlier tool
  result. The `AgentRunInputGrowth` log line is the symptom. Delegate the
  bulk part to a worker through `toolSettings.agentTools`, set
  `chatSettings.summarizeAfter`, `guardrails.elideToolResultsAfter` and
  `guardrails.maxTokenBudget` (see `agent-hub-blueprint.md`, section 3).

## 11. Ledgers: overlapping generated names

- **Two ledgers in one service whose generated name families overlap are
  refused at validation with `LEDGER_STEM_COLLISION`.** That covers equal
  stems, stems that differ only in letter case, and a stem that is another's
  plus a generated suffix: `stock` with reservations generates
  `StockReservationAllocation`, and a second ledger named `stockReservation`
  generates the same name. The error names both ledgers and the shared name.
  Rename one `ledgerName` (`stockHold`, not `stockReservation`).

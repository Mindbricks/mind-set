# Cross-cutting pitfalls — an appendix, not a procedure

Residual anti-misconception notes from the platform's operational history
that no single core procedure owns: they bite in testing, sample-data
seeding, frontend wiring and debugging alike. Extracted from the Ada
prompt corpus (#4416) and verified against the live framework surface.
Task-specific pitfalls live in their own docs: authoring in
`blueprint-authoring.md` sections 6-7. Read this once; recall it whenever you
work against a LIVE running build of the project.

## 1. Auth flows on the preview — verification is never a blocker

- **`EmailVerificationNeeded` / `emailVerificationNeeded: true` is two HTTP
  calls, not a dead end.** The preview runs in test mode: every
  verification `start` response echoes the generated `secretCode` (and
  `userId`) in the body. Chain
  `POST .../api/auth/verify/<flow>/start` (identifier in the body) →
  `POST .../api/auth/verify/<flow>/complete` (identifier + `secretCode`),
  then retry the login. The same two-call shape covers email/mobile
  verification, password reset, 2FA and action approval. Do NOT abandon a
  flow or fall back to superAdmin-only testing because "there is no inbox";
  and if `secretCode` is genuinely absent in test mode, that is a platform
  bug to report, not missing infrastructure.
- **`secretCode` is a STRING.** Pass `"418273"`, not `418273` — some
  endpoints reject the integer form with a 500.
- **2FA gates the SESSION.** A login answering
  `sessionNeedsEmail2FA`/`sessionNeedsMobile2FA: true` is not fully
  authorized — protected calls 403 until the matching
  `.../verify/*-2factor-verification` pair clears the flag. Verification
  proves ownership once at registration; 2FA runs on every login.
- **Rate-limited `start` (403 "too frequent")** means a recent code exists —
  wait or use another user; never abandon the flow over it.

## 2. Seeding and exercising the live APIs

- **Edge REST paths are relative to `/edge`** (overridden by deployed `EDGE_MOUNT_PATH`): `edgeRestSettings.path: "/cart/items"` serves `/edge/cart/items`; do not repeat `/edge` in the declared path. Inspect the complete compiled route inventory, including every page, before declaring a route missing.
- **Anchor every date to the REAL today, never to a training-era year.**
  Business validations compare against server `now()`: a hardcoded
  "future-ish" literal (`"2025-06-15"`) lands in the past and 400s
  (`errMsg_<field>MustBeInFuture`). Future-flavored fields
  (`dueDate`, `expiresAt`, `scheduledAt`) get dates after today;
  past-flavored ones (`occurredAt`, `loggedAt`) recent-past; birth/founding
  dates realistic historical years. Getting this right the first time beats
  a retry wave that pollutes the run report.
- **Keep parents OPEN until their children are seeded.** Business APIs
  routinely reject child writes to a parent in a terminal state
  (`422 "Cannot add ... to a completed <X>"`), and terminal transitions are
  almost always one-way. Seed parents in their initial open state, seed
  children, THEN transition a few parents for enum variety in a second
  pass. On a state-shaped 422, pick a different open parent or skip —
  never retry the same call or try to reopen the parent.
- **The validator's error message outranks the doc.** When a field
  documented as `String` bounces with `errMsg_<field>MustBeAnArray`, send
  the array — generated docs can trail the validator; the live error is
  the contract.
- **register 200 → login 401: diff the password literals first.** The
  usual cause is the test/seed setup registering with one password and the
  login step using another. Compare the two literals before resetting
  anything — a DB reset re-seeds the same mismatch and costs minutes.
- **Re-applying a working fix to a second case: restate its precondition.**
  A fix that worked because case A's setup left the right state (a cart
  existed, a row was open) does not transfer to case B with a different
  user or a missing row. Same-shape failures often have different roots;
  verify the precondition holds before copying the fix.

## 3. Debugging the running system

- **"Stale read" has four causes — prove which before touching caches.**
  When a write returns 200 but the next read shows the old state, compare
  the DB row directly (a read-only SQL query) against the API's answer:
  DB new / API old → genuinely a cache issue (the generated QueryCache is
  on by default for list APIs and is invalidated by the MANAGED write
  path — raw writes that bypass it are the usual culprit; rebuild, or
  route the write through dbLayer). DB also old → a write-side bug
  (transaction, dataClause overwrite, wrong row) — cache work is wasted.
  Reading the wrong record (other user/tenant/cart) → a test-setup issue.
- **`column "x" does not exist` / `relation "x" does not exist`** means the
  database schema is out of sync with the models — not a code bug. The
  remedy is a REBUILD of the service (boot re-syncs the schema); never
  hand-write `ALTER`/`DROP`/`TRUNCATE` against the database to
  "fix" drift, and if a rebuild does not clear it, report it with the
  exact 500 message rather than improvising DDL. A runtime 500
  (`Cannot read properties of undefined`, MScript errors) is NOT schema
  drift — fix the code path.

## 4. Live-surface envelope facts (verified on the pilot)

- **register/login answer 201** with a FLAT session envelope (`accessToken`
  at the top level) — status asserts must accept the 200 family, and the
  session shape is not the list envelope.
- **List envelope:** `{ data: [...], paging: { totalCount, ... } }` — there
  is no top-level `rowCount`; assert through `paging.totalCount`.
- **Some GET-by-id routes answer the object BARE** (top-level fields with a
  `_type` marker) while create/update on the same object envelope it under
  the dataObject name — accept both shapes when unwrapping (fw #4445 tracks
  the inconsistency).
- **A write can succeed PARTLY (#4799):** a create / update / delete whose
  row committed but whose post-write action failed answers `200` / `201`
  with the resource AND `actionFailures: [{ action, error, ... }]`. It used
  to answer a bare `500` with the row already written. The row exists:
  never re-send a create to retry it, and never pass a write case whose
  body carries the member.
- **`simulate-capture` is operator-gated:** the mock-payment admin route
  (`POST /v1/payments/admin/simulate-capture/order/:id`) requires the
  `paymentOperator` OPERATOR capability — a plain `staff` role answers
  403 `OPERATOR_REQUIRED`; superAdmin passes. And it needs a payment
  ticket: `startorderpayment` must have succeeded first, else 404
  "no payment ticket for this order".
- **Preview payment mock is discoverable:** the checkout pattern serves
  `GET /<order-service>-api/v1/payments/mock-status` — the live body is a
  LIST, one row per configured provider, plus a roll-up flag:
  `{ providers: [{ providerName, brand, mock, reason, transport, blocking,
  mode }], anyMock, blocking, health }` (with blank credentials a row reads
  `mock: true, reason: "incomplete-credentials"`). Read the row for YOUR
  provider, not a top-level `mock`. The mock adapter
  (start/authenticate/simulate flows) is the preview payment path. Never call
  the live provider from tests. BRAND CAVEAT, now narrow (fw #4473 SHIPPED):
  `mock: true` says the credentials are blank; `transport` says whether the
  mock path ANSWERS. `stripe` and `iyzico` are both `transport: "present"` —
  their paid-order chains ARE exercisable on preview. An `adyen` row also reads
  `transport: "present"` and itemizes its call families in `transportFamilies`
  (`coverage: "present"` or `"absent"`); every Adyen family (checkout, stored
  methods, marketplace, transfer, payout, dispute) is present, and a call of
  an `absent` family would be refused `501 MOCK_UNHANDLED_PATH`, nothing sent.
  Read the family your flow needs, not only `transport`. A brand with no mock of
  its own answers `transport: "absent"`, lands in the top-level `blocking[]`,
  flips `health` to `"blocked"`, and refuses at payment start. Judge by the
  field, never by the brand name.

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

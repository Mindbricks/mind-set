# AgentDecisionGate

**Level:** `subsection` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentDecisionGate in Part 1](../ontology/AgentDecisionGate.md)

A calibrated decision gate over an agent's tool calls. Declared on `guardrails.decisionGate`, it asks the bound decision provider about each tool call BEFORE the tool runs, with the tool name and its arguments as the state. It answers the question an MScript `inputValidation` cannot: is this particular call about to do damage. The gate runs after the static `toolSettings.approvalRequiredTools` check, so a call that would pause for approval anyway never costs a provider request, and before the tool registry's own guest and role guards; a denied call returns a typed refusal to the model loop rather than aborting the run. It is NOT an authorization check - it judges the ACTION, never the caller's right to act, and the verdict never reaches a permissionCheck.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `providerName` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Name of the `projectSettings.decisionProvidersSettings.decisionProviders[]` entry that judges this agent's tool calls. Required when the gate is declared. |
| `model` | `String` | no |  |  |  | Optional PINNED model version for the gate's decisions, overriding the provider entry's. A floating tag is refused (DECISION_MODEL_NOT_PINNED): a gate whose model can change answers differently on two days, and a tool call allowed yesterday and denied today with no code change is the hardest kind of agent behaviour to debug. The model reaches the provider call; the gate audit records the model that actually answered. Null inherits the provider entry. |
| `questions` | [`DecisionQuestion`](./DecisionQuestion.md)[] | no |  |  |  | The questions asked about each tool call. The STATE is built by the framework - the tool name plus its arguments - not by the designer, because the gate must see exactly what is about to execute. All questions ride ONE provider request, so asking several (destructive? exfiltrates data? touches production?) costs barely more than one.  Every gate question must be a `noul`: a statement about the call ('this call deletes data the user did not ask to delete') whose AFFIRMATIVE probability the gate thresholds at 0.5. A `choice` or `score` question is refused (AGENT_DECISION_GATE_QUESTION_NOT_NOUL) because its answer is an option key or a level on a scale, and neither has an "unsafe" reading - state each concern as its own noul instead.  Write the instructions for YOUR project. Measured in testing: `git stash` was answered as not destructive, which is defensible since a stash is recoverable - and in one repository a bare `git stash` is banned for having destroyed a lane's uncommitted work. Both readings are right for different repositories, so a shipped universal tool-safety bundle would be wrong for most of them. |
| `confidenceThreshold` | `Double` | no |  |  |  | Confidence at or above which the gate's verdict is acted on. Below it the call is treated as failing the gate and follows `onGateFail`, because a gate that is unsure must not be the thing that lets a destructive call through. Must sit outside the provider's advertised `probabilityDriftBand` of the 0.5 boundary (DECISION_THRESHOLD_IN_DRIFT_BAND): the probability is not reproducible across identical requests, so a threshold inside the band would allow a tool call on one run and deny the identical one on the next. |
| `onGateFail` | `AgentDecisionGateAction` | no | `"deny"` | `deny`, `requireApproval`, `warn` |  | What happens when the gate judges the call unsafe (AgentDecisionGateAction). Default `deny`. |
| `onProviderError` | `AgentDecisionGateAction` | no | `"deny"` | `deny`, `requireApproval`, `warn` |  | What happens when the decision provider fails instead of answering. Default `deny` - a guard that fails open is not a guard, and this is the one place in the decision family where no other posture is defensible by default. `warn` is available for a gate being trialled, and makes the fail-open choice explicit rather than implicit. |
| `appliesToTools` | `String` | no |  |  |  | Comma-separated tool names the gate judges. Null or empty = EVERY tool the agent can call, which is the safe default: a gate that covers only the tools somebody remembered to list is the failure mode this field invites. Narrow it only to spare the latency on tools that cannot do harm. |
| `exemptTools` | `String` | no |  |  |  | Comma-separated tool names the gate never judges, applied after `appliesToTools`. Use for the read-only tools an agent calls constantly, where the gate's 250-400 ms would dominate the run for no safety gain. |

## Constraints

Property rules:

- `providerName` must be present. (`REQUIRED_FIELD_MISSING`)
- `onGateFail`, `onProviderError` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)
- `providerName` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)
- The items of `questions` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `AGENT_DECISION_GATE_ENFORCES_NOTHING` | warning | This decision gate is set to `warn` on both a failed verdict and a provider error, so it never refuses or holds anything — it only records. |
| `AGENT_DECISION_GATE_LANGUAGE_UNSUPPORTED` | error | This agent's decisionGate cannot be generated for …: the gate is enforced by the … agent runtime only so far, so a … agent would execute every tool call ungated. |
| `AGENT_DECISION_GATE_MISSING_PROVIDER` | error | A decision gate needs a providerName. |
| `AGENT_DECISION_GATE_NO_QUESTIONS` | error | A decision gate asks no questions, so it can never refuse anything. |
| `AGENT_DECISION_GATE_QUESTION_NOT_NOUL` | error | Gate question "…" is a "…" question, but a decision gate only accepts noul questions. |
| `AGENT_DECISION_GATE_SCOPE_CONTRADICTION` | error | These tools are in BOTH appliesToTools and exemptTools: …. |
| `DECISION_CHOICE_OVER_CEILING` | error | A choice question declares … options, over the … that provider "…" advertises. |
| `DECISION_MODEL_NOT_PINNED` | error | Decision gate model "…" is not pinned. |
| `DECISION_PROVIDER_NOT_FOUND` | error | Unknown decision provider "…". |
| `DECISION_QUESTION_INSTRUCTIONS_MISSING` | error | A gate question needs instructions: the statement judged about the tool call. |
| `DECISION_QUESTION_NAME_DUPLICATE` | error | Duplicate gate question name "…". |
| `DECISION_QUESTION_TYPE_UNSUPPORTED` | error | Decision provider "…" (…) does not advertise support for "…" questions. |
| `DECISION_THRESHOLD_IN_DRIFT_BAND` | error | confidenceThreshold … sits within the … probability drift band of the 0.5 boundary for provider "…". |
| `DECISION_THRESHOLD_OUT_OF_RANGE` | error | confidenceThreshold must be in (0, 1]; … declared. |

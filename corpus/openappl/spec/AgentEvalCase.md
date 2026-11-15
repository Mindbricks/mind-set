# AgentEvalCase

**Level:** `subsection` · **Family:** [AIAgent](../ontology/families.md#aiagent) (domain `Service`)

**Ontology:** [AgentEvalCase in Part 1](../ontology/AgentEvalCase.md)

**Name:** an instance is named by `name`.

One evaluation case: an input to run the agent with and what to assert about the answer. A case passes when EVERY declared check passes; a case with no check at all is flagged at design time.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `name` | `String` | yes |  |  | format [codeName](./value-formats.md#codename) | Unique case identifier within the suite. Used in the eval report. Must be camelCase. |
| `input` | `Text` | yes |  |  |  | The request body for the run: either a JSON object string (e.g. '{"message":"hi"}') or a plain string (wrapped as { message: <text> }). |
| `expectedContains` | `String` | no |  |  |  | Substring the (stringified) agent answer must contain for the case to pass. Case-sensitive. Combine with assertion for stronger checks. |
| `assertion` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | MScript assertion evaluated against the answer — 'result' is the agent output. Must return true for the case to pass; false/string (or a thrown error) fails the case with that message. Example: `{ "js": "result.sentiment === 'positive'" }`. Must be a SINGLE EXPRESSION rooted at 'result' — statement sequences do not compile. For multi-step logic use an inline function — '() => { if (!result) return "no output"; return result.decision !== "reject"; }' — which the Node.js service target invokes with (result); 'function' forms may read 'this' (bound to the eval case), and unannotated parameters are auto-annotated ': any' at codegen so the form compiles under strict tsc (other language targets are being brought to inline-function parity). The assertion is synchronous — top-level 'await' fails validation. Other root identifiers (beyond JS/Node globals) fail validation with MSCRIPT_UNKNOWN_ROOT_BINDING. |

## Constraints

Property rules:

- `name`, `input` must be present. (`REQUIRED_FIELD_MISSING`)
- `name` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

Pattern rules:

| Code | Severity | Rule |
| --- | --- | --- |
| `AGENT_EVAL_CASE_WITHOUT_CHECKS` | warning | Eval case "…" declares neither expectedContains nor an assertion — it can only prove the agent does not crash. |

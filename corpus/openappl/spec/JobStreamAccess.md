# JobStreamAccess

**Level:** `section` · **Family:** [JobStream](../ontology/families.md#jobstream) (domain `Service`)

**Ontology:** [JobStreamAccess in Part 1](../ontology/JobStreamAccess.md)

The authorization config of a JobStream (section). A JobStream emits three raw routes — enqueue, durable SSE observation and snapshot — and suppresses the target BusinessApi's public route, so these routes are the only way to run the target and the only way to read what it produced. Without this section they authorized nothing and a job id acted as a bearer capability over the job's input, result and error. `enqueueAccess` decides who may create a job (inheriting the target api's own `authOptions` by default); every job is then bound to the creating principal + tenant, and observation/snapshot require that binding unless `observerRoles`/`observerPermission` grant a stream-wide privileged read.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `enqueueAccess` | `String` | no | `"inherit"` |  |  | Who may enqueue a job on this stream. `inherit` (default) applies the target BusinessApi's own `authOptions` in full — `loginRequired`, `M2MAllowed`, `absoluteRoles` (a bypass grant), `checkRoles` (the role requirement) and `requiredCallerKind` (the caller-kind refusal: an api declaring `machine` refuses every human caller here too, and no absoluteRole bypasses it) — reaching the same verdict ApiManager.checkBasicAuth plus checkRequiredCallerKind would have reached on the public route the JobStream binding suppressed; this is what makes a `loginRequired: true`, role-gated or machine-only target actually enforce that. `session` forces an authenticated caller regardless of the target's declaration. `public` allows anonymous enqueue; such jobs are bound to no principal and are therefore observable by anyone holding the job id, so use it only for work that carries no private input or result, and declaring it against a target that itself requires a login or a role is refused at design time rather than silently downgrading that api. `session` and `public` are both statements about HUMAN callers, so declaring either against a target that declares `requiredCallerKind` is refused at design time as a contradiction rather than a relaxation. Lane status: the inherited `requiredCallerKind` refusal on this edge is enforced in nodejs, python, dotnet, java and rust; the golang enqueue gate does not carry the caller-kind field yet. Kept as String in v1. |
| `observerRoles` | `String`[] | no |  |  | format [codeName](./value-formats.md#codename) | Roles that may observe or snapshot ANY job on this stream, not only their own. EMPTY by default — privileged access is never implicit, so an unconfigured stream lets nobody read another principal's job, administrators included. Grant it to support-console or operations roles that genuinely need cross-principal visibility. The machine role `system` belongs here when a peer service must poll jobs it did not create. |
| `observerPermission` | `String` | no |  |  |  | A PBAC permission granting the same stream-wide observation right as `observerRoles`, resolved through the project's permission manager so a narrower role can be authorized by grant rather than by name. Null (default) = no permission path; the role list is then the only privileged route in. |
| `grandfatherLegacyJobs` | `Boolean` | no | `false` |  |  | Serve job rows written BEFORE the owner binding existed (their owner column is NULL). FALSE by default: the framework cannot know which principal submitted a legacy job, so serving one would preserve exactly the bearer-capability exposure the binding removes — legacy rows are therefore unreadable over HTTP and age out with the stream's retention window. Set true only for a bounded migration window, and only on a stream whose jobs carry nothing private. |

## Constraints

Property rules:

- `observerRoles` must be in the [`codeName`](./value-formats.md#codename) format. (`INVALID_CODE_NAME_FORMAT`)

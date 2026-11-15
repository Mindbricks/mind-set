# ApiApprovalRequirement

**Level:** `subsection` · **Family:** [BusinessApiBasics](../ontology/families.md#businessapibasics) (domain `BusinessApi`)

**Ontology:** [ApiApprovalRequirement in Part 1](../ontology/ApiApprovalRequirement.md)

The step-up approval requirement of one Business API: the channel of its one-time code, the input binding, the code lifetime and the action text the message shows. It is the value of `authOptions.requireApproval`. The api answers 403 APPROVAL_REQUIRED until the caller repeats the same request with `api-approval-id` and `api-approval-code`; see ApiAuthOptions.requireApproval for the pipeline position, the doors and the failure shapes.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `channel` | `ApiApprovalChannel` | no | `"email"` | `email`, `mobile` |  | Where the code is sent: `email` (the caller's verified email) or `mobile` (the caller's verified mobile, by SMS). The message is the framework's approval message, sent through the notification service like the verification codes (event `apiApprovalByEmail` / `apiApprovalByMobile` on the `<codename>-auth-service-<channel>-actApp-start` topic, derived whenever an api declares the channel). The channel's identity must be a REQUIRED identity of the project's users (APPROVAL_ON_OPTIONAL_IDENTITY otherwise). A caller whose session has no VERIFIED identifier of this channel is refused 403 APPROVAL_NOT_AVAILABLE and nothing is sent. |
| `bindInput` | `Boolean` | no | `true` |  |  | When true (the default), the approval is bound to the api's declared request parameters: the retry must carry the same values, or it is refused 403 APPROVAL_INVALID. The binding is the canonical digest the `useIdempotencyKey` check uses, so a changed amount or target can never ride an approval given for another one. False binds the approval to the user and the api only, which lets the retry change the input the user approved; it is reported as APPROVAL_UNBOUND_INPUT. |
| `expireTimeWindow` | `Integer` | no |  |  |  | How long the code stays valid, in seconds. Null takes the channel default: 900 (15 minutes) for email, 300 (5 minutes) for mobile. A positive integer; the record is stored with this TTL and is gone afterwards. |
| `actionName` | `String` | no |  |  |  | A short name of the operation the user approves (at most 64 characters), shown in the approval message and returned in the challenge. The client reads it from the challenge's `errors` member to say what is being approved. Plain text; the message escapes markup. |
| `actionDescription` | `String` | no |  |  |  | An optional longer description of the operation (at most 256 characters), shown in the approval message and returned in the challenge. Plain text; the message escapes markup. |

## Constraints

Property rules:

- `channel` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

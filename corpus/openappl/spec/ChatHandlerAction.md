# ChatHandlerAction

**Level:** `subsection` · **Family:** [ProjectSettings](../ontology/families.md#projectsettings) (domain `Project`)

**Ontology:** [ChatHandlerAction in Part 1](../ontology/ChatHandlerAction.md)

The one business API call of a chat handler, over the API's REST route. The call carries the resolved user's session (a token minted for the linked user), or no credential at all for an anonymous sender of an `allowAnonymous` handler. A failed call is answered with `response.errorText` and never retried.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `service` | `String` | no |  |  |  | The service that declares `api`. Null = the one service that declares an API of that name; required when two services do (CHAT_HANDLER_API_AMBIGUOUS) and for an API of a system service (auth, notification, ...). |
| `api` | `String` | yes |  |  |  | The business API to call. It must have a REST controller (CHAT_HANDLER_API_NO_REST otherwise). If the API's `authOptions.requiredCallerKind` (under `basics`) is `machineWithoutUserIdentity`, no chat sender can call it (`CHAT_HANDLER_API_CALLER_KIND` error, and generation fails); `machine` is a warning of the same code, because a linked sender's call passes that gate (the notification service's machine token rides beside the user's session). |
| `parameters` | [`ChatHandlerParameter`](./ChatHandlerParameter.md)[] | no |  |  |  | The API parameters filled from the message, by parameter name; each value is a template (`{{args.0}}`, `{{location.latitude}}`, ...). Every route segment of the API (`:id`) must be filled (CHAT_HANDLER_PATH_PARAM_UNMAPPED). Null = no parameters. |

## Constraints

Property rules:

- `api` must be present. (`REQUIRED_FIELD_MISSING`)
- The items of `parameters` must have distinct names (`name`, compared case-insensitively). (`DUPLICATE_ASSET_NAME`)

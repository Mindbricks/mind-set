---
title: "AI providers: behaviour rules"
---

# AI providers: behaviour rules

An entry of `projectSettings.aiProvidersSettings.aiProviders[]` names one AI
backend (an LLM, an image, audio or video service). `AiCallAction`, AI agents
(`agentHub.aiAgents`), the agent harnesses and the MCP BFF chat surface reach it
by its `name`. This page states what a conforming compiler must make the
generated service do for each `provider` brand: what a caller can rely on, how
errors and retries behave, the quirks found in real use, and the tenant,
workspace and user credential rules (`credentialScopes`).

The configuration keys of every brand, their defaults and which are secret are
in the generated catalogue [AI provider catalogue](../../spec/providers/aiProvider.md);
this page does not repeat them. See also [AiProvider](../../spec/AiProvider.md),
[`AiCallAction`](../actions/ai-call-action.md),
[`AgentCallAction`](../actions/agent-call-action.md),
[AI agents](../system-services/agent-hub.md) and
[AI chat surfaces](../capabilities/ai-chat-surfaces.md).

## Family rules

### Selection

- `AiCallAction.providerName` is required. A compiler's validator raises
  `AI_CALL_ACTION_MISSING_PROVIDER` when it is null, and the generated action
  throws at run time with the same message:

  ```
  AiCallAction "<name>" has no providerName set. Configure an aiProvider
  under projectSettings.aiProvidersSettings.aiProviders[] and reference
  it by name on this action.
  ```

- There is no model-name sniffing and no project-level "default AI provider".
  Every `AiCallAction`, and every `AIAgent.modelSettings.providerName`, names
  one `aiProviders[]` entry explicitly.
- The MCP BFF `/chat` endpoint resolves its provider as: an explicit
  `providerName` on the request (an unknown name is an error, never a
  fallback); otherwise the first LLM provider of the project. `AiCallAction`
  and `AIAgent` get no such fallback.
- `name` is a `codeName` (lower camel case, no spaces) and is unique inside
  `aiProviders[]`. Several entries may share a brand (two keys on two
  organisations, or one entry for chat and one for embeddings).
- A compiler gates modality calls (`AiCallAction.responseFormat`, image, audio
  and video requests) against the brand's modality table below when it builds
  the project.

### Credentials in the blueprint

- Secret keys (`apiKey`, `awsSecretAccessKey`, `serviceAccountJson`, ...) are
  never written as literal values. They are referenced as
  `{ "secretName": "FOO" }` or left as the authoring placeholder.
- `ENTER_CREDENTIAL` is an accepted authoring placeholder. It passes the
  authoring validator but leaves the entry **unconfigured**: it is not a
  runnable key and it is not an AI mock. An empty required value is refused
  with `REQUIRED_FIELD_MISSING`. A project copied from another one never
  carries the source project's key.
- An entry whose `credentialScopes` makes a tenant, workspace or user level
  `required` may omit `apiKey` (see [Credential scopes](#credential-scopes-tenant-workspace-and-user-keys)).
- A real provider entry whose credentials are incomplete is never replaced by
  the mock. It stays a blocking configuration error with no fallback.

### Keyless means absent, not blank

A compiler must tell apart "this endpoint needs no key" from "the declared key
is missing at run time":

- An entry is keyless only when it declares neither `apiKey` nor a key
  variable. Only then does the generated service send the call without a
  credential.
- An entry that declared an `apiKey` keeps that fact after secret stripping:
  the generated service knows a key was declared even though its value is
  delivered at deploy time. When the value is then missing, empty or
  whitespace (what an unresolved deploy secret produces), the adapter refuses
  the call at the service boundary with a provider configuration error. It
  never puts a literal `Authorization: Bearer ` with an empty token on the
  wire, and it never fails open.

### What a caller can rely on

- A chat call takes messages, optional tools and options and answers text, or
  tool calls when tools were offered.
- `responseFormat: "json"` makes the generated action parse the model's text
  into an object before it is exposed to later actions (`@<action>`); on an
  OpenAI-format brand it also switches on `response_format: { type: "json_object" }`.
  With `responseFormat: "text"` the action result is the model's text.
- An operation a brand does not support throws; it is never silently answered
  with an empty result.
- A streamed chat emits `token`, `tool_calls` and `done` events. A streamed
  agent run records token usage like a non-streamed one; when a brand cannot
  report streamed usage, the usage is recorded as an estimate
  (`estimated: true`).
- Image, audio and video operations have no dedicated business-API action; a
  service library or a custom action calls the provider by name.
- Generated media URLs (images, video) expire on most brands; persist them
  into a bucket when they must last.

### Modality table

| Brand | text | vision | image | audio | video | streaming |
|---|---|---|---|---|---|---|
| `openai` | yes | yes | yes | yes (TTS, STT) | no | yes |
| `anthropic` | yes | yes | no | no | no | yes |
| `xai` | yes | yes | no | no | no | yes |
| `deepseek` | yes | no | no | no | no | yes |
| `moonshot` | yes | no | no | no | no | yes |
| `google` | yes | yes | no | no | no | no |
| `azure-openai` | yes | yes | no | no | no | yes |
| `bedrock` | yes | yes | no | no | no | no |
| `ollama` | yes | yes | no | no | no | yes |
| `custom` | per `apiFormat` | | | | | |
| `fal` | no | no | yes | no | yes | no |
| `elevenlabs` | no | no | no | yes (TTS only) | no | no |
| `runway` | no | no | no | no | yes | no |
| `mock` | yes | no | no | no | no | yes |

## openai

- Chat completions (text, vision, tool calls, streaming), image generation
  (`dall-e-3` by default; answers `[{ url, revisedPrompt? }]`; takes `count`,
  `size`, `quality`, `style`), text to speech (answers a buffer and its format;
  default voice `alloy`, default model `tts-1`) and speech to text (Whisper).
  Video throws.
- An `organization` in the entry's configuration is sent as
  `OpenAI-Organization`. A tenant, workspace or user key may carry its own
  `organization` and `project`, sent as `OpenAI-Organization` /
  `OpenAI-Project`; the entry's own `organization` never travels with somebody
  else's key. Other OpenAI-compatible brands (`xai`, `deepseek`, `moonshot`,
  `azure-openai`, `ollama`, `custom`) never send these headers.
- **Output cap.** A cap is sent only when `maxTokens` is set; otherwise the API
  picks its own default. o-series models and GPT major versions 5 and above
  take `max_completion_tokens`; older models keep `max_tokens`.
- **Sampling.** o-series and gpt-5 family models omit `temperature`. Choosing
  the modern cap field does not establish any other capability of a model.
- **Reasoning effort.** `AIAgent.modelSettings.reasoningEffort` (`none`,
  `minimal`, `low`, `medium`, `high`) is sent as `reasoning_effort` to o-series
  and gpt-5 family models only. Unset, the parameter is omitted and the model
  uses its own default.
- **Function tools on the gpt-5 family.** A gpt-5 family model whose default
  reasoning effort is above `none` refuses function tools with HTTP 400. When
  `reasoningEffort` is unset, the adapter resends that refused tool request
  once with `reasoning_effort: "none"` and sends later tool requests of the
  same agent with `none` directly. An explicitly set effort is never
  overridden: its refusal is returned as the provider error. Older gpt-5
  models (such as `gpt-5-mini`) do not accept `none`. The Responses API is not
  used.
- **Streamed usage.** Streaming requests carry
  `stream_options: { include_usage: true }`. An OpenAI-compatible endpoint that
  refuses `stream_options` with a 4xx naming it gets the stream once more
  without it, remembered per adapter; its streamed usage is then an estimate
  (`estimated: true`).
- Tool calls are assembled across stream chunks by index and parsed when
  `finish_reason` is `tool_calls`.

## anthropic

- Chat (text, vision, tool use) and streaming (`token`, `tool_calls`, `done`
  events). Image, audio and video throw.
- Tools are converted to the Messages API `input_schema` shape; system messages
  are lifted into the top-level `system` field.
- The request goes to `<baseUrl>/v1/messages`; a `baseUrl` that already ends in
  `/v1` gets `/messages` only. `baseUrl` is not a secret and is compiled into
  the service.
- The default model, when none is set, is `claude-sonnet-5`.
- **`max_tokens` is required on every request.** When `maxTokens` is unset it
  defaults per model family: `4096` on the Claude 3 base models (opus, sonnet,
  haiku), `8192` on Claude 3.5 and `16384` on every later Claude model (never
  above what the family accepts). A non-Claude model id (an Anthropic-format
  endpoint fronting another vendor's model) keeps `4096`. A configured
  `maxTokens` is sent unchanged.
- In a stream, tool calls arrive on `content_block_stop`; the argument JSON is
  assembled across `input_json_delta` events before it is emitted.
- Prompt caching (`cache_control`) is not applied.
- The auth header is `x-api-key`, not `Authorization: Bearer`.

## xai

- OpenAI-compatible chat (text, vision, tool calls, streaming with the OpenAI
  event shape). Image, audio and video throw.
- The default model is `grok-2`.
- Vision depends on the model: `grok-2-vision` and `grok-vision-beta` accept
  images; plain `grok-2` is text-only although the brand declares vision.

## deepseek

- OpenAI-compatible chat, **text only** (tool calls, `responseFormat: "json"`,
  streaming). Image, audio and video throw.
- The default model is `deepseek-chat`.
- Some model-specific parameters (function-calling shape, `logprobs`) lag the
  OpenAI API: test before relying on them.

## moonshot

- OpenAI-compatible chat, **text only**; tool calls on the models that
  implement them; streaming. Image, audio and video throw.
- The default model is `moonshot-v1-8k`; larger context windows are
  `moonshot-v1-32k` and `moonshot-v1-128k`. Pick the variant whose window fits
  the worst-case input.
- The API endpoint is in mainland China; outbound calls from some regions need
  a proxy.

## google

- Gemini through Vertex AI: chat (text, vision, tool calls through
  `functionDeclarations`). Streaming, image, audio, video, token counting,
  embeddings and multi-turn sessions are not implemented and throw; a caller
  re-sends the full message history on every call.
- **There is no `apiKey` path.** The adapter authenticates through Vertex AI,
  so an entry configured with only an `apiKey` is refused at validation with
  `AI_PROVIDER_UNSUPPORTED_CONFIG`, naming the supported shapes. The key-only
  Gemini Developer API is reached through the `custom` brand. `projectId` and
  `location` are required; a `serviceAccountJson` selects the inline
  service-account path, its absence the deployment's default credentials.
- The default model is `gemini-2.0-flash-exp`.
- System messages are lifted into `systemInstruction`. The assistant role is
  `model`, not `assistant`; the adapter remaps it.
- Gemini returns no per-call tool-call ids, so the adapter synthesises
  `gemini_call_<n>`.
- A tool with null `parameters` is sent as `{ type: "object", properties: {} }`:
  Gemini rejects an empty schema.
- Image generation on Vertex goes through a different model path and is not
  covered.

## azure-openai

- The OpenAI chat surface (text, vision, tool calls, streaming) through an
  Azure deployment. Image, speech and TTS deployments are not surfaced; use a
  separate `openai` entry for them.
- Routing: `<baseUrl>/openai/deployments/<deployment>/chat/completions?api-version=<apiVersion>`.
  The `api-version` query string is appended to every request; trailing
  slashes on `baseUrl` are stripped. `apiVersion` defaults to `2024-10-21`.
- One deployment hosts one model; route several models through several
  entries. `defaultModel` is honoured for logs only.
- The auth header is `api-key`, not OAuth or Bearer.
- Streamed requests carry `stream_options: { include_usage: true }`. An older
  `apiVersion` may refuse it with HTTP 400: the adapter resends that stream
  once without it and streams without it from then on, recording the streamed
  usage as an estimate (`estimated: true`).
- `reasoning_effort` is sent only when the model name the adapter carries (the
  agent's `modelSettings.model`, else the entry's model) names an o-series or
  gpt-5 family model; the deployment name is not inspected.
- The Azure `apiVersion` lags the OpenAI API: newer features may be missing on
  the chosen version.

## bedrock

- One entry, many model families, through the Converse API: chat (text,
  vision; tool use on the models that implement it). System messages map onto
  Converse's top-level `system`. Streaming, image, audio and video are not
  covered.
- `defaultModel` is the Bedrock model id (`anthropic.claude-3-5-sonnet-20241022-v2:0`),
  not the vendor's own id; the same id is the default.
- Each model must be enabled per region at the account before it can be
  called; some model ids require provisioned throughput or a cross-region
  inference profile.

## ollama

- Self-hosted, OpenAI-compatible: chat (text, vision with vision-capable
  models), streaming. Image, audio and video throw.
- **Keyless.** No key is sent; the adapter passes a dummy value so the
  inherited `Authorization` header does not break the request. An Ollama host
  behind an auth proxy is declared as `custom` with `apiFormat: "openai"`.
- The adapter appends `/v1` to `baseUrl`. The default model is `llama3`.
- The model must already be pulled on the host; the adapter never pulls it.
  Tool calling depends on the model.

## custom

- A catch-all for OpenAI-compatible or Anthropic-compatible endpoints.
  `apiFormat` selects the delegate: `openai` (text, vision, image, audio),
  `anthropic` (text, vision) or `raw` (falls back to the OpenAI delegate).
- The OpenAI delegate posts to `${baseUrl}/chat/completions`; the Anthropic
  delegate to `${baseUrl}/v1/messages`, or `${baseUrl}/messages` when
  `baseUrl` already ends in `/v1`.
- Every operation is forwarded; a method throws when the delegate does not
  implement it. Most OpenAI-compatible servers expose only chat, so the other
  methods answer 4xx in practice.
- The delegate's quirks apply (the Anthropic delegate requires `max_tokens`;
  the OpenAI delegate's `responseFormat: "json"` sets `response_format`).
- With `apiFormat: "openai"` streamed requests carry
  `stream_options: { include_usage: true }`; a server that refuses the field
  with a 4xx naming it gets the stream once more without it, and the adapter
  streams without it from then on with estimated usage.
- An endpoint that authenticates by network placement is declared with
  neither `apiKey` nor a key variable (see
  [Keyless means absent, not blank](#keyless-means-absent-not-blank)). An
  `apiKey` with an empty value is a missing credential and the call is
  refused.
- `extraHeaders` is accepted but the delegates do not send it.
- A genuinely new wire shape is a new brand, not a `custom` entry.

## fal

- Image generation and video generation. Chat, speech and TTS throw.
- The base URL is fixed at `https://fal.run`; the model id is part of the URL
  path (`https://fal.run/<model>`), so a different model is a different
  `model` value, never a query parameter. Defaults: image
  `fal-ai/flux/dev`, video `fal-ai/runway-gen3/turbo/image-to-video`.
- Image answers `[{ url, width?, height? }]`; options `size` (default
  `landscape_4_3`, sent as `image_size`) and `count` (default 1, sent as
  `num_images`). Video answers `{ url, duration? }`; options `duration` and
  `aspectRatio` (sent as `aspect_ratio`).
- The auth header is `Authorization: Key <apiKey>`, not `Bearer`.
- The adapter assumes the synchronous answer shape (`data.images[]`); queued
  models need their own handling.

## elevenlabs

- Text to speech only: `POST /text-to-speech/<voiceId>`, answering a buffer and
  its format. Speech to text throws explicitly with a hint to use an `openai`
  entry; chat, image and video throw.
- The base URL is fixed at `https://api.elevenlabs.io/v1`. The default model
  is `eleven_multilingual_v2`, the default voice `21m00Tcm4TlvDq8ikWAM`.
- `outputFormat` (default `mp3_44100_128`) is sent as the `output_format`
  query parameter. `voice_settings` are fixed at
  `{ stability: 0.5, similarity_boost: 0.75 }`.
- The non-streaming POST form is used.
- The auth header is `xi-api-key`.

## runway

- Video only: `POST /image_to_video`, then the task is polled at `/tasks/<id>`
  every 5 seconds for at most 60 attempts (5 minutes); a longer render throws
  `Runway video generation timed out`. Answers `{ url, taskId }`.
- The base URL is fixed at `https://api.dev.runwayml.com/v1`; every request
  carries `X-Runway-Version: 2024-11-06`. The default model is `gen4_turbo`.
- Options: `duration` (default 5 seconds), `aspectRatio` (default `16:9`, sent
  as `ratio`).
- The endpoint expects an image input while the adapter sends only
  `promptText`: a text-only request is expected to answer 4xx.

## mock

`provider: "mock"` is the declared, offline test brand. A compiler that
implements it must give it exactly these semantics, so the same input answers
the same text on every compiler:

- No API key, no network connection. It is never substituted for an
  incomplete real provider.
- The optional, non-secret `seed` defaults to `mindbricks`.
- The answer is determined by the SHA-256 digest of `(seed, messages)`: object
  keys are sorted, message order is preserved. A text answer is
  `mock-<16 hex digits>`. With `responseFormat: "json"` the answer is JSON
  text containing `reply` and the full `digest`. The digest of the same
  messages and seed is identical across implementation languages.
- Streaming returns the same answer followed by a terminal `done` event.
- Text only: it synthesises no tool calls, images, audio, video or
  embeddings. A caller's response schema stays its own contract; use a
  directive to supply schema-shaped fixtures.
- **Directives.** On an explicitly non-production deployment (dev, preview or
  stage, with the deployment's signals agreeing), input can steer the answer:

  ```text
  [[mock-ai reply=ready for review]]
  [[mock-ai reply={"accepted":true}]]
  [[mock-ai reply={"accepted":false}]]
  ```

  The reply may contain spaces; the last directive wins. Plain text ends at
  the first `]]` (so `no`, `thanks`, `123 Main Street`, `true love`,
  `null pointer` and `[draft] ok` are all plain replies). JSON-aware scanning
  is an optional extension: when a complete JSON value (balanced arrays and
  objects, escaped strings) is immediately followed by optional whitespace and
  `]]`, that boundary keeps the whole JSON value, so
  `[[mock-ai reply={"matrix":[[1,2]]}]]`, `[[mock-ai reply=[1,2]]]` and
  `[[mock-ai reply="contains ]] inside"]]` keep their full reply. When the scan
  fails, or ordinary text follows the JSON-looking value, the first-`]]`
  boundary applies. Only `responseFormat: "json"` requires the selected reply
  to be valid JSON. A malformed directive header or a missing `]]` fails
  loudly, never quietly using the hash.
- Production, unset or mismatched deployment signals refuse directives.
  Ordinary hash answers stay available for a declared mock in production:
  they are test data, never a model's judgement.
- `GET /v1/ai/mock-status` identifies a declared mock with `mock: true`,
  `reason: "declared-mock"`, `fallback: null`, `blocking: false`. An
  incomplete real provider stays blocking with no fallback.
- A declared mock has no secret, so a boot credential report never flags it
  as incomplete.
- The brand refuses `credentialScopes`.
- A compiler that has not implemented the mock refuses the brand.

## Credential scopes: tenant, workspace and user keys

By default every call runs on the entry's own key (the `saas` level). With
`credentialScopes` an entry also accepts a key owned by a **tenant**, by a
**workspace** (one record of a data object with a membership, the `resource`
level) or by a **user**. The key is stored encrypted by the auth service, and
the services that call the provider pick it at call time.

### Levels and lookup order

| Level | Whose key |
|---|---|
| `saas` | the application owner's: the entry's own configuration |
| `tenant` | the tenant's (multi-tenant projects only) |
| `resource` | a workspace record's, set by its managers and used by its members |
| `user` | the calling user's |

- The key is resolved **user -> resource -> tenant -> saas**: the first level
  that is allowed and has a stored key wins; a level that is `off` is skipped.
  Without a resource level the order is **user -> tenant -> saas**; a
  single-tenant project has no tenant level (**user -> resource -> saas**, or
  **user -> saas**).
- `tenant` and `user` take `off`, `optional`, `required` (default `off`).
  `tenant` other than `off` in a single-tenant project is a validation error
  (`AI_PROVIDER_CREDENTIAL_TENANT_SCOPE_SINGLE_TENANT`).
- `optional`: a stored key is used when there is one, otherwise resolution
  moves to the next level.
- `required`: a stored key must exist at that level. Without one the call is
  refused with `428 AI_PROVIDER_CREDENTIAL_REQUIRED`, and the saas key is
  **never** used in its place.
- All scopes `off` (the default) leaves the entry and its generated code
  exactly as without the setting.
- A `required` lower level makes the entry's own `apiKey` optional; an
  `optional` one does not.
- `costPolicy` is `ownerPays` (default) or `saasPays` (see [Cost](#cost)).

```json
{
  "name": "assistantLlm",
  "provider": "openai",
  "configuration": [
    { "name": "defaultModel", "value": "gpt-4o-mini" }
  ],
  "credentialScopes": {
    "tenant": "off",
    "user": "required",
    "costPolicy": "ownerPays"
  }
}
```

### What a credential may set

Only the secret part of the configuration is scoped. A stored credential sets
the API key, plus an organisation or project id where the brand has one.
`baseUrl`, the model and every other option stay the entry's, so a user can
never point calls at another host.

| Brand | Keys a credential may set | Live check on save | Stored status |
|---|---|---|---|
| `openai` | `apiKey`, `organization`, `project` | `GET <entry base>/models` (bearer) | `valid` |
| `anthropic` | `apiKey` | `GET <entry base>/v1/models` (`x-api-key`, `anthropic-version: 2023-06-01`) | `valid` |
| `xai` | `apiKey` | `GET <entry base>/models` (bearer) | `valid` |
| `deepseek` | `apiKey` | `GET <entry base>/models` (bearer) | `valid` |
| `moonshot` | `apiKey` | `GET <entry base>/models` (bearer) | `valid` |
| `elevenlabs` | `apiKey` | `GET <entry base>/models` (`xi-api-key`) | `valid` |
| `runway` | `apiKey` | `GET <entry base>/organization` (bearer, `X-Runway-Version: 2024-11-06`) | `valid` |
| `fal` | `apiKey` | none | `unverified` |
| `custom` | `apiKey` | none | `unverified` |
| `google`, `azure-openai`, `bedrock`, `ollama`, `mock` | not supported | - | - |

- `<entry base>` is the entry's own `baseUrl`, else the brand's default API
  root, resolved when the project is built; no value from a request ever
  reaches the check.
- `fal` and `custom` have no cheap check: a saved key is stored `unverified`
  and the validator warns (`AI_PROVIDER_CREDENTIAL_UNVERIFIED_BRAND`).
- A scope on `google`, `azure-openai`, `bedrock`, `ollama` or `mock` is a
  validation error (`AI_PROVIDER_CREDENTIAL_SCOPE_UNSUPPORTED_BRAND`): these
  brands authenticate without a single API key, their key belongs to the
  entry's own resource, or they need no key.

### User and tenant routes (auth service)

User routes exist when some entry's `user` scope is not `off`; tenant routes
exist in a multi-tenant project when some entry's `tenant` scope is not `off`.
Every route needs a logged-in session; a machine token is refused with
`403 AI_PROVIDER_CREDENTIAL_FORBIDDEN`.

| Method and path | Who |
|---|---|
| `GET /my-provider-credentials` | the calling user |
| `PUT /my-provider-credentials/:providerName` | the calling user |
| `DELETE /my-provider-credentials/:providerName` | the calling user |
| `GET /tenant-provider-credentials` | tenantOwner / tenantAdmin (own tenant); superAdmin / saasAdmin (any tenant) |
| `GET /tenant-provider-credentials/:providerName` | same |
| `PUT /tenant-provider-credentials/:providerName` | same |
| `DELETE /tenant-provider-credentials/:providerName` | same |

- The user is the session owner; the tenant stamped on a user key is the
  session's tenant.
- A tenant route acts on the caller's own tenant. superAdmin and saasAdmin
  address another tenant with `?tenantId=<id>`; a tenantOwner or tenantAdmin
  naming another tenant gets `403 AI_PROVIDER_CREDENTIAL_FORBIDDEN`. Every
  action of an operator on a tenant that is not their own is audited as
  cross-tenant.

**Save** (`PUT`, body: the brand's scoped keys only) runs in this order:

1. unknown entry: `404 AI_PROVIDER_CREDENTIAL_UNKNOWN_PROVIDER`;
2. the scope is `off` for this entry: `409 AI_PROVIDER_CREDENTIAL_SCOPE_DISABLED`;
3. a key the brand does not scope (`baseUrl`, `model`, ...): `422 AI_PROVIDER_CREDENTIAL_UNSUPPORTED_KEY`;
4. a missing or blank `apiKey`: `422 AI_PROVIDER_CREDENTIAL_INVALID`;
5. the deployment has no credential encryption key: `503 PROVIDER_CREDENTIAL_KEY_NOT_CONFIGURED`;
6. more than 5 saves in 60 seconds by the same owner: `429 AI_PROVIDER_CREDENTIAL_RATE_LIMITED`;
7. the live check (8-second timeout): a provider 401 or 403 is `422 AI_PROVIDER_CREDENTIAL_INVALID`; any other non-2xx answer, a timeout or a network error is `503 AI_PROVIDER_CREDENTIAL_VERIFY_UNAVAILABLE`; nothing is stored in either case;
8. the key is sealed and stored, `providerCredentialChanged` is published and the masked view is returned.

The answer never contains the key:

```json
{
  "providerName": "assistantLlm",
  "scope": "user",
  "mode": "required",
  "hasCredential": true,
  "last4": "x7Qa",
  "status": "valid",
  "lastVerifiedAt": "2026-10-26T09:12:44.120Z",
  "lastUsedAt": null,
  "createdAt": "2026-10-26T09:12:44.131Z",
  "updatedAt": "2026-10-26T09:12:44.131Z"
}
```

- `last4` is `null` for a key shorter than 12 characters.
- Errors are `application/problem+json` bodies with an `errorCode` member,
  plus `providerName` and `scope` (or `unsupportedKeys` and `allowedKeys`, or
  the offending `field`) where they apply. They never carry the key or the
  provider's answer.
- **List** (`GET /my-provider-credentials`) answers `providerCredentials[]`,
  one item per entry whose scope is not `off`, with or without a stored key,
  so a frontend can render a "your API keys" page. Each item carries `kind`
  (`apiKey`, `subscriptionToken`, or `null` without a row) and
  `subscriptionRuntimes` (the harness runtimes that run on an owner
  subscription through this entry; empty means API keys only).
  `GET /tenant-provider-credentials/:providerName` returns one masked item.
- **Delete** removes the key, publishes `providerCredentialChanged` and
  returns the masked view with `hasCredential: false`. No stored key:
  `404 AI_PROVIDER_CREDENTIAL_NOT_FOUND`.
- **Audit.** Every save, delete and failed verification writes one audit line
  in the auth service log: action, scope, owner, tenant, provider, actor,
  `crossTenant` and outcome, never a key.

### Subscription logins for agent harnesses

An `AgentHarness` with `modelSettings.auth: "userSubscription"` runs on the
session owner's own plan (`claude-code` or `codex` runtime) instead of an API
key (see [AgentHarness](../composition/agent-harness.md)). The owner stores it
through the same routes with `{ "kind": "subscriptionToken", "subscriptionToken": "<value>" }`:

- The shape is checked per runtime (a `codex` entry refuses a bare token); the
  value is never sent anywhere to verify it, and the row is stored
  `unverified` with `last4: null`.
- `kind: "subscriptionToken"` is accepted only on an entry that some enabled
  subscription harness names (`subscriptionRuntimes` not empty); elsewhere it
  is `422 AI_PROVIDER_CREDENTIAL_UNSUPPORTED_KEY`. The body takes no other key.
- There is one row per (level, owner, entry): saving an API key replaces a
  subscription token and the other way round, so a subscription harness names
  a dedicated entry.
- A tenant-level token serves every session of that tenant's users whose own
  level holds none. Unlike a tenant API key, which stays behind the model
  gateway, a tenant token is placed inside each user's sandbox home, where that
  user's prompts and skills can read it.
- After a delete, a live harness session finishes on the token it started
  with; the next start fails with `428 AI_PROVIDER_CREDENTIAL_REQUIRED`. The
  saas level never carries a subscription: there is no fallback to the
  entry's own key.
- The vendor's consumer terms may restrict a third-party service from using a
  subscription login; offer it only where that holds for the users.

### Workspace keys (the resource level)

Use the `resource` level when each workspace (a company, team or project that
a user creates and others join, a user belonging to several) runs on its own
key, set by its admins and used by its members. A workspace is never a tenant:
a user belongs to exactly one tenant. The level adds no session field, role or
permission; a member is whoever the object's own membership configuration
says.

| The spec says | Level |
|---|---|
| "each user brings their own key" | `user` |
| "each customer organization pays its own AI", in a multi-tenant project | `tenant` |
| "each workspace uses its own key, set by its admins, used by its members" | `resource` |

`credentialScopes.resource`:

| Field | Values | Meaning |
|---|---|---|
| `mode` | `off`, `optional`, `required` | as for the other levels; `off` (the default) emits nothing |
| `dataObject` | a data object name, or `service:object` when the name exists in several services | the workspace object, with a complete membership configuration |
| `idFrom` | a property path of `params` or `session` | where a call names the workspace record; required unless `mode` is `off` |
| `managers` | membership role names | who may set and delete the key, besides the record's creator |
| `users` | membership role names | who may use the key; empty means every active member; managers always may |
| `budget.dailyCostCeilingUsd` | a positive number | optional daily spend ceiling of the workspace on its own key |

```json
{
  "name": "teamLlm",
  "provider": "openai",
  "configuration": [ { "name": "defaultModel", "value": "gpt-4o-mini" } ],
  "credentialScopes": {
    "user": "off",
    "costPolicy": "ownerPays",
    "resource": {
      "mode": "required",
      "dataObject": "workspace",
      "idFrom": { "js": "params.workspaceId" },
      "managers": ["admin"],
      "users": [],
      "budget": { "dailyCostCeilingUsd": 20 }
    }
  }
}
```

Here `user` is `off` on purpose: in the order user -> resource -> tenant ->
saas, a member's personal key would win over the workspace key.

**`idFrom`** is a plain property path, never an expression: `params.<name>` or
`session.<name>`, further `.<name>` steps, and bracket steps with a quoted
string (`params['workspace-id']`). No call, operator, function, template
literal, computed key or optional chain; `constructor`, `__proto__` and
`prototype` are refused as segment names; any other root is an error naming
`params` and `session`. The path is read off the call at run time, never
evaluated. `params` is a business API's resolved parameters, an agent's run
input, a harness session's start body, or the MCP BFF chat body's `context`
object (`{ "context": { "workspaceId": "w1" } }`); `session` is the verified
caller. A value that is not a string means "no record named". The same path
serves every caller, so every API, agent and harness that uses the entry names
the parameter the same way.

**Managers and users.** Managers are the record's creator (its owner field)
plus members whose role is in `managers`; with `managers` empty only the
creator manages, so the object needs an owner field. Users are every manager
plus members whose role is in `users`; with `users` empty, every membership row
that passes the object's status check. Role names come from the membership's
role vocabulary (its role permissions, its role column's enum, or `member` for
a roleless membership), compared case-insensitively. The member is matched as
the membership stores it: by user id, or by the session attribute the
membership's user column names; a session without that attribute finds no
membership (the creator rule still applies).

**Prerequisites.** The object has `membershipSettings.hasMembership: true` with
the membership object, its id and user properties (an owner field alone is the
`user` level). In a multi-tenant project the object is tenant-level or the
tenant object itself; every key is stamped with the record's tenant and never
crosses tenants. One object name may be resource-scoped in one service only
(the owner id is `<object>:<id>`). The brand table above applies unchanged. A
`userSubscription` harness refuses an entry with a resource level. The
membership object and the workspace object must keep `publishDbEvents` on;
validation refuses switching it off (`DB_EVENTS_SWITCH_CONSUMED`).

Design-time errors (all ERROR tier):

| Code | Cause |
|---|---|
| `AI_PROVIDER_CREDENTIAL_RESOURCE_OBJECT_UNKNOWN` | `dataObject` names no object, or a bare name several services declare |
| `AI_PROVIDER_CREDENTIAL_RESOURCE_OBJECT_WITHOUT_MEMBERSHIP` | the object has no complete membership configuration |
| `AI_PROVIDER_CREDENTIAL_RESOURCE_OBJECT_OWNER_CONFLICT` | entries name one object name in two services |
| `AI_PROVIDER_CREDENTIAL_RESOURCE_OBJECT_NOT_TENANT_SCOPED` | multi-tenant project, the object is neither tenant-level nor the tenant |
| `AI_PROVIDER_CREDENTIAL_RESOURCE_ROLE_UNKNOWN` | a `managers` or `users` role the membership cannot carry |
| `AI_PROVIDER_CREDENTIAL_RESOURCE_NO_MANAGER` | `managers` empty and no owner field |
| `AI_PROVIDER_CREDENTIAL_RESOURCE_ID_FROM_MISSING` | the level is on and `idFrom` is absent |
| `AI_PROVIDER_CREDENTIAL_RESOURCE_ID_FROM_NOT_A_PATH` | `idFrom` is not a property path of `params` or `session` |
| `AI_PROVIDER_CREDENTIAL_RESOURCE_BUDGET_INVALID` | `budget.dailyCostCeilingUsd` is not a finite positive number |
| `AI_PROVIDER_CREDENTIAL_RESOURCE_SUBSCRIPTION_UNSUPPORTED` | a `userSubscription` harness names the entry |

**Routes.** The workspace key routes live on the service that declares the
workspace object (only it can run the membership check); `<object>` is the
object name as a literal segment:

| Method and path | Who |
|---|---|
| `GET /resource-provider-credentials/<object>/:id` | a user of the record |
| `GET /resource-provider-credentials/<object>/:id/:providerName` | a user of the record |
| `PUT /resource-provider-credentials/<object>/:id/:providerName` | a manager of the record |
| `DELETE /resource-provider-credentials/<object>/:id/:providerName` | a manager of the record |

- A logged-in session is required (`401 LOGIN_REQUIRED`); a machine token is
  `403 AI_PROVIDER_CREDENTIAL_FORBIDDEN`.
- The record is loaded in the caller's tenant first: no record is
  `404 AI_PROVIDER_CREDENTIAL_RESOURCE_NOT_FOUND`; then the standing: not a user
  (GET) or not a manager (PUT, DELETE) is `403 AI_PROVIDER_CREDENTIAL_FORBIDDEN`,
  after the 404, so a non-member learns nothing about the keys.
- A PUT runs the save pipeline above with the same codes (rate limit: 5 saves
  in 60 seconds per record). The owning service checks the key live, seals it
  and hands the auth service the sealed value only.
- A manager gets the full masked view (`scope: "resource"`); a plain member
  gets `providerName`, `scope`, `mode`, `hasCredential` and `status` only. The
  list holds one item per entry the caller may use.
- Deleting the workspace record deletes its keys.
- The auth service gains two machine-only routes for the owning service to put
  and delete a sealed workspace key; a frontend never calls them.
- A generated frontend offers a "workspace AI keys" page per workspace
  object, reached from its detail screen: editable for a manager, a read-only
  status for a member, hidden on a `403`.

### Resource keys at call time

1. **Who is asking.** The actor is the caller the service verified, never a
   value of the call, and it is judged first: with no verified actor the level
   is skipped before the record id is read, even when it is `required`.

   | Caller | Actor whose membership is checked |
   |---|---|
   | REST business API, agent REST run, MCP BFF chat | the session owner (the chat: its verified caller) |
   | AgentHarness session (`auth: providerKey`) | the session owner, at start and on every re-check |
   | Kafka-consumed business API | the event's actor, when it names a user |
   | agent run triggered by a Kafka event | the event's author |
   | cron run, M2M call, `system` actor, Kafka-triggered harness session | none: the level is skipped |

   A `required` workspace level is therefore enforced on human traffic only;
   bind cron and system-triggered callers to an entry with a tenant or saas key.
2. **Which row.** The `idFrom` path is read off the call. A `required` level
   whose call names no row answers `428 AI_PROVIDER_CREDENTIAL_REQUIRED` with
   `scope: resource`.
3. **Membership first.** The owning service checks the actor's standing with
   the object's own membership configuration before any key is fetched. A
   non-member gets exactly the answer of a member whose workspace has no key
   (`428` when `required`, the next level when `optional`), so an AI call never
   reveals membership. If the check cannot be answered, the call answers
   `503 AI_PROVIDER_CREDENTIAL_VERIFY_UNAVAILABLE` and does not run on the
   application's key.
4. **The key.** A member gets the workspace's key.

A membership answer is reused for at most 60 seconds and dropped at once on a
membership change: every service that resolves a workspace key listens to the
membership object's db events (created, updated, deleted) and to the workspace
object's `updated` and `deleted`, and drops that member's cached answer on that
workspace (an owner change or a deletion drops every answer of the workspace).
A membership object read through another service's search projection adds the
projection wait (up to 3 seconds by default).

**The revocation bound.** A removed or demoted member stops using the key
within the event's latency, or within 60 seconds on a consumer that misses the
event (listener down, event lost, or the MCP BFF, which has no listener),
**plus one run already in flight**. An AgentHarness session on a workspace key
re-checks its owner at least every 60 seconds and at once on the membership
event; when the owner is no longer a member, it finishes its current turn and
stops with `AI_PROVIDER_CREDENTIAL_RESOURCE_REVOKED` (`409` on the next prompt,
`{ message, code }` on the event stream).

### The 428 answer

When an entry has a `required` scope and the caller has no key at that level,
the call is refused before any provider call:

- a business API whose workflow runs an `AiCallAction`, and an agent's REST
  endpoint, answer `428` with a problem+json body, `errorCode`
  `AI_PROVIDER_CREDENTIAL_REQUIRED`, and a `detail` naming the provider and the
  missing scope;
- an agent's streaming endpoint sends an SSE `error` frame
  `{ "message": ..., "code": "AI_PROVIDER_CREDENTIAL_REQUIRED" }`;
- the MCP BFF `/chat` answers `428` with `{ "error": ..., "code": "AI_PROVIDER_CREDENTIAL_REQUIRED" }`.

A frontend treats the code, not the status alone, as "this user (or tenant)
must add a key", sends the user to the key screen (or a tenant admin), and then
retries. It is not transient: never retry it automatically.

For the resource level the problem body adds `scope: "resource"` and, when the
call named a record, `resource: "<object>:<id>"` (ids only). A manager is sent
to that record's key page; anyone else is told to ask a workspace admin. A
non-member gets exactly the same `428`, never a `403`; a frontend must not
infer membership from it. The MCP BFF body and a stream's `error` frame carry
the code only.

| Code | Status | Meaning | Frontend |
|---|---|---|---|
| `AI_PROVIDER_CREDENTIAL_VERIFY_UNAVAILABLE` | 503 | the owning service's membership check could not be answered | transient: offer a retry; the call never ran on another key |
| `AI_PROVIDER_CREDENTIAL_RESOURCE_REVOKED` | 409 | a harness session's owner is no longer a member of the workspace | "you are no longer a member; the session ended": do not prompt again |
| `AGENT_BUDGET_EXCEEDED` with `bucket: "resource"` | 429 | the workspace's daily budget is spent | resets per UTC day |
| `AI_PROVIDER_CREDENTIAL_DECRYPT_FAILED` | 500 | a stored key cannot be opened (an operator problem) | the saas key is never used instead |

### Which callers resolve scoped keys

| Caller | Scoped credentials |
|---|---|
| `AIAgent`, primary provider | yes |
| `AIAgent`, `fallbackProviders` | yes, each entry resolved on its own |
| `AiCallAction` | yes |
| agentHub agents | yes |
| MCP BFF `/chat` and `/ai-complete` | yes |
| video-layer and content-layer AI calls | no: they use the saas key |
| AgentHarness model gateway (`auth: providerKey`) | yes: the owner's key (user, resource, tenant, saas) resolved at session start; a resource key is re-checked while the session lives |
| AgentHarness with `auth: userSubscription` | the owner's `subscriptionToken` row (user, then tenant), never the saas key; no gateway, nothing metered |

- The user is the session owner and the tenant is the session's tenant. A
  verified machine call scoped to its signed caller tenant resolves the tenant
  level for that tenant; a tenant header alone never names the key's tenant.
- Kafka and cron runs have no user: the user level is skipped even when
  `required`, and resolution goes tenant -> saas. A Kafka-consumed run with a
  human author still takes the workspace level for that author.
- **Fallbacks.** Every fallback provider is resolved on its own. If the
  primary's `required` scope has no key, a text or vision agent run continues
  on the fallbacks that resolve; with none, the 428 is returned. A scoped
  fallback whose `required` scope has no key is skipped, never run on its saas
  key.
- Each `llm_call` event of an agent run carries `credentialScope`
  (`saas | tenant | resource | user`) and, on a resource key,
  `credentialOwnerId: <object>:<id>`, never the key.

### Cost

Usage on a tenant, workspace or user key is always recorded; `costPolicy`
decides which budgets it consumes:

| `costPolicy` | Key level | Charged to | Saas ceilings |
|---|---|---|---|
| `ownerPays` (default) | user | the user's own bucket only | not charged; the daily cost ceiling does not apply, the per-user daily token budget does |
| `ownerPays` | resource | the user's bucket and the row's own-key bucket | not charged; only the row's `budget.dailyCostCeilingUsd` reads its bucket |
| `ownerPays` | tenant | the user's bucket and the tenant's own-key bucket | not charged; no ceiling reads the own-key bucket |
| `saasPays` | user, resource or tenant | as for the saas key | charged |
| any | saas | as before | charged |

- The split applies to the agent cost governor, to agentHub agent runs and
  harness sessions (per model call), and to the MCP BFF chat budget. A call on
  an owner's key never holds the saas budgets.
- **A workspace's budget** bounds one row's spend on its own key per UTC day,
  checked before every call against that row's bucket only. Past it the call is
  refused `429 AGENT_BUDGET_EXCEEDED` with `bucket: "resource"` and
  `resource: "<object>:<id>"`; the message names no amount. Calls in flight
  together hold their estimates, so they overshoot by one call at most. Without
  a budget no ceiling applies to a workspace key. Like every ceiling it is
  enforced per service replica.
- **Fallback chains.** The gate checks the budgets of whoever pays for the
  first provider. A fallback on a key someone else pays for is gated again with
  its own credential before it is tried and the first hold is released, so one
  call holds once. A fallback refused by its gate is skipped like a failed
  provider.
- **MCP BFF admission.** `/chat` and `/ai-complete` refuse with 429 when an
  operator ceiling is reached, except for a turn whose provider resolves to the
  caller's, the tenant's or a workspace's own key under `ownerPays`: the gate is
  re-run with that credential first, and again before every provider call.
- The per-day buckets are in-process ledgers of each service.

### Caching and the change event

- A consumer caches each resolved key in memory for at most 5 minutes, per
  (scope, owner, provider) and, for a user key, the caller's tenant; a "no key"
  answer is cached too.
- On every save and delete the auth service publishes
  `providerCredentialChanged` (ids only: scope, owner, tenant, provider, and
  for a non-AI family its family and row key) on
  `<codename>-auth-service-provider-credential-changed`. Generated services drop
  the cached entry at once, so a new key is used on the next call. The MCP BFF
  has no listener: it picks up a key change within 5 minutes and a membership
  change within 60 seconds.
- The key cache and the membership cache are independent: a membership change
  never evicts a key, and a key change never asks the membership again.

### Other credential families

The same store holds connected mailboxes (a `MailAccount` template with
`ownerScope: tenant | user`, see [Connected mailboxes](../capabilities/connected-mailboxes.md)).
They differ from an AI key: several rows per owner per entry (up to the
template's `maxMailboxesPerOwner`, default 5, each under a mailbox key); routes
under `/my-provider-credentials/mail/:providerName/:credentialKey` (and the
tenant twin; list with `?family=mail`); body keys `refreshToken`, `password`,
`clientSecret` only (a host or routing key is refused by name); verification by
a token exchange or an IMAP login; error codes `PROVIDER_CREDENTIAL_*` (with
`PROVIDER_CREDENTIAL_LIMIT_REACHED` 409 at the upper bound); the masked view
adds `family`, `credentialKey`, `lastError` and the non-secret `extraFields`. A
refresh token the provider revokes marks its row `status: invalid`,
`lastError: invalid_grant`. The change event of a mailbox row carries `family`
and `credentialKey`.

## Operations

Environment variables, console configuration, credential minting, onboarding
and the go-live checklist are operations of a compiler and are not part of the
language. Read the documentation of your compiler for them.

For the Genesis compiler, these operations (environment variables, console configuration, credential setup, webhook registration and the go-live checklist) are in the `genesis-set` package, which installs next to mind-set.

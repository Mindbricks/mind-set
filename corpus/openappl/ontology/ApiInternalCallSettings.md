# ApiInternalCallSettings

**Level:** `section` · **Family:** [BusinessApiControllers](./families.md#businessapicontrollers) (domain `BusinessApi`)

**Specification:** [ApiInternalCallSettings in Part 2](../spec/ApiInternalCallSettings.md)

Marks the Business API as callable IN-PROCESS from ANY MScript-evaluated designer script of the same service, not only from payment lifecycle hooks. The call reads `await API.<apiName>({ ...params })`, and the same in-process namespace is reachable from action expressions and `query.dataClauseItems`, the api-level WHERE-clause helpers, the list-option filters, `BusinessApiParameter.transform` and `defaultValue`, and the hub, video, event-subscription, bucket-auth and notification script slots: `API` is an AMBIENT GLOBAL of the generated service — `src/index.ts` installs the registry on `globalThis` at boot and the emitted `src/global.d.ts` declares its type — so every slot reaches it with no import machinery at all, exactly the way it reaches `LIB`, and the `library.functions` / `library.edgeFunctions` bodies that are emitted as verbatim CommonJS reach it too. (The post-render import pass, src/codegen/transforms/inject-ts-api-import.ts, still adds the `internalApis` import to generated TypeScript for back-compat; it is no longer the mechanism that makes the name resolve, and it never reached a `js` library body.) Unbound `API.<apiName>` references are statically checked in EVERY designer-code slot listed above, and in library and edge-function module bodies, and a miss is an ERROR (`INTERNAL_API_NOT_FOUND` / `INTERNAL_API_NO_CONTROLLER`). A COMPUTED access (`API[expr]`) cannot be resolved at design time and carries a warning instead — write the member literally, because a name reached that way that is not a registry member still surfaces as a runtime TypeError. (This closes the per-slot check gap: there is no longer a slot where the check does not run.) No transport is involved: the internal call controller invokes the API's manager directly, and the FULL manager pipeline still runs — parameter validation, actions, workflow, events, audit — through a trusted-system controller. Internal calls always execute asSystem with the system authorization posture. By default the session is null, so the API must be FULLY PARAMETRIC — every input it needs must be an explicit request parameter. On nodejs, python, rust, java and dotnet the optional second argument explicitly supplies a session: `await API.<apiName>(params, { session: this.session })`. Native Java callers pass a map context to `InternalApis.call(apiName, params, context)`; native C# callers pass a dictionary context as the optional second argument to `API.<apiName>`. A BusinessApi action (and, on nodejs, a hook) that has a caller session and wants the caller's tenant must pass it; ledger internal APIs on a tenant-scoped owner object need it too. No session is implicitly inherited through AsyncLocalStorage or the running manager. A `session` property inside params is only input data. Language targets without explicit-session support retain the sessionless signature. Session-dependent declarations are still flagged by the validator because it judges the sessionless default call; passing a session does not change the internal call's system authorization posture: role and ownership gates remain bypassed.

Name resolution is EXACT and CASE-SENSITIVE. The generated `API` barrel is keyed by the api's declared `name` verbatim, so `API.getOrder` does not resolve an api declared `getorder`, `GetOrder` or `getOrderById` — a case variant is a MISS, never a near-hit. The miss is reported as `INTERNAL_API_NOT_FOUND` — or, when the names differ only in case, as `INTERNAL_API_NAME_CASE_MISMATCH`, whose message names the declared spelling it found — in every designer-code slot and in library / edge-function module bodies alike. The same exactness applies to `targetApi` bindings.

## Contained in

- [BusinessApiControllers](./BusinessApiControllers.md) as `internalCallSettings`

Blueprint paths:

- `authentication.businessLogic.controllers.internalCallSettings`
- `services.businessLogic.controllers.internalCallSettings`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.

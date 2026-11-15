---
title: MScript slot scopes
---

# MScript slot scopes

An MScript expression is not evaluated in one global place. Each slot of a
blueprint lands in a different spot of the generated service, and each spot
binds a different set of names. This page lists, slot by slot, which names a
script may read. For the loop names available inside loop, iterator and
parallel steps see [Step context](step-context.md); for the syntax and the
runtime envelope see [Syntax](syntax.md) and [Overview](overview.md).

## Root identifiers

The **root identifier** of an expression is the leftmost name of a read that is
not a member access: in `LIB.slugify(data.title)` the roots are `LIB` and
`data`. The validator checks, at design time, that every root is a name the
generated service really binds where the expression lands. A root that nothing
binds is reported as `MSCRIPT_UNKNOWN_ROOT_BINDING`, because the generated
service would otherwise either fail to build with an unknown-name error, or
throw `ReferenceError: <x> is not defined` the first time the script runs.

- `this.x` is always a member read. `this` is never reported; what `this.x` may
  name is a different question (see [Step context](step-context.md)).
- A bare `x` is a root and must be bound at the slot. Names the expression
  declares itself (arrow parameters, `const` inside a function body) and the
  JavaScript globals are always fine.
- Quote string constants. A bare `active` where `'active'` was meant is the
  classic case: `active` is read as a variable, nothing binds it, and the
  build fails. Write `"'active'"` inside the JSON string, or
  `{ "js": "'active'" }`.

The checker accepts a name when the generated service resolves it, so it only
ever errs on the accepting side. The generated service's own internal names
(helper functions, locals starting with an underscore, imports) may also
resolve inside a script, but they are not a contract and may change between
compiler releases. This page lists only the names that are bound on purpose,
and only those should appear in a blueprint.

## How to read the tables

- **Build time**: the slot is compiled into the service source. A wrong name
  fails the build.
- **Run time**: the slot is kept as a string and evaluated while the service
  runs. A wrong name builds, then throws when the script runs.
- **Tier**: `error` blocks the blueprint, `warning` only reports.

Only the canonical object form `{ "js": "..." }` of a slot is judged. A plain
string in a slot that expects script source is not judged, and the check reads
the JavaScript source. For how the same slot is written for other target
languages see
[Writing MScript across languages](overview.md#writing-mscript-across-languages).

`LIB` (the project library) and `API` (calls to other APIs) are bound at every
compiled slot, and are added as globals to the run time slots below, so they
are listed only where they are the whole story.

## BusinessApi actions and data clause

| slot | what the script can read | evaluated | tier |
|---|---|---|---|
| any action slot (`condition`, `contextValue`, `payload[].value`, `whereClause`, `apiParameters[].value`, `inputData`, `data`, `body`, ...) | `this`, `LIB`, `API`; inside a loop, iterator or parallel step also the loop item name, `crudItem`, `loopItem`, `stepIndex`, `stepResults` | build time | error |
| `dataToFileActions` column `value`, `rowFilter` | as above, plus `item` | build time | error |
| `dataToFileActions` `beforeWrite`, `fileName`, sheet title and cell values | as above, plus `rows` | build time | error |
| `fileToDataActions` column `value` | as above, plus `row`, `rowIndex`, `existing` | build time | error |
| `fileToDataActions` `rowFilter`, `rowTransform` | as above, plus `row`, `rowIndex` | build time | error |
| `fileToDataActions` `afterParse` | as above, plus `rows`, `rejected`, `total` | build time | error |
| `upsertBulkCrudActions` column policy `value` | as above, plus `row` (incoming), `existing` (stored) | build time | error |
| `query.dataClauseItems[].value` | `this`, `LIB`, `API` only; no loop names, because the data clause is built before any action runs | build time | error |

The loop item name is the one the enclosing loop declares. A loop's own
`loopFor` cannot read its own item, because the item does not exist until the
list has been produced. An action that no loop executes sees no loop names at
all.

## Where clause and list filters

All of these live in the business API and share one scope: `this`
(the API context), `LIB`, `API`. Create APIs emit none of them.

| slot | what the script can read | evaluated | tier |
|---|---|---|---|
| `whereClause.fullWhereClause` | `this`, `LIB`, `API` | build time | error |
| `whereClause.additionalClauses[].condition` and `.whereClause` | `this`, `LIB`, `API` | build time | error |
| `whereClause.fuzzyDomainFilters[].condition` and `.cache.keyExtra` | `this`, `LIB`, `API` | build time | error |
| `listOptions.searchFilter.keyword` and `.condition` | `this`, `LIB`, `API` | build time | error |
| `listOptions.jointFilters.filters[].condition`, `.whereClause`, and the joint filter's fuzzy `condition` and `cache.keyExtra` | `this`, `LIB`, `API` | build time | error |
| `listOptions.membershipFilters[].condition` and `.userKey` | `this`, `LIB`, `API` | build time | error |
| `listOptions.membershipFilters[].checkFor` | `this`, `LIB`, `API`; in its predicate form also `membership` (the record being tested) | build time | error |
| `listOptions.totalCount` | `this`, `LIB`, `API` | build time | error |

A name declared by the generated code after the place your script is
spliced is not an authored name even if it resolves; do not rely on it.

## Parameters, select joins and SSE listeners

These slots are also compiled into the business API, with `this`, `LIB` and
`API` as the base scope.

| slot | what the script can read | evaluated | tier |
|---|---|---|---|
| `BusinessApiParameter.transform` | `this`, `LIB`, `API` | build time | error |
| `BusinessApiParameter.defaultValue` | `this`, `LIB`, `API` | build time | error |
| `RedisApiParameter.redisKey` | `this`, `LIB`, `API` | build time | error |
| `RedisApiParameter.defaultValue` | `this`, `LIB`, `API` | build time | error |
| `selectClause.selectJoins[].condition` | `this`, `LIB`, `API`, `data` (the parent row the join is fetched for; a page of rows on a list API) | build time | error |
| SSE `KafkaProgressListener.correlationField` | `this`, `LIB`, `API` | build time | error |
| SSE `KafkaProgressListener.payloadMapping` and `.completeWhen` | `this`, `LIB`, `API`, `msg` (the progress message) | build time | error |

A parameter default that is an enum value is a string: write `"'monthly'"`, not
`monthly`.

## Realtime hub

Hub gates and logic scripts are not compiled. The generated hub keeps each
source as a string and evaluates it over a context object, so the script
sees exactly the context names below plus `LIB` and `API`, and has **no
`this`**: `this.x` is undefined there.

| slot | what the script can read | evaluated | tier |
|---|---|---|---|
| `roomSettings.roomEligibility` | `room`, the configured room object key | run time | error |
| `roomSettings.checkScript` | `user`, `room`, the configured room object key | run time | error |
| auth source `condition` | `record`, the configured source object key | run time | error |
| auth script `script` | `user`, `room`, `lib`, the configured room object key | run time | error |
| `HubLogic.stateScript` | `session`, `roomId`, `room`, `lib` | run time | error |
| message handler `script` | `session`, `message`, `roomId`, `room`, `lib` | run time | error |
| scheduled action `script` | `roomId`, `room`, `lib` | run time | error |
| `eventSettings.kafkaEvents[].filterExpression` | `data` (the published record: the message's `data` field when the producer uses the unified event envelope, otherwise the whole message) | run time | error |
| `eventSettings.kafkaEvents[].targetRoomExpression` | `data`, and `matches` (the filter result, always `true` here) when the event has a filter | run time | error |

The configured room object key is the room data object name exactly as
written, or `<hubName>Room` when none is configured. The source object key is
the auth source's object name as written. The Kafka event slots are spliced
into plain JavaScript that is not type-checked, so they build and then throw on
the first message. An event has a filter when its `filterExpression` source is
not empty, even if it is only whitespace; without one, `matches` is not
declared and `targetRoomExpression` cannot read it.

## Video rooms

Same mechanism as the hub gates: evaluated over a context object, no
`this`, plus `LIB` and `API`. Here the configured object key is the object
name with its **first letter lowered** (`MeetingRoom` becomes `meetingRoom`).

| slot | what the script can read | evaluated | tier |
|---|---|---|---|
| `roomSettings.roomEligibility` | `room`, the configured room object key | run time | error |
| `roomSettings.checkScript` | `user`, `room`, the configured room object key | run time | error |
| auth source `condition` | `record`, the configured source object key | run time | error |
| auth script `script` | `user`, `room` | run time | error |

A failing script is caught and answered as `false`, so a wrong name silently
denies every caller.

## Bucket authorization

`readAuthScript` and `writeAuthScript` of database, remote and native bucket
authorization share one scope.

| slot | what the script can read | evaluated | tier |
|---|---|---|---|
| bucket `readAuthScript`, `writeAuthScript` | `this` (the request context), `session`, `userId`, `role`, `params`, `query`, `body`, `data`, `LIB`, `API` | build time | error |

## Event notifications

| slot | what the script can read | evaluated | tier |
|---|---|---|---|
| `eventDataSettings.condition` | `this` (the event receiver: `payload`, `dataSource`, `old`, `actor`, `metadata`), `data` (the DataView document when one is configured, otherwise the event record), `LIB`, `API` | build time | error |
| `eventDataSettings.includeData[].value` | as `condition` | build time | error |
| `eventNotificationBasics.actionDeepLink`, `.actionText`, `.dedupKey` | as `condition` | build time | error |
| WhatsApp template `components`, `contentVariables` | as `condition` | build time | error |
| `targets[].condition` | `this`, `target`, `data`, `LIB`, `API` | build time | error |
| `targets[].itemCondition` | as target `condition`, plus the item name given by `targetItemNameInArray` (array targets only) | build time | error |

A slot is judged only when the generator emits it: the event has a name and a
channel, an `includeData` entry has a usable name, an `itemCondition` sits on
an array target, a WhatsApp block belongs to a WhatsApp event. A plain string
in `actionDeepLink` or `actionText` is literal text and is not judged.

## Job streams

| slot | what the script can read | evaluated | tier |
|---|---|---|---|
| `JobStreamTargetBinding.inputMapping` | `input` (the enqueue payload), `this` (the same payload), `LIB`, `API` | build time | error |

The mapping is judged when the stream has a name and a target API.

## Event subscriptions

| slot | what the script can read | evaluated | tier |
|---|---|---|---|
| `auth.authScript` | `session`, `topicName`, `dataObjectName` | run time | warning |
| `auth.filterScript` | `session`, `topicName`, `dataObjectName`, `data`, `event` | run time | warning |
| `topics[].payloadMapping` | `data`, `event` | run time | warning |

There is no `this`, no `LIB` and no `API` here: each script is compiled at
build time into a function over exactly that context object. These are
warnings, not errors, because a name outside the scope throws only when the
script runs, and the service then fails closed: a throwing `authScript`
rejects the topic, a throwing `filterScript` skips the event for that
subscriber, and a throwing `payloadMapping` drops the event for that
subscriber (the full record is never sent in its place).

## DataView aggregate gates

| slot | what the script can read | evaluated | tier |
|---|---|---|---|
| `ViewAggregate.condition` | `this` (the main record), `LIB`, `API` | build time | error |
| `ViewAggregate.checkIn` | `this` (the child record being tested), `LIB`, `API` | build time | error |

Both gates are generated into the aggregator of the view, and also into
the services that consume a dynamic view. Read fields of the record through
`this.<field>`.

## Shopping cart checkout

| slot | what the script can read | evaluated | tier |
|---|---|---|---|
| `orderDataClause` | `this` (the cart manager), `cart`, `cartItems`, `LIB`, `API` | build time | error |
| cart-to-order property mapping `transform` | `this`, `value` (the cart property value), `LIB`, `API` | build time | error |

`orderDataClause` may be written as a braceless object body
(`status: 'new', total: cart.total`) or as one complete expression
(`{ status: 'new' }`, a call). The generator tries the body form first, then
the expression form, and does not strip a trailing `;`: a clause that parses
neither way (for example `{ status: 'new' };`, or a legacy octal literal such
as `010`) is left unapplied and is not judged. A clause is checked only in the
form the generator emits and only when it can be read as the generator reads
it: TypeScript type syntax (`Array.from<string>(x)`, `x as number`) is set
aside and the values are checked; a clause that does not read the same once
its types are removed is not checked. Only mappings that name both a cart
property and an order property are emitted and judged.

## ABAC definitions

| slot | what the script can read | evaluated | tier |
|---|---|---|---|
| `abacDefinitions[].whereClause` | `subject`, `object`, `env`, `LIB`, `API`; `this` is the permissions manager | build time | error |

The check applies to every service whenever permission-based access control is
active, whether or not attribute-based permissions are switched on. The
generated permission manager keeps one condition per permission, from the last
definition that lists it, so a definition is checked only when it lists at
least one permission that no later definition lists. Permission names are
compared loosely, ignoring case and the `-`, `_`, `.` and space separators, so
every spelling the build rewrites to the same code name counts as one
permission (`CanEditDocument` and `can-edit-document` count as
`canEditDocument`). A definition without permissions, or whose permissions all
reappear further down, is never generated and is not checked.

## Slots that are not checked this way

| slot | reason |
|---|---|
| `permissionFilters[].condition`, `setAsRead[].value` (list and get options) | the generator does not emit them |
| an additional clause `condition` without a `whereClause` | the generator emits neither |
| `StreamSourceConfig.relayUrl`, `.relayAuth` | nothing reads them |
| `GeofenceTrigger.fenceFilter`, `.condition` | copied into the trigger, never consumed |
| `EventNotificationBasics.fromUser` | no emitter reads it |
| `userAutoAvatarScript`, `userGroupAutoAvatarScript`, `tenantAutoAvatarScript` | copied into the auth settings and never read or emitted |
| `ViewStat.select`, `AggregateItem.filterValue` | lowered at compile time into a search-engine query, never JavaScript in the service; their own checks cover the allowed `this.<field>` form |
| `MembershipSettingsConfig.membershipStatusCheck` | evaluated once at compile time with an empty scope and baked into the query as JSON; already refused by its own check when it reads any name |
| `CleaningRule.expression` | Spark SQL or PySpark column operation, not JavaScript |
| `AgentCustomTool.handler` | a library function name used as a registry key, not an expression |
| `ArrowFunctionAction.functionBody` | a statement list with its own parameters, not an expression |
| legacy plain-string values of any slot above, except the two DataView aggregate gates | ambiguous; only the `{ "js": "..." }` form is judged. A plain-string `ViewAggregate.condition` or `.checkIn` is compiled as code, so it is judged like the `{ "js": "..." }` form |

Two slots that look special are judged by their own checks with the same
scope as their neighbours: `PropertyStaticJoin.defaultValue` (`this`, `LIB`,
`API`) and `IntegrationParameter.parameterValue` (the action scope above).

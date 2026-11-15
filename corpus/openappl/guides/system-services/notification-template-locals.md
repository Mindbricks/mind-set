---
title: Notification template locals
---

# Notification template locals

A notification template is EJS, rendered against the notification metadata under
`with (locals)`. Every bare identifier the template reads must therefore be a KEY of that
metadata, or the read throws a `ReferenceError` and nothing is sent. This page defines
which identifiers the language treats as **required**, what happens at design time and at
render time when one is missing, and how to declare a local optional.

## What the render scope contains

- the triggering event RECORD's own fields, spread at TOP LEVEL: write `<%= subject %>`,
  never `<%= task.subject %>`; there is no wrapper object;
- `_old`: the envelope's previous-row image on update/delete db events, else null. Always a
  key, so reading it never throws;
- `_actor`: the envelope actor, else null. Always a key;
- `actionDeepLink` / `actionText`: the evaluated MScript values. Always keys;
- `dataSource`: the whole fetched DataView document as ONE nested object, and ONLY when the
  event declares `eventDataSettings.dataViewName`. On an event with no declared view it is
  not a key at all, and reading it throws.
- `recipient`: `{ userId, handle, language, channel }`, and ONLY when the template sets
  `renderPerRecipient: true`. Without that opt-in the render is shared across recipients,
  so no recipient exists to bind: it is not a key at all, and reading it throws. Design
  time flags the read and names the flag.

Each per-language **variant** (`template.variants[]`) has exactly this same scope and the
same required-locals rules. A variant's required locals are parsed from ITS OWN text, so a
delivery is never refused for a local the fallback needed and the translation does not.

## Required versus optional locals

A **required local** is decided by parsing the template as the renderer would compile it,
never by a regex over the template body: every free root identifier of the compiled body
is a local the template reads. Such a root is REQUIRED unless the template itself proves
it tolerates absence. There are exactly two proofs:

1. the name appears at least once as the operand of `typeof` anywhere in the template, or
2. the name is read only through the always-bound `locals` object (`<%= locals.maybe %>`).

Anything else, a bare read anywhere in the body, is required.

One `typeof` mention is enough, deliberately. The guarded shape is

```ejs
<% if (typeof fromStatus !== 'undefined' && fromStatus) { %>
  from "<%= humanize(fromStatus) %>"
<% } %>
```

where the same name is also read bare, protected by short-circuit. Requiring every
occurrence to be a `typeof` operand would call that correct template broken. The language
does not try to work out which bare reads a given `typeof` actually dominates; writing
`typeof x` at all is taken as the author's declaration that `x` is optional. The
classification can therefore only UNDER-report a missing local, which is the safe
direction: a false refusal costs a real notification, a missed one costs only a blank
interpolation.

Locals declared inside the template itself (`<% const total = a + b %>`), function
parameters and callback arguments are not locals of the render scope at all, and are
never reported.

## At render time: a missing required local is refused BY NAME

The compiler records the required list for each template pair (subject and body of one
channel). Before rendering, the service compares that list against the bound metadata and
reports:

```json
{
  "subject": "",
  "body": "<p>…</p>",
  "renderError": "subject template: required template local(s) not bound: task",
  "renderErrorCode": "NOTIF_TEMPLATE_MISSING_LOCAL",
  "missingLocals": ["task"]
}
```

The unaffected slot still renders (`body` above). The check runs BEFORE the render, not as a
reading of whatever the render threw: EJS reports only the first unbound identifier it
reaches, so a template missing three locals could otherwise name only one, and a missing
local sitting inside a conditional would surface on some events and not others.

A key bound to `null` or `undefined` is PRESENT: the test is key presence, not truthiness,
so `_old: null` renders as an empty string and is never reported missing.

**The service refuses the delivery when `missingLocals` is non-empty, including when the
other slot rendered fine.** The delivery row lands `failed` with the local named in its
reason, and no message is sent or stored. A mail whose subject line lost its only
interpolation is worse than no mail, and a silently blank slot gives an operator nothing
to act on.

Every OTHER partial render error still delivers. Only the missing-required-local class
refuses.

## At design time: `NOTIF_TEMPLATE_ROOT_NOT_IN_CONTEXT`

Two warnings use the same parse:

- `NOTIF_TEMPLATE_UNRESOLVED_ROOT`: the template reads one of the condition-MScript names
  (`data`, `payload`, `old`, `actor`, `metadata`), which templates never bind, or reads
  `dataSource` on an event that declares no `dataViewName`.
- `NOTIF_TEMPLATE_ROOT_NOT_IN_CONTEXT`: a REQUIRED root that nothing in the event's
  declared context binds at TOP LEVEL. The top-level context is the bindings above, plus
  the flat record fields of the producing event's data object, plus the declared
  `includeData` keys, matched exactly as the listener writes them (trimmed,
  case-sensitive: an entry named `Subject` does not bind `<%= subject %>`, and since the
  name canonicalizer rewrites `Subject` to `subject` only an already-canonical name is
  certified). The declared DataView is NOT part of it: the view document is bound only
  under `dataSource`, so a property the view projects but the record does not carry must be
  read as `<%= dataSource.<property> %>`. The warning names such roots (`viewOnlyRoots` in
  its details) and gives that read.

The second warning is raised only where all of that is actually knowable: the event
declares a `dataViewName`, the view is found in the project, and the producer of
`eventDataSettings.channel` resolves to a topic whose record shape the language models. An
event with no declared view reads a shape the author never pinned down, and judging that
produced mostly false positives, so it stays unjudged.

Both are WARNINGS. Neither ever blocks a build.

The commonest true positive is a template written against a nested wrapper while its
DataView projects a FLAT shape:

```ejs
<%# warns: the task record carries `subject`, there is no `task` wrapper %>
New action assigned to you: <%= task.subject %>

<%# correct: taskCreated's record is the task row, so `subject` is top level %>
New action assigned to you: <%= subject %>
```

The second shape is a read of a field only the VIEW carries. `taskWatcherAdded` is
produced by the taskWatcher row (taskId, watcherUserId, addedByUserId) and declares
`taskCreatedNotificationView`, which projects `subject`:

```ejs
<%# warns: `subject` is projected by the view, not carried by the record %>
You are now following: <%= subject %>

<%# correct: the view document is bound under dataSource %>
You are now following: <%= dataSource.subject %>
```

If a read genuinely has no equivalent anywhere (`group.name` where the view projects only
`authGroupId`), add the property to the view AND read it under `dataSource`, or remove the
read. Projecting a property into the view never binds it at top level. Do not silence the
warning by leaving the read in place.

## Guidance for optional locals

- Framework metadata: `_actor` and `_old` are always bound (possibly null). `dataSource` is
  bound after a successful DataView read for events declaring a view. These can stay bare.
- Values the template assigns itself (`<% const total = a + b %>`) and callback parameters
  need no absent-local guard.
- A display field that only some events carry (a ticket subject, a previous status) is an
  optional local: guard it with `typeof`, not with the event discriminator. The event
  condition chooses the event type; it does not guarantee the display fields.
- A CTA condition on `actionDeepLink` is safe only when its MScript always yields a string
  once the event and view prerequisites pass. An action script that returns undefined or
  throws can leave its metadata key absent.
- A blanket ban on bare `if` identifiers is deliberately not used: it would misclassify
  local variables and event guarantees, and could hide broken producers.

## Other targets

The definition above is the reference one. A compiler may render with a different EJS
engine or an EJS subset; where an interpolation whose path is not bound renders as the
empty string instead of throwing, "required local" is not observable at render time the
way it is here. A compiler states its own definition, or its divergence from this one, in
its specification. See [the compiler specification](../../compiler/index.md).

Render failures produce failed delivery diagnostics; they are not successful empty
messages. See [notification service](notification.md).

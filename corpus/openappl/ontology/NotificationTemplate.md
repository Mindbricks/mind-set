# NotificationTemplate

**Level:** `section` · **Family:** [EventNotification](./families.md#eventnotification) (domain `NotificationService`)

**Specification:** [NotificationTemplate in Part 2](../spec/NotificationTemplate.md)

Defines a notification template used to render the content of event notifications. Templates are written in EJS. **Variable scope**: the template's variables are the notification metadata keys at TOP LEVEL — the triggering event RECORD's own fields (the unified envelope's `data`, the very same root `targetPathInData` reads), spread directly into the render scope. Write `<%= followerFullname %>`, NEVER `<%= data.followerFullname %>`: there is no `data` wrapper in templates — the bare `data` root exists only in the condition MScript slots — so a `data.` read throws a ReferenceError at render time, the render degrades to an empty string, and a notification whose subject and body are both empty because of a render error is recorded as a FAILED delivery instead of being sent. Besides the record's fields the scope carries `_old` (the envelope's previous-row image on update/delete db events, else null), `_actor` (the envelope actor, else null), `actionDeepLink`/`actionText` (the evaluated MScript values; each key is absent when its script fails), and — only when `eventDataSettings.dataViewName` is set — `dataSource`, the whole fetched DataView document as ONE nested object (`<%= dataSource.someJoinedField %>`; the record's fields stay at top level beside it). **Required locals**: every free root identifier of the compiled template body is REQUIRED unless the template proves it tolerates absence, either by mentioning it once as a `typeof` operand or by reading it only through the always-bound `locals` object. At render time a required local the bound context does not carry REFUSES the delivery and NAMES it (`renderErrorCode: 'NOTIF_TEMPLATE_MISSING_LOCAL'`, `missingLocals: [...]`), including when only the other slot rendered fine: nothing is sent and nothing is stored. A key bound to null counts as PRESENT, so `_old` never triggers this. At design time the same parse warns `NOTIF_TEMPLATE_ROOT_NOT_IN_CONTEXT` when a required root is neither a framework binding, nor a flat field of the producing event's record, nor a declared `includeData` key. A property the declared DataView projects is NOT a top-level local: the view document is bound only under `dataSource`, so a field the record does not carry is read as `<%= dataSource.<field> %>`, and the warning names that read.

## Contained in

- [EventNotification](./EventNotification.md) as `template`

Blueprint paths:

- `notificationService.eventNotifications.template`

## Contains

- `variants`: [NotificationTemplateVariant](./NotificationTemplateVariant.md), a list
- `whatsappTemplate`: [NotificationWhatsAppTemplate](./NotificationWhatsAppTemplate.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.

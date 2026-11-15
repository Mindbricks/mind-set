# GeofenceTrigger

**Level:** `section` · **Family:** [EventNotification](../ontology/families.md#eventnotification) (domain `NotificationService`)

**Ontology:** [GeofenceTrigger in Part 1](../ontology/GeofenceTrigger.md)

Geofence trigger spec — applied to EventNotifications with triggerSource='geofence'. Fences are runtime DATA (managed via the GeoFence DataObject the notification factory emits), not design-time assets, so this block declares a RULE that matches fences at crossing time rather than specific fence names.

Matching pipeline at runtime: per crossing event {action, fence, userId, ...}, the notification handler subscribes by `action` (one Kafka topic per action: enter/exit/dwell), then filters by `fenceTags` (any-of match against the fence record's tags array, when set), then evaluates the optional `fenceFilter` MScript against the fence record, then evaluates the optional `condition` MScript against the full event payload. All filters default to 'match' when null.

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `action` | `GeofenceTriggerAction` | no | `"enter"` | `enter`, `exit`, `dwell` |  | Which crossing kind triggers this notification: enter \| exit \| dwell. 'dwell' fires after the device has been continuously inside the fence for at least the fence record's dwellSeconds. |
| `fenceTags` | `String`[] | no |  |  |  | Optional tag any-of filter. When set, the notification only fires for fences whose `tags` array shares at least one entry with this list. Use for the common case 'notify on entry to a parking-category fence'. Null/empty = match every fence. |
| `fenceFilter` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript filter evaluated against the fence record at crossing time. Available scope: `fence` (the matched GeoFence row), `crossing` ({ userId, deviceId, lat, lng, occurredAt }). Use when fenceTags isn't expressive enough — e.g. `{ "js": "fence.metadata.priority > 5" }`. Null = match. |
| `condition` | [`MScript`](./MScript.md) | no |  |  | MScript kind `code` | Optional MScript condition evaluated against the full event payload (event + fence + crossing). Mirrors eventDataSettings.condition semantics. Null = match. |

## Constraints

Property rules:

- `action` must be one of the allowed values (compared case-insensitively). (`INVALID_ENUM_VALUE`)

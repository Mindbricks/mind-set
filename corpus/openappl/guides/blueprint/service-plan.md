---
title: The service plan
---

# The service plan

`projectSettings.servicePlan` records the services the project **intends** to create, as
named by the design's microservice definitions. It is carried into the blueprint for
reference. It never changes what is built.

```json
"projectSettings": {
  "servicePlan": [
    { "serviceName": "catalog",  "dataObjects": ["book", "author"] },
    { "serviceName": "orders" }
  ]
}
```

## When a plan exists

A plan **exists** when `servicePlan` is a non-empty array and at least one entry yields a
service name: a non-empty string entry, or an object with a non-empty `serviceName` (or
`name`, or `service`). An empty array, a missing field, or entries without any name count
as **no plan**.

- A plan that exists is intent, not an inventory. A planned service that is never built is
  not a defect, a service that exists but is not in the plan is not a finding, and a
  difference between the plan and the roster of services is not an error. The plan may be
  deleted once the last planned service exists.
- When there is **no plan** yet, write one: one entry per service of the roster, in roster
  order, `{ "serviceName": <the roster name exactly> }`, plus `"dataObjects": [...]` when
  the service definition names its data objects. When a plan already exists, write nothing.
- Entries are compared by `serviceName`, case-insensitively, and must be distinct
  (`DUPLICATE_ASSET_NAME`). `dataObjects` is documentation only: nothing validates,
  resolves or tiers on it, and it may go stale.

## What it changes

Exactly one thing, and only at design-time validation:

> A reference into a service that does not exist yet is reported as a **warning** when the
> plan names that service, and stays an **error** when it does not.

That is the first time a forward reference (a service you will write later) is
distinguishable from a typo. It never exempts anything at build time, nothing resolves,
loads, joins to or emits against a planned service, and a compiler never reads the plan.

So while you author services one by one, a reference to a planned-but-unwritten service
is a warning you expect, and it must be gone, or the target must exist, before delivery:
a reference to a service that is
still missing at delivery is a gap. Write the plan before the first service so that forward
references are warnings and real typos remain errors.

See [`ServicePlanEntry`](../../spec/ServicePlanEntry.md) and the `servicePlan` property of
[`ProjectSettings`](../../spec/ProjectSettings.md).

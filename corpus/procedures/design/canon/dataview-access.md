# DataView access - designed in the BFF, READ through an ordinary service

Read by the service-spec and bff-spec writers, so the spec that declares a
view need and the spec that designs the view agree on how it is reached.

**A DataView is DECLARED in the BFF and CONSUMED somewhere else. Those are
different services, and the read never goes through the BFF.**

- **Declared** under `bffService.dataViews` - and only there. Views are not a
  field of a domain service; scattering them would defeat the cross-service
  aggregation the BFF exists for.
- **Stored** (when `isStored: true`) in Elasticsearch at index
  `<codename>_<viewName>`, kept current by Kafka consumers inside the
  generated `bff` service.
- **Read** by an ORDINARY service's own Business API that sets
  `apiOptions.dataViewName` - there is no HTTP hop to the BFF. For a STORED
  view the generated API queries the view's index itself; for a DYNAMIC view
  (`isStored: false`, the default) it reads its object from the DATABASE with
  its own where clause and joins the view's aggregates/stats onto each row per
  request (fresh, no index).

**The BFF mounts NO public read route for a view - by design.** The generated
`bff` service exposes admin endpoints only (view repair, schema, filters, HTTP
logs). A dashboard or analytics use case is reachable over REST at the
CONSUMING service's route: if no service declares an API with that
`dataViewName`, the gap is "no service consumes this view" - a design gap in
the consuming service, never "views are not exposed".

Binding rules a spec must respect:

- An API using `dataViewName` also names `dataObjectName`, and it must match
  the view's `mainObject`.
- Only `get` and `list` read from the view. Every write - `create`, `update`,
  `delete`, including the instance fetch `update` and `delete` perform - runs
  against the database. A view is a read model, never the source of truth for
  a write path, and a write is not visible in a stored view until its indexing
  round trip has landed.
- A service that reads a STORED view gains an Elasticsearch dependency. That
  is an accepted trade-off, not a defect. A dynamic view adds no index and no
  Elasticsearch dependency; it costs its joins on every read.

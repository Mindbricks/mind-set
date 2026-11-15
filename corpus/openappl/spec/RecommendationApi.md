# RecommendationApi

**Level:** `subsection` · **Family:** [ObjectSettings](../ontology/families.md#objectsettings) (domain `DataObject`)

**Ontology:** [RecommendationApi in Part 1](../ontology/RecommendationApi.md)

Serving-route options of a recommendation list (recommendation ADR section 5.4).

## Properties

| Name | Type | Required | Default | Allowed values | Details | Description |
| --- | --- | --- | --- | --- | --- | --- |
| `routePath` | `String` | no |  |  |  | Overrides the list's route path (a leading slash is added). Null serves `GET /<items>/:<item>Id/recommendations/<list>` for an anchor-based list (related, complementary, next) and `GET /<items>/recommendations/<list>` for an actor-based or global one; `<items>` is the plural item collection of the default BusinessApi routes, and each route is also mounted under `/v1`. |
| `exposePublic` | `Boolean` | no |  |  |  | Null (the default) inherits the read gate of the item object's get api: its login, checkRoles, absoluteRoles and ownership (a login-free get api skips checkRoles, ownershipCheck and parentOwnershipChecks, and so does the list), and its whereClause, which the list APPLIES to every candidate for every caller, absolute roles included (a row rule is logic, not authorization), when it reads only constants, LIB, the addressed id and the caller's session; a whereClause or a removeFromResponse condition that reads anything else (a request parameter) closes the list to every caller (403 RECOMMENDATION_GATE_NOT_INHERITED). With a get api on the item, it never widens that gate: true is ignored (RECOMMENDATION_EXPOSE_PUBLIC_IGNORED over a login-required get api) and false forces a login. With no get api on the item: false admits any logged-in caller; true serves the list without a session only when the item's dataObjectAccess is accessPublic, and over any other object the list stays closed (RECOMMENDATION_NO_READ_GATE), as it does when unset. |

## Constraints

No rule beyond the property types is attributed to this pattern. See [Constraints coverage](./constraints.md) for what this block covers.

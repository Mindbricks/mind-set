# Reading a blueprint as a contract

A compiled OpenAPPL project is fully described by its blueprint. Routes, request and
response shapes, error bodies, events and the functions authored code can call all follow
from it by fixed rules, the same for every conformant compiler. Code that lives around
the generated system (a frontend, a client SDK, an integration, tests, and the library
functions and edge controllers inside the blueprint) can therefore be written against the
blueprint alone.

This guide is the method. The rules come from Part 3 of the OpenAPPL specification:
chapter 5, Business API semantics (`../openappl/compiler/05-business-apis.md`), chapter
12, Derived surface (`../openappl/compiler/12-derived-surface.md`), and the event bus
contract of chapter 7, summarised in section 7 below. Where Part 3 marks a rule "To
verify", test it against a running system before you rely on it.

The backend is not part of this method. It is the compiler's output; you do not write it.
When your code needs something the blueprint does not declare, the blueprint changes,
not the backend.

## 1. The three kinds of API

Every API of a generated service is one of three kinds, and a client sees no others:

| Kind | Where it comes from | Where you read it |
|---|---|---|
| **Declared** | an entry of `Service.businessLogic[]` (or `authentication.businessLogic[]`) | the blueprint |
| **Lowered** | added by a high-level pattern, for example the payment APIs of a checkout order or the user APIs of the authentication section | chapter 12.1, per pattern |
| **Implicit** | a route a property or a setting brings with it (geo routes, bucket routes, payment routes), or an operational route every service has | chapter 12.2 |

Lowered APIs are ordinary business APIs: every rule of sections 2 to 6 applies to them.
Implicit routes have their own contract, listed with their trigger in chapter 12.2 and in
the system-service chapters of Part 3.

## 2. Services and addresses

- `projectSettings.basicSettings.name` and the root `codename` name the project. A service
  is `services[].serviceSettings.serviceBasics.name`.
- The service codename is `<projectCodename>-<serviceName>-service`, lower-cased. Event
  topics and the envelope's `source` use it.
- System services appear when the blueprint turns them on: `auth` with an
  `authentication` section (always first), `notification`, `agentHub`, and `bff` (last)
  with data views.
- The base address of each service comes from the deployment or the hosting platform.
  Every route below is relative to it, and every business route also answers under the
  prefix `/v1`. Keep the base address configurable; never hard-code a host.

## 3. Routes

### Method and success status by `crudType`

| `crudType` | Method | Success | Addresses |
|---|---|---|---|
| `create` | `POST` | 201 | a new record |
| `get` | `GET` | 200 | one record |
| `list` | `GET` | 200 | a page of records |
| `update` | `PATCH` | 200 | one record |
| `delete` | `DELETE` | 200 | one record |

`controllers.restSettings.forcePOSTMethod: true` makes any API a `POST`. `GET` and
`DELETE` carry no body. An API with `controllers.restSettings.hasRestController: false`
has no route at all.

### Path

- An explicit `controllers.restSettings.routePath` is used as written (a leading `/v1` is
  dropped; `:name` segments are path parameters).
- Otherwise the path is derived from the API name and the data object:
  1. Split the camelCase name: the first word is the action, the rest (joined,
     lower-cased) is the resource. A one-word name has the action `do`.
  2. Action `get`, `list`, `create`, `update` or `delete` with the object's name (or its
     plural) as resource: the path is the plural of the object name, lower-cased.
  3. One of those five actions with another resource: the path is that resource.
  4. Any other verb: action plus resource, lower-cased, not pluralised.
  5. `create` and `list` use `/<path>`; `get`, `update` and `delete` use
     `/<path>/:<objectName>Id`.
  6. A single non-`id` select-by field gives `/<path>/:<field>`.

| API | Object | Route |
|---|---|---|
| `createOrder` | `order` | `POST /orders` |
| `getOrderItem` | `orderItem` | `GET /orderitems/:orderItemId` |
| `publishOrder` (update) | `order` | `PATCH /publishorder/:orderId` |
| `clearBasket` (delete) | `basketItem` | `DELETE /clearbasket/:basketItemId` |

Irregular plurals follow the reference's English pluralisation. When a name is not a
plain noun, prefer to read the route from the service's published API description
(`GET /openapi.json`) of a running system, or ask for an explicit `routePath`.

### Parameters

Each entry of `parameters.requestParameters[]` is a request field:

- `name` is the field name; `type` its OpenAPPL type (section 5); `required` makes it
  mandatory.
- `httpLocation` says where it is read: `body`, `query`, `urlpath`, `header`, `cookie`,
  `bearer`, `session` or `request`. When it is not given, it is `query` for `GET` and
  `DELETE` and `body` otherwise. A path parameter wins over a body field of the same name.
- A missing required parameter answers 400, listing every missing one. A malformed id
  answers 400.
- `session` and `request` parameters are filled by the system, not sent by the client.

What the API stores is in `query.dataClauseItems`: each entry names a property and the
expression that fills it (`this.<param>` for a request value, `this.session.userId` for
the caller). Read it to know which request fields matter and which values the server sets
by itself.

### Authorization at a glance

| Blueprint | What the client must send or expect |
|---|---|
| `authOptions.loginRequired: true` | a session token; 401 `UNAUTHORIZED` without one |
| `authOptions.checkRoles` | a session with one of the roles; 403 otherwise |
| `authOptions.ownershipCheck: true` | get, update, delete: 404 when no record is in scope, 403 when it belongs to someone else; list: only the caller's records |
| a tenant-scoped object in a multi-tenant project | the tenant (from the session, or the tenant header); a record of another tenant answers 404 |
| `authOptions.loginRequired: false` | no token needed; the where clause decides what anonymous callers see |

Request headers:

| Purpose | Header |
|---|---|
| Session token | `Authorization: Bearer <token>`, or the header or cookie `<projectCodename>-access-token` |
| Tenant | `mbx-<tenantName>-codename` (configurable) |
| Correlation | `x-request-id` (echoed as `X-Request-Id`) |
| Idempotency | `api-idempotency-key`, when `apiOptions.useIdempotencyKey: true` |
| Message language | `Accept-Language` |

The login API of the authentication service returns `accessToken` (and `refreshToken`
when enabled) in its body and sets the session cookie.

## 4. Responses

### Success

| API type | Body |
|---|---|
| create, get, update, delete | the record at the top level, plus `"_type": "<objectName>"` |
| list | `{ "data": [records], "paging": { "page", "pageSize", "totalCount", "totalPages" } }` |
| get, update or delete with `apiOptions.onNotFound: "complete"` and no record | 200 with `{}` |
| a write held for moderation | 202 with `{ "moderation": { "id", "status", "message" } }` |

- There is no wrapper object and no status field in a success body.
- `query.selectClause.selectProperties` limits the record to those properties plus `id`
  and `_type`. `selectJoins` embed a related record under the join's name.
- A get or list with `dataViewName` returns the view's document instead of the record.
- Values added by `AddToResponseAction` appear at the top level, beside the record or
  beside `data` and `paging`.
- `actionFailures: [{ "action", "error", "retryable"?, "errorCode"? }]` appears only when
  a post-write action failed after the write committed. The write happened; show the
  result and treat the failure as a warning.

### Paging

- Send `page` (from 1) and `pageSize` (1 to 1000); `pageNumber` and `pageRowCount` are
  accepted aliases. The default page size is the API's
  `paginationOptions.defaultPageRowCount`, else 25.
- With `paginationOptions.cursorMode: true`, send `cursor` and read
  `paging.nextCursor` (null at the end); there is no total.
- With `paginationOptions.unpaged: true`, the whole set comes back on one page.
- Sorting is the API's `listSortBy`; runtime `sortBy`, `sortOrder` and `q` work only when
  the API's runtime filters enable them.

### Errors

Every error is an RFC 9457 problem document (`Content-Type: application/problem+json`):

```json
{
  "type": "about:blank",
  "title": "Not Found",
  "status": 404,
  "detail": "order not found",
  "errorCode": "NOT_FOUND",
  "requestId": "6f1c..."
}
```

- Branch on `status` and `errorCode`, never on `detail` (it is for people, and is
  translated by `Accept-Language`).
- `retryable: true` marks a transient failure (a dependency is down). Retry those only.
- `errors` carries per-field validation errors when there are several.
- Default codes: 400 `BAD_REQUEST`, 401 `UNAUTHORIZED`, 402 `PAYMENT_REQUIRED`, 403
  `FORBIDDEN`, 404 `NOT_FOUND`, 409 `CONFLICT`, 413 `CONTENT_TOO_LARGE`, 422
  `VALIDATION_ERROR`, 429 `TOO_MANY_REQUESTS`, 500 `INTERNAL_ERROR`, 503
  `SERVICE_UNAVAILABLE`. Specific codes (for example `RELATION_RESTRICTED`,
  `IDEMPOTENCY_KEY_INCONSISTENCY`) replace the default.

## 5. The data contract

A record on the wire has the object's declared properties plus the system fields:

| Field | On the wire |
|---|---|
| `id` | string: a UUID on a relational store, a 24-hex id on a document store |
| `createdAt`, `updatedAt` | ISO 8601 UTC with milliseconds |
| `isActive` | boolean, on soft-delete objects; a deleted record has `false` |
| `<tenantName>Id` | the tenant id, on tenant-scoped objects |
| `_type` | the object name |

Property types map as follows:

| OpenAPPL type | JSON |
|---|---|
| `ID`, `String`, `Text` | string |
| `Integer`, `Short`, `Double`, `Float`, `Decimal` | number (`Decimal` rounded to its scale) |
| `Boolean` | boolean |
| `Date` | ISO 8601 string |
| `Enum` | string, one of `enumOptions` |
| `Object` | any JSON value |
| `GeoPoint`, `GeoRoute`, `GeoArea` | GeoJSON geometry |
| `isArray: true` | an array of the type |

Never expect a property marked `basicSettings.hashed` or `isSecret`, or a bookkeeping
column such as `_archivedAt`: they are removed from every response and every event.

## 6. The derived surface

A blueprint declares less than the compiled project contains. Before you write a client
or a test, list for each high-level pattern in the blueprint what it adds
(chapter 12):

- **Lowered data objects and APIs** (12.1). The tables there give the data objects
  (`sys_<X>Payment`, `sys_<X>ModerationReview`, ...) and the business APIs
  (`get<X>PaymentByOrderId`, `list<X>ModerationQueue`, ...) per trigger, where `X` is the
  declared object. Their routes and envelopes follow sections 3 and 4.
- **Implicit routes** (12.2). Every service has `GET /health`, `GET /health/ready`,
  `GET /openapi.json` and `GET /swagger`; settings add more: geo routes, bucket upload and
  download routes, payment routes and the provider webhook, cron-job routes, edge
  controllers under `/edge`. Use only the routes with a public contract; operational
  routes (`/admin/...`) are for operators.
- **Implicit storage** (12.3) is not interface. Do not read raw system tables, search
  indices or cache keys from client code.
- **The library surface** (12.4) is what code inside the blueprint can call:
  - `LIB.<name>`: the service's authored library functions;
  - `LIB.common`: shared helpers (`slugify`, `md5`, `intHash` are required in every
    compiler; `newUUID`, `hashString` and others are recommended);
  - `LIB.dataViews.<view>(filter, options)` and `LIB.serviceFiles` when declared;
  - `API.<name>`: the service's own APIs that allow internal calls;
  - the data-access operations of each stored object (`get<Obj>AggById`,
    `get<Obj>By<Property>`, `get<Obj>ListByMQuery`, `updateWhere`, ...).

  Library code that imports a compiler's internal modules is not portable; keep to these
  names.

## 7. Events

Services announce changes on a logical event bus (Part 3, chapter 7). Integrations,
realtime clients and tests can consume them.

### Topics

| Family | Topic | Raised by |
|---|---|---|
| Data change | `<serviceCodename>-dbevent-<objectname>-created`, `-updated`, `-deleted` | every write to a stored object, unless `objectSettings.basicSettings.publishDbEvents` is `false` |
| API event | `<serviceCodename>-<suffix>` | an API with `apiOptions.raiseApiEvent: true` |
| Authored event | `<projectCodename>-<topic>` | a `PublishEventAction` |
| Payment status | `<objectName>-payment-updated`, `<objectName>-payment-paymentdone` | checkout objects |

The API event suffix is `apiOptions.raisedEventTopic` when set (lower-cased). Otherwise it
is derived from the API name: resource plus the passive form of the verb, with `get`
read as `retrieve` (`getBasketItem` gives `basketitem-retrieved`, `clearBasket` gives
`basket-cleared`). For names that are not plain CRUD verbs, ask for an explicit
`raisedEventTopic` rather than guessing the English passive.

### The envelope

```json
{
  "id": "0b7d6f0e-3c1e-4a51-9a7e-5d1d8c2f9b11",
  "type": "order.created",
  "source": "shopfront-sales-service",
  "time": "2026-11-12T08:15:30.123Z",
  "requestId": "6f1c...",
  "actor": { "userId": "...", "sessionId": "...", "tenantId": "...", "roleId": "user" },
  "data": { "id": "...", "status": "pending", "_type": "order" },
  "old": null
}
```

- `type` is `<object>.<created|updated|deleted|retrieved|listed>` (an API event's `type`
  is its CRUD type, not its topic); for an authored event it is the topic.
- `data` is the record (an array for the event of a list API); `old` is the record
  before the change on updates.
- No token, credential or secret property is ever in an envelope.

### Delivery

- At least once: a consumer must tolerate duplicates. Deduplicate on the envelope `id`.
- No ordering, not even for one record: use `data.updatedAt` when order matters.
- An event is published only after the change committed; an API event only after a
  successful response.

## 8. Worked example: the `shop` blueprint

`../examples/shop.json` is project `shopfront` with one domain service, `sales`, so its
service codename is `shopfront-sales-service`. It has an `authentication` section, so the
`auth` service exists too.

### Declared APIs

| API | Blueprint | Route | Access | Body or query | Answer |
|---|---|---|---|---|---|
| `listProducts` | list `product`, `routePath: "/products"` | `GET /products` | public (`loginRequired: false`) | `page`, `pageSize` | `{ data: [product], paging }` |
| `createOrder` | create `order`, `routePath: "/orders"` | `POST /orders` | login | `productId`, `quantity`, `amount`, `currency` (body, required) | 201, the order with `status: "pending"` and `customerId` = caller |
| `listMyOrders` | list `order`, `ownershipCheck`, `routePath: "/orders"` | `GET /orders` | login | `page`, `pageSize` | `{ data: [order], paging }`, the caller's orders only |

The explicit `routePath` matters for `listMyOrders`: without it the derived path would be
`/myorders` (rule 3 of section 3). `createOrder` writes `status` as the constant
`'pending'` and `customerId` from the session, so a client never sends them.

An `order` record on the wire: `id`, `productId`, `quantity`, `amount`, `currency`,
`status` (one of the enum options), `statusUpdatedAt`, `customerId`, `createdAt`,
`updatedAt`, `isActive`, `_type: "order"`.

### Lowered by `objectSettings.checkout`

`order` sets `checkout.objectIsAnOrderObject: true`, so the compiler adds (chapter 12.1):

- data objects `sys_orderPayment`, `sys_orderRefund`, `sys_orderDispute`,
  `sys_paymentEvent` and `sys_paymentWebhookSecret` in `sales`, and `sys_paymentCustomer`
  and `sys_paymentMethod` in `auth`;
- business APIs on the payment ticket, with the routes the reference gives them:

| API | Route | Who may call it |
|---|---|---|
| `getOrderPayment` | `GET /orderpayment/:id` | the ticket's owner; payment administrators |
| `listOrderPayments` | `GET /orderpayments` | the caller's tickets; payment administrators see all |
| `getOrderPaymentByOrderId` | `GET /orderpaymentbyorderid/:orderId` | the owner with the checkout role; payment administrators |
| `getOrderPaymentByPaymentId` | `GET /orderpaymentbypaymentid/:paymentId` | as above, by the provider's payment id |
| `createOrderPayment`, `updateOrderPayment`, `deleteOrderPayment` | `POST /orderpayment`, `PATCH` and `DELETE /orderpayment/:id` | administrators only (repair tools, not part of the checkout flow) |

- plus the payment event reads `listPaymentEvents` and `getPaymentEvent` for operators.

None of these appear in the blueprint. They answer with the envelopes of section 4: a
ticket is a record with `_type`, `orderId`, `providerName`, `paymentId`, `statusLiteral`,
`amount`, `currency`, `redirectUrl` and `failureReason`.

### Implicit payment routes

From the checkout setting and the `stripe` provider entry (Part 3, chapter 9.4), under
`/v1` of `sales`:

| Route | Use |
|---|---|
| `PATCH /v1/startorderpayment/:orderId` | start or resume the payment; body `{ "paymentUserParams": { "paymentMethodId"?, "return_url"? } }` |
| `PATCH /v1/refreshorderpayment/:orderId` | refresh the payment state from the provider |
| `GET /v1/orderpaymentstatusbyorderid/:orderId` | poll the status |
| `POST /v1/payments/webhook/stripe` | the provider's webhook (configured at the provider, never called by clients) |
| `POST /v1/payments/checkout-return/stripe`, `POST /v1/payments/threeds-return/stripe` | browser returns after a redirect or 3-D Secure |

The start answer carries `statusLiteral` (`started`, `success`, `failed`, ...) and
`nextAction` (`requiresAction`, `requiresRedirect`, `redirectToUrl`, `clientSecret`, ...)
or `null`. The amount, currency and customer are read from the stored order, never from
this request.

### Events

- `shopfront-sales-service-dbevent-order-created` after `createOrder`, and `-updated`
  when the payment result moves the status (`mapPaymentResultToOrderStatus`: `pending`,
  `canceled`, `failed`, `paid`).
- `shopfront-sales-service-dbevent-product-created`, `-updated`, `-deleted` for catalogue
  changes.
- `order-payment-updated` on every ticket status change and `order-payment-paymentdone`
  when a payment succeeds. Part 3 marks the casing and the missing project prefix of
  these two topics "To verify": confirm them on a running system.

### The checkout flow a frontend implements

1. `GET /products` to show the catalogue (no login).
2. `POST /orders` with the product, quantity and price; keep the returned `id`.
3. `PATCH /v1/startorderpayment/<id>`; if `nextAction.clientSecret` is set, confirm the
   payment with the provider's client library; if `requiresRedirect`, send the browser to
   `redirectToUrl`.
4. Poll `GET /v1/orderpaymentstatusbyorderid/<id>` (or listen for
   `order-payment-paymentdone`) until `statusLiteral` is final.
5. `GET /orders` shows the order with `status: "paid"`.

Note what the frontend does not do: it never confirms the payment on the server, never
writes `status`, and never calls the webhook. Those are the generated system's work. A
review of this blueprint would also question that `createOrder` takes `amount` from the
request (see item 9 of `review.md`).

## 9. Checklist for code around the system

- Every route, field and status your code uses is traced to a blueprint path, a Part 3
  rule, or a running system's API description.
- Base addresses, the project codename and provider keys are configuration, not
  constants.
- Error handling branches on `status` and `errorCode`; retries only on `retryable`.
- Event consumers deduplicate on `id` and do not depend on order.
- Tests assert the contract (status, envelope, error code, event) so they hold for any
  conformant compiler, not the internals of one compiler's output.
- A missing capability is raised as a blueprint change, never patched into generated
  code.

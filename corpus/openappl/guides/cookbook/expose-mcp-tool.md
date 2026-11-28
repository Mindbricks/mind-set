---
title: Expose an API as an MCP tool
---

# Expose an API as an MCP tool

A project has one MCP server, the [MCP-BFF](../system-services/mcpbff.md).
It turns every `BusinessApi` with a REST controller, in every service, into
a callable MCP tool unless the API opts out. This recipe is about shaping
the API so the calling AI agent picks it up correctly.

## What MCP picks up

Each service publishes its tools at `GET /tools` (the
[service tool registry](../system-services/application-mcp.md)), and the
MCP-BFF reads those registries at runtime. A tool is named
`<serviceName>__<apiName>` so an orchestrator can tell tools of different
services apart. It is built from:

- The API's `requestParameters` (plus the route's `:segments` and, on a
  list API, the DataObject's filter properties) → the MCP input schema.
- The API's `apiOptions.apiDescription` → the tool description the
  model reads when deciding whether to call it.
- The API's REST route → how the MCP-BFF calls it.

There is no output schema: the tool answers what the API answers.

## What stays hidden

- APIs with `apiOptions.blockMcp: true`. Use this for human-only flows
  (3DS card inputs, biometric capture, anything that needs a frontend
  the model can't synthesize).
- APIs without a REST controller, and the internal `_fetchList*` helpers.
- On a system service, the framework's own delete and role-gated APIs,
  except the reviewed ones (on auth: `createUser`, `updateUser`,
  `listUsers`, `listUsersByRole`, `updateUserRole`, still role-gated at
  call time). An API you author in `authentication.businessLogic` is
  not one of them: it follows its own `blockMcp`.

The MCP-BFF's `GET /tools` lists the tools the caller may see, with their
metadata, which is useful for orchestrators that browse the catalogue at runtime.

## Step 1: describe the API

```json
{
  "basics": {
    "apiOptions": {
      "name":           "findOrdersByCustomer",
      "crudType":       "list",
      "dataObjectName": "order",
      "apiDescription": "Returns the most recent orders for a customer, by email or id. Use when the caller mentions a customer and wants order history. Returns at most `limit` orders sorted by createdAt desc."
    }
  }
}
```

No flag is needed: the API is a tool as soon as it has a REST route.

`apiDescription` is the single most important field for tool calls.
Models pick tools by description; one good imperative paragraph beats
five lines of "Returns orders…". Lead with the use case, not the
shape.

## Step 2: tight input schema

Declare each `requestParameters` entry with type, requiredness, and
constraints. Models prefer "String, email format" over "anything
goes":

```json
{
  "parameters": {
    "requestParameters": [
      { "name": "email",      "type": "String",  "required": false, "transform": { "js": "((v) => { if (v && !/^[^@]+@[^@]+$/.test(v)) throw new Error('Invalid email'); return v; })(this.email)" } },
      { "name": "customerId", "type": "ID",      "required": false },
      { "name": "limit",      "type": "Integer", "required": false, "defaultValue": 10, "description": "1-50 orders to return." }
    ]
  }
}
```

`BusinessApiParameter` carries `name` / `type` / `required` /
`isArray` / `defaultValue` / `httpLocation` / `transform` /
`description`: there is no `paramName` / `paramType` /
`min` / `max` field. Pattern / range validation goes inside a
`transform` MScript or a follow-up `ValidationAction`.

A `transform` expression evaluates in the API's request context, so
the incoming value is `this.<paramName>` (here `this.email`): bare
`this` is the API's context object, not the value. The expression's
result is written back to the same parameter.

Use `enumOptions` for closed sets: the tool definition surfaces the
allowed values to the model directly. Use `defaultValue` for inputs
the model rarely needs to set; the catalogue marks defaulted inputs
as optional.

## Step 3: stable response shape

The tool's answer is the API's response, so its shape comes from the
`crudType` (one of `get` / `list` / `create` / `update` / `delete`) plus
whatever `AddToResponseAction` entries add. There is no response-schema
field on `apiOptions`: to hand the model a summary, compute it from the
rows and add each field by name.

```json
{
  "basics": {
    "apiOptions": {
      "name":           "summarizeOrders",
      "crudType":       "list",
      "dataObjectName": "order"
    }
  },
  "actions": {
    "addToResponseActions": [
      {
        "name": "summaryFields",
        "context": [
          { "contextName": "totalCount",  "contextValue": { "js": "this.orders.length" } },
          { "contextName": "totalAmount", "contextValue": { "js": "this.orders.reduce((s, o) => s + o.amount, 0)" } }
        ]
      }
    ]
  },
  "workflow": { "list": { "afterBuildOutput": ["summaryFields"] } }
}
```

On a list API the row array is `this.<objects>` (here `this.orders`) or
`this.data.rows`, never `this.data` itself. Fixed, named response fields
let the model chain to follow-up tools without guessing field names.

## Step 4: use the tool from an agent of the project

Inside the `AIAgent`'s tool settings, `apiTools` is a
comma-separated string of BusinessApi names. A name is looked up on the
agent's own service first, then on every other service of the project:

```json
{
  "toolSettings": {
    "apiTools": "findOrdersByCustomer,summarizeOrders"
  }
}
```

The agent runs the tool with the caller's session: tool capability
is bounded by what the caller could already do via the regular REST
surface.

To call the tools from an external MCP client, see the
[MCP-BFF service](../system-services/mcpbff.md#connecting-an-external-mcp-client).

## Tips

- **One tool, one job.** Multi-mode APIs read as one tool but behave
  as several; models pick badly. Split.
- **Short imperative descriptions.** "Find a customer's last orders"
  beats "Returns up to `limit` orders matching the customer
  identifier or email pattern…".
- **Don't leak internals.** Avoid mentioning `dataObjectName`, table
  internals, or service codenames in the tool description. Talk
  business, not implementation.
- **Block MCP on auth-edge APIs.** Login, 2FA, payment-input forms,
  any flow that needs a human at a UI, should carry
  `blockMcp: true`.

## See also

- [Service tool registry](../system-services/application-mcp.md): the
  per-service `GET /tools` document.
- [MCP-BFF service](../system-services/mcpbff.md): the MCP server, its
  endpoints and its auth.
- [API design](../best-practices/api-design.md): naming and
  description conventions that also help human callers.

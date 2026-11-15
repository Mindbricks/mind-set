---
name: openappl-blueprint-contract
description: Read an OpenAPPL blueprint as the contract of the system compiled from it (routes, request and response shapes, errors, events, derived APIs and library surface) to write code around that system, such as a frontend, a client SDK, an integration, tests, or the blueprint's own library functions and edge controllers. Do not use it to change the blueprint (openappl-blueprint-authoring), and never to hand-write the backend that the compiler generates.
---

# OpenAPPL blueprint as a contract

The compiler turns the blueprint into the backend. Your code lives around that backend:
it calls its routes, consumes its events, or fills the extension points the blueprint
declares. The blueprint tells you the whole contract, so you code against the blueprint,
not against guesses.

The corpus is at `{{CORPUS}}`. The method is `{{CORPUS}}/guides/contract.md`: read it
before you derive anything.

## What this skill is not for

- **It does not implement the backend.** Do not write services, controllers, database
  code or event consumers that reproduce what the blueprint declares. The backend comes
  from a compiler. A compiler of any kind (a template compiler, an agent, a hybrid) proves
  its output with the conformance suite; mind-set does not teach writing one by hand.
- **It does not change the blueprint.** When the code you are writing needs a route, a
  field or an event that the blueprint does not have, stop and propose the blueprint
  change. Apply it with the `openappl-blueprint-authoring` skill, not with server code.

## Steps

1. **Locate the blueprint and the target.** Name the blueprint file and what you are
   writing: frontend, client SDK, integration, tests, a library function, or an edge
   controller.
2. **Inventory the services.** For each entry of `services[]`, and for the system
   services the blueprint turns on (`authentication`, `notificationService`,
   `bffService`, `agentHub`), note the service name and codename. The base address of
   each service comes from the deployment or the hosting platform; never hard-code a
   host.
3. **Derive the API contract** of every API you will touch, following
   `{{CORPUS}}/guides/contract.md` and `{{CORPUS}}/openappl/compiler/05-business-apis.md`:
   method, path (explicit `routePath` or the derived one), parameters and where each is
   read from, login and role requirements, the success envelope, paging, and the error
   body.
4. **Add the derived surface.** High-level patterns add APIs, routes and data objects
   that the blueprint does not spell out (for example the payment APIs of a checkout
   order). Read `{{CORPUS}}/openappl/compiler/12-derived-surface.md` for each pattern the
   blueprint uses.
5. **Derive the events** you consume or wait for: the topic name, the envelope and the
   delivery rules (at least once, duplicates possible, no ordering). See the events
   section of `contract.md`.
6. **Write the contract down once**, for example as `contract/<service>.md` or as types in
   the client code, with the blueprint path each entry came from. Code from that file.
7. **Write the code.**
   - Frontend and client SDK: send exactly the declared parameters, read the documented
     envelope, handle each error status by its `errorCode`.
   - Tests: assert the contract (status, envelope, error code, event), not the internals
     of one compiler's output. A test that holds for any conformant compiler is the goal.
   - Library functions and edge controllers: they are blueprint content
     (`Service.library`, `Service.edgeControllers`). Use only the portable surface: `LIB`,
     `API` and the data-access operations of chapter 12.4. Read the spec pages
     `{{CORPUS}}/openappl/spec/ServiceLibrary.md` and
     `{{CORPUS}}/openappl/spec/EdgeController.md` before you write one.
8. **Recheck on change.** When the blueprint changes, re-derive the affected entries and
   update the contract file before the code.

## Validation

- When you add or change library functions or edge controllers, the blueprint changed:
  run `mind-set validate <blueprint-file>` (or `npx @mindbricks/mind-set validate <blueprint-file>`; structural only, see
  `{{CORPUS}}/guides/validate.md`) and, when the environment offers a semantic OpenAPPL
  validator (an OpenAPPL validator service, or the validation tool of a compiler or
  hosting platform), run it as well.
- Code outside the blueprint is checked against the running system: run your client or
  tests against a deployment compiled from the same blueprint version.
- If a derived entry is marked "To verify" in Part 3, say so in the contract file and test
  that entry against the running system rather than trusting the derivation.

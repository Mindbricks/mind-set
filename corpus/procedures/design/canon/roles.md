# Roles canon - a role is a capability boundary, not a label

Read by the interview and by the prd, user-stories, use-cases,
microservice-definitions and auth-spec writers, so the whole
requirements-to-design chain treats roles the same way.

A ROLE exists only to gate DIFFERENTIAL ACCESS - an API, an admin or authoring
panel, or a tool that the built-in `user` cannot reach. Apply this at every
stage; do not let a persona name silently become a role.

- **A persona name is NOT a role.** "customer", "artist", "seller", "founder",
  "member", "creator" describe WHO signs up. Such a word becomes a real role
  ONLY when (a) that persona can DO something the built-in `user` cannot (a
  role-gated panel, API or tool), OR (b) the capability sits behind an explicit
  admin-approval gate (KYC, document review) before it is granted. Otherwise
  map the persona to the built-in `user` (`tenantUser` in a multi-tenant
  project), and gate any special surface on a DATA FACT ("has at least one
  approved project", "subscription is active"), never on a minted role.
- **A role PROMOTION is worth modeling ONLY if the target role unlocks real
  access.** "A user becomes an artist upon their first approved project" is a
  design element only if `artist` gates something - an artist dashboard or API
  access-checked on the role. If artists and users have identical rights,
  there is no promotion to model: drop the role AND the promotion and gate the
  artist surface on the data fact instead. When it IS a real promotion, it
  fires on the APPROVING OUTCOME event, never on the creating action.
- **A service-triggered role change goes through a PURPOSE-BUILT,
  M2M-allowed auth API - never the generic `updateUserRole`, never by opening
  auth's default APIs to M2M.** Auth's built-in role and identity APIs are
  user/admin scoped: their guards read the caller's session role, so an M2M
  caller (no session) fails them, and they cannot be opened to M2M without
  breaking the guard. When a saga must change an auth-owned role with no user
  in the loop, the auth spec's `## K. Custom Business APIs` designs ONE scoped
  API for that exact transition (`promoteToArtist`, `M2MAllowed: true`, target
  `userId` only, idempotent). One scoped, auditable API per intended
  transition - never a generic set-any-role API exposed to M2M (a
  privilege-escalation surface).

**The interview's mapping is the chain's mapping.** The interview record's
Settled facts carry one line per designer role, `<designer's word> ->
<platform role>` (for example `site owner -> saasAdmin`). Every writer uses
that mapping as written; a writer that needs a mapping the record lacks
raises it as `OPEN (designer)` with its default (writer contract section
2), and never picks a different platform role on its own.

Downstream: the interview, PRD, stories and use cases do not name a role they
cannot justify by differential access; `microservice-definitions`, when a saga
changes a role, declares it as a NEED for a scoped M2M auth API (not a generic
setter); the auth spec designs that scoped API in section K.

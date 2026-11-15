# Platform-owned mechanics - record the wish, never the mandate

Read by the requirement document writers (project-description-report, prd,
user-stories, use-cases) and by the interview, so a mechanism the designer
volunteered is recorded as their PREFERENCE, never handed to the specs as a
requirement to satisfy.

Designers sometimes state HOW something must work at a level the compiler and the hosting platform own
and does not expose per project: "Argon2id password hashing", "JWT signed with
RS256", "rate limit 100 req/min", "passwords rotate every 90 days". These are
not project requirements - the platform already decides them, identically for
every project - and writing them into a requirement document hands the design
stages a target they cannot implement, which becomes an invented config block
or a false claim of compliance.

**Platform-owned (never a requirement):** credential hashing and its
algorithm (one-way hashed and salted at rest; the key-derivation function is
the platform's), password policies and rotation, token signing algorithms and
key management, session and refresh mechanics, verification-code delivery
internals, rate limiting, TLS and transport, storage encryption at rest, and
the CI/deploy pipeline.

**How to record one the designer raised** - keep their words, drop the
mandate:

> Wrong: "...JWT-based authentication with refresh-token rotation, Argon2
> password hashing, role-based access control..."
>
> Right: "...JWT-based authentication with refresh-token rotation and
> platform-managed credential hashing (the designer asked for Argon2id - noted
> as a preference for the platform team, not a project-level setting),
> role-based access control..."

Never silently delete what they said: state the platform-managed capability,
attribute the specific ask as a noted preference, and move on. What the
project DOES decide stays a requirement as normal - whether accounts need
verification, which roles exist, who may reset whose password, how long a
session should feel.

This is not a licence to drop hard requirements. It applies ONLY to the
mechanisms listed above; everything else the designer stated is a requirement
and is recorded as one.

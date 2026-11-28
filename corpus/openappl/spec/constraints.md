# Constraints coverage

Every specification page has a **Constraints** block. This page says what the blocks cover and what they do not cover yet.

## Rules on every pattern

- A property the pattern does not declare is refused (`UNKNOWN_PROPERTY`).
- A value of the wrong type is refused (`INVALID_FIELD_TYPE`).
- A relocated property (see the Migration block) must be written at its new path.

## Property rules

Stated from the property metadata of each pattern, the same metadata the validators are generated from: required properties (`REQUIRED_FIELD_MISSING`), allowed values (`INVALID_ENUM_VALUE`), [value formats](./value-formats.md), numeric ranges (`VALUE_OUT_OF_RANGE`), reference formats and distinct item names (`DUPLICATE_ASSET_NAME`).

## Pattern rules

The checks written for a pattern of its own: 174 patterns carry 1089 attributed check sites. A rule is listed with its code, its severity and the first sentence of its message.

## Not covered yet

Of 1897 check sites, 808 are not attributed to a pattern:

- 635 sites in 109 shared checks that run on behalf of several patterns (event topics, payment providers, carts, expression slots and others).
- 173 sites in 37 patterns whose code comes from a code table rather than being written at the call.
- Checks across the whole blueprint (references between services, expression analysis).

A blueprint that satisfies every listed rule can still be refused by one of these. They are added to the pages as they are attributed.

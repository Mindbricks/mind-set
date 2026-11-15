# ModuleDocumentation

**Level:** `section` · **Family:** [AuthBasics](./families.md#authbasics) (domain `ProjectAuthentication`)

**Specification:** [ModuleDocumentation in Part 2](../spec/ModuleDocumentation.md)

Holds the module-level frontendDocument UX prompt. Reused across auth / bff / notification modules for consistency. MindUI reads frontendDocument to generate page UX; the section exists so module-level primitives stay in proper sections rather than at module/chapter root.

## Contained in

- [AuthBasics](./AuthBasics.md) as `documentation`
- [BffServiceSettings](./BffServiceSettings.md) as `documentation`
- [NotificationServiceSettings](./NotificationServiceSettings.md) as `documentation`

Blueprint paths:

- `authentication.authenticationEssentials.documentation`
- `bffService.serviceSettings.documentation`
- `notificationService.serviceSettings.documentation`

## Contains

No other pattern: every property is a value or a reference.

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.

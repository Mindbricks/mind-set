# ProjectAuthentication

**Level:** `module` · **Family:** [ProjectAuthentication](./families.md#projectauthentication)

**Specification:** [ProjectAuthentication in Part 2](../spec/ProjectAuthentication.md)

Defines the authentication and authorization configuration for the entire project. This module serves as the foundation for user identity, login behavior, access control, and verification flows. All services in the project, especially user services, rely on these centralized settings.

## Contained in

- [Project](./Project.md) as `authentication`

Blueprint paths:

- `authentication`

## Contains

- `authenticationEssentials`: [AuthBasics](./AuthBasics.md)
- `loginDefinition`: [LoginDefinition](./LoginDefinition.md)
- `verificationServices`: [VerificationServices](./VerificationServices.md)
- `accessControl`: [AccessControl](./AccessControl.md)
- `socialLogins`: [SocialLoginSettings](./SocialLoginSettings.md)
- `sessionGeoSensitivity`: [SessionGeoSensitivity](./SessionGeoSensitivity.md)
- `foreignPermissionProvider`: [ForeignPermissionProvider](./ForeignPermissionProvider.md)
- `profileSettings`: [ProfileSettings](./ProfileSettings.md)
- `userProperties`: [DataProperty](./DataProperty.md), a list
- `tenantProperties`: [DataProperty](./DataProperty.md), a list
- `businessLogic`: [BusinessApi](./BusinessApi.md), a list
- `builtInApiChecks`: [BuiltInApiCheck](./BuiltInApiCheck.md), a list
- `dataObjects`: [DataObject](./DataObject.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.

# ObjectSettings

**Level:** `chapter` · **Family:** [ObjectSettings](./families.md#objectsettings) (domain `DataObject`)

**Specification:** [ObjectSettings in Part 2](../spec/ObjectSettings.md)

Configuration settings that govern the behavior, access control, and optimization strategies of a data object. These settings allow fine-grained control over how the data object behaves in terms of authorization, caching, indexing, payment processing, ledger accounting, and membership relationships. This is the central point to define how the object integrates with infrastructure and security policies in a microservice.

## Contained in

- [DataObject](./DataObject.md) as `objectSettings`

Blueprint paths:

- `authentication.dataObjects.objectSettings`
- `services.dataObjects.objectSettings`

## Contains

- `basicSettings`: [ObjectBasicSettings](./ObjectBasicSettings.md)
- `authorization`: [ObjectAuthorization](./ObjectAuthorization.md)
- `redisEntityCacheSettings`: [RedisEntityCacheSettings](./RedisEntityCacheSettings.md)
- `compositeIndexSettings`: [CompositeIndex](./CompositeIndex.md), a list
- `checkout`: [Checkout](./Checkout.md)
- `subscription`: [Subscription](./Subscription.md)
- `marketplace`: [Marketplace](./Marketplace.md)
- `invoicing`: [Invoicing](./Invoicing.md)
- `fiscalization`: [Fiscalization](./Fiscalization.md)
- `membershipSettings`: [MembershipSettings](./MembershipSettings.md)
- `ledgerSettings`: [LedgerSettings](./LedgerSettings.md)
- `graphProjection`: [GraphProjection](./GraphProjection.md)
- `enterpriseProjection`: [EnterpriseProjection](./EnterpriseProjection.md)
- `geoSettings`: [ObjectGeoSettings](./ObjectGeoSettings.md)
- `objectModeration`: [ObjectModeration](./ObjectModeration.md)
- `visitTracking`: [VisitTracking](./VisitTracking.md)
- `recommendationSettings`: [RecommendationSettings](./RecommendationSettings.md)
- `defaultChoice`: [DefaultChoice](./DefaultChoice.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.

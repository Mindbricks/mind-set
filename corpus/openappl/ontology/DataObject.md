# DataObject

**Level:** `namespace` · **Family:** [DataObject](./families.md#dataobject)

**Specification:** [DataObject in Part 2](../spec/DataObject.md)

A DataObject is the core building block of a service in OpenAPPL. It represents both the data schema (like a table in SQL or a collection in MongoDB) and the business logic that operates around it. Each DataObject includes a set of DataProperties (fields), and it governs how the data is stored, validated, secured, and exposed through automatically generated business APIs. Beyond simple data modeling, DataObjects enable complex logic configurations, such as access control, field-level behaviors, validation, and custom API route behavior. They serve not only as data containers but also as logical units of functionality within the microservice. A DataObject declared `objectSettings.basicSettings.virtual: true` is the one exception to the table: it is a response-only record (a computed decision, a report row) with no table, model or db layer, bound only by get and list apis whose actions build the response.

## Contained in

- [ProjectAuthentication](./ProjectAuthentication.md) as `dataObjects` (a list)
- [Service](./Service.md) as `dataObjects` (a list)

Blueprint paths:

- `authentication.dataObjects`
- `services.dataObjects`

## Contains

- `objectSettings`: [ObjectSettings](./ObjectSettings.md)
- `properties`: [DataProperty](./DataProperty.md), a list

## References

None: no property names another pattern instance.

## Referenced by

- [ABACDefinititon](./ABACDefinititon.md): `dataObject`
- [AiProviderResourceCredentialScope](./AiProviderResourceCredentialScope.md): `dataObject`
- [ApiOptions](./ApiOptions.md): `dataObjectName`
- [BatchTransformSpec](./BatchTransformSpec.md): `sourceSchema`, `targetSchema`
- [ComputeJobInput](./ComputeJobInput.md): `schema`
- [ComputeJobResult](./ComputeJobResult.md): `summarySchema`
- [CreateBulkCrudAction](./CreateBulkCrudAction.md): `childObject`
- [CreateCrudAction](./CreateCrudAction.md): `childObject`
- [DbBucketOwnerConfigSettings](./DbBucketOwnerConfigSettings.md): `dataObjectName`
- [DeleteCrudAction](./DeleteCrudAction.md): `childObject`
- [EventSubTopic](./EventSubTopic.md): `dataObjectName`
- [FetchFromElasticAction](./FetchFromElasticAction.md): `targetObject`
- [FetchObjectAction](./FetchObjectAction.md): `targetObject`
- [FetchParentAction](./FetchParentAction.md): `parentObject`
- [FetchStatsAction](./FetchStatsAction.md): `targetObject`
- [FileToDataAction](./FileToDataAction.md): `targetObject`
- [FiscalInternetSaleConfig](./FiscalInternetSaleConfig.md): `carrierDataObject`
- [HierarchicalResourceGraph](./HierarchicalResourceGraph.md): `nodes`
- [HubAuthSource](./HubAuthSource.md): `sourceObject`
- [HubRoomSettings](./HubRoomSettings.md): `roomDataObject`
- [InteractionSource](./InteractionSource.md): `eventObject`
- [InvoiceLineRelation](./InvoiceLineRelation.md): `lineItemObject`
- [InvoicingConfig](./InvoicingConfig.md): `sourceObjectName`
- [ListJointFilter](./ListJointFilter.md): `joinedDataObject`
- [ListMembershipFilter](./ListMembershipFilter.md): `dataObjectName`
- [MarketplaceConfig](./MarketplaceConfig.md): `sellerAccountObject`
- [MembershipCheckAction](./MembershipCheckAction.md): `dataObjectName`
- [MembershipSettingsConfig](./MembershipSettingsConfig.md): `membershipObjectName`
- [OBACPermission](./OBACPermission.md): `dataObjects`
- [PropertyRelation](./PropertyRelation.md): `relationTargetObject`
- [PropertyStaticJoin](./PropertyStaticJoin.md): `jointSource`
- [RemoteBucketOwnerConfigSettings](./RemoteBucketOwnerConfigSettings.md): `dataObjectName`
- [RiskCalculationSpec](./RiskCalculationSpec.md): `riskSchema`
- [SearchObjectAction](./SearchObjectAction.md): `targetObject`
- [SeedDataBasics](./SeedDataBasics.md): `dataObject`
- [SelectJoin](./SelectJoin.md): `joinedDataObject`
- [ShoppingCartProductCatalogSettings](./ShoppingCartProductCatalogSettings.md): `productDataObject`
- [StripeOrderItemRelation](./StripeOrderItemRelation.md): `orderItemObject`
- [UpdateCrudAction](./UpdateCrudAction.md): `childObject`
- [UpsertBulkCrudAction](./UpsertBulkCrudAction.md): `childObject`
- [VideoRoomAuthSource](./VideoRoomAuthSource.md): `sourceObject`
- [VideoRoomSettings](./VideoRoomSettings.md): `roomDataObject`
- [ViewAggregate](./ViewAggregate.md): `childObject`
- [ViewBasics](./ViewBasics.md): `mainObject`
- [ViewStat](./ViewStat.md): `childObject`

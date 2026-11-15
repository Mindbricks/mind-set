# DataProperty

**Level:** `chapter` · **Family:** [DataProperty](./families.md#dataproperty) (domain `DataObject`)

**Specification:** [DataProperty in Part 2](../spec/DataProperty.md)

The definition of a data property within a data object. A data property is not just a storage field—it encapsulates the logic, behavior, and metadata associated with a specific piece of data. Through its settings, a data property can define relationships, context-aware values, session-based defaults, computed formulas, access filters, enums, and more. It serves as a powerful unit of business logic tightly integrated with the data model.

## Contained in

- [DataObject](./DataObject.md) as `properties` (a list)
- [GraphEdge](./GraphEdge.md) as `properties` (a list)
- [LedgerAdditionalProperties](./LedgerAdditionalProperties.md) as `entry` (a list)
- [LedgerAdditionalProperties](./LedgerAdditionalProperties.md) as `movement` (a list)
- [LedgerAdditionalProperties](./LedgerAdditionalProperties.md) as `reservation` (a list)
- [ProjectAuthentication](./ProjectAuthentication.md) as `userProperties` (a list)
- [ProjectAuthentication](./ProjectAuthentication.md) as `tenantProperties` (a list)
- [RemoteBucketSettings](./RemoteBucketSettings.md) as `additionalColumns` (a list)

Blueprint paths:

- `authentication.userProperties`
- `authentication.tenantProperties`
- `authentication.dataObjects.properties`
- `services.dataObjects.properties`

## Contains

- `basicSettings`: [PropertyBasicSettings](./PropertyBasicSettings.md)
- `indexSettings`: [PropertyIndexSettings](./PropertyIndexSettings.md)
- `relationSettings`: [PropertyRelation](./PropertyRelation.md)
- `sessionSettings`: [PropertySessionSettings](./PropertySessionSettings.md)
- `staticJoin`: [PropertyStaticJoin](./PropertyStaticJoin.md)
- `graphEdge`: [PropertyGraphEdge](./PropertyGraphEdge.md)
- `decisionSource`: [PropertyDecisionSource](./PropertyDecisionSource.md)
- `uploadSettings`: [PropertyUploadSettings](./PropertyUploadSettings.md)

## References

None: no property names another pattern instance.

## Referenced by

- [AggregateItem](./AggregateItem.md): `aggField`
- [ApiAggregateData](./ApiAggregateData.md): `dataProperty`
- [CheckoutConfig](./CheckoutConfig.md): `orderIdProperty`, `amountProperty`, `currencyProperty`, `orderStatusProperty`, `orderStatusUpdateDateProperty`, `orderOwnerIdProperty`
- [CompositeIndex](./CompositeIndex.md): `indexFields`
- [DefaultChoice](./DefaultChoice.md): `scopeField`
- [FetchObjectAction](./FetchObjectAction.md): `localKey`, `properties`
- [FetchParentAction](./FetchParentAction.md): `properties`
- [FetchStatsAction](./FetchStatsAction.md): `localKey`, `bucketBy`
- [FiscalInternetSaleConfig](./FiscalInternetSaleConfig.md): `paymentMethodProperty`, `paymentDateProperty`, `shipmentCarrierProperty`, `shipmentDateProperty`, `carrierRefProperty`, `carrierTitleProperty`, `carrierTaxIdProperty`, `carrierAddressProperty`, `carrierDistrictProperty`, `carrierCityProperty`, `trackingNumberProperty`
- [FiscalizationConfig](./FiscalizationConfig.md): `originalRefProperty`
- [FiscalizeAction](./FiscalizeAction.md): `sourceIdProperty`, `fiscalDocumentIdProperty`, `reasonProperty`
- [FiscalPartyConfig](./FiscalPartyConfig.md): `taxIdProperty`, `nameProperty`, `addressProperty`
- [GraphEdgeEnd](./GraphEdgeEnd.md): `key`
- [GraphEdgeProjection](./GraphEdgeProjection.md): `edgeProperties`
- [GraphProjection](./GraphProjection.md): `identity`, `projectedProperties`, `filterableProperties`
- [HubAuthSource](./HubAuthSource.md): `userField`, `roomField`
- [InvoiceAction](./InvoiceAction.md): `sourceIdProperty`, `invoiceIdProperty`, `amountProperty`, `paymentRefProperty`, `reasonProperty`, `idempotencyKeyProperty`
- [InvoiceLineRelation](./InvoiceLineRelation.md): `invoiceForeignKey`, `lineItemLocalKey`, `quantityProperty`, `unitPriceProperty`, `descriptionProperty`, `lineTotalProperty`, `discountAmountProperty`, `discountReasonProperty`, `vatRateProperty`, `vatExemptionCodeProperty`, `vatExemptionReasonProperty`, `vatAmountProperty`, `finalTotalProperty`
- [InvoicingConfig](./InvoicingConfig.md): `customerProperty`, `amountProperty`, `vatRateProperty`, `vatExemptionCodeProperty`, `vatExemptionReasonProperty`, `currencyProperty`, `dueDateProperty`, `statusProperty`
- [LedgerBalance](./LedgerBalance.md): `availableProperty`, `pendingProperty`, `reservedProperty`, `lifetimeCreditedProperty`, `lifetimeConsumedProperty`
- [LedgerConfig](./LedgerConfig.md): `ownerKeyProperty`
- [LedgerUnit](./LedgerUnit.md): `scaleProperty`
- [ListMembershipFilter](./ListMembershipFilter.md): `objectKeyIdField`
- [ListOptions](./ListOptions.md): `listGroupBy`
- [ListRuntimeFilterSettings](./ListRuntimeFilterSettings.md): `allowedFields`, `allowedSortFields`, `searchedFields`
- [ListSearchFilter](./ListSearchFilter.md): `searchProperties`
- [MarketplaceConfig](./MarketplaceConfig.md): `sellerAccountProperty`, `amountProperty`, `applicationFeeProperty`, `currencyProperty`, `transferGroupProperty`, `settlementGroupProperty`, `settlementEligibleAfterProperty`
- [MembershipSettingsConfig](./MembershipSettingsConfig.md): `membershipObjectIdProperty`, `membershipUserIdProperty`, `roleField`
- [ObjectModeration](./ObjectModeration.md): `moderatedProperties`
- [PayoutAction](./PayoutAction.md): `connectedAccountProperty`, `amountProperty`, `currencyProperty`, `transferGroupProperty`, `metadataProperty`, `scheduledForProperty`, `sourceOrderProperty`
- [PropertyDecisionSource](./PropertyDecisionSource.md): `recomputeOn`
- [PropertyGraphEdge](./PropertyGraphEdge.md): `edgeProperties`
- [PropertyRelation](./PropertyRelation.md): `relationTargetKey`
- [PropertyStaticJoin](./PropertyStaticJoin.md): `jointRead`, `jointSourceKey`, `jointForeignKey`
- [RefundAction](./RefundAction.md): `paymentIntentIdProperty`, `refundAmountProperty`, `reasonProperty`
- [SearchObjectAction](./SearchObjectAction.md): `searchProperties`
- [SelectClauseSettings](./SelectClauseSettings.md): `selectProperties`
- [SelectJoin](./SelectJoin.md): `properties`
- [SellerOnboardingConfig](./SellerOnboardingConfig.md): `legalNameProperty`, `taxIdProperty`, `taxOfficeProperty`, `addressProperty`, `ibanProperty`, `identityNumberProperty`, `contactNameProperty`, `contactSurnameProperty`, `sellerTypeProperty`, `emailProperty`, `gsmProperty`
- [SettlementReleaseConfig](./SettlementReleaseConfig.md): `releaseAtProperty`, `statusProperty`
- [SortByItem](./SortByItem.md): `property`
- [StripeOrderItemRelation](./StripeOrderItemRelation.md): `orderForeignKey`, `orderItemLocalKey`, `quantityProperty`
- [SubscriptionAction](./SubscriptionAction.md): `planProperty`, `subscriptionIdProperty`, `cancelAtPeriodEndProperty`
- [SubscriptionConfig](./SubscriptionConfig.md): `planProperty`, `customerProperty`, `trialDaysProperty`, `cancelAtPeriodEndProperty`, `statusProperty`
- [VideoRoomAuthSource](./VideoRoomAuthSource.md): `userField`, `roomField`
- [ViewAggregate](./ViewAggregate.md): `parentKey`, `childKey`, `properties`
- [ViewBasics](./ViewBasics.md): `properties`
- [ViewStat](./ViewStat.md): `parentKey`, `childKey`
- [VisitTracking](./VisitTracking.md): `counterProperty`, `uniqueCounterProperty`
- [WhereClauseSettings](./WhereClauseSettings.md): `selectBy`

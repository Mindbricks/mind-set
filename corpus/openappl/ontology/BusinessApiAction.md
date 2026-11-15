# BusinessApiAction

**Level:** `unclassified` · **Family:** [Standalone patterns](./families.md#standalone-patterns)

**Specification:** [BusinessApiAction in Part 2](../spec/BusinessApiAction.md)

**Abstract pattern:** it is used through the patterns that extend it.

Abstract base class for all Business API actions. Every action in a Business API workflow inherits from this type. It defines shared fields such as name, execution condition, and response behavior. This class is never instantiated directly—subclasses implement specific logic units like fetch, validation, or API calls. Any subclass is distinguished from the array (in actions property of the business api) it is inserted

## Contained in

No property holds this pattern directly; the patterns that extend it are used instead.

## Contains

No other pattern: every property is a value or a reference.

## Extended by

- [AddToContextAction](./AddToContextAction.md)
- [AddToResponseAction](./AddToResponseAction.md)
- [AgentCallAction](./AgentCallAction.md)
- [AiCallAction](./AiCallAction.md)
- [ApiCallAction](./ApiCallAction.md)
- [ArrowFunctionAction](./ArrowFunctionAction.md)
- [CartCheckoutAction](./CartCheckoutAction.md)
- [CartValidationAction](./CartValidationAction.md)
- [CheckMailboxAction](./CheckMailboxAction.md)
- [CollateListsAction](./CollateListsAction.md)
- [ContentTransitionAction](./ContentTransitionAction.md)
- [CouponValidationAction](./CouponValidationAction.md)
- [CreateBulkCrudAction](./CreateBulkCrudAction.md)
- [CreateCrudAction](./CreateCrudAction.md)
- [CreateJWTTokenAction](./CreateJWTTokenAction.md)
- [CreateObjectAction](./CreateObjectAction.md)
- [DataToFileAction](./DataToFileAction.md)
- [DecisionAction](./DecisionAction.md)
- [DeleteCrudAction](./DeleteCrudAction.md)
- [EmitSseEventAction](./EmitSseEventAction.md)
- [FetchFromElasticAction](./FetchFromElasticAction.md)
- [FetchFromElasticLogAction](./FetchFromElasticLogAction.md)
- [FetchObjectAction](./FetchObjectAction.md)
- [FetchParentAction](./FetchParentAction.md)
- [FetchStatsAction](./FetchStatsAction.md)
- [FileToDataAction](./FileToDataAction.md)
- [FiscalizeAction](./FiscalizeAction.md)
- [FunctionCallAction](./FunctionCallAction.md)
- [GraphQueryAction](./GraphQueryAction.md)
- [GrpcCallAction](./GrpcCallAction.md)
- [IntegrationAction](./IntegrationAction.md)
- [InterProjectCallAction](./InterProjectCallAction.md)
- [InterserviceCallAction](./InterserviceCallAction.md)
- [InvoiceAction](./InvoiceAction.md)
- [IteratorAction](./IteratorAction.md)
- [ListMapAction](./ListMapAction.md)
- [LoopAction](./LoopAction.md)
- [MembershipCheckAction](./MembershipCheckAction.md)
- [ObjectPermissionCheckAction](./ObjectPermissionCheckAction.md)
- [ParallelAction](./ParallelAction.md)
- [PaymentAction](./PaymentAction.md)
- [PayoutAction](./PayoutAction.md)
- [PermissionCheckAction](./PermissionCheckAction.md)
- [PublishEventAction](./PublishEventAction.md)
- [ReadFromRedisAction](./ReadFromRedisAction.md)
- [ReadJwtTokenAction](./ReadJwtTokenAction.md)
- [ReadMailAction](./ReadMailAction.md)
- [RedirectAction](./RedirectAction.md)
- [RefundAction](./RefundAction.md)
- [RemoveFromResponseAction](./RemoveFromResponseAction.md)
- [RenderDataAction](./RenderDataAction.md)
- [RenderPdfAction](./RenderPdfAction.md)
- [SearchObjectAction](./SearchObjectAction.md)
- [SendMailAction](./SendMailAction.md)
- [SendPushNotificationAction](./SendPushNotificationAction.md)
- [SendSmsAction](./SendSmsAction.md)
- [SendWhatsAppAction](./SendWhatsAppAction.md)
- [SignDataWithProjectKeyAction](./SignDataWithProjectKeyAction.md)
- [SubscriptionAction](./SubscriptionAction.md)
- [UpdateCrudAction](./UpdateCrudAction.md)
- [UpsertBulkCrudAction](./UpsertBulkCrudAction.md)
- [ValidationAction](./ValidationAction.md)
- [VerifyWebhookAction](./VerifyWebhookAction.md)
- [VideoRoomControlAction](./VideoRoomControlAction.md)
- [VideoRoomTokenAction](./VideoRoomTokenAction.md)
- [WriteToElasticLogAction](./WriteToElasticLogAction.md)
- [WriteToRedisAction](./WriteToRedisAction.md)

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.

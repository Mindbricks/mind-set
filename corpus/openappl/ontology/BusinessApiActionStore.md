# BusinessApiActionStore

**Level:** `chapter` · **Family:** [BusinessApiActionStore](./families.md#businessapiactionstore) (domain `BusinessApi`)

**Specification:** [BusinessApiActionStore in Part 2](../spec/BusinessApiActionStore.md)

Represents the centralized registry of all executable logic units (actions) that can be used inside a Business API's workflow. Each action is categorized by purpose and referenced by name within the workflow stages. This store enables declarative composition of API behavior, including data manipulation, inter-service communication, access control, AI operations, and more. Every array here is optional — include only the action-type arrays you use; omitted arrays normalize to [] server-side.

## Contained in

- [BusinessApi](./BusinessApi.md) as `actions`

Blueprint paths:

- `authentication.businessLogic.actions`
- `services.businessLogic.actions`

## Contains

- `fetchObjectActions`: [FetchObjectAction](./FetchObjectAction.md), a list
- `fetchStatsActions`: [FetchStatsAction](./FetchStatsAction.md), a list
- `fetchParentActions`: [FetchParentAction](./FetchParentAction.md), a list
- `searchObjectActions`: [SearchObjectAction](./SearchObjectAction.md), a list
- `fetchFromElasticActions`: [FetchFromElasticAction](./FetchFromElasticAction.md), a list
- `writeToElasticLogActions`: [WriteToElasticLogAction](./WriteToElasticLogAction.md), a list
- `fetchFromElasticLogActions`: [FetchFromElasticLogAction](./FetchFromElasticLogAction.md), a list
- `graphQueryActions`: [GraphQueryAction](./GraphQueryAction.md), a list
- `collateListsActions`: [CollateListsAction](./CollateListsAction.md), a list
- `functionCallActions`: [FunctionCallAction](./FunctionCallAction.md), a list
- `arrowFunctionActions`: [ArrowFunctionAction](./ArrowFunctionAction.md), a list
- `listMapActions`: [ListMapAction](./ListMapAction.md), a list
- `interserviceCallActions`: [InterserviceCallAction](./InterserviceCallAction.md), a list
- `interProjectCallActions`: [InterProjectCallAction](./InterProjectCallAction.md), a list
- `createCrudActions`: [CreateCrudAction](./CreateCrudAction.md), a list
- `createBulkCrudActions`: [CreateBulkCrudAction](./CreateBulkCrudAction.md), a list
- `upsertBulkCrudActions`: [UpsertBulkCrudAction](./UpsertBulkCrudAction.md), a list
- `deleteCrudActions`: [DeleteCrudAction](./DeleteCrudAction.md), a list
- `updateCrudActions`: [UpdateCrudAction](./UpdateCrudAction.md), a list
- `apiCallActions`: [ApiCallAction](./ApiCallAction.md), a list
- `grpcCallActions`: [GrpcCallAction](./GrpcCallAction.md), a list
- `aiCallActions`: [AiCallAction](./AiCallAction.md), a list
- `decisionActions`: [DecisionAction](./DecisionAction.md), a list
- `agentCallActions`: [AgentCallAction](./AgentCallAction.md), a list
- `membershipCheckActions`: [MembershipCheckAction](./MembershipCheckAction.md), a list
- `permissionCheckActions`: [PermissionCheckAction](./PermissionCheckAction.md), a list
- `objectPermissionActions`: [ObjectPermissionCheckAction](./ObjectPermissionCheckAction.md), a list
- `readJwtTokenActions`: [ReadJwtTokenAction](./ReadJwtTokenAction.md), a list
- `validationActions`: [ValidationAction](./ValidationAction.md), a list
- `addToContextActions`: [AddToContextAction](./AddToContextAction.md), a list
- `addToResponseActions`: [AddToResponseAction](./AddToResponseAction.md), a list
- `removeFromResponseActions`: [RemoveFromResponseAction](./RemoveFromResponseAction.md), a list
- `renderDataActions`: [RenderDataAction](./RenderDataAction.md), a list
- `dataToFileActions`: [DataToFileAction](./DataToFileAction.md), a list
- `fileToDataActions`: [FileToDataAction](./FileToDataAction.md), a list
- `renderPdfActions`: [RenderPdfAction](./RenderPdfAction.md), a list
- `redirectActions`: [RedirectAction](./RedirectAction.md), a list
- `createJWTTokenActions`: [CreateJWTTokenAction](./CreateJWTTokenAction.md), a list
- `signDataWithProjectKeyActions`: [SignDataWithProjectKeyAction](./SignDataWithProjectKeyAction.md), a list
- `createObjectActions`: [CreateObjectAction](./CreateObjectAction.md), a list
- `publishEventActions`: [PublishEventAction](./PublishEventAction.md), a list
- `readFromRedisActions`: [ReadFromRedisAction](./ReadFromRedisAction.md), a list
- `writeToRedisActions`: [WriteToRedisAction](./WriteToRedisAction.md), a list
- `sendMailActions`: [SendMailAction](./SendMailAction.md), a list
- `checkMailboxActions`: [CheckMailboxAction](./CheckMailboxAction.md), a list
- `readMailActions`: [ReadMailAction](./ReadMailAction.md), a list
- `sendSmsActions`: [SendSmsAction](./SendSmsAction.md), a list
- `sendPushNotificationActions`: [SendPushNotificationAction](./SendPushNotificationAction.md), a list
- `sendWhatsAppActions`: [SendWhatsAppAction](./SendWhatsAppAction.md), a list
- `paymentActions`: [PaymentAction](./PaymentAction.md), a list
- `refundActions`: [RefundAction](./RefundAction.md), a list
- `invoiceActions`: [InvoiceAction](./InvoiceAction.md), a list
- `fiscalizeActions`: [FiscalizeAction](./FiscalizeAction.md), a list
- `payoutActions`: [PayoutAction](./PayoutAction.md), a list
- `subscriptionActions`: [SubscriptionAction](./SubscriptionAction.md), a list
- `verifyWebhookActions`: [VerifyWebhookAction](./VerifyWebhookAction.md), a list
- `integrationActions`: [IntegrationAction](./IntegrationAction.md), a list
- `loopActions`: [LoopAction](./LoopAction.md), a list
- `parallelActions`: [ParallelAction](./ParallelAction.md), a list
- `cartValidationActions`: [CartValidationAction](./CartValidationAction.md), a list
- `cartCheckoutActions`: [CartCheckoutAction](./CartCheckoutAction.md), a list
- `couponValidationActions`: [CouponValidationAction](./CouponValidationAction.md), a list
- `emitSseEventActions`: [EmitSseEventAction](./EmitSseEventAction.md), a list
- `iteratorActions`: [IteratorAction](./IteratorAction.md), a list
- `videoRoomTokenActions`: [VideoRoomTokenAction](./VideoRoomTokenAction.md), a list
- `videoRoomControlActions`: [VideoRoomControlAction](./VideoRoomControlAction.md), a list
- `contentTransitionActions`: [ContentTransitionAction](./ContentTransitionAction.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.

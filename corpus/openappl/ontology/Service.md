# Service

**Level:** `service` · **Family:** [Service](./families.md#service)

**Specification:** [Service in Part 2](../spec/Service.md)

Defines the overall structure and configuration for a microservice within the project. Each service acts as an independent domain that encapsulates its own data model, business logic, and interface behaviors. While services primarily manage and expose domain-specific data, this module extends beyond basic CRUD operations by offering customizable patterns, libraries, authentication, and specialized route handling. Use this module to tailor the internal and external behaviors of your service—whether it's securing endpoints, defining edge routes, managing complex data objects, or integrating advanced logic. The service configuration ensures the resulting microservice is robust, secure, and aligned with the specific application requirements.

## Contained in

- [Project](./Project.md) as `services` (a list)

Blueprint paths:

- `services`

## Contains

- `serviceSettings`: [ServiceSettings](./ServiceSettings.md)
- `shoppingCartConfig`: [ShoppingCartConfig](./ShoppingCartConfig.md)
- `dataObjects`: [DataObject](./DataObject.md), a list
- `businessLogic`: [BusinessApi](./BusinessApi.md), a list
- `library`: [ServiceLibrary](./ServiceLibrary.md)
- `edgeControllers`: [EdgeController](./EdgeController.md), a list
- `aiAgents`: [AIAgent](./AIAgent.md), a list
- `realtimeHubs`: [RealtimeHub](./RealtimeHub.md), a list
- `videoRooms`: [VideoRoom](./VideoRoom.md), a list
- `contentModels`: [ContentModel](./ContentModel.md), a list
- `eventSubscriptions`: [EventSubscription](./EventSubscription.md), a list
- `dbBuckets`: [DbBucket](./DbBucket.md), a list
- `remoteBuckets`: [RemoteBucket](./RemoteBucket.md), a list
- `nativeBuckets`: [NativeBucket](./NativeBucket.md), a list
- `computeJobs`: [ComputeJob](./ComputeJob.md), a list
- `eventStreams`: [EventStream](./EventStream.md), a list
- `jobStreams`: [JobStream](./JobStream.md), a list
- `waitingRooms`: [WaitingRoom](./WaitingRoom.md), a list
- `loadShield`: [LoadShield](./LoadShield.md)
- `seedData`: [SeedData](./SeedData.md), a list
- `oauthFlows`: [OAuthFlow](./OAuthFlow.md), a list
- `graphLayer`: [GraphServiceLayer](./GraphServiceLayer.md)
- `serviceFiles`: [ServiceFiles](./ServiceFiles.md)
- `cronJobs`: [CronJob](./CronJob.md), a list

## References

None: no property names another pattern instance.

## Referenced by

No property of another pattern names this pattern.

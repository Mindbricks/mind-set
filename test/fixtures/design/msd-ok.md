# Microservice Definitions

## Overview
Two domain services.

## Traffic & Scalability
expectedTraffic: medium.

## Services
```json
[
  { "name": "orders", "content": "Responsibilities: orders.\npatterns: (none)" },
  { "name": "customerProfiles", "content": "Responsibilities: profiles.\npatterns: (none)" }
]
```

## Sagas
- (none)

## Event Contracts
| Producer (service.api) | Topic | Emission | Payload keys | Consumer | Outcome applier |
|---|---|---|---|---|---|
| orders.createOrder | shop-orders-order-created | derived | `id` | customerProfiles | kafka: customerProfiles.applyOrder |

## AI Agents
- (none)

# Microservice Definitions

## Overview
Two domain services.

## Traffic & Scalability
expectedTraffic: medium.

## Services
The services are orders and customerProfiles.

## Sagas
- (none)

## Event Contracts
| Producer (service.api) | Topic | Emission | Payload keys | Consumer | Outcome applier |
|---|---|---|---|---|---|
| orders.createOrder | shop-orders-order-created | derived | `id` | customerProfiles | kafka: customerProfiles.applyOrder |

## AI Agents
- (none)

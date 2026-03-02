# Instructions for compute.googleapis.com/Route

## Parent

Determine the parent based the following prioritized properties, first match wins:

1. `nextHopVpnTunnel` property
2. `nextHopNetwork` property
3. `nextHopGateway` property: use the `network` property instead.
4. `nextHopPeering` property: use the `network` property instead.

## Destination rage

Use the literal `destRange` property.

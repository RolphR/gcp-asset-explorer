# Instructions for compute.googleapis.com/Router

## Parent

Determine the parent based the following prioritized properties, first match wins:

1. `network` property
2. Use the generic parent field instead

## Router type

This is a derived field:

- If there is a `nats` property, label this router as `NAT`
- If there is a `bgp` property, label this router as `BGP`
- Otherwise label this router as `UNKNOWN`

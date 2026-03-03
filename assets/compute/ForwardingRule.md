# Instructions for compute.googleapis.com/ForwardingRule

## Parent

A forwarding rule can have multie parents.
Determine the parents based the following rules:

- If it has `subnetwork`, use that. Otherwise if it has a `network` specified, use that instead.
- If it has a `target` specified, add it.
- If no parents have been selected, use the default parent.

## Scheme

Use the literal `loadBalancingScheme` property.

## Address

Use the literal `IPAddress` property.

## Protocol

Use the literal `IPProtocol` property.

## Ports

Use the literal `portRange` property.

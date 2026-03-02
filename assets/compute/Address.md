# Instructions for compute.googleapis.com/Address

## Parent

Determine the parent based the following rules:

- If the address has a `subnetwork` specified, use it as the parent.
- If there is no subnetwork, but the address has an array of `users`, designate every user as parent.
- If neither of the above apply, use the default parent instead.

This asset can have more than 1 parent.

## Status

Use the literal `status` property of the asset.

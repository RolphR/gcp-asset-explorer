# Instructions for compute.googleapis.com/GlobalAddress

## Parent

Determine the parent based the following rules:

- If the address has an array of `users`, designate every user as parent.
- If there are no users, but it has a `subnetwork` specified, use it as the parent.
- If is still no parent, but it has a `network` specified, use it as the parent.
- If neither of the above apply, use the default parent instead.

This asset can have more than 1 parent.

## Status

Use the literal `status` property of the asset.

## Purpose

Use the literal `purpose` property of the asset.

# Instructions for servicenetworking.googleapis.com/Connection

## Parent

Add parents based the following rules:

- Any ragne in the `reservedPeeringRanges` property: use construct this reference: `//compute.googleapis.com/projects/<PROJECT_NUMBER>/global/addresses/<PEERING_RANGE>`.
- The `network` property: ensure it's formatted like with `//compute.googleapis.com/projects/<PROJECT_NUMBER>/global/networks/<NETWORK>`.
- If none of the above apply, use the default parent instead.

This asset can have more than 1 parent.
Remove any duplicates from the list.
Project number can be derived from the first ancestor `projects/<PROJECT_NUMBER>`.

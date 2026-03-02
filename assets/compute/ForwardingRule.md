# Instructions for compute.googleapis.com/ForwardingRule

## Parent

Determine the parent based the following rules:

- If the forwarding rule has a `network` specified, create a single edge pointing to that network.
- If there is no network, but it has a `target` specified, create a single edge pointing to that target.
- If neither a network nor a target is specified, log a message indicating an unknown target for the forwarding rule and create a single edge pointing to its default parent.

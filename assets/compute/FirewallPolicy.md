# Instructions for compute.googleapis.com/FirewallPolicy

## Parent

A fireweall policy can have multie parents.
Collect all parents based the following rules:

- If it has any `associations`, add each `attachmentTarget` within that association as a parent.
- Add the default parent.

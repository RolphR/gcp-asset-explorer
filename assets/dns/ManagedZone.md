# dns.googleapis.com/ManagedZone

## ID

The default ID of a ManagedZone incorrectly refers to the project as `//dns.googleapis.com/projects/<PROJECT_ID>/managedZones/<MANAGED_ZONE_ID>`.
It should refer to `//dns.googleapis.com/projects/<PROJECT_NUMBER>/locations/<LOCATION>/managedZones/<MANAGED_ZONE_ID>` instead.
Reconstruct it using the parent property, which looks like `//cloudresourcemanager.googleapis.com/projects/<PROJECT_NUMBER>`.
Obtain the location from the location property.

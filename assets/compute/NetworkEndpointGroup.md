# Instructions for compute.googleapis.com/RegionBackendService

## Parent

Determine the parent based the following prioritized properties, first match wins:

1. `data`.`cloudRun`.`service` property.
   Format it based on the the ID of this asset (`//compute.googleapis.com/projects/<PROJECT_ID>/regions/<LOCATION>/networkEndpointGroups/...`) with the following format: `//run.googleapis.com/projects/<PROJECT_ID>/locations/<LOCATION>>/services/<SERVICE>`
2. Default parent

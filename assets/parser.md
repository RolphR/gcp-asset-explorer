# Generic Asset Parsing Instructions

These are the default instructions extracting metadata from any GCP asset.
Metadata fields consist of the following types:

- Literal data, like the name and asset type
- Derived data, like display name, group
- References, like parent, ancestors, and other related nodes
  All references are sanatized by applying the `fixReference` function.

Scan all subdirectories for additional asset specific instructions.
These instructions are overlayed on top if these generic instructions and are leading when both contain instructions for the same metadata field.
Standard fields are listed below.

## ID

Use the literal `name` property of the asset as the unique identifier.
Ignore the asset if the `name` property is missing or if the asset is not an object.

## Display Name

Derive the display name using the following strategy:

  1. Look for `resource.data.displayName`.
  2. If not found, look for `resource.data.name`.
  3. If not found, fall back to the asset's `name` (the ID).

After finding the name, strip away any path prefixes by taking only the part after the last forward slash (`/`).

## Asset Type

Use the literal `assetType` property.

## Group

Derived from the `assetType` property.
Take the string up to the first period (e.g., if assetType is "compute.googleapis.com/Address", the group is "compute").
If `assetType` is missing, the group is "unknown".

## Location

Use the literal `resource.location` property, default to `global` if it's missing.

## Parent

To extract an asset's parent reference, use the following strategy:

1. Check the `resource.parent` property. If it exists and is not empty, use it.
2. If `resource.parent` is missing, check the `ancestors` array. If it has items, use the first item in the array (`ancestors[0]`) after applying the "Reference Fixing" rules to it.
3. If neither is available, the parent is an empty string.

Unless explicitly stated, assets have exactly 1 parrent

## Related Assets

List of all related assets.
Determine these references by applying the following strategy:

1. Go over every field in the raw asset object.
2. Ignore the following fields:
   - `assetType`
   - `discoveryDocumentUri`
   - `location`
   - `name`
   - `region`
   - `selfLink`
   - `selfLinkWithId`
   - `zone`
3. If it looks like a reference to an existing asset, proceed.
   Otherwise, ignore it. ignore it.
   Examples of valid references are:
   - Urls which point to (a subdomain of) `googleapis.com`
   - Relative references like `projects/...`, `folders/...`, or `organizations/...`
4. apply the `fixReference` function to sanatize the reference
5. Sort the list
6. Remove duplicates

## Data

Store the entire raw asset object in the node's `data` property.

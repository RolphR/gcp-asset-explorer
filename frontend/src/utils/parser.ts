export interface GraphNode {
  id: string;
  label: string;
  group: string;
  data: any;
  displayName?: string;
  location?: string;
  assetType?: string;
  parent?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

function fixReference(field: string): string {
  if (/^(projects|folders|organizations)\/[0-9]+$/.test(field)) {
    return `//cloudresourcemanager.googleapis.com/${field}`;
  } else if (field.startsWith("https://www.googleapis.com/compute/v1/")) {
    return field.replace(
      "https://www.googleapis.com/compute/v1/",
      "//compute.googleapis.com/"
    );
  } else if (field.startsWith("logging.googleapis.com/")) {
    return field.replace(
      "logging.googleapis.com/",
      "//logging.googleapis.com/"
    );
  } else {
    return field;
  }
}

function getParent(asset: any): string {
  let parentName = asset.resource?.parent || "";
  if (!parentName && asset.ancestors && asset.ancestors.length > 0) {
    parentName = fixReference(asset.ancestors[0]);
  }
  return parentName;
}

function getEdges(asset: any): string[] {
  const assetType = asset.assetType;
  const resourceData = asset.resource?.data || {};
  const parent = getParent(asset);

  if (assetType === "compute.googleapis.com/Address") {
    const edges: string[] = [];
    if (resourceData.subnetwork) {
      edges.push(fixReference(resourceData.subnetwork));
    } else if (resourceData.users) {
      for (const user of resourceData.users) {
        edges.push(fixReference(user));
      }
    } else if (resourceData.status === "RESERVED") {
      edges.push(parent);
    } else {
      console.log(`Unknown binding for address ${asset.name}...`);
      edges.push(parent);
    }
    return edges;
  }

  if (assetType === "compute.googleapis.com/ForwardingRule") {
    if (resourceData.network) return [fixReference(resourceData.network)];
    if (resourceData.target) return [fixReference(resourceData.target)];
    console.log(`Unknown target for forwarding rule ${asset.name}...`);
    return [parent];
  }

  if (assetType === "compute.googleapis.com/Route") {
    const edges: string[] = [];
    if (resourceData.nextHopVpnTunnel) edges.push(fixReference(resourceData.nextHopVpnTunnel));
    else if (resourceData.nextHopNetwork) edges.push(fixReference(resourceData.nextHopNetwork));
    else if (resourceData.nextHopGateway) edges.push(fixReference(resourceData.network));
    else if (resourceData.nextHopPeering) edges.push(fixReference(resourceData.network));
    else {
      console.log(`Unknown target for route ${asset.name}...`);
      if (resourceData.network) edges.push(fixReference(resourceData.network));
    }
    return edges;
  }

  if (
    assetType === "compute.googleapis.com/Router" ||
    assetType === "compute.googleapis.com/Subnetwork" ||
    assetType === "compute.googleapis.com/TargetVpnGateway"
  ) {
    if (resourceData.network) return [fixReference(resourceData.network)];
    return [parent];
  }

  if (assetType === "compute.googleapis.com/VpnTunnel") {
    if (resourceData.targetVpnGateway) return [fixReference(resourceData.targetVpnGateway)];
    return [parent];
  }

  return [parent];
}

export function parseAssetData(rawJson: any[]): GraphData {
  const nodes: GraphNode[] = [];
  const linksMap = new Map<string, string[]>();
  const nodesSet = new Set<string>();

  for (const asset of rawJson) {
    if (typeof asset !== "object" || !asset.name) {
      continue;
    }

    const sourceName = asset.name;
    const assetType = asset.assetType;
    const serviceName = assetType ? assetType.split(".")[0] : "unknown";
    const resourceData = asset.resource?.data || {};

    const rawDisplayName =
      resourceData.displayName || resourceData.name || sourceName;
    const slashIdx = rawDisplayName.lastIndexOf('/');
    const cleanDisplayName = slashIdx !== -1 ? rawDisplayName.substring(slashIdx + 1) : rawDisplayName;
    
    const location = asset.resource?.location || "global";
    const label = `${assetType}:${cleanDisplayName}`;
    const parent = getParent(asset);

    nodes.push({
      id: sourceName,
      label,
      group: serviceName,
      data: asset,
      displayName: cleanDisplayName,
      location: location,
      assetType: assetType,
      parent: parent
    });
    nodesSet.add(sourceName);

    const assetEdges = getEdges(asset);
    linksMap.set(sourceName, assetEdges);
  }

  const links: GraphEdge[] = [];
  for (const [source, targets] of linksMap.entries()) {
    for (const target of targets) {
      if (target) {
        links.push({ source, target });
        
        if (!nodesSet.has(target)) {
          nodesSet.add(target);
          nodes.push({
            id: target,
            label: target,
            group: 'unknown',
            data: null,
          });
        }
      }
    }
  }

  return { nodes, links };
}
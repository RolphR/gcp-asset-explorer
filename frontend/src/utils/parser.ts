export interface GraphNode {
  id: string;
  label: string;
  group: string;
  data: any;
  displayName?: string;
  location?: string;
  assetType?: string;
  parent?: string | string[];
  routerType?: string;
  cidr?: string;
  destRange?: string;
  status?: string;
  relatedAssets?: string[];
  loadBalancingScheme?: string;
  IPAddress?: string;
  IPProtocol?: string;
  portRange?: string;
  purpose?: string;
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

function getRelatedAssets(asset: any): string[] {
  const references = new Set<string>();
  const ignoredKeys = new Set(['assetType', 'discoveryDocumentUri', 'location', 'name', 'region', 'selfLink', 'selfLinkWithId', 'zone']);

  function traverse(obj: any) {
    if (typeof obj === 'string') {
      if (
        obj.includes('googleapis.com') ||
        /^(projects|folders|organizations)\//.test(obj)
      ) {
        references.add(fixReference(obj));
      }
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        traverse(item);
      }
    } else if (obj !== null && typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (ignoredKeys.has(key)) {
          continue;
        }
        traverse(value);
      }
    }
  }

  traverse(asset);
  return Array.from(references).sort();
}

function findValuesByKeys(obj: any, keys: Set<string>): string[] {
  const found: string[] = [];

  function traverse(current: any) {
    if (!current || typeof current !== 'object') return;

    for (const [key, value] of Object.entries(current)) {
      if (keys.has(key)) {
        if (typeof value === 'string') {
          found.push(value);
        } else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string') {
              found.push(item);
            }
          }
        }
      }
      traverse(value);
    }
  }

  traverse(obj);
  return found;
}

function getParent(asset: any): string | string[] {
  const assetType = asset.assetType;
  const resourceData = asset.resource?.data || {};

  const getGenericParent = () => {
    let parentName = asset.resource?.parent || "";
    if (parentName) {
      parentName = fixReference(parentName);
    } else if (asset.ancestors && asset.ancestors.length > 0) {
      parentName = fixReference(asset.ancestors[0]);
    }
    return parentName;
  };

  if (assetType === "compute.googleapis.com/Firewall") {
    if (resourceData.network) return fixReference(resourceData.network);
    return getGenericParent();
  }

  if (assetType === "compute.googleapis.com/FirewallPolicy") {
    const parents: string[] = [];
    if (resourceData.associations && Array.isArray(resourceData.associations)) {
      for (const assoc of resourceData.associations) {
        if (assoc.attachmentTarget) {
          parents.push(fixReference(assoc.attachmentTarget));
        }
      }
    }
    const genericParent = getGenericParent();
    if (genericParent) {
      parents.push(genericParent);
    }
    return parents;
  }

  if (assetType === "compute.googleapis.com/Route") {
    if (resourceData.nextHopVpnTunnel) return fixReference(resourceData.nextHopVpnTunnel);
    if (resourceData.nextHopNetwork) return fixReference(resourceData.nextHopNetwork);
    if (resourceData.nextHopGateway) return fixReference(resourceData.network);
    if (resourceData.nextHopPeering) return fixReference(resourceData.network);
    // Generic fallback implied if none match? Instructions say "first match wins". 
    // Assuming if none match, it should fall back to generic parent? 
    // Actually the generic instruction "Unless explicitly stated, assets have exactly 1 parent" and logic implies fallback.
    // But specific instructions usually override.
    // However, if none of the specific properties exist, we should probably fallback to generic parent or return ""?
    // Based on other patterns, let's try generic parent at the end if no return.
  }

  if (
    assetType === "compute.googleapis.com/Router" ||
    assetType === "compute.googleapis.com/Subnetwork" ||
    assetType === "compute.googleapis.com/TargetVpnGateway"
  ) {
    if (resourceData.network) return fixReference(resourceData.network);
    return getGenericParent();
  }

  if (assetType === "compute.googleapis.com/VpnTunnel") {
    if (resourceData.targetVpnGateway) return fixReference(resourceData.targetVpnGateway);
    if (resourceData.network) return fixReference(resourceData.network);
    return getGenericParent();
  }

  if (assetType === "compute.googleapis.com/ForwardingRule") {
    const parents: string[] = [];
    if (resourceData.subnetwork) parents.push(fixReference(resourceData.subnetwork));
    else if (resourceData.network) parents.push(fixReference(resourceData.network));

    if (resourceData.target) parents.push(fixReference(resourceData.target));

    if (parents.length > 0) return parents;
    return getGenericParent();
  }

  if (
    assetType === "compute.googleapis.com/Address" ||
    assetType === "compute.googleapis.com/GlobalAddress"
  ) {
    if (
      resourceData.users &&
      Array.isArray(resourceData.users) &&
      resourceData.users.length > 0
    ) {
      return resourceData.users.map((u: string) => fixReference(u));
    }
    if (resourceData.subnetwork) return fixReference(resourceData.subnetwork);
    if (resourceData.network) return fixReference(resourceData.network);
    return getGenericParent();
  }

  if (assetType === "compute.googleapis.com/NetworkEndpointGroup") {
    if (resourceData.cloudRun?.service) {
      const match = asset.name.match(
        /\/\/compute\.googleapis\.com\/projects\/([^\/]+)\/regions\/([^\/]+)\/networkEndpointGroups\//
      );
      if (match) {
        const project = match[1];
        const location = match[2];
        const service = resourceData.cloudRun.service;
        return `//run.googleapis.com/projects/${project}/locations/${location}/services/${service}`;
      }
    }
    return getGenericParent();
  }

  if (assetType === "compute.googleapis.com/RegionBackendService") {
    const parents: string[] = [];
    if (resourceData.backends && Array.isArray(resourceData.backends)) {
      for (const backend of resourceData.backends) {
        if (backend.group) {
          parents.push(fixReference(backend.group));
        }
      }
    }
    if (parents.length > 0) return Array.from(new Set(parents));
    return getGenericParent();
  }

  if (assetType === "compute.googleapis.com/UrlMap") {
    const keys = new Set(["backendServices", "defaultService", "service"]);
    const rawParents = findValuesByKeys(resourceData, keys);
    if (rawParents.length > 0) {
      return Array.from(new Set(rawParents.map((p) => fixReference(p))));
    }
    return getGenericParent();
  }

  if (assetType === "compute.googleapis.com/TargetHttpsProxy") {
    if (resourceData.urlMap) return fixReference(resourceData.urlMap);
    return getGenericParent();
  }

  return getGenericParent();
}

export function parseAssetData(rawJson: any[]): GraphData {
  const nodes: GraphNode[] = [];
  const linksMap = new Map<string, string[]>();
  const nodesSet = new Set<string>();

  for (const asset of rawJson) {
    if (typeof asset !== "object" || !asset.name) {
      continue;
    }

    let sourceName = asset.name;
    const assetType = asset.assetType;

    if (assetType === "dns.googleapis.com/ManagedZone") {
      const parent = asset.resource?.parent;
      if (parent && parent.startsWith("//cloudresourcemanager.googleapis.com/projects/")) {
        const projectNumber = parent.split("/").pop();
        const zoneName = asset.name.split("/").pop();
        const location = asset.resource?.location || "global";
        sourceName = `//dns.googleapis.com/projects/${projectNumber}/locations/${location}/managedZones/${zoneName}`;
      }
    }

    const serviceName = assetType ? assetType.split(".")[0] : "unknown";
    const resourceData = asset.resource?.data || {};

    const rawDisplayName =
      resourceData.displayName || resourceData.name || sourceName;
    const slashIdx = rawDisplayName.lastIndexOf('/');
    const cleanDisplayName = slashIdx !== -1 ? rawDisplayName.substring(slashIdx + 1) : rawDisplayName;
    
    const location = asset.resource?.location || "global";
    const label = `${assetType}:${cleanDisplayName}`;
    const parent = getParent(asset);

    let routerType: string | undefined;
    if (assetType === "compute.googleapis.com/Router") {
      if (resourceData.nats) routerType = 'NAT';
      else if (resourceData.bgp) routerType = 'BGP';
      else routerType = 'UNKNOWN';
    }

    let cidr: string | undefined;
    if (assetType === "compute.googleapis.com/Subnetwork") {
      cidr = resourceData.ipCidrRange;
    }

    let destRange: string | undefined;
    if (assetType === "compute.googleapis.com/Route") {
      destRange = resourceData.destRange;
    }

    let status: string | undefined;
    let purpose: string | undefined;
    if (
      assetType === "compute.googleapis.com/Address" ||
      assetType === "compute.googleapis.com/GlobalAddress"
    ) {
      status = resourceData.status;
      purpose = resourceData.purpose;
    }

    let loadBalancingScheme: string | undefined;
    let IPAddress: string | undefined;
    let IPProtocol: string | undefined;
    let portRange: string | undefined;

    if (assetType === "compute.googleapis.com/ForwardingRule") {
      loadBalancingScheme = resourceData.loadBalancingScheme;
      IPAddress = resourceData.IPAddress;
      IPProtocol = resourceData.IPProtocol;
      portRange = resourceData.portRange;
    }

    const related = getRelatedAssets(asset);

    nodes.push({
      id: sourceName,
      label,
      group: serviceName,
      data: asset,
      displayName: cleanDisplayName,
      location: location,
      assetType: assetType,
      parent: parent,
      ...(routerType && { routerType }),
      ...(cidr && { cidr }),
      ...(destRange && { destRange }),
      ...(status && { status }),
      ...(purpose && { purpose }),
      ...(loadBalancingScheme && { loadBalancingScheme }),
      ...(IPAddress && { IPAddress }),
      ...(IPProtocol && { IPProtocol }),
      ...(portRange && { portRange }),
      relatedAssets: related,
    });
    nodesSet.add(sourceName);

    const assetEdges = new Set<string>();
    
    if (Array.isArray(parent)) {
      for (const p of parent) {
        if (p) assetEdges.add(p);
      }
    } else if (parent) {
      assetEdges.add(parent);
    }

    // A node shouldn't have an edge to itself
    assetEdges.delete(sourceName);

    linksMap.set(sourceName, Array.from(assetEdges));
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

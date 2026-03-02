import { useState, useMemo, useEffect } from 'react';
import { parseAssetData } from './utils/parser';
import type { GraphData, GraphNode } from './utils/parser';
import { Dropzone } from './components/Dropzone';
import { GraphViewer } from './components/GraphViewer';
import { Sidebar } from './components/Sidebar';
import { SearchPanel, type FilterState } from './components/SearchPanel';
import { cn } from './utils/cn';
import { RefreshCw, Download } from 'lucide-react';

function App() {
  const [data, setData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    freeText: '',
    services: new Set(),
    assetTypes: new Set(),
    locations: new Set(),
    parents: new Set(),
    hideNonMatching: false
  });
  
  const [debouncedFreeText, setDebouncedFreeText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFreeText(filters.freeText), 300);
    return () => clearTimeout(timer);
  }, [filters.freeText]);

  const handleFileLoaded = (json: any[]) => {
    const graphData = parseAssetData(json);
    setData(graphData);
  };

  const resetData = () => {
    setData(null);
    setSelectedNode(null);
    setFilters({
      freeText: '',
      services: new Set(),
      assetTypes: new Set(),
      locations: new Set(),
      parents: new Set(),
      hideNonMatching: false
    });
  };

  const globalOptions = useMemo(() => {
    if (!data) return { services: [], assetTypes: [], locations: [], parents: [] };
    const services = new Set<string>();
    const assetTypes = new Set<string>();
    const locations = new Set<string>();
    const parents = new Set<string>();

    for (const node of data.nodes) {
      services.add(node.group);
      if (node.assetType) assetTypes.add(node.assetType);
      if (node.location) locations.add(node.location);
      if (node.parent) {
        if (Array.isArray(node.parent)) {
          node.parent.forEach(p => parents.add(p));
        } else {
          parents.add(node.parent);
        }
      }
    }
    return {
      services: Array.from(services),
      assetTypes: Array.from(assetTypes),
      locations: Array.from(locations),
      parents: Array.from(parents)
    };
  }, [data]);

  const filterOptions = useMemo(() => {
    if (!data) return { services: [], assetTypes: [], locations: [], parents: [] };

    const serviceCounts = new Map<string, number>();
    const assetTypeCounts = new Map<string, number>();
    const locationCounts = new Map<string, number>();
    const parentCounts = new Map<string, number>();

    globalOptions.services.forEach(s => serviceCounts.set(s, 0));
    globalOptions.assetTypes.forEach(a => assetTypeCounts.set(a, 0));
    globalOptions.locations.forEach(l => locationCounts.set(l, 0));
    globalOptions.parents.forEach(p => parentCounts.set(p, 0));

    const lowerText = debouncedFreeText.toLowerCase();

    for (const node of data.nodes) {
      const nodeService = node.group;
      const nodeAssetType = node.assetType || 'unknown';
      const nodeLocation = node.location || 'global';
      const nodeParent = node.parent || [];
      const parentArray = Array.isArray(nodeParent) ? nodeParent : [nodeParent].filter(Boolean);

      // Check text match
      let textMatch = true;
      if (lowerText) {
        textMatch = false;
        if (node.data) {
          const raw = JSON.stringify(node.data).toLowerCase();
          if (raw.includes(lowerText)) {
            textMatch = true;
          }
        }
      }

      const serviceMatch = filters.services.size === 0 || filters.services.has(nodeService);
      const assetTypeMatch = filters.assetTypes.size === 0 || filters.assetTypes.has(nodeAssetType);
      const locationMatch = filters.locations.size === 0 || filters.locations.has(nodeLocation);
      const parentMatch = filters.parents.size === 0 || parentArray.some(p => filters.parents.has(p));

      if (assetTypeMatch && locationMatch && parentMatch && textMatch) {
        serviceCounts.set(nodeService, (serviceCounts.get(nodeService) || 0) + 1);
      }

      if (serviceMatch && locationMatch && parentMatch && textMatch) {
        assetTypeCounts.set(nodeAssetType, (assetTypeCounts.get(nodeAssetType) || 0) + 1);
      }

      if (serviceMatch && assetTypeMatch && parentMatch && textMatch) {
        locationCounts.set(nodeLocation, (locationCounts.get(nodeLocation) || 0) + 1);
      }

      if (serviceMatch && assetTypeMatch && locationMatch && textMatch && parentArray.length > 0) {
        parentArray.forEach(p => {
          parentCounts.set(p, (parentCounts.get(p) || 0) + 1);
        });
      }
    }

    const toOptionArray = (countsMap: Map<string, number>) => {
      return Array.from(countsMap.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value));
    };

    return {
      services: toOptionArray(serviceCounts),
      assetTypes: toOptionArray(assetTypeCounts),
      locations: toOptionArray(locationCounts),
      parents: toOptionArray(parentCounts),
    };
  }, [data, filters.services, filters.assetTypes, filters.locations, filters.parents, debouncedFreeText, globalOptions]);

  const matchedNodeIds = useMemo(() => {
    if (!data) return new Set<string>();
    
    if (filters.services.size === 0 && filters.assetTypes.size === 0 && filters.locations.size === 0 && filters.parents.size === 0 && !debouncedFreeText) {
      return new Set(data.nodes.map(n => n.id));
    }

    const matched = new Set<string>();
    const lowerText = debouncedFreeText.toLowerCase();

    for (const node of data.nodes) {
      let isMatch = true;
      
      if (filters.services.size > 0 && !filters.services.has(node.group)) {
        isMatch = false;
      }
      
      if (isMatch && filters.assetTypes.size > 0 && (!node.assetType || !filters.assetTypes.has(node.assetType))) {
        isMatch = false;
      }
      
      if (isMatch && filters.locations.size > 0 && (!node.location || !filters.locations.has(node.location))) {
        isMatch = false;
      }

      if (isMatch && filters.parents.size > 0) {
        const pArray = Array.isArray(node.parent) ? node.parent : (node.parent ? [node.parent] : []);
        if (pArray.length === 0 || !pArray.some(p => filters.parents.has(p))) {
          isMatch = false;
        }
      }

      if (isMatch && lowerText) {
        if (node.data) {
          const raw = JSON.stringify(node.data).toLowerCase();
          if (!raw.includes(lowerText)) {
            isMatch = false;
          }
        } else {
          isMatch = false;
        }
      }

      if (isMatch) matched.add(node.id);
    }
    return matched;
  }, [data, filters.services, filters.assetTypes, filters.locations, filters.parents, debouncedFreeText]);

  const visibleData = useMemo(() => {
    if (!data) return null;
    if (!filters.hideNonMatching) return data; 

    const visibleNodes = data.nodes.filter(n => matchedNodeIds.has(n.id));
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const visibleLinks = data.links.filter(l => 
      visibleNodeIds.has(typeof l.source === 'object' ? (l.source as any).id : l.source as string) && 
      visibleNodeIds.has(typeof l.target === 'object' ? (l.target as any).id : l.target as string)
    );

    return { nodes: visibleNodes, links: visibleLinks };
  }, [data, matchedNodeIds, filters.hideNonMatching]);

  const exportableNodeCount = useMemo(() => {
    if (!data) return 0;
    let count = 0;
    for (const node of data.nodes) {
      if (matchedNodeIds.has(node.id) && node.data) count++;
    }
    return count;
  }, [data, matchedNodeIds]);

  const handleExport = () => {
    if (!data) return;
    const exportData = data.nodes
      .filter(n => matchedNodeIds.has(n.id) && n.data)
      .map(n => n.data);

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'filtered_gcp_assets.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredNodes = useMemo(() => {
    if (!data) return [];
    return data.nodes.filter(n => matchedNodeIds.has(n.id) && n.data);
  }, [data, matchedNodeIds]);

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (!selectedNode || filteredNodes.length === 0) return;
    const currentIndex = filteredNodes.findIndex(n => n.id === selectedNode.id);
    if (currentIndex === -1) return;
    
    if (direction === 'next' && currentIndex < filteredNodes.length - 1) {
      setSelectedNode(filteredNodes[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setSelectedNode(filteredNodes[currentIndex - 1]);
    }
  };

  const handleSelectNode = (id: string) => {
    if (!data) return;
    const nextNode = data.nodes.find(n => n.id === id);
    if (nextNode) {
      setSelectedNode(nextNode);
    }
  };

  const hasNext = selectedNode ? filteredNodes.findIndex(n => n.id === selectedNode.id) < filteredNodes.length - 1 : false;
  const hasPrev = selectedNode ? filteredNodes.findIndex(n => n.id === selectedNode.id) > 0 : false;

  return (
    <div className={cn("h-screen bg-gray-50 flex flex-col w-full overflow-hidden")}>
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm z-10 relative">
        <h1 className="text-xl font-semibold text-gray-800">GCP Asset Explorer</h1>
        {data && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export ({exportableNodeCount})
            </button>
            <button
              onClick={resetData}
              className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Load New File
            </button>
          </div>
        )}
      </header>

      <main className="flex-1 relative flex items-center justify-center overflow-hidden">
        {!data ? (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-medium text-gray-700 mb-6">Analyze GCP Asset Inventory</h2>
            <Dropzone onFileLoaded={handleFileLoaded} />
          </div>
        ) : visibleData ? (
          <div className="w-full h-full relative">
            <SearchPanel 
              filters={filters} 
              setFilters={setFilters} 
              availableServices={filterOptions.services}
              availableAssetTypes={filterOptions.assetTypes}
              availableLocations={filterOptions.locations}
              availableParents={filterOptions.parents}
            />
            <GraphViewer 
              data={visibleData} 
              onNodeClick={setSelectedNode} 
              matchedNodeIds={matchedNodeIds}
              dimUnmatched={!filters.hideNonMatching && matchedNodeIds.size !== data.nodes.length}
              selectedNodeId={selectedNode?.id}
            />
            <Sidebar 
              node={selectedNode} 
              onClose={() => setSelectedNode(null)} 
              onNavigate={handleNavigate}
              onSelectNode={handleSelectNode}
              hasNext={hasNext}
              hasPrev={hasPrev}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default App;
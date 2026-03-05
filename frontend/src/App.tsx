import { useState, useMemo, useEffect } from 'react';
import { parseAssetData } from './utils/parser';
import type { GraphData, GraphNode } from './utils/parser';
import { Dropzone } from './components/Dropzone';
import { GraphViewer } from './components/GraphViewer';
import { ListView } from './components/ListView';
import { Sidebar } from './components/Sidebar';
import { SearchPanel, type FilterState } from './components/SearchPanel';
import { cn } from './utils/cn';
import { RefreshCw, Download, Network, List } from 'lucide-react';

function App() {
  const [data, setData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoomTrigger, setZoomTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  const [filters, setFilters] = useState<FilterState>({
    freeText: '',
    searchMode: 'tokenized',
    caseSensitive: false,
    negate: false,
    services: new Set(),
    assetTypes: new Set(),
    locations: new Set(),
    parents: new Set(),
    assetIds: new Set(),
    hideNonMatching: false
  });
  
  const [debouncedFreeText, setDebouncedFreeText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFreeText(filters.freeText), 300);
    return () => clearTimeout(timer);
  }, [filters.freeText]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFileLoaded = (json: any[]) => {
    const graphData = parseAssetData(json);
    setData(graphData);
  };

  const resetData = () => {
    setData(null);
    setSelectedNode(null);
    setFilters({
      freeText: '',
      searchMode: 'tokenized',
      caseSensitive: false,
      negate: false,
      services: new Set(),
      assetTypes: new Set(),
      locations: new Set(),
      parents: new Set(),
      assetIds: new Set(),
      hideNonMatching: false
    });
  };

  const globalOptions = useMemo(() => {
    if (!data) return { services: [], assetTypes: [], locations: [], parents: [], assetIds: [] };
    const services = new Set<string>();
    const assetTypes = new Set<string>();
    const locations = new Set<string>();
    const parents = new Set<string>();
    const assetIds = new Set<string>();

    for (const node of data.nodes) {
      services.add(node.group);
      if (node.assetType) assetTypes.add(node.assetType);
      if (node.location) locations.add(node.location);
      assetIds.add(node.id);
      
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
      parents: Array.from(parents),
      assetIds: Array.from(assetIds)
    };
  }, [data]);

  const filterOptions = useMemo(() => {
    if (!data) return { services: [], assetTypes: [], locations: [], parents: [], assetIds: [] };

    const serviceCounts = new Map<string, number>();
    const assetTypeCounts = new Map<string, number>();
    const locationCounts = new Map<string, number>();
    const parentCounts = new Map<string, number>();
    const assetIdCounts = new Map<string, number>();

    globalOptions.services.forEach(s => serviceCounts.set(s, 0));
    globalOptions.assetTypes.forEach(a => assetTypeCounts.set(a, 0));
    globalOptions.locations.forEach(l => locationCounts.set(l, 0));
    globalOptions.parents.forEach(p => parentCounts.set(p, 0));
    globalOptions.assetIds.forEach(n => assetIdCounts.set(n, 0));

    // Calculate text matches once for counts
    let textMatchedIds: Set<string> | null = null;
    if (debouncedFreeText) {
        textMatchedIds = new Set();
        let regex: RegExp | null = null;
        if (filters.searchMode === 'regex') {
            try { regex = new RegExp(debouncedFreeText, filters.caseSensitive ? '' : 'i'); } catch {}
        }
        
        const lowerText = filters.caseSensitive ? debouncedFreeText : debouncedFreeText.toLowerCase();
        const tokens = filters.searchMode === 'tokenized' ? lowerText.split(/\s+/).filter(t => t.length > 0) : [];

        for (const node of data.nodes) {
            const rawJson = JSON.stringify(node.data || {});
            const target = filters.caseSensitive ? rawJson : rawJson.toLowerCase();
            let isTextMatch = false;
            
            if (filters.searchMode === 'regex' && regex) {
                if (regex.test(filters.caseSensitive ? rawJson : rawJson)) isTextMatch = true;
            } else if (filters.searchMode === 'exact') {
                if (target.includes(lowerText)) isTextMatch = true;
            } else if (filters.searchMode === 'tokenized') {
                if (tokens.length === 0) {
                    isTextMatch = true;
                } else {
                    isTextMatch = tokens.every(token => target.includes(token));
                }
            }
            
            if (isTextMatch) textMatchedIds.add(node.id);
        }
    }

    for (const node of data.nodes) {
       // Check Text Match
       if (textMatchedIds) {
          const hasMatch = textMatchedIds.has(node.id);
          if (filters.negate) {
             if (hasMatch) continue;
          } else {
             if (!hasMatch) continue;
          }
       }

       const serviceMatch = filters.services.size === 0 || filters.services.has(node.group);
       const assetTypeMatch = filters.assetTypes.size === 0 || (node.assetType && filters.assetTypes.has(node.assetType));
       const locationMatch = filters.locations.size === 0 || (node.location && filters.locations.has(node.location));
       
       const nodeParents = Array.isArray(node.parent) ? node.parent : (node.parent ? [node.parent] : []);
       const parentMatch = filters.parents.size === 0 || (nodeParents.length > 0 && nodeParents.some(p => filters.parents.has(p)));

       const assetIdMatch = filters.assetIds.size === 0 || filters.assetIds.has(node.id);

       if (assetTypeMatch && locationMatch && parentMatch && assetIdMatch) {
         serviceCounts.set(node.group, (serviceCounts.get(node.group) || 0) + 1);
       }

       if (serviceMatch && locationMatch && parentMatch && assetIdMatch) {
         const type = node.assetType || 'unknown';
         assetTypeCounts.set(type, (assetTypeCounts.get(type) || 0) + 1);
       }

       if (serviceMatch && assetTypeMatch && parentMatch && assetIdMatch) {
         const loc = node.location || 'global';
         locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1);
       }

       if (serviceMatch && assetTypeMatch && locationMatch && assetIdMatch && nodeParents.length > 0) {
         nodeParents.forEach(p => {
           parentCounts.set(p, (parentCounts.get(p) || 0) + 1);
         });
       }

       if (serviceMatch && assetTypeMatch && locationMatch && parentMatch) {
          assetIdCounts.set(node.id, (assetIdCounts.get(node.id) || 0) + 1);
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
      assetIds: toOptionArray(assetIdCounts),
    };
  }, [data, filters, debouncedFreeText, globalOptions]);



  // fuse was previously declared AFTER matchedNodeIds which used it.
  // We need to move fuse declaration BEFORE matchedNodeIds.
  const matchedNodeIds = useMemo(() => {
    if (!data) return new Set<string>();
    
    if (filters.services.size === 0 && 
        filters.assetTypes.size === 0 && 
        filters.locations.size === 0 && 
        filters.parents.size === 0 && 
        filters.assetIds.size === 0 &&
        !debouncedFreeText) {
      return new Set(data.nodes.map(n => n.id));
    }

    const matched = new Set<string>();
    
    // Pre-calculate text matches
    let textMatchedIds: Set<string> | null = null;

    if (debouncedFreeText) {
         textMatchedIds = new Set();
         let regex: RegExp | null = null;
         if (filters.searchMode === 'regex') {
           try {
             regex = new RegExp(debouncedFreeText, filters.caseSensitive ? '' : 'i');
           } catch (e) {
             console.warn("Invalid regex:", e);
           }
         }
         
         const lowerText = filters.caseSensitive ? debouncedFreeText : debouncedFreeText.toLowerCase();
         // Split on whitespace, punctuation, dashes, underscores, and other non-alphanumeric characters
         const tokens = filters.searchMode === 'tokenized' ? lowerText.split(/[\s.,;:_\\\/\-]+/).filter(t => t.length > 0) : [];

          for (const node of data.nodes) {
             let isTextMatch = false;
             // Search raw JSON for exact/regex to ensure "any field" coverage including structural keys
             const rawJson = JSON.stringify(node.data || {});
             const target = filters.caseSensitive ? rawJson : rawJson.toLowerCase();
             
             if (filters.searchMode === 'regex' && regex) {
               if (regex.test(filters.caseSensitive ? rawJson : rawJson)) {
                  isTextMatch = true;
               }
             } else if (filters.searchMode === 'exact') {
                if (target.includes(lowerText)) {
                  isTextMatch = true;
                }
             } else if (filters.searchMode === 'tokenized') {
                if (tokens.length === 0) {
                    isTextMatch = true;
                } else {
                    isTextMatch = tokens.every(token => target.includes(token));
                }
             }
 
             if (isTextMatch) {
               textMatchedIds.add(node.id);
             }
          }
     }
 
     for (const node of data.nodes) {
       let isMatch = true;
       
       // Text Filter
       if (textMatchedIds) {
          const hasMatch = textMatchedIds.has(node.id);
          if (filters.negate) {
             if (hasMatch) isMatch = false;
          } else {
             if (!hasMatch) isMatch = false;
          }
       }
       
       if (isMatch && filters.services.size > 0 && !filters.services.has(node.group)) {

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

      if (isMatch && filters.assetIds.size > 0) {
        // We now filter names by ID
        if (!filters.assetIds.has(node.id)) {
          isMatch = false;
        }
      }

      if (isMatch) matched.add(node.id);
    }
    return matched;
  }, [data, filters, debouncedFreeText]);

  const visibleData = useMemo(() => {
    if (!data) return null;
    if (!filters.hideNonMatching) return data; 

    const visibleNodes = data.nodes.filter(n => matchedNodeIds.has(n.id));
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const visibleLinks = data.links.filter(l => 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      visibleNodeIds.has(typeof l.source === 'object' ? (l.source as any).id : l.source as string) && 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // Nodes to show in list view: apply filters even if "dim unmatched" is selected in graph
  const listNodes = useMemo(() => {
      if (!data) return [];
      return data.nodes.filter(n => matchedNodeIds.has(n.id));
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

  const handleZoomTo = () => setZoomTrigger(prev => prev + 1);

  const getNodeDisplayName = (id: string) => {
    if (!data) return id;
    const n = data.nodes.find(node => node.id === id);
    return n?.displayName || id;
  };

  const hasNext = selectedNode ? filteredNodes.findIndex(n => n.id === selectedNode.id) < filteredNodes.length - 1 : false;
  const hasPrev = selectedNode ? filteredNodes.findIndex(n => n.id === selectedNode.id) > 0 : false;

  return (
    <div className={cn("h-screen bg-gray-50 flex flex-col w-full overflow-hidden")}>
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm z-10 relative">
        <h1 className="text-xl font-semibold text-gray-800">GCP Asset Explorer</h1>
        {data && (
          <div className="flex items-center gap-3">
             <div className="flex bg-gray-100 p-1 rounded-md mr-2">
              <button
                onClick={() => setViewMode('graph')}
                className={cn(
                  "p-1.5 rounded-sm transition-all",
                  viewMode === 'graph' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                )}
                title="Graph View"
              >
                <Network className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-1.5 rounded-sm transition-all",
                  viewMode === 'list' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                )}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
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
          <div className="w-full h-full relative flex">
             <SearchPanel 
                filters={filters} 
                setFilters={setFilters} 
                availableServices={filterOptions.services}
                availableAssetTypes={filterOptions.assetTypes}
                availableLocations={filterOptions.locations}
                availableParents={filterOptions.parents}
                availableAssetIds={filterOptions.assetIds}
              />
            
            <div className="flex-1 relative h-full overflow-hidden">
                {viewMode === 'graph' ? (
                  <GraphViewer 
                    data={visibleData} 
                    onNodeClick={setSelectedNode} 
                    matchedNodeIds={matchedNodeIds}
                    dimUnmatched={!filters.hideNonMatching && matchedNodeIds.size !== data.nodes.length}
                    selectedNodeId={selectedNode?.id}
                    zoomTrigger={zoomTrigger}
                  />
                ) : (
                  <ListView 
                    nodes={listNodes}
                    onNodeClick={setSelectedNode}
                  />
                )}
            </div>

            <Sidebar 
              node={selectedNode} 
              onClose={() => setSelectedNode(null)} 
              onNavigate={handleNavigate}
              onSelectNode={handleSelectNode}
              getNodeDisplayName={getNodeDisplayName}
              onZoomTo={handleZoomTo}
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

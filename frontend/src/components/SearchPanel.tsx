import React, { useState, useMemo } from 'react';
import { Search, Layers, Box, EyeOff, Eye, Filter, MapPin, ArrowDownAZ, ArrowUpAZ, ArrowDown01, ArrowUp01, CheckSquare, ChevronDown, ChevronRight, Network, ChevronLeft } from 'lucide-react';

export interface FilterState {
  freeText: string;
  services: Set<string>;
  assetTypes: Set<string>;
  locations: Set<string>;
  parents: Set<string>;
  hideNonMatching: boolean;
}

export interface FilterOption {
  value: string;
  count: number;
}

interface SearchPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  availableServices: FilterOption[];
  availableAssetTypes: FilterOption[];
  availableLocations: FilterOption[];
  availableParents: FilterOption[];
}

type SortMode = 'count_desc' | 'count_asc' | 'name_asc' | 'name_desc';

interface DimensionFilterProps {
  title: string;
  icon: React.ReactNode;
  options: FilterOption[];
  selectedValues: Set<string>;
  onToggle: (value: string) => void;
  onToggleAll: (values: string[], selectAll: boolean) => void;
  defaultCollapsed?: boolean;
}

function DimensionFilter({ title, icon, options, selectedValues, onToggle, onToggleAll, defaultCollapsed = false }: DimensionFilterProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('count_desc');
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const cycleSortMode = () => {
    const modes: SortMode[] = ['count_desc', 'count_asc', 'name_asc', 'name_desc'];
    const nextIdx = (modes.indexOf(sortMode) + 1) % modes.length;
    setSortMode(modes[nextIdx]);
  };

  const getSortIcon = () => {
    switch (sortMode) {
      case 'count_desc': return <ArrowDown01 className="w-4 h-4 text-gray-500" />;
      case 'count_asc': return <ArrowUp01 className="w-4 h-4 text-gray-500" />;
      case 'name_asc': return <ArrowDownAZ className="w-4 h-4 text-blue-500" />;
      case 'name_desc': return <ArrowUpAZ className="w-4 h-4 text-blue-500" />;
    }
  };

  const sortTitle = 
    sortMode === 'count_desc' ? 'Sort by Count (Desc)' :
    sortMode === 'count_asc' ? 'Sort by Count (Asc)' :
    sortMode === 'name_asc' ? 'Sort by Name (Asc)' : 'Sort by Name (Desc)';

  const filteredOptions = useMemo(() => {
    let filtered = options;
    if (localSearch) {
      const lowerSearch = localSearch.toLowerCase();
      filtered = options.filter(o => o.value.toLowerCase().includes(lowerSearch));
    }

    return [...filtered].sort((a, b) => {
      if (sortMode === 'count_desc') {
        if (a.count !== b.count) return b.count - a.count;
        return a.value.localeCompare(b.value);
      } else if (sortMode === 'count_asc') {
        if (a.count !== b.count) return a.count - b.count;
        return a.value.localeCompare(b.value);
      } else if (sortMode === 'name_asc') {
        return a.value.localeCompare(b.value);
      } else if (sortMode === 'name_desc') {
        return b.value.localeCompare(a.value);
      }
      return 0;
    });
  }, [options, localSearch, sortMode]);

  const handleToggleAll = () => {
    const visibleValues = filteredOptions.map(o => o.value);
    const unselectedCount = visibleValues.filter(v => !selectedValues.has(v)).length;
    
    // If any are unselected, select all visible. Otherwise deselect all visible.
    const shouldSelectAll = unselectedCount > 0;
    onToggleAll(visibleValues, shouldSelectAll);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label 
          className="text-sm font-medium text-gray-700 flex items-center cursor-pointer select-none group"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {icon}
          <span className="ml-1 mr-1">{title} ({options.length})</span>
          <span className="text-gray-400 group-hover:text-gray-600 transition-colors">
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </label>
        <div className="flex items-center gap-1">
          <button onClick={handleToggleAll} className="p-1 hover:bg-gray-100 rounded" title="Toggle All Visible">
            <CheckSquare className="w-4 h-4 text-gray-500" />
          </button>
          <button onClick={cycleSortMode} className="p-1 hover:bg-gray-100 rounded" title={sortTitle}>
            {getSortIcon()}
          </button>
        </div>
      </div>
      
      {!isCollapsed && (
        <>
          <input
            type="text"
            className="w-full px-2 py-1 mb-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={`Filter ${title.toLowerCase()}...`}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-gray-50 p-2 space-y-1">
            {filteredOptions.length === 0 && <p className="text-xs text-gray-500 p-1">No options match filter.</p>}
            {filteredOptions.map(option => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
                <input
                  type="checkbox"
                  checked={selectedValues.has(option.value)}
                  onChange={() => onToggle(option.value)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 truncate" title={option.value}>
                  {option.value} <span className="text-gray-400">({option.count})</span>
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SearchPanel({ filters, setFilters, availableServices, availableAssetTypes, availableLocations, availableParents }: SearchPanelProps) {
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  
  const createToggleHandler = (dimension: 'services' | 'assetTypes' | 'locations' | 'parents') => (value: string) => {
    setFilters(prev => {
      const next = new Set(prev[dimension]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...prev, [dimension]: next };
    });
  };

  const createToggleAllHandler = (dimension: 'services' | 'assetTypes' | 'locations' | 'parents') => (values: string[], selectAll: boolean) => {
    setFilters(prev => {
      const next = new Set(prev[dimension]);
      if (selectAll) {
        values.forEach(v => next.add(v));
      } else {
        values.forEach(v => next.delete(v));
      }
      return { ...prev, [dimension]: next };
    });
  };

  if (isPanelCollapsed) {
    return (
      <div className="absolute top-4 left-4 bg-white shadow-lg rounded-lg border border-gray-200 z-20">
        <button onClick={() => setIsPanelCollapsed(false)} className="p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center" title="Expand Filters">
          <Filter className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 w-1/5 min-w-[20rem] max-w-[50vw] bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col max-h-[calc(100vh-8rem)] z-20 resize overflow-hidden">
      <div className="p-4 border-b border-gray-200 shrink-0 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-gray-500" />
          Filters
        </h2>
        <button onClick={() => setIsPanelCollapsed(true)} className="p-1 hover:bg-gray-100 rounded transition-colors" title="Collapse Panel">
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex-1 space-y-6">
        {/* Free Text Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Search className="w-4 h-4 mr-1 text-gray-400" />
            Search Properties
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search raw JSON..."
            value={filters.freeText}
            onChange={(e) => setFilters(prev => ({ ...prev, freeText: e.target.value }))}
          />
        </div>

        {/* Visibility Toggle */}
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-100">
          <span className="text-sm font-medium text-gray-700">Filter Mode</span>
          <button
            onClick={() => setFilters(prev => ({ ...prev, hideNonMatching: !prev.hideNonMatching }))}
            className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            {filters.hideNonMatching ? (
              <><EyeOff className="w-4 h-4 mr-1" /> Hide Unmatched</>
            ) : (
              <><Eye className="w-4 h-4 mr-1" /> Dim Unmatched</>
            )}
          </button>
        </div>

        <DimensionFilter
          title="Locations"
          icon={<MapPin className="w-4 h-4 text-gray-400" />}
          options={availableLocations}
          selectedValues={filters.locations}
          onToggle={createToggleHandler('locations')}
          onToggleAll={createToggleAllHandler('locations')}
        />

        <DimensionFilter
          title="Services"
          icon={<Layers className="w-4 h-4 text-gray-400" />}
          options={availableServices}
          selectedValues={filters.services}
          onToggle={createToggleHandler('services')}
          onToggleAll={createToggleAllHandler('services')}
        />

        <DimensionFilter
          title="Asset Types"
          icon={<Box className="w-4 h-4 text-gray-400" />}
          options={availableAssetTypes}
          selectedValues={filters.assetTypes}
          onToggle={createToggleHandler('assetTypes')}
          onToggleAll={createToggleAllHandler('assetTypes')}
        />

        <DimensionFilter
          title="Parents"
          icon={<Network className="w-4 h-4 text-gray-400" />}
          options={availableParents}
          selectedValues={filters.parents}
          onToggle={createToggleHandler('parents')}
          onToggleAll={createToggleAllHandler('parents')}
          defaultCollapsed={true}
        />
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
        <button
          onClick={() => setFilters(prev => ({ ...prev, services: new Set(), assetTypes: new Set(), locations: new Set(), parents: new Set(), freeText: '' }))}
          className="w-full py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Clear All Filters
        </button>
      </div>
    </div>
  );
}
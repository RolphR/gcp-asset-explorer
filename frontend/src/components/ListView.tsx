import React, { useState, useMemo } from 'react';
import type { GraphNode } from '../utils/parser';
import { getAllColumns, getCellValue } from '../utils/columnUtils';
import { ColumnConfigModal } from './ColumnConfigModal';
import { ArrowUpDown, ArrowUp, ArrowDown, Settings2, Download } from 'lucide-react';

interface ListViewProps {
  nodes: GraphNode[];
  onNodeClick: (node: GraphNode) => void;
}

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string;
  direction: SortDirection;
}

export function ListView({ nodes, onNodeClick }: ListViewProps) {
  const [visibleColumns, setVisibleColumns] = useState<string[]>(['displayName', 'group', 'assetType', 'location']);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'displayName', direction: 'asc' });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Memoize all available columns to avoid re-scanning on every render
  const allColumns = useMemo(() => getAllColumns(nodes), [nodes]);

  const sortedNodes = useMemo(() => {
    const sorted = [...nodes];
    sorted.sort((a, b) => {
      const valA = getCellValue(a, sortConfig.key).toLowerCase();
      const valB = getCellValue(b, sortConfig.key).toLowerCase();

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [nodes, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDownloadCsv = () => {
    if (!nodes.length) return;
    
    // Header
    const csvContent = [
      visibleColumns.join(','),
      ...sortedNodes.map(node => visibleColumns.map(col => {
        const val = getCellValue(node, col);
        // Escape quotes and wrap in quotes if contains comma
        const escaped = val.replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'assets_list.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">
          Showing {nodes.length} assets
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 mr-2 text-gray-500" />
            Export CSV
          </button>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Settings2 className="w-4 h-4 mr-2 text-gray-500" />
            Configure Columns
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
            <tr>
              {visibleColumns.map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none whitespace-nowrap"
                  onClick={() => handleSort(col)}
                >
                  <div className="flex items-center gap-1">
                    {col}
                    <span className="text-gray-400 group-hover:text-gray-600">
                      {sortConfig.key === col ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50" />
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedNodes.map((node) => (
              <tr 
                key={node.id} 
                className="hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => onNodeClick(node)}
              >
                {visibleColumns.map((col) => (
                  <td key={`${node.id}-${col}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate" title={getCellValue(node, col)}>
                    {getCellValue(node, col) || <span className="text-gray-300 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
            {sortedNodes.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length} className="px-6 py-12 text-center text-gray-500">
                  No assets found matching the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ColumnConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        allColumns={allColumns}
        visibleColumns={visibleColumns}
        onSave={(newCols) => {
            setVisibleColumns(newCols);
            setIsConfigOpen(false);
        }}
      />
    </div>
  );
}

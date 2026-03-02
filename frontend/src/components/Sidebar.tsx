import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import type { GraphNode } from '../utils/parser';
import JsonView from '@uiw/react-json-view';

interface SidebarProps {
  node: GraphNode | null;
  onClose: () => void;
  onNavigate: (dir: 'prev' | 'next') => void;
  onSelectNode: (id: string) => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export function Sidebar({ node, onClose, onNavigate, onSelectNode, hasNext, hasPrev }: SidebarProps) {
  const [jsonCollapsed, setJsonCollapsed] = useState<number | false>(false);
  const [width, setWidth] = useState(512);

  if (!node) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = width;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      setWidth(Math.max(300, Math.min(startWidth + deltaX, window.innerWidth * 0.8)));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      style={{ width: `${width}px` }} 
      className="absolute right-0 top-0 bottom-0 bg-white shadow-xl flex flex-col z-50 border-l border-gray-200"
    >
      <div 
        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-blue-500 hover:opacity-50 transition-colors z-50 -translate-x-1"
        onMouseDown={handleMouseDown}
      />
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-800 truncate pr-4" title={node.displayName || node.id}>
          {node.displayName || node.id}
        </h2>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => onNavigate('prev')}
            disabled={!hasPrev}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Previous Asset"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => onNavigate('next')}
            disabled={!hasNext}
            className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Next Asset"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-1"></div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3 uppercase tracking-wider">Asset Metadata</h3>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-gray-200">
                <tr className="bg-white">
                  <th className="px-4 py-2 font-medium text-gray-500 w-1/3 bg-gray-50">Display Name</th>
                  <td className="px-4 py-2 text-gray-900 break-all">{node.displayName || '-'}</td>
                </tr>
                <tr className="bg-white">
                  <th className="px-4 py-2 font-medium text-gray-500 bg-gray-50">Service</th>
                  <td className="px-4 py-2 text-gray-900 capitalize">{node.group}</td>
                </tr>
                <tr className="bg-white">
                  <th className="px-4 py-2 font-medium text-gray-500 bg-gray-50">Asset Type</th>
                  <td className="px-4 py-2 text-gray-900 break-all">{node.assetType || '-'}</td>
                </tr>
                <tr className="bg-white">
                  <th className="px-4 py-2 font-medium text-gray-500 bg-gray-50">Location</th>
                  <td className="px-4 py-2 text-gray-900">{node.location || 'global'}</td>
                </tr>
                <tr className="bg-white">
                  <th className="px-4 py-2 font-medium text-gray-500 bg-gray-50 align-top">Parent</th>
                  <td className="px-4 py-2 text-gray-900 break-all">
                    {node.parent ? (
                      <ul className="space-y-1">
                        {(Array.isArray(node.parent) ? node.parent : [node.parent]).map(p => (
                          <li key={p}>
                            <button 
                              onClick={() => onSelectNode(p)}
                              className="text-blue-600 hover:text-blue-800 hover:underline text-left transition-colors"
                            >
                              {p}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : '-'}
                  </td>
                </tr>
                {node.routerType && (
                  <tr className="bg-white">
                    <th className="px-4 py-2 font-medium text-gray-500 bg-gray-50">Router Type</th>
                    <td className="px-4 py-2 text-gray-900">{node.routerType}</td>
                  </tr>
                )}
                {node.cidr && (
                  <tr className="bg-white">
                    <th className="px-4 py-2 font-medium text-gray-500 bg-gray-50">CIDR</th>
                    <td className="px-4 py-2 text-gray-900">{node.cidr}</td>
                  </tr>
                )}
                {node.destRange && (
                  <tr className="bg-white">
                    <th className="px-4 py-2 font-medium text-gray-500 bg-gray-50">Destination Range</th>
                    <td className="px-4 py-2 text-gray-900">{node.destRange}</td>
                  </tr>
                )}
                {node.status && (
                  <tr className="bg-white">
                    <th className="px-4 py-2 font-medium text-gray-500 bg-gray-50">Status</th>
                    <td className="px-4 py-2 text-gray-900">{node.status}</td>
                  </tr>
                )}
                {node.relatedAssets && node.relatedAssets.length > 0 && (
                  <tr className="bg-white">
                    <th className="px-4 py-2 font-medium text-gray-500 bg-gray-50 align-top">Related Assets</th>
                    <td className="px-4 py-2 text-gray-900 break-all text-xs">
                      <ul className="space-y-1">
                        {node.relatedAssets.map(ref => (
                          <li key={ref}>
                            <button 
                              onClick={() => onSelectNode(ref)}
                              className="text-blue-600 hover:text-blue-800 hover:underline text-left transition-colors"
                            >
                              {ref}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                )}
                <tr className="bg-white">
                  <th className="px-4 py-2 font-medium text-gray-500 bg-gray-50">Asset ID</th>
                  <td className="px-4 py-2 text-gray-900 break-all text-xs font-mono">{node.id}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {node.data && (
          <div className="flex flex-col flex-1 pb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Raw Data</h3>
              <button 
                onClick={() => setJsonCollapsed(prev => prev === false ? 1 : false)}
                className="text-xs flex items-center text-gray-500 hover:text-gray-800 transition-colors"
              >
                {jsonCollapsed === false ? (
                  <><ChevronsDownUp className="w-3 h-3 mr-1" /> Collapse All</>
                ) : (
                  <><ChevronsUpDown className="w-3 h-3 mr-1" /> Expand All</>
                )}
              </button>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto">
              <JsonView 
                value={node.data} 
                displayDataTypes={false}
                displayObjectSize={true}
                collapsed={jsonCollapsed}
                shortenTextAfterLength={100000}
                style={{ fontSize: '12px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
                beforeCopy={(text, _keyName, value) => {
                  if (typeof value === 'string') {
                    return value;
                  }
                  return text;
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
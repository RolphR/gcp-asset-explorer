import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GraphNode } from '../utils/parser';
import JsonView from '@uiw/react-json-view';

interface SidebarProps {
  node: GraphNode | null;
  onClose: () => void;
  onNavigate: (dir: 'prev' | 'next') => void;
  hasNext: boolean;
  hasPrev: boolean;
}

export function Sidebar({ node, onClose, onNavigate, hasNext, hasPrev }: SidebarProps) {
  if (!node) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[32rem] bg-white shadow-xl flex flex-col z-50 transform transition-transform border-l border-gray-200">
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
                  <th className="px-4 py-2 font-medium text-gray-500 bg-gray-50">Parent</th>
                  <td className="px-4 py-2 text-gray-900 break-all">{node.parent || '-'}</td>
                </tr>
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
            <h3 className="text-sm font-medium text-gray-700 mb-2 uppercase tracking-wider">Raw Data</h3>
            <div className="bg-white border border-gray-200 rounded-lg p-3 overflow-x-auto">
              <JsonView 
                value={node.data} 
                displayDataTypes={false}
                displayObjectSize={true}
                collapsed={2}
                style={{ fontSize: '12px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
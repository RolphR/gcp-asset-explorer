import React, { useState, useMemo } from 'react';
import { X, Search, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';

interface ColumnConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  allColumns: string[];
  visibleColumns: string[];
  onSave: (columns: string[]) => void;
}

export function ColumnConfigModal({ isOpen, onClose, allColumns, visibleColumns, onSave }: ColumnConfigModalProps) {
  const [selected, setSelected] = useState<string[]>(visibleColumns);
  const [searchQuery, setSearchQuery] = useState('');

  // Reset selected when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelected(visibleColumns);
    }
  }, [isOpen, visibleColumns]);

  const availableColumns = useMemo(() => {
    const selectedSet = new Set(selected);
    return allColumns.filter(col => !selectedSet.has(col) && col.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [allColumns, selected, searchQuery]);

  const handleAdd = (col: string) => {
    setSelected([...selected, col]);
  };

  const handleRemove = (col: string) => {
    setSelected(selected.filter(c => c !== col));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newSelected = [...selected];
    [newSelected[index - 1], newSelected[index]] = [newSelected[index], newSelected[index - 1]];
    setSelected(newSelected);
  };

  const handleMoveDown = (index: number) => {
    if (index === selected.length - 1) return;
    const newSelected = [...selected];
    [newSelected[index + 1], newSelected[index]] = [newSelected[index], newSelected[index + 1]];
    setSelected(newSelected);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Configure Columns</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex p-4 gap-4">
          {/* Available Columns */}
          <div className="flex-1 flex flex-col border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
              Available Columns
            </div>
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search columns..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {availableColumns.map(col => (
                <div 
                  key={col} 
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer group"
                  onClick={() => handleAdd(col)}
                >
                  <span className="text-sm text-gray-700 truncate" title={col}>{col}</span>
                  <button className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {availableColumns.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No columns found.
                </div>
              )}
            </div>
          </div>

          {/* Selected Columns */}
          <div className="flex-1 flex flex-col border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 flex justify-between">
              <span>Selected Columns ({selected.length})</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {selected.map((col, index) => (
                <div 
                  key={col} 
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded group bg-white border border-transparent hover:border-gray-200"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="w-6 text-xs text-gray-400 text-right">{index + 1}.</span>
                    <span className="text-sm text-gray-700 truncate font-medium" title={col}>{col}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                      disabled={index === 0}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-4 h-4 text-gray-600" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                      disabled={index === selected.length - 1}
                      className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-4 h-4 text-gray-600" />
                    </button>
                    <div className="w-px h-4 bg-gray-300 mx-1"></div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRemove(col); }}
                      className="p-1 hover:bg-red-100 rounded"
                      title="Remove"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
              {selected.length === 0 && (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No columns selected. Add some from the left.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={() => onSave(selected)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}

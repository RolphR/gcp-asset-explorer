
import type { GraphNode } from './parser';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function flattenObject(obj: any, prefix = '', result: Record<string, any> = {}): Record<string, any> {
  if (obj === null || typeof obj !== 'object') {
    result[prefix] = obj;
    return result;
  }

  if (Array.isArray(obj)) {
    // For arrays of primitives, join them.
    // For arrays of objects, stringify them to keep it simple for a cell value.
    if (obj.length > 0 && typeof obj[0] !== 'object') {
        result[prefix] = obj.join(', ');
    } else {
        result[prefix] = JSON.stringify(obj);
    }
    return result;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      flattenObject(obj[key], newKey, result);
    }
  }

  return result;
}

export function getAllColumns(nodes: GraphNode[]): string[] {
  const keys = new Set<string>();
  
  // We'll scan a sample of nodes to find available columns. 
  // Scanning all might be expensive if there are thousands, but let's try all for correctness first.
  for (const node of nodes) {
      if (!node) continue;
      
      // Add top-level fields from GraphNode that are useful
      keys.add('displayName');
      keys.add('group'); // Service
      keys.add('assetType');
      keys.add('location');
      keys.add('id');
      
      // Flatten the 'data' property which contains the raw asset JSON
      if (node.data) {
        const flat = flattenObject(node.data);
        Object.keys(flat).forEach(k => keys.add(k));
      }
  }

  return Array.from(keys).sort();
}

export function getCellValue(node: GraphNode, path: string): string {
    // Check top-level properties first
    if (path === 'displayName') return node.displayName || '';
    if (path === 'group') return node.group || '';
    if (path === 'assetType') return node.assetType || '';
    if (path === 'location') return node.location || '';
    if (path === 'id') return node.id || '';

    // If it's not a top-level property, look in node.data
    if (!node.data) return '';

    const parts = path.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = node.data;

    for (const part of parts) {
        if (current === null || current === undefined) return '';
        current = current[part];
    }

    if (current === null || current === undefined) return '';
    
    if (typeof current === 'object') {
        return JSON.stringify(current);
    }
    
    return String(current);
}

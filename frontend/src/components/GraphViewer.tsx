import { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { GraphData, GraphNode } from '../utils/parser';

interface GraphViewerProps {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  matchedNodeIds?: Set<string>;
  dimUnmatched?: boolean;
}

const colorMap: Record<string, string> = {
  compute: '#4285F4',
  storage: '#34A853',
  iam: '#EA4335',
  cloudresourcemanager: '#FBBC05',
  unknown: '#9AA0A6'
};

function getColor(group: string) {
  return colorMap[group] || colorMap.unknown;
}

export function GraphViewer({ data, onNodeClick, matchedNodeIds, dimUnmatched = false }: GraphViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const drawNode = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const isMatched = !dimUnmatched || !matchedNodeIds || matchedNodeIds.has(node.id);
    
    const opacity = isMatched ? 1 : 0.15;
    ctx.globalAlpha = opacity;

    // Draw the node circle
    const nodeSize = 6;
    ctx.beginPath();
    ctx.arc(node.x, node.y, nodeSize, 0, 2 * Math.PI, false);
    ctx.fillStyle = getColor(node.group);
    ctx.fill();

    // Do not render text if zoomed out too far or if node is unmatched
    if (globalScale < 1.5 || !isMatched) {
      ctx.globalAlpha = 1; // Reset before returning
      return;
    }

    const displayName = node.displayName || node.id;
    const location = node.location || '';
    const assetType = node.assetType || 'unknown';

    const fontSize = 10 / globalScale;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const padding = fontSize * 0.4;
    
    ctx.font = `bold ${fontSize}px Sans-Serif`;
    const nameWidth = ctx.measureText(displayName).width;
    
    ctx.font = `${fontSize * 0.8}px Sans-Serif`;
    const locWidth = location ? ctx.measureText(location).width : 0;
    const typeWidth = ctx.measureText(assetType).width;
    
    const maxWidth = Math.max(nameWidth, locWidth, typeWidth);
    const bgWidth = maxWidth + padding * 3;
    
    const lineSpacing = fontSize * 1.2;
    const linesCount = location ? 3 : 2;
    const totalBlockHeight = (linesCount - 1) * lineSpacing + fontSize;
    const bgHeight = totalBlockHeight + padding * 2;

    // Center background on node.x, node.y
    ctx.fillStyle = `rgba(255, 255, 255, ${0.85 * opacity})`;
    ctx.fillRect(
      node.x - bgWidth / 2, 
      node.y - bgHeight / 2, 
      bgWidth, 
      bgHeight
    );

    let currentY = node.y - ((linesCount - 1) * lineSpacing) / 2;

    // Draw Display Name
    ctx.font = `bold ${fontSize}px Sans-Serif`;
    ctx.fillStyle = `rgba(30, 41, 59, ${opacity})`; // slate-800
    ctx.fillText(displayName, node.x, currentY);
    
    currentY += lineSpacing;

    // Draw Location
    if (location) {
      ctx.font = `${fontSize * 0.8}px Sans-Serif`;
      ctx.fillStyle = `rgba(71, 85, 105, ${opacity})`; // slate-600
      ctx.fillText(location, node.x, currentY);
      currentY += lineSpacing;
    }

    // Draw Asset Type
    ctx.font = `${fontSize * 0.8}px Sans-Serif`;
    ctx.fillStyle = `rgba(100, 116, 139, ${opacity})`; // slate-500
    ctx.fillText(assetType, node.x, currentY);

    ctx.globalAlpha = 1; // Reset
  };

  const getLinkColor = (link: any) => {
    if (!dimUnmatched || !matchedNodeIds) return '#CBD5E1';
    
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    const isMatched = matchedNodeIds.has(sourceId) && matchedNodeIds.has(targetId);
    return isMatched ? '#CBD5E1' : 'rgba(203, 213, 225, 0.15)'; // Dim the link if either end is unmatched
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-gray-50">
      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={data}
        nodeRelSize={6}
        nodeCanvasObject={drawNode}
        nodePointerAreaPaint={(node: any, color, ctx) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
          ctx.fill();
        }}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        onNodeClick={(node: any) => onNodeClick(node as GraphNode)}
        linkColor={getLinkColor}
      />
    </div>
  );
}
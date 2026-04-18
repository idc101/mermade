import { useState, useEffect } from 'react';
import { Panel } from 'reactflow';
import type { Node } from 'reactflow';
import { Icon as IconifyIcon } from '@iconify/react';
import type { CustomNodeData, SubgraphNodeData } from '../types';

interface SidebarProps {
  selectedNode: Node | null;
  onUpdateNode: (id: string, data: Partial<CustomNodeData | SubgraphNodeData>) => void;
}

export function Sidebar({ selectedNode, onUpdateNode }: SidebarProps) {
  const [iconSearch, setIconSearch] = useState('');
  const [iconResults, setIconResults] = useState<string[]>([]);
  const [isSearchingIcons, setIsSearchingIcons] = useState(false);

  useEffect(() => {
    if (!iconSearch || iconSearch.length < 2) {
      setIconResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingIcons(true);
      try {
        const response = await fetch(`https://api.iconify.design/search?query=${iconSearch}&limit=32`);
        const data = await response.json();
        setIconResults(data.icons || []);
      } catch (e) {
        console.error('Failed to search icons:', e);
      } finally {
        setIsSearchingIcons(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [iconSearch]);

  if (!selectedNode) return null;

  return (
    <Panel position="top-right" style={{ background: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', width: '200px' }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Node Styles</div>
      <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
        <label>Label:</label>
        <input
          type="text"
          value={selectedNode.data.label || ''}
          onChange={(e) => onUpdateNode(selectedNode.id, { label: e.target.value })}
          style={{ marginBottom: '5px', padding: '2px' }}
        />
        <label>Color:</label>
        <input
          type="color"
          value={selectedNode.data.color || '#ffffff'}
          onChange={(e) => onUpdateNode(selectedNode.id, { color: e.target.value })}
          style={{ marginBottom: '5px' }}
        />
        <label>Icon Search:</label>
        <input
          type="text"
          placeholder="Search icons..."
          value={iconSearch}
          onChange={(e) => setIconSearch(e.target.value)}
          style={{ marginBottom: '5px', padding: '2px' }}
        />
        {isSearchingIcons && <div style={{ fontSize: '10px' }}>Searching...</div>}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '5px', 
          maxHeight: '120px', 
          overflowY: 'auto',
          border: '1px solid #eee',
          padding: '5px',
          borderRadius: '2px'
        }}>
          {iconResults.map(icon => (
            <div 
              key={icon}
              onClick={() => onUpdateNode(selectedNode.id, { icon })}
              style={{ 
                cursor: 'pointer', 
                padding: '4px', 
                border: `1px solid ${selectedNode.data.icon === icon ? '#3b82f6' : 'transparent'}`,
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: selectedNode.data.icon === icon ? '#eff6ff' : 'transparent'
              }}
              title={icon}
            >
              <IconifyIcon icon={icon} width={20} height={20} />
            </div>
          ))}
        </div>
        <div style={{ fontSize: '10px', marginTop: '5px', color: '#666' }}>
          Current: {selectedNode.data.icon || 'none'}
        </div>
      </div>
    </Panel>
  );
}

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useDiagramState } from './useDiagramState';
import { STORAGE_KEY, initialText } from '../constants';

// Mock getLayoutedElements as it might be slow or depend on dagre
vi.mock('../lib/layout', () => ({
  getLayoutedElements: vi.fn(async (nodes, edges) => ({ nodes, edges })),
}));

describe('useDiagramState', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with initialText if localStorage is empty', () => {
    const { result } = renderHook(() => useDiagramState());
    expect(result.current.text).toBe(initialText);
  });

  it('should initialize with saved text from localStorage', () => {
    const savedText = 'graph TD\n  A --> B';
    localStorage.setItem(STORAGE_KEY, savedText);
    const { result } = renderHook(() => useDiagramState());
    expect(result.current.text).toBe(savedText);
  });

  it('should update nodes and edges when text changes', async () => {
    const { result } = renderHook(() => useDiagramState());
    
    act(() => {
      result.current.setText('graph TD\n  Source --> Target');
    });

    await waitFor(() => {
      expect(result.current.nodes.length).toBeGreaterThan(0);
      expect(result.current.edges.length).toBeGreaterThan(0);
    });

    const nodeIds = result.current.nodes.map(n => n.id);
    expect(nodeIds).toContain('Source');
    expect(nodeIds).toContain('Target');
    expect(result.current.edges[0].source).toBe('Source');
    expect(result.current.edges[0].target).toBe('Target');
  });

  it('should sync text when nodes change internally', async () => {
    const { result } = renderHook(() => useDiagramState());
    
    // Initial parse
    act(() => {
      result.current.setText('graph TD\n  A');
    });
    
    await waitFor(() => expect(result.current.nodes.length).toBe(1));

    act(() => {
      result.current.onNodesChange([
        {
          id: 'A',
          type: 'position',
          position: { x: 100, y: 100 },
          dragging: false,
        },
      ]);
    });

    // It should now contain the config delimiter and JSON
    expect(result.current.text).toContain('arrows-config');
    expect(result.current.text).toContain('"x": 100');
  });

  it('should add a new edge via onConnect and sync to text', async () => {
    const { result } = renderHook(() => useDiagramState());
    
    act(() => {
      result.current.setText('graph TD\n  A\n  B');
    });
    
    await waitFor(() => expect(result.current.nodes.length).toBe(2));

    act(() => {
      result.current.onConnect({ source: 'A', target: 'B', sourceHandle: null, targetHandle: null });
    });

    expect(result.current.edges).toHaveLength(1);
    expect(result.current.text).toContain('A --> B');
  });

  it('should delete nodes and sync to text', async () => {
    const { result } = renderHook(() => useDiagramState());
    
    act(() => {
      result.current.setText('graph TD\n  A --> B');
    });
    
    await waitFor(() => expect(result.current.nodes.length).toBe(2));

    const nodeA = result.current.nodes.find(n => n.id === 'A')!;

    act(() => {
      result.current.onNodesDelete([nodeA]);
    });

    expect(result.current.nodes).toHaveLength(1);
    expect(result.current.nodes[0].id).toBe('B');
    expect(result.current.text).not.toContain('A');
  });

  it('should handle auto-layout correctly', async () => {
     const { result } = renderHook(() => useDiagramState());
     
     act(() => {
       result.current.setText('graph TD\n  A --> B');
     });

     await waitFor(() => expect(result.current.nodes.length).toBe(2));

     await act(async () => {
       await result.current.handleAutoLayout();
     });

     // Text should now have config (because getLayoutedElements was called and syncToText followed)
     expect(result.current.text).toContain('arrows-config');
  });
});

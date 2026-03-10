import { create } from "zustand";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from '@xyflow/react';

export const useStore = create((set, get) => ({
  nodes: [],
  edges: [],
  selectedEdge: null,
  nodeIDs: {},
  getNodeID: (type) => {
    const newIDs = { ...get().nodeIDs };
    if (newIDs[type] === undefined) {
      newIDs[type] = 0;
    }
    newIDs[type] += 1;
    set({ nodeIDs: newIDs });
    return `${type}-${newIDs[type]}`;
  },
  addNode: (node) => {
    set({
      nodes: [...get().nodes, node],
    });
  },
  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(
        {
          ...connection,
          type: 'buttonedge',
          animated: true,
          markerEnd: { type: MarkerType.Arrow, height: '20px', width: '20px' },
        },
        get().edges
      ),
    });
  },
  updateNodeConfig: (nodeId, nextConfig) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id !== nodeId) {
          return node;
        }
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...(node.data?.config || {}),
              ...nextConfig,
            },
          },
        };
      }),
    });
  },
  setSelectedEdge: (edgeId) => {
    set({ selectedEdge: edgeId });
  },
  deleteEdge: (edgeId) => {
    set({
      edges: get().edges.filter((edge) => edge.id !== edgeId),
      selectedEdge: null,
    });
  },
}));

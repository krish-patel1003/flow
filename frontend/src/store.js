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
  currentRunId: null,
  runStatus: null,
  runNodeStates: {},
  runError: null,
  runLogs: {},
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
  loadGraph: (nodes, edges) => {
    const nextNodeIDs = {};
    nodes.forEach((node) => {
      const [type, rawIndex] = String(node.id).split('-');
      const index = Number(rawIndex);
      if (!Number.isFinite(index)) {
        return;
      }
      nextNodeIDs[type] = Math.max(nextNodeIDs[type] || 0, index);
    });
    set({
      nodes,
      edges,
      nodeIDs: nextNodeIDs,
      selectedEdge: null,
    });
  },
  setCurrentRun: (runId) => {
    set({
      currentRunId: runId,
      runStatus: 'pending',
      runNodeStates: {},
      runError: null,
      runLogs: {},
    });
  },
  setRunStatusPayload: (payload) => {
    set({
      runStatus: payload?.status || null,
      runNodeStates: payload?.node_states || {},
      runError: null,
    });
  },
  setRunError: (message) => {
    set({ runError: message });
  },
  setRunLog: (nodeId, logText) => {
    set({
      runLogs: {
        ...get().runLogs,
        [nodeId]: logText,
      },
    });
  },
}));

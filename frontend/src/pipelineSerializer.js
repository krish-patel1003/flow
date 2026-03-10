const extractPort = (handleId, fallback) => {
  if (!handleId) {
    return fallback;
  }
  const parts = handleId.split('-');
  return parts[parts.length - 1];
};

export const serializePipeline = ({ id, name, nodes, edges }) => ({
  id,
  name,
  version: 'v1',
  nodes: nodes.map((node) => ({
    id: node.id,
    type: node.type,
    position: node.position,
    config: node.data?.config || {},
  })),
  edges: edges.map((edge) => ({
    id: edge.id,
    source: {
      node_id: edge.source,
      port: extractPort(edge.sourceHandle, 'output'),
    },
    target: {
      node_id: edge.target,
      port: extractPort(edge.targetHandle, 'input'),
    },
  })),
});

import { useMemo } from 'react';
import { useStore } from './store';
import { v1NodeRegistry } from './nodeRegistry';
import './inspectorPanel.css';

export const InspectorPanel = () => {
  const { nodes, selectedNodeId, uiMode } = useStore((state) => ({
    nodes: state.nodes,
    selectedNodeId: state.selectedNodeId,
    uiMode: state.uiMode,
  }));

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  if (!selectedNode) {
    return (
      <aside className="inspector-panel">
        <h2>Inspector</h2>
        <p>Select a node to view settings.</p>
        <div className="inspector-help-card">
          <strong>Beginner tip</strong>
          <p>Start with Manual Trigger, then add a Source, Transform, and Sink.</p>
        </div>
      </aside>
    );
  }

  const nodeSpec = v1NodeRegistry[selectedNode.type];
  const config = selectedNode?.data?.config || {};

  return (
    <aside className="inspector-panel">
      <h2>Inspector</h2>
      <div className="inspector-meta">
        <span className="pill">{uiMode === 'beginner' ? 'Beginner mode' : 'Advanced mode'}</span>
        <span className="pill muted">{selectedNode.id}</span>
      </div>
      <h3>{nodeSpec?.label || selectedNode.type}</h3>
      <p>{nodeSpec?.description || 'Configure this component in the node card for now.'}</p>

      <section className="inspector-section">
        <h4>Current Config</h4>
        <pre>{JSON.stringify(config, null, 2)}</pre>
      </section>

      <section className="inspector-section">
        <h4>What this does</h4>
        <p>
          This panel is now the single place for understanding node purpose. In the next increment,
          all editable fields will move here.
        </p>
      </section>
    </aside>
  );
};

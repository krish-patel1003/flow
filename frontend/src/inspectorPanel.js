import { useMemo } from 'react';
import { useStore } from './store';
import { v1NodeRegistry } from './nodeRegistry';
import './inspectorPanel.css';

const nodePorts = {
  manual_trigger: { inputs: [], outputs: ['start'] },
  file_source: { inputs: ['trigger'], outputs: ['data'] },
  python_transform: { inputs: ['input'], outputs: ['output'] },
  file_sink: { inputs: ['input'], outputs: [] },
  text: { inputs: ['input'], outputs: ['text'] },
  math: { inputs: ['num1', 'num2'], outputs: ['result'] },
  conditional: { inputs: ['value1', 'value2'], outputs: ['true', 'false'] },
  api: { inputs: ['payload'], outputs: ['response'] },
  llm: { inputs: ['system', 'prompt'], outputs: ['response'] },
  imageProcessing: { inputs: ['image'], outputs: ['processed'] },
  dataAggregation: { inputs: ['data1', 'data2', 'data3'], outputs: ['aggregated'] },
  json_extract: { inputs: ['input'], outputs: ['value'] },
  join_merge: { inputs: ['left', 'right'], outputs: ['merged'] },
  schema_validate: { inputs: ['input'], outputs: ['result'] },
  filter: { inputs: ['input'], outputs: ['pass', 'fail'] },
  notification: { inputs: ['message'], outputs: ['status'] },
};

const beginnerTips = {
  file_source: 'Use this to load local text or JSON before transformations.',
  python_transform: 'Use this only when built-in nodes are not enough.',
  file_sink: 'Use this to save final outputs so results are easy to inspect.',
  api: 'Start with GET requests, then switch to POST when sending payloads.',
  llm: 'Mock mode is best for quick testing before model integration.',
  json_extract: 'Use dot paths like user.profile.name to pick one value.',
  filter: 'Use this to branch high-priority vs low-priority items.',
  notification: 'Use log channel first, then webhook once endpoint is stable.',
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const InspectorPanel = () => {
  const {
    nodes,
    selectedNodeId,
    uiMode,
    inspectorTab,
    setInspectorTab,
    updateNodeConfig,
  } = useStore((state) => ({
    nodes: state.nodes,
    selectedNodeId: state.selectedNodeId,
    uiMode: state.uiMode,
    inspectorTab: state.inspectorTab,
    setInspectorTab: state.setInspectorTab,
    updateNodeConfig: state.updateNodeConfig,
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
  const ports = nodePorts[selectedNode.type] || { inputs: [], outputs: [] };

  const setConfig = (nextConfig) => updateNodeConfig(selectedNode.id, nextConfig);

  const renderAdvancedRetry = () => (
    <details className="advanced-settings">
      <summary>Advanced settings</summary>
      <label>Retries</label>
      <input
        type="number"
        min="0"
        max="3"
        value={config.retries ?? 0}
        onChange={(event) => setConfig({ retries: toNumber(event.target.value, 0) })}
      />
      <label>Retry backoff seconds</label>
      <input
        type="number"
        min="0"
        max="10"
        step="0.5"
        value={config.retry_backoff_seconds ?? 0}
        onChange={(event) => setConfig({ retry_backoff_seconds: toNumber(event.target.value, 0) })}
      />
    </details>
  );

  const renderConfigEditor = () => {
    if (selectedNode.type === 'manual_trigger') {
      return (
        <div className="inspector-empty">
          <p>Manual Trigger does not require required fields.</p>
          {renderAdvancedRetry()}
        </div>
      );
    }
    if (selectedNode.type === 'file_source') {
      return (
        <>
          <label>Path</label>
          <input
            type="text"
            value={config.path || ''}
            onChange={(event) => setConfig({ path: event.target.value })}
          />
          <label>Mode</label>
          <select value={config.mode || 'text'} onChange={(event) => setConfig({ mode: event.target.value })}>
            <option value="text">Text</option>
            <option value="json">JSON</option>
          </select>
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'file_sink') {
      return (
        <>
          <label>Path</label>
          <input
            type="text"
            value={config.path || ''}
            onChange={(event) => setConfig({ path: event.target.value })}
          />
          <label>Mode</label>
          <select value={config.mode || 'text'} onChange={(event) => setConfig({ mode: event.target.value })}>
            <option value="text">Text</option>
            <option value="json">JSON</option>
          </select>
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'python_transform') {
      return (
        <>
          <label>Script</label>
          <textarea
            value={config.script || ''}
            onChange={(event) => setConfig({ script: event.target.value })}
            style={{ minHeight: '140px' }}
          />
          <label>Timeout (seconds)</label>
          <input
            type="number"
            min="1"
            max="30"
            value={config.timeout_seconds ?? 5}
            onChange={(event) => setConfig({ timeout_seconds: toNumber(event.target.value, 5) })}
          />
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'api') {
      return (
        <>
          <label>Method</label>
          <select value={config.method || 'GET'} onChange={(event) => setConfig({ method: event.target.value })}>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
          <label>URL</label>
          <input
            type="text"
            value={config.url || ''}
            onChange={(event) => setConfig({ url: event.target.value })}
          />
          <label>Timeout (seconds)</label>
          <input
            type="number"
            min="1"
            max="60"
            value={config.timeout_seconds ?? 10}
            onChange={(event) => setConfig({ timeout_seconds: toNumber(event.target.value, 10) })}
          />
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'llm') {
      return (
        <>
          <label>Mode</label>
          <select value={config.mode || 'mock'} onChange={(event) => setConfig({ mode: event.target.value })}>
            <option value="mock">Mock</option>
            <option value="echo">Echo</option>
            <option value="ollama">Ollama</option>
          </select>
          <label>System Prompt</label>
          <textarea
            value={config.systemPrompt || ''}
            onChange={(event) => setConfig({ systemPrompt: event.target.value })}
            style={{ minHeight: '80px' }}
          />
          {config.mode === 'ollama' ? (
            <>
              <label>Model</label>
              <input
                type="text"
                value={config.model || 'llama3.2:1b'}
                onChange={(event) => setConfig({ model: event.target.value })}
              />
              <label>Base URL</label>
              <input
                type="text"
                value={config.baseUrl || ''}
                onChange={(event) => setConfig({ baseUrl: event.target.value })}
              />
            </>
          ) : null}
          <label>Temperature</label>
          <input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature ?? 0.2}
            onChange={(event) => setConfig({ temperature: toNumber(event.target.value, 0.2) })}
          />
          {renderAdvancedRetry()}
        </>
      );
    }
    return (
      <>
        <label>Config (JSON)</label>
        <textarea
          value={JSON.stringify(config, null, 2)}
          onChange={(event) => {
            try {
              const parsed = JSON.parse(event.target.value || '{}');
              setConfig(parsed);
            } catch (_error) {
              return;
            }
          }}
          style={{ minHeight: '220px' }}
        />
      </>
    );
  };

  return (
    <aside className="inspector-panel">
      <h2>Inspector</h2>
      <div className="inspector-tabs">
        <button
          type="button"
          className={inspectorTab === 'config' ? 'active' : ''}
          onClick={() => setInspectorTab('config')}
        >
          Config
        </button>
        <button
          type="button"
          className={inspectorTab === 'help' ? 'active' : ''}
          onClick={() => setInspectorTab('help')}
        >
          Help
        </button>
        <button
          type="button"
          className={inspectorTab === 'ports' ? 'active' : ''}
          onClick={() => setInspectorTab('ports')}
        >
          Ports
        </button>
      </div>
      <div className="inspector-meta">
        <span className="pill">{uiMode === 'beginner' ? 'Beginner mode' : 'Advanced mode'}</span>
        <span className="pill muted">{selectedNode.id}</span>
      </div>
      <h3>{nodeSpec?.label || selectedNode.type}</h3>
      <p>{nodeSpec?.description || 'Configure this component in the node card for now.'}</p>

      {inspectorTab === 'config' ? <section className="inspector-section form-section">{renderConfigEditor()}</section> : null}

      {inspectorTab === 'help' ? (
        <section className="inspector-section">
          <h4>What this does</h4>
          <p>{nodeSpec?.description || 'This node processes incoming data.'}</p>
          <h4>Beginner tip</h4>
          <p>{beginnerTips[selectedNode.type] || 'Use defaults first, then tune advanced settings only if needed.'}</p>
        </section>
      ) : null}

      {inspectorTab === 'ports' ? (
        <section className="inspector-section">
          <h4>Inputs</h4>
          {ports.inputs.length === 0 ? <p>None</p> : ports.inputs.map((port) => <p key={`in-${port}`}>{port}</p>)}
          <h4>Outputs</h4>
          {ports.outputs.length === 0 ? <p>None</p> : ports.outputs.map((port) => <p key={`out-${port}`}>{port}</p>)}
        </section>
      ) : null}
    </aside>
  );
};

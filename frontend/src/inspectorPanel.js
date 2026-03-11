import { useMemo } from 'react';
import { useStore } from './store';
import { v1NodeRegistry } from './nodeRegistry';
import './inspectorPanel.css';

const nodePorts = {
  manual_trigger: { inputs: [], outputs: ['start'] },
  scheduler_trigger: { inputs: [], outputs: ['start'] },
  webhook_trigger: { inputs: [], outputs: ['payload'] },
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
  scheduler_trigger: 'Use cron defaults first, then tune timezone if needed.',
  webhook_trigger: 'Start with a sample payload to test downstream flow quickly.',
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
        <h2>Inspect</h2>
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
          <p>Manual Trigger has no required fields.</p>
          {renderAdvancedRetry()}
        </div>
      );
    }
    if (selectedNode.type === 'scheduler_trigger') {
      return (
        <>
          <label>Cron</label>
          <input
            type="text"
            value={config.cron || '0 * * * *'}
            onChange={(event) => setConfig({ cron: event.target.value })}
          />
          <label>Timezone</label>
          <input
            type="text"
            value={config.timezone || 'UTC'}
            onChange={(event) => setConfig({ timezone: event.target.value })}
          />
          <label className="inline-check">
            <input
              type="checkbox"
              checked={config.enabled !== false}
              onChange={(event) => setConfig({ enabled: event.target.checked })}
            />
            Enabled
          </label>
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'webhook_trigger') {
      return (
        <>
          <label>Path</label>
          <input
            type="text"
            value={config.path || '/hooks/default'}
            onChange={(event) => setConfig({ path: event.target.value })}
          />
          <label>Method</label>
          <select
            value={config.method || 'POST'}
            onChange={(event) => setConfig({ method: event.target.value })}
          >
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
          </select>
          <label>Secret (optional)</label>
          <input
            type="text"
            value={config.secret || ''}
            onChange={(event) => setConfig({ secret: event.target.value })}
          />
          <label>Sample Payload (JSON)</label>
          <textarea
            value={JSON.stringify(config.sample_payload ?? {}, null, 2)}
            onChange={(event) => {
              try {
                const parsed = JSON.parse(event.target.value || '{}');
                setConfig({ sample_payload: parsed });
              } catch (_error) {
                return;
              }
            }}
            style={{ minHeight: '120px' }}
          />
          {renderAdvancedRetry()}
        </>
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
    if (selectedNode.type === 'text') {
      return (
        <>
          <label>Template</label>
          <textarea
            value={config.template || '{{input}}'}
            onChange={(event) => setConfig({ template: event.target.value })}
            style={{ minHeight: '100px' }}
          />
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'math') {
      return (
        <>
          <label>Operation</label>
          <select
            value={config.operation || 'add'}
            onChange={(event) => setConfig({ operation: event.target.value })}
          >
            <option value="add">Add</option>
            <option value="subtract">Subtract</option>
            <option value="multiply">Multiply</option>
            <option value="divide">Divide</option>
          </select>
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'conditional') {
      return (
        <>
          <label>Operator</label>
          <select
            value={config.operator || '=='}
            onChange={(event) => setConfig({ operator: event.target.value })}
          >
            <option value="==">==</option>
            <option value="!=">!=</option>
            <option value=">">&gt;</option>
            <option value="<">&lt;</option>
            <option value=">=">&gt;=</option>
            <option value="<=">&lt;=</option>
          </select>
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'imageProcessing') {
      return (
        <>
          <label>Operation</label>
          <select
            value={config.operation || 'grayscale'}
            onChange={(event) => setConfig({ operation: event.target.value })}
          >
            <option value="grayscale">Grayscale</option>
            <option value="blur">Blur</option>
            <option value="sharpen">Sharpen</option>
          </select>
          <label>Output Path</label>
          <input
            type="text"
            value={config.outputPath || ''}
            placeholder="/tmp/output.png"
            onChange={(event) => setConfig({ outputPath: event.target.value })}
          />
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'dataAggregation') {
      return (
        <>
          <label>Aggregation</label>
          <select
            value={config.aggregationType || 'sum'}
            onChange={(event) => setConfig({ aggregationType: event.target.value })}
          >
            <option value="sum">Sum</option>
            <option value="average">Average</option>
            <option value="max">Max</option>
            <option value="min">Min</option>
            <option value="concat">Concat</option>
          </select>
          <label>Static Values (comma separated)</label>
          <input
            type="text"
            value={Array.isArray(config.values) ? config.values.join(',') : ''}
            onChange={(event) =>
              setConfig({
                values: event.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          />
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'json_extract') {
      return (
        <>
          <label>Path</label>
          <input
            type="text"
            value={config.path || ''}
            placeholder="user.profile.name"
            onChange={(event) => setConfig({ path: event.target.value })}
          />
          <label className="inline-check">
            <input
              type="checkbox"
              checked={Boolean(config.use_default)}
              onChange={(event) => setConfig({ use_default: event.target.checked })}
            />
            Use default when path is missing
          </label>
          <label>Default Value</label>
          <input
            type="text"
            value={config.default ?? ''}
            onChange={(event) => setConfig({ default: event.target.value })}
          />
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'join_merge') {
      return (
        <>
          <label>Strategy</label>
          <select
            value={config.strategy || 'object_merge'}
            onChange={(event) => setConfig({ strategy: event.target.value })}
          >
            <option value="object_merge">Object Merge</option>
            <option value="concat">Concat</option>
            <option value="zip">Zip Lists</option>
          </select>
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'schema_validate') {
      return (
        <>
          <label>Schema Type</label>
          <select
            value={config.schema_type || 'required_keys'}
            onChange={(event) => setConfig({ schema_type: event.target.value })}
          >
            <option value="required_keys">Required Keys</option>
            <option value="type_check">Type Check</option>
          </select>
          {config.schema_type === 'required_keys' ? (
            <>
              <label>Required Keys (comma separated)</label>
              <input
                type="text"
                value={Array.isArray(config.required_keys) ? config.required_keys.join(',') : ''}
                onChange={(event) =>
                  setConfig({
                    required_keys: event.target.value
                      .split(',')
                      .map((item) => item.trim())
                      .filter(Boolean),
                  })
                }
              />
            </>
          ) : (
            <>
              <label>Expected Type</label>
              <select
                value={config.expected_type || 'dict'}
                onChange={(event) => setConfig({ expected_type: event.target.value })}
              >
                <option value="dict">Object</option>
                <option value="list">List</option>
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
              </select>
            </>
          )}
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'filter') {
      return (
        <>
          <label>Field (optional)</label>
          <input
            type="text"
            value={config.field || ''}
            placeholder="score"
            onChange={(event) => setConfig({ field: event.target.value })}
          />
          <label>Operator</label>
          <select
            value={config.operator || '=='}
            onChange={(event) => setConfig({ operator: event.target.value })}
          >
            <option value="==">Equals</option>
            <option value="!=">Not equals</option>
            <option value=">">Greater than</option>
            <option value="<">Less than</option>
            <option value=">=">Greater or equal</option>
            <option value="<=">Less or equal</option>
            <option value="contains">Contains</option>
          </select>
          <label>Value</label>
          <input
            type="text"
            value={config.value ?? ''}
            onChange={(event) => setConfig({ value: event.target.value })}
          />
          {renderAdvancedRetry()}
        </>
      );
    }
    if (selectedNode.type === 'notification') {
      return (
        <>
          <label>Channel</label>
          <select
            value={config.channel || 'log'}
            onChange={(event) => setConfig({ channel: event.target.value })}
          >
            <option value="log">Log</option>
            <option value="webhook">Webhook</option>
          </select>
          {config.channel === 'webhook' ? (
            <>
              <label>Webhook URL</label>
              <input
                type="text"
                value={config.target || ''}
                onChange={(event) => setConfig({ target: event.target.value })}
              />
              <label>Timeout (seconds)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={config.timeout_seconds ?? 10}
                onChange={(event) => setConfig({ timeout_seconds: toNumber(event.target.value, 10) })}
              />
            </>
          ) : null}
          <label>Message Template</label>
          <textarea
            value={config.template || '{{input}}'}
            onChange={(event) => setConfig({ template: event.target.value })}
            style={{ minHeight: '80px' }}
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
      <h2>Inspect</h2>
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

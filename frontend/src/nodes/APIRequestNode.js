import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const APIRequestNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
  const config = data?.config || { method: 'GET', url: '', timeout_seconds: 10 };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'payload' }]}
      outputHandles={[{ id: 'response' }]}
      heading="API Request"
    >
      <label>Method</label>
      <select
        value={config.method || 'GET'}
        onChange={(event) => updateNodeConfig(id, { method: event.target.value })}
      >
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
        onChange={(event) => updateNodeConfig(id, { url: event.target.value })}
      />

      <label>Timeout (seconds)</label>
      <input
        type="number"
        min="1"
        max="60"
        value={config.timeout_seconds || 10}
        onChange={(event) => updateNodeConfig(id, { timeout_seconds: Number(event.target.value || 10) })}
      />
    </BaseNode>
  );
};

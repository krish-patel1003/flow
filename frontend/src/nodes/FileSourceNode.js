import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const FileSourceNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
  const config = data?.config || { path: '', mode: 'text' };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'trigger' }]}
      outputHandles={[{ id: 'data' }]}
      heading="File Source"
    >
      <label>Path</label>
      <input
        type="text"
        value={config.path || ''}
        onChange={(event) => updateNodeConfig(id, { path: event.target.value })}
      />
      <label>Mode</label>
      <select
        value={config.mode || 'text'}
        onChange={(event) => updateNodeConfig(id, { mode: event.target.value })}
      >
        <option value="text">Text</option>
        <option value="json">JSON</option>
      </select>
    </BaseNode>
  );
};

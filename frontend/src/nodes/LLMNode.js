import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const LLMNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
  const config = data?.config || {
    mode: 'mock',
    systemPrompt: '',
    model: 'llama3.2:1b',
    baseUrl: '',
    temperature: 0.2,
  };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'system' }, { id: 'prompt' }]}
      outputHandles={[{ id: 'response' }]}
      heading="LLM"
    >
      <label>Mode</label>
      <select value={config.mode || 'mock'} onChange={(event) => updateNodeConfig(id, { mode: event.target.value })}>
        <option value="mock">Mock</option>
        <option value="echo">Echo</option>
        <option value="ollama">Ollama</option>
      </select>

      {config.mode === 'ollama' ? (
        <>
          <label>Model</label>
          <input
            type="text"
            value={config.model || 'llama3.2:1b'}
            onChange={(event) => updateNodeConfig(id, { model: event.target.value })}
          />

          <label>Base URL</label>
          <input
            type="text"
            value={config.baseUrl || ''}
            placeholder="Optional (defaults to backend OLLAMA_BASE_URL)"
            onChange={(event) => updateNodeConfig(id, { baseUrl: event.target.value })}
          />
        </>
      ) : null}

      <label>System Prompt</label>
      <textarea
        value={config.systemPrompt || ''}
        onChange={(event) => updateNodeConfig(id, { systemPrompt: event.target.value })}
        style={{ minHeight: '70px', minWidth: '220px' }}
      />

      <label>Temperature</label>
      <input
        type="number"
        min="0"
        max="2"
        step="0.1"
        value={config.temperature ?? 0.2}
        onChange={(event) => updateNodeConfig(id, { temperature: Number(event.target.value || 0.2) })}
      />
    </BaseNode>
  );
};

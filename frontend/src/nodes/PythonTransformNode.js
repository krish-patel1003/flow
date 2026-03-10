import { BaseNode } from './BaseNode';
import { useStore } from '../store';
import { pythonTransformPresets } from '../nodeRegistry';

export const PythonTransformNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
  const config = data?.config || {
    script: "def transform(input_data):\n    return input_data",
    timeout_seconds: 5,
  };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'input' }]}
      outputHandles={[{ id: 'output' }]}
      heading="Python Transform"
    >
      <label>Preset</label>
      <select
        defaultValue=""
        onChange={(event) => {
          const preset = pythonTransformPresets.find((item) => item.id === event.target.value);
          if (preset) {
            updateNodeConfig(id, { script: preset.script });
          }
        }}
      >
        <option value="">Custom script</option>
        {pythonTransformPresets.map((preset) => (
          <option key={preset.id} value={preset.id}>
            {preset.label}
          </option>
        ))}
      </select>

      <label>Script</label>
      <textarea
        value={config.script || ''}
        onChange={(event) => updateNodeConfig(id, { script: event.target.value })}
        style={{ minHeight: '120px', minWidth: '240px' }}
      />

      <label>Timeout (seconds)</label>
      <input
        type="number"
        min="1"
        max="30"
        value={config.timeout_seconds || 5}
        onChange={(event) =>
          updateNodeConfig(id, {
            timeout_seconds: Number(event.target.value || 5),
          })
        }
      />
    </BaseNode>
  );
};

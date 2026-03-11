import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const SchemaValidateNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
  const config = data?.config || {
    schema_type: 'required_keys',
    required_keys: [],
    expected_type: 'dict',
  };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'input' }]}
      outputHandles={[{ id: 'result' }]}
      heading="Schema Validate"
    >
      <label>Schema Type</label>
      <select
        value={config.schema_type || 'required_keys'}
        onChange={(event) => updateNodeConfig(id, { schema_type: event.target.value })}
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
              updateNodeConfig(id, {
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
            onChange={(event) => updateNodeConfig(id, { expected_type: event.target.value })}
          >
            <option value="dict">Object</option>
            <option value="list">List</option>
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
        </>
      )}
    </BaseNode>
  );
};

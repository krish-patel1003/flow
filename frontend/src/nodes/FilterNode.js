import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const FilterNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
  const config = data?.config || {
    field: '',
    operator: '==',
    value: '',
  };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'input' }]}
      outputHandles={[{ id: 'pass' }, { id: 'fail' }]}
      heading="Filter"
    >
      <label>Field (optional)</label>
      <input
        type="text"
        placeholder="score"
        value={config.field || ''}
        onChange={(event) => updateNodeConfig(id, { field: event.target.value })}
      />

      <label>Operator</label>
      <select
        value={config.operator || '=='}
        onChange={(event) => updateNodeConfig(id, { operator: event.target.value })}
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
        onChange={(event) => updateNodeConfig(id, { value: event.target.value })}
      />
    </BaseNode>
  );
};

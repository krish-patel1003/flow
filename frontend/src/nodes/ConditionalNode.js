import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const ConditionalNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
  const config = data?.config || { operator: '==' };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'value1' }, { id: 'value2' }]}
      outputHandles={[{ id: 'true' }, { id: 'false' }]}
      heading="Conditional"
    >
      <label>Operator</label>
      <select
        value={config.operator || '=='}
        onChange={(event) => updateNodeConfig(id, { operator: event.target.value })}
      >
        <option value="==">==</option>
        <option value="!=">!=</option>
        <option value=">">&gt;</option>
        <option value="<">&lt;</option>
        <option value=">=">&gt;=</option>
        <option value="<=">&lt;=</option>
      </select>
    </BaseNode>
  );
};

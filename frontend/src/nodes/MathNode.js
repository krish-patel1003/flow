import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const MathNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
  const config = data?.config || { operation: 'add' };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'num1' }, { id: 'num2' }]}
      outputHandles={[{ id: 'result' }]}
      heading="Math"
    >
      <label>Operation</label>
      <select
        value={config.operation || 'add'}
        onChange={(event) => updateNodeConfig(id, { operation: event.target.value })}
      >
        <option value="add">Add</option>
        <option value="subtract">Subtract</option>
        <option value="multiply">Multiply</option>
        <option value="divide">Divide</option>
      </select>
    </BaseNode>
  );
};

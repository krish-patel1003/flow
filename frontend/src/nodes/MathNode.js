import { BaseNode } from './BaseNode';

export const MathNode = ({ id, data }) => {
  const config = data?.config || { operation: 'add' };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'num1' }, { id: 'num2' }]}
      outputHandles={[{ id: 'result' }]}
      heading="Math"
    >
      <span>{config.operation || 'add'}</span>
    </BaseNode>
  );
};

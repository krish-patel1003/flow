import { BaseNode } from './BaseNode';

export const ConditionalNode = ({ id, data }) => {
  const config = data?.config || { operator: '==' };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'value1' }, { id: 'value2' }]}
      outputHandles={[{ id: 'true' }, { id: 'false' }]}
      heading="Conditional"
    >
      <span>Operator: {config.operator || '=='}</span>
    </BaseNode>
  );
};

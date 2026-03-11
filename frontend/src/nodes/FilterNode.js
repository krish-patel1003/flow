import { BaseNode } from './BaseNode';

export const FilterNode = ({ id, data }) => {
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
      <span>{config.field ? `${config.field} ${config.operator}` : config.operator}</span>
    </BaseNode>
  );
};

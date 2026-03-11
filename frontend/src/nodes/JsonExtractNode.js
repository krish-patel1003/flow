import { BaseNode } from './BaseNode';

export const JsonExtractNode = ({ id, data }) => {
  const config = data?.config || {
    path: '',
    use_default: false,
    default: '',
  };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'input' }]}
      outputHandles={[{ id: 'value' }]}
      heading="JSON Extract"
    >
      <span>{config.path || 'root value'}</span>
    </BaseNode>
  );
};

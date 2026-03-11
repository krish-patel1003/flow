import { BaseNode } from './BaseNode';

export const TextNode = ({ id, data }) => {
  const config = data?.config || { template: '{{input}}' };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'input' }]}
      outputHandles={[{ id: 'text' }]}
      heading="Text"
    >
      <span>{(config.template || '{{input}}').slice(0, 30)}</span>
    </BaseNode>
  );
};

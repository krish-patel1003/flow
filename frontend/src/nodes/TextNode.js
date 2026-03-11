import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const TextNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
  const config = data?.config || { template: '{{input}}' };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'input' }]}
      outputHandles={[{ id: 'text' }]}
      heading="Text"
    >
      <label>Template</label>
      <textarea
        value={config.template || ''}
        onChange={(event) => updateNodeConfig(id, { template: event.target.value })}
        style={{ minHeight: '100px', minWidth: '220px' }}
      />
    </BaseNode>
  );
};

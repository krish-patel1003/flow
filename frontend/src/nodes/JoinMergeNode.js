import { BaseNode } from './BaseNode';

export const JoinMergeNode = ({ id, data }) => {
  const config = data?.config || {
    strategy: 'object_merge',
  };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'left' }, { id: 'right' }]}
      outputHandles={[{ id: 'merged' }]}
      heading="Join Merge"
    >
      <span>{config.strategy || 'object_merge'}</span>
    </BaseNode>
  );
};

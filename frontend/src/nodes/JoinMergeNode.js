import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const JoinMergeNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
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
      <label>Strategy</label>
      <select
        value={config.strategy || 'object_merge'}
        onChange={(event) => updateNodeConfig(id, { strategy: event.target.value })}
      >
        <option value="object_merge">Object Merge</option>
        <option value="concat">Concat</option>
        <option value="zip">Zip Lists</option>
      </select>
    </BaseNode>
  );
};

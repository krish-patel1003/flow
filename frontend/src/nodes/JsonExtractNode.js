import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const JsonExtractNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
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
      <label>Path</label>
      <input
        type="text"
        placeholder="user.profile.name"
        value={config.path || ''}
        onChange={(event) => updateNodeConfig(id, { path: event.target.value })}
      />

      <label>
        <input
          type="checkbox"
          checked={Boolean(config.use_default)}
          onChange={(event) => updateNodeConfig(id, { use_default: event.target.checked })}
        />{' '}
        Use default if missing
      </label>

      <label>Default Value</label>
      <input
        type="text"
        value={config.default ?? ''}
        onChange={(event) => updateNodeConfig(id, { default: event.target.value })}
      />
    </BaseNode>
  );
};

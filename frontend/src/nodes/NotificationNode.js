import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const NotificationNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
  const config = data?.config || {
    channel: 'log',
    target: '',
    template: '{{input}}',
    timeout_seconds: 10,
  };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'message' }]}
      outputHandles={[{ id: 'status' }]}
      heading="Notification"
    >
      <label>Channel</label>
      <select
        value={config.channel || 'log'}
        onChange={(event) => updateNodeConfig(id, { channel: event.target.value })}
      >
        <option value="log">Log</option>
        <option value="webhook">Webhook</option>
      </select>

      {config.channel === 'webhook' ? (
        <>
          <label>Webhook URL</label>
          <input
            type="text"
            value={config.target || ''}
            placeholder="https://example.com/hooks/notify"
            onChange={(event) => updateNodeConfig(id, { target: event.target.value })}
          />

          <label>Timeout (seconds)</label>
          <input
            type="number"
            min="1"
            max="60"
            value={config.timeout_seconds || 10}
            onChange={(event) =>
              updateNodeConfig(id, {
                timeout_seconds: Number(event.target.value || 10),
              })
            }
          />
        </>
      ) : null}

      <label>Message Template</label>
      <textarea
        value={config.template || '{{input}}'}
        onChange={(event) => updateNodeConfig(id, { template: event.target.value })}
        style={{ minHeight: '70px', minWidth: '220px' }}
      />
    </BaseNode>
  );
};

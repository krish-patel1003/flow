import { BaseNode } from './BaseNode';

export const NotificationNode = ({ id, data }) => {
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
      <span>{config.channel || 'log'}</span>
    </BaseNode>
  );
};

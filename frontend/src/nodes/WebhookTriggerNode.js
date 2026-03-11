import { BaseNode } from './BaseNode';

export const WebhookTriggerNode = ({ id, data }) => {
  const config = data?.config || {
    path: '/hooks/default',
    method: 'POST',
  };

  return (
    <BaseNode id={id} data={data} outputHandles={[{ id: 'payload' }]} heading="Webhook Trigger">
      <span>{config.method || 'POST'} {config.path || '/hooks/default'}</span>
    </BaseNode>
  );
};

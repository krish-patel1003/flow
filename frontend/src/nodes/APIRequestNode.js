import { BaseNode } from './BaseNode';

export const APIRequestNode = ({ id, data }) => {
  const config = data?.config || { method: 'GET', url: '', timeout_seconds: 10 };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'payload' }]}
      outputHandles={[{ id: 'response' }]}
      heading="API Request"
    >
      <span>{config.method || 'GET'} request</span>
    </BaseNode>
  );
};

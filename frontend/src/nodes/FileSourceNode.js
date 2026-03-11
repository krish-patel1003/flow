import { BaseNode } from './BaseNode';

export const FileSourceNode = ({ id, data }) => {
  const config = data?.config || { path: '', mode: 'text' };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'trigger' }]}
      outputHandles={[{ id: 'data' }]}
      heading="File Source"
    >
      <span>{config.mode || 'text'} source</span>
    </BaseNode>
  );
};

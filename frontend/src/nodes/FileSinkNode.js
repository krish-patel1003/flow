import { BaseNode } from './BaseNode';

export const FileSinkNode = ({ id, data }) => {
  const config = data?.config || { path: '', mode: 'text' };

  return (
    <BaseNode id={id} data={data} inputHandles={[{ id: 'input' }]} heading="File Sink">
      <span>{config.mode || 'text'} sink</span>
    </BaseNode>
  );
};

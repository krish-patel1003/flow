import { BaseNode } from './BaseNode';

export const ImageProcessingNode = ({ id, data }) => {
  const config = data?.config || { operation: 'grayscale', outputPath: '' };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'image' }]}
      outputHandles={[{ id: 'processed' }]}
      heading="Image Processing"
    >
      <span>{config.operation || 'grayscale'}</span>
    </BaseNode>
  );
};

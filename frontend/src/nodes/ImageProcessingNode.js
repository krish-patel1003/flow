import { BaseNode } from './BaseNode';
import { useStore } from '../store';

export const ImageProcessingNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
  const config = data?.config || { operation: 'grayscale', outputPath: '' };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'image' }]}
      outputHandles={[{ id: 'processed' }]}
      heading="Image Processing"
    >
      <label>Operation</label>
      <select
        value={config.operation || 'grayscale'}
        onChange={(event) => updateNodeConfig(id, { operation: event.target.value })}
      >
        <option value="grayscale">Grayscale</option>
        <option value="blur">Blur</option>
        <option value="sharpen">Sharpen</option>
      </select>

      <label>Output Path</label>
      <input
        type="text"
        value={config.outputPath || ''}
        onChange={(event) => updateNodeConfig(id, { outputPath: event.target.value })}
        placeholder="/tmp/output.png"
      />
    </BaseNode>
  );
};

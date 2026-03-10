import React, { useState } from 'react';
import { BaseNode } from './BaseNode';

export const ImageProcessingNode = ({ id, data }) => {
  const [filter, setFilter] = useState(data.filter || 'grayscale');

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'image' }]}
      outputHandles={[{ id: 'processed' }]}
      heading="Image Processing"
    >
      <select value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="grayscale">Grayscale</option>
        <option value="blur">Blur</option>
        <option value="sharpen">Sharpen</option>
      </select>
    </BaseNode>
  );
};

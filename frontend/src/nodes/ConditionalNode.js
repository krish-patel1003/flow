import React, { useState } from 'react';
import { BaseNode } from './BaseNode';


export const ConditionalNode = ({ id, data }) => {
  const [condition, setCondition] = useState(data.condition || '==');

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'value1' }, { id: 'value2' }]}
      outputHandles={[{ id: 'true' }, { id: 'false' }]}
      heading="Conditional"
    >
      <select value={condition} onChange={(e) => setCondition(e.target.value)}>
        <option value="==">==(Equal)</option>
        <option value="!==">!==(Not Equal)</option>
        <option value=">">&gt;(Greater Than)</option>
        <option value="<">&lt;(Less Than)</option>
      </select>
    </BaseNode>
  );
};

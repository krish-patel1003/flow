// outputNode.js

import { useState } from 'react';

import { BaseNode } from './BaseNode';
export const OutputNode = ({ id, data }) => {
  const [currName, setCurrName] = useState(data?.outputName || id.replace('customOutput-', 'output_'));
  const [outputType, setOutputType] = useState(data.outputType || 'Text');
  
  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: `${id}-value` }]}
      heading="Output"
    >
      
        <label>
          Name
        </label>
          <input 
            type="text" 
            value={currName} 
            onChange={(e) => setCurrName(e.target.value)} 
          />
        <label>
          Type
        </label>
          <select value={outputType} onChange={(e) => setOutputType(e.target.value)}>
            <option value="Text">Text</option>
            <option value="File">Image</option>
          </select>
     
    </BaseNode>
  );
};

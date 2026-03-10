import React, { useState } from 'react';
import { BaseNode } from './BaseNode';

export const InputNode = ({ id, data }) => {
  const [currName, setCurrName] = useState(data?.inputName || id.replace('customInput-', 'input_'));
  const [inputType, setInputType] = useState(data.inputType || 'Text');

  return (
    <BaseNode
      id={id}
      data={data}
      outputHandles={[{ id: 'value' }]}
      heading="Input"
    >
      
        <label>
          Name
        
        </label>
        <input 
            type="text" 
            value={currName} 
            onChange={(e) => setCurrName(e.target.value)} 
          ></input>
        <label>
          Type
      
        </label>
        <select value={inputType} onChange={(e) => setInputType(e.target.value)}>
            <option value="Text">Text</option>
            <option value="Number">Number</option>
            <option value="File">File</option>
          </select>
     
    </BaseNode>
  );
};
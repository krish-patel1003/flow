import React, { useState } from 'react';
import { BaseNode } from './BaseNode';

// 1. Math Operation Node
export const MathNode = ({ id, data }) => {
  const [operation, setOperation] = useState(data.operation || 'add');

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'num1' }, { id: 'num2' }]}
      outputHandles={[{ id: 'result' }]}
      heading="Math Operation"
    >
      <select value={operation} onChange={(e) => setOperation(e.target.value)}>
        <option value="add">Add</option>
        <option value="subtract">Subtract</option>
        <option value="multiply">Multiply</option>
        <option value="divide">Divide</option>
      </select>
    </BaseNode>
  );
};
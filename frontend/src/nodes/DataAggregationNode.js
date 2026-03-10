import React, { useState } from 'react';
import { BaseNode } from './BaseNode';

export const DataAggregationNode = ({ id, data }) => {
  const [aggregationType, setAggregationType] = useState(data.aggregationType || 'sum');

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'data1' }, { id: 'data2' }, { id: 'data3' }]}
      outputHandles={[{ id: 'aggregated' }]}
      heading="Data Aggregation"
    >
      <select value={aggregationType} onChange={(e) => setAggregationType(e.target.value)}>
        <option value="sum">Sum</option>
        <option value="average">Average</option>
        <option value="max">Max</option>
        <option value="min">Min</option>
      </select>
    </BaseNode>
  );
};


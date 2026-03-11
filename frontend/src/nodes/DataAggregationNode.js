import { BaseNode } from './BaseNode';

export const DataAggregationNode = ({ id, data }) => {
  const config = data?.config || { aggregationType: 'sum', values: [] };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'data1' }, { id: 'data2' }, { id: 'data3' }]}
      outputHandles={[{ id: 'aggregated' }]}
      heading="Data Aggregation"
    >
      <span>{config.aggregationType || 'sum'}</span>
    </BaseNode>
  );
};

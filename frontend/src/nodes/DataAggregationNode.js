import { BaseNode } from './BaseNode';
import { useStore } from '../store';

const parseValues = (raw) => raw.split(',').map((value) => value.trim()).filter(Boolean);

export const DataAggregationNode = ({ id, data }) => {
  const updateNodeConfig = useStore((state) => state.updateNodeConfig);
  const config = data?.config || { aggregationType: 'sum', values: [] };
  const rawValues = Array.isArray(config.values) ? config.values.join(', ') : '';

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'data1' }, { id: 'data2' }, { id: 'data3' }]}
      outputHandles={[{ id: 'aggregated' }]}
      heading="Data Aggregation"
    >
      <label>Aggregation</label>
      <select
        value={config.aggregationType || 'sum'}
        onChange={(event) => updateNodeConfig(id, { aggregationType: event.target.value })}
      >
        <option value="sum">Sum</option>
        <option value="average">Average</option>
        <option value="max">Max</option>
        <option value="min">Min</option>
        <option value="concat">Concat</option>
      </select>

      <label>Static Values (comma separated)</label>
      <input
        type="text"
        value={rawValues}
        onChange={(event) => updateNodeConfig(id, { values: parseValues(event.target.value) })}
        placeholder="1,2,3"
      />
    </BaseNode>
  );
};

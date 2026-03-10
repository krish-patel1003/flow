import { BaseNode } from './BaseNode';

export const ManualTriggerNode = ({ id, data }) => {
  return (
    <BaseNode id={id} data={data} outputHandles={[{ id: 'start' }]} heading="Manual Trigger">
      <span>Starts the pipeline</span>
    </BaseNode>
  );
};

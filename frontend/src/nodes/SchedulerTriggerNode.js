import { BaseNode } from './BaseNode';

export const SchedulerTriggerNode = ({ id, data }) => {
  const config = data?.config || {
    cron: '0 * * * *',
    timezone: 'UTC',
    enabled: true,
  };

  return (
    <BaseNode id={id} data={data} outputHandles={[{ id: 'start' }]} heading="Scheduler Trigger">
      <span>{config.enabled ? config.cron || 'cron' : 'disabled'}</span>
    </BaseNode>
  );
};

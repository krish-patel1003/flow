import { demoPipelines } from './demoPipelines';
import { serializePipeline } from './pipelineSerializer';
import { v1NodeRegistry } from './nodeRegistry';

const PORTS = {
  manual_trigger: { inputs: [], outputs: ['start'] },
  scheduler_trigger: { inputs: [], outputs: ['start'] },
  webhook_trigger: { inputs: [], outputs: ['payload'] },
  file_source: { inputs: ['trigger'], outputs: ['data'] },
  python_transform: { inputs: ['input'], outputs: ['output'] },
  file_sink: { inputs: ['input'], outputs: [] },
  text: { inputs: ['input'], outputs: ['text'] },
  math: { inputs: ['num1', 'num2'], outputs: ['result'] },
  conditional: { inputs: ['value1', 'value2'], outputs: ['true', 'false'] },
  api: { inputs: ['payload'], outputs: ['response'] },
  llm: { inputs: ['system', 'prompt'], outputs: ['response'] },
  imageProcessing: { inputs: ['image'], outputs: ['processed'] },
  dataAggregation: { inputs: ['data1', 'data2', 'data3'], outputs: ['aggregated'] },
  json_extract: { inputs: ['input'], outputs: ['value'] },
  join_merge: { inputs: ['left', 'right'], outputs: ['merged'] },
  schema_validate: { inputs: ['input'], outputs: ['result'] },
  filter: { inputs: ['input'], outputs: ['pass', 'fail'] },
  notification: { inputs: ['message'], outputs: ['status'] },
};

const parsePort = (handle, fallback) => {
  if (!handle) {
    return fallback;
  }
  const parts = String(handle).split('-');
  return parts[parts.length - 1];
};

describe('starter workflow templates', () => {
  it('includes all expected starter workflows', () => {
    const ids = demoPipelines.map((item) => item.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        'uppercase-file',
        'api-json-save',
        'parallel-branch',
        'aggregate-llm',
        'etl-public-csv',
        'etl-chunked-csv-large',
        'etl-incremental-watermark',
        'etl-api-chained-cars',
        'scheduled-ops-heartbeat',
        'webhook-lead-qualification',
        'webhook-order-validation',
        'support-ticket-triage',
        'finance-invoice-validation',
      ])
    );
    expect(ids.length).toBe(13);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps every workflow structurally valid and serializable', () => {
    const triggerTypes = new Set(['manual_trigger', 'scheduler_trigger', 'webhook_trigger']);

    demoPipelines.forEach((pipeline) => {
      expect(pipeline.nodes.length).toBeGreaterThan(1);
      expect(pipeline.edges.length).toBeGreaterThan(0);

      const nodeIds = pipeline.nodes.map((node) => node.id);
      expect(new Set(nodeIds).size).toBe(nodeIds.length);

      const hasTrigger = pipeline.nodes.some((node) => triggerTypes.has(node.type));
      expect(hasTrigger).toBe(true);

      pipeline.nodes.forEach((node) => {
        expect(v1NodeRegistry[node.type]).toBeDefined();
        expect(node.data).toBeDefined();
        expect(node.data.config).toBeDefined();
      });

      const byId = Object.fromEntries(pipeline.nodes.map((node) => [node.id, node]));
      pipeline.edges.forEach((edge) => {
        expect(byId[edge.source]).toBeDefined();
        expect(byId[edge.target]).toBeDefined();

        const srcNode = byId[edge.source];
        const tgtNode = byId[edge.target];
        const srcPort = parsePort(edge.sourceHandle, 'output');
        const tgtPort = parsePort(edge.targetHandle, 'input');

        expect(PORTS[srcNode.type].outputs).toContain(srcPort);
        expect(PORTS[tgtNode.type].inputs).toContain(tgtPort);
      });

      const serialized = serializePipeline({
        id: pipeline.id,
        name: pipeline.label,
        nodes: pipeline.nodes,
        edges: pipeline.edges,
      });
      expect(serialized.version).toBe('v1');
      expect(serialized.nodes.length).toBe(pipeline.nodes.length);
      expect(serialized.edges.length).toBe(pipeline.edges.length);
    });
  });
});

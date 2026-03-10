import { serializePipeline } from './pipelineSerializer';

describe('serializePipeline', () => {
  it('serializes react flow graph into normalized v1 schema', () => {
    const nodes = [
      {
        id: 'manual_trigger-1',
        type: 'manual_trigger',
        position: { x: 0, y: 0 },
        data: { config: {} },
      },
      {
        id: 'file_source-1',
        type: 'file_source',
        position: { x: 10, y: 10 },
        data: { config: { path: 'in.txt', mode: 'text' } },
      },
    ];

    const edges = [
      {
        id: 'edge-1',
        source: 'manual_trigger-1',
        sourceHandle: 'manual_trigger-1-start',
        target: 'file_source-1',
        targetHandle: 'file_source-1-trigger',
      },
    ];

    const payload = serializePipeline({
      id: 'pipe-demo',
      name: 'Demo',
      nodes,
      edges,
    });

    expect(payload).toEqual({
      id: 'pipe-demo',
      name: 'Demo',
      version: 'v1',
      nodes: [
        {
          id: 'manual_trigger-1',
          type: 'manual_trigger',
          position: { x: 0, y: 0 },
          config: {},
        },
        {
          id: 'file_source-1',
          type: 'file_source',
          position: { x: 10, y: 10 },
          config: { path: 'in.txt', mode: 'text' },
        },
      ],
      edges: [
        {
          id: 'edge-1',
          source: { node_id: 'manual_trigger-1', port: 'start' },
          target: { node_id: 'file_source-1', port: 'trigger' },
        },
      ],
    });
  });
});

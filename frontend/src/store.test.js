import { useStore } from './store';

describe('pipeline store node config persistence', () => {
  beforeEach(() => {
    useStore.setState({
      nodes: [
        {
          id: 'python_transform-1',
          type: 'python_transform',
          position: { x: 0, y: 0 },
          data: { config: { script: '', timeout_seconds: 5 } },
        },
      ],
      edges: [],
      selectedEdge: null,
      nodeIDs: {},
    });
  });

  it('updates nested config fields through store action', () => {
    useStore.getState().updateNodeConfig('python_transform-1', {
      script: 'def transform(input_data):\n    return input_data',
      timeout_seconds: 3,
    });

    const node = useStore.getState().nodes[0];
    expect(node.data.config).toEqual({
      script: 'def transform(input_data):\n    return input_data',
      timeout_seconds: 3,
    });
  });
});

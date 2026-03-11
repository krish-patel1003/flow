import { BaseNode } from './BaseNode';

export const PythonTransformNode = ({ id, data }) => {
  const config = data?.config || {
    script: "def transform(input_data):\n    return input_data",
    timeout_seconds: 5,
  };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'input' }]}
      outputHandles={[{ id: 'output' }]}
      heading="Python Transform"
    >
      <span>Timeout: {config.timeout_seconds || 5}s</span>
    </BaseNode>
  );
};

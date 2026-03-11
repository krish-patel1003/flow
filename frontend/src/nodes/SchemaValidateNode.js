import { BaseNode } from './BaseNode';

export const SchemaValidateNode = ({ id, data }) => {
  const config = data?.config || {
    schema_type: 'required_keys',
    required_keys: [],
    expected_type: 'dict',
  };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'input' }]}
      outputHandles={[{ id: 'result' }]}
      heading="Schema Validate"
    >
      <span>{config.schema_type || 'required_keys'}</span>
    </BaseNode>
  );
};

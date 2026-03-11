import { BaseNode } from './BaseNode';

export const LLMNode = ({ id, data }) => {
  const config = data?.config || {
    mode: 'mock',
    systemPrompt: '',
    model: 'llama3.2:1b',
    baseUrl: '',
    temperature: 0.2,
  };

  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[{ id: 'system' }, { id: 'prompt' }]}
      outputHandles={[{ id: 'response' }]}
      heading="LLM"
    >
      <span>Mode: {config.mode || 'mock'}</span>
    </BaseNode>
  );
};

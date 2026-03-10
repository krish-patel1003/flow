// llmNode.js


import { BaseNode } from './BaseNode';
export const LLMNode = ({ id, data }) => {
  return (
    <BaseNode
      id={id}
      data={data}
      inputHandles={[
        { id: `${id}-system`, style: { top: '33%' } },
        { id: `${id}-prompt`, style: { top: '66%' } }
      ]}
      outputHandles={[{ id: `${id}-response` }]}
      heading="LLM"
    >
      
        <span>This is a LLM.</span>
      
    </BaseNode>
  );
};

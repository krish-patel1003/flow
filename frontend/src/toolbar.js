// toolbar.js
import "./toolbar.css"
import { DraggableNode } from "./draggableNode";
import { SubmitPipelineButton } from "./submit";
import Input from "./assets/Input.svg";
import Output from "./assets/Output.svg";
import Math from "./assets/Maths.svg";
import LLM from "./assets/LLM.svg";
import DataAggregation from "./assets/Aggregate.svg";
import ImageProcessing from "./assets/Image_processing.svg";
import Conditional from "./assets/Conditional.svg";
import API from "./assets/Integration.svg";
import Text from "./assets/Text_format.svg";
import { comingSoonNodes } from './nodeRegistry';

export const PipelineToolbar = () => {
  const comingSoonIconMap = {
    customInput: Input,
    llm: LLM,
    customOutput: Output,
    text: Text,
    math: Math,
    imageProcessing: ImageProcessing,
    dataAggregation: DataAggregation,
    conditional: Conditional,
    api: API,
  };

  return (
    <div className="toolbar">
      <DraggableNode type="manual_trigger" label="Manual Trigger" img={Input} />
      <DraggableNode type="file_source" label="File Source" img={Text} />
      <DraggableNode type="python_transform" label="Python Transform" img={API} />
      <DraggableNode type="file_sink" label="File Sink" img={Output} />
      {comingSoonNodes.map((node) => (
        <DraggableNode
          key={node.type}
          type={node.type}
          label={node.label}
          img={comingSoonIconMap[node.type] || Input}
          disabled
        />
      ))}
      <SubmitPipelineButton />
    </div>
  );
};

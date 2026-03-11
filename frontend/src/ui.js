import {  useRef, useCallback,useMemo } from 'react';
import  {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import { useStore } from './store';
import { shallow } from 'zustand/shallow';
import '@xyflow/react/dist/style.css';
import { ManualTriggerNode } from './nodes/ManualTriggerNode';
import { FileSourceNode } from './nodes/FileSourceNode';
import { PythonTransformNode } from './nodes/PythonTransformNode';
import { FileSinkNode } from './nodes/FileSinkNode';
import { TextNode } from './nodes/TextNode';
import { MathNode } from './nodes/MathNode';
import { ConditionalNode } from './nodes/ConditionalNode';
import { APIRequestNode } from './nodes/APIRequestNode';
import { LLMNode } from './nodes/LLMNode';
import { ImageProcessingNode } from './nodes/ImageProcessingNode';
import { DataAggregationNode } from './nodes/DataAggregationNode';
import { JsonExtractNode } from './nodes/JsonExtractNode';
import { JoinMergeNode } from './nodes/JoinMergeNode';
import { SchemaValidateNode } from './nodes/SchemaValidateNode';
import { FilterNode } from './nodes/FilterNode';
import { NotificationNode } from './nodes/NotificationNode';
import { v1NodeRegistry } from './nodeRegistry';

import ButtonEdge from './components/ButtonEdge';
const gridSize = 20;
const proOptions = { hideAttribution: true };

//Types of Node
const nodeTypes = {
  manual_trigger: ManualTriggerNode,
  file_source: FileSourceNode,
  python_transform: PythonTransformNode,
  file_sink: FileSinkNode,
  text: TextNode,
  math: MathNode,
  conditional: ConditionalNode,
  api: APIRequestNode,
  llm: LLMNode,
  imageProcessing: ImageProcessingNode,
  dataAggregation: DataAggregationNode,
  json_extract: JsonExtractNode,
  join_merge: JoinMergeNode,
  schema_validate: SchemaValidateNode,
  filter: FilterNode,
  notification: NotificationNode,
};

//getting state of the application
const selector = (state) => ({
  nodes: state.nodes,
  edges: state.edges,
  getNodeID: state.getNodeID,
  addNode: state.addNode,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onConnect: state.onConnect,
  selectedEdge: state.selectedEdge,
  setSelectedEdge: state.setSelectedEdge,
  deleteEdge: state.deleteEdge,
  setSelectedNodeId: state.setSelectedNodeId,
});

const PipelineUIContent = () => {

 
  const reactFlowWrapper = useRef(null);
  const {
    screenToFlowPosition,
    viewportInitialized
  } = useReactFlow();
  const { 
    nodes, 
    edges, 
    getNodeID, 
    addNode, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    selectedEdge,
    setSelectedEdge,
    deleteEdge,
    setSelectedNodeId,
  } = useStore(selector, shallow);

  const getInitNodeData = (nodeID, type) => {
    return {
      id: nodeID,
      nodeType: `${type}`,
      edgeType: 'buttonedge',
      config: { ...(v1NodeRegistry[type]?.defaults || {}) },
    };
  }

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!viewportInitialized) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      if (event?.dataTransfer?.getData('application/reactflow')) {
        const appData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
        const type = appData?.nodeType;
        if (typeof type === 'undefined' || !type) {
          return;
        }
        if (!v1NodeRegistry[type]) {
          return;
        }
        const position = screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });
        const nodeID = getNodeID(type);
        const newNode = {
          id: nodeID,
          type,
          position,
          data: getInitNodeData(nodeID, type),
        };
        addNode(newNode);
      }
    },
    [viewportInitialized, screenToFlowPosition, getNodeID, addNode]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  //For direct edge deletion
   const onEdgeClick = useCallback((event, edge) => {
    event.stopPropagation();
    if (selectedEdge === edge.id) {
      deleteEdge(edge.id);
    } else {
      setSelectedEdge(edge.id);
    }
  }, [selectedEdge, setSelectedEdge, deleteEdge]);

  //For edge deletion through delete button
  const onDeleteButtonEdgeClick= useCallback((event, edgeId) => {
    event.stopPropagation(); // Ensure click does not propagate to other elements
    if (selectedEdge === edgeId) {
      deleteEdge(edgeId);
    } else {
      setSelectedEdge(edgeId);
    }
     
  }, [selectedEdge, setSelectedEdge, deleteEdge]);
  
  //If click on panel reset selection
  const onPaneClick = useCallback(() => {
    setSelectedEdge(null);
    setSelectedNodeId(null);
  }, [setSelectedEdge, setSelectedNodeId]);

  const onNodeClick = useCallback((event, node) => {
    event.stopPropagation();
    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);


  //Types of edges(Here there is only one type)
  const edgeTypes = useMemo(() => ({
    buttonedge: (props) => (
      <ButtonEdge
        {...props}
        onEdgeClick={onDeleteButtonEdgeClick}  
        style={{
          stroke: props.id === selectedEdge ? 'red' : '#6563e4',
        }}
      />
    ),
  }), [onDeleteButtonEdgeClick, selectedEdge]);
  

  return (
    <div ref={reactFlowWrapper} style={{width: '100%', height: '100%'}}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onEdgeClick={onEdgeClick}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={proOptions}
        snapToGrid
        snapGrid={[gridSize, gridSize]}
        fitView
      >
        <Background color="#aaa" gap={gridSize} />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}

export const PipelineUI = () => (
  <ReactFlowProvider>
    <PipelineUIContent />
  </ReactFlowProvider>
);

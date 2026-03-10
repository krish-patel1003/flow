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
    deleteEdge
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
  }, [setSelectedEdge]);


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
    <div ref={reactFlowWrapper} style={{width: '100vw', height: '100vh'}}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onEdgeClick={onEdgeClick}
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
        <MiniMap />
      </ReactFlow>
    </div>
  );
}

export const PipelineUI = () => (
  <ReactFlowProvider>
    <PipelineUIContent />
  </ReactFlowProvider>
);

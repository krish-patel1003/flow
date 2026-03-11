import React, { useState, useEffect, useCallback, useRef } from 'react';
import {  Position, useReactFlow } from '@xyflow/react';
import './baseNode.css';
import { useStore } from '.././store';
import { shallow } from 'zustand/shallow';

import CustomHandle from './../components/CustomHandle';
const nodeSet = new Set();
export const BaseNode = ({ 
  id, 
  data, 
  children, 
  heading,
  inputHandles = [], 
  outputHandles = [], 
}) => {
  
  const selector = (state) => ({
    edges: state.edges,
    setSelectedNodeId: state.setSelectedNodeId,
  });
  const { 
    edges, 
    setSelectedNodeId,
  } = useStore(selector, shallow);
  const { getEdges, setNodes, setEdges } = useReactFlow();
  const [isConfirming, setIsConfirming] = useState(false);
  const [, forceUpdate] = useState(false);
  const nodeRef = useRef(null);
  const deleteButtonRef = useRef(null);

  // Update nodeSet based on edges and force a re-render
  useEffect(() => {

    nodeSet.clear(); // Clear previous state
    edges.forEach((edge) => {
      nodeSet.add(edge.sourceHandle);
      nodeSet.add(edge.targetHandle);
    });

    // Force a re-render by toggling updateFlag
    forceUpdate((flag) => !flag);
  }, [getEdges, edges]);

  // Handle click on the node
  const handleNodeClick = useCallback((event) => {
    event.stopPropagation(); // Prevent click from propagating to the document
    setSelectedNodeId(id);
    if (deleteButtonRef.current.contains(event.target)) {
      if (isConfirming) {
        // Perform deletion
        setNodes((nds) => nds.filter((node) => node.id !== id));
        setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
        setSelectedNodeId(null);
        setIsConfirming(false); // Reset confirmation state
      } else {
        setIsConfirming(true); // Set confirmation state
      }
    } else {
      setIsConfirming(false);
    }
  }, [isConfirming, id, setEdges, setNodes, setSelectedNodeId]);

  // Handle click outside the delete button or node
  const handleClickOutside = useCallback((event) => {
    if (
      nodeRef.current &&
      !nodeRef.current.contains(event.target) &&
      !deleteButtonRef.current.contains(event.target)
    ) {
      // Clicked outside of the node and delete button
      setIsConfirming(false); // Reset confirmation state
    }
  }, []);

  // Effect to add and clean up the event listener for document clicks
  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClickOutside]);

  // Handle delete button click
  const handleDeleteButtonClick = (event) => {
    event.stopPropagation(); // Prevent click from propagating to the node's click handler
    if (isConfirming) {
      // Perform deletion
      setNodes((nds) => nds.filter((node) => node.id !== id));
      setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
      setSelectedNodeId(null);
      setIsConfirming(false); // Reset confirmation state
    } else {
      setIsConfirming(true); // Set confirmation state
    }
  };


  return (
    <div className='base-node' onClick={handleNodeClick} ref={nodeRef} >
    {inputHandles.map((handle, index) => (
      <CustomHandle
        key={`input-${index}`}
        type="target"
        position={Position.Left}
        id={`${id}-${handle.id}`}
        style={{ top: `${(index + 1) * 100 / (inputHandles.length + 1)}%` }}
        isConnected={nodeSet.has(`${id}-${handle.id}`)}
      />
    ))}
    <span className='node-heading'>
      {heading}
      <button
        className='delete-button'
        ref={deleteButtonRef}
        onClick={handleDeleteButtonClick}
        style={{
          backgroundColor: isConfirming ? 'red' : 'white',
          color: isConfirming ? 'white' : 'black',
        }}
      >
        &times;
      </button>
    </span>
    <div className='children-container'>
      {children}
    </div>
    {outputHandles.map((handle, index) => (
      <CustomHandle
        key={`output-${index}`}
        type="source"
        position={Position.Right}
        id={`${id}-${handle.id}`}
        style={{ top: `${(index + 1) * 100 / (outputHandles.length + 1)}%` }}
        isConnected={nodeSet.has(`${id}-${handle.id}`)}
      />
    ))}
  </div>
  );
};

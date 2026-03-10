import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUpdateNodeInternals } from '@xyflow/react';
import { BaseNode } from './BaseNode';

// Define minimum and maximum sizes for the textarea
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const MIN_HEIGHT = 80;
const MAX_HEIGHT = 500;

export const TextNode = ({ id, data }) => {
  const [text, setText] = useState(data?.text || '{{input}}');  // Text input state
  const [variables, setVariables] = useState([]);  // Variables from double curly braces
  const [dimensions, setDimensions] = useState({ width: MIN_WIDTH, height: MIN_HEIGHT });  // Textarea size state
  const updateNodeInternals = useUpdateNodeInternals();
  const textareaRef = useRef(null);  // Reference to the textarea
  const measurerRef = useRef(null);  // Reference to the hidden measurer span

  useEffect(() => {
    if(text.trim() === '') {
      setDimensions({ width: MIN_WIDTH, height: MIN_HEIGHT });
  
      // Explicitly reset the textarea's style to original dimensions
      if (textareaRef.current) {
        textareaRef.current.style.width = `${MIN_WIDTH}px`;
        textareaRef.current.style.height = `${MIN_HEIGHT}px`;
      }
    }
  }, [text]);
  
  // Set up the hidden measurer element
  useEffect(() => {
    if (!measurerRef.current) {
      const measurer = document.createElement('span');  // Create a hidden <span> for measuring
      measurer.style.display = 'inline-block';
      measurer.style.visibility = 'hidden';
      measurer.style.whiteSpace = 'pre-wrap';  // This keeps text wrapping behavior like in the textarea
      document.body.appendChild(measurer);  // Add the measurer to the document body
      measurerRef.current = measurer;  // Save the reference
    }
  }, []);

  // Function to set up the measurer with the same styles as the textarea
  const initMeasurer = (textarea) => {
    const measurer = measurerRef.current;
    const computedStyle = window.getComputedStyle(textarea);  // Get the computed styles of the textarea

    measurer.textContent = textarea.value;  // Copy the text from the textarea
    measurer.style.maxWidth = computedStyle.maxWidth;  
    measurer.style.font = computedStyle.font; 
    measurer.style.padding = computedStyle.padding;  
  };

  // Function to update the textarea's size based on the measurer
  const updateTextAreaSize = (textarea) => {
    const measurer = measurerRef.current;
    
    // Set the textarea's width and height based on the hidden measurer
    textarea.style.height = `${measurer.offsetHeight}px`;  // Adjust height
    textarea.style.width = `${measurer.offsetWidth + 2}px`;  // Adjust width
  };

  // Function to handle text input and variable extraction
  const updateDimensionsAndVariables = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      
      // Handle resizing
      if (textarea.value.trim() === '') {
        setDimensions({ width: MIN_WIDTH, height: MIN_HEIGHT });
      } else {
        initMeasurer(textarea);  // Set up the measurer
        updateTextAreaSize(textarea);  // Update the size dynamically
      }

      // Extract variables within {{ }} and update handles
      const variableRegex = /{{(\w+)}}/g;
      const matches = [...text.matchAll(variableRegex)];
      const newVariables = matches.map((match) => match[1]);
    
      setVariables(newVariables);

      updateNodeInternals(id);  // Keep the node updated
    }
  }, [text, id, updateNodeInternals]);

  useEffect(() => {
    updateDimensionsAndVariables();
  }, [updateDimensionsAndVariables]);

  const handleTextChange = (e) => {
    setText(e.target.value);  // Update text input
    data.text = e.target.value;
  };
  // Map the variables to create input handles on the left side
  const inputHandles = variables.map((variable) => ({
    id: variable,
  }));
  

  return (
    <BaseNode
      id={id}
      data={data}
      width={dimensions.width}
      height={dimensions.height}
      inputHandles={inputHandles}  // Show handles for variables
      outputHandles={[{ id: 'output' }]}  // Add output handle
      heading="Text"
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}  // Update text input on change
        onInput={updateDimensionsAndVariables}  // Update size and variables on input
        style={{
          minWidth: `${MIN_WIDTH}px`,
          width: `${dimensions.width}px`,
          maxWidth: `${MAX_WIDTH}px`,
          resize: 'none',  // Prevent resizing by the user
          fontSize: '18px',
          overflowX: 'hidden',  // Hide horizontal scroll
          overflowY: 'auto',  // Show vertical scroll when needed
          minHeight: `${MIN_HEIGHT}px`,
          height: `${dimensions.height}px`,
          padding: '2px',
          maxHeight: `${MAX_HEIGHT}px`,
          
        }}
      />
    </BaseNode>
  );
};

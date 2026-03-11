import { useMemo } from 'react';
import './toolbar.css';
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
import { comingSoonNodes, v1NodeRegistry } from './nodeRegistry';
import { DemoLoader } from './demoLoader';
import { useStore } from './store';

export const PipelineToolbar = () => {
  const {
    getNodeID,
    addNode,
    librarySearch,
    activeLibraryCategory,
    setLibrarySearch,
    setActiveLibraryCategory,
  } = useStore((state) => ({
    getNodeID: state.getNodeID,
    addNode: state.addNode,
    librarySearch: state.librarySearch,
    activeLibraryCategory: state.activeLibraryCategory,
    setLibrarySearch: state.setLibrarySearch,
    setActiveLibraryCategory: state.setActiveLibraryCategory,
  }));

  const iconMap = {
    manual_trigger: Input,
    file_source: Text,
    python_transform: API,
    file_sink: Output,
    text: Text,
    math: Math,
    conditional: Conditional,
    api: API,
    llm: LLM,
    imageProcessing: ImageProcessing,
    dataAggregation: DataAggregation,
    customInput: Input,
    customOutput: Output,
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'triggers', label: 'Triggers' },
    { id: 'sources', label: 'Sources' },
    { id: 'transform', label: 'Transform' },
    { id: 'routing', label: 'Routing' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'ai', label: 'AI' },
    { id: 'sinks', label: 'Sinks' },
  ];

  const nodeItems = useMemo(() => {
    const query = librarySearch.trim().toLowerCase();
    const executableNodes = Object.entries(v1NodeRegistry).map(([type, spec]) => ({
      type,
      label: spec.label,
      category: spec.category || 'transform',
      description: spec.description || '',
      tags: spec.tags || [],
      disabled: false,
    }));
    const futureNodes = comingSoonNodes.map((item) => ({
      ...item,
      tags: item.tags || [],
      disabled: true,
    }));

    return [...executableNodes, ...futureNodes]
      .filter((item) => activeLibraryCategory === 'all' || item.category === activeLibraryCategory)
      .filter((item) => {
        if (!query) {
          return true;
        }
        const indexText = `${item.label} ${item.type} ${item.description} ${(item.tags || []).join(' ')}`.toLowerCase();
        return indexText.includes(query);
      })
      .sort((a, b) => Number(a.disabled) - Number(b.disabled) || a.label.localeCompare(b.label));
  }, [activeLibraryCategory, librarySearch]);

  const addNodeToCanvas = (type) => {
    if (!v1NodeRegistry[type]) {
      return;
    }
    const nodeID = getNodeID(type);
    const newNode = {
      id: nodeID,
      type,
      position: {
        x: 200 + Math.floor(Math.random() * 160),
        y: 120 + Math.floor(Math.random() * 180),
      },
      data: {
        id: nodeID,
        nodeType: type,
        edgeType: 'buttonedge',
        config: { ...(v1NodeRegistry[type]?.defaults || {}) },
      },
    };
    addNode(newNode);
  };

  return (
    <aside className="toolbar">
      <div className="toolbar-head">
        <h2>Components</h2>
        <p>Drag to canvas or click to add</p>
      </div>

      <div className="toolbar-controls">
        <DemoLoader />
        <SubmitPipelineButton />
      </div>

      <input
        type="search"
        value={librarySearch}
        onChange={(event) => setLibrarySearch(event.target.value)}
        placeholder="Search nodes"
        aria-label="Search components"
      />

      <div className="category-row">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={activeLibraryCategory === category.id ? 'active' : ''}
            onClick={() => setActiveLibraryCategory(category.id)}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="component-list">
        {nodeItems.map((node) => (
          <div key={node.type} className="component-item">
            <button
              type="button"
              className="add-node-button"
              onClick={() => addNodeToCanvas(node.type)}
              disabled={node.disabled}
            >
              + Add
            </button>
            <DraggableNode
              type={node.type}
              label={node.label}
              img={iconMap[node.type] || Input}
              disabled={node.disabled}
            />
            <small>{node.description}</small>
          </div>
        ))}
      </div>
    </aside>
  );
};

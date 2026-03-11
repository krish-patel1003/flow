import { demoPipelines } from './demoPipelines';
import { useStore } from './store';

export const DemoLoader = () => {
  const loadGraph = useStore((state) => state.loadGraph);

  const handleLoad = (event) => {
    const templateId = event.target.value;
    if (!templateId) {
      return;
    }
    const template = demoPipelines.find((pipeline) => pipeline.id === templateId);
    if (!template) {
      return;
    }
    loadGraph(template.nodes, template.edges);
  };

  return (
    <select onChange={handleLoad} defaultValue="">
      <option value="">Load Demo Pipeline</option>
      {demoPipelines.map((demo) => (
        <option key={demo.id} value={demo.id}>
          {demo.label}
        </option>
      ))}
    </select>
  );
};

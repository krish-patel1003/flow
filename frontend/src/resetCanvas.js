import { useStore } from './store';

export const ResetCanvasButton = () => {
  const resetGraph = useStore((state) => state.resetGraph);

  const onReset = () => {
    const accepted = window.confirm('Clear all nodes and edges from canvas?');
    if (!accepted) {
      return;
    }
    resetGraph();
  };

  return (
    <button type="button" className="submit-button" onClick={onReset}>
      Reset Canvas
    </button>
  );
};

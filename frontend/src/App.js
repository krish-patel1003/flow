import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { RunMonitor } from './runMonitor';
import { InspectorPanel } from './inspectorPanel';
import './appLayout.css';


function App() {
  return (
    <div className="app-shell">
      <PipelineToolbar />
      <div className="canvas-pane">
        <PipelineUI />
      </div>
      <InspectorPanel />
      <RunMonitor />
    </div>
  );
}

export default App;

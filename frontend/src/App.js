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
      <div className="right-pane">
        <InspectorPanel />
        <RunMonitor />
      </div>
    </div>
  );
}

export default App;

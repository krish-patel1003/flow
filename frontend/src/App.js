import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { RunMonitor } from './runMonitor';


function App() {
  return (
    <div>
      <PipelineToolbar />
      <PipelineUI />
      <RunMonitor />
    </div>
  );
}

export default App;

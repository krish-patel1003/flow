import { PipelineToolbar } from './toolbar';
import { PipelineUI } from './ui';
import { RightPane } from './rightPane';
import { OnboardingTour } from './onboardingTour';
import './appLayout.css';


function App() {
  return (
    <div className="app-shell">
      <PipelineToolbar />
      <div className="canvas-pane">
        <PipelineUI />
      </div>
      <RightPane />
      <OnboardingTour />
    </div>
  );
}

export default App;

import { InspectorPanel } from './inspectorPanel';
import { RunMonitor } from './runMonitor';
import { useStore } from './store';

export const RightPane = () => {
  const { rightPaneTab, setRightPaneTab } = useStore((state) => ({
    rightPaneTab: state.rightPaneTab,
    setRightPaneTab: state.setRightPaneTab,
  }));

  return (
    <div className="right-pane">
      <div className="right-pane-tabs">
        <button
          type="button"
          className={rightPaneTab === 'inspector' ? 'active' : ''}
          onClick={() => setRightPaneTab('inspector')}
        >
          Inspector
        </button>
        <button
          type="button"
          className={rightPaneTab === 'console' ? 'active' : ''}
          onClick={() => setRightPaneTab('console')}
        >
          Console
        </button>
      </div>

      <div className="right-pane-body">
        {rightPaneTab === 'inspector' ? <InspectorPanel /> : <RunMonitor />}
      </div>
    </div>
  );
};

import { useCallback, useEffect, useState } from 'react';
import { useStore } from './store';
import './runMonitor.css';
import { getApiBase } from './apiBase';

const terminalStatuses = new Set(['succeeded', 'failed', 'cancelled']);

export const RunMonitor = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [runArtifacts, setRunArtifacts] = useState({});
  const [runOutputs, setRunOutputs] = useState({});

  const {
    currentRunId,
    runStatus,
    runNodeStates,
    runError,
    runLogs,
    setRunStatusPayload,
    setRunError,
    setRunLog,
  } = useStore((state) => ({
    currentRunId: state.currentRunId,
    runStatus: state.runStatus,
    runNodeStates: state.runNodeStates,
    runError: state.runError,
    runLogs: state.runLogs,
    setRunStatusPayload: state.setRunStatusPayload,
    setRunError: state.setRunError,
    setRunLog: state.setRunLog,
  }));

  const baseUrl = getApiBase();

  const refreshStatus = useCallback(async () => {
    if (!currentRunId) {
      return;
    }
    try {
      const response = await fetch(`${baseUrl}/runs/${currentRunId}`);
      if (!response.ok) {
        throw new Error('Failed to load run status');
      }
      const payload = await response.json();
      setRunStatusPayload(payload);
    } catch (error) {
      setRunError(error.message || 'Unable to refresh run status');
    }
  }, [baseUrl, currentRunId, setRunError, setRunStatusPayload]);

  const fetchArtifacts = useCallback(async () => {
    if (!currentRunId) {
      return;
    }
    try {
      const response = await fetch(`${baseUrl}/runs/${currentRunId}/artifacts`);
      if (!response.ok) {
        throw new Error('Failed to load artifacts');
      }
      const payload = await response.json();
      const byNode = {};
      (payload.artifacts || []).forEach((artifact) => {
        if (artifact.type === 'file_sink' && artifact.node_id && artifact.value) {
          byNode[artifact.node_id] = artifact.value;
        }
      });
      setRunArtifacts(byNode);
    } catch (error) {
      setRunError(error.message || 'Unable to load artifacts');
    }
  }, [baseUrl, currentRunId, setRunError]);

  useEffect(() => {
    if (!currentRunId) {
      return undefined;
    }
    refreshStatus();
    const timer = setInterval(() => {
      if (!terminalStatuses.has(runStatus)) {
        refreshStatus();
      }
    }, 800);
    return () => clearInterval(timer);
  }, [currentRunId, runStatus, refreshStatus]);

  useEffect(() => {
    if (!currentRunId) {
      return;
    }
    if (terminalStatuses.has(runStatus)) {
      fetchArtifacts();
    }
  }, [currentRunId, runStatus, fetchArtifacts]);

  useEffect(() => {
    setRunArtifacts({});
    setRunOutputs({});
  }, [currentRunId]);

  const cancelRun = async () => {
    if (!currentRunId) {
      return;
    }
    try {
      await fetch(`${baseUrl}/runs/${currentRunId}/cancel`, { method: 'POST' });
      refreshStatus();
    } catch (error) {
      setRunError(error.message || 'Unable to cancel run');
    }
  };

  const fetchLog = async (nodeId) => {
    if (!currentRunId) {
      return;
    }
    try {
      const response = await fetch(`${baseUrl}/runs/${currentRunId}/logs/${nodeId}`);
      if (!response.ok) {
        throw new Error('Failed to load node log');
      }
      const text = await response.text();
      setRunLog(nodeId, text || '(no logs yet)');
    } catch (error) {
      setRunLog(nodeId, `Error: ${error.message || 'Unable to fetch logs'}`);
    }
  };

  const fetchOutput = async (nodeId) => {
    if (!currentRunId) {
      return;
    }
    setRunOutputs((value) => ({
      ...value,
      [nodeId]: {
        content: 'Loading output...',
        path: runArtifacts[nodeId] || '',
        truncated: false,
        missing: false,
      },
    }));
    try {
      const response = await fetch(`${baseUrl}/runs/${currentRunId}/outputs/${nodeId}?max_chars=15000`);
      if (!response.ok) {
        throw new Error('Failed to load output');
      }
      const payload = await response.json();
      setRunOutputs((value) => ({
        ...value,
        [nodeId]: payload,
      }));
    } catch (error) {
      setRunOutputs((value) => ({
        ...value,
        [nodeId]: {
          content: `Error: ${error.message || 'Unable to fetch output'}`,
          path: runArtifacts[nodeId] || '',
          truncated: false,
          missing: false,
        },
      }));
    }
  };

  return (
    <aside className={`run-monitor ${isMinimized ? 'minimized' : ''}`}>
      <div className="run-monitor-header">
        <span className="run-monitor-title">Run Console</span>
        <div className="run-actions">
          <button onClick={() => setShowLogs((value) => !value)} disabled={isMinimized}>
            {showLogs ? 'Hide Logs' : 'Show Logs'}
          </button>
          <button onClick={() => setIsMinimized((value) => !value)}>
            {isMinimized ? 'Expand' : 'Minimize'}
          </button>
        </div>
      </div>

      {isMinimized ? null : (
        <>
          {!currentRunId ? (
            <div className="run-row">No run yet. Submit a pipeline to see logs and outputs.</div>
          ) : (
            <>
              <div className="run-row">Run: <strong>{currentRunId}</strong></div>
              <div className="run-row">Status: <strong>{runStatus || 'pending'}</strong></div>
              {runError ? <div className="run-row">Error: {runError}</div> : null}
              <div className="run-actions">
                <button onClick={refreshStatus}>Refresh</button>
                <button onClick={fetchArtifacts}>Load Outputs</button>
                <button onClick={cancelRun} disabled={terminalStatuses.has(runStatus)}>Cancel</button>
              </div>

              {Object.entries(runNodeStates).map(([nodeId, state]) => (
                <div key={nodeId} className="node-state-item">
                  <div className="node-state-head">
                    <strong>{nodeId}</strong>
                    <div className="node-actions">
                      <button onClick={() => fetchLog(nodeId)}>Load Log</button>
                      {runArtifacts[nodeId] ? <button onClick={() => fetchOutput(nodeId)}>View Output</button> : null}
                    </div>
                  </div>
                  <small>Status: {state.status}</small>
                  <small>Attempts: {state.attempts || 0}</small>
                  {runArtifacts[nodeId] ? <small>Output file: {runArtifacts[nodeId]}</small> : null}
                  {showLogs && runLogs[nodeId] ? <pre className="node-log">{runLogs[nodeId]}</pre> : null}
                  {runOutputs[nodeId] ? (
                    <>
                      {runOutputs[nodeId].missing ? <small>Output file is missing on disk.</small> : null}
                      {runOutputs[nodeId].truncated ? <small>Showing first 15,000 characters.</small> : null}
                      <pre className="node-log output-preview">{runOutputs[nodeId].content || '(empty output)'}</pre>
                    </>
                  ) : null}
                </div>
              ))}
            </>
          )}
        </>
      )}
    </aside>
  );
};

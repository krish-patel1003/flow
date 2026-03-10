import { useStore } from "./store";
import { useState } from "react";
import "./submitButton.css";
import { serializePipeline } from './pipelineSerializer';

export const SubmitPipelineButton = () => {
  const { nodes, edges } = useStore((state) => ({
    nodes: state.nodes,
    edges: state.edges,
  }));

  const [isSubmitting, setIsSubmitting] = useState(false); // Track submission status

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return; // Prevent multiple clicks
    setIsSubmitting(true); // Disable button

    const baseUrl = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000';
    const pipeline = serializePipeline({
      id: 'pipeline-demo',
      name: 'Pipeline Demo',
      nodes,
      edges,
    });

    try {
      const validationResponse = await fetch(`${baseUrl}/pipelines/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pipeline),
      });

      if (!validationResponse.ok) {
        throw new Error("Network response was not ok");
      }

      const validation = await validationResponse.json();
      if (!validation.valid) {
        const details = validation.errors.map((error) => `${error.code}: ${error.message}`).join("\n");
        alert(`Pipeline has validation errors:\n${details}`);
        return;
      }

      const runResponse = await fetch(`${baseUrl}/runs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pipeline }),
      });

      if (!runResponse.ok) {
        throw new Error('Failed to create run');
      }

      const runData = await runResponse.json();
      const statusResponse = await fetch(`${baseUrl}/runs/${runData.run_id}`);
      const status = await statusResponse.json();
      alert(`Run ${runData.run_id}: ${status.status}`);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while submitting the pipeline.");
    } finally {
      setIsSubmitting(false); // Re-enable button after submission
    }
  };

  return (
    <button
      className="submit-button"
      onClick={handleSubmit}
      disabled={isSubmitting} // Disable button while submitting
    >
      {isSubmitting ? "Submitting..." : "Submit Pipeline"}
    </button>
  );
};

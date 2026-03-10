export const v1NodeRegistry = {
  manual_trigger: {
    label: 'Manual Trigger',
    executable: true,
    defaults: {},
  },
  file_source: {
    label: 'File Source',
    executable: true,
    defaults: {
      path: '',
      mode: 'text',
    },
  },
  python_transform: {
    label: 'Python Transform',
    executable: true,
    defaults: {
      script: "def transform(input_data):\n    return input_data",
      timeout_seconds: 5,
    },
  },
  file_sink: {
    label: 'File Sink',
    executable: true,
    defaults: {
      path: '',
      mode: 'text',
    },
  },
};

export const comingSoonNodes = [
  { type: 'customInput', label: 'Input' },
  { type: 'llm', label: 'LLM' },
  { type: 'customOutput', label: 'Output' },
  { type: 'text', label: 'Text' },
  { type: 'math', label: 'Math' },
  { type: 'imageProcessing', label: 'Image Processing' },
  { type: 'dataAggregation', label: 'Data Aggregation' },
  { type: 'conditional', label: 'Conditional' },
  { type: 'api', label: 'API' },
];

export const pythonTransformPresets = [
  {
    id: 'uppercase',
    label: 'Uppercase text',
    script: "def transform(input_data):\n    return str(input_data).upper()",
  },
  {
    id: 'multiply',
    label: 'Multiply number x10',
    script: "def transform(input_data):\n    return float(input_data) * 10",
  },
  {
    id: 'json_project',
    label: 'JSON project key',
    script:
      "import json\n\ndef transform(input_data):\n    if isinstance(input_data, str):\n        payload = json.loads(input_data)\n    else:\n        payload = input_data\n    return {'value': payload.get('value')}",
  },
];

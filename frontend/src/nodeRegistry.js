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
  text: {
    label: 'Text',
    executable: true,
    defaults: {
      template: '{{input}}',
    },
  },
  math: {
    label: 'Math',
    executable: true,
    defaults: {
      operation: 'add',
    },
  },
  conditional: {
    label: 'Conditional',
    executable: true,
    defaults: {
      operator: '==',
    },
  },
  api: {
    label: 'API Request',
    executable: true,
    defaults: {
      method: 'GET',
      url: '',
      timeout_seconds: 10,
    },
  },
  llm: {
    label: 'LLM',
    executable: true,
    defaults: {
      mode: 'mock',
      systemPrompt: '',
      model: 'llama3.2:1b',
      temperature: 0.2,
    },
  },
  imageProcessing: {
    label: 'Image Processing',
    executable: true,
    defaults: {
      operation: 'grayscale',
      outputPath: '',
    },
  },
  dataAggregation: {
    label: 'Data Aggregation',
    executable: true,
    defaults: {
      aggregationType: 'sum',
      values: [],
    },
  },
};

export const comingSoonNodes = [
  { type: 'customInput', label: 'Input' },
  { type: 'customOutput', label: 'Output' },
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

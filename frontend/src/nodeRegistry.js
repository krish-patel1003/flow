export const v1NodeRegistry = {
  manual_trigger: {
    label: 'Manual Trigger',
    executable: true,
    category: 'triggers',
    description: 'Start a pipeline manually from the canvas.',
    tags: ['start', 'manual'],
    defaults: {},
  },
  scheduler_trigger: {
    label: 'Scheduler Trigger',
    executable: true,
    category: 'triggers',
    description: 'Start a run based on a cron-like schedule configuration.',
    tags: ['cron', 'time', 'automation'],
    defaults: {
      cron: '0 * * * *',
      timezone: 'UTC',
      enabled: true,
    },
  },
  webhook_trigger: {
    label: 'Webhook Trigger',
    executable: true,
    category: 'triggers',
    description: 'Start from an incoming webhook payload contract.',
    tags: ['event', 'http', 'hook'],
    defaults: {
      path: '/hooks/default',
      method: 'POST',
      secret: '',
      sample_payload: {},
    },
  },
  file_source: {
    label: 'File Source',
    executable: true,
    category: 'sources',
    description: 'Read text or JSON from a local file path.',
    tags: ['file', 'input', 'json', 'text'],
    defaults: {
      path: '',
      mode: 'text',
    },
  },
  python_transform: {
    label: 'Python Transform',
    executable: true,
    category: 'transform',
    description: 'Run a Python function to transform incoming data.',
    tags: ['python', 'script', 'custom'],
    defaults: {
      script: "def transform(input_data):\n    return input_data",
      timeout_seconds: 5,
    },
  },
  file_sink: {
    label: 'File Sink',
    executable: true,
    category: 'sinks',
    description: 'Write data to a local file path.',
    tags: ['file', 'output', 'save'],
    defaults: {
      path: '',
      mode: 'text',
    },
  },
  text: {
    label: 'Text',
    executable: true,
    category: 'transform',
    description: 'Format incoming content with a text template.',
    tags: ['template', 'format', 'string'],
    defaults: {
      template: '{{input}}',
    },
  },
  math: {
    label: 'Math',
    executable: true,
    category: 'transform',
    description: 'Perform arithmetic on two numeric inputs.',
    tags: ['calculate', 'number'],
    defaults: {
      operation: 'add',
    },
  },
  conditional: {
    label: 'Conditional',
    executable: true,
    category: 'routing',
    description: 'Split data flow into true or false branches.',
    tags: ['if', 'branch', 'rule'],
    defaults: {
      operator: '==',
    },
  },
  api: {
    label: 'API Request',
    executable: true,
    category: 'integrations',
    description: 'Call an HTTP API and emit the response payload.',
    tags: ['http', 'rest', 'web'],
    defaults: {
      method: 'GET',
      url: '',
      timeout_seconds: 10,
    },
  },
  llm: {
    label: 'LLM',
    executable: true,
    category: 'ai',
    description: 'Generate text responses using a configured model.',
    tags: ['ai', 'model', 'ollama'],
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
    category: 'transform',
    description: 'Apply a basic image processing operation.',
    tags: ['image', 'vision'],
    defaults: {
      operation: 'grayscale',
      outputPath: '',
    },
  },
  dataAggregation: {
    label: 'Data Aggregation',
    executable: true,
    category: 'transform',
    description: 'Combine multiple inputs into one aggregated output.',
    tags: ['aggregate', 'merge', 'reduce'],
    defaults: {
      aggregationType: 'sum',
      values: [],
    },
  },
  json_extract: {
    label: 'JSON Extract',
    executable: true,
    category: 'transform',
    description: 'Extract a nested value from JSON using dot path.',
    tags: ['json', 'extract', 'path'],
    defaults: {
      path: '',
      use_default: false,
      default: '',
    },
  },
  join_merge: {
    label: 'Join Merge',
    executable: true,
    category: 'transform',
    description: 'Merge two inputs by object merge, concat, or zip.',
    tags: ['merge', 'join', 'concat'],
    defaults: {
      strategy: 'object_merge',
    },
  },
  schema_validate: {
    label: 'Schema Validate',
    executable: true,
    category: 'routing',
    description: 'Validate payload shape and return validity report.',
    tags: ['validate', 'schema', 'guardrail'],
    defaults: {
      schema_type: 'required_keys',
      required_keys: [],
      expected_type: 'dict',
    },
  },
  filter: {
    label: 'Filter',
    executable: true,
    category: 'routing',
    description: 'Evaluate a rule and label payload as pass or fail.',
    tags: ['rule', 'branch', 'condition'],
    defaults: {
      field: '',
      operator: '==',
      value: '',
    },
  },
  notification: {
    label: 'Notification',
    executable: true,
    category: 'integrations',
    description: 'Send a message to logs or a webhook endpoint.',
    tags: ['alert', 'webhook', 'message'],
    defaults: {
      channel: 'log',
      target: '',
      template: '{{input}}',
      timeout_seconds: 10,
    },
  },
};

export const comingSoonNodes = [
  {
    type: 'customInput',
    label: 'Input',
    category: 'sources',
    description: 'Reusable pipeline input for external parameters.',
  },
  {
    type: 'customOutput',
    label: 'Output',
    category: 'sinks',
    description: 'Reusable pipeline output for standardized responses.',
  },
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

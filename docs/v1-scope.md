## What v1 supports

- Local execution only
- One machine
- One run at a time (single-user)
- `manual_trigger`, `file_source`, `python_transform`, `file_sink`, `text`, `math`, `conditional`, `api`, `llm`, `imageProcessing`, `dataAggregation`, `json_extract`, `join_merge`, `schema_validate`
- Inline Python transform scripts (`transform(input_data)`)
- Process-based execution with optional Dockerized local setup
- Validation for schema, ports, DAG, and node config
- Run status, per-node logs, and artifact manifest output
- Run listing, cancellation request endpoint, and node registry endpoint
- Parallel scheduling for ready nodes (`RUN_MAX_WORKERS`)
- Node retries and backoff (`retries`, `retry_backoff_seconds`)

### Node ports

- `manual_trigger`: outputs `start`
- `file_source`: inputs `trigger`, outputs `data`
- `python_transform`: inputs `input`, outputs `output`
- `file_sink`: inputs `input`
- `text`: inputs `input`, outputs `text`
- `math`: inputs `num1`, `num2`, outputs `result`
- `conditional`: inputs `value1`, `value2`, outputs `true`, `false`
- `api`: inputs `payload`, outputs `response`
- `llm`: inputs `system`, `prompt`, outputs `response`
- `imageProcessing`: inputs `image`, outputs `processed`
- `dataAggregation`: inputs `data1`, `data2`, `data3`, outputs `aggregated`
- `json_extract`: inputs `input`, outputs `value`
- `join_merge`: inputs `left`, `right`, outputs `merged`
- `schema_validate`: inputs `input`, outputs `result`

### Pipeline contract

- Node shape: `{ id, type, position, config }`
- Edge shape: `{ id, source:{node_id,port}, target:{node_id,port} }`
- Pipeline shape: `{ id, name, version, nodes, edges }`

## What v1 does NOT support

- Training models
- GPUs
- Cloud execution
- Multiple users
- Dynamic scaling
- Public internet exposure
- Security sandboxing for user-provided Python scripts
- Fully integrated external LLM providers (OpenAI/Anthropic/etc.)

### Important execution note

- `python_transform` currently allows arbitrary imports and code execution within local process boundaries. Use only in trusted local environments.
- Cancellation is cooperative; currently running subprocess/node work is not forcibly killed mid-execution.

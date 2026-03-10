## What v1 supports

- Local execution only
- One machine
- One pipeline at a time
- One run at a time (single-user)
- `manual_trigger`, `file_source`, `python_transform`, `file_sink`
- Inline Python transform scripts (`transform(input_data)`)
- Process-based execution with optional Dockerized local setup
- Validation for schema, ports, DAG, and node config
- Run status, per-node logs, and artifact manifest output

## What v1 does NOT support

- Training models
- GPUs
- Cloud execution
- Multiple users
- Dynamic scaling
- Public internet exposure
- Security sandboxing for user-provided Python scripts

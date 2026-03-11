const edge = (id, source, sourcePort, target, targetPort) => ({
  id,
  source,
  sourceHandle: `${source}-${sourcePort}`,
  target,
  targetHandle: `${target}-${targetPort}`,
  type: 'buttonedge',
  animated: true,
});

export const demoPipelines = [
  {
    id: 'uppercase-file',
    label: 'Uppercase File',
    description: 'File source -> Python uppercase -> sink',
    nodes: [
      { id: 'manual_trigger-1', type: 'manual_trigger', position: { x: 80, y: 180 }, data: { config: {} } },
      {
        id: 'file_source-1',
        type: 'file_source',
        position: { x: 280, y: 180 },
        data: { config: { path: 'backend/.runs/demo/input.txt', mode: 'text' } },
      },
      {
        id: 'python_transform-1',
        type: 'python_transform',
        position: { x: 520, y: 180 },
        data: {
          config: {
            script: "def transform(input_data):\n    return str(input_data).upper()",
            timeout_seconds: 5,
          },
        },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 760, y: 180 },
        data: { config: { path: 'backend/.runs/demo/output.txt', mode: 'text' } },
      },
    ],
    edges: [
      edge('e1', 'manual_trigger-1', 'start', 'file_source-1', 'trigger'),
      edge('e2', 'file_source-1', 'data', 'python_transform-1', 'input'),
      edge('e3', 'python_transform-1', 'output', 'file_sink-1', 'input'),
    ],
  },
  {
    id: 'api-json-save',
    label: 'API JSON Save',
    description: 'GET request -> save as JSON',
    nodes: [
      { id: 'manual_trigger-1', type: 'manual_trigger', position: { x: 80, y: 180 }, data: { config: {} } },
      {
        id: 'api-1',
        type: 'api',
        position: { x: 320, y: 180 },
        data: { config: { method: 'GET', url: 'https://httpbin.org/get', timeout_seconds: 10 } },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 580, y: 180 },
        data: { config: { path: 'backend/.runs/demo/httpbin.json', mode: 'json' } },
      },
    ],
    edges: [
      edge('e1', 'manual_trigger-1', 'start', 'api-1', 'payload'),
      edge('e2', 'api-1', 'response', 'file_sink-1', 'input'),
    ],
  },
  {
    id: 'parallel-branch',
    label: 'Parallel Branch',
    description: 'One source to upper/lower branch sinks',
    nodes: [
      { id: 'manual_trigger-1', type: 'manual_trigger', position: { x: 80, y: 220 }, data: { config: {} } },
      {
        id: 'file_source-1',
        type: 'file_source',
        position: { x: 280, y: 220 },
        data: { config: { path: 'backend/.runs/demo/input.txt', mode: 'text' } },
      },
      {
        id: 'python_transform-1',
        type: 'python_transform',
        position: { x: 540, y: 120 },
        data: { config: { script: "def transform(input_data):\n    return str(input_data).upper()" } },
      },
      {
        id: 'python_transform-2',
        type: 'python_transform',
        position: { x: 540, y: 320 },
        data: { config: { script: "def transform(input_data):\n    return str(input_data).lower()" } },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 820, y: 120 },
        data: { config: { path: 'backend/.runs/demo/output-upper.txt', mode: 'text' } },
      },
      {
        id: 'file_sink-2',
        type: 'file_sink',
        position: { x: 820, y: 320 },
        data: { config: { path: 'backend/.runs/demo/output-lower.txt', mode: 'text' } },
      },
    ],
    edges: [
      edge('e1', 'manual_trigger-1', 'start', 'file_source-1', 'trigger'),
      edge('e2', 'file_source-1', 'data', 'python_transform-1', 'input'),
      edge('e3', 'file_source-1', 'data', 'python_transform-2', 'input'),
      edge('e4', 'python_transform-1', 'output', 'file_sink-1', 'input'),
      edge('e5', 'python_transform-2', 'output', 'file_sink-2', 'input'),
    ],
  },
  {
    id: 'aggregate-llm',
    label: 'Aggregate + LLM',
    description: 'Aggregate static values and pass to LLM',
    nodes: [
      { id: 'manual_trigger-1', type: 'manual_trigger', position: { x: 80, y: 180 }, data: { config: {} } },
      {
        id: 'dataAggregation-1',
        type: 'dataAggregation',
        position: { x: 280, y: 180 },
        data: { config: { aggregationType: 'sum', values: [2, 3, 5] } },
      },
      {
        id: 'llm-1',
        type: 'llm',
        position: { x: 520, y: 180 },
        data: {
          config: {
            mode: 'ollama',
            model: 'llama3.2:1b',
            systemPrompt: 'Summarize the numeric result in one short sentence.',
          },
        },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 760, y: 180 },
        data: { config: { path: 'backend/.runs/demo/llm-summary.txt', mode: 'text' } },
      },
    ],
    edges: [
      edge('e1', 'manual_trigger-1', 'start', 'dataAggregation-1', 'data1'),
      edge('e2', 'dataAggregation-1', 'aggregated', 'llm-1', 'prompt'),
      edge('e3', 'llm-1', 'response', 'file_sink-1', 'input'),
    ],
  },
  {
    id: 'etl-public-csv',
    label: 'Public CSV ETL',
    description: 'Fetch iris CSV, summarize with transform, save JSON',
    nodes: [
      { id: 'manual_trigger-1', type: 'manual_trigger', position: { x: 80, y: 180 }, data: { config: {} } },
      {
        id: 'api-1',
        type: 'api',
        position: { x: 300, y: 180 },
        data: {
          config: {
            method: 'GET',
            url: 'https://raw.githubusercontent.com/mwaskom/seaborn-data/master/iris.csv',
            timeout_seconds: 20,
          },
        },
      },
      {
        id: 'python_transform-1',
        type: 'python_transform',
        position: { x: 560, y: 180 },
        data: {
          config: {
            script:
              "import csv\nfrom io import StringIO\n\ndef transform(input_data):\n    body = input_data.get('body', '') if isinstance(input_data, dict) else str(input_data)\n    rows = list(csv.DictReader(StringIO(body)))\n    species_counts = {}\n    for row in rows:\n        species = row.get('species', 'unknown')\n        species_counts[species] = species_counts.get(species, 0) + 1\n    return {\n        'dataset': 'iris',\n        'total_rows': len(rows),\n        'species_counts': species_counts\n    }",
            timeout_seconds: 12,
          },
        },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 840, y: 180 },
        data: { config: { path: 'backend/.runs/demo/iris-summary.json', mode: 'json' } },
      },
    ],
    edges: [
      edge('e1', 'manual_trigger-1', 'start', 'api-1', 'payload'),
      edge('e2', 'api-1', 'response', 'python_transform-1', 'input'),
      edge('e3', 'python_transform-1', 'output', 'file_sink-1', 'input'),
    ],
  },
  {
    id: 'etl-chunked-csv-large',
    label: 'ETL Chunked CSV (Large)',
    description: 'Stream a large CSV, clean rows, write curated file + report',
    nodes: [
      { id: 'manual_trigger-1', type: 'manual_trigger', position: { x: 80, y: 200 }, data: { config: {} } },
      {
        id: 'file_source-1',
        type: 'file_source',
        position: { x: 300, y: 200 },
        data: { config: { path: 'backend/.runs/demo/chunked-csv-config.json', mode: 'json' } },
      },
      {
        id: 'python_transform-1',
        type: 'python_transform',
        position: { x: 560, y: 200 },
        data: {
          config: {
            script:
              "import csv\nfrom datetime import datetime\nfrom pathlib import Path\n\ndef _parse_ts(value):\n    if not value:\n        return None\n    value = value.strip()\n    if value.endswith('Z'):\n        value = value[:-1] + '+00:00'\n    try:\n        return datetime.fromisoformat(value)\n    except Exception:\n        return None\n\ndef transform(input_data):\n    cfg = input_data if isinstance(input_data, dict) else {}\n    input_path = Path(cfg.get('input_path', 'backend/.runs/demo/large-events.csv'))\n    output_path = Path(cfg.get('output_path', 'backend/.runs/demo/large-events-curated.csv'))\n    partition_dir = Path(cfg.get('partition_dir', 'backend/.runs/demo/partitions'))\n\n    output_path.parent.mkdir(parents=True, exist_ok=True)\n    partition_dir.mkdir(parents=True, exist_ok=True)\n\n    rows_in = 0\n    rows_out = 0\n    dropped_invalid = 0\n    dropped_duplicates = 0\n    seen_ids = set()\n\n    with input_path.open('r', newline='', encoding='utf-8') as src, output_path.open('w', newline='', encoding='utf-8') as dst:\n        reader = csv.DictReader(src)\n        fieldnames = ['id', 'event_ts', 'category', 'amount']\n        writer = csv.DictWriter(dst, fieldnames=fieldnames)\n        writer.writeheader()\n\n        for row in reader:\n            rows_in += 1\n            row_id = str(row.get('id', '')).strip()\n            ts = _parse_ts(str(row.get('event_ts', '')))\n            if not row_id or ts is None:\n                dropped_invalid += 1\n                continue\n            if row_id in seen_ids:\n                dropped_duplicates += 1\n                continue\n\n            seen_ids.add(row_id)\n            normalized = {\n                'id': row_id,\n                'event_ts': ts.isoformat(),\n                'category': str(row.get('category', 'unknown')).strip() or 'unknown',\n                'amount': str(row.get('amount', '0')).strip() or '0',\n            }\n            writer.writerow(normalized)\n            rows_out += 1\n\n            day = ts.date().isoformat()\n            part_path = partition_dir / f'event_date={day}.csv'\n            write_header = not part_path.exists()\n            with part_path.open('a', newline='', encoding='utf-8') as part:\n                part_writer = csv.DictWriter(part, fieldnames=fieldnames)\n                if write_header:\n                    part_writer.writeheader()\n                part_writer.writerow(normalized)\n\n    return {\n        'job': 'chunked_csv_large',\n        'input_path': str(input_path),\n        'output_path': str(output_path),\n        'partition_dir': str(partition_dir),\n        'rows_in': rows_in,\n        'rows_out': rows_out,\n        'dropped_invalid': dropped_invalid,\n        'dropped_duplicates': dropped_duplicates,\n    }",
            timeout_seconds: 30,
          },
        },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 860, y: 200 },
        data: { config: { path: 'backend/.runs/demo/chunked-csv-report.json', mode: 'json' } },
      },
    ],
    edges: [
      edge('e1', 'manual_trigger-1', 'start', 'file_source-1', 'trigger'),
      edge('e2', 'file_source-1', 'data', 'python_transform-1', 'input'),
      edge('e3', 'python_transform-1', 'output', 'file_sink-1', 'input'),
    ],
  },
  {
    id: 'etl-incremental-watermark',
    label: 'ETL Incremental Watermark',
    description: 'Incremental load with stateful watermark and idempotent output',
    nodes: [
      { id: 'manual_trigger-1', type: 'manual_trigger', position: { x: 80, y: 200 }, data: { config: {} } },
      {
        id: 'file_source-1',
        type: 'file_source',
        position: { x: 300, y: 200 },
        data: { config: { path: 'backend/.runs/demo/incremental-etl-config.json', mode: 'json' } },
      },
      {
        id: 'python_transform-1',
        type: 'python_transform',
        position: { x: 560, y: 200 },
        data: {
          config: {
            script:
              "import csv\nimport json\nfrom datetime import datetime\nfrom pathlib import Path\n\ndef _parse_ts(value):\n    if not value:\n        return None\n    value = value.strip()\n    if value.endswith('Z'):\n        value = value[:-1] + '+00:00'\n    try:\n        return datetime.fromisoformat(value)\n    except Exception:\n        return None\n\ndef transform(input_data):\n    cfg = input_data if isinstance(input_data, dict) else {}\n    input_path = Path(cfg.get('input_path', 'backend/.runs/demo/incremental-events.csv'))\n    state_path = Path(cfg.get('state_path', 'backend/.runs/demo/incremental-state.json'))\n    output_path = Path(cfg.get('output_path', 'backend/.runs/demo/incremental-latest.json'))\n\n    state_path.parent.mkdir(parents=True, exist_ok=True)\n    output_path.parent.mkdir(parents=True, exist_ok=True)\n\n    last_ts = datetime.fromisoformat('1970-01-01T00:00:00+00:00')\n    if state_path.exists():\n        try:\n            state = json.loads(state_path.read_text())\n            loaded = _parse_ts(str(state.get('last_ts', '')))\n            if loaded is not None:\n                last_ts = loaded\n        except Exception:\n            pass\n\n    upserted = {}\n    rows_seen = 0\n    rows_new = 0\n    max_ts = last_ts\n\n    with input_path.open('r', newline='', encoding='utf-8') as src:\n        reader = csv.DictReader(src)\n        for row in reader:\n            rows_seen += 1\n            row_id = str(row.get('id', '')).strip()\n            row_ts = _parse_ts(str(row.get('updated_at', '')))\n            if not row_id or row_ts is None:\n                continue\n            if row_ts <= last_ts:\n                continue\n\n            rows_new += 1\n            if row_ts > max_ts:\n                max_ts = row_ts\n\n            upserted[row_id] = {\n                'id': row_id,\n                'updated_at': row_ts.isoformat(),\n                'value': row.get('value'),\n            }\n\n    output_path.write_text(json.dumps({'records': list(upserted.values())}, indent=2))\n    state_path.write_text(json.dumps({'last_ts': max_ts.isoformat()}, indent=2))\n\n    return {\n        'job': 'incremental_watermark',\n        'input_path': str(input_path),\n        'output_path': str(output_path),\n        'state_path': str(state_path),\n        'rows_seen': rows_seen,\n        'rows_new': rows_new,\n        'watermark': max_ts.isoformat(),\n    }",
            timeout_seconds: 20,
          },
        },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 860, y: 200 },
        data: { config: { path: 'backend/.runs/demo/incremental-report.json', mode: 'json' } },
      },
    ],
    edges: [
      edge('e1', 'manual_trigger-1', 'start', 'file_source-1', 'trigger'),
      edge('e2', 'file_source-1', 'data', 'python_transform-1', 'input'),
      edge('e3', 'python_transform-1', 'output', 'file_sink-1', 'input'),
    ],
  },
  {
    id: 'etl-api-chained-cars',
    label: 'ETL API Chained (Cars)',
    description: 'Pull JSON from API and process in chained transforms',
    nodes: [
      { id: 'manual_trigger-1', type: 'manual_trigger', position: { x: 80, y: 220 }, data: { config: {} } },
      {
        id: 'api-1',
        type: 'api',
        position: { x: 300, y: 220 },
        data: {
          config: {
            method: 'GET',
            url: 'https://raw.githubusercontent.com/vega/vega-datasets/master/data/cars.json',
            timeout_seconds: 30,
          },
        },
      },
      {
        id: 'python_transform-1',
        type: 'python_transform',
        position: { x: 530, y: 120 },
        data: {
          config: {
            script:
              "import json\n\ndef _extract_rows(payload):\n    if isinstance(payload, list):\n        return payload\n    if isinstance(payload, dict):\n        body = payload.get('body')\n        if isinstance(body, list):\n            return body\n        if isinstance(body, str):\n            try:\n                parsed = json.loads(body)\n                return parsed if isinstance(parsed, list) else []\n            except Exception:\n                return []\n    return []\n\ndef transform(input_data):\n    rows = _extract_rows(input_data)\n    normalized = []\n    for row in rows:\n        name = str(row.get('Name', '')).strip()\n        origin = str(row.get('Origin', 'unknown')).strip() or 'unknown'\n        if not name:\n            continue\n        normalized.append({\n            'name': name,\n            'origin': origin,\n            'mpg': row.get('Miles_per_Gallon'),\n            'hp': row.get('Horsepower'),\n            'year': str(row.get('Year', ''))[:4],\n        })\n    return normalized",
            timeout_seconds: 20,
          },
        },
      },
      {
        id: 'python_transform-2',
        type: 'python_transform',
        position: { x: 530, y: 320 },
        data: {
          config: {
            script:
              "def _to_float(value):\n    try:\n        return float(value)\n    except Exception:\n        return None\n\ndef transform(input_data):\n    rows = input_data if isinstance(input_data, list) else []\n    cleaned = []\n    for row in rows:\n        mpg = _to_float(row.get('mpg'))\n        hp = _to_float(row.get('hp'))\n        if mpg is None or hp is None:\n            continue\n        row = dict(row)\n        row['mpg'] = mpg\n        row['hp'] = hp\n        row['power_band'] = 'high' if hp >= 150 else ('mid' if hp >= 90 else 'low')\n        cleaned.append(row)\n    return cleaned",
            timeout_seconds: 20,
          },
        },
      },
      {
        id: 'python_transform-3',
        type: 'python_transform',
        position: { x: 760, y: 220 },
        data: {
          config: {
            script:
              "def transform(input_data):\n    rows = input_data if isinstance(input_data, list) else []\n    by_origin = {}\n    for row in rows:\n        origin = row.get('origin', 'unknown')\n        agg = by_origin.setdefault(origin, {'count': 0, 'mpg_total': 0.0, 'hp_total': 0.0})\n        agg['count'] += 1\n        agg['mpg_total'] += row.get('mpg', 0.0)\n        agg['hp_total'] += row.get('hp', 0.0)\n\n    summary = []\n    for origin, agg in sorted(by_origin.items()):\n        count = agg['count']\n        summary.append({\n            'origin': origin,\n            'count': count,\n            'avg_mpg': round(agg['mpg_total'] / count, 2),\n            'avg_hp': round(agg['hp_total'] / count, 2),\n        })\n\n    return {'dataset': 'vega-cars', 'rows_processed': len(rows), 'summary_by_origin': summary}",
            timeout_seconds: 20,
          },
        },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 980, y: 220 },
        data: { config: { path: 'backend/.runs/demo/api-cars-summary.json', mode: 'json' } },
      },
    ],
    edges: [
      edge('e1', 'manual_trigger-1', 'start', 'api-1', 'payload'),
      edge('e2', 'api-1', 'response', 'python_transform-1', 'input'),
      edge('e3', 'python_transform-1', 'output', 'python_transform-2', 'input'),
      edge('e4', 'python_transform-2', 'output', 'python_transform-3', 'input'),
      edge('e5', 'python_transform-3', 'output', 'file_sink-1', 'input'),
    ],
  },
  {
    id: 'scheduled-ops-heartbeat',
    label: 'Scheduled Ops Heartbeat',
    description: 'Hourly schedule -> API health check -> notify + audit file',
    nodes: [
      {
        id: 'scheduler_trigger-1',
        type: 'scheduler_trigger',
        position: { x: 80, y: 220 },
        data: { config: { cron: '0 * * * *', timezone: 'UTC', enabled: true } },
      },
      {
        id: 'api-1',
        type: 'api',
        position: { x: 300, y: 220 },
        data: {
          config: {
            method: 'GET',
            url: 'https://httpbin.org/get',
            timeout_seconds: 15,
          },
        },
      },
      {
        id: 'json_extract-1',
        type: 'json_extract',
        position: { x: 520, y: 220 },
        data: { config: { path: 'url', use_default: true, default: 'missing-url' } },
      },
      {
        id: 'notification-1',
        type: 'notification',
        position: { x: 740, y: 140 },
        data: {
          config: {
            channel: 'log',
            template: 'Ops heartbeat check completed for endpoint {{input}}',
          },
        },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 740, y: 300 },
        data: { config: { path: 'backend/.runs/demo/ops-heartbeat.json', mode: 'json' } },
      },
    ],
    edges: [
      edge('e1', 'scheduler_trigger-1', 'start', 'api-1', 'payload'),
      edge('e2', 'api-1', 'response', 'json_extract-1', 'input'),
      edge('e3', 'json_extract-1', 'value', 'notification-1', 'message'),
      edge('e4', 'api-1', 'response', 'file_sink-1', 'input'),
    ],
  },
  {
    id: 'webhook-lead-qualification',
    label: 'Webhook Lead Qualification',
    description: 'Webhook lead payload -> score filter -> sales alert + CRM queue file',
    nodes: [
      {
        id: 'webhook_trigger-1',
        type: 'webhook_trigger',
        position: { x: 80, y: 220 },
        data: {
          config: {
            path: '/hooks/leads',
            method: 'POST',
            sample_payload: {
              lead: {
                id: 'lead-1001',
                name: 'Rivera Labs',
                email: 'buyer@riveralabs.example',
                score: 91,
              },
            },
          },
        },
      },
      {
        id: 'json_extract-1',
        type: 'json_extract',
        position: { x: 300, y: 220 },
        data: { config: { path: 'payload.lead.score', use_default: true, default: 0 } },
      },
      {
        id: 'filter-1',
        type: 'filter',
        position: { x: 500, y: 220 },
        data: { config: { field: '', operator: '>=', value: 80 } },
      },
      {
        id: 'notification-1',
        type: 'notification',
        position: { x: 740, y: 130 },
        data: {
          config: {
            channel: 'log',
            template: 'High-intent lead detected. Score payload: {{input}}',
          },
        },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 740, y: 320 },
        data: { config: { path: 'backend/.runs/demo/lead-qualification.json', mode: 'json' } },
      },
    ],
    edges: [
      edge('e1', 'webhook_trigger-1', 'payload', 'json_extract-1', 'input'),
      edge('e2', 'json_extract-1', 'value', 'filter-1', 'input'),
      edge('e3', 'filter-1', 'pass', 'notification-1', 'message'),
      edge('e4', 'filter-1', 'fail', 'file_sink-1', 'input'),
    ],
  },
  {
    id: 'webhook-order-validation',
    label: 'Webhook Order Validation',
    description: 'Validate order webhook contract and persist QA report',
    nodes: [
      {
        id: 'webhook_trigger-1',
        type: 'webhook_trigger',
        position: { x: 80, y: 220 },
        data: {
          config: {
            path: '/hooks/orders',
            method: 'POST',
            sample_payload: {
              order: {
                order_id: 'ord-8902',
                customer_email: 'ops@northwind.example',
                total: 149.95,
                currency: 'USD',
              },
            },
          },
        },
      },
      {
        id: 'json_extract-1',
        type: 'json_extract',
        position: { x: 300, y: 220 },
        data: { config: { path: 'payload.order', use_default: true, default: {} } },
      },
      {
        id: 'schema_validate-1',
        type: 'schema_validate',
        position: { x: 520, y: 220 },
        data: {
          config: {
            schema_type: 'required_keys',
            required_keys: ['order_id', 'customer_email', 'total', 'currency'],
          },
        },
      },
      {
        id: 'notification-1',
        type: 'notification',
        position: { x: 760, y: 130 },
        data: {
          config: {
            channel: 'log',
            template: 'Order schema validation result: {{input}}',
          },
        },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 760, y: 320 },
        data: { config: { path: 'backend/.runs/demo/order-validation-report.json', mode: 'json' } },
      },
    ],
    edges: [
      edge('e1', 'webhook_trigger-1', 'payload', 'json_extract-1', 'input'),
      edge('e2', 'json_extract-1', 'value', 'schema_validate-1', 'input'),
      edge('e3', 'schema_validate-1', 'result', 'notification-1', 'message'),
      edge('e4', 'schema_validate-1', 'result', 'file_sink-1', 'input'),
    ],
  },
  {
    id: 'support-ticket-triage',
    label: 'Support Ticket Triage',
    description: 'Webhook support ticket -> priority routing -> alert + queue file',
    nodes: [
      {
        id: 'webhook_trigger-1',
        type: 'webhook_trigger',
        position: { x: 80, y: 220 },
        data: {
          config: {
            path: '/hooks/support/ticket',
            method: 'POST',
            sample_payload: {
              ticket: {
                id: 'tkt-2209',
                customer: 'Acme Retail',
                issue: 'Payment service unavailable',
                severity: 5,
                channel: 'email',
              },
            },
          },
        },
      },
      {
        id: 'json_extract-1',
        type: 'json_extract',
        position: { x: 300, y: 220 },
        data: { config: { path: 'payload.ticket.severity', use_default: true, default: 1 } },
      },
      {
        id: 'filter-1',
        type: 'filter',
        position: { x: 500, y: 220 },
        data: { config: { field: '', operator: '>=', value: 4 } },
      },
      {
        id: 'notification-1',
        type: 'notification',
        position: { x: 740, y: 130 },
        data: {
          config: {
            channel: 'log',
            template: 'P1/P2 support ticket requires immediate attention. Severity={{input}}',
          },
        },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 740, y: 320 },
        data: { config: { path: 'backend/.runs/demo/support-triage-queue.json', mode: 'json' } },
      },
    ],
    edges: [
      edge('e1', 'webhook_trigger-1', 'payload', 'json_extract-1', 'input'),
      edge('e2', 'json_extract-1', 'value', 'filter-1', 'input'),
      edge('e3', 'filter-1', 'pass', 'notification-1', 'message'),
      edge('e4', 'filter-1', 'fail', 'file_sink-1', 'input'),
    ],
  },
  {
    id: 'finance-invoice-validation',
    label: 'Finance Invoice Validation',
    description: 'Invoice webhook -> schema check -> finance alert + compliance report',
    nodes: [
      {
        id: 'webhook_trigger-1',
        type: 'webhook_trigger',
        position: { x: 80, y: 220 },
        data: {
          config: {
            path: '/hooks/finance/invoice',
            method: 'POST',
            sample_payload: {
              invoice: {
                invoice_id: 'inv-1049',
                vendor: 'Northwind Services',
                amount: 1299.5,
                currency: 'USD',
                due_date: '2026-03-15',
              },
            },
          },
        },
      },
      {
        id: 'json_extract-1',
        type: 'json_extract',
        position: { x: 300, y: 220 },
        data: { config: { path: 'payload.invoice', use_default: true, default: {} } },
      },
      {
        id: 'schema_validate-1',
        type: 'schema_validate',
        position: { x: 520, y: 220 },
        data: {
          config: {
            schema_type: 'required_keys',
            required_keys: ['invoice_id', 'vendor', 'amount', 'currency', 'due_date'],
          },
        },
      },
      {
        id: 'notification-1',
        type: 'notification',
        position: { x: 760, y: 130 },
        data: {
          config: {
            channel: 'log',
            template: 'Invoice payload validation completed: {{input}}',
          },
        },
      },
      {
        id: 'file_sink-1',
        type: 'file_sink',
        position: { x: 760, y: 320 },
        data: { config: { path: 'backend/.runs/demo/invoice-validation-report.json', mode: 'json' } },
      },
    ],
    edges: [
      edge('e1', 'webhook_trigger-1', 'payload', 'json_extract-1', 'input'),
      edge('e2', 'json_extract-1', 'value', 'schema_validate-1', 'input'),
      edge('e3', 'schema_validate-1', 'result', 'notification-1', 'message'),
      edge('e4', 'schema_validate-1', 'result', 'file_sink-1', 'input'),
    ],
  },
];

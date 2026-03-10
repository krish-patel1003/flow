import json
import traceback
from pathlib import Path

payload = json.loads(Path('_transform_payload.json').read_text())
scope = {}
logs = []
try:
    exec(payload['script'], scope)
    fn = scope.get('transform')
    if not callable(fn):
        raise ValueError('Script must define transform(input_data)')
    output = fn(payload['input'])
    Path('_transform_result.json').write_text(json.dumps({'ok': True, 'output': output}))
except Exception as exc:
    Path('_transform_result.json').write_text(json.dumps({'ok': False, 'error': str(exc), 'traceback': traceback.format_exc()}))
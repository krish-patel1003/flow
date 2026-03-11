import json
import traceback
from pathlib import Path

payload = json.loads(Path('payload.json').read_text())
scope = {}
logs = []
try:
    exec(payload['script'], scope)
    fn = scope.get('transform')
    if not callable(fn):
        raise ValueError('Script must define transform(input_data)')
    output = fn(payload['input'])
    Path('result.json').write_text(json.dumps({'ok': True, 'output': output}))
except Exception as exc:
    Path('result.json').write_text(json.dumps({'ok': False, 'error': str(exc), 'traceback': traceback.format_exc()}))
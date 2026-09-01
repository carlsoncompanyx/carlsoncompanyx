#!/usr/bin/env bash
set -euo pipefail

echo "ltx25: mapping official LTX-2.5 model cache"
python -c 'from model_cache import prepare_models; import json; print("ltx25: mapped " + json.dumps(prepare_models(), sort_keys=True))'
echo "ltx25: using build-time official workflow preflight manifest"
python -c 'import json; p=json.load(open("/app/workflow_preflight.json")); assert p["preflight"]=="passed" and not p["missing_class_types"]; print("ltx25: preflight manifest verified")'
exec /start.sh

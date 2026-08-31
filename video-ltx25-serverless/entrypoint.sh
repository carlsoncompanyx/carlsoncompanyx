#!/usr/bin/env bash
set -euo pipefail

echo "ltx25: preparing cached LTX-2.5 model mapping"
python -c 'from model_cache import prepare_models; import json; print("ltx25: mapped " + json.dumps(prepare_models(), sort_keys=True))'
exec /start.sh


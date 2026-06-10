#!/usr/bin/env sh
set -eu

FILE_PATH="$1"
MODE="${2:-javascript}"

if [ "$MODE" = "typescript" ]; then
  ts-node "$FILE_PATH"
else
  node "$FILE_PATH"
fi

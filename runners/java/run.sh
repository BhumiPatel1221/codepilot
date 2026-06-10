#!/usr/bin/env sh
set -eu

FILE_PATH="$1"
WORKDIR="$(dirname "$FILE_PATH")"
CLASS_NAME="$(grep -Eo 'public[[:space:]]+class[[:space:]]+[A-Za-z_][A-Za-z0-9_]*' "$FILE_PATH" | awk '{print $3}' | head -n1)"

if [ -z "$CLASS_NAME" ]; then
  CLASS_NAME="$(basename "$FILE_PATH" .java)"
fi

javac "$FILE_PATH"
java -cp "$WORKDIR" "$CLASS_NAME"

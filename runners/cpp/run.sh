#!/usr/bin/env bash
set -euo pipefail

FILE_PATH="$1"
BIN_PATH="/tmp/a.out"

g++ "$FILE_PATH" -std=c++17 -O2 -o "$BIN_PATH"
"$BIN_PATH"

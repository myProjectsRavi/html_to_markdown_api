#!/usr/bin/env bash
set -euo pipefail
: "$RAPIDAPI_BASE_URL"
: "$RAPIDAPI_KEY"
: "$RAPIDAPI_HOST"
if [[ -z "$RAPIDAPI_BASE_URL" || -z "$RAPIDAPI_KEY" || -z "$RAPIDAPI_HOST" ]]; then
  printf '%s\n' "Set RAPIDAPI_BASE_URL, RAPIDAPI_KEY and RAPIDAPI_HOST" >&2
  exit 2
fi
endpoint="$1"
if [[ "$endpoint" != "markdown" && "$endpoint" != "text" ]]; then
  printf '%s\n' "Choose markdown or text" >&2
  exit 2
fi
curl --silent --show-error --fail-with-body --request POST \
  "$RAPIDAPI_BASE_URL/v1/html/$endpoint" \
  --header "X-RapidAPI-Key: $RAPIDAPI_KEY" \
  --header "X-RapidAPI-Host: $RAPIDAPI_HOST" \
  --header "Content-Type: application/json" \
  --data-binary '{"html":"<article><h1>Hello</h1><p>World</p></article>"}'
printf '\n'

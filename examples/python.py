#!/usr/bin/env python3
"""RapidAPI customer sample using only Python's standard library."""
import json
import os
import sys
import urllib.error
import urllib.request

base = os.environ.get("RAPIDAPI_BASE_URL", "")
key = os.environ.get("RAPIDAPI_KEY", "")
host = os.environ.get("RAPIDAPI_HOST", "")
endpoint = sys.argv[1] if len(sys.argv) > 1 else "markdown"
if not all((base, key, host)):
    sys.exit("Set RAPIDAPI_BASE_URL, RAPIDAPI_KEY and RAPIDAPI_HOST.")
if endpoint not in ("markdown", "text"):
    sys.exit("Choose markdown or text.")
body = json.dumps(
    {"html": "<article><h1>Hello</h1><p>World</p></article>"},
    separators=(",", ":"),
).encode("utf-8")
request = urllib.request.Request(
    base + "/v1/html/" + endpoint,
    data=body,
    headers={
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": host,
        "Content-Type": "application/json",
    },
    method="POST",
)
try:
    with urllib.request.urlopen(request, timeout=10) as response:
        result = json.load(response)
    print(json.dumps(result, ensure_ascii=False, separators=(",", ":")))
except urllib.error.HTTPError as error:
    sys.exit("HTTP " + str(error.code) + ": review error guidance.")
except urllib.error.URLError:
    sys.exit("Network failure: check configured RapidAPI endpoint.")

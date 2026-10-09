const base = process.env.RAPIDAPI_BASE_URL;
const key = process.env.RAPIDAPI_KEY;
const host = process.env.RAPIDAPI_HOST;
const endpoint = process.argv[2] ?? "markdown";

if (!base || !key || !host) {
  process.stderr.write("Set RAPIDAPI_BASE_URL, RAPIDAPI_KEY and RAPIDAPI_HOST.\n");
  process.exit(2);
}
if (endpoint !== "markdown" && endpoint !== "text") {
  process.stderr.write("Choose markdown or text.\n");
  process.exit(2);
}
try {
  const response = await fetch(base + "/v1/html/" + endpoint, {
    method: "POST",
    headers: {
      "X-RapidAPI-Key": key,
      "X-RapidAPI-Host": host,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ html: "<article><h1>Hello</h1><p>World</p></article>" }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    process.stderr.write("HTTP " + response.status + ": review error guidance.\n");
    process.exitCode = 1;
  } else {
    process.stdout.write(JSON.stringify(await response.json()) + "\n");
  }
} catch {
  process.stderr.write("Network failure: check configured RapidAPI endpoint.\n");
  process.exitCode = 1;
}

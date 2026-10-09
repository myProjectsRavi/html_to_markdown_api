import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const secret = "us038-synthetic-only-origin-credential";
const customerKey = "us038-synthetic-customer-key";
const customerHost = "us038-synthetic-gateway.local";
const env = {
  ...process.env,
  US038_TEST_PROXY_SECRET: secret,
  US038_TEST_CUSTOMER_KEY: customerKey,
  US038_TEST_CUSTOMER_HOST: customerHost,
  RAPIDAPI_BASE_URL: "http://127.0.0.1:8788",
  RAPIDAPI_KEY: customerKey,
  RAPIDAPI_HOST: customerHost,
};
const children = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function ready(url) {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(350) });
      if (response.ok) return;
    } catch { /* Wait for loopback listener. */ }
    if (children.some((child) => child.exitCode !== null)) break;
    await sleep(200);
  }
  throw new Error("Local synthetic service failed to start");
}
async function main() {
  for (const path of ["examples/curl.sh", "examples/fetch.mjs", "examples/python.py"]) {
    const source = readFileSync(path, "utf8");
    assert.ok(source.includes("RAPIDAPI_KEY") && source.includes("RAPIDAPI_HOST"));
    assert.ok(!source.includes("X-RapidAPI-Proxy-Secret"), "Customer samples must not forward origin secrets");
    assert.ok(!source.includes(secret), "Customer samples must not embed any origin credentials");
  }
  const worker = spawn("./node_modules/.bin/wrangler", [
    "dev", "--local", "--ip", "127.0.0.1", "--port", "8787",
    "--env=", "--var", "RAPIDAPI_PROXY_SECRET:" + secret,
  ], { env, stdio: ["ignore", "ignore", "pipe"] });
  children.push(worker);
  await ready("http://127.0.0.1:8787/health");
  const gateway = spawn(process.execPath, ["scripts/us038-local-gateway.mjs"], {
    env, stdio: ["ignore", "ignore", "pipe"],
  });
  children.push(gateway);
  await ready("http://127.0.0.1:8788/__smoke_ready");

  const expected = {
    markdown: { markdown: "# Hello\n\nWorld", stats: { input_bytes: 45, output_chars: 14 } },
    text: { text: "Hello\n\nWorld", stats: { input_bytes: 45, output_chars: 12 } },
  };
  const commands = [
    ["curl", "bash", ["examples/curl.sh"]],
    ["fetch", process.execPath, ["examples/fetch.mjs"]],
    ["python", "python3", ["examples/python.py"]],
  ];
  const checked = [];
  for (const [language, executable, args] of commands) {
    for (const endpoint of ["markdown", "text"]) {
      const result = spawnSync(executable, [...args, endpoint], {
        encoding: "utf8", env, timeout: 15_000,
      });
      assert.equal(result.status, 0, language + " " + endpoint + ": " + result.stderr);
      assert.deepEqual(JSON.parse(result.stdout), expected[endpoint]);
      assert.ok(!result.stdout.includes(secret));
      checked.push({ language, endpoint, status: 200, output: expected[endpoint] });
    }
  }
  const direct = await fetch("http://127.0.0.1:8787/v1/html/markdown", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ html: "<p>test</p>" }),
  });
  assert.equal(direct.status, 403, "Direct origin must reject missing secret");
  const wrong = await fetch("http://127.0.0.1:8788/v1/html/markdown", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-RapidAPI-Key": "invalid", "X-RapidAPI-Host": customerHost },
    body: JSON.stringify({ html: "<p>test</p>" }),
  });
  assert.equal(wrong.status, 403, "Synthetic gateway must reject wrong customer key");
  const good = await fetch("http://127.0.0.1:8788/v1/html/text", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-RapidAPI-Key": customerKey, "X-RapidAPI-Host": customerHost },
    body: JSON.stringify({ html: "<p>😊</p>" }),
  });
  assert.equal(good.status, 200);
  assert.equal(good.headers.get("cache-control"), "no-store");
  assert.deepEqual(await good.json(), { text: "😊", stats: { input_bytes: 11, output_chars: 1 } });
  const invalid = await fetch("http://127.0.0.1:8788/v1/html/text", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-RapidAPI-Key": customerKey, "X-RapidAPI-Host": customerHost },
    body: JSON.stringify({ html: null }),
  });
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), {
    error: { code: "invalid_request", message: "Request does not match the supported schema." },
  });
  process.stdout.write("US038_EXAMPLE_RESULTS=" + JSON.stringify({
    cases: checked, direct_origin_without_secret: 403, gateway_wrong_customer_key: 403,
    unicode: { status: 200, input_bytes: 11, output_chars: 1 },
    invalid_request_status: 400, cache_control: "no-store", mode: "loopback-synthetic",
  }) + "\n");
}
try {
  await main();
} finally {
  for (const child of children.reverse()) {
    if (child.exitCode === null) child.kill("SIGTERM");
  }
}

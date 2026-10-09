import { createServer } from "node:http";

const origin = "http://127.0.0.1:8787";
const secret = process.env.US038_TEST_PROXY_SECRET;
const key = process.env.US038_TEST_CUSTOMER_KEY;
const host = process.env.US038_TEST_CUSTOMER_HOST;
if (!secret || !key || !host) process.exit(2);

createServer(async (request, response) => {
  if (request.url === "/__smoke_ready") {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end('{"ready":true}');
    return;
  }
  if (request.headers["x-rapidapi-key"] !== key || request.headers["x-rapidapi-host"] !== host) {
    response.writeHead(403, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    response.end('{"error":{"code":"forbidden","message":"Request is not authorized."}}');
    return;
  }
  try {
    const chunks = [];
    let length = 0;
    for await (const chunk of request) {
      length += chunk.length;
      if (length > 800_000) {
        response.writeHead(413);
        response.end();
        return;
      }
      chunks.push(chunk);
    }
    const upstream = await fetch(origin + request.url, {
      method: request.method,
      headers: {
        "Content-Type": request.headers["content-type"] || "application/json",
        "X-RapidAPI-Proxy-Secret": secret,
      },
      body: request.method === "GET" ? undefined : Buffer.concat(chunks),
      signal: AbortSignal.timeout(10_000),
    });
    response.writeHead(upstream.status, {
      "Content-Type": upstream.headers.get("content-type") || "application/json",
      "Cache-Control": upstream.headers.get("cache-control") || "no-store",
      "X-Content-Type-Options": upstream.headers.get("x-content-type-options") || "nosniff",
    });
    response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    response.writeHead(503, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    response.end('{"error":{"code":"service_unavailable","message":"Service configuration is unavailable."}}');
  }
}).listen(8788, "127.0.0.1");

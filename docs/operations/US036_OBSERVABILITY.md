# US036 Privacy-Safe Operational Visibility

Snapshot date: 2026-10-07

## Production policy

Cloudflare documents Workers observability/log persistence as enabled by default for newly created Workers unless configuration says otherwise. Production therefore sets `observability.enabled: false` explicitly in `wrangler.jsonc`.

The Worker contains no application `console.log/info/warn/error/debug` calls, no external telemetry client, no analytics database and no payload persistence. Request HTML, converted output, proxy secrets and query values are not intentionally written to application logs.

Official references:
- https://developers.cloudflare.com/workers/observability/logs/workers-logs/
- https://developers.cloudflare.com/workers/wrangler/configuration/

## Staging-only synthetic visibility

The `staging` environment explicitly enables Workers observability at `head_sampling_rate: 1`. It is for synthetic validation only. No customer payload should be routed to staging while log persistence is enabled.

Staging validation procedure:

1. deploy the exact candidate to the named staging environment only when a later deployment story authorizes it;
2. send only synthetic corpus requests;
3. read CPU/resource data from Cloudflare platform telemetry, not JavaScript wall-clock duration;
4. search staging logs for synthetic payload/query/secret canaries;
5. retain only aggregate route/status/CPU observations in release evidence;
6. disable/delete staging log retention after the measurement according to the platform settings used for that run.

No staging deployment occurs in US036, so platform CPU remains unavailable rather than estimated.

## Aggregate operational categories

No custom per-request event is emitted. Built-in aggregate HTTP status can distinguish the required operational classes without retaining submitted content:

| Status | Operational class |
| --- | --- |
| 200 | success |
| 400, 415 | validation |
| 403 | origin authentication |
| 404, 405 | routing/method |
| 413, 422 | input/resource guard |
| 500 | internal failure |
| 503 | configuration/resource unavailable |

## Canary evidence

`tests/observability.test.ts` verifies zero application console calls for success, validation and injected internal-error canaries, including HTML, output, query and proxy-secret markers. It also replaces console methods with throwing functions and proves conversion still succeeds because no logger is invoked.

`scripts/validate-observability.mjs` enforces production logs off, staging-only logs on, no external telemetry configuration and zero production console logging in `src`.

## Platform-owned visibility

This repository does not claim control over all retention or diagnostic systems operated by Cloudflare, RapidAPI, network providers or other infrastructure. Production code and declared Worker configuration are the controlled boundary.

## Conclusion

Production is explicitly configured for no persisted Workers Logs and no application logging. Staging provides a synthetic-only platform-observability path for later CPU validation. No external telemetry sink or payload store is introduced.

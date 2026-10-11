# US035 Free Account Capacity Envelope

Snapshot date: 2026-10-07

## Verified external limits

The current Cloudflare Workers Free account limit is 100,000 requests per day across the account, with 10 ms CPU time per invocation and 128 MB memory per isolate. This is an account-level capacity constraint, not a per-API allowance.

RapidAPI currently supports request quotas by day or month, hard limits that stop additional calls after the quota is exhausted, and per-plan rate limits expressed as requests per second, minute, or hour. Its documented default quota behavior does not increment usage for HTTP 5xx responses; therefore capacity planning must not assume that 4xx validation/authentication responses are free.

Official references, retrieved 2026-10-07:
- Cloudflare Workers Limits: https://developers.cloudflare.com/workers/platform/limits/
- RapidAPI Hub Listing - Monetize: https://docs.rapidapi.com/docs/hub-listing-monetize-tab
- RapidAPI Rate Limiting: https://docs.rapidapi.com/v1.0/docs/rate-limiting

## Account-wide accounting rule

Every request that reaches this Worker consumes one Cloudflare Worker request from the shared daily account limit, including valid conversions, health checks, staging traffic, direct-origin authentication failures and other rejected requests. RapidAPI quota behavior is a separate marketplace control and must not be confused with Cloudflare infrastructure capacity.

The launch equation is:

`available = 100000 - other_workers - staging - health_checks - expected_customer_requests - rejected_or_unauthenticated_requests - safety_reserve`

The API's candidate reserve is 20,000 requests/day and the separate safety reserve is 10,000 requests/day. These are planning placeholders, not enabled marketplace settings and not evidence that the account has 30,000 requests/day available.

## Missing authorized aggregate data

This GitHub engineering run has no authoritative account-wide Cloudflare usage feed. Therefore the following inputs remain deliberately null in the machine-readable worksheet:

- other Workers' daily commitments/usage;
- staging daily traffic;
- health-check frequency;
- expected customer daily traffic;
- rejected/direct-origin traffic.

Because those inputs are unknown, the computed available capacity is also null. Paid launch is **BLOCKED_PENDING_ACCOUNT_WIDE_USAGE**. This is intentional compliance with the blueprint boundary: no unused capacity is fabricated.

## Monthly-plan burst conversion

Monthly quotas can be consumed unevenly. The worksheet records both 30-day average demand and the conservative worst case where a subscriber consumes the entire monthly allowance in one day unless a separate RapidAPI rate limit prevents it.

| Planning scenario | Monthly requests | 30-day average/day | Worst single day without tighter rate control |
| --- | ---: | ---: | ---: |
| candidate-1 | 1,000 | 33.34 | 1,000 |
| candidate-2 | 10,000 | 333.34 | 10,000 |
| candidate-3 | 30,000 | 1,000.00 | 30,000 |
| candidate-4 | 60,000 | 2,000.00 | 60,000 |

These are stress-test scenarios only. They are not published plans, prices, subscriber counts, or claims about existing demand.

## Burst decision

Until the unknown account-wide inputs are populated, no paid plan whose worst-case burst could consume an unverified portion of the 100,000/day shared allowance is approved. When usage is available, the operator must:

1. populate all account-wide commitments with dated aggregate values;
2. recompute remaining capacity after the safety reserve;
3. select RapidAPI hard quotas and per-plan rate limits whose simultaneous worst-case demand fits that remaining capacity;
4. include rejected/direct-origin traffic in the Cloudflare budget;
5. re-run `npm run test:capacity` before changing the launch decision.

A monthly quota alone is not treated as burst protection.

## CPU boundary

US033/US034 Node wall-clock timings are not used to claim compliance with Cloudflare's 10 ms CPU limit. CPU eligibility must be validated from Cloudflare platform telemetry in staging. US036 owns the privacy-safe observability configuration for that later measurement.

## Conclusion

The capacity model, marketplace controls, burst arithmetic and launch gate are defined and machine validated. The API remains blocked from paid launch until real account-wide aggregate usage/commitment inputs are supplied.

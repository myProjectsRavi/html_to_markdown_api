# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E08 Performance and release evidence
- Current Feature: F18 Capacity and observability
- Current Story: US035 Define the free account capacity envelope
- Phase: IN_PROGRESS
- Completed US033: DONE, tested SHA `be2405909ddbfec0c6af04d6f698296cfe41336a`.
- Completed US034: DONE, tested SHA `5b0c5bdd1fda6c7c667aa6ee8149638abc214db8`, after benchmark run `37640854298` / artifact `11491772775`.
- US034 measured result: link-heavy 128 KiB Markdown serialization p95 reduced from 10.1429/10.2277/10.0969 ms to 8.2600/9.5775/9.1488 ms without changing the 128 KiB release ceiling.
- Exact next action: claim US035 separately, use current official Cloudflare and RapidAPI quota/rate-control references, build a sanitized account-wide capacity worksheet, and block paid launch where account-wide usage inputs are unavailable rather than assuming unused capacity.

- US035 capacity checkpoint: current official Cloudflare free account limit recorded as 100,000 requests/day, 10 ms CPU/invocation and 128 MB memory; current RapidAPI hard quota and second/minute/hour rate controls recorded.
- Account-wide existing Worker usage is unavailable to this GitHub-only run, so all unknown commitments remain null and paid launch is explicitly blocked rather than assuming spare capacity.

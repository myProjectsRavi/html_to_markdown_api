# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E07 Verification, security and CI hardening
- Current Feature: F15 Regression and fuzz verification
- Current Story: US030 Add reproducible property and fuzz tests
- Phase: IN_PROGRESS
- Prerequisite US029: DONE, tested SHA `bddd65015e675d334df50cb988cc55f82b55df90`.
- Completed planning: deterministic generator v1 is defined for tags, entities, URLs, whitespace and nesting; target campaign is seeds 1-10000 with per-case HTML <=4096 UTF-8 bytes and grammar depth <=4.
- Intended acceptance checks: repeat determinism, documented status mapping, factual input/output counters, removed-subtree canaries, saved replay seed 4242, and a runtime network trap.
- Blocker history: direct large-file composition hit connector-isolate decoder limitations; the subsequent native Git blob/tree write attempt was rejected with InvalidActionArguments before any branch feature file commit was confirmed.
- Durable branch checkpoint: no US030 feature/test file is claimed committed by this failed write attempt. Branch HEAD at recovery start was `747c15a0e2e12c34570d58214bc27d21d6800ff0`, a lock-only claim commit.
- Exact next action: release the current lease, reclaim US030 from the released head, and write the property campaign using a validated smaller GitHub contents-API path. Then run authoritative Actions and diagnose any failing seed inside US030.

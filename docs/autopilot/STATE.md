# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E03 Parser and normalization
- Current Feature: F05 Parser selection and bounded adapter
- Current Story: US009 Select a parser with measured evidence
- Phase: IN_PROGRESS
- Pre-story checkpoint: `c5f0b37adae998af24e67cedc0c1023a93b6addb`
- Earlier automation work: claim/reclaim commits `520faccc162f892364114d50fa38c8e7d66f0037` and `85674a637d1c35f3f2010af91ec4dbe8bf2a63b3`; preliminary Node-only spike `e9b1bd9504f90036dc84283312707cafba87d816` passed generic CI but did not yet satisfy the workerd, bundle-size, license/advisory, decision-record, or durable-state requirements.
- Recovery lock claim: `25d1a34642245a4c330ab1062352d4922e6c4102`.
- Implementation/tested code SHA: pending authoritative US009 evidence run.
- Completed recovery work: upgraded parse5 candidate measurement to 8.0.1; expanded 1/16/64/128 KiB Node measurements; preserved entity/malformed/deep/huge-attribute/early-stop probes; added a workerd candidate test; added independent Worker dry-run bundles; added exact-version license output and an npm audit over the exact candidate graphs.
- Remaining criteria: obtain authoritative US009 workflow output; review performance/bundle/semantics/security evidence; select one parser in `docs/decisions/parser.md`; preserve measured results; update evidence/backlog; release lock.
- Blocker category: none.
- Blocker: none.
- Exact next action: inspect the US009 Parser Selection Evidence workflow for this checkpoint and fix any same-story failure. If green, record the actual measurements and select the candidate with enforceable early stop and acceptable Worker bundle/runtime behavior.

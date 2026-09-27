# Validation ledger

Blueprint: HTML to Markdown and Clean Text API Implementation Blueprint v1.0, 27 September 2026.

## US001 - Establish the repository and checkpoint ledger

- Environment: ChatGPT sandbox + connected GitHub repository.
- Repository: `myProjectsRavi/html_to_markdown_api` (public).
- Allowed branch: `autopilot/html-markdown-v1`.
- Approved starting `main` SHA: `51497790a365b9465e35bb8dd2b06adb4ac38d4c`.
- Implementation/tested code SHA: `51649e95d3ada3264eda5b3dc7916f4fea0d6070`.
- Remote branch verification: branch HEAD observed at the implementation SHA; its ancestry begins at the approved starting `main` SHA.
- Branch comparison: ahead by 2, behind by 0 at implementation validation. Changed paths were only `.gitignore`, `README.md`, `package.json`, `docs/autopilot/*`, and `scripts/check-state*.mjs`.
- CI status at the implementation SHA: no status checks existed yet. US001 does not infer a CI pass from that absence.
- Sandbox runtime: Node `v22.16.0`; npm `10.9.2`.
- Command: `npm run check:state`.
- Result: exit 0. Validator selected `US001 (VALIDATING)` from the implementation checkpoint; negative tests passed for missing story, dependency cycle, and DONE without evidence. A first completion-state rehearsal exposed that two negative-test expectations were tied to US001 being unfinished; the test was corrected in the same story and the exact repaired SHA was retested successfully.
- Remote-content provenance: every intended implementation file was matched to the exact Git blob SHA of remote tree `4051ee75133181f9bb3c7454bbec32309e083549` before the sandbox run.
- Clean-checkout limitation: direct `git clone` from the sandbox failed because sandbox DNS could not resolve `github.com`. To avoid fabricating a clone result, validation used a fresh clean directory materialized from the exact remote-matched file bytes; the full state command passed there. GitHub connector reads independently verified branch HEAD, ancestry, tree, and diff.
- Conclusion: US001 acceptance criteria are satisfied for the recorded implementation SHA within the observed scope.

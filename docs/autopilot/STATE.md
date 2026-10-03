# Autopilot state

- Blueprint: v1.0, 27 September 2026
- Target repository: `myProjectsRavi/html_to_markdown_api`
- Allowed implementation branch: `autopilot/html-markdown-v1`
- Approved starting revision (`main`): `51497790a365b9465e35bb8dd2b06adb4ac38d4c`
- Current Epic: E05 Links, images and tables
- Current Feature: F10 Link and image target safety
- Current Story: US020 Serialize Markdown links safely
- Phase: VALIDATING
- Prerequisite US019: DONE, tested SHA `97b1101bcd2dc4ec9c23f67e054e680ad5134bdd`.
- Serializer checkpoint: `65839438fb9f44403447d147553a29fd744200fa`.
- Renderer integration checkpoint: `8305da676ad4c41c37ea7b83f918329e91a8e990`.
- Acceptance-suite checkpoint: `4bda585eb44ff5dbfb408483d3920021d7aaf226`.
- Validation wiring checkpoint: `dc8bd6f41e812314d859596a6960aa992307baa2`.
- Validation status: initial exact-head run `37109079516` failed at TypeScript checking because three legacy `.map(inlineText)` callbacks became incompatible after US020 added a boolean context parameter. Those call sites are now explicit lambdas; authoritative revalidation pending.
- Exact next action: inspect repaired released-head CI, diagnose any remaining failure inside US020, and finalize only after PASS.

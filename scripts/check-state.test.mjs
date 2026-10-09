#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const source = JSON.parse(fs.readFileSync('docs/autopilot/BACKLOG.json', 'utf8'));
const script = path.resolve('scripts/check-state.mjs');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'html-md-state-'));

function runCase(name, mutate, expectedExit, expectedText) {
  const value = structuredClone(source);
  mutate(value);
  const target = path.join(tmp, `${name}.json`);
  fs.writeFileSync(target, JSON.stringify(value));
  const result = spawnSync(process.execPath, [script, target], { encoding: 'utf8' });
  const output = `${result.stdout}${result.stderr}`;
  if (result.status !== expectedExit || !output.includes(expectedText)) {
    console.error(`${name}: expected exit ${expectedExit} containing ${expectedText}\n${output}`);
    process.exit(1);
  }
  console.log(`PASS ${name}`);
}

runCase('initial', _ => {}, 0, 'STATE_OK:');
runCase('missing-id', value => { value.stories = value.stories.filter(s => s.id !== 'US044'); }, 1, 'expected 44 stories');
runCase('cycle', value => { value.stories.find(s => s.id === 'US001').depends_on = ['US044']; }, 1, 'dependency cycle');
runCase('done-without-evidence', value => { const s=value.stories.find(s=>s.id==='US001'); s.status='DONE'; s.tested_code_sha=null; s.evidence_path=null; s.blocker=null; s.blocked_from=null; }, 1, 'DONE requires tested_code_sha and evidence_path');

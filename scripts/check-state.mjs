#!/usr/bin/env node
import fs from 'node:fs';

const file = process.argv[2] ?? 'docs/autopilot/BACKLOG.json';
const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);

function fail(message) {
  console.error(`STATE_INVALID: ${message}`);
  process.exit(1);
}

if (data.schema_version !== 1) fail('schema_version must be 1');
if (typeof data.blueprint_version !== 'string' || !data.blueprint_version) fail('blueprint_version is required');
if (!Array.isArray(data.stories)) fail('stories must be an array');
if (data.stories.length !== 44) fail(`expected 44 stories, found ${data.stories.length}`);

const allowed = new Set(['TODO', 'IN_PROGRESS', 'VALIDATING', 'DONE', 'BLOCKED']);
const expected = Array.from({ length: 44 }, (_, i) => `US${String(i + 1).padStart(3, '0')}`);
const byId = new Map();

for (const story of data.stories) {
  if (!story || typeof story !== 'object') fail('each story must be an object');
  if (byId.has(story.id)) fail(`duplicate story id ${story.id}`);
  byId.set(story.id, story);
  if (!allowed.has(story.status)) fail(`${story.id}: invalid status ${story.status}`);
  if (!Array.isArray(story.depends_on)) fail(`${story.id}: depends_on must be an array`);
  if (story.status === 'DONE' && (!story.tested_code_sha || !story.evidence_path)) {
    fail(`${story.id}: DONE requires tested_code_sha and evidence_path`);
  }
  if (story.status === 'BLOCKED' && (!story.blocker || !story.blocker.category || !story.blocker.message)) {
    fail(`${story.id}: BLOCKED requires blocker category and message`);
  }
}

for (const id of expected) if (!byId.has(id)) fail(`missing required story ${id}`);
for (const id of byId.keys()) if (!expected.includes(id)) fail(`unknown story id ${id}`);

for (const story of data.stories) {
  for (const dep of story.depends_on) if (!byId.has(dep)) fail(`${story.id}: unknown dependency ${dep}`);
}

const visiting = new Set();
const visited = new Set();
function visit(id) {
  if (visiting.has(id)) fail(`dependency cycle detected at ${id}`);
  if (visited.has(id)) return;
  visiting.add(id);
  for (const dep of byId.get(id).depends_on) visit(dep);
  visiting.delete(id);
  visited.add(id);
}
for (const id of expected) visit(id);

const active = data.stories.find(s => ['IN_PROGRESS', 'VALIDATING', 'BLOCKED'].includes(s.status));
let next = active ?? data.stories.find(s => s.status === 'TODO' && s.depends_on.every(d => byId.get(d).status === 'DONE'));
if (!next && data.stories.every(s => s.status === 'DONE')) {
  console.log('STATE_OK: all 44 stories DONE');
} else if (!next) {
  fail('no eligible next story and delivery is not complete');
} else {
  console.log(`STATE_OK: next story ${next.id} (${next.status}) - ${next.title}`);
}

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { loadData } from '../src/lib/data';
import { PeopleSchema } from '../src/lib/schemas';

test('loadData reports file and field on invalid data', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'naraol-'));
  writeFileSync(join(tmp, 'people.yaml'), '- name: 홍길동\n', 'utf8');
  expect(() => loadData('people.yaml', PeopleSchema, tmp)).toThrow(/people\.yaml: .*role/);
});

test('loadData accepts an empty list file', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'naraol-'));
  writeFileSync(join(tmp, 'people.yaml'), '[]\n', 'utf8');
  expect(loadData('people.yaml', PeopleSchema, tmp)).toEqual([]);
});

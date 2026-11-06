import { expect, test } from 'vitest';
import { firstYear } from '../src/lib/stats';

test('firstYear returns the earliest year with items', () => {
  expect(firstYear([{ year: 2010, items: [{ title: 'a' }] }, { year: 2002, items: [{ title: 'b' }] }, { year: 1999, items: [] }])).toBe(2002);
});

test('firstYear is undefined for empty history', () => {
  expect(firstYear([])).toBeUndefined();
});

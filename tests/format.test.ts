import { expect, test } from 'vitest';
import { formatDate } from '../src/lib/format';

test('formats full date', () => {
  expect(formatDate('2025-11-07')).toBe('2025. 11. 7.');
});

test('formats year-month', () => {
  expect(formatDate('2025-11')).toBe('2025. 11.');
});

test('formats year only', () => {
  expect(formatDate('2025')).toBe('2025');
});

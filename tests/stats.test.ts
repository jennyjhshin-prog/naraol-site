import { expect, test } from 'vitest';
import { homeStats, recentHistory } from '../src/lib/stats';
import type { Conference, Lecture, Org } from '../src/lib/schemas';

const org = { heritage: '국가민속문화재 제266호 경산상엿집', founded: '2008-03-01' } as Org;
const now = new Date('2026-11-06T12:00');

test('computes stats from data', () => {
  const s = homeStats({ org, conferences: [{ no: 11 }, { no: 12 }] as Conference[], lectures: [{ no: 170 }] as Lecture[] }, now);
  expect(s.map((x) => [x.value, x.label])).toEqual([
    [18, '설립 이후'],
    [12, '국제학술대회'],
    [170, '인문학강좌'],
    ['제266호', '국가민속문화재 제266호 경산상엿집'],
  ]);
});

test('omits stats whose source is empty', () => {
  const s = homeStats({ org, conferences: [], lectures: [] }, now);
  expect(s.map((x) => x.label)).toEqual(['설립 이후', '국가민속문화재 제266호 경산상엿집']);
});

test('omits years-since-founding without founded', () => {
  const s = homeStats({ org: { ...org, founded: undefined }, conferences: [], lectures: [] }, now);
  expect(s).toHaveLength(1);
});

test('recentHistory sorts years descending', () => {
  const h = [2022, 2024, 2021, 2023].map((year) => ({ year, items: [{ title: `${year}` }] }));
  expect(recentHistory(h).map((y) => y.year)).toEqual([2024, 2023, 2022]);
});

test('recentHistory skips empty years', () => {
  expect(recentHistory([{ year: 2025, items: [] }, { year: 2024, items: [{ title: 'a' }] }]).map((y) => y.year)).toEqual([2024]);
});

import type { Conference, History, HistoryYear, Lecture, Org } from './schemas';

export type Stat = { value: number | string; unit: string; label: string };

const maxNo = (rows: { no: number }[]) => Math.max(...rows.map((r) => r.no));

/** 홈 "숫자로 보는 나라얼". 근거 데이터가 비면 그 칸은 뺀다. */
export function homeStats(input: { org: Org; conferences: Conference[]; lectures: Lecture[] }, now: Date): Stat[] {
  const { org, conferences, lectures } = input;
  const stats: Stat[] = [];
  if (org.founded) {
    stats.push({ value: now.getFullYear() - Number(org.founded.slice(0, 4)), unit: '년', label: '설립 이후' });
  }
  if (conferences.length) stats.push({ value: maxNo(conferences), unit: '회', label: '국제학술대회' });
  if (lectures.length) stats.push({ value: maxNo(lectures), unit: '회', label: '인문학강좌' });
  stats.push({ value: '제266호', unit: '', label: org.heritage });
  return stats;
}

/** 항목이 있는 연도만 최신순으로 n개. */
export function recentHistory(history: History, n = 3): HistoryYear[] {
  return history
    .filter((y) => y.items.length > 0)
    .sort((a, b) => b.year - a.year)
    .slice(0, n);
}

/** 항목이 있는 연도 중 가장 이른 해. 없으면 undefined. */
export function firstYear(history: History): number | undefined {
  const years = history.filter((y) => y.items.length > 0).map((y) => y.year);
  return years.length ? Math.min(...years) : undefined;
}

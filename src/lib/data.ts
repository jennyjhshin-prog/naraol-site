import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { load } from 'js-yaml';
import type { ZodType } from 'astro/zod';
import {
  AcademySchema,
  BooksSchema,
  ConferencesSchema,
  HistorySchema,
  LecturesSchema,
  OrgSchema,
  PeopleSchema,
} from './schemas';

/** YAML 파일을 읽어 스키마로 검증한다. 실패하면 `파일: 경로 메시지`로 throw. */
export function loadData<T>(file: string, schema: ZodType<T>, dir = 'src/data'): T {
  const raw = load(readFileSync(join(dir, file), 'utf8')) ?? [];
  const result = schema.safeParse(raw);
  if (!result.success) {
    const msg = result.error.issues
      .map((i) => `${i.path.length ? i.path.join('.') : '(root)'} ${i.message}`)
      .join('; ');
    throw new Error(`${file}: ${msg}`);
  }
  return result.data;
}

export const org = loadData('org.yaml', OrgSchema);
export const history = loadData('history.yaml', HistorySchema);
export const conferences = loadData('conferences.yaml', ConferencesSchema);
export const lectures = loadData('lectures.yaml', LecturesSchema);
export const people = loadData('people.yaml', PeopleSchema);
export const academy = loadData('academy.yaml', AcademySchema);
export const books = loadData('books.yaml', BooksSchema);

import { z } from 'astro/zod';

const isoDate = z.string().regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'YYYY, YYYY-MM 또는 YYYY-MM-DD 형식이어야 합니다');

export const OrgSchema = z.object({
  name: z.string(),
  founded: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD 형식이어야 합니다').optional(),
  registeredBy: z.string().optional(),
  regNo: z.string().optional(),
  representative: z.string().optional(),
  donationDesignated: z.string().optional(),
  address: z.string(),
  phone: z.string(),
  cafeUrl: z.string().url().optional(),
  kakaoUrl: z.string().url(),
  bank: z.object({ name: z.string(), account: z.string(), holder: z.string() }),
  dues: z.array(z.object({ label: z.string(), amount: z.number() })),
  heritage: z.string(),
});
export type Org = z.infer<typeof OrgSchema>;

export const HistoryKinds = ['founding', 'conference', 'lecture', 'academy', 'culture', 'award', 'etc'] as const;
export const HistoryYearSchema = z.object({
  year: z.number().int(),
  items: z.array(
    z.object({
      date: isoDate.optional(),
      title: z.string(),
      kind: z.enum(HistoryKinds).optional(),
    }),
  ),
});
export const HistorySchema = z.array(HistoryYearSchema);
export type HistoryYear = z.infer<typeof HistoryYearSchema>;
export type History = z.infer<typeof HistorySchema>;

export const ConferenceSchema = z.object({
  no: z.number().int(),
  year: z.number().int(),
  date: isoDate.optional(),
  title: z.string(),
  theme: z.string().optional(),
  venue: z.string(),
  hosts: z.array(z.string()),
  photo: z.string().optional(),
  pressUrl: z.string().url().optional(),
});
export const ConferencesSchema = z.array(ConferenceSchema);
export type Conference = z.infer<typeof ConferenceSchema>;

export const LectureSchema = z.object({
  no: z.number().int(),
  date: isoDate,
  speaker: z.string().optional(),
  affiliation: z.string().optional(),
  topic: z.string(),
});
export const LecturesSchema = z.array(LectureSchema);
export type Lecture = z.infer<typeof LectureSchema>;

export const PersonSchema = z.object({
  name: z.string(),
  role: z.string(),
  bio: z.array(z.string()),
});
export const PeopleSchema = z.array(PersonSchema);
export type Person = z.infer<typeof PersonSchema>;

export const AcademySchema = z.object({
  courses: z.array(z.object({ name: z.string(), teacher: z.string(), bio: z.string() })),
  terms: z.array(z.object({ title: z.string(), period: z.string(), items: z.array(z.string()) })),
});
export type Academy = z.infer<typeof AcademySchema>;

export const BookSchema = z.object({
  title: z.string(),
  author: z.string(),
  publisher: z.string(),
  note: z.string().optional(),
  cover: z.string().optional(),
});
export const BooksSchema = z.array(BookSchema);
export type Book = z.infer<typeof BookSchema>;

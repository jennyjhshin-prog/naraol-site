import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const press = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/press' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      outlet: z.string(),
      date: z.coerce.date(),
      url: z.string().url().optional(),
      thumbnail: image().optional(),
    }),
});

const photos = defineCollection({
  loader: glob({
    pattern: '*/index.md',
    base: './src/content/photos',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      cover: image(),
    }),
});

export const collections = { press, photos };

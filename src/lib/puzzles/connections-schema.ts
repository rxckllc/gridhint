import { z } from 'zod';

export const DifficultySchema = z.enum(['yellow', 'green', 'blue', 'purple']);

export const ConnectionsGroupSchema = z.object({
  difficulty: DifficultySchema,
  category: z.string().min(1),
  words: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.string().min(1)]),
  hint1: z.string().min(1).max(140),
  hint2: z.string().min(1).max(140),
  hint3: z.string().min(1).max(140),
});

export const ConnectionsPuzzleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  status: z.literal('published'),
  sourceMode: z.enum(['nyt-api-v2', 'manual_seed', 'fallback_eyefyre', 'fallback_last_good']),
  grid: z.array(z.string().min(1)).length(16),
  groups: z.array(ConnectionsGroupSchema).length(4),
  updatedAt: z.string().datetime(),
});

export const ConnectionsManifestSchema = z.object({
  latest: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  updatedAt: z.string().datetime(),
});

export type Difficulty = z.infer<typeof DifficultySchema>;
export type ConnectionsPuzzle = z.infer<typeof ConnectionsPuzzleSchema>;
export type ConnectionsGroup = z.infer<typeof ConnectionsGroupSchema>;
export type ConnectionsManifest = z.infer<typeof ConnectionsManifestSchema>;

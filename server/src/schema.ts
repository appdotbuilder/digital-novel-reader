
import { z } from 'zod';

// User schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  username: z.string(),
  password_hash: z.string(),
  is_admin: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Author schema
export const authorSchema = z.object({
  id: z.number(),
  name: z.string(),
  bio: z.string().nullable(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Author = z.infer<typeof authorSchema>;

// Genre schema
export const genreSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Genre = z.infer<typeof genreSchema>;

// Novel status enum
export const novelStatusSchema = z.enum(['ongoing', 'completed', 'hiatus', 'draft']);
export type NovelStatus = z.infer<typeof novelStatusSchema>;

// Novel schema
export const novelSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  author_id: z.number(),
  cover_image_url: z.string().nullable(),
  status: novelStatusSchema,
  is_featured: z.boolean(),
  total_chapters: z.number().int(),
  total_views: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Novel = z.infer<typeof novelSchema>;

// Chapter schema
export const chapterSchema = z.object({
  id: z.number(),
  novel_id: z.number(),
  title: z.string(),
  content: z.string(),
  chapter_number: z.number().int(),
  is_published: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Chapter = z.infer<typeof chapterSchema>;

// Novel Genre junction schema
export const novelGenreSchema = z.object({
  novel_id: z.number(),
  genre_id: z.number()
});

export type NovelGenre = z.infer<typeof novelGenreSchema>;

// Reading history schema
export const readingHistorySchema = z.object({
  id: z.number(),
  user_id: z.number(),
  novel_id: z.number(),
  chapter_id: z.number(),
  progress_percentage: z.number(),
  last_read_at: z.coerce.date()
});

export type ReadingHistory = z.infer<typeof readingHistorySchema>;

// Ad placement schema
export const adPlacementSchema = z.object({
  id: z.number(),
  name: z.string(),
  placement_type: z.enum(['banner', 'interstitial', 'native']),
  ad_script: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type AdPlacement = z.infer<typeof adPlacementSchema>;

// Input schemas for creating
export const createUserInputSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  is_admin: z.boolean().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createAuthorInputSchema = z.object({
  name: z.string().min(1),
  bio: z.string().nullable().optional(),
  image_url: z.string().nullable().optional()
});

export type CreateAuthorInput = z.infer<typeof createAuthorInputSchema>;

export const createGenreInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional()
});

export type CreateGenreInput = z.infer<typeof createGenreInputSchema>;

export const createNovelInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  author_id: z.number(),
  cover_image_url: z.string().nullable().optional(),
  status: novelStatusSchema,
  is_featured: z.boolean().optional(),
  genre_ids: z.array(z.number()).optional()
});

export type CreateNovelInput = z.infer<typeof createNovelInputSchema>;

export const createChapterInputSchema = z.object({
  novel_id: z.number(),
  title: z.string().min(1),
  content: z.string().min(1),
  chapter_number: z.number().int().positive(),
  is_published: z.boolean().optional()
});

export type CreateChapterInput = z.infer<typeof createChapterInputSchema>;

export const createAdPlacementInputSchema = z.object({
  name: z.string().min(1),
  placement_type: z.enum(['banner', 'interstitial', 'native']),
  ad_script: z.string().min(1),
  is_active: z.boolean().optional()
});

export type CreateAdPlacementInput = z.infer<typeof createAdPlacementInputSchema>;

// Input schemas for updating
export const updateUserInputSchema = z.object({
  id: z.number(),
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  is_admin: z.boolean().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const updateAuthorInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  bio: z.string().nullable().optional(),
  image_url: z.string().nullable().optional()
});

export type UpdateAuthorInput = z.infer<typeof updateAuthorInputSchema>;

export const updateGenreInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateGenreInput = z.infer<typeof updateGenreInputSchema>;

export const updateNovelInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  author_id: z.number().optional(),
  cover_image_url: z.string().nullable().optional(),
  status: novelStatusSchema.optional(),
  is_featured: z.boolean().optional(),
  genre_ids: z.array(z.number()).optional()
});

export type UpdateNovelInput = z.infer<typeof updateNovelInputSchema>;

export const updateChapterInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  chapter_number: z.number().int().positive().optional(),
  is_published: z.boolean().optional()
});

export type UpdateChapterInput = z.infer<typeof updateChapterInputSchema>;

export const updateAdPlacementInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  placement_type: z.enum(['banner', 'interstitial', 'native']).optional(),
  ad_script: z.string().min(1).optional(),
  is_active: z.boolean().optional()
});

export type UpdateAdPlacementInput = z.infer<typeof updateAdPlacementInputSchema>;

// Query input schemas
export const searchNovelsInputSchema = z.object({
  query: z.string().optional(),
  genre_ids: z.array(z.number()).optional(),
  status: novelStatusSchema.optional(),
  author_id: z.number().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type SearchNovelsInput = z.infer<typeof searchNovelsInputSchema>;

export const getChaptersInputSchema = z.object({
  novel_id: z.number(),
  published_only: z.boolean().optional()
});

export type GetChaptersInput = z.infer<typeof getChaptersInputSchema>;

export const updateReadingProgressInputSchema = z.object({
  user_id: z.number(),
  novel_id: z.number(),
  chapter_id: z.number(),
  progress_percentage: z.number().min(0).max(100)
});

export type UpdateReadingProgressInput = z.infer<typeof updateReadingProgressInputSchema>;

export const getUserReadingHistoryInputSchema = z.object({
  user_id: z.number(),
  limit: z.number().int().positive().optional()
});

export type GetUserReadingHistoryInput = z.infer<typeof getUserReadingHistoryInputSchema>;

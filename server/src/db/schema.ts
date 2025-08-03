
import { serial, text, pgTable, timestamp, integer, boolean, pgEnum, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const novelStatusEnum = pgEnum('novel_status', ['ongoing', 'completed', 'hiatus', 'draft']);
export const adPlacementTypeEnum = pgEnum('ad_placement_type', ['banner', 'interstitial', 'native']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  is_admin: boolean('is_admin').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Authors table
export const authorsTable = pgTable('authors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  bio: text('bio'),
  image_url: text('image_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Genres table
export const genresTable = pgTable('genres', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Novels table
export const novelsTable = pgTable('novels', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  author_id: integer('author_id').notNull().references(() => authorsTable.id),
  cover_image_url: text('cover_image_url'),
  status: novelStatusEnum('status').notNull().default('draft'),
  is_featured: boolean('is_featured').notNull().default(false),
  total_chapters: integer('total_chapters').notNull().default(0),
  total_views: integer('total_views').notNull().default(0),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Chapters table
export const chaptersTable = pgTable('chapters', {
  id: serial('id').primaryKey(),
  novel_id: integer('novel_id').notNull().references(() => novelsTable.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  chapter_number: integer('chapter_number').notNull(),
  is_published: boolean('is_published').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Novel genres junction table
export const novelGenresTable = pgTable('novel_genres', {
  novel_id: integer('novel_id').notNull().references(() => novelsTable.id),
  genre_id: integer('genre_id').notNull().references(() => genresTable.id),
});

// Reading history table
export const readingHistoryTable = pgTable('reading_history', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').notNull().references(() => usersTable.id),
  novel_id: integer('novel_id').notNull().references(() => novelsTable.id),
  chapter_id: integer('chapter_id').notNull().references(() => chaptersTable.id),
  progress_percentage: numeric('progress_percentage', { precision: 5, scale: 2 }).notNull().default('0'),
  last_read_at: timestamp('last_read_at').defaultNow().notNull(),
});

// Ad placements table
export const adPlacementsTable = pgTable('ad_placements', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  placement_type: adPlacementTypeEnum('placement_type').notNull(),
  ad_script: text('ad_script').notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  readingHistory: many(readingHistoryTable),
}));

export const authorsRelations = relations(authorsTable, ({ many }) => ({
  novels: many(novelsTable),
}));

export const genresRelations = relations(genresTable, ({ many }) => ({
  novelGenres: many(novelGenresTable),
}));

export const novelsRelations = relations(novelsTable, ({ one, many }) => ({
  author: one(authorsTable, {
    fields: [novelsTable.author_id],
    references: [authorsTable.id],
  }),
  chapters: many(chaptersTable),
  novelGenres: many(novelGenresTable),
  readingHistory: many(readingHistoryTable),
}));

export const chaptersRelations = relations(chaptersTable, ({ one, many }) => ({
  novel: one(novelsTable, {
    fields: [chaptersTable.novel_id],
    references: [novelsTable.id],
  }),
  readingHistory: many(readingHistoryTable),
}));

export const novelGenresRelations = relations(novelGenresTable, ({ one }) => ({
  novel: one(novelsTable, {
    fields: [novelGenresTable.novel_id],
    references: [novelsTable.id],
  }),
  genre: one(genresTable, {
    fields: [novelGenresTable.genre_id],
    references: [genresTable.id],
  }),
}));

export const readingHistoryRelations = relations(readingHistoryTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [readingHistoryTable.user_id],
    references: [usersTable.id],
  }),
  novel: one(novelsTable, {
    fields: [readingHistoryTable.novel_id],
    references: [novelsTable.id],
  }),
  chapter: one(chaptersTable, {
    fields: [readingHistoryTable.chapter_id],
    references: [chaptersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;

export type Author = typeof authorsTable.$inferSelect;
export type NewAuthor = typeof authorsTable.$inferInsert;

export type Genre = typeof genresTable.$inferSelect;
export type NewGenre = typeof genresTable.$inferInsert;

export type Novel = typeof novelsTable.$inferSelect;
export type NewNovel = typeof novelsTable.$inferInsert;

export type Chapter = typeof chaptersTable.$inferSelect;
export type NewChapter = typeof chaptersTable.$inferInsert;

export type NovelGenre = typeof novelGenresTable.$inferSelect;
export type NewNovelGenre = typeof novelGenresTable.$inferInsert;

export type ReadingHistory = typeof readingHistoryTable.$inferSelect;
export type NewReadingHistory = typeof readingHistoryTable.$inferInsert;

export type AdPlacement = typeof adPlacementsTable.$inferSelect;
export type NewAdPlacement = typeof adPlacementsTable.$inferInsert;

// Export all tables for relation queries
export const tables = {
  users: usersTable,
  authors: authorsTable,
  genres: genresTable,
  novels: novelsTable,
  chapters: chaptersTable,
  novelGenres: novelGenresTable,
  readingHistory: readingHistoryTable,
  adPlacements: adPlacementsTable,
};

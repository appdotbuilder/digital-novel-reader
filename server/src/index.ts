
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  updateUserInputSchema,
  createAuthorInputSchema,
  updateAuthorInputSchema,
  createGenreInputSchema,
  updateGenreInputSchema,
  createNovelInputSchema,
  updateNovelInputSchema,
  searchNovelsInputSchema,
  createChapterInputSchema,
  updateChapterInputSchema,
  getChaptersInputSchema,
  updateReadingProgressInputSchema,
  getUserReadingHistoryInputSchema,
  createAdPlacementInputSchema,
  updateAdPlacementInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';
import { createAuthor } from './handlers/create_author';
import { getAuthors } from './handlers/get_authors';
import { updateAuthor } from './handlers/update_author';
import { deleteAuthor } from './handlers/delete_author';
import { createGenre } from './handlers/create_genre';
import { getGenres } from './handlers/get_genres';
import { updateGenre } from './handlers/update_genre';
import { deleteGenre } from './handlers/delete_genre';
import { createNovel } from './handlers/create_novel';
import { getNovelsList } from './handlers/get_novels';
import { getFeaturedNovels } from './handlers/get_featured_novels';
import { getNovelById } from './handlers/get_novel_by_id';
import { searchNovels } from './handlers/search_novels';
import { updateNovel } from './handlers/update_novel';
import { deleteNovel } from './handlers/delete_novel';
import { createChapter } from './handlers/create_chapter';
import { getChapters } from './handlers/get_chapters';
import { getChapterById } from './handlers/get_chapter_by_id';
import { updateChapter } from './handlers/update_chapter';
import { deleteChapter } from './handlers/delete_chapter';
import { updateReadingProgress } from './handlers/update_reading_progress';
import { getUserReadingHistory } from './handlers/get_user_reading_history';
import { createAdPlacement } from './handlers/create_ad_placement';
import { getAdPlacements } from './handlers/get_ad_placements';
import { getActiveAdPlacements } from './handlers/get_active_ad_placements';
import { updateAdPlacement } from './handlers/update_ad_placement';
import { deleteAdPlacement } from './handlers/delete_ad_placement';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes (admin)
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure
    .query(() => getUsers()),
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  deleteUser: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteUser(input)),

  // Author management routes
  createAuthor: publicProcedure
    .input(createAuthorInputSchema)
    .mutation(({ input }) => createAuthor(input)),
  getAuthors: publicProcedure
    .query(() => getAuthors()),
  updateAuthor: publicProcedure
    .input(updateAuthorInputSchema)
    .mutation(({ input }) => updateAuthor(input)),
  deleteAuthor: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteAuthor(input)),

  // Genre management routes
  createGenre: publicProcedure
    .input(createGenreInputSchema)
    .mutation(({ input }) => createGenre(input)),
  getGenres: publicProcedure
    .query(() => getGenres()),
  updateGenre: publicProcedure
    .input(updateGenreInputSchema)
    .mutation(({ input }) => updateGenre(input)),
  deleteGenre: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteGenre(input)),

  // Novel management routes
  createNovel: publicProcedure
    .input(createNovelInputSchema)
    .mutation(({ input }) => createNovel(input)),
  getNovelsList: publicProcedure
    .query(() => getNovelsList()),
  getFeaturedNovels: publicProcedure
    .query(() => getFeaturedNovels()),
  getNovelById: publicProcedure
    .input(z.number())
    .query(({ input }) => getNovelById(input)),
  searchNovels: publicProcedure
    .input(searchNovelsInputSchema)
    .query(({ input }) => searchNovels(input)),
  updateNovel: publicProcedure
    .input(updateNovelInputSchema)
    .mutation(({ input }) => updateNovel(input)),
  deleteNovel: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteNovel(input)),

  // Chapter management routes
  createChapter: publicProcedure
    .input(createChapterInputSchema)
    .mutation(({ input }) => createChapter(input)),
  getChapters: publicProcedure
    .input(getChaptersInputSchema)
    .query(({ input }) => getChapters(input)),
  getChapterById: publicProcedure
    .input(z.number())
    .query(({ input }) => getChapterById(input)),
  updateChapter: publicProcedure
    .input(updateChapterInputSchema)
    .mutation(({ input }) => updateChapter(input)),
  deleteChapter: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteChapter(input)),

  // Reading progress routes
  updateReadingProgress: publicProcedure
    .input(updateReadingProgressInputSchema)
    .mutation(({ input }) => updateReadingProgress(input)),
  getUserReadingHistory: publicProcedure
    .input(getUserReadingHistoryInputSchema)
    .query(({ input }) => getUserReadingHistory(input)),

  // Ad placement management routes
  createAdPlacement: publicProcedure
    .input(createAdPlacementInputSchema)
    .mutation(({ input }) => createAdPlacement(input)),
  getAdPlacements: publicProcedure
    .query(() => getAdPlacements()),
  getActiveAdPlacements: publicProcedure
    .query(() => getActiveAdPlacements()),
  updateAdPlacement: publicProcedure
    .input(updateAdPlacementInputSchema)
    .mutation(({ input }) => updateAdPlacement(input)),
  deleteAdPlacement: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteAdPlacement(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();

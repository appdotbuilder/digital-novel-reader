
import { db } from '../db';
import { authorsTable } from '../db/schema';
import { type CreateAuthorInput, type Author } from '../schema';

export const createAuthor = async (input: CreateAuthorInput): Promise<Author> => {
  try {
    // Insert author record
    const result = await db.insert(authorsTable)
      .values({
        name: input.name,
        bio: input.bio || null,
        image_url: input.image_url || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Author creation failed:', error);
    throw error;
  }
};

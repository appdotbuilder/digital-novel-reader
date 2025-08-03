
import { db } from '../db';
import { authorsTable } from '../db/schema';
import { type UpdateAuthorInput, type Author } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAuthor = async (input: UpdateAuthorInput): Promise<Author> => {
  try {
    // Build update object with only provided fields
    const updateData: Partial<typeof authorsTable.$inferInsert> = {};
    
    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    
    if (input.bio !== undefined) {
      updateData.bio = input.bio;
    }
    
    if (input.image_url !== undefined) {
      updateData.image_url = input.image_url;
    }

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the author record
    const result = await db.update(authorsTable)
      .set(updateData)
      .where(eq(authorsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Author with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Author update failed:', error);
    throw error;
  }
};

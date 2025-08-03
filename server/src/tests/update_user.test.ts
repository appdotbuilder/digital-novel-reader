
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Helper to create a test user
const createTestUser = async (userData: CreateUserInput) => {
  const result = await db.insert(usersTable)
    .values({
      email: userData.email,
      username: userData.username,
      password_hash: 'hashed_' + userData.password, // Simple hash simulation
      is_admin: userData.is_admin || false
    })
    .returning()
    .execute();

  return result[0];
};

const testUserData: CreateUserInput = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'password123',
  is_admin: false
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user email', async () => {
    const user = await createTestUser(testUserData);
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      email: 'newemail@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(user.id);
    expect(result.email).toEqual('newemail@example.com');
    expect(result.username).toEqual(testUserData.username);
    expect(result.is_admin).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > user.updated_at).toBe(true);
  });

  it('should update user username', async () => {
    const user = await createTestUser(testUserData);
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      username: 'newusername'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(user.id);
    expect(result.email).toEqual(testUserData.email);
    expect(result.username).toEqual('newusername');
    expect(result.is_admin).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update user admin status', async () => {
    const user = await createTestUser(testUserData);
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      is_admin: true
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(user.id);
    expect(result.email).toEqual(testUserData.email);
    expect(result.username).toEqual(testUserData.username);
    expect(result.is_admin).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const user = await createTestUser(testUserData);
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      email: 'multi@example.com',
      username: 'multiuser',
      is_admin: true
    };

    const result = await updateUser(updateInput);

    expect(result.id).toEqual(user.id);
    expect(result.email).toEqual('multi@example.com');
    expect(result.username).toEqual('multiuser');
    expect(result.is_admin).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const user = await createTestUser(testUserData);
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      email: 'saved@example.com'
    };

    await updateUser(updateInput);

    const savedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user.id))
      .execute();

    expect(savedUser).toHaveLength(1);
    expect(savedUser[0].email).toEqual('saved@example.com');
    expect(savedUser[0].username).toEqual(testUserData.username);
    expect(savedUser[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const updateInput: UpdateUserInput = {
      id: 99999,
      email: 'nonexistent@example.com'
    };

    await expect(updateUser(updateInput)).rejects.toThrow(/user with id 99999 not found/i);
  });

  it('should preserve password hash when updating other fields', async () => {
    const user = await createTestUser(testUserData);
    const originalPasswordHash = user.password_hash;
    
    const updateInput: UpdateUserInput = {
      id: user.id,
      email: 'preserve@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.password_hash).toEqual(originalPasswordHash);
  });
});

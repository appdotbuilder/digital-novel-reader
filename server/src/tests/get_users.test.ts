
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users', async () => {
    // Create test users
    await db.insert(usersTable)
      .values([
        {
          email: 'user1@example.com',
          username: 'user1',
          password_hash: 'hashed_password_1',
          is_admin: false
        },
        {
          email: 'user2@example.com',
          username: 'user2',
          password_hash: 'hashed_password_2',
          is_admin: true
        }
      ])
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    // Verify first user
    const user1 = result.find(u => u.email === 'user1@example.com');
    expect(user1).toBeDefined();
    expect(user1!.username).toEqual('user1');
    expect(user1!.is_admin).toEqual(false);
    expect(user1!.password_hash).toEqual('hashed_password_1');
    expect(user1!.id).toBeDefined();
    expect(user1!.created_at).toBeInstanceOf(Date);
    expect(user1!.updated_at).toBeInstanceOf(Date);

    // Verify second user
    const user2 = result.find(u => u.email === 'user2@example.com');
    expect(user2).toBeDefined();
    expect(user2!.username).toEqual('user2');
    expect(user2!.is_admin).toEqual(true);
    expect(user2!.password_hash).toEqual('hashed_password_2');
    expect(user2!.id).toBeDefined();
    expect(user2!.created_at).toBeInstanceOf(Date);
    expect(user2!.updated_at).toBeInstanceOf(Date);
  });

  it('should return users in creation order', async () => {
    // Create users with slight delay to ensure different timestamps
    await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        username: 'user1',
        password_hash: 'hashed_password_1',
        is_admin: false
      })
      .execute();

    // Small delay to ensure different creation times
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        username: 'user2',
        password_hash: 'hashed_password_2',
        is_admin: true
      })
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    // Users should be returned in creation order (first created has lower ID)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[0].email).toEqual('user1@example.com');
    expect(result[1].email).toEqual('user2@example.com');
  });
});

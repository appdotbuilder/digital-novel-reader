
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input
const testInput: CreateUserInput = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'password123',
  is_admin: false
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.username).toEqual('testuser');
    expect(result.is_admin).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.password_hash).toBeDefined();
    expect(result.password_hash).not.toEqual('password123'); // Should be hashed
  });

  it('should hash the password', async () => {
    const result = await createUser(testInput);

    // Verify password is hashed correctly using Bun's built-in verify
    const isValidPassword = await Bun.password.verify('password123', result.password_hash);
    expect(isValidPassword).toBe(true);

    // Verify wrong password fails
    const isInvalidPassword = await Bun.password.verify('wrongpassword', result.password_hash);
    expect(isInvalidPassword).toBe(false);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].email).toEqual('test@example.com');
    expect(users[0].username).toEqual('testuser');
    expect(users[0].is_admin).toEqual(false);
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should default is_admin to false when not provided', async () => {
    const inputWithoutAdmin: CreateUserInput = {
      email: 'test2@example.com',
      username: 'testuser2',
      password: 'password123'
    };

    const result = await createUser(inputWithoutAdmin);

    expect(result.is_admin).toEqual(false);
  });

  it('should create admin user when is_admin is true', async () => {
    const adminInput: CreateUserInput = {
      email: 'admin@example.com',
      username: 'adminuser',
      password: 'password123',
      is_admin: true
    };

    const result = await createUser(adminInput);

    expect(result.is_admin).toEqual(true);
  });

  it('should fail when email already exists', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com', // Same email
      username: 'differentuser',
      password: 'password123'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should fail when username already exists', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with same username
    const duplicateInput: CreateUserInput = {
      email: 'different@example.com',
      username: 'testuser', // Same username
      password: 'password123'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/unique/i);
  });
});

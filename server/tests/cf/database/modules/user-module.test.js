// Tests for UserModule

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import UserModule from '../../src/db/cf/modules/userModule.js';
import { createMockD1Client, createMockLogger, createTestUser } from '../../test-setup.js';

describe('UserModule', function () {
  let userModule;
  let mockD1;
  let mockLogger;

  beforeEach(function () {
    mockD1 = createMockD1Client();
    mockLogger = createMockLogger();
    userModule = new UserModule({ logger: mockLogger, d1: mockD1 });
  });

  describe('constructor', function () {
    it('should create a UserModule instance', function () {
      expect(userModule).to.be.an.instanceOf(UserModule);
    });
  });

  describe('getUserById', function () {
    it('should get a user by ID', async function () {
      const result = await userModule.getUserById('test-id');
      expect(result).to.be.null; // Mock returns null
    });
  });

  describe('getUserByEmail', function () {
    it('should get a user by email', async function () {
      const result = await userModule.getUserByEmail('test@example.com');
      expect(result).to.be.null; // Mock returns null
    });
  });

  describe('createUser', function () {
    it('should create a user', async function () {
      const userData = createTestUser();
      const result = await userModule.createUser(userData);
      expect(result).to.have.property('success', true);
    });
  });

  describe('updateUser', function () {
    it('should update a user', async function () {
      const userData = { firstName: 'Updated' };
      const result = await userModule.updateUser('test-id', userData);
      expect(result).to.have.property('success', true);
    });
  });

  describe('deleteUser', function () {
    it('should delete a user', async function () {
      const result = await userModule.deleteUser('test-id');
      expect(result).to.have.property('success', true);
    });
  });

  describe('getAllUsers', function () {
    it('should get all users', async function () {
      const result = await userModule.getAllUsers();
      expect(result).to.be.an('array');
    });
  });

  describe('getUsersByTeamId', function () {
    it('should get users by team ID', async function () {
      const result = await userModule.getUsersByTeamId('test-team');
      expect(result).to.be.an('array');
    });
  });

  describe('getUserCount', function () {
    it('should get user count', async function () {
      const result = await userModule.getUserCount();
      expect(result).to.be.a('number');
    });
  });
});
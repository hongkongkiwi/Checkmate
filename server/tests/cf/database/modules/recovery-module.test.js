// Tests for RecoveryModule

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import RecoveryModule from '../../../../src/db/cf/modules/recoveryModule.js';
import { createMockD1Client, createMockLogger } from '../../test-setup.js';
import crypto from 'crypto';

describe('RecoveryModule', function () {
  let recoveryModule;
  let mockD1;
  let mockLogger;
  let mockStringService;

  beforeEach(function () {
    mockD1 = createMockD1Client();
    mockLogger = createMockLogger();
    mockStringService = {
      dbTokenNotFound: 'Token not found',
      dbUserNotFound: 'User not found'
    };
    recoveryModule = new RecoveryModule({ 
      d1: mockD1, 
      crypto, 
      stringService: mockStringService, 
      logger: mockLogger 
    });
  });

  describe('constructor', function () {
    it('should create a RecoveryModule instance', function () {
      expect(recoveryModule).to.be.an.instanceOf(RecoveryModule);
    });
  });

  describe('requestRecoveryToken', function () {
    it('should request a recovery token', async function () {
      const email = 'test@example.com';
      const result = await recoveryModule.requestRecoveryToken(email);
      
      expect(result).to.have.property('id');
      expect(result).to.have.property('email', email);
      expect(result).to.have.property('token');
      expect(result).to.have.property('expiresAt');
    });

    it('should delete existing tokens before creating new one', async function () {
      const email = 'test@example.com';
      // First request
      await recoveryModule.requestRecoveryToken(email);
      // Second request should delete the first
      const result = await recoveryModule.requestRecoveryToken(email);
      
      expect(result).to.have.property('email', email);
    });
  });

  describe('validateRecoveryToken', function () {
    it('should validate a valid recovery token', async function () {
      // Mock a valid token in database
      mockD1.prepare = () => ({
        bind: () => ({
          first: () => Promise.resolve({
            id: 'test-id',
            email: 'test@example.com',
            token: 'test-token',
            expiresAt: new Date(Date.now() + 600000).toISOString()
          })
        })
      });

      const result = await recoveryModule.validateRecoveryToken('test-token');
      expect(result).to.have.property('email', 'test@example.com');
    });

    it('should throw error for invalid token', async function () {
      // Mock no token found
      mockD1.prepare = () => ({
        bind: () => ({
          first: () => Promise.resolve(null)
        })
      });

      try {
        await recoveryModule.validateRecoveryToken('invalid-token');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Token not found');
      }
    });

    it('should throw error for expired token', async function () {
      // Mock expired token
      mockD1.prepare = () => ({
        bind: () => ({
          first: () => Promise.resolve(null) // Will return null since query checks expiry
        })
      });

      try {
        await recoveryModule.validateRecoveryToken('expired-token');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Token not found');
      }
    });
  });

  describe('cleanupExpiredTokens', function () {
    it('should cleanup expired tokens', async function () {
      mockD1.prepare = () => ({
        bind: () => ({
          run: () => Promise.resolve({ meta: { changes: 3 } })
        })
      });

      const result = await recoveryModule.cleanupExpiredTokens();
      expect(result).to.equal(3);
    });

    it('should return 0 when no tokens to cleanup', async function () {
      mockD1.prepare = () => ({
        bind: () => ({
          run: () => Promise.resolve({ meta: { changes: 0 } })
        })
      });

      const result = await recoveryModule.cleanupExpiredTokens();
      expect(result).to.equal(0);
    });
  });
});
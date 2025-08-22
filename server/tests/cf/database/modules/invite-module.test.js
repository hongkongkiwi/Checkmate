// Tests for InviteModule

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import InviteModule from '../../../../src/db/cf/modules/inviteModule.js';
import { createMockD1Client, createMockLogger } from '../../test-setup.js';

describe('InviteModule', function () {
  let inviteModule;
  let mockD1;
  let mockLogger;

  beforeEach(function () {
    mockD1 = createMockD1Client();
    mockLogger = createMockLogger();
    inviteModule = new InviteModule({ logger: mockLogger, d1: mockD1 });
  });

  describe('constructor', function () {
    it('should create an InviteModule instance', function () {
      expect(inviteModule).to.be.an.instanceOf(InviteModule);
    });
  });

  describe('createInviteToken', function () {
    it('should create an invite token', async function () {
      const inviteData = {
        teamId: 'team-123',
        email: 'invite@example.com',
        role: 'member'
      };

      const result = await inviteModule.createInviteToken(inviteData);
      
      expect(result).to.have.property('success', true);
    });
  });

  describe('getInviteByToken', function () {
    it('should get an invite by token', async function () {
      mockD1.prepare = () => ({
        bind: () => ({
          first: () => Promise.resolve({
            id: 'invite-123',
            token: 'test-token',
            teamId: 'team-123',
            email: 'invite@example.com',
            role: 'member'
          })
        })
      });

      const result = await inviteModule.getInviteByToken('test-token');
      
      expect(result).to.have.property('token', 'test-token');
      expect(result).to.have.property('email', 'invite@example.com');
    });

    it('should return null for non-existent token', async function () {
      const result = await inviteModule.getInviteByToken('non-existent');
      expect(result).to.be.null;
    });
  });

  describe('validateInviteToken', function () {
    it('should validate a valid invite token', async function () {
      mockD1.prepare = () => ({
        bind: () => ({
          first: () => Promise.resolve({
            id: 'invite-123',
            token: 'valid-token',
            expiresAt: new Date(Date.now() + 86400000).toISOString() // 24 hours from now
          })
        })
      });

      const result = await inviteModule.validateInviteToken('valid-token');
      expect(result).to.have.property('token', 'valid-token');
    });

    it('should return null for expired token', async function () {
      mockD1.prepare = () => ({
        bind: () => ({
          first: () => Promise.resolve(null) // Query checks expiry
        })
      });

      const result = await inviteModule.validateInviteToken('expired-token');
      expect(result).to.be.null;
    });
  });

  describe('deleteInviteToken', function () {
    it('should delete an invite token', async function () {
      const result = await inviteModule.deleteInviteToken('token-123');
      expect(result).to.have.property('success', true);
    });
  });

  describe('getInvitesByTeamId', function () {
    it('should get invites by team ID', async function () {
      mockD1.prepare = () => ({
        bind: () => ({
          all: () => Promise.resolve({
            results: [
              { id: 'invite-1', teamId: 'team-123', email: 'user1@example.com' },
              { id: 'invite-2', teamId: 'team-123', email: 'user2@example.com' }
            ]
          })
        })
      });

      const result = await inviteModule.getInvitesByTeamId('team-123');
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(2);
    });
  });

  describe('cleanupExpiredInvites', function () {
    it('should cleanup expired invites', async function () {
      mockD1.prepare = () => ({
        bind: () => ({
          run: () => Promise.resolve({ meta: { changes: 5 } })
        })
      });

      const result = await inviteModule.cleanupExpiredInvites();
      expect(result).to.equal(5);
    });
  });
});
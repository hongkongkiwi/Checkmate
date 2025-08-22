// Tests for NotificationModule

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import NotificationModule from '../../../../src/db/cf/modules/notificationModule.js';
import { createMockD1Client, createMockLogger } from '../../test-setup.js';

describe('NotificationModule', function () {
  let notificationModule;
  let mockD1;
  let mockLogger;

  beforeEach(function () {
    mockD1 = createMockD1Client();
    mockLogger = createMockLogger();
    notificationModule = new NotificationModule({ logger: mockLogger, d1: mockD1 });
  });

  describe('constructor', function () {
    it('should create a NotificationModule instance', function () {
      expect(notificationModule).to.be.an.instanceOf(NotificationModule);
    });
  });

  describe('createNotification', function () {
    it('should create a notification', async function () {
      const notificationData = {
        userId: 'user-123',
        teamId: 'team-123',
        name: 'Test Notification',
        type: 'email',
        enabled: true,
        settings: {
          email: 'notify@example.com',
          events: ['down', 'up']
        }
      };

      const result = await notificationModule.createNotification(notificationData);
      
      expect(result).to.have.property('success', true);
    });
  });

  describe('getNotificationById', function () {
    it('should get a notification by ID', async function () {
      mockD1.prepare = () => ({
        bind: () => ({
          first: () => Promise.resolve({
            id: 'notif-123',
            name: 'Test Notification',
            type: 'email',
            settings: JSON.stringify({ email: 'test@example.com' })
          })
        })
      });

      const result = await notificationModule.getNotificationById('notif-123');
      
      expect(result).to.have.property('name', 'Test Notification');
      expect(result.settings).to.deep.equal({ email: 'test@example.com' });
    });

    it('should return null for non-existent notification', async function () {
      const result = await notificationModule.getNotificationById('non-existent');
      expect(result).to.be.null;
    });
  });

  describe('getNotificationsByTeamId', function () {
    it('should get notifications by team ID', async function () {
      mockD1.prepare = () => ({
        bind: () => ({
          all: () => Promise.resolve({
            results: [
              { 
                id: 'notif-1', 
                teamId: 'team-123', 
                type: 'email',
                settings: JSON.stringify({ email: 'test1@example.com' })
              },
              { 
                id: 'notif-2', 
                teamId: 'team-123', 
                type: 'slack',
                settings: JSON.stringify({ webhookUrl: 'https://slack.com/webhook' })
              }
            ]
          })
        })
      });

      const result = await notificationModule.getNotificationsByTeamId('team-123');
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(2);
      expect(result[0].settings).to.be.an('object');
    });
  });

  describe('updateNotification', function () {
    it('should update a notification', async function () {
      const updateData = {
        name: 'Updated Notification',
        enabled: false,
        settings: { email: 'updated@example.com' }
      };

      const result = await notificationModule.updateNotification('notif-123', updateData);
      
      expect(result).to.have.property('success', true);
    });
  });

  describe('deleteNotification', function () {
    it('should delete a notification', async function () {
      const result = await notificationModule.deleteNotification('notif-123');
      expect(result).to.have.property('success', true);
    });
  });

  describe('getEnabledNotifications', function () {
    it('should get enabled notifications', async function () {
      mockD1.prepare = () => ({
        all: () => Promise.resolve({
          results: [
            { 
              id: 'notif-1', 
              enabled: 1,
              type: 'email',
              settings: JSON.stringify({ email: 'active@example.com' })
            }
          ]
        })
      });

      const result = await notificationModule.getEnabledNotifications();
      
      expect(result).to.be.an('array');
      expect(result[0]).to.have.property('enabled', true);
    });
  });

  describe('getNotificationsByType', function () {
    it('should get notifications by type', async function () {
      mockD1.prepare = () => ({
        bind: () => ({
          all: () => Promise.resolve({
            results: [
              { 
                id: 'notif-1', 
                type: 'webhook',
                settings: JSON.stringify({ url: 'https://example.com/hook' })
              },
              { 
                id: 'notif-2', 
                type: 'webhook',
                settings: JSON.stringify({ url: 'https://example.com/hook2' })
              }
            ]
          })
        })
      });

      const result = await notificationModule.getNotificationsByType('webhook');
      
      expect(result).to.be.an('array');
      expect(result).to.have.length(2);
      expect(result[0]).to.have.property('type', 'webhook');
    });
  });
});
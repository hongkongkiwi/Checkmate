// Tests for CFDatabase class

import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { CFDatabase } from '../../src/db/cf/CFDatabase.js';
import { createMockD1Client, createMockLogger, mockEnvSettings } from '../test-setup.js';

describe('CFDatabase', function () {
  let db;
  let mockD1;
  let mockLogger;

  beforeEach(function () {
    mockD1 = createMockD1Client();
    mockLogger = createMockLogger();
    
    // Create mock modules
    const mockUserModule = { serviceName: 'UserModule' };
    const mockMonitorModule = { serviceName: 'MonitorModule' };
    const mockCheckModule = { serviceName: 'CheckModule' };
    const mockTeamModule = { serviceName: 'TeamModule' };
    const mockNotificationModule = { serviceName: 'NotificationModule' };
    const mockInviteModule = { serviceName: 'InviteModule' };
    const mockMaintenanceWindowModule = { serviceName: 'MaintenanceWindowModule' };
    const mockStatusPageModule = { serviceName: 'StatusPageModule' };
    
    db = new CFDatabase({
      logger: mockLogger,
      envSettings: mockEnvSettings,
      d1: mockD1,
      kv: null,
      r2: null,
      userModule: mockUserModule,
      monitorModule: mockMonitorModule,
      checkModule: mockCheckModule,
      teamModule: mockTeamModule,
      notificationModule: mockNotificationModule,
      inviteModule: mockInviteModule,
      maintenanceWindowModule: mockMaintenanceWindowModule,
      statusPageModule: mockStatusPageModule,
      sentry: null
    });
  });

  describe('constructor', function () {
    it('should create a CFDatabase instance', function () {
      expect(db).to.be.an.instanceOf(CFDatabase);
      expect(db.serviceName).to.equal('CFDatabase');
    });
  });

  describe('connect', function () {
    it('should connect to the database', async function () {
      const result = await db.connect();
      expect(result).to.be.undefined; // connect doesn't return anything
    });
  });

  describe('disconnect', function () {
    it('should disconnect from the database', async function () {
      const result = await db.disconnect();
      expect(result).to.be.undefined; // disconnect doesn't return anything
    });
  });

  describe('query', function () {
    it('should execute a query', async function () {
      const result = await db.query('SELECT * FROM users');
      expect(result).to.have.property('results');
    });

    it('should execute a query with parameters', async function () {
      const result = await db.query('SELECT * FROM users WHERE id = ?', ['test-id']);
      expect(result).to.have.property('results');
    });
  });

  describe('execute', function () {
    it('should execute a statement', async function () {
      const result = await db.execute('INSERT INTO users (id) VALUES (?)', ['test-id']);
      expect(result).to.have.property('success', true);
    });
  });

  describe('insertOne', function () {
    it('should insert a document', async function () {
      const document = { id: 'test-id', name: 'Test' };
      const result = await db.insertOne('users', document);
      expect(result).to.have.property('insertedId', 'test-id');
    });

    it('should reject unsupported collections', async function () {
      const document = { id: 'test-id' };
      try {
        await db.insertOne('unsupported', document);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
  });

  describe('find', function () {
    it('should find documents', async function () {
      const result = await db.find('users');
      expect(result).to.be.an('array');
    });

    it('should find documents with filter', async function () {
      const result = await db.find('users', { id: 'test-id' });
      expect(result).to.be.an('array');
    });

    it('should reject unsupported collections', async function () {
      try {
        await db.find('unsupported');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
  });

  describe('findOne', function () {
    it('should find one document', async function () {
      const result = await db.findOne('users');
      expect(result).to.be.null; // Mock returns null
    });

    it('should find one document with filter', async function () {
      const result = await db.findOne('users', { id: 'test-id' });
      expect(result).to.be.null; // Mock returns null
    });
  });

  describe('updateOne', function () {
    it('should update a document', async function () {
      const filter = { id: 'test-id' };
      const update = { name: 'Updated' };
      const result = await db.updateOne('users', filter, update);
      expect(result).to.have.property('modifiedCount');
    });

    it('should require ID filter', async function () {
      const filter = { name: 'test' };
      const update = { name: 'Updated' };
      try {
        await db.updateOne('users', filter, update);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
  });

  describe('deleteOne', function () {
    it('should delete a document', async function () {
      const filter = { id: 'test-id' };
      const result = await db.deleteOne('users', filter);
      expect(result).to.have.property('deletedCount');
    });

    it('should require ID filter', async function () {
      const filter = { name: 'test' };
      try {
        await db.deleteOne('users', filter);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
  });

  describe('deleteMany', function () {
    it('should delete documents', async function () {
      const filter = { teamId: 'test-team' };
      const result = await db.deleteMany('users', filter);
      expect(result).to.have.property('deletedCount');
    });

    it('should require filter', async function () {
      try {
        await db.deleteMany('users', {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.an('error');
      }
    });
  });

  describe('count', function () {
    it('should count documents', async function () {
      const result = await db.count('users');
      expect(result).to.be.a('number');
    });

    it('should count documents with filter', async function () {
      const result = await db.count('users', { active: 1 });
      expect(result).to.be.a('number');
    });
  });
});
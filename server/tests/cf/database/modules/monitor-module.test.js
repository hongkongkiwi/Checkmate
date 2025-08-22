// Tests for MonitorModule

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import MonitorModule from '../../src/db/cf/modules/monitorModule.js';
import { createMockD1Client, createMockLogger, createTestMonitor } from '../../test-setup.js';

describe('MonitorModule', function () {
  let monitorModule;
  let mockD1;
  let mockLogger;

  beforeEach(function () {
    mockD1 = createMockD1Client();
    mockLogger = createMockLogger();
    monitorModule = new MonitorModule({ logger: mockLogger, d1: mockD1 });
  });

  describe('constructor', function () {
    it('should create a MonitorModule instance', function () {
      expect(monitorModule).to.be.an.instanceOf(MonitorModule);
    });
  });

  describe('getMonitorById', function () {
    it('should get a monitor by ID', async function () {
      const result = await monitorModule.getMonitorById('test-id');
      expect(result).to.be.null; // Mock returns null
    });
  });

  describe('getAllMonitors', function () {
    it('should get all monitors', async function () {
      const result = await monitorModule.getAllMonitors();
      expect(result).to.be.an('array');
    });
  });

  describe('getMonitorsByUserId', function () {
    it('should get monitors by user ID', async function () {
      const result = await monitorModule.getMonitorsByUserId('test-user');
      expect(result).to.be.an('array');
    });
  });

  describe('getMonitorsByTeamId', function () {
    it('should get monitors by team ID', async function () {
      const result = await monitorModule.getMonitorsByTeamId('test-team');
      expect(result).to.be.an('array');
    });
  });

  describe('createMonitor', function () {
    it('should create a monitor', async function () {
      const monitorData = createTestMonitor();
      const result = await monitorModule.createMonitor(monitorData);
      expect(result).to.have.property('success', true);
    });
  });

  describe('updateMonitor', function () {
    it('should update a monitor', async function () {
      const monitorData = { name: 'Updated Monitor' };
      const result = await monitorModule.updateMonitor('test-id', monitorData);
      expect(result).to.have.property('success', true);
    });
  });

  describe('deleteMonitor', function () {
    it('should delete a monitor', async function () {
      const result = await monitorModule.deleteMonitor('test-id');
      expect(result).to.have.property('success', true);
    });
  });

  describe('getMonitorStats', function () {
    it('should get monitor stats', async function () {
      const result = await monitorModule.getMonitorStats('test-monitor');
      expect(result).to.be.an('array');
    });
  });

  describe('getMonitorCount', function () {
    it('should get monitor count', async function () {
      const result = await monitorModule.getMonitorCount();
      expect(result).to.be.a('number');
    });
  });

  describe('getActiveMonitors', function () {
    it('should get active monitors', async function () {
      const result = await monitorModule.getActiveMonitors();
      expect(result).to.be.an('array');
    });
  });
});
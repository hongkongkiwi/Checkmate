// Tests for CheckModule

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import CheckModule from '../../src/db/cf/modules/checkModule.js';
import { createMockD1Client, createMockLogger, createTestCheck } from '../../test-setup.js';

describe('CheckModule', function () {
  let checkModule;
  let mockD1;
  let mockLogger;

  beforeEach(function () {
    mockD1 = createMockD1Client();
    mockLogger = createMockLogger();
    checkModule = new CheckModule({ logger: mockLogger, d1: mockD1 });
  });

  describe('constructor', function () {
    it('should create a CheckModule instance', function () {
      expect(checkModule).to.be.an.instanceOf(CheckModule);
    });
  });

  describe('getCheckById', function () {
    it('should get a check by ID', async function () {
      const result = await checkModule.getCheckById('test-id');
      expect(result).to.be.null; // Mock returns null
    });
  });

  describe('getChecksByMonitorId', function () {
    it('should get checks by monitor ID', async function () {
      const result = await checkModule.getChecksByMonitorId('test-monitor');
      expect(result).to.be.an('array');
    });
  });

  describe('createCheck', function () {
    it('should create a check', async function () {
      const checkData = createTestCheck();
      const result = await checkModule.createCheck(checkData);
      expect(result).to.have.property('success', true);
    });
  });

  describe('deleteChecksOlderThan', function () {
    it('should delete old checks', async function () {
      const result = await checkModule.deleteChecksOlderThan('2023-01-01');
      expect(result).to.have.property('success', true);
    });
  });

  describe('getCheckStats', function () {
    it('should get check stats', async function () {
      const result = await checkModule.getCheckStats('test-monitor');
      expect(result).to.be.an('object');
    });
  });

  describe('getRecentChecks', function () {
    it('should get recent checks', async function () {
      const result = await checkModule.getRecentChecks();
      expect(result).to.be.an('array');
    });
  });

  describe('getCheckCount', function () {
    it('should get check count', async function () {
      const result = await checkModule.getCheckCount();
      expect(result).to.be.a('number');
    });
  });
});
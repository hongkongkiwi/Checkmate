// Tests for SettingsModule

import { describe, it, beforeEach } from 'mocha';
import { expect } from 'chai';
import SettingsModule from '../../../../src/db/cf/modules/settingsModule.js';
import { createMockD1Client, createMockLogger } from '../../test-setup.js';
import crypto from 'crypto';

describe('SettingsModule', function () {
  let settingsModule;
  let mockD1;
  let mockLogger;

  beforeEach(function () {
    mockD1 = createMockD1Client();
    mockLogger = createMockLogger();
    settingsModule = new SettingsModule({ 
      d1: mockD1, 
      logger: mockLogger,
      crypto 
    });
  });

  describe('constructor', function () {
    it('should create a SettingsModule instance', function () {
      expect(settingsModule).to.be.an.instanceOf(SettingsModule);
    });
  });

  describe('getAppSettings', function () {
    it('should get existing app settings', async function () {
      const mockSettings = {
        checkTTL: 30,
        language: 'gb',
        systemEmailHost: 'smtp.example.com',
        globalThresholds: JSON.stringify({ cpu: 80, memory: 90 }),
        singleton: 1,
        id: 'test-id'
      };

      mockD1.prepare = () => ({
        first: () => Promise.resolve(mockSettings)
      });

      const result = await settingsModule.getAppSettings();
      
      expect(result).to.have.property('checkTTL', 30);
      expect(result).to.have.property('language', 'gb');
      expect(result.globalThresholds).to.deep.equal({ cpu: 80, memory: 90 });
      expect(result).to.not.have.property('singleton');
      expect(result).to.not.have.property('id');
    });

    it('should create default settings if none exist', async function () {
      mockD1.prepare = (query) => {
        if (query.includes('SELECT')) {
          return { first: () => Promise.resolve(null) };
        }
        return {
          bind: () => ({
            run: () => Promise.resolve({ success: true })
          })
        };
      };

      const result = await settingsModule.getAppSettings();
      
      expect(result).to.have.property('checkTTL', 30);
      expect(result).to.have.property('language', 'gb');
      expect(result.globalThresholds).to.deep.equal({
        cpu: null,
        memory: null,
        disk: null,
        temperature: null
      });
    });
  });

  describe('updateAppSettings', function () {
    it('should update app settings', async function () {
      const newSettings = {
        checkTTL: 60,
        language: 'us',
        globalThresholds: { cpu: 85, memory: 95 }
      };

      let updateCalled = false;
      mockD1.prepare = (query) => {
        if (query.includes('UPDATE')) {
          updateCalled = true;
          return {
            bind: () => ({
              run: () => Promise.resolve({ success: true })
            })
          };
        } else if (query.includes('COUNT')) {
          return {
            first: () => Promise.resolve({ count: 1 })
          };
        } else {
          // Return updated settings
          return {
            first: () => Promise.resolve({
              ...newSettings,
              globalThresholds: JSON.stringify(newSettings.globalThresholds)
            })
          };
        }
      };

      const result = await settingsModule.updateAppSettings(newSettings);
      
      expect(updateCalled).to.be.true;
      expect(result).to.have.property('checkTTL', 60);
    });

    it('should handle empty password fields', async function () {
      const newSettings = {
        pagespeedApiKey: '',
        systemEmailPassword: ''
      };

      let nullValuesSet = false;
      mockD1.prepare = (query) => {
        if (query.includes('UPDATE') && query.includes('pagespeedApiKey = NULL')) {
          nullValuesSet = true;
          return {
            bind: () => ({
              run: () => Promise.resolve({ success: true })
            })
          };
        } else if (query.includes('COUNT')) {
          return {
            first: () => Promise.resolve({ count: 1 })
          };
        } else {
          return {
            first: () => Promise.resolve({
              checkTTL: 30,
              language: 'gb'
            })
          };
        }
      };

      await settingsModule.updateAppSettings(newSettings);
      expect(nullValuesSet).to.be.true;
    });
  });

  describe('getSetting', function () {
    it('should get a specific setting value', async function () {
      mockD1.prepare = () => ({
        first: () => Promise.resolve({
          checkTTL: 45,
          language: 'fr'
        })
      });

      const result = await settingsModule.getSetting('checkTTL');
      expect(result).to.equal(45);
    });

    it('should return undefined for non-existent setting', async function () {
      mockD1.prepare = () => ({
        first: () => Promise.resolve({
          checkTTL: 30
        })
      });

      const result = await settingsModule.getSetting('nonExistent');
      expect(result).to.be.undefined;
    });
  });

  describe('updateSetting', function () {
    it('should update a specific setting value', async function () {
      let updateValue;
      mockD1.prepare = (query) => {
        if (query.includes('UPDATE')) {
          return {
            bind: (...args) => {
              updateValue = args[0]; // First bind value should be the new checkTTL
              return {
                run: () => Promise.resolve({ success: true })
              };
            }
          };
        } else if (query.includes('COUNT')) {
          return {
            first: () => Promise.resolve({ count: 1 })
          };
        } else {
          return {
            first: () => Promise.resolve({
              checkTTL: 90,
              language: 'gb'
            })
          };
        }
      };

      const result = await settingsModule.updateSetting('checkTTL', 90);
      expect(result).to.have.property('checkTTL', 90);
    });
  });
});
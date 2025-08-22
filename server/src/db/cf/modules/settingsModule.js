const SERVICE_NAME = "SettingsModule";

class SettingsModule {
  constructor({ d1, logger, crypto }) {
    this.d1 = d1;
    this.logger = logger;
    this.crypto = crypto;
  }

  getAppSettings = async () => {
    try {
      // Get the singleton settings record
      const settings = await this.d1.prepare(
        `SELECT * FROM app_settings WHERE singleton = 1`
      ).first();

      if (!settings) {
        // Create default settings if none exist
        return await this.createDefaultSettings();
      }

      // Parse JSON fields
      if (settings.globalThresholds) {
        try {
          settings.globalThresholds = JSON.parse(settings.globalThresholds);
        } catch (e) {
          settings.globalThresholds = null;
        }
      }

      // Remove internal fields
      delete settings.singleton;
      delete settings.id;

      return settings;
    } catch (error) {
      this.logger.error({
        message: error.message,
        service: SERVICE_NAME,
        method: "getAppSettings",
        stack: error.stack,
      });
      error.service = SERVICE_NAME;
      error.method = "getAppSettings";
      throw error;
    }
  };

  createDefaultSettings = async () => {
    try {
      const id = this.crypto.randomUUID();
      const now = new Date().toISOString();
      
      const defaultSettings = {
        id,
        checkTTL: 30,
        language: 'gb',
        pagespeedApiKey: null,
        systemEmailHost: null,
        systemEmailPort: null,
        systemEmailAddress: null,
        systemEmailPassword: null,
        systemEmailUser: null,
        systemEmailConnectionHost: 'localhost',
        systemEmailTLSServername: null,
        systemEmailSecure: 0,
        systemEmailPool: 0,
        systemEmailIgnoreTLS: 0,
        systemEmailRequireTLS: 0,
        systemEmailRejectUnauthorized: 1,
        singleton: 1,
        version: 1,
        globalThresholds: JSON.stringify({
          cpu: null,
          memory: null,
          disk: null,
          temperature: null
        }),
        createdAt: now,
        updatedAt: now
      };

      // Insert default settings
      const columns = Object.keys(defaultSettings).join(', ');
      const placeholders = Object.keys(defaultSettings).map(() => '?').join(', ');
      const values = Object.values(defaultSettings);

      await this.d1.prepare(
        `INSERT INTO app_settings (${columns}) VALUES (${placeholders})`
      ).bind(...values).run();

      // Return settings without internal fields
      const result = { ...defaultSettings };
      delete result.singleton;
      delete result.id;
      
      // Parse globalThresholds back to object
      result.globalThresholds = JSON.parse(result.globalThresholds);

      return result;
    } catch (error) {
      this.logger.error({
        message: error.message,
        service: SERVICE_NAME,
        method: "createDefaultSettings",
        stack: error.stack,
      });
      error.service = SERVICE_NAME;
      error.method = "createDefaultSettings";
      throw error;
    }
  };

  updateAppSettings = async (newSettings) => {
    try {
      // Get current settings
      const currentSettings = await this.getAppSettings();
      
      // Build update object
      const updates = { ...newSettings };
      const now = new Date().toISOString();
      
      // Handle globalThresholds JSON
      if (updates.globalThresholds) {
        updates.globalThresholds = JSON.stringify(updates.globalThresholds);
      }

      // Build SET clause dynamically
      const setClause = [];
      const values = [];
      
      for (const [key, value] of Object.entries(updates)) {
        // Skip fields that shouldn't be updated
        if (['id', 'singleton', 'createdAt'].includes(key)) continue;
        
        // Handle empty string values for password fields
        if ((key === 'pagespeedApiKey' || key === 'systemEmailPassword') && value === '') {
          setClause.push(`${key} = NULL`);
        } else {
          setClause.push(`${key} = ?`);
          values.push(value);
        }
      }
      
      // Add updatedAt
      setClause.push('updatedAt = ?');
      values.push(now);

      if (setClause.length === 1) {
        // Only updatedAt, nothing to update
        return currentSettings;
      }

      // Execute update
      await this.d1.prepare(
        `UPDATE app_settings SET ${setClause.join(', ')} WHERE singleton = 1`
      ).bind(...values).run();

      // Check if we need to insert instead (in case no record exists)
      const checkResult = await this.d1.prepare(
        "SELECT COUNT(*) as count FROM app_settings WHERE singleton = 1"
      ).first();

      if (checkResult.count === 0) {
        // Create new settings with updates
        return await this.createDefaultSettings();
      }

      // Return updated settings
      return await this.getAppSettings();
    } catch (error) {
      this.logger.error({
        message: error.message,
        service: SERVICE_NAME,
        method: "updateAppSettings",
        stack: error.stack,
      });
      error.service = SERVICE_NAME;
      error.method = "updateAppSettings";
      throw error;
    }
  };

  // Get a specific setting value
  getSetting = async (key) => {
    try {
      const settings = await this.getAppSettings();
      return settings[key];
    } catch (error) {
      this.logger.error({
        message: error.message,
        service: SERVICE_NAME,
        method: "getSetting",
        key,
        stack: error.stack,
      });
      error.service = SERVICE_NAME;
      error.method = "getSetting";
      throw error;
    }
  };

  // Update a specific setting value
  updateSetting = async (key, value) => {
    try {
      const updates = { [key]: value };
      return await this.updateAppSettings(updates);
    } catch (error) {
      this.logger.error({
        message: error.message,
        service: SERVICE_NAME,
        method: "updateSetting",
        key,
        value,
        stack: error.stack,
      });
      error.service = SERVICE_NAME;
      error.method = "updateSetting";
      throw error;
    }
  };
}

export default SettingsModule;
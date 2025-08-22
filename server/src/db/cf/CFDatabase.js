export class CFDatabase {
  static SERVICE_NAME = "CFDatabase";

  constructor({ logger, envSettings, d1, kv, r2, userModule, monitorModule, checkModule, teamModule, notificationModule, inviteModule, maintenanceWindowModule, statusPageModule, sentry }) {
    this.logger = logger;
    this.envSettings = envSettings;
    this.d1 = d1;
    this.kv = kv;
    this.r2 = r2;
    this.userModule = userModule;
    this.monitorModule = monitorModule;
    this.checkModule = checkModule;
    this.teamModule = teamModule;
    this.notificationModule = notificationModule;
    this.inviteModule = inviteModule;
    this.maintenanceWindowModule = maintenanceWindowModule;
    this.statusPageModule = statusPageModule;
    this.sentry = sentry;
  }

  get serviceName() {
    return CFDatabase.SERVICE_NAME;
  }

  /**
   * Initialize the database connection and create tables if they don't exist
   */
  async connect() {
    try {
      // In Cloudflare, the connection is automatically handled by the binding
      // We just need to ensure our tables exist
      await this.createTables();
      
      this.logger.info({
        message: "Connected to Cloudflare D1 database",
        service: this.SERVICE_NAME,
        method: "connect",
      });
    } catch (error) {
      this.logger.error({
        message: error.message,
        service: this.SERVICE_NAME,
        method: "connect",
        stack: error.stack,
      });
      
      if (this.sentry) {
        this.sentry.captureException(error);
      }
      
      throw error;
    }
  }

  /**
   * Create tables if they don't exist
   */
  async createTables() {
    try {
      // Users table
      await this.d1.prepare(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          firstName TEXT,
          lastName TEXT,
          email TEXT UNIQUE,
          password TEXT,
          avatarImage TEXT,
          profileImage BLOB,
          profileImageContentType TEXT,
          isActive BOOLEAN DEFAULT 1,
          isVerified BOOLEAN DEFAULT 0,
          role TEXT,
          teamId TEXT,
          checkTTL INTEGER,
          createdAt TEXT,
          updatedAt TEXT
        )
      `).run();

      // Teams table
      await this.d1.prepare(`
        CREATE TABLE IF NOT EXISTS teams (
          id TEXT PRIMARY KEY,
          name TEXT,
          createdAt TEXT,
          updatedAt TEXT
        )
      `).run();

      // Monitors table
      await this.d1.prepare(`
        CREATE TABLE IF NOT EXISTS monitors (
          id TEXT PRIMARY KEY,
          userId TEXT,
          teamId TEXT,
          name TEXT,
          description TEXT,
          status BOOLEAN,
          statusWindow TEXT, -- JSON array
          statusWindowSize INTEGER DEFAULT 5,
          statusWindowThreshold REAL DEFAULT 0.6,
          type TEXT,
          ignoreTlsErrors BOOLEAN DEFAULT 0,
          jsonPath TEXT,
          expectedValue TEXT,
          matchMethod TEXT,
          url TEXT,
          port INTEGER,
          isActive BOOLEAN DEFAULT 1,
          interval INTEGER DEFAULT 60000,
          uptimePercentage REAL,
          notifications TEXT, -- JSON array of notification IDs
          secret TEXT,
          thresholds TEXT, -- JSON object
          alertThreshold INTEGER DEFAULT 5,
          cpuAlertThreshold INTEGER,
          memoryAlertThreshold INTEGER,
          diskAlertThreshold INTEGER,
          tempAlertThreshold INTEGER,
          gameId TEXT,
          createdAt TEXT,
          updatedAt TEXT
        )
      `).run();

      // Checks table
      await this.d1.prepare(`
        CREATE TABLE IF NOT EXISTS checks (
          id TEXT PRIMARY KEY,
          monitorId TEXT,
          teamId TEXT,
          type TEXT,
          status BOOLEAN,
          responseTime INTEGER,
          timings TEXT, -- JSON object
          statusCode INTEGER,
          message TEXT,
          expiry TEXT,
          ack BOOLEAN DEFAULT 0,
          ackAt TEXT,
          cpu TEXT, -- JSON object
          memory TEXT, -- JSON object
          disk TEXT, -- JSON array
          host TEXT, -- JSON object
          errors TEXT, -- JSON array
          capture TEXT, -- JSON object
          net TEXT, -- JSON array
          accessibility INTEGER,
          bestPractices INTEGER,
          seo INTEGER,
          performance INTEGER,
          audits TEXT, -- JSON object
          createdAt TEXT,
          updatedAt TEXT
        )
      `).run();

      // Notifications table
      await this.d1.prepare(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          userId TEXT,
          teamId TEXT,
          name TEXT,
          type TEXT,
          enabled BOOLEAN DEFAULT 1,
          "settings" TEXT, -- JSON object (quoted because it's a reserved word)
          createdAt TEXT,
          updatedAt TEXT
        )
      `).run();

      // Invite tokens table
      await this.d1.prepare(`
        CREATE TABLE IF NOT EXISTS invite_tokens (
          id TEXT PRIMARY KEY,
          token TEXT UNIQUE,
          teamId TEXT,
          email TEXT,
          role TEXT,
          expiresAt TEXT,
          createdAt TEXT,
          updatedAt TEXT
        )
      `).run();

      // Maintenance windows table
      await this.d1.prepare(`
        CREATE TABLE IF NOT EXISTS maintenance_windows (
          id TEXT PRIMARY KEY,
          teamId TEXT,
          monitorId TEXT,
          name TEXT,
          description TEXT,
          start TEXT,
          end TEXT,
          expiry TEXT,
          repeat TEXT,
          oneTime BOOLEAN DEFAULT 1,
          createdAt TEXT,
          updatedAt TEXT
        )
      `).run();

      // Status pages table
      await this.d1.prepare(`
        CREATE TABLE IF NOT EXISTS status_pages (
          id TEXT PRIMARY KEY,
          teamId TEXT,
          title TEXT,
          description TEXT,
          monitors TEXT, -- JSON array
          showCharts BOOLEAN DEFAULT 1,
          showUptimePercentage BOOLEAN DEFAULT 1,
          showIncidents BOOLEAN DEFAULT 1,
          theme TEXT DEFAULT 'light',
          customCSS TEXT,
          createdAt TEXT,
          updatedAt TEXT
        )
      `).run();

      // Create indexes for better performance
      try {
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_checks_monitorId ON checks(monitorId)").run();
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_checks_createdAt ON checks(createdAt)").run();
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_checks_updatedAt ON checks(updatedAt)").run();
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_monitors_userId ON monitors(userId)").run();
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_monitors_teamId ON monitors(teamId)").run();
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_monitors_type ON monitors(type)").run();
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)").run();
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_users_teamId ON users(teamId)").run();
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_notifications_teamId ON notifications(teamId)").run();
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_invite_tokens_token ON invite_tokens(token)").run();
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_maintenance_windows_teamId ON maintenance_windows(teamId)").run();
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_maintenance_windows_monitorId ON maintenance_windows(monitorId)").run();
        await this.d1.prepare("CREATE INDEX IF NOT EXISTS idx_status_pages_teamId ON status_pages(teamId)").run();
      } catch (error) {
        // Index creation might fail in some environments, but that's okay
        this.logger.warn({
          message: "Could not create indexes: " + error.message,
          service: this.SERVICE_NAME,
          method: "createTables",
        });
      }

      this.logger.info({
        message: "Database tables created/verified",
        service: this.SERVICE_NAME,
        method: "createTables",
      });
    } catch (error) {
      this.logger.error({
        message: "Error creating tables: " + error.message,
        service: this.SERVICE_NAME,
        method: "createTables",
        stack: error.stack,
      });
      
      if (this.sentry) {
        this.sentry.captureException(error);
      }
      
      throw error;
    }
  }

  /**
   * Disconnect from the database
   */
  async disconnect() {
    // In Cloudflare, there's no explicit disconnect needed
    this.logger.info({
      message: "Cloudflare database connection closed",
      service: this.SERVICE_NAME,
      method: "disconnect",
    });
  }

  /**
   * Generic query method
   */
  async query(sql, params = []) {
    try {
      const statement = this.d1.prepare(sql);
      if (params.length > 0) {
        return await statement.bind(...params).all();
      }
      return await statement.all();
    } catch (error) {
      this.logger.error({
        message: `Query error: ${error.message}`,
        service: this.SERVICE_NAME,
        method: "query",
        sql,
        params,
        stack: error.stack,
      });
      
      if (this.sentry) {
        this.sentry.captureException(error);
      }
      
      throw error;
    }
  }

  /**
   * Generic execute method for INSERT/UPDATE/DELETE
   */
  async execute(sql, params = []) {
    try {
      const statement = this.d1.prepare(sql);
      if (params.length > 0) {
        return await statement.bind(...params).run();
      }
      return await statement.run();
    } catch (error) {
      this.logger.error({
        message: `Execute error: ${error.message}`,
        service: this.SERVICE_NAME,
        method: "execute",
        sql,
        params,
        stack: error.stack,
      });
      
      if (this.sentry) {
        this.sentry.captureException(error);
      }
      
      throw error;
    }
  }

  /**
   * Insert a document (compatibility with MongoDB interface)
   */
  async insertOne(collection, document) {
    try {
      // Map collection names to table names
      const tableMap = {
        users: "users",
        monitors: "monitors",
        checks: "checks",
        teams: "teams",
        notifications: "notifications",
        invite_tokens: "invite_tokens",
        maintenance_windows: "maintenance_windows",
        status_pages: "status_pages"
      };

      const table = tableMap[collection];
      if (!table) {
        throw new Error(`Collection ${collection} not supported`);
      }

      // Convert document to SQL insert
      const keys = Object.keys(document);
      const values = Object.values(document);
      const placeholders = keys.map(() => "?").join(", ");
      const sql = `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${placeholders})`;
      
      const result = await this.execute(sql, values);
      return { insertedId: document.id, result };
    } catch (error) {
      this.logger.error({
        message: `Insert error: ${error.message}`,
        service: this.SERVICE_NAME,
        method: "insertOne",
        collection,
        document,
        stack: error.stack,
      });
      
      if (this.sentry) {
        this.sentry.captureException(error);
      }
      
      throw error;
    }
  }

  /**
   * Find documents (compatibility with MongoDB interface)
   */
  async find(collection, filter = {}) {
    try {
      // Map collection names to table names
      const tableMap = {
        users: "users",
        monitors: "monitors",
        checks: "checks",
        teams: "teams",
        notifications: "notifications",
        invite_tokens: "invite_tokens",
        maintenance_windows: "maintenance_windows",
        status_pages: "status_pages"
      };

      const table = tableMap[collection];
      if (!table) {
        throw new Error(`Collection ${collection} not supported`);
      }

      // Convert filter to WHERE clause
      const keys = Object.keys(filter);
      if (keys.length === 0) {
        // No filter, select all
        const result = await this.query(`SELECT * FROM ${table}`);
        return result.results || [];
      }

      // Build WHERE clause
      const whereClause = keys.map(key => `${key} = ?`).join(" AND ");
      const values = keys.map(key => filter[key]);
      const sql = `SELECT * FROM ${table} WHERE ${whereClause}`;
      
      const result = await this.query(sql, values);
      return result.results || [];
    } catch (error) {
      this.logger.error({
        message: `Find error: ${error.message}`,
        service: this.SERVICE_NAME,
        method: "find",
        collection,
        filter,
        stack: error.stack,
      });
      
      if (this.sentry) {
        this.sentry.captureException(error);
      }
      
      throw error;
    }
  }

  /**
   * Find one document (compatibility with MongoDB interface)
   */
  async findOne(collection, filter = {}) {
    try {
      const results = await this.find(collection, filter);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      this.logger.error({
        message: `FindOne error: ${error.message}`,
        service: this.SERVICE_NAME,
        method: "findOne",
        collection,
        filter,
        stack: error.stack,
      });
      
      if (this.sentry) {
        this.sentry.captureException(error);
      }
      
      throw error;
    }
  }

  /**
   * Update documents (compatibility with MongoDB interface)
   */
  async updateOne(collection, filter, update) {
    try {
      // Map collection names to table names
      const tableMap = {
        users: "users",
        monitors: "monitors",
        checks: "checks",
        teams: "teams",
        notifications: "notifications",
        invite_tokens: "invite_tokens",
        maintenance_windows: "maintenance_windows",
        status_pages: "status_pages"
      };

      const table = tableMap[collection];
      if (!table) {
        throw new Error(`Collection ${collection} not supported`);
      }

      // For simplicity, we only support updating by ID
      if (!filter.id) {
        throw new Error("Update operations must include an ID filter");
      }

      // Convert update object to SET clause
      const updateData = update.$set || update;
      const keys = Object.keys(updateData);
      const setClause = keys.map(key => `${key} = ?`).join(", ");
      const values = keys.map(key => updateData[key]);
      
      // Add ID to the end of values array for WHERE clause
      values.push(filter.id);
      
      const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
      
      const result = await this.execute(sql, values);
      return { modifiedCount: result.meta.changes, matchedCount: result.meta.changes };
    } catch (error) {
      this.logger.error({
        message: `Update error: ${error.message}`,
        service: this.SERVICE_NAME,
        method: "updateOne",
        collection,
        filter,
        update,
        stack: error.stack,
      });
      
      if (this.sentry) {
        this.sentry.captureException(error);
      }
      
      throw error;
    }
  }

  /**
   * Delete documents (compatibility with MongoDB interface)
   */
  async deleteOne(collection, filter) {
    try {
      // Map collection names to table names
      const tableMap = {
        users: "users",
        monitors: "monitors",
        checks: "checks",
        teams: "teams",
        notifications: "notifications",
        invite_tokens: "invite_tokens",
        maintenance_windows: "maintenance_windows",
        status_pages: "status_pages"
      };

      const table = tableMap[collection];
      if (!table) {
        throw new Error(`Collection ${collection} not supported`);
      }

      // For simplicity, we only support deleting by ID
      if (!filter.id) {
        throw new Error("Delete operations must include an ID filter");
      }

      const sql = `DELETE FROM ${table} WHERE id = ?`;
      const result = await this.execute(sql, [filter.id]);
      return { deletedCount: result.meta.changes };
    } catch (error) {
      this.logger.error({
        message: `Delete error: ${error.message}`,
        service: this.SERVICE_NAME,
        method: "deleteOne",
        collection,
        filter,
        stack: error.stack,
      });
      
      if (this.sentry) {
        this.sentry.captureException(error);
      }
      
      throw error;
    }
  }

  /**
   * Delete many documents (compatibility with MongoDB interface)
   */
  async deleteMany(collection, filter) {
    try {
      // Map collection names to table names
      const tableMap = {
        users: "users",
        monitors: "monitors",
        checks: "checks",
        teams: "teams",
        notifications: "notifications",
        invite_tokens: "invite_tokens",
        maintenance_windows: "maintenance_windows",
        status_pages: "status_pages"
      };

      const table = tableMap[collection];
      if (!table) {
        throw new Error(`Collection ${collection} not supported`);
      }

      // For simplicity, we only support deleting by ID or teamId
      const keys = Object.keys(filter);
      if (keys.length === 0) {
        throw new Error("Delete operations must include a filter");
      }

      // Build WHERE clause
      const whereClause = keys.map(key => `${key} = ?`).join(" AND ");
      const values = keys.map(key => filter[key]);
      const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
      
      const result = await this.execute(sql, values);
      return { deletedCount: result.meta.changes };
    } catch (error) {
      this.logger.error({
        message: `DeleteMany error: ${error.message}`,
        service: this.SERVICE_NAME,
        method: "deleteMany",
        collection,
        filter,
        stack: error.stack,
      });
      
      if (this.sentry) {
        this.sentry.captureException(error);
      }
      
      throw error;
    }
  }

  /**
   * Count documents (compatibility with MongoDB interface)
   */
  async count(collection, filter = {}) {
    try {
      // Map collection names to table names
      const tableMap = {
        users: "users",
        monitors: "monitors",
        checks: "checks",
        teams: "teams",
        notifications: "notifications",
        invite_tokens: "invite_tokens",
        maintenance_windows: "maintenance_windows",
        status_pages: "status_pages"
      };

      const table = tableMap[collection];
      if (!table) {
        throw new Error(`Collection ${collection} not supported`);
      }

      // Convert filter to WHERE clause
      const keys = Object.keys(filter);
      if (keys.length === 0) {
        // No filter, count all
        const result = await this.query(`SELECT COUNT(*) as count FROM ${table}`);
        return result.results[0].count || 0;
      }

      // Build WHERE clause
      const whereClause = keys.map(key => `${key} = ?`).join(" AND ");
      const values = keys.map(key => filter[key]);
      const sql = `SELECT COUNT(*) as count FROM ${table} WHERE ${whereClause}`;
      
      const result = await this.query(sql, values);
      return result.results[0].count || 0;
    } catch (error) {
      this.logger.error({
        message: `Count error: ${error.message}`,
        service: this.SERVICE_NAME,
        method: "count",
        collection,
        filter,
        stack: error.stack,
      });
      
      if (this.sentry) {
        this.sentry.captureException(error);
      }
      
      throw error;
    }
  }

  /**
   * Aggregate documents (simplified compatibility with MongoDB interface)
   */
  async aggregate(collection, pipeline) {
    try {
      // Map collection names to table names
      const tableMap = {
        users: "users",
        monitors: "monitors",
        checks: "checks",
        teams: "teams",
        notifications: "notifications",
        invite_tokens: "invite_tokens",
        maintenance_windows: "maintenance_windows",
        status_pages: "status_pages"
      };

      const table = tableMap[collection];
      if (!table) {
        throw new Error(`Collection ${collection} not supported`);
      }

      // For now, we'll just return all documents
      // A full aggregation implementation would be complex
      const result = await this.query(`SELECT * FROM ${table}`);
      return result.results || [];
    } catch (error) {
      this.logger.error({
        message: `Aggregate error: ${error.message}`,
        service: this.SERVICE_NAME,
        method: "aggregate",
        collection,
        pipeline,
        stack: error.stack,
      });
      
      if (this.sentry) {
        this.sentry.captureException(error);
      }
      
      throw error;
    }
  }
}

export default CFDatabase;
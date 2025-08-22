export default class MonitorModule {
  constructor({ logger, d1 }) {
    this.logger = logger;
    this.d1 = d1;
  }

  /**
   * Get a monitor by ID
   */
  async getMonitorById(id) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM monitors WHERE id = ?")
        .bind(id)
        .first();
      
      // Convert JSON fields back to objects
      if (result) {
        if (result.statusWindow) {
          try {
            result.statusWindow = JSON.parse(result.statusWindow);
          } catch (e) {
            result.statusWindow = [];
          }
        }
        if (result.notifications) {
          try {
            result.notifications = JSON.parse(result.notifications);
          } catch (e) {
            result.notifications = [];
          }
        }
        if (result.thresholds) {
          try {
            result.thresholds = JSON.parse(result.thresholds);
          } catch (e) {
            result.thresholds = {};
          }
        }
        // Convert boolean values
        result.isActive = result.isActive === 1;
        result.ignoreTlsErrors = result.ignoreTlsErrors === 1;
      }
      
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error getting monitor by ID: ${error.message}`,
        service: "MonitorModule",
        method: "getMonitorById",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get all monitors
   */
  async getAllMonitors() {
    try {
      const result = await this.d1.prepare("SELECT * FROM monitors").all();
      const monitors = result.results || [];
      
      // Convert JSON fields back to objects
      return monitors.map(monitor => {
        if (monitor.statusWindow) {
          try {
            monitor.statusWindow = JSON.parse(monitor.statusWindow);
          } catch (e) {
            monitor.statusWindow = [];
          }
        }
        if (monitor.notifications) {
          try {
            monitor.notifications = JSON.parse(monitor.notifications);
          } catch (e) {
            monitor.notifications = [];
          }
        }
        if (monitor.thresholds) {
          try {
            monitor.thresholds = JSON.parse(monitor.thresholds);
          } catch (e) {
            monitor.thresholds = {};
          }
        }
        // Convert boolean values
        monitor.isActive = monitor.isActive === 1;
        monitor.ignoreTlsErrors = monitor.ignoreTlsErrors === 1;
        return monitor;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting all monitors: ${error.message}`,
        service: "MonitorModule",
        method: "getAllMonitors",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get monitors by user ID
   */
  async getMonitorsByUserId(userId) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM monitors WHERE userId = ?")
        .bind(userId)
        .all();
      
      const monitors = result.results || [];
      
      // Convert JSON fields back to objects
      return monitors.map(monitor => {
        if (monitor.statusWindow) {
          try {
            monitor.statusWindow = JSON.parse(monitor.statusWindow);
          } catch (e) {
            monitor.statusWindow = [];
          }
        }
        if (monitor.notifications) {
          try {
            monitor.notifications = JSON.parse(monitor.notifications);
          } catch (e) {
            monitor.notifications = [];
          }
        }
        if (monitor.thresholds) {
          try {
            monitor.thresholds = JSON.parse(monitor.thresholds);
          } catch (e) {
            monitor.thresholds = {};
          }
        }
        // Convert boolean values
        monitor.isActive = monitor.isActive === 1;
        monitor.ignoreTlsErrors = monitor.ignoreTlsErrors === 1;
        return monitor;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting monitors by user ID: ${error.message}`,
        service: "MonitorModule",
        method: "getMonitorsByUserId",
        userId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get monitors by team ID
   */
  async getMonitorsByTeamId(teamId) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM monitors WHERE teamId = ?")
        .bind(teamId)
        .all();
      
      const monitors = result.results || [];
      
      // Convert JSON fields back to objects
      return monitors.map(monitor => {
        if (monitor.statusWindow) {
          try {
            monitor.statusWindow = JSON.parse(monitor.statusWindow);
          } catch (e) {
            monitor.statusWindow = [];
          }
        }
        if (monitor.notifications) {
          try {
            monitor.notifications = JSON.parse(monitor.notifications);
          } catch (e) {
            monitor.notifications = [];
          }
        }
        if (monitor.thresholds) {
          try {
            monitor.thresholds = JSON.parse(monitor.thresholds);
          } catch (e) {
            monitor.thresholds = {};
          }
        }
        // Convert boolean values
        monitor.isActive = monitor.isActive === 1;
        monitor.ignoreTlsErrors = monitor.ignoreTlsErrors === 1;
        return monitor;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting monitors by team ID: ${error.message}`,
        service: "MonitorModule",
        method: "getMonitorsByTeamId",
        teamId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new monitor
   */
  async createMonitor(monitorData) {
    try {
      const {
        id,
        userId,
        teamId,
        name,
        description,
        status,
        statusWindow,
        statusWindowSize,
        statusWindowThreshold,
        type,
        ignoreTlsErrors,
        jsonPath,
        expectedValue,
        matchMethod,
        url,
        port,
        isActive,
        interval,
        uptimePercentage,
        notifications,
        secret,
        thresholds,
        alertThreshold,
        cpuAlertThreshold,
        memoryAlertThreshold,
        diskAlertThreshold,
        tempAlertThreshold,
        gameId,
        createdAt,
        updatedAt,
      } = monitorData;

      // Convert JSON fields to strings
      const statusWindowString = Array.isArray(statusWindow) ? JSON.stringify(statusWindow) : statusWindow;
      const notificationsString = Array.isArray(notifications) ? JSON.stringify(notifications) : notifications;
      const thresholdsString = thresholds ? JSON.stringify(thresholds) : null;

      const result = await this.d1
        .prepare(
          "INSERT INTO monitors (id, userId, teamId, name, description, status, statusWindow, statusWindowSize, statusWindowThreshold, type, ignoreTlsErrors, jsonPath, expectedValue, matchMethod, url, port, isActive, interval, uptimePercentage, notifications, secret, thresholds, alertThreshold, cpuAlertThreshold, memoryAlertThreshold, diskAlertThreshold, tempAlertThreshold, gameId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          id,
          userId,
          teamId,
          name,
          description,
          status,
          statusWindowString,
          statusWindowSize,
          statusWindowThreshold,
          type,
          ignoreTlsErrors ? 1 : 0,
          jsonPath,
          expectedValue,
          matchMethod,
          url,
          port,
          isActive ? 1 : 0,
          interval,
          uptimePercentage,
          notificationsString,
          secret,
          thresholdsString,
          alertThreshold,
          cpuAlertThreshold,
          memoryAlertThreshold,
          diskAlertThreshold,
          tempAlertThreshold,
          gameId,
          createdAt,
          updatedAt
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error creating monitor: ${error.message}`,
        service: "MonitorModule",
        method: "createMonitor",
        monitorData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update a monitor
   */
  async updateMonitor(id, monitorData) {
    try {
      const {
        userId,
        teamId,
        name,
        description,
        status,
        statusWindow,
        statusWindowSize,
        statusWindowThreshold,
        type,
        ignoreTlsErrors,
        jsonPath,
        expectedValue,
        matchMethod,
        url,
        port,
        isActive,
        interval,
        uptimePercentage,
        notifications,
        secret,
        thresholds,
        alertThreshold,
        cpuAlertThreshold,
        memoryAlertThreshold,
        diskAlertThreshold,
        tempAlertThreshold,
        gameId,
        updatedAt,
      } = monitorData;

      // Convert JSON fields to strings
      const statusWindowString = Array.isArray(statusWindow) ? JSON.stringify(statusWindow) : statusWindow;
      const notificationsString = Array.isArray(notifications) ? JSON.stringify(notifications) : notifications;
      const thresholdsString = thresholds ? JSON.stringify(thresholds) : null;

      const result = await this.d1
        .prepare(
          "UPDATE monitors SET userId = ?, teamId = ?, name = ?, description = ?, status = ?, statusWindow = ?, statusWindowSize = ?, statusWindowThreshold = ?, type = ?, ignoreTlsErrors = ?, jsonPath = ?, expectedValue = ?, matchMethod = ?, url = ?, port = ?, isActive = ?, interval = ?, uptimePercentage = ?, notifications = ?, secret = ?, thresholds = ?, alertThreshold = ?, cpuAlertThreshold = ?, memoryAlertThreshold = ?, diskAlertThreshold = ?, tempAlertThreshold = ?, gameId = ?, updatedAt = ? WHERE id = ?"
        )
        .bind(
          userId,
          teamId,
          name,
          description,
          status,
          statusWindowString,
          statusWindowSize,
          statusWindowThreshold,
          type,
          ignoreTlsErrors ? 1 : 0,
          jsonPath,
          expectedValue,
          matchMethod,
          url,
          port,
          isActive ? 1 : 0,
          interval,
          uptimePercentage,
          notificationsString,
          secret,
          thresholdsString,
          alertThreshold,
          cpuAlertThreshold,
          memoryAlertThreshold,
          diskAlertThreshold,
          tempAlertThreshold,
          gameId,
          updatedAt,
          id
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error updating monitor: ${error.message}`,
        service: "MonitorModule",
        method: "updateMonitor",
        id,
        monitorData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete a monitor
   */
  async deleteMonitor(id) {
    try {
      const result = await this.d1
        .prepare("DELETE FROM monitors WHERE id = ?")
        .bind(id)
        .run();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error deleting monitor: ${error.message}`,
        service: "MonitorModule",
        method: "deleteMonitor",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get monitor stats
   */
  async getMonitorStats(monitorId, limit = 50) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM checks WHERE monitorId = ? ORDER BY createdAt DESC LIMIT ?")
        .bind(monitorId, limit)
        .all();
      return result.results || [];
    } catch (error) {
      this.logger.error({
        message: `Error getting monitor stats: ${error.message}`,
        service: "MonitorModule",
        method: "getMonitorStats",
        monitorId,
        limit,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get monitor count
   */
  async getMonitorCount() {
    try {
      const result = await this.d1.prepare("SELECT COUNT(*) as count FROM monitors").first();
      return result.count || 0;
    } catch (error) {
      this.logger.error({
        message: `Error getting monitor count: ${error.message}`,
        service: "MonitorModule",
        method: "getMonitorCount",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get active monitors
   */
  async getActiveMonitors() {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM monitors WHERE isActive = 1")
        .all();
      
      const monitors = result.results || [];
      
      // Convert JSON fields back to objects
      return monitors.map(monitor => {
        if (monitor.statusWindow) {
          try {
            monitor.statusWindow = JSON.parse(monitor.statusWindow);
          } catch (e) {
            monitor.statusWindow = [];
          }
        }
        if (monitor.notifications) {
          try {
            monitor.notifications = JSON.parse(monitor.notifications);
          } catch (e) {
            monitor.notifications = [];
          }
        }
        if (monitor.thresholds) {
          try {
            monitor.thresholds = JSON.parse(monitor.thresholds);
          } catch (e) {
            monitor.thresholds = {};
          }
        }
        // Convert boolean values
        monitor.isActive = monitor.isActive === 1;
        monitor.ignoreTlsErrors = monitor.ignoreTlsErrors === 1;
        return monitor;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting active monitors: ${error.message}`,
        service: "MonitorModule",
        method: "getActiveMonitors",
        stack: error.stack,
      });
      throw error;
    }
  }
}
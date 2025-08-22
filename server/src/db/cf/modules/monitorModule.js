import crypto from 'crypto';

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

  /**
   * Update or create monitor statistics
   */
  async updateMonitorStats(monitorId, checkData) {
    try {
      // Get current stats or create new ones
      let stats = await this.d1
        .prepare("SELECT * FROM monitor_stats WHERE monitorId = ?")
        .bind(monitorId)
        .first();

      const now = new Date().toISOString();
      const timestamp = Date.now();

      if (!stats) {
        // Create new stats record
        const id = crypto.randomUUID();
        stats = {
          id,
          monitorId,
          avgResponseTime: checkData.responseTime || 0,
          totalChecks: 1,
          totalUpChecks: checkData.status ? 1 : 0,
          totalDownChecks: checkData.status ? 0 : 1,
          uptimePercentage: checkData.status ? 100 : 0,
          lastCheckTimestamp: timestamp,
          lastResponseTime: checkData.responseTime || 0,
          timeOfLastFailure: checkData.status ? 0 : timestamp,
          createdAt: now,
          updatedAt: now
        };

        await this.d1
          .prepare(`INSERT INTO monitor_stats 
            (id, monitorId, avgResponseTime, totalChecks, totalUpChecks, totalDownChecks, 
             uptimePercentage, lastCheckTimestamp, lastResponseTime, timeOfLastFailure, 
             createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(
            stats.id, stats.monitorId, stats.avgResponseTime, stats.totalChecks,
            stats.totalUpChecks, stats.totalDownChecks, stats.uptimePercentage,
            stats.lastCheckTimestamp, stats.lastResponseTime, stats.timeOfLastFailure,
            stats.createdAt, stats.updatedAt
          )
          .run();
      } else {
        // Update existing stats
        const totalChecks = stats.totalChecks + 1;
        const totalUpChecks = stats.totalUpChecks + (checkData.status ? 1 : 0);
        const totalDownChecks = stats.totalDownChecks + (checkData.status ? 0 : 1);
        const avgResponseTime = ((stats.avgResponseTime * stats.totalChecks) + (checkData.responseTime || 0)) / totalChecks;
        const uptimePercentage = (totalUpChecks / totalChecks) * 100;
        const timeOfLastFailure = checkData.status ? stats.timeOfLastFailure : timestamp;

        await this.d1
          .prepare(`UPDATE monitor_stats 
            SET avgResponseTime = ?, totalChecks = ?, totalUpChecks = ?, totalDownChecks = ?,
                uptimePercentage = ?, lastCheckTimestamp = ?, lastResponseTime = ?,
                timeOfLastFailure = ?, updatedAt = ?
            WHERE monitorId = ?`)
          .bind(
            avgResponseTime, totalChecks, totalUpChecks, totalDownChecks,
            uptimePercentage, timestamp, checkData.responseTime || 0,
            timeOfLastFailure, now, monitorId
          )
          .run();

        stats = {
          ...stats,
          avgResponseTime,
          totalChecks,
          totalUpChecks,
          totalDownChecks,
          uptimePercentage,
          lastCheckTimestamp: timestamp,
          lastResponseTime: checkData.responseTime || 0,
          timeOfLastFailure,
          updatedAt: now
        };
      }

      // Also update the monitor's uptimePercentage field
      await this.d1
        .prepare("UPDATE monitors SET uptimePercentage = ?, updatedAt = ? WHERE id = ?")
        .bind(stats.uptimePercentage, now, monitorId)
        .run();

      return stats;
    } catch (error) {
      this.logger.error({
        message: `Error updating monitor stats: ${error.message}`,
        service: "MonitorModule",
        method: "updateMonitorStats",
        monitorId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get aggregated monitor statistics
   */
  async getAggregatedMonitorStats(monitorId) {
    try {
      const stats = await this.d1
        .prepare("SELECT * FROM monitor_stats WHERE monitorId = ?")
        .bind(monitorId)
        .first();

      if (!stats) {
        // Return default stats if none exist
        return {
          monitorId,
          avgResponseTime: 0,
          totalChecks: 0,
          totalUpChecks: 0,
          totalDownChecks: 0,
          uptimePercentage: 0,
          lastCheckTimestamp: 0,
          lastResponseTime: 0,
          timeOfLastFailure: 0
        };
      }

      return stats;
    } catch (error) {
      this.logger.error({
        message: `Error getting aggregated monitor stats: ${error.message}`,
        service: "MonitorModule",
        method: "getAggregatedMonitorStats",
        monitorId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get monitor stats for a time range
   */
  async getMonitorStatsForTimeRange(monitorId, startTime, endTime) {
    try {
      const result = await this.d1
        .prepare(`SELECT * FROM checks 
          WHERE monitorId = ? AND createdAt >= ? AND createdAt <= ?
          ORDER BY createdAt DESC`)
        .bind(monitorId, startTime, endTime)
        .all();

      const checks = result.results || [];
      
      // Calculate stats for the time range
      const totalChecks = checks.length;
      const upChecks = checks.filter(c => c.status).length;
      const downChecks = totalChecks - upChecks;
      const avgResponseTime = totalChecks > 0
        ? checks.reduce((sum, c) => sum + (c.responseTime || 0), 0) / totalChecks
        : 0;
      const uptimePercentage = totalChecks > 0 ? (upChecks / totalChecks) * 100 : 0;

      return {
        monitorId,
        startTime,
        endTime,
        totalChecks,
        totalUpChecks: upChecks,
        totalDownChecks: downChecks,
        avgResponseTime,
        uptimePercentage,
        checks
      };
    } catch (error) {
      this.logger.error({
        message: `Error getting monitor stats for time range: ${error.message}`,
        service: "MonitorModule",
        method: "getMonitorStatsForTimeRange",
        monitorId,
        startTime,
        endTime,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Reset monitor statistics
   */
  async resetMonitorStats(monitorId) {
    try {
      const now = new Date().toISOString();
      
      await this.d1
        .prepare(`UPDATE monitor_stats 
          SET avgResponseTime = 0, totalChecks = 0, totalUpChecks = 0, totalDownChecks = 0,
              uptimePercentage = 0, lastCheckTimestamp = 0, lastResponseTime = 0,
              timeOfLastFailure = 0, updatedAt = ?
          WHERE monitorId = ?`)
        .bind(now, monitorId)
        .run();

      // Also reset the monitor's uptimePercentage
      await this.d1
        .prepare("UPDATE monitors SET uptimePercentage = 0, updatedAt = ? WHERE id = ?")
        .bind(now, monitorId)
        .run();

      return { success: true, message: "Monitor stats reset successfully" };
    } catch (error) {
      this.logger.error({
        message: `Error resetting monitor stats: ${error.message}`,
        service: "MonitorModule",
        method: "resetMonitorStats",
        monitorId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get monitors by IDs
   */
  async getMonitorsByIds(monitorIds) {
    try {
      if (!Array.isArray(monitorIds) || monitorIds.length === 0) {
        return [];
      }

      const placeholders = monitorIds.map(() => '?').join(',');
      const result = await this.d1
        .prepare(`SELECT * FROM monitors WHERE id IN (${placeholders})`)
        .bind(...monitorIds)
        .all();

      return (result.results || []).map(monitor => {
        // Parse JSON fields
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
        message: `Error getting monitors by IDs: ${error.message}`,
        service: "MonitorModule",
        method: "getMonitorsByIds",
        monitorIds,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get monitor checks with pagination and filtering
   */
  async getMonitorChecks(monitorId, dateRange, sortOrder = 'DESC') {
    try {
      let query = `SELECT * FROM checks WHERE monitorId = ?`;
      const params = [monitorId];

      // Add date range filtering
      if (dateRange && dateRange.start && dateRange.end) {
        query += ` AND createdAt >= ? AND createdAt <= ?`;
        params.push(dateRange.start, dateRange.end);
      }

      // Add sorting
      query += ` ORDER BY createdAt ${sortOrder}`;

      const result = await this.d1.prepare(query).bind(...params).all();
      
      return (result.results || []).map(check => ({
        ...check,
        status: check.status === 1,
        ack: check.ack === 1,
        // Parse JSON fields if they exist
        timings: check.timings ? JSON.parse(check.timings) : null,
        cpu: check.cpu ? JSON.parse(check.cpu) : null,
        memory: check.memory ? JSON.parse(check.memory) : null,
        disk: check.disk ? JSON.parse(check.disk) : null,
        host: check.host ? JSON.parse(check.host) : null,
        errors: check.errors ? JSON.parse(check.errors) : null,
        capture: check.capture ? JSON.parse(check.capture) : null,
        net: check.net ? JSON.parse(check.net) : null,
        audits: check.audits ? JSON.parse(check.audits) : null
      }));
    } catch (error) {
      this.logger.error({
        message: `Error getting monitor checks: ${error.message}`,
        service: "MonitorModule",
        method: "getMonitorChecks",
        monitorId,
        dateRange,
        sortOrder,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete all monitors for a team
   */
  async deleteAllMonitors(teamId) {
    try {
      // First delete all checks for monitors in this team
      await this.d1.prepare("DELETE FROM checks WHERE teamId = ?").bind(teamId).run();
      
      // Delete monitor stats
      await this.d1.prepare(`
        DELETE FROM monitor_stats 
        WHERE monitorId IN (SELECT id FROM monitors WHERE teamId = ?)
      `).bind(teamId).run();
      
      // Then delete all monitors
      const result = await this.d1.prepare("DELETE FROM monitors WHERE teamId = ?").bind(teamId).run();
      
      return { deletedCount: result.meta.changes };
    } catch (error) {
      this.logger.error({
        message: `Error deleting all monitors: ${error.message}`,
        service: "MonitorModule",
        method: "deleteAllMonitors",
        teamId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete monitors by user ID
   */
  async deleteMonitorsByUserId(userId) {
    try {
      // Get monitor IDs first
      const monitors = await this.d1.prepare("SELECT id FROM monitors WHERE userId = ?").bind(userId).all();
      const monitorIds = (monitors.results || []).map(m => m.id);
      
      if (monitorIds.length === 0) {
        return { deletedCount: 0 };
      }

      // Delete related records
      const placeholders = monitorIds.map(() => '?').join(',');
      
      await this.d1.prepare(`DELETE FROM checks WHERE monitorId IN (${placeholders})`).bind(...monitorIds).run();
      await this.d1.prepare(`DELETE FROM monitor_stats WHERE monitorId IN (${placeholders})`).bind(...monitorIds).run();
      
      // Delete monitors
      const result = await this.d1.prepare("DELETE FROM monitors WHERE userId = ?").bind(userId).run();
      
      return { deletedCount: result.meta.changes };
    } catch (error) {
      this.logger.error({
        message: `Error deleting monitors by user ID: ${error.message}`,
        service: "MonitorModule", 
        method: "deleteMonitorsByUserId",
        userId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Pause/unpause a monitor
   */
  async pauseMonitor(monitorId, isPaused = true) {
    try {
      const now = new Date().toISOString();
      const result = await this.d1
        .prepare("UPDATE monitors SET isActive = ?, updatedAt = ? WHERE id = ?")
        .bind(isPaused ? 0 : 1, now, monitorId)
        .run();

      return { success: result.meta.changes > 0, changes: result.meta.changes };
    } catch (error) {
      this.logger.error({
        message: `Error pausing monitor: ${error.message}`,
        service: "MonitorModule",
        method: "pauseMonitor", 
        monitorId,
        isPaused,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create multiple monitors at once
   */
  async createBulkMonitors(monitors) {
    try {
      const results = [];
      
      // Process monitors one by one to ensure proper error handling
      for (const monitorData of monitors) {
        try {
          const result = await this.createMonitor(monitorData);
          results.push({ success: true, monitor: result });
        } catch (error) {
          results.push({ success: false, error: error.message, monitor: monitorData });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      return {
        total: monitors.length,
        success: successCount,
        failures: failureCount,
        results
      };
    } catch (error) {
      this.logger.error({
        message: `Error creating bulk monitors: ${error.message}`,
        service: "MonitorModule",
        method: "createBulkMonitors",
        monitorsCount: monitors.length,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get uptime details for a monitor (compatibility with MongoDB interface)
   */
  async getUptimeDetailsById(monitorId, dateRange) {
    try {
      // Use the query module for complex uptime calculations
      const MonitorModuleQueries = (await import('./monitorModuleQueries.js')).default;
      const queryModule = new MonitorModuleQueries({ d1: this.d1, logger: this.logger });
      
      return await queryModule.getUptimeDetails(monitorId, dateRange.start, dateRange.end, dateRange.groupBy);
    } catch (error) {
      this.logger.error({
        message: `Error getting uptime details: ${error.message}`,
        service: "MonitorModule",
        method: "getUptimeDetailsById",
        monitorId,
        dateRange,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get monitor statistics by ID
   */
  async getMonitorStatsById(monitorId, sortOrder, dateRange, numToDisplay, normalize) {
    try {
      // Get basic checks for the monitor
      const checks = await this.getMonitorChecks(monitorId, dateRange, sortOrder);
      
      // Limit results if specified
      let displayChecks = checks;
      if (numToDisplay && checks.length > numToDisplay) {
        if (normalize) {
          // Normalize by taking every nth check to spread across the range
          const step = Math.ceil(checks.length / numToDisplay);
          displayChecks = checks.filter((_, index) => index % step === 0);
        } else {
          displayChecks = checks.slice(0, numToDisplay);
        }
      }
      
      // Calculate statistics
      const totalChecks = displayChecks.length;
      const upChecks = displayChecks.filter(c => c.status).length;
      const avgResponseTime = totalChecks > 0 
        ? displayChecks.reduce((sum, c) => sum + (c.responseTime || 0), 0) / totalChecks
        : 0;
      
      return {
        checks: displayChecks,
        stats: {
          totalChecks,
          upChecks,
          downChecks: totalChecks - upChecks,
          uptimePercentage: totalChecks > 0 ? (upChecks / totalChecks) * 100 : 0,
          avgResponseTime
        }
      };
    } catch (error) {
      this.logger.error({
        message: `Error getting monitor stats by ID: ${error.message}`,
        service: "MonitorModule",
        method: "getMonitorStatsById",
        monitorId,
        stack: error.stack,
      });
      throw error;
    }
  }
}
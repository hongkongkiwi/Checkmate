export default class MaintenanceWindowModule {
  constructor({ logger, d1 }) {
    this.logger = logger;
    this.d1 = d1;
  }

  /**
   * Get a maintenance window by ID
   */
  async getMaintenanceWindowById(id) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM maintenance_windows WHERE id = ?")
        .bind(id)
        .first();
      
      // Convert boolean values
      if (result) {
        result.oneTime = result.oneTime === 1;
      }
      
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error getting maintenance window by ID: ${error.message}`,
        service: "MaintenanceWindowModule",
        method: "getMaintenanceWindowById",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get maintenance windows by team ID
   */
  async getMaintenanceWindowsByTeamId(teamId) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM maintenance_windows WHERE teamId = ?")
        .bind(teamId)
        .all();
      
      const windows = result.results || [];
      
      // Convert boolean values
      return windows.map(window => {
        window.oneTime = window.oneTime === 1;
        return window;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting maintenance windows by team ID: ${error.message}`,
        service: "MaintenanceWindowModule",
        method: "getMaintenanceWindowsByTeamId",
        teamId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get maintenance windows by monitor ID
   */
  async getMaintenanceWindowsByMonitorId(monitorId) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM maintenance_windows WHERE monitorId = ?")
        .bind(monitorId)
        .all();
      
      const windows = result.results || [];
      
      // Convert boolean values
      return windows.map(window => {
        window.oneTime = window.oneTime === 1;
        return window;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting maintenance windows by monitor ID: ${error.message}`,
        service: "MaintenanceWindowModule",
        method: "getMaintenanceWindowsByMonitorId",
        monitorId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get all maintenance windows
   */
  async getAllMaintenanceWindows() {
    try {
      const result = await this.d1.prepare("SELECT * FROM maintenance_windows").all();
      
      const windows = result.results || [];
      
      // Convert boolean values
      return windows.map(window => {
        window.oneTime = window.oneTime === 1;
        return window;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting all maintenance windows: ${error.message}`,
        service: "MaintenanceWindowModule",
        method: "getAllMaintenanceWindows",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new maintenance window
   */
  async createMaintenanceWindow(windowData) {
    try {
      const {
        id,
        teamId,
        monitorId,
        name,
        description,
        start,
        end,
        expiry,
        repeat,
        oneTime,
        createdAt,
        updatedAt,
      } = windowData;

      const result = await this.d1
        .prepare(
          "INSERT INTO maintenance_windows (id, teamId, monitorId, name, description, start, end, expiry, repeat, oneTime, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          id,
          teamId,
          monitorId,
          name,
          description,
          start,
          end,
          expiry,
          repeat,
          oneTime ? 1 : 0,
          createdAt,
          updatedAt
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error creating maintenance window: ${error.message}`,
        service: "MaintenanceWindowModule",
        method: "createMaintenanceWindow",
        windowData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update a maintenance window
   */
  async updateMaintenanceWindow(id, windowData) {
    try {
      const {
        teamId,
        monitorId,
        name,
        description,
        start,
        end,
        expiry,
        repeat,
        oneTime,
        updatedAt,
      } = windowData;

      const result = await this.d1
        .prepare(
          "UPDATE maintenance_windows SET teamId = ?, monitorId = ?, name = ?, description = ?, start = ?, end = ?, expiry = ?, repeat = ?, oneTime = ?, updatedAt = ? WHERE id = ?"
        )
        .bind(
          teamId,
          monitorId,
          name,
          description,
          start,
          end,
          expiry,
          repeat,
          oneTime ? 1 : 0,
          updatedAt,
          id
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error updating maintenance window: ${error.message}`,
        service: "MaintenanceWindowModule",
        method: "updateMaintenanceWindow",
        id,
        windowData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete a maintenance window
   */
  async deleteMaintenanceWindow(id) {
    try {
      const result = await this.d1
        .prepare("DELETE FROM maintenance_windows WHERE id = ?")
        .bind(id)
        .run();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error deleting maintenance window: ${error.message}`,
        service: "MaintenanceWindowModule",
        method: "deleteMaintenanceWindow",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete maintenance windows by monitor ID
   */
  async deleteMaintenanceWindowsByMonitorId(monitorId) {
    try {
      const result = await this.d1
        .prepare("DELETE FROM maintenance_windows WHERE monitorId = ?")
        .bind(monitorId)
        .run();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error deleting maintenance windows by monitor ID: ${error.message}`,
        service: "MaintenanceWindowModule",
        method: "deleteMaintenanceWindowsByMonitorId",
        monitorId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get maintenance window count
   */
  async getMaintenanceWindowCount() {
    try {
      const result = await this.d1.prepare("SELECT COUNT(*) as count FROM maintenance_windows").first();
      return result.count || 0;
    } catch (error) {
      this.logger.error({
        message: `Error getting maintenance window count: ${error.message}`,
        service: "MaintenanceWindowModule",
        method: "getMaintenanceWindowCount",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get active maintenance windows
   */
  async getActiveMaintenanceWindows() {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM maintenance_windows WHERE start <= datetime('now') AND end >= datetime('now')")
        .all();
      
      const windows = result.results || [];
      
      // Convert boolean values
      return windows.map(window => {
        window.oneTime = window.oneTime === 1;
        return window;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting active maintenance windows: ${error.message}`,
        service: "MaintenanceWindowModule",
        method: "getActiveMaintenanceWindows",
        stack: error.stack,
      });
      throw error;
    }
  }
}
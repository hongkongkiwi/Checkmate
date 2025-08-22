export default class NotificationModule {
  constructor({ logger, d1 }) {
    this.logger = logger;
    this.d1 = d1;
  }

  /**
   * Get a notification by ID
   */
  async getNotificationById(id) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM notifications WHERE id = ?")
        .bind(id)
        .first();
      
      // Convert JSON fields back to objects
      if (result) {
        if (result.settings) {
          try {
            result.settings = JSON.parse(result.settings);
          } catch (e) {
            result.settings = {};
          }
        }
        // Convert boolean values
        result.enabled = result.enabled === 1;
      }
      
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error getting notification by ID: ${error.message}`,
        service: "NotificationModule",
        method: "getNotificationById",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get notifications by team ID
   */
  async getNotificationsByTeamId(teamId) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM notifications WHERE teamId = ?")
        .bind(teamId)
        .all();
      
      const notifications = result.results || [];
      
      // Convert JSON fields back to objects
      return notifications.map(notification => {
        if (notification.settings) {
          try {
            notification.settings = JSON.parse(notification.settings);
          } catch (e) {
            notification.settings = {};
          }
        }
        // Convert boolean values
        notification.enabled = notification.enabled === 1;
        return notification;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting notifications by team ID: ${error.message}`,
        service: "NotificationModule",
        method: "getNotificationsByTeamId",
        teamId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get all notifications
   */
  async getAllNotifications() {
    try {
      const result = await this.d1.prepare("SELECT * FROM notifications").all();
      
      const notifications = result.results || [];
      
      // Convert JSON fields back to objects
      return notifications.map(notification => {
        if (notification.settings) {
          try {
            notification.settings = JSON.parse(notification.settings);
          } catch (e) {
            notification.settings = {};
          }
        }
        // Convert boolean values
        notification.enabled = notification.enabled === 1;
        return notification;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting all notifications: ${error.message}`,
        service: "NotificationModule",
        method: "getAllNotifications",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new notification
   */
  async createNotification(notificationData) {
    try {
      const {
        id,
        userId,
        teamId,
        name,
        type,
        enabled,
        settings,
        createdAt,
        updatedAt,
      } = notificationData;

      // Convert settings to JSON string
      const settingsString = settings ? JSON.stringify(settings) : null;

      const result = await this.d1
        .prepare(
          "INSERT INTO notifications (id, userId, teamId, name, type, enabled, settings, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          id,
          userId,
          teamId,
          name,
          type,
          enabled ? 1 : 0,
          settingsString,
          createdAt,
          updatedAt
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error creating notification: ${error.message}`,
        service: "NotificationModule",
        method: "createNotification",
        notificationData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update a notification
   */
  async updateNotification(id, notificationData) {
    try {
      const {
        userId,
        teamId,
        name,
        type,
        enabled,
        settings,
        updatedAt,
      } = notificationData;

      // Convert settings to JSON string
      const settingsString = settings ? JSON.stringify(settings) : null;

      const result = await this.d1
        .prepare(
          "UPDATE notifications SET userId = ?, teamId = ?, name = ?, type = ?, enabled = ?, settings = ?, updatedAt = ? WHERE id = ?"
        )
        .bind(
          userId,
          teamId,
          name,
          type,
          enabled ? 1 : 0,
          settingsString,
          updatedAt,
          id
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error updating notification: ${error.message}`,
        service: "NotificationModule",
        method: "updateNotification",
        id,
        notificationData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id) {
    try {
      const result = await this.d1
        .prepare("DELETE FROM notifications WHERE id = ?")
        .bind(id)
        .run();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error deleting notification: ${error.message}`,
        service: "NotificationModule",
        method: "deleteNotification",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get notification count
   */
  async getNotificationCount() {
    try {
      const result = await this.d1.prepare("SELECT COUNT(*) as count FROM notifications").first();
      return result.count || 0;
    } catch (error) {
      this.logger.error({
        message: `Error getting notification count: ${error.message}`,
        service: "NotificationModule",
        method: "getNotificationCount",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get enabled notifications by team ID
   */
  async getEnabledNotificationsByTeamId(teamId) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM notifications WHERE teamId = ? AND enabled = 1")
        .bind(teamId)
        .all();
      
      const notifications = result.results || [];
      
      // Convert JSON fields back to objects
      return notifications.map(notification => {
        if (notification.settings) {
          try {
            notification.settings = JSON.parse(notification.settings);
          } catch (e) {
            notification.settings = {};
          }
        }
        // Convert boolean values
        notification.enabled = notification.enabled === 1;
        return notification;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting enabled notifications by team ID: ${error.message}`,
        service: "NotificationModule",
        method: "getEnabledNotificationsByTeamId",
        teamId,
        stack: error.stack,
      });
      throw error;
    }
  }
}
import crypto from 'crypto';

const SERVICE_NAME = "AnnouncementModule";

class AnnouncementModule {
  constructor({ d1, logger }) {
    this.d1 = d1;
    this.logger = logger;
  }

  /**
   * Create a new announcement
   */
  async createAnnouncement(announcementData) {
    try {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      const announcement = {
        id,
        title: announcementData.title,
        message: announcementData.message,
        userId: announcementData.userId || null,
        isActive: announcementData.isActive !== undefined ? announcementData.isActive : true,
        priority: announcementData.priority || 'normal',
        expiresAt: announcementData.expiresAt || null,
        createdAt: now,
        updatedAt: now
      };

      const keys = Object.keys(announcement);
      const values = Object.values(announcement);
      const placeholders = keys.map(() => '?').join(', ');

      await this.d1
        .prepare(`INSERT INTO announcements (${keys.join(', ')}) VALUES (${placeholders})`)
        .bind(...values)
        .run();

      return announcement;
    } catch (error) {
      this.logger.error({
        message: `Error creating announcement: ${error.message}`,
        service: SERVICE_NAME,
        method: "createAnnouncement",
        announcementData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get all announcements
   */
  async getAnnouncements(options = {}) {
    try {
      const {
        isActive = null,
        limit = 50,
        offset = 0,
        orderBy = 'createdAt',
        orderDirection = 'DESC'
      } = options;

      let query = `
        SELECT 
          a.*,
          u.firstName,
          u.lastName,
          u.email as authorEmail
        FROM announcements a
        LEFT JOIN users u ON a.userId = u.id
      `;
      
      const conditions = [];
      const params = [];

      // Filter by active status
      if (isActive !== null) {
        conditions.push('a.isActive = ?');
        params.push(isActive ? 1 : 0);
      }

      // Filter by expiry
      if (isActive === true || isActive === null) {
        conditions.push('(a.expiresAt IS NULL OR a.expiresAt > ?)');
        params.push(new Date().toISOString());
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY a.${orderBy} ${orderDirection}`;
      
      if (limit) {
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);
      }

      const result = await this.d1.prepare(query).bind(...params).all();
      
      return (result.results || []).map(announcement => ({
        ...announcement,
        isActive: announcement.isActive === 1,
        author: announcement.firstName && announcement.lastName 
          ? `${announcement.firstName} ${announcement.lastName}`
          : null
      }));
    } catch (error) {
      this.logger.error({
        message: `Error getting announcements: ${error.message}`,
        service: SERVICE_NAME,
        method: "getAnnouncements",
        options,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(id) {
    try {
      const result = await this.d1
        .prepare(`
          SELECT 
            a.*,
            u.firstName,
            u.lastName,
            u.email as authorEmail
          FROM announcements a
          LEFT JOIN users u ON a.userId = u.id
          WHERE a.id = ?
        `)
        .bind(id)
        .first();

      if (result) {
        return {
          ...result,
          isActive: result.isActive === 1,
          author: result.firstName && result.lastName 
            ? `${result.firstName} ${result.lastName}`
            : null
        };
      }

      return null;
    } catch (error) {
      this.logger.error({
        message: `Error getting announcement by ID: ${error.message}`,
        service: SERVICE_NAME,
        method: "getAnnouncementById",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update an announcement
   */
  async updateAnnouncement(id, updateData) {
    try {
      const now = new Date().toISOString();
      const updates = { ...updateData, updatedAt: now };

      // Convert boolean to integer for SQLite
      if ('isActive' in updates) {
        updates.isActive = updates.isActive ? 1 : 0;
      }

      const keys = Object.keys(updates);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      const values = keys.map(key => updates[key]);

      const result = await this.d1
        .prepare(`UPDATE announcements SET ${setClause} WHERE id = ?`)
        .bind(...values, id)
        .run();

      return { success: result.meta.changes > 0, changes: result.meta.changes };
    } catch (error) {
      this.logger.error({
        message: `Error updating announcement: ${error.message}`,
        service: SERVICE_NAME,
        method: "updateAnnouncement",
        id,
        updateData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(id) {
    try {
      const result = await this.d1
        .prepare("DELETE FROM announcements WHERE id = ?")
        .bind(id)
        .run();

      return { success: result.meta.changes > 0, changes: result.meta.changes };
    } catch (error) {
      this.logger.error({
        message: `Error deleting announcement: ${error.message}`,
        service: SERVICE_NAME,
        method: "deleteAnnouncement",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get active announcements (public API)
   */
  async getActiveAnnouncements() {
    try {
      return await this.getAnnouncements({ 
        isActive: true,
        orderBy: 'priority,createdAt',
        orderDirection: 'DESC' 
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting active announcements: ${error.message}`,
        service: SERVICE_NAME,
        method: "getActiveAnnouncements",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Archive (deactivate) an announcement
   */
  async archiveAnnouncement(id) {
    try {
      return await this.updateAnnouncement(id, { isActive: false });
    } catch (error) {
      this.logger.error({
        message: `Error archiving announcement: ${error.message}`,
        service: SERVICE_NAME,
        method: "archiveAnnouncement",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Clean up expired announcements
   */
  async cleanupExpiredAnnouncements() {
    try {
      const now = new Date().toISOString();
      const result = await this.d1
        .prepare("DELETE FROM announcements WHERE expiresAt IS NOT NULL AND expiresAt <= ?")
        .bind(now)
        .run();

      this.logger.info({
        message: `Cleaned up ${result.meta.changes} expired announcements`,
        service: SERVICE_NAME,
        method: "cleanupExpiredAnnouncements",
      });

      return result.meta.changes;
    } catch (error) {
      this.logger.error({
        message: `Error cleaning up expired announcements: ${error.message}`,
        service: SERVICE_NAME,
        method: "cleanupExpiredAnnouncements",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get announcement count by status
   */
  async getAnnouncementStats() {
    try {
      const result = await this.d1
        .prepare(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN isActive = 1 THEN 1 END) as active,
            COUNT(CASE WHEN isActive = 0 THEN 1 END) as archived,
            COUNT(CASE WHEN expiresAt IS NOT NULL AND expiresAt <= ? THEN 1 END) as expired
          FROM announcements
        `)
        .bind(new Date().toISOString())
        .first();

      return {
        total: result.total || 0,
        active: result.active || 0,
        archived: result.archived || 0,
        expired: result.expired || 0
      };
    } catch (error) {
      this.logger.error({
        message: `Error getting announcement stats: ${error.message}`,
        service: SERVICE_NAME,
        method: "getAnnouncementStats",
        stack: error.stack,
      });
      throw error;
    }
  }
}

export default AnnouncementModule;
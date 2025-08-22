export default class StatusPageModule {
  constructor({ logger, d1 }) {
    this.logger = logger;
    this.d1 = d1;
  }

  /**
   * Get a status page by ID
   */
  async getStatusPageById(id) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM status_pages WHERE id = ?")
        .bind(id)
        .first();
      
      // Convert JSON fields back to objects
      if (result) {
        if (result.monitors) {
          try {
            result.monitors = JSON.parse(result.monitors);
          } catch (e) {
            result.monitors = [];
          }
        }
        // Convert boolean values
        result.showCharts = result.showCharts === 1;
        result.showUptimePercentage = result.showUptimePercentage === 1;
        result.showIncidents = result.showIncidents === 1;
      }
      
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error getting status page by ID: ${error.message}`,
        service: "StatusPageModule",
        method: "getStatusPageById",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get status pages by team ID
   */
  async getStatusPagesByTeamId(teamId) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM status_pages WHERE teamId = ?")
        .bind(teamId)
        .all();
      
      const pages = result.results || [];
      
      // Convert JSON fields back to objects
      return pages.map(page => {
        if (page.monitors) {
          try {
            page.monitors = JSON.parse(page.monitors);
          } catch (e) {
            page.monitors = [];
          }
        }
        // Convert boolean values
        page.showCharts = page.showCharts === 1;
        page.showUptimePercentage = page.showUptimePercentage === 1;
        page.showIncidents = page.showIncidents === 1;
        return page;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting status pages by team ID: ${error.message}`,
        service: "StatusPageModule",
        method: "getStatusPagesByTeamId",
        teamId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get all status pages
   */
  async getAllStatusPages() {
    try {
      const result = await this.d1.prepare("SELECT * FROM status_pages").all();
      
      const pages = result.results || [];
      
      // Convert JSON fields back to objects
      return pages.map(page => {
        if (page.monitors) {
          try {
            page.monitors = JSON.parse(page.monitors);
          } catch (e) {
            page.monitors = [];
          }
        }
        // Convert boolean values
        page.showCharts = page.showCharts === 1;
        page.showUptimePercentage = page.showUptimePercentage === 1;
        page.showIncidents = page.showIncidents === 1;
        return page;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting all status pages: ${error.message}`,
        service: "StatusPageModule",
        method: "getAllStatusPages",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new status page
   */
  async createStatusPage(pageData) {
    try {
      const {
        id,
        teamId,
        title,
        description,
        monitors,
        showCharts,
        showUptimePercentage,
        showIncidents,
        theme,
        customCSS,
        createdAt,
        updatedAt,
      } = pageData;

      // Convert monitors array to JSON string
      const monitorsString = Array.isArray(monitors) ? JSON.stringify(monitors) : monitors;

      const result = await this.d1
        .prepare(
          "INSERT INTO status_pages (id, teamId, title, description, monitors, showCharts, showUptimePercentage, showIncidents, theme, customCSS, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          id,
          teamId,
          title,
          description,
          monitorsString,
          showCharts ? 1 : 0,
          showUptimePercentage ? 1 : 0,
          showIncidents ? 1 : 0,
          theme,
          customCSS,
          createdAt,
          updatedAt
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error creating status page: ${error.message}`,
        service: "StatusPageModule",
        method: "createStatusPage",
        pageData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update a status page
   */
  async updateStatusPage(id, pageData) {
    try {
      const {
        teamId,
        title,
        description,
        monitors,
        showCharts,
        showUptimePercentage,
        showIncidents,
        theme,
        customCSS,
        updatedAt,
      } = pageData;

      // Convert monitors array to JSON string
      const monitorsString = Array.isArray(monitors) ? JSON.stringify(monitors) : monitors;

      const result = await this.d1
        .prepare(
          "UPDATE status_pages SET teamId = ?, title = ?, description = ?, monitors = ?, showCharts = ?, showUptimePercentage = ?, showIncidents = ?, theme = ?, customCSS = ?, updatedAt = ? WHERE id = ?"
        )
        .bind(
          teamId,
          title,
          description,
          monitorsString,
          showCharts ? 1 : 0,
          showUptimePercentage ? 1 : 0,
          showIncidents ? 1 : 0,
          theme,
          customCSS,
          updatedAt,
          id
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error updating status page: ${error.message}`,
        service: "StatusPageModule",
        method: "updateStatusPage",
        id,
        pageData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete a status page
   */
  async deleteStatusPage(id) {
    try {
      const result = await this.d1
        .prepare("DELETE FROM status_pages WHERE id = ?")
        .bind(id)
        .run();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error deleting status page: ${error.message}`,
        service: "StatusPageModule",
        method: "deleteStatusPage",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get status page count
   */
  async getStatusPageCount() {
    try {
      const result = await this.d1.prepare("SELECT COUNT(*) as count FROM status_pages").first();
      return result.count || 0;
    } catch (error) {
      this.logger.error({
        message: `Error getting status page count: ${error.message}`,
        service: "StatusPageModule",
        method: "getStatusPageCount",
        stack: error.stack,
      });
      throw error;
    }
  }
}
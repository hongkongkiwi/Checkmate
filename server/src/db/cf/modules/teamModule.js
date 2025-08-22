export default class TeamModule {
  constructor({ logger, d1 }) {
    this.logger = logger;
    this.d1 = d1;
  }

  /**
   * Get a team by ID
   */
  async getTeamById(id) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM teams WHERE id = ?")
        .bind(id)
        .first();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error getting team by ID: ${error.message}`,
        service: "TeamModule",
        method: "getTeamById",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get all teams
   */
  async getAllTeams() {
    try {
      const result = await this.d1.prepare("SELECT * FROM teams").all();
      return result.results || [];
    } catch (error) {
      this.logger.error({
        message: `Error getting all teams: ${error.message}`,
        service: "TeamModule",
        method: "getAllTeams",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new team
   */
  async createTeam(teamData) {
    try {
      const {
        id,
        name,
        createdAt,
        updatedAt,
      } = teamData;

      const result = await this.d1
        .prepare(
          "INSERT INTO teams (id, name, createdAt, updatedAt) VALUES (?, ?, ?, ?)"
        )
        .bind(
          id,
          name,
          createdAt,
          updatedAt
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error creating team: ${error.message}`,
        service: "TeamModule",
        method: "createTeam",
        teamData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update a team
   */
  async updateTeam(id, teamData) {
    try {
      const {
        name,
        updatedAt,
      } = teamData;

      const result = await this.d1
        .prepare(
          "UPDATE teams SET name = ?, updatedAt = ? WHERE id = ?"
        )
        .bind(
          name,
          updatedAt,
          id
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error updating team: ${error.message}`,
        service: "TeamModule",
        method: "updateTeam",
        id,
        teamData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete a team
   */
  async deleteTeam(id) {
    try {
      const result = await this.d1
        .prepare("DELETE FROM teams WHERE id = ?")
        .bind(id)
        .run();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error deleting team: ${error.message}`,
        service: "TeamModule",
        method: "deleteTeam",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get team count
   */
  async getTeamCount() {
    try {
      const result = await this.d1.prepare("SELECT COUNT(*) as count FROM teams").first();
      return result.count || 0;
    } catch (error) {
      this.logger.error({
        message: `Error getting team count: ${error.message}`,
        service: "TeamModule",
        method: "getTeamCount",
        stack: error.stack,
      });
      throw error;
    }
  }
}
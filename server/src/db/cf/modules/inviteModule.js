export default class InviteModule {
  constructor({ logger, d1 }) {
    this.logger = logger;
    this.d1 = d1;
  }

  /**
   * Get an invite token by ID
   */
  async getInviteTokenById(id) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM invite_tokens WHERE id = ?")
        .bind(id)
        .first();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error getting invite token by ID: ${error.message}`,
        service: "InviteModule",
        method: "getInviteTokenById",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get an invite token by token string
   */
  async getInviteTokenByToken(token) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM invite_tokens WHERE token = ?")
        .bind(token)
        .first();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error getting invite token by token: ${error.message}`,
        service: "InviteModule",
        method: "getInviteTokenByToken",
        token,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get invite tokens by team ID
   */
  async getInviteTokensByTeamId(teamId) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM invite_tokens WHERE teamId = ?")
        .bind(teamId)
        .all();
      return result.results || [];
    } catch (error) {
      this.logger.error({
        message: `Error getting invite tokens by team ID: ${error.message}`,
        service: "InviteModule",
        method: "getInviteTokensByTeamId",
        teamId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new invite token
   */
  async createInviteToken(inviteData) {
    try {
      const {
        id,
        token,
        teamId,
        email,
        role,
        expiresAt,
        createdAt,
        updatedAt,
      } = inviteData;

      const result = await this.d1
        .prepare(
          "INSERT INTO invite_tokens (id, token, teamId, email, role, expiresAt, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          id,
          token,
          teamId,
          email,
          role,
          expiresAt,
          createdAt,
          updatedAt
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error creating invite token: ${error.message}`,
        service: "InviteModule",
        method: "createInviteToken",
        inviteData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update an invite token
   */
  async updateInviteToken(id, inviteData) {
    try {
      const {
        token,
        teamId,
        email,
        role,
        expiresAt,
        updatedAt,
      } = inviteData;

      const result = await this.d1
        .prepare(
          "UPDATE invite_tokens SET token = ?, teamId = ?, email = ?, role = ?, expiresAt = ?, updatedAt = ? WHERE id = ?"
        )
        .bind(
          token,
          teamId,
          email,
          role,
          expiresAt,
          updatedAt,
          id
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error updating invite token: ${error.message}`,
        service: "InviteModule",
        method: "updateInviteToken",
        id,
        inviteData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete an invite token
   */
  async deleteInviteToken(id) {
    try {
      const result = await this.d1
        .prepare("DELETE FROM invite_tokens WHERE id = ?")
        .bind(id)
        .run();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error deleting invite token: ${error.message}`,
        service: "InviteModule",
        method: "deleteInviteToken",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete expired invite tokens
   */
  async deleteExpiredInviteTokens() {
    try {
      const result = await this.d1
        .prepare("DELETE FROM invite_tokens WHERE expiresAt < datetime('now')")
        .run();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error deleting expired invite tokens: ${error.message}`,
        service: "InviteModule",
        method: "deleteExpiredInviteTokens",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get invite token count
   */
  async getInviteTokenCount() {
    try {
      const result = await this.d1.prepare("SELECT COUNT(*) as count FROM invite_tokens").first();
      return result.count || 0;
    } catch (error) {
      this.logger.error({
        message: `Error getting invite token count: ${error.message}`,
        service: "InviteModule",
        method: "getInviteTokenCount",
        stack: error.stack,
      });
      throw error;
    }
  }
}
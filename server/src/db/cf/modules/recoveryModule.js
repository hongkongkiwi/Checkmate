const SERVICE_NAME = "RecoveryModule";

class RecoveryModule {
  constructor({ d1, crypto, stringService, logger }) {
    this.d1 = d1;
    this.crypto = crypto;
    this.stringService = stringService;
    this.logger = logger;
  }

  requestRecoveryToken = async (email) => {
    try {
      // Delete any existing tokens for this email
      await this.d1.prepare(
        "DELETE FROM recovery_tokens WHERE email = ?"
      ).bind(email).run();

      // Generate new token
      const token = this.crypto.randomBytes(32).toString("hex");
      const id = this.crypto.randomUUID();
      
      // Set expiry to 10 minutes from now (600 seconds)
      const expiresAt = new Date(Date.now() + 600000).toISOString();
      const now = new Date().toISOString();

      // Insert new recovery token
      await this.d1.prepare(
        `INSERT INTO recovery_tokens (id, email, token, expiresAt, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(id, email, token, expiresAt, now, now).run();

      return { id, email, token, expiresAt };
    } catch (error) {
      this.logger.error({
        message: error.message,
        service: SERVICE_NAME,
        method: "requestRecoveryToken",
        stack: error.stack,
      });
      error.service = SERVICE_NAME;
      error.method = "requestRecoveryToken";
      throw error;
    }
  };

  validateRecoveryToken = async (candidateToken) => {
    try {
      const now = new Date().toISOString();
      
      // Find the token and check if it's not expired
      const result = await this.d1.prepare(
        `SELECT * FROM recovery_tokens 
         WHERE token = ? AND expiresAt > ?`
      ).bind(candidateToken, now).first();

      if (!result) {
        throw new Error(this.stringService.dbTokenNotFound || "Invalid or expired recovery token");
      }

      return result;
    } catch (error) {
      this.logger.error({
        message: error.message,
        service: SERVICE_NAME,
        method: "validateRecoveryToken",
        stack: error.stack,
      });
      error.service = SERVICE_NAME;
      error.method = "validateRecoveryToken";
      throw error;
    }
  };

  resetPassword = async (password, candidateToken, userModule) => {
    try {
      // Validate token again
      const recoveryToken = await this.validateRecoveryToken(candidateToken);
      
      // Get user by email
      const user = await this.d1.prepare(
        "SELECT * FROM users WHERE email = ?"
      ).bind(recoveryToken.email).first();

      if (!user) {
        throw new Error(this.stringService.dbUserNotFound || "User not found");
      }

      // Check if new password is same as old password
      const bcrypt = require("bcryptjs");
      const match = await bcrypt.compare(password, user.password);

      if (match) {
        throw new Error("Password cannot be the same as the old password");
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      // Update user password
      await this.d1.prepare(
        "UPDATE users SET password = ?, updatedAt = ? WHERE email = ?"
      ).bind(hashedPassword, now, recoveryToken.email).run();

      // Delete all recovery tokens for this email
      await this.d1.prepare(
        "DELETE FROM recovery_tokens WHERE email = ?"
      ).bind(recoveryToken.email).run();

      // Fetch the user again without the password
      const updatedUser = await this.d1.prepare(
        `SELECT id, firstName, lastName, email, avatarImage, isActive, 
         isVerified, role, teamId, checkTTL, createdAt, updatedAt 
         FROM users WHERE email = ?`
      ).bind(recoveryToken.email).first();

      return updatedUser;
    } catch (error) {
      this.logger.error({
        message: error.message,
        service: SERVICE_NAME,
        method: "resetPassword",
        stack: error.stack,
      });
      error.service = SERVICE_NAME;
      error.method = "resetPassword";
      throw error;
    }
  };

  // Clean up expired tokens (can be called periodically)
  cleanupExpiredTokens = async () => {
    try {
      const now = new Date().toISOString();
      const result = await this.d1.prepare(
        "DELETE FROM recovery_tokens WHERE expiresAt <= ?"
      ).bind(now).run();
      
      this.logger.info({
        message: `Cleaned up ${result.meta.changes} expired recovery tokens`,
        service: SERVICE_NAME,
        method: "cleanupExpiredTokens",
      });
      
      return result.meta.changes;
    } catch (error) {
      this.logger.error({
        message: error.message,
        service: SERVICE_NAME,
        method: "cleanupExpiredTokens",
        stack: error.stack,
      });
      error.service = SERVICE_NAME;
      error.method = "cleanupExpiredTokens";
      throw error;
    }
  };
}

export default RecoveryModule;
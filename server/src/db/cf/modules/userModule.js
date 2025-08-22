export default class UserModule {
  constructor({ logger, d1 }) {
    this.logger = logger;
    this.d1 = d1;
  }

  /**
   * Get a user by ID
   */
  async getUserById(id) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM users WHERE id = ?")
        .bind(id)
        .first();
      
      // Convert JSON fields back to objects
      if (result) {
        if (result.role) {
          try {
            result.role = JSON.parse(result.role);
          } catch (e) {
            // If it's not JSON, treat as a string
            result.role = [result.role];
          }
        }
        if (result.profileImage) {
          // Convert BLOB back to Buffer
          result.profileImage = Buffer.from(result.profileImage, 'base64');
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error getting user by ID: ${error.message}`,
        service: "UserModule",
        method: "getUserById",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get a user by email
   */
  async getUserByEmail(email) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM users WHERE email = ?")
        .bind(email)
        .first();
      
      // Convert JSON fields back to objects
      if (result) {
        if (result.role) {
          try {
            result.role = JSON.parse(result.role);
          } catch (e) {
            // If it's not JSON, treat as a string
            result.role = [result.role];
          }
        }
        if (result.profileImage) {
          // Convert BLOB back to Buffer
          result.profileImage = Buffer.from(result.profileImage, 'base64');
        }
      }
      
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error getting user by email: ${error.message}`,
        service: "UserModule",
        method: "getUserByEmail",
        email,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async createUser(userData) {
    try {
      const {
        id,
        firstName,
        lastName,
        email,
        password,
        avatarImage,
        profileImage,
        profileImageContentType,
        isActive,
        isVerified,
        role,
        teamId,
        checkTTL,
        createdAt,
        updatedAt,
      } = userData;

      // Convert role array to JSON string
      const roleString = Array.isArray(role) ? JSON.stringify(role) : role;

      // Convert profileImage Buffer to base64 string
      const profileImageBase64 = profileImage ? profileImage.toString('base64') : null;

      const result = await this.d1
        .prepare(
          "INSERT INTO users (id, firstName, lastName, email, password, avatarImage, profileImage, profileImageContentType, isActive, isVerified, role, teamId, checkTTL, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          id,
          firstName,
          lastName,
          email,
          password,
          avatarImage,
          profileImageBase64,
          profileImageContentType,
          isActive ? 1 : 0,
          isVerified ? 1 : 0,
          roleString,
          teamId,
          checkTTL,
          createdAt,
          updatedAt
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error creating user: ${error.message}`,
        service: "UserModule",
        method: "createUser",
        userData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Update a user
   */
  async updateUser(id, userData) {
    try {
      const {
        firstName,
        lastName,
        email,
        password,
        avatarImage,
        profileImage,
        profileImageContentType,
        isActive,
        isVerified,
        role,
        teamId,
        checkTTL,
        updatedAt,
      } = userData;

      // Convert role array to JSON string
      const roleString = Array.isArray(role) ? JSON.stringify(role) : role;

      // Convert profileImage Buffer to base64 string
      const profileImageBase64 = profileImage ? profileImage.toString('base64') : null;

      const result = await this.d1
        .prepare(
          "UPDATE users SET firstName = ?, lastName = ?, email = ?, password = ?, avatarImage = ?, profileImage = ?, profileImageContentType = ?, isActive = ?, isVerified = ?, role = ?, teamId = ?, checkTTL = ?, updatedAt = ? WHERE id = ?"
        )
        .bind(
          firstName,
          lastName,
          email,
          password,
          avatarImage,
          profileImageBase64,
          profileImageContentType,
          isActive ? 1 : 0,
          isVerified ? 1 : 0,
          roleString,
          teamId,
          checkTTL,
          updatedAt,
          id
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error updating user: ${error.message}`,
        service: "UserModule",
        method: "updateUser",
        id,
        userData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async deleteUser(id) {
    try {
      const result = await this.d1
        .prepare("DELETE FROM users WHERE id = ?")
        .bind(id)
        .run();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error deleting user: ${error.message}`,
        service: "UserModule",
        method: "deleteUser",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get all users
   */
  async getAllUsers() {
    try {
      const result = await this.d1.prepare("SELECT * FROM users").all();
      const users = result.results || [];
      
      // Convert JSON fields back to objects
      return users.map(user => {
        if (user.role) {
          try {
            user.role = JSON.parse(user.role);
          } catch (e) {
            // If it's not JSON, treat as a string
            user.role = [user.role];
          }
        }
        if (user.profileImage) {
          // Convert BLOB back to Buffer
          user.profileImage = Buffer.from(user.profileImage, 'base64');
        }
        // Convert boolean values
        user.isActive = user.isActive === 1;
        user.isVerified = user.isVerified === 1;
        return user;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting all users: ${error.message}`,
        service: "UserModule",
        method: "getAllUsers",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get users by team ID
   */
  async getUsersByTeamId(teamId) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM users WHERE teamId = ?")
        .bind(teamId)
        .all();
      
      const users = result.results || [];
      
      // Convert JSON fields back to objects
      return users.map(user => {
        if (user.role) {
          try {
            user.role = JSON.parse(user.role);
          } catch (e) {
            // If it's not JSON, treat as a string
            user.role = [user.role];
          }
        }
        if (user.profileImage) {
          // Convert BLOB back to Buffer
          user.profileImage = Buffer.from(user.profileImage, 'base64');
        }
        // Convert boolean values
        user.isActive = user.isActive === 1;
        user.isVerified = user.isVerified === 1;
        return user;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting users by team ID: ${error.message}`,
        service: "UserModule",
        method: "getUsersByTeamId",
        teamId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get user count
   */
  async getUserCount() {
    try {
      const result = await this.d1.prepare("SELECT COUNT(*) as count FROM users").first();
      return result.count || 0;
    } catch (error) {
      this.logger.error({
        message: `Error getting user count: ${error.message}`,
        service: "UserModule",
        method: "getUserCount",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Request password recovery token
   */
  async requestRecoveryToken(email, crypto, stringService) {
    try {
      // Check if user exists
      const user = await this.getUserByEmail(email);
      if (!user) {
        throw new Error(stringService?.dbUserNotFound || "User not found");
      }

      // Delete any existing tokens for this email
      await this.d1.prepare(
        "DELETE FROM recovery_tokens WHERE email = ?"
      ).bind(email).run();

      // Generate new token
      const token = crypto.randomBytes(32).toString("hex");
      const id = crypto.randomUUID();
      
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
        message: `Error requesting recovery token: ${error.message}`,
        service: "UserModule",
        method: "requestRecoveryToken",
        email,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Validate recovery token
   */
  async validateRecoveryToken(candidateToken, stringService) {
    try {
      const now = new Date().toISOString();
      
      // Find the token and check if it's not expired
      const result = await this.d1.prepare(
        `SELECT * FROM recovery_tokens 
         WHERE token = ? AND expiresAt > ?`
      ).bind(candidateToken, now).first();

      if (!result) {
        throw new Error(stringService?.dbTokenNotFound || "Invalid or expired recovery token");
      }

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error validating recovery token: ${error.message}`,
        service: "UserModule",
        method: "validateRecoveryToken",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Reset user password
   */
  async resetPassword(password, candidateToken, bcrypt, stringService) {
    try {
      // Validate token
      const recoveryToken = await this.validateRecoveryToken(candidateToken, stringService);
      
      // Get user by email
      const user = await this.getUserByEmail(recoveryToken.email);

      if (!user) {
        throw new Error(stringService?.dbUserNotFound || "User not found");
      }

      // Check if new password is same as old password
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

      // Parse role if it's JSON
      if (updatedUser && updatedUser.role) {
        try {
          updatedUser.role = JSON.parse(updatedUser.role);
        } catch (e) {
          updatedUser.role = [updatedUser.role];
        }
      }

      return updatedUser;
    } catch (error) {
      this.logger.error({
        message: `Error resetting password: ${error.message}`,
        service: "UserModule",
        method: "resetPassword",
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Clean up expired recovery tokens
   */
  async cleanupExpiredTokens() {
    try {
      const now = new Date().toISOString();
      const result = await this.d1.prepare(
        "DELETE FROM recovery_tokens WHERE expiresAt <= ?"
      ).bind(now).run();
      
      this.logger.info({
        message: `Cleaned up ${result.meta.changes} expired recovery tokens`,
        service: "UserModule",
        method: "cleanupExpiredTokens",
      });
      
      return result.meta.changes;
    } catch (error) {
      this.logger.error({
        message: `Error cleaning up expired tokens: ${error.message}`,
        service: "UserModule",
        method: "cleanupExpiredTokens",
        stack: error.stack,
      });
      throw error;
    }
  }
}
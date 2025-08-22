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
}
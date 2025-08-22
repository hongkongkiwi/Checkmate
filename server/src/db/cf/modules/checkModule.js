export default class CheckModule {
  constructor({ logger, d1 }) {
    this.logger = logger;
    this.d1 = d1;
  }

  /**
   * Get a check by ID
   */
  async getCheckById(id) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM checks WHERE id = ?")
        .bind(id)
        .first();
      
      // Convert JSON fields back to objects
      if (result) {
        if (result.timings) {
          try {
            result.timings = JSON.parse(result.timings);
          } catch (e) {
            result.timings = {};
          }
        }
        if (result.cpu) {
          try {
            result.cpu = JSON.parse(result.cpu);
          } catch (e) {
            result.cpu = {};
          }
        }
        if (result.memory) {
          try {
            result.memory = JSON.parse(result.memory);
          } catch (e) {
            result.memory = {};
          }
        }
        if (result.disk) {
          try {
            result.disk = JSON.parse(result.disk);
          } catch (e) {
            result.disk = [];
          }
        }
        if (result.host) {
          try {
            result.host = JSON.parse(result.host);
          } catch (e) {
            result.host = {};
          }
        }
        if (result.errors) {
          try {
            result.errors = JSON.parse(result.errors);
          } catch (e) {
            result.errors = [];
          }
        }
        if (result.capture) {
          try {
            result.capture = JSON.parse(result.capture);
          } catch (e) {
            result.capture = {};
          }
        }
        if (result.net) {
          try {
            result.net = JSON.parse(result.net);
          } catch (e) {
            result.net = [];
          }
        }
        if (result.audits) {
          try {
            result.audits = JSON.parse(result.audits);
          } catch (e) {
            result.audits = {};
          }
        }
        // Convert boolean values
        result.status = result.status === 1;
        result.ack = result.ack === 1;
      }
      
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error getting check by ID: ${error.message}`,
        service: "CheckModule",
        method: "getCheckById",
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get checks by monitor ID
   */
  async getChecksByMonitorId(monitorId, limit = 50) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM checks WHERE monitorId = ? ORDER BY createdAt DESC LIMIT ?")
        .bind(monitorId, limit)
        .all();
      
      const checks = result.results || [];
      
      // Convert JSON fields back to objects
      return checks.map(check => {
        if (check.timings) {
          try {
            check.timings = JSON.parse(check.timings);
          } catch (e) {
            check.timings = {};
          }
        }
        if (check.cpu) {
          try {
            check.cpu = JSON.parse(check.cpu);
          } catch (e) {
            check.cpu = {};
          }
        }
        if (check.memory) {
          try {
            check.memory = JSON.parse(check.memory);
          } catch (e) {
            check.memory = {};
          }
        }
        if (check.disk) {
          try {
            check.disk = JSON.parse(check.disk);
          } catch (e) {
            check.disk = [];
          }
        }
        if (check.host) {
          try {
            check.host = JSON.parse(check.host);
          } catch (e) {
            check.host = {};
          }
        }
        if (check.errors) {
          try {
            check.errors = JSON.parse(check.errors);
          } catch (e) {
            check.errors = [];
          }
        }
        if (check.capture) {
          try {
            check.capture = JSON.parse(check.capture);
          } catch (e) {
            check.capture = {};
          }
        }
        if (check.net) {
          try {
            check.net = JSON.parse(check.net);
          } catch (e) {
            check.net = [];
          }
        }
        if (check.audits) {
          try {
            check.audits = JSON.parse(check.audits);
          } catch (e) {
            check.audits = {};
          }
        }
        // Convert boolean values
        check.status = check.status === 1;
        check.ack = check.ack === 1;
        return check;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting checks by monitor ID: ${error.message}`,
        service: "CheckModule",
        method: "getChecksByMonitorId",
        monitorId,
        limit,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Create a new check
   */
  async createCheck(checkData) {
    try {
      const {
        id,
        monitorId,
        teamId,
        type,
        status,
        responseTime,
        timings,
        statusCode,
        message,
        expiry,
        ack,
        ackAt,
        cpu,
        memory,
        disk,
        host,
        errors,
        capture,
        net,
        accessibility,
        bestPractices,
        seo,
        performance,
        audits,
        createdAt,
        updatedAt,
      } = checkData;

      // Convert JSON fields to strings
      const timingsString = timings ? JSON.stringify(timings) : null;
      const cpuString = cpu ? JSON.stringify(cpu) : null;
      const memoryString = memory ? JSON.stringify(memory) : null;
      const diskString = disk ? JSON.stringify(disk) : null;
      const hostString = host ? JSON.stringify(host) : null;
      const errorsString = errors ? JSON.stringify(errors) : null;
      const captureString = capture ? JSON.stringify(capture) : null;
      const netString = net ? JSON.stringify(net) : null;
      const auditsString = audits ? JSON.stringify(audits) : null;

      const result = await this.d1
        .prepare(
          "INSERT INTO checks (id, monitorId, teamId, type, status, responseTime, timings, statusCode, message, expiry, ack, ackAt, cpu, memory, disk, host, errors, capture, net, accessibility, bestPractices, seo, performance, audits, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          id,
          monitorId,
          teamId,
          type,
          status ? 1 : 0,
          responseTime,
          timingsString,
          statusCode,
          message,
          expiry,
          ack ? 1 : 0,
          ackAt,
          cpuString,
          memoryString,
          diskString,
          hostString,
          errorsString,
          captureString,
          netString,
          accessibility,
          bestPractices,
          seo,
          performance,
          auditsString,
          createdAt,
          updatedAt
        )
        .run();

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error creating check: ${error.message}`,
        service: "CheckModule",
        method: "createCheck",
        checkData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Delete checks older than a certain date
   */
  async deleteChecksOlderThan(date) {
    try {
      const result = await this.d1
        .prepare("DELETE FROM checks WHERE createdAt < ?")
        .bind(date)
        .run();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error deleting checks older than date: ${error.message}`,
        service: "CheckModule",
        method: "deleteChecksOlderThan",
        date,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get check stats for a monitor
   */
  async getCheckStats(monitorId, days = 30) {
    try {
      const result = await this.d1
        .prepare(`
          SELECT 
            COUNT(*) as totalChecks,
            SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as upChecks,
            SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as downChecks,
            AVG(responseTime) as avgResponseTime
          FROM checks 
          WHERE monitorId = ? AND createdAt > datetime('now', '-${days} days')
        `)
        .bind(monitorId)
        .first();
      return result;
    } catch (error) {
      this.logger.error({
        message: `Error getting check stats: ${error.message}`,
        service: "CheckModule",
        method: "getCheckStats",
        monitorId,
        days,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get recent checks
   */
  async getRecentChecks(limit = 100) {
    try {
      const result = await this.d1
        .prepare("SELECT * FROM checks ORDER BY createdAt DESC LIMIT ?")
        .bind(limit)
        .all();
      
      const checks = result.results || [];
      
      // Convert JSON fields back to objects
      return checks.map(check => {
        if (check.timings) {
          try {
            check.timings = JSON.parse(check.timings);
          } catch (e) {
            check.timings = {};
          }
        }
        if (check.cpu) {
          try {
            check.cpu = JSON.parse(check.cpu);
          } catch (e) {
            check.cpu = {};
          }
        }
        if (check.memory) {
          try {
            check.memory = JSON.parse(check.memory);
          } catch (e) {
            check.memory = {};
          }
        }
        if (check.disk) {
          try {
            check.disk = JSON.parse(check.disk);
          } catch (e) {
            check.disk = [];
          }
        }
        if (check.host) {
          try {
            check.host = JSON.parse(check.host);
          } catch (e) {
            check.host = {};
          }
        }
        if (check.errors) {
          try {
            check.errors = JSON.parse(check.errors);
          } catch (e) {
            check.errors = [];
          }
        }
        if (check.capture) {
          try {
            check.capture = JSON.parse(check.capture);
          } catch (e) {
            check.capture = {};
          }
        }
        if (check.net) {
          try {
            check.net = JSON.parse(check.net);
          } catch (e) {
            check.net = [];
          }
        }
        if (check.audits) {
          try {
            check.audits = JSON.parse(check.audits);
          } catch (e) {
            check.audits = {};
          }
        }
        // Convert boolean values
        check.status = check.status === 1;
        check.ack = check.ack === 1;
        return check;
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting recent checks: ${error.message}`,
        service: "CheckModule",
        method: "getRecentChecks",
        limit,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get check count
   */
  async getCheckCount() {
    try {
      const result = await this.d1.prepare("SELECT COUNT(*) as count FROM checks").first();
      return result.count || 0;
    } catch (error) {
      this.logger.error({
        message: `Error getting check count: ${error.message}`,
        service: "CheckModule",
        method: "getCheckCount",
        stack: error.stack,
      });
      throw error;
    }
  }
}
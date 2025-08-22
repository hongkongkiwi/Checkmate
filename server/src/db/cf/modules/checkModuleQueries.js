// Cloudflare D1 query builders for check operations
// Equivalent to MongoDB aggregation pipelines but using SQL

class CheckModuleQueries {
  constructor({ d1, logger }) {
    this.d1 = d1;
    this.logger = logger;
  }

  /**
   * Get checks summary by team ID (equivalent to buildChecksSummaryByTeamIdPipeline)
   */
  async getChecksSummaryByTeamId(teamId, dateFilter = null) {
    try {
      let query = `
        SELECT 
          COUNT(CASE WHEN status = 0 THEN 1 END) as totalChecks,
          COUNT(CASE WHEN ack = 1 AND status = 0 THEN 1 END) as resolvedChecks,
          COUNT(CASE WHEN ack = 0 AND status = 0 THEN 1 END) as downChecks,
          COUNT(CASE WHEN statusCode = 5000 THEN 1 END) as cannotResolveChecks
        FROM checks 
        WHERE teamId = ?
      `;
      
      const params = [teamId];
      
      if (dateFilter) {
        query += ` AND createdAt >= ? AND createdAt <= ?`;
        params.push(dateFilter.start, dateFilter.end);
      }

      const result = await this.d1.prepare(query).bind(...params).first();
      
      return {
        summary: {
          totalChecks: result.totalChecks || 0,
          resolvedChecks: result.resolvedChecks || 0,
          downChecks: result.downChecks || 0,
          cannotResolveChecks: result.cannotResolveChecks || 0
        }
      };
    } catch (error) {
      this.logger.error({
        message: `Error getting checks summary: ${error.message}`,
        service: "CheckModuleQueries",
        method: "getChecksSummaryByTeamId",
        teamId,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get checks by monitor and date range with grouping
   */
  async getChecksByMonitorAndDateRange(monitorId, startDate, endDate, groupBy = 'hour') {
    try {
      let dateFormat;
      switch (groupBy) {
        case 'hour':
          dateFormat = '%Y-%m-%d %H:00:00';
          break;
        case 'day':
          dateFormat = '%Y-%m-%d';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        default:
          dateFormat = '%Y-%m-%d %H:00:00';
      }

      const query = `
        SELECT 
          strftime('${dateFormat}', createdAt) as timeGroup,
          COUNT(*) as totalChecks,
          COUNT(CASE WHEN status = 1 THEN 1 END) as upChecks,
          COUNT(CASE WHEN status = 0 THEN 1 END) as downChecks,
          AVG(responseTime) as avgResponseTime,
          MIN(responseTime) as minResponseTime,
          MAX(responseTime) as maxResponseTime
        FROM checks 
        WHERE monitorId = ? 
          AND createdAt >= ? 
          AND createdAt <= ?
        GROUP BY strftime('${dateFormat}', createdAt)
        ORDER BY timeGroup ASC
      `;

      const result = await this.d1.prepare(query).bind(monitorId, startDate, endDate).all();
      return result.results || [];
    } catch (error) {
      this.logger.error({
        message: `Error getting checks by monitor and date range: ${error.message}`,
        service: "CheckModuleQueries",
        method: "getChecksByMonitorAndDateRange",
        monitorId,
        startDate,
        endDate,
        groupBy,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get recent check status distribution
   */
  async getRecentCheckStatusDistribution(teamId, hours = 24) {
    try {
      const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const query = `
        SELECT 
          monitors.name as monitorName,
          monitors.id as monitorId,
          COUNT(*) as totalChecks,
          COUNT(CASE WHEN checks.status = 1 THEN 1 END) as upChecks,
          COUNT(CASE WHEN checks.status = 0 THEN 1 END) as downChecks,
          AVG(checks.responseTime) as avgResponseTime,
          MAX(checks.createdAt) as lastCheckTime
        FROM checks 
        INNER JOIN monitors ON checks.monitorId = monitors.id
        WHERE checks.teamId = ? 
          AND checks.createdAt >= ?
        GROUP BY monitors.id, monitors.name
        ORDER BY monitors.name ASC
      `;

      const result = await this.d1.prepare(query).bind(teamId, hoursAgo).all();
      
      return (result.results || []).map(row => ({
        ...row,
        uptimePercentage: row.totalChecks > 0 ? (row.upChecks / row.totalChecks) * 100 : 0
      }));
    } catch (error) {
      this.logger.error({
        message: `Error getting recent check status distribution: ${error.message}`,
        service: "CheckModuleQueries",
        method: "getRecentCheckStatusDistribution",
        teamId,
        hours,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get check incidents (consecutive failed checks)
   */
  async getCheckIncidents(monitorId, startDate, endDate, minFailures = 3) {
    try {
      // This is a complex query to find consecutive failures
      const query = `
        WITH FailedChecks AS (
          SELECT 
            id,
            createdAt,
            message,
            statusCode,
            ROW_NUMBER() OVER (ORDER BY createdAt) - 
            ROW_NUMBER() OVER (PARTITION BY status ORDER BY createdAt) as grp
          FROM checks 
          WHERE monitorId = ? 
            AND createdAt >= ? 
            AND createdAt <= ?
            AND status = 0
        ),
        IncidentGroups AS (
          SELECT 
            grp,
            COUNT(*) as failureCount,
            MIN(createdAt) as incidentStart,
            MAX(createdAt) as incidentEnd,
            string_agg(message, ' | ') as messages
          FROM FailedChecks 
          GROUP BY grp
          HAVING COUNT(*) >= ?
        )
        SELECT * FROM IncidentGroups ORDER BY incidentStart DESC
      `;

      const result = await this.d1.prepare(query).bind(monitorId, startDate, endDate, minFailures).all();
      return result.results || [];
    } catch (error) {
      this.logger.error({
        message: `Error getting check incidents: ${error.message}`,
        service: "CheckModuleQueries", 
        method: "getCheckIncidents",
        monitorId,
        startDate,
        endDate,
        minFailures,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get performance metrics for a monitor
   */
  async getPerformanceMetrics(monitorId, startDate, endDate) {
    try {
      const query = `
        SELECT 
          COUNT(*) as totalChecks,
          AVG(responseTime) as avgResponseTime,
          MIN(responseTime) as minResponseTime,
          MAX(responseTime) as maxResponseTime,
          PERCENTILE(responseTime, 0.5) as medianResponseTime,
          PERCENTILE(responseTime, 0.95) as p95ResponseTime,
          PERCENTILE(responseTime, 0.99) as p99ResponseTime,
          COUNT(CASE WHEN status = 1 THEN 1 END) as successfulChecks,
          COUNT(CASE WHEN status = 0 THEN 1 END) as failedChecks
        FROM checks 
        WHERE monitorId = ? 
          AND createdAt >= ? 
          AND createdAt <= ?
      `;

      const result = await this.d1.prepare(query).bind(monitorId, startDate, endDate).first();
      
      if (result) {
        result.uptimePercentage = result.totalChecks > 0 
          ? (result.successfulChecks / result.totalChecks) * 100 
          : 0;
        result.errorRate = result.totalChecks > 0 
          ? (result.failedChecks / result.totalChecks) * 100 
          : 0;
      }

      return result;
    } catch (error) {
      this.logger.error({
        message: `Error getting performance metrics: ${error.message}`,
        service: "CheckModuleQueries",
        method: "getPerformanceMetrics",
        monitorId,
        startDate,
        endDate,
        stack: error.stack,
      });
      throw error;
    }
  }
}

export default CheckModuleQueries;
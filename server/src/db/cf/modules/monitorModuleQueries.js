// Cloudflare D1 query builders for monitor operations
// Equivalent to MongoDB aggregation pipelines but using SQL

class MonitorModuleQueries {
  constructor({ d1, logger }) {
    this.d1 = d1;
    this.logger = logger;
  }

  /**
   * Build uptime details for a monitor (equivalent to buildUptimeDetailsPipeline)
   */
  async getUptimeDetails(monitorId, startDate, endDate, groupBy = 'hour') {
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

      // Main uptime percentage query
      const uptimeQuery = `
        SELECT 
          COUNT(CASE WHEN status = 1 THEN 1 END) as upChecks,
          COUNT(*) as totalChecks
        FROM checks 
        WHERE monitorId = ? 
          AND updatedAt >= ? 
          AND updatedAt <= ?
      `;

      // Grouped average response time
      const avgResponseTimeQuery = `
        SELECT AVG(responseTime) as avgResponseTime
        FROM checks 
        WHERE monitorId = ? 
          AND updatedAt >= ? 
          AND updatedAt <= ?
      `;

      // Grouped checks by time period
      const groupedChecksQuery = `
        SELECT 
          strftime('${dateFormat}', createdAt) as timeGroup,
          AVG(responseTime) as avgResponseTime,
          COUNT(*) as totalChecks
        FROM checks 
        WHERE monitorId = ? 
          AND updatedAt >= ? 
          AND updatedAt <= ?
        GROUP BY strftime('${dateFormat}', createdAt)
        ORDER BY timeGroup ASC
      `;

      // Up checks grouped by time period
      const groupedUpChecksQuery = `
        SELECT 
          strftime('${dateFormat}', createdAt) as timeGroup,
          COUNT(*) as totalChecks,
          AVG(responseTime) as avgResponseTime
        FROM checks 
        WHERE monitorId = ? 
          AND updatedAt >= ? 
          AND updatedAt <= ?
          AND status = 1
        GROUP BY strftime('${dateFormat}', createdAt)
        ORDER BY timeGroup ASC
      `;

      // Down checks grouped by time period
      const groupedDownChecksQuery = `
        SELECT 
          strftime('${dateFormat}', createdAt) as timeGroup,
          COUNT(*) as totalChecks,
          AVG(responseTime) as avgResponseTime
        FROM checks 
        WHERE monitorId = ? 
          AND updatedAt >= ? 
          AND updatedAt <= ?
          AND status = 0
        GROUP BY strftime('${dateFormat}', createdAt)
        ORDER BY timeGroup ASC
      `;

      // Execute all queries in parallel
      const [
        uptimeResult,
        avgResponseTimeResult,
        groupedChecksResult,
        groupedUpChecksResult,
        groupedDownChecksResult
      ] = await Promise.all([
        this.d1.prepare(uptimeQuery).bind(monitorId, startDate, endDate).first(),
        this.d1.prepare(avgResponseTimeQuery).bind(monitorId, startDate, endDate).first(),
        this.d1.prepare(groupedChecksQuery).bind(monitorId, startDate, endDate).all(),
        this.d1.prepare(groupedUpChecksQuery).bind(monitorId, startDate, endDate).all(),
        this.d1.prepare(groupedDownChecksQuery).bind(monitorId, startDate, endDate).all()
      ]);

      // Calculate uptime percentage
      const uptimePercentage = uptimeResult.totalChecks > 0 
        ? (uptimeResult.upChecks / uptimeResult.totalChecks) * 100 
        : 0;

      return {
        uptimePercentage: [{
          percentage: uptimePercentage / 100 // MongoDB returns as decimal
        }],
        groupedAvgResponseTime: [{
          avgResponseTime: avgResponseTimeResult.avgResponseTime || 0
        }],
        groupedChecks: groupedChecksResult.results || [],
        groupedUpChecks: groupedUpChecksResult.results || [],
        groupedDownChecks: groupedDownChecksResult.results || []
      };
    } catch (error) {
      this.logger.error({
        message: `Error getting uptime details: ${error.message}`,
        service: "MonitorModuleQueries",
        method: "getUptimeDetails",
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
   * Get monitor statistics overview for a team
   */
  async getMonitorStatsOverview(teamId, timeRange = '24h') {
    try {
      let hoursAgo;
      switch (timeRange) {
        case '1h':
          hoursAgo = 1;
          break;
        case '24h':
          hoursAgo = 24;
          break;
        case '7d':
          hoursAgo = 24 * 7;
          break;
        case '30d':
          hoursAgo = 24 * 30;
          break;
        default:
          hoursAgo = 24;
      }

      const cutoffDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

      const query = `
        SELECT 
          m.id as monitorId,
          m.name as monitorName,
          m.type as monitorType,
          m.url as monitorUrl,
          m.isActive,
          COUNT(c.id) as totalChecks,
          COUNT(CASE WHEN c.status = 1 THEN 1 END) as upChecks,
          COUNT(CASE WHEN c.status = 0 THEN 1 END) as downChecks,
          AVG(c.responseTime) as avgResponseTime,
          MAX(c.createdAt) as lastCheckTime,
          MIN(CASE WHEN c.status = 0 THEN c.createdAt END) as firstFailureTime,
          MAX(CASE WHEN c.status = 0 THEN c.createdAt END) as lastFailureTime
        FROM monitors m
        LEFT JOIN checks c ON m.id = c.monitorId 
          AND c.createdAt >= ?
        WHERE m.teamId = ?
        GROUP BY m.id, m.name, m.type, m.url, m.isActive
        ORDER BY m.name ASC
      `;

      const result = await this.d1.prepare(query).bind(cutoffDate, teamId).all();
      
      return (result.results || []).map(row => ({
        ...row,
        uptimePercentage: row.totalChecks > 0 ? (row.upChecks / row.totalChecks) * 100 : 100,
        isActive: row.isActive === 1,
        currentStatus: row.totalChecks === 0 ? 'unknown' : (row.upChecks === row.totalChecks ? 'up' : 'down')
      }));
    } catch (error) {
      this.logger.error({
        message: `Error getting monitor stats overview: ${error.message}`,
        service: "MonitorModuleQueries",
        method: "getMonitorStatsOverview",
        teamId,
        timeRange,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get response time trends for monitors
   */
  async getResponseTimeTrends(teamId, startDate, endDate, groupBy = 'hour') {
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
          m.name as monitorName,
          m.id as monitorId,
          strftime('${dateFormat}', c.createdAt) as timeGroup,
          AVG(c.responseTime) as avgResponseTime,
          MIN(c.responseTime) as minResponseTime,
          MAX(c.responseTime) as maxResponseTime,
          COUNT(*) as checkCount,
          COUNT(CASE WHEN c.status = 1 THEN 1 END) as successCount
        FROM monitors m
        INNER JOIN checks c ON m.id = c.monitorId
        WHERE m.teamId = ?
          AND c.createdAt >= ?
          AND c.createdAt <= ?
        GROUP BY m.id, m.name, strftime('${dateFormat}', c.createdAt)
        ORDER BY m.name ASC, timeGroup ASC
      `;

      const result = await this.d1.prepare(query).bind(teamId, startDate, endDate).all();
      
      // Group results by monitor
      const groupedResults = {};
      (result.results || []).forEach(row => {
        if (!groupedResults[row.monitorId]) {
          groupedResults[row.monitorId] = {
            monitorId: row.monitorId,
            monitorName: row.monitorName,
            trends: []
          };
        }
        
        groupedResults[row.monitorId].trends.push({
          timeGroup: row.timeGroup,
          avgResponseTime: row.avgResponseTime,
          minResponseTime: row.minResponseTime,
          maxResponseTime: row.maxResponseTime,
          checkCount: row.checkCount,
          successRate: row.checkCount > 0 ? (row.successCount / row.checkCount) * 100 : 0
        });
      });

      return Object.values(groupedResults);
    } catch (error) {
      this.logger.error({
        message: `Error getting response time trends: ${error.message}`,
        service: "MonitorModuleQueries",
        method: "getResponseTimeTrends",
        teamId,
        startDate,
        endDate,
        groupBy,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get downtime incidents for monitors
   */
  async getDowntimeIncidents(teamId, startDate, endDate, minDuration = 300000) {
    try {
      // This complex query finds downtime incidents (consecutive failures)
      const query = `
        WITH DowntimeEvents AS (
          SELECT 
            c.monitorId,
            m.name as monitorName,
            c.createdAt,
            c.status,
            c.message,
            LAG(c.status) OVER (PARTITION BY c.monitorId ORDER BY c.createdAt) as prevStatus,
            LEAD(c.status) OVER (PARTITION BY c.monitorId ORDER BY c.createdAt) as nextStatus
          FROM checks c
          INNER JOIN monitors m ON c.monitorId = m.id
          WHERE m.teamId = ?
            AND c.createdAt >= ?
            AND c.createdAt <= ?
          ORDER BY c.monitorId, c.createdAt
        ),
        IncidentBoundaries AS (
          SELECT 
            monitorId,
            monitorName,
            createdAt,
            status,
            message,
            CASE 
              WHEN status = 0 AND (prevStatus = 1 OR prevStatus IS NULL) THEN 'start'
              WHEN status = 1 AND prevStatus = 0 THEN 'end'
              ELSE null
            END as event_type
          FROM DowntimeEvents
        )
        SELECT 
          monitorId,
          monitorName,
          MIN(CASE WHEN event_type = 'start' THEN createdAt END) as incidentStart,
          MIN(CASE WHEN event_type = 'end' THEN createdAt END) as incidentEnd,
          string_agg(DISTINCT message, ' | ') as messages
        FROM IncidentBoundaries 
        WHERE event_type IS NOT NULL
        GROUP BY monitorId, monitorName
        HAVING incidentStart IS NOT NULL
        ORDER BY incidentStart DESC
      `;

      const result = await this.d1.prepare(query).bind(teamId, startDate, endDate).all();
      
      return (result.results || []).map(row => {
        const duration = row.incidentEnd 
          ? new Date(row.incidentEnd) - new Date(row.incidentStart)
          : null;
        
        return {
          ...row,
          duration,
          durationMinutes: duration ? Math.round(duration / 60000) : null,
          isOngoing: !row.incidentEnd
        };
      }).filter(incident => !incident.duration || incident.duration >= minDuration);
    } catch (error) {
      this.logger.error({
        message: `Error getting downtime incidents: ${error.message}`,
        service: "MonitorModuleQueries",
        method: "getDowntimeIncidents",
        teamId,
        startDate,
        endDate,
        minDuration,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Get monitor health score based on various metrics
   */
  async getMonitorHealthScores(teamId, days = 30) {
    try {
      const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const query = `
        SELECT 
          m.id as monitorId,
          m.name as monitorName,
          COUNT(c.id) as totalChecks,
          COUNT(CASE WHEN c.status = 1 THEN 1 END) as successfulChecks,
          AVG(c.responseTime) as avgResponseTime,
          COUNT(DISTINCT DATE(c.createdAt)) as activeDays,
          MAX(c.createdAt) as lastCheckTime,
          COUNT(CASE WHEN c.statusCode >= 400 AND c.statusCode < 500 THEN 1 END) as clientErrors,
          COUNT(CASE WHEN c.statusCode >= 500 THEN 1 END) as serverErrors
        FROM monitors m
        LEFT JOIN checks c ON m.id = c.monitorId 
          AND c.createdAt >= ?
        WHERE m.teamId = ?
        GROUP BY m.id, m.name
      `;

      const result = await this.d1.prepare(query).bind(daysAgo, teamId).all();
      
      return (result.results || []).map(row => {
        const uptimeRate = row.totalChecks > 0 ? (row.successfulChecks / row.totalChecks) : 0;
        const responseTimeScore = Math.max(0, 100 - (row.avgResponseTime || 0) / 50); // Score decreases as response time increases
        const consistencyScore = row.activeDays > 0 ? (row.activeDays / days) * 100 : 0;
        const errorRate = row.totalChecks > 0 ? ((row.clientErrors + row.serverErrors) / row.totalChecks) : 0;
        
        // Weighted health score
        const healthScore = (
          uptimeRate * 0.4 +           // 40% weight on uptime
          (responseTimeScore / 100) * 0.3 +  // 30% weight on response time
          (consistencyScore / 100) * 0.2 +   // 20% weight on consistency
          (1 - errorRate) * 0.1              // 10% weight on error rate
        ) * 100;

        return {
          ...row,
          uptimePercentage: uptimeRate * 100,
          healthScore: Math.round(healthScore),
          responseTimeScore: Math.round(responseTimeScore),
          consistencyScore: Math.round(consistencyScore),
          errorRate: errorRate * 100,
          status: healthScore >= 90 ? 'excellent' : 
                 healthScore >= 75 ? 'good' : 
                 healthScore >= 50 ? 'fair' : 'poor'
        };
      });
    } catch (error) {
      this.logger.error({
        message: `Error getting monitor health scores: ${error.message}`,
        service: "MonitorModuleQueries",
        method: "getMonitorHealthScores",
        teamId,
        days,
        stack: error.stack,
      });
      throw error;
    }
  }
}

export default MonitorModuleQueries;
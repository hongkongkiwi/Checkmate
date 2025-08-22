// Cloudflare Workers scheduled handler for periodic cleanup tasks

export default {
  async scheduled(event, env, ctx) {
    // This runs on a schedule defined in wrangler.toml
    switch (event.cron) {
      case "0 */6 * * *": // Every 6 hours
        await cleanupExpiredTokens(env);
        break;
      case "0 2 * * *": // Daily at 2 AM
        await cleanupOldChecks(env);
        break;
      default:
        console.log(`Unknown cron: ${event.cron}`);
    }
  },
};

async function cleanupExpiredTokens(env) {
  try {
    const now = new Date().toISOString();
    
    // Clean up expired recovery tokens
    const recoveryResult = await env.DB.prepare(
      "DELETE FROM recovery_tokens WHERE expiresAt <= ?"
    ).bind(now).run();
    
    console.log(`Cleaned up ${recoveryResult.meta.changes} expired recovery tokens`);
    
    // Clean up expired invite tokens
    const inviteResult = await env.DB.prepare(
      "DELETE FROM invite_tokens WHERE expiresAt <= ?"
    ).bind(now).run();
    
    console.log(`Cleaned up ${inviteResult.meta.changes} expired invite tokens`);
    
    // Clean up expired maintenance windows
    const maintenanceResult = await env.DB.prepare(
      "DELETE FROM maintenance_windows WHERE oneTime = 1 AND end <= ?"
    ).bind(now).run();
    
    console.log(`Cleaned up ${maintenanceResult.meta.changes} expired maintenance windows`);
    
    // Clean up expired announcements
    const announcementResult = await env.DB.prepare(
      "DELETE FROM announcements WHERE expiresAt IS NOT NULL AND expiresAt <= ?"
    ).bind(now).run();
    
    console.log(`Cleaned up ${announcementResult.meta.changes} expired announcements`);
    
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    // If Sentry is configured, send the error
    if (env.SENTRY_DSN) {
      // Send to Sentry
    }
  }
}

async function cleanupOldChecks(env) {
  try {
    // Keep only last 30 days of check data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const result = await env.DB.prepare(
      "DELETE FROM checks WHERE createdAt < ?"
    ).bind(thirtyDaysAgo).run();
    
    console.log(`Cleaned up ${result.meta.changes} old checks`);
    
  } catch (error) {
    console.error('Error cleaning up old checks:', error);
    // If Sentry is configured, send the error
    if (env.SENTRY_DSN) {
      // Send to Sentry
    }
  }
}
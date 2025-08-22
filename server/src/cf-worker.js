import { Toucan } from "toucan-js";
import { initializeServices } from "./config/services-cf.js";
import Logger from "./utils/logger.js";
import SettingsService from "./service/system/settingsService.js";
import { createApp } from "./app-cf.js";

// Create a D1 database client
const createD1Client = (env) => {
  return {
    prepare: (query) => {
      const statement = env.DB.prepare(query);
      return {
        bind: (...params) => {
          const boundStatement = statement.bind(...params);
          return {
            run: () => boundStatement.run(),
            all: () => boundStatement.all(),
            first: () => boundStatement.first(),
            raw: () => boundStatement.raw(),
          };
        },
        run: () => statement.run(),
        all: () => statement.all(),
        first: () => statement.first(),
        raw: () => statement.raw(),
      };
    },
    batch: (statements) => env.DB.batch(statements),
    exec: (query) => env.DB.exec(query),
  };
};

export default {
  async fetch(request, env, ctx) {
    // Initialize Sentry for error tracking
    const sentry = new Toucan({
      dsn: env.SENTRY_DSN,
      request,
      context: ctx,
    });

    try {
      // Create settings service with env variables
      const envSettings = {
        jwtSecret: env.JWT_SECRET,
        jwtTTL: env.TOKEN_TTL,
        systemEmailHost: env.SYSTEM_EMAIL_HOST,
        nodeEnv: env.NODE_ENV || "production",
        logLevel: env.LOG_LEVEL,
        clientHost: env.CLIENT_HOST,
        port: env.PORT,
        r2Bucket: env.ASSETS,
      };

      const settingsService = new SettingsService();
      // Override settings with env values
      settingsService.settings = { ...settingsService.settings, ...envSettings };

      // Create logger
      const logger = new Logger({ envSettings });

      // Create D1 client
      const d1Client = createD1Client(env);

      // Initialize services with Cloudflare bindings
      const services = await initializeServices({
        logger,
        envSettings,
        settingsService,
        d1: d1Client,
        kv: env.CACHE,
        r2: env.ASSETS,
        sentry,
      });

      // Create app with Cloudflare-specific middleware
      const app = createApp({
        services,
        envSettings,
        sentry,
      });

      // Handle the request
      return await app.handle(request, env, ctx);
    } catch (error) {
      // Log the error
      console.error("Worker error:", error);
      
      // Send to Sentry if configured
      if (sentry) {
        sentry.captureException(error);
      }

      // Return a generic error response
      return new Response(
        JSON.stringify({ 
          error: "Internal Server Error",
          message: "An unexpected error occurred"
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
        }
      );
    }
  },
};
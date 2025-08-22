import { Router } from "itty-router";
import { error } from "itty-router-extras";
import cors from "cors";
import compression from "compression";
import { setupRoutes } from "./config/routes-cf.js";
import { handleErrors } from "./middleware/handleErrors.js";
import { generalApiLimiter } from "./middleware/rateLimiter.js";
import { sanitizeBody, sanitizeQuery } from "./middleware/sanitization.js";
import languageMiddleware from "./middleware/languageMiddleware.js";
import swaggerUi from "./utils/swagger-ui.js";

// Create a custom middleware for Cloudflare that mimics Express
const createCFMiddleware = (fn) => {
  return async (request, env, ctx) => {
    // Create a mock Express-like request/response object
    const req = {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers),
      query: {}, // Will be populated by query parsing middleware
      body: null, // Will be populated by body parsing middleware
      params: {}, // Will be populated by router
      cookies: {}, // Will be populated by cookie parsing middleware
    };

    const res = {
      status: (code) => {
        res.statusCode = code;
        return res;
      },
      json: (data) => {
        res.body = JSON.stringify(data);
        res.headers = { ...res.headers, "Content-Type": "application/json" };
        return res;
      },
      send: (data) => {
        res.body = data;
        return res;
      },
      set: (key, value) => {
        res.headers = { ...res.headers, [key]: value };
        return res;
      },
      redirect: (url) => {
        res.statusCode = 302;
        res.headers = { ...res.headers, "Location": url };
        return res;
      },
      statusCode: 200,
      headers: {},
      body: null,
    };

    // Parse query parameters
    const url = new URL(request.url);
    for (const [key, value] of url.searchParams) {
      req.query[key] = value;
    }

    // Parse cookies
    const cookieHeader = request.headers.get("Cookie");
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const [name, value] = cookie.trim().split("=");
        if (name && value) {
          req.cookies[name] = decodeURIComponent(value);
        }
      });
    }

    // Parse body for POST/PUT requests
    if (request.method === "POST" || request.method === "PUT") {
      if (request.headers.get("Content-Type")?.includes("application/json")) {
        try {
          req.body = await request.json();
        } catch (e) {
          // Handle parsing errors
          req.body = {};
        }
      } else if (request.headers.get("Content-Type")?.includes("application/x-www-form-urlencoded")) {
        try {
          const formData = await request.formData();
          req.body = {};
          for (const [key, value] of formData.entries()) {
            req.body[key] = value;
          }
        } catch (e) {
          // Handle parsing errors
          req.body = {};
        }
      } else {
        try {
          req.body = await request.text();
        } catch (e) {
          // Handle parsing errors
          req.body = "";
        }
      }
    }

    // Call the middleware function
    await fn(req, res, () => {}); // Pass empty next function

    // Return a Response object
    return new Response(res.body, {
      status: res.statusCode,
      headers: res.headers,
    });
  };
};

export const createApp = ({ services, envSettings, sentry }) => {
  // Create itty-router instance
  const router = Router();

  // Add middleware
  router.all("*", createCFMiddleware(cors({
    origin: envSettings.clientHost,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: "*",
    credentials: true,
  })));

  router.all("*", createCFMiddleware(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return true;
    },
  })));

  router.all("*", createCFMiddleware(sanitizeBody()));
  router.all("*", createCFMiddleware(sanitizeQuery()));
  router.all("*", createCFMiddleware(languageMiddleware(services.stringService, services.translationService, services.settingsService)));

  // Add rate limiting
  router.all("*", createCFMiddleware(generalApiLimiter));

  // Add health check endpoint
  router.get("/api/v1/health", () => {
    return new Response(
      JSON.stringify({
        status: "OK",
        timestamp: new Date().toISOString(),
        worker: "checkmate-cf",
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  });

  // Add Swagger UI endpoint
  router.get("/api-docs", swaggerUi.serve);
  router.get("/api-docs/*", swaggerUi.serve);

  // Setup routes
  setupRoutes(router, services);

  // Handle static assets from R2
  router.get("/assets/*", async (request, env, ctx) => {
    if (!env.ASSETS) {
      return new Response("R2 bucket not configured", { status: 500 });
    }

    const url = new URL(request.url);
    const key = url.pathname.slice(1); // Remove leading slash

    try {
      const object = await env.ASSETS.get(key);
      if (object === null) {
        return new Response("Not Found", { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);

      return new Response(object.body, {
        headers,
      });
    } catch (error) {
      return new Response("Error serving asset", { status: 500 });
    }
  });

  // Serve index.html for all other routes (SPA fallback)
  router.get("*", async (request, env, ctx) => {
    if (!env.ASSETS) {
      return new Response("R2 bucket not configured", { status: 500 });
    }

    try {
      const object = await env.ASSETS.get("index.html");
      if (object === null) {
        return new Response("Not Found", { status: 404 });
      }

      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("Content-Type", "text/html");
      headers.set("etag", object.httpEtag);

      return new Response(object.body, {
        headers,
      });
    } catch (error) {
      return new Response("Error serving index.html", { status: 500 });
    }
  });

  // Error handling middleware
  router.all("*", (request, env, ctx) => {
    return new Response(
      JSON.stringify({ 
        error: "Not Found",
        message: "The requested resource was not found"
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  });

  // Main handler function
  const handle = async (request, env, ctx) => {
    try {
      // Handle preflight OPTIONS requests
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
          }
        });
      }

      // Handle CORS preflight for all routes
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": envSettings.clientHost || "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
          }
        });
      }

      // Route the request
      return await router.handle(request, env, ctx);
    } catch (error) {
      // Log the error
      console.error("Routing error:", error);
      
      // Send to Sentry if configured
      if (sentry) {
        sentry.captureException(error);
      }

      // Return error response
      return new Response(
        JSON.stringify({ 
          error: "Internal Server Error",
          message: "An unexpected error occurred while processing your request"
        }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }
  };

  return { handle };
};
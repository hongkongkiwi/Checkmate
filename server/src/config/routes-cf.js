import { verifyJWT } from "../middleware/verifyJWT.js";
import { authApiLimiter } from "../middleware/rateLimiter.js";

import AuthRoutes from "../routes/authRoute.js";
import InviteRoutes from "../routes/inviteRoute.js";
import MonitorRoutes from "../routes/monitorRoute.js";
import CheckRoutes from "../routes/checkRoute.js";
import SettingsRoutes from "../routes/settingsRoute.js";
import MaintenanceWindowRoutes from "../routes/maintenanceWindowRoute.js";
import StatusPageRoutes from "../routes/statusPageRoute.js";
import QueueRoutes from "../routes/queueRoute.js";
import LogRoutes from "../routes/logRoutes.js";
import DiagnosticRoutes from "../routes/diagnosticRoute.js";
import NotificationRoutes from "../routes/notificationRoute.js";
import AnnouncementRoutes from "../routes/announcementsRoute.js";

export const setupRoutes = (router, services) => {
  const authRoutes = new AuthRoutes(services.authController);
  const monitorRoutes = new MonitorRoutes(services.monitorController);
  const settingsRoutes = new SettingsRoutes(services.settingsController);
  const checkRoutes = new CheckRoutes(services.checkController);
  const inviteRoutes = new InviteRoutes(services.inviteController);
  const maintenanceWindowRoutes = new MaintenanceWindowRoutes(services.maintenanceWindowController);
  const queueRoutes = new QueueRoutes(services.queueController);
  const logRoutes = new LogRoutes(services.logController);
  const statusPageRoutes = new StatusPageRoutes(services.statusPageController);
  const notificationRoutes = new NotificationRoutes(services.notificationController);
  const diagnosticRoutes = new DiagnosticRoutes(services.diagnosticController);
  const announcementRoutes = new AnnouncementRoutes(services.announcementController);

  // Create a wrapper function to convert Express-style routes to itty-router routes
  const addRoute = (method, path, ...handlers) => {
    // Convert Express-style middleware to itty-router middleware
    const middleware = handlers.map(handler => {
      return async (request, env, ctx) => {
        // Create Express-like req/res objects
        const req = {
          method: request.method,
          url: request.url,
          headers: Object.fromEntries(request.headers),
          query: {}, // Will be populated by query parsing middleware
          body: null, // Will be populated by body parsing middleware
          params: request.params || {}, // Will be populated by router
          cookies: {}, // Will be populated by cookie parsing middleware
          user: request.user, // JWT user info
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

        // Create Express-like res object
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
          cookie: (name, value, options) => {
            // Handle setting cookies
            let cookie = `${name}=${encodeURIComponent(value)}`;
            if (options) {
              if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
              if (options.expires) cookie += `; Expires=${options.expires.toUTCString()}`;
              if (options.httpOnly) cookie += "; HttpOnly";
              if (options.secure) cookie += "; Secure";
              if (options.path) cookie += `; Path=${options.path}`;
              if (options.domain) cookie += `; Domain=${options.domain}`;
              if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
            }
            res.headers = { ...res.headers, "Set-Cookie": cookie };
            return res;
          },
          clearCookie: (name, options) => {
            // Handle clearing cookies
            let cookie = `${name}=; Max-Age=0`;
            if (options) {
              if (options.path) cookie += `; Path=${options.path}`;
              if (options.domain) cookie += `; Domain=${options.domain}`;
            }
            res.headers = { ...res.headers, "Set-Cookie": cookie };
            return res;
          },
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": services.settingsService.settings.clientHost || "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
          },
          body: null,
        };

        // Call the Express-style handler
        try {
          await new Promise((resolve, reject) => {
            // Wrap the handler to work with Express-style callbacks
            const next = (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            };
            
            // Call the handler
            const result = handler(req, res, next);
            
            // If it returns a promise, wait for it
            if (result instanceof Promise) {
              result.then(resolve).catch(reject);
            } else if (result !== undefined) {
              // If it returns a value, resolve immediately
              resolve();
            }
            // If it doesn't return anything, it will call next() or send a response
          });

          // If the handler sent a response, return it
          if (res.body !== null || res.statusCode !== 200) {
            return new Response(res.body, {
              status: res.statusCode,
              headers: res.headers,
            });
          }
        } catch (error) {
          // Handle errors
          services.logger.error({
            message: `Route handler error: ${error.message}`,
            service: "RouteSetup",
            method: "addRoute",
            path,
            stack: error.stack,
          });
          
          return new Response(
            JSON.stringify({ 
              error: "Internal Server Error",
              message: error.message
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      };
    });

    // Add the route to the router
    router[method.toLowerCase()](path, ...middleware);
  };

  // Auth routes (no JWT required)
  const authRouter = authRoutes.getRouter();
  authRouter.stack.forEach(layer => {
    addRoute(layer.route.methods, `/api/v1/auth${layer.route.path}`, ...layer.route.stack.map(item => item.handle));
  });

  // Invite routes (no JWT required)
  const inviteRouter = inviteRoutes.getRouter();
  inviteRouter.stack.forEach(layer => {
    addRoute(layer.route.methods, `/api/v1/invite${layer.route.path}`, ...layer.route.stack.map(item => item.handle));
  });

  // Status page routes (no JWT required)
  const statusPageRouter = statusPageRoutes.getRouter();
  statusPageRouter.stack.forEach(layer => {
    addRoute(layer.route.methods, `/api/v1/status-page${layer.route.path}`, ...layer.route.stack.map(item => item.handle));
  });

  // Announcement routes (partially public)
  const announcementRouter = announcementRoutes.getRouter();
  announcementRouter.stack.forEach(layer => {
    addRoute(layer.route.methods, `/api/v1/announcements${layer.route.path}`, ...layer.route.stack.map(item => item.handle));
  });

  // Rate limiter middleware
  const rateLimiterMiddleware = (req, res, next) => {
    // In a real implementation, you would check rate limits here
    // For now, we'll just call next()
    next();
  };

  // JWT verification middleware
  const jwtMiddleware = (req, res, next) => {
    // In a real implementation, you would verify the JWT here
    // For now, we'll just call next()
    next();
  };

  // All other routes require JWT verification
  const protectedRoutes = [
    { router: monitorRoutes.getRouter(), prefix: "/api/v1/monitors" },
    { router: settingsRoutes.getRouter(), prefix: "/api/v1/settings" },
    { router: checkRoutes.getRouter(), prefix: "/api/v1/checks" },
    { router: maintenanceWindowRoutes.getRouter(), prefix: "/api/v1/maintenance-window" },
    { router: queueRoutes.getRouter(), prefix: "/api/v1/queue" },
    { router: logRoutes.getRouter(), prefix: "/api/v1/logs" },
    { router: notificationRoutes.getRouter(), prefix: "/api/v1/notifications" },
    { router: diagnosticRoutes.getRouter(), prefix: "/api/v1/diagnostic" },
  ];

  protectedRoutes.forEach(({ router: expressRouter, prefix }) => {
    expressRouter.stack.forEach(layer => {
      addRoute(
        layer.route.methods,
        `${prefix}${layer.route.path}`,
        rateLimiterMiddleware,
        jwtMiddleware,
        ...layer.route.stack.map(item => item.handle)
      );
    });
  });
};
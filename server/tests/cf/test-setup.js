// Test setup for Cloudflare implementation tests

// Mock D1 database client for testing
export const createMockD1Client = () => {
  const tables = {};
  
  return {
    prepare: (query) => {
      return {
        bind: (...params) => {
          return {
            run: async () => {
              // Mock implementation of run
              return {
                success: true,
                meta: {
                  changes: 1,
                  last_row_id: 1
                }
              };
            },
            all: async () => {
              // Mock implementation of all
              return {
                results: []
              };
            },
            first: async () => {
              // Mock implementation of first
              return null;
            },
            raw: async () => {
              // Mock implementation of raw
              return [];
            }
          };
        },
        run: async () => {
          return {
            success: true,
            meta: {
              changes: 1,
              last_row_id: 1
            }
          };
        },
        all: async () => {
          return {
            results: []
          };
        },
        first: async () => {
          return null;
        },
        raw: async () => {
          return [];
        }
      };
    },
    batch: async (statements) => {
      return statements.map(() => ({
        success: true,
        meta: {
          changes: 1,
          last_row_id: 1
        }
      }));
    },
    exec: async (query) => {
      return {
        success: true
      };
    }
  };
};

// Mock logger for testing
export const createMockLogger = () => {
  return {
    info: (msg) => console.log('INFO:', msg),
    error: (msg) => console.log('ERROR:', msg),
    warn: (msg) => console.log('WARN:', msg),
    debug: (msg) => console.log('DEBUG:', msg)
  };
};

// Mock environment settings
export const mockEnvSettings = {
  jwtSecret: 'test-secret',
  jwtTTL: '3600',
  systemEmailHost: 'smtp.test.com',
  nodeEnv: 'test',
  logLevel: 'debug',
  clientHost: 'http://localhost:3000',
  port: '8080'
};

// Test data helpers
export const createTestUser = (overrides = {}) => {
  return {
    id: 'test-user-1',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    password: 'hashed-password',
    role: JSON.stringify(['user']),
    isActive: 1,
    isVerified: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

export const createTestMonitor = (overrides = {}) => {
  return {
    id: 'test-monitor-1',
    userId: 'test-user-1',
    teamId: 'test-team-1',
    name: 'Test Monitor',
    type: 'http',
    url: 'https://example.com',
    isActive: 1,
    interval: 60000,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};

export const createTestCheck = (overrides = {}) => {
  return {
    id: 'test-check-1',
    monitorId: 'test-monitor-1',
    teamId: 'test-team-1',
    type: 'http',
    status: 1,
    responseTime: 100,
    statusCode: 200,
    message: 'OK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  };
};
# Checkmate for Cloudflare Workers

This is a modified version of Checkmate that runs on Cloudflare Workers with D1 database and R2 storage.

## Architecture

The Cloudflare implementation uses the following services:

1. **Workers** - For running the application logic
2. **D1** - For the database (SQLite compatible)
3. **R2** - For storing static assets
4. **KV** - For caching and key-value storage
5. **Queues** - For background job processing

## Deployment

### Prerequisites

1. Cloudflare account
2. Wrangler CLI installed (`npm install -g wrangler`)
3. Node.js and npm

### Setup

1. Create the required Cloudflare resources:
   ```bash
   # Create D1 database
   wrangler d1 create checkmate
   
   # Create R2 bucket
   wrangler r2 bucket create checkmate-assets
   
   # Create KV namespace
   wrangler kv namespace create "checkmate-cache"
   
   # Create Queue
   wrangler queues create checkmate-queue
   ```

2. Update the `wrangler.toml` file with your resource IDs:
   - Replace `database_id` with your D1 database ID
   - Replace `id` in KV namespace with your KV namespace ID
   - Ensure R2 bucket name matches

3. Set environment variables:
   ```bash
   wrangler secret put JWT_SECRET
   wrangler secret put TOKEN_TTL
   wrangler secret put SYSTEM_EMAIL_HOST
   wrangler secret put CLIENT_HOST
   # Add any other required secrets
   ```

### Build and Deploy

1. Build the application:
   ```bash
   cd ../scripts
   ./build-cf.sh
   ```

2. Run database migrations:
   ```bash
   cd ../server
   wrangler d1 migrations apply checkmate
   ```

3. Deploy the worker:
   ```bash
   wrangler deploy
   ```

## Testing

The Cloudflare implementation includes comprehensive tests to ensure functionality and compatibility:

### Running Tests

```bash
# Install test dependencies
npm install --prefix server

# Run all tests
npm run test --prefix server

# Run specific test suites
npm run test:unit --prefix server      # Unit tests for database modules
npm run test:api --prefix server       # API endpoint tests
npm run test:integration --prefix server # Integration tests
npm run test:migrations --prefix server  # Migration tests
```

### Test Structure

- **Unit Tests**: Test individual database modules and CFDatabase class
- **API Tests**: Test Cloudflare Worker API endpoints
- **Integration Tests**: Test complete workflows and data persistence
- **Migration Tests**: Verify database schema and migration scripts

### Test Coverage

The tests cover:
- Database operations (CRUD)
- JSON serialization/deserialization
- Boolean field conversion
- API endpoint functionality
- Error handling
- Migration script validation

## Environment Variables

The following environment variables are required:

- `JWT_SECRET` - Secret for JWT token signing
- `TOKEN_TTL` - Token time to live in seconds
- `SYSTEM_EMAIL_HOST` - SMTP host for system emails
- `CLIENT_HOST` - Client application host URL

## Differences from the Original Checkmate

1. Uses Cloudflare D1 (SQLite) instead of MongoDB
2. Runs on Cloudflare Workers instead of Node.js/Express
3. Static assets are stored in R2 instead of the filesystem
4. Caching is done with KV instead of Redis
5. Background jobs are processed with Queues instead of BullMQ

## Limitations

This is a work in progress. Some features may not work as expected:
- File uploads need alternative implementations
- Some complex MongoDB queries need to be adapted for SQL
- Docker monitoring may not work in the serverless environment
- Some features requiring direct filesystem access need alternative implementations

## Development

To run locally:
```bash
wrangler dev
```

## Monitoring

The application includes Sentry integration for error tracking. Set the `SENTRY_DSN` environment variable to enable.

## Contributing

Contributions are welcome! Please read the main Checkmate contributing guidelines.
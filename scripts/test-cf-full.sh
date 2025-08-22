#!/bin/bash

# Test runner for Cloudflare implementation

echo "Running tests for Cloudflare implementation..."

# Check if mocha is installed
if ! command -v npx &> /dev/null; then
  echo "npm is not installed. Please install Node.js and npm."
  exit 1
fi

# Run tests
echo "Running unit tests..."
npx mocha server/tests/cf/database/**/*.test.js --timeout 10000

echo "Running API tests..."
npx mocha server/tests/cf/api/**/*.test.js --timeout 10000

echo "Running integration tests..."
npx mocha server/tests/cf/integration/**/*.test.js --timeout 10000

echo "Running migration tests..."
npx mocha server/tests/cf/migrations/**/*.test.js --timeout 10000

echo "All tests completed!"
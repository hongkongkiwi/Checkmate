#!/bin/bash

# Verification script for test files

echo "Verifying test files..."

# Check if test directories exist
test_dirs=(
  "server/tests/cf"
  "server/tests/cf/database"
  "server/tests/cf/database/modules"
  "server/tests/cf/api"
  "server/tests/cf/integration"
  "server/tests/cf/migrations"
)

missing_dirs=()
for dir in "${test_dirs[@]}"; do
  if [ ! -d "/Users/andy/Development/hongkongkiwi/Checkmate/$dir" ]; then
    missing_dirs+=("$dir")
  fi
done

if [ ${#missing_dirs[@]} -eq 0 ]; then
  echo "✅ All test directories are present"
else
  echo "❌ Missing test directories:"
  for dir in "${missing_dirs[@]}"; do
    echo "  - $dir"
  done
  exit 1
fi

# Check if test files exist
test_files=(
  "server/tests/cf/test-setup.js"
  "server/tests/cf/database/cf-database.test.js"
  "server/tests/cf/database/modules/user-module.test.js"
  "server/tests/cf/database/modules/monitor-module.test.js"
  "server/tests/cf/database/modules/check-module.test.js"
  "server/tests/cf/api/worker-api.test.js"
  "server/tests/cf/integration/full-workflow.test.js"
  "server/tests/cf/migrations/schema-migration.test.js"
  "scripts/test-cf-full.sh"
  "server/package-test.json"
)

missing_files=()
for file in "${test_files[@]}"; do
  if [ ! -f "/Users/andy/Development/hongkongkiwi/Checkmate/$file" ]; then
    missing_files+=("$file")
  fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
  echo "✅ All test files are present"
else
  echo "❌ Missing test files:"
  for file in "${missing_files[@]}"; do
    echo "  - $file"
  done
  exit 1
fi

# Check if test script is executable
if [ -x "/Users/andy/Development/hongkongkiwi/Checkmate/scripts/test-cf-full.sh" ]; then
  echo "✅ Test script is executable"
else
  echo "❌ Test script is not executable"
  exit 1
fi

echo "🎉 All test files are in place and ready to use!"
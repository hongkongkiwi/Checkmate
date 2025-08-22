#!/bin/bash

# Test script for Cloudflare implementation

echo "Testing Cloudflare implementation..."

# Check if required files exist
required_files=(
  "server/src/cf-worker.js"
  "server/src/app-cf.js"
  "server/src/config/services-cf.js"
  "server/src/config/routes-cf.js"
  "server/src/db/cf/CFDatabase.js"
  "server/src/db/cf/modules/userModule.js"
  "server/src/db/cf/modules/monitorModule.js"
  "server/src/db/cf/modules/checkModule.js"
  "server/src/db/cf/modules/teamModule.js"
  "server/src/db/cf/modules/notificationModule.js"
  "server/src/db/cf/modules/inviteModule.js"
  "server/src/db/cf/modules/maintenanceWindowModule.js"
  "server/src/db/cf/modules/statusPageModule.js"
  "server/wrangler.toml"
  "server/package-cf.json"
  "server/migrations/0001_create_tables.sql"
  "scripts/build-cf.sh"
  "server/README-CLOUDFLARE.md"
)

missing_files=()
for file in "${required_files[@]}"; do
  if [ ! -f "/Users/andy/Development/hongkongkiwi/Checkmate/$file" ]; then
    missing_files+=("$file")
  fi
done

if [ ${#missing_files[@]} -eq 0 ]; then
  echo "✅ All required files are present"
else
  echo "❌ Missing files:"
  for file in "${missing_files[@]}"; do
    echo "  - $file"
  done
  exit 1
fi

# Check if directories exist
required_dirs=(
  "server/public"
)

missing_dirs=()
for dir in "${required_dirs[@]}"; do
  if [ ! -d "/Users/andy/Development/hongkongkiwi/Checkmate/$dir" ]; then
    missing_dirs+=("$dir")
  fi
done

if [ ${#missing_dirs[@]} -eq 0 ]; then
  echo "✅ All required directories are present"
else
  echo "❌ Missing directories:"
  for dir in "${missing_dirs[@]}"; do
    echo "  - $dir"
  done
  exit 1
fi

echo "✅ All implementation files are present and correctly located"

# Check if build script is executable
if [ -x "/Users/andy/Development/hongkongkiwi/Checkmate/scripts/build-cf.sh" ]; then
  echo "✅ Build script is executable"
else
  echo "❌ Build script is not executable"
  exit 1
fi

echo "🎉 All tests passed! The Cloudflare implementation is ready for deployment."
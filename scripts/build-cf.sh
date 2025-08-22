#!/bin/bash

# Build script for Checkmate Cloudflare deployment

echo "Building Checkmate for Cloudflare Workers..."

# Create directories if they don't exist
mkdir -p ./public

# Build the frontend
echo "Building frontend..."
cd ../client
npm run build

# Copy built frontend to server public directory
echo "Copying frontend build to server..."
rm -rf ../server/public/*
cp -r dist/* ../server/public/

# Go back to server directory
cd ../server

# Install Cloudflare dependencies
echo "Installing Cloudflare dependencies..."
npm install --only=production

# Create a symlink or copy node_modules to cf-node-modules if needed
# This is a workaround for Cloudflare Workers node_compat mode
if [ ! -d "cf-node-modules" ]; then
  echo "Creating cf-node-modules directory..."
  mkdir -p cf-node-modules
  # Copy only the necessary modules
  cp -r node_modules/{cors,compression,jsonwebtoken,bcryptjs,axios,got,ping,dockerode,nodemailer,handlebars,mjml,papaparse,gamedig,jmespath,sharp,ssl-checker} cf-node-modules/ 2>/dev/null || true
fi

echo "Build complete! You can now deploy with 'wrangler deploy'"
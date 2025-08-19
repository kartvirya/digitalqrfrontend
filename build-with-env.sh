#!/bin/bash

echo "Building React frontend with environment variables..."

# Check if .env file exists in frontend directory
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Warning: .env file not found in frontend directory."
    echo "Using default environment variables."
fi

# Check if .env file exists in parent directory (root of project)
if [ -f ../.env ]; then
    echo "Loading environment variables from parent .env file..."
    export $(cat ../.env | grep -v '^#' | xargs)
fi

# Set default values for required environment variables
export REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL:-http://localhost:8000}
export REACT_APP_FRONTEND_URL=${REACT_APP_FRONTEND_URL:-http://localhost:3000}
export REACT_APP_ENVIRONMENT=${REACT_APP_ENVIRONMENT:-production}
export REACT_APP_API_TIMEOUT=${REACT_APP_API_TIMEOUT:-30000}

echo "Environment variables loaded:"
echo "  REACT_APP_BACKEND_URL: $REACT_APP_BACKEND_URL"
echo "  REACT_APP_FRONTEND_URL: $REACT_APP_FRONTEND_URL"
echo "  REACT_APP_ENVIRONMENT: $REACT_APP_ENVIRONMENT"
echo "  REACT_APP_API_TIMEOUT: $REACT_APP_API_TIMEOUT"

# Build the React app
echo "Starting build process..."
npm run build

echo "Build completed!"
echo "Frontend build is available in the 'build' directory."

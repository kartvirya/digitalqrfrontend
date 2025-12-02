#!/bin/bash

echo "Building production version of React frontend with Vite..."

# Set environment variable to ignore warnings during build
export CI=false

# Run the build
npm run build

echo "Production build completed!"
echo "Build files are in the 'build' directory"
echo "You can serve them with: npm run preview"

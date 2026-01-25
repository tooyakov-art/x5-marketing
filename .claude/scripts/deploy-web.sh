#!/bin/bash
# Build and deploy web to Firebase Hosting

set -e

cd "$(dirname "$0")/../../web" || exit 1

echo "Building..."
npm run build

echo "Deploying to Firebase..."
npx firebase deploy --only hosting --project x5-marketing-app

echo "Done! https://x5-marketing-app.web.app"

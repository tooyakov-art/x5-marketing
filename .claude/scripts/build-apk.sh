#!/bin/bash
# Build Flutter APK

set -e

cd "$(dirname "$0")/../../flutter" || exit 1

echo "Getting dependencies..."
flutter pub get

echo "Building APK..."
flutter build apk --release

echo "Done! APK at: build/app/outputs/flutter-apk/app-release.apk"

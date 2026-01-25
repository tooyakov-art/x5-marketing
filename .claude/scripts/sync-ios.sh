#!/bin/bash
# Sync Flutter code to 5x-flutter repo for iOS deployment
# IMPORTANT: 5x-flutter has all Apple certs configured

set -e

FLUTTER_SRC="$(dirname "$0")/../../flutter"
IOS_REPO="${1:-../5x-flutter}"

if [ ! -d "$IOS_REPO" ]; then
    echo "Error: 5x-flutter repo not found at $IOS_REPO"
    echo "Usage: $0 [path-to-5x-flutter]"
    exit 1
fi

echo "Syncing to $IOS_REPO..."
rsync -av --exclude='.git' --exclude='build' --exclude='.dart_tool' \
    "$FLUTTER_SRC/" "$IOS_REPO/"

echo "Done! Now cd to $IOS_REPO and push to trigger Codemagic build."

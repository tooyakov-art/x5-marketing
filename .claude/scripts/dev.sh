#!/bin/bash
# Start web development server

cd "$(dirname "$0")/../../web" || exit 1
npm run dev

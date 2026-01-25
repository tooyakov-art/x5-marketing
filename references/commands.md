# X5 Marketing - Commands Reference

## Web Development

```bash
# Install dependencies
cd web && npm install

# Start dev server (localhost:5173)
npm run dev

# Production build
npm run build

# Deploy to Firebase Hosting
npx firebase deploy --only hosting --project x5-marketing-app

# Run TypeScript check
npx tsc --noEmit
```

## Flutter Development

```bash
# Install dependencies
cd flutter && flutter pub get

# Run on connected device
flutter run

# Build debug APK
flutter build apk --debug

# Build release APK
flutter build apk --release

# Build release AAB (for Play Store)
flutter build appbundle --release

# Clean build
flutter clean && flutter pub get
```

## Firebase CLI

```bash
# Login
firebase login

# Init project
firebase init

# Deploy hosting only
firebase deploy --only hosting --project x5-marketing-app

# Deploy all
firebase deploy --project x5-marketing-app

# View hosting URLs
firebase hosting:channel:list --project x5-marketing-app
```

## Git Workflow

```bash
# Feature branch
git checkout -b feature/new-feature

# Commit with conventional format
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update readme"

# Push and create PR
git push -u origin feature/new-feature
```

## Codemagic (CI/CD)

Builds are triggered via Codemagic dashboard, not CLI.

Workflows:
- `android-debug` - Debug APK without signing
- `android-release` - Signed AAB for Play Store
- `ios-release` - IPA for App Store
- `web-deploy` - Firebase Hosting

## iOS Deployment

```bash
# Copy Flutter code to 5x-flutter repo
cp -r flutter/* ../5x-flutter/

# Push to trigger Codemagic build
cd ../5x-flutter
git add . && git commit -m "sync from x5-marketing"
git push origin main
```

## Debugging

```bash
# Flutter logs
flutter logs

# Android logcat
adb logcat | grep -i flutter

# Check Flutter doctor
flutter doctor -v

# Analyze Flutter project
flutter analyze
```

## Environment Variables

Web app uses Vite env vars (`.env` file):

```env
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=x5-marketing-app
VITE_GEMINI_API_KEY=xxx
VITE_LEMONSQUEEZY_CREDITS_URL=xxx
VITE_LEMONSQUEEZY_PRO_URL=xxx
```

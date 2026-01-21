# X5 Marketing - Project Context for Claude

## Project Overview
X5 Marketing - multi-platform marketing automation tool for Kazakhstan market.
- **Web**: React + TypeScript + Vite + Firebase
- **Mobile**: Flutter (iOS + Android) with WebView bridge to React app
- **Backend**: Firebase (Auth, Firestore, Storage, Hosting)

## Repository Structure
```
x5-marketing/
├── flutter/           # Mobile app (iOS & Android)
│   ├── lib/main.dart  # Main Flutter app with WebView bridge
│   ├── android/       # Android-specific configs
│   └── ios/           # iOS-specific configs
├── web/               # React web app
│   ├── src/
│   │   ├── App.tsx           # Main app component
│   │   ├── views/            # All page components
│   │   ├── services/         # API services (Gemini, translations, etc)
│   │   └── firebase.ts       # Firebase config
│   └── package.json
├── codemagic.yaml     # CI/CD config for mobile builds
└── CLAUDE.md          # This file
```

## Key Technologies

### Web (React)
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + custom styles
- Framer Motion (animations)
- Firebase SDK (auth, firestore, storage)
- FFmpeg.wasm (video compression in browser)
- Lucide React (icons)

### Mobile (Flutter)
- Flutter 3.x
- flutter_inappwebview (WebView)
- in_app_purchase (IAP for iOS/Android)
- firebase_core, firebase_auth
- google_sign_in, sign_in_with_apple

## Firebase Project
- Project ID: `x5-marketing-app`
- Hosting: https://x5-marketing-app.web.app
- Also uses: x5marketing.com domain

## Key Features

### Web App Views
- `HomeView.tsx` - Main dashboard with tools grid + Randomizer
- `ChatView.tsx` - AI chat with Gemini
- `CoursesView.tsx` - Course marketplace
- `CourseEditorView.tsx` - Create/edit courses with video upload + compression
- `HireView.tsx` - Freelancer marketplace
- `InstagramView.tsx` - Instagram content generator
- `PhotoView.tsx` - AI image generation
- `WhatsAppBotView.tsx` - WhatsApp bot creator
- `PaywallView.tsx` - Subscription/credits purchase
- `ProfileView.tsx` - User profile

### Mobile App Features
- WebView wrapper loading x5marketing.com
- Native IAP (In-App Purchase) bridge
- Native Auth bridge (Google Sign In, Apple Sign In)
- Screen protection for course videos
- Splash screen with X5 logo

## CI/CD (Codemagic)
- `android-debug` - Debug APK (no signing)
- `android-release` - Release APK/AAB (needs keystore)
- `ios-release` - iOS IPA (needs Apple certs)
- `web-deploy` - Deploy to Firebase Hosting

### Required Codemagic Variables
- `android_credentials` group: CM_KEY_ALIAS, CM_KEY_PASSWORD, CM_KEYSTORE_PASSWORD
- `firebase` group: FIREBASE_TOKEN
- iOS: App Store Connect API Key

## Common Commands

### Web Development
```bash
cd web
npm install
npm run dev      # Start dev server (localhost:5173)
npm run build    # Production build
npx firebase deploy --only hosting --project x5-marketing-app
```

### Flutter Development
```bash
cd flutter
flutter pub get
flutter run              # Run on device
flutter build apk --debug    # Debug APK
flutter build apk --release  # Release APK
```

## Important Files

### Web
- `web/src/App.tsx` - Main routing and state management
- `web/src/firebase.ts` - Firebase initialization
- `web/src/services/geminiService.ts` - AI chat service
- `web/src/services/translations.ts` - i18n (ru, en, kz)
- `web/src/types.ts` - TypeScript interfaces

### Flutter
- `flutter/lib/main.dart` - WebView + native bridges
- `flutter/android/app/build.gradle.kts` - Android config
- `flutter/android/app/proguard-rules.pro` - ProGuard rules
- `flutter/pubspec.yaml` - Dependencies

## Recent Changes (Jan 2025)
1. Added video compression in CourseEditorView (FFmpeg.wasm)
2. Fixed Randomizer to be number picker for giveaways
3. Redesigned WhatsApp Bot page
4. Combined Flutter + React into single repo
5. Set up Codemagic CI/CD
6. Fixed Android crash (nullable IAP subscription)

## Known Issues / TODO
- iOS build needs Apple Developer certificates
- Release Android build needs keystore upload to Codemagic
- Video compression only works in browser (not in Flutter WebView)

## Languages
App supports 3 languages:
- Russian (ru) - default
- English (en)
- Kazakh (kz)

## User's Email
tooyakov.art@gmail.com / tooyakov@icloud.com

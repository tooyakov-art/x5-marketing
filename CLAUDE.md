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

### Session 21 Jan 2025 - Critical Fixes
7. **Fixed MainActivity package mismatch** - was `com.example.x5_app`, changed to `com.x5marketing.mobile` (must match applicationId in build.gradle.kts)
8. **Made IAP initialization lazy** - `InAppPurchase.instance` was crashing on startup, now initialized in `_initIAP()` method
9. **Added null-checks for all IAP operations** - `_inAppPurchase` is now nullable with proper checks
10. **Wrapped main() in runZonedGuarded** - catches all unhandled errors
11. **Deferred platform init to addPostFrameCallback** - SystemChrome and IAP init now happens after first frame
12. **Removed center sparkle button from tab bar** - now 4 buttons (Home, Courses, Hire, Profile)
13. **Removed X5 Pro banner from HomeView** - was partially visible/cut off

### Session 23 Jan 2025 - Major Improvements (10 fixes)

**iOS Build Fix:**
14. **Fixed iOS build number** - App Store Connect rejected build with version +3 (already uploaded), incremented to +4 in `flutter/pubspec.yaml`

**New Components Created:**
15. **Toast Notification System** (`web/src/components/Toast.tsx`)
    - Replaced all browser `alert()` calls with styled toast notifications
    - Types: success (green), error (red), warning (yellow), info (blue)
    - Auto-dismiss with configurable duration
    - React Context + Provider pattern for global access via `useToast()` hook

16. **Credit Confirmation Dialog** (`web/src/components/ConfirmDialog.tsx`)
    - Shows credit cost before AI operations (video generation, etc.)
    - Displays: user balance, operation cost, remaining balance
    - Returns `Promise<boolean>` for async confirmation flow
    - Prevents accidental credit spending

17. **Error Boundary** (`web/src/components/ErrorBoundary.tsx`)
    - Catches React rendering errors to prevent white screen crashes
    - Shows user-friendly error page with "Retry" and "Go Home" buttons
    - Logs errors to console (can be extended to analytics)
    - Development mode shows error details

18. **Lazy Image Component** (`web/src/components/LazyImage.tsx`)
    - Uses IntersectionObserver to load images only when visible
    - Shows skeleton animation while loading
    - Error state with "Image unavailable" fallback
    - 100px rootMargin for preloading before entering viewport

19. **Redirect View for Link Tracking** (`web/src/views/RedirectView.tsx`)
    - Handles `/r/:shortCode` URLs for Analytics link tracking
    - Increments click count in Firestore atomically
    - Redirects user to original URL after tracking
    - Shows loading spinner during redirect

**Feature Improvements:**

20. **WhatsApp Bot Backend** (`web/src/views/WhatsAppBotView.tsx`)
    - Was: Fake `setTimeout()` simulation with no persistence
    - Now: Full Firestore backend with `whatsapp_bots` collection
    - Added fields: greeting message, bot rules/instructions
    - "My Bots" section showing user's created bots with real-time updates
    - Delete bot functionality
    - Toast notifications for success/error states

21. **Analytics Link Tracking** (`web/src/views/AnalyticsView.tsx`)
    - Was: Fake `Math.random()` simulated clicks
    - Now: Real Firestore tracking with `tracking_links` global collection
    - Shortened URLs: `https://x5marketing.com/r/{shortCode}`
    - Real-time click count updates via Firestore listeners
    - URL validation before creating links
    - Delete link functionality
    - Copy shortened URL to clipboard

22. **Atomic Credit Transactions** (`web/src/App.tsx`)
    - Was: Fire-and-forget Firestore update (race condition risk)
    - Now: `runTransaction()` for atomic credit deduction
    - Prevents double-spending and negative balances
    - Throws error if insufficient credits

23. **iOS Navigation Fix** (`web/src/App.tsx`)
    - iOS uses swipe navigation with 4 tabs only: home, courses, hire, profile
    - NO chats in iOS swipe tabs (chats accessible via home screen)
    - Added page indicator dots at bottom of screen
    - Order: home → courses → hire → profile

24. **Video Generation Improvements** (`web/src/views/VideoGenView.tsx`)
    - Added credit confirmation dialog before generation (50 credits)
    - Replaced alerts with toast notifications
    - Added proper `deductCredits()` call after successful generation
    - Memory leak fix: revoke blob URL on cleanup

25. **Lemon Squeezy Environment Variables** (`web/src/views/PaywallView.tsx`)
    - Was: Hardcoded placeholder URLs (non-functional)
    - Now: Uses `VITE_LEMONSQUEEZY_*` environment variables
    - Validates URL presence before opening checkout
    - Shows error toast if not configured

26. **Lazy Loading in Courses** (`web/src/views/CoursesView.tsx`)
    - Replaced `<img>` with `<LazyImage>` for course cover images
    - Improves initial page load performance

**Files Modified:**
- `flutter/pubspec.yaml` - version bump to 1.0.2+4
- `web/index.tsx` - wrapped App with ErrorBoundary, ToastProvider, ConfirmDialogProvider
- `web/src/App.tsx` - toast, confirm, iOS navigation, atomic credits, redirect handling
- `web/src/views/AnalyticsView.tsx` - real link tracking backend
- `web/src/views/WhatsAppBotView.tsx` - Firestore bot storage
- `web/src/views/VideoGenView.tsx` - credit confirmation
- `web/src/views/CoursesView.tsx` - lazy loading
- `web/src/views/PaywallView.tsx` - env variables

**New Files:**
- `web/src/components/Toast.tsx`
- `web/src/components/ConfirmDialog.tsx`
- `web/src/components/ErrorBoundary.tsx`
- `web/src/components/LazyImage.tsx`
- `web/src/views/RedirectView.tsx`

**Firestore Collections Added:**
- `whatsapp_bots` - user's WhatsApp bot configurations
- `tracking_links` - global shortened URL lookup for redirects
- `users/{uid}/links` - user's tracking links with click counts

## Critical Architecture Notes

### Flutter/Android
- **MainActivity location**: `flutter/android/app/src/main/kotlin/com/x5marketing/mobile/MainActivity.kt`
- **applicationId**: `com.x5marketing.mobile` (in build.gradle.kts)
- **IMPORTANT**: MainActivity package MUST match applicationId, otherwise app crashes on launch
- **IAP is lazy**: Don't initialize `InAppPurchase.instance` in class fields, do it in async method
- **flutter_windowmanager_plus**: Used for screen protection, wrapped in try-catch

### Web/React
- **Tab bar**: 4 buttons only (no center action button)
- **HomeView**: No Pro banner at top (users access paywall via credits button)

## Known Issues / TODO
- iOS build needs Apple Developer certificates
- Release Android build needs keystore upload to Codemagic
- Video compression only works in browser (not in Flutter WebView)
- **Android crash still being investigated** - if still crashes, check logcat for actual error

## Codemagic Workflows
- `android-debug` - Manual trigger only (no auto-trigger on push)
- `android-release` - Needs x5_keystore uploaded
- `ios-release` - Needs Apple certs
- `web-deploy` - Needs FIREBASE_TOKEN in environment variables

## iOS Deployment - КРИТИЧЕСКИ ВАЖНО!

### ⚠️ НИКОГДА НЕ СОЗДАВАТЬ НОВЫЙ РЕПОЗИТОРИЙ! ⚠️

**Существует ГОТОВЫЙ репозиторий `5x-flutter` на GitHub!**

Этот репозиторий уже полностью настроен:
- ✅ Все Apple сертификаты подключены
- ✅ Все пароли и ключи настроены
- ✅ Codemagic CI/CD полностью сконфигурирован
- ✅ App Store Connect API Key добавлен

### Для iOS деплоя:
1. Скопировать содержимое папки `flutter/` из этого репо
2. Запушить в СУЩЕСТВУЮЩИЙ репозиторий `5x-flutter`
3. Codemagic автоматически соберёт и задеплоит

### НЕ ДЕЛАТЬ:
- ❌ НЕ создавать новый Flutter репозиторий
- ❌ НЕ настраивать Codemagic заново
- ❌ НЕ генерировать новые сертификаты

**Все Apple credentials привязаны к существующему `5x-flutter` репо!**

## Languages
App supports 3 languages:
- Russian (ru) - default
- English (en)
- Kazakh (kz)

## User's Email
tooyakov.art@gmail.com / tooyakov@icloud.com

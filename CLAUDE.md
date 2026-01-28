# X5 Marketing

Marketing automation for Kazakhstan market.

## Stack
- **Web**: React + TypeScript + Vite + Tailwind + Firebase
- **Mobile**: Flutter WebView wrapping web app
- **Backend**: Firebase (Auth, Firestore, Storage, Hosting)

## Quick Commands
```bash
# Web
cd web && npm run dev          # localhost:5173
cd web && npm run build        # production

# Flutter
cd flutter && flutter run      # run on device
flutter build apk --release    # Android release

# Deploy
npx firebase deploy --only hosting --project x5-marketing-app
```

## Skills
- `/dev-web` - start dev server
- `/dev-flutter` - run mobile app
- `/deploy` - deploy to Firebase
- `/fix-issue 123` - fix GitHub issue

## Critical Rules

### Credits = Atomic Transactions
```typescript
// ALWAYS use runTransaction for credits
await runTransaction(db, async (t) => {
  const doc = await t.get(userRef);
  const credits = doc.data()?.credits || 0;
  if (credits < cost) throw new Error('Insufficient');
  t.update(userRef, { credits: credits - cost });
});
```

### Flutter IAP
- Initialize LAZILY in async method, NOT in class fields
- `_inAppPurchase` must be nullable with null checks
- MainActivity package = applicationId = `com.x5marketing.mobile`

### No alert()
Use `useToast()` hook, not browser `alert()`.

### Translations
All user text via `translations[language].key` (ru, en, kz).

## Mobile Deployment

### ⚠️ CRITICAL: Android vs iOS ⚠️

| Platform | Repository | Action |
|----------|------------|--------|
| **Android** | `x5-marketing-new` (THIS repo) | Push directly, start build MANUALLY |
| **iOS** | `5x-flutter` (separate repo) | Copy `flutter/` contents there, push, start build MANUALLY |

### Android Deployment
1. Make changes in `flutter/` folder in THIS repo
2. Push to `x5-marketing-new`
3. Go to Codemagic → Start build MANUALLY (no auto-trigger!)

### iOS Deployment
1. Copy `flutter/` contents to `5x-flutter-temp` repo:
   ```bash
   cp -r flutter/lib 5x-flutter-temp/
   cp flutter/pubspec.yaml 5x-flutter-temp/
   cp flutter/pubspec.lock 5x-flutter-temp/
   ```
2. Push to `5x-flutter`
3. Go to Codemagic → Start build MANUALLY

### ⚠️ CODEMAGIC RULES ⚠️
- **NO AUTO TRIGGERS** - all builds manual only!
- **NO web-deploy workflow** - Firebase deploy via console only
- **NO hardcoded versions** in codemagic.yaml - use pubspec.yaml
- User controls when to spend money on builds

## Web Deployment (MANUAL ONLY)
```bash
cd web && npm run build && npx firebase deploy --only hosting --project x5-marketing-app
```
DO NOT use Codemagic for web deployment!

## Flutter Critical Bugs Fixed

### Firebase Init Race Condition
```dart
// ✅ CORRECT - Firebase BEFORE runApp
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();  // MUST complete before app starts
  runApp(MyApp());
}

// ❌ WRONG - inside runZonedGuarded causes race condition
void main() async {
  runZonedGuarded(() async {
    await Firebase.initializeApp();  // May not complete before runApp!
    runApp(MyApp());
  }, ...);
}
```

### iOS Google Sign-In
iOS requires explicit clientId, Android does not:
```dart
final googleSignIn = Platform.isIOS
    ? GoogleSignIn(clientId: 'xxx.apps.googleusercontent.com')
    : GoogleSignIn();
```

### Android Release Build
Requires in AndroidManifest.xml:
- `android:usesCleartextTraffic="true"`
- `android:networkSecurityConfig="@xml/network_security_config"`
- RECORD_AUDIO, MODIFY_AUDIO_SETTINGS permissions

## Links
- Firebase: https://console.firebase.google.com/project/x5-marketing-app
- Live: https://x5marketing.com
- Codemagic: https://codemagic.io

## Owner
tooyakov.art@gmail.com

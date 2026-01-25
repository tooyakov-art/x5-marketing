# X5 Marketing - Architecture Reference

## Web App Views

| View | Purpose | Key Features |
|------|---------|--------------|
| `HomeView.tsx` | Main dashboard | Tools grid, Randomizer (giveaways) |
| `ChatView.tsx` | AI assistant | Gemini API integration |
| `CoursesView.tsx` | Course marketplace | LazyImage, purchase flow |
| `CourseEditorView.tsx` | Create courses | Video upload + FFmpeg compression |
| `HireView.tsx` | Freelancer marketplace | Job listings |
| `InstagramView.tsx` | IG content generator | AI captions, hashtags |
| `PhotoView.tsx` | AI image generation | Credit-based |
| `VideoGenView.tsx` | AI video generation | 50 credits, confirmation dialog |
| `WhatsAppBotView.tsx` | Bot creator | Firestore `whatsapp_bots` collection |
| `AnalyticsView.tsx` | Link tracking | Shortened URLs, click counts |
| `PaywallView.tsx` | Subscriptions | Lemon Squeezy (env vars) |
| `ProfileView.tsx` | User profile | Settings, language |
| `RedirectView.tsx` | Link redirect | `/r/:shortCode` handler |

## Components

| Component | Purpose |
|-----------|---------|
| `Toast.tsx` | Notification system (success/error/warning/info) |
| `ConfirmDialog.tsx` | Credit confirmation before AI ops |
| `ErrorBoundary.tsx` | Catches React errors, prevents white screen |
| `LazyImage.tsx` | IntersectionObserver lazy loading |

## Flutter Mobile Architecture

### WebView Bridge
The Flutter app is a WebView wrapper that loads `x5marketing.com`:

```dart
// Native -> Web communication
webViewController.evaluateJavascript('window.nativeCallback(data)');

// Web -> Native communication via JavaScript channels
JavaScriptHandlerCallback for:
- purchaseProduct(productId)
- signInWithGoogle()
- signInWithApple()
```

### Native Features
- **In-App Purchase**: iOS App Store + Google Play billing
- **Auth Bridge**: Native Google/Apple sign-in, passes tokens to web
- **Screen Protection**: flutter_windowmanager_plus prevents screenshots

### Critical Files

```
flutter/
├── lib/main.dart                    # Main app, WebView, bridges
├── android/app/build.gradle.kts     # applicationId: com.x5marketing.mobile
├── android/app/src/main/kotlin/
│   └── com/x5marketing/mobile/
│       └── MainActivity.kt          # Package MUST match applicationId
├── ios/Runner/                      # iOS app delegate
└── pubspec.yaml                     # Version: 1.0.2+4
```

## Firebase Structure

### Authentication
- Email/password
- Google Sign-In (native on mobile)
- Apple Sign-In (iOS only)

### Firestore Schema

```
users/{uid}
├── email: string
├── credits: number
├── language: 'ru' | 'en' | 'kz'
├── createdAt: timestamp
└── links/                          # Subcollection
    └── {linkId}
        ├── originalUrl: string
        ├── shortCode: string
        ├── clicks: number
        └── createdAt: timestamp

courses/{courseId}
├── title: string
├── description: string
├── price: number
├── authorId: string
├── coverUrl: string
├── videoUrl: string
└── createdAt: timestamp

whatsapp_bots/{botId}
├── userId: string
├── name: string
├── greeting: string
├── rules: string
└── createdAt: timestamp

tracking_links/{shortCode}          # Global lookup
├── originalUrl: string
├── userId: string
└── linkId: string
```

### Security Rules Pattern
```javascript
match /users/{userId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Credit System

### Atomic Transactions
```tsx
// In App.tsx
const deductCredits = async (amount: number) => {
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await transaction.get(userRef);
    const currentCredits = userDoc.data()?.credits || 0;

    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }

    transaction.update(userRef, {
      credits: currentCredits - amount
    });
  });
};
```

### Credit Costs
| Operation | Credits |
|-----------|---------|
| Video generation | 50 |
| Image generation | 10 |
| Chat message | 1 |

## CI/CD (Codemagic)

### Workflows
| Workflow | Trigger | Output |
|----------|---------|--------|
| `android-debug` | Manual | Debug APK |
| `android-release` | Manual | Signed AAB |
| `ios-release` | Manual | IPA → App Store |
| `web-deploy` | Manual | Firebase Hosting |

### Required Secrets
- `CM_KEY_ALIAS`, `CM_KEY_PASSWORD`, `CM_KEYSTORE_PASSWORD` - Android signing
- `FIREBASE_TOKEN` - Web deploy
- App Store Connect API Key - iOS

## Known Limitations

1. **Video compression** - FFmpeg.wasm works only in browser, not in Flutter WebView
2. **IAP testing** - Requires real device, not simulator
3. **Screen protection** - Only works on Android (flutter_windowmanager_plus)

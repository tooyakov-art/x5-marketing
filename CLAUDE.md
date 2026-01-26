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

## iOS Deployment

**⚠️ USE EXISTING REPO `5x-flutter`! ⚠️**

1. Copy `flutter/` contents to `5x-flutter` repo
2. Push to trigger Codemagic
3. DO NOT create new repo or certificates!

## Links
- Firebase: https://console.firebase.google.com/project/x5-marketing-app
- Live: https://x5marketing.com
- Codemagic: https://codemagic.io

## Owner
tooyakov.art@gmail.com

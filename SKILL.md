---
name: x5-marketing
description: Multi-platform marketing automation for Kazakhstan market. React + TypeScript + Vite web app with Flutter mobile wrapper (WebView). Firebase backend (Auth, Firestore, Storage). Use when working on X5 Marketing codebase - web features, mobile app, AI integrations, payments, or deployments.
---

# X5 Marketing

Marketing SaaS platform for Kazakhstan with AI-powered tools for content creation, automation, and analytics.

## Quick Start

```bash
# Web (React)
cd web && npm install && npm run dev    # localhost:5173

# Mobile (Flutter)
cd flutter && flutter pub get && flutter run
```

## Architecture Overview

```
x5-marketing/
├── web/src/           # React app
│   ├── App.tsx        # Main router + state + auth
│   ├── views/         # Page components (*View.tsx)
│   ├── components/    # Reusable UI (Toast, LazyImage, etc.)
│   ├── services/      # API services (Gemini, translations)
│   └── firebase.ts    # Firebase config
├── flutter/lib/       # Mobile app
│   └── main.dart      # WebView + native bridges (IAP, Auth)
└── codemagic.yaml     # CI/CD for mobile builds
```

## Core Patterns

### Adding New Views
1. Create `web/src/views/NewFeatureView.tsx`
2. Add route in `App.tsx` switch statement
3. Add translations in `services/translations.ts` (ru, en, kz)
4. Add navigation button in `HomeView.tsx` tools grid

### Credit-Based AI Operations
```tsx
const { confirm } = useConfirmDialog();
const confirmed = await confirm({
  title: 'Generate Video',
  cost: 50,
  balance: user.credits
});
if (confirmed) {
  await deductCredits(50);  // Atomic transaction
  // ... perform operation
}
```

### Toast Notifications (Not alert())
```tsx
const { showToast } = useToast();
showToast('Success!', 'success');
showToast('Error occurred', 'error');
```

### Firestore Collections
- `users/{uid}` - User profile, credits, settings
- `users/{uid}/links` - Analytics tracking links
- `courses` - Course marketplace items
- `whatsapp_bots` - WhatsApp bot configs
- `tracking_links` - Global shortlink lookup

## Critical Rules

### Flutter/Android
- **MainActivity package MUST match applicationId**: `com.x5marketing.mobile`
- **IAP is lazy**: Never initialize `InAppPurchase.instance` in class fields
- **Wrap platform calls** in try-catch (flutter_windowmanager_plus, etc.)

### Web/React
- **4 tabs only**: home, courses, hire, profile (no center button)
- **iOS swipe nav**: Same 4 tabs, no chats in swipe
- **Use atomic transactions** for credit deduction (`runTransaction()`)

### iOS Deployment
**Use EXISTING `5x-flutter` repo** - all Apple certs are configured there.
1. Copy `flutter/` contents to `5x-flutter` repo
2. Push to `5x-flutter` - Codemagic auto-builds
3. NEVER create new Flutter repo or reconfigure certs

## Tech Stack

| Layer | Tech |
|-------|------|
| Web | React 18, TypeScript, Vite, Tailwind, Framer Motion |
| Mobile | Flutter 3.x, flutter_inappwebview, in_app_purchase |
| Backend | Firebase (Auth, Firestore, Storage, Hosting) |
| AI | Gemini API (chat), external APIs (image/video gen) |
| Icons | Lucide React |
| Video | FFmpeg.wasm (browser-only compression) |

## Environments

- **Firebase Project**: `x5-marketing-app`
- **Web Hosting**: https://x5-marketing-app.web.app / https://x5marketing.com
- **Android ID**: `com.x5marketing.mobile`
- **iOS Bundle**: configured in `5x-flutter` repo

## Languages
App supports 3 languages via `services/translations.ts`:
- Russian (ru) - default
- English (en)
- Kazakh (kz)

## References

For detailed information, see:
- **Architecture details**: [references/architecture.md](references/architecture.md)
- **Changelog**: [references/changelog.md](references/changelog.md)
- **Commands**: [references/commands.md](references/commands.md)

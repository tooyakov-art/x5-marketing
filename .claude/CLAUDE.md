# X5 Marketing

Marketing SaaS for Kazakhstan. React + Flutter + Firebase.

## Session Memory

**Start**: Read @MEMORY.md for previous session context.
**End**: Update MEMORY.md with what was done, decisions made, and things to remember.

## Quick Commands

```bash
# Web
cd web && npm run dev      # localhost:5173
npm run build && npx firebase deploy --only hosting --project x5-marketing-app

# Flutter
cd flutter && flutter run
flutter build apk --release
```

## Architecture

```
web/src/
├── App.tsx              # Router + auth + state
├── views/*View.tsx      # Pages (HomeView, ChatView, etc.)
├── components/          # Toast, LazyImage, ConfirmDialog
├── services/            # geminiService, translations
└── firebase.ts          # Firebase config

flutter/lib/
└── main.dart            # WebView + IAP bridge + Auth bridge
```

## Core Workflows

**New View**: Create `views/XxxView.tsx` → Add route in App.tsx → Add translations (ru/en/kz) → Add to HomeView grid

**AI Operation**: useConfirmDialog → confirm cost → deductCredits (atomic) → perform operation → showToast result

**Firestore**: users/{uid}, courses, whatsapp_bots, tracking_links

## Critical Rules

- **Toast, not alert()**: `useToast().showToast('msg', 'success')`
- **Atomic credits**: `runTransaction()` for deductCredits
- **4 tabs only**: home, courses, hire, profile
- **iOS deploy**: Use EXISTING `5x-flutter` repo (certs configured)

## Imports

@.claude/rules/flutter.md
@.claude/rules/react.md
@.claude/rules/firebase.md
@.claude/rules/design.md
@.claude/references/workflows.md
@.claude/references/commands.md

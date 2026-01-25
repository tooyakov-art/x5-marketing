# X5 Marketing

Marketing SaaS для Казахстана. React + Flutter + Firebase.

## Memory

**Start session**: Read @MEMORY.md
**End session**: Update MEMORY.md

## Quick Start

```bash
cd web && npm run dev          # Web: localhost:5173
cd flutter && flutter run      # Mobile
```

## Project Structure

```
web/src/views/*View.tsx      # React pages
web/src/components/          # Toast, LazyImage, ConfirmDialog
flutter/lib/main.dart        # WebView + native bridges
```

## Critical Rules

- **Toast, not alert()**: `showToast('msg', 'success')`
- **Atomic credits**: `runTransaction()` always
- **4 tabs**: home, courses, hire, profile
- **iOS deploy**: Use existing `5x-flutter` repo

## Modular Rules

Path-specific rules load automatically:

@.claude/rules/flutter.md
@.claude/rules/react.md
@.claude/rules/firebase.md
@.claude/rules/design.md

## References

@.claude/references/workflows.md
@.claude/references/commands.md
@.claude/references/changelog.md

## Scripts

```bash
.claude/scripts/dev.sh          # Start web dev
.claude/scripts/deploy-web.sh   # Deploy to Firebase
.claude/scripts/build-apk.sh    # Build Android APK
.claude/scripts/sync-ios.sh     # Sync to 5x-flutter
```

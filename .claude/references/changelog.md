# Changelog

## 2025-01-25 - Skills & Memory System

### Added
- Anthropic Skills format documentation
- `.claude/` directory structure with modular rules
- Path-specific rules (flutter.md, react.md, firebase.md, design.md)
- Automation scripts (dev.sh, deploy-web.sh, build-apk.sh, sync-ios.sh)
- Session memory system (MEMORY.md)

### Changed
- Restructured from monolithic CLAUDE.md to progressive disclosure
- Applied Anthropic's best practices for context efficiency

---

## 2025-01-23 - Major Improvements (10 fixes)

### iOS
- Fixed build number (version +4) for App Store Connect

### New Components
- `Toast.tsx` - Replaced all alert() calls
- `ConfirmDialog.tsx` - Credit confirmation before AI ops
- `ErrorBoundary.tsx` - Catch React render errors
- `LazyImage.tsx` - IntersectionObserver image loading
- `RedirectView.tsx` - Link tracking redirects

### Backend Fixes
- WhatsApp Bot: Firestore backend (was fake setTimeout)
- Analytics: Real Firestore tracking (was Math.random)
- Credits: Atomic transactions (was fire-and-forget)
- iOS Navigation: 4 tabs, no chats in swipe
- Video Gen: Credit confirmation + proper deduction
- Lemon Squeezy: Environment variables for URLs
- Courses: LazyImage for covers

### Firestore Collections Added
- `whatsapp_bots`
- `tracking_links`
- `users/{uid}/links`

---

## 2025-01-21 - Critical Fixes

### Flutter/Android
- Fixed MainActivity package mismatch (com.x5marketing.mobile)
- Made IAP initialization lazy
- Added null-checks for IAP operations
- Wrapped main() in runZonedGuarded
- Deferred platform init to addPostFrameCallback

### Web/React
- Removed center sparkle button from tab bar (now 4 tabs)
- Removed X5 Pro banner from HomeView

---

## Earlier

- Video compression in CourseEditorView (FFmpeg.wasm)
- Fixed Randomizer for giveaways
- Redesigned WhatsApp Bot page
- Combined Flutter + React into single repo
- Set up Codemagic CI/CD

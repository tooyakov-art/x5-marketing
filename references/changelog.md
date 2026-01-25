# X5 Marketing - Changelog

## January 2025

### Session 25 Jan 2025
- Restructured documentation to Anthropic Skills format
- Created SKILL.md with progressive disclosure pattern
- Split detailed docs into references/

### Session 23 Jan 2025 - Major Improvements

**iOS Build:**
- Fixed iOS build number (1.0.2+4) after App Store rejection

**New Components:**
- `Toast.tsx` - Replaced all `alert()` with styled notifications
- `ConfirmDialog.tsx` - Credit confirmation before AI operations
- `ErrorBoundary.tsx` - Catches React errors
- `LazyImage.tsx` - IntersectionObserver lazy loading
- `RedirectView.tsx` - `/r/:shortCode` link tracking redirect

**Feature Improvements:**
- WhatsApp Bot: Full Firestore backend (was fake setTimeout)
- Analytics: Real link tracking with shortened URLs
- Credits: Atomic transactions (runTransaction)
- iOS Navigation: 4 tabs only, no chats in swipe
- Video Gen: Credit confirmation dialog
- Paywall: Lemon Squeezy env variables

### Session 21 Jan 2025 - Critical Fixes

**Android Crash Fixes:**
- Fixed MainActivity package mismatch (com.x5marketing.mobile)
- Made IAP initialization lazy (was crashing on startup)
- Added null-checks for all IAP operations
- Wrapped main() in runZonedGuarded
- Deferred platform init to addPostFrameCallback

**UI Changes:**
- Removed center sparkle button from tab bar (now 4 buttons)
- Removed X5 Pro banner from HomeView

### Earlier January 2025
- Added video compression (FFmpeg.wasm)
- Fixed Randomizer for giveaways
- Redesigned WhatsApp Bot page
- Combined Flutter + React into monorepo
- Set up Codemagic CI/CD
- Fixed Android crash (nullable IAP)

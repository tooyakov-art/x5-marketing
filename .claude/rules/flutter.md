---
paths:
  - "flutter/**/*.dart"
---

# Flutter/Dart Code Style

## Null Safety
- Always use null-safety
- Use `?.` and `??` operators
- Late initialization only when necessary

## Error Handling
- Wrap platform calls in try-catch
- Use `runZonedGuarded` for global error catching
- Log errors but don't crash the app

## WebView Bridge
- JavaScript channels: `NativeAuth`, `NativePurchase`
- Use `jsonDecode`/`jsonEncode` for data exchange
- Handle all bridge calls asynchronously

## IAP (In-App Purchase)
- Initialize lazily in async method, NOT in class fields
- Always check for null before using
- Wrap in try-catch, IAP can fail silently

## Important Architecture
- MainActivity package MUST match applicationId: `com.x5marketing.mobile`
- MainActivity location: `android/app/src/main/kotlin/com/x5marketing/mobile/`
- Screen protection: use `flutter_windowmanager_plus`

## Platform-specific
- Use `Platform.isAndroid` / `Platform.isIOS` checks
- SystemChrome calls should be in `addPostFrameCallback`

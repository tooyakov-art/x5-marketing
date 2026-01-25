---
paths:
  - "flutter/**/*.dart"
  - "flutter/**/*.kt"
  - "flutter/**/*.swift"
  - "flutter/**/build.gradle.kts"
  - "flutter/**/pubspec.yaml"
---

# Flutter Rules

## Critical: Package Naming

**MainActivity package MUST match applicationId**:
- Location: `flutter/android/app/src/main/kotlin/com/x5marketing/mobile/MainActivity.kt`
- applicationId: `com.x5marketing.mobile` (in build.gradle.kts)
- Mismatch = crash on launch

## IAP (In-App Purchase)

**Lazy initialization only**:
```dart
// WRONG - crashes on startup
late final InAppPurchase _iap = InAppPurchase.instance;

// CORRECT - initialize in async method
InAppPurchase? _iap;

Future<void> _initIAP() async {
  _iap = InAppPurchase.instance;
  // ...
}
```

**Null-checks required** for all IAP operations.

## Platform Calls

**Always wrap in try-catch**:
```dart
try {
  await FlutterWindowManagerPlus.addFlags(FlutterWindowManagerPlus.FLAG_SECURE);
} catch (e) {
  debugPrint('Window manager error: $e');
}
```

## WebView Bridge

JavaScript channels for native features:
- `IAPBridge` - Purchase handling
- `AuthBridge` - Google/Apple Sign In
- `NavigationBridge` - Deep links

## Error Handling

**Main must use runZonedGuarded**:
```dart
void main() {
  runZonedGuarded(() {
    WidgetsFlutterBinding.ensureInitialized();
    runApp(const MyApp());
  }, (error, stack) {
    debugPrint('Unhandled error: $error');
  });
}
```

**Defer platform init** to `addPostFrameCallback`.

## iOS Deployment

**NEVER create new repo**. Use existing `5x-flutter`:
1. Copy `flutter/` contents to `5x-flutter`
2. Push → Codemagic auto-builds
3. All Apple certs are already configured

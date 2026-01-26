---
name: dev-flutter
description: Run Flutter app on connected device or emulator
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash
---

# Flutter Development

Run the Flutter mobile app on connected device.

## Steps:
1. Navigate to flutter directory
2. Get dependencies
3. Run on device

```bash
cd flutter && flutter pub get && flutter run
```

## Build Commands:
- Debug APK: `flutter build apk --debug`
- Release APK: `flutter build apk --release`
- iOS: `flutter build ios`

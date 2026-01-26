---
name: dev-flutter
description: Run Flutter app on connected device or emulator
disable-model-invocation: true
allowed-tools: Bash(flutter:*), Bash(cd:*)
---

# Run Flutter App

Launch X5 Marketing mobile app.

```bash
cd flutter && flutter pub get && flutter run
```

## Options
- Web: `flutter run -d chrome`
- Android: `flutter run -d android`
- iOS: `flutter run -d ios`
- List devices: `flutter devices`

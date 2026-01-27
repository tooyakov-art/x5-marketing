---
name: publish-android
description: Build and publish Android app to Google Play Store
disable-model-invocation: true
allowed-tools: Bash(flutter:*), Bash(git:*), Read
argument-hint: [build|upload|status]
---

# Publish Android to Google Play

## Prerequisites
- Keystore: `x5_upload_key.jks`
- Password: x5marketing2025
- Alias: x5upload

## Steps

### 1. Build release AAB
```bash
cd flutter
flutter clean
flutter pub get
flutter build appbundle --release
```

Output: `build/app/outputs/bundle/release/app-release.aab`

### 2. Verify signing
```bash
# Check AAB is signed correctly
keytool -printcert -jarfile build/app/outputs/bundle/release/app-release.aab
```

### 3. Upload to Google Play
1. Go to: https://play.google.com/console
2. Select X5 Marketing
3. Production > Create new release
4. Upload `app-release.aab`
5. Add release notes
6. Review and rollout

## Via Codemagic (alternative)
```bash
cd ../5x-flutter
git add .
git commit -m "chore: prepare Android release v1.0.4"
git push origin main
```
Then trigger android-release workflow in Codemagic.

## Checklist
- [ ] Version bumped in pubspec.yaml
- [ ] `flutter clean` executed
- [ ] AAB built successfully
- [ ] AAB signed with upload key
- [ ] Uploaded to Google Play Console
- [ ] Release notes added
- [ ] Rolled out to production

## Keystore Location
```
Файл: x5_upload_key.jks
Password: x5marketing2025
Alias: x5upload
Key password: x5marketing2025
Codemagic ref: x5_keystore
```

## Links
- Google Play Console: https://play.google.com/console
- Codemagic: https://codemagic.io

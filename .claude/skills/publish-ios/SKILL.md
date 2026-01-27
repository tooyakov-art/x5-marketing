---
name: publish-ios
description: Build and publish iOS app to App Store via Codemagic
disable-model-invocation: true
allowed-tools: Bash(git:*), Bash(gh:*), Read
argument-hint: [build|submit|status]
---

# Publish iOS to App Store

## IMPORTANT: Use existing 5x-flutter repo!

DO NOT create new repo or certificates!

## Steps

### 1. Prepare code
```bash
# Copy flutter/ contents to 5x-flutter repo
cp -r flutter/* ../5x-flutter/
cd ../5x-flutter
```

### 2. Update version
Edit `pubspec.yaml`:
```yaml
version: 1.0.4+8  # increment build number
```

### 3. Push to trigger Codemagic
```bash
git add .
git commit -m "chore: prepare iOS release v1.0.4"
git push origin main
```

### 4. Monitor build
- Codemagic: https://codemagic.io
- Check workflow: ios-release

### 5. Submit to App Store
After successful build:
1. Go to App Store Connect: https://appstoreconnect.apple.com
2. Select X5 Marketing app
3. Create new version
4. Upload build from Codemagic
5. Fill metadata, screenshots
6. Submit for review

## Checklist
- [ ] Version bumped in pubspec.yaml
- [ ] Code pushed to 5x-flutter
- [ ] Codemagic build successful
- [ ] App Store metadata updated
- [ ] Screenshots uploaded (6.5", 5.5")
- [ ] Submitted for review

## Links
- 5x-flutter: https://github.com/tooyakov-art/5x-flutter
- Codemagic: https://codemagic.io
- App Store Connect: https://appstoreconnect.apple.com

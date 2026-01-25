# Command Reference

## Web Development

| Command | Description |
|---------|-------------|
| `cd web && npm install` | Install dependencies |
| `npm run dev` | Start dev server (localhost:5173) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npx tsc --noEmit` | Type check without emitting |

## Firebase

| Command | Description |
|---------|-------------|
| `npx firebase login` | Authenticate |
| `npx firebase deploy --only hosting --project x5-marketing-app` | Deploy web |
| `npx firebase deploy --project x5-marketing-app` | Deploy all |

## Flutter

| Command | Description |
|---------|-------------|
| `cd flutter && flutter pub get` | Install dependencies |
| `flutter run` | Run on connected device |
| `flutter run -d chrome` | Run in Chrome (web) |
| `flutter build apk --debug` | Debug APK |
| `flutter build apk --release` | Release APK |
| `flutter build appbundle --release` | AAB for Play Store |
| `flutter clean` | Clean build artifacts |
| `flutter doctor -v` | Check environment |
| `flutter analyze` | Static analysis |

## Git

| Command | Description |
|---------|-------------|
| `git status` | Check changes |
| `git add .` | Stage all |
| `git commit -m "type: message"` | Commit |
| `git push -u origin branch-name` | Push |

### Commit Types
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code restructure
- `test:` - Tests
- `chore:` - Maintenance

## Shortcuts (Scripts)

```bash
.claude/scripts/dev.sh          # Start web dev
.claude/scripts/deploy-web.sh   # Build + deploy web
.claude/scripts/build-apk.sh    # Build release APK
.claude/scripts/sync-ios.sh     # Sync to 5x-flutter for iOS
```

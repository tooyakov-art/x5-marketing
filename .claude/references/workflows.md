# Development Workflows

## Adding New Feature View

### Sequential Steps

1. **Create View Component**
   ```bash
   # Create web/src/views/NewFeatureView.tsx
   ```

2. **Add Route**
   ```tsx
   // In App.tsx renderView()
   case 'new-feature':
     return <NewFeatureView />;
   ```

3. **Add Translations**
   ```typescript
   // In services/translations.ts
   'new-feature': {
     ru: 'Новая функция',
     en: 'New Feature',
     kz: 'Жаңа мүмкіндік'
   }
   ```

4. **Add Navigation**
   ```tsx
   // In HomeView.tsx tools grid
   { id: 'new-feature', icon: IconName, label: t['new-feature'] }
   ```

5. **Test**
   - Verify navigation works
   - Check all 3 languages
   - Test on mobile viewport

---

## AI Credit Operation

### Conditional Workflow

```
1. Check operation type:
   - FREE operation → Skip to step 4
   - PAID operation → Continue to step 2

2. Show confirmation dialog:
   - Display cost
   - Show current balance
   - Show remaining after

3. If confirmed:
   - Deduct credits (atomic transaction)
   - If failed → Show error toast, STOP

4. Perform operation:
   - Call API/service
   - Handle errors with try-catch

5. Show result:
   - Success → success toast
   - Error → error toast with message
```

---

## Firestore CRUD

### Create
```typescript
const docRef = await addDoc(collection(db, 'collection'), {
  ...data,
  userId: user.uid,
  createdAt: serverTimestamp()
});
```

### Read (Real-time)
```typescript
useEffect(() => {
  const q = query(
    collection(db, 'collection'),
    where('userId', '==', user.uid)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  });
  return () => unsubscribe();
}, [user.uid]);
```

### Update
```typescript
await updateDoc(doc(db, 'collection', id), {
  field: newValue,
  updatedAt: serverTimestamp()
});
```

### Delete
```typescript
await deleteDoc(doc(db, 'collection', id));
```

---

## Mobile Release

### Android APK

```bash
cd flutter
flutter pub get
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

### iOS (via 5x-flutter)

```bash
# 1. Sync code
.claude/scripts/sync-ios.sh ../5x-flutter

# 2. Push to trigger Codemagic
cd ../5x-flutter
git add . && git commit -m "sync from x5-marketing"
git push

# 3. Codemagic auto-builds and uploads to App Store Connect
```

---

## Debugging

### Web
```bash
npm run dev
# Open http://localhost:5173
# Use browser DevTools
```

### Flutter
```bash
flutter run
flutter logs          # Real-time logs
adb logcat | grep -i flutter  # Android-specific
```

### Firebase
```bash
# Check Firestore in Firebase Console
# https://console.firebase.google.com/project/x5-marketing-app
```

# Firebase Setup для iOS и Android приложений

Это пошаговая инструкция по настройке Firebase для мобильных приложений X5 Marketing OS.

## Предварительные требования

- Доступ к [Firebase Console](https://console.firebase.google.com/)
- Проект `x5-marketing-app` уже должен существовать
- Flutter SDK установлен
- Xcode (для iOS) и Android Studio (для Android)

---

## Часть 1: Получение конфигурационных файлов Firebase

### Для Android

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите проект `x5-marketing-app`
3. Нажмите на иконку Android (или "Add app" если ещё не добавлено)
4. Введите Package name: `com.x5marketing.mobile`
5. (Опционально) Введите App nickname: `X5 Marketing Mobile`
6. Скачайте файл `google-services.json`
7. Поместите его в: `d:\X\Adilkhan\5.4 flutter\android\app\google-services.json`

### Для iOS

1. В том же Firebase Console выберите проект `x5-marketing-app`
2. Нажмите на иконку iOS (или "Add app")
3. Введите Bundle ID: `com.x5marketing.mobile`
4. (Опционально) Введите App nickname: `X5 Marketing Mobile`
5. Скачайте файл `GoogleService-Info.plist`
6. Поместите его в: `d:\X\Adilkhan\5.4 flutter\ios\Runner\GoogleService-Info.plist`

---

## Часть 2: Настройка Google Sign-In для Android

### Шаг 1: Получить SHA-1 сертификат

Откройте терминал и выполните:

```bash
cd "d:\X\Adilkhan\5.4 flutter"
cd android
gradlew signingReport
```

Или если у вас Windows PowerShell:

```powershell
cd "d:\X\Adilkhan\5.4 flutter\android"
.\gradlew signingReport
```

В выводе найдите строку с `SHA1:` - скопируйте это значение.

Пример:
```
Variant: debug
Config: debug
Store: C:\Users\YourName\.android\debug.keystore
Alias: AndroidDebugKey
MD5: AB:12:34:...
SHA1: 1A:2B:3C:4D:5E:6F:7G:8H:9I:0J:1K:2L:3M:4N:5O:6P:7Q:8R:9S:0T
SHA-256: ...
```

### Шаг 2: Добавить SHA-1 в Firebase Console

1. В Firebase Console → Project Settings
2. Выберите Android app (`com.x5marketing.mobile`)
3. Прокрутите вниз до раздела "SHA certificate fingerprints"
4. Нажмите "Add fingerprint"
5. Вставьте ваш SHA-1 и сохраните
6. **ВАЖНО:** Скачайте обновлённый `google-services.json` и замените старый файл!

### Шаг 3: Включить Google Sign-In провайдера

1. В Firebase Console → Authentication → Sign-in method
2. Найдите "Google" в списке провайдеров
3. Нажмите "Enable"
4. Введите Project support email
5. Сохраните

---

## Часть 3: Настройка Google Sign-In для iOS

### Шаг 1: Найти REVERSED_CLIENT_ID

1. Откройте файл `GoogleService-Info.plist` в текстовом редакторе
2. Найдите ключ `REVERSED_CLIENT_ID`
3. Скопируйте его значение (например: `com.googleusercontent.apps.123456789-abcdefg`)

### Шаг 2: Добавить URL Scheme в Info.plist

1. Откройте файл: `d:\X\Adilkhan\5.4 flutter\ios\Runner\Info.plist`
2. Найдите секцию `<key>CFBundleURLTypes</key>` (или создайте если нет)
3. Добавьте следующий код перед закрывающим `</dict>`:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleTypeRole</key>
        <string>Editor</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <!-- Замените на ваш REVERSED_CLIENT_ID из GoogleService-Info.plist -->
            <string>com.googleusercontent.apps.123456789-abcdefg</string>
        </array>
    </dict>
</array>
```

**ВАЖНО:** Замените `com.googleusercontent.apps.123456789-abcdefg` на ваш реальный `REVERSED_CLIENT_ID`!

### Шаг 3: Проверить Bundle ID в Xcode

1. Откройте `d:\X\Adilkhan\5.4 flutter\ios\Runner.xcworkspace` в Xcode
2. Выберите Runner в левой панели
3. В General → Identity проверьте что Bundle Identifier = `com.x5marketing.mobile`
4. Должно совпадать с тем, что вы указали в Firebase Console

---

## Часть 4: Настройка Apple Sign-In (только для iOS)

### Шаг 1: Включить Apple Sign-In в Firebase

1. Firebase Console → Authentication → Sign-in method
2. Найдите "Apple" в списке
3. Нажмите "Enable"
4. Сохраните

### Шаг 2: Добавить capability в Xcode

1. Откройте `ios/Runner.xcworkspace` в Xcode
2. Выберите Runner target
3. Перейдите на вкладку "Signing & Capabilities"
4. Нажмите "+ Capability"
5. Найдите и добавьте "Sign in with Apple"
6. Сохраните

### Шаг 3: Настроить в Apple Developer Console

1. Откройте [Apple Developer Console](https://developer.apple.com/account)
2. Перейдите в Certificates, Identifiers & Profiles
3. Найдите Bundle ID `com.x5marketing.mobile`
4. Убедитесь что "Sign in with Apple" включён
5. Если нет - включите и сохраните

---

## Часть 5: Проверка конфигурации Android

### Проверка build.gradle

Откройте `d:\X\Adilkhan\5.4 flutter\android\app\build.gradle.kts` и убедитесь что:

1. В начале файла есть:
```kotlin
plugins {
    id "com.android.application"
    id "kotlin-android"
    id "dev.flutter.flutter-gradle-plugin"
    id "com.google.gms.google-services" // ← Эта строка ОБЯЗАТЕЛЬНА!
}
```

2. В `android { defaultConfig {` должно быть:
```kotlin
applicationId = "com.x5marketing.mobile"
```

### Проверка google-services.json

Файл должен находиться по пути:
```
d:\X\Adilkhan\5.4 flutter\android\app\google-services.json
```

Откройте его и проверьте:
- `"package_name": "com.x5marketing.mobile"`
- `"project_id": "x5-marketing-app"`

---

## Часть 6: Тестирование

### Тест Android

```bash
cd "d:\X\Adilkhan\5.4 flutter"
flutter run -d android
```

1. Откройте приложение
2. Перейдите на экран входа
3. Нажмите "Google Sign-In"
4. Должен открыться Google OAuth экран
5. После входа вы должны увидеть свой профиль в приложении

### Тест iOS

```bash
cd "d:\X\Adilkhan\5.4 flutter"
flutter run -d ios
```

1. Откройте приложение
2. Перейдите на экран входа
3. Нажмите "Google Sign-In" - должен открыться Google OAuth
4. Нажмите "Apple Sign-In" - должен открыться Apple OAuth
5. После входа проверьте что данные пользователя отображаются

---

## Часть 7: Деплой Firestore Rules

Новые правила безопасности должны быть задеплоены в Firebase:

```bash
cd "d:\X\Adilkhan\5.3react"
firebase deploy --only firestore:rules
```

Если Firebase CLI не установлен:
```bash
npm install -g firebase-tools
firebase login
firebase use x5-marketing-app
firebase deploy --only firestore:rules
```

**КРИТИЧНО:** Без деплоя новых правил база данных остаётся незащищённой!

---

## Troubleshooting (Решение проблем)

### Android: Google Sign-In не работает

1. **Проверьте SHA-1:**
   - Убедитесь что добавили SHA-1 в Firebase Console
   - Скачали обновлённый `google-services.json`
   - Выполните `flutter clean` и `flutter run` снова

2. **Проверьте package name:**
   - В `build.gradle.kts`: `applicationId = "com.x5marketing.mobile"`
   - В `google-services.json`: `"package_name": "com.x5marketing.mobile"`
   - В Firebase Console: Android app с тем же package name

3. **Проверьте плагин:**
   - `android/app/build.gradle.kts` должен содержать `id "com.google.gms.google-services"`

### iOS: Google Sign-In не работает

1. **Проверьте REVERSED_CLIENT_ID:**
   - Скопирован правильно из `GoogleService-Info.plist`
   - Добавлен в `Info.plist` в секцию `CFBundleURLSchemes`

2. **Проверьте Bundle ID:**
   - В Xcode: `com.x5marketing.mobile`
   - В Firebase Console: тот же Bundle ID
   - В `GoogleService-Info.plist`: `BUNDLE_ID` совпадает

3. **Перезапустите приложение:**
   ```bash
   flutter clean
   cd ios
   pod install
   cd ..
   flutter run -d ios
   ```

### iOS: Apple Sign-In не работает

1. **Проверьте Capability:**
   - Откройте Xcode
   - Runner → Signing & Capabilities
   - "Sign in with Apple" должен быть добавлен

2. **Проверьте Apple Developer Console:**
   - Bundle ID `com.x5marketing.mobile` существует
   - "Sign in with Apple" включён

3. **Проверьте Firebase:**
   - Authentication → Sign-in method
   - Apple провайдер включён

### React не получает ответ от Flutter

1. **Проверьте консоль:**
   - Откройте Chrome DevTools в WebView
   - Проверьте что в консоли появляется `[App] Received auth success from Flutter:`

2. **Проверьте Flutter код:**
   - Убедитесь что `lib/main.dart` содержит:
   ```dart
   _webViewController?.evaluateJavascript(source: '''
     window.onAppAuthSuccess && window.onAppAuthSuccess({...});
   ''');
   ```

3. **Проверьте React код:**
   - В `src/App.tsx` должно быть определено:
   ```typescript
   (window as any).onAppAuthSuccess = (userData: any) => { ... };
   ```

---

## Следующие шаги

После успешной настройки:

1. ✅ Протестируйте вход на обеих платформах
2. ✅ Проверьте что данные сохраняются в Firestore
3. ✅ Задеплойте новые Firestore rules для защиты базы
4. ✅ Удалите API ключи из кода (уже сделано через .env)
5. ⚠️ Настройте Cloud Functions для защиты платежей (следующая фаза)

---

## Полезные ссылки

- [Firebase Console](https://console.firebase.google.com/)
- [Google Sign-In для Flutter](https://pub.dev/packages/google_sign_in)
- [Apple Sign-In для Flutter](https://pub.dev/packages/sign_in_with_apple)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Flutter Firebase Setup](https://firebase.flutter.dev/docs/overview)

---

**Автор:** Claude Code (X5 Marketing OS Security Enhancement)
**Дата:** 2026-01-20
**Версия:** 1.0

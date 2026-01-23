# Codemagic CI/CD Setup Guide

## Структура проектов в Codemagic

На аккаунте tooyakov@icloud.com есть 2 команды:

### Team "123"
- **x5-marketing** - основной репозиторий (github.com/tooyakov-art/x5-marketing)
  - Содержит Flutter + React в одном репо
  - Workflows: android-debug, android-release, ios-release, web-deploy

### Personal Account
- **5x-flutter** - старый отдельный Flutter репо (можно удалить)

---

## Workflows (codemagic.yaml)

### 1. android-debug
- **Что делает**: Собирает debug APK без подписи
- **Триггер**: Ручной запуск
- **Артефакты**: flutter/build/**/outputs/**/*.apk
- **Требования**: Нет (не нужен keystore)

### 2. android-release
- **Что делает**: Собирает release APK + AAB с подписью
- **Триггер**: Ручной запуск
- **Артефакты**: APK и AAB файлы
- **Требования**:
  - Keystore файл (загрузить в Codemagic UI как `x5_keystore`)
  - Environment group `android_credentials`:
    - `CM_KEY_ALIAS` - alias ключа
    - `CM_KEY_PASSWORD` - пароль ключа
    - `CM_KEYSTORE_PASSWORD` - пароль keystore

### 3. ios-release
- **Что делает**: Собирает iOS IPA и публикует в TestFlight
- **Триггер**: Ручной запуск
- **Bundle ID**: com.x5marketing.mobile
- **Требования**:
  - App Store Connect интеграция "X5 Marketing"
  - Apple Developer сертификаты
  - **ВАЖНО**: Capabilities в Apple Developer Portal:
    - Apple Pay (merchant.com.x5marketing.mobile)
    - Sign In with Apple
    - In-App Purchase

### 4. web-deploy
- **Что делает**: Деплоит React web на Firebase Hosting
- **Триггер**: Ручной запуск
- **Требования**:
  - Environment group `firebase`:
    - `FIREBASE_TOKEN` - токен Firebase CLI

---

## Ошибки iOS билда (23 Jan 2026)

### Проблема
```
Provisioning profile "X5 App ios_app_store 1768487393" doesn't include:
- Apple Pay capability
- Sign In with Apple capability
- merchant.com.x5marketing.mobile Merchant ID
- com.apple.developer.applesignin entitlement
- com.apple.developer.in-app-payments entitlement
```

### Решение
1. Зайти в [Apple Developer Portal](https://developer.apple.com)
2. Certificates, Identifiers & Profiles > Identifiers
3. Найти App ID `com.x5marketing.mobile`
4. Включить Capabilities:
   - Sign In with Apple
   - Apple Pay (создать Merchant ID: merchant.com.x5marketing.mobile)
   - In-App Purchase (обычно включен по умолчанию)
5. Пересоздать Provisioning Profile
6. В Codemagic: обновить интеграцию или удалить/добавить заново

---

## Как запустить билд

### Через UI (codemagic.io)
1. Зайти на codemagic.io/apps
2. Выбрать проект x5-marketing
3. Нажать "Start new build"
4. Выбрать workflow и branch
5. Запустить

### Через GitHub (если настроен триггер)
Пока триггеры на push не настроены - только ручной запуск.

---

## Как добавить новое приложение

1. Нажать "Add application"
2. Выбрать GitHub и подключить репозиторий
3. Выбрать тип проекта (Flutter)
4. Codemagic найдет codemagic.yaml автоматически

---

## Полезные ссылки

- [Codemagic Dashboard](https://codemagic.io/apps)
- [Firebase Console](https://console.firebase.google.com)
- [Apple Developer Portal](https://developer.apple.com)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com)

---

## Контакты

- Email аккаунта: tooyakov@icloud.com
- Email для уведомлений: tooyakov.art@gmail.com

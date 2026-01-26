# X5 Marketing - План Запуска

## ДЕДЛАЙН: СЕГОДНЯ! 🚀

---

## Цель: Публикация приложения

### 1. Web (Firebase Hosting)
- [ ] Проверить билд: `cd web && npm run build`
- [ ] Задеплоить: `firebase deploy --only hosting`
- [ ] Проверить https://x5marketing.com работает

### 2. Android (Google Play)
- [ ] Собрать release APK/AAB в Codemagic
- [ ] Загрузить в Google Play Console
- [ ] Заполнить описание (ru, en, kz)
- [ ] Добавить скриншоты
- [ ] Отправить на review

### 3. iOS (App Store)
- [ ] Скопировать `flutter/` в репо `5x-flutter`
- [ ] Запустить Codemagic build
- [ ] Загрузить в App Store Connect
- [ ] Заполнить описание
- [ ] Отправить на review

---

## Статус компонентов

| Компонент | Статус | Действие |
|-----------|--------|----------|
| Web App | ✅ Готов | Deploy |
| Android | ⏳ Нужен билд | Codemagic |
| iOS | ⏳ Нужен билд | 5x-flutter repo |
| Firebase | ✅ Настроен | - |
| Stripe | ✅ Интегрирован | - |

---

## Быстрые команды

```bash
# Web deploy
cd web && npm run build && firebase deploy --only hosting --project x5-marketing-app

# Проверить статус Codemagic
# https://codemagic.io/apps

# GitHub Actions (auto-deploy)
git push origin main
```

---

## Что НЕ делать сегодня
- ❌ Новые фичи
- ❌ Рефакторинг
- ❌ "Улучшения"
- ❌ Эксперименты

**Только публикация!**

---

## Контакты/Ссылки
- Firebase Console: https://console.firebase.google.com/project/x5-marketing-app
- Google Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com
- Codemagic: https://codemagic.io
- 5x-flutter repo: https://github.com/tooyakov-art/5x-flutter

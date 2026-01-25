---
paths:
  - "web/**/*.tsx"
  - "web/**/*.ts"
  - "web/**/*.css"
---

# React Rules

## Component Patterns

### Views
All pages are `*View.tsx` in `web/src/views/`:
```tsx
export default function NewFeatureView() {
  const { t, user } = useApp();  // from App.tsx context

  return (
    <div className="p-4">
      {/* content */}
    </div>
  );
}
```

### Adding New View
1. Create `web/src/views/XxxView.tsx`
2. Add case in `App.tsx` renderView switch
3. Add translations in `services/translations.ts` (ru, en, kz)
4. Add button in `HomeView.tsx` tools grid

## Notifications

**Use Toast, NEVER alert()**:
```tsx
const { showToast } = useToast();
showToast('Успешно сохранено', 'success');
showToast('Ошибка загрузки', 'error');
showToast('Предупреждение', 'warning');
showToast('Информация', 'info');
```

## Credit Operations

**Always confirm + atomic deduction**:
```tsx
const { confirm } = useConfirmDialog();
const confirmed = await confirm({
  title: 'Генерация видео',
  cost: 50,
  balance: user.credits
});

if (confirmed) {
  await deductCredits(50);  // uses runTransaction
  // perform expensive operation
  showToast('Видео создано!', 'success');
}
```

## Navigation

**4 tabs only**: home, courses, hire, profile
- NO center sparkle button
- NO chats in iOS swipe navigation
- Page indicator dots at bottom for iOS

## Images

**Use LazyImage for lists**:
```tsx
<LazyImage
  src={course.coverUrl}
  alt={course.title}
  className="w-full h-48 object-cover"
/>
```

## Error Boundaries

App is wrapped in `<ErrorBoundary>` - catches render errors, shows retry UI.

## Environment Variables

Vite format: `VITE_*` in `.env`:
```env
VITE_FIREBASE_API_KEY=xxx
VITE_GEMINI_API_KEY=xxx
VITE_LEMONSQUEEZY_CREDITS_URL=xxx
```

Access: `import.meta.env.VITE_FIREBASE_API_KEY`

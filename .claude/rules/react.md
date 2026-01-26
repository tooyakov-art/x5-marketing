---
paths:
  - "web/**/*.tsx"
  - "web/**/*.ts"
---

# React/TypeScript Code Style

## Component Structure
- Use functional components with hooks
- Export default at bottom: `export default ComponentName`
- Props interface above component: `interface ComponentProps {}`

## Styling
- Use Tailwind CSS classes
- Custom styles in component or global CSS
- Use Framer Motion for animations

## State Management
- useState for local state
- React Context for global state (user, toast, dialog)
- No Redux - keep it simple

## Patterns
- Use `useToast()` hook for notifications, NOT alert()
- Use `useConfirmDialog()` for confirmations
- Use `LazyImage` component for images
- Use `ErrorBoundary` wrapper for error handling

## Firebase
- Import from `../firebase.ts`
- Use atomic transactions for credits: `runTransaction()`
- Collections: users, courses, whatsapp_bots, tracking_links

## Translations
- All user-facing text must use translations
- Import: `import { translations } from '../services/translations'`
- Access: `translations[language].keyName`
- Languages: 'ru', 'en', 'kz'

## Icons
- Use Lucide React: `import { IconName } from 'lucide-react'`

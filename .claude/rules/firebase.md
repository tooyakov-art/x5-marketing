---
paths:
  - "web/src/**/*.ts"
  - "web/src/**/*.tsx"
---

# Firebase Rules

## Project
- Project ID: `x5-marketing-app`
- Web app URL: https://x5-marketing-app.web.app
- Custom domain: https://x5marketing.com

## Collections Structure

### users/{uid}
- email, displayName, photoURL
- credits: number (atomic transactions only!)
- subscription: 'free' | 'pro' | 'business'
- createdAt, lastLoginAt

### users/{uid}/links
- User's tracking links with click counts

### courses
- Public course catalog

### whatsapp_bots
- userId, botName, greeting, rules, createdAt

### tracking_links
- Global shortened URL lookup
- shortCode -> originalUrl, userId

## Credit Transactions
ALWAYS use `runTransaction()` for credit operations:
```typescript
await runTransaction(db, async (transaction) => {
  const userDoc = await transaction.get(userRef);
  const currentCredits = userDoc.data()?.credits || 0;
  if (currentCredits < cost) throw new Error('Insufficient credits');
  transaction.update(userRef, { credits: currentCredits - cost });
});
```

## Environment Variables
- VITE_FIREBASE_* - Firebase config
- VITE_LEMONSQUEEZY_* - Payment links
- VITE_GEMINI_API_KEY - AI chat

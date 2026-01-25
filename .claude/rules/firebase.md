---
paths:
  - "web/src/firebase.ts"
  - "web/src/**/*.tsx"
  - "web/src/**/*.ts"
---

# Firebase Rules

## Project

- **ID**: `x5-marketing-app`
- **Hosting**: https://x5-marketing-app.web.app, https://x5marketing.com

## Collections

### users/{uid}
```typescript
interface User {
  email: string;
  displayName: string;
  credits: number;
  isPro: boolean;
  language: 'ru' | 'en' | 'kz';
  createdAt: Timestamp;
}
```

### users/{uid}/links
```typescript
interface TrackingLink {
  originalUrl: string;
  shortCode: string;
  clicks: number;
  createdAt: Timestamp;
}
```

### courses
```typescript
interface Course {
  title: string;
  description: string;
  authorId: string;
  price: number;
  coverUrl: string;
  videoUrl: string;
  published: boolean;
}
```

### whatsapp_bots
```typescript
interface WhatsAppBot {
  userId: string;
  name: string;
  greeting: string;
  rules: string;
  createdAt: Timestamp;
}
```

### tracking_links (global)
```typescript
// For redirect lookup: /r/{shortCode}
interface GlobalLink {
  shortCode: string;
  originalUrl: string;
  userId: string;
}
```

## Atomic Transactions

**ALWAYS use transactions for credits**:
```typescript
await runTransaction(db, async (transaction) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await transaction.get(userRef);
  const currentCredits = userSnap.data()?.credits || 0;

  if (currentCredits < cost) {
    throw new Error('Insufficient credits');
  }

  transaction.update(userRef, {
    credits: currentCredits - cost
  });
});
```

**Why**: Prevents race conditions, double-spending, negative balances.

## Real-time Listeners

```typescript
const unsubscribe = onSnapshot(
  query(collection(db, 'whatsapp_bots'), where('userId', '==', uid)),
  (snapshot) => {
    const bots = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setBots(bots);
  }
);

// Cleanup in useEffect return
return () => unsubscribe();
```

## Increment Operations

```typescript
import { increment } from 'firebase/firestore';

await updateDoc(linkRef, {
  clicks: increment(1)
});
```

## Deploy

```bash
npx firebase deploy --only hosting --project x5-marketing-app
```

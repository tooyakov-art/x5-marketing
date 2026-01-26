---
name: deploy
description: Deploy web app to Firebase Hosting
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash
---

# Deploy to Firebase

Deploy the React web app to Firebase Hosting.

## Steps:
1. Build production version
2. Deploy to Firebase

```bash
cd web && npm run build && npx firebase deploy --only hosting --project x5-marketing-app
```

## URLs:
- Primary: https://x5-marketing-app.web.app
- Custom domain: https://x5marketing.com

## Notes:
- Requires Firebase CLI authentication
- Run `firebase login` if not authenticated

---
name: deploy
description: Build and deploy web app to Firebase Hosting
disable-model-invocation: true
allowed-tools: Bash(npm:*), Bash(npx firebase:*), Bash(cd:*), Read
---

# Deploy to Firebase

Deploy X5 Marketing to production.

## Steps
1. Build: `cd web && npm run build`
2. Verify `web/dist/` exists
3. Deploy: `npx firebase deploy --only hosting --project x5-marketing-app`

## Post-deploy
- Live URL: https://x5-marketing-app.web.app
- Domain: https://x5marketing.com
- Console: https://console.firebase.google.com/project/x5-marketing-app

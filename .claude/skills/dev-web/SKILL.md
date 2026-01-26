---
name: dev-web
description: Start React development server on localhost:5173
disable-model-invocation: true
allowed-tools: Bash(npm:*), Bash(cd:*)
---

# Start Web Dev Server

Run React development server for X5 Marketing.

```bash
cd web && npm install && npm run dev
```

Server starts at http://localhost:5173

## Troubleshooting
- Port busy: `npx kill-port 5173`
- Dependencies: `npm install --force`

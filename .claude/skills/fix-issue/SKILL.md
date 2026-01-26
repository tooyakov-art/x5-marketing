---
name: fix-issue
description: Fix GitHub issue by number
disable-model-invocation: true
allowed-tools: Bash(gh:*), Read, Edit, Write, Grep, Glob
argument-hint: <issue-number>
---

# Fix GitHub Issue #$ARGUMENTS

## Process
1. Get details: `gh issue view $ARGUMENTS`
2. Find relevant files
3. Implement fix following code style
4. Test locally
5. Commit: `fix: description (closes #$ARGUMENTS)`

## Code Style
- React: TypeScript, functional components, Tailwind
- Flutter: Dart, null-safety, try-catch for platform calls
- Use `useToast()` for notifications, not `alert()`

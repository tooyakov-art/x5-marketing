---
name: fix-issue
description: Fix a GitHub issue by number
disable-model-invocation: true
user-invocable: true
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
argument-hint: [issue number]
---

# Fix GitHub Issue

Fix GitHub issue $ARGUMENTS following project standards.

## Steps:
1. Get issue details with `gh issue view $ARGUMENTS`
2. Analyze the problem and find relevant files
3. Implement the fix following code style:
   - React: TypeScript, functional components, Tailwind CSS
   - Flutter: Dart, null-safety, proper error handling
4. Test the fix locally
5. Create a commit with descriptive message
6. Reference issue in commit: "Fix #$ARGUMENTS: description"

## Code Style:
- Use existing patterns in codebase
- Add error handling where appropriate
- Use toast notifications for user feedback (web)
- Follow translations pattern for new strings

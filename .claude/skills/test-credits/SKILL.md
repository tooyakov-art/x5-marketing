---
name: test-credits
description: Test credits system for critical bugs - atomic transactions, Firestore rules
disable-model-invocation: true
allowed-tools: Read, Grep, Glob, Bash(npm:*), Bash(cd:*)
context: fork
agent: test-runner
---

# Test Credits System

Run comprehensive tests on the credits/payment system to find critical bugs.

## Critical Check: Atomic Transactions

Credits MUST use `runTransaction`:

```typescript
// CORRECT - atomic
await runTransaction(db, async (t) => {
  const doc = await t.get(userRef);
  const credits = doc.data()?.credits || 0;
  if (credits < cost) throw new Error('Insufficient');
  t.update(userRef, { credits: credits - cost });
});

// WRONG - race condition
const doc = await getDoc(userRef);
await updateDoc(userRef, { credits: doc.data().credits - cost });
```

## Test Steps

1. **Find all credit operations**
   ```bash
   grep -r "credits" web/src --include="*.ts" --include="*.tsx"
   ```

2. **Verify transactions**
   - Search for `runTransaction` usage
   - Check for race conditions (getDoc + updateDoc pattern)

3. **Check Firestore rules**
   - Read `firestore.rules`
   - Verify credits can only decrease via cloud functions

4. **Test scenarios**
   - Concurrent credit deduction
   - Negative credits prevention
   - Credit refund logic

## Report Format

```markdown
## Credits Test Report

### Atomic Transactions
- [ ] All credit ops use runTransaction
- [ ] No race conditions found

### Security
- [ ] Firestore rules prevent direct manipulation
- [ ] Server-side validation exists

### Bugs Found
1. [File:line] Description
```

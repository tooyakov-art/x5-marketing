---
name: plan
description: Show current project plan from PLAN.md, update tasks, track progress
disable-model-invocation: true
allowed-tools: Read, Edit, Write
argument-hint: [show|add|done <task>]
---

# Project Plan Manager

Manage X5 Marketing project plan in PLAN.md.

## Current Plan
!`cat PLAN.md 2>/dev/null || echo "PLAN.md not found"`

## Commands

### Show plan (default)
```
/plan
/plan show
```
Read and display PLAN.md with current status.

### Add task
```
/plan add <task description>
```
Add new task to "Осталось" section.

### Mark done
```
/plan done <task description>
```
Move task from "Осталось" to "Сделано".

## Plan Structure

```markdown
# X5 Marketing - План

## Статус
| Платформа | Задача | Статус |

## Сделано
- [x] Completed tasks

## Осталось
- [ ] Pending tasks

## Отложено
- Deferred items
```

## Rules
- Keep plan in Russian
- Use checkboxes: `- [x]` done, `- [ ]` pending
- Update status table when major items complete

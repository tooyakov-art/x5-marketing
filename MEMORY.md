# Project Memory

Этот файл — память между сессиями. Claude читает его в начале и дописывает в конце.

---

## 2025-01-25

### Что сделали
- Изучили Anthropic Skills формат (github.com/anthropics/skills)
- Создали SKILL.md по стандарту Skills
- Вынесли детали в references/ (architecture, changelog, commands)
- Настроили "память" через MEMORY.md

### Решения
- Skills лучше чем длинный CLAUDE.md — progressive disclosure
- Память через файл проще чем MCP server

### Что помнить
- SKILL.md — краткие инструкции, references/ — детали
- Пользователь хочет простые решения без оверинжиниринга

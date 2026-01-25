# Session Memory

Claude reads this at session start. Update at session end.

---

## 2025-01-25

### Done
- Изучили ВСЕ 16 skills из github.com/anthropics/skills
- Применили ВСЕ паттерны к проекту:
  - Progressive disclosure (главное в CLAUDE.md, детали в rules/)
  - Path-specific rules (flutter.md, react.md, firebase.md)
  - Design anti-patterns (против "AI slop")
  - Scripts для автоматизации
  - Workflows и references

### Decisions
- Модульная структура `.claude/rules/` вместо монолитного файла
- Память через MEMORY.md (простой файл лучше MCP server)
- Правила грузятся только для нужных путей

### User Preferences
- Хочет простые решения без оверинжиниринга
- Не любит длинные объяснения — сразу к делу
- Предпочитает русский язык

### Remember
- iOS deploy: ТОЛЬКО через существующий 5x-flutter репо
- Toast вместо alert() ВСЕГДА
- 4 таба: home, courses, hire, profile
- Atomic transactions для credits

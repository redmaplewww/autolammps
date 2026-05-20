# Agent Aura

Agent Aura is a terminal-first AI coding assistant built with Bun and TypeScript.

## Quick Start

```bash
bun install
bun run dev
```

The development entrypoint launches the interactive TUI. For a production build:

```bash
bun run build
node dist/cli-node.js
```

## Commands

```bash
aura
aura-bun
aura update
```

## Docs

- Project docs: [docs/](./docs/)
- Project notes: [Friends.md](./Friends.md)
- Provenance and attribution: [NOTICE.md](./NOTICE.md)

## Notes

- Bun `>= 1.3.11` is recommended.
- Compatibility-oriented identifiers such as `CLAUDE_CODE_*` environment variables remain in the codebase to avoid breaking integrations.

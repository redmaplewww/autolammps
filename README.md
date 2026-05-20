# Agent Aura

Agent Aura 是一个基于 Bun + TypeScript 的终端 AI 编码助手。

## 快速开始

```bash
bun install
bun run dev
```

开发模式会直接进入交互式 TUI。构建产物可这样运行：

```bash
bun run build
node dist/cli-node.js
```

## 常用命令

```bash
aura
aura-bun
aura update
```

## 文档

- 项目文档：[`docs/`](./docs/)
- 项目附注：[Friends.md](./Friends.md)
- 来源与归属说明：[NOTICE.md](./NOTICE.md)

## 说明

- 建议使用 `>= 1.3.11` 的 Bun。
- 为了兼容现有集成，代码里仍保留了部分兼容性标识，例如 `CLAUDE_CODE_*` 环境变量。

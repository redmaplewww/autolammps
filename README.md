# agent-aura CLI

基于 Bun + TypeScript 的终端 AI 编码助手，内置多 Agent 协作系统、MCP 协议支持、LAMMPS 模拟工作流知识库。

## 系统要求

- **Bun** >= 1.2.0
- Node.js >= 18（用于运行构建产物）

## 快速开始

```bash
# 浅克隆（仅最新版本，减少传输量）
git clone --depth 1 https://github.com/redmaplewww/autolammps.git
cd autolammps

# 安装依赖
bun install

# 构建
bun run build

# 健康检查
bun run health
```

构建产物在 `dist/`，入口：
- `dist/cli-bun.js` — Bun 运行时
- `dist/cli-node.js` — Node.js 运行时

## 常用命令

```bash
aura                    # 启动 CLI（通过 bin 入口）
bun run dev             # 开发模式
bun run build           # 生产构建
bun run typecheck       # 类型检查
bun run health          # 健康检查
bun test                # 运行测试
bun run lint            # 代码检查
```

## LAMMPS 相关脚本

```bash
bun run lammps                     # LAMMPS CLI
bun run lammps:init-state          # 初始化项目状态
bun run lammps:log-sections        # 日志分段
bun run lammps:maintain-knowledge  # 知识库维护
bun run engine:run                 # 引擎入口
bun run engine:mcp                 # MCP 桥接
bun run dashboard                  # 仪表板
```

## 项目结构

```
src/            # 核心源码（CLI 逻辑、命令、skills、组件）
packages/       # 工作空间包（Ink 终端 UI、native addon、MCP 客户端）
knowledge/      # LAMMPS 知识库（案例、规则、论文复现）
.angsheng/      # Agent 配置：模板、技能、代理定义
scripts/        # 构建 / 部署 / 维护脚本
docs/           # 项目文档
```

## 文档

- [CLI Agent 工作流概览](docs/agent-workflow-overview.md) — LAMMPS 模拟工作流架构
- [Agent Studio 桌面应用方案](docs/visual-agent-workflow-plan.md) — 可视化工作流编排设计

## License

MIT

# AutoLAMMPS CLI

这是一个基于 Bun + TypeScript 的终端 AI CLI，已经按“可跨电脑同步部署”的目标整理为一个可直接拉取的私有仓库版本。

仓库当前不仅包含核心 CLI 源码，还包含你当前使用的 LAMMPS 相关代理、技能、知识库核心内容、插件市场快照，以及项目级配置，目标是在不同电脑上尽量保持一致的行为。

## 适用场景

- 作为日常使用的 CLI 主仓库
- 在不同电脑间同步相同的配置、技能和知识资产
- 作为 LAMMPS 工作流、知识库和插件能力的统一备份基线

## 当前已纳入仓库的内容

### 1. 核心源码与构建配置

- `src/`
- `packages/`
- `scripts/`
- `package.json`
- `bun.lock`
- `tsconfig.json`
- `tsconfig.base.json`
- `vite.config.ts`
- `build.ts`
- `.github/`

### 2. CLI 共享配置

- `.angsheng/settings.json`
- `.angsheng/settings.local.json`
- `.angsheng/providers/`
- `.angsheng/provider-configs/`
- `.angsheng/agents/`
- `.angsheng/skills/`
- `.angsheng/templates/`

### 3. 插件与插件市场快照

- `.angsheng/plugins/known_marketplaces.json`
- `.angsheng/plugins/marketplaces/claude-plugins-official/`

说明：

- 插件市场内容已经直接 vendored 到仓库内，不依赖旧机器上的绝对路径
- `known_marketplaces.json` 已改为仓库内相对路径，便于跨机器同步

### 4. 知识库核心内容

- `knowledge/rules/`
- `knowledge/memory/`
- `knowledge/templates/`
- `knowledge/cases/INDEX.md`
- `knowledge/cases/CASE_METADATA.md`
- `knowledge/cases/case-family-index.md`
- `knowledge/cases/structure-index.md`
- `knowledge/cases/notes/`
- `knowledge/cases/templates/`
- `knowledge/cases/paper-reproduction/` 中保留的脚本、输入模板、说明和结果文档

### 5. 项目文档

- `docs/`
- `README_EN.md`
- `NOTICE.md`
- `SECURITY.md`

## 有意忽略的内容

这些内容默认不进入仓库，因为它们要么是运行态数据，要么是体积过大、价值较低，或者不适合长期版本化。

### 1. 运行态目录

- `.angsheng/sessions/`
- `.angsheng/backups/`
- `.angsheng/projects/`
- `.angsheng/shell-snapshots/`
- `.angsheng/teams/`
- `.angsheng/telemetry/`
- `.lammps-project/`
- `.migration-backups/`
- `benchmarking/`
- `project-memory/`
- `scratchpad/`
- `work/`

### 2. 大型原始案例与模型资产

- `knowledge/cases/raw/`
- `knowledge/cases/paper-reproduction/**/*.eam*`
- `knowledge/cases/paper-reproduction/**/*.lammpstrj`
- `knowledge/cases/paper-reproduction/**/*.data`
- `knowledge/cases/paper-reproduction/**/*.plt`
- `knowledge/cases/paper-reproduction/**/*.csv`
- `knowledge/cases/paper-reproduction/**/log.lammps`

### 3. 通用大文件与本地产物

- `*.zip`
- `*.7z`
- `*.sqlite`
- 根目录下的 `/*.lmp`
- 根目录下的 `/*.lammpstrj`
- 根目录下的 `/*.data`

### 4. 当前明确未同步的内容

- `knowledge/reports/`

## 快速开始

建议环境：

- Bun `>= 1.3.x`
- Node.js 用于运行构建后的 `dist/cli-node.js`

安装依赖：

```bash
bun install
```

开发模式启动：

```bash
bun run dev
```

构建：

```bash
bun run build
```

运行构建产物：

```bash
node dist/cli-node.js
```

## 常用命令

```bash
aura
aura-bun
aura update
bun run lammps
bun run dashboard
```

## 与 LAMMPS 相关的常用脚本

```bash
bun run lammps
bun run lammps:init-state
bun run lammps:log-sections
bun run lammps:maintain-knowledge
bun run test:lammps-cli
bun run engine:run
bun run engine:mcp
```

## 同步策略

如果你的目标是“不同电脑上的 CLI 尽量一致”，建议遵循以下规则：

1. 所有源码、共享配置、技能、知识库索引、插件市场快照都提交到仓库
2. 所有运行态目录、临时目录、日志、原始大模型/大案例文件不要提交
3. 依赖版本必须以 `bun.lock` 为准
4. 新电脑部署后优先执行 `bun install`，不要先手动改动目录结构
5. 如果新增了真正需要共享的技能、模板、插件配置或知识索引，应提交到仓库
6. 如果只是单次运行产物、实验缓存、日志或分析中间件输出，不应提交

## 安全提醒

当前仓库为了跨电脑保持一致，已经纳入部分实际配置与 provider 配置内容。

这意味着：

- 私有仓库内可以直接恢复当前 CLI 的大部分配置状态
- 但仓库的访问权限必须严格控制
- 更稳妥的长期方案仍然是：仓库保存结构，敏感密钥改用环境变量或系统密钥存储

## 文档入口

- 项目文档：[`docs/`](./docs/)
- 英文说明：[`README_EN.md`](./README_EN.md)
- 来源与归属说明：[`NOTICE.md`](./NOTICE.md)
- 安全说明：[`SECURITY.md`](./SECURITY.md)

## 备注

- 当前仓库已经是“精简但可部署”的同步基线，不是原始工作目录的无差别镜像
- 如果后续要扩大备份范围，优先增加高价值文本资产，不要重新把大型原始模型文件放回 Git

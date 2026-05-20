# LAMMPS CLI 部署指南

## 目录结构（源码保护版）

```
CLI-self/
├── dist/
│   ├── lammps.exe         # 入口封装（110MB）
│   └── cli-full.exe       # 完整CLI本体（135MB，API Key已内置）
├── .angsheng/              # 用户配置 + agents + skills + templates
│   ├── settings.json       # 当前生效的模型配置（默认 MiniMax）
│   ├── settings.json.bak   # 原始配置备份
│   ├── provider-configs/    # 4 种 provider 配置
│   ├── agents/             # 9 个 LAMMPS agent
│   ├── skills/             # 4 个 LAMMPS skill
│   └── templates/          # 4 个项目模板（atomsk, lammps, ovito, lammps-project）
├── knowledge/               # 知识库（~3GB，含 cases）
├── scripts/                # LAMMPS 脚本集（20 个）
├── docs/                   # 文档 + benchmark 结果
├── package.json
└── README-DEPLOY.md        # 本文件
```

**注意**：`src/` 源码已从发布包中移除以保护知识产权。API Key 已硬编码进 exe 二进制中，无需单独配置。

## 快速部署

### 1. 解压

```bash
unzip LAMMPS-CLI-deploy.zip
cd CLI-self
```

### 2. 安装依赖

```bash
bun install
```

> **可选：不使用 bun，直接运行 exe**
> ```bash
> ./dist/lammps.exe --help
> ./dist/lammps.exe --debug-routing "写一个Al的EAM压缩脚本"
> ```

### 3. 切换模型配置（可选）

> **exe 版本**：API Key 已硬编码在 exe 中，无法通过配置文件切换。若需更换 API Key，需联系维护者重新编译。
>
> **bun 版本**：可自由切换 provider 配置：
> ```bash
> # 查看可用配置
> ls .angsheng/provider-configs/
> 
> # 切换 provider（如百炼）
> cp .angsheng/provider-configs/baidu-bailian.json .angsheng/settings.json
> ```

### 4. 验证运行

```bash
bun run lammps --help
bun run lammps --debug-routing "写一个Al的EAM压缩脚本"
bun run scripts/lammps-lookup.ts "CL-007 工程应变冻结"
```

## 常用命令

```bash
# LAMMPS CLI 主入口
bun run lammps                           # 交互模式
bun run lammps --debug-routing "任务"     # 调试路由
bun run lammps lookup "问题"              # 知识检索
bun run lammps build "任务"              # 构建输入脚本

# 知识库维护
bun run lammps:maintain-knowledge        # 知识库维护
bun run scripts/lammps-kb-eval.ts       # KB 评测（search 模式）

# 项目初始化
bun run lammps:init-state [目录]          # 初始化项目状态

# Benchmark
bun run scripts/lammps-kb-eval.ts --engine=search    # 50题检索评测
bun run scripts/lammps-lookup-workflow-test.ts         # workflow测试

# Engine
bun run engine:run                       # LAMMPS Engine 入口
bun run engine:mcp                      # LAMMPS MCP Bridge
```

## Provider 配置说明

### settings.json 字段

| 字段 | 说明 |
|------|------|
| `modelType` | `openai` 或 `anthropic` |
| `model` | 模型名称 |
| `env.ANTHROPIC_API_KEY` | Anthropic 格式 API Key |
| `env.ANTHROPIC_BASE_URL` | 兼容 Anthropic 协议的代理 URL |
| `env.OPENAI_API_KEY` | OpenAI 格式 API Key（用于 openai provider） |
| `env.OPENAI_BASE_URL` | OpenAI 兼容代理 URL |
| `env.OPENAI_MODEL` | OpenAI provider 的模型名 |

### 预置 Provider 配置

| 文件 | Provider | 模型 |
|------|----------|------|
| `minimax.json` | MiniMax (api.minimaxi.com) | MiniMax-M2.7 |
| `baidu-bailian.json` | 阿里云百炼 (token-plan) | qwen3.6-plus |
| `zhipu.json` | 智谱 BigModel (open.bigmodel.cn) | glm-5.1 |
| `deepseek.json` | DeepSeek (api.deepseek.com) | deepseek-v4-flush |

## 发布版本

- v2-no-src：源码保护 + API Key 内置 exe
- API Key 已硬编码进 `dist/cli-full.exe` 二进制
- 发布日期：2026-04-27

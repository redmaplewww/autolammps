# Bun Windows 崩溃问题整理

## 现象

在 Windows 环境下使用 Bun 运行当前 Claude Code 仓库时，某些较重的 CLI 路径会触发 Bun 自身 panic，而不是正常的业务报错。

已观察到的报错形式：

- `panic(thread ...): attempt to unwrap error: OutOfMemory`
- `oh no: Bun has crashed. This indicates a bug in Bun, not your code.`

## 已触发的命令

### 1. agent 列表命令

```powershell
bun run src/entrypoints/cli.tsx agents
```

一次报错中显示：

- `Crashed while parsing F:\opencode\claude-code-main\claude-code-main\src\utils\detectRepository.ts`

### 2. 指定 agent 的 pipe 模式

```powershell
bun run src/entrypoints/cli.tsx -p --agent lammps-input-writer
```

一次报错中显示：

- `Crashed while parsing F:\opencode\claude-code-main\claude-code-main\src\services\mcp\xaaIdpLogin.ts`

## 未触发崩溃的命令

```powershell
bun run src/entrypoints/cli.tsx --version
```

说明：

- CLI 并非完全不可运行
- 但较完整的启动路径会触发 Bun 解析/转译阶段崩溃

## 当前判断

这更像是：

- Bun 1.3.11 on Windows
- 在当前大型/反编译 TS 仓库上的解析或转译问题
- 而不是最近新增的 markdown agents / 知识库文本本身导致的业务逻辑错误

原因依据：

- 崩溃点落在 Bun 解析不同 TS 文件时
- 崩溃文件并不固定
- 报错文本明确指出是 Bun 自身 crash

## 环境信息

- Bun: `1.3.11`
- Platform: `Windows`
- Repo: `F:\opencode\claude-code-main\claude-code-main`

## 影响范围

会影响：

- `agents` 列表命令
- `--agent ...` 模式
- 较完整的 agent / MCP / 设置加载路径

可能不影响：

- 很轻量的命令，例如 `--version`

## 建议排查方向

### 1. 做最小复现

- 比较以下命令的触发差异：
  - `bun run src/entrypoints/cli.tsx --version`
  - `bun run src/entrypoints/cli.tsx agents`
  - `bun run src/entrypoints/cli.tsx -p`
  - `bun run src/entrypoints/cli.tsx -p --agent lammps-coordinator`

### 2. 缩小触发路径

- 检查 `agents` 命令是否会强制加载过多模块
- 检查 MCP / xaa / detectRepository 等路径是否可以延迟加载
- 检查某些 feature 打开后是否导致额外依赖被提前解析

### 3. 验证是否是 Bun Windows 特有问题

- 同命令在 Linux / WSL 下是否可复现
- 尝试不同 Bun 版本是否仍复现

### 4. 判断是否需要规避方案

- 临时减少高成本启动路径
- 调整入口命令
- 为专用 CLI 设计更轻量的启动链

## 当前结论

这是一个应优先交给运行时/平台排查的人处理的问题。

在它没有被定位之前：

- 可以继续推进 LAMMPS 专用 CLI 的 prompt、知识库、工作流设计
- 但“完整 CLI 稳定可用”仍会被这个 Bun Windows 崩溃问题卡住

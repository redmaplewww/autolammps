# LAMMPS CLI 固定测试集

本文件定义当前 LAMMPS 专用 CLI 的标准测试集，用于后续回归验证。

## 一、测试目标

覆盖以下核心能力：

- CLI 入口是否可用
- 参数式子命令是否路由到正确 agent
- 交互式默认入口是否指向 `lammps-coordinator`
- LAMMPS agent 知识入口是否仍可加载
- 当前已知 Bun Windows 崩溃限制是否被明确记录

## 二、测试分层

### 1. smoke

轻量测试，只验证：

- `bun run lammps --help`
- `bun run src/entrypoints/cli.tsx --version`
- 参数路由文本是否正确

适用：

- 每次改 prompt、知识、包装入口后快速检查

### 2. route

验证 LAMMPS CLI wrapper 的命令路由逻辑：

- `build` -> `lammps-input-writer`
- `review` -> `lammps-reviewer`
- `analyze` -> `lammps-analyst`
- `learn` -> `lammps-coordinator`

说明：

- 当前用静态检查 + 帮助文本校验
- 若后续运行时稳定，可升级为真实子命令执行测试

### 3. agent-functional

验证以下专项能力：

- 案例检索
- 输入脚本生成
- reviewer 审查
- 日志分析
- 经验写回

说明：

- 当前受 Bun Windows 崩溃影响，不作为默认自动化测试
- 先保留为手动或条件执行测试

## 三、当前固定样例

位置：`tests/lammps-cli/`

- `build.prompt.txt`
- `review.prompt.txt`
- `analyze.prompt.txt`
- `learn.prompt.txt`

## 四、执行方式

### 轻量默认测试

```powershell
bun run scripts/lammps-cli-test.ts
```

### 指定模式

```powershell
bun run scripts/lammps-cli-test.ts smoke
bun run scripts/lammps-cli-test.ts route
```

## 五、当前限制

- 在 Windows + Bun 1.3.11 下，较重的 `agents` / `--agent` 路径可能触发 Bun 自身 OOM 崩溃
- 因此当前默认自动化测试只做轻量路径
- 更深的 agent 功能测试仍保留，但暂不作为默认自动回归

## 六、当前已验证结果

- `bun run scripts/lammps-cli-test.ts`：通过
- `bun run scripts/lammps-cli-test.ts smoke`：通过
- `bun run scripts/lammps-cli-test.ts route`：通过
- `bun run test:lammps-cli`：通过

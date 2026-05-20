# LAMMPS 审查指南

本文件将迁移资料中的审查协议合并为当前知识库中的单一可用版本。

## 任务风险分级

### 低风险

- 单元素体系
- 简单平衡或基础测试
- 完全复用已验证模板，且只改路径、步数、输出名

处理方式：

- 可快速自检后交付

### 中风险

- 多元素但流程标准
- 只在已知案例上做有限修改
- 常规熔化、凝固、拉伸、剪切流程

处理方式：

- 必须自审
- 若存在明显不确定项，交给 `lammps-reviewer`

### 高风险

- ReaxFF / COMB3 / 复杂反应力场
- 新势函数首次使用
- 复杂多步 workflow
- 电化学、氧化还原、沉积耦合问题
- 用户明确要求审查

处理方式：

- 必须经过 `lammps-reviewer`
- 高风险结论优先满足双证据：一条 manual/correction 证据，加一条本地 case/memory 证据

## 审查重点

- 模型结构是否合理
- `pair_style` / `pair_coeff` 是否一致
- atom type 与元素映射是否一致
- 时间步长、控温、控压设置是否保守
- 固定区/边界区是否被错误赋速
- 是否有明确验收标准，而不是只要求“跑完”
- 应变定义是否冻结了初始盒长，而不是动态引用当前盒长
- 若使用 restart/data 续算，是否验证了文件来源和 box 尺寸
- 对转换得到的结构文件，是否核查了文件名、化学式、type 顺序和元素映射

## 工作流规则

- `WF-01`、`WF-02`、`WF-03A` 默认要过 reviewer gate
- Reviewer 输出必须符合 `src/evidence/evidence-schema.ts` 的 ReviewResult Schema
- 代码层校验由 `/evidence-validate <stage>.json` 命令执行
- 若生成脚本存在不确定项，优先返回 `revise`
- 高风险任务最多连续自动修正 3 轮，之后应回到用户决策
- reviewer 输出应带 `confidence`，取值 `high`、`medium`、`low`

## 大文件与长输入处理

- 超长输入不要一次性整体分析
- 超大日志优先抓关键区段、错误区段和末尾区段
- 分析结果必须说明依据的是哪些区段

### 语义命令修改的强制证据要求

writer 修改了以下任一命令时，reviewer 必须引用至少一条 manual 或 correction 证据，不论任务风险等级：

- `pair_style` / `pair_coeff`
- `fix`
- `compute`
- `delete_atoms`
- `atom_style`
- `boundary`
- `kspace_style`
- `timestep`

此规则与高风险双证据要求独立叠加：低/中风险任务若触发上述命令修改，满足本条即可；若同时为高风险，仍须额外满足双证据要求。

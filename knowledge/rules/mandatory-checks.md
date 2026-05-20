# LAMMPS 强制检查清单 (Mandatory Checks)

本文档是 `lammps-reviewer` 进行经验守门的核心依据。
**任何匹配即 BLOCKED。** 此文件应始终在 `lammps-reviewer` 的审查上下文中被引用。

本清单从 `knowledge/memory/confirmed-lessons.md` 中提取 BLOCKED 级别的强制规则，
由 `lammps-reviewer` 在 WF-00/WF-01/WF-02/WF-03A 审查前强制执行。

---

## MB-001: 工程应变 L0 冻结 (CL-007)

| 字段 | 内容 |
|------|------|
| **来源** | CL-007 |
| **触发条件** | tensile/deformation 输入，涉及 `fix deform` + NPT 切换 |
| **检查点** | ① NPT→fix deform 转换点是否冻结 L0 via `${L0}` 立即求值<br>② thermo_style 和 fix print 中的应变变量是否引用冻结后的 L0<br>③ 不能用 bare `lx` 或 dynamic equal-style 变量追踪应变 |
| **违规处理** | `BLOCKED` — 必须精确修复后方可推进 |
| **证据** | `knowledge/memory/confirmed-lessons.md` |

---

## MB-002: 固定原子不得施加初始速度 (CL-003)

| 字段 | 内容 |
|------|------|
| **来源** | CL-003 (safety-critical) |
| **触发条件** | 存在 `group` 标记为 fixed/frozen/constraint + `velocity` 命令 |
| **检查点** | velocity 命令的作用范围是否排除了 fixed 原子组<br>任何 `velocity all` 或作用于包含固定原子组的 velocity 命令 |
| **违规处理** | `BLOCKED` (safety-critical) — 非确定性灾难性错误，任何情况下不得放过 |
| **证据** | `knowledge/corrections/reference-corpus/`; `knowledge/memory/confirmed-lessons.md` |

---

## MB-003: fix npt 不得与 fix deform 在同方向竞争 (CL-011)

| 字段 | 内容 |
|------|------|
| **来源** | CL-011 |
| **触发条件** | `fix npt` + `fix deform` 同时存在 |
| **检查点** | fix npt 的 `couple` 参数是否排除了 fix deform 方向<br>safe pattern: `fix npt` 仅在非变形方向耦合，`fix deform` 在变形方向 |
| **违规处理** | `BLOCKED` — 同行方向竞争导致错误的应力-应变曲线 |
| **证据** | `knowledge/cases/raw/拉伸/NPT/in.1e9.lmp`; `knowledge/memory/confirmed-lessons.md` |

---

## MB-004: ReaxFF 必须有电荷处理 (CL-001)

| 字段 | 内容 |
|------|------|
| **来源** | CL-001 |
| **触发条件** | `pair_style reaxff` / `pair_style reax/c` |
| **检查点** | ① atom_style 是否为 `charge` 或 `full`<br>② 是否有 `fix qeq/reaxff` 或 `fix qeq/shielded`<br>③ 注意: `fix qeq/point`, `qeq/dynamic`, `qeq/fire` 是点电荷模型，不适用于 ReaxFF |
| **违规处理** | `BLOCKED` — 默认零电荷运行无运行时错误但结果物理错误 |
| **证据** | `knowledge/rules/potential-selection.md`; `knowledge/cases/raw/NiC/in.NiC.reaxff`; `knowledge/cases/raw/GaN氧化/in.GaN.reaxff`; https://docs.lammps.org/fix_qeq.html; https://docs.lammps.org/fix_qeq_reaxff.html |

---

## MB-005: fix print 中 equal-style 变量必须用 `$(v_varname)` 语法 (PL-008)

| 字段 | 内容 |
|------|------|
| **来源** | PL-008 |
| **触发条件** | 任何 `fix print` 命令 |
| **检查点** | equal-style 变量必须用 `$(v_varname)` 语法<br>不能用 bare `v_varname`（产生字面文本字符串）<br>不能用 `${varname}`（除非有明确的 equal-style 变量定义且 syntax 被本地手册验证 |
| **违规处理** | `BLOCKED` — bare `v_varname` 在 fix print 中是静默错误 |
| **证据** | `knowledge/memory/pending-lessons.md` (PL-008); `knowledge/memory/confirmed-lessons.md` |

---

## MB-006: ReaxFF pair_coeff 元素名必须与 data 文件 atom type 一致 (CL-010)

| 字段 | 内容 |
|------|------|
| **来源** | CL-010 |
| **触发条件** | 任何 `pair_coeff` 命令（尤其 ReaxFF / reax/c） |
| **检查点** | pair_coeff 元素名列表是否与 data 文件 Masses 部分的 atom type 顺序一致<br>每个元素名是否存在于 ffield 文件中<br>不匹配不会导致运行时错误但结果静默错误 |
| **违规处理** | `BLOCKED` — 必须交叉验证 ffield、pair_coeff、data 文件 Masses |
| **证据** | `knowledge/rules/potential-selection.md`; `knowledge/cases/raw/AlCuO/in.in`; `knowledge/cases/raw/NiC/in.NiC.reaxff`; `knowledge/memory/confirmed-lessons.md` |

---

## MB-007: restart/data 文件来源必须验证 (CL-006)

| 字段 | 内容 |
|------|------|
| **来源** | CL-006 |
| **触发条件** | `read_restart` 或从 data 文件续算 |
| **检查点** | 是否记录了文件来源、生成时间<br>是否验证了 box 维度与当前输入一致<br>特别关注多层结构或含真空模型 |
| **违规处理** | `BLOCKED` — 使用来源不明的 restart/data 可能导致静默错误 |
| **证据** | `knowledge/memory/confirmed-lessons.md` |

---

## 审查前检查流程

在给出 `PASS` / `REVISE` / `BLOCKED` 之前，`lammps-reviewer` 必须：

```
1. 读取本文档 (mandatory-checks.md)
2. 对每个 MB-001 ~ MB-007：
   - 判断是否在触发条件范围内
   - 如果是，执行检查点
   - 如果违规，记录违规项并立即返回 BLOCKED
3. 如果所有 MB 检查通过，继续执行常规审查
```

**输出格式扩展**：

```json
{
  "decision": "BLOCKED",
  "mandatory_check_results": {
    "MB-001": { "triggered": true, "passed": true, "evidence": [{ "type": "case", "source": "knowledge/memory/confirmed-lessons.md", "verified": true }] },
    "MB-002": { "triggered": false },
    "MB-003": { "triggered": true, "passed": false, "issue": "npt couple x + deform x", "location": "line 36-37" },
    "MB-004": { "triggered": false },
    "MB-005": { "triggered": true, "passed": false, "issue": "bare v_varname in fix print", "location": "line 52" },
    "MB-006": { "triggered": false },
    "MB-007": { "triggered": false }
  },
  "manual_refs": [{ "type": "manual", "source": "https://docs.lammps.org/fix_deform.html", "verified": true }],
  "case_refs": [{ "type": "case", "source": "knowledge/cases/raw/拉伸/NPT/in.1e9.lmp", "verified": true }],
  "confidence": "high",
  ...
}
```

---

## 不在上诉清单中的常见错误（非 BLOCKED，但应记录）

| 规则 | 类别 | 处理 |
|------|------|------|
| CL-008 | workflow | REVISE — 写高风险输入前必须先搜索本地案例 |
| CL-004 | workflow | REVISE — delete_atoms overlap 应使用窄阈值 |
| CL-005 | workflow | REVISE — 完成不等于成功，需定义验收标准 |
| CL-009 | input | MAJOR — 沉积案例的 deposit region 必须重算 |
| CL-012 | workflow | REVISE — NPT→deform 前应运行诊断热力学检查点 |

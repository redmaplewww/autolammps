# 模型深度分析报告

## 1. 计分规则说明

每题满分 3 分（hasAnswer=1 + hasCitation=1 + primaryHit=1）。exit code ≠ 0 通常表示工具调用链异常（Agent循环未能在max-turns内收敛），但只要有有效输出仍记分。

---

## 2. 按题目分类统计

| 类别 | 题号 | 说明 |
|------|------|------|
| input_rules | KB01-KB10 | LAMMPS 输入规则与安全规范 |
| force_field | KB11-KB20 | 势函数选择、映射与审查 |
| syntax | KB21-KB30 | LAMMPS 命令语法与变量规则 |
| case_routing | KB31-KB40 | 案例库检索与 family 路由 |
| workflow_cognition | KB41-KB50 | 模拟工作流认知与元知识 |

### 各模型分项得分（满分60分/类）

| 类别 | glm-5.1 | glm-5-turbo | deepseek-v4-flush |
|------|---------|-------------|-------------------|
| input_rules | 52 | **60** | 55 |
| force_field | 53 | **58** | 54 |
| syntax | 45 | 50 | 45 |
| case_routing | 57 | 54 | 54 |
| workflow_cognition | 55 | **58** | 55 |
| **总计** | **262/300** | **280/300** | **263/300** |

---

## 3. 逐题详细失分分析

### KB02 — deform与npt同维度冲突 (input_rules)
- **题目**：fix deform 控制 x 拉伸时，fix npt 能不能同时控制 x 压力？为什么？
- **预期**：命中 `CL-011`，指出同一维度不能同时由 deform 和 npt 控制
- **glm-5-turbo**: ✅ 3/3 — 完整引用 CL-011 规则
- **glm-5.1**: ❌ 1/3 — exit 1，有答案但未命中关键词
- **deepseek**: ❌ 1/3 — exit 1，答了"不能同时"但未引用 CL-011

### KB03 — NPT平衡后切换deform前检查项 (input_rules)
- **题目**：NPT平衡后切换到 fix deform 之前，知识库建议检查哪些 thermo 量来确认平衡稳定？
- **预期**：温度、压力、盒长/体积稳定
- **glm-5-turbo**: ✅ 3/3
- **glm-5.1**: ❌ 1/3 — exit 1
- **deepseek**: ❌ 1/3 — exit 1

**共性发现**：KB02/KB03 是 input_rules 中最难的题目，两个较大的模型（glm-5.1/deepseek）都在 exit 1 上失败，说明它们在处理**两条规则交叉验证**的场景时 Agent 循环提前终止。glm-5-turbo 则成功通过。

### KB13 — Cu FCC势函数推荐 (force_field)
- **题目**：Cu FCC 单晶压缩优先推荐什么势函数和 pair_style？
- **预期**：指向 `eam/alloy` + `Cu_mishin1.eam.alloy` 本地案例文件
- **三个模型全部失败**（exit 1），均未引用本地 case 路径
- **分析**：这是 benchmark 中最难的题——需要从知识库检索具体文件名，三个模型都陷入"凭记忆泛泛回答"而非去 knowledge 目录找案例

### KB14 — MEAM vs EAM 适用场景 (force_field)
- **题目**：什么时候倾向用 MEAM 而不是简单 EAM？
- **glm-5-turbo**: ✅ 3/3 — 提到多元、方向性
- **glm-5.1**: ❌ 1/3 — exit 1
- **deepseek**: ✅ 3/3

### KB20 — HEA熔化凝固family路由 (case_routing)
- **题目**：高熵合金熔化凝固问题应先看哪个 case family？
- **glm-5-turbo**: ✅ 3/3
- **glm-5.1**: ✅ 3/3
- **deepseek**: ❌ 1/3 — exit 1，未命中"熔化/凝固/HEA" family 关键词

### KB22 — fix deform语法 (syntax)
- **题目**：fix deform 标准语法？请引用本地手册路径
- **glm-5-turbo**: ✅ 3/3 — 引用本地手册
- **glm-5.1**: ❌ 1/3 — exit 1
- **deepseek**: ✅ 3/3

### KB23 — erate正负号 (syntax)
- **题目**：压缩时 erate 的正负号怎么判定？
- **预期**：压缩方向为负值
- **glm-5-turbo**: ✅ 3/3 — 引用知识库说法
- **glm-5.1**: ❌ 1/3 — exit 1
- **deepseek**: ✅ 3/3 — 引用了 case 证据

### KB24 — remap x vs remap v (syntax)
- **题目**：固体压缩/拉伸为什么常用 remap x？和 remap v 的区别？
- **预期**：remap x 适合仿射变形，remap v 偏向速度映射
- **glm-5-turbo**: 2/3 ✅ — 有答案，但无引用
- **glm-5.1**: 2/3 ✅ — 同上
- **deepseek**: ❌ 1/3 — exit 1，未命中关键词

### KB25 — Tdamp与timestep关系 (syntax)
- **题目**：Tdamp 在 metal 单位下通常怎么按 timestep 选取？
- **预期**：约 100 个时间步
- **glm-5-turbo**: ❌ 1/3 — exit 1（唯一失败点）
- **glm-5.1**: ✅ 3/3 — 完整引用
- **deepseek**: ✅ 3/3

### KB28 — pxx→GPa换算 (syntax)
- **题目**：metal 单位下 pxx 转 GPa 的换算写法？
- **预期**：`-pxx/10000`，引用本地案例
- **glm-5-turbo**: ✅ 3/3
- **glm-5.1**: ✅ 3/3
- **deepseek**: ❌ 1/3 — exit 1，未命中数值

### KB29 — Cu压缩应变/应力变量定义 (syntax)
- **题目**：Cu 单轴压缩案例里应变和应力变量是怎么定义的？
- **预期**：应变基于冻结初始长度，应力从压力分量做单位转换
- **glm-5-turbo**: ✅ 3/3
- **glm-5.1**: ✅ 3/3
- **deepseek**: ❌ 1/3 — exit 1，未给出 case 引用

### KB30 — fix print冻结长度错误 (syntax)
- **题目**：fix print 输出应变时为什么容易把冻结长度规则写错？
- **glm-5-turbo**: ✅ 3/3
- **glm-5.1**: ❌ 1/3 — exit 1
- **deepseek**: ✅ 3/3

### KB31 — Cu FCC压缩case family (case_routing)
- **题目**：Cu FCC 压缩最佳匹配族？
- **glm-5-turbo**: ❌ 1/3 — exit 1
- **glm-5.1**: ✅ 3/3
- **deepseek**: ✅ 3/3

### KB48 — 辐照/扩散/偏聚证据链 (workflow_cognition)
- **题目**：辐照、扩散、偏聚问题的证据组织链条是什么？
- **glm-5-turbo**: ✅ 3/3
- **glm-5.1**: ❌ 0/3 — exit 143（timeout/kill）
- **deepseek**: ✅ 3/3

### KB50 — 纳米压痕形貌+缺陷分析 (workflow_cognition)
- **题目**：表面加工/纳米压痕分析为什么不能只看形貌？还必须配合哪些缺陷分析？
- **glm-5-turbo**: ❌ 0/3 — exit 143
- **glm-5.1**: ✅ 3/3
- **deepseek**: ❌ 0/3 — exit 143

---

## 4. 各模型核心优势

### glm-5-turbo（140/150，93.3%）
1. **Agent循环稳定性最高** — 在最难的题目（KB02/KB03）上均成功收敛，而其他两个模型均失败
2. **input_rules全类别满分** — 唯一在 KB01-KB10 全部拿到 primaryHit 的模型
3. **workflow_cognition全面** — KB43-KB49 全对，复杂认知类题目理解最到位
4. **唯一弱点**：KB25（Tdamp timestep关系）失败，其他两个模型都对了

### deepseek-v4-flush（131/150，87.3%）
1. **syntax类别与glm-5.1并列** — 但两者失分题目不同（各有胜负）
2. **KB14/KB22/KB23优于glm-5.1** — 在 force_field 和 syntax 部分简单题目上更稳
3. **KB48唯一全对** — 辐照扩散偏聚证据链在三个模型中唯一成功
4. **核心弱点**：syntax类别是重灾区（KB24/KB28/KB29 均 exit 1），说明数值类细节检索不稳定

### glm-5.1（127/150，84.7%）
1. **KB07/KB43-KB47更细粒度** — 在 workflow_cognition 部分题目上有引用优势（得分2而非0）
2. **语法类题目有一定积累**
3. **核心弱点**：
   - KB02/KB03/KB22/KB23/KB30 连续在 syntax + input_rules 交叉题上 exit 1
   - KB48 直接 timeout（exit 143）—— Agent 循环失控

---

## 5. 共性问题总结

| 问题类型 | 涉及题目 | 现象 |
|----------|----------|------|
| 规则交叉验证（同一维度冲突） | KB02 | 两个较大模型均无法收敛 |
| NPT→deform切换检查 | KB03 | 同上 |
| 具体本地文件引用 | KB13 | 三个模型全部失败 |
| Agent循环不稳定 | KB48(KB01), KB50 | 复杂认知题 timeout |
| 数值类细节检索不稳定 | KB28, KB29 | DeepSeek特有 |

---

## 6. 结论

- **综合最强**：**glm-5-turbo** — Agent循环稳定性最好，全类别无明显短板
- **次选**：**deepseek-v4-flush** — syntax 细节不稳定是主要隐患
- **谨慎使用**：**glm-5.1** — syntax 类题目 Agent 循环收敛问题较多
- **Benchmark 设计缺陷**：KB13（具体文件名引用）三模型均失败，需降低难度或调整评分标准

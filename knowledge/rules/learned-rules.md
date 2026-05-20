## [bb637bff] 物理性质计算强制验证规则(PL-009衍生)
- type: rule
- stage: WF-01
- material: unknown
- potential: unknown
- summary: 物理性质计算交付前强制验证：(1)必须与至少1个文献/DFT/实验值做数量级对比，偏差>50%必须暂停排查；(2)PBC下界面/面缺陷计算必须确认界面数量，通用公式γ=ΔE/(N_interfaces×A)；(3)异常信号(如GSFE在完整Burgers向量后不回零)不能归因为数值误差，必须追根溯源；(4)多势函数一致性不能替代与物理基准的比对。
- lesson: 文献基准核对是必选项不是可选项；PBC下界面计数公式γ=ΔE/(N×A)；异常信号优先怀疑公式问题；一致性≠正确性
- apply_when: 所有WF-02性质验证、所有界面/面缺陷计算、所有物理性质结果交付
- evidence: work/cases/fe-bcc-gsfe/; knowledge/corrections/reference-corpus/2026-04-09-gsfe-pbc-pl-009-5106c0a5.md
- note: PL-009事故的直接产物，从实际失败中提炼的强制规则。防止同类系统误差再次逃过自查。

## [d57b396d] 1MDPD粘度计算-雪人
- type: rule
- stage: WF-02
- material: unknown
- potential: unknown
- summary: 1MDPD粘度计算-雪人: 无特殊建模套路
- lesson: MDPD/DPD 模板：hybrid/overlay mdpd/rhosum + mdpd，密度依赖项截断 0.75，积分器 mvv/dpd
- evidence: migration/bob-case-learning/case-1MDPD粘度计算-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1MDPD粘度计算-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1MDPD粘度计算-雪人; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1MDPD粘度计算-雪人\in.mdpd
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [5bf94ed0] 1MDPD表面张力-雪人
- type: rule
- stage: WF-02
- material: unknown
- potential: unknown
- summary: 1MDPD表面张力-雪人: 无特殊建模套路
- lesson: 表面张力计算模板：使用 stress/atom + ave/spatial 沿界面法向分 bin，通过 P_N - P_T 积分得到 gamma
- evidence: migration/bob-case-learning/case-1MDPD表面张力-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1MDPD表面张力-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1MDPD表面张力-雪人
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [d4f1ffc4] 1spce水表面张力-walker
- type: rule
- stage: WF-02
- material: unknown
- potential: lj
- summary: 1spce水表面张力-walker: 先 minimize 再 NVT/NPT 平衡；长程静电用 PPPM，精度 1e-4
- lesson: 表面张力计算模板：使用 stress/atom + ave/spatial 沿界面法向分 bin，通过 P_N - P_T 积分得到 gamma
- evidence: migration/bob-case-learning/case-1spce水表面张力-walker.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1spce水表面张力-walker.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1spce水表面张力-walker
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [b37a9eb7] 1丙烯液体润湿-雪人
- type: rule
- stage: WF-02
- material: unknown
- potential: lj
- summary: 1丙烯液体润湿-雪人: 先 minimize 再 NVT/NPT 平衡；壁面原子冻结 setforce 0 0 0；长程静电用 PPPM，精度 1e-4
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-1丙烯液体润湿-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1丙烯液体润湿-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1丙烯液体润湿-雪人
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [73e40fc2] 1十六烷润湿-雪人
- type: rule
- stage: WF-01
- material: aluminum
- potential: unknown
- summary: 1十六烷润湿-雪人: 无特殊建模套路
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-1十六烷润湿-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1十六烷润湿-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1十六烷润湿-雪人; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1十六烷润湿-雪人\alkane16.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1十六烷润湿-雪人\ch2group.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1十六烷润湿-雪人\ch3group.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1十六烷润湿-雪人\downwall.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1十六烷润湿-雪人\system.lt
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [01850fdc] 1气体扩散-无
- type: rule
- stage: WF-01
- material: unknown
- potential: unknown
- summary: 1气体扩散-无: 先 minimize 再 NVT/NPT 平衡；壁面原子冻结 setforce 0 0 0；长程静电用 PPPM，精度 1e-4
- lesson: 扩散模板：delete_atoms 造孔 + rigid 壁面 + 高温加速扩散 + ave/chunk 输出密度分布
- evidence: migration/bob-case-learning/case-1气体扩散-无.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1气体扩散-无.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1气体扩散-无
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [17074c9e] 1氩表面张力-walker
- type: rule
- stage: WF-01
- material: unknown
- potential: lj
- summary: 1氩表面张力-walker: 使用 ave/spatial 或 ave/chunk 输出分布
- lesson: 表面张力计算模板：使用 stress/atom + ave/spatial 沿界面法向分 bin，通过 P_N - P_T 积分得到 gamma
- evidence: migration/bob-case-learning/case-1氩表面张力-walker.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1氩表面张力-walker.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1氩表面张力-walker
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [d5c67a5f] 1氯化钠液滴润湿-雪人
- type: rule
- stage: WF-02
- material: unknown
- potential: unknown
- summary: 1氯化钠液滴润湿-雪人: 先 minimize 再 NVT/NPT 平衡；长程静电用 PPPM，精度 1e-4
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-1氯化钠液滴润湿-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1氯化钠液滴润湿-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1氯化钠液滴润湿-雪人
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [2d76dd1f] 1水分子穿孔扩散-无
- type: rule
- stage: WF-01
- material: graphene
- potential: lj
- summary: 1水分子穿孔扩散-无: 先 minimize 再 NVT/NPT 平衡；使用 fix rigid 保持分子刚性；长程静电用 PPPM，精度 1e-4
- lesson: 扩散模板：delete_atoms 造孔 + rigid 壁面 + 高温加速扩散 + ave/chunk 输出密度分布
- evidence: migration/bob-case-learning/case-1水分子穿孔扩散-无.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1水分子穿孔扩散-无.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1水分子穿孔扩散-无
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [e2d32161] 1沟槽表面水滴润湿-呢嘉
- type: rule
- stage: WF-02
- material: unknown
- potential: unknown
- summary: 1沟槽表面水滴润湿-呢嘉: 先 minimize 再 NVT/NPT 平衡；使用 fix rigid 保持分子刚性；壁面原子冻结 setforce 0 0 0；长程静电用 PPPM，精度 1e-4
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-1沟槽表面水滴润湿-呢嘉.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1沟槽表面水滴润湿-呢嘉.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1沟槽表面水滴润湿-呢嘉
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [62adccf5] 1油包水-雪人
- type: rule
- stage: WF-02
- material: copper+aluminum
- potential: eam
- summary: 1油包水-雪人: 先 minimize 再 NVT/NPT 平衡；使用 fix rigid 保持分子刚性；壁面原子冻结 setforce 0 0 0；长程静电用 PPPM，精度 1e-4
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-1油包水-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1油包水-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1油包水-雪人; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1油包水-雪人\alkane16.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1油包水-雪人\ch2group.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1油包水-雪人\ch3group.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1油包水-雪人\cu.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1油包水-雪人\spce.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1油包水-雪人\system.lt
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [aa5577cf] 1油水界面DPD-雪人
- type: rule
- stage: WF-02
- material: unknown
- potential: unknown
- summary: 1油水界面DPD-雪人: 无特殊建模套路
- lesson: MDPD/DPD 模板：hybrid/overlay mdpd/rhosum + mdpd，密度依赖项截断 0.75，积分器 mvv/dpd
- evidence: migration/bob-case-learning/case-1油水界面DPD-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1油水界面DPD-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1油水界面DPD-雪人
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [758ef0da] 1环氧树脂reaxff-fly
- type: rule
- stage: WF-02
- material: unknown
- potential: reaxff
- summary: 1环氧树脂reaxff-fly: 使用 fix deform 做应变控制加载
- lesson: ReaxFF 模板：pair_style reax/c + fix qeq/reax + reax/c/species，先 NPT 平衡再 fix deform 加载
- evidence: migration/bob-case-learning/case-1环氧树脂reaxff-fly.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1环氧树脂reaxff-fly.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1环氧树脂reaxff-fly
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [5452d132] 1硅表面水滴结冰-雪人
- type: rule
- stage: WF-02
- material: unknown
- potential: tersoff
- summary: 1硅表面水滴结冰-雪人: 先 minimize 再 NVT/NPT 平衡；壁面原子冻结 setforce 0 0 0；长程静电用 PPPM，精度 1e-4
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-1硅表面水滴结冰-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1硅表面水滴结冰-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1硅表面水滴结冰-雪人
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [b9a0062e] 1聚丙烯拉伸-雪人
- type: rule
- stage: WF-01
- material: copper+nickel+aluminum
- potential: eam
- summary: 1聚丙烯拉伸-雪人: 无特殊建模套路
- lesson: 力学加载模板：fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势
- evidence: migration/bob-case-learning/case-1聚丙烯拉伸-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1聚丙烯拉伸-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1聚丙烯拉伸-雪人
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [efaa88b4] 1超临界驱替-雪人
- type: rule
- stage: WF-02
- material: unknown
- potential: lj
- summary: 1超临界驱替-雪人: 使用 fix rigid 保持分子刚性；长程静电用 PPPM，精度 1e-4
- lesson: 扩散模板：delete_atoms 造孔 + rigid 壁面 + 高温加速扩散 + ave/chunk 输出密度分布
- evidence: migration/bob-case-learning/case-1超临界驱替-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1超临界驱替-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1超临界驱替-雪人
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [e66c2e69] 1金属单轴拉伸-雪人
- type: rule
- stage: WF-01
- material: copper
- potential: eam
- summary: 1金属单轴拉伸-雪人: 无特殊建模套路
- lesson: 力学加载模板：fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势
- evidence: migration/bob-case-learning/case-1金属单轴拉伸-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1金属单轴拉伸-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1金属单轴拉伸-雪人
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [3fffc7ea] 1非对称润湿MDPD模拟-雪人
- type: rule
- stage: WF-01
- material: unknown
- potential: hybrid
- summary: 1非对称润湿MDPD模拟-雪人: 使用 fix rigid 保持分子刚性；壁面原子冻结 setforce 0 0 0
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-1非对称润湿MDPD模拟-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-1非对称润湿MDPD模拟-雪人.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\1非对称润湿MDPD模拟-雪人
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [369c8be7] lj热阻
- type: rule
- stage: WF-02
- material: unknown
- potential: lj
- summary: lj热阻: 使用 fix rigid 保持分子刚性；使用 ave/spatial 或 ave/chunk 输出分布
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-lj热阻.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-lj热阻.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\lj热阻
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [7bd04681] MDPD气模
- type: rule
- stage: WF-01
- material: unknown
- potential: unknown
- summary: MDPD气模: 壁面原子冻结 setforce 0 0 0；使用 ave/spatial 或 ave/chunk 输出分布
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-MDPD气模.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-MDPD气模.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\MDPD气模
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [2e8c0707] SiO2表面冰摩擦
- type: rule
- stage: WF-02
- material: graphene
- potential: lj
- summary: SiO2表面冰摩擦: 使用 fix rigid 保持分子刚性；壁面原子冻结 setforce 0 0 0
- lesson: 力学加载模板：fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势
- evidence: migration/bob-case-learning/case-SiO2表面冰摩擦.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-SiO2表面冰摩擦.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\SiO2表面冰摩擦
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [f7d631c9] 两种局部应力
- type: rule
- stage: WF-01
- material: unknown
- potential: lj
- summary: 两种局部应力: 使用 ave/spatial 或 ave/chunk 输出分布
- lesson: 力学加载模板：fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势
- evidence: migration/bob-case-learning/case-两种局部应力.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-两种局部应力.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\两种局部应力
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [e124da91] 二元液滴MDPD润湿移动
- type: rule
- stage: WF-01
- material: unknown
- potential: lj
- summary: 二元液滴MDPD润湿移动: 无特殊建模套路
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-二元液滴MDPD润湿移动.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-二元液滴MDPD润湿移动.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\二元液滴MDPD润湿移动
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [2c8ac2ed] 冰黏附
- type: rule
- stage: WF-02
- material: graphene
- potential: lj
- summary: 冰黏附: 使用 fix rigid 保持分子刚性；长程静电用 PPPM，精度 1e-4
- lesson: 力学加载模板：fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势
- evidence: migration/bob-case-learning/case-冰黏附.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-冰黏附.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\冰黏附
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [39bc4b9f] 冲击气泡波
- type: rule
- stage: WF-02
- material: unknown
- potential: lj
- summary: 冲击气泡波: 无特殊建模套路
- lesson: 冲击模板：fix wall/piston 或 velocity set 施加冲击速度，监控应力波传播和局部温度
- evidence: migration/bob-case-learning/case-冲击气泡波.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-冲击气泡波.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\冲击气泡波
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [4e09888f] 多孔聚氨酯吸附渗透
- type: rule
- stage: WF-01
- material: unknown
- potential: lj
- summary: 多孔聚氨酯吸附渗透: 先 minimize 再 NVT/NPT 平衡；使用 fix rigid 保持分子刚性；壁面原子冻结 setforce 0 0 0；长程静电用 PPPM，精度 1e-4
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-多孔聚氨酯吸附渗透.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-多孔聚氨酯吸附渗透.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\多孔聚氨酯吸附渗透
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [39b44796] 弹性常数计算
- type: rule
- stage: WF-01
- material: unknown
- potential: eam
- summary: 弹性常数计算: 先 minimize 再 NVT/NPT 平衡；使用 fix deform 做应变控制加载
- lesson: 力学加载模板：fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势
- evidence: migration/bob-case-learning/case-弹性常数计算.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-弹性常数计算.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\弹性常数计算; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\弹性常数计算\compliance.py; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\弹性常数计算\in.elastic
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [78ef5704] 悬浮液DPD
- type: rule
- stage: WF-01
- material: unknown
- potential: lj
- summary: 悬浮液DPD: 使用 ave/spatial 或 ave/chunk 输出分布
- lesson: MDPD/DPD 模板：hybrid/overlay mdpd/rhosum + mdpd，密度依赖项截断 0.75，积分器 mvv/dpd
- evidence: migration/bob-case-learning/case-悬浮液DPD.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-悬浮液DPD.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\悬浮液DPD
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [798055d8] 有机物热解
- type: rule
- stage: WF-02
- material: unknown
- potential: reaxff
- summary: 有机物热解: 无特殊建模套路
- lesson: ReaxFF 模板：pair_style reax/c + fix qeq/reax + reax/c/species，先 NPT 平衡再 fix deform 加载
- evidence: migration/bob-case-learning/case-有机物热解.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-有机物热解.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\有机物热解
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [3b162c30] 水泥
- type: rule
- stage: WF-02
- material: aluminum
- potential: reaxff
- summary: 水泥: 使用 fix deform 做应变控制加载
- lesson: ReaxFF 模板：pair_style reax/c + fix qeq/reax + reax/c/species，先 NPT 平衡再 fix deform 加载
- evidence: migration/bob-case-learning/case-水泥.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-水泥.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\水泥
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [44e8603d] 水蒸气凝结
- type: rule
- stage: WF-02
- material: unknown
- potential: eam
- summary: 水蒸气凝结: 先 minimize 再 NVT/NPT 平衡；使用 fix rigid 保持分子刚性；壁面原子冻结 setforce 0 0 0；长程静电用 PPPM，精度 1e-4
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-水蒸气凝结.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-水蒸气凝结.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\水蒸气凝结
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [74b6ff8c] 沟槽表面润湿带气体
- type: rule
- stage: WF-01
- material: unknown
- potential: unknown
- summary: 沟槽表面润湿带气体: 使用 fix rigid 保持分子刚性；壁面原子冻结 setforce 0 0 0；长程静电用 PPPM，精度 1e-4
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-沟槽表面润湿带气体.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-沟槽表面润湿带气体.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\沟槽表面润湿带气体
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [286f6894] 液体氩表面张力计算
- type: rule
- stage: WF-01
- material: unknown
- potential: lj
- summary: 液体氩表面张力计算: 使用 ave/spatial 或 ave/chunk 输出分布
- lesson: 表面张力计算模板：使用 stress/atom + ave/spatial 沿界面法向分 bin，通过 P_N - P_T 积分得到 gamma
- evidence: migration/bob-case-learning/case-液体氩表面张力计算.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-液体氩表面张力计算.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\液体氩表面张力计算
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [d297c0cd] 液滴输运MDPD
- type: rule
- stage: WF-01
- material: unknown
- potential: hybrid
- summary: 液滴输运MDPD: 无特殊建模套路
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-液滴输运MDPD.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-液滴输运MDPD.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\液滴输运MDPD; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\液滴输运MDPD\in.mdpd
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [c882d8fb] 激波纳米气泡
- type: rule
- stage: WF-01
- material: unknown
- potential: lj
- summary: 激波纳米气泡: 无特殊建模套路
- lesson: 冲击模板：fix wall/piston 或 velocity set 施加冲击速度，监控应力波传播和局部温度
- evidence: migration/bob-case-learning/case-激波纳米气泡.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-激波纳米气泡.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\激波纳米气泡
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [42244855] 热导比热粘度计算
- type: rule
- stage: WF-02
- material: unknown
- potential: unknown
- summary: 热导比热粘度计算: 使用 fix deform 做应变控制加载；使用 ave/spatial 或 ave/chunk 输出分布
- lesson: 力学加载模板：fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势
- evidence: migration/bob-case-learning/case-热导比热粘度计算.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-热导比热粘度计算.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\热导比热粘度计算
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [1763cead] 烷烃OPLSAA
- type: rule
- stage: WF-02
- material: unknown
- potential: lj
- summary: 烷烃OPLSAA: 先 minimize 再 NVT/NPT 平衡
- lesson: 力学加载模板：fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势
- evidence: migration/bob-case-learning/case-烷烃OPLSAA.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-烷烃OPLSAA.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\烷烃OPLSAA
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [ca732252] 石墨烯修饰
- type: rule
- stage: WF-01
- material: graphene
- potential: airebo
- summary: 石墨烯修饰: 长程静电用 PPPM，精度 1e-4
- lesson: 石墨烯模拟：常用 tersoff 或 AIREBO 势，注意 2D 材料的周期性边界设置
- evidence: migration/bob-case-learning/case-石墨烯修饰.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-石墨烯修饰.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\石墨烯修饰; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\石墨烯修饰\LT\OH.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\石墨烯修饰\LT\system.lt
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [92874050] 石墨烯剥离
- type: rule
- stage: WF-02
- material: graphene+copper
- potential: airebo
- summary: 石墨烯剥离: 无特殊建模套路
- lesson: 石墨烯模拟：常用 tersoff 或 AIREBO 势，注意 2D 材料的周期性边界设置
- evidence: migration/bob-case-learning/case-石墨烯剥离.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-石墨烯剥离.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\石墨烯剥离
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [ad46bb4f] 石墨烯表面-冰
- type: rule
- stage: WF-02
- material: graphene+copper+aluminum
- potential: eam
- summary: 石墨烯表面-冰: 先 minimize 再 NVT/NPT 平衡；使用 fix rigid 保持分子刚性；壁面原子冻结 setforce 0 0 0；长程静电用 PPPM，精度 1e-4
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-石墨烯表面-冰.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-石墨烯表面-冰.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\石墨烯表面-冰
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [0f99bee4] 硫化氢表面张力计算
- type: rule
- stage: WF-02
- material: unknown
- potential: lj
- summary: 硫化氢表面张力计算: 先 minimize 再 NVT/NPT 平衡；使用 ave/spatial 或 ave/chunk 输出分布；长程静电用 PPPM，精度 1e-4
- lesson: 表面张力计算模板：使用 stress/atom + ave/spatial 沿界面法向分 bin，通过 P_N - P_T 积分得到 gamma
- evidence: migration/bob-case-learning/case-硫化氢表面张力计算.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-硫化氢表面张力计算.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\硫化氢表面张力计算; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\硫化氢表面张力计算\H2S.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\硫化氢表面张力计算\system.lt
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [eebde5bd] 磁-液滴移动
- type: rule
- stage: WF-01
- material: unknown
- potential: hybrid
- summary: 磁-液滴移动: 使用 fix rigid 保持分子刚性
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-磁-液滴移动.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-磁-液滴移动.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\磁-液滴移动
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [564ba315] 磁场_磁流体_DPD
- type: rule
- stage: WF-02
- material: unknown
- potential: lj
- summary: 磁场_磁流体_DPD: 使用 fix deform 做应变控制加载
- lesson: MDPD/DPD 模板：hybrid/overlay mdpd/rhosum + mdpd，密度依赖项截断 0.75，积分器 mvv/dpd
- evidence: migration/bob-case-learning/case-磁场_磁流体_DPD.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-磁场_磁流体_DPD.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\磁场_磁流体_DPD
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [fecaac90] 纳米矩形超疏水微结构表面液体流动
- type: rule
- stage: WF-02
- material: unknown
- potential: lj
- summary: 纳米矩形超疏水微结构表面液体流动: 壁面原子冻结 setforce 0 0 0；使用 ave/spatial 或 ave/chunk 输出分布
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-纳米矩形超疏水微结构表面液体流动.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-纳米矩形超疏水微结构表面液体流动.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\纳米矩形超疏水微结构表面液体流动
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [9b8b13bb] 聚氨酯拉切
- type: rule
- stage: WF-02
- material: unknown
- potential: lj
- summary: 聚氨酯拉切: 使用 fix rigid 保持分子刚性；长程静电用 PPPM，精度 1e-4
- lesson: 力学加载模板：fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势
- evidence: migration/bob-case-learning/case-聚氨酯拉切.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-聚氨酯拉切.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\聚氨酯拉切; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\聚氨酯拉切\downwall.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\聚氨酯拉切\juanzhi.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\聚氨酯拉切\system.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\聚氨酯拉切\upwall.lt
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [3f02dc87] 超高分子量聚乙烯
- type: rule
- stage: WF-01
- material: aluminum
- potential: lj
- summary: 超高分子量聚乙烯: 无特殊建模套路
- lesson: 扩散模板：delete_atoms 造孔 + rigid 壁面 + 高温加速扩散 + ave/chunk 输出密度分布
- evidence: migration/bob-case-learning/case-超高分子量聚乙烯.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-超高分子量聚乙烯.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\超高分子量聚乙烯; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\超高分子量聚乙烯\alkane16.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\超高分子量聚乙烯\ch2group.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\超高分子量聚乙烯\ch3group.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\超高分子量聚乙烯\LT\alkane16.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\超高分子量聚乙烯\LT\ch2group.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\超高分子量聚乙烯\LT\ch3group.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\超高分子量聚乙烯\LT\system.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\超高分子量聚乙烯\system.lt
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [9d894423] 足球烯膜
- type: rule
- stage: WF-02
- material: graphene
- potential: airebo
- summary: 足球烯膜: 无特殊建模套路
- lesson: 石墨烯模拟：常用 tersoff 或 AIREBO 势，注意 2D 材料的周期性边界设置
- evidence: migration/bob-case-learning/case-足球烯膜.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-足球烯膜.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\足球烯膜
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [5d034510] 金刚石探针磨石墨烯
- type: rule
- stage: WF-02
- material: graphene
- potential: eam
- summary: 金刚石探针磨石墨烯: 无特殊建模套路
- lesson: 石墨烯模拟：常用 tersoff 或 AIREBO 势，注意 2D 材料的周期性边界设置
- evidence: migration/bob-case-learning/case-金刚石探针磨石墨烯.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-金刚石探针磨石墨烯.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\金刚石探针磨石墨烯
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [e268e38c] 铜片剪裁拉伸
- type: rule
- stage: WF-01
- material: copper+aluminum
- potential: eam
- summary: 铜片剪裁拉伸: 使用 fix deform 做应变控制加载
- lesson: 力学加载模板：fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势
- evidence: migration/bob-case-learning/case-铜片剪裁拉伸.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-铜片剪裁拉伸.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\铜片剪裁拉伸
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [8f7daef3] 铝块剪切应变
- type: rule
- stage: WF-01
- material: copper+nickel+aluminum
- potential: eam
- summary: 铝块剪切应变: 先 minimize 再 NVT/NPT 平衡；使用 fix deform 做应变控制加载
- lesson: 力学加载模板：fix deform 控制应变率 + stress/atom 输出应力分布，金属常用 EAM 势
- evidence: migration/bob-case-learning/case-铝块剪切应变.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-铝块剪切应变.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\铝块剪切应变; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\铝块剪切应变\al_cell.lt; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\铝块剪切应变\system.lt
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [16cf6199] 镍冲击
- type: rule
- stage: WF-01
- material: nickel
- potential: eam
- summary: 镍冲击: 无特殊建模套路
- lesson: 冲击模板：fix wall/piston 或 velocity set 施加冲击速度，监控应力波传播和局部温度
- evidence: migration/bob-case-learning/case-镍冲击.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-镍冲击.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\镍冲击
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

## [61d9b157] 高分子微结构流动
- type: rule
- stage: WF-02
- material: unknown
- potential: lj
- summary: 高分子微结构流动: 壁面原子冻结 setforce 0 0 0；使用 ave/spatial 或 ave/chunk 输出分布
- lesson: 润湿模拟模板：壁面冻结 + 流体 NVT 平衡 → 施加下落速度 → dump 观察接触线演化
- evidence: migration/bob-case-learning/case-高分子微结构流动.md; F:\opencode\claude-code-main\claude-code-main\migration\bob-case-learning\case-高分子微结构流动.md; F:\opencode\claude-code-main\claude-code-main\migration\bob老师案例\高分子微结构流动
- note: Bob老师LAMMPS案例深度学习，提取可复用建模套路。分类为 rule

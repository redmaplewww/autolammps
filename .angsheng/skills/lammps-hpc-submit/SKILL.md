---
name: lammps-hpc-submit
description: 为 LAMMPS 任务生成超算提交方案、Slurm/PBS 作业脚本、提交前检查清单。适用于 sbatch/qsub、集群资源规划、作业目录准备、提交前复核。
---

# LAMMPS HPC 提交 Skill

本 skill 用于在用户明确需要超算/集群运行时，辅助生成提交方案，而不是直接替代本地 workflow。

## 适用场景

- 用户要求提交到超算
- 用户要求生成 `sbatch` / `qsub` 脚本
- 用户需要估算节点、核数、时间、队列
- 用户需要集群目录组织与提交前检查

## 使用原则

1. 提交前先确认：
   - 输入脚本是否已通过 reviewer
   - 势函数和输入文件是否齐全
   - 输出文件命名是否避免覆盖
2. 不要在没有用户提供或本地可读配置的情况下假设登录主机、账号、端口、分区名。
3. 如果缺少超算配置，应向用户索要：
   - 调度器类型（Slurm / PBS / LSF）
   - 分区/队列
   - 节点数 / 核数 / GPU 数
   - 运行时限
   - 模块加载方式
4. 默认只生成提交脚本和检查清单，不直接执行远程提交，除非用户明确要求。

## 最小输出

当使用本 skill 时，至少输出：

- 推荐的作业脚本模板
- 资源申请建议
- 提交前检查清单
- 需要用户补充的超算信息

## Slurm 模板

```bash
#!/bin/bash
#SBATCH --job-name=<job_name>
#SBATCH --partition=<partition>
#SBATCH --nodes=<nodes>
#SBATCH --ntasks=<tasks>
#SBATCH --time=<hh:mm:ss>
#SBATCH --output=<job_name>_%j.out
#SBATCH --error=<job_name>_%j.err

module purge
module load <lammps_module>

cd $SLURM_SUBMIT_DIR
mpirun -np <tasks> lmp -in <input_file> -log <log_file>
```

## PBS 模板

```bash
#!/bin/bash
#PBS -N <job_name>
#PBS -q <queue>
#PBS -l nodes=<nodes>:ppn=<ppn>
#PBS -l walltime=<hh:mm:ss>
#PBS -o <job_name>.out
#PBS -e <job_name>.err

cd $PBS_O_WORKDIR
module purge
module load <lammps_module>
mpirun -np <total_tasks> lmp -in <input_file> -log <log_file>
```

## 提交前检查清单

- 输入脚本已通过 reviewer
- 势函数文件路径正确
- `read_data` / `read_restart` 文件存在
- 输出文件名包含 job id 或时间戳
- 作业时长估算合理
- 调度器参数与集群实际环境一致

## 与当前 LAMMPS workflow 的关系

- `WF-03B` 对应本 skill 的主要作用阶段
- 建议由 `lammps-coordinator` 在用户明确要求超算运行时调用本 skill 的规则
- 生成的作业脚本仍应作为草稿交给用户确认

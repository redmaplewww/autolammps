# 可视化 Agent 开发工具 — 简版项目方案

**项目名称**：Agent Studio Desktop  
**项目目标**：做一个带 UI 的桌面应用，让用户可以用拖拽方式编排 Agent 工作流，并运行、查看执行过程。  
**最终形态**：Electron 桌面 App，支持 Windows / macOS / Linux 打包。

---

## 1. 项目要做什么

这个项目不是重新做一个 Agent，而是在现有 CLI Agent 基础上做一个可视化桌面工具。

用户打开 App 后，可以：

1. 从左侧选择工具或 Agent 节点。
2. 拖到中间画布上。
3. 用连线把节点组成工作流。
4. 在右侧配置节点参数。
5. 点击运行。
6. 实时看到每个节点的执行状态和日志。
7. 保存、加载、导入、导出工作流。

---

## 2. MVP 范围

第一版只做最核心能力，不做太复杂。

### 必须做

- 桌面 App 能启动和打包。
- 左侧工具列表能展示常用工具。
- 中间画布能拖拽节点、连线、删除节点。
- 右侧能编辑节点参数。
- 工作流能保存和加载。
- 工作流能运行。
- 能实时显示节点状态：等待中、运行中、成功、失败、暂停。
- 能查看执行日志。
- 能导入 / 导出 workflow JSON。

### 暂时不做

- 多人协同编辑。
- 账号系统。
- 云端同步。
- 模板市场。
- 插件市场。
- 复杂数据分析看板。
- 自动更新。

---

## 3. 推荐技术方案

### 前端 / 桌面端

- Electron：桌面应用壳。
- React：界面开发。
- @xyflow/react：工作流画布。
- Zustand：前端状态管理。
- Vite：开发和构建。

### 后端

- 复用现有 Bun Server。
- 新增工作流相关 API。
- 用 WebSocket 推送执行状态。
- 工作流先保存为本地 JSON 文件。

### 数据文件

工作流保存为：

```text
~/.agent-studio/workflows/{workflowId}.workflow.json
```

---

## 4. 页面结构

App 主界面采用四块区域：

```text
┌──────────────────────────────────────────────┐
│ 顶部工具栏：运行 / 停止 / 保存 / 导入 / 导出 │
├──────────┬──────────────────────┬────────────┤
│ 工具列表 │      工作流画布       │ 属性面板   │
│          │  节点、连线、执行状态 │ 参数/日志  │
├──────────┴──────────────────────┴────────────┤
│ 底部状态栏：连接状态、节点数量、运行状态      │
└──────────────────────────────────────────────┘
```

主要页面：

1. 工作流编辑页。
2. 工作流列表页。
3. 执行日志页 / 面板。
4. 设置页。

---

## 5. 工作分工

### P1：前端工程师

负责桌面 App 和主要 UI 交互。

主要任务：

- 搭建 Electron + React 项目。
- 实现主界面布局。
- 接入工作流画布。
- 实现拖拽节点、连线、删除节点。
- 实现运行按钮、保存按钮、导入导出按钮。
- 根据后端 WebSocket 更新节点状态。
- 做基础响应式和界面细节。

### P2：后端工程师

负责 API、存储和执行引擎。

主要任务：

- 新增工作流保存 / 加载 / 删除 API。
- 新增工具列表 API。
- 定义 workflow JSON 格式。
- 实现 DAG 校验：不能有环、不能有无效连线。
- 实现工作流执行逻辑。
- 实现停止、暂停、恢复。
- 通过 WebSocket 推送执行状态和日志。

### P3：全栈工程师

负责前后端衔接、工具节点和最终交付。

主要任务：

- 把现有工具转换成可视化节点。
- 实现节点参数表单。
- 实现 Agent 节点。
- 实现 Gate 人工确认节点。
- 做 3-5 个内置工作流模板。
- 负责前后端联调。
- 负责打包配置和交付文档。
- 负责最终验收测试。

### D1：美工 / UI 设计师

负责界面设计和视觉资产。

主要任务：

- 设计主界面布局。
- 设计节点样式。
- 设计工具图标和 Agent 图标。
- 设计执行状态样式：运行中、成功、失败、暂停。
- 设计空状态、错误提示、加载状态。
- 做最终视觉走查。

---

## 6. 开发排期

建议总周期：**6-7 周**。

### 第 1 周：项目搭建和设计定稿

- P1：搭建 Electron + React 项目，跑通空窗口。
- P2：梳理现有后端，确定 API 格式。
- P3：整理工具节点清单，确定第一版支持哪些工具。
- D1：出低保真原型和视觉方向。

验收：App 能打开，飞书文档和设计方向确认。

### 第 2 周：基础界面和后端 API

- P1：完成主界面四栏布局。
- P2：完成工作流 CRUD API。
- P3：完成工具节点数据格式。
- D1：出主界面高保真设计稿。

验收：界面布局可看，API 可调。

### 第 3 周：画布和节点

- P1：接入工作流画布，支持拖拽和连线。
- P2：完成 DAG 校验。
- P3：完成 ToolNode 和属性面板初版。
- D1：补齐节点状态设计。

验收：能拖节点、连线、编辑基础参数。

### 第 4 周：保存和执行

- P1：实现保存、加载、运行按钮。
- P2：完成工作流执行 MVP。
- P3：联调工具节点参数和后端执行。
- D1：补齐表单、提示、错误状态设计。

验收：一个简单工作流可以保存、加载、运行。

### 第 5 周：实时状态和日志

- P1：根据 WebSocket 更新节点状态。
- P2：推送执行状态和日志。
- P3：实现执行日志面板、Gate 节点。
- D1：做执行动画和状态走查。

验收：运行时能看到节点变色和日志输出。

### 第 6 周：Agent 节点、模板和导入导出

- P1：优化画布交互。
- P2：完善暂停、恢复、停止逻辑。
- P3：实现 Agent 节点、模板、导入导出。
- D1：补齐图标和空状态。

验收：第一版功能基本完整。

### 第 7 周：测试、打包和交付

- P1：修 UI 问题。
- P2：修后端稳定性问题。
- P3：打包安装包，整理 README 和使用说明。
- D1：最终视觉走查。

验收：安装包可运行，核心流程可演示。

---

## 7. 第一版支持的节点

建议第一版只支持这些节点：

### 工具节点

- FileRead
- FileWrite
- FileEdit
- Glob
- Grep
- Bash
- WebFetch

### Agent 节点

- General Agent
- Review Agent
- Worker Agent

### 控制节点

- Gate：人工确认后继续。
- Start：工作流开始。
- End：工作流结束。

---

## 8. 核心接口

### REST API

```text
GET    /api/tools
GET    /api/workflows
GET    /api/workflows/:id
POST   /api/workflows
PUT    /api/workflows/:id
DELETE /api/workflows/:id
POST   /api/workflows/:id/execute
POST   /api/workflows/:id/stop
POST   /api/workflows/:id/pause
POST   /api/workflows/:id/resume
```

### WebSocket 事件

```text
workflow:execute:start
workflow:execute:node
workflow:execute:stream
workflow:execute:done
workflow:execute:error
```

---

## 9. Workflow JSON 简化格式

```typescript
interface WorkflowDefinition {
  id: string
  name: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  viewport?: { x: number; y: number; zoom: number }
}

interface WorkflowNode {
  id: string
  type: 'tool' | 'agent' | 'gate' | 'start' | 'end'
  position: { x: number; y: number }
  data: {
    label: string
    toolName?: string
    agentType?: string
    config: Record<string, unknown>
  }
}

interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}
```

---

## 10. 验收标准

最终交付时至少满足：

1. App 可以安装和启动。
2. 可以新建一个工作流。
3. 可以拖入工具节点和 Agent 节点。
4. 可以连线。
5. 可以编辑节点参数。
6. 可以保存和重新打开工作流。
7. 可以运行一个简单工作流。
8. 可以看到实时执行状态。
9. 可以看到执行日志。
10. 可以导入和导出 workflow JSON。

---

## 11. 风险点

| 风险 | 处理方式 |
|------|----------|
| Electron 打包复杂 | 第 1 周先验证最小打包流程 |
| 工具参数太复杂 | 第一版只支持 7 个常用工具 |
| 工作流执行逻辑复杂 | 第一版只支持 DAG，不支持循环 |
| UI 范围变大 | 第一版只做主界面，不做复杂设置页 |
| Agent 节点不稳定 | 先做简单 Agent 节点，复杂编排放后续版本 |

---

**文档版本**：v2.2 简版  
**最后更新**：2026-05-26

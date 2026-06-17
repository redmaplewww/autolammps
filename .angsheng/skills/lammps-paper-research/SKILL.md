---
name: lammps-paper-research
description: 为 LAMMPS 任务执行论文检索、文献筛选、证据提炼、研究笔记写回和本地知识衔接。适用于文献调研、势函数适用性核查、建模/方法论先例搜索、论文证据沉淀。
---

# LAMMPS Paper Research Skill

本 skill 用于补齐 LAMMPS workflow 中的文献工作流。它不替代现有本地知识库，而是把论文检索结果转成可复用的本地证据。

## 可直接复用的 CC CLI 能力

优先复用以下现成能力，而不是从零设计论文流程：

1. 内置全局 skill `ml-paper-writing`
   - 其中已包含：文献检索思路、Citation verification workflow、DOI/CrossRef/Semantic Scholar/arXiv 使用原则、"不要凭记忆伪造引用"的硬规则
2. `paperhunter` MCP Server（推荐，优先使用）
   - 整合多源论文检索与 PDF 获取，支持：
     - `search_papers` — 多源搜索（Semantic Scholar + arXiv + Crossref + Europe PMC + DOAJ 合并去重）
     - `get_paper_metadata` — 从多源获取论文元数据（含 Unpaywall OA 状态）
     - `resolve_paper_full_text` — 从 arXiv / Unpaywall / Semantic Scholar / OpenAlex / Europe PMC / DOAJ / DOI landing page 按合法来源优先级解析 PDF URL
     - `fetch_pdf_text` — 下载 PDF 并提取文本（Python pypdf）；如果抓不到，会明确提示“未能从合法来源获取全文”
     - `get_oa_status` — 查询 Unpaywall OA 状态（需设置 `UNPAYWALL_EMAIL` 环境变量）
     - `search_arxiv` — 直接搜索 arXiv（含分类、年份过滤）
     - `get_arxiv_pdf` — 直接下载 arXiv PDF（最可靠的免费论文来源）
     - `find_related_papers` — 查找相关论文
     - `verify_citation` — DOI Crossref 验证
3. `semanticscholar` MCP Server（已配置，fallback）
   - 纯 Semantic Scholar 搜索，适合快速元数据查询
4. `exa` MCP Server（已配置）
   - 全网搜索，适合找项目网页、预印本、灰色文献
5. `webfetch` 工具
   - 用于抓取 arXiv、DOI 页面、期刊网页、项目网页等公开页面
6. 本地统一知识库 `knowledge/`
   - 用于把论文证据沉淀成可检索笔记

Current project MCP status:

- primary search MCP installed: `exa`
- fallback structured academic MCP installed: `semanticscholar`
- multi-source paper hunter MCP installed: `paperhunter`

## 论文抓取来源与可靠性

按 PDF 获取可靠性排序（越高越先尝试）：

| 优先级 | 来源 | 可靠性 | 说明 |
|--------|------|--------|------|
| 1 | arXiv 直接下载 | ★★★★★ | 最可靠，90%+ 覆盖 preprint / 已发布 arXiv 论文 |
| 2 | Unpaywall OA | ★★★★☆ | 需配置 `UNPAYWALL_EMAIL` 环境变量，返回正规 OA 期刊 PDF |
| 3 | Europe PMC / PMC | ★★★★☆ | 生医和交叉学科强，常有正规全文或 PMC PDF |
| 4 | Semantic Scholar OA | ★★★☆☆ | 覆盖已收录的 open access 版本 |
| 5 | OpenAlex | ★★★☆☆ | 学术元数据，可获取 OA PDF / repository / landing page |
| 6 | DOAJ | ★★★☆☆ | 开放期刊文章，适合已发表 OA 论文 |
| 7 | DOI landing page | ★★☆☆☆ | HTML 解析 PDF 链接，各出版社结构差异大 |

**Unpaywall 配置方法**：
```bash
# 在启动 CC CLI 前设置
export UNPAYWALL_EMAIL=your@email.com
# 或在 .env 文件中添加
UNPAYWALL_EMAIL=your@email.com
```
免费注册：https://unpaywall.org/products/api

如果所有合法来源都没有命中，agent 必须明确告诉用户：

- 当前论文**未能从配置好的合法来源抓到全文**
- 可以尝试：机构/图书馆订阅、作者个人主页/机构仓储、用户手动提供 PDF 或 landing page
- 不要假装已经读到全文；此时只能标记为 `abstract-only` 或 `metadata-only`

## 适用场景

- 用户要求"先查论文再设计仿真"
- 需要核查某个势函数是否适用于特定体系
- 需要查某个材料体系、边界条件、加载路径、分析方法的文献先例
- 需要把外部论文结论转成后续 workflow 可复用的本地知识

## 优先本地知识来源

- `knowledge/papers/README.md`
- `knowledge/papers/INDEX.md`
- `knowledge/papers/search-strategy.md`
- `knowledge/papers/evaluation-rules.md`
- `knowledge/papers/extraction-template.md`
- `knowledge/papers/topics/`
- `knowledge/rules/potential-selection.md`
- `knowledge/cases/`
- `knowledge/manuals/lammps/`

## 推荐工作流程

1. **先查本地** `knowledge/papers/` — 避免重复调研
2. **搜索论文** — 用 `paperhunter.search_papers` 或 `paperhunter.search_arxiv`
3. **获取元数据** — 用 `paperhunter.get_paper_metadata`（含 DOI 验证）
4. **检查 OA 状态** — 用 `paperhunter.get_oa_status` 查看是否有免费 PDF
5. **解析 PDF URL** — 用 `paperhunter.resolve_paper_full_text`（按合法来源可靠性排序候选）
6. **下载并提取文本** — 用 `paperhunter.fetch_pdf_text`（自动降级尝试多个来源）
7. **arXiv 特例** — 直接用 `paperhunter.get_arxiv_pdf` 最快
8. **引用验证** — 用 `paperhunter.verify_citation` 确认 DOI 真实性
9. **写回本地知识库** — 沉淀到 `knowledge/papers/`

## 工作原则

1. 先查本地 `knowledge/papers/`，避免重复做同一轮文献调研。
2. 优先使用 `paperhunter` MCP Server，它整合了多个来源并按可靠性排序。
3. arXiv 论文直接用 `get_arxiv_pdf`，最可靠最快。
4. 商业期刊论文优先尝试 Unpaywall、OpenAlex、Europe PMC、DOAJ 和 publisher/repository landing page。
5. 不要凭印象编造论文、作者、年份、DOI — 用 `verify_citation` 验证。
6. 如果能拿到 PDF 或正文页面，优先基于 PDF/正文做结论提炼，而不是只看摘要。
7. 如果当前总结只来自摘要或目录页，必须明确标记为 `abstract-only`，不能冒充全文结论。
8. 如果合法来源都找不到全文，必须直接告诉用户“没抓到全文”，并说明下一步该怎么补救。
9. 论文结论不能直接照搬，必须转写为：适用条件、不适用条件、与当前 LAMMPS 问题的关联、可执行的建模/势函数/分析建议。
10. 外部论文证据必须最终沉淀到 `knowledge/papers/`，否则下一次还是要重搜。

## 最小输出

当使用本 skill 时，至少输出：

- 检索主题和筛选范围
- 候选论文列表（含来源：arXiv / Semantic Scholar / Crossref）
- 已验证论文与未验证论文区分
- 每篇论文的 evidence level：`pdf/full-text`、`publisher page`、`abstract-only`
- PDF 来源路径（arXiv / Unpaywall OA / Europe PMC / OpenAlex / DOAJ / DOI 解析）
- 如果读了 PDF，要说明读取了哪些页/章节
- 对当前问题真正有用的结论提炼
- 建议写回的本地知识路径
- 如果没抓到全文，要明确写一句：`未能从合法来源获取全文，以下结论仅基于摘要或元数据。`

## 推荐写回位置

- 主题索引：`knowledge/papers/topics/<topic>.md`
- 单篇笔记：`knowledge/papers/notes/<paper-slug>.md`
- 综述总结：`knowledge/papers/summaries/<topic>-summary.md`

## 与当前 LAMMPS workflow 的关系

- 可在 `WF-01`、`WF-02` 之前作为前置研究阶段使用
- 对势函数选择、建模路径选择、实验设计都可提供先验证据
- 建议由 `lammps-coordinator` 在用户明确要求论文/文献/参考文献/DOI/arXiv 检索时调用

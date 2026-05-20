# LAMMPS CLI 号池 Benchmark 对比报告

- 生成时间: 2026-04-25T00:09:10.156Z
- 测试引擎: search
- CLI 目录: F:\opencode\claude-code-main\claude-code-main\work\temp\CLI-self-extracted\CLI-self
- 总槽位数: 13 | 已配置: 13

---

## 总分排名

| 排名 | 槽位 | 供应商 | 模型 | 总分 | 平均 | 用时 | 状态 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | anthropic-sonnet4 | firstParty | claude-sonnet-4-20250514 | 171/200 (85.5%) | 3.42/4 | 3081ms | ✅ |
| 2 | anthropic-opus4 | firstParty | claude-opus-4-20250514 | 171/200 (85.5%) | 3.42/4 | 2944ms | ✅ |
| 3 | anthropic-sonnet35-v2 | firstParty | claude-3-5-sonnet-20241022 | 171/200 (85.5%) | 3.42/4 | 3052ms | ✅ |
| 4 | anthropic-haiku4-5 | firstParty | claude-haiku-4-5-20251001 | 171/200 (85.5%) | 3.42/4 | 3007ms | ✅ |
| 5 | openrouter-anthropic | openai | anthropic/claude-3-5-sonnet-20241022 | 171/200 (85.5%) | 3.42/4 | 3381ms | ✅ |
| 6 | openrouter-qwen | openai | qwen/qwen3-30b-a3b | 171/200 (85.5%) | 3.42/4 | 3701ms | ✅ |
| 7 | bedrock-sonnet4 | bedrock | us.anthropic.claude-sonnet-4-20250514-v1:0 | 171/200 (85.5%) | 3.42/4 | 2905ms | ✅ |
| 8 | vertex-sonnet4 | vertex | claude-sonnet-4@20250514 | 171/200 (85.5%) | 3.42/4 | 2947ms | ✅ |
| 9 | groq-qwen | openai | qwen/qwen3-32b | 171/200 (85.5%) | 3.42/4 | 3042ms | ✅ |
| 10 | groq-llama | openai | meta-llama/llama-4-scout-17b-16e-instruct | 171/200 (85.5%) | 3.42/4 | 3011ms | ✅ |
| 11 | openai-gpt4o | openai | gpt-4o | 171/200 (85.5%) | 3.42/4 | 3095ms | ✅ |
| 12 | gemini-2-5-pro | gemini | gemini-2.5-pro-preview | 171/200 (85.5%) | 3.42/4 | 3612ms | ✅ |
| 13 | xai-grok3 | grok | grok-3 | 171/200 (85.5%) | 3.42/4 | 3627ms | ✅ |

## 快速对比

| 槽位 | 供应商 | 模型 | 得分 | 状态 |
| --- | --- | --- | --- | --- |
| anthropic-sonnet4 | firstParty | claude-sonnet-4-20250514 | 171/200 (85.5%) | ✅ |
| anthropic-opus4 | firstParty | claude-opus-4-20250514 | 171/200 (85.5%) | ✅ |
| anthropic-sonnet35-v2 | firstParty | claude-3-5-sonnet-20241022 | 171/200 (85.5%) | ✅ |
| anthropic-haiku4-5 | firstParty | claude-haiku-4-5-20251001 | 171/200 (85.5%) | ✅ |
| openrouter-anthropic | openai | anthropic/claude-3-5-sonnet-20241022 | 171/200 (85.5%) | ✅ |
| openrouter-qwen | openai | qwen/qwen3-30b-a3b | 171/200 (85.5%) | ✅ |
| bedrock-sonnet4 | bedrock | us.anthropic.claude-sonnet-4-20250514-v1:0 | 171/200 (85.5%) | ✅ |
| vertex-sonnet4 | vertex | claude-sonnet-4@20250514 | 171/200 (85.5%) | ✅ |
| groq-qwen | openai | qwen/qwen3-32b | 171/200 (85.5%) | ✅ |
| groq-llama | openai | meta-llama/llama-4-scout-17b-16e-instruct | 171/200 (85.5%) | ✅ |
| openai-gpt4o | openai | gpt-4o | 171/200 (85.5%) | ✅ |
| gemini-2-5-pro | gemini | gemini-2.5-pro-preview | 171/200 (85.5%) | ✅ |
| xai-grok3 | grok | grok-3 | 171/200 (85.5%) | ✅ |

## 分项成绩

| 槽位 | 输入规则 | 势函数 | 命令语法 | 案例检索 | 工作流认知 |
| --- | --- | --- | --- | --- | --- |
| Anthropic Sonnet 4 (Direct) | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |
| Anthropic Opus 4 (Direct) | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |
| Anthropic Sonnet 3.5 v2 (Direct) | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |
| Anthropic Haiku 4.5 (Direct) | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |
| OpenRouter → Anthropic (via proxy) | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |
| OpenRouter → Qwen (via proxy) | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |
| AWS Bedrock Sonnet 4 (us-east-1) | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |
| Google Vertex AI Sonnet 4 | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |
| Groq → Qwen 32B | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |
| Groq → Llama 4 Scout | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |
| OpenAI GPT-4o | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |
| Google Gemini 2.5 Pro | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |
| xAI Grok 3 | 35/40 (87.5%) | 32/40 (80.0%) | 34/40 (85.0%) | 36/40 (90.0%) | 34/40 (85.0%) |


## 最佳表现: anthropic-sonnet4 (Anthropic Sonnet 4 (Direct))
- 分数: 171/200 (85.5%)
- 平均: 3.42/4
- 优势模块: 案例检索: 36/40, 输入规则: 35/40



---

## 详细结果

### anthropic-sonnet4: Anthropic Sonnet 4 (Direct)

- **供应商**: firstParty
- **模型**: claude-sonnet-4-20250514
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 3081ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

### anthropic-opus4: Anthropic Opus 4 (Direct)

- **供应商**: firstParty
- **模型**: claude-opus-4-20250514
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 2944ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

### anthropic-sonnet35-v2: Anthropic Sonnet 3.5 v2 (Direct)

- **供应商**: firstParty
- **模型**: claude-3-5-sonnet-20241022
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 3052ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

### anthropic-haiku4-5: Anthropic Haiku 4.5 (Direct)

- **供应商**: firstParty
- **模型**: claude-haiku-4-5-20251001
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 3007ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

### openrouter-anthropic: OpenRouter → Anthropic (via proxy)

- **供应商**: openai
- **模型**: anthropic/claude-3-5-sonnet-20241022
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 3381ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

### openrouter-qwen: OpenRouter → Qwen (via proxy)

- **供应商**: openai
- **模型**: qwen/qwen3-30b-a3b
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 3701ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

### bedrock-sonnet4: AWS Bedrock Sonnet 4 (us-east-1)

- **供应商**: bedrock
- **模型**: us.anthropic.claude-sonnet-4-20250514-v1:0
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 2905ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

### vertex-sonnet4: Google Vertex AI Sonnet 4

- **供应商**: vertex
- **模型**: claude-sonnet-4@20250514
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 2947ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

### groq-qwen: Groq → Qwen 32B

- **供应商**: openai
- **模型**: qwen/qwen3-32b
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 3042ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

### groq-llama: Groq → Llama 4 Scout

- **供应商**: openai
- **模型**: meta-llama/llama-4-scout-17b-16e-instruct
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 3011ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

### openai-gpt4o: OpenAI GPT-4o

- **供应商**: openai
- **模型**: gpt-4o
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 3095ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

### gemini-2-5-pro: Google Gemini 2.5 Pro

- **供应商**: gemini
- **模型**: gemini-2.5-pro-preview
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 3612ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

### xai-grok3: xAI Grok 3

- **供应商**: grok
- **模型**: grok-3
- **配置状态**: ✅ 已配置
- **总分**: 171/200 (85.5%)
- **平均**: 3.42/4
- **耗时**: 3627ms
- **错误**: 无

**低分题 (≤2/4)**:
- Q06 (2/4): 为什么一个模拟 run 完且没报错，仍然不能直接算成功？请按知识库规则回答。...
- Q11 (2/4): ReaxFF 输入最关键的电荷处理检查是什么？请按本地 confirmed lesson 回答。...
- Q18 (2/4): 审查 force field 映射时，知识库的 checklist 要核对哪几项？...
- Q23 (2/4): 压缩时 erate 的正负号怎么判定？请给出知识库中的说法。...

---

## 配置指南

各槽位需要在运行前设置以下环境变量：

```bash
# Anthropic Direct
export ANTHROPIC_API_KEY="sk-ant-..."

# OpenRouter (支持 Anthropic, Qwen, Llama 等)
export OPENROUTER_API_KEY="sk-or-..."

# Groq (支持 Qwen, Llama 等)
export GROQ_API_KEY="gsk_..."

# OpenAI Direct
export OPENAI_API_KEY="sk-..."

# Google Gemini
export GEMINI_API_KEY="..."

# xAI Grok
export XAI_API_KEY="xai-..."

# AWS Bedrock
export AWS_BEARER_TOKEN_BEDROCK="bmake-..."
export AWS_REGION="us-east-1"

# Google Vertex AI
export GCP_PROJECT_ID="my-project"
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export CLOUD_ML_REGION="us-east5"
```

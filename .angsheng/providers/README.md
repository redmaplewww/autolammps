# Provider Configs

各模型配置文件，切换时将内容复制到 `../settings.json` 即可。

## 使用方法

```bash
# DeepSeek
cp deepseek-v4-flush.json ../settings.json

# 智谱 glm-5.1
cp glm-5.1.json ../settings.json

# 智谱 glm-5-turbo
cp glm-5-turbo.json ../settings.json

# 百炼 qwen3.6-plus (API Key已失效，跳过)
cp qwen3.6-plus.json ../settings.json

# MiniMax M2.6
cp minimax-M2.6.json ../settings.json
```

## Benchmark 结果汇总 (knowledge-capture-50, 50题×3分=150分)

| 模型 | 分数 | 百分比 | 备注 |
|------|------|--------|------|
| 智谱 glm-5-turbo | 140/150 | **93.3%** | 最佳 |
| DeepSeek deepseek-v4-flush | 131/150 | 87.3% | |
| 智谱 glm-5.1 | 127/150 | 84.7% | |
| MiniMax M2.6 | 7/30 | 23.3% | 仅10题抽样 |
| 百炼 qwen3.6-plus | - | - | API Key无效(401) |

详细报告: `../../docs/tests/provider-benchmark-20260425.md`

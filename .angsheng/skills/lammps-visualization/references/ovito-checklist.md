# OVITO 可视化检查清单

## 最低检查项

- 输入文件格式是否适合 OVITO 导入
- 是否明确使用哪一帧或哪一段轨迹
- 是否需要先做结构分析 modifier
- 输出图片尺寸和命名是否明确

## 默认推荐

- 静态渲染：`TachyonRenderer`
- 简单导入：`import_file()`
- 多步处理：通过 `pipeline.modifiers.append(...)`

## 注意事项

- 没有确认安装环境时，不要假设高级 renderer 一定可用
- 高级分析脚本优先引用手册摘要

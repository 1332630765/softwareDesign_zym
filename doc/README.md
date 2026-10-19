# PJ1 Phase 1 架构方案（第一阶段草案）

## 模块划分

| 模块 | 目录 | 职责 |
|---|---|---|
| CLI | `src/cli` | 提示符、命令识别和错误展示 |
| 应用层 | `src/application` | 编排文档与编辑用例；后续加入 Command 历史 |
| 领域层 | `src/domain` | SVG 文档与图形对象；后续加入 Composite 图形树 |
| 基础设施 | `src/infrastructure`（后续阶段） | SVG 文件解析与序列化 |
| 测试 | `src/test` | 验证公开命令行为 |

```plantuml
@startuml
package CLI
package Application
package Domain
package Infrastructure
CLI --> Application
Application --> Domain
Application --> Infrastructure
Infrastructure --> Domain
@enduml
```

依赖方向：CLI 调用应用层，应用层调用领域层并协调基础设施，基础设施可使用领域对象；领域层不依赖外层。后续编辑操作将使用 Command 模式保证一条命令对应一次撤销，`Group` 与叶子图形将通过 Composite 统一操作。

预计变化点是新增图形类型、命令语法、SVG 读写细节和历史实现。第一阶段只实现画布命令，其他部分在各阶段完成后如实更新本文件，并补充 AI 协作记录、一致性自查和质量保证说明。

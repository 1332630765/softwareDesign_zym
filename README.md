# SVG Editor CLI

PJ1 Phase 1 的 TypeScript 命令行 SVG 编辑器。目前是第一阶段：工程骨架、交互入口与画布初始化。

```bash
npm install
npm run cli
```

当前可用命令：`init [w] [h]`、`canvas [w] [h]`、`help`。输入 `#` 开头的行作为注释。运行检查：`npm test`。

后续阶段将实现图形模型、编辑命令和撤销重做、SVG 读写，再完成完整性验证与文档。

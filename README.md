# SVG Editor CLI

PJ1 Phase 1 的 TypeScript 命令行 SVG 编辑器。目前完成第三阶段：工程骨架、画布命令、图形创建与结构查看，以及图形编辑和撤销重做。

```bash
npm install
npm run cli
```

当前可用命令：`init [w] [h]`、`canvas [w] [h]`、`create <type> <id> [params] [in <gid>]`、`delete/move/scale/set/group/ungroup/addto/front/back`、`tree [id]`、`show <id>`、`undo/redo`、`help`。其中图形类型为 `rect/circle/ellipse/line/text/g`，文字内容用双引号包裹。输入 `#` 开头的行作为注释。运行检查：`npm test`。

```text
svg> init 400 200
svg> create g scene
svg> create rect r1 10 20 100 50 blue in scene
svg> create text title 20 40 "Hello SVG" in scene
svg> move scene 10 20
svg> undo
svg> tree
```

后续阶段将实现 SVG 读写，再完成完整性验证与文档。

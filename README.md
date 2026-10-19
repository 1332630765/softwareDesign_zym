# SVG Editor CLI

PJ1 Phase 1 的 TypeScript 命令行 SVG 编辑器。目前完成第四阶段：画布、图形创建与编辑、撤销重做，以及 SVG 文件读写。

```bash
npm install
npm run cli
```

当前可用命令：`init [w] [h]`、`read <file.svg>`、`save [file.svg]`、`canvas [w] [h]`、`create <type> <id> [params] [in <gid>]`、`delete/move/scale/set/group/ungroup/addto/front/back`、`tree [id]`、`show <id>`、`undo/redo`、`help`。其中图形类型为 `rect/circle/ellipse/line/text/g`，文字内容用双引号包裹。输入 `#` 开头的行作为注释。运行检查：`npm test`。

```text
svg> init 400 200
svg> create g scene
svg> create rect r1 10 20 100 50 blue in scene
svg> create text title 20 40 "Hello SVG" in scene
svg> move scene 10 20
svg> undo
svg> tree
svg> save demo.svg
```

`read` 会为缺少 id 的图形分配唯一 id 并打印警告。读写支持上述六种图形；遇到无法表示的 SVG 元素会报错，避免重新保存时静默丢失内容。`save` 不带路径时使用上次成功读入或保存的路径。

后续阶段将对照完整规格做一致性检查、补齐质量验证和项目文档。

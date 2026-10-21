# SVG Editor CLI

PJ1 Phase 1 的 TypeScript 命令行 SVG 编辑器，支持画布创建、六种图形、分组编辑、撤销重做和 SVG 文件读写。

```bash
npm install
npm run cli
```

输入 `help` 可查看命令。图形类型为 `rect/circle/ellipse/line/text/g`；文字内容和带空格的文件路径用双引号包裹。输入 `#` 开头的行作为注释。

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

题目 6.1 的两节点流程图命令已保存为 [examples/flowchart.txt](examples/flowchart.txt)。在项目根目录用 Windows 终端（PowerShell 或 CMD）回放：

```text
npm run build
cmd /c "node dist/cli/main.js < examples/flowchart.txt"
```

脚本会在当前目录生成 `flowchart.svg`；可用浏览器打开检查图形，也可再次启动 CLI，输入 `read flowchart.svg` 和 `tree` 检查读回的结构。采用输入重定向是为了让 Node 直接读取 UTF-8 文件，避免某些 PowerShell 环境用 `Get-Content | node` 时把中文变成问号。

运行 `npm test` 可编译项目并执行自动化测试。架构、AI 协作过程、一致性自查及质量保证记录见 [doc/README.md](doc/README.md)。

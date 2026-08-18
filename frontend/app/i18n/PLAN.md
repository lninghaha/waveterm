# Wave 中文软分叉：后续工作安排

目标：界面可切简体中文，同时尽量不丢官方能力更新。  
仓库：`lninghaha/waveterm`，工作分支：`i18n/zh-CN`。  
upstream：`wavetermdev/waveterm`。

## 原则（全程遵守）

1. **禁止**把源码英文直接改成中文。只用 `t("原来的英文")` / `useT()`。
2. key 就是原英文字符串。`en.json` 恒等，`zh-CN.json` 放译文。插值用 `{{name}}`。
3. 少动 JSX 结构，只包一层 `t()`，降低 rebase 冲突。
4. emain 只许 import `frontend/app/i18n/core.ts`，不要把 React 拉进主进程。
5. 不引入 i18next。不译：emoji 名大全、`cmd/wsh` help、LLM system prompt、产品名（Wave / Wave AI / wsh / SSH / Git Bash）。

跟官方更新：

```text
git fetch upstream
git rebase upstream/main
# 冲突多半在菜单 / AI / 设置 struct
git push --force-with-lease origin i18n/zh-CN
```

## 现状（已完成）

- 自研 i18n：`core.ts`、`use-i18n.ts`、locale JSON
- 设置项 `app:language`（`en` | `zh-CN`），默认 `zh-CN`
- 已接线：应用菜单、退出/关窗/关 Tab/工作区/更新对话框、About、通用 Modal、Tab 右键、语言切换（查看菜单 + Tab 右键）

还没覆盖：AI 面板、连接 UI、Block 标题栏、Wave Config、终端右键、预览/Web、onboarding、Go 端 SSH 确认框。

## 阶段计划

### 阶段 1 — 日常主路径（约 3–5 天）

用户打开 Wave 立刻有中文感。做完后可自用。

| 优先级 | 范围 | 主要文件 |
|--------|------|----------|
| P0 | AI 面板 | `frontend/app/aipanel/*`（header / input / mode / contextmenu） |
| P0 | 连接 | `conntypeahead.tsx`、`connectionbutton.tsx`、`connstatusoverlay.tsx` |
| P0 | Block 标题栏 | `blockframe-header.tsx`、`blockutil.tsx` |
| P0 | Config / 侧栏 | `waveconfig-*`、`secretscontent.tsx`、`widgets.tsx` |

验收：默认中文；切 English 恢复英文；新 key 必须两边 JSON 都有。

### 阶段 2 — 高频右键与预览（约 3–5 天）

| 优先级 | 范围 | 注意 |
|--------|------|------|
| P1 | `term-model.ts` 终端菜单 | 文件大、upstream 常改，**只包 label，不重构** |
| P1 | Preview 目录/空态、webview | 按钮、错误、空态 |
| P1 | Process Viewer、quicktips | 列表头、提示文案 |

### 阶段 3 — 远程确认与配置展示名（约 2–3 天）

- Go：`pkg/remote/sshclient.go`、`conncontroller.go`、`wslconn.go` 的密码 / 安装 wsh 确认框  
  优先：Go 只传 message id，前端 `t()`；若改动面太大，阶段 1 可继续跳过。
- 默认 JSON 展示名：`widgets.json`、`waveai.json` 的 Quick / Balanced / Deep 等（改展示，不改 id）。

### 阶段 4 — 长尾（按需，可持续穿插）

- 各版本 `onboarding-upgrade-v0XXX.tsx`（每发版补一篇）
- Builder 窗口
- 文档站（独立，不影响 App）
- 视情况向上游提 i18n PR；合入后本 fork 可收束为「只维护 zh-CN.json」

不做：emoji CLDR 全表、wsh CLI 全量汉化。

## 执行节奏

1. **先阶段 1**，做出可安装的中文日常版。
2. 官方有 release 就 rebase 一次，再继续接线。
3. 新字符串随功能补进 JSON，不要攒一批再译。
4. Cloud 可并行做 P0 接线；本地负责 rebase、打包、抽查。Cloud 需给 fork 安装 [Cursor GitHub App](https://github.com/apps/cursor)。

建议一次 PR/一次 commit 只覆盖一类 UI（例如「只做 AI 面板」），方便回滚和审 diff。

## 打包与自测（Windows）

需要：Node 22、Go、Task、Zig。见仓库 `BUILD.md`。

```text
task init
task dev          # 开发
task package      # 安装包，产物在 make/
```

抽查清单：

- [ ] 启动后菜单/About/Tab 右键是中文
- [ ] 切换 English 后菜单立即重建、About 立即变英文
- [ ] AI 欢迎语、连接弹层、Block 标题、Config 侧栏
- [ ] 退出确认、关 Tab 确认
- [ ] 重启后语言设置仍在（`settings.json` 的 `app:language`）

## 风险

| 风险 | 应对 |
|------|------|
| `aipanel/*`、`term-model.ts` rebase 烫 | 只包字符串，不改逻辑 |
| `settingsconfig.go` 加字段撞车 | `app:language` 保持小 diff；冲突时手补一行 |
| 每版新 onboarding 文件 | 阶段 4 按版本补，不挡主路径 |
| 漏译 | `t()` 回退为英文 key，界面不会空白 |

## 完成定义

- 日常路径（菜单、AI、连接、Block、Config）中文可用，可切回英文。
- 能稳定 `rebase upstream/main`，冲突可预期、可手修。
- 有可安装构建；语言设置能持久化。

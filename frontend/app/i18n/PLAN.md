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

## 首版（已切）

- 版本：`0.14.5-zhCN.1`（基于上游 `0.14.5`）
- 分支 tip：`i18n/zh-CN`
- 标签：`v0.14.5-zhCN.1`
- 覆盖：阶段 1–3（日常主路径、高频右键/预览、远程确认与展示名）
- locale：约 569 keys，`en` / `zh-CN` 对齐
- 默认语言：`app:language` = `zh-CN`

### Windows x64 安装包（推荐：GitHub Actions）

仓库已加 workflow：`.github/workflows/build-windows-x64.yml`。

- 推送匹配 `v*-zhCN*` 的 tag 会自动在 `windows-latest` 打 **未签名** NSIS `.exe`，并挂到对应 GitHub Release。
- 也可在 Actions 页手动 **Run workflow**（`Build Windows x64`）。
- 产物名大致：`Wave-win-x64-<version>.exe`（见 `electron-builder` artifactName）。
- 无 DigiCert 密钥，安装时 Windows SmartScreen 可能提示「未知发布者」，选仍要运行即可。

本地打包（需 Node 22、Go、Task、Zig）：

```text
git checkout i18n/zh-CN
git pull
task init
task package -- --win nsis --x64   # 产物在 make/
```

## 现状（已完成）

- 自研 i18n：`core.ts`、`use-i18n.ts`、locale JSON
- 设置项 `app:language`（`en` | `zh-CN`），默认 `zh-CN`
- 应用菜单、退出/关窗/关 Tab/工作区/更新对话框、About、通用 Modal、Tab 右键、语言切换
- 阶段 1：AI 面板、连接 UI、Block 标题栏、Wave Config / Secrets / Widgets
- 阶段 2：终端右键、Preview/Webview、Process Viewer、quicktips
- 阶段 3：远程 UserInput（`messageid`/`params`）、widgets/waveai/Builder 展示名渲染时 `t()`

## 阶段计划

### 阶段 1 — 日常主路径 ✅

| 优先级 | 范围 | 主要文件 |
|--------|------|----------|
| P0 | AI 面板 | `frontend/app/aipanel/*` |
| P0 | 连接 | `conntypeahead.tsx`、`connectionbutton.tsx`、`connstatusoverlay.tsx` |
| P0 | Block 标题栏 | `blockframe-header.tsx`、`blockutil.tsx` |
| P0 | Config / 侧栏 | `waveconfig-*`、`secretscontent.tsx`、`widgets.tsx` |

### 阶段 2 — 高频右键与预览 ✅

| 优先级 | 范围 | 注意 |
|--------|------|------|
| P1 | `term-model.ts` 终端菜单 | 只包 label，不重构 |
| P1 | Preview 目录/空态、webview | 按钮、错误、空态 |
| P1 | Process Viewer、quicktips | 列表头、提示文案 |

### 阶段 3 — 远程确认与配置展示名 ✅

- Go：SSH / wsh 安装确认经 `messageid` + `params`，前端 `userinputmodal` 用 `t()`
- widgets / waveai / Builder 展示名在渲染处 `t()`，默认 JSON 不改英文

### 阶段 4 — 长尾（按需）

- 各版本 `onboarding-upgrade-v0XXX.tsx`
- Builder 窗口其余文案
- backgrounds / termthemes 展示名
- 文档站（独立）
- 视情况向上游提 i18n PR

不做：emoji CLDR 全表、wsh CLI 全量汉化。

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
- [ ] 终端右键、Preview、Process Viewer
- [ ] SSH 密码 / 安装 wsh 确认框中文
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

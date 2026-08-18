<p align="center">
  <img src="assets/logo.png" width="104" alt="DSH Plugin Marketplace 标志">
</p>

<h1 align="center">DSH Plugin Marketplace</h1>

<p align="center"><strong>把它想成 DSH 的 App Store。</strong><br>给 DeepSeek Harness Web 一个插件商店：浏览、检查和安装插件，不用自己找 npm 包名或记终端命令。</p>

<p align="center">
  <a href="README.md">English</a> · 中文 ·
  <a href="https://dshplugin.market/">公开目录</a> ·
  <a href="https://github.com/springbrand-lab/dsh-plugin-market">GitHub</a> ·
  <a href="https://www.npmjs.com/package/@springbrand/dsh-plugin-marketplace">npm</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@springbrand/dsh-plugin-marketplace"><img src="https://img.shields.io/npm/v/%40springbrand%2Fdsh-plugin-marketplace" alt="npm 版本"></a>
  <a href="https://github.com/springbrand-lab/dsh-plugin-market/actions/workflows/ci.yml"><img src="https://github.com/springbrand-lab/dsh-plugin-market/actions/workflows/ci.yml/badge.svg" alt="CI 状态"></a>
</p>

DeepSeek Harness（简称 DSH）的插件分散在 GitHub、npm 和不同社区里。这个插件把一个可搜索的插件市场放进 DSH Web 设置页，让你在一个界面里找插件、查看是否能安装，并完成安装、更新和卸载。

<p align="center">
  <img src="assets/plugin-marketplace.png" width="860" alt="DeepSeek Harness Web 设置页中的插件市场">
</p>

<p align="center"><em>在 DSH Web 里搜索、筛选、安装、更新和卸载插件。</em></p>

<p align="center">
  <img src="assets/dsh-market-audit.jpg" width="860" alt="DSH Market 公开目录中的插件安装判定和插件卡片">
</p>

<p align="center"><em>在公开目录中先查看安装判定，再决定是否安装。</em></p>

## 快速开始

下面的命令适用于 macOS 终端、Windows PowerShell 和 Linux 终端。首先需要安装 [Node.js LTS](https://nodejs.org/)。

### 从零开始安装

1. 安装 Node.js LTS，然后关闭并重新打开终端。
2. 安装 DSH 和插件市场：

   ```sh
   npm install --global pnpm @deepseek-ai/dsh
   dsh --version
   dsh plugin --profile web add @springbrand/dsh-plugin-marketplace
   dsh web
   ```

3. DSH Web 打开后，进入 **设置 → 插件市场**。看到市场标签页和插件卡片，就可以开始使用。

已经安装过 DSH？跳过第一条安装命令，直接运行后面三条即可。

### 如果提示找不到 `dsh`

先关闭并重新打开终端。如果仍然找不到命令，可以改用包运行器：

```sh
npx @deepseek-ai/dsh plugin --profile web add @springbrand/dsh-plugin-marketplace
npx @deepseek-ai/dsh web
```

运行 DSH Web 时请保持终端窗口开启。如果浏览器没有自动打开，把终端里显示的本地地址复制到浏览器即可。

<details>
<summary>让 AI Agent 代你安装</summary>

把下面这段提示词复制给能操作终端的 AI Agent，例如 Codex 或 Claude Code：

```text
请直接在当前电脑安装并启动 DeepSeek Harness 和 SpringBrand 插件市场。先检查 Node.js LTS 和 dsh；缺少时安装官方 Node.js LTS，并运行 npm install --global pnpm @deepseek-ai/dsh。确认 dsh --version，运行 dsh plugin --profile web add @springbrand/dsh-plugin-marketplace，再运行 dsh web。确认出现“设置 → 插件市场”，并汇报本地访问地址。需要 sudo 或管理员密码时先征求确认，不要处理 API Key。
```

</details>

## 你可以做什么

- 按插件名称、作者、说明或 npm 包名搜索。
- 在运行第三方代码前，先看安装判定和安装脚本提示。
- 选择插件要安装到哪个 DSH Profile，例如 `web` 或 `headless`。
- 不用在浏览器、npm 和终端之间来回切换，就能安装、更新和卸载插件。
- 查看某个 Profile 已经安装的包，即使它们没有收录在公开目录里。

[dshplugin.market](https://dshplugin.market/) 公开目录会读取每个仓库的 `package.json` 和文件列表，再按照 DSH 官方发布规范进行检查。**可安装**只代表通过了这些检查，不代表安全背书。插件是第三方代码，请只安装你信任的来源。

如果这个项目对你有用，欢迎点个 ⭐ Star——这对我们帮助很大。

## 社区

- [GitHub Issues](https://github.com/springbrand-lab/dsh-plugin-market/issues)：报告问题、提出功能建议。
- [GitHub 仓库](https://github.com/springbrand-lab/dsh-plugin-market)：查看源码、提交 Pull Request。
- [npm 包](https://www.npmjs.com/package/@springbrand/dsh-plugin-marketplace)：查看已发布版本。

Discord 和 GitHub Discussions 目前还没有启用；社区开放后会在这里补上真实入口。

## 卸载

可以在 DSH Web 的 **已安装** 标签页移除插件市场，也可以运行：

```sh
dsh plugin --profile web remove @springbrand/dsh-plugin-marketplace
```

## 参与贡献

```sh
git clone https://github.com/springbrand-lab/dsh-plugin-market.git
cd dsh-plugin-market
npm install
npm run check
```

提交 Pull Request 前请先运行 `npm run check`。报告问题时，请附上 DSH 版本、操作系统和复现步骤。

<details>
<summary>高级配置</summary>

可以在 Profile 的 Cordis 配置中覆盖以下字段：

```yaml
config:
  profile: web
  catalogUrl: https://dshplugin.market/plugins.json
  restartDelayMs: 1500
```

- `profile`：当前 DSH 进程使用的 Profile。
- `catalogUrl`：插件目录的 HTTP(S) 地址。
- `restartDelayMs`：当前 Profile 重启前的等待时间，范围为 500–30000 毫秒。

</details>

## 许可证

MIT

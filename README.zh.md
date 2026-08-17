<p align="center">
  <img src="assets/logo.png" width="128" alt="SpringBrand DSH Plugin Marketplace logo">
</p>

# @springbrand/dsh-plugin-marketplace

[English](README.md) | 中文

[![npm](https://img.shields.io/npm/v/%40springbrand%2Fdsh-plugin-marketplace)](https://www.npmjs.com/package/@springbrand/dsh-plugin-marketplace)
[![CI](https://github.com/springbrand-lab/dsh-plugin-market/actions/workflows/ci.yml/badge.svg)](https://github.com/springbrand-lab/dsh-plugin-market/actions/workflows/ci.yml)

装在 DeepSeek Harness Web 设置页里的可视化插件市场。打开 **设置 → 插件市场**，即可浏览目录、搜索插件，并在不同 Profile 中安装、更新或卸载。

![DeepSeek Harness 插件市场](assets/plugin-marketplace.png)

## 安装

```sh
dsh plugin --profile web add @springbrand/dsh-plugin-marketplace
```

重启 Web Profile：

```sh
dsh --profile web
```

然后打开 **设置 → 插件市场**。

## 你会得到

- **浏览与搜索**：按名称、作者、描述或 npm 包名搜索，并显示插件分类、仓库头像和紧凑的 GitHub Star 数。
- **Profile 管理**：在 `web`、`headless` 或其他本地 Profile 间切换目标。
- **一处完成安装、更新与卸载**：更新会立即解析最新发布版本；操作前显示目标 Profile 和 npm 包名，避免改错环境。
- **已安装视图**：同时展示目录插件和 Profile 中已有、但目录未收录的依赖。
- **明确的生效时机**：当前 Profile 变更后自动重启；其他 Profile 在下次启动时生效。

## 安全

- 只允许安装目录中标记为 `bundle`、`installable`、`npm` 的条目。
- 服务端会重新从目录解析 npm 包名，不接受浏览器提交任意安装源。
- 更新与卸载只接受当前 Profile 中已安装的合法 npm 包名。
- 所有变更接口只接受同源 JSON POST，请求体限制为 8 KiB。
- DSH 指令通过参数数组直接启动，不经过 shell；同一时间只执行一个插件操作。

插件属于第三方代码。目录收录不代表安全背书，请只安装你信任的来源。

## 工作方式

```text
[Web 设置页]
      |
      v
[本插件的本地 HTTP 接口]
      |
      +--> [dshplugin.market/plugins.json]
      |
      +--> dsh plugin --profile <profile> add|update|remove <package>
```

市场默认操作当前运行的 Profile，也可以在页面中选择其他 Profile。第一版采用进程重启，不提供任意插件 Hot-mount 或无缝端口交接。

## 配置

在 Profile 的 Cordis 配置中可以覆盖：

```yaml
config:
  profile: web
  catalogUrl: https://dshplugin.market/plugins.json
  restartDelayMs: 1500
```

- `profile`：当前 DSH 进程使用的 Profile；默认从启动参数读取。
- `catalogUrl`：插件目录 JSON 地址，必须使用 HTTP 或 HTTPS。
- `restartDelayMs`：当前 Profile 变更后的重启等待时间，范围为 500–30000 毫秒。

## 卸载

可以在市场的“已安装”页面卸载，也可以运行：

```sh
dsh plugin --profile web remove @springbrand/dsh-plugin-marketplace
```

## 开发

```sh
npm install
npm run check
```

## License

MIT

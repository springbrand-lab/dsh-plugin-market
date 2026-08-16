# @springbrand/dsh-plugin-marketplace

DeepSeek Harness 的可视化插件市场。它把插件目录放进 Web 设置页，并通过 DSH 官方的 `dsh plugin` 指令完成安装、更新和卸载。

## 安装

```bash
dsh plugin --profile web add @springbrand/dsh-plugin-marketplace
dsh --profile web
```

如果 Web 正在运行，安装后重启一次 DSH。之后可以在“设置 → 插件市场”中管理插件。

市场默认操作 `web` Profile，也可以在页面中切换到其他 Profile。对当前 Profile 的修改会自动重启 DSH；对其他 Profile 的修改会在该 Profile 下次启动时生效。

## 卸载

可以直接在市场的“已安装”页面卸载，也可以运行：

```bash
dsh plugin --profile web remove @springbrand/dsh-plugin-marketplace
```

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

浏览器不能提交任意脚本。安装按钮只对目录中标记为 `bundle`、`installable`、`npm` 的包开放，服务端会再次从目录解析 npm 包名后再调用 DSH。

## 配置

在 Profile 的 Cordis 配置中可以覆盖以下字段：

```yaml
config:
  profile: web
  catalogUrl: https://dshplugin.market/plugins.json
  restartDelayMs: 1500
```

- `profile`：当前 DSH 进程使用的 Profile；默认从启动参数读取。
- `catalogUrl`：插件目录 JSON 地址。
- `restartDelayMs`：当前 Profile 变更后的重启等待时间。

第一版采用进程重启，不提供任意插件 Hot-mount 或无缝端口交接。

## 开发

```bash
npm install
npm run check
```

License: MIT

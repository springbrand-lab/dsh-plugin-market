<p align="center">
  <img src="assets/logo.png" width="128" alt="SpringBrand DSH Plugin Marketplace logo">
</p>

# @springbrand/dsh-plugin-marketplace

English | [中文](README.zh.md)

[![npm](https://img.shields.io/npm/v/%40springbrand%2Fdsh-plugin-marketplace)](https://www.npmjs.com/package/@springbrand/dsh-plugin-marketplace)
[![CI](https://github.com/springbrand-lab/dsh-plugin-market/actions/workflows/ci.yml/badge.svg)](https://github.com/springbrand-lab/dsh-plugin-market/actions/workflows/ci.yml)

The visual plugin marketplace built into DeepSeek Harness Web settings. Open **Settings → Plugin Marketplace** to browse and search the catalog, then install, update, or remove plugins across profiles.

![DeepSeek Harness Plugin Marketplace](assets/plugin-marketplace.png)

## Install from scratch

You do not need DSH preinstalled.

1. Install the LTS version of [Node.js](https://nodejs.org/), then close and reopen your terminal.
2. Install DSH and pnpm:

   ```sh
   npm install --global pnpm @deepseek-ai/dsh
   ```

3. Confirm that DSH is available:

   ```sh
   dsh --version
   ```

4. Install the marketplace:

   ```sh
   dsh plugin --profile web add @springbrand/dsh-plugin-marketplace
   ```

5. Start DSH Web:

   ```sh
   dsh web
   ```

Keep the terminal open. Your browser normally opens automatically; otherwise, open the `http://127.0.0.1:...` address printed in the terminal. Then go to **Settings → Plugin Marketplace**.

If `dsh` is still not found after reopening the terminal, use:

```sh
npx @deepseek-ai/dsh plugin --profile web add @springbrand/dsh-plugin-marketplace
npx @deepseek-ai/dsh web
```

## Already have DSH?

```sh
dsh plugin --profile web add @springbrand/dsh-plugin-marketplace
dsh web
```

## What you get

- **Browse and search** by name, author, description, or npm package, with visible plugin categories, repository avatars, and compact GitHub Star counts.
- **Profile management** across `web`, `headless`, and other local profiles.
- **Install, update, and remove in one place**, with updates resolving the latest published version immediately and the target profile and npm package shown before each operation.
- **Installed view** covering both catalog entries and profile dependencies that are not listed in the catalog.
- **Clear activation timing**: changes to the current profile restart DSH automatically; changes to other profiles apply on their next launch.

## Security

- Installation is limited to catalog entries marked `bundle`, `installable`, and `npm`.
- The server resolves the npm package name from the catalog again instead of accepting an arbitrary source from the browser.
- Updates and removals accept only valid npm package names already installed in the selected profile.
- Mutation endpoints accept same-origin JSON POST requests only, with an 8 KiB body limit.
- DSH commands are launched with argument arrays, never through a shell, and only one plugin operation runs at a time.

Plugins are third-party code. Catalog inclusion is not a security endorsement; install only sources you trust.

## How it works

```text
[Web settings]
      |
      v
[Local HTTP API from this plugin]
      |
      +--> [dshplugin.market/plugins.json]
      |
      +--> dsh plugin --profile <profile> add|update|remove <package>
```

The marketplace targets the running profile by default, but you can select another profile in the UI. The first release uses process restarts and does not provide arbitrary plugin hot-mounting or seamless port handoff.

## Configuration

Override these fields in the profile's Cordis configuration:

```yaml
config:
  profile: web
  catalogUrl: https://dshplugin.market/plugins.json
  restartDelayMs: 1500
```

- `profile`: the profile used by the running DSH process; read from the launch arguments by default.
- `catalogUrl`: the plugin catalog JSON URL; HTTP and HTTPS are supported.
- `restartDelayMs`: delay before restarting the current profile, from 500 to 30000 milliseconds.

## Uninstall

Remove the package from the marketplace's Installed tab, or run:

```sh
dsh plugin --profile web remove @springbrand/dsh-plugin-marketplace
```

## Development

```sh
npm install
npm run check
```

## License

MIT

import { spawn } from 'node:child_process'

export type PluginAction = 'install' | 'update' | 'remove'

export interface Invocation {
  command: string
  args: string[]
}

/** Build the same Node CLI entry invocation used by the running DSH process. */
export function buildInvocation(
  profile: string,
  action: PluginAction,
  packageName: string,
  argv: readonly string[] = process.argv,
  execArgv: readonly string[] = process.execArgv,
): Invocation {
  const entry = argv[1]
  if (entry === undefined) throw new Error('无法定位当前 DSH CLI 入口')
  const verb = action === 'install' ? 'add' : action
  return {
    command: process.execPath,
    args: [...execArgv, entry, 'plugin', '--profile', profile, verb, packageName],
  }
}

/** Run one official `dsh plugin` operation without a shell. */
export async function runPluginCommand(
  profile: string,
  action: PluginAction,
  packageName: string,
): Promise<void> {
  const invocation = buildInvocation(profile, action, packageName)
  await new Promise<void>((resolve, reject) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let output = ''
    const collect = (chunk: Buffer): void => {
      output = `${output}${chunk.toString()}`.slice(-64_000)
    }
    child.stdout.on('data', collect)
    child.stderr.on('data', collect)
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) resolve()
      else reject(new Error(output.trim() || `dsh plugin 失败（${signal ?? String(code)}）`))
    })
  })
}

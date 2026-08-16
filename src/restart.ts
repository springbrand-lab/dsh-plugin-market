import { spawn } from 'node:child_process'

const SUPERVISOR = String.raw`
const { spawn } = require('node:child_process')
const launch = JSON.parse(process.argv[1])
setTimeout(() => {
  const child = spawn(launch.command, launch.args, {
    cwd: launch.cwd,
    env: process.env,
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
}, launch.delay)
`

/** Start a detached one-shot supervisor, then terminate this DSH process. */
export function restartCurrentProcess(delay: number): void {
  const launch = JSON.stringify({
    command: process.execPath,
    args: [...process.execArgv, ...process.argv.slice(1)],
    cwd: process.cwd(),
    delay,
  })
  const supervisor = spawn(process.execPath, ['-e', SUPERVISOR, launch], {
    cwd: process.cwd(),
    env: process.env,
    detached: true,
    stdio: 'ignore',
  })
  supervisor.unref()
  setTimeout(() => { process.kill(process.pid, 'SIGTERM') }, 100)
}

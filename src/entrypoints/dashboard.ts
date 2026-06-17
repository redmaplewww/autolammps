import { startDashboard } from '../server/server.js'

const port = parseInt(
  process.argv.find(a => a.startsWith('--port='))?.split('=')[1] ?? '3760',
  10,
)
const host =
  process.argv.find(a => a.startsWith('--host='))?.split('=')[1] ?? '0.0.0.0'

console.log('')
console.log('  ╔═══════════════════════════════════════╗')
console.log('  ║       Agent Aura Dashboard            ║')
console.log('  ╚═══════════════════════════════════════╝')
console.log('')

const { stop } = startDashboard({ port, host })

process.once('SIGINT', () => {
  stop()
  process.exit(0)
})
process.once('SIGTERM', () => {
  stop()
  process.exit(0)
})

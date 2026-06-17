// @ts-nocheck
import { mkdir, readFile, access, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

async function exists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function main() {
  const targetDir = process.argv[2]
    ? resolve(process.cwd(), process.argv[2])
    : resolve(process.cwd(), '.lammps-project')

  const templates = [
    ['project.json', '.angsheng/templates/lammps-project/project.json'],
    ['execution.json', '.angsheng/templates/lammps-project/execution.json'],
    ['modeling.json', '.angsheng/templates/lammps-project/modeling.json'],
    ['wf02.packet.json', '.angsheng/templates/lammps-project/wf02.packet.json'],
    ['wf03a.packet.json', '.angsheng/templates/lammps-project/wf03a.packet.json'],
    ['stage-summary.md', '.angsheng/templates/lammps-project/stage-summary.md'],
    ['review-log.md', '.angsheng/templates/lammps-project/review-log.md'],
    ['open-issues.md', '.angsheng/templates/lammps-project/open-issues.md'],
    ['decisions.md', '.angsheng/templates/lammps-project/decisions.md'],
  ] as const

  await mkdir(targetDir, { recursive: true })

  for (const [name, templatePath] of templates) {
    const dest = resolve(targetDir, name)
    if (await exists(dest)) continue
    const content = await readFile(resolve(process.cwd(), templatePath), 'utf8')
    await writeFile(dest, content, 'utf8')
  }

  console.log(`Initialized LAMMPS project state in ${targetDir}`)
}

await main()

export {}

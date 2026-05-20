#!/usr/bin/env bun
// @ts-nocheck
import { access, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Args = {
  prompt?: string
  material?: string
  potential?: string
  family?: string
  source?: string
  cif?: string
  polycrystal?: boolean
  defect?: string
  output?: string
}

type RouteCandidate = {
  route: string
  score: number
  why: string
  required_skill: string | null
  validation_focus: string[]
}

const HIGH_VALUE_CASES = [
  {
    family: 'tensile-deformation',
    materialHints: ['ni', 'ni-based', 'superalloy', '拉伸'],
    structure: 'knowledge/cases/raw/Ni基合金拉伸/Ni_45.lmp',
    notes: 'Ni-based tensile reusable structure with existing tensile workflow artifacts.',
  },
  {
    family: 'shear-and-elastic',
    materialHints: ['ti-al-nb', 'tialnb', '剪切'],
    structure: 'knowledge/cases/raw/剪切模量/TiAlNb/Ti_poly.lmp',
    notes: 'TiAlNb shear structure aligned with existing shear workflow.',
  },
  {
    family: 'melt-solidify',
    materialHints: ['hea', 'high-entropy', '高熵'],
    structure: 'knowledge/cases/raw/高熵合金/高熵/in.melt.lmp',
    notes: 'Use existing HEA melt-solidify family as the first structure source before rebuilding.',
  },
  {
    family: 'grinding-machining-interface',
    materialHints: ['tial', 'tialnb', '磨削', 'machining'],
    structure: 'knowledge/cases/raw/磨削/model/texture_218_equil.lmp',
    notes: 'Machining/grinding family already contains pre-equilibrated model structures.',
  },
  {
    family: 'reactive-and-deposition',
    materialHints: ['gan', 'ni-c', 'nic', 'deposition', 'oxidation'],
    structure: 'knowledge/cases/raw/NiC/球形沉积/model0.data',
    notes: 'Reactive/deposition family prefers existing substrate/data files before fresh geometry creation.',
  },
]

function parseArgs(argv: string[]): Args {
  const args: Args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--polycrystal') {
      args.polycrystal = true
      continue
    }
    if (!arg.startsWith('--')) continue
    const key = arg.slice(2)
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${arg}`)
    }
    if (key === 'prompt') args.prompt = value
    else if (key === 'material') args.material = value
    else if (key === 'potential') args.potential = value
    else if (key === 'family') args.family = value
    else if (key === 'source') args.source = value
    else if (key === 'cif') args.cif = value
    else if (key === 'defect') args.defect = value
    else if (key === 'output') args.output = value
    i += 1
  }
  return args
}

async function exists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

function inferFamily(input: string): string | null {
  const normalized = input.toLowerCase()
  if (/tensile|拉伸|strain|stress/.test(normalized)) return 'tensile-deformation'
  if (/shear|剪切|elastic/.test(normalized)) return 'shear-and-elastic'
  if (/melt|solidify|熔化|凝固|hea|high-entropy/.test(normalized)) return 'melt-solidify'
  if (/reaxff|oxidation|deposition|吸附|reactive/.test(normalized)) return 'reactive-and-deposition'
  if (/grind|machining|scratch|摩擦|磨削/.test(normalized)) return 'grinding-machining-interface'
  if (/shock|cascade|ttm/.test(normalized)) return 'shock-cascade-ttm'
  if (/segregation|alloy|偏聚/.test(normalized)) return 'alloy-and-segregation'
  return null
}

function buildChecklist(route: string) {
  const common = [
    'structure source is explicitly recorded',
    'element/type mapping is explicit',
    'box and boundary assumptions are stated',
    'resulting structure can enter WF-02 without silent geometry ambiguity',
  ]
  if (route.startsWith('atomsk')) {
    return [
      ...common,
      'Atomsk command or template is recorded',
      'alignx/unskew need is checked for LAMMPS output',
      'type order is not assumed from appearance order',
    ]
  }
  return common
}

function collectCandidates(args: Args) {
  const combined = [args.prompt, args.material, args.family, args.source, args.defect]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  const candidates: RouteCandidate[] = []

  if (args.source && /knowledge\/cases\/raw\//.test(args.source)) {
    candidates.push({
      route: 'case-reuse-structure',
      score: 1,
      why: 'An explicit raw case source is already available and should be reused before inventing a fresh structure.',
      required_skill: null,
      validation_focus: ['source structure provenance', 'element mapping', 'box/boundary compatibility', 'minimal edits only'],
    })
  }

  if (args.cif || /\.cif\b|cif|晶体文件/.test(combined)) {
    candidates.push({
      route: 'atomsk-cif-conversion',
      score: 0.95,
      why: 'CIF input strongly suggests Atomsk conversion and box/type validation.',
      required_skill: 'lammps-atomsk-modeling',
      validation_focus: ['chemical formula', 'box dimensions', 'orthogonalization need', 'type mapping'],
    })
  }

  if (args.polycrystal || /polycrystal|多晶|grain|晶粒/.test(combined)) {
    candidates.push({
      route: 'atomsk-polycrystal',
      score: 0.92,
      why: 'Polycrystal-style modeling is a direct Atomsk strength.',
      required_skill: 'lammps-atomsk-modeling',
      validation_focus: ['box size', 'grain count', 'orientation source', 'wrap and boundary sanity'],
    })
  }

  if (/vacancy|interstitial|surface|interface|缺陷|位错|层错|表面|界面/.test(combined)) {
    candidates.push({
      route: 'atomsk-structure-edit',
      score: 0.88,
      why: 'Defect/interface-style geometry editing fits Atomsk or controlled manual structure editing.',
      required_skill: 'lammps-atomsk-modeling',
      validation_focus: ['defect region', 'atom overlap', 'boundary consistency', 'type mapping'],
    })
  }

  if (/bcc|fcc|hcp|diamond|perovskite|rocksalt|晶格|取向|超胞|duplicate/.test(combined)) {
    candidates.push({
      route: 'atomsk-crystal-build',
      score: 0.84,
      why: 'Crystalline lattice/supercell/orientation tasks map cleanly to Atomsk templates.',
      required_skill: 'lammps-atomsk-modeling',
      validation_focus: ['lattice parameters', 'orientation', 'supercell size', 'LAMMPS alignment'],
    })
  }

  candidates.push({
    route: 'case-first-manual-fallback',
    score: 0.4,
    why: 'No strong Atomsk trigger found, so the safer default is case reuse first and manual build only if local structure sources are insufficient.',
    required_skill: null,
    validation_focus: ['case family match', 'structure provenance', 'read_data compatibility', 'boundary assumptions'],
  })

  candidates.sort((a, b) => b.score - a.score)
  return candidates
}

function findCandidateCases(family: string | null, material: string | null) {
  const materialLower = (material ?? '').toLowerCase()
  return HIGH_VALUE_CASES.filter(entry => {
    if (family && entry.family === family) return true
    return entry.materialHints.some(hint => materialLower.includes(hint))
  }).map(entry => ({
    path: entry.structure,
    notes: entry.notes,
  }))
}

function buildAtomskPlan(primaryRoute: string, args: Args) {
  if (!primaryRoute.startsWith('atomsk')) return null
  if (primaryRoute === 'atomsk-cif-conversion') {
    return {
      template: '.angsheng/templates/atomsk/cif_to_lammps.sh',
      required_inputs: [args.cif ?? 'input.cif'],
      expected_outputs: ['output.lmp'],
      notes: ['Check chemical formula, box size, orthogonalization, and type mapping after conversion.'],
    }
  }
  if (primaryRoute === 'atomsk-polycrystal') {
    return {
      template: '.angsheng/templates/atomsk/polycrystal_basic.sh',
      required_inputs: ['seed.xsf or lattice specification', 'polycrystal parameter file'],
      expected_outputs: ['polycrystal.cfg', 'polycrystal.lmp'],
      notes: ['Validate grain count, box size, and wrap behavior.'],
    }
  }
  return {
    template: '.angsheng/templates/atomsk/create_basic_fcc.sh',
    required_inputs: ['lattice parameters', 'element ordering'],
    expected_outputs: ['output.lmp'],
    notes: ['Validate alignx/unskew and explicit type ordering before WF-02.'],
  }
}

export async function main() {
  const args = parseArgs(process.argv.slice(2))
  const family = args.family ?? inferFamily([args.prompt, args.material, args.potential].filter(Boolean).join(' '))
  const candidates = collectCandidates({ ...args, family: args.family ?? family ?? undefined })
  const primary = candidates[0]
  const packet = {
    stage: 'WF-01',
    family: family ?? null,
    material_system: args.material ?? null,
    potential_family: args.potential ?? null,
    crystal_class: args.prompt?.toLowerCase().includes('bcc')
      ? 'bcc'
      : args.prompt?.toLowerCase().includes('fcc')
        ? 'fcc'
        : args.prompt?.toLowerCase().includes('hcp')
          ? 'hcp'
          : null,
    composition: null,
    primary_route: primary.route,
    alternatives: candidates.slice(1, 3).map(candidate => ({ route: candidate.route, why: candidate.why })),
    confidence: primary.score >= 0.9 ? 'high' : primary.score >= 0.7 ? 'medium' : 'low',
    missing_inputs: primary.route === 'atomsk-cif-conversion' && !args.cif ? ['cif file path'] : [],
    hard_checks: buildChecklist(primary.route),
    candidate_case_paths: findCandidateCases(family, args.material ?? null),
    structure_route: primary.route,
    structure_provenance:
      primary.route === 'case-reuse-structure'
        ? args.source ?? 'local case path required'
        : primary.route.startsWith('atomsk')
          ? 'generated via Atomsk workflow'
          : 'manual structure preparation required',
    route_constraints: primary.validation_focus,
    allowed_generation_modes: primary.route.startsWith('atomsk')
      ? ['atomsk', 'manual-fallback']
      : ['case-reuse', 'manual-fallback'],
    required_validation: primary.validation_focus,
    locked_assumptions: [
      'WF-01 must preserve explicit structure provenance before WF-02',
      'Element/type mapping must be explicit before potential setup',
    ],
    handoff_to_wf02: {
      required_artifacts: ['primary_structure_file', 'structure.manifest.json', 'structure-validation.json'],
      notes: 'WF-02 should not start until structure provenance and validation are recorded.',
    },
    atomsk_plan: buildAtomskPlan(primary.route, args),
    next_step:
      primary.required_skill === 'lammps-atomsk-modeling'
        ? 'Use the Atomsk modeling skill or render an Atomsk task packet, then validate the generated structure before entering WF-02.'
        : 'Search local cases for a reusable structure first; only fall back to manual structure creation if no suitable case exists.',
  }

  const projectDir = resolve(process.cwd(), '.lammps-project')
  await mkdir(projectDir, { recursive: true })
  const outputPath = args.output
    ? resolve(process.cwd(), args.output)
    : resolve(projectDir, 'wf01.packet.json')
  await writeFile(outputPath, JSON.stringify(packet, null, 2), 'utf8')
  process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`)
}

if (import.meta.main) {
  await main()
}

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
  type ListToolsResult,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { jsonStringify } from '../slowOperations.js'
import { LAMMPS_KNOWLEDGE_MCP_SERVER_NAME, getWorkspaceRoot } from './common.js'
import {
  buildKnowledgeIndex,
  getKnowledgeIndexStatus,
  updateKnowledgeIndexIncrementally,
} from './indexer.js'
import { searchKnowledge } from './search.js'
import { pullFromRemote, pushToRemote, getSyncStatus } from './syncService.js'
import {
  buildRemoteKnowledgeIndex,
  updateRemoteKnowledgeIndexIncrementally,
  getRemoteIndexStatus,
} from './remoteIndexer.js'
import { listVersions, restoreVersion } from './backupManager.js'
import { isRemoteConfigured, getRemoteDir } from './remoteCommon.js'
import { getLayeredIndexStatus, buildLayeredIndex } from './layeredIndexer.js'
import {
  findCases,
  getEntity,
  getLinked,
  verifyScript,
} from './layeredSearch.js'

const TOOLS: Tool[] = [
  {
    name: 'search_lammps_knowledge',
    description:
      'Search the local LAMMPS SQLite knowledge index for cases, summaries, and experience notes.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query.' },
        topK: { type: 'integer', minimum: 1, maximum: 20 },
        family: { type: 'string' },
        materialSystem: { type: 'string' },
        potentialFamily: { type: 'string' },
        stage: { type: 'string' },
        fileType: { type: 'string' },
        sourceTypes: { type: 'array', items: { type: 'string' } },
        autoIndex: { type: 'boolean' },
        includeRemote: {
          type: 'boolean',
          description: 'Also search remote knowledge index.',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'index_lammps_knowledge',
    description:
      'Apply an incremental update to the local SQLite FTS knowledge database.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mode: { type: 'string', enum: ['incremental', 'full'] },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'reindex_lammps_knowledge',
    description:
      'Force a full rebuild of the local SQLite FTS knowledge database.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'get_lammps_knowledge_status',
    description:
      'Inspect whether the local LAMMPS SQLite knowledge index exists and how large it is.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'sync_knowledge_pull',
    description:
      'Pull latest knowledge base from remote server to local .knowledge-remote/ directory.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'sync_knowledge_push',
    description:
      'Push local knowledge base changes to remote server, creating an incremental backup.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'sync_knowledge_status',
    description:
      'Show sync status: local/remote version, file counts, pending changes.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'sync_knowledge_backup',
    description: 'List backup versions or restore to a specific version.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'restore'],
          description: 'List versions or restore to a specific version.',
        },
        version: {
          type: 'integer',
          description: 'Version number to restore (only for restore action).',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'index_remote_knowledge',
    description:
      'Build or update the remote knowledge index (SQLite FTS for .knowledge-remote/).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mode: { type: 'string', enum: ['incremental', 'full'] },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'find_cases',
    description:
      'Search the LAMMPS case library by structured filters (family, material, potential, subType). ' +
      'Returns matching input script files with full content. Use this BEFORE writing any LAMMPS input script ' +
      'to find working reference cases. Supports Chinese aliases (拉伸→mechanical-loading, 铜→Cu, 剪切→shear).',

    inputSchema: {
      type: 'object' as const,
      properties: {
        intent: {
          type: 'string',
          enum: ['write_input', 'setup_model', 'fix_error', 'analyze'],
          description:
            'Agent intent. write_input = search for reference scripts to adapt.',
        },
        family: {
          type: 'string',
          description:
            'Case family: mechanical-loading, melt-solidify, reactive-and-deposition, machining, etc.',
        },
        subType: {
          type: 'string',
          description:
            'Simulation sub-type: tensile, compress, shear, melt, solidify, deposition, shock, etc.',
        },
        material: {
          type: 'string',
          description:
            'Material system: Cu, Al, Fe, CoCrFeMnNi, TiAl, NiTi, etc.',
        },
        potential: {
          type: 'string',
          description:
            'Potential type: eam, eam/alloy, eam/fs, meam, tersoff, reaxff, lj, etc.',
        },
        query: {
          type: 'string',
          description:
            'Free-text search (FTS fallback). Use only when filter labels are insufficient.',
        },
        topK: { type: 'integer', minimum: 1, maximum: 20 },
        includeContent: {
          type: 'boolean',
          description: 'Include full input file content (default true).',
        },
        maxLines: {
          type: 'integer',
          description: 'Max lines per file content (default 200).',
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'get_entity',
    description:
      'Get full details of a LAMMPS knowledge entity by ID. Returns content, metadata, linked files, and related entities.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: {
          type: 'string',
          description: 'Entity ID (e.g. "case/knowledge/cases/raw/__/NPT").',
        },
        includeContent: { type: 'boolean' },
        maxLines: { type: 'integer' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_linked',
    description:
      'Get entities linked to/from a specific entity. Navigate the knowledge graph: case → checks, check → cases.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Entity ID to get links for.' },
        relType: {
          type: 'string',
          description: 'Relationship type: has_check, applies_to.',
        },
        direction: {
          type: 'string',
          enum: ['outgoing', 'incoming'],
          description: 'Link direction (default outgoing).',
        },
        topK: { type: 'integer', minimum: 1, maximum: 50 },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'verify_script',
    description:
      'Verify LAMMPS script against mandatory checks (CL-001~CL-019). ' +
      'Provide script content or commands list to get triggered checks and pass/fail status. ' +
      'Use this AFTER writing a LAMMPS input script to validate correctness.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        commands: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of LAMMPS commands used in the script.',
        },
        scriptContent: {
          type: 'string',
          description: 'Full script content for trigger matching.',
        },
        scope: {
          type: 'string',
          enum: ['full', 'deformation', 'potential', 'minimization', 'npt'],
          description: 'Validation scope (default full).',
        },
        maxResults: { type: 'integer', minimum: 1, maximum: 50 },
      },
      additionalProperties: false,
    },
  },
]

export async function runLammpsKnowledgeMcpServer(): Promise<void> {
  const workspaceRoot = getWorkspaceRoot()
  const server = new Server(
    {
      name: LAMMPS_KNOWLEDGE_MCP_SERVER_NAME,
      version: MACRO.VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    },
  )

  server.setRequestHandler(
    ListToolsRequestSchema,
    async (): Promise<ListToolsResult> => ({ tools: [...TOOLS] }),
  )

  server.setRequestHandler(
    CallToolRequestSchema,
    async ({ params: { name, arguments: args } }): Promise<CallToolResult> => {
      try {
        if (name === 'search_lammps_knowledge') {
          const payload = (args ?? {}) as Record<string, unknown>
          return asText(
            await searchKnowledge({
              query: String(payload.query ?? ''),
              topK: typeof payload.topK === 'number' ? payload.topK : undefined,
              family:
                typeof payload.family === 'string' ? payload.family : undefined,
              materialSystem:
                typeof payload.materialSystem === 'string'
                  ? payload.materialSystem
                  : undefined,
              potentialFamily:
                typeof payload.potentialFamily === 'string'
                  ? payload.potentialFamily
                  : undefined,
              stage:
                typeof payload.stage === 'string' ? payload.stage : undefined,
              fileType:
                typeof payload.fileType === 'string'
                  ? payload.fileType
                  : undefined,
              sourceTypes: Array.isArray(payload.sourceTypes)
                ? payload.sourceTypes.filter(
                    (item): item is string => typeof item === 'string',
                  )
                : undefined,
              autoIndex:
                typeof payload.autoIndex === 'boolean'
                  ? payload.autoIndex
                  : undefined,
              includeRemote:
                typeof payload.includeRemote === 'boolean'
                  ? payload.includeRemote
                  : undefined,
            }),
          )
        }

        if (name === 'index_lammps_knowledge') {
          const payload = (args ?? {}) as Record<string, unknown>
          const mode = payload.mode === 'full' ? 'full' : 'incremental'
          return asText(
            mode === 'full'
              ? await buildKnowledgeIndex({ workspaceRoot })
              : await updateKnowledgeIndexIncrementally({ workspaceRoot }),
          )
        }

        if (name === 'reindex_lammps_knowledge') {
          return asText(await buildKnowledgeIndex({ workspaceRoot }))
        }

        if (name === 'get_lammps_knowledge_status') {
          return asText(getKnowledgeIndexStatus(workspaceRoot))
        }

        if (name === 'sync_knowledge_pull') {
          if (!isRemoteConfigured()) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: 'Remote not configured. Set LAMMPS_KNOWLEDGE_REMOTE_URL and LAMMPS_KNOWLEDGE_REMOTE_TOKEN.',
                },
              ],
            }
          }
          return asText(await pullFromRemote(workspaceRoot))
        }

        if (name === 'sync_knowledge_push') {
          if (!isRemoteConfigured()) {
            return {
              isError: true,
              content: [
                {
                  type: 'text',
                  text: 'Remote not configured. Set LAMMPS_KNOWLEDGE_REMOTE_URL and LAMMPS_KNOWLEDGE_REMOTE_TOKEN.',
                },
              ],
            }
          }
          return asText(await pushToRemote(workspaceRoot))
        }

        if (name === 'sync_knowledge_status') {
          return asText(await getSyncStatus(workspaceRoot))
        }

        if (name === 'sync_knowledge_backup') {
          const payload = (args ?? {}) as Record<string, unknown>
          const action = payload.action === 'restore' ? 'restore' : 'list'
          if (action === 'restore') {
            const version =
              typeof payload.version === 'number' ? payload.version : 0
            if (version <= 0) {
              return {
                isError: true,
                content: [
                  {
                    type: 'text',
                    text: 'version is required for restore action.',
                  },
                ],
              }
            }
            const remoteDir = getRemoteDir(workspaceRoot)
            const result = await restoreVersion(
              version,
              remoteDir,
              workspaceRoot,
            )
            return asText(result)
          }
          return asText(await listVersions(workspaceRoot))
        }

        if (name === 'index_remote_knowledge') {
          const payload = (args ?? {}) as Record<string, unknown>
          const mode = payload.mode === 'full' ? 'full' : 'incremental'
          return asText(
            mode === 'full'
              ? await buildRemoteKnowledgeIndex({ workspaceRoot })
              : await updateRemoteKnowledgeIndexIncrementally({
                  workspaceRoot,
                }),
          )
        }

        if (name === 'find_cases') {
          const payload = (args ?? {}) as Record<string, unknown>
          return asText(
            findCases({
              intent:
                typeof payload.intent === 'string'
                  ? (payload.intent as 'write_input')
                  : undefined,
              family:
                typeof payload.family === 'string' ? payload.family : undefined,
              subType:
                typeof payload.subType === 'string'
                  ? payload.subType
                  : undefined,
              material:
                typeof payload.material === 'string'
                  ? payload.material
                  : undefined,
              potential:
                typeof payload.potential === 'string'
                  ? payload.potential
                  : undefined,
              query:
                typeof payload.query === 'string' ? payload.query : undefined,
              topK: typeof payload.topK === 'number' ? payload.topK : undefined,
              includeContent:
                typeof payload.includeContent === 'boolean'
                  ? payload.includeContent
                  : undefined,
              maxLines:
                typeof payload.maxLines === 'number'
                  ? payload.maxLines
                  : undefined,
            }),
          )
        }

        if (name === 'get_entity') {
          const payload = (args ?? {}) as Record<string, unknown>
          const result = getEntity({
            id: String(payload.id ?? ''),
            includeContent:
              typeof payload.includeContent === 'boolean'
                ? payload.includeContent
                : undefined,
            maxLines:
              typeof payload.maxLines === 'number'
                ? payload.maxLines
                : undefined,
          })
          if (!result) {
            return {
              isError: true,
              content: [
                { type: 'text', text: `Entity not found: ${payload.id}` },
              ],
            }
          }
          return asText(result)
        }

        if (name === 'get_linked') {
          const payload = (args ?? {}) as Record<string, unknown>
          return asText(
            getLinked({
              id: String(payload.id ?? ''),
              relType:
                typeof payload.relType === 'string'
                  ? payload.relType
                  : undefined,
              direction:
                typeof payload.direction === 'string'
                  ? (payload.direction as 'outgoing' | 'incoming')
                  : undefined,
              topK: typeof payload.topK === 'number' ? payload.topK : undefined,
            }),
          )
        }

        if (name === 'verify_script') {
          const payload = (args ?? {}) as Record<string, unknown>
          return asText(
            verifyScript({
              commands: Array.isArray(payload.commands)
                ? payload.commands.filter(
                    (c): c is string => typeof c === 'string',
                  )
                : undefined,
              scriptContent:
                typeof payload.scriptContent === 'string'
                  ? payload.scriptContent
                  : undefined,
              scope:
                typeof payload.scope === 'string'
                  ? (payload.scope as 'full' | 'deformation' | 'potential')
                  : undefined,
              maxResults:
                typeof payload.maxResults === 'number'
                  ? payload.maxResults
                  : undefined,
            }),
          )
        }

        throw new Error(`Unknown tool: ${name}`)
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: error instanceof Error ? error.message : String(error),
            },
          ],
        }
      }
    },
  )

  const transport = new StdioServerTransport()
  process.stdin.on('end', () => process.exit(0))
  process.stdin.on('error', () => process.exit(0))
  await server.connect(transport)
}

function asText(value: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: jsonStringify(value),
      },
    ],
  }
}

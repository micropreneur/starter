import { env as cloudflareEnv } from 'cloudflare:workers'
import { FeatureNotAvailableError } from '@micropreneur/billing'
import { createDb } from '@micropreneur/db'
import { listOperationRecords } from '@micropreneur/operations'
import { requireActiveWorkspace } from '@micropreneur/workspaces'
import { createFileRoute } from '@tanstack/react-router'

import type { WebEnv } from '../../../env'
import { getAuth } from '../../../lib/auth.server'
import { getBilling } from '../../../lib/billing.server'
import { csvCell } from '../../../lib/csv'

export const Route = createFileRoute('/api/registry/export')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const user = await getAuth().requireUser(new Headers(request.headers))
        try {
          await getBilling().requireFeature(user.id, 'registry.export')
        } catch (error) {
          if (error instanceof FeatureNotAvailableError) {
            return new Response('A paid plan is required to export registry records.', {
              status: 402,
            })
          }
          throw error
        }
        const database = createDb((cloudflareEnv as unknown as WebEnv).DB)
        const workspace = await requireActiveWorkspace(database, user.id)
        const rows = []
        let page = 1
        while (true) {
          const result = await listOperationRecords(database, workspace.id, {
            page,
            pageSize: 50,
            search: '',
            sort: 'title_asc',
          })
          rows.push(...result.items)
          if (rows.length >= result.total) break
          page += 1
        }

        const csv = [
          ['Title', 'Summary', 'Status', 'Priority', 'Review date', 'Tags'],
          ...rows.map((row) => [
            row.title,
            row.summary,
            row.status,
            row.priority,
            row.reviewAt ?? '',
            row.tags.join('|'),
          ]),
        ]
          .map((row) => row.map(csvCell).join(','))
          .join('\n')
        return new Response(csv, {
          headers: {
            'content-disposition': 'attachment; filename="operations-registry.csv"',
            'content-type': 'text/csv; charset=utf-8',
          },
        })
      },
    },
  },
})

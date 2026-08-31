import { createFileRoute } from '@tanstack/react-router'

import { handleFileDelete, handleFileGet } from '../../../lib/files.handlers'

export const Route = createFileRoute('/api/files/avatar')({
  server: {
    handlers: {
      DELETE: ({ request }) => handleFileDelete(request, 'avatar'),
      GET: ({ request }) => handleFileGet(request, 'avatar'),
    },
  },
})
